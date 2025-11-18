import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  getAllSessions,
  saveSessionMetadata,
  updateSessionMetadata,
  deleteSession,
  getCurrentSessionMetadata,
  createSessionMetadata,
  formatLastModified,
  startAutoSave,
  stopAutoSave,
  type SessionMetadata,
} from '../src/utils/sessionHistory';

describe('sessionHistory utilities', () => {
  beforeEach(() => {
    localStorage.clear();
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

    it('returns all sessions from localStorage', () => {
      const mockSessions: SessionMetadata[] = [
        {
          storageKey: 'key1',
          title: 'Document 1',
          lastModified: Date.now(),
          contentPreview: 'Preview 1',
          createdAt: Date.now(),
        },
        {
          storageKey: 'key2',
          title: 'Document 2',
          lastModified: Date.now(),
          contentPreview: 'Preview 2',
          createdAt: Date.now(),
        },
      ];
      localStorage.setItem('markdown-sessions-metadata', JSON.stringify(mockSessions));

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions[0].title).toBe('Document 1');
      expect(sessions[1].title).toBe('Document 2');
    });

    it('returns empty array when localStorage contains invalid JSON', () => {
      localStorage.setItem('markdown-sessions-metadata', 'invalid json');
      const sessions = getAllSessions();
      expect(sessions).toEqual([]);
      expect(console.error).toHaveBeenCalled();
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

    it('handles deletion of non-existent session gracefully', () => {
      expect(() => deleteSession('nonexistent')).not.toThrow();
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
