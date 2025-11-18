import { ThemeProvider, CssBaseline } from '@mui/material';
import { useEffect, useRef } from 'react';
import { getMuiTheme } from './presentation/theme/muiTheme';
import AppRouter from './presentation/router/AppRouter';
import { useMarkdownStore } from './infrastructure/store/useMarkdownStore';
import { extractContentFromUrl, getStorageKey } from './utils/compression';
import {
  createSessionMetadata,
  saveSessionMetadata,
  startAutoSave,
  stopAutoSave,
  getCurrentSessionMetadata,
} from './utils/sessionHistory';

export default function App() {
  const { darkMode, updateContent, content, resetContent, storageKey } = useMarkdownStore();
  const initialUrlContentRef = useRef<string | null>(null);
  const urlClearedRef = useRef(false);
  const saveMetadataTimeoutRef = useRef<number>();

  // Load URL content on mount
  useEffect(() => {
    const sharedContent = extractContentFromUrl();
    if (sharedContent) {
      initialUrlContentRef.current = sharedContent;
      // Only update if localStorage doesn't have content for this key already
      // (localStorage might have edits from a previous session with this URL)
      if (!content || content === '') {
        updateContent(sharedContent);
      }
    }
  }, [updateContent]);

  // Clear URL on first edit
  useEffect(() => {
    if (initialUrlContentRef.current && !urlClearedRef.current) {
      const hash = window.location.hash;
      if (hash.startsWith('#paxo:')) {
        // Check if content has been modified from the original URL content
        if (content && content !== initialUrlContentRef.current) {
          // User made an edit, clear the URL but keep using the locked-in storage key
          urlClearedRef.current = true;
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    }
  }, [content]);

  useEffect(() => {
    if (typeof content === 'string' && content.trim().length === 0) {
      resetContent();
    }
  }, [content, resetContent]);

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

    // Debounce metadata update (save after 2 seconds of no changes)
    saveMetadataTimeoutRef.current = window.setTimeout(() => {
      const existing = getCurrentSessionMetadata(storageKey);
      const metadata = createSessionMetadata(storageKey, content, existing || undefined);
      saveSessionMetadata(metadata);
    }, 2000);

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
