/**
 * MeetingTypeToggle - Component for switching between in-person and online meetings
 * Provides smooth UX for therapists to change meeting types with proper confirmations
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Stack,
  CircularProgress,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export type MeetingType = 'in-person' | 'online' | 'hybrid';
export type RecordingType = 'none' | 'audio-only' | 'video' | 'screen-share' | 'full-session';

interface MeetingConfig {
  type: MeetingType;
  location?: string;
  meetingUrl?: string;
  googleMeetEnabled: boolean;
  recordingSettings: {
    enabled: boolean;
    type: RecordingType;
    quality: 'low' | 'medium' | 'high' | 'ultra';
    autoStart: boolean;
    includeTranscription: boolean;
    shareWithClient: boolean;
    retentionDays: number;
  };
  waitingRoomEnabled: boolean;
  allowClientToJoinEarly: boolean;
  meetingDuration: number;
}

interface MeetingTypeToggleProps {
  appointmentId: string;
  currentMeetingType: MeetingType;
  currentConfig: MeetingConfig;
  canModify: boolean;
  isLoading?: boolean;
  onMeetingTypeChange: (
    appointmentId: string,
    newType: MeetingType,
    config: Partial<MeetingConfig>
  ) => Promise<{ success: boolean; meetingUrl?: string; warnings?: string[] }>;
  onRecordingSettingsChange: (
    appointmentId: string,
    settings: Partial<MeetingConfig['recordingSettings']>
  ) => Promise<{ success: boolean }>;
}

export const MeetingTypeToggle: React.FC<MeetingTypeToggleProps> = ({
  appointmentId,
  currentMeetingType,
  currentConfig,
  canModify,
  isLoading = false,
  onMeetingTypeChange,
  onRecordingSettingsChange,
}) => {
  const theme = useTheme();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingMeetingType, setPendingMeetingType] = useState<MeetingType>(currentMeetingType);
  const [location, setLocation] = useState(currentConfig.location || '');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [changingType, setChangingType] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [recordingSettings, setRecordingSettings] = useState(currentConfig.recordingSettings);

  const isOnline = currentMeetingType === 'online' || currentMeetingType === 'hybrid';

  const getMeetingTypeIcon = (type: MeetingType) => {
    switch (type) {
      case 'online':
        return <VideoCallIcon />;
      case 'in-person':
        return <PersonIcon />;
      case 'hybrid':
        return <VideoCallIcon />; // Could use a hybrid icon
      default:
        return <PersonIcon />;
    }
  };

  const getMeetingTypeColor = (type: MeetingType) => {
    switch (type) {
      case 'online':
        return theme.palette.primary.main;
      case 'in-person':
        return theme.palette.secondary.main;
      case 'hybrid':
        return theme.palette.accent?.main || theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getRecommendedRecordingType = (meetingType: MeetingType): RecordingType => {
    switch (meetingType) {
      case 'online':
        return recordingSettings.enabled ? 'full-session' : 'none';
      case 'in-person':
        return recordingSettings.enabled ? 'audio-only' : 'none';
      case 'hybrid':
        return recordingSettings.enabled ? 'video' : 'none';
      default:
        return 'none';
    }
  };

  const handleMeetingTypeToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canModify) return;

    const newType: MeetingType = event.target.checked ? 'online' : 'in-person';
    setPendingMeetingType(newType);
    
    // Show confirmation dialog for significant changes
    if (currentMeetingType !== newType) {
      setShowConfirmDialog(true);
    }
  }, [canModify, currentMeetingType]);

  const handleConfirmChange = useCallback(async () => {
    if (!canModify) return;

    setChangingType(true);
    setWarnings([]);

    try {
      const config: Partial<MeetingConfig> = {
        type: pendingMeetingType,
        location: pendingMeetingType === 'in-person' ? location : undefined,
        googleMeetEnabled: pendingMeetingType === 'online',
        recordingSettings: {
          ...recordingSettings,
          type: getRecommendedRecordingType(pendingMeetingType)
        }
      };

      const result = await onMeetingTypeChange(appointmentId, pendingMeetingType, config);

      if (result.success) {
        if (result.warnings && result.warnings.length > 0) {
          setWarnings(result.warnings);
        }
        setShowConfirmDialog(false);
      } else {
        throw new Error('Failed to change meeting type');
      }
    } catch (error) {
      console.error('Failed to change meeting type:', error);
      setPendingMeetingType(currentMeetingType); // Revert
      setWarnings(['Failed to change meeting type. Please try again.']);
    } finally {
      setChangingType(false);
    }
  }, [
    canModify,
    appointmentId,
    pendingMeetingType,
    location,
    recordingSettings,
    currentMeetingType,
    onMeetingTypeChange
  ]);

  const handleRecordingSettingsChange = useCallback(async (
    newSettings: Partial<MeetingConfig['recordingSettings']>
  ) => {
    try {
      const result = await onRecordingSettingsChange(appointmentId, newSettings);
      if (result.success) {
        setRecordingSettings(prev => ({ ...prev, ...newSettings }));
      }
    } catch (error) {
      console.error('Failed to update recording settings:', error);
    }
  }, [appointmentId, onRecordingSettingsChange]);

  const handleCancelChange = useCallback(() => {
    setPendingMeetingType(currentMeetingType);
    setShowConfirmDialog(false);
  }, [currentMeetingType]);

  return (
    <Box>
      <Card 
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.85) 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(255, 255, 255, 0.25)`,
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: `${getMeetingTypeColor(currentMeetingType)}15`,
                  color: getMeetingTypeColor(currentMeetingType),
                }}
              >
                {getMeetingTypeIcon(currentMeetingType)}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Meeting Type
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentMeetingType === 'online' ? 'Online Meeting' : 'In-Person Session'}
                </Typography>
              </Box>
            </Box>

            <Tooltip title={!canModify ? 'Cannot modify this appointment' : ''}>
              <span>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isOnline}
                      onChange={handleMeetingTypeToggle}
                      disabled={!canModify || isLoading}
                      color="primary"
                      size="medium"
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
              </span>
            </Tooltip>
          </Box>

          {/* Meeting URL Display */}
          {isOnline && currentConfig.meetingUrl && (
            <Box mb={2}>
              <Alert 
                severity="info" 
                icon={<VideoCallIcon />}
                sx={{ borderRadius: 2 }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600} mb={0.5}>
                    Google Meet Link
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      wordBreak: 'break-all',
                      color: theme.palette.primary.main,
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => window.open(currentConfig.meetingUrl, '_blank')}
                  >
                    {currentConfig.meetingUrl}
                  </Typography>
                </Box>
              </Alert>
            </Box>
          )}

          {/* Location Display */}
          {!isOnline && currentConfig.location && (
            <Box mb={2}>
              <Alert 
                severity="info" 
                icon={<PersonIcon />}
                sx={{ borderRadius: 2 }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600} mb={0.5}>
                    Meeting Location
                  </Typography>
                  <Typography variant="body2">
                    {currentConfig.location}
                  </Typography>
                </Box>
              </Alert>
            </Box>
          )}

          {/* Recording Settings */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" fontWeight={500}>
                Recording
              </Typography>
              <Chip
                label={recordingSettings.enabled ? recordingSettings.type : 'disabled'}
                size="small"
                color={recordingSettings.enabled ? 'primary' : 'default'}
                variant={recordingSettings.enabled ? 'filled' : 'outlined'}
              />
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={recordingSettings.enabled}
                    onChange={(e) => handleRecordingSettingsChange({ enabled: e.target.checked })}
                    disabled={!canModify}
                    size="small"
                    color="primary"
                  />
                }
                label=""
                sx={{ m: 0 }}
              />
              
              <IconButton
                size="small"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                disabled={!canModify}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Advanced Recording Settings */}
          <Collapse in={showAdvancedSettings && recordingSettings.enabled}>
            <Box mt={2} p={2} sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" fontWeight={500} mb={1}>
                    Recording Quality
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {['low', 'medium', 'high', 'ultra'].map((quality) => (
                      <Chip
                        key={quality}
                        label={quality}
                        size="small"
                        clickable={canModify}
                        color={recordingSettings.quality === quality ? 'primary' : 'default'}
                        variant={recordingSettings.quality === quality ? 'filled' : 'outlined'}
                        onClick={() => canModify && handleRecordingSettingsChange({ quality: quality as any })}
                      />
                    ))}
                  </Stack>
                </Box>

                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">
                    Auto-start recording
                  </Typography>
                  <Switch
                    checked={recordingSettings.autoStart}
                    onChange={(e) => handleRecordingSettingsChange({ autoStart: e.target.checked })}
                    disabled={!canModify}
                    size="small"
                  />
                </Box>

                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">
                    Include transcription
                  </Typography>
                  <Switch
                    checked={recordingSettings.includeTranscription}
                    onChange={(e) => handleRecordingSettingsChange({ includeTranscription: e.target.checked })}
                    disabled={!canModify}
                    size="small"
                  />
                </Box>

                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">
                    Share with client
                  </Typography>
                  <Switch
                    checked={recordingSettings.shareWithClient}
                    onChange={(e) => handleRecordingSettingsChange({ shareWithClient: e.target.checked })}
                    disabled={!canModify}
                    size="small"
                  />
                </Box>
              </Stack>
            </Box>
          </Collapse>

          {/* Warnings */}
          {warnings.length > 0 && (
            <Box mt={2}>
              {warnings.map((warning, index) => (
                <Alert
                  key={index}
                  severity="warning"
                  onClose={() => setWarnings(prev => prev.filter((_, i) => i !== index))}
                  sx={{ mb: 1, borderRadius: 2 }}
                >
                  {warning}
                </Alert>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog 
        open={showConfirmDialog} 
        onClose={handleCancelChange}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.95) 100%)`,
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: `${getMeetingTypeColor(pendingMeetingType)}15`,
                color: getMeetingTypeColor(pendingMeetingType),
              }}
            >
              {getMeetingTypeIcon(pendingMeetingType)}
            </Box>
            <Box>
              <Typography variant="h6">
                Change to {pendingMeetingType === 'online' ? 'Online Meeting' : 'In-Person Session'}?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This will update the meeting configuration
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          {pendingMeetingType === 'online' && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              <Typography variant="body2">
                A Google Meet link will be generated automatically and sent to the client.
                Recording will be set to full-session mode if enabled.
              </Typography>
            </Alert>
          )}

          {pendingMeetingType === 'in-person' && (
            <Box>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2">
                  The Google Meet link will be removed. Recording will be set to audio-only mode if enabled.
                </Typography>
              </Alert>
              
              <TextField
                fullWidth
                label="Meeting Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter the meeting location"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCancelChange}
            disabled={changingType}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmChange}
            variant="contained"
            disabled={changingType || (pendingMeetingType === 'in-person' && !location.trim())}
            startIcon={changingType ? <CircularProgress size={16} /> : <CheckIcon />}
            sx={{ 
              borderRadius: 2,
              minWidth: 120
            }}
          >
            {changingType ? 'Changing...' : 'Confirm Change'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};