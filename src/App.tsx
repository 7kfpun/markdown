import { ThemeProvider, CssBaseline } from '@mui/material';
import { useEffect, useRef } from 'react';
import { getMuiTheme } from './presentation/theme/muiTheme';
import AppRouter from './presentation/router/AppRouter';
import { useMarkdownStore } from './infrastructure/store/useMarkdownStore';
import { extractContentFromUrl } from './utils/compression';
import {
  createSessionMetadata,
  saveSessionMetadata,
  startAutoSave,
  stopAutoSave,
  getCurrentSessionMetadata,
} from './utils/sessionHistory';
import { DEBOUNCE_TIMES } from './utils/constants';

export default function App() {
  const { darkMode, updateContent, content, storageKey } = useMarkdownStore();
  const saveMetadataTimeoutRef = useRef<number>();

  // Load URL content on mount
  useEffect(() => {
    const sharedContent = extractContentFromUrl();
    if (sharedContent) {
      // Only update if localStorage doesn't have content for this key already
      // (localStorage might have edits from a previous session with this URL)
      if (!content || content === '') {
        updateContent(sharedContent);
      }
    }
  }, [updateContent]);


  // Initialize session metadata on mount
  useEffect(() => {
    if (content && storageKey) {
      const existing = getCurrentSessionMetadata(storageKey);
      const metadata = createSessionMetadata(storageKey, content, existing || undefined);
      saveSessionMetadata(metadata);
    }
  }, []); // Only run on mount

  // Auto-save: update session metadata every 10 minutes
  useEffect(() => {
    const saveMetadata = () => {
      if (content && storageKey) {
        const existing = getCurrentSessionMetadata(storageKey);
        const metadata = createSessionMetadata(storageKey, content, existing || undefined);
        saveSessionMetadata(metadata);
      }
    };

    startAutoSave(saveMetadata);

    return () => {
      stopAutoSave();
    };
  }, [content, storageKey]);

  // Update session metadata when content changes (debounced)
  useEffect(() => {
    if (!content || !storageKey) return;

    // Clear previous timeout
    if (saveMetadataTimeoutRef.current) {
      clearTimeout(saveMetadataTimeoutRef.current);
    }

    // Debounce metadata update
    saveMetadataTimeoutRef.current = window.setTimeout(() => {
      const existing = getCurrentSessionMetadata(storageKey);
      const metadata = createSessionMetadata(storageKey, content, existing || undefined);
      saveSessionMetadata(metadata);
    }, DEBOUNCE_TIMES.METADATA_SAVE);

    return () => {
      if (saveMetadataTimeoutRef.current) {
        clearTimeout(saveMetadataTimeoutRef.current);
      }
    };
  }, [content, storageKey]);

  const theme = getMuiTheme(darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}
