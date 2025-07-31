import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  MenuItem,
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { useTranslation } from 'react-i18next';
import { searchPatients } from '../api/patients';
import { scheduleAppointment } from '../api/appointments';
import { logger } from '../logger';
import { theme } from '../theme';

interface Option {
  id: number;
  label: string;
}

export type MeetingType = 'in-person' | 'online' | 'hybrid';
export type RecordingType = 'none' | 'audio-only' | 'video' | 'screen-share' | 'full-session';

interface RecordingSettings {
  enabled: boolean;
  type: RecordingType;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  autoStart: boolean;
  includeTranscription: boolean;
  shareWithClient: boolean;
  retentionDays: number;
}

interface MeetingConfig {
  type: MeetingType;
  location?: string;
  meetingUrl?: string;
  googleMeetEnabled: boolean;
  recordingSettings: RecordingSettings;
  waitingRoomEnabled: boolean;
  allowClientToJoinEarly: boolean;
  meetingDuration: number;
}

interface ScheduleAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onScheduled?: (appointment: any) => void;
}

const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({ 
  open, 
  onClose, 
  onScheduled 
}) => {
  const { t, i18n } = useTranslation();
  const [patientQuery, setPatientQuery] = useState('');
  const [patientOptions, setPatientOptions] = useState<Option[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Option | null>(null);
  const [datetime, setDatetime] = useState<Date | null>(new Date());
  const [serviceType, setServiceType] = useState('consultation');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Meeting configuration state
  const [meetingType, setMeetingType] = useState<MeetingType>('in-person');
  const [location, setLocation] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [recordingSettings, setRecordingSettings] = useState<RecordingSettings>({
    enabled: false,
    type: 'none',
    quality: 'medium',
    autoStart: false,
    includeTranscription: false,
    shareWithClient: false,
    retentionDays: 30
  });

  // Helper functions
  const isOnline = meetingType === 'online' || meetingType === 'hybrid';
  
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

  // Update recording type when meeting type changes
  useEffect(() => {
    if (recordingSettings.enabled) {
      const recommendedType = getRecommendedRecordingType(meetingType);
      setRecordingSettings(prev => ({
        ...prev,
        type: recommendedType
      }));
    }
  }, [meetingType, recordingSettings.enabled]);

  // debounce search
  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!patientQuery) return;
      setLoadingPatients(true);
      try {
        logger.info('search patients', patientQuery);
        const res = await searchPatients(patientQuery);
        setPatientOptions(res.items.map((p: any) => ({ id: p.id, label: `${p.firstName} ${p.lastName}` })));
      } catch (e) {
        logger.error('patient search failed', e);
      } finally {
        setLoadingPatients(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [patientQuery]);

  const handleSubmit = async () => {
    if (!selectedPatient || !datetime) return;
    
    setIsSubmitting(true);
    try {
      logger.info('submit appointment with meeting config');
      
      // Calculate meeting duration
      const endTime = new Date(datetime.getTime() + 60 * 60 * 1000); // Default 1 hour
      const meetingDuration = Math.floor((endTime.getTime() - datetime.getTime()) / (1000 * 60));
      
      // Prepare enhanced appointment data
      const appointmentData = {
        therapistId: 'current-user-id', // TODO: Get from auth context
        clientId: selectedPatient.id.toString(),
        startTime: datetime.toISOString(),
        endTime: endTime.toISOString(),
        title: `${serviceType} with ${selectedPatient.label}`,
        description: notes,
        meetingType,
        location: meetingType === 'in-person' ? location : undefined,
        recordingSettings,
        googleMeetEnabled: isOnline,
        clientPreferences: {
          preferredNotificationMethod: 'email' as const,
          allowRecording: recordingSettings.enabled,
          requireConfirmation: true
        },
        reminderTimes: ['24h', '1h'],
        tags: [serviceType]
      };

      // Use the enhanced appointment creation endpoint
      const result = await fetch('/api/appointments/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add JWT auth header
        },
        body: JSON.stringify(appointmentData)
      });

      if (!result.ok) {
        throw new Error('Failed to schedule coaching session');
      }

      const responseData = await result.json();
      
      if (onScheduled) {
        onScheduled(responseData.appointment);
      }
      
      onClose();
      
      // Reset form
      setSelectedPatient(null);
      setDatetime(new Date());
      setServiceType('consultation');
      setNotes('');
      setMeetingType('in-person');
      setLocation('');
      setRecordingSettings({
        enabled: false,
        type: 'none',
        quality: 'medium',
        autoStart: false,
        includeTranscription: false,
        shareWithClient: false,
        retentionDays: 30
      });
      
    } catch (e) {
      logger.error('schedule appointment failed', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={undefined}>
        <Dialog 
          open={open} 
          onClose={onClose} 
          fullWidth 
          maxWidth="md" 
          dir={i18n.dir()}
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.95) 100%)`,
              backdropFilter: 'blur(20px)',
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h5" fontWeight={600}>
              {t('scheduleAppointment')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure meeting type and recording preferences
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ py: 2 }}>
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Patient Selection */}
              <Autocomplete
                options={patientOptions}
                value={selectedPatient}
                loading={loadingPatients}
                onInputChange={(_, value) => setPatientQuery(value)}
                onChange={(_, value) => setSelectedPatient(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('patientName')}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingPatients ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              {/* Date and Time */}
              <DateTimePicker
                label={t('datetime')}
                value={datetime}
                onChange={(val) => setDatetime(val)}
                slotProps={{
                  textField: { 
                    fullWidth: true, 
                    error: !!(datetime && datetime < new Date()),
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }
                  },
                }}
              />

              {/* Service Type */}
              <TextField
                select
                fullWidth
                label={t('serviceType')}
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              >
                <MenuItem value="consultation">Consultation</MenuItem>
                <MenuItem value="therapy">Therapy</MenuItem>
              </TextField>

              {/* Meeting Type Configuration */}
              <Card 
                sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.85) 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid rgba(255, 255, 255, 0.25)`,
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(46, 125, 107, 0.06)'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: `${getMeetingTypeColor(meetingType)}15`,
                          color: getMeetingTypeColor(meetingType),
                        }}
                      >
                        {getMeetingTypeIcon(meetingType)}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          Meeting Type
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {meetingType === 'online' ? 'Online Meeting' : 'In-Person Session'}
                        </Typography>
                      </Box>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={isOnline}
                          onChange={(e) => setMeetingType(e.target.checked ? 'online' : 'in-person')}
                          color="primary"
                          size="medium"
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                  </Box>

                  {/* Meeting Configuration */}
                  {isOnline && (
                    <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                      <Typography variant="body2">
                        A Google Meet link will be generated automatically and sent to the client.
                      </Typography>
                    </Alert>
                  )}

                  {!isOnline && (
                    <TextField
                      fullWidth
                      label="Meeting Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter the meeting location"
                      variant="outlined"
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
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
                            onChange={(e) => setRecordingSettings(prev => ({ 
                              ...prev, 
                              enabled: e.target.checked,
                              type: e.target.checked ? getRecommendedRecordingType(meetingType) : 'none'
                            }))}
                            size="small"
                            color="primary"
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                      
                      <Tooltip title="Advanced recording settings">
                        <IconButton
                          size="small"
                          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                        >
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
                            {(['low', 'medium', 'high', 'ultra'] as const).map((quality) => (
                              <Chip
                                key={quality}
                                label={quality}
                                size="small"
                                clickable
                                color={recordingSettings.quality === quality ? 'primary' : 'default'}
                                variant={recordingSettings.quality === quality ? 'filled' : 'outlined'}
                                onClick={() => setRecordingSettings(prev => ({ ...prev, quality }))}
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
                            onChange={(e) => setRecordingSettings(prev => ({ ...prev, autoStart: e.target.checked }))}
                            size="small"
                          />
                        </Box>

                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">
                            Include transcription
                          </Typography>
                          <Switch
                            checked={recordingSettings.includeTranscription}
                            onChange={(e) => setRecordingSettings(prev => ({ ...prev, includeTranscription: e.target.checked }))}
                            size="small"
                          />
                        </Box>

                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">
                            Share with client
                          </Typography>
                          <Switch
                            checked={recordingSettings.shareWithClient}
                            onChange={(e) => setRecordingSettings(prev => ({ ...prev, shareWithClient: e.target.checked }))}
                            size="small"
                          />
                        </Box>
                      </Stack>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>

              {/* Notes */}
              <TextField
                fullWidth
                label={t('notes')}
                multiline
                minRows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button 
              onClick={onClose}
              disabled={isSubmitting}
              sx={{ borderRadius: 2 }}
            >
              {t('cancel')}
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit} 
              disabled={!selectedPatient || !datetime || isSubmitting || (meetingType === 'in-person' && !location.trim())}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
              sx={{ 
                borderRadius: 2,
                minWidth: 120
              }}
            >
              {isSubmitting ? 'Scheduling...' : t('submit')}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default ScheduleAppointmentModal;
