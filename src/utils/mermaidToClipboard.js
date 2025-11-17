export const copySVGToClipboard = async (svgString) => {
  try {
    await navigator.clipboard.writeText(svgString);
    return true;
  } catch (error) {
    console.error('Failed to copy SVG:', error);
    return false;
  }
};

export const copyMermaidAsPNG = async (svgString, options = {}) => {
  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');

    if (!svgElement) {
      throw new Error('Invalid SVG');
    }

    const viewBox = svgElement.getAttribute('viewBox');
    let svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
    let svgHeight = parseFloat(svgElement.getAttribute('height') || '0');

    if ((!svgWidth || !svgHeight) && viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      if (parts.length === 4) {
        svgWidth = parts[2];
        svgHeight = parts[3];
      }
    }

    if (!svgWidth || !svgHeight) {
      svgWidth = 1200;
      svgHeight = 800;
    }

    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = svgWidth * dpr;
    canvas.height = svgHeight * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    // Use data URL to avoid cross-origin tainting
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

    return new Promise((resolve) => {
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
          canvas.toBlob(async (blob) => {
            try {
              if (options.downloadOnly) {
                const dlUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = dlUrl;
                a.download = 'diagram.png';
                a.click();
                URL.revokeObjectURL(dlUrl);
                // data URL, nothing to revoke
                resolve(true);
                return;
              }

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
        } catch (error) {
          console.error('Failed to paint PNG:', error);
          resolve(false);
        }
      };

      img.onerror = () => {
        console.error('Failed to load SVG image');
        resolve(false);
      };

      img.crossOrigin = 'anonymous';
      img.src = svgDataUrl;
    });
  } catch (error) {
    console.error('Failed to copy mermaid as PNG:', error);
    return false;
  }
};
