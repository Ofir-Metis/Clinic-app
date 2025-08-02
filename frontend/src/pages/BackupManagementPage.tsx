/**
 * BackupManagementPage - System backup and disaster recovery management
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  Alert,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Assessment as ReportIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  CloudDownload as DownloadIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

interface BackupOverview {
  totalBackups: number;
  totalSize: string;
  lastBackup: Date | null;
  nextScheduledBackup: Date | null;
  storageUsage: {
    used: string;
    available: string;
    percentage: number;
  };
  scheduleStatus: {
    enabled: number;
    disabled: number;
    lastRun: Date | null;
    nextRun: Date | null;
  };
  disasterRecovery: {
    plansCount: number;
    lastTest: Date | null;
    rtoCompliance: number;
    rpoCompliance: number;
  };
}

interface BackupInfo {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  size?: string;
  description?: string;
  createdBy: string;
  duration?: number;
  compression: boolean;
  encryption: boolean;
  retentionDays: number;
  verificationStatus?: 'pending' | 'verified' | 'failed';
}

const BackupManagementPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for different sections
  const [backupOverview, setBackupOverview] = useState<BackupOverview | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [createBackupOpen, setCreateBackupOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadBackupData();
    }
  }, [user]);

  const loadBackupData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, backupsRes, schedulesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/backup/overview`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/backup/list?limit=50`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/backup/schedules/list`, { headers: getAuthHeaders() }),
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setBackupOverview(overviewData.data);
      }

      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData.data.backups || []);
      }

      if (schedulesRes.ok) {
        const schedulesData = await schedulesRes.json();
        setSchedules(schedulesData.data || []);
      }
    } catch (err) {
      setError('Failed to load backup data');
      console.error('Backup data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'info';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <VerifiedIcon color="success" />;
      case 'running': return <CircularProgress size={20} />;
      case 'pending': return <WarningIcon color="warning" />;
      case 'failed': return <ErrorIcon color="error" />;
      default: return null;
    }
  };

  const createBackup = async (backupData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/backup/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(backupData),
      });

      if (response.ok) {
        await loadBackupData();
        setCreateBackupOpen(false);
      }
    } catch (err) {
      console.error('Failed to create backup:', err);
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/backup/${backupId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        await loadBackupData();
      }
    } catch (err) {
      console.error('Failed to delete backup:', err);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Box p={3}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <BackupIcon fontSize="large" />
        Backup & Disaster Recovery
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<BackupIcon />} />
        <Tab label="Backups" icon={<BackupIcon />} />
        <Tab label="Schedules" icon={<ScheduleIcon />} />
        <Tab label="Storage" icon={<StorageIcon />} />
        <Tab label="Disaster Recovery" icon={<SecurityIcon />} />
        <Tab label="Reports" icon={<ReportIcon />} />
      </Tabs>

      {/* Overview Tab */}
      {currentTab === 0 && backupOverview && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Backups</Typography>
                <Typography variant="h3" color="primary">
                  {backupOverview.totalBackups}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {backupOverview.totalSize} total size
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Storage Usage</Typography>
                <Typography variant="h3" color="primary">
                  {backupOverview.storageUsage.percentage}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={backupOverview.storageUsage.percentage} 
                  sx={{ mt: 1, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {backupOverview.storageUsage.used} / {backupOverview.storageUsage.used + backupOverview.storageUsage.available}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active Schedules</Typography>
                <Typography variant="h3" color="primary">
                  {backupOverview.scheduleStatus.enabled}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {backupOverview.scheduleStatus.disabled} disabled
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>DR Plans</Typography>
                <Typography variant="h3" color="primary">
                  {backupOverview.disasterRecovery.plansCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  RTO: {backupOverview.disasterRecovery.rtoCompliance}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Last Backup: {backupOverview.lastBackup ? new Date(backupOverview.lastBackup).toLocaleString() : 'Never'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Next Scheduled: {backupOverview.nextScheduledBackup ? new Date(backupOverview.nextScheduledBackup).toLocaleString() : 'Not scheduled'}
                  </Typography>
                  <Typography variant="body2">
                    Last DR Test: {backupOverview.disasterRecovery.lastTest ? new Date(backupOverview.disasterRecovery.lastTest).toLocaleDateString() : 'Never tested'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Backups Tab */}
      {currentTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Backup History</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateBackupOpen(true)}
            >
              Create Backup
            </Button>
          </Box>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Retention</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(backup.status)}
                          <Chip
                            label={backup.status}
                            size="small"
                            color={getStatusColor(backup.status) as any}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={backup.type}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(backup.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{backup.size || 'N/A'}</TableCell>
                      <TableCell>
                        {backup.duration ? `${Math.round(backup.duration / 60)}m` : 'N/A'}
                      </TableCell>
                      <TableCell>{backup.retentionDays} days</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setRestoreDialogOpen(true);
                          }}
                          disabled={backup.status !== 'completed'}
                        >
                          <RestoreIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteBackup(backup.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* Schedules Tab */}
      {currentTab === 2 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Backup Schedules</Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Schedule
            </Button>
          </Box>

          <Grid container spacing={3}>
            {schedules.map((schedule) => (
              <Grid item xs={12} md={6} key={schedule.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{schedule.name}</Typography>
                      <Switch checked={schedule.enabled} />
                    </Box>
                    <Typography variant="body2" gutterBottom>
                      <strong>Type:</strong> {schedule.type}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Schedule:</strong> {schedule.schedule}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Retention:</strong> {schedule.retentionDays} days
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Last Run:</strong> {schedule.lastRun ? new Date(schedule.lastRun).toLocaleString() : 'Never'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Next Run:</strong> {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString() : 'Not scheduled'}
                    </Typography>
                    <Box mt={2} display="flex" gap={1}>
                      {schedule.compression && <Chip label="Compressed" size="small" />}
                      {schedule.encryption && <Chip label="Encrypted" size="small" />}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Storage Tab */}
      {currentTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>Storage Management</Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Storage management features allow you to monitor backup storage usage,
            configure storage destinations, and manage retention policies.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Local Storage</Typography>
                  <LinearProgress variant="determinate" value={60} sx={{ mb: 2 }} />
                  <Typography variant="body2">
                    2.4 TB used of 4.0 TB available (60%)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Cloud Storage</Typography>
                  <Typography variant="body2" gutterBottom>AWS S3: Connected</Typography>
                  <Typography variant="body2" gutterBottom>Azure Blob: Connected</Typography>
                  <Typography variant="body2">Total Remote: 3.0 TB</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Disaster Recovery Tab */}
      {currentTab === 4 && (
        <Box>
          <Typography variant="h6" gutterBottom>Disaster Recovery Plans</Typography>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Regular testing of disaster recovery plans is essential for ensuring business continuity.
            Last test was performed 30 days ago.
          </Alert>
          
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Database Failure Recovery</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Recovery procedures for database server failures
              </Typography>
              
              <Stepper orientation="vertical">
                <Step>
                  <StepLabel>Assess Database Status</StepLabel>
                  <StepContent>
                    <Typography variant="body2">
                      Check database connectivity and identify failure type
                    </Typography>
                  </StepContent>
                </Step>
                <Step>
                  <StepLabel>Activate Standby Database</StepLabel>
                  <StepContent>
                    <Typography variant="body2">
                      Switch to standby database server
                    </Typography>
                  </StepContent>
                </Step>
                <Step>
                  <StepLabel>Restore from Latest Backup</StepLabel>
                  <StepContent>
                    <Typography variant="body2">
                      If standby is unavailable, restore from backup
                    </Typography>
                  </StepContent>
                </Step>
              </Stepper>

              <Box mt={3}>
                <Button variant="outlined" startIcon={<StartIcon />} sx={{ mr: 2 }}>
                  Test Plan
                </Button>
                <Button variant="outlined" startIcon={<ViewIcon />}>
                  View Details
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Reports Tab */}
      {currentTab === 5 && (
        <Box>
          <Typography variant="h6" gutterBottom>Backup Reports</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Success Rate</Typography>
                  <Typography variant="h3" color="success.main">
                    98.5%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last 30 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Average Duration</Typography>
                  <Typography variant="h3" color="primary">
                    45m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Full backup average
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Data Growth</Typography>
                  <Typography variant="h3" color="warning.main">
                    +12%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly increase
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Create Backup Dialog */}
      <Dialog open={createBackupOpen} onClose={() => setCreateBackupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Backup</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Backup Type</InputLabel>
            <Select value="full" label="Backup Type">
              <MenuItem value="full">Full Backup</MenuItem>
              <MenuItem value="incremental">Incremental Backup</MenuItem>
              <MenuItem value="differential">Differential Backup</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder="Optional description for this backup"
          />
          
          <TextField
            label="Retention Days"
            type="number"
            defaultValue={30}
            fullWidth
            sx={{ mb: 2 }}
          />
          
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Enable compression"
            sx={{ display: 'block', mb: 1 }}
          />
          
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Enable encryption"
            sx={{ display: 'block' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateBackupOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => createBackup({ type: 'full', compression: true, encryption: true, retentionDays: 30 })}
          >
            Start Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restore from Backup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>Warning:</strong> This operation will restore data from the selected backup.
            Current data may be overwritten. Please ensure you have a recent backup before proceeding.
          </Alert>
          
          {selectedBackup && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>Selected Backup:</Typography>
              <Typography variant="body2">
                {selectedBackup.description} ({new Date(selectedBackup.createdAt).toLocaleString()})
              </Typography>
            </Box>
          )}
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Target Environment</InputLabel>
            <Select value="current" label="Target Environment">
              <MenuItem value="current">Current Environment</MenuItem>
              <MenuItem value="staging">Staging Environment</MenuItem>
              <MenuItem value="test">Test Environment</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom>Restore Components:</Typography>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Database"
            sx={{ display: 'block' }}
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Files"
            sx={{ display: 'block' }}
          />
          <FormControlLabel
            control={<Switch />}
            label="Configuration"
            sx={{ display: 'block', mb: 2 }}
          />
          
          <TextField
            label="Confirmation Code"
            placeholder="Type CONFIRM_RESTORE to proceed"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning">
            Start Restore
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupManagementPage;