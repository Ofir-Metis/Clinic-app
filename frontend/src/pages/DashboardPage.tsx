import React, { useEffect, useState } from 'react'
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  Stack,
} from '@mui/material'
import {
  Add as AddIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { fetchAppointments, fetchNotes, fetchStats } from '../api/dashboard'
import { useTranslation } from '../contexts/LanguageContext'
import { DateCalendar } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import WellnessLayout from '../layouts/WellnessLayout';


const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([fetchAppointments(), fetchNotes(), fetchStats()])
      .then(([a, n, s]) => {
        setAppointments(a)
        setNotes(n)
        setStats(s)
      })
      .finally(() => setLoading(false))
  }, [])

  // Filter appointments for selected date
  const todaysAppointments = appointments.filter(a => {
    const d = new Date(a.startTime)
    return d.toDateString() === selectedDate.toDateString()
  });

  return (
    <WellnessLayout
      title={t.nav.dashboard}
      showFab={true}
      fabIcon={<AddIcon />}
      fabAction={() => navigate('/appointments/new')}
      fabAriaLabel={t.dashboard.addButton}
    >
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mt: { xs: 4, sm: 6, md: 8 },
            gap: 2,
          }}>
            <CircularProgress size={48} thickness={4} />
            <Typography variant="body2" color="text.secondary">
              {t.dashboard.loading}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxWidth: { xs: '100%', sm: '100%', md: 1200 }, mx: 'auto' }}>
            {/* Welcome Section */}
            <Box sx={{ 
              mb: { xs: 4, sm: 5, md: 6 },
              textAlign: 'center',
            }}>
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
                {t.dashboard.welcome}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'text.secondary',
                  maxWidth: 480,
                  mx: 'auto',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                }}
              >
                {t.dashboard.journeySubtitle}
              </Typography>
            </Box>

            {/* Responsive Grid Layout */}
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
              {/* Calendar Section */}
              <Grid item xs={12} md={6} lg={5}>
                <Card sx={{ 
                  height: 'fit-content',
                  position: 'sticky',
                  top: { md: 100 },
                }}>
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 600,
                        textAlign: 'center',
                        mb: 3,
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        color: 'primary.main',
                      }}
                    >
                      📅 {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Typography>
                    
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateCalendar
                        value={selectedDate}
                        onChange={date => setSelectedDate(date as Date)}
                        sx={{
                          width: '100%',
                          maxWidth: '100%',
                          '& .MuiPickersCalendarHeader-root': {
                            paddingLeft: 1,
                            paddingRight: 1,
                          },
                          '& .MuiDayCalendar-root': {
                            margin: 0,
                          },
                          '& .MuiPickersDay-root': {
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                          },
                        }}
                      />
                    </LocalizationProvider>
                    
                    {/* Selected Date Info */}
                    <Box sx={{ 
                      mt: 3, 
                      p: 2, 
                      borderRadius: 2,
                      background: 'rgba(46, 125, 107, 0.08)',
                      textAlign: 'center',
                    }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        {t.dashboard.selectedDate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Typography>
                      
                      {/* Quick Stats */}
                      <Stack direction="row" spacing={2} justifyContent="center" mt={2}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary.main" fontWeight={700}>
                            {todaysAppointments.length}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.dashboard.appointments}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="secondary.main" fontWeight={700}>
                            3
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.dashboard.sessions}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Appointments and Activities */}
              <Grid item xs={12} md={6} lg={7}>
                <Stack spacing={{ xs: 2, sm: 3 }}>
                  {/* Today's Appointments */}
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
                          {t.dashboard.todaysSchedule}
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => navigate('/appointments/new')}
                          sx={{ minWidth: 'fit-content' }}
                        >
                          {t.dashboard.addButton}
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
                            {t.dashboard.noAppointments}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t.dashboard.selfCareTime}
                          </Typography>
                        </Box>
                      ) : (
                        <Stack spacing={2}>
                          {todaysAppointments.map(a => (
                            <Box
                              key={a.id}
                              onClick={() => navigate(`/appointments/${a.id}`)}
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
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {a.name || a.type}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {a.type} • {t.dashboard.duration}
                                  </Typography>
                                </Box>
                                <Button 
                                  variant="contained" 
                                  size="small"
                                  sx={{ 
                                    minWidth: 'fit-content',
                                    fontSize: '0.75rem',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/appointments/${a.id}`);
                                  }}
                                >
                                  {t.dashboard.joinButton}
                                </Button>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          mb: 3,
                          fontSize: { xs: '1.125rem', sm: '1.25rem' },
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        {t.dashboard.quickActions}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={4}>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/patients')}
                            sx={{ 
                              py: 2,
                              flexDirection: 'column',
                              gap: 1,
                              height: 80,
                            }}
                          >
                            👥
                            <Typography variant="caption">{t.dashboard.navigation.clients}</Typography>
                          </Button>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/calendar')}
                            sx={{ 
                              py: 2,
                              flexDirection: 'column',
                              gap: 1,
                              height: 80,
                            }}
                          >
                            📋
                            <Typography variant="caption">{t.dashboard.navigation.calendar}</Typography>
                          </Button>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/tools')}
                            sx={{ 
                              py: 2,
                              flexDirection: 'column',
                              gap: 1,
                              height: 80,
                            }}
                          >
                            🧠
                            <Typography variant="caption">{t.dashboard.navigation.aiTools}</Typography>
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>

            {/* The rest of your dashboard cards (notes, stats) can go here, or be moved below calendar/appointments */}
          </Box>
        )}
    </WellnessLayout>
  )
}

export default DashboardPage
