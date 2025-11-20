import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { createSnapshot, getAllSessions } from '../src/utils/sessionHistory';
import { useMarkdownStore } from '../src/infrastructure/store/useMarkdownStore';

/**
 * Integration tests for Session Restore functionality
 * Verifies that the store is correctly updated after restoring a session
 */

describe('Session Restore Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Store State After Restore', () => {
    it('updates store content correctly after restore', () => {
      // Set current editor preferences (different from old session)
      useMarkdownStore.getState().setEditorTheme('github-light');
      useMarkdownStore.getState().setEditorFontSize(14);
      const currentTheme = useMarkdownStore.getState().editorTheme;
      const currentFontSize = useMarkdownStore.getState().editorFontSize;

      // Create original session with DIFFERENT content and state
      sessionStorage.clear();
      const originalContent = '# Original Document\nThis is the original content';
      const fullState = {
        state: {
          content: originalContent,
          storageKey: 'old-key',
          darkMode: true,
          editorTheme: 'one-dark', // Different from current
          editorFontSize: 16, // Different from current
        },
        version: 3,
      };
      const originalKey = createSnapshot(originalContent, fullState);

      // Create a newer session
      sessionStorage.clear();
      const newerContent = '# Newer Document\nThis is newer content';
      const newerKey = createSnapshot(newerContent);

      // Simulate what SessionHistory.handleLoadSession does
      const sessionData = localStorage.getItem(originalKey);
      expect(sessionData).not.toBeNull();

      const parsed = JSON.parse(sessionData!);
      const restoredContent = parsed.state?.content || parsed.content || '';

      // Verify we extracted the right content
      expect(restoredContent).toBe(originalContent);

      // Create new snapshot with restored content (content-only)
      sessionStorage.clear();
      const restoredKey = createSnapshot(restoredContent);

      // Update store (simulating handleLoadSession)
      useMarkdownStore.getState().updateContent(restoredContent);
      useMarkdownStore.getState().switchStorageKey(restoredKey);

      // Verify store state
      const storeState = useMarkdownStore.getState();
      expect(storeState.content).toBe(originalContent);
      expect(storeState.storageKey).toBe(restoredKey);

      // Verify the restored session in localStorage
      const restoredData = localStorage.getItem(restoredKey);
      expect(restoredData).not.toBeNull();

      const restoredParsed = JSON.parse(restoredData!);
      expect(restoredParsed.state.content).toBe(originalContent);
      expect(restoredParsed.state.storageKey).toBe(restoredKey);

      // The persisted state should have CURRENT editor settings (not from old session)
      // This is CORRECT: we restore content but keep current UI preferences
      expect(restoredParsed.state.editorTheme).toBe(currentTheme);
      expect(restoredParsed.state.editorFontSize).toBe(currentFontSize);

      // Verify these are NOT the old session's settings
      expect(restoredParsed.state.editorTheme).not.toBe(fullState.state.editorTheme);
      expect(restoredParsed.state.editorFontSize).not.toBe(fullState.state.editorFontSize);
    });

    it('store persistence uses correct storage key after restore', () => {
      // Create old session
      sessionStorage.clear();
      const oldContent = '# Old Content';
      const oldKey = createSnapshot(oldContent);

      // Restore it
      const sessionData = localStorage.getItem(oldKey);
      const parsed = JSON.parse(sessionData!);
      const restoredContent = parsed.state?.content || '';

      sessionStorage.clear();
      const newKey = createSnapshot(restoredContent);

      // Update store
      useMarkdownStore.getState().updateContent(restoredContent);
      useMarkdownStore.getState().switchStorageKey(newKey);

      // Verify sessionStorage has the new key locked
      const lockedKey = sessionStorage.getItem('markdown-current-storage-key');
      expect(lockedKey).toBe(newKey);

      // Verify the store's storageKey matches
      expect(useMarkdownStore.getState().storageKey).toBe(newKey);

      // Verify data exists at new key
      const newKeyData = localStorage.getItem(newKey);
      expect(newKeyData).not.toBeNull();

      const newKeyParsed = JSON.parse(newKeyData!);
      expect(newKeyParsed.state.content).toBe(restoredContent);
    });

    it('preserves current editor settings after content-only restore', () => {
      // Set up current editor state
      useMarkdownStore.getState().setEditorTheme('github-light');
      useMarkdownStore.getState().setEditorFontSize(14);
      useMarkdownStore.getState().setEditorWrap(true);
      useMarkdownStore.getState().toggleDarkMode(); // Toggle to ensure it's set

      const currentDarkMode = useMarkdownStore.getState().darkMode;
      const currentTheme = useMarkdownStore.getState().editorTheme;
      const currentFontSize = useMarkdownStore.getState().editorFontSize;
      const currentWrap = useMarkdownStore.getState().editorWrap;

      // Create old session with different settings
      sessionStorage.clear();
      const oldContent = '# Old Document';
      const oldState = {
        state: {
          content: oldContent,
          storageKey: 'old',
          darkMode: !currentDarkMode,
          editorTheme: 'one-dark',
          editorFontSize: 20,
          editorWrap: false,
        },
        version: 1,
      };
      const oldKey = createSnapshot(oldContent, oldState);

      // Restore content only
      const sessionData = localStorage.getItem(oldKey);
      const parsed = JSON.parse(sessionData!);
      const restoredContent = parsed.state?.content || '';

      sessionStorage.clear();
      const newKey = createSnapshot(restoredContent);

      // Update ONLY content (not other settings)
      useMarkdownStore.getState().updateContent(restoredContent);
      useMarkdownStore.getState().switchStorageKey(newKey);

      // Verify content changed
      expect(useMarkdownStore.getState().content).toBe(oldContent);
      expect(useMarkdownStore.getState().storageKey).toBe(newKey);

      // Verify current editor settings are preserved (not restored from old session)
      expect(useMarkdownStore.getState().darkMode).toBe(currentDarkMode);
      expect(useMarkdownStore.getState().editorTheme).toBe(currentTheme);
      expect(useMarkdownStore.getState().editorFontSize).toBe(currentFontSize);
      expect(useMarkdownStore.getState().editorWrap).toBe(currentWrap);
    });

    it('creates new history entry after restore', () => {
      // Create three sessions
      sessionStorage.clear();
      const key1 = createSnapshot('# Session 1');

      sessionStorage.clear();
      const key2 = createSnapshot('# Session 2');

      sessionStorage.clear();
      const key3 = createSnapshot('# Session 3');

      expect(getAllSessions()).toHaveLength(3);

      // Restore session 1
      const sessionData = localStorage.getItem(key1);
      const parsed = JSON.parse(sessionData!);
      const restoredContent = parsed.state?.content || '';

      sessionStorage.clear();
      const restoredKey = createSnapshot(restoredContent);

      useMarkdownStore.getState().updateContent(restoredContent);
      useMarkdownStore.getState().switchStorageKey(restoredKey);

      // Should now have 4 sessions (original 3 + restored)
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(4);

      // Verify all keys exist
      expect(sessions.some(s => s.storageKey === key1)).toBe(true);
      expect(sessions.some(s => s.storageKey === key2)).toBe(true);
      expect(sessions.some(s => s.storageKey === key3)).toBe(true);
      expect(sessions.some(s => s.storageKey === restoredKey)).toBe(true);

      // Restored key should be different from original
      expect(restoredKey).not.toBe(key1);
    });

    it('handles restore of session with missing state gracefully', () => {
      // Create session with content at top level (legacy format)
      const legacyKey = 'markdown-storage-legacy';
      const legacyContent = '# Legacy Content';
      localStorage.setItem(legacyKey, JSON.stringify({
        content: legacyContent, // content at root, not in state
        version: 0,
      }));

      // Try to restore
      const sessionData = localStorage.getItem(legacyKey);
      const parsed = JSON.parse(sessionData!);
      const restoredContent = parsed.state?.content || parsed.content || '';

      // Should fall back to root-level content
      expect(restoredContent).toBe(legacyContent);

      // Create new snapshot
      sessionStorage.clear();
      const newKey = createSnapshot(restoredContent);

      useMarkdownStore.getState().updateContent(restoredContent);
      useMarkdownStore.getState().switchStorageKey(newKey);

      // Verify restore worked
      expect(useMarkdownStore.getState().content).toBe(legacyContent);
      expect(useMarkdownStore.getState().storageKey).toBe(newKey);
    });

    it('handles restore of corrupted session data', () => {
      const corruptedKey = 'markdown-storage-corrupted';
      localStorage.setItem(corruptedKey, 'invalid json {{{');

      // Try to restore
      let error: Error | null = null;
      try {
        const sessionData = localStorage.getItem(corruptedKey);
        const parsed = JSON.parse(sessionData!);
        const restoredContent = parsed.state?.content || parsed.content || '';
      } catch (e) {
        error = e as Error;
      }

      // Should throw JSON parse error
      expect(error).not.toBeNull();
      expect(error?.message).toContain('JSON');
    });

    it('verifies store state persists to correct localStorage key', () => {
      // Create and restore a session
      sessionStorage.clear();
      const originalContent = '# Test Persistence';
      const originalKey = createSnapshot(originalContent);

      const sessionData = localStorage.getItem(originalKey);
      const parsed = JSON.parse(sessionData!);
      const restoredContent = parsed.state?.content || '';

      sessionStorage.clear();
      const newKey = createSnapshot(restoredContent);

      // Update store
      useMarkdownStore.getState().updateContent(restoredContent);
      useMarkdownStore.getState().switchStorageKey(newKey);

      // Make a change to trigger persistence
      const updatedContent = restoredContent + '\n\nNew changes';
      useMarkdownStore.getState().updateContent(updatedContent);

      // Verify the data was persisted to the new key, not the old one
      const newKeyData = localStorage.getItem(newKey);
      expect(newKeyData).not.toBeNull();

      const newKeyParsed = JSON.parse(newKeyData!);
      expect(newKeyParsed.state.content).toBe(updatedContent);
      expect(newKeyParsed.state.storageKey).toBe(newKey);

      // Old key should still have original content (unchanged)
      const oldKeyData = localStorage.getItem(originalKey);
      expect(oldKeyData).not.toBeNull();

      const oldKeyParsed = JSON.parse(oldKeyData!);
      expect(oldKeyParsed.state.content).toBe(originalContent);
    });
  });
});
