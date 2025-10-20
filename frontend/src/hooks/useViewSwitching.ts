/**
 * useViewSwitching - Hook for managing therapist-client view switching state
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lastActive?: string;
}

interface ViewSwitchingState {
  isImpersonating: boolean;
  originalUserId?: string;
  viewingAsClientId?: string;
  viewingAsClientName?: string;
}

interface ViewSwitchingResponse {
  success: boolean;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  user?: {
    id: string;
    email: string;
    role: string;
    isImpersonating: boolean;
    originalUserId?: string;
    viewingAsClientId?: string;
  };
  message: string;
}

export const useViewSwitching = () => {
  const { user, updateTokens } = useAuth();
  const [currentView, setCurrentView] = useState<ViewSwitchingState>({
    isImpersonating: false,
  });
  const [accessibleClients, setAccessibleClients] = useState<ClientInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Get authorization header
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, []);

  // Load current view switching status
  const loadViewStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/view-switching/status`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load view status');
      }

      const data: ViewSwitchingResponse = await response.json();
      
      if (data.success && data.user) {
        setCurrentView({
          isImpersonating: data.user.isImpersonating,
          originalUserId: data.user.originalUserId,
          viewingAsClientId: data.user.viewingAsClientId,
          viewingAsClientName: undefined, // Will be loaded separately if needed
        });

        // If impersonating, load client name
        if (data.user.isImpersonating && data.user.viewingAsClientId) {
          loadClientName(data.user.viewingAsClientId);
        }
      }
    } catch (error) {
      console.error('Failed to load view status:', error);
      setCurrentView({ isImpersonating: false });
    }
  }, [getAuthHeaders, API_BASE_URL]);

  // Load client name for display
  const loadClientName = useCallback(async (clientId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/view-switching/client/${clientId}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.client) {
          setCurrentView(prev => ({
            ...prev,
            viewingAsClientName: data.client.name,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load client name:', error);
    }
  }, [getAuthHeaders, API_BASE_URL]);

  // Load accessible clients for switching
  const loadAccessibleClients = useCallback(async () => {
    if (currentView.isImpersonating) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/view-switching/accessible-clients`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to load clients');
      }

      const data = await response.json();
      
      if (data.success) {
        setAccessibleClients(data.clients || []);
      } else {
        throw new Error(data.message || 'Failed to load clients');
      }
    } catch (error) {
      console.error('Failed to load accessible clients:', error);
      setError(error instanceof Error ? error.message : 'Failed to load clients');
      setAccessibleClients([]);
    } finally {
      setLoading(false);
    }
  }, [currentView.isImpersonating, getAuthHeaders, API_BASE_URL]);

  // Switch to client view
  const switchToClient = useCallback(async (clientId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/view-switching/switch-to-client`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to switch to client view');
      }

      const data: ViewSwitchingResponse = await response.json();

      if (data.success && data.tokens && data.user) {
        // Update authentication tokens
        updateTokens({
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
          expiresIn: data.tokens.expiresIn,
        });

        // Update view state
        setCurrentView({
          isImpersonating: true,
          originalUserId: data.user.originalUserId,
          viewingAsClientId: data.user.viewingAsClientId,
          viewingAsClientName: accessibleClients.find(c => c.id === clientId)?.name,
        });

        // Clear accessible clients list
        setAccessibleClients([]);

        // Trigger page refresh to update all components
        window.location.reload();
      } else {
        throw new Error(data.message || 'Switch to client view failed');
      }
    } catch (error) {
      console.error('Failed to switch to client view:', error);
      setError(error instanceof Error ? error.message : 'Failed to switch to client view');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, API_BASE_URL, updateTokens, accessibleClients]);

  // Exit impersonation and return to therapist view
  const exitImpersonation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/view-switching/exit-impersonation`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to exit client view');
      }

      const data: ViewSwitchingResponse = await response.json();

      if (data.success && data.tokens) {
        // Update authentication tokens
        updateTokens({
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
          expiresIn: data.tokens.expiresIn,
        });

        // Reset view state
        setCurrentView({ isImpersonating: false });

        // Trigger page refresh to update all components
        window.location.reload();
      } else {
        throw new Error(data.message || 'Exit client view failed');
      }
    } catch (error) {
      console.error('Failed to exit impersonation:', error);
      setError(error instanceof Error ? error.message : 'Failed to exit client view');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, API_BASE_URL, updateTokens]);

  // Load view status on mount and when user changes
  useEffect(() => {
    if (user && (user.role === 'coach' || user.role === 'admin')) {
      loadViewStatus();
    }
  }, [user, loadViewStatus]);

  return {
    // State
    isImpersonating: currentView.isImpersonating,
    currentView,
    accessibleClients,
    loading,
    error,

    // Actions
    switchToClient,
    exitImpersonation,
    loadAccessibleClients,
    loadViewStatus,
  };
};