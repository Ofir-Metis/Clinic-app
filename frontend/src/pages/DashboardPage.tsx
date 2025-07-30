// src/pages/DashboardPage.tsx

import React, { useEffect, useState } from 'react'
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  Theme,
  Fab,
  Button,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import PageAppBar from '../components/PageAppBar'
import { fetchAppointments, fetchNotes, fetchStats } from '../api/dashboard'
import { DateCalendar } from '@mui/x-date-pickers';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const drawerWidth = 240
const navItems = [
  { label: 'Home', icon: <DashboardIcon />, to: '/dashboard' },
  { label: 'Clients', icon: <PeopleIcon />, to: '/patients' },
  { label: 'Notifications', icon: <NotificationsIcon />, to: '/notifications' },
  { label: 'Settings', icon: <SettingsIcon />, to: '/settings' },
];

const DashboardPage: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const location = useLocation()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'))

  // track bottom nav value from current path
  const currentNav = navItems.find(i => i.to === location.pathname)?.to || '/dashboard'

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
    <Box sx={{ display: 'flex' }}>
      {/* Top App Bar */}
      <PageAppBar position="fixed" avatarUrls={[]} />

      {/* Side drawer on desktop */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <List>
            {navItems.map(item => (
              <ListItemButton
                key={item.to}
                component={Link}
                to={item.to}
                selected={currentNav === item.to}
              >
                {item.icon}
                <ListItemText sx={{ ml: 1 }} primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      )}

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mb: !isDesktop ? 7 : 0 }}>
        <Toolbar />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Glassy Calendar Section */}
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.6)',
                boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)',
                border: '1px solid rgba(255,255,255,0.18)',
                maxWidth: 420,
                mx: 'auto',
              }}
            >
              <Typography variant="h5" fontWeight={700} align="center" mb={2} fontFamily="Roboto, sans-serif">
                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateCalendar
                  value={selectedDate}
                  onChange={date => setSelectedDate(date as Date)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.7)',
                    borderRadius: 3,
                    boxShadow: 1,
                    mx: 'auto',
                  }}
                />
              </LocalizationProvider>
              {/* Avatars row (mockup style) */}
              <Stack direction="row" spacing={2} justifyContent="center" mt={2} mb={2}>
                <Avatar alt="Therapist" src="/avatar1.png" />
                <Avatar alt="Patient" src="/avatar2.png" />
              </Stack>
              <Typography variant="subtitle2" align="center" color="text.secondary">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>

            {/* Today's Appointments Section */}
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.6)',
                boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)',
                border: '1px solid rgba(255,255,255,0.18)',
                maxWidth: 420,
                mx: 'auto',
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={2} fontFamily="Roboto, sans-serif">
                Today's Appointments
              </Typography>
              {todaysAppointments.length === 0 ? (
                <Typography align="center" color="text.secondary">No appointments today.</Typography>
              ) : (
                <List>
                  {todaysAppointments.map(a => (
                    <ListItemButton
                      key={a.id}
                      onClick={() => navigate(`/appointments/${a.id}`)}
                      sx={{ borderRadius: 2, mb: 1, bgcolor: 'rgba(255,255,255,0.7)' }}
                    >
                      <ListItemText
                        primary={new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + (a.name || a.type)}
                        secondary={a.type}
                      />
                      <Button variant="contained" size="small" sx={{ borderRadius: 2 }}>
                        Details
                      </Button>
                    </ListItemButton>
                  ))}
                </List>
              )}
            </Box>

            {/* The rest of your dashboard cards (notes, stats) can go here, or be moved below calendar/appointments */}
          </Box>
        )}
      </Box>

      {/* Floating "Add" FAB */}
      {!isDesktop && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 60,
            right: 16,
            zIndex: theme => theme.zIndex.tooltip,
          }}
          onClick={() => navigate('/appointments/new')}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Bottom navigation on mobile/tablet */}
      {!isDesktop && (
        <BottomNavigation
          value={currentNav}
          onChange={(_, val) => navigate(val)}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backdropFilter: 'blur(16px)',
            backgroundColor: theme =>
              theme.palette.background.paper + 'CC', // translucent
          }}
        >
          {navItems.map(item => (
            <BottomNavigationAction
              key={item.to}
              label={item.label}
              value={item.to}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      )}
    </Box>
  )
}

export default DashboardPage
