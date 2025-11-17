import { Box } from '@mui/material';
import { Brightness4, Brightness7, GetApp, PictureAsPdf, Share, Upload, RestartAlt, Description, BugReport, Policy } from '@mui/icons-material';
import styled from 'styled-components';
import { useMarkdownStore } from '../../infrastructure/store/useMarkdownStore';
import { DEFAULT_MARKDOWN } from '../../utils/constants';
import { openPrintPage, downloadRenderedHTML } from '../../utils/export';
import Editor, { EditorHandle } from '../components/editor/Editor';
import Preview, { PreviewHandle } from '../components/preview/Preview';
import MermaidModal from '../components/mermaid/MermaidModal';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateShareLink } from '../../utils/compression';
import { downloadMarkdown } from '../../utils/export';

const PageContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const ContentContainer = styled(Box)`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const PanelContainer = styled(Box)<{ $show: boolean }>`
  flex: 1;
  overflow: hidden;
  display: ${(props) => (props.$show ? 'flex' : 'none')};
  flex-direction: column;
`;

const Header = styled.header<{ $dark: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: ${(p) =>
    p.$dark
      ? 'linear-gradient(135deg, #111827, #1f2937)'
      : 'linear-gradient(135deg, #1f7aec, #5ec5ff)'};
  color: ${(p) => (p.$dark ? '#e5e7eb' : '#f8fbff')};
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

const HeaderCenter = styled(HeaderSection)`
  justify-content: center;
`;

const HeaderRight = styled(HeaderSection)`
  justify-content: flex-end;
`;

const Logo = styled.div`
  font-weight: 700;
  letter-spacing: 0.2px;
  font-size: 18px;
  white-space: nowrap;
