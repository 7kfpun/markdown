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
