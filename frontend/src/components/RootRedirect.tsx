import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Root redirect component with direct localStorage authentication check
 * Bypasses the AuthContext to avoid runtime errors and provides immediate authentication
 */
const RootRedirect: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Direct localStorage check without AuthContext dependency
    const checkAuthentication = () => {
      try {
        // Check for both new and legacy token storage patterns
        const accessToken = localStorage.getItem('accessToken') || 
                           localStorage.getItem('clinic_access_token') ||
                           localStorage.getItem('authToken') ||
                           localStorage.getItem('token');
        
        const userData = localStorage.getItem('user') || 
                        localStorage.getItem('clinic_user');
        
        // User is authenticated if they have both token and user data
        const authenticated = !!(accessToken && userData);
        
        let role = null;
        if (authenticated && userData) {
          try {
            const user = JSON.parse(userData);
            role = user.role || 'coach'; // Default to coach role
          } catch (e) {
            console.warn('Failed to parse user data:', e);
            // If user data is corrupted, clear it and treat as unauthenticated
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('clinic_access_token');
            localStorage.removeItem('clinic_user');
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
        }
        
        setIsAuthenticated(authenticated);
        setUserRole(role);
        setLoading(false);
        
        // Log authentication status for debugging (stringify for production)
        if (typeof window !== 'undefined' && window.console) {
          console.log('[RootRedirect] Authentication check:', JSON.stringify({
            authenticated,
            hasAccessToken: !!accessToken,
            hasUserData: !!userData,
            role
          }));
        }
        
      } catch (error) {
        console.error('[RootRedirect] Error checking authentication:', error);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    // Check authentication immediately
    checkAuthentication();
  }, []);

  // Show loading while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body2" color="textSecondary">
          Checking authentication...
        </Typography>
      </Box>
    );
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    console.log('[RootRedirect] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Redirect authenticated users to role-appropriate dashboard
  if (userRole === 'client') {
    console.log('[RootRedirect] Client role detected, redirecting to client dashboard');
    return <Navigate to="/client/dashboard" replace />;
  }

  // Default to main dashboard for coaches, admins, etc.
  console.log('[RootRedirect] Authenticated user, redirecting to main dashboard');
  return <Navigate to="/dashboard" replace />;
};

export default RootRedirect;