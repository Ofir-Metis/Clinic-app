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
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { he } from 'date-fns/locale';
import { useTranslation } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';
import WellnessLayout from '../layouts/WellnessLayout';

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

const mockPatients: Patient[] = [
  { id: '1', name: 'Sarah Johnson' },
  { id: '2', name: 'Michael Chen' },
  { id: '3', name: 'Emma Davis' },
  { id: '4', name: 'James Wilson' },
];

const mockAppointments: Appointment[] = [
  {
    id: '1',
    title: 'Individual Therapy Session',
    patientName: 'Sarah Johnson',
    patientId: '1',
    date: new Date(),
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    type: 'individual',
    status: 'confirmed',
    meetingUrl: 'https://meet.example.com/session1',
  },
  {
    id: '2',
    title: 'Family Therapy Session',
    patientName: 'Michael Chen',
    patientId: '2',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // Tomorrow 10 AM
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // Tomorrow 11 AM
    type: 'family',
    status: 'pending',
  },
];

const CalendarPage: React.FC = () => {
  const { translations: t } = useTranslation();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
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
  });

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
    });
    setOpenDialog(true);
  };

  const handleSaveAppointment = () => {
    const patient = mockPatients.find(p => p.id === formData.patientId);
    if (!patient) return;

    const appointmentData: Appointment = {
      id: editingAppointment?.id || Date.now().toString(),
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

    if (editingAppointment) {
      setAppointments(prev => prev.map(apt => 
        apt.id === editingAppointment.id ? appointmentData : apt
      ));
    } else {
      setAppointments(prev => [...prev, appointmentData]);
    }

    setOpenDialog(false);
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

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Calendar Section */}
          <Grid item xs={12} md={6} lg={5}>
            <Card sx={{ height: 'fit-content', position: 'sticky', top: 100 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TodayIcon color="primary" />
                  {t.calendarPage.calendar}
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
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
                  {mockPatients.map((patient) => (
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

              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
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
              disabled={!formData.patientId}
            >
              {editingAppointment ? t.calendarPage.update : t.calendarPage.schedule}
            </Button>
          </DialogActions>
        </Dialog>
      </WellnessLayout>
  );
};

export default CalendarPage;
