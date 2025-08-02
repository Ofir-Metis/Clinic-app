import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Fab,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BuildIcon from '@mui/icons-material/Build';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import NewDialog from '../components/NewDialog';
import ViewSwitchingBanner from '../components/ViewSwitchingBanner';
import { theme } from '../theme';

interface Props {
  children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [newOpen, setNewOpen] = useState(false);

  const value = useMemo(() => {
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
      <ViewSwitchingBanner />
      <Box sx={{ minHeight: '100vh' }}>{children}</Box>
      <NewDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        aria-label="new"
        onClick={() => setNewOpen(true)}
      >
        <AddIcon />
      </Fab>
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
          <BottomNavigationAction label={t('dashboard')} value="home" icon={<HomeIcon />} />
          <BottomNavigationAction label={t('calendar')} value="calendar" icon={<CalendarTodayIcon />} />
          <BottomNavigationAction label={t('tools')} value="tools" icon={<BuildIcon />} />
          <BottomNavigationAction label={t('notifications')} value="notifications" icon={<NotificationsIcon />} />
          <BottomNavigationAction label={t('settings')} value="settings" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Box>
    </ThemeProvider>
  );
};

export default MainLayout;
