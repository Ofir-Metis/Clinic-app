/**
 * ClientPrivateRoute - Protected route wrapper for client authentication
 * Uses the shared AuthContext and validates the user has the 'client' role
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface ClientPrivateRouteProps {
  children: React.ReactNode;
}

const ClientPrivateRoute: React.FC<ClientPrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  if (!isAuthenticated) {
    return <Navigate to="/client/login" replace />;
  }

  // Ensure user has the client role
  if (user?.role !== 'client') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ClientPrivateRoute;