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
import { useTranslation } from '../contexts/LanguageContext';

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
  const { translations } = useTranslation();

  // Helper to get translation with fallback
  const getTranslation = (key: string, fallback: string) => {
    const emptyState = translations.emptyState as Record<string, Record<string, string>> | undefined;
    const variantTranslations = emptyState?.[variant];
    return variantTranslations?.[key] || fallback;
  };

  const getEmptyStateConfig = () => {
    const configs = {
      appointments: {
        icon: EventIcon,
        title: title || getTranslation('title', 'No appointments scheduled'),
        message: message || getTranslation('message', 'Get started by scheduling your first coaching session. Click below to add a new appointment.'),
        actionLabel: actionLabel || getTranslation('action', 'Schedule Appointment'),
        color: theme.palette.primary.main,
      },
      patients: {
        icon: PeopleIcon,
        title: title || getTranslation('title', 'No clients found'),
        message: message || getTranslation('message', 'Start building your client base. Add your first client to begin their empowerment journey.'),
        actionLabel: actionLabel || getTranslation('action', 'Add Client'),
        color: theme.palette.secondary.main,
      },
      notes: {
        icon: NotesIcon,
        title: title || getTranslation('title', 'No session notes yet'),
        message: message || getTranslation('message', 'Document your coaching sessions to track client progress and insights.'),
        actionLabel: actionLabel || getTranslation('action', 'Create Note'),
        color: theme.palette.info.main,
      },
      analytics: {
        icon: AssessmentIcon,
        title: title || getTranslation('title', 'No data to analyze'),
        message: message || getTranslation('message', 'Analytics will appear here once you start conducting coaching sessions and tracking progress.'),
        actionLabel: actionLabel || getTranslation('action', 'View Settings'),
        color: theme.palette.warning.main,
      },
      search: {
        icon: SearchIcon,
        title: title || getTranslation('title', 'No results found'),
        message: message || getTranslation('message', 'Try adjusting your search terms or filters to find what you\'re looking for.'),
        actionLabel: actionLabel || getTranslation('action', 'Clear Filters'),
        color: theme.palette.text.secondary,
      },
      notifications: {
        icon: InboxIcon,
        title: title || getTranslation('title', 'All caught up!'),
        message: message || getTranslation('message', 'You have no new notifications. We\'ll notify you when something important happens.'),
        actionLabel: actionLabel || getTranslation('action', 'View Settings'),
        color: theme.palette.success.main,
      },
      goals: {
        icon: AssessmentIcon,
        title: title || getTranslation('title', 'No goals set yet'),
        message: message || getTranslation('message', 'Help your clients achieve their potential by setting meaningful, actionable goals.'),
        actionLabel: actionLabel || getTranslation('action', 'Create Goal'),
        color: theme.palette.primary.main,
      },
      default: {
        icon: InboxIcon,
        title: title || getTranslation('title', 'Nothing here yet'),
        message: message || getTranslation('message', 'This area will populate with content as you use the platform.'),
        actionLabel: actionLabel || getTranslation('action', 'Get Started'),
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