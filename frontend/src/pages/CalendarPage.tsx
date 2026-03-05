import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Alert,
  Tooltip,
  Badge,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VideoCall as VideoCallIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Today as TodayIcon,
  Event as EventIcon,
  CalendarViewMonth as MonthViewIcon,
  CalendarViewWeek as WeekViewIcon,
  CalendarViewDay as DayViewIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { getDatePickerLocale } from '../locales/datePickerLocale';
import { useTranslation } from '../contexts/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { theme } from '../theme';
import WellnessLayout from '../layouts/WellnessLayout';
import { useAuth } from '../AuthContext';
import { getMyPatients, Patient as ApiPatient } from '../api/patients';
import { getAppointments, Appointment as ApiAppointment, createAppointment, updateAppointment } from '../api/appointments';

interface Appointment {
  id: string;
  title: string;
  patientName: string;
  patientId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  type: 'individual' | 'group' | 'family' | 'consultation';
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  meetingUrl?: string;
}

interface Patient {
  id: string;
  name: string;
  avatar?: string;
}

type MeetingType = 'in-person' | 'online';

const CalendarPage: React.FC = () => {
  const { translations: t, language } = useTranslation();
  const { adapterLocale, localeText } = getDatePickerLocale(language);
  const muiTheme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Compute coachId - use explicit coachId if available, otherwise use user.id for coach users
  const coachId = user?.coachId || (user?.role === 'coach' ? user.id : null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    type: 'individual' as Appointment['type'],
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    notes: '',
    meetingType: 'in-person' as MeetingType,
    googleMeetEnabled: true,
    location: '',
  });

  // Fetch patients and appointments from API
  useEffect(() => {
    console.log('[CalendarPage] useEffect triggered, coachId:', coachId, 'user:', user);
    const fetchData = async () => {
      if (!coachId) {
        console.log('[CalendarPage] No coachId, setting loading to false');
        setLoading(false);
        return;
      }

      console.log('[CalendarPage] Fetching data for coachId:', coachId);
      setLoading(true);

      try {
        // Fetch patients
        const patientsResponse = await getMyPatients(coachId, 0, 100);
        const transformedPatients: Patient[] = patientsResponse.items.map((p: ApiPatient) => ({
          id: p.id.toString(),
          name: `${p.firstName} ${p.lastName}`,
          avatar: p.avatarUrl,
        }));
        setPatients(transformedPatients);

        // Fetch appointments
        const appointmentsData = await getAppointments({ coachId });
        const transformedAppointments: Appointment[] = appointmentsData.map((apt: ApiAppointment) => {
          const patient = transformedPatients.find(p => p.id === apt.clientId.toString());
          const startTime = new Date(apt.startTime);
          const endTime = new Date(apt.endTime);
          return {
            id: apt.id.toString(),
            title: `${apt.type === 'virtual' ? 'Virtual' : 'In-Person'} Session`,
            patientName: patient?.name || 'Unknown Client',
            patientId: apt.clientId.toString(),
            date: startTime,
            startTime,
            endTime,
            type: 'individual' as const,
            status: apt.status === 'scheduled' ? 'confirmed' as const :
              apt.status === 'cancelled' ? 'cancelled' as const : 'pending' as const,
            notes: undefined,
            meetingUrl: apt.meetingUrl,
          };
        });
        setAppointments(transformedAppointments);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coachId]);

  // Auto-open scheduling dialog when navigated with ?patient= query param
  useEffect(() => {
    const patientParam = searchParams.get('patient');
    if (patientParam && patients.length > 0 && !openDialog) {
      setEditingAppointment(null);
      setFormData(prev => ({
        ...prev,
        patientId: patientParam,
      }));
      setOpenDialog(true);
      // Clear the query param so it doesn't re-trigger
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, patients, openDialog, setSearchParams]);

  // Filter appointments for selected date
  const selectedDateAppointments = appointments.filter(apt =>
    apt.date.toDateString() === selectedDate.toDateString()
  );

  // Get upcoming appointments (next 7 days)
  const upcomingAppointments = appointments.filter(apt => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return apt.startTime >= now && apt.startTime <= weekFromNow;
  }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  const handleAddAppointment = () => {
    setEditingAppointment(null);
    setFormData({
      patientId: '',
      type: 'individual',
      date: selectedDate,
      startTime: new Date(),
      endTime: new Date(),
      notes: '',
      meetingType: 'in-person',
      googleMeetEnabled: true,
      location: '',
    });
    setOpenDialog(true);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patientId: appointment.patientId,
      type: appointment.type,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      notes: appointment.notes || '',
      meetingType: appointment.meetingUrl ? 'online' : 'in-person',
      googleMeetEnabled: Boolean(appointment.meetingUrl),
      location: '',
    });
    setOpenDialog(true);
  };

  const handleSaveAppointment = async () => {
    const patient = patients.find(p => p.id === formData.patientId);
    if (!patient || !coachId) return;

    try {
      if (editingAppointment) {
        // Update existing appointment via API
        await updateAppointment(parseInt(editingAppointment.id), {
          clientId: parseInt(formData.patientId),
          startTime: formData.startTime.toISOString(),
          endTime: formData.endTime.toISOString(),
        });

        const appointmentData: Appointment = {
          id: editingAppointment.id,
          title: `${getTypeLabel(formData.type)} Session`,
          patientName: patient.name,
          patientId: formData.patientId,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          type: formData.type,
          status: 'confirmed',
          notes: formData.notes,
        };

        setAppointments(prev => prev.map(apt =>
          apt.id === editingAppointment.id ? appointmentData : apt
        ));
      } else {
        // Create new appointment via API
        const isOnline = formData.meetingType === 'online';
        // Ensure endTime is after startTime (default 1 hour if same)
        let endTime = formData.endTime;
        if (endTime.getTime() <= formData.startTime.getTime()) {
          endTime = new Date(formData.startTime.getTime() + 60 * 60 * 1000);
        }
        const newApt = await createAppointment({
          therapistId: coachId, // UUID from coach record
          clientId: String(formData.patientId),
          startTime: formData.startTime.toISOString(),
          endTime: endTime.toISOString(),
          type: isOnline ? 'virtual' : 'in-person',
          status: 'scheduled',
          googleMeetEnabled: isOnline ? formData.googleMeetEnabled : false,
          location: isOnline ? undefined : formData.location,
        });

        const appointmentData: Appointment = {
          id: newApt.id.toString(),
          title: `${getTypeLabel(formData.type)} Session`,
          patientName: patient.name,
          patientId: formData.patientId,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          type: formData.type,
          status: 'confirmed',
          notes: formData.notes,
        };

        setAppointments(prev => [...prev, appointmentData]);
      }

      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'individual': return t.calendarPage.individualTherapy;
      case 'group': return t.calendarPage.groupTherapy;
      case 'family': return t.calendarPage.familyTherapy;
      case 'consultation': return t.calendarPage.consultation;
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return <PersonIcon />;
      case 'group': return <PersonIcon />;
      case 'family': return <PersonIcon />;
      case 'consultation': return <EventIcon />;
      default: return <EventIcon />;
    }
  };

  return (
    <WellnessLayout
      title={t.nav.calendar}
      showFab={true}
      fabIcon={<AddIcon />}
      fabAction={handleAddAppointment}
      fabAriaLabel={t.calendarPage.scheduleNewAppointment}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            📅 {t.calendarPage.yourSchedule}
          </Typography>

          {/* View Controls */}
          <Stack direction="row" spacing={1}>
            <Tooltip title={t.calendarPage.monthView}>
              <IconButton
                onClick={() => setView('month')}
                color={view === 'month' ? 'primary' : 'default'}
              >
                <MonthViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t.calendarPage.weekView}>
              <IconButton
                onClick={() => setView('week')}
                color={view === 'week' ? 'primary' : 'default'}
              >
                <WeekViewIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t.calendarPage.dayView}>
              <IconButton
                onClick={() => setView('day')}
                color={view === 'day' ? 'primary' : 'default'}
              >
                <DayViewIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t.calendarPage.subtitle}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Calendar Section */}
          <Grid item xs={12} md={6} lg={5}>
            <Card sx={{ height: 'fit-content', position: 'sticky', top: 100 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TodayIcon color="primary" />
                  {t.calendarPage.calendar}
                </Typography>

                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={adapterLocale}
                  localeText={localeText}
                >
                  <DateCalendar
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date || new Date())}
                    sx={{ width: '100%' }}
                  />
                </LocalizationProvider>

                {/* Quick Stats */}
                <Box sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 2,
                  background: 'rgba(46, 125, 107, 0.08)',
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    {t.calendarPage.selectedDate} {selectedDate.toLocaleDateString()}
                  </Typography>
                  <Stack direction="row" spacing={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        {selectedDateAppointments.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.calendarPage.appointments}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="secondary.main" fontWeight={700}>
                        {upcomingAppointments.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.calendarPage.upcoming}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Appointments Section */}
          <Grid item xs={12} md={6} lg={7}>
            <Stack spacing={3}>
              {/* Today's Appointments */}
              <Card>
                <CardContent>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon color="primary" />
                      {t.calendarPage.appointmentsFor} {selectedDate.toLocaleDateString()}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddAppointment}
                    >
                      {t.calendarPage.add}
                    </Button>
                  </Box>

                  {selectedDateAppointments.length === 0 ? (
                    <Box sx={{
                      textAlign: 'center',
                      py: 4,
                      background: 'rgba(46, 125, 107, 0.04)',
                      borderRadius: 2,
                    }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        {t.calendarPage.noAppointments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t.calendarPage.clickAddToSchedule}
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {selectedDateAppointments.map((appointment) => (
                        <Box
                          key={appointment.id}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            background: 'rgba(46, 125, 107, 0.06)',
                            border: '1px solid rgba(46, 125, 107, 0.12)',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {appointment.patientName.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {appointment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {appointment.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.patientName}
                                </Typography>
                              </Box>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Chip
                                label={getStatusColor(appointment.status)}
                                color={getStatusColor(appointment.status) as any}
                                size="small"
                              />
                            </Stack>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            {getTypeIcon(appointment.type)}
                            <Typography variant="body2">
                              {getTypeLabel(appointment.type)}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {appointment.meetingUrl && (
                                <Button
                                  size="small"
                                  startIcon={<VideoCallIcon />}
                                  variant="contained"
                                  onClick={() => window.open(appointment.meetingUrl, '_blank')}
                                >
                                  {t.calendarPage.join}
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(`/patients/${appointment.patientId}`)}
                              >
                                {t.calendarPage.viewClient}
                              </Button>
                            </Box>
                            <Box>
                              <IconButton
                                size="small"
                                onClick={() => handleEditAppointment(appointment)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteAppointment(appointment.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon color="secondary" />
                    {t.calendarPage.upcomingThisWeek}
                  </Typography>

                  {upcomingAppointments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
                      {t.calendarPage.noUpcomingAppointments}
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {upcomingAppointments.slice(0, 3).map((appointment) => (
                        <Box
                          key={appointment.id}
                          sx={{
                            p: 2,
                            borderLeft: '4px solid',
                            borderColor: 'secondary.main',
                            background: 'rgba(139, 90, 135, 0.04)',
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            {appointment.startTime.toLocaleDateString()} at {appointment.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.patientName} • {getTypeLabel(appointment.type)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      )}

      {/* Add/Edit Appointment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAppointment ? t.calendarPage.editAppointment : t.calendarPage.scheduleNewAppointment}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t.calendarPage.client}</InputLabel>
              <Select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                label={t.calendarPage.client}
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t.calendarPage.sessionType}</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Appointment['type'] })}
                label={t.calendarPage.sessionType}
              >
                <MenuItem value="individual">{t.calendarPage.individualTherapy}</MenuItem>
                <MenuItem value="group">{t.calendarPage.groupTherapy}</MenuItem>
                <MenuItem value="family">{t.calendarPage.familyTherapy}</MenuItem>
                <MenuItem value="consultation">{t.calendarPage.consultation}</MenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={adapterLocale}
              localeText={localeText}
            >
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TimePicker
                  label={t.calendarPage.startTime}
                  value={formData.startTime}
                  onChange={(time) => setFormData({ ...formData, startTime: time || new Date() })}
                  sx={{ flex: 1 }}
                />
                <TimePicker
                  label={t.calendarPage.endTime}
                  value={formData.endTime}
                  onChange={(time) => setFormData({ ...formData, endTime: time || new Date() })}
                  sx={{ flex: 1 }}
                />
              </Stack>
            </LocalizationProvider>

            {/* Meeting Configuration Section */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              {formData.meetingType === 'online' ? <VideoCallIcon color="primary" /> : <LocationIcon color="secondary" />}
              {t.calendarPage.meetingConfiguration}
            </Typography>

            {/* Meeting Type Toggle */}
            <Box
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                backgroundColor: alpha(muiTheme.palette.primary.main, 0.04),
                border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.1)}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: formData.meetingType === 'online'
                        ? alpha(muiTheme.palette.primary.main, 0.15)
                        : alpha(muiTheme.palette.secondary.main, 0.15),
                      color: formData.meetingType === 'online' ? muiTheme.palette.primary.main : muiTheme.palette.secondary.main,
                    }}
                  >
                    {formData.meetingType === 'online' ? <VideoCallIcon /> : <LocationIcon />}
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {formData.meetingType === 'online' ? t.calendarPage.onlineMeeting : t.calendarPage.inPersonMeeting}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formData.meetingType === 'online'
                        ? t.calendarPage.meetingTypes.online
                        : t.calendarPage.meetingTypes.inPerson}
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.meetingType === 'online'}
                      onChange={(e) => setFormData({ ...formData, meetingType: e.target.checked ? 'online' : 'in-person' })}
                      color="primary"
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
              </Box>
            </Box>

            {/* Google Meet Toggle (for online meetings) */}
            {formData.meetingType === 'online' && (
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  backgroundColor: alpha(muiTheme.palette.info.main, 0.04),
                  border: `1px solid ${alpha(muiTheme.palette.info.main, 0.1)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: formData.googleMeetEnabled ? 2 : 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: formData.googleMeetEnabled
                          ? alpha('#4285F4', 0.15)
                          : alpha(muiTheme.palette.grey[500], 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src="https://www.gstatic.com/meet/google_meet_horizontal_wordmark_2020q4_1x_icon_124_40_2373e79660dabbf194273d27aa7ee1f5.png"
                        alt="Google Meet"
                        style={{ height: 20, opacity: formData.googleMeetEnabled ? 1 : 0.5 }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {t.calendarPage.googleMeet.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t.calendarPage.googleMeet.enabled}
                      </Typography>
                    </Box>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.googleMeetEnabled}
                        onChange={(e) => setFormData({ ...formData, googleMeetEnabled: e.target.checked })}
                        color="primary"
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Box>
                {formData.googleMeetEnabled && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      {t.calendarPage.googleMeet.willGenerate}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}

            {/* Location Field (for in-person meetings) */}
            {formData.meetingType !== 'online' && (
              <TextField
                fullWidth
                required
                label={t.calendarPage.location}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t.calendarPage.locationPlaceholder}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            )}

            <TextField
              fullWidth
              label={t.calendarPage.sessionNotes}
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t.calendarPage.sessionNotesPlaceholder}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t.calendarPage.cancel}</Button>
          <Button
            onClick={handleSaveAppointment}
            variant="contained"
            disabled={!formData.patientId || (formData.meetingType !== 'online' && !formData.location.trim())}
          >
            {editingAppointment ? t.calendarPage.update : t.calendarPage.schedule}
          </Button>
        </DialogActions>
      </Dialog>
    </WellnessLayout>
  );
};

export default CalendarPage;
