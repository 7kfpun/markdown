import { ThemeProvider, CssBaseline } from '@mui/material';
import { useEffect } from 'react';
import { getMuiTheme } from './presentation/theme/muiTheme';
import AppRouter from './presentation/router/AppRouter';
import { useMarkdownStore } from './infrastructure/store/useMarkdownStore';
import { extractContentFromUrl } from './utils/compression';

export default function App() {
  const { darkMode, updateContent, content, resetContent } = useMarkdownStore();

  useEffect(() => {
    const sharedContent = extractContentFromUrl();
    if (sharedContent) {
      updateContent(sharedContent);
    }
  }, [updateContent]);

  useEffect(() => {
    if (typeof content === 'string' && content.trim().length === 0) {
      resetContent();
    }
  }, [content, resetContent]);

  const theme = getMuiTheme(darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}
