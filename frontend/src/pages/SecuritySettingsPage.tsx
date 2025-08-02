/**
 * SecuritySettingsPage - Advanced security management for admin users
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
  Switch,
  FormControlLabel,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Security as SecurityIcon,
  VpnKey as KeyIcon,
  DeviceHub as DeviceIcon,
  Event as EventIcon,
  Policy as PolicyIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

interface SecurityOverview {
  mfaStatus: {
    totalUsers: number;
    usersWithMFA: number;
    mfaMethods: Record<string, number>;
  };
  sessionSecurity: {
    activeSessions: number;
    averageSessionDuration: number;
    suspiciousSessions: number;
  };
  accessControl: {
    allowedIPs: string[];
    blockedIPs: string[];
    recentBlocks: number;
  };
  securityEvents: {
    totalToday: number;
    criticalEvents: number;
    unacknowledgedEvents: number;
  };
  compliance: {
    passwordPolicyCompliance: number;
    mfaCompliance: number;
    sessionTimeoutCompliance: number;
  };
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  email?: string;
  ipAddress: string;
  description: string;
  acknowledged: boolean;
}

interface SessionInfo {
  sessionId: string;
  userId: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  location: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

const SecuritySettingsPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for different sections
  const [securityOverview, setSecurityOverview] = useState<SecurityOverview | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false);
  const [ipManagementOpen, setIpManagementOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadSecurityData();
    }
  }, [user]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, eventsRes, sessionsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/security/overview`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/security/events?limit=50`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/security/sessions/all`, { headers: getAuthHeaders() }),
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setSecurityOverview(overviewData.data);
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setSecurityEvents(eventsData.data.events || []);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setActiveSessions(sessionsData.data.sessions || []);
      }
    } catch (err) {
      setError('Failed to load security data');
      console.error('Security data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon color="error" />;
      case 'high': return <WarningIcon color="warning" />;
      case 'medium': return <WarningIcon color="info" />;
      case 'low': return <CheckIcon color="success" />;
      default: return <CheckIcon />;
    }
  };

  const acknowledgeEvent = async (eventId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/security/events/${eventId}/acknowledge`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        await loadSecurityData();
      }
    } catch (err) {
      console.error('Failed to acknowledge event:', err);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/security/sessions/manage`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'terminate',
          sessionId,
          reason: 'Admin terminated session'
        }),
      });

      if (response.ok) {
        await loadSecurityData();
      }
    } catch (err) {
      console.error('Failed to terminate session:', err);
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
        <SecurityIcon fontSize="large" />
        Security Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<SecurityIcon />} />
        <Tab label="Multi-Factor Auth" icon={<KeyIcon />} />
        <Tab label="Active Sessions" icon={<DeviceIcon />} />
        <Tab label="Security Events" icon={<EventIcon />} />
        <Tab label="Access Control" icon={<BlockIcon />} />
        <Tab label="Policies" icon={<PolicyIcon />} />
      </Tabs>

      {/* Overview Tab */}
      {currentTab === 0 && securityOverview && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>MFA Status</Typography>
                <Typography variant="h3" color="primary">
                  {Math.round((securityOverview.mfaStatus.usersWithMFA / securityOverview.mfaStatus.totalUsers) * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {securityOverview.mfaStatus.usersWithMFA} of {securityOverview.mfaStatus.totalUsers} users
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active Sessions</Typography>
                <Typography variant="h3" color="primary">
                  {securityOverview.sessionSecurity.activeSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {securityOverview.sessionSecurity.suspiciousSessions} suspicious
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Security Events</Typography>
                <Typography variant="h3" color="primary">
                  {securityOverview.securityEvents.totalToday}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {securityOverview.securityEvents.criticalEvents} critical today
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Compliance Overview</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">Password Policy</Typography>
                    <Typography variant="h6" color="primary">
                      {securityOverview.compliance.passwordPolicyCompliance}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">MFA Compliance</Typography>
                    <Typography variant="h6" color="primary">
                      {securityOverview.compliance.mfaCompliance}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">Session Timeout</Typography>
                    <Typography variant="h6" color="primary">
                      {securityOverview.compliance.sessionTimeoutCompliance}%
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* MFA Tab */}
      {currentTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">Multi-Factor Authentication</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setMfaSetupOpen(true)}
                  >
                    Setup MFA
                  </Button>
                </Box>

                {securityOverview && (
                  <Grid container spacing={2}>
                    {Object.entries(securityOverview.mfaStatus.mfaMethods).map(([method, count]) => (
                      <Grid item xs={12} sm={6} md={3} key={method}>
                        <Box p={2} border={1} borderColor="divider" borderRadius={1}>
                          <Typography variant="subtitle2" textTransform="capitalize">
                            {method}
                          </Typography>
                          <Typography variant="h4" color="primary">
                            {count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            users
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Active Sessions Tab */}
      {currentTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Active Sessions</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Activity</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.sessionId}>
                      <TableCell>{session.email}</TableCell>
                      <TableCell>{session.ipAddress}</TableCell>
                      <TableCell>{session.location}</TableCell>
                      <TableCell>
                        {new Date(session.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(session.lastActivity).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => terminateSession(session.sessionId)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Security Events Tab */}
      {currentTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Security Events</Typography>
            <List>
              {securityEvents.map((event) => (
                <ListItem key={event.id} divider>
                  <Box display="flex" alignItems="center" mr={2}>
                    {getSeverityIcon(event.severity)}
                  </Box>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {event.description}
                        </Typography>
                        <Chip
                          label={event.severity}
                          size="small"
                          color={getSeverityColor(event.severity) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {event.email || 'Unknown user'} • {event.ipAddress} • {new Date(event.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {!event.acknowledged && (
                      <Button
                        size="small"
                        onClick={() => acknowledgeEvent(event.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Access Control Tab */}
      {currentTab === 4 && securityOverview && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Allowed IPs</Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setIpManagementOpen(true)}
                  >
                    Add IP
                  </Button>
                </Box>
                <List dense>
                  {securityOverview.accessControl.allowedIPs.map((ip, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={ip} />
                      <ListItemSecondaryAction>
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Blocked IPs</Typography>
                <List dense>
                  {securityOverview.accessControl.blockedIPs.map((ip, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={ip} />
                      <ListItemSecondaryAction>
                        <IconButton size="small">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Policies Tab */}
      {currentTab === 5 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Security Policies</Typography>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Security policy management is available in the full admin console.
                  These settings control password requirements, session timeouts, and access controls.
                </Alert>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Password Policy</Typography>
                    <FormControlLabel
                      control={<Switch checked={true} />}
                      label="Require uppercase letters"
                    />
                    <FormControlLabel
                      control={<Switch checked={true} />}
                      label="Require special characters"
                    />
                    <FormControlLabel
                      control={<Switch checked={true} />}
                      label="Require numbers"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>Session Policy</Typography>
                    <FormControlLabel
                      control={<Switch checked={true} />}
                      label="Require MFA for admin users"
                    />
                    <FormControlLabel
                      control={<Switch checked={false} />}
                      label="Force logout on suspicious activity"
                    />
                    <TextField
                      label="Session timeout (hours)"
                      type="number"
                      defaultValue={8}
                      size="small"
                      sx={{ display: 'block', mt: 1 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* MFA Setup Dialog */}
      <Dialog open={mfaSetupOpen} onClose={() => setMfaSetupOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Setup Multi-Factor Authentication</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            MFA setup functionality will be implemented with proper TOTP library integration.
          </Alert>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>MFA Method</InputLabel>
            <Select value="totp" label="MFA Method">
              <MenuItem value="totp">TOTP (Authenticator App)</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="email">Email</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMfaSetupOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setMfaSetupOpen(false)}>
            Setup
          </Button>
        </DialogActions>
      </Dialog>

      {/* IP Management Dialog */}
      <Dialog open={ipManagementOpen} onClose={() => setIpManagementOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage IP Access</DialogTitle>
        <DialogContent>
          <TextField
            label="IP Address or Range"
            placeholder="192.168.1.0/24"
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Action</InputLabel>
            <Select value="allow" label="Action">
              <MenuItem value="allow">Allow</MenuItem>
              <MenuItem value="block">Block</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Reason"
            multiline
            rows={3}
            fullWidth
            placeholder="Optional reason for this access control rule"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIpManagementOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setIpManagementOpen(false)}>
            Add Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecuritySettingsPage;