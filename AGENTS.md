# 1Markdown - AI Agent Documentation

## Architecture Overview

This project follows **CLEAN Architecture** principles with clear separation of concerns across layers.

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  (React Components, Pages, Router, MUI, Styled-Components)  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                   Application Layer                          │
│         (Use Cases, Business Logic, Zustand Store)          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    Domain Layer                              │
│          (Entities, Value Objects, Interfaces)               │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                 Infrastructure Layer                         │
│    (External Services, Repositories, API Clients, Storage)   │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── domain/                      # Domain Layer (Entities & Interfaces)
│   ├── entities/
│   │   ├── Markdown.ts         # Markdown entity
│   │   └── MermaidDiagram.ts   # Mermaid diagram entity
│   ├── repositories/           # Repository interfaces
│   │   └── IMarkdownRepository.ts
│   └── types/                  # Domain types & value objects
│       └── index.ts
│
├── application/                 # Application Layer (Use Cases & Logic)
│   ├── useCases/
│   │   ├── markdown/
│   │   │   ├── UpdateMarkdownUseCase.ts
│   │   │   ├── ExportMarkdownUseCase.ts
│   │   │   └── ShareMarkdownUseCase.ts
│   │   └── mermaid/
│   │       ├── RenderMermaidUseCase.ts
│   │       └── CopyMermaidUseCase.ts
│   └── store/                  # Zustand store
│       └── useMarkdownStore.ts
│
├── infrastructure/              # Infrastructure Layer (External Services)
│   ├── repositories/
│   │   └── LocalStorageMarkdownRepository.ts
│   ├── services/
│   │   ├── CompressionService.ts
│   │   ├── ExportService.ts
│   │   ├── MermaidService.ts
│   │   └── ClipboardService.ts
│   └── store/
│       └── zustand/            # Zustand configuration
│
├── presentation/                # Presentation Layer (UI)
│   ├── pages/
│   │   ├── EditorPage.tsx      # Main editor page
│   │   └── ViewPage.tsx        # View-only page
│   ├── components/
│   │   ├── editor/
│   │   │   └── Editor.tsx
│   │   ├── preview/
│   │   │   └── Preview.tsx
│   │   ├── toolbar/
│   │   │   ├── Toolbar.tsx
│   │   │   ├── ExportMenu.tsx
│   │   │   └── ShareButton.tsx
│   │   ├── mermaid/
│   │   │   ├── MermaidDiagram.tsx
│   │   │   └── MermaidModal.tsx
│   │   └── common/
│   │       ├── FileDropZone.tsx
│   │       └── PanelResizer.tsx
│   ├── router/
│   │   └── AppRouter.tsx       # React Router configuration
│   ├── theme/
│   │   └── muiTheme.ts         # MUI theme configuration
│   └── styles/
│       └── GlobalStyles.tsx    # Global styled-components
│
├── App.tsx                      # Main application component
└── main.tsx                     # Entry point
```

## Key Technologies

### State Management

- **Zustand**: Lightweight state management with minimal boilerplate
- Store located at: `src/infrastructure/store/zustand/useMarkdownStore.ts`
- Replaces React Context for better performance and simpler API

### Styling

- **Material-UI (MUI)**: Component library for consistent UI
- **Styled-Components**: CSS-in-JS for custom styling
- **Emotion**: MUI's underlying styling engine

### Routing

- **React Router v7**: Client-side routing
- Routes:
  - `/` - Editor page (split view)
  - `/view` - View-only page (preview only)

### Sharing

- **Compressed Links**: Paxo compression; links kept under ~2k characters to fit the shortest modern browser URL limits

## CLEAN Architecture Principles

### 1. Domain Layer

**Purpose**: Core business logic and entities
**Dependencies**: None (pure TypeScript)
**Key Concepts**:

- **Entities**: Core business objects (Markdown, MermaidDiagram)
- **Value Objects**: Immutable objects (Theme, ExportOptions)
- **Repository Interfaces**: Contracts for data access

**Example**:

```typescript
// src/domain/entities/Markdown.ts
export class Markdown {
  constructor(
    public readonly content: string,
    public readonly lastModified: Date
  ) {}

  update(newContent: string): Markdown {
    return new Markdown(newContent, new Date());
  }
}
```

### 2. Application Layer

**Purpose**: Use cases and application-specific business rules
**Dependencies**: Domain layer only
**Key Concepts**:

- **Use Cases**: Single-purpose application actions
- **DTOs**: Data transfer objects
- **Application Services**: Orchestrate domain logic

**Example**:

```typescript
// src/application/useCases/markdown/UpdateMarkdownUseCase.ts
export class UpdateMarkdownUseCase {
  execute(content: string) {
    const markdown = new Markdown(content, new Date());
    return this.repository.save(markdown);
  }
}
```

### 3. Infrastructure Layer

**Purpose**: External dependencies and implementations
**Dependencies**: Domain and Application layers
**Key Concepts**:

- **Repository Implementations**: LocalStorage, IndexedDB, API
- **External Services**: Compression, Export, Clipboard
- **Third-party integrations**: Mermaid, jsPDF, pako

**Example**:

```typescript
// src/infrastructure/repositories/LocalStorageMarkdownRepository.ts
export class LocalStorageMarkdownRepository implements IMarkdownRepository {
  save(markdown: Markdown): void {
    localStorage.setItem('markdown', JSON.stringify(markdown));
  }

