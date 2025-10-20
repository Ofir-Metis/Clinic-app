import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Alert,
  Stack,
} from '@mui/material';
import { Lock as LockIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const state = location.state as {
    requiredRole?: string | string[];
    requiredPermission?: string;
    currentPath?: string;
    message?: string;
  } | null;

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoHome = () => {
    // Navigate based on user role
    if (user?.role === 'client') {
      navigate('/client/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="md">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        py={4}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 600,
            width: '100%',
          }}
        >
          <Box mb={3}>
            <LockIcon
              sx={{
                fontSize: 80,
                color: 'error.main',
                mb: 2,
              }}
            />
            <Typography variant="h3" component="h1" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              You don't have permission to access this page
            </Typography>
          </Box>

          {state?.message && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {state.message}
            </Alert>
          )}

          {(state?.requiredRole || state?.requiredPermission) && (
            <Box mb={3}>
              <Typography variant="body2" color="textSecondary">
                This page requires:
              </Typography>
              {state.requiredRole && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Role:</strong> {Array.isArray(state.requiredRole) ? state.requiredRole.join(', ') : state.requiredRole}
                </Typography>
              )}
              {state.requiredPermission && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Permission:</strong> {state.requiredPermission}
                </Typography>
              )}
            </Box>
          )}

          {user && (
            <Box mb={3}>
              <Typography variant="body2" color="textSecondary">
                You are currently logged in as:
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>{user.email}</strong> ({user.role})
              </Typography>
            </Box>
          )}

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              onClick={handleGoHome}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage;