import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Close, Delete, History as HistoryIcon } from '@mui/icons-material';
import {
  getAllSessions,
  deleteSession,
  formatLastModified,
  SessionMetadata,
} from '../../../utils/sessionHistory';
import { useMarkdownStore } from '../../../infrastructure/store/useMarkdownStore';

interface Props {
  open: boolean;
  onClose: () => void;
  currentStorageKey: string;
  onLoadSession: (storageKey: string) => void;
}

export default function SessionHistory({ open, onClose, currentStorageKey, onLoadSession }: Props) {
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);

  const loadSessions = () => {
    const allSessions = getAllSessions();
    setSessions(allSessions);
  };

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open]);

  const handleDelete = (storageKey: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Delete this session? This cannot be undone.')) {
      deleteSession(storageKey);
      loadSessions();
    }
  };

  const handleLoadSession = (storageKey: string) => {
    if (storageKey === currentStorageKey) {
      onClose();
      return;
    }

    // Get the content from the target session
    const sessionData = localStorage.getItem(storageKey);
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        // Load the content into the current session
        useMarkdownStore.getState().updateContent(parsed.content || '');
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
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          All your editing sessions are saved automatically
        </Typography>

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
                    cursor: 'pointer',
                    bgcolor: isCurrent ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      bgcolor: isCurrent ? 'action.selected' : 'action.hover',
                    },
                  }}
                  onClick={() => handleLoadSession(session.storageKey)}
                  secondaryAction={
                    !isCurrent && (
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => handleDelete(session.storageKey, e)}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" noWrap>
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
    </Drawer>
  );
}
