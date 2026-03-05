/**
 * ClientAppointments - Multi-coach appointment management for clients
 * Filter by coach, date, location (online/in-person) and book new sessions
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
  Badge,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  AvatarGroup,
  Fab,
  CircularProgress
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  VideoCall as OnlineIcon,
  LocationOn as InPersonIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  History as HistoryIcon,
  Upcoming as UpcomingIcon
} from '@mui/icons-material';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientAppointments } from '../../api/patientAppointments';

interface Coach {
  id: string;
  name: string;
  specialization: string;
  profileImage?: string;
  isActive: boolean;
  relationshipSince: string;
  nextAvailable?: Date;
}

interface Appointment {
  id: string;
  title: string;
  date: Date;
  type: 'online' | 'in-person';
  coach: Coach;
  meetingUrl?: string;
  location?: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  sessionSummary?: string;
}

const ClientAppointments: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

  // Filtering state
  const [selectedCoach, setSelectedCoach] = useState<string>('all');
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<string>('all');

  const tabLabels = ['All Sessions', 'Upcoming', 'Completed', 'By Coach'];

  useEffect(() => {
    loadAppointments();
  }, [user?.id]);

  const loadAppointments = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const clientId = parseInt(user.id);

      // Fetch real appointments from API
      let realAppointments: Appointment[] = [];
      try {
        const appointmentsData = await getPatientAppointments({ patientId: clientId });
        realAppointments = (appointmentsData || []).map((apt: any) => ({
          id: apt.id?.toString() || '',
          title: apt.title || 'Coaching Session',
          date: new Date(apt.startTime),
          type: apt.type === 'virtual' ? 'online' as const : 'in-person' as const,
          coach: {
            id: apt.therapistId?.toString() || '1',
            name: apt.coachName || 'Your Coach',
            specialization: 'Life Coaching',
            isActive: true,
            relationshipSince: ''
          },
          meetingUrl: apt.meetingUrl,
          location: apt.location,
          duration: 60,
          status: apt.status === 'scheduled' ? 'scheduled' as const :
                 apt.status === 'completed' ? 'completed' as const :
                 apt.status === 'cancelled' ? 'cancelled' as const : 'scheduled' as const,
          sessionSummary: apt.notes
        }));
      } catch (aptError) {
        console.warn('Could not fetch appointments:', aptError);
      }

      // Extract unique coaches from appointments
      const coachesMap = new Map<string, Coach>();
      realAppointments.forEach(apt => {
        if (!coachesMap.has(apt.coach.id)) {
          coachesMap.set(apt.coach.id, apt.coach);
        }
      });
      const uniqueCoaches = Array.from(coachesMap.values());

      setCoaches(uniqueCoaches);
      setAppointments(realAppointments);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      setIsLoading(false);
    }
  };

  // Filtering logic
  const filteredAppointments = appointments.filter(appointment => {
    const coachMatch = selectedCoach === 'all' || appointment.coach.id === selectedCoach;
    const typeMatch = sessionTypeFilter === 'all' || appointment.type === sessionTypeFilter;
    const statusMatch = statusFilter === 'all' || appointment.status === statusFilter;
    const searchMatch = searchQuery === '' || 
      appointment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.coach.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const now = new Date();
    let dateMatch = true;
    
    if (dateRange === 'upcoming') {
      dateMatch = appointment.date >= now;
    } else if (dateRange === 'past') {
      dateMatch = appointment.date < now;
    } else if (dateRange === 'this-week') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      dateMatch = appointment.date >= now && appointment.date <= weekFromNow;
    } else if (dateRange === 'this-month') {
      const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      dateMatch = appointment.date >= now && appointment.date <= monthFromNow;
    }

    // Tab-specific filtering
    if (currentTab === 1) { // Upcoming
      dateMatch = appointment.date >= now;
    } else if (currentTab === 2) { // Completed
      dateMatch = appointment.date < now && appointment.status === 'completed';
    }
    
    return coachMatch && typeMatch && statusMatch && searchMatch && dateMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'rescheduled': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (appointment: Appointment) => {
    if (appointment.date > new Date()) {
      return <UpcomingIcon sx={{ fontSize: 16 }} />;
    } else {
      return <HistoryIcon sx={{ fontSize: 16 }} />;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
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
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Page Header */}
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
            My Coaching Sessions 📅
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Manage appointments with all your coaches in one place
          </Typography>
          
          {/* Coach Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Working with {coaches.length} coaches:
            </Typography>
            <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.8rem' } }}>
              {coaches.map((coach) => (
                <Tooltip key={coach.id} title={`${coach.name} - ${coach.specialization}`}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {coach.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </Box>
        </Box>

        {/* Tabs */}
        <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              '& .MuiTab-root': {
                minWidth: 120,
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            {tabLabels.map((label, index) => (
              <Tab
                key={index}
                label={label}
                icon={
                  index === 0 ? <EventIcon /> :
                  index === 1 ? <UpcomingIcon /> :
                  index === 2 ? <HistoryIcon /> :
                  <PersonIcon />
                }
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Card>

        {/* Filters */}
        <Card sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.85), borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FilterIcon sx={{ mr: 2, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Filter & Search
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search sessions or coaches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Coach</InputLabel>
                  <Select
                    value={selectedCoach}
                    label="Coach"
                    onChange={(e) => setSelectedCoach(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Coaches</MenuItem>
                    {coaches.map((coach) => (
                      <MenuItem key={coach.id} value={coach.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: 'primary.main' }}>
                            {coach.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          {coach.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={sessionTypeFilter}
                    label="Type"
                    onChange={(e) => setSessionTypeFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="online">🌐 Online</MenuItem>
                    <MenuItem value="in-person">🏢 In-Person</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={dateRange}
                    label="Period"
                    onChange={(e) => setDateRange(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="upcoming">Upcoming</MenuItem>
                    <MenuItem value="this-week">This Week</MenuItem>
                    <MenuItem value="this-month">This Month</MenuItem>
                    <MenuItem value="past">Past Sessions</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
                  <Chip
                    label={`${filteredAppointments.length} found`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.85rem' }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Appointments Grid */}
        <Grid container spacing={3}>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <Grid item xs={12} md={6} lg={4} key={appointment.id}>
                <Card
                  sx={{
                    background: alpha(theme.palette.background.paper, 0.85),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'secondary.main' }}>
                        {appointment.coach.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                          {appointment.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          with {appointment.coach.name}
                        </Typography>
                      </Box>
                      <Chip
                        icon={getStatusIcon(appointment)}
                        label={appointment.status}
                        size="small"
                        color={getStatusColor(appointment.status) as any}
                        variant="outlined"
                      />
                    </Box>

                    {/* Date & Duration */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {appointment.date.toLocaleDateString()} • {appointment.duration} min
                      </Typography>
                    </Box>

                    {/* Type & Location */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {appointment.type === 'online' ? (
                        <OnlineIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                      ) : (
                        <InPersonIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
                      )}
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {appointment.type === 'online' ? 'Online Session' : 'In-Person Meeting'}
                      </Typography>
                    </Box>

                    {/* Location/URL */}
                    {appointment.location && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        📍 {appointment.location}
                      </Typography>
                    )}

                    {/* Session Summary */}
                    {appointment.sessionSummary && (
                      <Box
                        sx={{
                          p: 2,
                          background: alpha(theme.palette.success.light, 0.1),
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                        }}
                      >
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          "{appointment.sessionSummary}"
                        </Typography>
                      </Box>
                    )}

                    {/* Coach Specialization */}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                      {appointment.coach.specialization}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                <EventIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  No sessions found
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Try adjusting your filters or book a new session with one of your coaches
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
                  }}
                >
                  Book New Session
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
              transform: 'scale(1.1)'
            }
          }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Box>
  );
};

export default ClientAppointments;