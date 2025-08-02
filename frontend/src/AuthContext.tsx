import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  role: 'coach' | 'client' | 'admin';
  name?: string;
  avatar?: string;
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Authentication context providing user and token management.
 */
export interface AuthContextValue {
  // Legacy support
  userId: number;
  
  // Enhanced auth features
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Token management
  accessToken: string | null;
  refreshToken: string | null;
  
  // Actions
  login: (tokens: TokenData, user: User) => void;
  logout: () => void;
  updateTokens: (tokens: TokenData) => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  /**
   * Legacy user ID for backward compatibility
   */
  userId?: number;
}

/**
 * Provides authentication data to descendant components.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  userId = 1 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedAccessToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    const savedUser = localStorage.getItem('user');

    if (savedAccessToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setAccessToken(savedAccessToken);
        setRefreshToken(savedRefreshToken);
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        // Clear invalid data
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = (tokens: TokenData, userData: User) => {
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setUser(userData);

    // Save to localStorage
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);

    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const updateTokens = (tokens: TokenData) => {
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);

    // Update localStorage
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const contextValue: AuthContextValue = {
    // Legacy support
    userId,
    
    // Enhanced auth features
    user,
    isAuthenticated: !!accessToken && !!user,
    loading,
    
    // Token management
    accessToken,
    refreshToken,
    
    // Actions
    login,
    logout,
    updateTokens,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook returning the authenticated user information.
 * @throws if used outside of `AuthProvider`.
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
