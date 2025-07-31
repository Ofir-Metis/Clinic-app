import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  Theme,
  Fab,
  AppBar,
  IconButton,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  Psychology as ToolsIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const drawerWidth = 240;

interface NavigationItem {
  label: string;
  icon: React.ReactElement;
  path: string;
  value: string;
  showInBottomNav?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    value: 'dashboard',
    showInBottomNav: true,
  },
  {
    label: 'Calendar',
    icon: <CalendarIcon />,
    path: '/calendar',
    value: 'calendar',
    showInBottomNav: true,
  },
  {
    label: 'Clients',
    icon: <PeopleIcon />,
    path: '/patients',
    value: 'patients',
    showInBottomNav: true,
  },
  {
    label: 'AI Tools',
    icon: <ToolsIcon />,
    path: '/tools',
    value: 'tools',
    showInBottomNav: true,
  },
  {
    label: 'Notifications',
    icon: <NotificationsIcon />,
    path: '/notifications',
    value: 'notifications',
    showInBottomNav: true,
  },
  {
    label: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    value: 'settings',
    showInBottomNav: false,
  },
];

interface WellnessLayoutProps {
  children: React.ReactNode;
  title?: string;
  showFab?: boolean;
  fabIcon?: React.ReactElement;
  fabAction?: () => void;
  fabAriaLabel?: string;
  showAppBar?: boolean;
  maxWidth?: number | string;
  notificationCount?: number;
}

const WellnessLayout: React.FC<WellnessLayoutProps> = ({
  children,
  title = '',
  showFab = true,
  fabIcon = <AddIcon />,
  fabAction,
  fabAriaLabel = 'Add',
  showAppBar = true,
  maxWidth = 1200,
  notificationCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Get current navigation value
  const currentValue = navigationItems.find(item => 
    location.pathname.startsWith(item.path)
  )?.value || 'dashboard';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Desktop Sidebar Content
  const drawerContent = (
    <Box>
      <Toolbar>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Wellness Clinic
        </Typography>
      </Toolbar>
      <List sx={{ px: 2 }}>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.value}
            selected={currentValue === item.value}
            onClick={() => handleNavigation(item.path)}
            sx={{ mb: 1 }}
          >
            <ListItemIcon>
              {item.value === 'notifications' && notificationCount > 0 ? (
                <Badge badgeContent={notificationCount} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText primary={t(item.label.toLowerCase(), item.label)} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      {showAppBar && (
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            ...(isDesktop && { ml: `${drawerWidth}px`, width: `calc(100% - ${drawerWidth}px)` }),
          }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            {/* User Avatar */}
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40,
                background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
              }}
            >
              U
            </Avatar>
          </Toolbar>
        </AppBar>
      )}

      {/* Desktop Sidebar */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
          ...(showAppBar && { pt: { xs: 10, sm: 11, md: 12 } }),
          mb: isMobile ? 8 : 0,
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          mx: 'auto',
          width: '100%',
        }}
      >
        {children}
      </Box>

      {/* Floating Action Button */}
      {showFab && isMobile && fabAction && (
        <Fab
          color="primary"
          aria-label={fabAriaLabel}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: { xs: 16, sm: 24 },
            zIndex: (theme) => theme.zIndex.tooltip,
          }}
          onClick={fabAction}
        >
          {fabIcon}
        </Fab>
      )}

      {/* Bottom Navigation (Mobile) */}
      {isMobile && (
        <BottomNavigation
          value={currentValue}
          onChange={(_, newValue) => {
            const item = navigationItems.find(item => item.value === newValue);
            if (item) navigate(item.path);
          }}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          {navigationItems
            .filter(item => item.showInBottomNav)
            .map((item) => (
              <BottomNavigationAction
                key={item.value}
                label={t(item.label.toLowerCase(), item.label)}
                value={item.value}
                icon={
                  item.value === 'notifications' && notificationCount > 0 ? (
                    <Badge badgeContent={notificationCount} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )
                }
              />
            ))}
        </BottomNavigation>
      )}
    </Box>
  );
};

export default WellnessLayout;