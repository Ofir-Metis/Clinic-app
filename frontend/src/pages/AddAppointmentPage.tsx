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
} from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers-pro';
import { AdapterDateFns } from '@mui/x-date-pickers-pro/AdapterDateFns';
import { useTranslation } from 'react-i18next';
import { scheduleAppointment } from '../api/appointments';

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
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <Card sx={{ width: 400 }}>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              margin="normal"
              label={t('patientId', 'Patient ID')}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label={t('datetime')}
                value={datetime}
                onChange={(val) => setDatetime(val)}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </LocalizationProvider>
            <TextField
              select
              fullWidth
              margin="normal"
              label={t('serviceType')}
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              <MenuItem value="consultation">Consultation</MenuItem>
              <MenuItem value="therapy">Therapy</MenuItem>
            </TextField>
            <TextField
              fullWidth
              margin="normal"
              label={t('notes')}
              multiline
              minRows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Box sx={{ position: 'relative', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={saving || !patientId || !datetime}
              >
                {t('submit')}
              </Button>
              {saving && (
                <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: -1.5, ml: -1.5 }} />
              )}
            </Box>
          </form>
        </CardContent>
      </Card>
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack}
      />
    </Box>
  );
};

export default AddAppointmentPage;
