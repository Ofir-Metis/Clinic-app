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
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError('Failed to load configuration data');
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
        <SettingsIcon fontSize="large" />
        Configuration Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" icon={<SettingsIcon />} />
        <Tab label="Configurations" icon={<CodeIcon />} />
        <Tab label="Environments" icon={<EnvIcon />} />
        <Tab label="Deployments" icon={<DeployIcon />} />
        <Tab label="Feature Flags" icon={<FlagIcon />} />
        <Tab label="Templates" icon={<TemplateIcon />} />
        <Tab label="History" icon={<HistoryIcon />} />
      </Tabs>

      {/* Overview Tab */}
      {currentTab === 0 && configOverview && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Configurations</Typography>
                <Typography variant="h3" color="primary">
                  {configOverview.totalConfigurations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Across {configOverview.environments} environments
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Configuration Health</Typography>
                <Typography variant="h3" color="success.main">
                  {Math.round((configOverview.configurationHealth.validConfigurations / configOverview.totalConfigurations) * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {configOverview.configurationHealth.invalidConfigurations} issues detected
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active Deployments</Typography>
                <Typography variant="h3" color="warning.main">
                  {configOverview.activeDeployments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently running
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Feature Flags</Typography>
                <Typography variant="h3" color="info.main">
                  {configOverview.featureFlags}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configuration drift: {configOverview.configurationHealth.driftDetected}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Environment Status</Typography>
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
                          {status.configCount} configs
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last deploy: {new Date(status.lastDeployment).toLocaleDateString()}
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
                <Typography variant="h6" gutterBottom>Recent Changes</Typography>
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
                <InputLabel>Environment</InputLabel>
                <Select
                  value={selectedEnvironment}
                  onChange={(e) => setSelectedEnvironment(e.target.value)}
                  label="Environment"
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="production">Production</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="development">Development</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" startIcon={<SyncIcon />}>
                Validate Config
              </Button>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateConfigOpen(true)}
            >
              Add Configuration
            </Button>
          </Box>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Last Modified</TableCell>
                    <TableCell>Actions</TableCell>
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
                          {item.isSecret && <Chip label="Secret" size="small" color="warning" />}
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
                      <TableCell>{item.service || 'Global'}</TableCell>
                      <TableCell>
                        <Chip label={item.category} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(item.lastModified).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {item.modifiedBy}
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
            <Typography variant="h6">Environment Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateEnvOpen(true)}
            >
              Create Environment
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
                      <Typography variant="subtitle2" gutterBottom>Resources</Typography>
                      <Typography variant="body2">
                        CPU: {env.resources.cpu} | Memory: {env.resources.memory}
                      </Typography>
                      <Typography variant="body2">
                        Replicas: {env.resources.replicas} | Storage: {env.resources.storage}
                      </Typography>
                    </Box>

                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>Deployment Config</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {env.deploymentConfig.autoDeployment && (
                          <Chip label="Auto Deploy" size="small" />
                        )}
                        {env.deploymentConfig.approvalRequired && (
                          <Chip label="Approval Required" size="small" />
                        )}
                        {env.deploymentConfig.rollbackEnabled && (
                          <Chip label="Rollback Enabled" size="small" />
                        )}
                      </Box>
                    </Box>

                    <Box mt={2} display="flex" gap={1}>
                      <Button size="small" startIcon={<DeployIcon />}>
                        Deploy
                      </Button>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
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
            <Typography variant="h6">Deployment History</Typography>
            <Button
              variant="contained"
              startIcon={<DeployIcon />}
              onClick={() => setDeployDialogOpen(true)}
            >
              New Deployment
            </Button>
          </Box>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Environment</TableCell>
                    <TableCell>Services</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Initiated By</TableCell>
                    <TableCell>Started</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Actions</TableCell>
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
                            <Chip label={`+${deployment.services.length - 2} more`} size="small" />
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
                          : 'Running'
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
            <Typography variant="h6">Feature Flags</Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Feature Flag
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
                      <Typography variant="subtitle2" gutterBottom>Environments</Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {flag.environments.map((env: string) => (
                          <Chip key={env} label={env} size="small" />
                        ))}
                      </Box>
                    </Box>

                    {flag.rules.length > 0 && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>Rules</Typography>
                        {flag.rules.map((rule: any, index: number) => (
                          <Typography key={index} variant="body2" color="text.secondary">
                            {rule.condition === 'percentage' && `${rule.percentage}% rollout`}
                            {rule.condition === 'user_segment' && `${rule.userSegments?.join(', ')} users`}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    <Box mt={2} display="flex" gap={1}>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
                      </Button>
                      <Button size="small" startIcon={<ViewIcon />}>
                        Analytics
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
            <Typography variant="h6">Configuration Templates</Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Template
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
                          Template Variables ({template.variables.length})
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
                        Apply
                      </Button>
                      <Button size="small" startIcon={<EditIcon />}>
                        Edit
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
          <Typography variant="h6" gutterBottom>Configuration History</Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Configuration history tracking shows all changes made to configuration items,
            including who made the change, when, and what was modified.
          </Alert>
          
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Recent Configuration Changes</Typography>
              <Typography variant="body2" color="text.secondary">
                History tracking and audit logs will be displayed here, showing:
              </Typography>
              <Box component="ul" sx={{ mt: 1 }}>
                <Typography component="li" variant="body2">Configuration key changes</Typography>
                <Typography component="li" variant="body2">Value modifications with before/after comparison</Typography>
                <Typography component="li" variant="body2">User attribution and timestamps</Typography>
                <Typography component="li" variant="body2">Deployment correlation</Typography>
                <Typography component="li" variant="body2">Rollback capabilities</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Create Configuration Dialog */}
      <Dialog open={createConfigOpen} onClose={() => setCreateConfigOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Configuration Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Configuration Key"
                fullWidth
                placeholder="e.g., database.max_connections"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value="string" label="Type">
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="boolean">Boolean</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                  <MenuItem value="encrypted">Encrypted</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Value"
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select value="production" label="Environment">
                  <MenuItem value="production">Production</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="development">Development</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Service"
                fullWidth
                placeholder="e.g., api-gateway"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                placeholder="Describe what this configuration controls"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch />}
                label="This is a secret value"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateConfigOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setCreateConfigOpen(false)}>
            Create Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deploy Dialog */}
      <Dialog open={deployDialogOpen} onClose={() => setDeployDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deploy Configuration</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Target Environment</InputLabel>
            <Select value="staging" label="Target Environment">
              <MenuItem value="staging">Staging</MenuItem>
              <MenuItem value="production">Production</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Services to Deploy"
            fullWidth
            sx={{ mb: 2 }}
            placeholder="Leave empty to deploy all services"
          />
          
          <TextField
            label="Version Tag"
            fullWidth
            sx={{ mb: 2 }}
            placeholder="e.g., v1.2.3"
          />
          
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Enable rollback plan"
            sx={{ display: 'block', mb: 2 }}
          />
          
          <TextField
            label="Deployment Notes"
            fullWidth
            multiline
            rows={3}
            placeholder="Optional notes about this deployment"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeployDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => deployConfiguration({ environment: 'staging', services: [], version: 'v1.0.0' })}
          >
            Deploy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConfigurationManagementPage;