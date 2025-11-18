# 1Markdown

Modern, browser-based markdown editor with live preview, Mermaid diagrams, KaTeX math, syntax highlighting, and export/share tools. Built with React and Vite.

## Highlights

- Live split-view preview with GitHub-flavored markdown and 20+ language highlighting (highlight.js)
- Mermaid diagrams with inline rendering, zoomable modal, and copy/download as PNG or SVG
- Exports: Markdown, rendered HTML, and PDF via the browser print dialog
- Session history: Multiple documents with automatic session management and localStorage persistence
- KaTeX inline/block math, drag-and-drop import, auto-save (5s debounce) to localStorage
- Dark/light themes, resizable panels, responsive layout, and offline support indicator
- Scroll synchronization between editor and preview panels
- Debounced word/character count updates (1s) for better performance

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
4. Manual save with Cmd/Ctrl+S to update URL hash and session metadata immediately.
5. Access session history via the History button to view, load, or delete previous sessions.
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
- Content persists to localStorage only (URL hash removed for simplicity).
- Session metadata auto-saves with 5-second debounce after content changes.
- Word/character count updates with 1-second debounce for performance.
- Editor/preview scroll positions stay in sync and are restored when switching layout modes.
- Each document session is tracked with metadata (title preview, word count, timestamps).
- Dynamic storage keys allow multiple documents to coexist in localStorage.
- Offline indicator shows connection status with auto-hide when back online.

## Browser Support

Chrome/Edge, Firefox, and Safari (desktop/mobile). Clipboard APIs require HTTPS or localhost.

## License

MIT
