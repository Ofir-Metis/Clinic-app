import React, { createContext, useContext } from 'react';

/**
 * Authentication context providing the current user ID.
 */
export interface AuthContextValue {
  userId: number;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  /**
   * Authenticated user identifier. In real application this would come
   * from decoded authentication tokens or user session.
   */
  userId?: number;
}

/**
 * Provides authentication data to descendant components.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, userId = 1 }) => (
  <AuthContext.Provider value={{ userId }}>{children}</AuthContext.Provider>
);

/**
 * Hook returning the authenticated user information.
 * @throws if used outside of `AuthProvider`.
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
