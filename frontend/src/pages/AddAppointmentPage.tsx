import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  CircularProgress,
  Box,
  Typography,
  Avatar,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  EventAvailable as EventIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Notes as NotesIcon,
  MedicalServices as ServiceIcon,
  VideoCall as VideoCallIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { getDatePickerLocale } from '../locales/datePickerLocale';
import { useTranslation } from '../contexts/LanguageContext';
import { scheduleAppointment } from '../api/appointments';
import WellnessLayout from '../layouts/WellnessLayout';

type MeetingType = 'in-person' | 'online';

/**
 * Page for scheduling a new appointment.
 */
const AddAppointmentPage: React.FC = () => {
  const { translations: t, language } = useTranslation();
  const { adapterLocale, localeText } = getDatePickerLocale(language);
  const theme = useTheme();
  const [clientId, setClientId] = useState('');
  const [datetime, setDatetime] = useState<Date | null>(new Date());
  const [sessionType, setSessionType] = useState('consultation');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  // Meeting configuration state
  const [meetingType, setMeetingType] = useState<MeetingType>('in-person');
  const [googleMeetEnabled, setGoogleMeetEnabled] = useState(true);
  const [location, setLocation] = useState('');

  const isOnline = meetingType === 'online';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !datetime) return;
    if (!isOnline && !location.trim()) return; // Location required for in-person

    setSaving(true);
    try {
      await scheduleAppointment({
        patientId: Number(clientId),
        datetime: datetime.toISOString(),
        serviceType: sessionType,
        notes,
        meetingType,
        location: isOnline ? undefined : location,
        googleMeetEnabled: isOnline ? googleMeetEnabled : false,
      });
      setSnack(t.addAppointmentPage.appointmentSaved);
      setClientId('');
      setNotes('');
      setLocation('');
      setMeetingType('in-person');
      setGoogleMeetEnabled(true);
    } catch {
      setSnack(t.addAppointmentPage.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <WellnessLayout
      title={t.addAppointmentPage.title}
      showFab={false}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Avatar sx={{
          width: 80,
          height: 80,
          bgcolor: 'secondary.main',
          mx: 'auto',
          mb: 2
        }}>
          <EventIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography
          component="h1"
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            background: 'linear-gradient(135deg, #8B5A87 0%, #A67B9A 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t.addAppointmentPage.heading}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t.addAppointmentPage.subtitle}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ width: '100%', maxWidth: 600 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t.addAppointmentPage.clientId}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder={t.addAppointmentPage.clientIdPlaceholder}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={adapterLocale}
                  localeText={localeText}
                >
                  <DateTimePicker
                    label={t.addAppointmentPage.datetime}
                    value={datetime}
                    onChange={(val) => setDatetime(val)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputProps: {
                          startAdornment: <ScheduleIcon sx={{ mr: 1, color: 'action.active' }} />
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label={t.addAppointmentPage.sessionType}
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  InputProps={{
                    startAdornment: <ServiceIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                >
                  <MenuItem value="consultation">{t.addAppointmentPage.sessionTypes.consultation}</MenuItem>
                  <MenuItem value="coaching">{t.addAppointmentPage.sessionTypes.coaching}</MenuItem>
                  <MenuItem value="group">{t.addAppointmentPage.sessionTypes.group}</MenuItem>
                  <MenuItem value="family">{t.addAppointmentPage.sessionTypes.family}</MenuItem>
                  <MenuItem value="followup">{t.addAppointmentPage.sessionTypes.followup}</MenuItem>
                </TextField>
              </Grid>

              {/* Meeting Configuration Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" sx={{ mt: 2, mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isOnline ? <VideoCallIcon color="primary" /> : <LocationIcon color="secondary" />}
                  {t.addAppointmentPage.meetingConfiguration}
                </Typography>
              </Grid>

              {/* Meeting Type Toggle */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: isOnline
                            ? alpha(theme.palette.primary.main, 0.15)
                            : alpha(theme.palette.secondary.main, 0.15),
                          color: isOnline ? theme.palette.primary.main : theme.palette.secondary.main,
                        }}
                      >
                        {isOnline ? <VideoCallIcon /> : <LocationIcon />}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {isOnline ? t.addAppointmentPage.onlineMeeting : t.addAppointmentPage.inPersonMeeting}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {isOnline
                            ? t.addAppointmentPage.meetingTypes.online
                            : t.addAppointmentPage.meetingTypes.inPerson}
                        </Typography>
                      </Box>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isOnline}
                          onChange={(e) => setMeetingType(e.target.checked ? 'online' : 'in-person')}
                          color="primary"
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                  </Box>
                </Box>
              </Grid>

              {/* Google Meet Toggle (for online meetings) */}
              {isOnline && (
                <Grid item xs={12}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.info.main, 0.04),
                      border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: googleMeetEnabled ? 2 : 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: googleMeetEnabled
                              ? alpha('#4285F4', 0.15)
                              : alpha(theme.palette.grey[500], 0.15),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src="https://www.gstatic.com/meet/google_meet_horizontal_wordmark_2020q4_1x_icon_124_40_2373e79660dabbf194273d27aa7ee1f5.png"
                            alt="Google Meet"
                            style={{ height: 20, opacity: googleMeetEnabled ? 1 : 0.5 }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {t.addAppointmentPage.googleMeet.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t.addAppointmentPage.googleMeet.enabled}
                          </Typography>
                        </Box>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={googleMeetEnabled}
                            onChange={(e) => setGoogleMeetEnabled(e.target.checked)}
                            color="primary"
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                    </Box>
                    {googleMeetEnabled && (
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        <Typography variant="body2">
                          {t.addAppointmentPage.googleMeet.willGenerate}
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                </Grid>
              )}

              {/* Location Field (for in-person meetings) */}
              {!isOnline && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label={t.addAppointmentPage.location}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t.addAppointmentPage.locationPlaceholder}
                    InputProps={{
                      startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t.addAppointmentPage.notes}
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.addAppointmentPage.notesPlaceholder}
                  InputProps={{
                    startAdornment: <NotesIcon sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ position: 'relative' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={saving || !clientId || !datetime || (!isOnline && !location.trim())}
                    startIcon={<EventIcon />}
                    sx={{ height: 56 }}
                  >
                    {t.addAppointmentPage.scheduleButton}
                  </Button>
                  {saving && (
                    <CircularProgress
                      size={24}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        mt: -1.5,
                        ml: -1.5
                      }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      </Box>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack}
      />
    </WellnessLayout>
  );
};

export default AddAppointmentPage;
