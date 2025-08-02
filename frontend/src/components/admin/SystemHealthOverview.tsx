/**
 * SystemHealthOverview - System health monitoring component
 */

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Speed as MetricsIcon,
  Storage as DatabaseIcon,
  Memory as MemoryIcon,
  Computer as ServerIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface SystemHealthOverviewProps {
  systemHealth: any;
  loading: boolean;
  onRefresh: () => void;
}

const SystemHealthOverview: React.FC<SystemHealthOverviewProps> = ({
  systemHealth,
  loading,
  onRefresh,
}) => {
  if (!systemHealth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
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
        return <ServerIcon />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box>
      {/* Overall Status */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getStatusIcon(systemHealth.status)}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              System Status: {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Services Status */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ServerIcon />
                Microservices Status
              </Typography>
              
              <List dense>
                {systemHealth.services.map((service: any, index: number) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getStatusIcon(service.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={service.name}
                      secondary={`Response time: ${service.responseTime}ms`}
                    />
                    <Chip
                      label={service.status}
                      color={getStatusColor(service.status) as any}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* System Metrics */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MetricsIcon />
                System Metrics
              </Typography>

              {/* Uptime */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    System Uptime
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatUptime(systemHealth.metrics.uptime)}
                  </Typography>
                </Box>
              </Box>

              {/* Memory Usage */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MemoryIcon fontSize="small" />
                    Memory Usage
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {systemHealth.metrics.memory.used}MB / {systemHealth.metrics.memory.total}MB
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={systemHealth.metrics.memory.percentage}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: systemHealth.metrics.memory.percentage > 80 
                        ? 'error.main' 
                        : systemHealth.metrics.memory.percentage > 60 
                        ? 'warning.main' 
                        : 'success.main'
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {systemHealth.metrics.memory.percentage}% used
                </Typography>
              </Box>

              {/* CPU Usage */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    CPU Usage
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {systemHealth.metrics.cpu.usage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={systemHealth.metrics.cpu.usage}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: systemHealth.metrics.cpu.usage > 80 
                        ? 'error.main' 
                        : systemHealth.metrics.cpu.usage > 60 
                        ? 'warning.main' 
                        : 'info.main'
                    }
                  }}
                />
              </Box>

              {/* Database */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DatabaseIcon fontSize="small" />
                  Database
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption">
                    Connections: {systemHealth.metrics.database.connections}
                  </Typography>
                  <Typography variant="caption">
                    Queries: {systemHealth.metrics.database.queries}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Alerts */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon />
                Active Alerts ({systemHealth.alerts.filter((a: any) => !a.resolved).length})
              </Typography>

              {systemHealth.alerts.filter((alert: any) => !alert.resolved).length === 0 ? (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  No active alerts. System is running smoothly.
                </Alert>
              ) : (
                <Box>
                  {systemHealth.alerts
                    .filter((alert: any) => !alert.resolved)
                    .map((alert: any, index: number) => (
                      <Alert
                        key={alert.id}
                        severity={alert.level as any}
                        sx={{ 
                          mb: index < systemHealth.alerts.filter((a: any) => !a.resolved).length - 1 ? 2 : 0,
                          borderRadius: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(alert.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      </Alert>
                    ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemHealthOverview;