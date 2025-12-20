import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  maxItems?: number;
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  maxItems = 4,
  className
}) => {
  const { translations: t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with home
    breadcrumbs.push({
      label: t.nav.dashboard,
      href: '/dashboard',
      icon: <HomeIcon sx={{ fontSize: '1rem', mr: 0.5 }} />,
    });

    // Skip if we're already on dashboard
    if (location.pathname === '/dashboard' || location.pathname === '/') {
      return breadcrumbs;
    }

    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      // Get label based on route segment
      let label = segment;

      // Map route segments to translated labels
      switch (segment) {
        case 'patients':
          label = t.nav.patients;
          break;
        case 'appointments':
          label = t.nav.appointments;
          break;
        case 'calendar':
          label = t.nav.calendar;
          break;
        case 'tools':
          label = t.nav.tools;
          break;
        case 'notifications':
          label = t.nav.notifications;
          break;
        case 'profile':
          label = t.nav.profile;
          break;
        case 'settings':
          label = t.nav.settings;
          break;
        case 'admin':
          label = t.nav.admin;
          break;
        case 'client':
          label = t.nav.clientPortal;
          break;
        case 'new':
          label = t.common.new;
          break;
        case 'edit':
          label = t.common.edit;
          break;
        case 'goals':
          label = t.clientPortal?.goals?.title || 'Goals';
          break;
        case 'discovery':
          label = t.clientPortal?.discovery?.title || 'Discovery';
          break;
        case 'register':
          label = t.auth?.register?.title || 'Register';
          break;
        case 'login':
          label = t.auth?.login?.title || 'Login';
          break;
        case 'reset':
          label = t.auth?.resetPassword?.title || 'Reset Password';
          break;
        default:
          // For dynamic segments (IDs), try to get a more meaningful label
          if (/^\d+$/.test(segment)) {
            // If it's a numeric ID, show as "Details" or similar
            label = t.common.details || 'Details';
          } else {
            // Capitalize first letter for other segments
            label = segment.charAt(0).toUpperCase() + segment.slice(1);
          }
      }

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs if there's only the home item
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Box
      component="nav"
      role="navigation"
      aria-label="Breadcrumb navigation"
      className={className}
      sx={{
        py: { xs: 1, sm: 1.5 },
        px: { xs: 2, sm: 3 },
        backgroundColor: 'rgba(46, 125, 107, 0.02)',
        borderBottom: '1px solid rgba(46, 125, 107, 0.1)',
      }}
    >
      <MuiBreadcrumbs
        maxItems={maxItems}
        separator={
          <NavigateNextIcon
            fontSize="small"
            sx={{ color: 'text.secondary' }}
            aria-hidden="true"
          />
        }
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-ol': {
            flexWrap: 'wrap',
          },
          '& .MuiBreadcrumbs-li': {
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          if (isLast || !item.href) {
            return (
              <Typography
                key={item.href || item.label}
                color="text.primary"
                variant="body2"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                }}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.icon}
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={item.href}
              component={RouterLink}
              to={item.href}
              underline="hover"
              color="text.secondary"
              variant="body2"
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
                transition: 'color 0.2s ease',
                '&:hover': {
                  color: 'primary.main',
                },
                '&:focus': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: '2px',
                  borderRadius: '4px',
                },
              }}
              aria-label={`Navigate to ${item.label}`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;