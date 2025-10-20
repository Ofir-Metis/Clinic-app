/**
 * SystemSettings - System configuration and settings component
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Extension as IntegrationsIcon,
  Notifications as NotificationsIcon,
  Build as MaintenanceIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Backup as BackupIcon,
  CleaningServices as CleanupIcon,
  Tune as OptimizeIcon,
  ClearAll as ClearCacheIcon,
} from '@mui/icons-material';
import { useAdminData } from '../../hooks/useAdminData';

const SystemSettings: React.FC = () => {
  const { getSystemConfig, updateSystemConfig, executeMaintenanceTask } = useAdminData();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [selectedMaintenanceTask, setSelectedMaintenanceTask] = useState<string | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const configData = await getSystemConfig();
      setConfig(configData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateSystemConfig(config);
      setSuccess('Configuration updated successfully');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (section: string, key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleMaintenanceTask = (task: string) => {
    setSelectedMaintenanceTask(task);
    setMaintenanceDialogOpen(true);
  };

  const executeTask = async () => {
    if (!selectedMaintenanceTask) return;

    setMaintenanceLoading(true);
    setError(null);

    try {
      const result = await executeMaintenanceTask(selectedMaintenanceTask as any);
      setSuccess(`${selectedMaintenanceTask} completed successfully`);
      setMaintenanceDialogOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Maintenance task failed');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return (
      <Alert severity="error">
        Failed to load system configuration
      </Alert>
    );
  }

  const maintenanceTasks = [
    {
      id: 'cleanup-logs',
      title: 'Cleanup Old Logs',
      description: 'Remove log entries older than 30 days',
      icon: <CleanupIcon />,
    },
    {
      id: 'optimize-db',
      title: 'Optimize Database',
      description: 'Optimize database tables and indices',
      icon: <OptimizeIcon />,
    },
    {
      id: 'clear-cache',
      title: 'Clear System Cache',
      description: 'Clear all cached data and temporary files',
      icon: <ClearCacheIcon />,
    },
    {
      id: 'backup-data',
      title: 'Backup System Data',
      description: 'Create a full system backup',
      icon: <BackupIcon />,
    },
  ];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Feature Flags */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon />
                Feature Settings
              </Typography>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.features.maintenanceMode}
                      onChange={(e) => handleConfigChange('features', 'maintenanceMode', e.target.checked)}
                    />
                  }
                  label="Maintenance Mode"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Disable user access for system maintenance
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.features.registrationEnabled}
                      onChange={(e) => handleConfigChange('features', 'registrationEnabled', e.target.checked)}
                    />
                  }
                  label="User Registration"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Allow new user registrations
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.features.emailVerificationRequired}
                      onChange={(e) => handleConfigChange('features', 'emailVerificationRequired', e.target.checked)}
                    />
                  }
                  label="Email Verification Required"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Require email verification for new accounts
                </Typography>
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.features.twoFactorAuthEnabled}
                      onChange={(e) => handleConfigChange('features', 'twoFactorAuthEnabled', e.target.checked)}
                    />
                  }
                  label="Two-Factor Authentication"
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  Enable 2FA for enhanced security
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* System Limits */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon />
                System Limits
              </Typography>

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Max Users per Therapist"
                  type="number"
                  value={config.limits.maxUsersPerTherapist}
                  onChange={(e) => handleConfigChange('limits', 'maxUsersPerTherapist', parseInt(e.target.value))}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Max Sessions per Day"
                  type="number"
                  value={config.limits.maxSessionsPerDay}
                  onChange={(e) => handleConfigChange('limits', 'maxSessionsPerDay', parseInt(e.target.value))}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="File Upload Size (MB)"
                  type="number"
                  value={config.limits.fileUploadSizeMB}
                  onChange={(e) => handleConfigChange('limits', 'fileUploadSizeMB', parseInt(e.target.value))}
                  size="small"
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  label="API Rate Limit (requests/hour)"
                  type="number"
                  value={config.limits.apiRateLimit}
                  onChange={(e) => handleConfigChange('limits', 'apiRateLimit', parseInt(e.target.value))}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Integrations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <IntegrationsIcon />
                External Integrations
              </Typography>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.integrations.openaiEnabled}
                      onChange={(e) => handleConfigChange('integrations', 'openaiEnabled', e.target.checked)}
                    />
                  }
                  label="OpenAI Integration"
                />
                <Chip label="AI Services" size="small" color="primary" variant="outlined" sx={{ ml: 1 }} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.integrations.twilioEnabled}
                      onChange={(e) => handleConfigChange('integrations', 'twilioEnabled', e.target.checked)}
                    />
                  }
                  label="Twilio Integration"
                />
                <Chip label="SMS" size="small" color="secondary" variant="outlined" sx={{ ml: 1 }} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.integrations.stripeEnabled}
                      onChange={(e) => handleConfigChange('integrations', 'stripeEnabled', e.target.checked)}
                    />
                  }
                  label="Stripe Integration"
                />
                <Chip label="Payments" size="small" color="success" variant="outlined" sx={{ ml: 1 }} />
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.integrations.googleOAuthEnabled}
                      onChange={(e) => handleConfigChange('integrations', 'googleOAuthEnabled', e.target.checked)}
                    />
                  }
                  label="Google OAuth"
                />
                <Chip label="Authentication" size="small" color="info" variant="outlined" sx={{ ml: 1 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon />
                Notification Settings
              </Typography>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notifications.emailEnabled}
                      onChange={(e) => handleConfigChange('notifications', 'emailEnabled', e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notifications.smsEnabled}
                      onChange={(e) => handleConfigChange('notifications', 'smsEnabled', e.target.checked)}
                    />
                  }
                  label="SMS Notifications"
                />
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notifications.pushEnabled}
                      onChange={(e) => handleConfigChange('notifications', 'pushEnabled', e.target.checked)}
                    />
                  }
                  label="Push Notifications"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Tasks */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MaintenanceIcon />
                System Maintenance
              </Typography>

              <Grid container spacing={2}>
                {maintenanceTasks.map((task) => (
                  <Grid item xs={12} sm={6} md={3} key={task.id}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Box sx={{ mb: 2 }}>
                          {task.icon}
                        </Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          {task.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                          {task.description}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleMaintenanceTask(task.id)}
                          fullWidth
                        >
                          Execute
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>

      {/* Maintenance Task Confirmation Dialog */}
      <Dialog open={maintenanceDialogOpen} onClose={() => setMaintenanceDialogOpen(false)}>
        <DialogTitle>
          Confirm Maintenance Task
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to execute the following maintenance task?
          </Typography>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {maintenanceTasks.find(t => t.id === selectedMaintenanceTask)?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {maintenanceTasks.find(t => t.id === selectedMaintenanceTask)?.description}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action may temporarily affect system performance.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintenanceDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={executeTask}
            variant="contained"
            disabled={maintenanceLoading}
          >
            {maintenanceLoading ? 'Executing...' : 'Execute Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSettings;