import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
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

export interface EditorHandle {
  scrollToRatio: (ratio: number) => void;
}

interface Props {
  onScrollRatioChange?: (ratio: number) => void;
}

const Editor = forwardRef<EditorHandle, Props>(({ onScrollRatioChange }, ref) => {
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
  const [isDragOver, setIsDragOver] = useState(false);
  const editorViewRef = useRef<EditorView | null>(null);
  const [viewReady, setViewReady] = useState(false);
  const onScrollHandlerRef = useRef<((ratio: number) => void) | undefined>(onScrollRatioChange);
  const isSyncingRef = useRef(false);

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  useEffect(() => {
    onScrollHandlerRef.current = onScrollRatioChange;
  }, [onScrollRatioChange]);

  const baseMarkdownStyles = useMemo(
    () =>
      EditorView.theme({
        '.cm-header': { textDecoration: 'none' },
        '.cm-content': { fontSize: `${editorFontSize}px` },
        '.cm-selectionBackground': { backgroundColor: 'rgba(255, 170, 25, 0.35)' },
        '.cm-content ::selection': { backgroundColor: 'rgba(255, 170, 25, 0.35)' },
        '.cm-line::selection': { backgroundColor: 'rgba(255, 170, 25, 0.35)' },
        '.cm-selectionMatch': { backgroundColor: 'rgba(255, 170, 25, 0.25)' },
      }),
    [editorFontSize]
  );

  const themeExtensions = useMemo<Record<string, Extension>>(
    () => ({
      'light-default': EditorView.theme(
        {
          '&': { backgroundColor: '#f8f9fb', color: '#0f1419' },
          '.cm-content': { caretColor: '#1f7aec' },
          '.cm-selectionBackground': { backgroundColor: 'rgba(31,122,236,0.35) !important' },
          '.cm-scroller': { backgroundColor: '#f8f9fb' },
          '.cm-activeLine': { backgroundColor: '#eaf2ff' },
          '.cm-gutters': { backgroundColor: '#f3f5f9', color: '#6b7280' },
        },
        { dark: false }
      ),
      'light-colorblind': EditorView.theme(
        {
          '&': { backgroundColor: '#f7f8f0', color: '#0f1419' },
          '.cm-selectionBackground': { backgroundColor: 'rgba(94,134,0,0.28) !important' },
          '.cm-scroller': { backgroundColor: '#f7f8f0' },
          '.cm-activeLine': { backgroundColor: '#e7eedc' },
          '.cm-gutters': { backgroundColor: '#f1f3e6', color: '#5b6455' },
        },
        { dark: false }
      ),
      'light-tritanopia': EditorView.theme(
        {
          '&': { backgroundColor: '#f7fbff', color: '#0f1419' },
          '.cm-selectionBackground': { backgroundColor: 'rgba(46,116,181,0.22) !important' },
          '.cm-scroller': { backgroundColor: '#f7fbff' },
          '.cm-activeLine': { backgroundColor: '#e5f0fb' },
          '.cm-gutters': { backgroundColor: '#eef6ff', color: '#5f6a7a' },
        },
        { dark: false }
      ),
      'dark-default': oneDark,
      'dark-colorblind': EditorView.theme(
        {
          '&': { backgroundColor: '#1f2428', color: '#e5e7eb' },
          '.cm-selectionBackground': { backgroundColor: 'rgba(255,186,69,0.28) !important' },
          '.cm-scroller': { backgroundColor: '#1f2428' },
          '.cm-activeLine': { backgroundColor: '#2b3035' },
          '.cm-gutters': { backgroundColor: '#1f2428', color: '#7d8288' },
        },
        { dark: true }
      ),
      'dark-tritanopia': EditorView.theme(
        {
          '&': { backgroundColor: '#1f222a', color: '#e5e7eb' },
          '.cm-selectionBackground': { backgroundColor: 'rgba(238,92,96,0.32) !important' },
          '.cm-scroller': { backgroundColor: '#1f222a' },
          '.cm-activeLine': { backgroundColor: '#2a2d36' },
          '.cm-gutters': { backgroundColor: '#1f222a', color: '#7d8288' },
        },
        { dark: true }
      ),
      'soft-dark': EditorView.theme(
        {
          '&': { backgroundColor: '#252931', color: '#e5e7eb' },
          '.cm-selectionBackground': { backgroundColor: 'rgba(91,156,255,0.28) !important' },
          '.cm-scroller': { backgroundColor: '#252931' },
          '.cm-activeLine': { backgroundColor: '#313640' },
          '.cm-gutters': { backgroundColor: '#252931', color: '#8a9099' },
        },
        { dark: true }
      ),
    }),
    []
  );

  const codeMirrorTheme = themeExtensions[editorTheme] ?? themeExtensions['light-default'];

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
    () => ({
      scrollToRatio: (ratio: number) => {
        const scroller = editorViewRef.current?.scrollDOM;
        if (!scroller) return;
        isSyncingRef.current = true;
        const maxScroll = scroller.scrollHeight - scroller.clientHeight;
        scroller.scrollTop = ratio * maxScroll;
        // Release the lock on the next frame to allow incoming sync
        requestAnimationFrame(() => {
          isSyncingRef.current = false;
        });
      },
    }),
    []
  );

  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;
    const scroller = view.scrollDOM;

    const handleScroll = () => {
      if (!onScrollHandlerRef.current || isSyncingRef.current) return;
      isSyncingRef.current = true;
      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      const ratio = maxScroll > 0 ? scroller.scrollTop / maxScroll : 0;
      onScrollHandlerRef.current(ratio);
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', handleScroll);
  }, [viewReady]);

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
          extensions={[markdown(), baseMarkdownStyles, keymap.of(markdownKeymap), editorWrap ? EditorView.lineWrapping : []]}
          theme={codeMirrorTheme}
          onChange={(value) => updateContent(value)}
          onCreateEditor={(view) => {
            editorViewRef.current = view;
            setViewReady(true);
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
          <InputLabel id="editor-theme-label">Editor Theme</InputLabel>
          <Select
            labelId="editor-theme-label"
            label="Editor Theme"
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value as string)}
          >
            <MenuItem value="light-default">Light default</MenuItem>
            <MenuItem value="light-colorblind">Light colorblind</MenuItem>
            <MenuItem value="light-tritanopia">Light Tritanopia</MenuItem>
            <MenuItem value="dark-default">Dark default</MenuItem>
            <MenuItem value="dark-colorblind">Dark colorblind</MenuItem>
            <MenuItem value="dark-tritanopia">Dark Tritanopia</MenuItem>
            <MenuItem value="soft-dark">Soft dark</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="editor-fontsize-label">Font Size</InputLabel>
          <Select
            labelId="editor-fontsize-label"
            label="Font Size"
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
          label="Wrap"
        />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          Characters: {charCount} | Words: {wordCount}
        </Typography>
      </Box>
    </Box>
  );
});

export default Editor;
