import { describe, expect, it } from 'vitest';
import { compressToBase64, decompressFromBase64, generateShareLink } from '../src/utils/compression.js';

// Vitest jsdom environment provides window/btoa/atob.

describe('compression utilities', () => {
  it('roundtrips content through compress/decompress', () => {
    const content = '# Hello\nThis is a test with punctuation and symbols ~!@#$%^&*()';
    const compressed = compressToBase64(content);
    const restored = decompressFromBase64(compressed);
    expect(restored).toBe(content);
  });

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
});
