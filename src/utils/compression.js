import pako from 'pako';

// Convert base64 to URL-safe base64
const toUrlSafeBase64 = (base64) => {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// Convert URL-safe base64 back to regular base64
const fromUrlSafeBase64 = (urlSafeBase64) => {
  let base64 = urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
};

export const compressToBase64 = (str) => {
  try {
    const compressed = pako.deflate(str, { level: 9 }); // Maximum compression
    const base64 = btoa(String.fromCharCode.apply(null, compressed));
    return toUrlSafeBase64(base64);
  } catch (error) {
    console.error('Compression error:', error);
    throw new Error('Failed to compress content');
  }
};

export const decompressFromBase64 = (urlSafeBase64) => {
  try {
    const base64 = fromUrlSafeBase64(urlSafeBase64);
    const compressed = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const decompressed = pako.inflate(compressed, { to: 'string' });
    return decompressed;
  } catch (error) {
    console.error('Decompression error:', error);
    throw new Error('Failed to decompress content');
  }
};

export const generateShareLink = (content) => {
  const compressed = compressToBase64(content);
  // Modern browsers support much longer URLs:
  // Chrome: ~32KB, Firefox: ~65KB, Safari: ~80KB, Edge: ~32KB
  // Set limit to 10KB to be safe across all browsers
  const MAX_URL_LENGTH = 10000;
  if (compressed.length > MAX_URL_LENGTH) {
    throw new Error(
      `Content too long for sharing via link (${compressed.length} chars, max ${MAX_URL_LENGTH}). Please use download instead.`
    );
  }
  return `${window.location.origin}/#paxo:${compressed}`;
};

// Simple MD5-like hash (non-cryptographic, for collision resistance only)
const hashString = (str) => {
  // Use built-in hash if available (some browsers)
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  // Combine and convert to base36 (shorter than hex)
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return Math.abs(combined).toString(36).substring(0, 10);
};

// Get a unique storage key based on the URL hash or generate a new one
// This allows multiple tabs with different URLs to maintain separate localStorage
// Uses sessionStorage to "lock in" the key even after URL is cleared
export const getStorageKey = () => {
  // Check if we've already locked in a key for this session
  const lockedKey = sessionStorage.getItem('markdown-current-storage-key');
  if (lockedKey) {
    return lockedKey;
  }

  const hash = window.location.hash;
  if (hash.startsWith('#paxo:')) {
    const compressed = hash.substring(6);
    // Use hash of entire compressed data for better uniqueness
    const sessionId = hashString(compressed);
    const key = `markdown-storage-${sessionId}`;
    // Lock in this key for the session
    sessionStorage.setItem('markdown-current-storage-key', key);
    return key;
  }

  const pathMatch = window.location.pathname.match(/\/paxo:([^/]+)/);
  if (pathMatch?.[1]) {
    const compressed = pathMatch[1];
    const sessionId = hashString(compressed);
    const key = `markdown-storage-${sessionId}`;
    sessionStorage.setItem('markdown-current-storage-key', key);
    return key;
  }

  // Generate a unique storage key for new sessions
  // Use timestamp + random value for uniqueness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  const uniqueKey = `markdown-storage-${timestamp}-${random}`;
  sessionStorage.setItem('markdown-current-storage-key', uniqueKey);
  return uniqueKey;
};

export const extractContentFromHash = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#paxo:')) {
    try {
      const compressed = hash.substring(6);
      const content = decompressFromBase64(compressed);
      // Keep the hash in URL to support multiple tabs with different content
      // window.history.replaceState(null, '', window.location.pathname);
      return content;
    } catch (error) {
      console.error('Failed to extract content from URL:', error);
      return null;
    }
  }
  return null;
};

// Support paths like /paxo:<compressed> (fallback when the fragment is stripped, e.g., some redirects)
export const extractContentFromUrl = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#paxo:')) {
    try {
      const compressed = hash.substring(6);
      const content = decompressFromBase64(compressed);
      // Keep the hash in URL to support multiple tabs with different content
      // window.history.replaceState(null, '', window.location.pathname);
      return content;
    } catch (error) {
      console.error('Failed to extract content from URL:', error);
      return null;
    }
  }
  const pathMatch = window.location.pathname.match(/\/paxo:([^/]+)/);
  if (pathMatch?.[1]) {
    try {
      const content = decompressFromBase64(pathMatch[1]);
      // Keep the path in URL to support multiple tabs with different content
      // window.history.replaceState(null, '', '/');
      return content;
    } catch (error) {
      console.error('Failed to extract content from path:', error);
      return null;
    }
  }
  return null;
};
