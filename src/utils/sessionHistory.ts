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

// Get all session metadata
export const getAllSessions = (): SessionMetadata[] => {
  try {
    const stored = localStorage.getItem(SESSIONS_METADATA_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return [];
  }
};

// Save session metadata
export const saveSessionMetadata = (metadata: SessionMetadata): void => {
  try {
    const sessions = getAllSessions();
    const existingIndex = sessions.findIndex((s) => s.storageKey === metadata.storageKey);

    if (existingIndex >= 0) {
      sessions[existingIndex] = metadata;
    } else {
      sessions.push(metadata);
    }

    // Sort by last modified (most recent first)
    sessions.sort((a, b) => b.lastModified - a.lastModified);

    localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save session metadata:', error);
  }
};

// Update session metadata
export const updateSessionMetadata = (
  storageKey: string,
  updates: Partial<Omit<SessionMetadata, 'storageKey'>>
): void => {
  const sessions = getAllSessions();
  const session = sessions.find((s) => s.storageKey === storageKey);

  if (session) {
    Object.assign(session, updates);
    saveSessionMetadata(session);
  }
};

// Delete session (metadata and content)
export const deleteSession = (storageKey: string): void => {
  try {
    // Remove from metadata
    const sessions = getAllSessions();
    const filtered = sessions.filter((s) => s.storageKey !== storageKey);
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
    const sessions = getAllSessions();

    // Remove all session content from localStorage
    sessions.forEach((session) => {
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
    const sessions = getAllSessions();
    const session = sessions.find((s) => s.storageKey === storageKey);

    if (session) {
      session.title = newTitle;
      session.lastModified = Date.now();
      localStorage.setItem(SESSIONS_METADATA_KEY, JSON.stringify(sessions));
    }
  } catch (error) {
    console.error('Failed to rename session:', error);
  }
};

// Get current session metadata
export const getCurrentSessionMetadata = (storageKey: string): SessionMetadata | null => {
  const sessions = getAllSessions();
  return sessions.find((s) => s.storageKey === storageKey) || null;
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
