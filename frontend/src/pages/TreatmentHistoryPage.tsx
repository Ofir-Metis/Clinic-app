import React, { useEffect, useState } from 'react';
import {
  Typography,
  Tabs,
  Tab,
  Box,
  Alert,
  Drawer,
  IconButton,
  Skeleton,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  List as ListIcon,
  Event as EventIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import * as RBC from 'react-big-calendar';
const Calendar = RBC.Calendar as React.ComponentType<any>;
const dateFnsLocalizer = RBC.dateFnsLocalizer;
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { useTranslation } from '../contexts/LanguageContext';
import {
  Appointment,
  getAppointments,
  getAppointment,
  getAppointmentHistory,
} from '../api/appointments';
import { logger } from '../logger';
import { enUS } from 'date-fns/locale/en-US';
import WellnessLayout from '../layouts/WellnessLayout';

const locales = { en: enUS };
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
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar sx={{ 
                width: 64, 
                height: 64, 
                bgcolor: 'primary.main',
                mx: 'auto',
                mb: 2,
              }}>
                <EventIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Treatment Session
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(appointment.startTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Box>
            
            <Divider />
            
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TimeIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">Time</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {new Date(appointment.startTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">Client ID</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {appointment.clientId}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">Session Type</Typography>
                  <Chip 
                    label={appointment.type} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <NotesIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    label={appointment.status} 
                    size="small" 
                    color={appointment.status === 'completed' ? 'success' : 'warning'}
                  />
                </Box>
              </Box>
            </Stack>
            
            <Divider />
            
            <Stack direction="row" spacing={2}>
              <Button variant="contained" fullWidth startIcon={<NotesIcon />}>
                {t('viewNote', 'View Notes')}
              </Button>
              <Button variant="outlined" fullWidth startIcon={<EventIcon />}>
                {t('reschedule', 'Reschedule')}
              </Button>
            </Stack>
          </Stack>
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

interface Props { user?: { id: number }; }
const TreatmentHistoryPage: React.FC<Props> = ({ user = { id: 1 } }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);

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
    <WellnessLayout
      title="Treatment History"
      showFab={true}
      fabIcon={<AddIcon />}
      fabAction={() => setShowNew(true)}
      fabAriaLabel="Schedule new appointment"
    >
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            mb: 1,
            background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          🕰️ Treatment History
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Comprehensive view of your therapy sessions and appointments
        </Typography>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* View Toggle */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              console.info('tab switch', v);
              logger.debug('tab switch', v);
              setTab(v);
            }}
            aria-label="history-tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon fontSize="small" />
                  {t('calendarView', 'Calendar View')}
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ListIcon fontSize="small" />
                  {t('listView', 'List View')}
                </Box>
              } 
            />
          </Tabs>
        </CardContent>
      </Card>
      {/* Content Area */}
      <Card>
        <CardContent>
          {loading ? (
            <Stack spacing={2}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={80} />
              ))}
            </Stack>
          ) : (
            <>
              {tab === 0 && (
                <Box sx={{ height: 600 }}>
                  <Calendar
                    localizer={localizer}
                    events={items.map((a) => ({
                      ...a,
                      title: a.type,
                      start: new Date(a.startTime),
                      end: new Date(a.endTime),
                    }))}
                    onSelectEvent={(e: any) => {
                      const id = (e as Appointment).id;
                      console.info('event click', id);
                      logger.debug('event click', id);
                      setSelectedId(id);
                    }}
                    style={{ 
                      height: '100%',
                      backgroundColor: 'transparent',
                    }}
                    eventPropGetter={() => ({
                      style: {
                        backgroundColor: '#2E7D6B',
                        borderRadius: '6px',
                        border: 'none',
                        color: 'white',
                        fontSize: '0.875rem',
                      },
                    })}
                  />
                </Box>
              )}
              {tab === 1 && (
                <Box sx={{ height: 500 }}>
                  <DataGrid
                    rows={items}
                    columns={[
                      { 
                        field: 'date', 
                        headerName: 'Date', 
                        flex: 1, 
                        renderCell: ({ row }) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EventIcon fontSize="small" color="action" />
                            {new Date(row.startTime).toLocaleDateString()}
                          </Box>
                        )
                      },
                      { 
                        field: 'clientId', 
                        headerName: 'Client', 
                        flex: 1,
                        renderCell: (params) => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            {params.value}
                          </Box>
                        )
                      },
                      { 
                        field: 'type', 
                        headerName: 'Type', 
                        flex: 1,
                        renderCell: (params) => (
                          <Chip 
                            label={params.value} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )
                      },
                      { 
                        field: 'status', 
                        headerName: 'Status', 
                        flex: 1,
                        renderCell: (params) => (
                          <Chip 
                            label={params.value} 
                            size="small" 
                            color={params.value === 'completed' ? 'success' : 'warning'}
                          />
                        )
                      },
                    ]}
                    autoHeight
                    disableRowSelectionOnClick
                    onRowClick={(p) => {
                      console.info('row click', p.row.id);
                      logger.debug('row click', p.row.id);
                      setSelectedId(p.row.id);
                    }}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid rgba(46, 125, 107, 0.12)',
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: 'rgba(46, 125, 107, 0.08)',
                        borderBottom: '2px solid rgba(46, 125, 107, 0.2)',
                      },
                      '& .MuiDataGrid-row:hover': {
                        backgroundColor: 'rgba(46, 125, 107, 0.04)',
                        cursor: 'pointer',
                      },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TreatmentDetailDrawer id={selectedId} open={Boolean(selectedId)} onClose={() => setSelectedId(null)} />
      <NewAppointmentDrawer open={showNew} onClose={() => setShowNew(false)} />
    </WellnessLayout>
  );
};

export default TreatmentHistoryPage;
