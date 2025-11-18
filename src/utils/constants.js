export const DEFAULT_MARKDOWN = `# Welcome to 1Markdown - Free Online Markdown Editor

**1Markdown** is a powerful, feature-rich markdown editor designed for developers, writers, students, and anyone who works with technical documentation. Create beautiful documents with real-time preview, interactive diagrams, mathematical equations, and share them instantly with a single link—no account required!

## 🚀 Key Features

### ✍️ Real-Time Editing Experience
- **Live Preview**: See your markdown rendered instantly as you type
- **Split View Mode**: Edit and preview side-by-side for maximum productivity
- **Syntax Highlighting**: Support for 20+ programming languages with beautiful code highlighting
- **Multiple Themes**: Choose from light, dark, colorblind-friendly, and accessibility-optimized editor themes
- **Auto-Save**: Your work is automatically saved to local storage—never lose your progress
- **Session History**: Click the History icon 📜 in the toolbar to view, restore, rename, or delete past versions

### 📊 Interactive Mermaid Diagrams
Create stunning diagrams directly in markdown! Click any diagram to zoom, copy as PNG/SVG, or download for presentations:
- Flowcharts & Decision Trees
- Sequence Diagrams
- Class Diagrams (UML)
- State Diagrams
- Gantt Charts
- Entity Relationship Diagrams
- Pie Charts & More!

### 🔢 LaTeX Math Support
Write complex mathematical equations with full LaTeX support:
- Inline equations: \`$E = mc^2$\`
- Block equations with proper formatting
- Perfect for academic papers, research notes, and technical documentation

### 📜 Session History & Auto-Save
- **Auto-Snapshots**: Automatic snapshots every 10 minutes create a timeline of your work
- **Git-like History**: Append-only version timeline—never lose previous versions
- **Quick Restore**: One-click restore to any previous session from history
- **Rename Sessions**: Organize your work with custom session names
- **Smart Cleanup**: Keeps latest 100 sessions automatically
- **Manual Save**: Press Cmd/Ctrl+S to save and update URL immediately

### 📤 Powerful Export Options
- **PDF Export**: Print-optimized layout with browser's native print dialog
- **HTML Export**: Standalone HTML files with embedded styles
- **Markdown Export**: Download your raw .md files
- **Share Links**: Generate compressed shareable links (supports up to 50KB of markdown)

### 🔗 Instant Sharing
Share your documents via compressed URLs—no server uploads, no storage limits, completely privacy-focused. Your content stays with you!

### ♿ Accessibility First
- Colorblind-friendly themes
- Tritanopia-optimized themes
- Keyboard shortcuts for power users
- Screen reader compatible

## 📝 Complete Markdown Syntax Guide

### Headers & Typography
Create hierarchical document structure with headers:

# Heading 1 (H1)
## Heading 2 (H2)
### Heading 3 (H3)
#### Heading 4 (H4)
##### Heading 5 (H5)
###### Heading 6 (H6)

### Text Formatting & Emphasis

**Bold text** or __bold text__
*Italic text* or _italic text_
***Bold and italic*** or ___bold and italic___
~~Strikethrough text~~
\`Inline code\`

You can combine formatting: **Bold _and italic_** or ***everything together***!

### Lists & Task Management

**Unordered Lists:**
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

**Ordered Lists:**
1. First item
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2
3. Third item

**Task Lists (Perfect for TODO lists):**
- [x] Completed task
- [x] Another completed task
- [ ] Pending task
- [ ] Another pending task

### Links & Images

**Links:**
[Visit 1Markdown](https://1markdown.com)
[Link with title](https://example.com "Hover to see title")

**Images:**
![Alt text description](/og-image.png)
![Image with title](/og-image-light.png "Image with title")

**Reference-style links:**
[1Markdown][1markdown]
[GitHub][gh]

[1markdown]: https://1markdown.com
[gh]: https://github.com

### Code Blocks with Syntax Highlighting

1Markdown supports syntax highlighting for 20+ programming languages! Just specify the language after the opening backticks.

Inline code: \`const variable = "value";\`

**JavaScript:**
\`\`\`javascript
// JavaScript example - Fibonacci sequence
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
console.log(fibonacci(10)); // Output: 55
\`\`\`

**Python:**
\`\`\`python
# Python example - Quick sort algorithm
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

print(quick_sort([3,6,8,10,1,2,1]))
\`\`\`

**TypeScript:**
\`\`\`typescript
// TypeScript example - Type-safe user interface
interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" }
];
\`\`\`

**SQL:**
\`\`\`sql
-- SQL example - User order statistics
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.name
HAVING order_count > 5
ORDER BY order_count DESC;
\`\`\`

**Supported Languages:**
JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, Scala, R, SQL, HTML, CSS, JSON, YAML, XML, Bash, Shell, Markdown, and more!

### Tables

Create beautiful tables for data presentation:

**1Markdown Features Comparison:**
| Feature | 1Markdown | Competitor A | Competitor B |
|---------|-----------|--------------|--------------|
| Real-time Preview | ✅ Yes | ✅ Yes | ❌ No |
| Mermaid Diagrams | ✅ Yes (13+ types) | ❌ No | ❌ No |
| LaTeX Math | ✅ Yes | ✅ Yes | ❌ No |
| **Session History** | **✅ Yes (100 versions)** | **❌ No** | **❌ No** |
| **Auto-Snapshots** | **✅ Every 10 min** | **❌ No** | **❌ No** |
| Share Links | ✅ Yes (up to 50KB) | ❌ No | ✅ Yes (limited) |
| Syntax Highlighting | ✅ Yes (20+ languages) | ✅ Yes | ❌ No |
| PDF Export | ✅ Yes (native print) | ✅ Yes | ❌ No |
| No Sign-up Required | ✅ Yes | ❌ No | ✅ Yes |
| Privacy First | ✅ Yes (local storage) | ❌ Server storage | ❌ Server storage |
| Open Source | ✅ Yes | ❌ No | ❌ No |
| Price | ✅ Free | ❌ $10/month | ✅ Free |

**Export Options:**
| Format | File Extension | Use Case |
|--------|---------------|----------|
| Markdown | .md | Source code, version control |
| HTML | .html | Websites, email |
| PDF | .pdf | Documents, presentations, printing |

**Keyboard Shortcuts:**
| Action | Windows/Linux | macOS |
|--------|--------------|--------|
| Bold | Ctrl + B | Cmd + B |
| Italic | Ctrl + I | Cmd + I |
| Code | Ctrl + E | Cmd + E |
| Link | Ctrl + K | Cmd + K |
| **Save** | **Ctrl + S** | **Cmd + S** |

### Blockquotes

> "Markdown is a lightweight markup language with plain text formatting syntax."
> — John Gruber

**Nested blockquotes:**
> Level 1 quote
>> Level 2 nested quote
>>> Level 3 nested quote

> **Note:** You can use **formatting** inside blockquotes!

### Horizontal Rules

Separate sections with horizontal lines:

---

Three or more hyphens, asterisks, or underscores:

***

___

### LaTeX Mathematical Equations

**Inline Math:**
The equation $E = mc^2$ represents mass-energy equivalence.

The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$

**Block Math Equations:**

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

**Matrix notation:**
$$
A = \\begin{bmatrix}
a_{11} & a_{12} & a_{13} \\\\
a_{21} & a_{22} & a_{23} \\\\
a_{31} & a_{32} & a_{33}
\\end{bmatrix}
$$

**Summation:**
$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

**Limits:**
$$
\\lim_{x \\to \\infty} \\frac{1}{x} = 0
$$

### Interactive Mermaid Diagrams

💡 **Pro Tip:** Click any diagram below to open in full-screen mode, then copy as PNG/SVG or download!

**Flowchart: How to Report a Bug on 1Markdown**
\`\`\`mermaid
graph TD
  A[Found a bug?] --> B[Click bug report icon in header]
  B --> C[Opens Google Form]
  C --> D[Fill bug description]
  D --> E[Add screenshots if needed]
  E --> F[Submit form]
  F --> G[Team receives notification]
  G --> H[Bug gets investigated]
  H --> I{Can reproduce?}
  I -->|Yes| J[Fix & deploy]
  I -->|No| K[Request more info]
  K --> D
  J --> L[User notified]
  L --> M[Bug fixed!]
\`\`\`

**Sequence Diagram: How to Share a Link on 1Markdown**
\`\`\`mermaid
sequenceDiagram
  participant User
  participant Editor as 1Markdown Editor
  participant Compressor as Compression Engine
  participant Clipboard

  User->>Editor: Click share button
  Editor->>Compressor: Send markdown content
  Compressor->>Compressor: Compress with Pako DEFLATE level 9
  Compressor->>Compressor: Generate URL-safe base64
  Compressor->>Compressor: Create share URL
  Compressor-->>Editor: Return compressed link
  Editor->>Clipboard: Copy link to clipboard
  Editor-->>User: Show "Link copied!" toast
  User->>User: Share link with others
  Note over User,Clipboard: All compression happens locally!<br/>No server upload, content in URL
\`\`\`

**Class Diagram: 1Markdown Architecture**
\`\`\`mermaid
classDiagram
  class EditorPage {
    +content: string
    +darkMode: boolean
    +handleShare()
    +handleExport()
    +handleImport()
  }
  class Preview {
    +html: string
    +mermaidBlocks: array
    +renderMermaid()
    +openModal()
  }
  class MarkdownStore {
    +content: string
    +editorTheme: string
    +updateContent()
    +toggleDarkMode()
  }
  class ExportUtils {
    +openPrintPage()
    +downloadMarkdown()
    +downloadHTML()
  }
  EditorPage --> Preview: displays
  EditorPage --> MarkdownStore: uses
  EditorPage --> ExportUtils: uses
  Preview --> MarkdownStore: reads from
\`\`\`

**State Diagram: Document Sharing Workflow**
\`\`\`mermaid
stateDiagram-v2
  [*] --> Editing: User creates content
  Editing --> Editing: Auto-save to localStorage
  Editing --> Sharing: Click share button
  Sharing --> Compressing: Compress with Pako
  Compressing --> URLGeneration: Generate URL-safe base64
  URLGeneration --> Copied: Copy link to clipboard
  URLGeneration --> TooLarge: Content > 10KB
  TooLarge --> Editing: Use download instead
  Copied --> [*]: Share with others

  note right of Compressing: Maximum compression<br/>DEFLATE level 9
  note right of URLGeneration: No server upload<br/>Content in URL!
\`\`\`

**Gantt Chart: Creating Documentation with 1Markdown**
\`\`\`mermaid
gantt
  title Documentation Project Timeline
  dateFormat YYYY-MM-DD
  section Research
  Gather information :done, research, 2024-01-01, 3d
  Organize content :done, organize, after research, 2d
  section Writing
  Write in 1Markdown :active, write, 2024-01-06, 5d
  Add diagrams :active, diagrams, 2024-01-08, 3d
  section Review
  Internal review :review, after write, 2d
  Revisions :revise, after review, 2d
  section Publishing
  Export to PDF :export, after revise, 1d
  Share via link :share, after revise, 1d
\`\`\`

**Pie Chart: Syntax Highlighting Language Support**
\`\`\`mermaid
pie title Supported Programming Languages
  "JavaScript/TypeScript" : 20
  "Python/Ruby/PHP" : 18
  "Java/C++/C#/Go" : 22
  "Web (HTML/CSS/JSON)" : 15
  "Shell/Bash/SQL" : 12
  "Other Languages" : 13
\`\`\`

**Entity Relationship Diagram: 1Markdown Data Model**
\`\`\`mermaid
erDiagram
  USER ||--o{ DOCUMENT : creates
  DOCUMENT ||--|{ VERSION : has
  DOCUMENT {
    string id
    string content
    timestamp created_at
    timestamp updated_at
  }
  VERSION {
    string id
    string content
    timestamp saved_at
    string storage_location
  }
  USER {
    string browser_id
    object preferences
    boolean dark_mode
  }

  USER ||--o{ SETTINGS : configures
  SETTINGS {
    string editor_theme
    int font_size
    boolean word_wrap
  }
\`\`\`

**Git Graph:**
\`\`\`mermaid
gitGraph
  commit id: "Initial commit"
  commit id: "Add features"
  branch develop
  checkout develop
  commit id: "Development work"
  commit id: "Bug fixes"
  checkout main
  merge develop
  commit id: "Release v1.0"
  branch hotfix
  checkout hotfix
  commit id: "Critical fix"
  checkout main
  merge hotfix
  commit id: "Release v1.0.1"
\`\`\`

**Mindmap:**
\`\`\`mermaid
mindmap
  root((1Markdown))
    Features
      Real-time Preview
      Mermaid Diagrams
      LaTeX Math
      Syntax Highlighting
    Export Options
      PDF Export
      HTML Export
      Markdown Download
    Sharing
      Compressed Links
      No Server Storage
      Privacy First
    User Experience
      Split View
      Dark Mode
      Keyboard Shortcuts
\`\`\`

**Timeline:**
\`\`\`mermaid
timeline
    title 1Markdown Development Timeline
    2024-01 : Project Kickoff
           : Initial Design
    2024-02 : Core Editor
           : Markdown Preview
    2024-03 : Mermaid Integration
           : LaTeX Support
    2024-04 : Export Features
           : Share Links
    2024-05 : Performance Optimization
           : Lazy Loading
    2024-06 : Public Launch
           : SEO Optimization
\`\`\`

**User Journey:**
\`\`\`mermaid
journey
    title User Writing Documentation
    section Discovery
      Find 1Markdown: 5: User
      Read Features: 4: User
    section First Use
      Start Writing: 5: User
      See Live Preview: 5: User
      Try Mermaid Diagram: 5: User
    section Advanced Usage
      Export to PDF: 4: User
      Share Link: 5: User
      Import Existing Docs: 4: User
    section Daily Use
      Quick Notes: 5: User
      Project Documentation: 5: User
      Collaborate: 4: User
\`\`\`

**Quadrant Chart (Prioritization):**
\`\`\`mermaid
quadrantChart
    title Feature Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Do Later
    quadrant-2 Do First
    quadrant-3 Don't Do
    quadrant-4 Quick Wins
    PDF Export: [0.7, 0.8]
    Share Links: [0.3, 0.9]
    Dark Mode: [0.2, 0.6]
    Mobile App: [0.9, 0.5]
    More Themes: [0.4, 0.3]
    Performance: [0.6, 0.9]
\`\`\`


## ⌨️ Keyboard Shortcuts

Speed up your workflow with keyboard shortcuts:

- **Save (Manual)**: Ctrl/Cmd + S - Save immediately and update URL
- **Bold**: Ctrl/Cmd + B
- **Italic**: Ctrl/Cmd + I
- **Code**: Ctrl/Cmd + E
- **Link**: Ctrl/Cmd + K

## 🎨 Use Cases

### For Developers
- Technical documentation
- API documentation
- README files
- Code snippets with syntax highlighting
- Architecture diagrams with Mermaid

### For Students & Academics
- Research notes
- Lecture notes
- Mathematical equations with LaTeX
- Study guides
- Assignment documentation

### For Writers & Content Creators
- Blog post drafts
- Article outlines
- Meeting notes
- Project documentation
- Knowledge base articles

### For Teams
- Project planning
- Process documentation
- Flowcharts and diagrams
- Quick documentation sharing via links
- Collaborative note-taking

## 🔒 Privacy & Security

- **No Account Required**: Start using immediately
- **No Server Storage**: Your documents aren't stored on our servers
- **Local Storage**: Auto-save uses your browser's local storage
- **Share Links**: Content is compressed in the URL itself
- **Privacy First**: Your data stays with you

## 🆓 Completely Free

1Markdown is 100% free to use with all features unlocked:
- ✅ No sign-up required
- ✅ No credit card needed
- ✅ No usage limits
- ✅ No watermarks
- ✅ No ads
- ✅ Open source

## 🐛 Found a Bug or Have Feedback?

Help us improve! [Report bugs or request features](https://docs.google.com/forms/d/1PJbMNF_yUiiC_frG4EvASSpGV-bYSsHIA_mcEClzDj8)

## 📚 Privacy Policy

Read our [Privacy Policy](/privacy) to learn how we handle your data.

---

**Start creating amazing markdown documents now!** Replace this text with your content and see the magic happen in real-time. 🚀
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

// Debounce timing constants (in milliseconds)
export const DEBOUNCE_TIMES = {
  METADATA_SAVE: 5000, // 5 seconds for session metadata updates
  WORD_COUNT: 1000, // 1 second for word/character count updates
};
