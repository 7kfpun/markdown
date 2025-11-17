import { Box, Container, Paper, Typography, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';

export default function PrivacyPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 3 }}>
          <MuiLink
            component={Link}
            to="/"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            <ArrowBack fontSize="small" />
            Back to Editor
          </MuiLink>
        </Box>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Privacy Policy
          </Typography>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>

          <Typography variant="body1" paragraph>
            At 1Markdown, we take your privacy seriously. This Privacy Policy explains how we handle your data when you use our markdown editor.
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Data Collection
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>We do NOT collect, store, or transmit your personal data to any servers.</strong> 1Markdown is designed with privacy as a core principle.
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            Local Storage Only
          </Typography>
          <Typography variant="body1" paragraph>
            All your markdown content and editor preferences are stored locally in your browser's localStorage. This data never leaves your device unless you explicitly choose to share it via:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body1">Share links (compressed content in URL)</Typography>
            </li>
            <li>
              <Typography variant="body1">Export features (downloaded to your device)</Typography>
            </li>
            <li>
              <Typography variant="body1">Print/PDF features (processed locally)</Typography>
            </li>
          </Box>

          <Typography variant="h6" component="h3" sx={{ mt: 3, mb: 1 }}>
            No Account Required
          </Typography>
          <Typography variant="body1" paragraph>
            We do not require any sign-up, registration, or authentication. You can use 1Markdown completely anonymously without providing any personal information.
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Share Links
          </Typography>
          <Typography variant="body1" paragraph>
            When you generate a share link, your markdown content is compressed and encoded directly into the URL. This means:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body1">Content is NOT uploaded to any server</Typography>
            </li>
            <li>
              <Typography variant="body1">Content is embedded in the URL itself</Typography>
            </li>
            <li>
              <Typography variant="body1">Anyone with the link can view the content</Typography>
            </li>
            <li>
              <Typography variant="body1">Links are as private as you keep them</Typography>
            </li>
          </Box>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Analytics
          </Typography>
          <Typography variant="body1" paragraph>
            We may use anonymized analytics (such as Google Analytics) to understand how users interact with 1Markdown. This helps us improve the application. Analytics data is:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body1">Completely anonymous</Typography>
            </li>
            <li>
              <Typography variant="body1">Does NOT track your markdown content</Typography>
            </li>
            <li>
              <Typography variant="body1">Limited to page views and feature usage</Typography>
            </li>
            <li>
              <Typography variant="body1">Subject to Google Analytics privacy policy</Typography>
            </li>
          </Box>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Cookies
          </Typography>
          <Typography variant="body1" paragraph>
            1Markdown uses browser localStorage (not cookies) to save your preferences and content locally. We do not use tracking cookies. Any cookies present would be from third-party services like analytics.
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Third-Party Services
          </Typography>
          <Typography variant="body1" paragraph>
            1Markdown may load external resources such as:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body1">Fonts from CDNs</Typography>
            </li>
            <li>
              <Typography variant="body1">Analytics scripts (Google Analytics)</Typography>
            </li>
            <li>
              <Typography variant="body1">Open-source libraries from CDNs</Typography>
            </li>
          </Box>
          <Typography variant="body1" paragraph>
            These services have their own privacy policies. Your markdown content is never sent to these services.
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            Since we don't store your data on our servers, there's no server-side data to secure. Your content security depends on:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body1">Your browser's localStorage security</Typography>
            </li>
            <li>
              <Typography variant="body1">Your device security</Typography>
            </li>
            <li>
              <Typography variant="body1">How you share links (only share with trusted recipients)</Typography>
            </li>
          </Box>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Your Rights
          </Typography>
          <Typography variant="body1" paragraph>
            Since we don't collect or store your personal data, there's nothing to delete, export, or modify on our end. You have complete control over your data:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            <li>
              <Typography variant="body1">Clear your browser's localStorage to delete all local data</Typography>
            </li>
            <li>
              <Typography variant="body1">Use incognito/private mode for ephemeral sessions</Typography>
            </li>
            <li>
              <Typography variant="body1">Export your content anytime via download features</Typography>
            </li>
          </Box>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Children's Privacy
          </Typography>
          <Typography variant="body1" paragraph>
            1Markdown does not knowingly collect any personal information from anyone, including children under 13. Since we don't collect data, the service can be used by anyone.
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Changes to This Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update this Privacy Policy from time to time. The "Last Updated" date at the top indicates when changes were made. Continued use of 1Markdown after changes constitutes acceptance of the updated policy.
          </Typography>

          <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
            Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have questions about this Privacy Policy or want to report a bug, please{' '}
            <MuiLink href="https://docs.google.com/forms/d/1PJbMNF_yUiiC_frG4EvASSpGV-bYSsHIA_mcEClzDj8" target="_blank" rel="noopener noreferrer">
              submit feedback via our form
            </MuiLink>
            .
          </Typography>

          <Typography variant="h6" component="h3" sx={{ mt: 4, fontWeight: 'bold' }}>
            Summary
          </Typography>
          <Box
            sx={{
              bgcolor: 'success.light',
              color: 'success.contrastText',
              p: 2,
              borderRadius: 1,
              mt: 2,
            }}
          >
            <Typography variant="body1">
              <strong>TL;DR:</strong> We don't collect, store, or sell your data. Everything stays on your device. You're in complete control. 🔒
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
