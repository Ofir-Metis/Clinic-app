import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Fab,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  Theme,
  Avatar,
  Chip,
  Badge,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  EventNote as EventNoteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  NotificationImportant as NotificationImportantIcon,
  AccessTime as AccessTimeIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { theme } from '../theme';

// RTL Theme configuration for Hebrew
const rtlTheme = createTheme({
  ...theme,
  direction: 'rtl',
  typography: {
    ...theme.typography,
    fontFamily: '"Rubik", "Heebo", "Arial", sans-serif',
  },
});

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  duration: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientName: 'רחל כהן',
    time: '09:00',
    type: 'טיפול פסיכולוגי',
    status: 'confirmed',
    duration: 50,
  },
  {
    id: '2',
    patientName: 'דוד לוי',
    time: '10:30',
    type: 'ייעוץ זוגי',
    status: 'confirmed',
    duration: 60,
  },
  {
    id: '3',
    patientName: 'מירה אברהם',
    time: '14:00',
    type: 'טיפול קוגניטיבי',
    status: 'pending',
    duration: 50,
  },
];

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'תזכורת חשובה',
    message: 'לרחל כהן יש פגישה בעוד 30 דקות',
    type: 'info',
    timestamp: new Date(),
    read: false,
  },
  {
    id: '2',
    title: 'בקשה לשינוי מועד',
    message: 'דוד לוי ביקש לשנות את מועד הפגישה למחר',
    type: 'warning',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
];

const navItems = [
  { label: 'בית', icon: <HomeIcon />, to: '/therapist/home', value: 'home' },
  { label: 'רשימת מטופלים', icon: <PeopleIcon />, to: '/therapist/patients', value: 'patients' },
  { label: 'התראות', icon: <NotificationsIcon />, to: '/therapist/notifications', value: 'notifications' },
  { label: 'הגדרות', icon: <SettingsIcon />, to: '/therapist/settings', value: 'settings' },
];

const TherapistHomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const [notifications] = useState<Notification[]>(mockNotifications);
  const [therapistName] = useState('ד"ר כהן'); // Mock therapist name
  
  // Get current nav value
  const currentNav = navItems.find(item => location.pathname === item.to)?.value || 'home';
  
  // Get current date in Hebrew
  const getCurrentDateHebrew = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return today.toLocaleDateString('he-IL', options);
  };

  // Get today's appointments
  const todaysAppointments = appointments.filter(apt => {
    // For demo purposes, showing all appointments as "today's"
    return true;
  });

  // Get unread notifications count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'מאושר';
      case 'pending': return 'ממתין לאישור';
      case 'cancelled': return 'בוטל';
      default: return status;
    }
  };

  return (
    <ThemeProvider theme={rtlTheme}>
      <Box sx={{ 
        direction: 'rtl',
        minHeight: '100vh',
        pb: !isDesktop ? 8 : 0,
        background: rtlTheme.palette.background.default,
      }}>
        {/* Main Content */}
        <Box sx={{ 
          px: { xs: 2, sm: 3, md: 4 }, 
          py: { xs: 3, sm: 4 },
          maxWidth: { md: 1200 },
          mx: 'auto',
        }}>
          {/* Header Section */}
          <Box sx={{ mb: { xs: 4, sm: 5, md: 6 } }}>
            {/* Welcome Greeting */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 3,
            }}>
              <Box>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                    fontWeight: 700,
                    mb: 1,
                    background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  שלום, {therapistName} ✨
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {getCurrentDateHebrew()}
                </Typography>
              </Box>
              
              {/* Therapist Avatar */}
              <Avatar 
                sx={{ 
                  width: { xs: 48, sm: 56 }, 
                  height: { xs: 48, sm: 56 },
                  background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
                }}
              >
                {therapistName.charAt(therapistName.indexOf('"') + 1)}
              </Avatar>
            </Box>

            {/* Quick Stats */}
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
              <Grid item xs={4}>
                <Card>
                  <CardContent sx={{ 
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center',
                    '&:last-child': { pb: { xs: 2, sm: 3 } },
                  }}>
                    <Typography variant="h4" color="primary.main" fontWeight={700}>
                      {todaysAppointments.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      פגישות היום
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent sx={{ 
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center',
                    '&:last-child': { pb: { xs: 2, sm: 3 } },
                  }}>
                    <Typography variant="h4" color="secondary.main" fontWeight={700}>
                      12
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      מטופלים פעילים
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent sx={{ 
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center',
                    '&:last-child': { pb: { xs: 2, sm: 3 } },
                  }}>
                    <Badge badgeContent={unreadNotificationsCount} color="error">
                      <Typography variant="h4" color="warning.main" fontWeight={700}>
                        {notifications.length}
                      </Typography>
                    </Badge>
                    <Typography variant="caption" color="text.secondary">
                      התראות
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Main Action Section */}
          <Box sx={{ mb: 4 }}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 3,
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '1.125rem', sm: '1.25rem' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <EventNoteIcon /> פעולות מהירות
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/therapist/appointments/new')}
                      sx={{ 
                        py: 2,
                        fontSize: { xs: '1rem', sm: '1.125rem' },
                        height: { xs: 56, sm: 64 },
                      }}
                    >
                      קביעת פגישה חדשה
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="large"
                      startIcon={<ScheduleIcon />}
                      onClick={() => navigate('/therapist/calendar')}
                      sx={{ 
                        py: 2,
                        fontSize: { xs: '1rem', sm: '1.125rem' },
                        height: { xs: 56, sm: 64 },
                      }}
                    >
                      צפייה בלוח השנה
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>

          {/* Today's Appointments */}
          <Box sx={{ mb: 4 }}>
            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 3,
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: { xs: '1.125rem', sm: '1.25rem' },
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <TodayIcon /> פגישות היום
                  </Typography>
                  <Button 
                    variant="text" 
                    size="small"
                    onClick={() => navigate('/therapist/appointments')}
                  >
                    צפה בכל הפגישות
                  </Button>
                </Box>
                
                {todaysAppointments.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    background: 'rgba(46, 125, 107, 0.04)',
                    borderRadius: 2,
                  }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      🌿 אין פגישות מתוכננות להיום
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      זמן מושלם לתכנון או להתפתחות מקצועית
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {todaysAppointments.map((appointment) => (
                      <Box
                        key={appointment.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'rgba(46, 125, 107, 0.06)',
                          border: '1px solid rgba(46, 125, 107, 0.12)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: 'rgba(46, 125, 107, 0.10)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                        onClick={() => navigate(`/therapist/appointments/${appointment.id}`)}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          mb: 1,
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <AccessTimeIcon color="primary" fontSize="small" />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {appointment.time}
                            </Typography>
                          </Box>
                          <Chip 
                            label={getStatusText(appointment.status)}
                            color={getStatusColor(appointment.status) as any}
                            size="small"
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <PersonIcon color="action" fontSize="small" />
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {appointment.patientName}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          {appointment.type} • משך: {appointment.duration} דקות
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Important Notifications */}
          {notifications.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Card>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 3,
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1.125rem', sm: '1.25rem' },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Badge badgeContent={unreadNotificationsCount} color="error">
                        <NotificationImportantIcon />
                      </Badge>
                      התראות חשובות
                    </Typography>
                    <Button 
                      variant="text" 
                      size="small"
                      onClick={() => navigate('/therapist/notifications')}
                    >
                      צפה בכל ההתראות
                    </Button>
                  </Box>
                  
                  <Stack spacing={2}>
                    {notifications.slice(0, 3).map((notification) => (
                      <Alert
                        key={notification.id}
                        severity={notification.type}
                        sx={{ 
                          '& .MuiAlert-message': {
                            textAlign: 'right',
                            width: '100%',
                          },
                        }}
                        action={
                          !notification.read && (
                            <Chip label="חדש" color="primary" size="small" />
                          )
                        }
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {notification.title}
                        </Typography>
                        <Typography variant="body2">
                          {notification.message}
                        </Typography>
                      </Alert>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>

        {/* Floating Action Button (Mobile) */}
        {!isDesktop && (
          <Fab
            color="primary"
            aria-label="הוסף פגישה"
            sx={{
              position: 'fixed',
              bottom: 80,
              left: { xs: 16, sm: 24 }, // Note: left for RTL
              zIndex: theme => theme.zIndex.tooltip,
              width: { xs: 56, sm: 64 },
              height: { xs: 56, sm: 64 },
            }}
            onClick={() => navigate('/therapist/appointments/new')}
          >
            <AddIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
          </Fab>
        )}

        {/* Bottom Navigation (Mobile) */}
        {!isDesktop && (
          <BottomNavigation
            value={currentNav}
            onChange={(_, newValue) => {
              const item = navItems.find(item => item.value === newValue);
              if (item) navigate(item.to);
            }}
            showLabels
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: theme => theme.zIndex.appBar,
              '& .MuiBottomNavigationAction-label': {
                fontSize: { xs: '0.625rem', sm: '0.75rem' },
                '&.Mui-selected': {
                  fontSize: { xs: '0.625rem', sm: '0.75rem' },
                },
              },
            }}
          >
            {navItems.map((item) => (
              <BottomNavigationAction
                key={item.value}
                label={item.label}
                value={item.value}
                icon={
                  item.value === 'notifications' ? (
                    <Badge badgeContent={unreadNotificationsCount} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )
                }
                sx={{
                  '& .MuiSvgIcon-root': {
                    fontSize: { xs: 20, sm: 24 },
                  },
                }}
              />
            ))}
          </BottomNavigation>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default TherapistHomePage;