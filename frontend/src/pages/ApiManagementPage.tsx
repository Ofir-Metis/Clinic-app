/**
 * ApiManagementPage - API management and rate limiting controls
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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Api as ApiIcon,
  VpnKey as KeyIcon,
  Speed as RateLimitIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Apps as ClientsIcon,
  TrendingUp as TrendsIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

// Translation interface for API Management page
interface AdminApiTranslations {
  title?: string;
  accessDenied?: string;
  tabs?: {
    overview?: string;
    apiKeys?: string;
    rateLimits?: string;
    clients?: string;
    analytics?: string;
    security?: string;
  };
  overview?: {
    apiKeys?: string;
    totalKeys?: string;
    activeClients?: string;
    totalClients?: string;
    requestsToday?: string;
    thisMonth?: string;
    systemHealth?: string;
    avgResponse?: string;
    rateLimitingStatus?: string;
    activeRules?: string;
    blockedToday?: string;
    blockRate?: string;
    reqPerSec?: string;
    topClients?: string;
    requests?: string;
    recentActivity?: string;
  };
  apiKeysTab?: {
    title?: string;
    createButton?: string;
    tableHeaders?: {
      name?: string;
      keyPreview?: string;
      client?: string;
      usage?: string;
      rateLimits?: string;
      status?: string;
      actions?: string;
    };
    created?: string;
    thisMonth?: string;
    lastUsed?: string;
    perMin?: string;
    perDay?: string;
  };
  rateLimitsTab?: {
    title?: string;
    createButton?: string;
    rateLimits?: string;
    perSec?: string;
    perMin?: string;
    perHour?: string;
    burst?: string;
    priority?: string;
    active?: string;
    disabled?: string;
    edit?: string;
    analytics?: string;
  };
  clientsTab?: {
    title?: string;
    addButton?: string;
    organization?: string;
    quotas?: string;
    perDay?: string;
    perMonth?: string;
    transferLimit?: string;
    typeAndAccess?: string;
    apiKeys?: string;
    services?: string;
    edit?: string;
    usage?: string;
  };
  analyticsTab?: {
    title?: string;
    totalRequests?: string;
    successRate?: string;
    avgResponseTime?: string;
    rateLimited?: string;
    topEndpoints?: string;
    endpoint?: string;
    requests?: string;
    avgTime?: string;
    errorRate?: string;
    responseTimeDistribution?: string;
    errorBreakdown?: string;
  };
  securityTab?: {
    threatDetection?: string;
    blockIpButton?: string;
    threatsDetected?: string;
    blockedIps?: string;
    recentThreats?: string;
    blockedIpAddresses?: string;
    tableHeaders?: {
      ipAddress?: string;
      reason?: string;
      blocked?: string;
      actions?: string;
    };
    attempts?: string;
    by?: string;
  };
  createKeyDialog?: {
    title?: string;
    keyName?: string;
    keyNamePlaceholder?: string;
    clientApplication?: string;
    requestsPerMinute?: string;
    requestsPerDay?: string;
    permissions?: string;
    permissionsPlaceholder?: string;
    cancel?: string;
    createButton?: string;
  };
  blockIpDialog?: {
    title?: string;
    ipAddress?: string;
    ipPlaceholder?: string;
    reason?: string;
    reasonPlaceholder?: string;
    duration?: string;
    durationPlaceholder?: string;
    durationHelperText?: string;
    cancel?: string;
    blockButton?: string;
  };
}

interface ApiOverview {
  totalApiKeys: number;
  activeApiKeys: number;
  totalClients: number;
  activeClients: number;
  totalRequests: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  rateLimitStatus: {
    totalRules: number;
    activeRules: number;
    blockedRequests: number;
    averageBlockRate: number;
  };
  systemHealth: {
    uptime: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
  topClients: Array<{
    id: string;
    name: string;
    requestCount: number;
    lastActivity: Date;
  }>;
  recentActivity: Array<{
    timestamp: Date;
    action: string;
    details: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  clientId: string;
  clientName: string;
  permissions: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    burst: number;
  };
  usage: {
    totalRequests: number;
    requestsThisMonth: number;
    lastUsed: Date;
  };
  status: 'active' | 'suspended' | 'revoked';
  createdAt: Date;
  expiresAt?: Date;
}

const ApiManagementPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const { translations } = useTranslation();
  const t = translations.adminApi as AdminApiTranslations | undefined;
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for different sections
  const [apiOverview, setApiOverview] = useState<ApiOverview | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [rateLimitRules, setRateLimitRules] = useState<any[]>([]);
  const [clientApplications, setClientApplications] = useState<any[]>([]);
  const [apiAnalytics, setApiAnalytics] = useState<any>(null);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [threatDetection, setThreatDetection] = useState<any>(null);

  // Dialog states
  const [createKeyOpen, setCreateKeyOpen] = useState(false);
  const [createRuleOpen, setCreateRuleOpen] = useState(false);
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [blockIpOpen, setBlockIpOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadApiManagementData();
    }
  }, [user]);

  const loadApiManagementData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, keysRes, rulesRes, clientsRes, analyticsRes, blockedRes, threatsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api-management/overview`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api-management/keys`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api-management/rate-limits`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api-management/clients`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api-management/analytics`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api-management/security/blocked-ips`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api-management/security/threat-detection`, { headers: getAuthHeaders() }),
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setApiOverview(overviewData.data);
      }

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData.data.keys || []);
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRateLimitRules(rulesData.data || []);
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClientApplications(clientsData.data || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setApiAnalytics(analyticsData.data);
      }

      if (blockedRes.ok) {
        const blockedData = await blockedRes.json();
        setBlockedIps(blockedData.data || []);
      }

      if (threatsRes.ok) {
        const threatsData = await threatsRes.json();
        setThreatDetection(threatsData.data);
      }
    } catch (err) {
      setError(t?.errors?.loadFailed || 'Failed to load API management data');
      console.error('API management data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'healthy': case 'success': return 'success';
      case 'suspended': case 'degraded': case 'warning': return 'warning';
      case 'revoked': case 'error': case 'blocked': return 'error';
      case 'pending_approval': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': case 'healthy': return <CheckIcon color="success" />;
      case 'suspended': case 'degraded': return <WarningIcon color="warning" />;
      case 'revoked': case 'error': return <ErrorIcon color="error" />;
      default: return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const createApiKey = async (keyData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-management/keys`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(keyData),
      });

      if (response.ok) {
        await loadApiManagementData();
        setCreateKeyOpen(false);
      }
    } catch (err) {
      console.error('Failed to create API key:', err);
    }
  };

  const revokeApiKey = async (keyId: string, reason: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-management/keys/${keyId}/revoke`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        await loadApiManagementData();
      }
    } catch (err) {
      console.error('Failed to revoke API key:', err);
    }
  };

  const toggleRateLimitRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-management/rate-limits/${ruleId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        await loadApiManagementData();
      }
    } catch (err) {
      console.error('Failed to toggle rate limit rule:', err);
    }
  };

  const blockIpAddress = async (blockData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api-management/security/block-ip`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(blockData),
      });

      if (response.ok) {
        await loadApiManagementData();
        setBlockIpOpen(false);
      }
    } catch (err) {
      console.error('Failed to block IP address:', err);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Box p={3}>
        <Alert severity="error">
          {t?.accessDenied || 'Access denied. Admin privileges required.'}
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
        <ApiIcon fontSize="large" />
        {t?.title || 'API Management & Rate Limiting'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label={t?.tabs?.overview || 'Overview'} icon={<ApiIcon />} />
        <Tab label={t?.tabs?.apiKeys || 'API Keys'} icon={<KeyIcon />} />
        <Tab label={t?.tabs?.rateLimits || 'Rate Limits'} icon={<RateLimitIcon />} />
        <Tab label={t?.tabs?.clients || 'Clients'} icon={<ClientsIcon />} />
        <Tab label={t?.tabs?.analytics || 'Analytics'} icon={<AnalyticsIcon />} />
        <Tab label={t?.tabs?.security || 'Security'} icon={<SecurityIcon />} />
      </Tabs>

      {/* Overview Tab */}
      {currentTab === 0 && apiOverview && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.apiKeys || 'API Keys'}</Typography>
                <Typography variant="h3" color="primary">
                  {apiOverview.activeApiKeys}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {apiOverview.totalApiKeys} {t?.overview?.totalKeys || 'total keys'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.activeClients || 'Active Clients'}</Typography>
                <Typography variant="h3" color="success.main">
                  {apiOverview.activeClients}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {apiOverview.totalClients} {t?.overview?.totalClients || 'total clients'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.requestsToday || 'Requests Today'}</Typography>
                <Typography variant="h3" color="info.main">
                  {apiOverview.totalRequests.today.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {apiOverview.totalRequests.thisMonth.toLocaleString()} {t?.overview?.thisMonth || 'this month'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.systemHealth || 'System Health'}</Typography>
                <Typography variant="h3" color="success.main">
                  {apiOverview.systemHealth.uptime}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {apiOverview.systemHealth.responseTime}ms {t?.overview?.avgResponse || 'avg response'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.rateLimitingStatus || 'Rate Limiting Status'}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {apiOverview.rateLimitStatus.activeRules}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t?.overview?.activeRules || 'Active Rules'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {apiOverview.rateLimitStatus.blockedRequests}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t?.overview?.blockedToday || 'Blocked Today'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {(apiOverview.rateLimitStatus.averageBlockRate * 100).toFixed(2)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t?.overview?.blockRate || 'Block Rate'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {apiOverview.systemHealth.throughput}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t?.overview?.reqPerSec || 'Req/sec'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.topClients || 'Top Clients'}</Typography>
                <List dense>
                  {apiOverview.topClients.map((client) => (
                    <ListItem key={client.id}>
                      <ListItemText
                        primary={client.name}
                        secondary={`${client.requestCount.toLocaleString()} ${t?.overview?.requests || 'requests'}`}
                      />
                      <ListItemSecondaryAction>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(client.lastActivity).toLocaleDateString()}
                        </Typography>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.recentActivity || 'Recent Activity'}</Typography>
                <List>
                  {apiOverview.recentActivity.map((activity, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1">{activity.action}</Typography>
                            <Chip 
                              label={activity.severity} 
                              color={getSeverityColor(activity.severity) as any}
                              size="small" 
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">{activity.details}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(activity.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* API Keys Tab */}
      {currentTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">{t?.apiKeysTab?.title || 'API Key Management'}</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateKeyOpen(true)}
            >
              {t?.apiKeysTab?.createButton || 'Create API Key'}
            </Button>
          </Box>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t?.apiKeysTab?.tableHeaders?.name || 'Name'}</TableCell>
                    <TableCell>{t?.apiKeysTab?.tableHeaders?.keyPreview || 'Key Preview'}</TableCell>
                    <TableCell>{t?.apiKeysTab?.tableHeaders?.client || 'Client'}</TableCell>
                    <TableCell>{t?.apiKeysTab?.tableHeaders?.usage || 'Usage'}</TableCell>
                    <TableCell>{t?.apiKeysTab?.tableHeaders?.rateLimits || 'Rate Limits'}</TableCell>
                    <TableCell>{t?.apiKeysTab?.tableHeaders?.status || 'Status'}</TableCell>
                    <TableCell>{t?.apiKeysTab?.tableHeaders?.actions || 'Actions'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {key.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t?.apiKeysTab?.created || 'Created:'} {new Date(key.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'monospace' }}
                          >
                            {showApiKey === key.id ? key.keyPreview.replace('...', 'abc123def456') : key.keyPreview}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setShowApiKey(showApiKey === key.id ? null : key.id)}
                          >
                            {showApiKey === key.id ? <VisibilityOff /> : <ViewIcon />}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(key.keyPreview)}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{key.clientName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {key.clientId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {key.usage.requestsThisMonth.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t?.apiKeysTab?.thisMonth || 'This month'}
                        </Typography>
                        {key.usage.lastUsed && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {t?.apiKeysTab?.lastUsed || 'Last used:'} {new Date(key.usage.lastUsed).toLocaleDateString()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" display="block">
                          {key.rateLimits.requestsPerMinute}{t?.apiKeysTab?.perMin || '/min'}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {key.rateLimits.requestsPerDay}{t?.apiKeysTab?.perDay || '/day'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(key.status)}
                          <Chip
                            label={key.status}
                            color={getStatusColor(key.status) as any}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => revokeApiKey(key.id, 'Manual revocation')}
                        >
                          <BlockIcon />
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

      {/* Rate Limits Tab */}
      {currentTab === 2 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">{t?.rateLimitsTab?.title || 'Rate Limiting Rules'}</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateRuleOpen(true)}
            >
              {t?.rateLimitsTab?.createButton || 'Create Rule'}
            </Button>
          </Box>

          <Grid container spacing={3}>
            {rateLimitRules.map((rule) => (
              <Grid item xs={12} md={6} key={rule.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{rule.name}</Typography>
                      <Switch
                        checked={rule.enabled}
                        onChange={(e) => toggleRateLimitRule(rule.id, e.target.checked)}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Pattern: {rule.pattern} | Type: {rule.type}
                    </Typography>

                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>{t?.rateLimitsTab?.rateLimits || 'Rate Limits'}</Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            {rule.limits.requestsPerSecond}{t?.rateLimitsTab?.perSec || '/sec'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            {rule.limits.requestsPerMinute}{t?.rateLimitsTab?.perMin || '/min'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            {rule.limits.requestsPerHour}{t?.rateLimitsTab?.perHour || '/hour'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            {t?.rateLimitsTab?.burst || 'Burst:'} {rule.limits.burstLimit}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box mt={2} display="flex" gap={1}>
                      <Chip label={`${t?.rateLimitsTab?.priority || 'Priority'} ${rule.priority}`} size="small" />
                      <Chip
                        label={rule.enabled ? (t?.rateLimitsTab?.active || 'Active') : (t?.rateLimitsTab?.disabled || 'Disabled')}
                        color={rule.enabled ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>

                    <Box mt={2} display="flex" gap={1}>
                      <Button size="small" startIcon={<EditIcon />}>
                        {t?.rateLimitsTab?.edit || 'Edit'}
                      </Button>
                      <Button size="small" startIcon={<AnalyticsIcon />}>
                        {t?.rateLimitsTab?.analytics || 'Analytics'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Clients Tab */}
      {currentTab === 3 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">{t?.clientsTab?.title || 'Client Applications'}</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateClientOpen(true)}
            >
              {t?.clientsTab?.addButton || 'Add Client'}
            </Button>
          </Box>

          <Grid container spacing={3}>
            {clientApplications.map((client) => (
              <Grid item xs={12} md={6} key={client.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{client.name}</Typography>
                      <Chip
                        label={client.status}
                        color={getStatusColor(client.status) as any}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {client.description}
                    </Typography>

                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>{t?.clientsTab?.organization || 'Organization'}</Typography>
                      <Typography variant="body2">{client.organization}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {client.contactEmail}
                      </Typography>
                    </Box>

                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>{t?.clientsTab?.quotas || 'Quotas'}</Typography>
                      <Typography variant="body2">
                        {client.quotas.requestsPerDay.toLocaleString()}{t?.clientsTab?.perDay || '/day'}
                      </Typography>
                      <Typography variant="body2">
                        {client.quotas.requestsPerMonth.toLocaleString()}{t?.clientsTab?.perMonth || '/month'}
                      </Typography>
                      <Typography variant="body2">
                        {client.quotas.dataTransferLimitMB}MB {t?.clientsTab?.transferLimit || 'transfer limit'}
                      </Typography>
                    </Box>

                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>{t?.clientsTab?.typeAndAccess || 'Type & Access'}</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip label={client.type} size="small" />
                        <Chip label={`${client.apiKeys.length} ${t?.clientsTab?.apiKeys || 'API Keys'}`} size="small" />
                        <Chip label={`${client.permissions.allowedServices.length} ${t?.clientsTab?.services || 'Services'}`} size="small" />
                      </Box>
                    </Box>

                    <Box mt={2} display="flex" gap={1}>
                      <Button size="small" startIcon={<EditIcon />}>
                        {t?.clientsTab?.edit || 'Edit'}
                      </Button>
                      <Button size="small" startIcon={<KeyIcon />}>
                        {t?.clientsTab?.apiKeys || 'API Keys'}
                      </Button>
                      <Button size="small" startIcon={<AnalyticsIcon />}>
                        {t?.clientsTab?.usage || 'Usage'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Analytics Tab */}
      {currentTab === 4 && apiAnalytics && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.analyticsTab?.title || 'API Usage Overview'}</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {apiAnalytics.overview.totalRequests.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t?.analyticsTab?.totalRequests || 'Total Requests'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {((apiAnalytics.overview.successfulRequests / apiAnalytics.overview.totalRequests) * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t?.analyticsTab?.successRate || 'Success Rate'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {apiAnalytics.overview.averageResponseTime}ms
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t?.analyticsTab?.avgResponseTime || 'Avg Response Time'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {apiAnalytics.overview.rateLimitedRequests.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t?.analyticsTab?.rateLimited || 'Rate Limited'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.analyticsTab?.topEndpoints || 'Top Endpoints'}</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t?.analyticsTab?.endpoint || 'Endpoint'}</TableCell>
                      <TableCell>{t?.analyticsTab?.requests || 'Requests'}</TableCell>
                      <TableCell>{t?.analyticsTab?.avgTime || 'Avg Time'}</TableCell>
                      <TableCell>{t?.analyticsTab?.errorRate || 'Error Rate'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {apiAnalytics.topEndpoints.map((endpoint: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2">{endpoint.method}</Typography>
                          <Typography variant="caption">{endpoint.endpoint}</Typography>
                        </TableCell>
                        <TableCell>{endpoint.requestCount.toLocaleString()}</TableCell>
                        <TableCell>{endpoint.averageResponseTime}ms</TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color={endpoint.errorRate > 0.05 ? 'error.main' : 'text.primary'}
                          >
                            {(endpoint.errorRate * 100).toFixed(2)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.analyticsTab?.responseTimeDistribution || 'Response Time Distribution'}</Typography>
                {apiAnalytics.responseTimeDistribution.map((dist: any, index: number) => (
                  <Box key={index} mb={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{dist.range}</Typography>
                      <Typography variant="body2">{dist.percentage}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={dist.percentage}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.analyticsTab?.errorBreakdown || 'Error Breakdown'}</Typography>
                <Grid container spacing={2}>
                  {apiAnalytics.errorBreakdown.map((error: any, index: number) => (
                    <Grid item xs={12} sm={6} md={2.4} key={index}>
                      <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={1}>
                        <Typography variant="h5" color="error.main">
                          {error.statusCode}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {error.count} ({error.percentage}%)
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Security Tab */}
      {currentTab === 5 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">{t?.securityTab?.threatDetection || 'Threat Detection'}</Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<BlockIcon />}
                    onClick={() => setBlockIpOpen(true)}
                  >
                    {t?.securityTab?.blockIpButton || 'Block IP'}
                  </Button>
                </Box>

                {threatDetection && (
                  <Box>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="h4" color="error.main">
                          {threatDetection.overview.threatsDetected}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t?.securityTab?.threatsDetected || 'Threats Detected'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h4" color="warning.main">
                          {threatDetection.overview.blockedIps}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t?.securityTab?.blockedIps || 'Blocked IPs'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Typography variant="subtitle2" gutterBottom>{t?.securityTab?.recentThreats || 'Recent Threats'}</Typography>
                    <List dense>
                      {threatDetection.recentThreats.map((threat: any, index: number) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2">{threat.type}</Typography>
                                <Chip 
                                  label={threat.severity} 
                                  color={getSeverityColor(threat.severity) as any}
                                  size="small" 
                                />
                              </Box>
                            }
                            secondary={`${threat.sourceIp} - ${threat.details}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.securityTab?.blockedIpAddresses || 'Blocked IP Addresses'}</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t?.securityTab?.tableHeaders?.ipAddress || 'IP Address'}</TableCell>
                      <TableCell>{t?.securityTab?.tableHeaders?.reason || 'Reason'}</TableCell>
                      <TableCell>{t?.securityTab?.tableHeaders?.blocked || 'Blocked'}</TableCell>
                      <TableCell>{t?.securityTab?.tableHeaders?.actions || 'Actions'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {blockedIps.map((ip, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {ip.ipAddress}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{ip.reason}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ip.attempts} {t?.securityTab?.attempts || 'attempts'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(ip.blockedAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t?.securityTab?.by || 'by'} {ip.blockedBy}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary">
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={createKeyOpen} onClose={() => setCreateKeyOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t?.createKeyDialog?.title || 'Create API Key'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t?.createKeyDialog?.keyName || 'Key Name'}
                fullWidth
                placeholder={t?.createKeyDialog?.keyNamePlaceholder || 'e.g., Production Mobile App Key'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t?.createKeyDialog?.clientApplication || 'Client Application'}</InputLabel>
                <Select value="" label={t?.createKeyDialog?.clientApplication || 'Client Application'}>
                  {clientApplications.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t?.createKeyDialog?.requestsPerMinute || 'Requests per Minute'}
                type="number"
                fullWidth
                defaultValue={100}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t?.createKeyDialog?.requestsPerDay || 'Requests per Day'}
                type="number"
                fullWidth
                defaultValue={100000}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t?.createKeyDialog?.permissions || 'Permissions (comma-separated)'}
                fullWidth
                placeholder={t?.createKeyDialog?.permissionsPlaceholder || 'read:patients, write:appointments, read:files'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateKeyOpen(false)}>{t?.createKeyDialog?.cancel || 'Cancel'}</Button>
          <Button variant="contained" onClick={() => createApiKey({})}>
            {t?.createKeyDialog?.createButton || 'Create API Key'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block IP Dialog */}
      <Dialog open={blockIpOpen} onClose={() => setBlockIpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t?.blockIpDialog?.title || 'Block IP Address'}</DialogTitle>
        <DialogContent>
          <TextField
            label={t?.blockIpDialog?.ipAddress || 'IP Address'}
            fullWidth
            sx={{ mb: 2, mt: 1 }}
            placeholder={t?.blockIpDialog?.ipPlaceholder || '192.168.1.100'}
          />
          <TextField
            label={t?.blockIpDialog?.reason || 'Reason'}
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder={t?.blockIpDialog?.reasonPlaceholder || 'Describe why this IP should be blocked'}
          />
          <TextField
            label={t?.blockIpDialog?.duration || 'Duration (minutes)'}
            type="number"
            fullWidth
            placeholder={t?.blockIpDialog?.durationPlaceholder || 'Leave empty for permanent block'}
            helperText={t?.blockIpDialog?.durationHelperText || '0 or empty for permanent block'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockIpOpen(false)}>{t?.blockIpDialog?.cancel || 'Cancel'}</Button>
          <Button variant="contained" color="error" onClick={() => blockIpAddress({})}>
            {t?.blockIpDialog?.blockButton || 'Block IP'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiManagementPage;