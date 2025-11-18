import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_MARKDOWN } from '../../utils/constants';
import { getStorageKey } from '../../utils/compression';

interface MermaidModalState {
  isOpen: boolean;
  svg: string;
  code: string;
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
  storageKey: string; // Track which storage key we're using

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
}

// Custom storage that uses dynamic keys
const dynamicStorage = {
  getItem: (name: string) => {
    const key = getStorageKey();
    const str = localStorage.getItem(key);
    return str;
  },
  setItem: (name: string, value: string) => {
    const key = getStorageKey();
    localStorage.setItem(key, value);
  },
  removeItem: (name: string) => {
    const key = getStorageKey();
    localStorage.removeItem(key);
  },
};

export const useMarkdownStore = create<MarkdownState>()(
  persist(
    (set, get) => ({
      content: DEFAULT_MARKDOWN,
      editorTheme: 'light-default',
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
      storageKey: getStorageKey(),

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
