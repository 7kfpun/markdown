import { createRoot } from 'react-dom/client';
import App from './App';
import { initAnalytics } from './utils/analytics';

// Initialize analytics
initAnalytics();

// Register service worker for offline mode support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('[App] Service Worker registered successfully:', registration);

                // Check for updates when user returns to tab (after 1 minute away)
                let hidden = false;
                document.addEventListener('visibilitychange', () => {
                    if (document.hidden) {
                        hidden = true;
                    } else if (hidden) {
                        // User returned to tab, check for updates
                        setTimeout(() => registration.update(), 1000);
                        hidden = false;
                    }
                });
            })
            .catch((error) => {
                console.warn('[App] Service Worker registration failed:', error);
            });
    });
}

createRoot(document.getElementById('root')!).render(<App />);
