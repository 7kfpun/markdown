import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Plugin to inject dynamic cache version into service worker
function injectServiceWorkerVersion() {
  return {
    name: 'inject-sw-version',
    closeBundle() {
      try {
        const swPath = resolve(__dirname, 'dist/sw.js');
        const swContent = readFileSync(swPath, 'utf-8');

        // Generate version from timestamp
        const version = Date.now().toString(36);

        // Replace placeholder with actual version
        const updatedContent = swContent.replace(
          /const CACHE_NAME = '[^']+';/,
          `const CACHE_NAME = 'markdown-v${version}';`
        );

        writeFileSync(swPath, updatedContent);
        console.log(
          `[Build] Service worker cache version updated to: markdown-v${version}`
        );
      } catch (error) {
        console.warn(
          '[Build] Could not update service worker version:',
          error.message
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), injectServiceWorkerVersion()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Copy service worker to dist
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
