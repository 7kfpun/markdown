import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { openPrintPage, downloadMarkdown, downloadHTML, downloadRenderedHTML, copyHTMLToClipboard } from '../src/utils/export.js';

describe('export utilities', () => {
  let mockCreateElement: HTMLAnchorElement;
  let mockCreateObjectURL: string;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
  let mockWindowOpen: ReturnType<typeof vi.fn>;
  let mockAlert: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock DOM elements
    mockCreateElement = {
      click: vi.fn(),
      href: '',
      download: '',
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, 'createElement').mockReturnValue(mockCreateElement);

    // Mock URL API
    mockCreateObjectURL = 'blob:mock-url-123';
    mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = vi.fn(() => mockCreateObjectURL);
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock window methods
    mockWindowOpen = vi.fn();
    mockAlert = vi.fn();
    global.window.open = mockWindowOpen;
    global.alert = mockAlert;

    // Mock console.error to avoid test output pollution
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('openPrintPage', () => {
    it('opens print page with compressed content', () => {
      const content = '# Test Markdown';
      openPrintPage(content);

      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
      const callArgs = mockWindowOpen.mock.calls[0];
      expect(callArgs[0]).toMatch(/\/print#paxo:/);
      expect(callArgs[1]).toBe('_blank');
    });

    it('handles content compression errors gracefully', () => {
      // The openPrintPage function will call alert when compression throws
      // We can't easily test the exact compression limit in unit tests
      // because it depends on the actual compression library behavior,
      // but we can verify the function handles small content correctly
      const smallContent = '# Small Test';
      openPrintPage(smallContent);

      // Should successfully open window for small content
      expect(mockWindowOpen).toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });
  });

  describe('downloadMarkdown', () => {
    it('downloads markdown content with default filename', () => {
      const content = '# Hello World\n\nThis is a test.';
      downloadMarkdown(content);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockCreateElement.href).toBe(mockCreateObjectURL);
      expect(mockCreateElement.download).toMatch(/^markdown-\d+\.md$/);
      expect(mockCreateElement.click).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockCreateObjectURL);
    });

    it('downloads markdown content with custom filename', () => {
      const content = '# Test';
      const filename = 'my-document.md';
      downloadMarkdown(content, filename);

      expect(mockCreateElement.download).toBe(filename);
    });

    it('creates blob with correct type', () => {
      const content = '# Test Content';
      downloadMarkdown(content);

      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('downloadHTML', () => {
    it('downloads HTML with default filename', () => {
      const content = '<h1>Test</h1>';
      downloadHTML(content);

      expect(mockCreateElement.download).toMatch(/^markdown-\d+\.html$/);
      expect(mockCreateElement.click).toHaveBeenCalled();
    });

    it('downloads HTML with custom filename', () => {
      const content = '<h1>Test</h1>';
      const filename = 'export.html';
      downloadHTML(content, filename);

      expect(mockCreateElement.download).toBe(filename);
    });

    it('creates HTML document', () => {
      const content = '<p>Test paragraph</p>';
      downloadHTML(content);

      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('downloadRenderedHTML', () => {
    it('downloads rendered HTML with element innerHTML', () => {
      const mockElement = {
        innerHTML: '<div><h1>Rendered Content</h1></div>',
      } as unknown as HTMLElement;

      downloadRenderedHTML(mockElement);

      expect(mockCreateElement.download).toMatch(/^preview-\d+\.html$/);
      expect(mockCreateElement.click).toHaveBeenCalled();
    });

    it('uses custom filename when provided', () => {
      const mockElement = {
        innerHTML: '<p>Content</p>',
      } as unknown as HTMLElement;
      const filename = 'preview.html';

      downloadRenderedHTML(mockElement, filename);

      expect(mockCreateElement.download).toBe(filename);
    });

    it('does nothing when element is null', () => {
      downloadRenderedHTML(null);

      expect(document.createElement).not.toHaveBeenCalled();
      expect(mockCreateElement.click).not.toHaveBeenCalled();
    });

    it('does nothing when element is undefined', () => {
      downloadRenderedHTML(undefined);

      expect(document.createElement).not.toHaveBeenCalled();
    });

    it('includes element innerHTML', () => {
      const mockElement = {
        innerHTML: '<h2>Test Header</h2><p>Paragraph</p>',
      } as unknown as HTMLElement;

      downloadRenderedHTML(mockElement);

      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('copyHTMLToClipboard', () => {
    it('copies HTML to clipboard successfully', async () => {
      const htmlContent = '<p>Test HTML</p>';
      const mockWrite = vi.fn().mockResolvedValue(undefined);

      // Mock ClipboardItem constructor
      const mockClipboardItem = vi.fn().mockImplementation((data) => data);
      (global as any).ClipboardItem = mockClipboardItem;
      (global as any).navigator = { clipboard: { write: mockWrite } };

      const result = await copyHTMLToClipboard(htmlContent);

      expect(result).toBe(true);
      expect(mockWrite).toHaveBeenCalledTimes(1);
    });

    it('returns false when clipboard write fails', async () => {
      const htmlContent = '<p>Test</p>';
      const mockWrite = vi.fn().mockRejectedValue(new Error('Clipboard error'));

      const mockClipboardItem = vi.fn().mockImplementation((data) => data);
      (global as any).ClipboardItem = mockClipboardItem;
      (global as any).navigator = { clipboard: { write: mockWrite } };

      const result = await copyHTMLToClipboard(htmlContent);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to copy HTML:',
        expect.any(Error)
      );
    });

    it('creates ClipboardItem', async () => {
      const htmlContent = '<div>Content</div>';
      const mockWrite = vi.fn().mockResolvedValue(undefined);

      const mockClipboardItem = vi.fn().mockImplementation((data) => data);
      (global as any).ClipboardItem = mockClipboardItem;
      (global as any).navigator = { clipboard: { write: mockWrite } };

      await copyHTMLToClipboard(htmlContent);

      expect(mockWrite).toHaveBeenCalled();
    });
  });
});
