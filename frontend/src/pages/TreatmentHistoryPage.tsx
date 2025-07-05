import React, { useEffect, useMemo, useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  Alert,
  Drawer,
  IconButton,
  Fab,
  Skeleton,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { useTranslation } from 'react-i18next';
import {
  Appointment,
  getAppointments,
  getAppointment,
  getAppointmentHistory,
} from '../api/appointments';

const locales = { en: require('date-fns/locale/en-US') };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

interface DetailDrawerProps {
  id: number | null;
  open: boolean;
  onClose: () => void;
}

const TreatmentDetailDrawer: React.FC<DetailDrawerProps> = ({ id, open, onClose }) => {
  const { t } = useTranslation();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAppointment(id)
      .then(setAppointment)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} aria-label="treatment-detail">
      <Box sx={{ width: 320, p: 2 }}>
        <IconButton onClick={onClose} aria-label="close-detail">
          <CloseIcon />
        </IconButton>
        {loading || !appointment ? (
          <Skeleton variant="rectangular" height={120} />
        ) : (
          <Box>
            <Typography variant="h6">
              {new Date(appointment.startTime).toLocaleString()}
            </Typography>
            <Typography>{t('client')}: {appointment.clientId}</Typography>
            <Typography>{t('type')}: {appointment.type}</Typography>
            <Typography>{t('status')}: {appointment.status}</Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

interface NewDrawerProps { open: boolean; onClose: () => void; }
const NewAppointmentDrawer: React.FC<NewDrawerProps> = ({ open, onClose }) => (
  <Drawer anchor="right" open={open} onClose={onClose} aria-label="new-appointment">
    <Box sx={{ width: 320, p: 2 }}>
      <IconButton onClick={onClose} aria-label="close-new">
        <CloseIcon />
      </IconButton>
      <Typography variant="h6">New Appointment</Typography>
      {/* form fields would go here */}
    </Box>
  </Drawer>
);

interface Props { user: { id: number }; }
const TreatmentHistoryPage: React.FC<Props> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  const theme = useMemo(
    () =>
      createTheme({
        direction: i18n.dir(),
        palette: { primary: { main: '#00A699' }, background: { default: '#F5F5F5' } },
        typography: { fontFamily: 'Roboto' },
      }),
    [i18n],
  );

  useEffect(() => {
    setLoading(true);
    const fetcher = tab === 0 ? getAppointments : getAppointmentHistory;
    fetcher({ therapistId: user.id } as any)
      .then(setItems)
      .catch(() => setError('failed'))
      .finally(() => setLoading(false));
  }, [tab, user.id]);

  const columns: GridColDef[] = [
    { field: 'date', headerName: 'Date', flex: 1, valueGetter: ({ row }) => new Date(row.startTime).toLocaleDateString() },
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
            {t('myTreatmentHistory', 'My Treatment History')}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="history-tabs">
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
                  events={items.map((a) => ({
                    ...a,
                    title: a.type,
                    start: new Date(a.startTime),
                    end: new Date(a.endTime),
                  }))}
                  onSelectEvent={(e) => setSelectedId((e as Appointment).id)}
                  style={{ height: '100%' }}
                />
              </Box>
            )}
            {tab === 1 && (
              <Box sx={{ height: 500, mt: 2 }}>
                <DataGrid rows={items} columns={columns} autoHeight disableRowSelectionOnClick onRowClick={(p) => setSelectedId(p.row.id)} />
              </Box>
            )}
          </>
        )}
      </Box>
      <TreatmentDetailDrawer id={selectedId} open={Boolean(selectedId)} onClose={() => setSelectedId(null)} />
      <NewAppointmentDrawer open={showNew} onClose={() => setShowNew(false)} />
      <Fab color="primary" sx={{ position: 'fixed', bottom: 16, right: 16 }} aria-label="new" onClick={() => setShowNew(true)}>
        <AddIcon />
      </Fab>
    </ThemeProvider>
  );
};

export default TreatmentHistoryPage;
