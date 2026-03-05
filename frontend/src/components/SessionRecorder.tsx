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
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  Checkbox,
  Divider
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
  Upload as UploadIcon,
  Security as SecurityIcon,
  PrivacyTip as PrivacyTipIcon
} from '@mui/icons-material';

import RecordingService, { RecordingEvent, RecordingMetadata, RecordingConfig } from '../services/RecordingService';
import { detectMeetingType, checkScreenRecordingSupport, getRecordingInstructions, MeetingInfo } from '../utils/meetingDetection';
import { useTranslation } from '../contexts/LanguageContext';
import { useWebSocket } from '../hooks/useWebSocket';
import AudioWaveform from './AudioWaveform';

export interface SessionRecorderProps {
  sessionId: string;
  participantId: string;
  userId: string;
  userRole: 'coach' | 'client';
  meetingUrl?: string; // Google Meet or other online meeting URL
  onRecordingStart?: (recordingId: string) => void;
  onRecordingStop?: (recordingId: string, fileSize: number) => void;
  onRecordingError?: (error: string) => void;
  config?: Partial<RecordingConfig>;
  disabled?: boolean;
  autoStart?: boolean;
  enableRealTimeUpdates?: boolean;
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

type QualityLevel = 'low' | 'standard' | 'high' | 'ultra';

interface QualityPreset {
  label: string;
  description: string;
  videoBitrate: number;
  audioBitrate: number;
  resolution?: string;
}

const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: {
    label: 'Low',
    description: '512 Kbps • Good for slow connections',
    videoBitrate: 512000,
    audioBitrate: 64000,
    resolution: '480p'
  },
  standard: {
    label: 'Standard',
    description: '1.5 Mbps • Balanced quality & size',
    videoBitrate: 1500000,
    audioBitrate: 96000,
    resolution: '720p'
  },
  high: {
    label: 'High',
    description: '2.5 Mbps • Recommended',
    videoBitrate: 2500000,
    audioBitrate: 128000,
    resolution: '1080p'
  },
  ultra: {
    label: 'Ultra',
    description: '4 Mbps • Best quality, large files',
    videoBitrate: 4000000,
    audioBitrate: 192000,
    resolution: '1080p'
  }
};

