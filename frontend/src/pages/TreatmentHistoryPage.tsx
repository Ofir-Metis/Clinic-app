import React, { useEffect, useMemo, useState } from 'react';
import {
  ThemeProvider,
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
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
import { logger } from '../logger';
import { createAppTheme } from '../theme';

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
      .then((a) => {
        logger.debug('fetched appointment', a);
        setAppointment(a);
      })
      .catch((e) => {
        logger.error('fetch appointment failed', e);
      })
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
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small">{t('viewNote')}</Button>
              <Button variant="outlined" size="small">{t('reschedule')}</Button>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

interface NewDrawerProps { open: boolean; onClose: () => void; }
const NewAppointmentDrawer: React.FC<NewDrawerProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  return (
    <Drawer anchor="right" open={open} onClose={onClose} aria-label="new-appointment">
      <Box sx={{ width: 320, p: 2 }}>
        <IconButton onClick={onClose} aria-label="close-new">
          <CloseIcon />
        </IconButton>
        <Typography variant="h6">{t('newAppointment')}</Typography>
        {/* form fields would go here */}
      </Box>
    </Drawer>
  );
};

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

  const theme = useMemo(() => createAppTheme(i18n.dir()), [i18n]);

  useEffect(() => {
    console.info('TreatmentHistoryPage mount');
    logger.debug('mount', user.id);
  }, [user.id]);

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
          <IconButton edge="start" color="inherit" aria-label="back" href="/profile">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t('myTreatmentHistory', 'My Treatment History')}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Tabs
          value={tab}
          onChange={(_, v) => {
            console.info('tab switch', v);
            logger.debug('tab switch', v);
            setTab(v);
          }}
          aria-label="history-tabs"
        >
          <Tab label={t('calendarView')} />
          <Tab label={t('listView')} />
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
                  onSelectEvent={(e) => {
                    const id = (e as Appointment).id;
                    console.info('event click', id);
                    logger.debug('event click', id);
                    setSelectedId(id);
                  }}
                  style={{ height: '100%' }}
                />
              </Box>
            )}
            {tab === 1 && (
              <Box sx={{ height: 500, mt: 2 }}>
                <DataGrid
                  rows={items}
                  columns={columns}
                  autoHeight
                  disableRowSelectionOnClick
                  onRowClick={(p) => {
                    console.info('row click', p.row.id);
                    logger.debug('row click', p.row.id);
                    setSelectedId(p.row.id);
                  }}
                />
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
