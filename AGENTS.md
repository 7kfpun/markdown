# 1Markdown - AI Agent Documentation

## Project Overview

1Markdown is a modern, browser-based markdown editor with live preview, Mermaid diagram support, and collaborative sharing features. Built with React, Material-UI, and Zustand for state management.

## Architecture Overview

This project uses a simplified architecture focused on presentation and infrastructure layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  (React Components, Pages, Router, MUI)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                 Infrastructure Layer                         │
│    (Zustand Store, Utilities, External Services)            │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── infrastructure/              # Infrastructure Layer (State & Storage)
│   └── store/
│       └── useMarkdownStore.ts # Zustand store with localStorage persistence
│
├── presentation/                # Presentation Layer (UI)
│   ├── pages/
│   │   ├── EditorPage.tsx      # Main editor page (split view)
│   │   ├── ViewPage.tsx        # View-only page (shared links)
│   │   ├── PrintPage.tsx       # Print-optimized page with auto-print
│   │   └── PrivacyPage.tsx     # Privacy policy page
│   ├── components/
│   │   ├── editor/
│   │   │   └── Editor.tsx      # Monaco-based markdown editor
│   │   ├── preview/
│   │   │   └── Preview.tsx     # Markdown preview with live rendering
│   │   └── mermaid/
│   │       ├── MermaidDiagram.tsx  # Inline mermaid rendering component
│   │       └── MermaidModal.tsx    # Full-screen mermaid diagram viewer
│   ├── router/
│   │   └── AppRouter.tsx       # React Router configuration
│   └── theme/
│       └── muiTheme.ts         # Material-UI theme configuration
│
├── utils/                       # Utility functions
│   ├── analytics.ts            # Google Analytics integration
│   ├── compression.js          # Pako-based content compression for sharing
│   ├── constants.js            # Default markdown content & constants
│   ├── export.js               # PDF/HTML/PNG/Markdown export utilities
│   └── mermaidToClipboard.js   # Clipboard operations for diagrams
│
├── App.tsx                      # Main application component
└── main.tsx                     # Entry point with React strict mode
```

## Key Technologies

### Core Framework

- **React 18**: UI framework with hooks and concurrent features
- **TypeScript/JavaScript**: Mixed TS/JS codebase
- **Vite**: Fast build tool and dev server

### State Management

- **Zustand**: Lightweight state management
- **Store**: `src/infrastructure/store/useMarkdownStore.ts`
- **Persistence**: localStorage middleware for auto-save

### UI Components

- **Material-UI (MUI) v6**: Component library
- **Monaco Editor**: VS Code-powered markdown editor
- **Marked**: Markdown parsing and rendering
- **Mermaid**: Diagram and flowchart rendering

### Routing

- **React Router v7**: Client-side routing
- Routes:
  - `/` - Editor page (split view with editor + preview)
  - `/view` - View-only page (shared links with compressed content)
  - `/print#paxo:...` - Print-optimized page with auto-print trigger
  - `/privacy` - Privacy policy page

### Export & Sharing

- **Browser Print API**: Native PDF generation via print dialog
- **Pako**: DEFLATE compression (level 9) for URL sharing
- URL-safe base64 encoding for share links
- Links compressed to fit browser URL limits (up to 10KB compressed)

## Zustand Store Structure

```typescript
// src/infrastructure/store/useMarkdownStore.ts
interface MarkdownState {
  // Content state
  content: string;
  updateContent: (content: string) => void;
  resetContent: () => void;

  // Editor settings
  editorTheme: string;
  editorFontSize: number;
  editorWrap: boolean;
  setEditorTheme: (theme: string) => void;
  setEditorFontSize: (size: number) => void;
  setEditorWrap: (wrap: boolean) => void;

  // Preview settings
  previewTheme: string;
  setPreviewTheme: (theme: string) => void;

  // UI state
  darkMode: boolean;
  showEditor: boolean;
  showPreview: boolean;
  toggleDarkMode: () => void;
  setShowEditor: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;
  togglePanels: (mode: 'editor-only' | 'preview-only' | 'split') => void;

  // Mermaid modal state
  mermaidModal: {
    isOpen: boolean;
    svg: string;
    code: string;
  };
  openMermaidModal: (svg: string, code: string) => void;
  closeMermaidModal: () => void;
}
```

