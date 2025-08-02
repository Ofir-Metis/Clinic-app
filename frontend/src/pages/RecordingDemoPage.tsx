/**
 * RecordingDemoPage - Demonstration of comprehensive recording functionality
 * Shows all recording features: direct recording, file upload, AI summary, playback
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  Stack,
  Button,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import {
  VideoCall as VideoIcon,
  SmartToy as AIIcon,
  Upload as UploadIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';

import AppointmentRecordingManager from '../components/AppointmentRecordingManager';
import PageAppBar from '../components/PageAppBar';
import { theme } from '../theme';
import { useTranslation } from '../contexts/LanguageContext';

const RecordingDemoPage: React.FC = () => {
  const { t } = useTranslation();
  const [demoMode, setDemoMode] = useState<'coach' | 'client'>('coach');

  // Mock appointment data
  const mockAppointment = {
    id: 'demo-appointment-123',
    sessionId: 'demo-session-456',
    participantId: 'demo-participant-789',
    userId: 'demo-user-123',
    userRole: demoMode,
    meetingUrl: 'https://meet.google.com/demo-abc-defg',
    sessionType: 'online' as const,
  };

  // Mock existing recordings for demo
  const mockRecordings = [
    {
      id: 'recording-1',
      filename: 'Session_2024-01-15_10-30.mp4',
      fileSize: 125000000, // 125MB
      duration: 3600, // 1 hour
      uploadDate: new Date('2024-01-15T10:30:00'),
      recordingDate: new Date('2024-01-15T10:30:00'),
      format: 'video/mp4',
      url: '/demo/recording-1.mp4',
      processingStatus: 'completed' as const,
      transcriptId: 'transcript-1',
      summaryId: 'summary-1',
    },
    {
      id: 'recording-2',
      filename: 'Uploaded_Session_Audio.mp3',
      fileSize: 45000000, // 45MB
      duration: 2700, // 45 minutes
      uploadDate: new Date('2024-01-14T14:15:00'),
      format: 'audio/mp3',
      url: '/demo/recording-2.mp3',
      processingStatus: 'completed' as const,
      transcriptId: 'transcript-2',
      summaryId: 'summary-2',
    },
    {
      id: 'recording-3',
      filename: 'Processing_Recording.webm',
      fileSize: 89000000, // 89MB
      duration: 0,
      uploadDate: new Date(),
      format: 'video/webm',
      url: '/demo/recording-3.webm',
      processingStatus: 'processing' as const,
    },
  ];

  const handleRecordingAdded = (recording: any) => {
    console.log('🎥 New recording added:', recording);
    // In real app, this would update the appointment data
  };

  const handleSummaryGenerated = (summary: any) => {
    console.log('🤖 AI Summary generated:', summary);
    // In real app, this would save the summary and update UI
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageAppBar avatarUrls={[]} />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Page Header */}
        <Box mb={4}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            🎥 Recording System Demo
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Complete recording solution with direct recording, file upload, AI summaries, and playback
          </Typography>
          
          {/* Demo Mode Toggle */}
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Typography variant="body2" color="text.secondary">
              Demo Mode:
            </Typography>
            <Button
              variant={demoMode === 'coach' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setDemoMode('coach')}
            >
              Coach View
            </Button>
            <Button
              variant={demoMode === 'client' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setDemoMode('client')}
            >
              Client View
            </Button>
          </Stack>

          {/* Feature Overview */}
          <Stack direction="row" spacing={2} flexWrap="wrap" mb={3}>
            <Chip
              icon={<VideoIcon />}
              label="Direct Recording (Video/Audio/Screen)"
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<UploadIcon />}
              label="File Upload Support"
              color="secondary"
              variant="outlined"
            />
            <Chip
              icon={<AIIcon />}
              label="AI-Powered Summaries"
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<PlayIcon />}
              label="Playback & Transcription"
              color="info"
              variant="outlined"
            />
          </Stack>
        </Box>

        {/* Demo Information */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>Demo Features:</strong> This demonstration includes mock data and simulated AI processing. 
            In production, recordings are securely stored, AI summaries are generated using advanced language models, 
            and all data is encrypted and HIPAA-compliant.
          </Typography>
        </Alert>

        {/* Mock Session Info */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📅 Demo Session Details
            </Typography>
            <Stack direction="row" spacing={4} flexWrap="wrap">
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  Session ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {mockAppointment.sessionId}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  User Role
                </Typography>
                <Typography variant="body2" textTransform="capitalize">
                  {demoMode}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  Session Type
                </Typography>
                <Typography variant="body2" textTransform="capitalize">
                  {mockAppointment.sessionType} Meeting
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">
                  Existing Recordings
                </Typography>
                <Typography variant="body2">
                  {mockRecordings.length} files available
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Main Recording Manager */}
        <AppointmentRecordingManager
          appointmentId={mockAppointment.id}
          sessionId={mockAppointment.sessionId}
          participantId={mockAppointment.participantId}
          userId={mockAppointment.userId}
          userRole={mockAppointment.userRole as 'coach' | 'client'}
          meetingUrl={mockAppointment.meetingUrl}
          sessionType={mockAppointment.sessionType}
          existingRecordings={mockRecordings}
          onRecordingAdded={handleRecordingAdded}
          onSummaryGenerated={handleSummaryGenerated}
          canManageRecordings={demoMode === 'coach'} // Coaches can manage, clients can view
          maxFileSize={500} // 500MB limit
        />

        {/* Demo Instructions */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🎯 How to Test the Demo
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  1. Direct Recording Tab
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Choose recording mode (Video + Audio, Audio Only, or Screen Share)
                  • Click "Start Recording" to begin session recording
                  • Use pause/resume controls during recording
                  • Stop recording to automatically trigger AI summary generation
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="secondary" gutterBottom>
                  2. File Upload Tab
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Drag & drop or browse to select recording files
                  • Supports MP4, MOV, AVI, MP3, WAV, M4A formats
                  • Files are automatically processed and analyzed by AI
                  • Upload progress and file validation included
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  3. Playback Controls Tab
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • View all recordings for this session
                  • Play, pause, download, and share recordings
                  • See file details, duration, and processing status
                  • Delete recordings (coach permissions required)
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="info.main" gutterBottom>
                  4. AI Summary Tab
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Automatic generation of session summaries
                  • Key discussion points and action items
                  • AI insights and recommendations for next session
                  • Edit summaries and share with clients
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Technical Features */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🔧 Technical Features Implemented
            </Typography>
            
            <Stack spacing={1}>
              <Typography variant="body2">
                ✅ <strong>Real-time WebSocket updates</strong> - Live recording status across participants
              </Typography>
              <Typography variant="body2">
                ✅ <strong>Comprehensive file validation</strong> - Format, size, and security checks
              </Typography>
              <Typography variant="body2">
                ✅ <strong>Progress tracking</strong> - Upload progress, processing status, and completion notifications
              </Typography>
              <Typography variant="body2">
                ✅ <strong>AI-powered analysis</strong> - Automatic summary generation and transcript creation
              </Typography>
              <Typography variant="body2">
                ✅ <strong>Multi-format support</strong> - Video, audio, and screen recording capabilities
              </Typography>
              <Typography variant="body2">
                ✅ <strong>Role-based permissions</strong> - Different capabilities for coaches vs clients
              </Typography>
              <Typography variant="body2">
                ✅ <strong>Responsive design</strong> - Works seamlessly on desktop, tablet, and mobile
              </Typography>
              <Typography variant="body2">
                ✅ <strong>Translation system</strong> - Fully internationalized interface
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </ThemeProvider>
  );
};

export default RecordingDemoPage;