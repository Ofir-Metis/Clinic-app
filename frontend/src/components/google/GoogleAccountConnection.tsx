/**
 * GoogleAccountConnection - Main component for managing Google account connections
 * Provides OAuth flow, account status, and permission management for coaches
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Google as GoogleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CalendarMonth as CalendarIcon,
  Email as EmailIcon,
  VideoCall as VideoCallIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { API_URL } from '../../env';

export interface GoogleAccount {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  isActive: boolean;
  calendarSyncEnabled: boolean;
  emailSyncEnabled: boolean;
  connectedAt: string;
  lastSyncAt?: string;
  syncStatus: 'active' | 'error' | 'pending' | 'disabled';
  permissions: {
    calendar: boolean;
    email: boolean;
    meet: boolean;
  };
  stats: {
    eventsCreated: number;
    emailsSent: number;
    lastActivity: string;
  };
}

interface GoogleAccountConnectionProps {
  onAccountConnected?: (account: GoogleAccount) => void;
  onAccountDisconnected?: (accountId: string) => void;
  currentUserId: string;
}

export const GoogleAccountConnection: React.FC<GoogleAccountConnectionProps> = ({
  onAccountConnected,
  onAccountDisconnected,
  currentUserId
}) => {
  const theme = useTheme();
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccount | null>(null);

  // Load connected Google accounts
  const loadAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/auth/google/integration-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clinic_access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load Google accounts');
      }

      const data = await response.json();
      setAccounts(data.integration?.connected ? [{
        id: 'primary',
        email: data.integration?.user?.email || '',
        name: data.integration?.user?.name || '',
        picture: '',
        connected: true,
        permissions: { calendar: true, email: true, meet: true },
        lastSynced: data.integration?.lastSync || new Date().toISOString(),
      }] : []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Start Google OAuth flow
  const handleConnectGoogle = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get OAuth URL from backend
      const response = await fetch(`${API_URL}/api/auth/google/authorize`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clinic_access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get OAuth URL');
      }

      const data = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start connection process');
      setIsConnecting(false);
    }
  };

  // Disconnect Google account
  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clinic_access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }

      // Remove from local state
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      
      if (onAccountDisconnected) {
        onAccountDisconnected(accountId);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect account');
    }
  };

  // Update account permissions
  const handlePermissionChange = async (
    accountId: string, 
    permission: keyof GoogleAccount['permissions'], 
    enabled: boolean
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google/validate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clinic_access_token')}`,
        },
        body: JSON.stringify({
          [permission]: enabled
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }

      // Update local state
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { 
              ...acc, 
              permissions: { ...acc.permissions, [permission]: enabled },
              calendarSyncEnabled: permission === 'calendar' ? enabled : acc.calendarSyncEnabled,
              emailSyncEnabled: permission === 'email' ? enabled : acc.emailSyncEnabled
            }
          : acc
      ));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
    }
  };

  // Get status color and icon
  const getStatusDisplay = (account: GoogleAccount) => {
    switch (account.syncStatus) {
      case 'active':
        return {
          color: theme.palette.success.main,
          icon: <CheckCircleIcon />,
          text: 'Connected & Syncing'
        };
      case 'error':
        return {
          color: theme.palette.error.main,
          icon: <ErrorIcon />,
          text: 'Sync Error'
        };
      case 'pending':
        return {
          color: theme.palette.warning.main,
          icon: <WarningIcon />,
          text: 'Sync Pending'
        };
      case 'disabled':
        return {
          color: theme.palette.grey[500],
          icon: <WarningIcon />,
          text: 'Sync Disabled'
        };
      default:
        return {
          color: theme.palette.grey[500],
          icon: <WarningIcon />,
          text: 'Unknown'
        };
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3, mb: 2 }} />
        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Connection Status Cards */}
      {accounts.length === 0 ? (
        <Card
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.85) 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid rgba(255, 255, 255, 0.25)`,
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)',
            mb: 3
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box
              sx={{
                mb: 3,
                p: 3,
                borderRadius: '50%',
                backgroundColor: `${theme.palette.primary.main}15`,
                color: theme.palette.primary.main,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <GoogleIcon sx={{ fontSize: 48 }} />
            </Box>
            
            <Typography variant="h5" fontWeight={600} mb={2}>
              Connect Your Google Account
            </Typography>
            
            <Typography variant="body1" color="text.secondary" mb={3} maxWidth={400} mx="auto">
              Connect your Google account to enable automatic calendar scheduling, Google Meet links, 
              and seamless client communication for your coaching sessions.
            </Typography>

            <Stack direction="row" spacing={2} justifyContent="center" mb={3}>
              <Chip 
                icon={<CalendarIcon />} 
                label="Calendar Sync" 
                variant="outlined" 
                color="primary" 
              />
              <Chip 
                icon={<VideoCallIcon />} 
                label="Google Meet Links" 
                variant="outlined" 
                color="primary" 
              />
              <Chip 
                icon={<EmailIcon />} 
                label="Email Integration" 
                variant="outlined" 
                color="primary" 
              />
            </Stack>

            <Button
              variant="contained"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleConnectGoogle}
              disabled={isConnecting}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1.1rem'
              }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Google Account'}
            </Button>

            {isConnecting && (
              <Box mt={2}>
                <LinearProgress sx={{ borderRadius: 1 }} />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Redirecting to Google for authorization...
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={3}>
          {accounts.map((account) => {
            const statusDisplay = getStatusDisplay(account);
            
            return (
              <Card
                key={account.id}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.85) 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid rgba(255, 255, 255, 0.25)`,
                  borderRadius: 3,
                  boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={3}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: `${theme.palette.primary.main}15`,
                          color: theme.palette.primary.main,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {account.profilePicture ? (
                          <img 
                            src={account.profilePicture} 
                            alt={account.name}
                            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                          />
                        ) : (
                          <GoogleIcon />
                        )}
                      </Box>
                      
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {account.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {account.email}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <Box
                            sx={{
                              color: statusDisplay.color,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            {React.cloneElement(statusDisplay.icon, { fontSize: 'small' })}
                          </Box>
                          <Typography variant="caption" color={statusDisplay.color}>
                            {statusDisplay.text}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                      <Tooltip title="Refresh sync status">
                        <IconButton size="small" onClick={loadAccounts}>
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Manage permissions">
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowPermissionsDialog(true);
                          }}
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Disconnect account">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDisconnectAccount(account.id)}
                        >
                          <LogoutIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Quick Permission Toggles */}
                  <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={account.calendarSyncEnabled}
                          onChange={(e) => handlePermissionChange(account.id, 'calendar', e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarIcon fontSize="small" />
                          <Typography variant="body2">Calendar Sync</Typography>
                        </Box>
                      }
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={account.emailSyncEnabled}
                          onChange={(e) => handlePermissionChange(account.id, 'email', e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <EmailIcon fontSize="small" />
                          <Typography variant="body2">Email Integration</Typography>
                        </Box>
                      }
                    />
                  </Box>

                  {/* Stats */}
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    sx={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.02)', 
                      borderRadius: 2, 
                      p: 2 
                    }}
                  >
                    <Box textAlign="center">
                      <Typography variant="h6" color="primary.main">
                        {account.stats.eventsCreated}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Events Created
                      </Typography>
                    </Box>
                    
                    <Box textAlign="center">
                      <Typography variant="h6" color="primary.main">
                        {account.stats.emailsSent}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Emails Sent
                      </Typography>
                    </Box>
                    
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        Last sync: {new Date(account.lastSyncAt || account.connectedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}

          {/* Add Another Account Button */}
          <Button
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleConnectGoogle}
            disabled={isConnecting}
            sx={{
              borderRadius: 2,
              py: 1.5,
              textTransform: 'none',
              borderStyle: 'dashed',
              '&:hover': {
                borderStyle: 'solid'
              }
            }}
          >
            Connect Another Google Account
          </Button>
        </Stack>
      )}

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ mt: 2, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Permissions Management Dialog */}
      <Dialog
        open={showPermissionsDialog}
        onClose={() => setShowPermissionsDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.95) 100%)`,
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <SettingsIcon color="primary" />
            <Box>
              <Typography variant="h6">Manage Permissions</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAccount?.email}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <List>
            <ListItem>
              <ListItemIcon>
                <CalendarIcon color={selectedAccount?.permissions.calendar ? 'primary' : 'disabled'} />
              </ListItemIcon>
              <ListItemText
                primary="Calendar Access"
                secondary="Create events, manage schedule, generate Google Meet links"
              />
              <Switch
                checked={selectedAccount?.permissions.calendar || false}
                onChange={(e) => selectedAccount && handlePermissionChange(selectedAccount.id, 'calendar', e.target.checked)}
                color="primary"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <EmailIcon color={selectedAccount?.permissions.email ? 'primary' : 'disabled'} />
              </ListItemIcon>
              <ListItemText
                primary="Email Access"
                secondary="Send appointment reminders and coaching updates"
              />
              <Switch
                checked={selectedAccount?.permissions.email || false}
                onChange={(e) => selectedAccount && handlePermissionChange(selectedAccount.id, 'email', e.target.checked)}
                color="primary"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <VideoCallIcon color={selectedAccount?.permissions.meet ? 'primary' : 'disabled'} />
              </ListItemIcon>
              <ListItemText
                primary="Google Meet Access"
                secondary="Automatically create meet links for virtual sessions"
              />
              <Switch
                checked={selectedAccount?.permissions.meet || false}
                onChange={(e) => selectedAccount && handlePermissionChange(selectedAccount.id, 'meet', e.target.checked)}
                color="primary"
              />
            </ListItem>
          </List>

          <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2, borderRadius: 2 }}>
            Changes to permissions may require re-authorization with Google. You'll be redirected if additional permissions are needed.
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowPermissionsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};