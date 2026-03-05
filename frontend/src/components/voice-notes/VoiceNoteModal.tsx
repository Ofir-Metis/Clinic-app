/**
 * VoiceNoteModal Component
 * Full recording modal with waveform, timer, and save functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';
import { useVoiceRecording } from './hooks/useVoiceRecording';
import { VoiceNoteWaveform } from './VoiceNoteWaveform';
import { uploadVoiceNote, UploadVoiceNoteResponse } from '../../api/voiceNotes';

export interface VoiceNoteModalProps {
  open: boolean;
  onClose: () => void;
  appointmentId?: string;
  clientId?: string;
  onSaved?: (result: UploadVoiceNoteResponse) => void;
  maxDuration?: number;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'preview' | 'uploading' | 'done' | 'error';

export const VoiceNoteModal: React.FC<VoiceNoteModalProps> = ({
  open,
  onClose,
  appointmentId,
  clientId,
  onSaved,
  maxDuration = 1800, // 30 minutes default
}) => {
  const { t, translations } = useTranslation();
  const theme = useTheme();

  const [state, setState] = useState<RecordingState>('idle');
  const [title, setTitle] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error: recordingError,
    hasPermission,
    waveformData,
    volumeLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    requestPermission,
  } = useVoiceRecording({ maxDuration });

  // Update state based on recording state
  useEffect(() => {
    if (isRecording && !isPaused) {
      setState('recording');
    } else if (isPaused) {
      setState('paused');
    } else if (audioBlob) {
      setState('preview');
    } else {
      setState('idle');
    }
  }, [isRecording, isPaused, audioBlob]);

  // Format duration as MM:SS
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleStartRecording = useCallback(async () => {
    setUploadError(null);
    await startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);

  const handleReset = useCallback(() => {
    resetRecording();
    setTitle('');
    setUploadError(null);
    setState('idle');
  }, [resetRecording]);

  const handleSave = useCallback(async () => {
    if (!audioBlob) return;

    setState('uploading');
    setUploadError(null);

    try {
      const result = await uploadVoiceNote({
        audio: audioBlob,
        durationSeconds: duration,
        appointmentId,
        clientId,
        title: title || undefined,
      });

      setState('done');
      onSaved?.(result);

      // Close modal after short delay
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save voice note';
      setUploadError(message);
      setState('error');
    }
  }, [audioBlob, duration, appointmentId, clientId, title, onSaved, handleReset, onClose]);

  const handleClose = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    handleReset();
    onClose();
  }, [isRecording, stopRecording, handleReset, onClose]);

  const renderContent = () => {
    // Permission error
    if (hasPermission === false) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {translations.voiceNotes?.microphonePermissionDenied || 'Microphone permission denied'}
          </Alert>
          <Button
            variant="contained"
            onClick={requestPermission}
            startIcon={<MicIcon />}
          >
            {translations.voiceNotes?.requestPermission || 'Request Permission'}
          </Button>
        </Box>
      );
    }

    // Recording error
    if (recordingError && state !== 'preview') {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {recordingError.message}
          </Alert>
          <Button
            variant="outlined"
            onClick={handleReset}
            startIcon={<RefreshIcon />}
          >
            {translations.common?.tryAgain || 'Try Again'}
          </Button>
        </Box>
      );
    }

    // Done state
    if (state === 'done') {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Alert severity="success">
            {translations.voiceNotes?.saved || 'Voice note saved successfully!'}
          </Alert>
        </Box>
      );
    }

    // Main recording UI
    return (
      <Box sx={{ textAlign: 'center' }}>
        {/* Waveform */}
        <Box
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 2,
            p: 3,
            mb: 3,
          }}
        >
          <VoiceNoteWaveform
            data={waveformData}
            isRecording={isRecording}
            isPaused={isPaused}
            width={400}
            height={100}
          />
        </Box>

        {/* Timer */}
        <Typography
          variant="h3"
          sx={{
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: isRecording && !isPaused
              ? theme.palette.error.main
              : theme.palette.text.primary,
            mb: 2,
          }}
        >
          {formatDuration(duration)}
          {maxDuration && (
            <Typography
              component="span"
              variant="body2"
              sx={{ ml: 1, color: 'text.secondary' }}
            >
              / {formatDuration(maxDuration)}
            </Typography>
          )}
        </Typography>

        {/* Volume indicator */}
        {isRecording && !isPaused && (
          <Box sx={{ mb: 3 }}>
            <Chip
              label={
                volumeLevel > 0.5
                  ? translations.voiceNotes?.volumeGood || 'Good volume'
                  : volumeLevel > 0.2
                  ? translations.voiceNotes?.volumeOk || 'Volume OK'
                  : translations.voiceNotes?.volumeLow || 'Speak louder'
              }
              color={volumeLevel > 0.2 ? 'success' : 'warning'}
              size="small"
            />
          </Box>
        )}

        {/* Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
          {state === 'idle' && (
            <IconButton
              onClick={handleStartRecording}
              sx={{
                width: 80,
                height: 80,
                bgcolor: theme.palette.error.main,
                color: 'white',
                '&:hover': { bgcolor: theme.palette.error.dark },
              }}
            >
              <MicIcon sx={{ fontSize: 40 }} />
            </IconButton>
          )}

          {(state === 'recording' || state === 'paused') && (
            <>
              <IconButton
                onClick={isPaused ? resumeRecording : pauseRecording}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: theme.palette.grey[200],
                  '&:hover': { bgcolor: theme.palette.grey[300] },
                }}
              >
                {isPaused ? <PlayIcon sx={{ fontSize: 32 }} /> : <PauseIcon sx={{ fontSize: 32 }} />}
              </IconButton>

              <IconButton
                onClick={handleStopRecording}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: theme.palette.error.main,
                  color: 'white',
                  '&:hover': { bgcolor: theme.palette.error.dark },
                }}
              >
                <StopIcon sx={{ fontSize: 40 }} />
              </IconButton>
            </>
          )}

          {state === 'preview' && audioUrl && (
            <Box sx={{ width: '100%' }}>
              <audio
                controls
                src={audioUrl}
                style={{ width: '100%', marginBottom: 16 }}
              />

              <TextField
                fullWidth
                label={translations.voiceNotes?.titleOptional || 'Title (optional)'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={translations.voiceNotes?.titlePlaceholder || 'Enter a title for this note...'}
                sx={{ mb: 2 }}
              />

              {uploadError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {uploadError}
                </Alert>
              )}
            </Box>
          )}

          {state === 'uploading' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={32} />
              <Typography>
                {translations.voiceNotes?.uploading || 'Uploading...'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Status text */}
        {state === 'idle' && (
          <Typography color="text.secondary">
            {translations.voiceNotes?.tapToRecord || 'Tap to start recording'}
          </Typography>
        )}
        {state === 'recording' && (
          <Typography color="error">
            {translations.voiceNotes?.recording || 'Recording...'}
          </Typography>
        )}
        {state === 'paused' && (
          <Typography color="text.secondary">
            {translations.voiceNotes?.paused || 'Paused'}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MicIcon color="primary" />
          <Typography variant="h6">
            {translations.voiceNotes?.title || 'Voice Note'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {renderContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {(state === 'preview' || state === 'uploading') && (
          <>
            <Button onClick={handleReset} startIcon={<RefreshIcon />} disabled={state === 'uploading'}>
              {translations.common?.discard || 'Discard'}
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={<SaveIcon />}
              disabled={state === 'uploading'}
            >
              {translations.voiceNotes?.save || 'Save Note'}
            </Button>
          </>
        )}
        {state === 'error' && (
          <Button onClick={handleReset} startIcon={<RefreshIcon />}>
            {translations.common?.tryAgain || 'Try Again'}
          </Button>
        )}
        {(state === 'idle' || state === 'recording' || state === 'paused') && (
          <Button onClick={handleClose}>
            {translations.common?.cancel || 'Cancel'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VoiceNoteModal;
