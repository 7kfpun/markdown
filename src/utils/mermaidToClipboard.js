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
    if (!ctx) {
      console.error('Failed to get canvas context');
      return false;
    }

    ctx.scale(dpr, dpr);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    // Use data URL to avoid cross-origin tainting
    const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

    return new Promise((resolve) => {
      // Add timeout to prevent hanging if image never loads
      const timeout = setTimeout(() => {
        console.error('Image loading timeout');
        resolve(false);
      }, 10000); // 10 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        try {
          ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
          canvas.toBlob(async (blob) => {
            try {
              if (!blob) {
                console.error('Failed to create blob from canvas');
                resolve(false);
                return;
              }

              if (options.downloadOnly) {
                const dlUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = dlUrl;
                a.download = 'diagram.png';
                a.click();
                // Clean up after a short delay to ensure download starts
                setTimeout(() => URL.revokeObjectURL(dlUrl), 100);
                resolve(true);
                return;
              }

              // Check if clipboard API is available
              if (!navigator.clipboard || !navigator.clipboard.write) {
                console.error('Clipboard API not available');
                resolve(false);
                return;
              }

              await navigator.clipboard.write([
                new ClipboardItem({
                  'image/png': blob,
                }),
              ]);
              resolve(true);
            } catch (error) {
              console.error('Failed to copy PNG to clipboard:', error);
              resolve(false);
            }
          }, 'image/png');
        } catch (error) {
          console.error('Failed to draw image on canvas:', error);
          resolve(false);
        }
      };

      img.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Failed to load SVG image:', error);
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
