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
} from '@mui/material';
import {
  EventAvailable as EventIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Notes as NotesIcon,
  MedicalServices as ServiceIcon,
} from '@mui/icons-material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { useTranslation } from 'react-i18next';
import { scheduleAppointment } from '../api/appointments';
import WellnessLayout from '../layouts/WellnessLayout';

/**
 * Page for scheduling a new appointment.
 */
const AddAppointmentPage: React.FC = () => {
  const { t } = useTranslation();
  const [patientId, setPatientId] = useState('');
  const [datetime, setDatetime] = useState<Date | null>(new Date());
  const [serviceType, setServiceType] = useState('consultation');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !datetime) return;
    setSaving(true);
    try {
      await scheduleAppointment({
        patientId: Number(patientId),
        datetime: datetime.toISOString(),
        serviceType,
        notes,
      });
      setSnack(t('appointmentSaved', 'Appointment saved'));
      setPatientId('');
      setNotes('');
    } catch {
      setSnack(t('saveFailed', 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <WellnessLayout
      title="Schedule Appointment"
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
          📅 Schedule New Appointment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Book a therapy session with your client
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
                  label={t('patientId', 'Patient ID')}
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="Enter patient ID or search by name"
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label={t('datetime', 'Date & Time')}
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
                  label={t('serviceType', 'Session Type')}
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  InputProps={{
                    startAdornment: <ServiceIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                >
                  <MenuItem value="consultation">Initial Consultation</MenuItem>
                  <MenuItem value="therapy">Individual Therapy</MenuItem>
                  <MenuItem value="group">Group Therapy</MenuItem>
                  <MenuItem value="family">Family Therapy</MenuItem>
                  <MenuItem value="followup">Follow-up Session</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('notes', 'Session Notes')}
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any special instructions or notes for this session..."
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
                    disabled={saving || !patientId || !datetime}
                    startIcon={<EventIcon />}
                    sx={{ height: 56 }}
                  >
                    {t('submit', 'Schedule Appointment')}
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
