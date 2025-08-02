/**
 * AdminDashboardPage - System administration dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as UsersIcon,
  Assessment as MetricsIcon,
  Article as LogsIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Api as ApiIcon,
  Storage as BackupIcon,
  Monitor as MonitoringIcon,
  SettingsApplications as ConfigIcon,
  Gavel as ComplianceIcon,
  Speed as PerformanceIcon,
} from '@mui/icons-material';
import { useAuth } from '../AuthContext';
import SystemHealthOverview from '../components/admin/SystemHealthOverview';
import UserManagement from '../components/admin/UserManagement';
import SystemMetrics from '../components/admin/SystemMetrics';
import LogViewer from '../components/admin/LogViewer';
import SystemSettings from '../components/admin/SystemSettings';
import { useAdminData } from '../hooks/useAdminData';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const {
    systemHealth,
    users,
    metrics,
    loading,
    error,
    refreshData,
  } = useAdminData();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/';
    }
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">
          Access denied. Administrator privileges required.
        </Alert>
      </Box>
    );
  }

  if (loading && !systemHealth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'unhealthy':
      case 'down':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return <HealthyIcon color="success" />;
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'unhealthy':
      case 'down':
        return <ErrorIcon color="error" />;
      default:
        return <DashboardIcon />;
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F0F8F4 0%, #E6F3F0 25%, #D4E9E2 100%)',
      p: 3,
    }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h3" sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}>
            System Administration
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your clinic application system
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {systemHealth && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon(systemHealth.status)}
              <Chip
                label={`System ${systemHealth.status}`}
                color={getStatusColor(systemHealth.status) as any}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          )}
          
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={refreshData} 
              disabled={loading}
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Quick Stats Cards */}
      {systemHealth && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Services Status
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {systemHealth.services.filter(s => s.status === 'up').length}/{systemHealth.services.length}
                    </Typography>
                  </Box>
                  <DashboardIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Memory Usage
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {systemHealth.metrics.memory.percentage}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={systemHealth.metrics.memory.percentage} 
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>
                  <MetricsIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Alerts
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {systemHealth.alerts.filter(a => !a.resolved).length}
                    </Typography>
                  </Box>
                  <SecurityIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Users
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {users?.stats.totalUsers || 0}
                    </Typography>
                  </Box>
                  <UsersIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Production Management Tools
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 32px rgba(46, 125, 107, 0.15)',
            }
          }}
          onClick={() => window.location.href = '/admin/api-management'}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ApiIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  API Management
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Manage API keys, rate limiting, client applications, and DDoS protection
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 32px rgba(46, 125, 107, 0.15)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <BackupIcon sx={{ fontSize: 32, color: 'success.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Backup & Recovery
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                System backups, disaster recovery planning, and data restoration tools
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 32px rgba(46, 125, 107, 0.15)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <MonitoringIcon sx={{ fontSize: 32, color: 'info.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Monitoring & Alerts
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Real-time system monitoring, performance analytics, and alert management
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 32px rgba(46, 125, 107, 0.15)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ConfigIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Configuration
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Environment controls, feature flags, deployment management, and templates
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 32px rgba(46, 125, 107, 0.15)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ComplianceIcon sx={{ fontSize: 32, color: 'error.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Compliance & Audit
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                HIPAA/GDPR compliance, audit trails, risk assessment, and regulatory reporting
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 32px rgba(46, 125, 107, 0.15)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <SecurityIcon sx={{ fontSize: 32, color: 'secondary.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Security Management
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Multi-factor authentication, session management, IP controls, and security events
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ 
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 32px rgba(46, 125, 107, 0.15)',
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PerformanceIcon sx={{ fontSize: 32, color: 'accent.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Performance Tools
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Performance optimization, caching strategies, database tuning, and load balancing
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Dashboard Tabs */}
      <Card sx={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 64,
              },
            }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="System Health" 
              iconPosition="start"
            />
            <Tab 
              icon={<UsersIcon />} 
              label="User Management" 
              iconPosition="start"
            />
            <Tab 
              icon={<MetricsIcon />} 
              label="Metrics & Analytics" 
              iconPosition="start"
            />
            <Tab 
              icon={<LogsIcon />} 
              label="System Logs" 
              iconPosition="start"
            />
            <Tab 
              icon={<SettingsIcon />} 
              label="System Settings" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <SystemHealthOverview 
            systemHealth={systemHealth} 
            loading={loading}
            onRefresh={refreshData}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <UserManagement 
            users={users}
            loading={loading}
            onRefresh={refreshData}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <SystemMetrics 
            metrics={metrics}
            loading={loading}
            onRefresh={refreshData}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <LogViewer />
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <SystemSettings />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default AdminDashboardPage;