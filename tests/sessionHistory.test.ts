import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  getAllSessions,
  saveSessionMetadata,
  updateSessionMetadata,
  deleteSession,
  deleteAllSessions,
  renameSession,
  getCurrentSessionMetadata,
  createSessionMetadata,
  createSnapshot,
  formatLastModified,
  startAutoSave,
  stopAutoSave,
  type SessionMetadata,
} from '../src/utils/sessionHistory';

describe('sessionHistory utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    stopAutoSave();
  });

  describe('getAllSessions', () => {
    it('returns empty array when no sessions exist', () => {
      const sessions = getAllSessions();
      expect(sessions).toEqual([]);
    });

    it('accepts array format (new format)', () => {
      // Arrays are now the correct format
      const arrayData = [
        { storageKey: 'key1', title: 'Doc 1', lastModified: 1000, contentPreview: '', createdAt: 1000 },
        { storageKey: 'key2', title: 'Doc 2', lastModified: 2000, contentPreview: '', createdAt: 2000 },
      ];
      localStorage.setItem('markdown-sessions-metadata', JSON.stringify(arrayData));

      const sessions = getAllSessions();

      // Should return the array as-is
      expect(sessions).toEqual(arrayData);
    });

    it('handles corrupted or invalid data gracefully', () => {
      // Store corrupted data
      localStorage.setItem('markdown-sessions-metadata', 'invalid json {{{');
      expect(getAllSessions()).toEqual([]);

      // Store non-array types
      localStorage.setItem('markdown-sessions-metadata', JSON.stringify(null));
      expect(getAllSessions()).toEqual([]);
    });

    it('returns all sessions from localStorage', () => {
      const mockSessionsObj: Record<string, SessionMetadata> = {
        key1: {
          storageKey: 'key1',
          title: 'Document 1',
          lastModified: 2000,
          contentPreview: 'Preview 1',
          createdAt: 2000,
        },
        key2: {
          storageKey: 'key2',
          title: 'Document 2',
          lastModified: 1000,
          contentPreview: 'Preview 2',
          createdAt: 1000,
        },
      };
      localStorage.setItem('markdown-sessions-metadata', JSON.stringify(mockSessionsObj));

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(2);
      // Sorted by lastModified descending, so key1 (2000) should be first
      expect(sessions[0].title).toBe('Document 1');
      expect(sessions[1].title).toBe('Document 2');
    });

    it('clears corrupted JSON and returns empty array', () => {
      localStorage.setItem('markdown-sessions-metadata', 'invalid json');
      const sessions = getAllSessions();
      expect(sessions).toEqual([]);
      expect(console.error).toHaveBeenCalled();

      // Should have cleared the corrupted data
      const stored = localStorage.getItem('markdown-sessions-metadata');
      expect(JSON.parse(stored!)).toEqual([]);
    });
  });

  describe('saveSessionMetadata', () => {
    it('saves new session metadata', () => {
      const metadata: SessionMetadata = {
        storageKey: 'test-key',
        title: 'Test Document',
        lastModified: Date.now(),
        contentPreview: 'Test preview',
        createdAt: Date.now(),
      };

      saveSessionMetadata(metadata);

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].storageKey).toBe('test-key');
      expect(sessions[0].title).toBe('Test Document');
    });

    it('updates existing session metadata', () => {
      const original: SessionMetadata = {
        storageKey: 'key1',
        title: 'Original',
        lastModified: 1000,
        contentPreview: 'Original preview',
        createdAt: 1000,
      };
      saveSessionMetadata(original);

      const updated: SessionMetadata = {
        ...original,
        title: 'Updated',
        lastModified: 2000,
      };
      saveSessionMetadata(updated);

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].title).toBe('Updated');
      expect(sessions[0].lastModified).toBe(2000);
    });

    it('sorts sessions by lastModified (most recent first)', () => {
      const old: SessionMetadata = {
        storageKey: 'old',
        title: 'Old',
        lastModified: 1000,
        contentPreview: '',
        createdAt: 1000,
      };
      const recent: SessionMetadata = {
        storageKey: 'recent',
        title: 'Recent',
        lastModified: 3000,
        contentPreview: '',
        createdAt: 3000,
      };
      const middle: SessionMetadata = {
        storageKey: 'middle',
        title: 'Middle',
        lastModified: 2000,
        contentPreview: '',
        createdAt: 2000,
      };

      saveSessionMetadata(old);
      saveSessionMetadata(middle);
      saveSessionMetadata(recent);

      const sessions = getAllSessions();
      expect(sessions[0].storageKey).toBe('recent');
      expect(sessions[1].storageKey).toBe('middle');
      expect(sessions[2].storageKey).toBe('old');
    });

    it('limits sessions to 100 items and removes oldest', () => {
      // Create 102 sessions
      for (let i = 0; i < 102; i++) {
        const metadata: SessionMetadata = {
          storageKey: `key-${i}`,
          title: `Session ${i}`,
          lastModified: 1000 + i, // Increasing timestamps
          contentPreview: `Preview ${i}`,
          createdAt: 1000 + i,
        };
        localStorage.setItem(`key-${i}`, `content-${i}`);
        saveSessionMetadata(metadata);
      }

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(100);

      // Should keep the 100 most recent (key-2 through key-101)
      expect(sessions.some((s) => s.storageKey === 'key-0')).toBe(false);
      expect(sessions.some((s) => s.storageKey === 'key-1')).toBe(false);
      expect(sessions.some((s) => s.storageKey === 'key-2')).toBe(true);
      expect(sessions.some((s) => s.storageKey === 'key-101')).toBe(true);

      // Oldest sessions' content should also be removed from localStorage
      expect(localStorage.getItem('key-0')).toBeNull();
      expect(localStorage.getItem('key-1')).toBeNull();
      expect(localStorage.getItem('key-2')).not.toBeNull();
    });
  });

  describe('updateSessionMetadata', () => {
    it('updates existing session with partial data', () => {
      const metadata: SessionMetadata = {
        storageKey: 'key1',
        title: 'Original Title',
        lastModified: 1000,
        contentPreview: 'Original preview',
        createdAt: 1000,
      };
      saveSessionMetadata(metadata);

      updateSessionMetadata('key1', { title: 'New Title' });

      const sessions = getAllSessions();
      expect(sessions[0].title).toBe('New Title');
      expect(sessions[0].contentPreview).toBe('Original preview');
    });

    it('does nothing if session does not exist', () => {
      updateSessionMetadata('nonexistent', { title: 'New' });
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(0);
    });
  });

  describe('deleteSession', () => {
    it('deletes session metadata and content', () => {
      const metadata: SessionMetadata = {
        storageKey: 'test-key',
        title: 'Test',
        lastModified: Date.now(),
        contentPreview: 'Preview',
        createdAt: Date.now(),
      };
      saveSessionMetadata(metadata);
      localStorage.setItem('test-key', 'some content');

      deleteSession('test-key');

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(0);
      expect(localStorage.getItem('test-key')).toBeNull();
    });

  });

  describe('deleteAllSessions', () => {
    it('deletes all session metadata and content', () => {
      const metadata1: SessionMetadata = {
        storageKey: 'key1',
        title: 'Session 1',
        lastModified: Date.now(),
        contentPreview: 'Preview 1',
        createdAt: Date.now(),
      };
      const metadata2: SessionMetadata = {
        storageKey: 'key2',
        title: 'Session 2',
        lastModified: Date.now(),
        contentPreview: 'Preview 2',
        createdAt: Date.now(),
      };

      saveSessionMetadata(metadata1);
      saveSessionMetadata(metadata2);
      localStorage.setItem('key1', 'content 1');
      localStorage.setItem('key2', 'content 2');

      deleteAllSessions();

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(0);
      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
    });

    it('preserves other localStorage items', () => {
      const metadata: SessionMetadata = {
        storageKey: 'session-key',
        title: 'Session',
        lastModified: Date.now(),
        contentPreview: 'Preview',
        createdAt: Date.now(),
      };
      saveSessionMetadata(metadata);
      localStorage.setItem('session-key', 'session content');
      localStorage.setItem('other-key', 'other content');

      deleteAllSessions();

      expect(localStorage.getItem('session-key')).toBeNull();
      expect(localStorage.getItem('other-key')).toBe('other content');
    });
  });

  describe('renameSession', () => {
    it('renames session and updates lastModified', () => {
      const originalTime = 1000;
      const metadata: SessionMetadata = {
        storageKey: 'key1',
        title: 'Original Title',
        lastModified: originalTime,
        contentPreview: 'Preview',
        createdAt: originalTime,
      };
      saveSessionMetadata(metadata);

      const beforeRename = Date.now();
      renameSession('key1', 'New Title');
      const afterRename = Date.now();

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].title).toBe('New Title');
      expect(sessions[0].lastModified).toBeGreaterThanOrEqual(beforeRename);
      expect(sessions[0].lastModified).toBeLessThanOrEqual(afterRename);
      expect(sessions[0].createdAt).toBe(originalTime);
    });

    it('handles renaming non-existent session gracefully', () => {
      expect(() => renameSession('nonexistent', 'New Title')).not.toThrow();
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(0);
    });

    it('preserves other session properties', () => {
      const metadata: SessionMetadata = {
        storageKey: 'key1',
        title: 'Original',
        lastModified: 1000,
        contentPreview: 'Original preview',
        createdAt: 500,
      };
      saveSessionMetadata(metadata);

      renameSession('key1', 'Renamed');

      const sessions = getAllSessions();
      expect(sessions[0].storageKey).toBe('key1');
      expect(sessions[0].contentPreview).toBe('Original preview');
      expect(sessions[0].createdAt).toBe(500);
    });
  });

  describe('createSnapshot', () => {
    it('creates new snapshot with timestamp-based key', () => {
      const content = '# Test Content\nSome text here';
      const newKey = createSnapshot(content);

      expect(newKey).toMatch(/^markdown-storage-\d+$/);
    });

    it('saves snapshot content to localStorage', () => {
      const content = '# Snapshot Test';
      const newKey = createSnapshot(content);

      const stored = localStorage.getItem(newKey);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.content).toBe(content);
      expect(parsed.state.storageKey).toBe(newKey);
    });

    it('creates metadata for snapshot', () => {
      const content = '# My Snapshot\nWith some content';
      const newKey = createSnapshot(content);
      const metadata = createSessionMetadata(newKey, content);
      saveSessionMetadata(metadata);

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].storageKey).toBe(newKey);
      expect(sessions[0].title).toBe('My Snapshot');
    });

    it('generates different keys for sequential snapshots', async () => {
      const key1 = createSnapshot('Content 1');
      await new Promise(resolve => setTimeout(resolve, 10));
      const key2 = createSnapshot('Content 2');
      await new Promise(resolve => setTimeout(resolve, 10));
      const key3 = createSnapshot('Content 3');

      expect(key1).not.toBe(key2);
      expect(key2).not.toBe(key3);
      expect(key1).not.toBe(key3);

      saveSessionMetadata(createSessionMetadata(key1, 'Content 1'));
      saveSessionMetadata(createSessionMetadata(key2, 'Content 2'));
      saveSessionMetadata(createSessionMetadata(key3, 'Content 3'));

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(3);
    });

    it('preserves full state when provided', () => {
      const content = '# Test';
      const fullState = {
        state: {
          content: 'old content',
          storageKey: 'old-key',
          darkMode: true,
          showEditor: false,
        },
        version: 5,
      };

      const newKey = createSnapshot(content, fullState);

      const stored = localStorage.getItem(newKey);
      const parsed = JSON.parse(stored!);

      expect(parsed.state.content).toBe(content);
      expect(parsed.state.storageKey).toBe(newKey);
      expect(parsed.state.darkMode).toBe(true);
      expect(parsed.state.showEditor).toBe(false);
      expect(parsed.version).toBe(5);
    });

    it('creates minimal state when fullState not provided', () => {
      const content = '# Minimal';
      const newKey = createSnapshot(content);

      const stored = localStorage.getItem(newKey);
      const parsed = JSON.parse(stored!);

      expect(parsed.state.content).toBe(content);
      expect(parsed.state.storageKey).toBe(newKey);
      expect(parsed.version).toBe(0);
      expect(Object.keys(parsed.state)).toHaveLength(2); // only content and storageKey
    });

    it('does not modify sessionStorage', () => {
      sessionStorage.setItem('markdown-current-storage-key', 'old-key');

      const newKey = createSnapshot('# New snapshot');

      // Snapshots don't modify sessionStorage - editing session stays on 'markdown-storage-current'
      expect(sessionStorage.getItem('markdown-current-storage-key')).toBe('old-key');
      expect(newKey).toMatch(/^markdown-storage-\d+$/);
    });
  });

  describe('getCurrentSessionMetadata', () => {
    it('returns session metadata for given key', () => {
      const metadata: SessionMetadata = {
        storageKey: 'key1',
        title: 'Document',
        lastModified: Date.now(),
        contentPreview: 'Preview',
        createdAt: Date.now(),
      };
      saveSessionMetadata(metadata);

      const result = getCurrentSessionMetadata('key1');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Document');
    });

    it('returns null when session does not exist', () => {
      const result = getCurrentSessionMetadata('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createSessionMetadata', () => {
    it('extracts title from first heading', () => {
      const content = '# My Great Title\n\nSome content here.';
      const metadata = createSessionMetadata('key1', content);

      expect(metadata.title).toBe('My Great Title');
      expect(metadata.storageKey).toBe('key1');
    });

    it('extracts title from first line if no heading', () => {
      const content = 'First line without hash\nSecond line';
      const metadata = createSessionMetadata('key1', content);

      expect(metadata.title).toBe('First line without hash');
    });

    it('truncates long first line to 50 chars', () => {
      const longLine = 'a'.repeat(100);
      const content = `${longLine}\nSecond line`;
      const metadata = createSessionMetadata('key1', content);

      expect(metadata.title).toHaveLength(50);
    });

    it('uses default title for empty content', () => {
      const metadata = createSessionMetadata('key1', '');
      expect(metadata.title).toBe('Untitled Document');
    });

    it('creates content preview (first 100 chars)', () => {
      const content = 'a'.repeat(200);
      const metadata = createSessionMetadata('key1', content);

      expect(metadata.contentPreview).toHaveLength(100);
    });

    it('replaces newlines in preview with spaces', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const metadata = createSessionMetadata('key1', content);

      expect(metadata.contentPreview).not.toContain('\n');
      expect(metadata.contentPreview).toContain(' ');
    });

    it('sets createdAt to current time for new session', () => {
      const before = Date.now();
      const metadata = createSessionMetadata('key1', 'content');
      const after = Date.now();

      expect(metadata.createdAt).toBeGreaterThanOrEqual(before);
      expect(metadata.createdAt).toBeLessThanOrEqual(after);
    });

    it('preserves createdAt from existing metadata', () => {
      const existingMetadata: SessionMetadata = {
        storageKey: 'key1',
        title: 'Old',
        lastModified: 1000,
        contentPreview: '',
        createdAt: 5000,
      };

      const metadata = createSessionMetadata('key1', 'new content', existingMetadata);
      expect(metadata.createdAt).toBe(5000);
    });

    it('handles headings with multiple hashes', () => {
      const content = '### Third Level Heading\nContent';
      const metadata = createSessionMetadata('key1', content);

      expect(metadata.title).toBe('Third Level Heading');
    });
  });

  describe('formatLastModified', () => {
    it('returns "Just now" for very recent timestamps', () => {
      const now = Date.now();
      const result = formatLastModified(now - 30000); // 30 seconds ago
      expect(result).toBe('Just now');
    });

    it('returns minutes ago for timestamps within an hour', () => {
      const now = Date.now();
      const result = formatLastModified(now - 5 * 60000); // 5 minutes ago
      expect(result).toBe('5 minutes ago');
    });

    it('returns singular "minute ago" for 1 minute', () => {
      const now = Date.now();
      const result = formatLastModified(now - 60000); // 1 minute ago
      expect(result).toBe('1 minute ago');
    });

    it('returns hours ago for timestamps within a day', () => {
      const now = Date.now();
      const result = formatLastModified(now - 3 * 3600000); // 3 hours ago
      expect(result).toBe('3 hours ago');
    });

    it('returns singular "hour ago" for 1 hour', () => {
      const now = Date.now();
      const result = formatLastModified(now - 3600000); // 1 hour ago
      expect(result).toBe('1 hour ago');
    });

    it('returns days ago for timestamps within a week', () => {
      const now = Date.now();
      const result = formatLastModified(now - 2 * 86400000); // 2 days ago
      expect(result).toBe('2 days ago');
    });

    it('returns formatted date for older timestamps', () => {
      const oldDate = new Date('2024-01-01').getTime();
      const result = formatLastModified(oldDate);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Locale-dependent format
    });
  });

  describe('autoSave', () => {
    it('starts auto-save timer', () => {
      vi.useFakeTimers();
      const callback = vi.fn();

      startAutoSave(callback);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(10 * 60 * 1000); // 10 minutes
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(10 * 60 * 1000); // Another 10 minutes
      expect(callback).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('stops previous auto-save when starting new one', () => {
      vi.useFakeTimers();
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      startAutoSave(callback1);
      startAutoSave(callback2);

      vi.advanceTimersByTime(10 * 60 * 1000);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('stops auto-save timer', () => {
      vi.useFakeTimers();
      const callback = vi.fn();

      startAutoSave(callback);
      stopAutoSave();

      vi.advanceTimersByTime(10 * 60 * 1000);
      expect(callback).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('handles multiple stop calls safely', () => {
      stopAutoSave();
      expect(() => stopAutoSave()).not.toThrow();
    });
  });
});
