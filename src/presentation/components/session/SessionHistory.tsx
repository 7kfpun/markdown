import { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Close, Delete, History as HistoryIcon, Restore, Edit, DeleteSweep } from '@mui/icons-material';
import {
  formatLastModified,
} from '../../../utils/sessionHistory';
import { useMarkdownStore } from '../../../infrastructure/store/useMarkdownStore';
import { trackEvent } from '../../../utils/analytics';

interface Props {
  open: boolean;
  onClose: () => void;
  currentStorageKey: string;
  onLoadSession: (storageKey: string) => void;
}

export default function SessionHistory({ open, onClose, currentStorageKey, onLoadSession }: Props) {
  const sessions = useMarkdownStore(state => state.sessions);
  const updateSession = useMarkdownStore(state => state.updateSession);
  const deleteSessionFromStore = useMarkdownStore(state => state.deleteSession);
  const deleteAllSessions = useMarkdownStore(state => state.deleteAllSessions);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameStorageKey, setRenameStorageKey] = useState('');
  const [renameValue, setRenameValue] = useState('');

  const handleCloseButton = () => {
    trackEvent('session_history_close_button_clicked');
    onClose();
  };

  const handleDelete = (storageKey: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Delete this session? This cannot be undone.')) {
      trackEvent('session_history_delete_confirmed', { storageKey });
      deleteSessionFromStore(storageKey);
    }
  };

  const handleDeleteAll = () => {
    if (confirm('Delete ALL sessions? This cannot be undone.')) {
      trackEvent('session_history_delete_all_confirmed', { count: sessions.length });
      deleteAllSessions();
    }
  };

  const handleRename = (storageKey: string, currentTitle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    trackEvent('session_history_rename_opened', { storageKey });
    setRenameStorageKey(storageKey);
    setRenameValue(currentTitle);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      trackEvent('session_history_rename_submitted', { storageKey: renameStorageKey });
      updateSession(renameStorageKey, {
        title: renameValue.trim(),
        lastModified: Date.now(),
      });
    }
    setRenameDialogOpen(false);
  };

  const handleRenameCancel = () => {
    trackEvent('session_history_rename_cancelled', { storageKey: renameStorageKey });
    setRenameDialogOpen(false);
  };

  const handleLoadSession = (storageKey: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (storageKey === currentStorageKey) {
      onClose();
      return;
    }

    trackEvent('session_history_restore_clicked', { storageKey });

    const sessionData = localStorage.getItem(storageKey);
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        const restoredContent = parsed.state?.content || parsed.content || '';
        useMarkdownStore.setState({ content: restoredContent });
        onClose();
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            <Typography variant="h6">Session History</Typography>
          </Box>
          <IconButton onClick={handleCloseButton} size="small">
            <Close />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          All your editing sessions are saved automatically
        </Typography>

        {sessions.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteSweep />}
            onClick={handleDeleteAll}
            sx={{ mb: 2 }}
            fullWidth
          >
            Delete All Sessions
          </Button>
        )}

        <Divider sx={{ mb: 2 }} />

        {sessions.length === 0 ? (
          <Alert severity="info">No sessions found. Start editing to create your first session.</Alert>
        ) : (
          <List>
            {sessions.map((session) => {
              const isCurrent = session.storageKey === currentStorageKey;
              return (
                <ListItem
                  key={session.storageKey}
                  sx={{
                    border: 1,
                    borderColor: isCurrent ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: isCurrent ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      bgcolor: isCurrent ? 'action.selected' : 'action.hover',
                    },
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {!isCurrent && (
                        <IconButton
                          aria-label="restore"
                          onClick={(e) => handleLoadSession(session.storageKey, e)}
                          size="small"
                          color="primary"
                        >
                          <Restore fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        aria-label="rename"
                        onClick={(e) => handleRename(session.storageKey, session.title, e)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      {!isCurrent && (
                        <IconButton
                          aria-label="delete"
                          onClick={(e) => handleDelete(session.storageKey, e)}
                          size="small"
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  }
                >
                  <ListItemText
                    sx={{ pr: isCurrent ? 6 : 15 }}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                          {session.title}
                        </Typography>
                        {isCurrent && (
                          <Typography
                            variant="caption"
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              px: 0.75,
                              py: 0.25,
                              borderRadius: 0.5,
                              flexShrink: 0,
                            }}
                          >
                            Current
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" display="block" color="text.secondary" noWrap>
                          {session.contentPreview}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatLastModified(session.lastModified)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={handleRenameCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Rename Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Session Title"
            type="text"
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameSubmit();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameCancel}>Cancel</Button>
          <Button onClick={handleRenameSubmit} variant="contained">
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
