import { Box } from '@mui/material';
import Preview from '../components/preview/Preview';

export default function ViewPage() {
  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <Preview />
    </Box>
  );
}
