/**
 * Session Recording Player Component
 * HTML5 audio/video player with custom MUI controls
 * Supports playback speed control, volume, and seek functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Slider,
  Typography,
  Stack,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';

interface SessionRecordingPlayerProps {
  src: string;
  type: 'audio' | 'video';
  duration?: number;
  onTimeUpdate?: (currentTime: number) => void;
}

export const SessionRecordingPlayer: React.FC<SessionRecordingPlayerProps> = ({
  src,
  type,
  duration: providedDuration,
  onTimeUpdate,
}) => {
  const { translations } = useTranslation();
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(providedDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const t = translations.recording?.player || {
    play: 'Play',
    pause: 'Pause',
    volume: 'Volume',
    speed: 'Playback Speed',
    duration: 'Duration',
  };

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
      onTimeUpdate?.(media.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate]);

  const togglePlayPause = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (_event: Event, value: number | number[]) => {
    const media = mediaRef.current;
    if (!media) return;

    const seekTime = Array.isArray(value) ? value[0] : value;
    media.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (_event: Event, value: number | number[]) => {
    const media = mediaRef.current;
    if (!media) return;

    const volumeValue = Array.isArray(value) ? value[0] : value;
    media.volume = volumeValue;
    setVolume(volumeValue);
    setIsMuted(volumeValue === 0);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isMuted) {
      media.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      media.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (event: any) => {
    const media = mediaRef.current;
    if (!media) return;

    const speed = event.target.value;
    media.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Media Element */}
        {type === 'video' ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
          />
        ) : (
          <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={src} />
        )}

        {/* Controls */}
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Play/Pause Button */}
          <Tooltip title={isPlaying ? t.pause : t.play}>
            <IconButton
              onClick={togglePlayPause}
              color="primary"
              size="large"
              aria-label={isPlaying ? 'pause' : 'play'}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
          </Tooltip>

          {/* Time Display */}
          <Typography variant="body2" sx={{ minWidth: '100px' }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>

          {/* Seek Bar */}
          <Box sx={{ flex: 1 }}>
            <Slider
              value={currentTime}
              max={duration}
              onChange={handleSeek}
              aria-label="seek"
              role="slider"
              sx={{ width: '100%' }}
            />
          </Box>

          {/* Volume Control */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 150 }}>
            <Tooltip title={t.volume}>
              <IconButton onClick={toggleMute} size="small" aria-label="volume">
                {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
            </Tooltip>
            <Slider
              value={isMuted ? 0 : volume}
              min={0}
              max={1}
              step={0.1}
              onChange={handleVolumeChange}
              aria-label="volume"
              sx={{ width: 80 }}
            />
          </Stack>

          {/* Playback Speed */}
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select
              value={playbackSpeed}
              onChange={handleSpeedChange}
              aria-label="playback speed"
            >
              <MenuItem value={0.5}>0.5x</MenuItem>
              <MenuItem value={0.75}>0.75x</MenuItem>
              <MenuItem value={1}>1x</MenuItem>
              <MenuItem value={1.25}>1.25x</MenuItem>
              <MenuItem value={1.5}>1.5x</MenuItem>
              <MenuItem value={2}>2x</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>
    </Paper>
  );
};
