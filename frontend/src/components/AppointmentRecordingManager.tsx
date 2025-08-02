/**
 * AppointmentRecordingManager - Comprehensive recording management for appointments
 * Features: Direct recording, file upload, AI summary, playback, and transcription
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Stack,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  VideoCall as VideoIcon,
  AudioFile as AudioIcon,
  Upload as UploadIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  DownloadForOffline as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  SmartToy as AIIcon,
  Transcription as TranscriptIcon,
  ExpandMore as ExpandIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

import SessionRecorder from './SessionRecorder';
import { useTranslation } from '../contexts/LanguageContext';

export interface RecordingFile {
  id: string;
  filename: string;
  fileSize: number;
  duration: number;
  uploadDate: Date;
  recordingDate?: Date;
  format: string;
  url: string;
  transcriptId?: string;
  summaryId?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
}

export interface SessionSummary {
  id: string;
  keyPoints: string[];
  actionItems: string[];
  insights: string[];
  recommendations: string[];
  mood: string;
  progressNotes: string;
  nextSessionFocus: string;
  generatedAt: Date;
  editedBy?: string;
  isSharedWithClient: boolean;
}

export interface AppointmentRecordingManagerProps {
  appointmentId: string;
  sessionId: string;
  participantId: string;
  userId: string;
  userRole: 'coach' | 'client';
  meetingUrl?: string;
  sessionType: 'in-person' | 'online' | 'hybrid';
  existingRecordings?: RecordingFile[];
  onRecordingAdded?: (recording: RecordingFile) => void;
  onSummaryGenerated?: (summary: SessionSummary) => void;
  canManageRecordings?: boolean;
  maxFileSize?: number; // in MB
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: '16px' }}>
    {value === index && children}
  </div>
);

const AppointmentRecordingManager: React.FC<AppointmentRecordingManagerProps> = ({
  appointmentId,
  sessionId,
  participantId,
  userId,
  userRole,
  meetingUrl,
  sessionType,
  existingRecordings = [],
  onRecordingAdded,
  onSummaryGenerated,
  canManageRecordings = true,
  maxFileSize = 500, // 500MB default
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [recordings, setRecordings] = useState<RecordingFile[]>(existingRecordings);
  const [selectedRecording, setSelectedRecording] = useState<RecordingFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryDialog, setSummaryDialog] = useState(false);
  const [transcriptDialog, setTranscriptDialog] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Recording mode selection
  const [recordingMode, setRecordingMode] = useState<'video' | 'audio' | 'screen'>('video');
  const [recordingQuality, setRecordingQuality] = useState<'high' | 'medium' | 'low'>('medium');

  // File upload handling
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const supportedFormats = ['mp4', 'mov', 'avi', 'mp3', 'wav', 'm4a', 'webm'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      setUploadError('Unsupported file format. Please use MP4, MOV, AVI, MP3, WAV, or M4A files.');
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      setUploadError(`File too large. Maximum size is ${maxFileSize}MB.`);
      return;
    }

    uploadRecordingFile(file);
  }, [maxFileSize]);

  const uploadRecordingFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('recording', file);
      formData.append('appointmentId', appointmentId);
      formData.append('sessionId', sessionId);
      formData.append('participantId', participantId);

      // Mock upload with progress simulation
      const uploadPromise = new Promise<RecordingFile>((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress >= 100) {
            clearInterval(interval);
            resolve({
              id: `upload_${Date.now()}`,
              filename: file.name,
              fileSize: file.size,
              duration: 0, // Will be determined after processing
              uploadDate: new Date(),
              format: file.type,
              url: URL.createObjectURL(file),
              processingStatus: 'processing',
            });
          } else {
            setUploadProgress(Math.min(progress, 95));
          }
        }, 200);
      });

      const newRecording = await uploadPromise;
      setUploadProgress(100);

      // Simulate processing delay
      setTimeout(() => {
        const processedRecording = {
          ...newRecording,
          duration: Math.floor(Math.random() * 3600) + 600, // 10-60 minutes
          processingStatus: 'completed' as const,
        };
        
        setRecordings(prev => [...prev, processedRecording]);
        onRecordingAdded?.(processedRecording);

        // Auto-generate summary
        generateAISummary(processedRecording);
      }, 2000);

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // AI Summary generation
  const generateAISummary = async (recording: RecordingFile) => {
    setIsGeneratingSummary(true);
    
    try {
      // Mock AI summary generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockSummary: SessionSummary = {
        id: `summary_${recording.id}`,
        keyPoints: [
          'Client expressed increased confidence in handling workplace stress',
          'Discussion around new coping strategies for anxiety management',
          'Progress noted in maintaining healthy sleep schedule',
          'Challenges with time management and work-life balance addressed'
        ],
        actionItems: [
          'Practice daily 10-minute meditation using guided app',
          'Implement the "2-minute rule" for task management',
          'Schedule weekly nature walks for stress relief',
          'Keep a mood journal for self-awareness tracking'
        ],
        insights: [
          'Client shows strong self-awareness and motivation for change',
          'Cognitive reframing techniques are resonating well',
          'Previous session goals have been partially achieved',
          'Strong therapeutic alliance evident in today\'s session'
        ],
        recommendations: [
          'Continue building on mindfulness practices',
          'Explore additional stress management techniques',
          'Consider introducing goal-setting framework',
          'Schedule follow-up in 2 weeks to review progress'
        ],
        mood: 'Optimistic and engaged',
        progressNotes: 'Client is making steady progress with anxiety management. Showing increased confidence and self-efficacy. Ready for more advanced coping strategies.',
        nextSessionFocus: 'Goal setting and action planning for workplace stress scenarios',
        generatedAt: new Date(),
        isSharedWithClient: false,
      };

      setSummary(mockSummary);
      onSummaryGenerated?.(mockSummary);
    } catch (error) {
      console.error('Summary generation failed:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Recording playback controls
  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
    // In real implementation, control audio/video player
  }, [isPlaying]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <Card sx={{ width: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h6" component="h2">
            {t.recording.title}
          </Typography>
          <Stack direction="row" spacing={1}>
            {recordings.length > 0 && (
              <Chip
                icon={<VideoIcon />}
                label={t.recording.multipleRecordings.replace('{count}', recordings.length.toString())}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
            {summary && (
              <Chip
                icon={<AIIcon />}
                label={t.recording.summaryReady}
                color="success"
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </Box>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab 
            icon={<VideoIcon />} 
            label={t.recording.directRecord}
            iconPosition="start"
          />
          <Tab 
            icon={<UploadIcon />} 
            label={t.recording.uploadExisting}
            iconPosition="start"
          />
          {recordings.length > 0 && (
            <Tab 
              icon={<PlayIcon />} 
              label={t.recording.playbackControls}
              iconPosition="start"
            />
          )}
          {summary && (
            <Tab 
              icon={<AIIcon />} 
              label={t.recording.autoSummary}
              iconPosition="start"
            />
          )}
        </Tabs>

        {/* Direct Recording Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Recording Mode Selection */}
            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Typography variant="subtitle1" gutterBottom>
                {t.recording.recordingMode}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant={recordingMode === 'video' ? 'contained' : 'outlined'}
                  startIcon={<VideoIcon />}
                  onClick={() => setRecordingMode('video')}
                  size="small"
                >
                  {t.recording.videoAndAudio}
                </Button>
                <Button
                  variant={recordingMode === 'audio' ? 'contained' : 'outlined'}
                  startIcon={<AudioIcon />}
                  onClick={() => setRecordingMode('audio')}
                  size="small"
                >
                  {t.recording.audioOnly}
                </Button>
                <Button
                  variant={recordingMode === 'screen' ? 'contained' : 'outlined'}
                  startIcon={<ScheduleIcon />}
                  onClick={() => setRecordingMode('screen')}
                  size="small"
                >
                  {t.recording.screenShare}
                </Button>
              </Stack>
            </Paper>

            {/* Session Type Indicator */}
            <Alert severity="info" icon={sessionType === 'online' ? <VideoIcon /> : <ScheduleIcon />}>
              <Typography variant="body2">
                {sessionType === 'online' 
                  ? t.recording.online 
                  : sessionType === 'in-person' 
                    ? t.recording.inPerson 
                    : t.recording.hybrid
                } session detected
              </Typography>
            </Alert>

            {/* Enhanced Session Recorder */}
            <SessionRecorder
              sessionId={sessionId}
              participantId={participantId}
              userId={userId}
              userRole={userRole}
              meetingUrl={meetingUrl}
              config={{
                audioOnly: recordingMode === 'audio',
                recordingMode: recordingMode === 'screen' ? 'screen' : 'camera',
                videoBitrate: recordingQuality === 'high' ? 2500000 : recordingQuality === 'medium' ? 1500000 : 800000,
                audioBitrate: recordingQuality === 'high' ? 128000 : 96000,
                uploadEndpoint: `/api/appointments/${appointmentId}/recordings/upload`
              }}
              onRecordingStart={(recordingId) => {
                console.log('Recording started:', recordingId);
              }}
              onRecordingStop={(recordingId, fileSize) => {
                console.log('Recording stopped:', recordingId, fileSize);
                // Auto-generate summary after recording
                const newRecording: RecordingFile = {
                  id: recordingId,
                  filename: `session_${sessionId}_${new Date().getTime()}.webm`,
                  fileSize,
                  duration: 0, // Will be updated
                  uploadDate: new Date(),
                  recordingDate: new Date(),
                  format: recordingMode === 'audio' ? 'audio/webm' : 'video/webm',
                  url: `/api/recordings/${recordingId}/download`,
                  processingStatus: 'processing',
                };
                setRecordings(prev => [...prev, newRecording]);
                generateAISummary(newRecording);
              }}
              onRecordingError={(error) => {
                console.error('Recording error:', error);
              }}
              disabled={!canManageRecordings}
              enableRealTimeUpdates={true}
            />
          </Box>
        </TabPanel>

        {/* File Upload Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box display="flex" flexDirection="column" gap={3}>
            <Typography variant="body1" color="text.secondary">
              {t.recording.uploadRecordingDescription}
            </Typography>

            {/* Upload Area */}
            <Paper
              sx={{
                p: 4,
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t.recording.dragDropText}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t.recording.supportedFormats.replace('{maxSize}', `${maxFileSize}MB`)}
              </Typography>
              <Button variant="contained" startIcon={<UploadIcon />}>
                {t.recording.selectFile}
              </Button>
            </Paper>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*,.mp4,.mov,.avi,.mp3,.wav,.m4a"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {/* Upload Progress */}
            {isUploading && (
              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    {t.recording.uploadProgress.replace('{progress}', Math.round(uploadProgress).toString())}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {uploadProgress < 100 ? 'Uploading...' : t.recording.processingFile}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}

            {/* Upload Error */}
            {uploadError && (
              <Alert severity="error" onClose={() => setUploadError(null)}>
                {uploadError}
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Playback Tab */}
        {recordings.length > 0 && (
          <TabPanel value={activeTab} index={2}>
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="subtitle1" gutterBottom>
                Session Recordings ({recordings.length})
              </Typography>

              <List>
                {recordings.map((recording, index) => (
                  <React.Fragment key={recording.id}>
                    <ListItem
                      sx={{
                        bgcolor: selectedRecording?.id === recording.id 
                          ? alpha(theme.palette.primary.main, 0.1) 
                          : 'transparent',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {recording.format.includes('video') ? <VideoIcon /> : <AudioIcon />}
                        </Avatar>
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={recording.filename}
                        secondary={
                          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                            <Typography variant="caption">
                              {formatDuration(recording.duration)}
                            </Typography>
                            <Typography variant="caption">
                              {formatFileSize(recording.fileSize)}
                            </Typography>
                            <Typography variant="caption">
                              {recording.uploadDate.toLocaleDateString()}
                            </Typography>
                            <Chip
                              label={recording.processingStatus}
                              size="small"
                              color={recording.processingStatus === 'completed' ? 'success' : 'warning'}
                              variant="outlined"
                            />
                          </Stack>
                        }
                        onClick={() => setSelectedRecording(recording)}
                        sx={{ cursor: 'pointer' }}
                      />

                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => togglePlayback()}
                            disabled={recording.processingStatus !== 'completed'}
                          >
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                          </IconButton>
                          <IconButton size="small">
                            <DownloadIcon />
                          </IconButton>
                          <IconButton size="small">
                            <ShareIcon />
                          </IconButton>
                          {canManageRecordings && (
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < recordings.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </TabPanel>
        )}

        {/* AI Summary Tab */}
        {summary && (
          <TabPanel value={activeTab} index={3}>
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                  <AIIcon color="primary" />
                  {t.recording.autoSummary}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditingSummary(!isEditingSummary)}
                  >
                    {t.recording.editSummary}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<ShareIcon />}
                  >
                    {t.recording.shareSummary}
                  </Button>
                </Stack>
              </Box>

              {isGeneratingSummary ? (
                <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={4}>
                  <CircularProgress size={48} />
                  <Typography variant="body1" color="text.secondary">
                    {t.recording.generatingSummary}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {/* Key Points */}
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandIcon />}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {t.recording.keyPoints}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {summary.keyPoints.map((point, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckIcon color="primary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={point} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  {/* Action Items */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandIcon />}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {t.recording.actionItems}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {summary.actionItems.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckIcon color="secondary" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={item} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  {/* AI Insights */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandIcon />}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {t.recording.insights}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {summary.insights.map((insight, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <AIIcon color="info" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={insight} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  {/* Recommendations */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandIcon />}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {t.recording.recommendations}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {summary.recommendations.map((rec, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={rec} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>

                  {/* Progress Notes */}
                  <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      Progress Notes
                    </Typography>
                    <Typography variant="body2">
                      {summary.progressNotes}
                    </Typography>
                  </Paper>

                  {/* Next Session Focus */}
                  <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                    <Typography variant="subtitle2" color="info.main" gutterBottom>
                      Next Session Focus
                    </Typography>
                    <Typography variant="body2">
                      {summary.nextSessionFocus}
                    </Typography>
                  </Paper>
                </Stack>
              )}
            </Box>
          </TabPanel>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentRecordingManager;