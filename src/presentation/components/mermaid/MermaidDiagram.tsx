import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import mermaid from 'mermaid';

interface Props {
  code: string;
  onClick: (svg: string, code: string) => void;
}

export default function MermaidDiagram({ code, onClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        setIsLoading(true);
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
        });

        const id = `mermaid-${Math.random().toString(36).substring(7)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [code]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box
      ref={ref}
      sx={{
        cursor: 'zoom-in',
        '&:hover': { opacity: 0.8 },
        transition: 'opacity 0.2s',
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
      onClick={() => onClick(svg, code)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
