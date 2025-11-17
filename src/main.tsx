import { createRoot } from 'react-dom/client';
import App from './App';
import { initAnalytics } from './utils/analytics';

initAnalytics();
createRoot(document.getElementById('root')!).render(<App />);
