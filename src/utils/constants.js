export const DEFAULT_MARKDOWN = `# Welcome to 1Markdown - Modern Markdown Editor

## 🚀 Features
- Real-time preview with syntax highlighting
- Multiple editor and preview themes
- Export to MD, HTML, PDF, PNG
- Share via compressed links
- **Interactive Mermaid diagrams** - Click to zoom and copy!
- LaTeX math support
- 20+ programming languages
- Mobile-friendly design

## 📝 How to Use
1. Type markdown in the left editor
2. See live preview on the right
3. Choose your preferred themes
4. Export or share your work
5. **Click any Mermaid diagram to zoom and copy!**

## Markdown Syntax Guide

### Headers
# H1
## H2
### H3

### Emphasis
*italic* or _italic_
**bold** or __bold__
***bold italic***
~~strikethrough~~

### Lists
- Unordered item
- Another item

1. Ordered item
2. Another item

- [ ] Task list
- [x] Completed task

### Links & Images
[Link text](https://example.com)
![Alt text](image-url.jpg)

### Code
Inline \`code\` with backticks

\`\`\`javascript
// Code block
function hello() {
  console.log("Hello World!");
}
\`\`\`

### Tables
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

### Blockquotes
> This is a blockquote

### Math (LaTeX)
Inline: $E = mc^2$

Block:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### Mermaid Diagrams (Click to Zoom!)

\`\`\`mermaid
graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Result 1]
  B -->|No| D[Result 2]
  C --> E[End]
  D --> E
\`\`\`

\`\`\`mermaid
sequenceDiagram
  participant User
  participant Editor
  participant Preview
  User->>Editor: Type markdown
  Editor->>Preview: Update content
  Preview->>User: Show rendered output
\`\`\`

\`\`\`mermaid
pie title Project Distribution
  "Development" : 40
  "Testing" : 20
  "Documentation" : 25
  "Deployment" : 15
\`\`\`

---

Start editing to see your changes in real-time!
`;

export const EDITOR_THEMES = [
  'vs-code-dark',
  'vs-code-light',
  'monokai',
  'dracula',
  'solarized',
];

export const PREVIEW_THEMES = [
  'github',
  'medium',
  'minimal',
  'professional',
  'academic',
];

export const EXPORT_FORMATS = ['md', 'html', 'pdf', 'png'];

export const PDF_PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  Letter: { width: 216, height: 279 },
  Legal: { width: 216, height: 356 },
};

export const PDF_MARGINS = {
  None: 0,
  Small: 10,
  Medium: 20,
  Large: 30,
};

export const PNG_WIDTHS = [800, 1200, 1600, 2400];

export const STORAGE_KEYS = {
  CONTENT: 'markdown-editor-content',
  EDITOR_THEME: 'markdown-editor-theme',
  PREVIEW_THEME: 'markdown-preview-theme',
  DARK_MODE: 'markdown-dark-mode',
  PANEL_SIZES: 'markdown-panel-sizes',
};
