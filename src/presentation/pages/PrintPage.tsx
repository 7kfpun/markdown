import { Box, Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
import { decompressFromBase64 } from '../../utils/compression';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';

// Initialize mermaid with light theme for printing
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  themeVariables: {
    primaryColor: '#fff',
    primaryTextColor: '#000',
    primaryBorderColor: '#000',
    lineColor: '#000',
    secondaryColor: '#f4f4f4',
    tertiaryColor: '#fff',
  },
});

// Configure marked with KaTeX extension and syntax highlighting
marked.use(markedKatex({ throwOnError: false, output: 'html' as const }));
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);
marked.setOptions({ gfm: true, breaks: true });

export default function PrintPage() {
  const [html, setHtml] = useState('');
  const [mermaidBlocks, setMermaidBlocks] = useState<{ code: string; id: string }[]>([]);

  useEffect(() => {
    // Extract content from hash
    const hash = window.location.hash;
    if (hash.startsWith('#paxo:')) {
      try {
        const compressed = hash.substring(6);
        const content = decompressFromBase64(compressed);
        processMarkdown(content);
      } catch (error) {
        console.error('Failed to extract content from URL:', error);
      }
    }
  }, []);

  const processMarkdown = async (content: string) => {
    let processedContent = content;

    // Insert blank line before $$ blocks
    processedContent = processedContent.replace(/([^\n])\n[ \t]*\$\$\n/g, '$1\n\n$$$$\n');

    // Extract mermaid blocks
    const hash = (str: string) =>
      Math.abs(
        str.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
      ).toString(36);
    const counts: Record<string, number> = {};
    const blocks: { code: string; id: string }[] = [];

    processedContent = processedContent.replace(/```mermaid\n([\s\S]*?)```/g, (_, code) => {
      const cleanCode = code.trim();
      const baseKey = hash(cleanCode);
      const idx = counts[baseKey] ?? 0;
      counts[baseKey] = idx + 1;
      const id = `mermaid-${baseKey}-${idx}`;
      blocks.push({ code: cleanCode, id });
      return `<div class="mermaid-container" id="${id}"></div>`;
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
    });

    // Remove hook after use
    DOMPurify.removeAllHooks();

    setHtml(sanitized);
  };

  // Render all mermaid diagrams, then trigger print
  useEffect(() => {
    if (!html || mermaidBlocks.length === 0) {
      if (html) {
        // No mermaid diagrams, trigger print immediately
        setTimeout(() => window.print(), 500);
      }
      return;
    }

    const renderAllMermaid = async () => {
      for (const { code, id } of mermaidBlocks) {
        const el = document.getElementById(id);
        if (el) {
          try {
            const renderId = `print-${id}-${Date.now()}`;
            const { svg } = await mermaid.render(renderId, code);
            el.innerHTML = svg;
          } catch (error) {
            console.error('Mermaid render error:', error);
            el.innerHTML = `<div style="color: red; padding: 1rem; border: 1px solid red;">Failed to render diagram</div>`;
          }
        }
      }
      // All diagrams rendered, trigger print
      setTimeout(() => window.print(), 500);
    };

    renderAllMermaid();
  }, [html, mermaidBlocks]);

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm 15mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
        @media screen {
          body {
            background: #f5f5f5;
          }
        }
      `}</style>
      <Paper
        elevation={0}
        sx={{
          maxWidth: '210mm',
          margin: '20mm auto',
          p: '20mm 15mm',
          minHeight: '297mm',
          bgcolor: '#ffffff',
          color: '#000000',
          boxSizing: 'border-box',
          '@media print': {
            boxShadow: 'none',
            p: 0,
            m: 0,
            maxWidth: '100%',
            minHeight: 'auto',
          },
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            mt: 2,
            mb: 1,
            color: '#000000',
            pageBreakAfter: 'avoid',
          },
          '& p': {
            my: 1,
            color: '#000000',
          },
          '& a': {
            color: '#0066cc',
            textDecoration: 'underline',
          },
          '& ul, & ol': {
            my: 1,
            pl: 3,
            color: '#000000',
          },
          '& img': {
            maxWidth: '100%',
            pageBreakInside: 'avoid',
          },
          '& code': {
            bgcolor: '#f5f5f5',
            color: '#000000',
            px: 0.6,
            py: 0.25,
            borderRadius: 0.6,
            fontFamily: 'monospace',
            fontSize: '0.92em',
            border: '1px solid #e0e0e0',
          },
          '& pre': {
            bgcolor: '#f5f5f5',
            color: '#000000',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            pageBreakInside: 'avoid',
            border: '1px solid #e0e0e0',
            '& code': {
              bgcolor: 'transparent',
              border: 'none',
              p: 0,
            },
          },
          '& blockquote': {
            borderLeft: '4px solid #cccccc',
            color: '#333333',
            pl: 2,
            ml: 0,
            fontStyle: 'italic',
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            my: 2,
            pageBreakInside: 'avoid',
            color: '#000000',
          },
          '& th, & td': {
            border: '1px solid #cccccc',
            p: 1,
            color: '#000000',
          },
          '& th': {
            bgcolor: '#f5f5f5',
            fontWeight: 'bold',
          },
          '& .mermaid-container': {
            my: 2,
            textAlign: 'center',
            pageBreakInside: 'avoid',
          },
        }}
      >
        <Box dangerouslySetInnerHTML={{ __html: html }} />
      </Paper>
    </>
  );
}
