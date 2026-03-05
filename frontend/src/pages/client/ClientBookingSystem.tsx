/**
 * ClientBookingSystem - Comprehensive multi-coach appointment booking system
 * Supports online/in-person sessions, coach availability, and appointment management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Stack,
  Chip,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  Badge,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Schedule as TimeIcon,
  VideoCall as OnlineIcon,
  LocationOn as InPersonIcon,
  Phone as PhoneIcon,
  Psychology as CoachIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  CheckCircle as ConfirmIcon,
  Event as SessionIcon,
  Star as RatingIcon,
  AccessTime as DurationIcon,
  Notes as NotesIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Launch as JoinIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getDatePickerLocale } from '../../locales/datePickerLocale';
import { useTranslation } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientAppointments } from '../../api/patientAppointments';
import { createAppointment } from '../../api/appointments';
import apiClient from '../../api/client';
import { logger } from '../../logger';

interface Coach {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  profileImage?: string;
  hourlyRate: number;
  availability: {
    [date: string]: string[]; // Available time slots
  };
  sessionTypes: SessionType[];
  locationPreferences: LocationType[];
}

interface SessionType {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description: string;
}

interface LocationType {
  id: string;
  type: 'online' | 'inperson' | 'phone';
  label: string;
  address?: string;
}

interface BookingData {
  coachId: string;
  date: Date;
  timeSlot: string;
  sessionType: SessionType;
  duration: number;
  location: LocationType;
  specialRequests: string;
}

interface Appointment {
  id: string;
  coachId: string;
  coachName: string;
  coachImage?: string;
  date: Date;
  timeSlot: string;
  sessionType: string;
  duration: number;
  location: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'noshow';
  notes?: string;
  meetingLink?: string;
  price: number;
}

const ClientBookingSystem: React.FC = () => {
  const theme = useTheme();
  const { t, language } = useTranslation();
  const { adapterLocale, localeText } = getDatePickerLocale(language);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [bookingData, setBookingData] = useState<Partial<BookingData>>({
    date: new Date(),
    specialRequests: ''
  });

  const bookingSteps = [
    t.booking.selectCoach,
    t.booking.selectDate,
    t.booking.selectTime,
    t.booking.sessionType
  ];

  useEffect(() => {
    loadCoachesAndAppointments();
  }, [user?.id]);

  const loadCoachesAndAppointments = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      // Fetch coaches from API
      let fetchedCoaches: Coach[] = [];
      try {
        const { data } = await apiClient.get('/coaches');
        if (Array.isArray(data)) {
          fetchedCoaches = data.map((c: any) => ({
            id: String(c.id),
            name: c.name || c.fullName || 'Coach',
            specialization: c.specialization || c.title || '',
            rating: c.rating || 0,
            hourlyRate: c.hourlyRate || 0,
            profileImage: c.profileImage,
            availability: c.availability || {},
            sessionTypes: c.sessionTypes || [
              { id: 'standard', name: t.booking?.sessionTypes?.followup || 'Standard Session', duration: 60, price: c.hourlyRate || 0, description: '' },
            ],
            locationPreferences: c.locationPreferences || [
              { id: 'online', type: 'online' as const, label: t.booking?.locationTypes?.online || 'Online' },
            ],
          }));
        }
      } catch (err) {
        logger.debug('Failed to fetch coaches list, using empty state', err);
      }
      setCoaches(fetchedCoaches);

      // Fetch client's appointments from API
      let fetchedAppointments: Appointment[] = [];
      if (user?.id) {
        try {
          const aptData = await getPatientAppointments({ patientId: user.id });
          const items = Array.isArray(aptData) ? aptData : aptData?.items || [];
          fetchedAppointments = items.map((apt: any) => ({
            id: String(apt.id),
            coachId: String(apt.therapistId || apt.coachId || ''),
            coachName: apt.therapistName || apt.coachName || 'Coach',
            coachImage: apt.coachImage,
            date: new Date(apt.startTime || apt.date),
            timeSlot: new Date(apt.startTime || apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sessionType: apt.type || apt.sessionType || 'Session',
            duration: apt.duration || 60,
            location: apt.location || (apt.type === 'virtual' ? 'Online' : 'In-person'),
            status: apt.status || 'pending',
            notes: apt.notes,
            meetingLink: apt.meetingUrl || apt.meetingLink,
            price: apt.price || 0,
          }));
        } catch (err) {
          logger.debug('Failed to fetch client appointments', err);
        }
      }
      setAppointments(fetchedAppointments);
    } catch (error) {
      logger.error('Failed to load booking data', error);
      setLoadError(t.errors?.general || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingStepNext = () => {
    if (currentStep < bookingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowConfirmDialog(true);
    }
  };

  const handleBookingStepBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const confirmBooking = async () => {
    try {
      if (!bookingData.coachId || !bookingData.date || !bookingData.timeSlot) return;

      const [hours, minutes] = bookingData.timeSlot.split(':').map(Number);
      const startTime = new Date(bookingData.date);
      startTime.setHours(hours, minutes, 0, 0);

      const duration = bookingData.sessionType?.duration || 60;
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      await createAppointment({
        therapistId: bookingData.coachId,
        clientId: String(user?.id || ''),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        type: bookingData.location?.type === 'inperson' ? 'in-person' : 'virtual',
        status: 'scheduled',
        location: bookingData.location?.address,
      });

      setShowConfirmDialog(false);
      setShowBookingDialog(false);
      setCurrentStep(0);
      setBookingData({ date: new Date(), specialRequests: '' });

      // Refresh appointments
      await loadCoachesAndAppointments();
    } catch (error) {
      logger.error('Booking failed', error);
    }
  };

  const getAvailableSlots = (coachId: string, date: Date): string[] => {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    return coach.availability[dateStr] || [];
  };

  const renderCoachSelection = () => (
    <Stack spacing={3}>
      <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
        {t.booking.selectCoach}
      </Typography>
      
      <Grid container spacing={3}>
        {coaches.map((coach) => (
          <Grid item xs={12} sm={6} key={coach.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: bookingData.coachId === coach.id 
                  ? `2px solid ${theme.palette.primary.main}` 
                  : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                background: bookingData.coachId === coach.id
                  ? alpha(theme.palette.primary.light, 0.1)
                  : alpha(theme.palette.background.paper, 0.8),
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                }
              }}
              onClick={() => setBookingData(prev => ({ ...prev, coachId: coach.id }))}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{ width: 60, height: 60, mr: 2 }}
                    src={coach.profileImage}
                  >
                    {coach.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {coach.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {coach.specialization}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <RatingIcon sx={{ fontSize: 18, color: 'warning.main', mr: 0.5 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {coach.rating}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        ${coach.hourlyRate}/hr
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );

  const renderDateSelection = () => (
    <Stack spacing={3} alignItems="center">
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {t.booking.selectDate}
      </Typography>
      
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={adapterLocale}
        localeText={localeText}
      >
        <DateCalendar
          value={bookingData.date}
          onChange={(newDate) => setBookingData(prev => ({ ...prev, date: newDate || new Date() }))}
          minDate={new Date()}
          sx={{
            '& .MuiPickersDay-root': {
              fontSize: '1rem'
            }
          }}
        />
      </LocalizationProvider>
    </Stack>
  );

  const renderTimeSelection = () => {
    const availableSlots = bookingData.coachId && bookingData.date 
      ? getAvailableSlots(bookingData.coachId, bookingData.date)
      : [];

    return (
      <Stack spacing={3}>
        <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
          {t.booking.selectTime}
        </Typography>
        
        {availableSlots.length === 0 ? (
          <Alert severity="info">
            {t.booking.noSlotsAvailable}
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {availableSlots.map((slot) => (
              <Grid item xs={6} sm={4} key={slot}>
                <Button
                  fullWidth
                  variant={bookingData.timeSlot === slot ? 'contained' : 'outlined'}
                  onClick={() => setBookingData(prev => ({ ...prev, timeSlot: slot }))}
                  sx={{ py: 1.5 }}
                >
                  {slot}
                </Button>
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    );
  };

  const renderSessionTypeSelection = () => {
    const selectedCoach = coaches.find(c => c.id === bookingData.coachId);
    if (!selectedCoach) return null;

    return (
      <Stack spacing={3}>
        <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
          {t.booking.sessionType}
        </Typography>
        
        <Grid container spacing={3}>
          {selectedCoach.sessionTypes.map((sessionType) => (
            <Grid item xs={12} sm={6} key={sessionType.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: bookingData.sessionType?.id === sessionType.id 
                    ? `2px solid ${theme.palette.primary.main}` 
                    : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  background: bookingData.sessionType?.id === sessionType.id
                    ? alpha(theme.palette.primary.light, 0.1)
                    : alpha(theme.palette.background.paper, 0.8),
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`
                  }
                }}
                onClick={() => setBookingData(prev => ({ ...prev, sessionType }))}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {sessionType.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {sessionType.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ${sessionType.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {sessionType.duration} min
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <TextField
          fullWidth
          multiline
          rows={3}
          label={t.booking.specialRequests}
          placeholder={t.booking.specialRequestsPlaceholder}
          value={bookingData.specialRequests}
          onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Stack>
    );
  };

  const renderBookingDialog = () => (
    <Dialog
      open={showBookingDialog}
      onClose={() => setShowBookingDialog(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <CalendarIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {t.booking.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t.booking.subtitle}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {bookingSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {currentStep === 0 && renderCoachSelection()}
        {currentStep === 1 && renderDateSelection()}
        {currentStep === 2 && renderTimeSelection()}
        {currentStep === 3 && renderSessionTypeSelection()}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={() => setShowBookingDialog(false)}>
          {t.booking.cancelBooking}
        </Button>
        
        {currentStep > 0 && (
          <Button onClick={handleBookingStepBack} startIcon={<BackIcon />}>
            {t.actions.back}
          </Button>
        )}
        
        <Button
          variant="contained"
          onClick={handleBookingStepNext}
          endIcon={currentStep < bookingSteps.length - 1 ? <NextIcon /> : <ConfirmIcon />}
          disabled={
            (currentStep === 0 && !bookingData.coachId) ||
            (currentStep === 1 && !bookingData.date) ||
            (currentStep === 2 && !bookingData.timeSlot) ||
            (currentStep === 3 && !bookingData.sessionType)
          }
        >
          {currentStep < bookingSteps.length - 1 ? t.actions.next : t.booking.confirmBooking}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderUpcomingSessions = () => {
    const upcomingAppointments = appointments.filter(apt => 
      apt.date > new Date() && apt.status !== 'cancelled'
    );

    if (upcomingAppointments.length === 0) {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <SessionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              {t.booking.upcomingEmpty}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowBookingDialog(true)}
              sx={{ mt: 2 }}
            >
              {t.booking.title}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Stack spacing={3}>
        {upcomingAppointments.map((appointment) => (
          <Card key={appointment.id}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{ mr: 2 }}
                    src={appointment.coachImage}
                    alt={`${appointment.coachName} profile picture`}
                  >
                    {appointment.coachName.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {appointment.coachName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {appointment.sessionType} • {appointment.duration} min
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {appointment.date.toLocaleDateString()} at {appointment.timeSlot}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={t.booking.status[appointment.status as keyof typeof t.booking.status]}
                    color={appointment.status === 'confirmed' ? 'success' : 'warning'}
                    size="small"
                  />
                  {appointment.meetingLink && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<JoinIcon />}
                      onClick={() => window.open(appointment.meetingLink, '_blank')}
                    >
                      {t.booking.joinSession}
                    </Button>
                  )}
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>
        <Button variant="contained" onClick={loadCoachesAndAppointments}>
          {t.actions?.retry || 'Retry'}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
        p: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {t.booking.title}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            {t.booking.subtitle}
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setShowBookingDialog(true)}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
            }}
          >
            {t.booking.title}
          </Button>
        </Box>

        {/* Tabs */}
        <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            variant="fullWidth"
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            <Tab label={t.booking.myBookings} icon={<SessionIcon />} iconPosition="start" />
            <Tab label={t.booking.pastSessions} icon={<CalendarIcon />} iconPosition="start" />
          </Tabs>
        </Card>

        {/* Tab Content */}
        {selectedTab === 0 && renderUpcomingSessions()}
        {selectedTab === 1 && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                {t.booking.pastEmpty}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Booking Dialog */}
        {renderBookingDialog()}
      </Box>
    </Box>
  );
};

export default ClientBookingSystem;