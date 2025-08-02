/**
 * useAdminData - Hook for managing admin dashboard data
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    lastCheck: string;
    details?: any;
  }[];
  metrics: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    database: {
      connections: number;
      queries: number;
    };
  };
  alerts: {
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
  }[];
}

interface Users {
  users: {
    id: string;
    email: string;
    role: string;
    status: 'active' | 'inactive' | 'suspended';
    lastLogin: string;
    createdAt: string;
    subscription?: {
      plan: string;
      status: string;
      expiresAt: string;
    };
  }[];
  stats: {
    totalUsers: number;
    activeUsers: number;
    therapists: number;
    clients: number;
    admins: number;
  };
}

interface Metrics {
  current: {
    uptime: number;
    memory: { used: number; total: number; percentage: number };
    cpu: { usage: number };
    database: { connections: number; queries: number };
  };
  history: {
    timestamp: string;
    memory: number;
    cpu: number;
    requests: number;
    responseTime: number;
  }[];
  timeframe: string;
}

export const useAdminData = () => {
  const { accessToken } = useAuth();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [users, setUsers] = useState<Users | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Get authorization headers
  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  }), [accessToken]);

  // Fetch system health
  const fetchSystemHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/health`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch system health');
    }
  }, [API_BASE_URL, getAuthHeaders]);

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }, [API_BASE_URL, getAuthHeaders]);

  // Fetch metrics data
  const fetchMetrics = useCallback(async (timeframe: string = '1h') => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/metrics?timeframe=${timeframe}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch metrics');
    }
  }, [API_BASE_URL, getAuthHeaders]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchSystemHealth(),
        fetchUsers(),
        fetchMetrics(),
      ]);
    } catch (error) {
      console.error('Failed to refresh admin data:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchSystemHealth, fetchUsers, fetchMetrics]);

  // Load data on mount and when access token changes
  useEffect(() => {
    if (accessToken) {
      refreshData();
    }
  }, [accessToken, refreshData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!accessToken) return;

    const interval = setInterval(() => {
      fetchSystemHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, [accessToken, fetchSystemHealth]);

  // Admin API functions
  const updateUserStatus = useCallback(async (
    userId: string,
    status: 'active' | 'inactive' | 'suspended',
    reason?: string
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, reason }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Refresh users data
      await fetchUsers();
      
      return result;
    } catch (error) {
      console.error('Failed to update user status:', error);
      throw error;
    }
  }, [API_BASE_URL, getAuthHeaders, fetchUsers]);

  const updateSubscription = useCallback(async (
    subscriptionId: string,
    updates: {
      plan?: string;
      status?: string;
      expiresAt?: string;
    }
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Refresh users data
      await fetchUsers();
      
      return result;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  }, [API_BASE_URL, getAuthHeaders, fetchUsers]);

  const executeMaintenanceTask = useCallback(async (
    task: 'cleanup-logs' | 'optimize-db' | 'clear-cache' | 'backup-data',
    parameters?: Record<string, any>
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/maintenance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ task, parameters }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Refresh system health after maintenance
      await fetchSystemHealth();
      
      return result;
    } catch (error) {
      console.error('Failed to execute maintenance task:', error);
      throw error;
    }
  }, [API_BASE_URL, getAuthHeaders, fetchSystemHealth]);

  const getSystemLogs = useCallback(async (filters: {
    level?: string;
    service?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/admin/logs?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get system logs:', error);
      throw error;
    }
  }, [API_BASE_URL, getAuthHeaders]);

  const getSystemConfig = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/config`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get system config:', error);
      throw error;
    }
  }, [API_BASE_URL, getAuthHeaders]);

  const updateSystemConfig = useCallback(async (config: Record<string, any>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update system config:', error);
      throw error;
    }
  }, [API_BASE_URL, getAuthHeaders]);

  return {
    // Data
    systemHealth,
    users,
    metrics,
    loading,
    error,

    // Actions
    refreshData,
    updateUserStatus,
    updateSubscription,
    executeMaintenanceTask,
    getSystemLogs,
    getSystemConfig,
    updateSystemConfig,
    
    // Fetch specific data
    fetchSystemHealth,
    fetchUsers,
    fetchMetrics,
  };
};