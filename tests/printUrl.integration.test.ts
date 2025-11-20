import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { openPrintPage } from '../src/utils/export.js';

describe('Print URL Integration', () => {
    let mockWindowOpen: ReturnType<typeof vi.fn>;
    let originalLocation: Location;

    beforeEach(() => {
        // Store original location
        originalLocation = window.location;

        // Mock window.open
        mockWindowOpen = vi.fn();
        (window as any).open = mockWindowOpen;

        // Mock console.error to avoid test output pollution
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // Restore original location
        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
    });

    it('opens print URL with correct structure from root path', () => {
        // Simulate being on the root page
        Object.defineProperty(window, 'location', {
            value: {
                protocol: 'https:',
                host: 'example.com',
                origin: 'https://example.com',
                pathname: '/',
                hash: '',
            },
            writable: true,
        });

        const content = '# Test Markdown';
        openPrintPage(content);

        expect(mockWindowOpen).toHaveBeenCalledTimes(1);
        const url = mockWindowOpen.mock.calls[0][0];

        // Verify URL structure
        expect(url).toMatch(/^https:\/\/example\.com\/print#paxo:/);
        expect(url).not.toMatch(/#.*#/); // No double hash
        expect(mockWindowOpen.mock.calls[0][1]).toBe('_blank');
    });

    it('opens print URL correctly when current page has a hash', () => {
        // Simulate being on a page with existing hash (editor view)
        Object.defineProperty(window, 'location', {
            value: {
                protocol: 'https:',
                host: 'example.com',
                origin: 'https://example.com',
                pathname: '/',
                hash: '#editor',
            },
            writable: true,
        });

        const content = '## Test Content';
        openPrintPage(content);

        expect(mockWindowOpen).toHaveBeenCalledTimes(1);
        const url = mockWindowOpen.mock.calls[0][0];

        // Crucial: Verify no double hash bug
        expect(url).toMatch(/^https:\/\/example\.com\/print#paxo:/);
        expect(url).not.toContain('#editor'); // Old hash should not appear
        expect(url).not.toMatch(/#print#/); // No double hash
        expect(url.split('#').length).toBe(2); // Only one hash
    });

    it('opens print URL correctly with shared link hash', () => {
        // Simulate being on a shared link with paxo hash
        Object.defineProperty(window, 'location', {
            value: {
                protocol: 'https:',
                host: 'markdown.io',
                origin: 'https://markdown.io',
                pathname: '/',
                hash: '#paxo:eNqVW21zG8lx_r6',
            },
            writable: true,
        });

        const content = '### New Content for Print';
        openPrintPage(content);

        const url = mockWindowOpen.mock.calls[0][0];

        // Should create new print URL, not append to existing hash
        expect(url).toMatch(/^https:\/\/markdown\.io\/print#paxo:/);
        expect(url).not.toContain('eNqVW21zG8lx_r6'); // Old hash content should not appear
        expect(url.split('#').length).toBe(2); // Only one hash
    });

    it('handles different port numbers correctly', () => {
        // Simulate localhost development
        Object.defineProperty(window, 'location', {
            value: {
                protocol: 'http:',
                host: 'localhost:5173',
                origin: 'http://localhost:5173',
                pathname: '/',
                hash: '',
            },
            writable: true,
        });

        const content = '# Local Test';
        openPrintPage(content);

        const url = mockWindowOpen.mock.calls[0][0];

        expect(url).toMatch(/^http:\/\/localhost:5173\/print#paxo:/);
        expect(url.split('#').length).toBe(2);
    });

    it('constructs URL using protocol and host, not origin', () => {
        // This test ensures we're using the fixed implementation
        Object.defineProperty(window, 'location', {
            value: {
                protocol: 'https:',
                host: 'app.example.com',
                // Don't rely on origin property
                pathname: '/editor',
                hash: '#view',
            },
            writable: true,
        });

        const content = '# Test';
        openPrintPage(content);

        const url = mockWindowOpen.mock.calls[0][0];

        // Verify it uses protocol + host correctly
        expect(url).toMatch(/^https:\/\/app\.example\.com\/print#paxo:/);
        expect(url).not.toMatch(/#view/); // No old hash
        expect(url).not.toMatch(/#.*#/); // No double hash
    });

    it('includes compressed content in URL hash', () => {
        Object.defineProperty(window, 'location', {
            value: {
                protocol: 'https:',
                host: 'test.com',
                pathname: '/',
                hash: '',
            },
            writable: true,
        });

        const content = '# Hello World\n\nThis is test content.';
        openPrintPage(content);

        const url = mockWindowOpen.mock.calls[0][0];

        // Should have content after paxo:
        const hashPart = url.split('#paxo:')[1];
        expect(hashPart).toBeDefined();
        expect(hashPart.length).toBeGreaterThan(0);
    });
});
