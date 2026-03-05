import React, { useEffect, useState } from 'react';
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
  Alert,
} from '@mui/material';
import {
  VideoCall as VideoCallIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { getDatePickerLocale } from '../locales/datePickerLocale';
import { useTranslation } from '../contexts/LanguageContext';
import { searchPatients } from '../api/patients';
import { scheduleAppointment } from '../api/appointments';
import { logger } from '../logger';
import { theme } from '../theme';

interface Option {
  id: number;
  label: string;
}

export type MeetingType = 'in-person' | 'online';

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
  const { translations: t, language } = useTranslation();
  const { adapterLocale, localeText } = getDatePickerLocale(language);
  const [patientQuery, setPatientQuery] = useState('');
  const [patientOptions, setPatientOptions] = useState<Option[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Option | null>(null);
  const [datetime, setDatetime] = useState<Date | null>(new Date());
  const [serviceType, setServiceType] = useState('consultation');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Meeting configuration state
  const [meetingType, setMeetingType] = useState<MeetingType>('in-person');
  const [location, setLocation] = useState('');

  // Helper functions
  const isOnline = meetingType === 'online';
  
  const getMeetingTypeIcon = (type: MeetingType) => {
    switch (type) {
      case 'online':
        return <VideoCallIcon />;
      case 'in-person':
      default:
        return <PersonIcon />;
    }
  };

  const getMeetingTypeColor = (type: MeetingType) => {
    switch (type) {
      case 'online':
        return theme.palette.primary.main;
      case 'in-person':
      default:
        return theme.palette.secondary.main;
    }
  };

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
    setSubmitError(null);
    try {
      logger.info('submit appointment with meeting config');

      const result = await scheduleAppointment({
        patientId: selectedPatient.id,
        datetime: datetime.toISOString(),
        serviceType,
        notes: notes || undefined,
        meetingType,
        location: meetingType === 'in-person' ? location : undefined,
        googleMeetEnabled: isOnline,
      });

      if (onScheduled) {
        onScheduled(result);
      }

      onClose();

      // Reset form
      setSelectedPatient(null);
      setDatetime(new Date());
      setServiceType('consultation');
      setNotes('');
      setMeetingType('in-person');
      setLocation('');
      setSubmitError(null);

    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || t.calendarPage.scheduleFailed || 'Failed to schedule coaching session';
      setSubmitError(message);
      logger.error('schedule appointment failed', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={adapterLocale}
        localeText={localeText}
      >
        <Dialog
          open={open}
          onClose={onClose}
          fullWidth
          maxWidth="sm"
          dir="rtl"
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
              {t.calendarPage.scheduleNewAppointment}
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
                    label={t.calendarPage.client}
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
                label={t.addAppointmentPage.datetime}
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
                  popper: {
                    sx: {
                      // Force LTR on the entire picker layout so hours appear on LEFT, minutes on RIGHT
                      '& .MuiPickersLayout-root': {
                        direction: 'ltr !important',
                      },
                      '& .MuiPickersLayout-contentWrapper': {
                        direction: 'ltr !important',
                      },
                      '& .MuiMultiSectionDigitalClock-root': {
                        direction: 'ltr !important',
                        flexDirection: 'row !important',
                      },
                      // Keep calendar header in RTL for Hebrew month names
                      '& .MuiPickersCalendarHeader-root': {
                        direction: 'rtl',
                      },
                      // Keep day grid in RTL for Hebrew day names
                      '& .MuiDayCalendar-root': {
                        direction: 'rtl',
                      },
                    }
                  },
                }}
              />

              {/* Service Type */}
              <TextField
                select
                fullWidth
                label={t.calendarPage.sessionType}
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              >
                <MenuItem value="individual">{t.calendarPage.individualTherapy}</MenuItem>
                <MenuItem value="group">{t.calendarPage.groupTherapy}</MenuItem>
                <MenuItem value="family">{t.calendarPage.familyTherapy}</MenuItem>
                <MenuItem value="consultation">{t.calendarPage.consultation}</MenuItem>
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
                          {isOnline ? t.calendarPage.onlineMeeting : t.calendarPage.inPersonMeeting}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {isOnline ? t.calendarPage.meetingTypes.online : t.calendarPage.meetingTypes.inPerson}
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
                        {t.calendarPage.googleMeet.willGenerate}
                      </Typography>
                    </Alert>
                  )}

                  {!isOnline && (
                    <TextField
                      fullWidth
                      required
                      label={t.calendarPage.location}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t.calendarPage.locationPlaceholder}
                      variant="outlined"
                      helperText={!location.trim() ? (t.calendarPage.locationRequired || 'Location is required for in-person meetings') : ''}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Error Alert */}
              {submitError && (
                <Alert severity="error" onClose={() => setSubmitError(null)} sx={{ borderRadius: 2 }}>
                  {submitError}
                </Alert>
              )}

              {/* Notes */}
              <TextField
                fullWidth
                label={t.calendarPage.sessionNotes}
                multiline
                minRows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.calendarPage.sessionNotesPlaceholder}
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
              {t.calendarPage.cancel}
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
              {t.calendarPage.schedule}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default ScheduleAppointmentModal;
