import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

interface PrivateRouteProps {
  children: JSX.Element;
  requiredRole?: string | string[];
}

/**
 * Direct localStorage-based route protection (bypasses AuthContext to avoid runtime errors)
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check for authentication tokens (multiple possible keys)
        const accessToken = localStorage.getItem('accessToken') || 
                           localStorage.getItem('clinic_access_token') ||
                           localStorage.getItem('authToken') ||
                           localStorage.getItem('token');
        
        const userData = localStorage.getItem('user') || 
                        localStorage.getItem('clinic_user');
        
        // First check: Must have both token and user data
        if (!accessToken || !userData) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Second check: Validate token with server (when endpoint is available)
        let serverValidated = true; // Default to true for backward compatibility
        try {
          const response = await fetch('/auth/verify', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const verificationData = await response.json();
            serverValidated = verificationData.valid;
          } else {
            serverValidated = false;
          }
        } catch (verifyError) {
          // If verification endpoint doesn't exist, fall back to basic JWT validation
          try {
            const base64Url = accessToken.split('.')[1];
            if (base64Url) {
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              
              const tokenData = JSON.parse(jsonPayload);
              const now = Math.floor(Date.now() / 1000);
              serverValidated = tokenData.exp && tokenData.exp > now;
            } else {
              serverValidated = false;
            }
          } catch (jwtError) {
            serverValidated = false;
          }
        }

        const authenticated = serverValidated;
        
        // If token is invalid, clear all authentication data
        if (!authenticated) {
          console.warn('[PrivateRoute] Token validation failed, clearing authentication data');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          localStorage.removeItem('clinic_access_token');
          localStorage.removeItem('clinic_user');
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        let role = null;
        if (authenticated && userData) {
          try {
            const user = JSON.parse(userData);
            role = user.role || 'coach';
          } catch (e) {
            console.warn('[PrivateRoute] Failed to parse user data:', e);
            // Clear corrupted data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('clinic_access_token');
            localStorage.removeItem('clinic_user');
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
        }
        
        setIsAuthenticated(authenticated);
        setUserRole(role);
        setLoading(false);
        
        // Log authentication status (stringify for production)
        if (typeof window !== 'undefined' && window.console) {
          console.log('[PrivateRoute] Auth check for', location.pathname, ':', JSON.stringify({
            authenticated,
            hasAccessToken: !!accessToken,
            hasUserData: !!userData,
            role
          }));
        }
        
      } catch (error) {
        console.error('[PrivateRoute] Error checking authentication:', error);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [location.pathname]);

  // Show loading spinner while checking authentication
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
          Verifying authentication...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[PrivateRoute] Not authenticated, redirecting to login from:', location.pathname);
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Check role-based access if required
  if (requiredRole && userRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!requiredRoles.includes(userRole)) {
      console.log('[PrivateRoute] Role mismatch. User role:', userRole, 'Required:', requiredRoles);
      // Redirect to appropriate dashboard based on role
      if (userRole === 'client') {
        return <Navigate to="/client/dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  console.log('[PrivateRoute] Access granted to:', location.pathname);
  // Render protected content
  return children;
};

export default PrivateRoute;

