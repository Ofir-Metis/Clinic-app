import React, { useEffect, useMemo, useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  Drawer,
  IconButton,
  Fab,
  Alert,
  Skeleton,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { createAppTheme } from '../theme';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTranslation } from 'react-i18next';
import {
  getAppointments,
  getAppointment,
  updateAppointment,
  createAppointment,
  Appointment,
} from '../api/appointments';

const locales = {
  en: require('date-fns/locale/en-US'),
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

interface DetailProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
}

const AppointmentDetail: React.FC<DetailProps> = ({ appointment, open, onClose }) => (
  <Drawer anchor="right" open={open} onClose={onClose} aria-label="appointment-detail">
    <Box sx={{ width: 320, p: 2 }}>
      <IconButton onClick={onClose} aria-label="close">
        <CloseIcon />
      </IconButton>
      {appointment ? (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {new Date(appointment.startTime).toLocaleString()}
          </Typography>
          <Typography>{appointment.type}</Typography>
          {appointment.meetingUrl && (
            <Typography component="a" href={appointment.meetingUrl} target="_blank" rel="noopener">
              Video Link
            </Typography>
          )}
        </Box>
      ) : (
        <Skeleton variant="rectangular" width="100%" height={118} />
      )}
    </Box>
  </Drawer>
);

const AppointmentPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  const theme = useMemo(() => createAppTheme(i18n.dir()), [i18n]);

  useEffect(() => {
    setLoading(true);
    getAppointments({ therapistId: 1, view: 'calendar' })
      .then((data) => {
        setAppointments(data);
        setError('');
      })
      .catch(() => setError('error'))
      .finally(() => setLoading(false));
  }, []);

  const columns: GridColDef[] = [
    { field: 'date', headerName: 'Date', flex: 1, valueGetter: ({ row }) => new Date(row.startTime).toLocaleDateString() },
    { field: 'time', headerName: 'Time', flex: 1, valueGetter: ({ row }) => new Date(row.startTime).toLocaleTimeString() },
    { field: 'clientId', headerName: 'Client', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t('appointments', 'Appointments')}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="appointment tabs">
          <Tab label={t('calendar', 'Calendar')} />
          <Tab label={t('list', 'List')} />
        </Tabs>
        {loading ? (
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" height={200} />
          </Box>
        ) : (
          <>
            {tab === 0 && (
              <Box sx={{ height: 500, mt: 2 }}>
                <Calendar
                  localizer={localizer}
                  events={appointments.map((a) => ({
                    ...a,
                    title: a.type,
                    start: new Date(a.startTime),
                    end: new Date(a.endTime),
                  }))}
                  views={isMobile ? [Views.DAY, Views.AGENDA] : undefined}
                  onSelectEvent={(e) => setSelected(e as Appointment)}
                  style={{ height: '100%' }}
                />
              </Box>
            )}
            {tab === 1 && (
              <Box sx={{ height: 500, mt: 2 }}>
                <DataGrid rows={appointments} columns={columns} autoHeight disableRowSelectionOnClick onRowClick={(p) => setSelected(p.row)} />
              </Box>
            )}
          </>
        )}
        <AppointmentDetail appointment={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
        <Fab color="primary" sx={{ position: 'fixed', bottom: 16, right: 16 }} aria-label="new" onClick={() => createAppointment({})}>
          <AddIcon />
        </Fab>
      </Box>
    </ThemeProvider>
  );
};

export default AppointmentPage;