  load(): Markdown | null {
    const data = localStorage.getItem('markdown');
    return data ? JSON.parse(data) : null;
  }
}
```

### 4. Presentation Layer

**Purpose**: User interface and user interactions
**Dependencies**: All layers (via dependency injection)
**Key Concepts**:

- **Pages**: Route-level components
- **Components**: Reusable UI elements (MUI + styled-components)
- **Hooks**: Custom React hooks for component logic
- **Router**: React Router configuration

**Example**:

```typescript
// src/presentation/components/editor/Editor.tsx
import { TextField } from '@mui/material';
import styled from 'styled-components';

const StyledEditor = styled(TextField)`
  .MuiInputBase-root {
    font-family: 'Monaco', monospace;
  }
`;

export const Editor = () => {
  const { content, updateContent } = useMarkdownStore();
  return <StyledEditor value={content} onChange={e => updateContent(e.target.value)} />;
};
```

## Zustand Store Structure

```typescript
// src/infrastructure/store/zustand/useMarkdownStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MarkdownState {
  // State
  content: string;
  editorTheme: string;
  previewTheme: string;
  darkMode: boolean;

  // Actions
  updateContent: (content: string) => void;
  setEditorTheme: (theme: string) => void;
  setPreviewTheme: (theme: string) => void;
  toggleDarkMode: () => void;

  // Mermaid modal
  mermaidModal: {
    isOpen: boolean;
    svg: string;
    code: string;
  };
  openMermaidModal: (svg: string, code: string) => void;
  closeMermaidModal: () => void;
}

export const useMarkdownStore = create<MarkdownState>()(
  persist(
    (set) => ({
      content: DEFAULT_MARKDOWN,
      editorTheme: 'vs-dark',
      previewTheme: 'github',
      darkMode: false,

      updateContent: (content) => set({ content }),
      setEditorTheme: (theme) => set({ editorTheme: theme }),
      setPreviewTheme: (theme) => set({ previewTheme: theme }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      mermaidModal: { isOpen: false, svg: '', code: '' },
      openMermaidModal: (svg, code) =>
        set({ mermaidModal: { isOpen: true, svg, code } }),
      closeMermaidModal: () =>
        set({ mermaidModal: { isOpen: false, svg: '', code: '' } }),
    }),
    { name: 'markdown-storage' }
  )
);
```

## Dependency Flow

```
Presentation → Application → Domain
     ↓              ↓
Infrastructure ─────┘
```

**Rules**:

1. Domain has NO dependencies (pure business logic)
2. Application depends ONLY on Domain
3. Infrastructure can depend on Domain and Application
4. Presentation can depend on ALL layers but should primarily use Application
5. Dependencies always point INWARD (toward Domain)

## Benefits of This Architecture

1. **Testability**: Each layer can be tested in isolation
2. **Maintainability**: Clear boundaries and responsibilities
3. **Scalability**: Easy to add new features without affecting existing code
4. **Flexibility**: Easy to swap implementations (e.g., switch from localStorage to IndexedDB)
5. **Type Safety**: Full TypeScript support across all layers

## Adding New Features

### Example: Adding PDF Export with Options

1. **Domain**: Define PDF export options interface

```typescript
// src/domain/types/ExportOptions.ts
export interface PDFExportOptions {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margin: number;
}
```

2. **Application**: Create use case

```typescript
// src/application/useCases/markdown/ExportPDFUseCase.ts
export class ExportPDFUseCase {
  constructor(private exportService: IExportService) {}

  execute(content: string, options: PDFExportOptions): Promise<void> {
    return this.exportService.exportAsPDF(content, options);
  }
}
```

3. **Infrastructure**: Implement service

```typescript
// src/infrastructure/services/ExportService.ts
export class ExportService implements IExportService {
  async exportAsPDF(content: string, options: PDFExportOptions): Promise<void> {
    // Use jsPDF + html2canvas
  }
}
```

4. **Presentation**: Use in component

```typescript
// src/presentation/components/toolbar/ExportMenu.tsx
const handleExportPDF = () => {
  const useCase = new ExportPDFUseCase(exportService);
  useCase.execute(content, pdfOptions);
};
```

## Environment Setup

### Development

```bash
yarn dev          # Start dev server
yarn lint         # Run linter
yarn format       # Format code
```

### Production

```bash
yarn build        # Build for production
yarn preview      # Preview build
```

### Testing (to be added)

```bash
yarn test         # Run tests
yarn test:cov     # Test coverage
```

## CI/CD

GitHub Actions workflow automatically:

1. Runs ESLint
2. Builds the application
3. Deploys to GitHub Pages

## Contributing Guidelines

1. Follow CLEAN architecture principles
2. Keep dependencies pointing inward
3. Write pure functions in Domain layer
4. Use dependency injection
5. Add tests for new features
6. Update this documentation when adding new patterns

## Resources

- [CLEAN Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Material-UI](https://mui.com/)
- [Styled-Components](https://styled-components.com/)
- [React Router](https://reactrouter.com/)
