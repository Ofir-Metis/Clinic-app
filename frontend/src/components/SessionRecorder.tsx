/**
 * SessionRecorder - React component for therapy session recording
 * Integrates with RecordingService for scalable WebRTC recording
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  PlayArrow as ResumeIcon,
  Videocam as VideoIcon,
  VideocamOff as VideoOffIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon
} from '@mui/icons-material';

import RecordingService, { RecordingEvent, RecordingMetadata, RecordingConfig } from '../services/RecordingService';
import { detectMeetingType, checkScreenRecordingSupport, getRecordingInstructions, MeetingInfo } from '../utils/meetingDetection';

export interface SessionRecorderProps {
  sessionId: string;
  participantId: string;
  meetingUrl?: string; // Google Meet or other online meeting URL
  onRecordingStart?: (recordingId: string) => void;
  onRecordingStop?: (recordingId: string, fileSize: number) => void;
  onRecordingError?: (error: string) => void;
  config?: Partial<RecordingConfig>;
  disabled?: boolean;
  autoStart?: boolean;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  fileSize: number;
  chunkCount: number;
  uploadProgress: number;
  error: string | null;
  recordingId: string | null;
}

const SessionRecorder: React.FC<SessionRecorderProps> = ({
  sessionId,
  participantId,
  meetingUrl,
  onRecordingStart,
  onRecordingStop,
  onRecordingError,
  config = {},
  disabled = false,
  autoStart = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const recordingServiceRef = useRef<RecordingService | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    fileSize: 0,
    chunkCount: 0,
    uploadProgress: 0,
    error: null,
    recordingId: null
  });

  const [settings, setSettings] = useState({
    audioOnly: config.audioOnly || false,
    highQuality: true,
    showSettingsDialog: false,
    recordingMode: config.recordingMode || 'camera'
  });

  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo>(() => 
    detectMeetingType(meetingUrl)
  );
  const [compatibility, setCompatibility] = useState(RecordingService.checkCompatibility());
  const [screenRecordingSupport, setScreenRecordingSupport] = useState(checkScreenRecordingSupport());
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showMeetingInstructions, setShowMeetingInstructions] = useState(false);

  // Initialize recording service
  useEffect(() => {
    // Update recording mode based on meeting type
    const recordingMode = meetingInfo.isOnlineMeeting && meetingInfo.requiresScreenRecording 
      ? meetingInfo.recommendedRecordingMode 
      : settings.recordingMode;

    const recordingConfig: RecordingConfig = {
      audioOnly: settings.audioOnly,
      videoBitrate: settings.highQuality ? 2500000 : 1000000,
      audioBitrate: settings.highQuality ? 128000 : 64000,
      recordingMode,
      screenRecordingOptions: {
        includeSystemAudio: true,
        captureEntireScreen: false,
        preferCurrentTab: meetingInfo.provider === 'google-meet'
      },
      ...config
    };

    recordingServiceRef.current = new RecordingService(recordingConfig);

    // Set up event listeners
    const handleRecordingEvent = (event: RecordingEvent) => {
      switch (event.type) {
        case 'started':
          setRecordingState(prev => ({
            ...prev,
            isRecording: true,
            error: null,
            recordingId: null
          }));
          onRecordingStart?.(event.data?.metadata?.sessionId || sessionId);
          break;

        case 'stopped':
          setRecordingState(prev => ({
            ...prev,
            isRecording: false,
            isPaused: false,
            recordingId: event.data?.recordingId || null
          }));
          if (event.data?.recordingId) {
            onRecordingStop?.(event.data.recordingId, event.data.fileSize || 0);
          }
          break;

        case 'paused':
          setRecordingState(prev => ({ ...prev, isPaused: true }));
          break;

        case 'resumed':
          setRecordingState(prev => ({ ...prev, isPaused: false }));
          break;

        case 'chunk_ready':
          // Update real-time stats
          if (recordingServiceRef.current) {
            const status = recordingServiceRef.current.getStatus();
            setRecordingState(prev => ({
              ...prev,
              duration: status.duration,
              fileSize: status.estimatedFileSize,
              chunkCount: status.chunkCount
            }));
          }
          break;

        case 'upload_progress':
          setRecordingState(prev => ({
            ...prev,
            uploadProgress: event.data?.progress || 0
          }));
          break;

        case 'error':
          const errorMessage = event.data?.error || 'Recording error occurred';
          setRecordingState(prev => ({
            ...prev,
            error: errorMessage,
            isRecording: false,
            isPaused: false
          }));
          onRecordingError?.(errorMessage);
          break;
      }
    };

    recordingServiceRef.current.addEventListener(handleRecordingEvent);

    // Auto-start if requested
    if (autoStart && compatibility.supported && !disabled) {
      setTimeout(() => handleStartRecording(), 1000);
    }

    return () => {
      recordingServiceRef.current?.cleanup();
    };
  }, [sessionId, participantId, settings, config, autoStart, compatibility.supported, disabled]);

  // Update recording stats periodically
  useEffect(() => {
    if (!recordingState.isRecording) return;

    const interval = setInterval(() => {
      if (recordingServiceRef.current) {
        const status = recordingServiceRef.current.getStatus();
        setRecordingState(prev => ({
          ...prev,
          duration: status.duration,
          fileSize: status.estimatedFileSize,
          chunkCount: status.chunkCount
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [recordingState.isRecording]);

  const handleStartRecording = useCallback(async () => {
    if (!recordingServiceRef.current || disabled) return;

    try {
      const metadata: RecordingMetadata = {
        sessionId,
        participantId,
        startTime: new Date(),
        format: settings.audioOnly ? 'audio/webm' : 'video/webm',
        meetingUrl,
        isOnlineMeeting: meetingInfo.isOnlineMeeting,
        recordingMode: meetingInfo.isOnlineMeeting ? meetingInfo.recommendedRecordingMode : 'camera'
      };

      await recordingServiceRef.current.startRecording(metadata);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setShowPermissionDialog(true);
      } else {
        setRecordingState(prev => ({ ...prev, error: errorMessage }));
        onRecordingError?.(errorMessage);
      }
    }
  }, [sessionId, participantId, settings.audioOnly, disabled]);

  const handleStopRecording = useCallback(async () => {
    if (!recordingServiceRef.current) return;

    try {
      await recordingServiceRef.current.stopRecording();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      setRecordingState(prev => ({ ...prev, error: errorMessage }));
      onRecordingError?.(errorMessage);
    }
  }, []);

  const handlePauseRecording = useCallback(() => {
    if (!recordingServiceRef.current) return;

    try {
      if (recordingState.isPaused) {
        recordingServiceRef.current.resumeRecording();
      } else {
        recordingServiceRef.current.pauseRecording();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pause/resume recording';
      setRecordingState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [recordingState.isPaused]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Compatibility check UI
  if (!compatibility.supported) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recording Not Supported
            </Typography>
            <Typography variant="body2">
              Your browser doesn't support session recording. Please try:
            </Typography>
            <ul>
              {compatibility.recommendations?.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        sx={{ 
          mb: 2,
          border: recordingState.isRecording ? `2px solid ${theme.palette.error.main}` : undefined,
          boxShadow: recordingState.isRecording ? `0 0 10px ${theme.palette.error.main}40` : undefined
        }}
      >
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" component="h3">
              Session Recording
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {recordingState.isRecording && (
                <Chip
                  icon={<MicIcon />}
                  label="LIVE"
                  color="error"
                  size="small"
                  sx={{ animation: 'pulse 1.5s infinite' }}
                />
              )}
              <Tooltip title="Recording Settings">
                <IconButton 
                  size="small" 
                  onClick={() => setSettings(prev => ({ ...prev, showSettingsDialog: true }))}
                  disabled={recordingState.isRecording}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Error Display */}
          {recordingState.error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRecordingState(prev => ({ ...prev, error: null }))}>
              {recordingState.error}
            </Alert>
          )}

          {/* Recording Stats */}
          {(recordingState.isRecording || recordingState.duration > 0) && (
            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary">
                  Duration: {formatDuration(recordingState.duration)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Size: {formatFileSize(recordingState.fileSize)}
                </Typography>
              </Box>
              
              {recordingState.uploadProgress > 0 && recordingState.uploadProgress < 100 && (
                <Box sx={{ mb: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="caption" color="textSecondary">
                      Uploading...
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {Math.round(recordingState.uploadProgress)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={recordingState.uploadProgress}
                    color="primary"
                  />
                </Box>
              )}

              {recordingState.recordingId && (
                <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 1 }}>
                  Recording saved successfully! ID: {recordingState.recordingId.slice(-8)}
                </Alert>
              )}
            </Box>
          )}

          {/* Recording Controls */}
          <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
            {!recordingState.isRecording ? (
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={settings.audioOnly ? <MicIcon /> : <VideoIcon />}
                onClick={handleStartRecording}
                disabled={disabled}
                sx={{ minWidth: 140 }}
              >
                Start Recording
              </Button>
            ) : (
              <>
                <IconButton
                  color="warning"
                  size="large"
                  onClick={handlePauseRecording}
                  disabled={disabled}
                  sx={{ 
                    bgcolor: recordingState.isPaused ? 'warning.main' : 'transparent',
                    color: recordingState.isPaused ? 'white' : 'warning.main',
                    '&:hover': {
                      bgcolor: 'warning.main',
                      color: 'white'
                    }
                  }}
                >
                  {recordingState.isPaused ? <ResumeIcon /> : <PauseIcon />}
                </IconButton>

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<StopIcon />}
                  onClick={handleStopRecording}
                  disabled={disabled}
                  sx={{ minWidth: 140 }}
                >
                  Stop Recording
                </Button>
              </>
            )}
          </Box>

          {/* Status Indicators */}
          {isMobile && recordingState.isRecording && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Typography variant="caption" color="textSecondary" align="center">
                {recordingState.isPaused ? 'Recording Paused' : 'Recording Active'}
                <br />
                Chunks: {recordingState.chunkCount}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog 
        open={settings.showSettingsDialog} 
        onClose={() => setSettings(prev => ({ ...prev, showSettingsDialog: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Recording Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.audioOnly}
                  onChange={(e) => setSettings(prev => ({ ...prev, audioOnly: e.target.checked }))}
                />
              }
              label="Audio Only Recording"
            />
            <Typography variant="caption" display="block" color="textSecondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
              Reduces file size and bandwidth usage
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.highQuality}
                  onChange={(e) => setSettings(prev => ({ ...prev, highQuality: e.target.checked }))}
                />
              }
              label="High Quality Recording"
            />
            <Typography variant="caption" display="block" color="textSecondary" sx={{ ml: 4, mt: -1 }}>
              Better quality but larger file sizes
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettings(prev => ({ ...prev, showSettingsDialog: false }))}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permission Dialog */}
      <Dialog open={showPermissionDialog} onClose={() => setShowPermissionDialog(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            Camera/Microphone Permission Required
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            To record therapy sessions, we need access to your camera and microphone.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Please click "Allow" when your browser asks for permission, or check your browser settings
            to enable camera and microphone access for this site.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPermissionDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            setShowPermissionDialog(false);
            setTimeout(handleStartRecording, 500);
          }} variant="contained">
            Try Again
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </>
  );
};

export default SessionRecorder;