import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

let configured = false;

const katexOptions = {
  throwOnError: false,
  output: 'html',
};

export function getMarkedInstance() {
  if (!configured) {
    marked.use(markedKatex(katexOptions));
    marked.use(
      markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language }).value;
        },
      })
    );
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
    configured = true;
  }

  return marked;
}
