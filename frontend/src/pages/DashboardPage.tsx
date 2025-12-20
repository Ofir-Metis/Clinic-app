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
import { he } from 'date-fns/locale';
import WellnessLayout from '../layouts/WellnessLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { usePageTitle } from '../hooks/usePageTitle';


const DashboardPage: React.FC = () => {
  const { t, translations } = useTranslation();
  const [appointments, setAppointments] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate()

  // Set page title and meta tags
  usePageTitle({
    title: 'Dashboard',
    description: 'Your wellness coaching dashboard. View appointments, track client progress, and manage your coaching practice.',
    keywords: 'dashboard, wellness coaching, appointments, client management, coaching practice'
  });

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
      title={translations.nav.dashboard}
      showFab={true}
      fabIcon={<AddIcon />}
      fabAction={() => navigate('/appointments/new')}
      fabAriaLabel={translations.dashboard.addButton}
    >
        {loading ? (
          <LoadingSkeleton variant="dashboard" />
        ) : (
          <Box sx={{ maxWidth: { xs: '100%', sm: '100%', md: 1200 }, mx: 'auto' }}>
            {/* Welcome Section */}
            <Box sx={{
              mb: { xs: 4, sm: 5, md: 6 },
              textAlign: 'center',
            }}>
              <Typography
                component="h1"
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
                {translations.dashboard.welcome}
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
                {translations.dashboard.journeySubtitle}
              </Typography>
            </Box>

            {/* Redesigned Grid Layout - Today's Schedule Priority */}
            <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
              {/* Today's Schedule - Primary Focus (70% width) */}
              <Grid item xs={12} lg={8}>
                <Stack spacing={{ xs: 2, sm: 3 }}>
                  {/* Today's Schedule - Enhanced Prominence */}
                  <Card sx={{
                    background: 'linear-gradient(135deg, rgba(46, 125, 107, 0.02) 0%, rgba(74, 155, 138, 0.05) 100%)',
                    border: '2px solid rgba(46, 125, 107, 0.12)',
                  }}>
                    <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 4,
                      }}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                            background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          🗓️ {translations.dashboard.todaysSchedule}
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={() => navigate('/appointments/new')}
                          sx={{
                            minWidth: 'fit-content',
                            px: 3,
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 600,
                          }}
                        >
                          + {translations.dashboard.addButton}
                        </Button>
                      </Box>

                      {/* Enhanced appointment display */}
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: '1.1rem' }}>
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>

                      {todaysAppointments.length === 0 ? (
                        <Box sx={{
                          p: 6,
                          textAlign: 'center',
                          background: 'rgba(46, 125, 107, 0.04)',
                          borderRadius: 3,
                          border: '2px dashed rgba(46, 125, 107, 0.2)',
                        }}>
                          <Typography variant="h5" sx={{ mb: 2, fontSize: '1.5rem' }}>🌅</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {translations.dashboard.noAppointments}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {translations.dashboard.selfCareTime}
                          </Typography>
                          <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/appointments/new')}
                            sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
                          >
                            📅 {translations.dashboard.addButton}
                          </Button>
                        </Box>
                      ) : (
                        <Stack spacing={3}>
                          {todaysAppointments.map(a => (
                            <Card
                              key={a.id}
                              onClick={() => navigate(`/appointments/${a.id}`)}
                              sx={{
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: '1px solid rgba(46, 125, 107, 0.2)',
                                background: 'rgba(255, 255, 255, 0.9)',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: '0 12px 32px rgba(46, 125, 107, 0.15)',
                                  border: '1px solid rgba(46, 125, 107, 0.3)',
                                },
                              }}
                            >
                              <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: '1.25rem' }}>
                                      {new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {a.name || a.type}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                                      {a.type} • {translations.dashboard.duration}
                                    </Typography>
                                  </Box>
                                  <Button
                                    variant="contained"
                                    size="large"
                                    sx={{
                                      minWidth: 120,
                                      py: 1.5,
                                      px: 3,
                                      fontSize: '1rem',
                                      fontWeight: 600,
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/appointments/${a.id}`);
                                    }}
                                  >
                                    {translations.dashboard.joinButton}
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions - Compact Design */}
                  <Card sx={{ background: 'rgba(74, 155, 138, 0.02)' }}>
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
                        {translations.dashboard.quickActions}
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
                            <Typography variant="caption">{translations?.dashboard?.navigation?.clients || 'Clients'}</Typography>
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
                            <Typography variant="caption">{translations?.dashboard?.navigation?.calendar || 'Calendar'}</Typography>
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
                            <Typography variant="caption">{translations?.dashboard?.navigation?.aiTools || 'AI Tools'}</Typography>
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>

              {/* Compact Calendar & Context Panel (30% width) */}
              <Grid item xs={12} lg={4}>
                <Stack spacing={{ xs: 2, sm: 3 }}>
                  {/* Compact Calendar */}
                  <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          textAlign: 'center',
                          mb: 2,
                          fontSize: { xs: '1rem', sm: '1.125rem' },
                          color: 'primary.main',
                        }}
                      >
                        {translations.dashboard.calendar}
                      </Typography>

                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                        <DateCalendar
                          value={selectedDate}
                          onChange={date => setSelectedDate(date as Date)}
                          sx={{
                            width: '100%',
                            maxWidth: '100%',
                            '& .MuiPickersCalendarHeader-root': {
                              paddingLeft: 0.5,
                              paddingRight: 0.5,
                            },
                            '& .MuiDayCalendar-root': {
                              margin: 0,
                            },
                            '& .MuiPickersDay-root': {
                              fontSize: '0.875rem',
                            },
                          }}
                        />
                      </LocalizationProvider>

                      {/* Compact Stats */}
                      <Box sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        background: 'rgba(46, 125, 107, 0.06)',
                        textAlign: 'center',
                      }}>
                        <Stack direction="row" spacing={2} justifyContent="center">
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="primary.main" fontWeight={700}>
                              {todaysAppointments.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {translations.dashboard.today}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="secondary.main" fontWeight={700}>
                              {appointments.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {translations.dashboard.total}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Quick Stats Card */}
                  <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 2,
                          fontSize: { xs: '1rem', sm: '1.125rem' },
                        }}
                      >
                        {translations.dashboard.quickStats}
                      </Typography>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {translations.dashboard.thisWeek}
                          </Typography>
                          <Typography variant="h6" color="primary.main" fontWeight={600}>
                            {Math.max(appointments.length, 3)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {translations.dashboard.activeClients}
                          </Typography>
                          <Typography variant="h6" color="secondary.main" fontWeight={600}>
                            {Math.max(Math.floor(appointments.length * 1.5), 5)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        )}
    </WellnessLayout>
  )
}

export default DashboardPage