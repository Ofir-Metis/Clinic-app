import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  CssBaseline,
  ThemeProvider,
  Link,
  Typography,
  Paper,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff,
  Lock as LockIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { theme } from '../../theme';
import { GOOGLE_CLIENT_ID } from '../../env';
import { useAuth } from '../../contexts/AuthContext';
import authService, { AuthError } from '../../services/authService';
import LoadingButton from '../../components/LoadingButton';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the intended destination after login
  const from = (location.state as { from?: string })?.from || '/';

  const formik = useFormik({
    initialValues: { 
      email: '', 
      password: '' 
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    }),
    onSubmit: async (values) => {
      setError(null);
      setIsSubmitting(true);

      try {
        const { tokens, user } = await authService.login(values.email, values.password);
        await login(tokens, user);
        
        // Navigate to intended destination
        navigate(from, { replace: true });
      } catch (err) {
        if (err instanceof AuthError) {
          switch (err.statusCode) {
            case 401:
              setError('Invalid email or password. Please try again.');
              break;
            case 403:
              setError('Your account has been temporarily locked. Please contact support.');
              break;
            case 429:
              setError('Too many login attempts. Please try again later.');
              break;
            default:
              setError(err.message || 'Login failed. Please try again.');
          }
        } else {
          setError('An unexpected error occurred. Please check your connection and try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setError(null);
      setIsSubmitting(true);

      // In a real implementation, you would send the Google credential to your backend
      // For now, we'll show a placeholder
      console.log('Google login credential:', credentialResponse);
      setError('Google login is not yet implemented. Please use email/password login.');
    } catch (err) {
      setError('Google login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login was cancelled or failed.');
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ''}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2E7D6B 0%, #1B4D3E 100%)',
            px: 2,
          }}
        >
          <Paper
            elevation={24}
            sx={{
              maxWidth: 440,
              width: '100%',
              p: 4,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {/* Header */}
            <Box textAlign="center" mb={4}>
              <LockIcon
                sx={{
                  fontSize: 60,
                  color: 'primary.main',
                  mb: 2,
                }}
              />
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Welcome Back
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Sign in to your wellness coaching account
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <LoadingButton
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                loading={isSubmitting}
                disabled={!formik.isValid || isSubmitting}
                sx={{ mb: 3, py: 1.5 }}
              >
                Sign In
              </LoadingButton>
            </Box>

            {/* Google Login */}
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="textSecondary">
                OR
              </Typography>
            </Divider>

            <Box display="flex" justifyContent="center" mb={3}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="100%"
                text="signin_with"
                shape="rectangular"
                theme="outline"
                size="large"
              />
            </Box>

            {/* Links */}
            <Stack spacing={2} alignItems="center">
              <Link
                component={RouterLink}
                to="/reset/request"
                variant="body2"
                underline="hover"
              >
                Forgot your password?
              </Link>
              
              <Box textAlign="center">
                <Typography variant="body2" color="textSecondary">
                  Don't have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/register"
                    variant="body2"
                    fontWeight="medium"
                  >
                    Sign up here
                  </Link>
                </Typography>
              </Box>

              <Box textAlign="center">
                <Typography variant="body2" color="textSecondary">
                  Are you a client?{' '}
                  <Link
                    component={RouterLink}
                    to="/client/login"
                    variant="body2"
                    fontWeight="medium"
                  >
                    Client Portal
                  </Link>
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;