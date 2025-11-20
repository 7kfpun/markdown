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
      // Create original session
      const originalContent = '# Original Document\nThis is the original content';
      const fullState = {
        state: {
          content: originalContent,
          storageKey: 'old-key',
          darkMode: true,
          editorTheme: 'one-dark',
          editorFontSize: 16,
        },
        version: 3,
      };
      const originalKey = createSnapshot(originalContent, fullState);

      // Simulate what SessionHistory.handleLoadSession does
      const sessionData = localStorage.getItem(originalKey);
      expect(sessionData).not.toBeNull();

      const parsed = JSON.parse(sessionData!);
      const restoredContent = parsed.state?.content || parsed.content || '';

      // Verify we extracted the right content
      expect(restoredContent).toBe(originalContent);

      // Update store (simulating handleLoadSession)
      useMarkdownStore.getState().updateContent(restoredContent);

      // Verify store state
      const storeState = useMarkdownStore.getState();
      expect(storeState.content).toBe(originalContent);
      expect(storeState.storageKey).toBe('markdown-storage-current');
    });

    it('restoring updates content to markdown-storage-current', () => {
      // Create old session
      const oldContent = '# Old Content';
      const oldKey = createSnapshot(oldContent);

      // Restore it
      const sessionData = localStorage.getItem(oldKey);
      const parsed = JSON.parse(sessionData!);
      const restoredContent = parsed.state?.content || '';

      // Update store (restore loads content into current editing session)
      useMarkdownStore.getState().updateContent(restoredContent);

      // Verify storageKey is always markdown-storage-current
      expect(useMarkdownStore.getState().storageKey).toBe('markdown-storage-current');
      expect(useMarkdownStore.getState().content).toBe(restoredContent);
    });

    it('preserves current editor settings after content-only restore', () => {
      // Set up current editor state
      useMarkdownStore.getState().setEditorTheme('github-light');
      useMarkdownStore.getState().setEditorFontSize(14);
      useMarkdownStore.getState().setEditorWrap(true);

      const currentTheme = useMarkdownStore.getState().editorTheme;
      const currentFontSize = useMarkdownStore.getState().editorFontSize;
      const currentWrap = useMarkdownStore.getState().editorWrap;

      // Create old session with different settings
      const oldContent = '# Old Document';
      const oldState = {
        state: {
          content: oldContent,
          storageKey: 'old',
          darkMode: true,
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

      // Update ONLY content (not other settings)
      useMarkdownStore.getState().updateContent(restoredContent);

      // Verify content changed
      expect(useMarkdownStore.getState().content).toBe(oldContent);

      // Verify current editor settings are preserved (not restored from old session)
      expect(useMarkdownStore.getState().editorTheme).toBe(currentTheme);
      expect(useMarkdownStore.getState().editorFontSize).toBe(currentFontSize);
      expect(useMarkdownStore.getState().editorWrap).toBe(currentWrap);
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

      // Update store
      useMarkdownStore.getState().updateContent(restoredContent);

      // Verify restore worked
      expect(useMarkdownStore.getState().content).toBe(legacyContent);
      expect(useMarkdownStore.getState().storageKey).toBe('markdown-storage-current');
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

    it('verifies snapshots are immutable once created', () => {
      // Create a snapshot
      const originalContent = '# Test Persistence';
      const originalKey = createSnapshot(originalContent);

      // Verify snapshot exists
      const snapshotData = localStorage.getItem(originalKey);
      expect(snapshotData).not.toBeNull();

      const parsed = JSON.parse(snapshotData!);
      expect(parsed.state.content).toBe(originalContent);

      // Update current editing content
      const updatedContent = originalContent + '\n\nNew changes';
      useMarkdownStore.getState().updateContent(updatedContent);

      // Verify snapshot remains unchanged (immutable)
      const snapshotDataAfter = localStorage.getItem(originalKey);
      const parsedAfter = JSON.parse(snapshotDataAfter!);
      expect(parsedAfter.state.content).toBe(originalContent);

      // Current editing uses markdown-storage-current
      expect(useMarkdownStore.getState().storageKey).toBe('markdown-storage-current');
    });
  });
});
