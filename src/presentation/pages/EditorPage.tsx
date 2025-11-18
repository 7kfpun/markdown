import { Box, Tooltip, Drawer, Typography } from '@mui/material';
import { Brightness4, Brightness7, GetApp, PictureAsPdf, Share, Upload, RestartAlt, Description, BugReport, Policy, Menu, Close, History } from '@mui/icons-material';
import styled from 'styled-components';
import { useMarkdownStore } from '../../infrastructure/store/useMarkdownStore';
import { DEFAULT_MARKDOWN } from '../../utils/constants';
import { openPrintPage, downloadRenderedHTML } from '../../utils/export';
import Editor, { EditorHandle } from '../components/editor/Editor';
import Preview, { PreviewHandle } from '../components/preview/Preview';
import MermaidModal from '../components/mermaid/MermaidModal';
import SessionHistory from '../components/session/SessionHistory';
import { OfflineIndicator } from '../components/offline/OfflineIndicator';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateShareLink } from '../../utils/compression';
import { downloadMarkdown } from '../../utils/export';
import { useOnlineStatus } from '../../utils/useOnlineStatus';
import { createSessionMetadata, saveSessionMetadata, getCurrentSessionMetadata, createSnapshot } from '../../utils/sessionHistory';

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

const PanelContainer = styled(Box) <{ $show: boolean }>`
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
  position: relative;
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
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  flex: unset;
`;

const HeaderRight = styled(HeaderSection)`
  justify-content: flex-end;
  margin-left: auto;
`;

const Logo = styled.div`
  font-weight: 700;
  letter-spacing: 0.2px;
  font-size: 18px;
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoImage = styled.img`
  width: 28px;
  height: 28px;
  display: none;

  @media (max-width: 640px) {
    display: block;
  }
`;

const LogoText = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
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

const HeaderRightDesktop = styled(HeaderRight)`
  @media (max-width: 1100px) {
    display: none;
  }
`;

const MenuButton = styled.button<{ $dark: boolean }>`
  display: none;
  appearance: none;
  border: none;
  background: ${(p) => (p.$dark ? 'rgba(255,255,255,0.08)' : 'rgba(255, 255, 255, 0.15)')};
  color: ${(p) => (p.$dark ? '#e5e7eb' : '#f8fbff')};
  cursor: pointer;
  padding: 8px;
  border-radius: 9px;
  transition: all 0.15s ease;

  @media (max-width: 1100px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;

    &:hover {
      background: ${(p) => (p.$dark ? 'rgba(255,255,255,0.12)' : 'rgba(255, 255, 255, 0.25)')};
      transform: translateY(-1px);
    }
  }
`;

const MobileMenuContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
`;

