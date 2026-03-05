/**
 * ClientLoginPage - Authentication for coaching clients
 * Separate login flow for clients accessing their personal development portal
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Stack,
  Divider,
  Avatar,
  CircularProgress,
  useTheme,
  alpha,
  Fade,
  Select,
  MenuItem,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Psychology as MindIcon,
  AutoAwesome as SparkleIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as RegisterIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorAlert from '../../components/ErrorAlert';
import LoadingButton from '../../components/LoadingButton';
import LoadingOverlay from '../../components/LoadingOverlay';
import { login as authLogin } from '../../api/auth';
import { useAuth, User } from '../../contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

const ClientLoginPage: React.FC = () => {
  const theme = useTheme();
  const { t, i18n, translations } = useTranslation();
  const cl = translations.clientPortal?.login;
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { error, handleError, clearError, setRetryAction } = useErrorHandler();

  const handleInputChange = (field: keyof LoginFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (error) clearError();
    if (loginError) setLoginError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    clearError();

    const attemptLogin = async () => {
      try {
        // Call real authentication API
        const response = await authLogin(formData.email, formData.password);

        // Determine role from API response (defaults to 'client' for client login)
        const userRole: User['role'] = response.user?.roles?.includes('admin')
          ? 'admin'
          : response.user?.roles?.includes('coach') || response.user?.roles?.includes('therapist')
            ? 'coach'
            : 'client';

        // Build user data from API response
        const userData: User = {
          id: response.user?.id?.toString() || '0',
          email: response.user?.email || formData.email,
          name: response.user?.name || '',
          role: userRole,
        };

        // Use AuthContext to properly store credentials
        await login(
          {
            accessToken: response.access_token,
            refreshToken: response.refresh_token || response.access_token,
            expiresIn: 3600, // 1 hour default
          },
          userData
        );

        // Navigate to client dashboard
        navigate('/client/dashboard');
      } catch (err: any) {
        // Handle authentication errors - use local state to avoid useErrorHandler navigation side effects
        console.error('[ClientLogin] Login error:', err);
        // Extract error message - API gateway nests messages deeply
        const msg = err?.response?.data?.message;
        let errorMessage = 'Invalid credentials. Please try again.';
        if (typeof msg === 'string') {
          errorMessage = msg;
        } else if (typeof msg === 'object' && msg !== null) {
          // Unwrap nested message objects from API gateway
          const inner = msg?.message;
          if (typeof inner === 'string') {
            errorMessage = inner;
          } else if (typeof inner === 'object' && inner !== null && typeof inner.message === 'string') {
            errorMessage = inner.message;
          }
        }
        setLoginError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    setRetryAction(() => attemptLogin);
    await attemptLogin();
  };

  const isFormValid = formData.email && formData.password;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 50%, ${theme.palette.background.default} 100%)`,
        p: 2,
        position: 'relative',
      }}
    >
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
            bgcolor: alpha(theme.palette.background.paper, 0.8),
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
      <Card
        sx={{
          maxWidth: 450,
          width: '100%',
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(46, 125, 107, 0.15)'
        }}
      >
        <CardContent sx={{ p: 6 }}>
          <LoadingOverlay
            loading={isLoading}
            message={cl?.loadingMessage || 'Connecting to your coaching journey...'}
            variant="overlay"
            backdrop
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                fontSize: '2rem'
              }}
            >
              <MindIcon sx={{ fontSize: '2.5rem' }} />
            </Avatar>
            
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {cl?.welcomeBack || 'Welcome Back!'} 🌟
            </Typography>

            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              {cl?.accessJourney || 'Access Your Personal Growth Journey'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {cl?.continueTransformation || 'Continue your transformation with your dedicated coach'}
            </Typography>
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label={cl?.emailLabel || 'Email Address'}
                type="email"
                variant="outlined"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder={cl?.emailPlaceholder || 'your.email@example.com'}
                autoComplete="email"
                data-testid="client-login-email"
                inputProps={{ 'data-testid': 'client-login-email-input' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: alpha(theme.palette.background.paper, 0.7),
                    '&:hover': {
                      background: alpha(theme.palette.background.paper, 0.9)
                    },
                    '&.Mui-focused': {
                      background: alpha(theme.palette.background.paper, 1)
                    }
                  }
                }}
              />
              
              <TextField
                fullWidth
                label={cl?.passwordLabel || 'Password'}
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder={cl?.passwordPlaceholder || 'Enter your password'}
                autoComplete="current-password"
                data-testid="client-login-password"
                inputProps={{ 'data-testid': 'client-login-password-input' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        aria-label="toggle password visibility"
                        data-testid="password-visibility-toggle"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: alpha(theme.palette.background.paper, 0.7),
                    '&:hover': {
                      background: alpha(theme.palette.background.paper, 0.9)
                    },
                    '&.Mui-focused': {
                      background: alpha(theme.palette.background.paper, 1)
                    }
                  }
                }}
              />

              {loginError && (
                <Fade in>
                  <Alert
                    severity="error"
                    variant="standard"
                    role="alert"
                    data-testid="login-error-alert"
                    onClose={() => setLoginError(null)}
                    sx={{ borderRadius: 2 }}
                  >
                    {loginError}
                  </Alert>
                </Fade>
              )}

              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                disabled={!isFormValid}
                loading={isLoading}
                loadingText={cl?.signingIn || 'Signing In...'}
                startIcon={<LoginIcon />}
                data-testid="client-login-submit"
                sx={{
                  py: 2,
                  borderRadius: 3,
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`
                  },
                  '&:disabled': {
                    background: alpha(theme.palette.grey[400], 0.5)
                  }
                }}
              >
                {cl?.submitButton || 'Start My Journey'}
              </LoadingButton>
            </Stack>
          </Box>

          <Divider sx={{ my: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {cl?.newToCoaching || 'New to coaching?'}
            </Typography>
          </Divider>

          {/* Registration Link */}
          <Button
            component={RouterLink}
            to="/client/register"
            variant="outlined"
            size="large"
            fullWidth
            startIcon={<RegisterIcon />}
            data-testid="client-register-link"
            sx={{
              py: 2,
              borderRadius: 3,
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-1px)',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
              }
            }}
          >
            {cl?.beginTransformation || 'Begin Your Transformation'}
          </Button>

          {/* Footer Links */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Stack direction="row" spacing={2} justifyContent="center" divider={<Typography color="text.disabled">•</Typography>}>
              <Link
                component={RouterLink}
                to="/client/forgot-password"
                variant="body2"
                data-testid="client-forgot-password-link"
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {cl?.forgotPassword || 'Forgot Password?'}
              </Link>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                data-testid="coach-login-link"
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {cl?.coachLogin || 'Coach Login'}
              </Link>
            </Stack>
          </Box>

          {/* Motivational Footer */}
          <Box
            sx={{
              mt: 4,
              p: 3,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.1)} 100%)`,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
            }}
          >
            <SparkleIcon sx={{ fontSize: 32, color: theme.palette.success.main, mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              "{cl?.motivationalQuote || 'Every expert was once a beginner.'}"
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {cl?.journeyStarts || 'Your journey of growth starts here'} ✨
            </Typography>
          </Box>
        </LoadingOverlay>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClientLoginPage;