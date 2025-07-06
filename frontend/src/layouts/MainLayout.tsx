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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import AIHelper from '../AIHelper';
import { createAppTheme } from '../theme';

interface Props {
  children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const theme = useMemo(() => createAppTheme(i18n.dir()), [i18n]);

  const value = useMemo(() => {
    if (location.pathname.startsWith('/patients/new')) return 'add';
    if (location.pathname.startsWith('/settings')) return 'settings';
    return 'home';
  }, [location.pathname]);

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'home') navigate('/');
    if (newValue === 'add') navigate('/patients/new');
    if (newValue === 'settings') navigate('/settings');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh' }}>{children}</Box>
      {open && (
        <Box sx={{ position: 'fixed', bottom: 80, right: 16, width: 300 }}>
          <AIHelper />
        </Box>
      )}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => setOpen((v) => !v)}
      >
        <ChatIcon />
      </Fab>
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <BottomNavigation value={value} onChange={handleChange} showLabels>
          <BottomNavigationAction label={t('dashboard')} value="home" icon={<HomeIcon />} />
          <BottomNavigationAction label={t('addPatient')} value="add" icon={<PersonAddIcon />} />
          <BottomNavigationAction label={t('settings')} value="settings" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Box>
    </ThemeProvider>
  );
};

export default MainLayout;
