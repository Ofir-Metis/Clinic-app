/**
 * GoogleIntegrationStatus - Status indicator component for Google integration health
 * Shows connection status, last sync time, and quick diagnostic information
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Stack,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Sync as SyncIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface GoogleIntegrationStatusProps {
  isConnected: boolean;
  hasPermissions: {
    calendar: boolean;
    email: boolean;
    meet: boolean;
  };
  lastSyncTime?: string;
  syncStatus: 'active' | 'syncing' | 'error' | 'pending' | 'disabled';
  stats?: {
    eventsCreated: number;
    emailsSent: number;
    meetLinksGenerated: number;
  };
  errors?: string[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const GoogleIntegrationStatus: React.FC<GoogleIntegrationStatusProps> = ({
  isConnected,
  hasPermissions,
  lastSyncTime,
  syncStatus,
  stats,
  errors = [],
  onRefresh,
  isRefreshing = false
}) => {
  const theme = useTheme();

  const getStatusConfig = () => {
    if (!isConnected) {
      return {
        color: theme.palette.grey[500],
        icon: <InfoIcon />,
        text: 'Not Connected',
        severity: 'info' as const,
        description: 'Connect your Google account to enable features'
      };
    }

    switch (syncStatus) {
      case 'active':
        return {
          color: theme.palette.success.main,
          icon: <CheckCircleIcon />,
          text: 'Active & Syncing',
          severity: 'success' as const,
          description: 'All systems operational'
        };
      case 'syncing':
        return {
          color: theme.palette.info.main,
          icon: <SyncIcon />,
          text: 'Syncing...',
          severity: 'info' as const,
          description: 'Synchronizing with Google services'
        };
      case 'error':
        return {
          color: theme.palette.error.main,
          icon: <ErrorIcon />,
          text: 'Sync Error',
          severity: 'error' as const,
          description: 'Issues detected with Google integration'
        };
      case 'pending':
        return {
          color: theme.palette.warning.main,
          icon: <WarningIcon />,
          text: 'Sync Pending',
          severity: 'warning' as const,
          description: 'Waiting for sync to complete'
        };
      case 'disabled':
        return {
          color: theme.palette.grey[500],
          icon: <WarningIcon />,
          text: 'Sync Disabled',
          severity: 'warning' as const,
          description: 'Google integration is disabled'
        };
      default:
        return {
          color: theme.palette.grey[500],
          icon: <InfoIcon />,
          text: 'Unknown Status',
          severity: 'info' as const,
          description: 'Unable to determine sync status'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const permissionCount = Object.values(hasPermissions).filter(Boolean).length;
  const totalPermissions = Object.keys(hasPermissions).length;

  const formatLastSync = (syncTime?: string) => {
    if (!syncTime) return 'Never';
    
    const now = new Date();
    const sync = new Date(syncTime);
    const diffMs = now.getTime() - sync.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return sync.toLocaleDateString();
  };

  const getPermissionChips = () => {
    const permissions = [
      { key: 'calendar', label: 'Calendar', enabled: hasPermissions.calendar },
      { key: 'email', label: 'Email', enabled: hasPermissions.email },
      { key: 'meet', label: 'Meet', enabled: hasPermissions.meet },
    ];

    return permissions.map(({ key, label, enabled }) => (
      <Chip
        key={key}
        label={label}
        size="small"
        color={enabled ? 'success' : 'default'}
        variant={enabled ? 'filled' : 'outlined'}
        sx={{ 
          fontSize: '0.75rem',
          height: 24,
          '& .MuiChip-label': {
            px: 1
          }
        }}
      />
    ));
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.85) 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid rgba(255, 255, 255, 0.25)`,
        borderRadius: 3,
        boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                color: statusConfig.color,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {React.cloneElement(statusConfig.icon, { fontSize: 'medium' })}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Google Integration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statusConfig.description}
              </Typography>
            </Box>
          </Box>

          {onRefresh && (
            <Tooltip title="Refresh status">
              <IconButton
                onClick={onRefresh}
                disabled={isRefreshing}
                size="small"
              >
                <RefreshIcon
                  sx={{
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Sync Progress */}
        {syncStatus === 'syncing' && (
          <Box mb={2}>
            <LinearProgress 
              sx={{ 
                borderRadius: 1,
                height: 6,
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1,
                }
              }} 
            />
          </Box>
        )}

        {/* Status Alert */}
        <Alert 
          severity={statusConfig.severity}
          icon={React.cloneElement(statusConfig.icon, { fontSize: 'small' })}
          sx={{ 
            mb: 2, 
            borderRadius: 2,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
            <Typography variant="body2" fontWeight={600}>
              {statusConfig.text}
            </Typography>
            {lastSyncTime && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <ScheduleIcon fontSize="small" />
                <Typography variant="caption">
                  {formatLastSync(lastSyncTime)}
                </Typography>
              </Box>
            )}
          </Box>
        </Alert>

        {/* Permissions Status */}
        {isConnected && (
          <Box mb={2}>
            <Typography variant="body2" fontWeight={500} mb={1}>
              Permissions ({permissionCount}/{totalPermissions})
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {getPermissionChips()}
            </Stack>
          </Box>
        )}

        {/* Usage Stats */}
        {isConnected && stats && (
          <Box 
            display="flex" 
            justifyContent="space-between"
            sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.02)', 
              borderRadius: 2, 
              p: 2,
              mb: errors.length > 0 ? 2 : 0
            }}
          >
            <Box textAlign="center">
              <Typography variant="h6" color="primary.main" fontWeight={600}>
                {stats.eventsCreated}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Events Created
              </Typography>
            </Box>
            
            <Box textAlign="center">
              <Typography variant="h6" color="primary.main" fontWeight={600}>
                {stats.emailsSent}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Emails Sent
              </Typography>
            </Box>
            
            <Box textAlign="center">
              <Typography variant="h6" color="primary.main" fontWeight={600}>
                {stats.meetLinksGenerated}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Meet Links
              </Typography>
            </Box>
          </Box>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={600} mb={1}>
              Issues Detected:
            </Typography>
            <Stack spacing={0.5}>
              {errors.map((error, index) => (
                <Typography key={index} variant="body2" component="li">
                  {error}
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};