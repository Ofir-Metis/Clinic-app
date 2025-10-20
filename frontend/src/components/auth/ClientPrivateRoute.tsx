import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface ClientPrivateRouteProps {
  children: React.ReactNode;
}

/**
 * Client-specific route protection component
 * Ensures only authenticated clients can access client portal routes
 */
const ClientPrivateRoute: React.FC<ClientPrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
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
          Verifying client access...
        </Typography>
      </Box>
    );
  }

  // Redirect to client login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/client/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Ensure user has client role
  if (!hasRole('client')) {
    // If authenticated but not a client, redirect to appropriate dashboard
    if (hasRole(['coach', 'admin', 'super_admin'])) {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Otherwise redirect to client login
    return <Navigate to="/client/login" replace />;
  }

  // Render protected client content
  return <>{children}</>;
};

export default ClientPrivateRoute;