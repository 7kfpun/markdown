import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EditorPage from '../pages/EditorPage';
import ViewPage from '../pages/ViewPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EditorPage />} />
        <Route path="/view" element={<ViewPage />} />
      </Routes>
    </BrowserRouter>
  );
}
