import React, { useMemo, useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  useMediaQuery,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BuildIcon from '@mui/icons-material/Build';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ApiIcon from '@mui/icons-material/Api';
import SecurityIcon from '@mui/icons-material/Security';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import PeopleIcon from '@mui/icons-material/People';
import { Divider, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import NewDialog from '../components/NewDialog';
import ViewSwitchingBanner from '../components/ViewSwitchingBanner';
import NetworkStatus from '../components/NetworkStatus';
import { VoiceNoteButton } from '../components/voice-notes';
import { theme } from '../theme';

interface Props {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 240;

const navItems = [
  { value: 'home', path: '/', labelKey: 'nav.dashboard', icon: <HomeIcon /> },
  { value: 'calendar', path: '/appointments', labelKey: 'nav.calendar', icon: <CalendarTodayIcon /> },
  { value: 'tools', path: '/tools', labelKey: 'nav.tools', icon: <BuildIcon /> },
  { value: 'notifications', path: '/notifications', labelKey: 'nav.notifications', icon: <NotificationsIcon /> },
  { value: 'settings', path: '/settings', labelKey: 'nav.settings', icon: <SettingsIcon /> },
];

const adminNavItems = [
  { value: 'admin-dashboard', path: '/admin', labelKey: 'nav.admin', icon: <AdminPanelSettingsIcon /> },
  { value: 'admin-api', path: '/admin/api-management', labelKey: 'admin.apiManagement', icon: <ApiIcon /> },
  { value: 'admin-subscriptions', path: '/admin/subscriptions', labelKey: 'admin.subscriptions', icon: <SubscriptionsIcon /> },
];

const MainLayout: React.FC<Props> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [newOpen, setNewOpen] = useState(false);
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const value = useMemo(() => {
    if (location.pathname.startsWith('/admin/api-management')) return 'admin-api';
    if (location.pathname.startsWith('/admin/subscriptions')) return 'admin-subscriptions';
    if (location.pathname.startsWith('/admin')) return 'admin-dashboard';
    if (location.pathname.startsWith('/appointments')) return 'calendar';
    if (location.pathname.startsWith('/tools')) return 'tools';
    if (location.pathname.startsWith('/notifications')) return 'notifications';
    if (location.pathname.startsWith('/settings')) return 'settings';
    return 'home';
  }, [location.pathname]);

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'home') navigate('/');
    if (newValue === 'calendar') navigate('/appointments');
    if (newValue === 'tools') navigate('/tools');
    if (newValue === 'notifications') navigate('/notifications');
    if (newValue === 'settings') navigate('/settings');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NetworkStatus />
      <ViewSwitchingBanner />

      {/* Desktop: Sidebar Drawer */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: 'primary.main',
              color: '#fff',
            },
          }}
        >
          <Box sx={{ overflow: 'auto', mt: 2 }}>
            <List>
              {navItems.map((item) => (
                <ListItemButton
                  key={item.value}
                  selected={value === item.value}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: '#fff',
                    opacity: value === item.value ? 1 : 0.8,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255,255,255,0.15)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                    },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={t(item.labelKey)} />
                </ListItemButton>
              ))}
            </List>
            {isAdmin && (
              <>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mx: 2 }} />
                <Typography
                  variant="overline"
                  sx={{ color: 'rgba(255,255,255,0.6)', px: 2, pt: 1, display: 'block' }}
                >
                  Admin
                </Typography>
                <List>
                  {adminNavItems.map((item) => (
                    <ListItemButton
                      key={item.value}
                      selected={value === item.value}
                      onClick={() => navigate(item.path)}
                      sx={{
                        color: '#fff',
                        opacity: value === item.value ? 1 : 0.8,
                        '&.Mui-selected': {
                          bgcolor: 'rgba(255,255,255,0.15)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                        },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                      }}
                    >
                      <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={t(item.labelKey)} />
                    </ListItemButton>
                  ))}
                </List>
              </>
            )}
          </Box>
        </Drawer>
      )}

      {/* Main content area */}
      <Box sx={{
        minHeight: '100vh',
        ml: isDesktop ? `${DRAWER_WIDTH}px` : 0,
        pb: isDesktop ? 0 : '56px', // Add bottom padding for mobile nav
      }}>
        {children}
      </Box>

      <NewDialog open={newOpen} onClose={() => setNewOpen(false)} />

      {/* Voice Note Button - positioned on left */}
      <VoiceNoteButton
        position="bottom-left"
      />

      {/* FAB for creating new client/appointment */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: isDesktop ? 24 : 80,
          right: 16,
        }}
        aria-label="Create new client or appointment"
        onClick={() => setNewOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Mobile: Bottom Navigation */}
      {!isDesktop && (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
          <BottomNavigation
            value={value}
            onChange={handleChange}
            showLabels
            sx={{
              backgroundColor: 'primary.main',
              '& .Mui-selected': { color: '#fff' },
              '& .MuiBottomNavigationAction-root': { color: '#fff', opacity: 0.8 },
            }}
          >
            {navItems.map((item) => (
              <BottomNavigationAction
                key={item.value}
                label={t(item.labelKey)}
                value={item.value}
                icon={item.icon}
              />
            ))}
          </BottomNavigation>
        </Box>
      )}
    </ThemeProvider>
  );
};

export default MainLayout;
