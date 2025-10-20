import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  useTheme,
  alpha,
  SvgIcon,
} from '@mui/material';
import {
  People as PeopleIcon,
  Event as EventIcon,
  Notes as NotesIcon,
  Assessment as AssessmentIcon,
  Inbox as InboxIcon,
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material';

interface EmptyStateProps {
  variant?: 
    | 'appointments' 
    | 'patients' 
    | 'notes' 
    | 'analytics' 
    | 'search' 
    | 'notifications' 
    | 'goals'
    | 'default';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  title,
  message,
  actionLabel,
  onAction,
  showIcon = true,
  size = 'medium'
}) => {
  const theme = useTheme();

  const getEmptyStateConfig = () => {
    const configs = {
      appointments: {
        icon: EventIcon,
        title: title || 'No appointments scheduled',
        message: message || 'Get started by scheduling your first coaching session. Click below to add a new appointment.',
        actionLabel: actionLabel || 'Schedule Appointment',
        color: theme.palette.primary.main,
      },
      patients: {
        icon: PeopleIcon,
        title: title || 'No clients found',
        message: message || 'Start building your client base. Add your first client to begin their empowerment journey.',
        actionLabel: actionLabel || 'Add Client',
        color: theme.palette.secondary.main,
      },
      notes: {
        icon: NotesIcon,
        title: title || 'No session notes yet',
        message: message || 'Document your coaching sessions to track client progress and insights.',
        actionLabel: actionLabel || 'Create Note',
        color: theme.palette.info.main,
      },
      analytics: {
        icon: AssessmentIcon,
        title: title || 'No data to analyze',
        message: message || 'Analytics will appear here once you start conducting coaching sessions and tracking progress.',
        actionLabel: actionLabel || 'View Settings',
        color: theme.palette.warning.main,
      },
      search: {
        icon: SearchIcon,
        title: title || 'No results found',
        message: message || 'Try adjusting your search terms or filters to find what you\'re looking for.',
        actionLabel: actionLabel || 'Clear Filters',
        color: theme.palette.text.secondary,
      },
      notifications: {
        icon: InboxIcon,
        title: title || 'All caught up!',
        message: message || 'You have no new notifications. We\'ll notify you when something important happens.',
        actionLabel: actionLabel || 'View Settings',
        color: theme.palette.success.main,
      },
      goals: {
        icon: AssessmentIcon,
        title: title || 'No goals set yet',
        message: message || 'Help your clients achieve their potential by setting meaningful, actionable goals.',
        actionLabel: actionLabel || 'Create Goal',
        color: theme.palette.primary.main,
      },
      default: {
        icon: InboxIcon,
        title: title || 'Nothing here yet',
        message: message || 'This area will populate with content as you use the platform.',
        actionLabel: actionLabel || 'Get Started',
        color: theme.palette.text.secondary,
      },
    };

    return configs[variant] || configs.default;
  };

  const config = getEmptyStateConfig();
  const IconComponent = config.icon;

  const sizeConfig = {
    small: {
      iconSize: 48,
      titleVariant: 'h6' as const,
      messageVariant: 'body2' as const,
      spacing: 2,
      maxWidth: 300,
    },
    medium: {
      iconSize: 64,
      titleVariant: 'h5' as const,
      messageVariant: 'body1' as const,
      spacing: 3,
      maxWidth: 400,
    },
    large: {
      iconSize: 80,
      titleVariant: 'h4' as const,
      messageVariant: 'body1' as const,
      spacing: 4,
      maxWidth: 500,
    },
  };

  const { iconSize, titleVariant, messageVariant, spacing, maxWidth } = sizeConfig[size];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 4,
        minHeight: { xs: '200px', sm: '300px', md: '400px' },
        maxWidth,
        mx: 'auto',
      }}
    >
      {showIcon && (
        <Box
          sx={{
            width: iconSize + 24,
            height: iconSize + 24,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha(config.color, 0.1),
            mb: spacing,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(config.color, 0.05)} 0%, ${alpha(config.color, 0.15)} 100%)`,
            }
          }}
        >
          <SvgIcon
            component={IconComponent}
            sx={{
              fontSize: iconSize,
              color: config.color,
              position: 'relative',
              zIndex: 1,
            }}
          />
        </Box>
      )}

      <Stack spacing={spacing} alignItems="center" sx={{ width: '100%' }}>
        <Typography
          variant={titleVariant}
          component="h3"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 0.5,
          }}
        >
          {config.title}
        </Typography>

        <Typography
          variant={messageVariant}
          color="text.secondary"
          sx={{
            lineHeight: 1.6,
            maxWidth: '100%',
          }}
        >
          {config.message}
        </Typography>

        {onAction && config.actionLabel && (
          <Button
            variant="contained"
            onClick={onAction}
            startIcon={<AddIcon />}
            sx={{
              mt: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              py: 1,
              background: `linear-gradient(45deg, ${config.color} 30%, ${alpha(config.color, 0.8)} 90%)`,
              boxShadow: `0 4px 20px ${alpha(config.color, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(45deg, ${alpha(config.color, 0.9)} 30%, ${alpha(config.color, 0.7)} 90%)`,
                boxShadow: `0 6px 25px ${alpha(config.color, 0.4)}`,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {config.actionLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default EmptyState;