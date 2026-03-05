import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  IconButton,
  InputAdornment,
  CssBaseline,
  ThemeProvider,
  Link,
  Typography,
  LinearProgress,
  MenuItem,
  Select,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import zxcvbn from 'zxcvbn';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { logger } from '../logger';
import { theme } from '../theme';
import { GOOGLE_CLIENT_ID } from '../env';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { login as authLogin, api } from '../api/auth';
import { useAuth } from '../AuthContext';
import ErrorAlert from '../components/ErrorAlert';
import LoadingButton from '../components/LoadingButton';
import LoadingOverlay from '../components/LoadingOverlay';
import { usePageTitle } from '../hooks/usePageTitle';

const LoginPage: React.FC = () => {
  const { t, i18n, translations } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { error, handleError, clearError, setRetryAction } = useErrorHandler();
  const { login } = useAuth();

  // Set page title and meta tags
  usePageTitle({
    title: 'Login',
    description: 'Sign in to your wellness coaching account. Access your dashboard, manage clients, and continue your growth journey.',
    keywords: 'login, sign in, wellness coaching, coach access, dashboard access'
  });

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email(t('auth.login.errors.emailFormat')).required(t('auth.login.errors.required')),
      password: Yup.string().required(t('auth.login.errors.required')),
    }),
    onSubmit: async (values) => {
      if (process.env.NODE_ENV === 'development') {
        logger.info('login attempt', values.email);
      }
      clearError();

      const attemptLogin = async () => {
        try {
          const response = await authLogin(values.email, values.password);

          // Use user info from login response (auth service now returns user data with login)
          const userRole = response.user?.roles?.includes('client') ? 'client' :
            response.user?.roles?.includes('admin') ? 'admin' : 'coach';

          const userData = {
            id: response.user?.id?.toString() || '0',
            email: response.user?.email || values.email,
            role: userRole as 'coach' | 'client' | 'admin',
            name: response.user?.name || values.email.split('@')[0],
            // Include coachId for coach users - required for data isolation on dashboard/calendar
            ...(response.user?.coachId && { coachId: response.user.coachId })
          };

          // Validate user ID
          if (!userData.id || userData.id === '0') {
            logger.warn('Login succeeded but no user ID returned - data isolation may be compromised');
          }

          // Validate coachId for coach role - critical for proper data filtering
          if (userRole === 'coach' && !response.user?.coachId) {
            logger.warn('Coach login succeeded but no coachId returned - dashboard may show incorrect data');
          }

          const tokens = {
            accessToken: response.access_token,
            refreshToken: response.refresh_token || response.access_token,
            expiresIn: 3600
          };

          login(tokens, userData);

          if (process.env.NODE_ENV === 'development') {
            logger.debug('login success', { role: userData.role });
          }

          // Show success message briefly before redirect
          setSuccessMessage(translations.ui?.welcomeBack || `Welcome back! Redirecting to your dashboard...`);

          // Delay redirect slightly to show success message
          setTimeout(() => {
            // Role-based redirection
            if (userData.role === 'client') {
              navigate('/client/dashboard');
            } else if (userData.role === 'admin') {
              navigate('/admin');
            } else {
              // Default to coach/therapist dashboard
              navigate('/dashboard');
            }
          }, 1500);
        } catch (e) {
          logger.error('login failed', e);
          handleError(e, 'auth');
        }
      };

      setRetryAction(() => attemptLogin);
      await attemptLogin();
    },
  });

  const strength = zxcvbn(formik.values.password || '').score * 25;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ''}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4 },
        }}>
          {/* Language Switcher */}
          <Box sx={{
            position: 'absolute',
            top: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 10,
          }}>
            <Select
              value={i18n.language}
              onChange={(e) => {
                const newLang = e.target.value as 'en' | 'es' | 'he';
                i18n.changeLanguage(newLang);
              }}
              size="small"
              aria-label={translations.ui?.languageSwitcher || "language switcher"}
              sx={{
                minWidth: 120,
                '& .MuiSelect-select': {
                  py: 1,
                  fontSize: '0.875rem',
                },
              }}
            >
              <MenuItem value="en">🇺🇸 English</MenuItem>
              <MenuItem value="es">🇪🇸 Español</MenuItem>
              <MenuItem value="he">🇮🇱 עברית</MenuItem>
            </Select>
          </Box>
          <LoadingOverlay
            loading={formik.isSubmitting}
            message={translations.ui?.authenticating || "Authenticating..."}
            variant="overlay"
            backdrop
          >
            <Box component="form" onSubmit={formik.handleSubmit} sx={{
              p: { xs: 3, sm: 4, md: 5 },
              width: '100%',
              maxWidth: { xs: '100%', sm: 420, md: 460 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: { xs: 2, sm: 2.5 },
              position: 'relative',
            }}>
              {/* Welcome Header */}
              <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 3 } }}>
                <Typography
                  component="h1"
                  variant="h3"
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                    fontWeight: 700,
                    mb: 1,
                    background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {translations.auth.login.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    maxWidth: 280,
                    mx: 'auto',
                  }}
                >
                  {translations.auth.login.subtitle}
                </Typography>
              </Box>
              {error && (
                <ErrorAlert
                  error={error}
                  onRetry={() => formik.handleSubmit()}
                  onClose={clearError}
                  showDetails={process.env.NODE_ENV === 'development'}
                  className="login-error-alert"
                />
              )}
              {successMessage && (
                <Alert
                  severity="success"
                  onClose={() => setSuccessMessage(null)}
                  role="status"
                  aria-live="polite"
                  sx={{
                    mb: 2,
                    border: '2px solid',
                    borderColor: 'success.main',
                    backgroundColor: 'success.light',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
                    '& .MuiAlert-icon': {
                      fontSize: '1.5rem'
                    },
                    '& .MuiAlert-message': {
                      fontWeight: 600
                    }
                  }}
                >
                  {successMessage}
                </Alert>
              )}
              <TextField
                margin="normal"
                fullWidth
                id="email"
                name="email"
                data-testid="login-email"
                label={t('auth.login.email')}
                placeholder={translations.placeholders?.enterEmail || "Enter your email address"}
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                aria-label="email"
                size="medium"
                autoComplete="email"
                inputProps={{ 'data-testid': 'login-email-input' }}
                sx={{
                  mb: 2,
                  // Enhanced error styling
                  ...(formik.touched.email && formik.errors.email && {
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderWidth: '2px',
                        borderColor: 'error.main',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }
                  })
                }}
              />
              <TextField
                margin="normal"
                fullWidth
                id="password"
                name="password"
                data-testid="login-password"
                type={showPassword ? 'text' : 'password'}
                label={t('auth.login.password')}
                placeholder={translations.placeholders?.enterPassword || "Enter your password"}
                value={formik.values.password}
                onChange={formik.handleChange}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                aria-label="password"
                size="medium"
                autoComplete="current-password"
                inputProps={{ 'data-testid': 'login-password-input' }}
                sx={{
                  mb: 1,
                  // Enhanced error styling
                  ...(formik.touched.password && formik.errors.password && {
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderWidth: '2px',
                        borderColor: 'error.main',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }
                  })
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={translations.ui?.togglePasswordVisibility || "toggle password visibility"}
                        edge="end"
                        sx={{ mr: 0.5 }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ textAlign: 'right', mb: 3, width: '100%' }}>
                <Link
                  component={RouterLink}
                  to="/reset/request"
                  underline="hover"
                  data-testid="forgot-password-link"
                  sx={{
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {t('auth.login.forgotPassword')}
                </Link>
              </Box>

              <LoadingButton
                color="primary"
                variant="contained"
                type="submit"
                fullWidth
                loading={formik.isSubmitting}
                loadingText={translations.ui?.signingIn || "Signing in..."}
                aria-label="login"
                data-testid="login-submit"
                size="large"
                sx={{
                  mb: 3,
                  py: { xs: 1.5, sm: 1.75 },
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  height: { xs: 48, sm: 52 },
                }}
              >
                {t('auth.login.loginButton')}
              </LoadingButton>

              {/* Divider */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                my: 3,
              }}>
                <Box sx={{ flexGrow: 1, height: 1, bgcolor: 'divider' }} />
                <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>
                  {translations.auth.login.or}
                </Typography>
                <Box sx={{ flexGrow: 1, height: 1, bgcolor: 'divider' }} />
              </Box>

              {/* Google Login */}
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                mb: 3,
              }}>
                <GoogleLogin
                  onSuccess={() => { }}
                  onError={() => { }}
                  width={400}
                  theme="outline"
                  size="large"
                />
              </Box>

              {/* Sign Up Button */}
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  {translations.auth.login.noAccount}
                </Typography>
                <Button
                  component={RouterLink}
                  to="/register"
                  color="secondary"
                  variant="outlined"
                  fullWidth
                  aria-label="sign up"
                  data-testid="signup-link"
                  size="large"
                  sx={{
                    py: { xs: 1.5, sm: 1.75 },
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                    height: { xs: 48, sm: 52 },
                  }}
                >
                  {t('auth.login.signUp')}
                </Button>
              </Box>
            </Box>
          </LoadingOverlay>
        </Box>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
