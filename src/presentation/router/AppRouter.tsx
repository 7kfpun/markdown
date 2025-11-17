import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EditorPage from '../pages/EditorPage';
import ViewPage from '../pages/ViewPage';
import PrintPage from '../pages/PrintPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/view" element={<ViewPage />} />
        <Route path="/print" element={<PrintPage />} />
      </Routes>
    </BrowserRouter>
  );
}
