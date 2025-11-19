import { Box, Paper } from '@mui/material';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
import { useMarkdownStore } from '../../../infrastructure/store/useMarkdownStore';
import { getMarkedInstance } from '../../../utils/markedInstance';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

const marked = getMarkedInstance();

export interface PreviewHandle { }

const PreviewComponent = forwardRef<PreviewHandle>((_, ref) => {
  const { content, openMermaidModal, showPreview, showEditor, darkMode } = useMarkdownStore();
  const [html, setHtml] = useState('');
  const [mermaidBlocks, setMermaidBlocks] = useState<{ code: string; id: string; cacheKey: string }[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const latestSvgCache = useRef(new Map<string, string>());
  const renderTimeoutRef = useRef<number>();
  const lastHtmlRef = useRef<string>('');

  // Update HTML manually to preserve mermaid SVGs
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container || html === lastHtmlRef.current) return;

    // Save current mermaid SVGs before updating HTML
    const savedMermaidContent = new Map<string, string>();
    mermaidBlocks.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el && el.querySelector('svg')) {
        savedMermaidContent.set(id, el.innerHTML);
      }
    });

    // Update HTML
    container.innerHTML = html;
    lastHtmlRef.current = html;

    // Restore saved mermaid SVGs
    savedMermaidContent.forEach((content, id) => {
      const el = document.getElementById(id);
      if (el && el.getAttribute('data-loading') === 'true') {
        el.innerHTML = content;
        el.removeAttribute('data-loading');
      }
    });
  }, [html, mermaidBlocks]);



  // Initialize mermaid with theme based on dark mode
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: darkMode ? 'dark' : 'default',
      securityLevel: 'loose',
    });
    // Clear SVG cache when theme changes to force re-render
    latestSvgCache.current.clear();

    // Force re-render all mermaid diagrams with new theme
    mermaidBlocks.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el && el.querySelector('svg')) {
        // Mark as loading to trigger re-render
        el.setAttribute('data-loading', 'true');
      }
    });
  }, [darkMode, mermaidBlocks]);

  // Process markdown to HTML
  useEffect(() => {
    const processMarkdown = async () => {
      let processedContent = content;

      // Insert a blank line before $$ blocks so marked-katex treats them as display math
      processedContent = processedContent.replace(/([^\n])\n[ \t]*\$\$\n/g, '$1\n\n$$$$\n');

      // Extract mermaid blocks and replace with placeholders (stable IDs to keep cached SVGs)
      const hash = (str: string) =>
        Math.abs(
          str.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
        ).toString(36);
      const counts: Record<string, number> = {};
      const blocks: { code: string; id: string; cacheKey: string }[] = [];
      processedContent = processedContent.replace(/```mermaid\n([\s\S]*?)```/g, (_, code) => {
        const cleanCode = code.trim();
        const baseKey = hash(cleanCode);
        const idx = counts[baseKey] ?? 0;
        counts[baseKey] = idx + 1;
        const id = `mermaid-${baseKey}-${idx}`;
        const cacheKey = `${baseKey}`;
        blocks.push({ code: cleanCode, id, cacheKey });
        return `<div class="mermaid-container" id="${id}" data-loading="true"><div style="padding: 2rem; color: #666; text-align: center;">Loading diagram...</div></div>`;
      });

      setMermaidBlocks(blocks);

      // Parse markdown to HTML
      const rawHtml = await marked.parse(processedContent);

      // Use DOMPurify hook to modify links during sanitization
      DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        if (node.tagName === 'A') {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      });

      // Sanitize HTML with KaTeX tags allowed
      const sanitized = DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['annotation', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'mtext', 'mspace', 'mfrac', 'msup', 'msub', 'msqrt', 'mroot', 'math'],
        ADD_ATTR: ['data-loading'],
      });

      // Remove hook after use
      DOMPurify.removeAllHooks();

      setHtml(sanitized);
    };

    processMarkdown();
  }, [content]);

  const renderSingleMermaid = useCallback(
    async (block: { code: string; id: string; cacheKey: string }, renderIdSeed: string = 'render') => {
      const { code, id, cacheKey } = block;
      const el = document.getElementById(id);
      if (!el) return;

      // Use cache first to restore diagrams after DOM recreation
      const cached = latestSvgCache.current.get(cacheKey);
      if (cached) {
        // Always restore from cache if available, even if element has SVG
        // This fixes diagrams disappearing when modal opens/closes
        el.innerHTML = cached;
        el.style.cursor = 'zoom-in';
        el.onclick = () => openMermaidModal(cached, code);
        el.removeAttribute('data-loading');
        return;
      }

      // Check if already rendered and not loading placeholder
      const hasLoading = el.getAttribute('data-loading') === 'true';
      if (el.querySelector('svg') && !hasLoading) return;

      try {
        const renderId = `${renderIdSeed}-${id}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, code);
        const svgMarkup = svg || el.innerHTML;
        latestSvgCache.current.set(cacheKey, svgMarkup);
        el.innerHTML = svgMarkup;
        el.style.cursor = 'zoom-in';
        el.onclick = () => openMermaidModal(svgMarkup, code);
        el.removeAttribute('data-loading');
      } catch (error) {
        console.error('Mermaid render error:', error);
        el.innerHTML = `<div style="color: red; padding: 1rem; border: 1px solid red; border-radius: 4px;">Failed to render Mermaid diagram</div>`;
      }
    },
    [openMermaidModal]
  );

  const renderMermaid = useCallback(
    async (renderIdSeed: string = 'render') => {
      if (!html || mermaidBlocks.length === 0 || !showPreview) return;

      // Wait for DOM to be ready (increased from 50ms to 100ms for better reliability)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Track pending renders to prevent premature cleanup
      let pendingRenders = 0;
      let observerDisconnected = false;

      // Render only visible diagrams using Intersection Observer
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !observerDisconnected) {
              const id = entry.target.id;
              const block = mermaidBlocks.find((b) => b.id === id);
              if (block) {
                pendingRenders++;
                renderSingleMermaid(block, renderIdSeed).finally(() => {
                  pendingRenders--;
                });
                observer.unobserve(entry.target);
              }
            }
          });
        },
        {
          root: previewRef.current,
          rootMargin: '200px', // Increased margin to trigger loading earlier
          threshold: 0,
        }
      );

      // Observe containers that need rendering (have loading attribute or missing SVG)
      mermaidBlocks.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el && (el.getAttribute('data-loading') === 'true' || !el.querySelector('svg'))) {
          observer.observe(el);
        }
      });

      // Cleanup - wait for pending renders before disconnecting
      return () => {
        observerDisconnected = true;
        // Give pending renders a chance to complete before disconnecting
        setTimeout(() => {
          observer.disconnect();
        }, 100);
      };
    },
    [html, mermaidBlocks, showPreview, renderSingleMermaid]
  );

  // Render when inputs change (debounced to avoid transient errors during edits)
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    let cleanup: (() => void) | undefined;
    renderTimeoutRef.current = window.setTimeout(async () => {
      cleanup = await renderMermaid();
    }, 500);
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      if (cleanup) {
        cleanup();
      }
    };
  }, [renderMermaid, showEditor, darkMode, html, mermaidBlocks]);

  useImperativeHandle(
    ref,
    () => ({}),
    []
  );

  return (
    <Paper
      ref={previewRef}
      elevation={0}
      sx={{
        height: '100%',
        overflow: 'auto',
        p: 3,
        color: 'text.primary',
        lineHeight: 1.6,
        fontSize: '1rem',
        display: 'flex',
        justifyContent: 'center',
        '& > #preview-container': {
          width: '100%',
          maxWidth: '1000px',
          mx: 'auto',
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          mt: 2,
          mb: 1,
        },
        '& p': {
          my: 1,
        },
        '& a': {
          color: 'primary.main',
          textDecoration: 'underline',
          fontWeight: 600,
        },
        '& ul, & ol': {
          my: 1,
          pl: 3,
        },
        '& li': {
          my: 0.25,
        },
        '& img': {
          maxWidth: '100%',
          borderRadius: 1,
        },
        '& code': {
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
          color: (theme) => (theme.palette.mode === 'dark' ? '#f8fafc' : '#111827'),
          px: 0.6,
          py: 0.25,
          borderRadius: 0.6,
          fontFamily: 'monospace',
          fontSize: '0.92em',
          border: 'none',
          boxShadow: 'none',
        },
        '& pre': {
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)'),
          p: 2,
          borderRadius: 1,
          overflow: 'auto',
          border: 'none',
          boxShadow: 'none',
          fontSize: '0.94em',
          '& code': {
            bgcolor: 'transparent',
            p: 0,
          },
        },
        '& blockquote': {
          borderLeft: '4px solid',
          borderColor: 'divider',
          pl: 2,
          ml: 0,
          fontStyle: 'italic',
        },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          my: 2,
        },
        '& th, & td': {
          border: '1px solid',
          borderColor: 'divider',
          p: 1,
        },
        '& th': {
          bgcolor: 'action.hover',
        },
        '& .mermaid-container': {
          p: 2,
          my: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          textAlign: 'center',
          touchAction: 'pinch-zoom',
          '&:hover': {
            opacity: 0.8,
          },
          transition: 'opacity 0.2s',
        },
        // KaTeX styles
        '& .katex': {
          fontSize: '1.1em',
        },
        '& .katex-display': {
          overflow: 'auto',
          my: 1,
        },
      }}
    >
      <Box id="preview-container" ref={previewContainerRef} />
    </Paper>
  );
});

// Wrap in React.memo to prevent unnecessary re-renders when parent re-renders
// This prevents Mermaid diagrams from reloading when unrelated UI changes occur (e.g., opening menus)
const Preview = React.memo(PreviewComponent);
export default Preview;