## Key Features

### 1. Live Markdown Editor

- Monaco editor with syntax highlighting
- Configurable themes (vs-dark, vs-light, etc.)
- Adjustable font size and word wrap
- Auto-save to localStorage

### 2. Real-time Preview

- Live markdown rendering using Marked
- Syntax highlighting for code blocks
- Mermaid diagram support
- Click-to-zoom diagrams in full-screen modal

### 3. Mermaid Diagrams

- Inline rendering in preview
- Click to open full-screen modal
- Copy as PNG or SVG to clipboard
- Download as PNG or SVG
- Supports all Mermaid diagram types:
  - Flowcharts
  - Sequence diagrams
  - Class diagrams
  - State diagrams
  - ER diagrams
  - And more

### 4. Export Options

- **Markdown (.md)**: Export raw markdown
- **HTML**: Standalone HTML file with styles
- **PDF**: Opens print-optimized page in new tab, triggers browser print dialog
  - Renders all Mermaid diagrams before printing
  - Print-friendly layout with proper page breaks
  - Uses browser's native print-to-PDF feature

### 5. Sharing

- Generate compressed shareable links (up to 10KB)
- Maximum compression with Pako DEFLATE level 9
- URL-safe base64 encoding (no +, /, or = characters)
- View-only mode for shared links
- Hash-based routing for instant content loading

### 6. Layout Modes

- **Split View**: Editor + Preview side-by-side (default)
- **Editor Only**: Focus on writing
- **Preview Only**: Focus on rendered output
- Adjustable panel sizes with draggable divider

## Component Details

### EditorPage.tsx

Main page component that orchestrates:

- Editor and Preview components
- Toolbar with export/share actions
- Layout management (split/single panel)
- Scroll synchronization between editor and preview

### Editor.tsx

Monaco-based editor with:

- Markdown syntax highlighting
- Theme customization
- Font size adjustment
- Word wrap toggle
- Exposed methods via ref (scrollToLine, getScrollInfo)

### Preview.tsx

Markdown preview with:

- Live rendering using Marked
- Mermaid diagram detection and rendering
- Syntax highlighting for code blocks
- Click handlers for interactive diagrams
- Exposed methods via ref (scrollToRatio, getElement)

### MermaidModal.tsx

Full-screen diagram viewer:

- Renders SVG from Mermaid code or pre-rendered SVG
- Copy to clipboard (PNG/SVG)
- Download (PNG/SVG)
- Proper sizing and centering
- Fixed: Container always rendered to avoid ref timing issues

## Utility Functions

### export.js

Export utilities:

- `downloadMarkdown()`: Save as .md file
- `downloadHTML()`: Save as standalone HTML
- `openPrintPage()`: Open print-optimized page in new tab
- `downloadRenderedHTML()`: Save rendered preview as HTML
- `copyHTMLToClipboard()`: Copy rendered HTML

### compression.js

Sharing utilities:

- `compressToBase64()`: Compress markdown to URL-safe base64
- `decompressFromBase64()`: Decompress from URL-safe base64
- `generateShareLink()`: Create shareable link (max 10KB)
- `extractContentFromHash()`: Extract content from URL hash
- Uses Pako DEFLATE level 9 for maximum compression
- URL-safe encoding replaces +/= with -\_

### mermaidToClipboard.js

Mermaid-specific utilities:

- `copySVGToClipboard()`: Copy diagram as SVG
- `copyMermaidAsPNG()`: Copy/download diagram as PNG
- Supports both clipboard and download operations

## Development

### Setup

```bash
yarn install          # Install dependencies
yarn dev             # Start dev server (http://localhost:5173)
```

### Build

```bash
yarn build           # Production build
yarn preview         # Preview production build
```

### Code Quality

