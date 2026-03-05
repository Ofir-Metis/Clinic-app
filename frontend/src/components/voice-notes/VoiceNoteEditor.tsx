/**
 * VoiceNoteEditor Component
 * Edit transcription text after recording with save functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Chip,
  Autocomplete,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';
import { VoiceNote, updateVoiceNote } from '../../api/voiceNotes';

export interface VoiceNoteEditorProps {
  open: boolean;
  onClose: () => void;
  voiceNote: VoiceNote | null;
  onSaved?: (updatedNote: VoiceNote) => void;
}

const SUGGESTED_TAGS = [
  'important',
  'action-item',
  'follow-up',
  'breakthrough',
  'challenge',
  'goal',
  'homework',
  'insight',
];

export const VoiceNoteEditor: React.FC<VoiceNoteEditorProps> = ({
  open,
  onClose,
  voiceNote,
  onSaved,
}) => {
  const { translations } = useTranslation();
  const theme = useTheme();

  const [title, setTitle] = useState('');
  const [transcription, setTranscription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when voice note changes
  useEffect(() => {
    if (voiceNote) {
      setTitle(voiceNote.title || '');
      setTranscription(voiceNote.transcription || '');
      setTags(voiceNote.tags || []);
      setHasChanges(false);
      setError(null);
    }
  }, [voiceNote]);

  // Track changes
  useEffect(() => {
    if (!voiceNote) return;

    const changed =
      title !== (voiceNote.title || '') ||
      transcription !== (voiceNote.transcription || '') ||
      JSON.stringify(tags) !== JSON.stringify(voiceNote.tags || []);

    setHasChanges(changed);
  }, [title, transcription, tags, voiceNote]);

  const handleSave = useCallback(async () => {
    if (!voiceNote || !hasChanges) return;

    setSaving(true);
    setError(null);

    try {
      const updatedNote = await updateVoiceNote(voiceNote.id, {
        title: title || undefined,
        transcription,
        tags: tags.length > 0 ? tags : undefined,
      });

      onSaved?.(updatedNote);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [voiceNote, title, transcription, tags, hasChanges, onSaved, onClose]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      // Could add confirmation dialog here
    }
    onClose();
  }, [hasChanges, onClose]);

  const wordCount = transcription.trim().split(/\s+/).filter(Boolean).length;
  const charCount = transcription.length;

  if (!voiceNote) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6">
            {translations.voiceNotes?.editTranscription || 'Edit Transcription'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label={translations.voiceNotes?.titleLabel || 'Title'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={translations.voiceNotes?.titlePlaceholder || 'Enter a title...'}
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          multiline
          rows={12}
          label={translations.voiceNotes?.transcriptionLabel || 'Transcription'}
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          placeholder={translations.voiceNotes?.transcriptionPlaceholder || 'Edit the transcription...'}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="caption" color="text.secondary">
            {wordCount} {translations.voiceNotes?.words || 'words'} &bull; {charCount} {translations.voiceNotes?.characters || 'characters'}
          </Typography>
          {voiceNote.transcriptionConfidence && (
            <Chip
              size="small"
              label={`${Math.round(voiceNote.transcriptionConfidence * 100)}% ${translations.voiceNotes?.confidence || 'confidence'}`}
              color={voiceNote.transcriptionConfidence > 0.8 ? 'success' : 'warning'}
              variant="outlined"
            />
          )}
        </Box>

        <Autocomplete
          multiple
          freeSolo
          options={SUGGESTED_TAGS}
          value={tags}
          onChange={(_, newValue) => setTags(newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                size="small"
                {...getTagProps({ index })}
                key={option}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={translations.voiceNotes?.tagsLabel || 'Tags'}
              placeholder={translations.voiceNotes?.tagsPlaceholder || 'Add tags...'}
            />
          )}
        />

        <Box sx={{ mt: 3, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {translations.voiceNotes?.metadata || 'Metadata'}:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
            <Typography variant="body2">
              <strong>{translations.voiceNotes?.duration || 'Duration'}:</strong>{' '}
              {Math.floor(voiceNote.durationSeconds / 60)}:{(voiceNote.durationSeconds % 60).toString().padStart(2, '0')}
            </Typography>
            {voiceNote.languageDetected && (
              <Typography variant="body2">
                <strong>{translations.voiceNotes?.language || 'Language'}:</strong>{' '}
                {voiceNote.languageDetected.toUpperCase()}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>{translations.voiceNotes?.created || 'Created'}:</strong>{' '}
              {new Date(voiceNote.createdAt).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose}>
          {translations.common?.cancel || 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
        >
          {saving
            ? translations.common?.saving || 'Saving...'
            : translations.common?.save || 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VoiceNoteEditor;
