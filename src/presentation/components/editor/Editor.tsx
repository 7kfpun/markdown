import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
} from '@mui/material';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useMarkdownStore } from '../../../infrastructure/store/useMarkdownStore';
import { DEBOUNCE_TIMES } from '../../../utils/constants';
import { useTranslation } from 'react-i18next';

export interface EditorHandle { }

interface Props { }

const Editor = forwardRef<EditorHandle, Props>((_, ref) => {
  const {
    content,
    updateContent,
    editorTheme,
    editorFontSize,
    editorWrap,
    setEditorTheme,
    setEditorFontSize,
    setEditorWrap,
  } = useMarkdownStore();
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const editorViewRef = useRef<EditorView | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const countUpdateTimeoutRef = useRef<number>();

  // Debounced word/character count updates
  useEffect(() => {
    if (countUpdateTimeoutRef.current) {
      clearTimeout(countUpdateTimeoutRef.current);
    }

    countUpdateTimeoutRef.current = window.setTimeout(() => {
      setWordCount(content.split(/\s+/).filter(Boolean).length);
      setCharCount(content.length);
    }, DEBOUNCE_TIMES.WORD_COUNT);

    return () => {
      if (countUpdateTimeoutRef.current) {
        clearTimeout(countUpdateTimeoutRef.current);
      }
    };
  }, [content]);


  const baseMarkdownStyles = useMemo(
    () =>
      EditorView.theme({
        '.cm-header': { textDecoration: 'none' },
        '.cm-content': { fontSize: `${editorFontSize}px` },
      }),
    [editorFontSize]
  );

  const themeExtensions = useMemo<Record<string, Extension>>(
    () => ({
      'github-light': EditorView.theme(
        {
          '&': { backgroundColor: '#ffffff', color: '#24292f' },
          '.cm-content': { caretColor: '#0969da' },
          '.cm-selectionBackground': { backgroundColor: '#add6ff !important' },
          '&.cm-focused .cm-selectionBackground': { backgroundColor: '#add6ff !important' },
          '.cm-scroller': { backgroundColor: '#ffffff' },
          '.cm-activeLine': { backgroundColor: '#f6f8fa' },
          '.cm-gutters': { backgroundColor: '#f6f8fa', color: '#57606a', borderRight: '1px solid #d0d7de' },
        },
        { dark: false }
      ),
      'solarized-light': EditorView.theme(
        {
          '&': { backgroundColor: '#fdf6e3', color: '#657b83' },
          '.cm-content': { caretColor: '#268bd2' },
          '.cm-selectionBackground': { backgroundColor: '#93cee9 !important' },
          '&.cm-focused .cm-selectionBackground': { backgroundColor: '#93cee9 !important' },
          '.cm-scroller': { backgroundColor: '#fdf6e3' },
          '.cm-activeLine': { backgroundColor: '#eee8d5' },
          '.cm-gutters': { backgroundColor: '#eee8d5', color: '#93a1a1' },
        },
        { dark: false }
      ),
      'vs-code-light': EditorView.theme(
        {
          '&': { backgroundColor: '#ffffff', color: '#000000' },
          '.cm-content': { caretColor: '#000000' },
          '.cm-selectionBackground': { backgroundColor: '#add6ff !important' },
          '&.cm-focused .cm-selectionBackground': { backgroundColor: '#add6ff !important' },
          '.cm-scroller': { backgroundColor: '#ffffff' },
          '.cm-activeLine': { backgroundColor: '#f3f3f3' },
          '.cm-gutters': { backgroundColor: '#f3f3f3', color: '#237893' },
        },
        { dark: false }
      ),
      'github-dark': EditorView.theme(
        {
          '&': { backgroundColor: '#0d1117', color: '#c9d1d9' },
          '.cm-content': { caretColor: '#58a6ff' },
          '.cm-selectionBackground': { backgroundColor: 'rgba(88,166,255,0.4) !important' },
          '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(88,166,255,0.55) !important' },
          '.cm-scroller': { backgroundColor: '#0d1117' },
          '.cm-activeLine': { backgroundColor: '#161b22' },
          '.cm-gutters': { backgroundColor: '#161b22', color: '#8b949e', borderRight: '1px solid #30363d' },
        },
        { dark: true }
      ),
      'monokai': EditorView.theme(
        {
          '&': { backgroundColor: '#272822', color: '#f8f8f2' },
          '.cm-content': { caretColor: '#f8f8f0' },
          '.cm-selectionBackground': { backgroundColor: 'rgba(255,217,102,0.35) !important' },
          '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(255,217,102,0.5) !important' },
          '.cm-scroller': { backgroundColor: '#272822' },
          '.cm-activeLine': { backgroundColor: '#3e3d32' },
          '.cm-gutters': { backgroundColor: '#272822', color: '#8f908a' },
        },
        { dark: true }
      ),
      'dracula': EditorView.theme(
        {
          '&': { backgroundColor: '#282a36', color: '#f8f8f2' },
          '.cm-content': { caretColor: '#f8f8f2' },
          '.cm-selectionBackground': { backgroundColor: 'rgba(189,147,249,0.4) !important' },
          '&.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(189,147,249,0.55) !important' },
          '.cm-scroller': { backgroundColor: '#282a36' },
          '.cm-activeLine': { backgroundColor: '#44475a' },
          '.cm-gutters': { backgroundColor: '#282a36', color: '#6272a4' },
        },
        { dark: true }
      ),
      'one-dark': oneDark,
    }),
    []
  );

  const codeMirrorTheme = themeExtensions[editorTheme] ?? themeExtensions['one-dark'];

  const toggleWrap = useCallback((view: EditorView, wrapper: string) => {
    const { state } = view;
    const selection = state.selection.main;
    const selectedText = state.doc.sliceString(selection.from, selection.to);
    const hasWrapper =
      selectedText.startsWith(wrapper) && selectedText.endsWith(wrapper) && selectedText.length >= wrapper.length * 2;
    const text = hasWrapper
      ? selectedText.slice(wrapper.length, selectedText.length - wrapper.length)
      : `${wrapper}${selectedText || 'text'}${wrapper}`;
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: text },
      selection: hasWrapper
        ? { anchor: selection.from, head: selection.from + text.length }
        : { anchor: selection.from + wrapper.length, head: selection.from + text.length - wrapper.length },
      scrollIntoView: true,
    });
    return true;
  }, []);

  const insertLink = useCallback((view: EditorView) => {
    const { state } = view;
    const selection = state.selection.main;
    const selectedText = state.doc.sliceString(selection.from, selection.to) || 'link text';
    const placeholderUrl = 'https://';
    const insertText = `[${selectedText}](${placeholderUrl})`;
    const cursorPos = selection.from + selectedText.length + 3; // position after opening [
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: insertText },
      selection: { anchor: cursorPos, head: cursorPos + placeholderUrl.length },
      scrollIntoView: true,
    });
    return true;
  }, []);

  const markdownKeymap = useMemo(
    () => [
      {
        key: 'Mod-b',
        run: (view: EditorView) => toggleWrap(view, '**'),
      },
      {
        key: 'Mod-i',
        run: (view: EditorView) => toggleWrap(view, '_'),
      },
      {
        key: 'Mod-e',
        run: (view: EditorView) => toggleWrap(view, '`'),
      },
      {
        key: 'Mod-k',
        run: (view: EditorView) => insertLink(view),
      },
    ],
    [toggleWrap, insertLink]
  );

  useImperativeHandle(
    ref,
    () => ({}),
    []
  );


  const handleFileDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      const hasFiles = event.dataTransfer.types?.includes('Files');
      if (!hasFiles) return;

      event.preventDefault();
      setIsDragOver(false);

      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      const isMarkdown =
        file.type === 'text/markdown' ||
        file.type === 'text/plain' ||
        /\.md$|\.markdown$|\.txt$/i.test(file.name);

      if (!isMarkdown) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        updateContent(text);
      };
      reader.readAsText(file);
    },
    [updateContent]
  );

  const markdownExtension = useMemo(() => markdown({ codeLanguages: languages }), []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types?.includes('Files')) {
          e.preventDefault();
          setIsDragOver(true);
        }
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleFileDrop}
    >
      <Box sx={{ flex: 1, overflow: 'auto', border: isDragOver ? '2px dashed #1f7aec' : 'none' }}>
        <CodeMirror
          value={content}
          height="100%"
          extensions={[
            markdownExtension,
            baseMarkdownStyles,
            keymap.of(markdownKeymap),
            editorWrap ? EditorView.lineWrapping : [],
          ]}
          theme={codeMirrorTheme}
          onChange={(value) => updateContent(value)}
          onCreateEditor={(view) => {
            editorViewRef.current = view;
          }}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
            drawSelection: true,
          }}
        />
      </Box>
      {isDragOver && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            bgcolor: 'rgba(31, 122, 236, 0.08)',
            border: '2px dashed #1f7aec',
            borderRadius: 1,
          }}
        />
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="editor-theme-label">{t('editor.editorTheme')}</InputLabel>
          <Select
            labelId="editor-theme-label"
            label={t('editor.editorTheme')}
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value as string)}
          >
            <MenuItem value="one-dark">{t('editor.themes.oneDark')}</MenuItem>
            <MenuItem value="github-light">{t('editor.themes.githubLight')}</MenuItem>
            <MenuItem value="solarized-light">{t('editor.themes.solarizedLight')}</MenuItem>
            <MenuItem value="vs-code-light">{t('editor.themes.vsCodeLight')}</MenuItem>
            <MenuItem value="github-dark">{t('editor.themes.githubDark')}</MenuItem>
            <MenuItem value="monokai">{t('editor.themes.monokai')}</MenuItem>
            <MenuItem value="dracula">{t('editor.themes.dracula')}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="editor-fontsize-label">{t('editor.fontSize')}</InputLabel>
          <Select
            labelId="editor-fontsize-label"
            label={t('editor.fontSize')}
            value={editorFontSize}
            onChange={(e) => setEditorFontSize(Number(e.target.value))}
          >
            {[12, 13, 14, 15, 16].map((size) => (
              <MenuItem key={size} value={size}>
                {size}px
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch size="small" checked={editorWrap} onChange={(e) => setEditorWrap(e.target.checked)} />}
          label={t('editor.wrap')}
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {t('editor.characters')}: {charCount} | {t('editor.words')}: {wordCount}
        </Typography>
      </Box>
    </Box>
  );
});

export default Editor;
