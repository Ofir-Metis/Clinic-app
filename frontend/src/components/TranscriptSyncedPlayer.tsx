/**
 * TranscriptSyncedPlayer - Media player with synchronized transcript display
 * Features click-to-seek, auto-highlighting, and transcript search
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Slider,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  useTheme,
  alpha,
  LinearProgress,
  Collapse,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  Fullscreen as FullscreenIcon,
  Speed as SpeedIcon,
  Search as SearchIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Download as DownloadIcon,
  FormatQuote as QuoteIcon
} from '@mui/icons-material';
import DOMPurify from 'dompurify';

export interface TranscriptSegment {
  id: string;
  startTime: number; // milliseconds
  endTime: number;   // milliseconds
  text: string;
  speaker?: string;
  confidence?: number;
}

export interface TranscriptSyncedPlayerProps {
  /** URL of the media file to play */
  mediaUrl: string;
  /** Media type: 'audio' or 'video' */
  mediaType: 'audio' | 'video';
  /** Array of transcript segments with timing */
  transcript: TranscriptSegment[];
  /** Title of the recording */
  title?: string;
  /** Optional poster image for video */
  posterUrl?: string;
  /** Callback when a segment is clicked */
  onSegmentClick?: (segment: TranscriptSegment) => void;
  /** Callback when playback position changes */
  onTimeUpdate?: (currentTime: number) => void;
  /** Allow download of media */
  allowDownload?: boolean;
  /** Initial playback speed */
  defaultSpeed?: number;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const TranscriptSyncedPlayer: React.FC<TranscriptSyncedPlayerProps> = ({
  mediaUrl,
  mediaType,
  transcript,
  title,
  posterUrl,
  onSegmentClick,
  onTimeUpdate,
  allowDownload = false,
  defaultSpeed = 1
}) => {
  const theme = useTheme();
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(defaultSpeed);
  const [isLoading, setIsLoading] = useState(true);
  const [buffered, setBuffered] = useState(0);

  // UI state
  const [showTranscript, setShowTranscript] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // Find the active segment based on current playback time
  const activeSegment = useMemo(() => {
    const currentTimeMs = currentTime * 1000;
    return transcript.find(
      segment => currentTimeMs >= segment.startTime && currentTimeMs < segment.endTime
    );
  }, [currentTime, transcript]);

  // Update active segment when it changes
  useEffect(() => {
    if (activeSegment?.id !== activeSegmentId) {
      setActiveSegmentId(activeSegment?.id || null);

      // Auto-scroll to active segment
      if (activeSegment && transcriptContainerRef.current) {
        const segmentElement = document.getElementById(`segment-${activeSegment.id}`);
        if (segmentElement) {
          segmentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [activeSegment, activeSegmentId]);

  // Filter transcript by search query
  const filteredTranscript = useMemo(() => {
    if (!searchQuery.trim()) return transcript;
    const query = searchQuery.toLowerCase();
    return transcript.filter(segment =>
      segment.text.toLowerCase().includes(query) ||
      segment.speaker?.toLowerCase().includes(query)
    );
  }, [transcript, searchQuery]);

  // Search results count
  const searchResultsCount = searchQuery.trim()
    ? filteredTranscript.length
    : null;

  // Media event handlers
  const handleTimeUpdate = useCallback(() => {
    if (mediaRef.current) {
      const time = mediaRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
      setIsLoading(false);
    }
  }, []);

  const handleProgress = useCallback(() => {
    if (mediaRef.current && mediaRef.current.buffered.length > 0) {
      const bufferedEnd = mediaRef.current.buffered.end(
        mediaRef.current.buffered.length - 1
      );
      setBuffered((bufferedEnd / mediaRef.current.duration) * 100);
    }
  }, []);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  const handleEnded = useCallback(() => setIsPlaying(false), []);

  // Playback controls
  const togglePlay = useCallback(() => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
    }
  }, [isPlaying]);

  const handleSeek = useCallback((value: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = value;
      setCurrentTime(value);
    }
  }, []);

  const handleVolumeChange = useCallback((value: number) => {
    if (mediaRef.current) {
      mediaRef.current.volume = value;
      setVolume(value);
      setIsMuted(value === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (mediaRef.current) {
      const newMuted = !isMuted;
      mediaRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const handleSpeedChange = useCallback(() => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    const newSpeed = PLAYBACK_SPEEDS[nextIndex];

    if (mediaRef.current) {
      mediaRef.current.playbackRate = newSpeed;
    }
    setPlaybackSpeed(newSpeed);
  }, [playbackSpeed]);

  const handleSegmentClick = useCallback((segment: TranscriptSegment) => {
    const seekTime = segment.startTime / 1000;
    handleSeek(seekTime);
    onSegmentClick?.(segment);

    // Auto-play when clicking a segment
    if (mediaRef.current && !isPlaying) {
      mediaRef.current.play();
    }
  }, [handleSeek, isPlaying, onSegmentClick]);

  const handleFullscreen = useCallback(() => {
    if (mediaRef.current && mediaType === 'video') {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        (mediaRef.current as HTMLVideoElement).requestFullscreen();
      }
    }
  }, [mediaType]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Set up media event listeners
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('progress', handleProgress);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('progress', handleProgress);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      media.removeEventListener('ended', handleEnded);
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleProgress, handlePlay, handlePause, handleEnded]);

  return (
    <Card sx={{ overflow: 'hidden' }}>
      {/* Title Bar */}
      {title && (
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.100', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
        </Box>
      )}

      {/* Media Player */}
      <Box sx={{ position: 'relative', bgcolor: 'black' }}>
        {mediaType === 'video' ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={mediaUrl}
            poster={posterUrl}
            style={{ width: '100%', maxHeight: 400, display: 'block' }}
            playsInline
          />
        ) : (
          <Box
            sx={{
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.1)
            }}
          >
            <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={mediaUrl} />
            <QuoteIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
          </Box>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.5)'
            }}
          >
            <LinearProgress sx={{ width: '50%' }} />
          </Box>
        )}
      </Box>

      {/* Progress Bar */}
      <Box sx={{ px: 2, pt: 1 }}>
        <Box sx={{ position: 'relative' }}>
          {/* Buffered progress */}
          <LinearProgress
            variant="determinate"
            value={buffered}
            sx={{
              position: 'absolute',
              width: '100%',
              height: 4,
              borderRadius: 2,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'grey.400'
              }
            }}
          />
          {/* Playback slider */}
          <Slider
            value={currentTime}
            max={duration || 100}
            onChange={(_, value) => handleSeek(value as number)}
            sx={{
              height: 4,
              '& .MuiSlider-thumb': {
                width: 12,
                height: 12,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`
                }
              },
              '& .MuiSlider-rail': {
                opacity: 0
              }
            }}
          />
        </Box>

        {/* Time display */}
        <Box display="flex" justifyContent="space-between" sx={{ mt: -0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {formatTime(currentTime)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(duration)}
          </Typography>
        </Box>
      </Box>

      {/* Controls */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          py: 0.5
        }}
      >
        {/* Left controls */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <IconButton onClick={togglePlay} color="primary" size="large">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </IconButton>

          <IconButton onClick={toggleMute} size="small">
            {isMuted ? <MuteIcon /> : <VolumeIcon />}
          </IconButton>

          <Slider
            value={isMuted ? 0 : volume}
            max={1}
            step={0.1}
            onChange={(_, value) => handleVolumeChange(value as number)}
            sx={{ width: 80, ml: 1 }}
            size="small"
          />
        </Box>

        {/* Right controls */}
        <Box display="flex" alignItems="center" gap={0.5}>
          <Tooltip title={`Playback speed: ${playbackSpeed}x`}>
            <Chip
              icon={<SpeedIcon />}
              label={`${playbackSpeed}x`}
              size="small"
              onClick={handleSpeedChange}
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>

          {mediaType === 'video' && (
            <IconButton onClick={handleFullscreen} size="small">
              <FullscreenIcon />
            </IconButton>
          )}

          {allowDownload && (
            <Tooltip title="Download recording">
              <IconButton
                size="small"
                component="a"
                href={mediaUrl}
                download
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}

          <IconButton onClick={() => setShowTranscript(!showTranscript)} size="small">
            {showTranscript ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
        </Box>
      </Box>

      <Divider />

      {/* Transcript Panel */}
      <Collapse in={showTranscript}>
        <CardContent sx={{ p: 0 }}>
          {/* Search bar */}
          <Box sx={{ p: 2, pb: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchResultsCount !== null && (
                  <InputAdornment position="end">
                    <Chip
                      label={`${searchResultsCount} results`}
                      size="small"
                      color={searchResultsCount > 0 ? 'primary' : 'default'}
                    />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* Transcript content */}
          <Box
            ref={transcriptContainerRef}
            sx={{
              maxHeight: 300,
              overflowY: 'auto',
              px: 2,
              pb: 2
            }}
          >
            {filteredTranscript.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                {searchQuery ? 'No matching text found' : 'No transcript available'}
              </Typography>
            ) : (
              filteredTranscript.map((segment) => {
                const isActive = segment.id === activeSegmentId;
                const highlightText = searchQuery.trim()
                  ? highlightSearchTerm(segment.text, searchQuery)
                  : segment.text;

                return (
                  <Paper
                    key={segment.id}
                    id={`segment-${segment.id}`}
                    onClick={() => handleSegmentClick(segment)}
                    elevation={isActive ? 2 : 0}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      cursor: 'pointer',
                      bgcolor: isActive
                        ? alpha(theme.palette.primary.main, 0.1)
                        : 'transparent',
                      border: `1px solid ${isActive ? theme.palette.primary.main : 'transparent'}`,
                      borderRadius: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderColor: alpha(theme.palette.primary.main, 0.3)
                      }
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                      <Typography variant="caption" color="primary" fontWeight={600}>
                        {formatTime(segment.startTime / 1000)}
                      </Typography>
                      {segment.speaker && (
                        <Chip
                          label={segment.speaker}
                          size="small"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(highlightText) }}
                    />
                    {segment.confidence !== undefined && segment.confidence < 0.8 && (
                      <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                        Low confidence ({Math.round(segment.confidence * 100)}%)
                      </Typography>
                    )}
                  </Paper>
                );
              })
            )}
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};

// Helper function to highlight search terms
function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  return text.replace(regex, '<mark style="background-color: #ffeb3b; padding: 0 2px;">$1</mark>');
}

// Helper function to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default TranscriptSyncedPlayer;
