/**
 * SystemMetrics - System metrics and analytics component
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import {
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAdminData } from '../../hooks/useAdminData';

interface SystemMetricsProps {
  metrics: any;
  loading: boolean;
  onRefresh: () => void;
}

const SystemMetrics: React.FC<SystemMetricsProps> = ({
  metrics,
  loading,
  onRefresh,
}) => {
  const { fetchMetrics } = useAdminData();
  const [timeframe, setTimeframe] = useState('1h');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [metricsLoading, setMetricsLoading] = useState(false);

  const handleTimeframeChange = async (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    setMetricsLoading(true);
    try {
      await fetchMetrics(newTimeframe);
    } finally {
      setMetricsLoading(false);
    }
  };

  if (!metrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const timeframeOptions = [
    { value: '15m', label: 'Last 15 minutes' },
    { value: '1h', label: 'Last hour' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
  ];

  const metricOptions = [
    { value: 'all', label: 'All Metrics' },
    { value: 'memory', label: 'Memory Usage' },
    { value: 'cpu', label: 'CPU Usage' },
    { value: 'requests', label: 'Request Volume' },
    { value: 'responseTime', label: 'Response Time' },
  ];

  const formatXAxisLabel = (value: string) => {
    const date = new Date(value);
    if (timeframe === '15m' || timeframe === '1h') {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (timeframe === '24h') {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Timeframe</InputLabel>
          <Select
            value={timeframe}
            label="Timeframe"
            onChange={(e) => handleTimeframeChange(e.target.value)}
            disabled={metricsLoading}
          >
            {timeframeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Metric</InputLabel>
          <Select
            value={selectedMetric}
            label="Metric"
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            {metricOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={metricsLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={onRefresh}
          disabled={loading || metricsLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Current Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {metrics.current.memory.percentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Memory Usage
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics.current.memory.used}MB / {metrics.current.memory.total}MB
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {metrics.current.cpu.usage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                CPU Usage
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {metrics.current.database.connections}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                DB Connections
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {Math.round(metrics.current.uptime / 3600)}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System Uptime
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {(selectedMetric === 'all' || selectedMetric === 'memory') && (
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon />
                  Memory Usage Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatXAxisLabel}
                      fontSize={12}
                    />
                    <YAxis 
                      label={{ value: 'Memory (%)', angle: -90, position: 'insideLeft' }}
                      fontSize={12}
                    />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`${value}%`, 'Memory Usage']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="memory" 
                      stroke="#2E7D6B" 
                      fill="#2E7D6B" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {(selectedMetric === 'all' || selectedMetric === 'cpu') && (
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  CPU Usage Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatXAxisLabel}
                      fontSize={12}
                    />
                    <YAxis 
                      label={{ value: 'CPU (%)', angle: -90, position: 'insideLeft' }}
                      fontSize={12}
                    />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`${value}%`, 'CPU Usage']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cpu" 
                      stroke="#8B5A87" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {(selectedMetric === 'all' || selectedMetric === 'requests') && (
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Request Volume Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatXAxisLabel}
                      fontSize={12}
                    />
                    <YAxis 
                      label={{ value: 'Requests', angle: -90, position: 'insideLeft' }}
                      fontSize={12}
                    />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [value, 'Requests']}
                    />
                    <Bar dataKey="requests" fill="#F4A261" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {(selectedMetric === 'all' || selectedMetric === 'responseTime') && (
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Response Time Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatXAxisLabel}
                      fontSize={12}
                    />
                    <YAxis 
                      label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
                      fontSize={12}
                    />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`${value}ms`, 'Response Time']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#E8934A" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default SystemMetrics;