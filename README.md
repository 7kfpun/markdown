# 1Markdown

Modern, browser-based markdown editor with live preview, Mermaid diagrams, KaTeX math, syntax highlighting, and export/share tools. Built with React and Vite.

## Highlights

- Live split-view preview with GitHub-flavored markdown and 20+ language highlighting (highlight.js)
- Mermaid diagrams with inline rendering, zoomable modal, and copy/download as PNG or SVG
- Exports: Markdown, rendered HTML, and PDF via the browser print dialog
- Shareable links: content compressed (pako) into the URL hash (up to ~10 KB compressed)
- KaTeX inline/block math, drag-and-drop import, auto-save to localStorage
- Dark/light themes, resizable panels, and responsive layout

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
4. Use the Share button to copy a compressed link; content lives entirely in the URL hash.

## Routes

- `/` – Editor (default)
- `/view` – View-only rendered content (from compressed link)
- `/print#paxo:...` – Print-optimized view (opened automatically for PDF export)
- `/privacy` – Privacy policy
- GitHub Pages: 404 fallback copies `index.html` so `/print` and other routes resolve in the SPA
  - Static `public/404.html` redirects to `/#...` so print/share links don’t 404 on GitHub Pages

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
- Share links are limited by URL length (≈10 KB compressed content).
- Editor/preview scroll positions stay in sync and are restored when switching layout modes.

## Browser Support

Chrome/Edge, Firefox, and Safari (desktop/mobile). Clipboard APIs require HTTPS or localhost.

## License

MIT
