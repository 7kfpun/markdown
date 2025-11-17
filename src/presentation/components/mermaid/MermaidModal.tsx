import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Stack,
  Snackbar,
  Typography,
} from '@mui/material';
import { Close, Download } from '@mui/icons-material';
import mermaid from 'mermaid';
import { copySVGToClipboard, copyMermaidAsPNG } from '../../../utils/mermaidToClipboard';

interface Props {
  svg: string;
  code: string;
  onClose: () => void;
}

export default function MermaidModal({ svg, code, onClose }: Props) {
  const [toast, setToast] = useState('');
  const [hasContent, setHasContent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const inlineSvg = svg && svg.includes('<svg') ? svg : '';

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default' });
    const renderSvg = async () => {
      const container = containerRef.current;
      if (!container) return;

      container.innerHTML = '';
      setHasContent(false);

      if (inlineSvg) {
        container.innerHTML = inlineSvg;
        setHasContent(true);
        return;
      }

      if (!code) {
        setHasContent(false);
        return;
      }

      try {
        const id = `modal-${Date.now()}`;
        const { svg: out } = await mermaid.render(id, code);
        container.innerHTML = out;
        setHasContent(true);
      } catch (error) {
        console.error('Mermaid modal render failed', error);
        setHasContent(false);
      }
    };

    // slight delay to ensure dialog mounts
    const t = setTimeout(renderSvg, 100);
    return () => clearTimeout(t);
  }, [inlineSvg, code]);

  const handleCopyPNG = async () => {
    const content = containerRef.current?.innerHTML || '';
    const success = await copyMermaidAsPNG(content);
    setToast(success ? 'Diagram copied as PNG!' : 'Failed to copy PNG');
  };

  const handleCopySVG = async () => {
    const content = containerRef.current?.innerHTML || '';
    const success = await copySVGToClipboard(content);
    setToast(success ? 'Diagram copied as SVG!' : 'Failed to copy SVG');
  };

  const downloadSVG = () => {
    const content = containerRef.current?.innerHTML || '';
    if (!content) return;
    const blob = new Blob([content], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
    setToast('SVG downloaded');
  };

  const downloadPNG = async () => {
    const content = containerRef.current?.innerHTML || '';
    const success = await copyMermaidAsPNG(content, { downloadOnly: true });
    setToast(success ? 'PNG downloaded' : 'Failed to download PNG');
  };

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        maxWidth={false}
        fullWidth
        slotProps={{ paper: { sx: { height: '80vh', maxHeight: '100vh' } } }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}>
            <Close />
          </IconButton>
        </Box>

        <DialogContent
          sx={{
            height: '100%',
            pt: 3,
            pb: 3,
            px: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& > svg': {
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
              },
            }}
            ref={containerRef}
          />
          {!hasContent && (
            <Typography variant="body2" color="text.secondary" sx={{ position: 'absolute' }}>
              Diagram not available
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1}>
              <Button onClick={handleCopyPNG} variant="contained" color="success" disabled={!hasContent}>
                Copy PNG
              </Button>
              <Button onClick={handleCopySVG} variant="contained" color="primary" disabled={!hasContent}>
                Copy SVG
              </Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button onClick={downloadPNG} startIcon={<Download />} disabled={!hasContent}>
                Download PNG
              </Button>
              <Button onClick={downloadSVG} startIcon={<Download />} disabled={!hasContent}>
                Download SVG
              </Button>
              <Button onClick={onClose}>Close</Button>
            </Stack>
          </Stack>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={2000} onClose={() => setToast('')} message={toast} />
    </>
  );
}
