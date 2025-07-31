/**
 * GoogleIntegrationSettings - Settings page section for Google integrations
 * Combines account connection with advanced configuration options
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Google as GoogleIcon,
  Calendar as CalendarIcon,
  Email as EmailIcon,
  VideoCall as VideoCallIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { GoogleAccountConnection, GoogleAccount } from './GoogleAccountConnection';

interface GoogleIntegrationConfig {
  automaticCalendarSync: boolean;
  defaultMeetingDuration: number;
  sendReminderEmails: boolean;
  reminderTimeBefore: number; // hours
  includeClientInCalendar: boolean;
  autoGenerateMeetLinks: boolean;
  useCustomEmailTemplates: boolean;
  syncBidirectional: boolean;
  conflictResolution: 'manual' | 'automatic' | 'notify';
  notificationPreferences: {
    syncErrors: boolean;
    accountExpiry: boolean;
    permissionChanges: boolean;
    weeklyDigest: boolean;
  };
}

interface GoogleIntegrationSettingsProps {
  currentUserId: string;
  onConfigChange?: (config: GoogleIntegrationConfig) => void;
}

export const GoogleIntegrationSettings: React.FC<GoogleIntegrationSettingsProps> = ({
  currentUserId,
  onConfigChange
}) => {
  const theme = useTheme();
  const [config, setConfig] = useState<GoogleIntegrationConfig>({
    automaticCalendarSync: true,
    defaultMeetingDuration: 60,
    sendReminderEmails: true,
    reminderTimeBefore: 24,
    includeClientInCalendar: true,
    autoGenerateMeetLinks: true,
    useCustomEmailTemplates: false,
    syncBidirectional: false,
    conflictResolution: 'manual',
    notificationPreferences: {
      syncErrors: true,
      accountExpiry: true,
      permissionChanges: true,
      weeklyDigest: false
    }
  });

  const [connectedAccounts, setConnectedAccounts] = useState<GoogleAccount[]>([]);
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfigChange = (key: keyof GoogleIntegrationConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const handleNotificationChange = (key: keyof GoogleIntegrationConfig['notificationPreferences'], value: boolean) => {
    const newConfig = {
      ...config,
      notificationPreferences: {
        ...config.notificationPreferences,
        [key]: value
      }
    };
    setConfig(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig);
    }
  };

  const handleAccountConnected = (account: GoogleAccount) => {
    setConnectedAccounts(prev => [...prev, account]);
  };

  const handleAccountDisconnected = (accountId: string) => {
    setConnectedAccounts(prev => prev.filter(acc => acc.id !== accountId));
  };

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/google/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          userId: currentUserId,
          config
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      // Show success message
    } catch (error) {
      console.error('Failed to save configuration:', error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };

  const hasActiveAccount = connectedAccounts.some(acc => acc.isActive);

  return (
    <Box>
      {/* Main Google Account Connection */}
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
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <GoogleIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Google Integration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connect your Google account to enable calendar sync and automatic Meet links
              </Typography>
            </Box>
          </Box>

          <GoogleAccountConnection
            currentUserId={currentUserId}
            onAccountConnected={handleAccountConnected}
            onAccountDisconnected={handleAccountDisconnected}
          />
        </CardContent>
      </Card>

      {/* Configuration Options (only shown when account is connected) */}
      {hasActiveAccount && (
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
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Integration Settings
            </Typography>

            {/* Core Settings */}
            <Stack spacing={2} mb={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.automaticCalendarSync}
                    onChange={(e) => handleConfigChange('automaticCalendarSync', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Automatic Calendar Sync
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Automatically create calendar events for all coaching sessions
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.autoGenerateMeetLinks}
                    onChange={(e) => handleConfigChange('autoGenerateMeetLinks', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Auto-Generate Google Meet Links
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Automatically create Meet links for virtual coaching sessions
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.sendReminderEmails}
                    onChange={(e) => handleConfigChange('sendReminderEmails', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Send Email Reminders
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Send automatic reminders to clients before sessions
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={config.includeClientInCalendar}
                    onChange={(e) => handleConfigChange('includeClientInCalendar', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Include Clients in Calendar Events
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Add clients as attendees to calendar events (requires client email)
                    </Typography>
                  </Box>
                }
              />
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Quick Settings */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" gap={1}>
                <TextField
                  label="Default Session Duration"
                  type="number"
                  value={config.defaultMeetingDuration}
                  onChange={(e) => handleConfigChange('defaultMeetingDuration', parseInt(e.target.value))}
                  InputProps={{ endAdornment: 'minutes' }}
                  size="small"
                  sx={{ width: 180 }}
                />

                <TextField
                  label="Reminder Time"
                  type="number"
                  value={config.reminderTimeBefore}
                  onChange={(e) => handleConfigChange('reminderTimeBefore', parseInt(e.target.value))}
                  InputProps={{ endAdornment: 'hours before' }}
                  size="small"
                  sx={{ width: 160 }}
                />
              </Box>

              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setShowAdvancedDialog(true)}
                sx={{ borderRadius: 2 }}
              >
                Advanced Settings
              </Button>
            </Box>

            {/* Integration Status */}
            <Alert 
              severity="success" 
              icon={<SyncIcon />}
              sx={{ borderRadius: 2 }}
            >
              <Typography variant="body2" fontWeight={600} mb={1}>
                Google Integration Active
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip size="small" label="Calendar Sync" color="success" variant="filled" />
                <Chip size="small" label="Meet Links" color="success" variant="filled" />
                <Chip size="small" label="Email Reminders" color="success" variant="filled" />
              </Stack>
            </Alert>

            {/* Save Button */}
            <Box mt={3} textAlign="right">
              <Button
                variant="contained"
                onClick={saveConfiguration}
                disabled={isSaving}
                sx={{ borderRadius: 2, px: 3 }}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Help & Troubleshooting */}
      <Card
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.85) 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(255, 255, 255, 0.25)`,
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <HelpIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Help & Support
            </Typography>
          </Box>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" fontWeight={500}>
                What permissions does the app need?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                We request calendar access to create events and Meet links, and email permissions 
                to send reminders. All data is encrypted and never shared with third parties.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" fontWeight={500}>
                Calendar events not syncing?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Check that calendar sync is enabled and you've granted the necessary permissions. 
                Try disconnecting and reconnecting your account if issues persist.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" fontWeight={500}>
                Google Meet links not generating?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Ensure you have Meet permissions enabled and automatic link generation is turned on. 
                Meet links are only created for virtual coaching sessions.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Advanced Settings Dialog */}
      <Dialog
        open={showAdvancedDialog}
        onClose={() => setShowAdvancedDialog(false)}
        maxWidth="md"
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
            <Typography variant="h6">Advanced Google Integration Settings</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            {/* Sync Settings */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Sync Behavior
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.syncBidirectional}
                    onChange={(e) => handleConfigChange('syncBidirectional', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Bidirectional Sync</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sync changes from Google Calendar back to the coaching app
                    </Typography>
                  </Box>
                }
              />

              <TextField
                select
                label="Conflict Resolution"
                value={config.conflictResolution}
                onChange={(e) => handleConfigChange('conflictResolution', e.target.value)}
                fullWidth
                size="small"
                sx={{ mt: 2 }}
              >
                <MenuItem value="manual">Manual Resolution (ask me)</MenuItem>
                <MenuItem value="automatic">Automatic (app wins)</MenuItem>
                <MenuItem value="notify">Notify Only</MenuItem>
              </TextField>
            </Box>

            <Divider />

            {/* Notification Settings */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Notification Preferences
              </Typography>
              
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notificationPreferences.syncErrors}
                      onChange={(e) => handleNotificationChange('syncErrors', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Sync Error Notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notificationPreferences.accountExpiry}
                      onChange={(e) => handleNotificationChange('accountExpiry', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Account Expiry Warnings"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notificationPreferences.permissionChanges}
                      onChange={(e) => handleNotificationChange('permissionChanges', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Permission Change Alerts"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notificationPreferences.weeklyDigest}
                      onChange={(e) => handleNotificationChange('weeklyDigest', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Weekly Integration Summary"
                />
              </Stack>
            </Box>

            <Alert severity="info" icon={<InfoIcon />} sx={{ borderRadius: 2 }}>
              Advanced settings take effect immediately. Some changes may require re-authorization with Google.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowAdvancedDialog(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              saveConfiguration();
              setShowAdvancedDialog(false);
            }}
            sx={{ borderRadius: 2 }}
          >
            Save Advanced Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};