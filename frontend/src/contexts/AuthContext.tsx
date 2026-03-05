import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

// Types
export interface User {
  id: string;
  email: string;
  role: 'coach' | 'client' | 'admin' | 'super_admin';
  name?: string;
  avatar?: string;
  permissions?: string[];
  coachId?: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
  permissions?: string[];
  coachId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
}

export interface AuthContextValue extends AuthState {
  // Legacy compatibility
  userId: number;
  loading: boolean;  // Alias for isLoading

  // Token management
  login: (tokens: TokenData, userData?: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<boolean>;
  updateUser: (userData: User) => void;
  updateTokens: (tokens: TokenData) => void;  // Legacy compatibility
  checkAuthStatus: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

// Constants
const ACCESS_TOKEN_KEY = 'clinic_access_token';
const REFRESH_TOKEN_KEY = 'clinic_refresh_token';
const USER_KEY = 'clinic_user';
const TOKEN_EXPIRY_KEY = 'clinic_token_expiry';

// Token refresh threshold (5 minutes before expiry)
const REFRESH_THRESHOLD = 5 * 60 * 1000;

// Session inactivity timeout (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const ACTIVITY_DEBOUNCE = 30 * 1000; // Debounce activity tracking to every 30s

// Create context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Utility functions
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;

  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
};

const extractUserFromToken = (token: string): User | null => {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role as User['role'],
      permissions: decoded.permissions || [],
      coachId: decoded.coachId
    };
  } catch {
    return null;
  }
};

const clearStoredAuth = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

// Auth Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null,
  });

  // Initialize auth state from storage
  useEffect(() => {
    initializeAuth();
  }, []);

  // Auto-refresh token when nearing expiry
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.tokenExpiry) return;

    const timeUntilExpiry = authState.tokenExpiry - Date.now();
    if (timeUntilExpiry <= REFRESH_THRESHOLD) {
      refreshAuthToken();
      return;
    }

    const timeoutId = setTimeout(() => {
      refreshAuthToken();
    }, timeUntilExpiry - REFRESH_THRESHOLD);

    return () => clearTimeout(timeoutId);
  }, [authState.tokenExpiry, authState.isAuthenticated]);

  // Session inactivity timeout
  const lastActivityRef = useRef(Date.now());
  const logoutRef = useRef<() => Promise<void>>();

  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Debounced activity handler to avoid excessive updates
    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedActivity = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateActivity, ACTIVITY_DEBOUNCE);
    };

    // Track user activity
    window.addEventListener('mousemove', debouncedActivity);
    window.addEventListener('keydown', debouncedActivity);
    window.addEventListener('click', debouncedActivity);
    window.addEventListener('scroll', debouncedActivity);
    window.addEventListener('touchstart', debouncedActivity);

    // Set initial activity
    updateActivity();

    // Check inactivity every minute
    const inactivityCheck = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT && logoutRef.current) {
        logoutRef.current();
      }
    }, 60 * 1000);

    return () => {
      clearTimeout(debounceTimer);
      clearInterval(inactivityCheck);
      window.removeEventListener('mousemove', debouncedActivity);
      window.removeEventListener('keydown', debouncedActivity);
      window.removeEventListener('click', debouncedActivity);
      window.removeEventListener('scroll', debouncedActivity);
      window.removeEventListener('touchstart', debouncedActivity);
    };
  }, [authState.isAuthenticated]);

  const initializeAuth = useCallback(async () => {
    try {
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

      if (!storedAccessToken) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Validate stored token
      if (!isTokenValid(storedAccessToken)) {
        // Try to refresh with refresh token
        if (storedRefreshToken && isTokenValid(storedRefreshToken)) {
          const refreshed = await refreshAuthToken();
          if (!refreshed) {
            clearStoredAuth();
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          clearStoredAuth();
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
        return;
      }

      // Parse stored user or extract from token
      let user: User | null = null;
      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch {
          user = extractUserFromToken(storedAccessToken);
        }
      } else {
        user = extractUserFromToken(storedAccessToken);
      }

      if (user) {
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          accessToken: storedAccessToken,
          refreshToken: storedRefreshToken,
          tokenExpiry: storedExpiry ? parseInt(storedExpiry, 10) : null,
        });
      } else {
        clearStoredAuth();
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      clearStoredAuth();
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (tokens: TokenData, userData?: User) => {
    try {
      const { accessToken, refreshToken, expiresIn } = tokens;

      // Validate token
      if (!isTokenValid(accessToken)) {
        throw new Error('Invalid access token');
      }

      // Extract or use provided user data
      const user = userData || extractUserFromToken(accessToken);
      if (!user) {
        throw new Error('Failed to extract user data from token');
      }

      // Calculate expiry
      const tokenExpiry = Date.now() + (expiresIn * 1000);

      // Store in localStorage
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_EXPIRY_KEY, tokenExpiry.toString());

      // Update state
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        accessToken,
        refreshToken,
        tokenExpiry,
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint if needed
      if (authState.accessToken) {
        // Optional: Call API logout endpoint
        // await api.post('/auth/logout', {}, {
        //   headers: { Authorization: `Bearer ${authState.accessToken}` }
        // });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear everything
      clearStoredAuth();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null,
      });
    }
  }, [authState.accessToken]);

  // Keep ref updated for inactivity timer (avoids stale closure)
  useEffect(() => {
    logoutRef.current = logout;
  });

  const refreshAuthToken = useCallback(async (): Promise<boolean> => {
    try {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!storedRefreshToken || !isTokenValid(storedRefreshToken)) {
        await logout();
        return false;
      }

      // Call refresh endpoint
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!response.ok) {
        await logout();
        return false;
      }

      const data = await response.json();
      await login(data, authState.user || undefined);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      return false;
    }
  }, [authState.user, login, logout]);

  const updateUser = useCallback((userData: User) => {
    setAuthState(prev => ({ ...prev, user: userData }));
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  }, []);

  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    if (!authState.accessToken) return false;

    if (!isTokenValid(authState.accessToken)) {
      return await refreshAuthToken();
    }

    return true;
  }, [authState.accessToken, refreshAuthToken]);

  const hasPermission = useCallback((permission: string): boolean => {
    return authState.user?.permissions?.includes(permission) || false;
  }, [authState.user?.permissions]);

  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!authState.user?.role) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(authState.user.role);
  }, [authState.user?.role]);

  // Legacy compatibility: updateTokens (same as re-login with existing user)
  const updateTokens = useCallback(async (tokens: TokenData) => {
    await login(tokens, authState.user || undefined);
  }, [login, authState.user]);

  const contextValue: AuthContextValue = {
    ...authState,
    // Legacy compatibility aliases
    userId: authState.user?.id ? parseInt(authState.user.id, 10) || 1 : 1,
    loading: authState.isLoading,
    // Actions
    login,
    logout,
    refreshAuthToken,
    updateUser,
    updateTokens,
    checkAuthStatus,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;