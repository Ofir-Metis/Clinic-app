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
  MoreHoriz as MoreIcon,
  AdminPanelSettings as AdminIcon,
  EventNote as SessionsIcon,
  BookOnline as BookingIcon,
  TrendingUp as ProgressIcon,
  EmojiEvents as AchievementsIcon,
  Explore as DiscoverIcon,
  FlagCircle as GoalsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../AuthContext';
import CommandPalette from '../components/CommandPalette';
import useCommandPalette from '../hooks/useCommandPalette';
import Breadcrumbs from '../components/Breadcrumbs';
import { logFocusOrder } from '../utils/focusOrder';

const drawerWidth = 240;

interface NavigationItem {
  label: string;
  icon: React.ReactElement;
  path: string;
  value: string;
  showInBottomNav?: boolean;
}

interface WellnessLayoutProps {
  children: React.ReactNode;
  title?: string;
  showFab?: boolean;
  fabIcon?: React.ReactElement;
  fabAction?: () => void;
  fabAriaLabel?: string;
  showAppBar?: boolean;
  showBreadcrumbs?: boolean;
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
  showBreadcrumbs = true,
  maxWidth = 1200,
  notificationCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { translations: t, isRTL } = useTranslation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'));
  const isTablet = useMediaQuery((theme: Theme) => theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const commandPalette = useCommandPalette();

  const isClientUser = user?.role === 'client';

  // Client-specific navigation items
  const clientNavigationItems: NavigationItem[] = [
    {
      label: t.nav?.dashboard || 'Dashboard',
      icon: <DashboardIcon />,
      path: '/client/dashboard',
      value: 'dashboard',
      showInBottomNav: true,
    },
    {
      label: t.nav?.mySessions || 'My Sessions',
      icon: <SessionsIcon />,
      path: '/client/appointments',
      value: 'appointments',
      showInBottomNav: true,
    },
    {
      label: t.nav?.bookSession || 'Book Session',
      icon: <BookingIcon />,
      path: '/client/booking',
      value: 'booking',
      showInBottomNav: true,
    },
    {
      label: t.nav?.myGoals || 'My Goals',
      icon: <GoalsIcon />,
      path: '/client/goals',
      value: 'goals',
      showInBottomNav: false,
    },
    {
      label: t.nav?.myProgress || 'My Progress',
      icon: <ProgressIcon />,
      path: '/client/progress',
      value: 'progress',
      showInBottomNav: false,
    },
    {
      label: t.nav?.achievements || 'Achievements',
      icon: <AchievementsIcon />,
      path: '/client/achievements',
      value: 'achievements',
      showInBottomNav: false,
    },
    {
      label: t.nav?.discoverCoaches || 'Discover Coaches',
      icon: <DiscoverIcon />,
      path: '/client/discover',
      value: 'discover',
      showInBottomNav: false,
    },
    {
      label: t.nav?.settings || 'Settings',
      icon: <SettingsIcon />,
      path: '/client/settings',
      value: 'settings',
      showInBottomNav: false,
    },
  ];

  // Coach/Admin navigation items
  const coachNavigationItems: NavigationItem[] = [
    {
      label: t.nav?.dashboard || 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      value: 'dashboard',
      showInBottomNav: true,
    },
    {
      label: t.nav?.patients || 'Clients',
      icon: <PeopleIcon />,
      path: '/patients',
      value: 'patients',
      showInBottomNav: true,
    },
    {
      label: t.nav?.calendar || 'Calendar',
      icon: <CalendarIcon />,
      path: '/calendar',
      value: 'calendar',
      showInBottomNav: true,
    },
    {
      label: t.nav?.tools || 'AI Tools',
      icon: <ToolsIcon />,
      path: '/tools',
      value: 'tools',
      showInBottomNav: false,
    },
    {
      label: t.nav?.notifications || 'Notifications',
      icon: <NotificationsIcon />,
      path: '/notifications',
      value: 'notifications',
      showInBottomNav: false,
    },
    {
      label: t.nav?.settings || 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      value: 'settings',
      showInBottomNav: false,
    },
    // Conditionally add Admin item for admin users
    ...(user?.role === 'admin' || user?.role === 'super_admin' ? [{
      label: t.nav?.admin || 'Admin Dashboard',
      icon: <AdminIcon />,
      path: '/admin',
      value: 'admin',
      showInBottomNav: false,
    }] : []),
  ];

  // Select navigation based on user role
  const navigationItems = isClientUser ? clientNavigationItems : coachNavigationItems;

  // Additional items for the "More" menu (role-aware)
  const moreMenuItems: NavigationItem[] = isClientUser ? [
    {
      label: t.nav?.myGoals || 'My Goals',
      icon: <GoalsIcon />,
      path: '/client/goals',
      value: 'goals',
      showInBottomNav: false,
    },
    {
      label: t.nav?.myProgress || 'My Progress',
      icon: <ProgressIcon />,
      path: '/client/progress',
      value: 'progress',
      showInBottomNav: false,
    },
    {
      label: t.nav?.settings || 'Settings',
      icon: <SettingsIcon />,
      path: '/client/settings',
      value: 'settings',
      showInBottomNav: false,
    },
  ] : [
    {
      label: t.nav?.tools || 'AI Tools',
      icon: <ToolsIcon />,
      path: '/tools',
      value: 'tools',
      showInBottomNav: false,
    },
    {
      label: t.nav?.notifications || 'Notifications',
      icon: <NotificationsIcon />,
      path: '/notifications',
      value: 'notifications',
      showInBottomNav: false,
    },
    {
      label: t.nav?.settings || 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      value: 'settings',
      showInBottomNav: false,
    },
  ];

  // Focus order verification in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        logFocusOrder();
      }, 1000); // Wait for components to render
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

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
    navigate(isClientUser ? '/client/login' : '/login');
    handleProfileMenuClose();
  };

  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchorEl(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchorEl(null);
  };

  const handleMoreMenuNavigation = (path: string) => {
    navigate(path);
    handleMoreMenuClose();
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
          {t.appName || 'Wellness Clinic'}
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
            aria-current={currentValue === item.value ? 'page' : undefined}
            sx={{
              mb: 1,
              borderRadius: 2,
              minHeight: 48, // Better touch target
              position: 'relative',
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.18),
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  ...(isRTL ? { right: 0 } : { left: 0 }),
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 4,
                  height: '60%',
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: isRTL ? '2px 0 0 2px' : '0 2px 2px 0',
                },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
              '&:focus': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
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
              primary={item.label}
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
          component="header"
          role="banner"
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            ...(isDesktop && isRTL && { mr: `${drawerWidth}px`, width: `calc(100% - ${drawerWidth}px)` }),
            ...(isDesktop && !isRTL && { ml: `${drawerWidth}px`, width: `calc(100% - ${drawerWidth}px)` }),
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
                alt={`${getUserDisplayName()} profile picture`}
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
            alt={`${getUserDisplayName()} profile picture`}
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
        <MenuItem
          onClick={handleLogoutClick}
          role="menuitem"
          sx={{ py: 1.5, color: 'text.secondary' }}
        >
          <Typography variant="body2">
            {t.nav?.logout || 'See You Space Cowboy 👋'}
          </Typography>
        </MenuItem>
      </Menu>

      {/* Desktop Sidebar */}
      {isDesktop && (
        <Drawer
          component="nav"
          role="navigation"
          aria-label="Main navigation"
          variant="permanent"
          anchor={isRTL ? 'right' : 'left'}
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
          component="nav"
          role="navigation"
          aria-label="Main navigation"
          variant="temporary"
          anchor={isRTL ? 'right' : 'left'}
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

      {/* Breadcrumbs */}
      {showBreadcrumbs && showAppBar && (
        <Box
          sx={{
            position: 'fixed',
            top: 64, // Below AppBar
            ...(isDesktop && isRTL && { right: drawerWidth, left: 0 }),
            ...(isDesktop && !isRTL && { left: drawerWidth, right: 0 }),
            ...(!isDesktop && { left: 0, right: 0 }),
            zIndex: (theme) => theme.zIndex.drawer - 1,
          }}
        >
          <Breadcrumbs />
        </Box>
      )}

      {/* Main Content */}
      <Box
        component="main"
        role="main"
        aria-label="Main content"
        sx={{
          flexGrow: 1,
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2, sm: 3 },
          ...(showAppBar && {
            pt: showBreadcrumbs
              ? { xs: 12, sm: 13, md: 14 } // Extra space for breadcrumbs
              : { xs: 10, sm: 11, md: 12 }
          }),
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

      {/* Optimized Bottom Navigation (Mobile) - 3 Main + More */}
      {isMobile && (
        <>
          <BottomNavigation
            component="nav"
            role="navigation"
            aria-label="Bottom navigation"
            value={currentValue}
            onChange={(_, newValue) => {
              if (newValue === 'more') {
                // Handle More menu differently
                return;
              }
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
                minWidth: 72, // Better spacing with 4 items
                maxWidth: 120,
                paddingTop: 8,
                paddingBottom: 8,
                position: 'relative',
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '80%',
                    height: 3,
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: '0 0 2px 2px',
                  },
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  },
                  '& .MuiSvgIcon-root': {
                    transform: 'scale(1.1)',
                    filter: `drop-shadow(0 2px 4px ${alpha(theme.palette.primary.main, 0.3)})`,
                  },
                },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.7rem',
                  marginTop: 4,
                  transition: 'all 0.2s ease',
                },
                '& .MuiSvgIcon-root': {
                  transition: 'all 0.2s ease',
                },
                // Add subtle animation on tap
                '&:active': {
                  transform: 'scale(0.95)',
                  transition: 'transform 0.1s ease',
                },
                '&:focus': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: '2px',
                },
              },
            }}
          >
            {/* Main navigation items (first 3) */}
            {navigationItems
              .filter(item => item.showInBottomNav)
              .slice(0, 3)
              .map((item) => (
                <BottomNavigationAction
                  key={item.value}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                />
              ))}

            {/* More menu button */}
            <BottomNavigationAction
              label={t.nav?.more || 'More'}
              value="more"
              icon={
                moreMenuItems.some(item =>
                  item.value === 'notifications' && notificationCount > 0
                ) ? (
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
                    <MoreIcon />
                  </Badge>
                ) : (
                  <MoreIcon />
                )
              }
              onClick={handleMoreMenuOpen}
            />
          </BottomNavigation>

          {/* More Menu */}
          <Menu
            id="more-menu"
            anchorEl={moreMenuAnchorEl}
            open={Boolean(moreMenuAnchorEl)}
            onClose={handleMoreMenuClose}
            onClick={handleMoreMenuClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mb: 1,
                minWidth: 200,
                borderRadius: 2,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateX(-50%) translateY(50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
          >
            {moreMenuItems.map((item) => (
              <MenuItem
                key={item.value}
                onClick={() => handleMoreMenuNavigation(item.path)}
                selected={currentValue === item.value}
                aria-current={currentValue === item.value ? 'page' : undefined}
                sx={{
                  py: 1.5,
                  px: 2,
                  minHeight: 48, // Better touch target
                  position: 'relative',
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    borderRadius: 1,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: '70%',
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: '0 2px 2px 0',
                    },
                  },
                  '&:focus': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: '2px',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{ color: currentValue === item.value ? 'primary.main' : 'text.secondary' }}>
                    {item.value === 'notifications' && notificationCount > 0 ? (
                      <Badge badgeContent={notificationCount} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: currentValue === item.value ? 600 : 400,
                      color: currentValue === item.value ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      {/* Command Palette */}
      <CommandPalette
        open={commandPalette.isOpen}
        onClose={commandPalette.close}
      />
    </Box>
  );
};

export default WellnessLayout;