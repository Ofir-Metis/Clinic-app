import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface CsrfTokenConfig {
  headerName: string;
  fieldName: string;
  cookieName: string;
  paramName: string;
}

interface CsrfTokenData {
  token: string;
  config: CsrfTokenConfig;
  expiry: string | null;
}

interface UseCsrfTokenReturn {
  token: string | null;
  config: CsrfTokenConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshToken: () => Promise<void>;
  clearToken: () => Promise<void>;
  getTokenForRequest: () => string | null;
  isTokenExpired: () => boolean;
}

/**
 * React hook for managing CSRF tokens
 * 
 * Provides:
 * - Automatic CSRF token fetching and management
 * - Token refresh functionality
 * - Expiry checking
 * - Easy integration with API requests
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { token, getTokenForRequest, refreshToken } = useCsrfToken();
 *   
 *   const handleSubmit = async (data) => {
 *     try {
 *       await api.post('/users', data, {
 *         headers: {
 *           'X-CSRF-Token': getTokenForRequest()
 *         }
 *       });
 *     } catch (error) {
 *       if (error.response?.status === 403) {
 *         await refreshToken();
 *         // Retry request
 *       }
 *     }
 *   };
 * }
 * ```
 */
export function useCsrfToken(): UseCsrfTokenReturn {
  const [token, setToken] = useState<string | null>(null);
  const [config, setConfig] = useState<CsrfTokenConfig | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch CSRF token from server
   */
  const fetchToken = useCallback(async () => {
    if (process.env.REACT_APP_CSRF_ENABLED !== 'true') {
      return; // CSRF protection disabled
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<CsrfTokenData>('/csrf/token');
      const { csrfToken, config: tokenConfig, expiry: tokenExpiry } = response.data;

      setToken(csrfToken);
      setConfig(tokenConfig);
      setExpiry(tokenExpiry);

      // Store token in sessionStorage for persistence across page reloads
      sessionStorage.setItem('csrf_token', csrfToken);
      sessionStorage.setItem('csrf_config', JSON.stringify(tokenConfig));
      sessionStorage.setItem('csrf_expiry', tokenExpiry || '');

      console.debug('CSRF token fetched successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch CSRF token';
      setError(errorMessage);
      console.error('Failed to fetch CSRF token:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh CSRF token (invalidate current and get new one)
   */
  const refreshToken = useCallback(async () => {
    if (process.env.REACT_APP_CSRF_ENABLED !== 'true') {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<CsrfTokenData>('/csrf/refresh');
      const { csrfToken, config: tokenConfig, expiry: tokenExpiry } = response.data;

      setToken(csrfToken);
      setConfig(tokenConfig);
      setExpiry(tokenExpiry);

      // Update sessionStorage
      sessionStorage.setItem('csrf_token', csrfToken);
      sessionStorage.setItem('csrf_config', JSON.stringify(tokenConfig));
      sessionStorage.setItem('csrf_expiry', tokenExpiry || '');

      console.debug('CSRF token refreshed successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to refresh CSRF token';
      setError(errorMessage);
      console.error('Failed to refresh CSRF token:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear CSRF token from client and server
   */
  const clearToken = useCallback(async () => {
    try {
      await api.post('/csrf/clear');
    } catch (err) {
      console.warn('Failed to clear CSRF token on server:', err);
    }

    // Clear client-side storage
    setToken(null);
    setConfig(null);
    setExpiry(null);
    setError(null);

    sessionStorage.removeItem('csrf_token');
    sessionStorage.removeItem('csrf_config');
    sessionStorage.removeItem('csrf_expiry');

    console.debug('CSRF token cleared');
  }, []);

  /**
   * Get token for use in API requests
   */
  const getTokenForRequest = useCallback((): string | null => {
    if (process.env.REACT_APP_CSRF_ENABLED !== 'true') {
      return null; // CSRF protection disabled
    }

    // Check if token is expired
    if (isTokenExpired()) {
      console.warn('CSRF token is expired, consider refreshing');
      return null;
    }

    return token;
  }, [token, expiry]);

  /**
   * Check if current token is expired
   */
  const isTokenExpired = useCallback((): boolean => {
    if (!expiry) return true;
    
    const expiryDate = new Date(expiry);
    const now = new Date();
    
    return now >= expiryDate;
  }, [expiry]);

  /**
   * Load token from sessionStorage on component mount
   */
  useEffect(() => {
    if (process.env.REACT_APP_CSRF_ENABLED !== 'true') {
      return; // CSRF protection disabled
    }

    const storedToken = sessionStorage.getItem('csrf_token');
    const storedConfig = sessionStorage.getItem('csrf_config');
    const storedExpiry = sessionStorage.getItem('csrf_expiry');

    if (storedToken && storedConfig) {
      setToken(storedToken);
      setConfig(JSON.parse(storedConfig));
      setExpiry(storedExpiry || null);

      // Check if stored token is expired
      if (storedExpiry) {
        const expiryDate = new Date(storedExpiry);
        if (new Date() >= expiryDate) {
          console.debug('Stored CSRF token is expired, fetching new one');
          fetchToken();
        }
      }
    } else {
      // No stored token, fetch new one
      fetchToken();
    }
  }, [fetchToken]);

  /**
   * Auto-refresh token before expiry
   */
  useEffect(() => {
    if (!expiry || process.env.REACT_APP_CSRF_ENABLED !== 'true') {
      return;
    }

    const expiryDate = new Date(expiry);
    const now = new Date();
    const timeUntilExpiry = expiryDate.getTime() - now.getTime();

    // Refresh token 5 minutes before expiry
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000);

    if (refreshTime > 0) {
      const timeout = setTimeout(() => {
        console.debug('Auto-refreshing CSRF token before expiry');
        refreshToken();
      }, refreshTime);

      return () => clearTimeout(timeout);
    }
  }, [expiry, refreshToken]);

  return {
    token,
    config,
    isLoading,
    error,
    refreshToken,
    clearToken,
    getTokenForRequest,
    isTokenExpired,
  };
}

/**
 * Higher-order function to automatically add CSRF token to API requests
 */
export function withCsrfToken(
  token: string | null,
  config: CsrfTokenConfig | null
) {
  return (requestConfig: any = {}) => {
    if (process.env.REACT_APP_CSRF_ENABLED !== 'true' || !token || !config) {
      return requestConfig;
    }

    return {
      ...requestConfig,
      headers: {
        ...requestConfig.headers,
        [config.headerName]: token,
      },
    };
  };
}