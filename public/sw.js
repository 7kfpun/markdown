// Service Worker for 1Markdown - Enables offline functionality
// CACHE_NAME is replaced at build time by the Vite injectServiceWorkerVersion plugin.
// Bumped from markdown-v1 to markdown-v2 to force browsers to discard the stale v1 cache.
const CACHE_NAME = 'markdown-v2';

// Only cache versioned static assets (icons, manifest).
// Do NOT cache index.html or / — those reference hashed JS/CSS filenames, and caching
// them here causes browsers to keep serving stale app code after deployments.
const ASSETS_TO_CACHE = [
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/site.webmanifest',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching essential assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
        console.warn('[SW] Failed to cache some assets:', error);
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control immediately
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  // Network-first for all navigation requests (HTML pages).
  // This ensures index.html is always fresh so the browser loads the latest
  // JS bundle hashes. Without this, a cached index.html would keep pointing
  // at old (also cached) JS files, making app updates invisible to users.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() =>
          caches.match(request).then((cached) => cached || createOfflineResponse())
        )
    );
    return;
  }

  // Network-first for other dynamic paths
  if (
    url.pathname.includes('/api') ||
    url.pathname.includes('/view') ||
    url.pathname.includes('/print')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cachedResponse) => cachedResponse || createOfflineResponse())
        )
    );
    return;
  }

  // Cache-first for versioned static assets (JS, CSS, images, fonts).
  // These are content-hashed by Vite, so a new filename = fresh fetch.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cachedResponse) => cachedResponse || createOfflineResponse())
        );
    })
  );
});

// Create offline response
function createOfflineResponse() {
  return new Response(
    `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>1Markdown - Offline</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #f8f9fb, #f0f4ff);
          color: #1f1f1f;
        }
        .container {
          text-align: center;
          padding: 40px 20px;
          max-width: 500px;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 10px;
        }
        p {
          font-size: 16px;
          color: #666;
          line-height: 1.6;
        }
        .icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>You're Offline</h1>
        <p>1Markdown works offline! Your content is saved locally.</p>
        <p>Check your internet connection to sync with cloud services.</p>
      </div>
    </body>
    </html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}
