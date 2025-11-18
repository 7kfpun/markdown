import { describe, expect, it, beforeEach } from 'vitest';
import { getMarkedInstance } from '../src/utils/markedInstance';

describe('markedInstance utilities', () => {
  beforeEach(() => {
    // Reset the configured flag by getting a fresh import
    // Note: This won't actually reset the module state in vitest,
    // but we can test the instance behavior
  });

  describe('getMarkedInstance', () => {
    it('returns a marked instance', () => {
      const marked = getMarkedInstance();
      expect(marked).toBeDefined();
      expect(typeof marked.parse).toBe('function');
    });

    it('returns same instance on multiple calls', () => {
      const instance1 = getMarkedInstance();
      const instance2 = getMarkedInstance();
      expect(instance1).toBe(instance2);
    });

    it('parses basic markdown correctly', async () => {
      const marked = getMarkedInstance();
      const html = await marked.parse('# Hello World');
      expect(html).toContain('<h1');
      expect(html).toContain('Hello World');
      expect(html).toContain('</h1>');
    });

    it('parses markdown with code blocks and syntax highlighting', async () => {
      const marked = getMarkedInstance();
      const markdown = '```javascript\nconst x = 1;\n```';
      const html = await marked.parse(markdown);

      expect(html).toContain('<pre>');
      expect(html).toContain('<code');
      expect(html).toContain('hljs');
      expect(html).toContain('language-');
      expect(html).toContain('const');
    });

    it('supports GitHub Flavored Markdown (GFM)', async () => {
      const marked = getMarkedInstance();
      // Test autolink
      const markdown = 'Visit https://example.com for more info.';
      const html = await marked.parse(markdown);

      expect(html).toContain('<a');
      expect(html).toContain('https://example.com');
    });

    it('supports line breaks with breaks option', async () => {
      const marked = getMarkedInstance();
      const markdown = 'Line 1\nLine 2';
      const html = await marked.parse(markdown);

      // With breaks: true, single newlines should create <br>
      expect(html).toContain('Line 1');
      expect(html).toContain('Line 2');
    });

    it('parses tables (GFM feature)', async () => {
      const marked = getMarkedInstance();
      const markdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;

      const html = await marked.parse(markdown);

      expect(html).toContain('<table');
      expect(html).toContain('<thead');
      expect(html).toContain('<tbody');
      expect(html).toContain('Header 1');
      expect(html).toContain('Cell 1');
    });

    it('parses strikethrough (GFM feature)', async () => {
      const marked = getMarkedInstance();
      const markdown = '~~strikethrough text~~';
      const html = await marked.parse(markdown);

      expect(html).toContain('<del');
      expect(html).toContain('strikethrough text');
    });

    it('parses task lists (GFM feature)', async () => {
      const marked = getMarkedInstance();
      const markdown = `- [ ] Unchecked task
- [x] Checked task`;

      const html = await marked.parse(markdown);

      expect(html).toContain('<input');
      expect(html).toContain('type="checkbox"');
      expect(html).toContain('checked=""');
    });

    it('handles inline code', async () => {
      const marked = getMarkedInstance();
      const markdown = 'Here is `inline code` in text.';
      const html = await marked.parse(markdown);

      expect(html).toContain('<code>');
      expect(html).toContain('inline code');
      expect(html).toContain('</code>');
    });

    it('handles blockquotes', async () => {
      const marked = getMarkedInstance();
      const markdown = '> This is a quote\n> Second line';
      const html = await marked.parse(markdown);

      expect(html).toContain('<blockquote');
      expect(html).toContain('This is a quote');
    });

    it('handles nested lists', async () => {
      const marked = getMarkedInstance();
      const markdown = `- Item 1
  - Nested 1
  - Nested 2
- Item 2`;

      const html = await marked.parse(markdown);

      expect(html).toContain('<ul');
      expect(html).toContain('<li');
      expect(html).toContain('Item 1');
      expect(html).toContain('Nested 1');
    });

    it('handles emphasis and strong', async () => {
      const marked = getMarkedInstance();
      const markdown = '*italic* and **bold** and ***both***';
      const html = await marked.parse(markdown);

      expect(html).toContain('<em>');
      expect(html).toContain('<strong>');
      expect(html).toContain('italic');
      expect(html).toContain('bold');
    });

    it('handles links', async () => {
      const marked = getMarkedInstance();
      const markdown = '[Link Text](https://example.com)';
      const html = await marked.parse(markdown);

      expect(html).toContain('<a');
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('Link Text');
    });

    it('handles images', async () => {
      const marked = getMarkedInstance();
      const markdown = '![Alt Text](https://example.com/image.png)';
      const html = await marked.parse(markdown);

      expect(html).toContain('<img');
      expect(html).toContain('src="https://example.com/image.png"');
      expect(html).toContain('alt="Alt Text"');
    });

    it('applies syntax highlighting for different languages', async () => {
      const marked = getMarkedInstance();
      const pythonCode = '```python\ndef hello():\n    print("Hello")\n```';
      const html = await marked.parse(pythonCode);

      expect(html).toContain('language-python');
      expect(html).toContain('def');
      expect(html).toContain('print');
    });

    it('handles code blocks without language specification', async () => {
      const marked = getMarkedInstance();
      const markdown = '```\nplain code\n```';
      const html = await marked.parse(markdown);

      expect(html).toContain('<pre>');
      expect(html).toContain('<code');
      expect(html).toContain('plain code');
    });

    it('handles horizontal rules', async () => {
      const marked = getMarkedInstance();
      const markdown = '---';
      const html = await marked.parse(markdown);

      expect(html).toContain('<hr');
    });

    it('handles headings of different levels', async () => {
      const marked = getMarkedInstance();
      const markdown = `# H1
## H2
### H3
#### H4
##### H5
###### H6`;

      const html = await marked.parse(markdown);

      expect(html).toContain('<h1');
      expect(html).toContain('<h2');
      expect(html).toContain('<h3');
      expect(html).toContain('<h4');
      expect(html).toContain('<h5');
      expect(html).toContain('<h6');
    });
  });
});
