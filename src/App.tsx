import { ThemeProvider, CssBaseline } from '@mui/material';
import { useEffect } from 'react';
import { getMuiTheme } from './presentation/theme/muiTheme';
import AppRouter from './presentation/router/AppRouter';
import { useMarkdownStore } from './infrastructure/store/useMarkdownStore';
import { extractContentFromHash } from './utils/compression';

export default function App() {
  const { darkMode, updateContent } = useMarkdownStore();

  useEffect(() => {
    const hashContent = extractContentFromHash();
    if (hashContent) {
      updateContent(hashContent);
    }
  }, [updateContent]);

  const theme = getMuiTheme(darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}
