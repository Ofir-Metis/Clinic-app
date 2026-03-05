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
import { useAuth } from '../AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

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
  const { translations } = useTranslation();

  // Helper to safely access adminSecurity translations
  const t = translations.adminSecurity as Record<string, unknown> | undefined;
  const tabs = t?.tabs as Record<string, string> | undefined;
  const overview = t?.overview as Record<string, string> | undefined;
  const mfa = t?.mfa as Record<string, unknown> | undefined;
  const sessions = t?.sessions as Record<string, string> | undefined;
  const events = t?.events as Record<string, string> | undefined;
  const accessControl = t?.accessControl as Record<string, unknown> | undefined;
  const policies = t?.policies as Record<string, string> | undefined;
  const common = t?.common as Record<string, string> | undefined;

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
        {(t?.title as string) || 'Security Management'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label={tabs?.overview || 'Overview'} icon={<SecurityIcon />} />
        <Tab label={tabs?.mfa || 'Multi-Factor Auth'} icon={<KeyIcon />} />
        <Tab label={tabs?.sessions || 'Active Sessions'} icon={<DeviceIcon />} />
        <Tab label={tabs?.events || 'Security Events'} icon={<EventIcon />} />
        <Tab label={tabs?.accessControl || 'Access Control'} icon={<BlockIcon />} />
        <Tab label={tabs?.policies || 'Policies'} icon={<PolicyIcon />} />
      </Tabs>

      {/* Overview Tab */}
      {currentTab === 0 && securityOverview && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{overview?.mfaStatus || 'MFA Status'}</Typography>
                <Typography variant="h3" color="primary">
                  {Math.round((securityOverview.mfaStatus.usersWithMFA / securityOverview.mfaStatus.totalUsers) * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {securityOverview.mfaStatus.usersWithMFA} {(overview?.ofUsers || 'of {total} users').replace('{total}', String(securityOverview.mfaStatus.totalUsers))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{overview?.activeSessions || 'Active Sessions'}</Typography>
                <Typography variant="h3" color="primary">
                  {securityOverview.sessionSecurity.activeSessions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {securityOverview.sessionSecurity.suspiciousSessions} {overview?.suspicious || 'suspicious'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{overview?.securityEvents || 'Security Events'}</Typography>
                <Typography variant="h3" color="primary">
                  {securityOverview.securityEvents.totalToday}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {securityOverview.securityEvents.criticalEvents} {overview?.criticalToday || 'critical today'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{overview?.complianceOverview || 'Compliance Overview'}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">{overview?.passwordPolicy || 'Password Policy'}</Typography>
                    <Typography variant="h6" color="primary">
                      {securityOverview.compliance.passwordPolicyCompliance}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">{overview?.mfaCompliance || 'MFA Compliance'}</Typography>
                    <Typography variant="h6" color="primary">
                      {securityOverview.compliance.mfaCompliance}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2">{overview?.sessionTimeout || 'Session Timeout'}</Typography>
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
                  <Typography variant="h6">{(mfa?.title as string) || 'Multi-Factor Authentication'}</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setMfaSetupOpen(true)}
                  >
                    {(mfa?.setupMfa as string) || 'Setup MFA'}
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
                            {(mfa?.users as string) || 'users'}
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
            <Typography variant="h6" gutterBottom>{sessions?.title || 'Active Sessions'}</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{sessions?.user || 'User'}</TableCell>
                    <TableCell>{sessions?.ipAddress || 'IP Address'}</TableCell>
                    <TableCell>{sessions?.location || 'Location'}</TableCell>
                    <TableCell>{sessions?.created || 'Created'}</TableCell>
                    <TableCell>{sessions?.lastActivity || 'Last Activity'}</TableCell>
                    <TableCell>{sessions?.actions || 'Actions'}</TableCell>
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
            <Typography variant="h6" gutterBottom>{events?.title || 'Security Events'}</Typography>
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
                  <Typography variant="h6">{(accessControl?.allowedIps as string) || 'Allowed IPs'}</Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setIpManagementOpen(true)}
                  >
                    {((accessControl?.manageIp as Record<string, string>)?.addRule) || 'Add IP'}
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
                <Typography variant="h6" gutterBottom>{(accessControl?.blockedIps as string) || 'Blocked IPs'}</Typography>
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
                <Typography variant="h6" gutterBottom>{policies?.title || 'Security Policies'}</Typography>
                <Alert severity="info" sx={{ mb: 3 }}>
                  {policies?.info || 'Security policy management is available in the full admin console. These settings control password requirements, session timeouts, and access controls.'}
                </Alert>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>{policies?.passwordPolicy || 'Password Policy'}</Typography>
                    <FormControlLabel
                      control={<Switch checked={true} />}
                      label={policies?.requireUppercase || 'Require uppercase letters'}
                    />
                    <FormControlLabel
                      control={<Switch checked={true} />}
                      label={policies?.requireSpecial || 'Require special characters'}
                    />
                    <FormControlLabel
                      control={<Switch checked={true} />}
                      label={policies?.requireNumbers || 'Require numbers'}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>{policies?.sessionPolicy || 'Session Policy'}</Typography>
                    <FormControlLabel
                      control={<Switch checked={true} />}
                      label={policies?.requireMfaAdmin || 'Require MFA for admin users'}
                    />
                    <FormControlLabel
                      control={<Switch checked={false} />}
                      label={policies?.forceLogoutSuspicious || 'Force logout on suspicious activity'}
                    />
                    <TextField
                      label={policies?.sessionTimeoutHours || 'Session timeout (hours)'}
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
        <DialogTitle>{((mfa?.setupDialog as Record<string, string>)?.title) || 'Setup Multi-Factor Authentication'}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {((mfa?.setupDialog as Record<string, string>)?.info) || 'MFA setup functionality will be implemented with proper TOTP library integration.'}
          </Alert>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{((mfa?.setupDialog as Record<string, string>)?.methodLabel) || 'MFA Method'}</InputLabel>
            <Select value="totp" label={((mfa?.setupDialog as Record<string, string>)?.methodLabel) || 'MFA Method'}>
              <MenuItem value="totp">{((mfa?.setupDialog as Record<string, string>)?.totp) || 'TOTP (Authenticator App)'}</MenuItem>
              <MenuItem value="sms">{((mfa?.setupDialog as Record<string, string>)?.sms) || 'SMS'}</MenuItem>
              <MenuItem value="email">{((mfa?.setupDialog as Record<string, string>)?.email) || 'Email'}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMfaSetupOpen(false)}>{common?.cancel || 'Cancel'}</Button>
          <Button variant="contained" onClick={() => setMfaSetupOpen(false)}>
            {common?.setup || 'Setup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* IP Management Dialog */}
      <Dialog open={ipManagementOpen} onClose={() => setIpManagementOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{((accessControl?.manageIp as Record<string, string>)?.title) || 'Manage IP Access'}</DialogTitle>
        <DialogContent>
          <TextField
            label={((accessControl?.manageIp as Record<string, string>)?.ipLabel) || 'IP Address or Range'}
            placeholder={((accessControl?.manageIp as Record<string, string>)?.ipPlaceholder) || '192.168.1.0/24'}
            fullWidth
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{((accessControl?.manageIp as Record<string, string>)?.actionLabel) || 'Action'}</InputLabel>
            <Select value="allow" label={((accessControl?.manageIp as Record<string, string>)?.actionLabel) || 'Action'}>
              <MenuItem value="allow">{((accessControl?.manageIp as Record<string, string>)?.allow) || 'Allow'}</MenuItem>
              <MenuItem value="block">{((accessControl?.manageIp as Record<string, string>)?.block) || 'Block'}</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={((accessControl?.manageIp as Record<string, string>)?.reasonLabel) || 'Reason'}
            multiline
            rows={3}
            fullWidth
            placeholder={((accessControl?.manageIp as Record<string, string>)?.reasonPlaceholder) || 'Optional reason for this access control rule'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIpManagementOpen(false)}>{common?.cancel || 'Cancel'}</Button>
          <Button variant="contained" onClick={() => setIpManagementOpen(false)}>
            {((accessControl?.manageIp as Record<string, string>)?.addRule) || 'Add Rule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecuritySettingsPage;