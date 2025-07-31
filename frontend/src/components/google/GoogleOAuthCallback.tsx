/**
 * GoogleOAuthCallback - Handles Google OAuth callback and token exchange
 * Processes authorization code and completes the connection flow
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Google as GoogleIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface CallbackState {
  status: 'processing' | 'success' | 'error' | 'cancelled';
  message: string;
  accountEmail?: string;
  permissions?: string[];
}

export const GoogleOAuthCallback: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: 'processing',
    message: 'Processing Google authorization...'
  });

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get authorization code and state from URL params
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Handle user cancellation
        if (error === 'access_denied') {
          setCallbackState({
            status: 'cancelled',
            message: 'Google authorization was cancelled. You can try connecting again from your settings.'
          });
          return;
        }

        // Handle other OAuth errors
        if (error) {
          setCallbackState({
            status: 'error',
            message: `Authorization failed: ${error}. Please try connecting again.`
          });
          return;
        }

        // Validate required parameters
        if (!code) {
          setCallbackState({
            status: 'error',
            message: 'Authorization code not received. Please try connecting again.'
          });
          return;
        }

        setCallbackState({
          status: 'processing',
          message: 'Exchanging authorization code for access tokens...'
        });

        // Exchange authorization code for tokens
        const tokenResponse = await fetch('/api/google/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            code,
            state,
            redirectUri: `${window.location.origin}/google/callback`
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to complete authorization');
        }

        const tokenData = await tokenResponse.json();

        setCallbackState({
          status: 'processing',
          message: 'Setting up Google integration...'
        });

        // Verify account connection and permissions
        const verificationResponse = await fetch(`/api/google/accounts/${tokenData.accountId}/verify`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (!verificationResponse.ok) {
          throw new Error('Failed to verify account connection');
        }

        const verificationData = await verificationResponse.json();

        setCallbackState({
          status: 'success',
          message: 'Google account connected successfully!',
          accountEmail: verificationData.email,
          permissions: verificationData.permissions
        });

        // Redirect to settings after a short delay
        setTimeout(() => {
          navigate('/settings?tab=integrations&success=google-connected', { replace: true });
        }, 3000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setCallbackState({
          status: 'error',
          message: error instanceof Error ? error.message : 'An unexpected error occurred during authorization.'
        });
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate('/settings?tab=integrations', { replace: true });
  };

  const getStatusIcon = () => {
    switch (callbackState.status) {
      case 'processing':
        return <CircularProgress size={48} color="primary" />;
      case 'success':
        return <CheckCircleIcon sx={{ fontSize: 48, color: theme.palette.success.main }} />;
      case 'error':
      case 'cancelled':
        return <ErrorIcon sx={{ fontSize: 48, color: theme.palette.error.main }} />;
      default:
        return <CircularProgress size={48} />;
    }
  };

  const getStatusColor = () => {
    switch (callbackState.status) {
      case 'success':
        return 'success';
      case 'error':
      case 'cancelled':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, rgba(255, 255, 255, 0.8) 100%)`,
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          width: '100%',
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, rgba(255, 255, 255, 0.95) 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(255, 255, 255, 0.25)`,
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)',
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {/* Status Icon */}
          <Box mb={3}>
            {getStatusIcon()}
          </Box>

          {/* Title */}
          <Typography variant="h5" fontWeight={600} mb={2}>
            {callbackState.status === 'processing' && 'Connecting Google Account'}
            {callbackState.status === 'success' && 'Connection Successful! 🎉'}
            {callbackState.status === 'error' && 'Connection Failed'}
            {callbackState.status === 'cancelled' && 'Connection Cancelled'}
          </Typography>

          {/* Message */}
          <Typography variant="body1" color="text.secondary" mb={3}>
            {callbackState.message}
          </Typography>

          {/* Processing Progress */}
          {callbackState.status === 'processing' && (
            <Box mb={3}>
              <LinearProgress sx={{ borderRadius: 1, mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                This may take a few moments...
              </Typography>
            </Box>
          )}

          {/* Success Details */}
          {callbackState.status === 'success' && callbackState.accountEmail && (
            <Alert 
              severity="success" 
              sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}
              icon={<GoogleIcon />}
            >
              <Typography variant="body2" fontWeight={600} mb={1}>
                Connected Account: {callbackState.accountEmail}
              </Typography>
              {callbackState.permissions && callbackState.permissions.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Granted Permissions:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {callbackState.permissions.map((permission) => (
                      <Typography
                        key={permission}
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          backgroundColor: theme.palette.success.light,
                          color: theme.palette.success.contrastText,
                          borderRadius: 1,
                          textTransform: 'capitalize'
                        }}
                      >
                        {permission}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}
            </Alert>
          )}

          {/* Error/Cancelled Actions */}
          {(callbackState.status === 'error' || callbackState.status === 'cancelled') && (
            <Alert 
              severity={getStatusColor()} 
              sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}
            >
              <Typography variant="body2">
                {callbackState.status === 'cancelled' 
                  ? 'No worries! You can connect your Google account anytime from your settings.'
                  : 'Please try connecting again. If the problem persists, contact support.'
                }
              </Typography>
            </Alert>
          )}

          {/* Action Buttons */}
          <Box>
            {callbackState.status === 'success' && (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Redirecting to settings in a moment...
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/settings?tab=integrations', { replace: true })}
                  sx={{ borderRadius: 2 }}
                >
                  Go to Settings Now
                </Button>
              </Stack>
            )}

            {(callbackState.status === 'error' || callbackState.status === 'cancelled') && (
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard', { replace: true })}
                  sx={{ borderRadius: 2 }}
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="contained"
                  onClick={handleRetry}
                  startIcon={<GoogleIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Try Again
                </Button>
              </Stack>
            )}

            {callbackState.status === 'processing' && (
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard', { replace: true })}
                sx={{ borderRadius: 2 }}
              >
                Cancel and Return to Dashboard
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};