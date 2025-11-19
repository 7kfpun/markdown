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
  createSnapshot,
} from './utils/sessionHistory';
import { DEBOUNCE_TIMES } from './utils/constants';

interface AppProps {
  isServer?: boolean;
  location?: string;
}

export default function App({ isServer = false, location = '/' }: AppProps = {}) {
  const { darkMode, updateContent, content, storageKey, switchStorageKey } = useMarkdownStore();
  const saveMetadataTimeoutRef = useRef<number>();
  const lastAutoSavedContentRef = useRef<string>('');

  // Load URL content on mount and clear hash after loading (client-side only)
  useEffect(() => {
    // Skip on server-side
    if (isServer) return;

    const sharedContent = extractContentFromUrl();
    if (sharedContent) {
      // Only update if localStorage doesn't have content for this key already
      // (localStorage might have edits from a previous session with this URL)
      if (!content || content === '') {
        updateContent(sharedContent);
      }
      // Clear paxo URL hash after loading shared content
      // This transitions from shared URL to local storage
      if (window.location.hash.startsWith('#paxo:')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    // Initialize auto-save tracker with current content
    lastAutoSavedContentRef.current = content;
  }, [updateContent, isServer]); // eslint-disable-line react-hooks/exhaustive-deps


  // Initialize session metadata on mount (client-side only)
  useEffect(() => {
    // Skip on server-side
    if (isServer) return;

    if (content && storageKey) {
      const existing = getCurrentSessionMetadata(storageKey);
      const metadata = createSessionMetadata(storageKey, content, existing || undefined);
      saveSessionMetadata(metadata);
    }
  }, [isServer]); // Only run on mount

  // Auto-save: create snapshot every 10 minutes (only if content changed) (client-side only)
  useEffect(() => {
    // Skip on server-side
    if (isServer) return;

    const createAutoSnapshot = () => {
      if (content && content !== lastAutoSavedContentRef.current) {
        // Create a new snapshot (new storage key + metadata)
        const newKey = createSnapshot(content);
        console.log('Auto-snapshot created:', newKey);
        // Update store to use new storage key
        switchStorageKey(newKey);
        // Track the saved content to avoid duplicate snapshots
        lastAutoSavedContentRef.current = content;
        // Clear paxo URL hash if it exists (we're now using local storage, not shared URL)
        if (window.location.hash.startsWith('#paxo:')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else if (content === lastAutoSavedContentRef.current) {
        console.log('Auto-save skipped: content unchanged');
      }
    };

    startAutoSave(createAutoSnapshot);

    return () => {
      stopAutoSave();
    };
  }, [content, switchStorageKey, isServer]);

  // Update session metadata when content changes (debounced) (client-side only)
  useEffect(() => {
    // Skip on server-side
    if (isServer) return;

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
  }, [content, storageKey, isServer]);

  const theme = getMuiTheme(darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter isServer={isServer} location={location} />
    </ThemeProvider>
  );
}
