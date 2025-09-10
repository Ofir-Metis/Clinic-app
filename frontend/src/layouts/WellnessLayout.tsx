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
  SwipeableDrawer,
  Divider,
  useTheme,
  alpha,
  Menu,
  MenuItem,
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
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthContext';

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
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const isTablet = useMediaQuery((theme: Theme) => theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = React.useState<null | HTMLElement>(null);

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

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  // Get user's display name and first letter
  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email;
    return 'User';
  };

  const getUserFirstLetter = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Enhanced Drawer Content
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with close button for mobile */}
      <Toolbar sx={{ px: 3, justifyContent: 'space-between' }}>
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
        {isMobile && (
          <IconButton
            edge="end"
            onClick={handleDrawerToggle}
            aria-label="close drawer"
            size="small"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Toolbar>
      
      <Divider />
      
      {/* Navigation Items */}
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.value}
            selected={currentValue === item.value}
            onClick={() => handleNavigation(item.path)}
            sx={{ 
              mb: 1,
              borderRadius: 2,
              minHeight: 48, // Better touch target
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            <ListItemIcon sx={{ color: currentValue === item.value ? 'primary.main' : 'text.secondary' }}>
              {item.value === 'notifications' && notificationCount > 0 ? (
                <Badge badgeContent={notificationCount} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText 
              primary={t(item.label.toLowerCase(), item.label)} 
              sx={{ 
                '& .MuiListItemText-primary': {
                  fontWeight: currentValue === item.value ? 600 : 400,
                  color: currentValue === item.value ? 'primary.main' : 'text.primary',
                }
              }}
            />
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
            {/* User Avatar with Profile Menu */}
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              aria-label="profile menu"
              aria-controls={profileMenuAnchorEl ? 'profile-menu' : undefined}
              aria-expanded={profileMenuAnchorEl ? 'true' : undefined}
              aria-haspopup="true"
            >
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40,
                  background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 12px rgba(46, 125, 107, 0.3)',
                  },
                }}
                src={user?.avatar}
              >
                {getUserFirstLetter()}
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={profileMenuAnchorEl}
        open={Boolean(profileMenuAnchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
          <Avatar 
            sx={{ 
              background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
              fontSize: '0.875rem'
            }}
            src={user?.avatar}
          >
            {getUserFirstLetter()}
          </Avatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t.nav?.profile || 'My Awesome Self'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getUserDisplayName()}
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogoutClick} sx={{ py: 1.5, color: 'text.secondary' }}>
          <Typography variant="body2">
            {t.nav?.logout || 'See You Space Cowboy 👋'}
          </Typography>
        </MenuItem>
      </Menu>

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

      {/* Enhanced Mobile Drawer with Swipe */}
      {isMobile && (
        <SwipeableDrawer
          variant="temporary"
          open={mobileOpen}
          onOpen={() => setMobileOpen(true)}
          onClose={() => setMobileOpen(false)}
          disableSwipeToOpen={false}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: isTablet ? drawerWidth + 40 : drawerWidth,
              backgroundImage: 'none',
              backgroundColor: theme.palette.background.paper,
            },
            '& .MuiBackdrop-root': {
              backgroundColor: alpha(theme.palette.common.black, 0.3),
              backdropFilter: 'blur(4px)',
            },
          }}
        >
          {drawerContent}
        </SwipeableDrawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
          ...(showAppBar && { pt: { xs: 10, sm: 11, md: 12 } }),
          mb: isMobile ? 10 : 0, // Increased margin for taller bottom nav
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

      {/* Enhanced Bottom Navigation (Mobile) */}
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
            height: 64, // Increased height for better touch targets
            backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            backdropFilter: 'blur(8px)',
            '& .MuiBottomNavigationAction-root': {
              minWidth: 60,
              maxWidth: 120,
              paddingTop: 8,
              paddingBottom: 8,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.75rem',
                  fontWeight: 600,
                },
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                marginTop: 4,
              },
              // Add subtle animation on tap
              '&:active': {
                transform: 'scale(0.95)',
                transition: 'transform 0.1s ease',
              },
            },
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
                    <Badge 
                      badgeContent={notificationCount} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.6rem',
                          height: 16,
                          minWidth: 16,
                        }
                      }}
                    >
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