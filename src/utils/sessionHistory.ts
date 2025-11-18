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

// Get all session metadata as an object (internal use)
const getSessionsObject = (): Record<string, SessionMetadata> => {
  try {
    const stored = localStorage.getItem(SESSIONS_METADATA_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    // Handle migration from array to object
    if (Array.isArray(parsed)) {
      const obj: Record<string, SessionMetadata> = {};
      parsed.forEach((session) => {
        obj[session.storageKey] = session;
      });
      return obj;
    }
    return parsed;
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return {};
  }
};

// Get all session metadata as sorted array (for display)
export const getAllSessions = (): SessionMetadata[] => {
  try {
    const sessionsObj = getSessionsObject();
    const sessions = Object.values(sessionsObj);
    // Sort by last modified (most recent first) - only when displaying
    sessions.sort((a, b) => b.lastModified - a.lastModified);
    return sessions;
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return [];
  }
};

// Save session metadata
export const saveSessionMetadata = (metadata: SessionMetadata): void => {
  try {
    const sessionsObj = getSessionsObject();

    // Add or update session (no sorting needed)
    sessionsObj[metadata.storageKey] = metadata;

    // Check if we exceeded the limit
    const sessionKeys = Object.keys(sessionsObj);
    if (sessionKeys.length > MAX_SESSIONS) {
      // Get all sessions as array to find oldest ones
      const allSessions = Object.values(sessionsObj);
      allSessions.sort((a, b) => a.lastModified - b.lastModified); // Sort oldest first

      // Remove oldest sessions to get back to limit
      const toRemove = allSessions.slice(0, sessionKeys.length - MAX_SESSIONS);
      toRemove.forEach((session) => {
        delete sessionsObj[session.storageKey];
        // Also remove the content from localStorage
        localStorage.removeItem(session.storageKey);
      });
    }

    localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify(sessionsObj));
  } catch (error) {
    console.error('Failed to save session metadata:', error);
  }
};

// Update session metadata
export const updateSessionMetadata = (
  storageKey: string,
  updates: Partial<Omit<SessionMetadata, 'storageKey'>>
): void => {
  const sessionsObj = getSessionsObject();
  const session = sessionsObj[storageKey];

  if (session) {
    Object.assign(session, updates);
    saveSessionMetadata(session);
  }
};

// Delete session (metadata and content)
export const deleteSession = (storageKey: string): void => {
  try {
    const sessionsObj = getSessionsObject();

    // Remove from metadata
    delete sessionsObj[storageKey];
    localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify(sessionsObj));

    // Remove content from localStorage
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
};

// Delete all sessions (metadata and content)
export const deleteAllSessions = (): void => {
  try {
    const sessionsObj = getSessionsObject();

    // Remove all session content from localStorage
    Object.keys(sessionsObj).forEach((storageKey) => {
      localStorage.removeItem(storageKey);
    });

    // Clear metadata
    localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify({}));
  } catch (error) {
    console.error('Failed to delete all sessions:', error);
  }
};

// Rename session
export const renameSession = (storageKey: string, newTitle: string): void => {
  try {
    const sessionsObj = getSessionsObject();
    const session = sessionsObj[storageKey];

    if (session) {
      session.title = newTitle;
      session.lastModified = Date.now();
      localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify(sessionsObj));
    }
  } catch (error) {
    console.error('Failed to rename session:', error);
  }
};

// Get current session metadata
export const getCurrentSessionMetadata = (storageKey: string): SessionMetadata | null => {
  const sessionsObj = getSessionsObject();
  return sessionsObj[storageKey] || null;
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

// Create a new snapshot (generates new storage key and saves content)
export const createSnapshot = (content: string, fullState?: any): string => {
  // Generate unique storage key for snapshot
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  const newKey = `markdown-storage-${timestamp}-${random}`;

  // Create metadata for snapshot
  const metadata = createSessionMetadata(newKey, content);
  saveSessionMetadata(metadata);

  // Save full state to new storage key (or just content if no state provided)
  let storeData;
  if (fullState) {
    // Copy full state but update storageKey
    storeData = JSON.stringify({
      ...fullState,
      state: {
        ...fullState.state,
        content,
        storageKey: newKey,
      },
    });
  } else {
    // Just content (minimal state)
    storeData = JSON.stringify({
      state: {
        content,
        storageKey: newKey,
      },
      version: 0,
    });
  }
  localStorage.setItem(newKey, storeData);

  // Update sessionStorage to use new key
  sessionStorage.setItem('markdown-current-storage-key', newKey);

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
