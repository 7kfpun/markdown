import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  createSnapshot,
  getAllSessions,
  saveSessionMetadata,
  createSessionMetadata,
  getCurrentSessionMetadata,
  deleteAllSessions,
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

      expect(key1).toMatch(/^markdown-storage-[a-z0-9]+-[a-z0-9]+$/);
      expect(localStorage.getItem(key1)).not.toBeNull();

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].storageKey).toBe(key1);
      expect(sessions[0].title).toBe('Version 1');
    });

    it('creates multiple snapshots with different keys (append-only history)', () => {
      const content1 = '# Version 1';
      const content2 = '# Version 2';
      const content3 = '# Version 3';

      sessionStorage.clear();
      const key1 = createSnapshot(content1);

      sessionStorage.clear();
      const key2 = createSnapshot(content2);

      sessionStorage.clear();
      const key3 = createSnapshot(content3);

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

    it('updates sessionStorage to lock in new key after save', () => {
      sessionStorage.setItem('markdown-current-storage-key', 'old-key');

      const content = '# New Save';
      const newKey = createSnapshot(content);

      expect(sessionStorage.getItem('markdown-current-storage-key')).toBe(newKey);
      expect(sessionStorage.getItem('markdown-current-storage-key')).not.toBe('old-key');
    });

    it('creates Git-like version history timeline', () => {
      const versions = [
        '# Initial commit',
        '# Add features',
        '# Fix bugs',
        '# Release v1.0',
      ];

      const keys: string[] = [];
      versions.forEach((content) => {
        sessionStorage.clear();
        const key = createSnapshot(content);
        keys.push(key);
        // Small delay to ensure different timestamps
      });

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

    it('allows rollback by restoring old snapshot', () => {
      sessionStorage.clear();
      const key1 = createSnapshot('# Version 1\nOld content');

      sessionStorage.clear();
      const key2 = createSnapshot('# Version 2\nNew content');

      // Simulate restore: load old content
      const oldSnapshot = JSON.parse(localStorage.getItem(key1)!);
      expect(oldSnapshot.state.content).toBe('# Version 1\nOld content');

      // User can restore by switching to key1
      sessionStorage.setItem('markdown-current-storage-key', key1);
      expect(getStorageKey()).toBe(key1);

      // Both versions still exist in history
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(2);
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

      // URL hash determines initial storage key
      const key = getStorageKey();
      expect(key).toMatch(/^markdown-storage-/);
      expect(sessionStorage.getItem('markdown-current-storage-key')).toBe(key);
    });

    it('keeps URL hash locked after initial load', () => {
      const content = '# Shared Document';
      const compressed = compressToBase64(content);
      window.location.hash = `#paxo:${compressed}`;

      const key1 = getStorageKey();

      // Clear hash (simulating navigation or cleanup)
      window.location.hash = '';

      // Key should remain locked via sessionStorage
      const key2 = getStorageKey();
      expect(key1).toBe(key2);
    });
  });

  describe('Storage Key Lifecycle', () => {
    it('generates unique key for new session', () => {
      const key = getStorageKey();
      expect(key).toMatch(/^markdown-storage-[a-z0-9]+-[a-z0-9]+$/);
      expect(sessionStorage.getItem('markdown-current-storage-key')).toBe(key);
    });

    it('derives key from URL hash with paxo prefix', () => {
      const content = '# From URL';
      const compressed = compressToBase64(content);
      window.location.hash = `#paxo:${compressed}`;

      const key = getStorageKey();
      expect(key).toMatch(/^markdown-storage-[a-z0-9]+$/);
      expect(key).not.toContain('paxo');
    });

    it('same URL hash produces same storage key', () => {
      const compressed = compressToBase64('# Test');
      window.location.hash = `#paxo:${compressed}`;

      const key1 = getStorageKey();

      sessionStorage.clear();
      window.location.hash = `#paxo:${compressed}`;

      const key2 = getStorageKey();
      expect(key1).toBe(key2);
    });

    it('different URL hash produces different storage keys', () => {
      const compressed1 = compressToBase64('# Content 1');
      const compressed2 = compressToBase64('# Content 2');

      window.location.hash = `#paxo:${compressed1}`;
      const key1 = getStorageKey();

      sessionStorage.clear();
      window.location.hash = `#paxo:${compressed2}`;
      const key2 = getStorageKey();

      expect(key1).not.toBe(key2);
    });

    it('switching storage key maintains separate content', () => {
      sessionStorage.clear();
      const key1 = createSnapshot('# Document A');

      sessionStorage.clear();
      const key2 = createSnapshot('# Document B');

      // Both should exist independently
      const content1 = JSON.parse(localStorage.getItem(key1)!).state.content;
      const content2 = JSON.parse(localStorage.getItem(key2)!).state.content;

      expect(content1).toBe('# Document A');
      expect(content2).toBe('# Document B');
    });
  });

  describe('Session History Operations', () => {
    it('lists all saved versions in chronological order', () => {
      const times: number[] = [];

      for (let i = 1; i <= 5; i++) {
        sessionStorage.clear();
        const before = Date.now();
        createSnapshot(`# Version ${i}`);
        const after = Date.now();
        times.push((before + after) / 2);
      }

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(5);

      // Most recent first
      for (let i = 0; i < sessions.length - 1; i++) {
        expect(sessions[i].lastModified).toBeGreaterThanOrEqual(sessions[i + 1].lastModified);
      }
    });

    it('deletes old versions when exceeding 100 session limit', () => {
      // Create 105 sessions
      for (let i = 0; i < 105; i++) {
        sessionStorage.clear();
        const key = createSnapshot(`# Session ${i}`);
        localStorage.setItem(key, JSON.stringify({ state: { content: `# Session ${i}` } }));
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

    it('allows selective deletion without affecting other sessions', () => {
      sessionStorage.clear();
      const key1 = createSnapshot('# Keep This');

      sessionStorage.clear();
      const key2 = createSnapshot('# Delete This');

      sessionStorage.clear();
      const key3 = createSnapshot('# Also Keep');

      // Delete middle session
      const sessionsObj = JSON.parse(localStorage.getItem('markdown-sessions-metadata')!);
      delete sessionsObj[key2];
      localStorage.setItem('markdown-sessions-metadata', JSON.stringify(sessionsObj));
      localStorage.removeItem(key2);

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions.some(s => s.storageKey === key1)).toBe(true);
      expect(sessions.some(s => s.storageKey === key2)).toBe(false);
      expect(sessions.some(s => s.storageKey === key3)).toBe(true);
    });

    it('updates metadata when restoring old version', () => {
      sessionStorage.clear();
      const oldKey = createSnapshot('# Old Version');
      const oldMetadata = getCurrentSessionMetadata(oldKey)!;

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

    it('maintains session history across tab refreshes (localStorage persistence)', () => {
      sessionStorage.clear();
      const key1 = createSnapshot('# Tab 1 Content');

      sessionStorage.clear();
      const key2 = createSnapshot('# Tab 2 Content');

      // Simulate tab refresh by clearing sessionStorage
      sessionStorage.clear();

      // History should still be accessible from localStorage
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(2);
      expect(localStorage.getItem(key1)).not.toBeNull();
      expect(localStorage.getItem(key2)).not.toBeNull();
    });

    it('clears all history including content', () => {
      sessionStorage.clear();
      const key1 = createSnapshot('# Doc 1');

      sessionStorage.clear();
      const key2 = createSnapshot('# Doc 2');

      sessionStorage.clear();
      const key3 = createSnapshot('# Doc 3');

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

    it('handles rapid sequential saves', () => {
      const keys: string[] = [];

      for (let i = 0; i < 10; i++) {
        sessionStorage.clear();
        const key = createSnapshot(`# Rapid Save ${i}`);
        keys.push(key);
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

      const stored = JSON.parse(localStorage.getItem(key)!);
      expect(stored.state.content).toBe(specialContent);

      const metadata = getCurrentSessionMetadata(key)!;
      expect(metadata.title).toBe('测试 🚀');
    });

    it('handles empty content saves', () => {
      const key = createSnapshot('');

      const stored = JSON.parse(localStorage.getItem(key)!);
      expect(stored.state.content).toBe('');

      const metadata = getCurrentSessionMetadata(key)!;
      expect(metadata.title).toBe('Untitled Document');
    });

    it('prevents storage key collision with hash-based and random keys', () => {
      const keys = new Set<string>();

      // Generate many keys
      for (let i = 0; i < 100; i++) {
        sessionStorage.clear();
        const key = getStorageKey();
        keys.add(key);
      }

      // All should be unique
      expect(keys.size).toBe(100);
    });
  });

  describe('Multi-Tab Scenarios', () => {
    it('allows different tabs with different URL hashes to have separate storage', () => {
      const content1 = '# Tab 1';
      const content2 = '# Tab 2';

      const compressed1 = compressToBase64(content1);
      const compressed2 = compressToBase64(content2);

      // Tab 1
      window.location.hash = `#paxo:${compressed1}`;
      const key1 = getStorageKey();

      // Tab 2 (simulate new tab with different hash)
      sessionStorage.clear();
      window.location.hash = `#paxo:${compressed2}`;
      const key2 = getStorageKey();

      expect(key1).not.toBe(key2);
    });

    it('maintains separate session lock per tab via sessionStorage', () => {
      sessionStorage.clear();
      const key1 = getStorageKey();

      // Simulate new tab with fresh sessionStorage
      sessionStorage.clear();
      const key2 = getStorageKey();

      expect(key1).not.toBe(key2);
    });

    it('shares session history across all tabs via localStorage', () => {
      sessionStorage.clear();
      const key1 = createSnapshot('# Shared History 1');

      // Simulate another tab accessing history
      sessionStorage.clear();
      const sessions = getAllSessions();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].storageKey).toBe(key1);
    });
  });
});
