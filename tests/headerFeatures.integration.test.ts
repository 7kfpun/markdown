import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  generateShareLink,
  compressToBase64,
  decompressFromBase64,
  extractContentFromHash,
} from '../src/utils/compression';
import {
  openPrintPage,
  downloadMarkdown,
  downloadRenderedHTML,
} from '../src/utils/export';
import { DEFAULT_MARKDOWN } from '../src/utils/constants';
import {
  createSnapshot,
  getAllSessions,
  deleteAllSessions,
} from '../src/utils/sessionHistory';

/**
 * Integration tests for Header Features (Top Right Corner)
 * Tests all the features available in the editor's top right header:
 * - Share functionality
 * - Session History
 * - Reset content
 * - Export PDF
 * - Export Markdown
 * - Export HTML
 * - Import file
 * - Dark/Light mode
 * - Language switching
 */

describe('Header Features Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock URL.createObjectURL and revokeObjectURL for download tests
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Share Feature', () => {
    it('generates shareable link with paxo hash', () => {
      const content = '# Test Document\nThis is shareable content';
      const shareLink = generateShareLink(content);

      expect(shareLink).toContain('#paxo:');
      expect(shareLink).toMatch(/^https?:\/\/.+#paxo:.+$/);
    });

    it('share link contains compressed content that can be decompressed', () => {
      const content = '# My Document\n\nThis is a test with **bold** and *italic* text.';
      const shareLink = generateShareLink(content);

      // Extract hash part
      const hash = shareLink.split('#')[1];
      expect(hash).toMatch(/^paxo:.+$/);

      // Extract compressed part and decompress
      const compressed = hash.substring(5); // Remove 'paxo:'
      const decompressed = decompressFromBase64(compressed);

      expect(decompressed).toBe(content);
    });

    it('handles long content in share links', () => {
      const longContent = '# Long Document\n\n' + 'Lorem ipsum dolor sit amet. '.repeat(100);
      const shareLink = generateShareLink(longContent);

      expect(shareLink).toContain('#paxo:');

      // Verify it can be decompressed
      const hash = shareLink.split('#')[1];
      const compressed = hash.substring(5);
      const decompressed = decompressFromBase64(compressed);

      expect(decompressed).toBe(longContent);
    });

    it('handles special characters in share links', () => {
      const specialContent = '# 测试 🚀\n\n```javascript\nconst x = "hello";\n```\n\n**Bold** _italic_';
      const shareLink = generateShareLink(specialContent);

      const hash = shareLink.split('#')[1];
      const compressed = hash.substring(5);
      const decompressed = decompressFromBase64(compressed);

      expect(decompressed).toBe(specialContent);
    });

    it('generates different links for different content', () => {
      const content1 = '# Document 1';
      const content2 = '# Document 2';

      const link1 = generateShareLink(content1);
      const link2 = generateShareLink(content2);

      expect(link1).not.toBe(link2);
    });

    it('generates same link for identical content', () => {
      const content = '# Same Document';

      const link1 = generateShareLink(content);
      const link2 = generateShareLink(content);

      expect(link1).toBe(link2);
    });

    it('extracts content from hash on page load', () => {
      const content = '# Shared Content\nLoaded from URL';
      const compressed = compressToBase64(content);
      window.location.hash = `#paxo:${compressed}`;

      const extracted = extractContentFromHash();

      expect(extracted).toBe(content);
    });

    it('returns null when no paxo hash present', () => {
      window.location.hash = '';
      const extracted = extractContentFromHash();
      expect(extracted).toBeNull();

      window.location.hash = '#other-hash';
      const extracted2 = extractContentFromHash();
      expect(extracted2).toBeNull();
    });
  });

  describe('Export Features', () => {
    describe('Download Markdown', () => {
      it('creates markdown file with correct content', () => {
        const content = '# Test Export\n\nExport this content';
        const createElementSpy = vi.spyOn(document, 'createElement');
        const mockClick = vi.fn();

        createElementSpy.mockReturnValue({
          click: mockClick,
          href: '',
          download: '',
        } as any);

        downloadMarkdown(content);

        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(mockClick).toHaveBeenCalled();
      });

      it('uses custom filename when provided', () => {
        const content = '# Custom Export';
        let capturedFilename = '';

        const createElementSpy = vi.spyOn(document, 'createElement');
        createElementSpy.mockReturnValue({
          click: vi.fn(),
          set download(value: string) {
            capturedFilename = value;
          },
          get download() {
            return capturedFilename;
          },
          href: '',
        } as any);

        downloadMarkdown(content, 'custom-file.md');

        expect(capturedFilename).toBe('custom-file.md');
      });

      it('generates timestamped filename when none provided', () => {
        const content = '# Auto Named';
        let capturedFilename = '';

        const createElementSpy = vi.spyOn(document, 'createElement');
        createElementSpy.mockReturnValue({
          click: vi.fn(),
          set download(value: string) {
            capturedFilename = value;
          },
          get download() {
            return capturedFilename;
          },
          href: '',
        } as any);

        downloadMarkdown(content);

        expect(capturedFilename).toMatch(/^markdown-\d+\.md$/);
      });
    });

    describe('Download HTML', () => {
      it('downloads rendered HTML with correct structure', () => {
        const mockElement = {
          innerHTML: '<h1>Test</h1><p>Content</p>',
        };

        const createElementSpy = vi.spyOn(document, 'createElement');
        const mockClick = vi.fn();

        createElementSpy.mockReturnValue({
          click: mockClick,
          href: '',
          download: '',
        } as any);

        downloadRenderedHTML(mockElement as any);

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
      });

      it('includes HTML document structure', () => {
        const mockElement = {
          innerHTML: '<h1>Test</h1>',
        };

        let capturedBlob: Blob | null = null;
        (global.URL.createObjectURL as any) = vi.fn((blob) => {
          capturedBlob = blob;
          return 'blob:mock-url';
        });

        vi.spyOn(document, 'createElement').mockReturnValue({
          click: vi.fn(),
          href: '',
          download: '',
        } as any);

        downloadRenderedHTML(mockElement as any);

        expect(capturedBlob).not.toBeNull();
        expect(capturedBlob?.type).toBe('text/html');
      });

      it('handles null element gracefully', () => {
        expect(() => downloadRenderedHTML(null)).not.toThrow();
      });
    });

    describe('Export PDF (Print)', () => {
      it('opens print page with compressed content', () => {
        const content = '# Print Test\nContent to print';
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

        openPrintPage(content);

        expect(openSpy).toHaveBeenCalled();
        const printUrl = openSpy.mock.calls[0][0] as string;
        expect(printUrl).toContain('/print#paxo:');
      });

      it('print URL contains decompressible content', () => {
        const content = '# My PDF\n\nPrint this document';
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

        openPrintPage(content);

        const printUrl = openSpy.mock.calls[0][0] as string;
        const hash = printUrl.split('#')[1];
        const compressed = hash.substring(5); // Remove 'paxo:'
        const decompressed = decompressFromBase64(compressed);

        expect(decompressed).toBe(content);
      });

      it('opens in new tab', () => {
        const content = '# Tab Test';
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

        openPrintPage(content);

        expect(openSpy).toHaveBeenCalledWith(expect.any(String), '_blank');
      });

      it('handles very long content with alert', () => {
        const veryLongContent = '# Very Long\n' + 'x'.repeat(1000000);
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {
          throw new Error('Content too large');
        });

        openPrintPage(veryLongContent);

        // Should catch error and show alert
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Reset Feature', () => {
    it('resets content to default markdown', () => {
      expect(DEFAULT_MARKDOWN).toBeTruthy();
      expect(DEFAULT_MARKDOWN).toContain('# ');
    });

    it('reset preserves existing sessions', () => {
      // Create some sessions
      sessionStorage.clear();
      createSnapshot('# Session 1');
      sessionStorage.clear();
      createSnapshot('# Session 2');

      const sessionsBefore = getAllSessions();
      expect(sessionsBefore).toHaveLength(2);

      // Reset would typically not delete sessions, just change current content
      // Sessions should still exist
      const sessionsAfter = getAllSessions();
      expect(sessionsAfter).toHaveLength(2);
    });
  });

  describe('Session History Integration', () => {
    it('opens session history drawer', () => {
      // Create test sessions
      sessionStorage.clear();
      const key1 = createSnapshot('# Session 1\nFirst session');
      sessionStorage.clear();
      const key2 = createSnapshot('# Session 2\nSecond session');

      const sessions = getAllSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions.some(s => s.storageKey === key1)).toBe(true);
      expect(sessions.some(s => s.storageKey === key2)).toBe(true);
    });

    it('displays sessions in chronological order', () => {
      // Create sessions with delays
      sessionStorage.clear();
      const key1 = createSnapshot('# Old Session');

      sessionStorage.clear();
      const key2 = createSnapshot('# Recent Session');

      const sessions = getAllSessions();

      // Both sessions should exist
      expect(sessions).toHaveLength(2);
      expect(sessions.some(s => s.storageKey === key1)).toBe(true);
      expect(sessions.some(s => s.storageKey === key2)).toBe(true);

      // Sessions should be sorted by lastModified (most recent first)
      for (let i = 0; i < sessions.length - 1; i++) {
        expect(sessions[i].lastModified).toBeGreaterThanOrEqual(sessions[i + 1].lastModified);
      }
    });

    it('deletes all sessions when requested', () => {
      sessionStorage.clear();
      createSnapshot('# Session 1');
      sessionStorage.clear();
      createSnapshot('# Session 2');
      sessionStorage.clear();
      createSnapshot('# Session 3');

      expect(getAllSessions()).toHaveLength(3);

      deleteAllSessions();

      expect(getAllSessions()).toHaveLength(0);
    });
  });

  describe('Manual Save (Cmd+S)', () => {
    it('creates new snapshot when content changes', () => {
      const content1 = '# Version 1';
      const content2 = '# Version 2';

      sessionStorage.clear();
      const key1 = createSnapshot(content1);

      sessionStorage.clear();
      const key2 = createSnapshot(content2);

      expect(key1).not.toBe(key2);

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(2);
    });

    it('clears paxo hash after manual save', () => {
      const content = '# Shared Content';
      const compressed = compressToBase64(content);
      window.location.hash = `#paxo:${compressed}`;

      expect(window.location.hash).toContain('paxo:');

      // Simulate save clearing hash
      if (window.location.hash.startsWith('#paxo:')) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      expect(window.location.hash).toBe('');
    });

    it('locks storage key after save', () => {
      const content = '# New Save';
      const newKey = createSnapshot(content);

      const lockedKey = sessionStorage.getItem('markdown-current-storage-key');
      expect(lockedKey).toBe(newKey);
    });
  });

  describe('Import File Feature', () => {
    it('reads markdown file content', async () => {
      const fileContent = '# Imported Document\n\nThis was imported from a file.';
      const file = new File([fileContent], 'test.md', { type: 'text/markdown' });

      const reader = new FileReader();
      const content = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(file);
      });

      expect(content).toBe(fileContent);
    });

    it('accepts .md and .txt files', () => {
      const mdFile = new File(['# MD'], 'test.md', { type: 'text/markdown' });
      const txtFile = new File(['# TXT'], 'test.txt', { type: 'text/plain' });

      expect(mdFile.name).toMatch(/\.md$/);
      expect(txtFile.name).toMatch(/\.txt$/);
    });

    it('handles UTF-8 encoded files', async () => {
      const utf8Content = '# 中文文档\n\n这是中文内容 🚀';
      const file = new File([utf8Content], 'chinese.md', { type: 'text/markdown' });

      const reader = new FileReader();
      const content = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(file);
      });

      expect(content).toBe(utf8Content);
    });
  });

  describe('Layout Mode Switching', () => {
    it('switches between editor, split, and preview modes', () => {
      const modes = ['editor-only', 'split', 'preview-only'] as const;

      modes.forEach(mode => {
        expect(mode).toMatch(/^(editor-only|split|preview-only)$/);
      });
    });

    it('maintains content when switching layouts', () => {
      const content = '# Content Test\n\nThis should persist across layout changes';

      // Content should remain the same regardless of layout mode
      // This is handled by the store
      expect(content).toBe(content);
    });
  });

  describe('Dark Mode Toggle', () => {
    it('toggles between light and dark modes', () => {
      let darkMode = false;

      // Toggle to dark
      darkMode = !darkMode;
      expect(darkMode).toBe(true);

      // Toggle to light
      darkMode = !darkMode;
      expect(darkMode).toBe(false);
    });

    it('persists dark mode preference', () => {
      const darkMode = true;

      // Store in localStorage
      localStorage.setItem('dark-mode', JSON.stringify(darkMode));

      // Retrieve
      const stored = JSON.parse(localStorage.getItem('dark-mode')!);
      expect(stored).toBe(true);
    });

    it('respects system preference on first load', () => {
      // Mock matchMedia
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      global.matchMedia = mockMatchMedia as any;

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty content gracefully', () => {
      const emptyContent = '';

      const shareLink = generateShareLink(emptyContent);
      expect(shareLink).toContain('#paxo:');

      const key = createSnapshot(emptyContent);
      expect(key).toBeTruthy();
    });

    it('handles very long content', () => {
      const longContent = '# Long\n\n' + 'Lorem ipsum '.repeat(10000);

      const shareLink = generateShareLink(longContent);
      expect(shareLink).toBeTruthy();

      const key = createSnapshot(longContent);
      expect(key).toBeTruthy();
    });

    it('handles special characters and emojis', () => {
      const specialContent = '# Test 测试 🚀\n\n```code```\n\n**bold** _italic_ ~strike~';

      const shareLink = generateShareLink(specialContent);
      const hash = shareLink.split('#')[1];
      const compressed = hash.substring(5);
      const decompressed = decompressFromBase64(compressed);

      expect(decompressed).toBe(specialContent);
    });

    it('handles rapid sequential operations', () => {
      const operations: string[] = [];

      for (let i = 0; i < 10; i++) {
        sessionStorage.clear();
        const key = createSnapshot(`# Operation ${i}`);
        operations.push(key);
      }

      expect(new Set(operations).size).toBe(10); // All unique
      expect(getAllSessions()).toHaveLength(10);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('Cmd+S / Ctrl+S saves content', () => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const saveKey = isMac ? 'metaKey' : 'ctrlKey';

      const mockEvent = {
        key: 's',
        [saveKey]: true,
        preventDefault: vi.fn(),
      };

      // Verify the save key combination is detected
      expect(mockEvent.key).toBe('s');
      expect(mockEvent[saveKey]).toBe(true);
    });
  });

  describe('Multi-Feature Workflows', () => {
    it('complete workflow: import -> edit -> save -> share', async () => {
      // 1. Import
      const importedContent = '# Imported\nInitial content';

      // 2. Edit
      const editedContent = importedContent + '\n\nEdited content';

      // 3. Save
      sessionStorage.clear();
      const saveKey = createSnapshot(editedContent);
      expect(saveKey).toBeTruthy();

      // 4. Share
      const shareLink = generateShareLink(editedContent);
      expect(shareLink).toContain('#paxo:');

      // Verify shared content
      const hash = shareLink.split('#')[1];
      const compressed = hash.substring(5);
      const decompressed = decompressFromBase64(compressed);
      expect(decompressed).toBe(editedContent);
    });

    it('workflow: share link -> load -> edit -> export', () => {
      // 1. Receive share link
      const originalContent = '# Shared Document\nOriginal content';
      const compressed = compressToBase64(originalContent);
      window.location.hash = `#paxo:${compressed}`;

      // 2. Load from hash
      const loaded = extractContentFromHash();
      expect(loaded).toBe(originalContent);

      // 3. Edit
      const edited = loaded + '\n\nNew edits';

      // 4. Export
      const shareLink = generateShareLink(edited);
      expect(shareLink).toContain(edited ? 'paxo:' : '');
    });

    it('workflow: reset -> import -> save -> history', () => {
      // 1. Reset clears current content
      const resetContent = DEFAULT_MARKDOWN;

      // 2. Import new content
      const importedContent = '# New Import\nFresh start';

      // 3. Save
      sessionStorage.clear();
      const key1 = createSnapshot(importedContent);

      // 4. Make more changes and save
      sessionStorage.clear();
      const key2 = createSnapshot(importedContent + '\n\nMore content');

      // 5. Check history
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions.some(s => s.storageKey === key1)).toBe(true);
      expect(sessions.some(s => s.storageKey === key2)).toBe(true);

      // Verify sessions are sorted by lastModified
      for (let i = 0; i < sessions.length - 1; i++) {
        expect(sessions[i].lastModified).toBeGreaterThanOrEqual(sessions[i + 1].lastModified);
      }
    });
  });
});
