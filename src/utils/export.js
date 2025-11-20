import { compressToBase64 } from './compression';

export const openPrintPage = (content) => {
  try {
    const compressed = compressToBase64(content);
    // Create clean print URL with proper path and hash
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const printUrl = `${baseUrl}/print#paxo:${compressed}`;
    window.open(printUrl, '_blank');
  } catch (error) {
    console.error('Failed to open print page:', error);
    alert(
      'Content too long for print preview. Please use markdown export instead.'
    );
  }
};

export const downloadRenderedHTML = (element, filename = null) => {
  if (!element) return;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview Export</title>
</head>
<body>
${element.innerHTML}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `preview-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadMarkdown = (content, filename = null) => {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `markdown-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadHTML = (content, filename = null) => {
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }
    code {
      background: #f4f4f4;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
    }
    pre {
      background: #f4f4f4;
      padding: 1rem;
      border-radius: 5px;
      overflow-x: auto;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1rem;
      margin-left: 0;
      color: #666;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background: #f4f4f4;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;

  const blob = new Blob([htmlTemplate], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `markdown-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

export const copyHTMLToClipboard = async (htmlContent) => {
  try {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blob,
      }),
    ]);
    return true;
  } catch (error) {
    console.error('Failed to copy HTML:', error);
    return false;
  }
};
