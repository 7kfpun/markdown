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

// Generate a hash from a string (synchronous for storage compatibility)
// Uses a combination of multiple hash functions for better distribution
const hashString = (str) => {
  // FNV-1a hash - better distribution than simple multiplicative hash
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  // Convert to unsigned 32-bit integer and then to base36
  const hash1 = (hash >>> 0).toString(36);

  // Second hash using different algorithm for extra uniqueness
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    hash2 = ((hash2 << 5) - hash2) + str.charCodeAt(i);
    hash2 = hash2 & hash2;
  }
  const hash2Str = Math.abs(hash2).toString(36);

  // Combine both hashes
  return (hash1 + hash2Str).substring(0, 16);
};

// Get a unique storage key based on the URL hash
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

  // Default storage key for non-shared sessions
  const defaultKey = 'markdown-storage';
  sessionStorage.setItem('markdown-current-storage-key', defaultKey);
  return defaultKey;
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