```bash
yarn lint            # Run ESLint
yarn format          # Format code with Prettier
```

### Pre-commit Hook

Husky hook automatically runs:

1. ESLint on staged files
2. Prettier formatting
3. Prevents commit if errors found

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`):

1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run ESLint
5. Build for production
6. Deploy to GitHub Pages

## Recent Fixes & Enhancements

### SEO Improvements

**Enhancement**: Comprehensive SEO optimization

- Added extensive meta tags for search engines (title, description, keywords)
- Open Graph tags for social media sharing (Facebook, Twitter)
- Canonical URL and robots meta tags
- Enhanced default markdown content with 400+ lines of comprehensive examples
- SEO-focused descriptions highlighting key features and use cases
- Added structured content for better search engine indexing

### Privacy Policy & Bug Reporting

**Addition**: Privacy policy page and bug reporting

- Created dedicated `/privacy` route with comprehensive privacy policy
- Added bug reporting button in header linking to GitHub issues
- Privacy policy explains data handling, local storage, and user rights
- Clear communication about no server-side data storage

### MermaidModal Display Issue

**Problem**: Charts not showing in modal
**Root Cause**: Container div only rendered when `hasContent` was true, but `hasContent` was only set after rendering into container (circular dependency)
**Solution**:

- Container now always rendered (with `width: 100%` and `height: 100%`)
- Fallback message positioned absolutely
- Proper flexbox centering for SVG content

### PDF Export Redesign

**Change**: Replaced jsPDF/html2canvas with browser print API

- Removed dependencies on jsPDF and html2canvas
- Created new `/print` route for print-optimized view
- Opens content in new tab and triggers browser's native print dialog
- Renders all Mermaid diagrams before printing
- Print-friendly CSS with proper page breaks
- Better quality and smaller bundle size
- Users can choose PDF settings in browser print dialog

### Share Link Length Improvement

**Enhancement**: Increased shareable link capacity

- Increased limit from 2KB to 10KB (5x improvement)
- Implemented URL-safe base64 encoding
- Added maximum compression (Pako DEFLATE level 9)
- Better error messages showing actual vs max length

### Mermaid Diagram Performance Optimization

**Problem**: Documents with many Mermaid diagrams caused slow rendering
**Solution**: Implemented lazy loading with Intersection Observer

- Only renders diagrams when they're about to become visible
- Pre-renders 200px before viewport entry for smooth experience
- Maintains SVG cache for instant re-renders
- Shows "Loading diagram..." placeholder during render
- Dramatically improves performance for large documents

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Clipboard API requires HTTPS (or localhost)

## Environment Variables

- `VITE_GA_MEASUREMENT_ID`: Google Analytics tracking ID (optional)

## Performance Considerations

1. **Debounced Rendering**: Markdown re-render debounced to avoid lag during typing
2. **Mermaid Caching**: SVG cache to prevent re-rendering unchanged diagrams
3. **Lazy Loading Diagrams**: Intersection Observer renders Mermaid diagrams only when visible
   - Pre-renders diagrams 200px before they enter viewport
   - Dramatically improves performance for documents with many diagrams
   - Loading placeholder shown until diagram renders
4. **Code Splitting**: React Router handles route-based code splitting

## Known Limitations

1. URL sharing limited by browser URL length (up to 10KB compressed content, ~40-50KB raw markdown depending on content)
2. PDF export via print dialog requires all diagrams to render first (may take time for many diagrams)
3. Very long documents should use download/upload instead of share links
4. Print page uses same URL compression limit as sharing (10KB)

## Future Enhancements

- [ ] Add tests (Vitest + React Testing Library)
- [ ] Collaborative editing (WebSocket/CRDT)
- [ ] Cloud storage integration
- [ ] Custom themes
- [ ] Plugin system for custom markdown extensions
- [ ] Mobile responsive improvements

## Resources

- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Material-UI](https://mui.com/)
- [Marked Documentation](https://marked.js.org/)
- [Mermaid Documentation](https://mermaid.js.org/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [React Router](https://reactrouter.com/)
