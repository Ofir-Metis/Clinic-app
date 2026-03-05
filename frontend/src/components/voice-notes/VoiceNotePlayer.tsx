/**
 * VoiceNotePlayer Component
 * Audio playback with transcript sync highlighting
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Slider,
  Paper,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipPrevious as SkipBackIcon,
  SkipNext as SkipForwardIcon,
  Speed as SpeedIcon,
  Close as CloseIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';
import { VoiceNote } from '../../api/voiceNotes';

export interface VoiceNotePlayerProps {
  open: boolean;
  onClose: () => void;
  voiceNote: VoiceNote | null;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  open,
  onClose,
  voiceNote,
}) => {
  const { translations } = useTranslation();
  const theme = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [highlightedText, setHighlightedText] = useState<string>('');

  // Reset state when voice note changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackSpeed(1);
    if (voiceNote) {
      setDuration(voiceNote.durationSeconds);
    }
  }, [voiceNote]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Update highlighted text based on current time
      if (voiceNote?.transcription) {
        const words = voiceNote.transcription.split(' ');
        const wordsPerSecond = words.length / voiceNote.durationSeconds;
        const currentWordIndex = Math.floor(audio.currentTime * wordsPerSecond);
        const start = Math.max(0, currentWordIndex - 5);
        const end = Math.min(words.length, currentWordIndex + 15);
        setHighlightedText(words.slice(start, end).join(' '));
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [voiceNote]);

  // Update audio element properties
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackSpeed;
    audio.volume = isMuted ? 0 : volume;
  }, [playbackSpeed, volume, isMuted]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((_event: Event, value: number | number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value as number;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [currentTime, duration]);

  const handleSpeedChange = useCallback(() => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIndex]);
  }, [playbackSpeed]);

  const handleVolumeChange = useCallback((_event: Event, value: number | number[]) => {
    setVolume(value as number);
    setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  if (!voiceNote) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          {voiceNote.title || translations.voiceNotes?.untitled || 'Voice Note'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Hidden audio element */}
        <audio ref={audioRef} src={voiceNote.audioUrl || undefined} preload="metadata" />

        {/* Player controls */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 2,
            mb: 3,
          }}
        >
          {/* Seek slider */}
          <Box sx={{ px: 2, mb: 2 }}>
            <Slider
              value={currentTime}
              max={duration || voiceNote.durationSeconds}
              onChange={handleSeek}
              aria-label="time"
              sx={{ '& .MuiSlider-thumb': { width: 16, height: 16 } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                {formatTime(currentTime)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTime(duration || voiceNote.durationSeconds)}
              </Typography>
            </Box>
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => handleSkip(-10)} size="small">
              <SkipBackIcon />
            </IconButton>

            <IconButton
              onClick={handlePlayPause}
              sx={{
                width: 64,
                height: 64,
                bgcolor: theme.palette.primary.main,
                color: 'white',
                '&:hover': { bgcolor: theme.palette.primary.dark },
              }}
            >
              {isPlaying ? <PauseIcon sx={{ fontSize: 32 }} /> : <PlayIcon sx={{ fontSize: 32 }} />}
            </IconButton>

            <IconButton onClick={() => handleSkip(10)} size="small">
              <SkipForwardIcon />
            </IconButton>
          </Box>

          {/* Secondary controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, px: 2 }}>
            {/* Speed control */}
            <Button
              size="small"
              startIcon={<SpeedIcon />}
              onClick={handleSpeedChange}
            >
              {playbackSpeed}x
            </Button>

            {/* Volume control */}
            <Box sx={{ display: 'flex', alignItems: 'center', width: 150 }}>
              <IconButton onClick={toggleMute} size="small">
                {isMuted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
              </IconButton>
              <Slider
                value={isMuted ? 0 : volume}
                max={1}
                step={0.1}
                onChange={handleVolumeChange}
                aria-label="volume"
                size="small"
                sx={{ ml: 1 }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Transcript */}
        {voiceNote.transcription && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {translations.voiceNotes?.transcript || 'Transcript'}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Highlighted section (synced with playback) */}
            {isPlaying && highlightedText && (
              <Paper
                sx={{
                  p: 2,
                  mb: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                }}
              >
                <Typography variant="body1" fontWeight="medium">
                  {highlightedText}
                </Typography>
              </Paper>
            )}

            {/* Full transcript */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                maxHeight: 300,
                overflow: 'auto',
                bgcolor: theme.palette.grey[50],
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {voiceNote.transcription}
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {voiceNote.wordCount || voiceNote.transcription.split(/\s+/).length} {translations.voiceNotes?.words || 'words'}
              </Typography>
              {voiceNote.languageDetected && (
                <Typography variant="caption" color="text.secondary">
                  {translations.voiceNotes?.language || 'Language'}: {voiceNote.languageDetected.toUpperCase()}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>
          {translations.common?.close || 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VoiceNotePlayer;