const SessionRecorder: React.FC<SessionRecorderProps> = ({
  sessionId,
  participantId,
  userId,
  userRole,
  meetingUrl,
  onRecordingStart,
  onRecordingStop,
  onRecordingError,
  config = {},
  disabled = false,
  autoStart = false,
  enableRealTimeUpdates = true
}) => {
  const { translations } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const recordingServiceRef = useRef<RecordingService | null>(null);
  
  // WebSocket integration for real-time updates
  const {
    connectionState,
    connect: connectWebSocket,
    joinSession,
    sendRecordingUpdate,
    addEventListener,
    removeEventListener
  } = useWebSocket({
    autoConnect: enableRealTimeUpdates,
    authToken: localStorage.getItem('token') || undefined,
    sessionId: enableRealTimeUpdates ? sessionId : undefined,
    userId: enableRealTimeUpdates ? userId : undefined,
    role: userRole
  });
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
    qualityLevel: 'high' as QualityLevel,
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
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentGiven, setConsentGiven] = useState(() => {
    // Check if consent was previously given for this session
    const stored = sessionStorage.getItem(`recording_consent_${sessionId}`);
    return stored === 'true';
  });

  // Initialize recording service
  useEffect(() => {
    // Update recording mode based on meeting type
    const recordingMode = meetingInfo.isOnlineMeeting && meetingInfo.requiresScreenRecording
      ? meetingInfo.recommendedRecordingMode
      : settings.recordingMode;

    // Get quality preset settings
    const qualityPreset = QUALITY_PRESETS[settings.qualityLevel];

    const recordingConfig: RecordingConfig = {
      audioOnly: settings.audioOnly,
      videoBitrate: qualityPreset.videoBitrate,
      audioBitrate: qualityPreset.audioBitrate,
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

          // Capture media stream for waveform visualization
          if (recordingServiceRef.current) {
            const stream = recordingServiceRef.current.getMediaStream();
            setMediaStream(stream);
          }

          // Send WebSocket update
          if (enableRealTimeUpdates && connectionState.sessionJoined) {
            sendRecordingUpdate({
              type: 'recording_started',
              participantId,
              data: {
                metadata: event.data?.metadata
              }
            });
          }
          
          onRecordingStart?.(event.data?.metadata?.sessionId || sessionId);
          break;

        case 'stopped':
          setRecordingState(prev => ({
            ...prev,
            isRecording: false,
            isPaused: false,
            recordingId: event.data?.recordingId || null
          }));

          // Clear media stream for waveform
          setMediaStream(null);
          
          // Send WebSocket update
          if (enableRealTimeUpdates && connectionState.sessionJoined) {
            sendRecordingUpdate({
              type: 'recording_stopped',
              participantId,
              recordingId: event.data?.recordingId,
              data: {
                fileSize: event.data?.fileSize
              }
            });
          }
          
          if (event.data?.recordingId) {
            onRecordingStop?.(event.data.recordingId, event.data.fileSize || 0);
          }
          break;

        case 'paused':
          setRecordingState(prev => ({ ...prev, isPaused: true }));
          
          // Send WebSocket update
          if (enableRealTimeUpdates && connectionState.sessionJoined) {
            sendRecordingUpdate({
              type: 'recording_paused',
              participantId
            });
          }
          break;

        case 'resumed':
          setRecordingState(prev => ({ ...prev, isPaused: false }));
          
          // Send WebSocket update
          if (enableRealTimeUpdates && connectionState.sessionJoined) {
            sendRecordingUpdate({
              type: 'recording_resumed',
              participantId
            });
          }
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
            
            // Send WebSocket update with current status
            if (enableRealTimeUpdates && connectionState.sessionJoined) {
              sendRecordingUpdate({
                type: 'chunk_ready',
                participantId,
                data: {
                  duration: status.duration,
                  fileSize: status.estimatedFileSize,
                  chunkCount: status.chunkCount
                }
              });
            }
          }
          break;

        case 'upload_progress':
          setRecordingState(prev => ({
            ...prev,
            uploadProgress: event.data?.progress || 0
          }));
          
          // Send WebSocket update
          if (enableRealTimeUpdates && connectionState.sessionJoined) {
            sendRecordingUpdate({
              type: 'upload_progress',
              participantId,
              data: {
                uploadProgress: event.data?.progress || 0
              }
            });
          }
          break;

        case 'error':
          const errorMessage = event.data?.error || 'Recording error occurred';
          setRecordingState(prev => ({
            ...prev,
            error: errorMessage,
            isRecording: false,
            isPaused: false
          }));
          
          // Send WebSocket update
          if (enableRealTimeUpdates && connectionState.sessionJoined) {
            sendRecordingUpdate({
              type: 'recording_error',
              participantId,
              data: {
                error: errorMessage
              }
            });
          }
          
          onRecordingError?.(errorMessage);
          break;
      }
    };

    recordingServiceRef.current.addEventListener(handleRecordingEvent);

    // Auto-start if requested (will show consent dialog if needed)
    if (autoStart && compatibility.supported && !disabled) {
      setTimeout(() => handleRequestRecording(), 1000);
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

  const handleRequestRecording = useCallback(() => {
    if (disabled) return;

    // If consent not yet given for this session, show consent dialog
    if (!consentGiven) {
      setShowConsentDialog(true);
      return;
    }

    // Consent already given, proceed to recording
    handleStartRecordingInternal();
  }, [disabled, consentGiven]);

  const handleConsentAndStart = useCallback(() => {
    // Store consent for this session
    sessionStorage.setItem(`recording_consent_${sessionId}`, 'true');
    setConsentGiven(true);
    setShowConsentDialog(false);
    setConsentChecked(false);

    // Log consent for audit trail
    console.log(`[Audit] Recording consent given for session ${sessionId} at ${new Date().toISOString()}`);

    // Proceed to start recording
    handleStartRecordingInternal();
  }, [sessionId]);

  const handleStartRecordingInternal = useCallback(async () => {
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
  }, [sessionId, participantId, settings.audioOnly, disabled, meetingUrl, meetingInfo]);

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
              {translations.recording.notSupported}
            </Typography>
            <Typography variant="body2">
              {translations.recording.browserError}
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
              {translations.recording.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {recordingState.isRecording && (
                <Chip
                  icon={<MicIcon />}
                  label={translations.recording.live}
                  color="error"
                  size="small"
                  sx={{ animation: 'pulse 1.5s infinite' }}
                />
              )}
              {enableRealTimeUpdates && (
                <Tooltip title={`WebSocket: ${connectionState.connected ? 'Connected' : 'Disconnected'}`}>
                  <Chip
                    label={connectionState.connected ? 'Live' : 'Offline'}
                    color={connectionState.connected ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
              )}
              <Tooltip title={translations.recording.settings}>
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
                  {translations.recording.duration} {formatDuration(recordingState.duration)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {translations.recording.size} {formatFileSize(recordingState.fileSize)}
                </Typography>
              </Box>
              
              {recordingState.uploadProgress > 0 && recordingState.uploadProgress < 100 && (
                <Box sx={{ mb: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="caption" color="textSecondary">
                      {translations.recording.uploading}
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
                  {translations.recording.savedSuccessfully} {recordingState.recordingId.slice(-8)}
                </Alert>
              )}
            </Box>
          )}

          {/* Audio Waveform Visualization */}
          {recordingState.isRecording && (
            <Box sx={{ mb: 2 }}>
              <AudioWaveform
                stream={mediaStream}
                isRecording={recordingState.isRecording}
                isPaused={recordingState.isPaused}
                width={isMobile ? 280 : 400}
                height={60}
                variant="waveform"
              />
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
                onClick={handleRequestRecording}
                disabled={disabled}
                sx={{ minWidth: 140 }}
              >
                {translations.recording.startRecording}
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
                  {translations.recording.stopRecording}
                </Button>
              </>
            )}
          </Box>

          {/* Status Indicators */}
          {isMobile && recordingState.isRecording && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Typography variant="caption" color="textSecondary" align="center">
                {recordingState.isPaused ? translations.recording.recordingPaused : translations.recording.recordingActive}
                <br />
                {translations.recording.chunks} {recordingState.chunkCount}
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
        <DialogTitle>{translations.recording.settings}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.audioOnly}
                  onChange={(e) => setSettings(prev => ({ ...prev, audioOnly: e.target.checked }))}
                />
              }
              label={translations.recording.audioOnlyMode}
            />
            <Typography variant="caption" display="block" color="textSecondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
              {translations.recording.audioOnlyDescription}
            </Typography>

            {/* Quality Level Selector */}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="quality-level-label">Recording Quality</InputLabel>
              <Select
                labelId="quality-level-label"
                value={settings.qualityLevel}
                label="Recording Quality"
                onChange={(e) => setSettings(prev => ({ ...prev, qualityLevel: e.target.value as QualityLevel }))}
              >
                {(Object.keys(QUALITY_PRESETS) as QualityLevel[]).map((level) => (
                  <MenuItem
                    key={level}
                    value={level}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 1.5
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography fontWeight={600}>
                        {QUALITY_PRESETS[level].label}
                      </Typography>
                      {level === 'high' && (
                        <Chip label="Recommended" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {QUALITY_PRESETS[level].description}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Quality Info Box */}
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.info.main, 0.08),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Current Settings
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Video: {(QUALITY_PRESETS[settings.qualityLevel].videoBitrate / 1000).toFixed(0)} Kbps
                {QUALITY_PRESETS[settings.qualityLevel].resolution && ` • ${QUALITY_PRESETS[settings.qualityLevel].resolution}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Audio: {(QUALITY_PRESETS[settings.qualityLevel].audioBitrate / 1000).toFixed(0)} Kbps
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Est. file size: ~{Math.round((QUALITY_PRESETS[settings.qualityLevel].videoBitrate + QUALITY_PRESETS[settings.qualityLevel].audioBitrate) / 8000 * 60)} MB/hour
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettings(prev => ({ ...prev, showSettingsDialog: false }))}>
            {translations.recording.close}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permission Dialog */}
      <Dialog open={showPermissionDialog} onClose={() => setShowPermissionDialog(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            {translations.recording.permissionRequired}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {translations.recording.permissionMessage}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {translations.recording.permissionInstructions}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPermissionDialog(false)}>
            {translations.recording.cancel}
          </Button>
          <Button onClick={() => {
            setShowPermissionDialog(false);
            setTimeout(handleStartRecordingInternal, 500);
          }} variant="contained">
            {translations.recording.tryAgain}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recording Consent Dialog */}
      <Dialog
        open={showConsentDialog}
        onClose={() => {
          setShowConsentDialog(false);
          setConsentChecked(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon color="primary" />
            Recording Consent Required
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" icon={<PrivacyTipIcon />} sx={{ mb: 2 }}>
              This coaching session will be recorded for quality assurance and your personal review.
            </Alert>

            <Typography variant="body1" paragraph>
              Before we begin recording, please acknowledge the following:
            </Typography>

            <Box
              sx={{
                bgcolor: alpha(theme.palette.background.default, 0.6),
                borderRadius: 2,
                p: 2,
                mb: 2,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                <li>The session will be recorded in {settings.audioOnly ? 'audio' : 'video'} format</li>
                <li>Recording will be securely stored and encrypted</li>
                <li>Access is limited to authorized participants</li>
                <li>You can request deletion of recordings at any time</li>
                <li>Recordings may be used for session notes and progress tracking</li>
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I understand and consent to having this session recorded. I have read and agree to the{' '}
                  <Typography
                    component="span"
                    color="primary"
                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Privacy Policy
                  </Typography>
                  .
                </Typography>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setShowConsentDialog(false);
              setConsentChecked(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConsentAndStart}
            disabled={!consentChecked}
            startIcon={settings.audioOnly ? <MicIcon /> : <VideoIcon />}
          >
            I Consent - Start Recording
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