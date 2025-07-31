/**
 * useGoogleIntegration - Hook for managing Google integration state and operations
 * Provides centralized state management for Google account connections and settings
 */

import { useState, useEffect, useCallback } from 'react';
import { GoogleAccount } from '../components/google/GoogleAccountConnection';

interface GoogleIntegrationState {
  accounts: GoogleAccount[];
  isLoading: boolean;
  error: string | null;
  hasActiveAccount: boolean;
  primaryAccount: GoogleAccount | null;
}

interface GoogleIntegrationConfig {
  automaticCalendarSync: boolean;
  defaultMeetingDuration: number;
  sendReminderEmails: boolean;
  reminderTimeBefore: number;
  includeClientInCalendar: boolean;
  autoGenerateMeetLinks: boolean;
  useCustomEmailTemplates: boolean;
  syncBidirectional: boolean;
  conflictResolution: 'manual' | 'automatic' | 'notify';
  notificationPreferences: {
    syncErrors: boolean;
    accountExpiry: boolean;
    permissionChanges: boolean;
    weeklyDigest: boolean;
  };
}

interface UseGoogleIntegrationReturn {
  // State
  state: GoogleIntegrationState;
  config: GoogleIntegrationConfig;
  
  // Actions
  loadAccounts: () => Promise<void>;
  connectAccount: () => Promise<string>; // Returns OAuth URL
  disconnectAccount: (accountId: string) => Promise<void>;
  updateAccountPermissions: (accountId: string, permissions: Partial<GoogleAccount['permissions']>) => Promise<void>;
  updateConfig: (newConfig: Partial<GoogleIntegrationConfig>) => Promise<void>;
  refreshAccountStatus: (accountId: string) => Promise<void>;
  testConnection: (accountId: string) => Promise<{ success: boolean; message: string }>;
  
  // Utilities
  canCreateMeetLinks: boolean;
  canSyncCalendar: boolean;
  canSendEmails: boolean;
}

export const useGoogleIntegration = (userId: string): UseGoogleIntegrationReturn => {
  const [state, setState] = useState<GoogleIntegrationState>({
    accounts: [],
    isLoading: false,
    error: null,
    hasActiveAccount: false,
    primaryAccount: null
  });

  const [config, setConfig] = useState<GoogleIntegrationConfig>({
    automaticCalendarSync: true,
    defaultMeetingDuration: 60,
    sendReminderEmails: true,
    reminderTimeBefore: 24,
    includeClientInCalendar: true,
    autoGenerateMeetLinks: true,
    useCustomEmailTemplates: false,
    syncBidirectional: false,
    conflictResolution: 'manual',
    notificationPreferences: {
      syncErrors: true,
      accountExpiry: true,
      permissionChanges: true,
      weeklyDigest: false
    }
  });

  // Load accounts from API
  const loadAccounts = useCallback(async () => {
    if (!userId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/google/accounts?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load Google accounts');
      }

      const data = await response.json();
      const accounts = data.accounts || [];
      const activeAccount = accounts.find((acc: GoogleAccount) => acc.isActive);

      setState({
        accounts,
        isLoading: false,
        error: null,
        hasActiveAccount: !!activeAccount,
        primaryAccount: activeAccount || null
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load accounts'
      }));
    }
  }, [userId]);

  // Load configuration from API
  const loadConfig = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/google/config?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || config);
      }
    } catch (error) {
      console.warn('Failed to load Google integration config:', error);
      // Use default config
    }
  }, [userId, config]);

  // Connect new Google account
  const connectAccount = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/google/auth/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          userId,
          scopes: ['calendar', 'email', 'meet'],
          redirectUri: `${window.location.origin}/google/callback`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get OAuth URL');
      }

      const data = await response.json();
      return data.authUrl;

    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to start connection process');
    }
  }, [userId]);

  // Disconnect Google account
  const disconnectAccount = useCallback(async (accountId: string) => {
    try {
      const response = await fetch(`/api/google/accounts/${accountId}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }

      // Update local state
      setState(prev => {
        const accounts = prev.accounts.filter(acc => acc.id !== accountId);
        const activeAccount = accounts.find(acc => acc.isActive);

        return {
          ...prev,
          accounts,
          hasActiveAccount: !!activeAccount,
          primaryAccount: activeAccount || null
        };
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to disconnect account'
      }));
      throw error;
    }
  }, []);

  // Update account permissions
  const updateAccountPermissions = useCallback(async (
    accountId: string, 
    permissions: Partial<GoogleAccount['permissions']>
  ) => {
    try {
      const response = await fetch(`/api/google/accounts/${accountId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(permissions),
      });

      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }

      // Update local state
      setState(prev => ({
        ...prev,
        accounts: prev.accounts.map(acc => 
          acc.id === accountId 
            ? { 
                ...acc, 
                permissions: { ...acc.permissions, ...permissions },
                calendarSyncEnabled: permissions.calendar !== undefined ? permissions.calendar : acc.calendarSyncEnabled,
                emailSyncEnabled: permissions.email !== undefined ? permissions.email : acc.emailSyncEnabled
              }
            : acc
        )
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update permissions'
      }));
      throw error;
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback(async (newConfig: Partial<GoogleIntegrationConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };

      const response = await fetch('/api/google/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          userId,
          config: updatedConfig
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setConfig(updatedConfig);

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save configuration'
      }));
      throw error;
    }
  }, [userId, config]);

  // Refresh account status
  const refreshAccountStatus = useCallback(async (accountId: string) => {
    try {
      const response = await fetch(`/api/google/accounts/${accountId}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh account status');
      }

      const data = await response.json();

      // Update local state
      setState(prev => ({
        ...prev,
        accounts: prev.accounts.map(acc => 
          acc.id === accountId 
            ? { ...acc, ...data.account }
            : acc
        )
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh account status'
      }));
    }
  }, []);

  // Test connection
  const testConnection = useCallback(async (accountId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`/api/google/accounts/${accountId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Connection test failed');
      }

      const data = await response.json();
      return {
        success: data.success,
        message: data.message || 'Connection test completed'
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadAccounts();
    loadConfig();
  }, [loadAccounts, loadConfig]);

  // Compute utility flags
  const canCreateMeetLinks = state.hasActiveAccount && 
    state.primaryAccount?.permissions.meet && 
    config.autoGenerateMeetLinks;

  const canSyncCalendar = state.hasActiveAccount && 
    state.primaryAccount?.permissions.calendar && 
    config.automaticCalendarSync;

  const canSendEmails = state.hasActiveAccount && 
    state.primaryAccount?.permissions.email && 
    config.sendReminderEmails;

  return {
    state,
    config,
    loadAccounts,
    connectAccount,
    disconnectAccount,
    updateAccountPermissions,
    updateConfig,
    refreshAccountStatus,
    testConnection,
    canCreateMeetLinks,
    canSyncCalendar,
    canSendEmails
  };
};