`;

const Segmented = styled.div<{ $dark: boolean }>`
  display: inline-flex;
  background: ${(p) => (p.$dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.16)')};
  border-radius: 10px;
  overflow: hidden;
  border: ${(p) => (p.$dark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.25)')};
`;

const SegmentedButton = styled.button<{ $active?: boolean; $dark?: boolean }>`
  appearance: none;
  border: none;
  padding: 8px 14px;
  background: ${(p) =>
    p.$active
      ? p.$dark
        ? 'rgba(255,255,255,0.16)'
        : 'rgba(255,255,255,0.25)'
      : 'transparent'};
  color: ${(p) => (p.$dark ? '#e5e7eb' : '#f8fbff')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover {
    background: ${(p) => (p.$dark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.22)')};
  }
  &:not(:last-child) {
    border-right: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

const ToolbarIconButton = styled.button<{ $dark: boolean }>`
  appearance: none;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: ${(p) => (p.$dark ? 'rgba(255,255,255,0.08)' : 'rgba(255, 255, 255, 0.15)')};
  color: ${(p) => (p.$dark ? '#e5e7eb' : '#f8fbff')};
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover {
    background: ${(p) => (p.$dark ? 'rgba(255,255,255,0.12)' : 'rgba(255, 255, 255, 0.25)')};
    transform: translateY(-1px);
  }
`;

const Resizer = styled.div`
  width: 8px;
  cursor: col-resize;
  background: linear-gradient(180deg, rgba(31, 122, 236, 0.1), rgba(94, 197, 255, 0.1));
  border-left: 1px solid rgba(0, 0, 0, 0.04);
  border-right: 1px solid rgba(0, 0, 0, 0.04);
  transition: background 0.2s ease;
  &:hover {
    background: linear-gradient(180deg, rgba(31, 122, 236, 0.18), rgba(94, 197, 255, 0.18));
  }
`;

export default function EditorPage() {
  const {
    darkMode,
    toggleDarkMode,
    showEditor,
    showPreview,
    togglePanels,
    content,
    resetContent,
    mermaidModal,
    closeMermaidModal,
  } = useMarkdownStore();

  const [toast, setToast] = useState('');
  const [splitSizes, setSplitSizes] = useState({ editor: 50, preview: 50 });
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorHandle>(null);
  const previewRef = useRef<PreviewHandle>(null);
  const syncingRef = useRef(false);
  const dragState = useRef<{ active: boolean; startX: number; startSizes: { editor: number; preview: number } }>({
    active: false,
    startX: 0,
    startSizes: { editor: 50, preview: 50 },
  });

  const handleShare = async () => {
    try {
      const link = generateShareLink(content);
      await navigator.clipboard.writeText(link);
      setToast('Link copied!');
      setTimeout(() => setToast(''), 2000);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Failed to share';
      setToast(reason);
      setTimeout(() => setToast(''), 2000);
    }
  };

  const handleExport = () => {
    downloadMarkdown(content);
  };

  const handleExportPDF = () => {
    openPrintPage(content);
  };

  const handleExportHTML = () => {
    const previewEl = document.getElementById('preview-container');
    if (previewEl) {
      downloadRenderedHTML(previewEl);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          useMarkdownStore.getState().updateContent(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleStartResize = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!contentRef.current) return;
    event.preventDefault();
    dragState.current = {
      active: true,
      startX: event.clientX,
      startSizes: splitSizes,
    };
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragState.current.active || !contentRef.current) return;
      const delta = event.clientX - dragState.current.startX;
      const totalWidth = contentRef.current.getBoundingClientRect().width;
      if (totalWidth <= 0) return;

      const deltaPercent = (delta / totalWidth) * 100;
      const newEditor = Math.min(85, Math.max(15, dragState.current.startSizes.editor + deltaPercent));
      const newPreview = 100 - newEditor;
      setSplitSizes({ editor: newEditor, preview: newPreview });
    },
    [setSplitSizes]
  );

  const handleMouseUp = useCallback(() => {
    dragState.current.active = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const layoutMode = useMemo(() => {
    if (showEditor && showPreview) return 'split';
    if (showEditor) return 'editor-only';
    return 'preview-only';
  }, [showEditor, showPreview]);

  const handleEditorScroll = useCallback(
    (ratio: number) => {
      if (!showPreview || !previewRef.current) return;
      if (syncingRef.current) return;
      syncingRef.current = true;
      previewRef.current.scrollToRatio(ratio);
      requestAnimationFrame(() => {
        syncingRef.current = false;
      });
    },
    [showPreview]
  );

  const handlePreviewScroll = useCallback(
    (ratio: number) => {
      if (!showEditor || !editorRef.current) return;
      if (syncingRef.current) return;
      syncingRef.current = true;
      editorRef.current.scrollToRatio(ratio);
      requestAnimationFrame(() => {
        syncingRef.current = false;
      });
    },
    [showEditor]
  );

  const handleReset = () => {
    if (content !== DEFAULT_MARKDOWN) {
      const confirmed = window.confirm('Reset content to default? Unsaved changes will be lost.');
      if (!confirmed) return;
    }
    resetContent();
  };

  return (
    <PageContainer>
      <Header $dark={darkMode}>
        <HeaderSection>
          <Logo>1Markdown</Logo>
        </HeaderSection>

        <HeaderCenter>
          <Segmented $dark={darkMode}>
            <SegmentedButton
              $active={layoutMode === 'editor-only'}
              $dark={darkMode}
              onClick={() => togglePanels('editor-only')}
            >
              Editor
            </SegmentedButton>
            <SegmentedButton $active={layoutMode === 'split'} $dark={darkMode} onClick={() => togglePanels('split')}>
              Split
            </SegmentedButton>
            <SegmentedButton
              $active={layoutMode === 'preview-only'}
              $dark={darkMode}
              onClick={() => togglePanels('preview-only')}
            >
              Preview
            </SegmentedButton>
          </Segmented>
        </HeaderCenter>

        <HeaderRight>
          <ToolbarIconButton
            onClick={() => window.open('https://docs.google.com/forms/d/1PJbMNF_yUiiC_frG4EvASSpGV-bYSsHIA_mcEClzDj8', '_blank')}
            title="Report a bug or request a feature"
            $dark={darkMode}
          >
            <BugReport fontSize="small" />
          </ToolbarIconButton>
          <ToolbarIconButton
            onClick={() => window.open('/privacy', '_blank')}
            title="Privacy Policy"
            $dark={darkMode}
          >
            <Policy fontSize="small" />
          </ToolbarIconButton>
          <ToolbarIconButton onClick={handleReset} title="Reset to default content" $dark={darkMode}>
            <RestartAlt fontSize="small" />
          </ToolbarIconButton>
          <ToolbarIconButton onClick={handleImport} title="Import Markdown or Text file" $dark={darkMode}>
            <Upload fontSize="small" />
          </ToolbarIconButton>
          <ToolbarIconButton onClick={handleShare} title="Share via compressed link" $dark={darkMode}>
            <Share fontSize="small" />
          </ToolbarIconButton>
          <ToolbarIconButton onClick={handleExport} title="Download as Markdown (.md)" $dark={darkMode}>
            <GetApp fontSize="small" />
          </ToolbarIconButton>
          <ToolbarIconButton onClick={handleExportHTML} title="Download as HTML file" $dark={darkMode}>
            <Description fontSize="small" />
          </ToolbarIconButton>
          <ToolbarIconButton onClick={handleExportPDF} title="Export to PDF (print dialog)" $dark={darkMode}>
            <PictureAsPdf fontSize="small" />
          </ToolbarIconButton>
          <ToolbarIconButton onClick={toggleDarkMode} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} $dark={darkMode}>
            {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
          </ToolbarIconButton>
        </HeaderRight>
      </Header>

      <ContentContainer ref={contentRef}>
        <PanelContainer
          $show={showEditor}
          sx={{
            flex: showEditor && showPreview ? `${splitSizes.editor}` : 1,
          }}
        >
          <Editor ref={editorRef} onScrollRatioChange={handleEditorScroll} />
        </PanelContainer>

        {showEditor && showPreview && <Resizer onMouseDown={handleStartResize} />}

        <PanelContainer
          $show={showPreview}
          sx={{
            flex: showEditor && showPreview ? `${splitSizes.preview}` : 1,
          }}
        >
          <Preview ref={previewRef} onScrollRatioChange={handlePreviewScroll} />
        </PanelContainer>
      </ContentContainer>

      {mermaidModal.isOpen && (
        <MermaidModal
          svg={mermaidModal.svg}
          code={mermaidModal.code}
          onClose={closeMermaidModal}
        />
      )}

      {toast && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: 'background.paper',
            boxShadow: 3,
            px: 3,
            py: 2,
            borderRadius: 1,
          }}
        >
          {toast}
        </Box>
      )}
    </PageContainer>
  );
}
