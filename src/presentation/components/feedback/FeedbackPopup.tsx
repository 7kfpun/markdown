import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import FeedbackIcon from '@mui/icons-material/Feedback';

const FEEDBACK_SHOWN_KEY = 'feedback-popup-shown';
const FEEDBACK_DELAY = 5 * 60 * 1000; // 5 minutes in milliseconds
const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/1PJbMNF_yUiiC_frG4EvASSpGV-bYSsHIA_mcEClzDj8/viewform';

export default function FeedbackPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if feedback popup has already been shown
    const hasShownFeedback = localStorage.getItem(FEEDBACK_SHOWN_KEY);

    if (hasShownFeedback === 'true') {
      return;
    }

    // Set timer to show popup after 5 minutes
    const timer = setTimeout(() => {
      setOpen(true);
      // Mark as shown in localStorage
      localStorage.setItem(FEEDBACK_SHOWN_KEY, 'true');
    }, FEEDBACK_DELAY);

    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const handleFeedback = () => {
    window.open(FEEDBACK_FORM_URL, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="feedback-dialog-title"
    >
      <DialogTitle id="feedback-dialog-title">
        <Box display="flex" alignItems="center" gap={1}>
          <FeedbackIcon color="primary" />
          <Typography variant="h6" component="span">
            We'd love your feedback!
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Thank you for using our markdown editor! We're constantly working to improve your experience.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Would you mind taking a moment to share your thoughts? Your feedback helps us make this tool better for everyone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Maybe later
        </Button>
        <Button onClick={handleFeedback} variant="contained" color="primary">
          Give feedback
        </Button>
      </DialogActions>
    </Dialog>
  );
}
