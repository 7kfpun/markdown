import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EditorPage from '../pages/EditorPage';
import ViewPage from '../pages/ViewPage';
import PrintPage from '../pages/PrintPage';
import PrivacyPage from '../pages/PrivacyPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/view" element={<ViewPage />} />
        <Route path="/print" element={<PrintPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
