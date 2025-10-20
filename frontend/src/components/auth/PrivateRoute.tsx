import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string;
  fallbackPath?: string;
}

/**
 * Production-grade route protection component
 * - Integrates with AuthContext for proper state management
 * - Supports role-based and permission-based access control
 * - Handles loading states properly
 * - Preserves intended destination for redirect after login
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
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
    return (
      <Navigate
        to={fallbackPath}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ 
          requiredRole,
          currentPath: location.pathname,
          message: 'You do not have permission to access this page.'
        }}
      />
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ 
          requiredPermission,
          currentPath: location.pathname,
          message: 'You do not have the required permissions to access this page.'
        }}
      />
    );
  }

  // Render protected content
  return <>{children}</>;
};

export default PrivateRoute;