/**
 * ClientSettingsPage - Settings management for coaching clients
 * Includes Profile, Privacy, and Recording Consent tabs
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  Divider,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Mic as MicIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Shield as ShieldIcon,
  VideoCall as VideoIcon,
  Description as TranscriptIcon,
  Psychology as AIIcon,
} from '@mui/icons-material';
import WellnessLayout from '../../layouts/WellnessLayout';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const ClientSettingsPage: React.FC = () => {
  const theme = useTheme();
  const { translations } = useTranslation();
  const { user } = useAuth();
  const s = translations.clientPortal?.settings;

  const [tabValue, setTabValue] = useState(0);
  const [recordingConsent, setRecordingConsent] = useState({
    audio: true,
    transcription: true,
    aiAnalysis: false,
  });

  const handleTabChange = (event: React.MouseEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format user info safely
  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'No email';
  const userPhone = ''; // Not stored in current user object
  const memberSince = new Date().toLocaleDateString(); // Would come from API in real implementation

  return (
    <WellnessLayout
      title={s?.title || 'Settings'}
      showFab={false}
      maxWidth={1000}
    >
      <Card
        sx={{
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(46, 125, 107, 0.1)',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Header */}
          <Box sx={{ p: 4, pb: 2 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {s?.title || 'Settings'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {s?.subtitle || 'Manage your account preferences'}
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="settings tabs"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                },
              }}
            >
              <Tab
                icon={<PersonIcon />}
                iconPosition="start"
                label={s?.tabs?.profile || 'Profile'}
                id="settings-tab-0"
                aria-controls="settings-tabpanel-0"
              />
              <Tab
                icon={<SecurityIcon />}
                iconPosition="start"
                label={s?.tabs?.privacy || 'Privacy'}
                id="settings-tab-1"
                aria-controls="settings-tabpanel-1"
              />
              <Tab
                icon={<MicIcon />}
                iconPosition="start"
                label={s?.tabs?.consent || 'Recording Consent'}
                id="settings-tab-2"
                aria-controls="settings-tabpanel-2"
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <Box sx={{ p: 4 }}>
            {/* Profile Tab */}
            <TabPanel value={tabValue} index={0}>
              <Stack spacing={3}>
                {/* User Avatar and Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      fontSize: '2rem',
                      fontWeight: 700,
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {userName}
                    </Typography>
                    <Chip
                      label="Client"
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Profile Information */}
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {s?.profile?.name || 'Full Name'}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {userName}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EmailIcon color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {s?.profile?.email || 'Email Address'}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {userEmail}
                      </Typography>
                    </Box>
                  </Box>

                  {userPhone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PhoneIcon color="action" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {s?.profile?.phone || 'Phone Number'}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {userPhone}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarIcon color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {s?.profile?.memberSince || 'Member Since'}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {memberSince}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Stack>
            </TabPanel>

            {/* Privacy Tab */}
            <TabPanel value={tabValue} index={1}>
              <Stack spacing={4}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {s?.privacy?.title || 'Privacy Settings'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s?.privacy?.dataRetentionInfo ||
                      'Your data is securely stored and retained according to our privacy policy.'}
                  </Typography>
                </Box>

                <Divider />

                <Box
                  sx={{
                    p: 3,
                    background: alpha(theme.palette.info.main, 0.05),
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <ShieldIcon color="info" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {s?.privacy?.dataRetention || 'Data Retention'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your coaching session data, notes, and progress are stored securely and can be
                        downloaded or deleted at any time.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </TabPanel>

            {/* Recording Consent Tab */}
            <TabPanel value={tabValue} index={2}>
              <Stack spacing={4}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {s?.consent?.title || 'Recording Consent'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s?.consent?.description ||
                      'Manage your consent preferences for session recordings'}
                  </Typography>
                </Box>

                <Divider />

                <Stack spacing={3}>
                  {/* Audio Recording */}
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      background: alpha(theme.palette.background.paper, 0.5),
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <VideoIcon
                        color={recordingConsent.audio ? 'primary' : 'disabled'}
                        sx={{ fontSize: 32, mt: 0.5 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {s?.consent?.audioRecording || 'Audio Recording'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Allow coaches to record audio during sessions for quality improvement and
                          review purposes.
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={recordingConsent.audio}
                              onChange={(e) =>
                                setRecordingConsent((prev) => ({
                                  ...prev,
                                  audio: e.target.checked,
                                }))
                              }
                              color="primary"
                            />
                          }
                          label={recordingConsent.audio ? 'Enabled' : 'Disabled'}
                        />
                      </Box>
                    </Stack>
                  </Box>

                  {/* Transcription */}
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      background: alpha(theme.palette.background.paper, 0.5),
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <TranscriptIcon
                        color={recordingConsent.transcription ? 'primary' : 'disabled'}
                        sx={{ fontSize: 32, mt: 0.5 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {s?.consent?.transcription || 'Transcription'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Generate text transcripts of session recordings for easier review and note-taking.
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={recordingConsent.transcription}
                              onChange={(e) =>
                                setRecordingConsent((prev) => ({
                                  ...prev,
                                  transcription: e.target.checked,
                                }))
                              }
                              color="primary"
                            />
                          }
                          label={recordingConsent.transcription ? 'Enabled' : 'Disabled'}
                        />
                      </Box>
                    </Stack>
                  </Box>

                  {/* AI Analysis */}
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      background: alpha(theme.palette.background.paper, 0.5),
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <AIIcon
                        color={recordingConsent.aiAnalysis ? 'primary' : 'disabled'}
                        sx={{ fontSize: 32, mt: 0.5 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {s?.consent?.aiAnalysis || 'AI Analysis'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Use AI to generate insights, action items, and summaries from your coaching
                          sessions.
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={recordingConsent.aiAnalysis}
                              onChange={(e) =>
                                setRecordingConsent((prev) => ({
                                  ...prev,
                                  aiAnalysis: e.target.checked,
                                }))
                              }
                              color="primary"
                            />
                          }
                          label={recordingConsent.aiAnalysis ? 'Enabled' : 'Disabled'}
                        />
                      </Box>
                    </Stack>
                  </Box>
                </Stack>

                {/* Consent History Info */}
                <Box
                  sx={{
                    p: 3,
                    background: alpha(theme.palette.info.main, 0.05),
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    {s?.consent?.consentHistory || 'Consent History'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s?.consent?.noHistory || 'No consent history available'}
                  </Typography>
                </Box>
              </Stack>
            </TabPanel>
          </Box>
        </CardContent>
      </Card>
    </WellnessLayout>
  );
};

export default ClientSettingsPage;
