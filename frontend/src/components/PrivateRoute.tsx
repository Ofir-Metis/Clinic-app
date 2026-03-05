import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: JSX.Element;
  requiredRole?: string | string[];
}

/**
 * Protected route wrapper - requires valid authentication via AuthContext
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading: loading, user } = useAuth();
  const location = useLocation();
  const userRole = user?.role || null;

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
    const loginPath = location.pathname.startsWith('/client') ? '/client/login' : '/login';
    console.log('[PrivateRoute] Not authenticated, redirecting to', loginPath, 'from:', location.pathname);
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Block client users from accessing admin/coach routes
  if (userRole === 'client' && !location.pathname.startsWith('/client')) {
    console.log('[PrivateRoute] Client user trying to access non-client route:', location.pathname);
    return <Navigate to="/client/dashboard" replace />;
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