const MobileMenuButton = styled.button<{ $dark: boolean }>`
  appearance: none;
  border: none;
  padding: 12px 16px;
  background: ${(p) => (p.$dark ? 'rgba(255,255,255,0.08)' : 'rgba(255, 255, 255, 0.1)')};
  color: ${(p) => (p.$dark ? '#e5e7eb' : '#1f1f1f')};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${(p) => (p.$dark ? 'rgba(255,255,255,0.12)' : 'rgba(255, 255, 255, 0.2)')};
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
    storageKey,
    switchStorageKey,
    editorTheme,
    editorFontSize,
    editorWrap,
    previewTheme,
  } = useMarkdownStore();

  const [toast, setToast] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [splitSizes, setSplitSizes] = useState({ editor: 50, preview: 50 });
  const [wasOffline, setWasOffline] = useState(false);
  const isOnline = useOnlineStatus();
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorHandle>(null);
  const previewRef = useRef<PreviewHandle>(null);
  const syncingRef = useRef(false);
  const dragState = useRef<{ active: boolean; startX: number; startSizes: { editor: number; preview: number } }>({
    active: false,
    startX: 0,
    startSizes: { editor: 50, preview: 50 },
  });

  // Track when we transition from offline to online
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Show reconnection message for 3 seconds
      setTimeout(() => setWasOffline(false), 3000);
    }
  }, [isOnline, wasOffline]);

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
      console.log('[EditorPage] handleEditorScroll called', {
        ratio,
        showPreview,
        hasPreviewRef: !!previewRef.current,
        isSyncing: syncingRef.current,
      });
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
      console.log('[EditorPage] handlePreviewScroll called', {
        ratio,
        showEditor,
        hasEditorRef: !!editorRef.current,
        isSyncing: syncingRef.current,
      });
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

  const handleManualSave = useCallback(() => {
    try {
      // Create a new snapshot with current state (version control)
      const fullState = {
        state: {
          content,
          editorTheme,
          editorFontSize,
          editorWrap,
          previewTheme,
          darkMode,
          storageKey, // Will be replaced by createSnapshot
        },
      };

      const newKey = createSnapshot(content, fullState);

      // Switch to the new storage key
      switchStorageKey(newKey);

      // Update sessionStorage to lock in the new key
      sessionStorage.setItem('markdown-current-storage-key', newKey);

      // Show success toast
      setToast('Saved!');
      setTimeout(() => setToast(''), 2000);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Failed to save';
      setToast(reason);
      setTimeout(() => setToast(''), 2000);
    }
  }, [content, storageKey, switchStorageKey, editorTheme, editorFontSize, editorWrap, previewTheme, darkMode]);

  // Add Cmd/Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+S (Mac) or Ctrl+S (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleManualSave]);

  return (
    <PageContainer>
      <OfflineIndicator isOnline={isOnline} wasOffline={wasOffline} />
      <Header $dark={darkMode}>
        <HeaderSection>
          <Logo>
            <LogoImage src="/apple-touch-icon.png" alt="1Markdown" />
            <LogoText>1Markdown</LogoText>
          </Logo>
        </HeaderSection>

        <HeaderCenter>
          <Segmented $dark={darkMode}>
            <Tooltip title="Editor only" arrow>
              <SegmentedButton
                aria-label="Show editor only"
                $active={layoutMode === 'editor-only'}
                $dark={darkMode}
                onClick={() => togglePanels('editor-only')}
              >
                Editor
              </SegmentedButton>
            </Tooltip>
            <Tooltip title="Split view" arrow>
              <SegmentedButton
                aria-label="Split view"
                $active={layoutMode === 'split'}
                $dark={darkMode}
                onClick={() => togglePanels('split')}
              >
                Split
              </SegmentedButton>
            </Tooltip>
            <Tooltip title="Preview only" arrow>
              <SegmentedButton
                aria-label="Show preview only"
                $active={layoutMode === 'preview-only'}
                $dark={darkMode}
                onClick={() => togglePanels('preview-only')}
              >
                Preview
              </SegmentedButton>
            </Tooltip>
          </Segmented>
        </HeaderCenter>

        <HeaderRightDesktop>
          <Tooltip title="Feedback" arrow>
            <ToolbarIconButton
              aria-label="Report a bug or request a feature"
              onClick={() => window.open('https://docs.google.com/forms/d/1PJbMNF_yUiiC_frG4EvASSpGV-bYSsHIA_mcEClzDj8', '_blank')}
              $dark={darkMode}
            >
              <BugReport fontSize="small" />
            </ToolbarIconButton>
          </Tooltip>
          <Tooltip title="Privacy" arrow>
            <ToolbarIconButton
              aria-label="Privacy policy"
              onClick={() => window.open('/privacy', '_blank')}
              $dark={darkMode}
            >
              <Policy fontSize="small" />
            </ToolbarIconButton>
          </Tooltip>
          <Tooltip title="Session History" arrow>
            <ToolbarIconButton
              aria-label="View session history"
              onClick={() => setHistoryOpen(true)}
              $dark={darkMode}
            >
              <History fontSize="small" />
            </ToolbarIconButton>
          </Tooltip>
          <Tooltip title="Reset content" arrow>
            <ToolbarIconButton aria-label="Reset to default content" onClick={handleReset} $dark={darkMode}>
              <RestartAlt fontSize="small" />
            </ToolbarIconButton>
          </Tooltip>
          <Tooltip title="Import file" arrow>
            <ToolbarIconButton aria-label="Import Markdown or text file" onClick={handleImport} $dark={darkMode}>
              <Upload fontSize="small" />
            </ToolbarIconButton>
          </Tooltip>
          <Tooltip title="Share link" arrow>
            <ToolbarIconButton aria-label="Share via compressed link" onClick={handleShare} $dark={darkMode}>
              <Share fontSize="small" />
            </ToolbarIconButton>
          </Tooltip>
          <Tooltip title="Download .md" arrow>
            <ToolbarIconButton aria-label="Download as Markdown (.md)" onClick={handleExport} $dark={darkMode}>
              <GetApp fontSize="small" />
            </ToolbarIconButton>
          </Tooltip>
          <Tooltip title="Download HTML" arrow>
            <ToolbarIconButton aria-label="Download rendered HTML" onClick={handleExportHTML} $dark={darkMode}>
              <Description fontSize="small" />
            </ToolbarIconButton>
          </Tooltip>
          <Tooltip title="Export PDF" arrow>
            <ToolbarIconButton aria-label="Export to PDF (print dialog)" onClick={handleExportPDF} $dark={darkMode}>
              <PictureAsPdf fontSize="small" />
            </ToolbarIconButton>
          </Tooltip>
          <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'} arrow>
            <ToolbarIconButton
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleDarkMode}
              $dark={darkMode}
            >
              {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
            </ToolbarIconButton>
          </Tooltip>
        </HeaderRightDesktop>

        <MenuButton $dark={darkMode} onClick={() => setMobileMenuOpen(true)}>
          <Menu />
        </MenuButton>

        <Drawer anchor="right" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
          <MobileMenuContainer sx={{ width: 280, bgcolor: darkMode ? '#1f2937' : '#f8fbff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Menu
              </Typography>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: darkMode ? '#e5e7eb' : '#1f1f1f' }}>
                <Close />
              </button>
            </Box>

            <MobileMenuButton $dark={darkMode} onClick={() => { setMobileMenuOpen(false); handleShare(); }} title="Share link">
              <Share fontSize="small" />
              Share Link
            </MobileMenuButton>

            <MobileMenuButton $dark={darkMode} onClick={() => { setMobileMenuOpen(false); handleImport(); }} title="Import file">
              <Upload fontSize="small" />
              Import File
            </MobileMenuButton>

            <MobileMenuButton $dark={darkMode} onClick={() => { setMobileMenuOpen(false); handleExport(); }} title="Download .md">
              <GetApp fontSize="small" />
              Download .md
            </MobileMenuButton>

            <MobileMenuButton $dark={darkMode} onClick={() => { setMobileMenuOpen(false); handleExportHTML(); }} title="Download HTML">
              <Description fontSize="small" />
              Download HTML
            </MobileMenuButton>

            <MobileMenuButton $dark={darkMode} onClick={() => { setMobileMenuOpen(false); handleExportPDF(); }} title="Export PDF">
              <PictureAsPdf fontSize="small" />
              Export PDF
            </MobileMenuButton>

            <MobileMenuButton $dark={darkMode} onClick={() => { setMobileMenuOpen(false); setHistoryOpen(true); }} title="Session History">
              <History fontSize="small" />
              Session History
            </MobileMenuButton>

            <MobileMenuButton $dark={darkMode} onClick={() => { setMobileMenuOpen(false); handleReset(); }} title="Reset content">
              <RestartAlt fontSize="small" />
              Reset Content
            </MobileMenuButton>

            <MobileMenuButton $dark={darkMode} onClick={() => { setMobileMenuOpen(false); window.open('https://docs.google.com/forms/d/1PJbMNF_yUiiC_frG4EvASSpGV-bYSsHIA_mcEClzDj8', '_blank'); }} title="Feedback">
              <BugReport fontSize="small" />
              Report Bug
            </MobileMenuButton>

            <MobileMenuButton $dark={darkMode} onClick={() => { setMobileMenuOpen(false); window.open('/privacy', '_blank'); }} title="Privacy">
              <Policy fontSize="small" />
              Privacy Policy
            </MobileMenuButton>

            <MobileMenuButton $dark={darkMode} onClick={() => { setMobileMenuOpen(false); toggleDarkMode(); }} title="Toggle theme">
              {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </MobileMenuButton>
          </MobileMenuContainer>
        </Drawer>
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

      <SessionHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        currentStorageKey={storageKey}
        onLoadSession={(key) => {
          // Session loading is handled within SessionHistory component
          setHistoryOpen(false);
        }}
      />

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
