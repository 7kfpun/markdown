import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { copySVGToClipboard, copyMermaidAsPNG } from '../src/utils/mermaidToClipboard.js';

describe('Mermaid Copy/Download', () => {
    let mockClipboard: any;
    let mockCreateElement: any;
    let mockCreateObjectURL: any;
    let mockRevokeObjectURL: any;

    const validSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
    <rect width="200" height="100" fill="lightblue"/>
    <text x="100" y="50" text-anchor="middle">Test Diagram</text>
  </svg>`;

    beforeEach(() => {
        // Mock clipboard API
        mockClipboard = {
            writeText: vi.fn().mockResolvedValue(undefined),
            write: vi.fn().mockResolvedValue(undefined),
        };
        Object.defineProperty(navigator, 'clipboard', {
            value: mockClipboard,
            writable: true,
            configurable: true,
        });

        // Mock document.createElement for download
        mockCreateElement = {
            click: vi.fn(),
            href: '',
            download: '',
        };
        vi.spyOn(document, 'createElement').mockReturnValue(mockCreateElement as any);

        // Mock URL API
        mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
        mockRevokeObjectURL = vi.fn();
        (global as any).URL = {
            createObjectURL: mockCreateObjectURL,
            revokeObjectURL: mockRevokeObjectURL
        };

        // Mock console to avoid test output pollution
        vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });

        // Mock window.devicePixelRatio
        Object.defineProperty(window, 'devicePixelRatio', {
            value: 1,
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('copySVGToClipboard', () => {
        it('copies SVG string to clipboard as text', async () => {
            const result = await copySVGToClipboard(validSVG);

            expect(result).toBe(true);
            expect(mockClipboard.writeText).toHaveBeenCalledWith(validSVG);
            expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
        });

        it('returns false when clipboard write fails', async () => {
            mockClipboard.writeText.mockRejectedValue(new Error('Permission denied'));

            const result = await copySVGToClipboard(validSVG);

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith(
                'Failed to copy SVG:',
                expect.any(Error)
            );
        });

        it('handles empty SVG string', async () => {
            const result = await copySVGToClipboard('');

            expect(result).toBe(true);
            expect(mockClipboard.writeText).toHaveBeenCalledWith('');
        });
    });

    describe('copyMermaidAsPNG', () => {
        let mockCanvas: any;
        let mockContext: any;
        let mockImage: any;

        beforeEach(() => {
            // Mock canvas API
            mockContext = {
                scale: vi.fn(),
                fillStyle: '',
                fillRect: vi.fn(),
                drawImage: vi.fn(),
            };

            mockCanvas = {
                width: 0,
                height: 0,
                getContext: vi.fn(() => mockContext),
                toBlob: vi.fn((callback) => {
                    // Simulate async blob creation
                    setTimeout(() => {
                        const mockBlob = new Blob(['mock-image-data'], { type: 'image/png' });
                        callback(mockBlob);
                    }, 0);
                }),
            };

            vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
                if (tag === 'canvas') return mockCanvas as any;
                if (tag === 'a') return mockCreateElement as any;
                return {} as any;
            });

            // Mock Image constructor
            mockImage = {
                onload: null,
                onerror: null,
                src: '',
                crossOrigin: '',
            };

            (window as any).Image = vi.fn(() => mockImage);

            // Mock ClipboardItem
            (window as any).ClipboardItem = vi.fn((data) => data);
        });

        it('copies mermaid diagram as PNG to clipboard', async () => {
            const promise = copyMermaidAsPNG(validSVG);

            // Trigger image load
            await vi.waitFor(() => {
                if (mockImage.onload) {
                    mockImage.onload();
                }
            });

            const result = await promise;

            expect(result).toBe(true);
            expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
            expect(mockContext.fillStyle).toBe('white');
            expect(mockContext.drawImage).toHaveBeenCalled();
            expect(mockClipboard.write).toHaveBeenCalled();
        });

        it('downloads PNG when downloadOnly option is set', async () => {
            const promise = copyMermaidAsPNG(validSVG, { downloadOnly: true });

            // Trigger image load
            await vi.waitFor(() => {
                if (mockImage.onload) {
                    mockImage.onload();
                }
            });

            const result = await promise;

            expect(result).toBe(true);
            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(mockCreateElement.download).toBe('diagram.png');
            expect(mockCreateElement.click).toHaveBeenCalled();
            expect(mockClipboard.write).not.toHaveBeenCalled();
        });

        it('handles invalid SVG gracefully', async () => {
            const invalidSVG = '<div>Not an SVG</div>';

            const promise = copyMermaidAsPNG(invalidSVG);

            await vi.waitFor(() => {
                if (mockImage.onload) {
                    mockImage.onload();
                }
            });

            const result = await promise;

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalled();
        });

        it('uses viewBox dimensions when width/height not specified', async () => {
            const svgWithViewBox = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">
        <rect fill="blue"/>
      </svg>`;

            const promise = copyMermaidAsPNG(svgWithViewBox);

            await vi.waitFor(() => {
                if (mockImage.onload) {
                    mockImage.onload();
                }
            });

            await promise;

            expect(mockCanvas.width).toBeGreaterThan(0);
            expect(mockCanvas.height).toBeGreaterThan(0);
        });

        it('applies device pixel ratio for high DPI displays', async () => {
            Object.defineProperty(window, 'devicePixelRatio', {
                value: 2,
                writable: true,
            });

            const promise = copyMermaidAsPNG(validSVG);

            await vi.waitFor(() => {
                if (mockImage.onload) {
                    mockImage.onload();
                }
            });

            await promise;

            expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
        });

        it('handles image loading errors', async () => {
            const promise = copyMermaidAsPNG(validSVG);

            // Trigger image error
            await vi.waitFor(() => {
                if (mockImage.onerror) {
                    mockImage.onerror(new Error('Failed to load'));
                }
            });

            const result = await promise;

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith(
                'Failed to load SVG image:',
                expect.any(Error)
            );
        });

        it('handles timeout for slow image loading', async () => {
            vi.useFakeTimers();

            const promise = copyMermaidAsPNG(validSVG);

            // Fast-forward time to trigger timeout
            vi.advanceTimersByTime(11000);

            const result = await promise;

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Image loading timeout');

            vi.useRealTimers();
        });

        it('handles missing canvas context', async () => {
            mockCanvas.getContext = vi.fn(() => null);

            const result = await copyMermaidAsPNG(validSVG);

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Failed to get canvas context');
        });

        it('handles clipboard API not available', async () => {
            Object.defineProperty(navigator, 'clipboard', {
                value: undefined,
                writable: true,
            });

            const promise = copyMermaidAsPNG(validSVG);

            await vi.waitFor(() => {
                if (mockImage.onload) {
                    mockImage.onload();
                }
            });

            const result = await promise;

            expect(result).toBe(false);
            expect(console.error).toHaveBeenCalledWith('Clipboard API not available');
        });

        it('creates download link with proper attributes', async () => {
            const promise = copyMermaidAsPNG(validSVG, { downloadOnly: true });

            await vi.waitFor(() => {
                if (mockImage.onload) {
                    mockImage.onload();
                }
            });

            await promise;

            expect(mockCreateObjectURL).toHaveBeenCalled();
            expect(mockCreateElement.download).toBe('diagram.png');
            expect(mockCreateElement.click).toHaveBeenCalled();
            expect(mockCreateElement.href).toBe('blob:mock-url');
        });
    });
});
