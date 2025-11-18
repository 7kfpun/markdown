import { ThemeProvider, CssBaseline } from '@mui/material';
import { useEffect } from 'react';
import { getMuiTheme } from './presentation/theme/muiTheme';
import AppRouter from './presentation/router/AppRouter';
import { useMarkdownStore } from './infrastructure/store/useMarkdownStore';
import { extractContentFromUrl } from './utils/compression';

export default function App() {
  const { darkMode, updateContent, content, resetContent } = useMarkdownStore();

  // Extract and apply URL content on mount and when hash changes
  useEffect(() => {
    const loadUrlContent = () => {
      const sharedContent = extractContentFromUrl();
      if (sharedContent) {
        updateContent(sharedContent);
      }
    };

    // Load on mount
    loadUrlContent();

    // Listen for hash changes (supports multiple tabs with different URLs)
    window.addEventListener('hashchange', loadUrlContent);

    // Listen for focus events to reload URL content when switching between tabs
    // This ensures each tab maintains its own content based on its URL
    window.addEventListener('focus', loadUrlContent);

    return () => {
      window.removeEventListener('hashchange', loadUrlContent);
      window.removeEventListener('focus', loadUrlContent);
    };
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
