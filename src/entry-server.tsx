import { renderToString } from 'react-dom/server';
import App from './App';

export interface RenderResult {
  html: string;
  head: {
    title: string;
    description: string;
    keywords: string;
    canonicalUrl: string;
    ogUrl: string;
    ogImage: string;
    twitterImage: string;
  };
}

export function render(url: string): RenderResult {
  const appHtml = renderToString(<App isServer={true} location={url} />);

  // Generate dynamic meta tags based on the route
  const isViewPage = url.includes('/view');
  const isPrintPage = url.includes('/print');
  const isPrivacyPage = url.includes('/privacy');

  let title = '1Markdown - Free Online Markdown Editor with Live Preview, Mermaid Diagrams & LaTeX Math';
  let description = 'Professional markdown editor with real-time preview, interactive Mermaid diagrams, LaTeX math equations, syntax highlighting, and PDF export. No signup required. Share documents via links, collaborate instantly, and export to multiple formats including HTML and PDF.';

  if (isViewPage) {
    title = '1Markdown - View Document';
    description = 'View a shared markdown document with rendered preview, Mermaid diagrams, and LaTeX math equations.';
  } else if (isPrintPage) {
    title = '1Markdown - Print View';
    description = 'Print-optimized view of your markdown document with all formatting and diagrams.';
  } else if (isPrivacyPage) {
    title = '1Markdown - Privacy Policy';
    description = 'Privacy policy for 1Markdown - Learn about how we handle your data and protect your privacy.';
  }

  const keywords = 'markdown editor, online markdown, mermaid diagrams, latex math, markdown preview, markdown to pdf, markdown to html, free markdown editor, collaborative markdown, syntax highlighting, code editor, technical documentation, markdown share link, live editor';
  const canonicalUrl = `https://1markdown.wahthefox.com${url}`;
  const ogUrl = `https://1markdown.wahthefox.com${url}`;
  const ogImage = 'https://1markdown.wahthefox.com/og-image.png';
  const twitterImage = 'https://1markdown.wahthefox.com/og-image.png';

  return {
    html: appHtml,
    head: {
      title,
      description,
      keywords,
      canonicalUrl,
      ogUrl,
      ogImage,
      twitterImage,
    },
  };
}
