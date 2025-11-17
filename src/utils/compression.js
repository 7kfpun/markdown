import pako from 'pako';

export const compressToBase64 = (str) => {
  try {
    const compressed = pako.deflate(str);
    const base64 = btoa(String.fromCharCode.apply(null, compressed));
    return base64;
  } catch (error) {
    console.error('Compression error:', error);
    throw new Error('Failed to compress content');
  }
};

export const decompressFromBase64 = (base64) => {
  try {
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
  // Keep under the shortest modern browser URL limit (~2000 chars)
  if (compressed.length > 2000) {
    throw new Error(
      'Content too long for sharing via link (max ~2000 chars). Please use download instead.'
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
      window.history.replaceState(null, '', window.location.pathname);
      return content;
    } catch (error) {
      console.error('Failed to extract content from URL:', error);
      return null;
    }
  }
  return null;
};
