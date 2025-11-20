import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_MARKDOWN } from '../../utils/constants';

interface MermaidModalState {
  isOpen: boolean;
  svg: string;
  code: string;
}

export interface SessionMetadata {
  storageKey: string;
  title: string;
  lastModified: number;
  contentPreview: string;
  createdAt: number;
}

interface MarkdownState {
  content: string;
  editorTheme: string;
  editorFontSize: number;
  editorWrap: boolean;
  previewTheme: string;
  darkMode: boolean;
  showEditor: boolean;
  showPreview: boolean;
  mermaidModal: MermaidModalState;
  storageKey: string;
  sessions: SessionMetadata[]; // Session history in memory

  updateContent: (content: string) => void;
  setEditorTheme: (theme: string) => void;
  setEditorFontSize: (size: number) => void;
  setEditorWrap: (wrap: boolean) => void;
  resetContent: () => void;
  setPreviewTheme: (theme: string) => void;
  toggleDarkMode: () => void;
  setShowEditor: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;
  openMermaidModal: (svg: string, code: string) => void;
  closeMermaidModal: () => void;
  togglePanels: (mode: 'editor-only' | 'preview-only' | 'split') => void;
  switchStorageKey: (newKey: string) => void;
  addSession: (metadata: SessionMetadata) => void;
  updateSession: (storageKey: string, updates: Partial<Omit<SessionMetadata, 'storageKey'>>) => void;
  deleteSession: (storageKey: string) => void;
  deleteAllSessions: () => void;
  loadSessions: () => void;
}

// Custom storage that uses sessionStorage for current edits (tab-specific)
// This allows multiple tabs to edit independently
const dynamicStorage = {
  getItem: (name: string) => {
    // Use sessionStorage for current editing session (tab-specific)
    const str = sessionStorage.getItem('markdown-storage-current');
    return str;
  },
  setItem: (name: string, value: string) => {
    // Use sessionStorage for current editing session (tab-specific)
    sessionStorage.setItem('markdown-storage-current', value);
  },
  removeItem: (name: string) => {
    // Use sessionStorage for current editing session (tab-specific)
    sessionStorage.removeItem('markdown-storage-current');
  },
};

// Load sessions from localStorage (only on init, client-side only)
const loadSessionsFromStorage = (): SessionMetadata[] => {
  // Skip on server-side to avoid hydration mismatch
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('markdown-sessions-metadata');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      // Migrate from old object format
      if (parsed && typeof parsed === 'object') {
        const sessions = Object.values(parsed) as SessionMetadata[];
        sessions.sort((a, b) => b.lastModified - a.lastModified);
        return sessions;
      }
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
};

// Persist sessions to localStorage (called after state updates, client-side only)
const persistSessions = (sessions: SessionMetadata[]) => {
  // Skip on server-side
  if (typeof window === 'undefined') return;

  console.log('[persistSessions] Persisting', sessions.length, 'sessions to localStorage');
  console.log('[persistSessions] Session titles:', sessions.map(s => s.title));

  try {
    localStorage.setItem('markdown-sessions-metadata', JSON.stringify(sessions));
    console.log('[persistSessions] Successfully persisted to localStorage');
  } catch (error) {
    console.error('Failed to persist sessions:', error);
  }
};

export const useMarkdownStore = create<MarkdownState>()(
  persist(
    (set, get) => ({
      content: DEFAULT_MARKDOWN,
      editorTheme: 'one-dark',
      editorFontSize: 13,
      editorWrap: true,
      previewTheme: 'github',
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      showEditor: true,
      showPreview: true,
      mermaidModal: {
        isOpen: false,
        svg: '',
        code: '',
      },
      storageKey: 'markdown-storage-current', // Fixed key for current editing session in sessionStorage
      sessions: loadSessionsFromStorage(),

      updateContent: (content) => set({ content }),
      setEditorTheme: (theme) => set({ editorTheme: theme }),
      setEditorFontSize: (size) => set({ editorFontSize: size }),
      setEditorWrap: (wrap) => set({ editorWrap: wrap }),
      resetContent: () => set({ content: DEFAULT_MARKDOWN }),
      setPreviewTheme: (theme) => set({ previewTheme: theme }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setShowEditor: (show) => set({ showEditor: show }),
      setShowPreview: (show) => set({ showPreview: show }),

      openMermaidModal: (svg, code) =>
        set({
          mermaidModal: {
            isOpen: true,
            svg,
            code,
          },
        }),

      closeMermaidModal: () =>
        set({
          mermaidModal: {
            isOpen: false,
            svg: '',
            code: '',
          },
        }),

      togglePanels: (mode) => {
        if (mode === 'editor-only') {
          set({ showEditor: true, showPreview: false });
        } else if (mode === 'preview-only') {
          set({ showEditor: false, showPreview: true });
        } else {
          set({ showEditor: true, showPreview: true });
        }
      },

      switchStorageKey: (newKey: string) => {
        set({ storageKey: newKey });
      },

      // Session management - state is source of truth
      addSession: (metadata) => {
        const sessions = get().sessions;
        console.log('[addSession] Current sessions count:', sessions.length);
        console.log('[addSession] Adding/updating session:', metadata.storageKey, metadata.title);

        const existingIndex = sessions.findIndex(s => s.storageKey === metadata.storageKey);

        let newSessions;
        if (existingIndex >= 0) {
          console.log('[addSession] Found existing at index:', existingIndex);
          // Update existing - remove and prepend
          newSessions = [...sessions];
          newSessions.splice(existingIndex, 1);
          newSessions.unshift(metadata);
        } else {
          console.log('[addSession] New session, prepending');
          // New session - prepend to front
          newSessions = [metadata, ...sessions];
        }

        // Trim to max 100 sessions
        if (newSessions.length > 100) {
          const removed = newSessions.slice(100);
          removed.forEach(s => localStorage.removeItem(s.storageKey));
          newSessions = newSessions.slice(0, 100);
        }

        console.log('[addSession] New sessions count:', newSessions.length);
        console.log('[addSession] First 3 sessions:', newSessions.slice(0, 3).map((s: SessionMetadata) => s.title));

        set({ sessions: newSessions });
        persistSessions(newSessions);
      },

      updateSession: (storageKey, updates) => {
        const sessions = get().sessions;
        const sessionIndex = sessions.findIndex(s => s.storageKey === storageKey);
        if (sessionIndex >= 0) {
          const newSessions = [...sessions];
          newSessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
          set({ sessions: newSessions });
          persistSessions(newSessions);
        }
      },

      deleteSession: (storageKey) => {
        const sessions = get().sessions.filter(s => s.storageKey !== storageKey);
        localStorage.removeItem(storageKey);
        set({ sessions });
        persistSessions(sessions);
      },

      deleteAllSessions: () => {
        const sessions = get().sessions;
        sessions.forEach(s => localStorage.removeItem(s.storageKey));
        set({ sessions: [] });
        persistSessions([]);
      },

      loadSessions: () => {
        // Reload from localStorage (for compatibility during migration)
        const sessions = loadSessionsFromStorage();
        set({ sessions });
      },
    }),
    {
      name: 'dynamic-storage', // This name is not used due to custom storage
      storage: createJSONStorage(() => dynamicStorage),
      partialize: (state) => ({
        content: state.content,
        editorTheme: state.editorTheme,
        editorFontSize: state.editorFontSize,
        editorWrap: state.editorWrap,
        previewTheme: state.previewTheme,
        darkMode: state.darkMode,
        storageKey: state.storageKey,
      }),
    }
  )
);
