import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadMarkdownAsPDF = async (content, filename = null) => {
  try {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const lines = doc.splitTextToSize(content, pageWidth);
    doc.text(lines, margin, margin);
    doc.save(filename || `markdown-${Date.now()}.pdf`);
  } catch (error) {
    console.error('Failed to export PDF:', error);
    // Fallback: download as markdown to avoid silent failure
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `markdown-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
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

export const downloadHTML = (content, theme, filename = null) => {
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

export const downloadPDF = async (element, options = {}, filename = null) => {
  const {
    pageSize = 'A4',
    orientation = 'portrait',
    margin = 20,
    quality = 1,
  } = options;

  const pageSizes = {
    A4: { width: 210, height: 297 },
    Letter: { width: 216, height: 279 },
    Legal: { width: 216, height: 356 },
  };

  const size = pageSizes[pageSize] || pageSizes.A4;

  const canvas = await html2canvas(element, {
    scale: quality,
    useCORS: true,
    logging: false,
  });

  const imgWidth = size.width - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize.toLowerCase(),
  });

  const imgData = canvas.toDataURL('image/png');
  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
  heightLeft -= size.height - margin * 2;

  while (heightLeft > 0) {
    pdf.addPage();
    position = margin - (imgHeight - heightLeft);
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= size.height - margin * 2;
  }

  pdf.save(filename || `markdown-${Date.now()}.pdf`);
};

export const downloadPNG = async (element, options = {}, filename = null) => {
  const { width = 1200, scale = 2, backgroundColor = 'white' } = options;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor,
    width,
  });

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `markdown-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
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

export const copyPNGToClipboard = async (element) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          resolve(true);
        } catch (error) {
          console.error('Failed to copy PNG:', error);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('Failed to copy PNG:', error);
    return false;
  }
};
