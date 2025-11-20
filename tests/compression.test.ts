import { describe, expect, it, beforeEach } from 'vitest';
import {
  compressToBase64,
  decompressFromBase64,
  generateShareLink,
  getStorageKey,
  extractContentFromHash,
  extractContentFromUrl,
} from '../src/utils/compression.js';

// Vitest jsdom environment provides window/btoa/atob.

describe('compression utilities', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    // Reset URL hash
    window.location.hash = '';
  });

  describe('compressToBase64 and decompressFromBase64', () => {
    it('roundtrips simple content through compress/decompress', () => {
      const content = '# Hello\nThis is a test with punctuation and symbols ~!@#$%^&*()';
      const compressed = compressToBase64(content);
      const restored = decompressFromBase64(compressed);
      expect(restored).toBe(content);
    });

    it('handles unicode characters', () => {
      const content = '你好世界 🌍 こんにちは мир';
      const compressed = compressToBase64(content);
      const restored = decompressFromBase64(compressed);
      expect(restored).toBe(content);
    });

    it('handles empty string', () => {
      const content = '';
      const compressed = compressToBase64(content);
      const restored = decompressFromBase64(compressed);
      expect(restored).toBe(content);
    });

    it('handles very long content', () => {
      const content = 'a'.repeat(5000);
      const compressed = compressToBase64(content);
      const restored = decompressFromBase64(compressed);
      expect(restored).toBe(content);
      // Verify compression actually worked
      expect(compressed.length).toBeLessThan(content.length);
    });

    it('produces URL-safe base64 (no +, /, or =)', () => {
      const content = 'Test content with various characters: +/=?#&';
      const compressed = compressToBase64(content);
      expect(compressed).not.toMatch(/[+/=]/);
    });

    it('handles markdown with code blocks', () => {
      const content = '```javascript\nconst x = 1;\nconsole.log(x);\n```';
      const compressed = compressToBase64(content);
      const restored = decompressFromBase64(compressed);
      expect(restored).toBe(content);
    });

    it('handles markdown with mermaid diagrams', () => {
      const content = '```mermaid\ngraph TD\n  A-->B\n  B-->C\n```';
      const compressed = compressToBase64(content);
      const restored = decompressFromBase64(compressed);
      expect(restored).toBe(content);
    });
  });

  describe('generateShareLink', () => {
    it('generates a share link with the compressed payload', () => {
      const content = 'quick brown fox jumps over the lazy dog';
      const link = generateShareLink(content);
      expect(link.startsWith(`${window.location.origin}/#paxo:`)).toBe(true);
      const payload = link.split('#paxo:')[1];
      expect(decompressFromBase64(payload)).toBe(content);
    });

    it('throws when content exceeds URL length limit', () => {
      // Build a poorly-compressible string that exceeds the 10k compressed limit
      let seed = 123456;
      let content = '';
      const nextChar = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return String.fromCharCode(32 + (seed % 95)); // printable ASCII range
      };
      while (true) {
        content += Array.from({ length: 1000 }, nextChar).join('');
        const compressedLength = compressToBase64(content).length;
        if (compressedLength > 10000) break;
        if (content.length > 30000) break; // safety guard
      }
      expect(() => generateShareLink(content)).toThrow(/Content too long/);
    });

    it('includes error message with actual and max lengths', () => {
      // Build a poorly-compressible string that exceeds the 10k compressed limit
      let seed = 123456;
      let content = '';
      const nextChar = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return String.fromCharCode(32 + (seed % 95)); // printable ASCII range
      };
      while (true) {
        content += Array.from({ length: 1000 }, nextChar).join('');
        const compressedLength = compressToBase64(content).length;
        if (compressedLength > 10000) break;
        if (content.length > 30000) break; // safety guard
      }

      expect(() => generateShareLink(content)).toThrow(/Content too long/);
      expect(() => generateShareLink(content)).toThrow(/max 10000/);
    });
  });

  describe('getStorageKey', () => {
    it('returns fixed key for current editing session', () => {
      const key = getStorageKey();
      expect(key).toBe('markdown-storage-current');
    });

    it('returns fixed key regardless of hash', () => {
      const content = '# Test content';
      const compressed = compressToBase64(content);
      window.location.hash = `#paxo:${compressed}`;

      const key = getStorageKey();
      expect(key).toBe('markdown-storage-current');
    });

    it('returns same key across multiple calls', () => {
      const key1 = getStorageKey();
      const key2 = getStorageKey();
      expect(key1).toBe(key2);
      expect(key1).toBe('markdown-storage-current');
    });
  });

  describe('extractContentFromHash', () => {
    it('extracts content from valid hash', () => {
      const content = '# Test markdown\n\nHello world!';
      const compressed = compressToBase64(content);
      window.location.hash = `#paxo:${compressed}`;

      const extracted = extractContentFromHash();
      expect(extracted).toBe(content);
    });

    it('returns null when no hash', () => {
      window.location.hash = '';
      const extracted = extractContentFromHash();
      expect(extracted).toBeNull();
    });

    it('returns null when hash has wrong prefix', () => {
      window.location.hash = '#other-data';
      const extracted = extractContentFromHash();
      expect(extracted).toBeNull();
    });

    it('returns null when decompression fails', () => {
      window.location.hash = '#paxo:invalid-compressed-data';
      const extracted = extractContentFromHash();
      expect(extracted).toBeNull();
    });
  });

  describe('extractContentFromUrl', () => {
    it('extracts content from hash', () => {
      const content = '# Test markdown';
      const compressed = compressToBase64(content);
      window.location.hash = `#paxo:${compressed}`;

      const extracted = extractContentFromUrl();
      expect(extracted).toBe(content);
    });

    it('returns null when no hash or path match', () => {
      window.location.hash = '';
      const extracted = extractContentFromUrl();
      expect(extracted).toBeNull();
    });

    it('handles extraction errors gracefully', () => {
      window.location.hash = '#paxo:corrupt-data-!!!';
      const extracted = extractContentFromUrl();
      expect(extracted).toBeNull();
    });
  });
});
