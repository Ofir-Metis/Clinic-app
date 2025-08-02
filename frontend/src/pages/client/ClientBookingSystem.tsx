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
import { useTranslation } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
  }, []);

  const loadCoachesAndAppointments = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API calls
      const mockCoaches: Coach[] = [
        {
          id: 'coach1',
          name: 'Dr. Sarah Johnson',
          specialization: 'Life & Career Coaching',
          rating: 4.9,
          hourlyRate: 120,
          availability: {
            '2024-01-15': ['09:00', '10:30', '14:00', '16:00'],
            '2024-01-16': ['10:00', '11:30', '15:00'],
            '2024-01-17': ['09:00', '13:00', '14:30', '16:30']
          },
          sessionTypes: [
            { id: 'initial', name: t.booking.sessionTypes.initial, duration: 60, price: 120, description: 'First session assessment' },
            { id: 'followup', name: t.booking.sessionTypes.followup, duration: 45, price: 100, description: 'Regular coaching session' }
          ],
          locationPreferences: [
            { id: 'online', type: 'online', label: t.booking.locationTypes.online },
            { id: 'inperson', type: 'inperson', label: t.booking.locationTypes.inperson, address: '123 Wellness Center' }
          ]
        },
        {
          id: 'coach2', 
          name: 'Marcus Rodriguez',
          specialization: 'Mindfulness & Stress Management',
          rating: 4.8,
          hourlyRate: 100,
          availability: {
            '2024-01-15': ['11:00', '13:00', '17:00'],
            '2024-01-16': ['09:30', '14:00', '15:30', '17:00'],
            '2024-01-17': ['10:00', '12:00', '16:00']
          },
          sessionTypes: [
            { id: 'breakthrough', name: t.booking.sessionTypes.breakthrough, duration: 90, price: 150, description: 'Intensive breakthrough session' },
            { id: 'progress', name: t.booking.sessionTypes.progress, duration: 30, price: 75, description: 'Progress check-in' }
          ],
          locationPreferences: [
            { id: 'online', type: 'online', label: t.booking.locationTypes.online },
            { id: 'phone', type: 'phone', label: t.booking.locationTypes.phone }
          ]
        }
      ];

      const mockAppointments: Appointment[] = [
        {
          id: 'apt1',
          coachId: 'coach1',
          coachName: 'Dr. Sarah Johnson',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          timeSlot: '14:00',
          sessionType: 'Follow-up Session',
          duration: 45,
          location: 'Online',
          status: 'confirmed',
          price: 100,
          meetingLink: 'https://meet.google.com/abc-def-ghi'
        }
      ];

      setCoaches(mockCoaches);
      setAppointments(mockAppointments);
    } catch (error) {
      console.error('Failed to load data:', error);
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
      // TODO: API call to book appointment
      console.log('Booking confirmed:', bookingData);
      
      // Show success message and close dialogs
      setShowConfirmDialog(false);
      setShowBookingDialog(false);
      setCurrentStep(0);
      setBookingData({ date: new Date(), specialRequests: '' });
      
      // Refresh appointments
      await loadCoachesAndAppointments();
      
    } catch (error) {
      console.error('Booking failed:', error);
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
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                  <Avatar sx={{ mr: 2 }} src={appointment.coachImage}>
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