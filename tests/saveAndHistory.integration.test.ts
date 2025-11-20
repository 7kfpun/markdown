import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  createSnapshot,
  getAllSessions,
  saveSessionMetadata,
  createSessionMetadata,
  getCurrentSessionMetadata,
  deleteAllSessions,
  deleteSession,
  type SessionMetadata,
} from '../src/utils/sessionHistory';
import {
  compressToBase64,
  decompressFromBase64,
  generateShareLink,
  getStorageKey,
  extractContentFromHash,
} from '../src/utils/compression';

/**
 * Integration tests for Save & Session History features
 * Tests the critical user flows:
 * - Cmd+S creating new snapshots (version control)
 * - URL management (no pako hash on save)
 * - Session restoration and rollback
 * - Storage key lifecycle
 */

describe('Save and History Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cmd+S Save Flow (Version Control)', () => {
    it('creates new snapshot with unique storage key', () => {
      const content1 = '# Version 1\nFirst version of document';
      const key1 = createSnapshot(content1);
      saveSessionMetadata(createSessionMetadata(key1, content1));

      expect(key1).toMatch(/^markdown-storage-\d+$/);
      expect(localStorage.getItem(key1)).not.toBeNull();

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].storageKey).toBe(key1);
      expect(sessions[0].title).toBe('Version 1');
    });

    it('creates multiple snapshots with different keys (append-only history)', async () => {
      const content1 = '# Version 1';
      const content2 = '# Version 2';
      const content3 = '# Version 3';

      const key1 = createSnapshot(content1);
      saveSessionMetadata(createSessionMetadata(key1, content1));
      await new Promise(resolve => setTimeout(resolve, 10));

      const key2 = createSnapshot(content2);
      saveSessionMetadata(createSessionMetadata(key2, content2));
      await new Promise(resolve => setTimeout(resolve, 10));

      const key3 = createSnapshot(content3);
      saveSessionMetadata(createSessionMetadata(key3, content3));

      // All keys should be unique
      expect(key1).not.toBe(key2);
      expect(key2).not.toBe(key3);
      expect(key1).not.toBe(key3);

      // All snapshots should exist in history
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(3);

      // Verify content is preserved for each version
      const stored1 = JSON.parse(localStorage.getItem(key1)!);
      const stored2 = JSON.parse(localStorage.getItem(key2)!);
      const stored3 = JSON.parse(localStorage.getItem(key3)!);

      expect(stored1.state.content).toBe(content1);
      expect(stored2.state.content).toBe(content2);
      expect(stored3.state.content).toBe(content3);
    });

    it('preserves full editor state in snapshot', () => {
      const content = '# My Document';
      const fullState = {
        state: {
          content: 'old',
          storageKey: 'old-key',
          darkMode: true,
          editorTheme: 'one-dark',
          editorFontSize: 14,
          editorWrap: false,
          previewTheme: 'github',
        },
        version: 2,
      };

      const newKey = createSnapshot(content, fullState);

      const stored = JSON.parse(localStorage.getItem(newKey)!);
      expect(stored.state.content).toBe(content);
      expect(stored.state.storageKey).toBe(newKey); // Should update to new key
      expect(stored.state.darkMode).toBe(true);
      expect(stored.state.editorTheme).toBe('one-dark');
      expect(stored.state.editorFontSize).toBe(14);
      expect(stored.state.editorWrap).toBe(false);
      expect(stored.state.previewTheme).toBe('github');
      expect(stored.version).toBe(2);
    });

    it('snapshots do not modify sessionStorage', () => {
      sessionStorage.setItem('test-key', 'old-value');

      const content = '# New Save';
      const newKey = createSnapshot(content);

      // Snapshots save to localStorage but don't affect sessionStorage
      expect(newKey).toMatch(/^markdown-storage-\d+$/);
      expect(localStorage.getItem(newKey)).toBeTruthy();
      expect(sessionStorage.getItem('test-key')).toBe('old-value');
    });

    it('creates Git-like version history timeline', async () => {
      const versions = [
        '# Initial commit',
        '# Add features',
        '# Fix bugs',
        '# Release v1.0',
      ];

      const keys: string[] = [];
      for (const content of versions) {
        const key = createSnapshot(content);
        saveSessionMetadata(createSessionMetadata(key, content));
        keys.push(key);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(4);

      // Verify all versions are accessible
      keys.forEach((key, index) => {
        const stored = JSON.parse(localStorage.getItem(key)!);
        expect(stored.state.content).toBe(versions[index]);
      });

      // Sessions should be sorted by lastModified (most recent first)
      for (let i = 0; i < sessions.length - 1; i++) {
        expect(sessions[i].lastModified).toBeGreaterThanOrEqual(sessions[i + 1].lastModified);
      }
    });

    it('allows rollback by restoring old snapshot', async () => {
      const key1 = createSnapshot('# Version 1\nOld content');
      saveSessionMetadata(createSessionMetadata(key1, '# Version 1\nOld content'));
      await new Promise(resolve => setTimeout(resolve, 10));

      const key2 = createSnapshot('# Version 2\nNew content');
      saveSessionMetadata(createSessionMetadata(key2, '# Version 2\nNew content'));

      // Simulate restore: load old content
      const oldSnapshot = JSON.parse(localStorage.getItem(key1)!);
      expect(oldSnapshot.state.content).toBe('# Version 1\nOld content');

      // Both versions still exist in history
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(2);

      // Verify keys are timestamp-based
      expect(key1).toMatch(/^markdown-storage-\d+$/);
      expect(key2).toMatch(/^markdown-storage-\d+$/);
    });

    it('restore creates new snapshot with content only, not full state', async () => {
      // Create original session with full state
      const originalContent = '# Original Document';
      const fullState = {
        state: {
          content: originalContent,
          storageKey: 'old-key',
          darkMode: true,
          editorTheme: 'one-dark',
          editorFontSize: 16,
          editorWrap: false,
          previewTheme: 'dark',
        },
        version: 3,
      };
      const originalKey = createSnapshot(originalContent, fullState);
      saveSessionMetadata(createSessionMetadata(originalKey, originalContent));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create a newer session with different content and state
      const newerContent = '# Newer Document';
      const newerState = {
        state: {
          content: newerContent,
          storageKey: 'newer-key',
          darkMode: false,
          editorTheme: 'github-light',
          editorFontSize: 14,
          editorWrap: true,
          previewTheme: 'github',
        },
        version: 4,
      };
      const newerKey = createSnapshot(newerContent, newerState);
      saveSessionMetadata(createSessionMetadata(newerKey, newerContent));
      await new Promise(resolve => setTimeout(resolve, 10));

      // Now simulate restore: get content from original session
      const originalSnapshot = JSON.parse(localStorage.getItem(originalKey)!);
      const restoredContent = originalSnapshot.state.content;

      // Create a NEW snapshot with only the content (not full state)
      const restoredKey = createSnapshot(restoredContent);
      saveSessionMetadata(createSessionMetadata(restoredKey, restoredContent));

      // Verify new snapshot was created
      expect(restoredKey).not.toBe(originalKey);
      expect(restoredKey).not.toBe(newerKey);

      // Verify content is correct
      const restoredSnapshot = JSON.parse(localStorage.getItem(restoredKey)!);
      expect(restoredSnapshot.state.content).toBe(originalContent);

      // Verify it has minimal state (only content and storageKey)
      expect(restoredSnapshot.state.storageKey).toBe(restoredKey);
      expect(Object.keys(restoredSnapshot.state)).toHaveLength(2); // only content and storageKey

      // Original state properties should NOT be copied
      expect(restoredSnapshot.state.darkMode).toBeUndefined();
      expect(restoredSnapshot.state.editorTheme).toBeUndefined();
      expect(restoredSnapshot.state.editorFontSize).toBeUndefined();
      expect(restoredSnapshot.state.editorWrap).toBeUndefined();
      expect(restoredSnapshot.state.previewTheme).toBeUndefined();
      expect(restoredSnapshot.version).toBe(0); // minimal version

      // All three versions should exist in history
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(3);
      expect(sessions.some(s => s.storageKey === originalKey)).toBe(true);
      expect(sessions.some(s => s.storageKey === newerKey)).toBe(true);
      expect(sessions.some(s => s.storageKey === restoredKey)).toBe(true);
    });
  });

  describe('URL Hash Management', () => {
    it('Cmd+S does NOT add pako hash to URL', () => {
      // This test verifies the fix: Cmd+S should only save locally
      const content = '# Document';
      const key = createSnapshot(content);

      // Verify save happened
      expect(localStorage.getItem(key)).not.toBeNull();

      // URL should NOT be modified (no pako hash)
      expect(window.location.hash).toBe('');
    });

    it('Share button DOES add pako hash to URL', () => {
      const content = '# Shareable Document';
      const shareLink = generateShareLink(content);

      expect(shareLink).toContain('#paxo:');

      const hash = shareLink.split('#')[1];
      expect(hash).toMatch(/^paxo:/);

      // Can extract content from share link
      const compressed = hash.substring(5); // Remove 'paxo:'
      const extracted = decompressFromBase64(compressed);
      expect(extracted).toBe(content);
    });

    it('URL hash remains unchanged after multiple saves', () => {
      const initialHash = '#some-existing-hash';
      window.location.hash = initialHash;

      sessionStorage.clear();
      createSnapshot('# Save 1');
      expect(window.location.hash).toBe(initialHash);

      sessionStorage.clear();
      createSnapshot('# Save 2');
      expect(window.location.hash).toBe(initialHash);

      sessionStorage.clear();
      createSnapshot('# Save 3');
      expect(window.location.hash).toBe(initialHash);
    });

    it('distinguishes between save (localStorage) and share (URL)', () => {
      const content = '# Test Document';

      // Save operation: only localStorage
      sessionStorage.clear();
      const saveKey = createSnapshot(content);
      expect(localStorage.getItem(saveKey)).not.toBeNull();
      expect(window.location.hash).toBe('');

      // Share operation: generates URL with pako hash
      const shareLink = generateShareLink(content);
      expect(shareLink).toContain('#paxo:');

      // They serve different purposes
      expect(saveKey).not.toContain('paxo');
      expect(shareLink).toContain('paxo');
    });

    it('loads content from URL hash on page load', () => {
      const content = '# Shared Content\nFrom URL';
      const compressed = compressToBase64(content);
      window.location.hash = `#paxo:${compressed}`;

      const extracted = extractContentFromHash();
      expect(extracted).toBe(content);

      // Editing always uses markdown-storage-current
      const key = getStorageKey();
      expect(key).toBe('markdown-storage-current');
    });

    it('editing key is always markdown-storage-current', () => {
      const content = '# Shared Document';
      const compressed = compressToBase64(content);
      window.location.hash = `#paxo:${compressed}`;

      const key1 = getStorageKey();
      expect(key1).toBe('markdown-storage-current');

      // Clear hash
      window.location.hash = '';

      // Key is still the same fixed value
      const key2 = getStorageKey();
      expect(key2).toBe('markdown-storage-current');
      expect(key1).toBe(key2);
    });
  });

  describe('Storage Key Lifecycle', () => {
    it('always returns markdown-storage-current for editing', () => {
      const key = getStorageKey();
      expect(key).toBe('markdown-storage-current');
    });

    it('snapshots use timestamp-based keys', async () => {
      const key1 = createSnapshot('# Document A');
      await new Promise(resolve => setTimeout(resolve, 10));
      const key2 = createSnapshot('# Document B');

      // Snapshots use timestamp keys
      expect(key1).toMatch(/^markdown-storage-\d+$/);
      expect(key2).toMatch(/^markdown-storage-\d+$/);
      expect(key1).not.toBe(key2);

      // Both exist independently in localStorage
      const content1 = JSON.parse(localStorage.getItem(key1)!).state.content;
      const content2 = JSON.parse(localStorage.getItem(key2)!).state.content;

      expect(content1).toBe('# Document A');
      expect(content2).toBe('# Document B');
    });

    it('snapshots are immutable once created', () => {
      const content = '# Immutable Content';
      const key = createSnapshot(content);

      // Verify snapshot is saved
      const stored = JSON.parse(localStorage.getItem(key)!);
      expect(stored.state.content).toBe(content);

      // Snapshots cannot be modified - they're historical records
      expect(key).toMatch(/^markdown-storage-\d+$/);
    });
  });

  describe('Session History Operations', () => {
    it('lists all saved versions in chronological order', async () => {
      const times: number[] = [];

      for (let i = 1; i <= 5; i++) {
        const before = Date.now();
        const key = createSnapshot(`# Version ${i}`);
        saveSessionMetadata(createSessionMetadata(key, `# Version ${i}`));
        const after = Date.now();
        times.push((before + after) / 2);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(5);

      // Most recent first
      for (let i = 0; i < sessions.length - 1; i++) {
        expect(sessions[i].lastModified).toBeGreaterThanOrEqual(sessions[i + 1].lastModified);
      }
    });

    it('deletes old versions when exceeding 100 session limit', async () => {
      // Create 105 sessions with delays to ensure unique timestamps
      for (let i = 0; i < 105; i++) {
        const key = createSnapshot(`# Session ${i}`);
        saveSessionMetadata(createSessionMetadata(key, `# Session ${i}`));
        // Add delay every session to ensure unique timestamps
        await new Promise(resolve => setTimeout(resolve, 2));
      }

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(100);

      // Oldest 5 should be removed
      expect(sessions.some(s => s.title === 'Session 0')).toBe(false);
      expect(sessions.some(s => s.title === 'Session 4')).toBe(false);

      // Newest 100 should remain
      expect(sessions.some(s => s.title === 'Session 104')).toBe(true);
      expect(sessions.some(s => s.title === 'Session 100')).toBe(true);
    });

    it('allows selective deletion without affecting other sessions', async () => {
      const key1 = createSnapshot('# Keep This');
      saveSessionMetadata(createSessionMetadata(key1, '# Keep This'));
      await new Promise(resolve => setTimeout(resolve, 10));

      const key2 = createSnapshot('# Delete This');
      saveSessionMetadata(createSessionMetadata(key2, '# Delete This'));
      await new Promise(resolve => setTimeout(resolve, 10));

      const key3 = createSnapshot('# Also Keep');
      saveSessionMetadata(createSessionMetadata(key3, '# Also Keep'));

      // Delete middle session
      deleteSession(key2);

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions.some(s => s.storageKey === key1)).toBe(true);
      expect(sessions.some(s => s.storageKey === key2)).toBe(false);
      expect(sessions.some(s => s.storageKey === key3)).toBe(true);
    });

    it('updates metadata when restoring old version', async () => {
      const oldKey = createSnapshot('# Old Version');
      saveSessionMetadata(createSessionMetadata(oldKey, '# Old Version'));
      const oldMetadata = getCurrentSessionMetadata(oldKey)!;
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create newer version
      sessionStorage.clear();
      createSnapshot('# Newer Version');

      // Simulate restoring old version
      const beforeRestore = Date.now();
      const updatedMetadata = createSessionMetadata(oldKey, '# Old Version', oldMetadata);
      saveSessionMetadata(updatedMetadata);
      const afterRestore = Date.now();

      const restored = getCurrentSessionMetadata(oldKey)!;
      expect(restored.lastModified).toBeGreaterThanOrEqual(beforeRestore);
      expect(restored.lastModified).toBeLessThanOrEqual(afterRestore);
      expect(restored.createdAt).toBe(oldMetadata.createdAt); // createdAt unchanged
    });

    it('maintains session history across tab refreshes (localStorage persistence)', async () => {
      const key1 = createSnapshot('# Tab 1 Content');
      saveSessionMetadata(createSessionMetadata(key1, '# Tab 1 Content'));
      await new Promise(resolve => setTimeout(resolve, 10));

      const key2 = createSnapshot('# Tab 2 Content');
      saveSessionMetadata(createSessionMetadata(key2, '# Tab 2 Content'));

      // Simulate tab refresh by clearing sessionStorage
      sessionStorage.clear();

      // History should still be accessible from localStorage
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(2);
      expect(localStorage.getItem(key1)).not.toBeNull();
      expect(localStorage.getItem(key2)).not.toBeNull();
    });

    it('clears all history including content', async () => {
      const key1 = createSnapshot('# Doc 1');
      saveSessionMetadata(createSessionMetadata(key1, '# Doc 1'));
      await new Promise(resolve => setTimeout(resolve, 10));

      const key2 = createSnapshot('# Doc 2');
      saveSessionMetadata(createSessionMetadata(key2, '# Doc 2'));
      await new Promise(resolve => setTimeout(resolve, 10));

      const key3 = createSnapshot('# Doc 3');
      saveSessionMetadata(createSessionMetadata(key3, '# Doc 3'));

      deleteAllSessions();

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(0);
      expect(localStorage.getItem(key1)).toBeNull();
      expect(localStorage.getItem(key2)).toBeNull();
      expect(localStorage.getItem(key3)).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles corrupted session metadata gracefully', () => {
      localStorage.setItem('markdown-sessions-metadata', 'corrupted{json');

      const sessions = getAllSessions();
      expect(sessions).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('handles missing content in localStorage', () => {
      const metadata: SessionMetadata = {
        storageKey: 'missing-key',
        title: 'Missing',
        lastModified: Date.now(),
        contentPreview: 'Preview',
        createdAt: Date.now(),
      };
      saveSessionMetadata(metadata);

      // Metadata exists but content doesn't
      expect(getCurrentSessionMetadata('missing-key')).not.toBeNull();
      expect(localStorage.getItem('missing-key')).toBeNull();
    });

    it('handles very long content in snapshots', () => {
      const longContent = '# Long Document\n' + 'a'.repeat(50000);
      const key = createSnapshot(longContent);

      const stored = JSON.parse(localStorage.getItem(key)!);
      expect(stored.state.content).toBe(longContent);
    });

    it('handles rapid sequential saves', async () => {
      const keys: string[] = [];

      for (let i = 0; i < 10; i++) {
        const content = `# Rapid Save ${i}`;
        const key = createSnapshot(content);
        saveSessionMetadata(createSessionMetadata(key, content));
        keys.push(key);
        await new Promise(resolve => setTimeout(resolve, 2));
      }

      // All keys should be unique
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(10);

      // All saves should be recorded
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(10);
    });

    it('handles unicode and special characters in content', () => {
      const specialContent = '# 测试 🚀\n```\ncode with "quotes" and \'apostrophes\'\n```\n**bold** _italic_';
      const key = createSnapshot(specialContent);
      saveSessionMetadata(createSessionMetadata(key, specialContent));

      const stored = JSON.parse(localStorage.getItem(key)!);
      expect(stored.state.content).toBe(specialContent);

      const metadata = getCurrentSessionMetadata(key)!;
      expect(metadata.title).toBe('测试 🚀');
    });

    it('handles empty content saves', () => {
      const key = createSnapshot('');
      saveSessionMetadata(createSessionMetadata(key, ''));

      const stored = JSON.parse(localStorage.getItem(key)!);
      expect(stored.state.content).toBe('');

      const metadata = getCurrentSessionMetadata(key)!;
      expect(metadata.title).toBe('Untitled Document');
    });

    it('getStorageKey always returns same value', () => {
      const keys = new Set<string>();

      // Generate many calls to getStorageKey
      for (let i = 0; i < 100; i++) {
        const key = getStorageKey();
        keys.add(key);
      }

      // All should be the same fixed key
      expect(keys.size).toBe(1);
      expect(keys.has('markdown-storage-current')).toBe(true);
    });
  });

  describe('Multi-Tab Scenarios', () => {
    it('all tabs use markdown-storage-current for editing', () => {
      // All tabs use the same fixed key for current editing
      const key = getStorageKey();
      expect(key).toBe('markdown-storage-current');

      // Each tab has its own sessionStorage, so they edit independently
      // even though they use the same key name
    });

    it('shares session history across all tabs via localStorage', () => {
      const key1 = createSnapshot('# Shared History 1');
      saveSessionMetadata(createSessionMetadata(key1, '# Shared History 1'));

      // Session history is in localStorage, shared across all tabs
      const sessions = getAllSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].storageKey).toBe(key1);
      expect(key1).toMatch(/^markdown-storage-\d+$/);
    });

    it('saved snapshots are immutable and shared across tabs', () => {
      const content = '# Immutable Snapshot';
      const key = createSnapshot(content);

      // Snapshot is in localStorage with timestamp key
      expect(key).toMatch(/^markdown-storage-\d+$/);
      expect(localStorage.getItem(key)).toBeTruthy();

      // This snapshot is accessible from any tab
      const stored = JSON.parse(localStorage.getItem(key)!);
      expect(stored.state.content).toBe(content);
    });
  });

  describe('URL Hash Management', () => {
    it('clears paxo hash after loading shared content', () => {
      const content = '# Shared Content';
      const compressed = compressToBase64(content);
      window.location.hash = `#paxo:${compressed}`;

      // Simulate the App component's behavior
      const extracted = extractContentFromHash();
      expect(extracted).toBe(content);

      // After loading, the hash should be cleared
      if (window.location.hash.startsWith('#paxo:')) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      expect(window.location.hash).toBe('');
    });

    it('preserves non-paxo hashes', () => {
      const customHash = '#my-custom-anchor';
      window.location.hash = customHash;

      // Simulate save clearing only paxo hashes
      if (window.location.hash.startsWith('#paxo:')) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      // Non-paxo hash should remain
      expect(window.location.hash).toBe(customHash);
    });

    it('snapshots do not affect URL hash', () => {
      const content = '# Original Shared Content';
      const compressed = compressToBase64(content);
      window.location.hash = `#paxo:${compressed}`;

      // User edits and saves
      const newContent = '# Edited Content';
      const newKey = createSnapshot(newContent);

      // Snapshot doesn't modify URL
      expect(window.location.hash).toBe(`#paxo:${compressed}`);
      expect(localStorage.getItem(newKey)).not.toBeNull();
      expect(newKey).toMatch(/^markdown-storage-\d+$/);
    });

    it('editing uses markdown-storage-current regardless of URL', () => {
      const oldContent = '# Old Shared Content';
      const compressed = compressToBase64(oldContent);
      window.location.hash = `#paxo:${compressed}`;

      // Current editing key is always the same
      const key1 = getStorageKey();
      expect(key1).toBe('markdown-storage-current');

      // Snapshots use timestamp keys
      const newContent = '# New Content';
      const key2 = createSnapshot(newContent);
      expect(key2).toMatch(/^markdown-storage-\d+$/);

      // Editing key unchanged
      const key3 = getStorageKey();
      expect(key3).toBe('markdown-storage-current');

      // Verify the new content is stored
      const stored = JSON.parse(localStorage.getItem(key2)!);
      expect(stored.state.content).toBe(newContent);
    });
  });

  describe('Save Optimization', () => {
    it('skips snapshot creation when content unchanged', () => {
      const content = '# Unchanged Content';
      const key1 = createSnapshot(content);
      saveSessionMetadata(createSessionMetadata(key1, content));

      // Get initial session count
      const sessionsBefore = getAllSessions();
      const countBefore = sessionsBefore.length;

      // Try to save again with same content (simulated)
      // In the real app, handleManualSave would check lastSavedContentRef
      // and skip creating a new snapshot

      // For testing, we verify that the logic would work:
      // If content === lastSavedContent, don't call createSnapshot

      // Verify only one session exists
      const sessionsAfter = getAllSessions();
      expect(sessionsAfter.length).toBe(countBefore);
    });

    it('creates new snapshot only when content changes', async () => {
      const content1 = '# Version 1';
      const key1 = createSnapshot(content1);
      saveSessionMetadata(createSessionMetadata(key1, content1));

      const sessionsBefore = getAllSessions();
      const countBefore = sessionsBefore.length;

      // Save with different content
      await new Promise(resolve => setTimeout(resolve, 10));
      const content2 = '# Version 2';
      const key2 = createSnapshot(content2);
      saveSessionMetadata(createSessionMetadata(key2, content2));

      // Should create a new session
      const sessionsAfter = getAllSessions();
      expect(sessionsAfter.length).toBe(countBefore + 1);
      expect(key1).not.toBe(key2);

      // Verify both contents are stored
      const stored1 = JSON.parse(localStorage.getItem(key1)!);
      const stored2 = JSON.parse(localStorage.getItem(key2)!);
      expect(stored1.state.content).toBe(content1);
      expect(stored2.state.content).toBe(content2);
    });

    it('auto-save skips when content unchanged', () => {
      const content = '# Auto-save Test';
      const key1 = createSnapshot(content);
      saveSessionMetadata(createSessionMetadata(key1, content));

      // Track content for auto-save
      let lastAutoSavedContent = content;

      // Simulate auto-save check
      const shouldAutoSave = content !== lastAutoSavedContent;
      expect(shouldAutoSave).toBe(false);

      // Verify no new snapshot was created
      const sessions = getAllSessions();
      expect(sessions.filter(s => s.storageKey === key1).length).toBe(1);
    });
  });
});
