# 1Markdown

Modern, browser-based markdown editor with live preview, Mermaid diagrams, KaTeX math, syntax highlighting, and export/share tools. Built with React and Vite.

## Highlights

- Live split-view preview with GitHub-flavored markdown and 20+ language highlighting (highlight.js)
- Mermaid diagrams with inline rendering, zoomable modal, and copy/download as PNG or SVG
- Exports: Markdown, rendered HTML, and PDF via the browser print dialog
- Session history: Automatic snapshots every 10 minutes with append-only timeline, restore/rename/delete features, 100-item limit with smart cleanup
- KaTeX inline/block math, drag-and-drop import, and tab-scoped autosave (5s debounce) in sessionStorage
- Dark/light themes, resizable panels, responsive layout, and offline support indicator
- Scroll synchronization between editor and preview panels
- Debounced word/character count updates (1s) for better performance
- Two-tier storage: sessionStorage for live drafts + localStorage for immutable snapshots

## Tech Stack

- **Framework**: React 19 + Vite 5
- **UI**: MUI 7, styled-components
- **Editor**: CodeMirror 6 (@uiw/react-codemirror)
- **Markdown**: marked + marked-highlight + highlight.js + DOMPurify + KaTeX + Mermaid
- **State**: Zustand with localStorage persistence
- **Routing**: React Router 7
- **Build/Lint**: ESLint 9, Prettier, Husky

## Getting Started

Prerequisites: Node.js 20+, Yarn 1.22+

```bash
yarn install         # Install dependencies
yarn dev             # Start dev server (http://localhost:5173)
yarn test            # Run tests (Vitest, jsdom)
yarn build           # Production build
yarn preview         # Preview production build
yarn lint            # Lint
yarn lint:fix        # Lint with auto-fix
yarn format          # Format with Prettier
```

## Usage

1. Write markdown in the left editor; see the rendered preview on the right.
2. Hover toolbar buttons for help text; use them to import/export, share, print to PDF, or toggle themes/panels.
3. Create Mermaid diagrams with fenced code blocks (` ```mermaid ... ``` `); click diagrams to zoom/copy.
4. Manual save with Cmd/Ctrl+S to save to localStorage and update session metadata immediately.
5. Access session history via the History button to view, restore, rename, or delete sessions. Automatic snapshots every 10 minutes create a timeline of your work.
6. Editor and preview panels scroll in sync; scroll position is preserved when toggling layout modes.

## Routes

- `/` – Editor (default)
- `/print#paxo:...` – Print-optimized view (opened automatically for PDF export)
- `/privacy` – Privacy policy
- GitHub Pages: 404 fallback copies `index.html` so `/print` and other routes resolve in the SPA without changing the URL

## Project Structure

```
src/
├── infrastructure/store/useMarkdownStore.ts   # Zustand store + persistence
├── presentation/
│   ├── pages/                                 # Editor, View, Print, Privacy
│   ├── components/
│   │   ├── editor/Editor.tsx                  # CodeMirror editor
│   │   ├── preview/Preview.tsx                # Marked preview + Mermaid
│   │   └── mermaid/                           # Diagram modal/viewer
│   └── router/AppRouter.tsx                   # Client routes
├── utils/                                     # Compression, export, constants, analytics
├── App.tsx                                    # Theme + router
└── main.tsx                                   # Entry point
```

## Development Notes

- Markdown rendering is sanitized with DOMPurify; links open in new tabs.
- Syntax highlighting uses a shared marked instance to avoid double-highlighting.
- PDF export relies on the browser print dialog (no html2canvas/jsPDF in use).
- Live content persists to sessionStorage per tab while snapshots/metadata stay in localStorage (URL hash still cleared after saves).
- Session metadata auto-saves with 5-second debounce after content changes.
- Word/character count updates with 1-second debounce for performance.
- Editor/preview scroll positions stay in sync and are restored when switching layout modes.
- Each document session is tracked with metadata (title preview, word count, timestamps).
- Dynamic storage keys allow multiple documents to coexist in localStorage.
- Offline indicator shows connection status with auto-hide when back online.

### Storage Architecture

- **Active Draft Layer**: Zustand persists the current tab’s content/settings into `sessionStorage` (`markdown-storage-current`) so multiple tabs never clobber each other.
- **Snapshot Layer**: Manual save and 10-minute auto-save create immutable snapshots (`markdown-storage-{timestamp}`) in `localStorage`, including the serialized editor UI state for restoration.
- **Metadata Index**: Session metadata lives in `localStorage` under `markdown-sessions-metadata` as a sorted array (newest first) for O(1) prepend/update operations and quick migrations from the legacy object map.
- **Cleanup Rules**: Old snapshots beyond the 100-entry cap are pruned along with their serialized content to keep storage bounded.

### Session History Architecture

- **Auto-Snapshot System**: Creates new snapshot every 10 minutes with unique storage key
- **Append-Only Timeline**: All changes preserved in Git-like version history
- **Array-Based Metadata**: Metadata stored as a newest-first array for fast prepends and deterministic ordering
- **100-Item Limit**: Automatically removes oldest sessions when limit exceeded
- **Performance Optimization**: No sorting on writes, only when displaying history
- **Data Safety**: Auto-detects and clears incompatible/corrupted data formats
- **Restore Creates Snapshot**: Restoring any session creates new snapshot at top of timeline
- **Unique Storage Keys**: Each session gets `markdown-storage-{timestamp}` key
- **Session Isolation**: `sessionStorage` keeps the active draft scoped per tab while history stays in `localStorage`

## Browser Support

Chrome/Edge, Firefox, and Safari (desktop/mobile). Clipboard APIs require HTTPS or localhost.

## License

MIT
