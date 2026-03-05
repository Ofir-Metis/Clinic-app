/**
 * ConfigurationManagementPage - Configuration management and environment controls
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  CloudDone as DeployIcon,
  Flag as FlagIcon,
  History as HistoryIcon,
  Environment as EnvIcon,
  Code as CodeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  FileCopy as TemplateIcon,
  Sync as SyncIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

// Type for adminConfig translations
interface AdminConfigTranslations {
  title?: string;
  accessDenied?: string;
  tabs?: {
    overview?: string;
    configurations?: string;
    environments?: string;
    deployments?: string;
    featureFlags?: string;
    templates?: string;
    history?: string;
  };
  overview?: {
    totalConfigurations?: string;
    acrossEnvironments?: string;
    configurationHealth?: string;
    issuesDetected?: string;
    activeDeployments?: string;
    currentlyRunning?: string;
    featureFlags?: string;
    configDrift?: string;
    environmentStatus?: string;
    configs?: string;
    lastDeploy?: string;
    recentChanges?: string;
  };
  configurations?: {
    environment?: string;
    production?: string;
    staging?: string;
    development?: string;
    validateConfig?: string;
    addConfiguration?: string;
    tableHeaders?: {
      key?: string;
      value?: string;
      type?: string;
      service?: string;
      category?: string;
      lastModified?: string;
      actions?: string;
    };
    secret?: string;
    global?: string;
    by?: string;
  };
  environments?: {
    title?: string;
    createEnvironment?: string;
    resources?: string;
    deploymentConfig?: string;
    autoDeploy?: string;
    approvalRequired?: string;
    rollbackEnabled?: string;
    deploy?: string;
    edit?: string;
  };
  deployments?: {
    title?: string;
    newDeployment?: string;
    tableHeaders?: {
      environment?: string;
      services?: string;
      version?: string;
      status?: string;
      initiatedBy?: string;
      started?: string;
      duration?: string;
      actions?: string;
    };
    more?: string;
    running?: string;
  };
  featureFlags?: {
    title?: string;
    createFeatureFlag?: string;
    environments?: string;
    rules?: string;
    rollout?: string;
    users?: string;
    edit?: string;
    analytics?: string;
  };
  templates?: {
    title?: string;
    createTemplate?: string;
    templateVariables?: string;
    apply?: string;
    edit?: string;
  };
  history?: {
    title?: string;
    infoMessage?: string;
    recentChanges?: string;
    trackingDescription?: string;
    keyChanges?: string;
    valueModifications?: string;
    userAttribution?: string;
    deploymentCorrelation?: string;
    rollbackCapabilities?: string;
  };
  createConfigDialog?: {
    title?: string;
    configKey?: string;
    configKeyPlaceholder?: string;
    type?: string;
    types?: {
      string?: string;
      number?: string;
      boolean?: string;
      json?: string;
      encrypted?: string;
    };
    value?: string;
    environment?: string;
    service?: string;
    servicePlaceholder?: string;
    description?: string;
    descriptionPlaceholder?: string;
    secretValue?: string;
    cancel?: string;
    createConfiguration?: string;
  };
  deployDialog?: {
    title?: string;
    targetEnvironment?: string;
    servicesToDeploy?: string;
    servicesToDeployPlaceholder?: string;
    versionTag?: string;
    versionTagPlaceholder?: string;
    enableRollback?: string;
    deploymentNotes?: string;
    deploymentNotesPlaceholder?: string;
    cancel?: string;
    deploy?: string;
  };
  errors?: {
    loadFailed?: string;
  };
}

interface ConfigOverview {
  totalConfigurations: number;
  environments: number;
  activeDeployments: number;
  featureFlags: number;
  configurationHealth: {
    validConfigurations: number;
    invalidConfigurations: number;
    driftDetected: number;
  };
  recentChanges: Array<{
    key: string;
    environment: string;
    action: string;
    timestamp: Date;
    changedBy: string;
  }>;
  environmentStatus: Record<string, {
    status: 'healthy' | 'degraded' | 'error';
    configCount: number;
    lastDeployment: Date;
  }>;
}

interface ConfigItem {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'encrypted';
  environment: string;
  service?: string;
  category: string;
  description: string;
  isSecret: boolean;
  lastModified: Date;
  modifiedBy: string;
  version: number;
  tags: string[];
}

const ConfigurationManagementPage: React.FC = () => {
  const { user, accessToken } = useAuth();
  const { translations } = useTranslation();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get adminConfig translations
  const t = translations.adminConfig as AdminConfigTranslations | undefined;

  // State for different sections
  const [configOverview, setConfigOverview] = useState<ConfigOverview | null>(null);
  const [configItems, setConfigItems] = useState<ConfigItem[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // Dialog states
  const [createConfigOpen, setCreateConfigOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [createEnvOpen, setCreateEnvOpen] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState('production');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      loadConfigurationData();
    }
  }, [user]);

  const loadConfigurationData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, configRes, envRes, deployRes, flagsRes, templatesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/config/overview`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/config/items?environment=${selectedEnvironment}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/config/environments`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/config/deployments?limit=20`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/config/feature-flags`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/config/templates`, { headers: getAuthHeaders() }),
      ]);

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setConfigOverview(overviewData.data);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfigItems(configData.data || []);
      }

      if (envRes.ok) {
        const envData = await envRes.json();
        setEnvironments(envData.data || []);
      }

      if (deployRes.ok) {
        const deployData = await deployRes.json();
        setDeployments(deployData.data || []);
      }

      if (flagsRes.ok) {
        const flagsData = await flagsRes.json();
        setFeatureFlags(flagsData.data || []);
      }

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.data || []);
      }
    } catch (err) {
      setError(t?.errors?.loadFailed || 'Failed to load configuration data');
      console.error('Configuration data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'completed': case 'active': return 'success';
      case 'degraded': case 'running': case 'pending': return 'warning';
      case 'error': case 'failed': case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': case 'completed': return <CheckIcon color="success" />;
      case 'degraded': case 'running': return <WarningIcon color="warning" />;
      case 'error': case 'failed': return <ErrorIcon color="error" />;
      default: return null;
    }
  };

  const getValueDisplay = (item: ConfigItem) => {
    if (item.isSecret) {
      return '••••••••';
    }
    if (item.type === 'json') {
      return JSON.stringify(item.value, null, 2);
    }
    return String(item.value);
  };

  const toggleFeatureFlag = async (flagId: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/config/feature-flags/${flagId}/toggle`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        await loadConfigurationData();
      }
    } catch (err) {
      console.error('Failed to toggle feature flag:', err);
    }
  };

  const deployConfiguration = async (deploymentData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/config/deploy`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(deploymentData),
      });

      if (response.ok) {
        await loadConfigurationData();
        setDeployDialogOpen(false);
      }
    } catch (err) {
      console.error('Failed to deploy configuration:', err);
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
        <SettingsIcon fontSize="large" />
        {t?.title || 'Configuration Management'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label={t?.tabs?.overview || 'Overview'} icon={<SettingsIcon />} />
        <Tab label={t?.tabs?.configurations || 'Configurations'} icon={<CodeIcon />} />
        <Tab label={t?.tabs?.environments || 'Environments'} icon={<EnvIcon />} />
        <Tab label={t?.tabs?.deployments || 'Deployments'} icon={<DeployIcon />} />
        <Tab label={t?.tabs?.featureFlags || 'Feature Flags'} icon={<FlagIcon />} />
        <Tab label={t?.tabs?.templates || 'Templates'} icon={<TemplateIcon />} />
        <Tab label={t?.tabs?.history || 'History'} icon={<HistoryIcon />} />
      </Tabs>

      {/* Overview Tab */}
      {currentTab === 0 && configOverview && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.totalConfigurations || 'Total Configurations'}</Typography>
                <Typography variant="h3" color="primary">
                  {configOverview.totalConfigurations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(t?.overview?.acrossEnvironments || 'Across {count} environments').replace('{count}', String(configOverview.environments))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.configurationHealth || 'Configuration Health'}</Typography>
                <Typography variant="h3" color="success.main">
                  {Math.round((configOverview.configurationHealth.validConfigurations / configOverview.totalConfigurations) * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(t?.overview?.issuesDetected || '{count} issues detected').replace('{count}', String(configOverview.configurationHealth.invalidConfigurations))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.activeDeployments || 'Active Deployments'}</Typography>
                <Typography variant="h3" color="warning.main">
                  {configOverview.activeDeployments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t?.overview?.currentlyRunning || 'Currently running'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.featureFlags || 'Feature Flags'}</Typography>
                <Typography variant="h3" color="info.main">
                  {configOverview.featureFlags}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {(t?.overview?.configDrift || 'Configuration drift: {count}').replace('{count}', String(configOverview.configurationHealth.driftDetected))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.environmentStatus || 'Environment Status'}</Typography>
                <Grid container spacing={2}>
                  {Object.entries(configOverview.environmentStatus).map(([env, status]) => (
                    <Grid item xs={12} sm={6} md={3} key={env}>
                      <Box p={2} border={1} borderColor="divider" borderRadius={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          {getStatusIcon(status.status)}
                          <Typography variant="subtitle2" textTransform="capitalize">
                            {env}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {status.configCount} {t?.overview?.configs || 'configs'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t?.overview?.lastDeploy || 'Last deploy:'} {new Date(status.lastDeployment).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t?.overview?.recentChanges || 'Recent Changes'}</Typography>
                <List dense>
                  {configOverview.recentChanges.map((change, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={change.key}
                        secondary={`${change.action} in ${change.environment} by ${change.changedBy}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Configurations Tab */}
      {currentTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" gap={2} alignItems="center">
              <FormControl size="small">
                <InputLabel>{t?.configurations?.environment || 'Environment'}</InputLabel>
                <Select
                  value={selectedEnvironment}
                  onChange={(e) => setSelectedEnvironment(e.target.value)}
                  label={t?.configurations?.environment || 'Environment'}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="production">{t?.configurations?.production || 'Production'}</MenuItem>
                  <MenuItem value="staging">{t?.configurations?.staging || 'Staging'}</MenuItem>
                  <MenuItem value="development">{t?.configurations?.development || 'Development'}</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" startIcon={<SyncIcon />}>
                {t?.configurations?.validateConfig || 'Validate Config'}
              </Button>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateConfigOpen(true)}
            >
              {t?.configurations?.addConfiguration || 'Add Configuration'}
            </Button>
          </Box>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t?.configurations?.tableHeaders?.key || 'Key'}</TableCell>
                    <TableCell>{t?.configurations?.tableHeaders?.value || 'Value'}</TableCell>
                    <TableCell>{t?.configurations?.tableHeaders?.type || 'Type'}</TableCell>
                    <TableCell>{t?.configurations?.tableHeaders?.service || 'Service'}</TableCell>
                    <TableCell>{t?.configurations?.tableHeaders?.category || 'Category'}</TableCell>
                    <TableCell>{t?.configurations?.tableHeaders?.lastModified || 'Last Modified'}</TableCell>
                    <TableCell>{t?.configurations?.tableHeaders?.actions || 'Actions'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {configItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {item.key}
                          </Typography>
                          {item.isSecret && <Chip label={t?.configurations?.secret || 'Secret'} size="small" color="warning" />}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: item.type === 'json' ? 'pre' : 'nowrap',
                            fontFamily: item.type === 'json' ? 'monospace' : 'inherit'
                          }}
                        >
                          {getValueDisplay(item)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={item.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{item.service || t?.configurations?.global || 'Global'}</TableCell>
                      <TableCell>
                        <Chip label={item.category} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(item.lastModified).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t?.configurations?.by || 'by'} {item.modifiedBy}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error">
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

      {/* Environments Tab */}
      {currentTab === 2 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">{t?.environments?.title || 'Environment Management'}</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateEnvOpen(true)}
            >
              {t?.environments?.createEnvironment || 'Create Environment'}
            </Button>
          </Box>

          <Grid container spacing={3}>
            {environments.map((env) => (
              <Grid item xs={12} md={6} lg={4} key={env.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{env.displayName}</Typography>
                      <Chip
                        label={env.status}
                        color={getStatusColor(env.status) as any}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {env.description}
                    </Typography>

                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>{t?.environments?.resources || 'Resources'}</Typography>
                      <Typography variant="body2">
                        CPU: {env.resources.cpu} | Memory: {env.resources.memory}
                      </Typography>
                      <Typography variant="body2">
                        Replicas: {env.resources.replicas} | Storage: {env.resources.storage}
                      </Typography>
                    </Box>

                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>{t?.environments?.deploymentConfig || 'Deployment Config'}</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {env.deploymentConfig.autoDeployment && (
                          <Chip label={t?.environments?.autoDeploy || 'Auto Deploy'} size="small" />
                        )}
                        {env.deploymentConfig.approvalRequired && (
                          <Chip label={t?.environments?.approvalRequired || 'Approval Required'} size="small" />
                        )}
                        {env.deploymentConfig.rollbackEnabled && (
                          <Chip label={t?.environments?.rollbackEnabled || 'Rollback Enabled'} size="small" />
                        )}
                      </Box>
                    </Box>

                    <Box mt={2} display="flex" gap={1}>
                      <Button size="small" startIcon={<DeployIcon />}>
                        {t?.environments?.deploy || 'Deploy'}
                      </Button>
                      <Button size="small" startIcon={<EditIcon />}>
                        {t?.environments?.edit || 'Edit'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Deployments Tab */}
      {currentTab === 3 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">{t?.deployments?.title || 'Deployment History'}</Typography>
            <Button
              variant="contained"
              startIcon={<DeployIcon />}
              onClick={() => setDeployDialogOpen(true)}
            >
              {t?.deployments?.newDeployment || 'New Deployment'}
            </Button>
          </Box>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t?.deployments?.tableHeaders?.environment || 'Environment'}</TableCell>
                    <TableCell>{t?.deployments?.tableHeaders?.services || 'Services'}</TableCell>
                    <TableCell>{t?.deployments?.tableHeaders?.version || 'Version'}</TableCell>
                    <TableCell>{t?.deployments?.tableHeaders?.status || 'Status'}</TableCell>
                    <TableCell>{t?.deployments?.tableHeaders?.initiatedBy || 'Initiated By'}</TableCell>
                    <TableCell>{t?.deployments?.tableHeaders?.started || 'Started'}</TableCell>
                    <TableCell>{t?.deployments?.tableHeaders?.duration || 'Duration'}</TableCell>
                    <TableCell>{t?.deployments?.tableHeaders?.actions || 'Actions'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deployments.map((deployment) => (
                    <TableRow key={deployment.id}>
                      <TableCell>{deployment.environment}</TableCell>
                      <TableCell>
                        <Box>
                          {deployment.services.slice(0, 2).map((service: string) => (
                            <Chip key={service} label={service} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                          {deployment.services.length > 2 && (
                            <Chip label={(t?.deployments?.more || '+{count} more').replace('{count}', String(deployment.services.length - 2))} size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{deployment.version}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(deployment.status)}
                          <Chip
                            label={deployment.status}
                            color={getStatusColor(deployment.status) as any}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{deployment.initiatedBy}</TableCell>
                      <TableCell>
                        {new Date(deployment.initiatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {deployment.completedAt
                          ? `${Math.round((new Date(deployment.completedAt).getTime() - new Date(deployment.initiatedAt).getTime()) / 60000)}m`
                          : t?.deployments?.running || 'Running'
                        }
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                        {deployment.status === 'completed' && (
                          <IconButton size="small" color="warning">
                            <RestoreIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* Feature Flags Tab */}
      {currentTab === 4 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">{t?.featureFlags?.title || 'Feature Flags'}</Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              {t?.featureFlags?.createFeatureFlag || 'Create Feature Flag'}
            </Button>
          </Box>

          <Grid container spacing={3}>
            {featureFlags.map((flag) => (
              <Grid item xs={12} md={6} key={flag.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{flag.name}</Typography>
                      <Switch
                        checked={flag.enabled}
                        onChange={(e) => toggleFeatureFlag(flag.id, e.target.checked)}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {flag.description}
                    </Typography>
                    
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>{t?.featureFlags?.environments || 'Environments'}</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {flag.environments.map((env: string) => (
                          <Chip key={env} label={env} size="small" />
                        ))}
                      </Box>
                    </Box>

                    {flag.rules.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>{t?.featureFlags?.rules || 'Rules'}</Typography>
                        {flag.rules.map((rule: any, index: number) => (
                          <Typography key={index} variant="body2" color="text.secondary">
                            {rule.condition === 'percentage' && (t?.featureFlags?.rollout || '{percent}% rollout').replace('{percent}', String(rule.percentage))}
                            {rule.condition === 'user_segment' && (t?.featureFlags?.users || '{segments} users').replace('{segments}', rule.userSegments?.join(', '))}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    <Box mt={2} display="flex" gap={1}>
                      <Button size="small" startIcon={<EditIcon />}>
                        {t?.featureFlags?.edit || 'Edit'}
                      </Button>
                      <Button size="small" startIcon={<ViewIcon />}>
                        {t?.featureFlags?.analytics || 'Analytics'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Templates Tab */}
      {currentTab === 5 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">{t?.templates?.title || 'Configuration Templates'}</Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              {t?.templates?.createTemplate || 'Create Template'}
            </Button>
          </Box>

          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>{template.name}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {template.description}
                    </Typography>
                    
                    <Chip label={template.category} size="small" sx={{ mb: 2 }} />

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                          {(t?.templates?.templateVariables || 'Template Variables ({count})').replace('{count}', String(template.variables.length))}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {template.variables.map((variable: any, index: number) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={variable.key}
                                secondary={`${variable.type} - ${variable.description}`}
                              />
                              {variable.required && (
                                <Badge color="error" variant="dot" />
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    <Box mt={2} display="flex" gap={1}>
                      <Button size="small" startIcon={<StartIcon />}>
                        {t?.templates?.apply || 'Apply'}
                      </Button>
                      <Button size="small" startIcon={<EditIcon />}>
                        {t?.templates?.edit || 'Edit'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* History Tab */}
      {currentTab === 6 && (
        <Box>
          <Typography variant="h6" gutterBottom>{t?.history?.title || 'Configuration History'}</Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            {t?.history?.infoMessage || 'Configuration history tracking shows all changes made to configuration items, including who made the change, when, and what was modified.'}
          </Alert>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>{t?.history?.recentChanges || 'Recent Configuration Changes'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t?.history?.trackingDescription || 'History tracking and audit logs will be displayed here, showing:'}
              </Typography>
              <Box component="ul" sx={{ mt: 1 }}>
                <Typography component="li" variant="body2">{t?.history?.keyChanges || 'Configuration key changes'}</Typography>
                <Typography component="li" variant="body2">{t?.history?.valueModifications || 'Value modifications with before/after comparison'}</Typography>
                <Typography component="li" variant="body2">{t?.history?.userAttribution || 'User attribution and timestamps'}</Typography>
                <Typography component="li" variant="body2">{t?.history?.deploymentCorrelation || 'Deployment correlation'}</Typography>
                <Typography component="li" variant="body2">{t?.history?.rollbackCapabilities || 'Rollback capabilities'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Create Configuration Dialog */}
      <Dialog open={createConfigOpen} onClose={() => setCreateConfigOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t?.createConfigDialog?.title || 'Add Configuration Item'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t?.createConfigDialog?.configKey || 'Configuration Key'}
                fullWidth
                placeholder={t?.createConfigDialog?.configKeyPlaceholder || 'e.g., database.max_connections'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t?.createConfigDialog?.type || 'Type'}</InputLabel>
                <Select value="string" label={t?.createConfigDialog?.type || 'Type'}>
                  <MenuItem value="string">{t?.createConfigDialog?.types?.string || 'String'}</MenuItem>
                  <MenuItem value="number">{t?.createConfigDialog?.types?.number || 'Number'}</MenuItem>
                  <MenuItem value="boolean">{t?.createConfigDialog?.types?.boolean || 'Boolean'}</MenuItem>
                  <MenuItem value="json">{t?.createConfigDialog?.types?.json || 'JSON'}</MenuItem>
                  <MenuItem value="encrypted">{t?.createConfigDialog?.types?.encrypted || 'Encrypted'}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t?.createConfigDialog?.value || 'Value'}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t?.createConfigDialog?.environment || 'Environment'}</InputLabel>
                <Select value="production" label={t?.createConfigDialog?.environment || 'Environment'}>
                  <MenuItem value="production">{t?.configurations?.production || 'Production'}</MenuItem>
                  <MenuItem value="staging">{t?.configurations?.staging || 'Staging'}</MenuItem>
                  <MenuItem value="development">{t?.configurations?.development || 'Development'}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t?.createConfigDialog?.service || 'Service'}
                fullWidth
                placeholder={t?.createConfigDialog?.servicePlaceholder || 'e.g., api-gateway'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t?.createConfigDialog?.description || 'Description'}
                fullWidth
                multiline
                rows={2}
                placeholder={t?.createConfigDialog?.descriptionPlaceholder || 'Describe what this configuration controls'}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch />}
                label={t?.createConfigDialog?.secretValue || 'This is a secret value'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateConfigOpen(false)}>{t?.createConfigDialog?.cancel || 'Cancel'}</Button>
          <Button variant="contained" onClick={() => setCreateConfigOpen(false)}>
            {t?.createConfigDialog?.createConfiguration || 'Create Configuration'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deploy Dialog */}
      <Dialog open={deployDialogOpen} onClose={() => setDeployDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t?.deployDialog?.title || 'Deploy Configuration'}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>{t?.deployDialog?.targetEnvironment || 'Target Environment'}</InputLabel>
            <Select value="staging" label={t?.deployDialog?.targetEnvironment || 'Target Environment'}>
              <MenuItem value="staging">{t?.configurations?.staging || 'Staging'}</MenuItem>
              <MenuItem value="production">{t?.configurations?.production || 'Production'}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label={t?.deployDialog?.servicesToDeploy || 'Services to Deploy'}
            fullWidth
            sx={{ mb: 2 }}
            placeholder={t?.deployDialog?.servicesToDeployPlaceholder || 'Leave empty to deploy all services'}
          />

          <TextField
            label={t?.deployDialog?.versionTag || 'Version Tag'}
            fullWidth
            sx={{ mb: 2 }}
            placeholder={t?.deployDialog?.versionTagPlaceholder || 'e.g., v1.2.3'}
          />

          <FormControlLabel
            control={<Switch defaultChecked />}
            label={t?.deployDialog?.enableRollback || 'Enable rollback plan'}
            sx={{ display: 'block', mb: 2 }}
          />

          <TextField
            label={t?.deployDialog?.deploymentNotes || 'Deployment Notes'}
            fullWidth
            multiline
            rows={3}
            placeholder={t?.deployDialog?.deploymentNotesPlaceholder || 'Optional notes about this deployment'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeployDialogOpen(false)}>{t?.deployDialog?.cancel || 'Cancel'}</Button>
          <Button
            variant="contained"
            onClick={() => deployConfiguration({ environment: 'staging', services: [], version: 'v1.0.0' })}
          >
            {t?.deployDialog?.deploy || 'Deploy'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfigurationManagementPage;