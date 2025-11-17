import { Box, Paper } from '@mui/material';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
import { useMarkdownStore } from '../../../infrastructure/store/useMarkdownStore';
import { getMarkedInstance } from '../../../utils/markedInstance';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

const marked = getMarkedInstance();

export interface PreviewHandle {
  scrollToRatio: (ratio: number) => void;
}

interface Props {
  onScrollRatioChange?: (ratio: number) => void;
}

const Preview = forwardRef<PreviewHandle, Props>(({ onScrollRatioChange }, ref) => {
  const { content, openMermaidModal, showPreview, showEditor, mermaidModal, darkMode } = useMarkdownStore();
  const [html, setHtml] = useState('');
  const [mermaidBlocks, setMermaidBlocks] = useState<{ code: string; id: string; cacheKey: string }[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const onScrollHandlerRef = useRef<((ratio: number) => void) | undefined>(onScrollRatioChange);
  const isSyncingRef = useRef(false);
  const latestSvgCache = useRef(new Map<string, string>());
  const renderTimeoutRef = useRef<number>();

  useEffect(() => {
    onScrollHandlerRef.current = onScrollRatioChange;
  }, [onScrollRatioChange]);

  // Initialize mermaid with theme based on dark mode
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: darkMode ? 'dark' : 'default',
      securityLevel: 'loose',
    });
    // Clear SVG cache when theme changes to force re-render
    latestSvgCache.current.clear();
  }, [darkMode]);

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

      // Check if already rendered and not loading placeholder
      const hasLoading = el.getAttribute('data-loading') === 'true';
      if (el.querySelector('svg') && !hasLoading) return;

      // Remove loading indicator
      el.removeAttribute('data-loading');

      const cached = latestSvgCache.current.get(cacheKey);
      if (cached) {
        el.innerHTML = cached;
        el.style.cursor = 'zoom-in';
        el.onclick = () => openMermaidModal(el.innerHTML || cached, code);
        return;
      }

      try {
        const renderId = `${renderIdSeed}-${id}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, code);
        const svgMarkup = svg || el.innerHTML;
        latestSvgCache.current.set(cacheKey, svgMarkup);
        el.innerHTML = svgMarkup;
        el.style.cursor = 'zoom-in';
        el.onclick = () => openMermaidModal(el.innerHTML || svgMarkup, code);
      } catch (error) {
        console.error('Mermaid render error:', error);
        const cachedSvg = latestSvgCache.current.get(cacheKey);
        if (cachedSvg) {
          el.innerHTML = cachedSvg;
          el.onclick = () => openMermaidModal(el.innerHTML || cachedSvg, code);
        } else {
          el.innerHTML = `<div style="color: red; padding: 1rem; border: 1px solid red; border-radius: 4px;">Failed to render Mermaid diagram</div>`;
        }
      }
    },
    [openMermaidModal]
  );

  const renderMermaid = useCallback(
    async (renderIdSeed: string = 'render') => {
      if (!html || mermaidBlocks.length === 0 || !showPreview) return;

      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 50));

      // Render only visible diagrams using Intersection Observer
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.id;
              const block = mermaidBlocks.find((b) => b.id === id);
              if (block) {
                renderSingleMermaid(block, renderIdSeed);
                observer.unobserve(entry.target);
              }
            }
          });
        },
        {
          root: previewRef.current,
          rootMargin: '100px', // Reduced margin for better performance
          threshold: 0,
        }
      );

      // Observe only containers that need rendering (have loading attribute)
      mermaidBlocks.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el && el.getAttribute('data-loading') === 'true') {
          observer.observe(el);
        }
      });

      // Cleanup
      return () => observer.disconnect();
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
  }, [renderMermaid, showEditor, mermaidModal, darkMode, html, mermaidBlocks]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToRatio: (ratio: number) => {
        const scroller = previewRef.current;
        if (!scroller) return;
        isSyncingRef.current = true;
        const maxScroll = scroller.scrollHeight - scroller.clientHeight;
        scroller.scrollTop = ratio * maxScroll;
        requestAnimationFrame(() => {
          isSyncingRef.current = false;
        });
      },
    }),
    []
  );

  return (
    <Paper
      ref={previewRef}
      elevation={0}
      onScroll={() => {
        const scroller = previewRef.current;
        if (!scroller || !onScrollHandlerRef.current || isSyncingRef.current) return;
        isSyncingRef.current = true;
        const maxScroll = scroller.scrollHeight - scroller.clientHeight;
        const ratio = maxScroll > 0 ? scroller.scrollTop / maxScroll : 0;
        onScrollHandlerRef.current(ratio);
        requestAnimationFrame(() => {
          isSyncingRef.current = false;
        });
      }}
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
      <Box id="preview-container" dangerouslySetInnerHTML={{ __html: html }} />
    </Paper>
  );
});
export default Preview;
