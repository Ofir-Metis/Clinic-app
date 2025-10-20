import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Root redirect component that properly handles authentication state
 * Routes users to the appropriate dashboard based on their role
 */
const RootRedirect: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading while checking authentication
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
          Loading...
        </Typography>
      </Box>
    );
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect authenticated users to role-appropriate dashboard
  if (user?.role === 'client') {
    return <Navigate to="/client/dashboard" replace />;
  }

  // Default to main dashboard for coaches, admins, etc.
  return <Navigate to="/dashboard" replace />;
};

export default RootRedirect;