import { ThemeProvider, CssBaseline } from '@mui/material';
import { useEffect, useRef } from 'react';
import { getMuiTheme } from './presentation/theme/muiTheme';
import AppRouter from './presentation/router/AppRouter';
import { useMarkdownStore } from './infrastructure/store/useMarkdownStore';
import { extractContentFromUrl } from './utils/compression';
import {
  createSessionMetadata,
  startAutoSave,
  stopAutoSave,
  createSnapshot,
} from './utils/sessionHistory';

interface AppProps {
  isServer?: boolean;
  location?: string;
}

export default function App({ isServer = false, location = '/' }: AppProps = {}) {
  const darkMode = useMarkdownStore(state => state.darkMode);
  const updateContent = useMarkdownStore(state => state.updateContent);
  const content = useMarkdownStore(state => state.content);
  const addSession = useMarkdownStore(state => state.addSession);
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


  // REMOVED: Initialize session metadata on mount
  // Sessions should only be created/updated on explicit save, not on mount or while editing

  // Auto-save: create snapshot every 10 minutes (only if content changed) (client-side only)
  useEffect(() => {
    // Skip on server-side
    if (isServer) return;

    const createAutoSnapshot = () => {
      if (content && content !== lastAutoSavedContentRef.current) {
        // Create a new snapshot (new storage key)
        // Note: This creates an immutable snapshot with timestamp-based key
        // The current editing session continues to use 'markdown-storage-current'
        const newKey = createSnapshot(content);
        console.log('Auto-snapshot created:', newKey);

        // Create and add metadata to store
        const metadata = createSessionMetadata(newKey, content);
        addSession(metadata);

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
  }, [content, isServer, addSession]);

  const theme = getMuiTheme(darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter isServer={isServer} location={location} />
    </ThemeProvider>
  );
}
