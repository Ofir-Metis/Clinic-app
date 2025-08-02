import React, { useEffect, useMemo, useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
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
import PageAppBar from '../components/PageAppBar';
import SessionRecorder from '../components/SessionRecorder';
import AppointmentRecordingManager from '../components/AppointmentRecordingManager';
import { MeetingTypeToggle } from '../components/appointments/MeetingTypeToggle';
import { theme } from '../theme';
import * as RBC from 'react-big-calendar';
const Calendar = RBC.Calendar as React.ComponentType<any>;
const dateFnsLocalizer = RBC.dateFnsLocalizer;
const Views = RBC.Views;
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTranslation } from '../contexts/LanguageContext';
import {
  getAppointments,
  getAppointment,
  updateAppointment,
  createAppointment,
  Appointment,
} from '../api/appointments';
import enUS from 'date-fns/locale/en-US';

const locales = {
  en: enUS,
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
  onAppointmentUpdate?: (updatedAppointment: Appointment) => void;
}

const AppointmentDetail: React.FC<DetailProps> = ({ 
  appointment, 
  open, 
  onClose, 
  onAppointmentUpdate 
}) => {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);

  // Mock meeting configuration based on appointment data
  const getMeetingConfig = (apt: Appointment) => ({
    type: apt.meetingUrl ? 'online' as const : 'in-person' as const,
    location: apt.location || 'Office Room 1',
    meetingUrl: apt.meetingUrl,
    googleMeetEnabled: !!apt.meetingUrl,
    recordingSettings: {
      enabled: false, // Could derive from appointment data
      type: 'none' as const,
      quality: 'medium' as const,
      autoStart: false,
      includeTranscription: false,
      shareWithClient: false,
      retentionDays: 30
    },
    waitingRoomEnabled: true,
    allowClientToJoinEarly: false,
    meetingDuration: 60
  });

  const handleMeetingTypeChange = async (
    appointmentId: string,
    newType: 'in-person' | 'online' | 'hybrid',
    config: any
  ) => {
    setIsUpdating(true);
    try {
      // Mock API call to change meeting type
      console.log('Changing meeting type:', { appointmentId, newType, config });
      
      // Simulate API response
      const updatedAppointment = {
        ...appointment!,
        meetingUrl: newType === 'online' ? 'https://meet.google.com/abc-defg-hij' : undefined,
        location: newType === 'in-person' ? config.location : undefined,
        // Update other fields as needed
      };

      if (onAppointmentUpdate) {
        onAppointmentUpdate(updatedAppointment);
      }

      return {
        success: true,
        meetingUrl: updatedAppointment.meetingUrl,
        warnings: newType === 'online' ? ['Google Meet link generated automatically'] : []
      };
    } catch (error) {
      console.error('Failed to change meeting type:', error);
      return { success: false };
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRecordingSettingsChange = async (
    appointmentId: string,
    settings: any
  ) => {
    try {
      console.log('Updating recording settings:', { appointmentId, settings });
      return { success: true };
    } catch (error) {
      console.error('Failed to update recording settings:', error);
      return { success: false };
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} aria-label="appointment-detail">
      <Box sx={{ width: 500, p: 2, maxHeight: '100vh', overflow: 'auto' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h5" fontWeight={600}>
            {t.nav.appointments} Details
          </Typography>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
        
        {appointment ? (
          <Box display="flex" flexDirection="column" gap={3}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {new Date(appointment.startTime).toLocaleString()}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {appointment.type}
              </Typography>
            </Box>

            {/* Meeting Type Toggle */}
            <MeetingTypeToggle
              appointmentId={appointment.id.toString()}
              currentMeetingType={getMeetingConfig(appointment).type}
              currentConfig={getMeetingConfig(appointment)}
              canModify={true} // Could be based on user permissions
              isLoading={isUpdating}
              onMeetingTypeChange={handleMeetingTypeChange}
              onRecordingSettingsChange={handleRecordingSettingsChange}
            />
            
            {/* Comprehensive Recording Management */}
            <AppointmentRecordingManager
              appointmentId={appointment.id.toString()}
              sessionId={appointment.id.toString()}
              participantId={appointment.clientId?.toString() || 'unknown'}
              userId="current-user-id" // TODO: Get from auth context
              userRole="coach" // TODO: Get from auth context
              meetingUrl={appointment.meetingUrl}
              sessionType={appointment.meetingUrl ? 'online' : 'in-person'}
              existingRecordings={[]} // TODO: Load from API
              onRecordingAdded={(recording) => {
                console.log('Recording added:', recording);
                // TODO: Update appointment with new recording
              }}
              onSummaryGenerated={(summary) => {
                console.log('AI Summary generated:', summary);
                // TODO: Save summary to appointment
              }}
              canManageRecordings={true} // TODO: Check user permissions
              maxFileSize={500} // 500MB max file size
            />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <Skeleton variant="rectangular" width="100%" height={60} />
            <Skeleton variant="rectangular" width="100%" height={200} />
            <Skeleton variant="rectangular" width="100%" height={150} />
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

const AppointmentPage: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Appointment | null>(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleAppointmentUpdate = (updatedAppointment: Appointment) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === updatedAppointment.id ? updatedAppointment : apt
      )
    );
    setSelected(updatedAppointment);
  };

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
      <PageAppBar avatarUrls={[]} />
      <Box sx={{ p: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="appointment tabs">
          <Tab label={t.nav.calendar} />
          <Tab label="List View" />
        </Tabs>
        {loading ? (
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" height={200} data-testid="appointments-loading" />
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
                  onSelectEvent={(e: any) => setSelected(e as Appointment)}
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
        <AppointmentDetail 
          appointment={selected} 
          open={Boolean(selected)} 
          onClose={() => setSelected(null)}
          onAppointmentUpdate={handleAppointmentUpdate}
        />
        <Fab color="primary" sx={{ position: 'fixed', bottom: 16, right: 16 }} aria-label="new" onClick={() => createAppointment({})}>
          <AddIcon />
        </Fab>
      </Box>
    </ThemeProvider>
  );
};

export default AppointmentPage;
