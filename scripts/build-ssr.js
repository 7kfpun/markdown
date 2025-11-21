import { execSync } from 'child_process';
import { copyFileSync, cpSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('[Build] Starting SSR build...');

// Clean previous builds
console.log('[Build] Cleaning previous builds...');
try {
  execSync('rm -rf dist', { cwd: rootDir, stdio: 'inherit' });
} catch {
  console.warn('[Build] No previous build to clean');
}

// Build client
console.log('[Build] Building client...');
execSync('vite build --outDir dist/client --ssrManifest', {
  cwd: rootDir,
  stdio: 'inherit',
});

// Build server
console.log('[Build] Building server...');
execSync('vite build --ssr src/entry-server.tsx --outDir dist/server', {
  cwd: rootDir,
  stdio: 'inherit',
});

// Copy service worker to client dist (it's in public/ and should be in dist/client/)
console.log('[Build] Copying service worker...');
const swSource = join(rootDir, 'public', 'sw.js');
const swDest = join(rootDir, 'dist', 'client', 'sw.js');
if (existsSync(swSource)) {
  try {
    copyFileSync(swSource, swDest);
    console.log('[Build] Service worker copied successfully');
  } catch (error) {
    console.warn('[Build] Could not copy service worker:', error.message);
  }
}

// Copy functions directory to client dist for Cloudflare Pages Functions
console.log('[Build] Copying functions directory...');
const functionsSource = join(rootDir, 'functions');
const functionsDest = join(rootDir, 'dist', 'client', 'functions');
if (existsSync(functionsSource)) {
  try {
    cpSync(functionsSource, functionsDest, { recursive: true });
    console.log('[Build] Functions directory copied successfully');
  } catch (error) {
    console.warn('[Build] Could not copy functions directory:', error.message);
  }
}

// Copy server build to client dist for SSR
console.log('[Build] Copying server build...');
const serverSource = join(rootDir, 'dist', 'server');
const serverDest = join(rootDir, 'dist', 'client', 'dist', 'server');
if (existsSync(serverSource)) {
  try {
    cpSync(serverSource, serverDest, { recursive: true });
    console.log('[Build] Server build copied successfully');
  } catch (error) {
    console.warn('[Build] Could not copy server build:', error.message);
  }
}

console.log('[Build] SSR build completed successfully!');
console.log('[Build] Client output: dist/client');
console.log('[Build] Server output: dist/server');
