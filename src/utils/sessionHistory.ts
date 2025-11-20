// Session history management utilities

export interface SessionMetadata {
  storageKey: string;
  title: string;
  lastModified: number; // timestamp
  contentPreview: string; // first 100 chars
  createdAt: number; // timestamp
}

const SESSIONS_METADATA_KEY = 'markdown-sessions-metadata';
const AUTO_SAVE_INTERVAL = 10 * 60 * 1000; // 10 minutes
const MAX_SESSIONS = 100; // Maximum number of sessions to keep

// Get all session metadata as array (newest first, no sorting needed)
const getSessionsArray = (): SessionMetadata[] => {
  try {
    const stored = localStorage.getItem(SESSIONS_METADATA_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);

    // Migrate from old object format to array if needed
    if (!Array.isArray(parsed)) {
      if (parsed && typeof parsed === 'object') {
        console.warn('Migrating sessions from object to array format');
        const sessions = Object.values(parsed) as SessionMetadata[];
        // Sort once during migration
        sessions.sort((a, b) => b.lastModified - a.lastModified);
        localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify(sessions));
        return sessions;
      }
      // Invalid data
      localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify([]));
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('Failed to get sessions:', error);
    localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify([]));
    return [];
  }
};

// Get all session metadata (newest first, no sorting needed)
export const getAllSessions = (): SessionMetadata[] => {
  return getSessionsArray();
};

// Save session metadata
export const saveSessionMetadata = (metadata: SessionMetadata): void => {
  try {
    const sessions = getSessionsArray();
    console.log('[saveSessionMetadata] Current sessions count:', sessions.length);
    console.log('[saveSessionMetadata] Saving metadata:', metadata);

    // Check if session already exists (update case)
    const existingIndex = sessions.findIndex(s => s.storageKey === metadata.storageKey);

    if (existingIndex >= 0) {
      console.log('[saveSessionMetadata] Found existing session at index:', existingIndex);
      // Update existing session - remove old, prepend updated to front
      sessions.splice(existingIndex, 1);
    } else {
      console.log('[saveSessionMetadata] New session, will prepend to front');
    }

    // Prepend new/updated session to front (newest first)
    sessions.unshift(metadata);
    console.log('[saveSessionMetadata] After prepend, sessions count:', sessions.length);
    console.log('[saveSessionMetadata] First 3 session titles:', sessions.slice(0, 3).map(s => s.title));

    // Trim to max sessions (remove oldest from end)
    if (sessions.length > MAX_SESSIONS) {
      const removed = sessions.splice(MAX_SESSIONS);
      console.log('[saveSessionMetadata] Trimmed', removed.length, 'old sessions');
      // Remove content from localStorage for trimmed sessions
      removed.forEach(session => {
        localStorage.removeItem(session.storageKey);
      });
    }

    localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify(sessions));
    console.log('[saveSessionMetadata] Saved to localStorage');
  } catch (error) {
    console.error('Failed to save session metadata:', error);
  }
};

// Update session metadata
export const updateSessionMetadata = (
  storageKey: string,
  updates: Partial<Omit<SessionMetadata, 'storageKey'>>
): void => {
  const sessions = getSessionsArray();
  const session = sessions.find(s => s.storageKey === storageKey);

  if (session) {
    Object.assign(session, updates);
    saveSessionMetadata(session);
  }
};

// Delete session (metadata and content)
export const deleteSession = (storageKey: string): void => {
  try {
    const sessions = getSessionsArray();

    // Remove from array
    const filtered = sessions.filter(s => s.storageKey !== storageKey);
    localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify(filtered));

    // Remove content from localStorage
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
};

// Delete all sessions (metadata and content)
export const deleteAllSessions = (): void => {
  try {
    const sessions = getSessionsArray();

    // Remove all session content from localStorage
    sessions.forEach(session => {
      localStorage.removeItem(session.storageKey);
    });

    // Clear metadata
    localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Failed to delete all sessions:', error);
  }
};

// Rename session
export const renameSession = (storageKey: string, newTitle: string): void => {
  try {
    const sessions = getSessionsArray();
    const sessionIndex = sessions.findIndex(s => s.storageKey === storageKey);

    if (sessionIndex >= 0) {
      sessions[sessionIndex].title = newTitle;
      sessions[sessionIndex].lastModified = Date.now();
      localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify(sessions));
    }
  } catch (error) {
    console.error('Failed to rename session:', error);
  }
};

// Get current session metadata
export const getCurrentSessionMetadata = (storageKey: string): SessionMetadata | null => {
  const sessions = getSessionsArray();
  return sessions.find(s => s.storageKey === storageKey) || null;
};

// Create session metadata from content
export const createSessionMetadata = (
  storageKey: string,
  content: string,
  existingMetadata?: SessionMetadata
): SessionMetadata => {
  const now = Date.now();
  const lines = content.split('\n');

  // Try to extract title from first heading or first line
  let title = 'Untitled Document';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      title = trimmed.replace(/^#+\s*/, '').trim();
      break;
    } else if (trimmed.length > 0) {
      title = trimmed.substring(0, 50);
      break;
    }
  }

  const contentPreview = content.substring(0, 100).replace(/\n/g, ' ');

  return {
    storageKey,
    title,
    lastModified: now,
    contentPreview,
    createdAt: existingMetadata?.createdAt || now,
  };
};

// Create a new snapshot (generates new storage key and saves content to localStorage)
// Note: Does NOT save metadata - caller should use store.addSession()
export const createSnapshot = (content: string, fullState?: any): string => {
  // Generate unique storage key using timestamp only (milliseconds for uniqueness)
  const timestamp = Date.now();
  const newKey = `markdown-storage-${timestamp}`;

  console.log('[createSnapshot] Creating snapshot with key:', newKey);
  console.log('[createSnapshot] Content preview:', content.substring(0, 100));
  console.log('[createSnapshot] Has fullState:', !!fullState);

  // Save full state to new storage key (or just content if no state provided)
  const storeData = fullState ? JSON.stringify({
    ...fullState,
    state: {
      ...fullState.state,
      content,
      storageKey: newKey,
    },
  }) : JSON.stringify({
    state: {
      content,
      storageKey: newKey,
    },
    version: 0,
  });

  localStorage.setItem(newKey, storeData);
  console.log('[createSnapshot] Stored data in localStorage');

  return newKey;
};

// Auto-save manager
let autoSaveTimer: number | null = null;

export const startAutoSave = (callback: () => void): void => {
  stopAutoSave();
  autoSaveTimer = window.setInterval(callback, AUTO_SAVE_INTERVAL);
};

export const stopAutoSave = (): void => {
  if (autoSaveTimer !== null) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
};

// Get formatted time
export const formatLastModified = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString();
};
