import { BrowserRouter, StaticRouter, Routes, Route, Navigate } from 'react-router-dom';
import EditorPage from '../pages/EditorPage';
import ViewPage from '../pages/ViewPage';
import PrintPage from '../pages/PrintPage';
import PrivacyPage from '../pages/PrivacyPage';

interface AppRouterProps {
  isServer?: boolean;
  location?: string;
}

export default function AppRouter({ isServer = false, location = '/' }: AppRouterProps = {}) {
  const RouterComponent = isServer ? StaticRouter : BrowserRouter;
  const routerProps = isServer ? { location } : {};

  return (
    <RouterComponent {...routerProps}>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/view" element={<ViewPage />} />
        <Route path="/print" element={<PrintPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouterComponent>
  );
}
