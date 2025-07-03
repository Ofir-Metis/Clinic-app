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
  createTheme,
  CssBaseline,
} from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTranslation } from 'react-i18next';
import { searchPatients } from '../api/patients';
import { scheduleAppointment } from '../api/appointments';
import { logger } from '../logger';

interface Option {
  id: number;
  label: string;
}

interface ScheduleAppointmentModalProps {
  open: boolean;
  onClose: () => void;
}

const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({ open, onClose }) => {
  const { t, i18n } = useTranslation();
  const [patientQuery, setPatientQuery] = useState('');
  const [patientOptions, setPatientOptions] = useState<Option[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Option | null>(null);
  const [datetime, setDatetime] = useState<Date | null>(new Date());
  const [serviceType, setServiceType] = useState('consultation');
  const [notes, setNotes] = useState('');

  const theme = useMemo(
    () =>
      createTheme({
        direction: i18n.dir(),
        palette: { primary: { main: '#4C6EF5' }, secondary: { main: '#22B8CF' } },
        typography: { fontFamily: 'Roboto' },
      }),
    [i18n],
  );

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
    try {
      logger.info('submit appointment');
      await scheduleAppointment({
        patientId: selectedPatient.id,
        datetime: datetime.toISOString(),
        serviceType,
        notes,
      });
      onClose();
    } catch (e) {
      logger.error('schedule appointment failed', e);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={undefined}>
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir={i18n.dir()}>
          <DialogTitle>{t('scheduleAppointment')}</DialogTitle>
          <DialogContent>
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
                  margin="normal"
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
            <DateTimePicker
              label={t('datetime')}
              value={datetime}
              onChange={(val) => setDatetime(val)}
              slotProps={{
                textField: { fullWidth: true, margin: 'normal', error: datetime && datetime < new Date() },
              }}
            />
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
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t('cancel')}</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={!selectedPatient || !datetime}>
              {t('submit')}
            </Button>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default ScheduleAppointmentModal;
