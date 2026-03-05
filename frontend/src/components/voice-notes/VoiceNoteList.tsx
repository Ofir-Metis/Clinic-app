/**
 * VoiceNoteList Component
 * Displays a list of voice notes with status, duration, and transcription preview
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  Divider,
  Paper,
  Skeleton,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Mic as MicIcon,
  PlayArrow as PlayIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  NoteAdd as ConvertIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';
import {
  VoiceNote,
  getVoiceNotes,
  deleteVoiceNote,
  retryTranscription,
  VoiceNoteListParams,
} from '../../api/voiceNotes';

export interface VoiceNoteListProps {
  appointmentId?: string;
  clientId?: string;
  limit?: number;
  onPlay?: (voiceNote: VoiceNote) => void;
  onEdit?: (voiceNote: VoiceNote) => void;
  onConvert?: (voiceNote: VoiceNote) => void;
  refreshKey?: number;
}

export const VoiceNoteList: React.FC<VoiceNoteListProps> = ({
  appointmentId,
  clientId,
  limit = 20,
  onPlay,
  onEdit,
  onConvert,
  refreshKey = 0,
}) => {
  const { translations } = useTranslation();
  const theme = useTheme();

  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedNote, setSelectedNote] = useState<VoiceNote | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVoiceNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: VoiceNoteListParams = { limit };
      if (appointmentId) params.appointmentId = appointmentId;
      if (clientId) params.clientId = clientId;

      const response = await getVoiceNotes(params);
      setVoiceNotes(response.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load voice notes';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [appointmentId, clientId, limit]);

  useEffect(() => {
    fetchVoiceNotes();
  }, [fetchVoiceNotes, refreshKey]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, note: VoiceNote) => {
    setMenuAnchor(event.currentTarget);
    setSelectedNote(note);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedNote(null);
  };

  const handleDelete = async () => {
    if (!selectedNote) return;

    setActionLoading(selectedNote.id);
    handleMenuClose();

    try {
      await deleteVoiceNote(selectedNote.id);
      setVoiceNotes((prev) => prev.filter((n) => n.id !== selectedNote.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = async () => {
    if (!selectedNote) return;

    setActionLoading(selectedNote.id);
    handleMenuClose();

    try {
      await retryTranscription(selectedNote.id);
      // Refresh list to get updated status
      await fetchVoiceNotes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retry';
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: VoiceNote['transcriptionStatus']) => {
    switch (status) {
      case 'completed':
        return <CompletedIcon color="success" fontSize="small" />;
      case 'failed':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'processing':
        return <CircularProgress size={18} />;
      default:
        return <PendingIcon color="action" fontSize="small" />;
    }
  };

  const getStatusLabel = (status: VoiceNote['transcriptionStatus']) => {
    switch (status) {
      case 'completed':
        return translations.voiceNotes?.statusCompleted || 'Transcribed';
      case 'failed':
        return translations.voiceNotes?.statusFailed || 'Failed';
      case 'processing':
        return translations.voiceNotes?.statusProcessing || 'Processing';
      default:
        return translations.voiceNotes?.statusPending || 'Pending';
    }
  };

  if (loading) {
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={80}
            sx={{ mb: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <IconButton size="small" onClick={fetchVoiceNotes}>
          <RefreshIcon />
        </IconButton>
      }>
        {error}
      </Alert>
    );
  }

  if (voiceNotes.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: theme.palette.grey[50],
        }}
      >
        <MicIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          {translations.voiceNotes?.noNotes || 'No voice notes yet'}
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <List sx={{ p: 0 }}>
        {voiceNotes.map((note, index) => (
          <React.Fragment key={note.id}>
            {index > 0 && <Divider />}
            <ListItem
              sx={{
                py: 2,
                opacity: actionLoading === note.id ? 0.5 : 1,
              }}
            >
              <ListItemIcon>
                <IconButton
                  onClick={() => onPlay?.(note)}
                  disabled={!note.audioUrl}
                  size="small"
                >
                  <PlayIcon />
                </IconButton>
              </ListItemIcon>

              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>
                      {note.title || translations.voiceNotes?.untitled || 'Untitled'}
                    </Typography>
                    <Chip
                      size="small"
                      icon={getStatusIcon(note.transcriptionStatus)}
                      label={getStatusLabel(note.transcriptionStatus)}
                      variant="outlined"
                      sx={{ height: 24 }}
                    />
                  </Box>
                }
                secondary={
                  <Box component="span">
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="span"
                    >
                      {formatDuration(note.durationSeconds)} &bull; {formatDate(note.createdAt)}
                    </Typography>
                    {note.transcription && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {note.transcription}
                      </Typography>
                    )}
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                {actionLoading === note.id ? (
                  <CircularProgress size={24} />
                ) : (
                  <IconButton
                    edge="end"
                    onClick={(e) => handleMenuOpen(e, note)}
                    size="small"
                  >
                    <MoreIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          </React.Fragment>
        ))}
      </List>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedNote?.transcription && (
          <MenuItem onClick={() => { handleMenuClose(); onEdit?.(selectedNote); }}>
            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{translations.common?.edit || 'Edit'}</ListItemText>
          </MenuItem>
        )}
        {selectedNote?.transcription && (
          <MenuItem onClick={() => { handleMenuClose(); onConvert?.(selectedNote); }}>
            <ListItemIcon><ConvertIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{translations.voiceNotes?.convertToNote || 'Convert to Note'}</ListItemText>
          </MenuItem>
        )}
        {selectedNote?.transcriptionStatus === 'failed' && (
          <MenuItem onClick={handleRetry}>
            <ListItemIcon><RefreshIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{translations.voiceNotes?.retry || 'Retry Transcription'}</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>{translations.common?.delete || 'Delete'}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default VoiceNoteList;
