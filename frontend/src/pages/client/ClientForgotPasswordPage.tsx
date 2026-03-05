/**
 * ClientForgotPasswordPage - Password reset for coaching clients
 * Simple email-based password reset flow
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
  Avatar,
  CircularProgress,
  useTheme,
  alpha,
  Fade,
  Select,
  MenuItem
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Psychology as MindIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorAlert from '../../components/ErrorAlert';
import LoadingButton from '../../components/LoadingButton';
import axios from 'axios';
import { API_URL } from '../../env';

const ClientForgotPasswordPage: React.FC = () => {
  const theme = useTheme();
  const { t, i18n, translations } = useTranslation();
  const fp = translations.clientPortal?.forgotPassword;

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { error, handleError, clearError, setRetryAction } = useErrorHandler();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    clearError();

    const attemptReset = async () => {
      try {
        await axios.post(`${API_URL}/auth/reset-request`, { email });
        setIsSuccess(true);
      } catch (err: any) {
        // Unwrap nested error messages from API gateway
        const msg = err?.response?.data?.message;
        let errorMessage = 'Failed to send reset link';
        if (typeof msg === 'string') {
          errorMessage = msg;
        } else if (typeof msg === 'object' && msg !== null) {
          const inner = msg?.message;
          errorMessage = typeof inner === 'string' ? inner
            : typeof inner === 'object' && inner !== null && typeof inner.message === 'string' ? inner.message
            : err?.message || errorMessage;
        }
        handleError(new Error(errorMessage), 'auth');
      } finally {
        setIsLoading(false);
      }
    };

    setRetryAction(() => attemptReset);
    await attemptReset();
  };

  const isFormValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (isSuccess) {
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
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Fade in>
              <Box>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 3,
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: '2.5rem' }} />
                </Avatar>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {fp?.successTitle || 'Check Your Email'} ✨
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  {fp?.successMessage || "If an account exists with that email, you'll receive a password reset link."}
                </Typography>

                <Button
                  component={RouterLink}
                  to="/client/login"
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    py: 2,
                    borderRadius: 3,
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`
                    }
                  }}
                >
                  {fp?.backToLogin || 'Back to Login'}
                </Button>
              </Box>
            </Fade>
          </CardContent>
        </Card>
      </Box>
    );
  }

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
              <EmailIcon sx={{ fontSize: '2.5rem' }} />
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
              {fp?.title || 'Reset Your Password'}
            </Typography>

            <Typography variant="body1" color="text.secondary">
              {fp?.subtitle || "Enter your email and we'll send you a reset link"}
            </Typography>
          </Box>

          {/* Reset Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label={fp?.emailLabel || 'Email Address'}
                type="email"
                variant="outlined"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) clearError();
                }}
                placeholder={fp?.emailPlaceholder || 'your.email@example.com'}
                autoComplete="email"
                autoFocus
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

              {error && (
                <Fade in>
                  <ErrorAlert
                    error={error}
                    onRetry={() => handleSubmit(new Event('submit') as any)}
                    onClose={clearError}
                    showDetails={process.env.NODE_ENV === 'development'}
                  />
                </Fade>
              )}

              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                disabled={!isFormValid}
                loading={isLoading}
                loadingText={translations.status?.loading || 'Sending...'}
                startIcon={<EmailIcon />}
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
                {fp?.submitButton || 'Send Reset Link'}
              </LoadingButton>
            </Stack>
          </Box>

          {/* Back to Login Link */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Link
              component={RouterLink}
              to="/client/login"
              variant="body2"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <ArrowBackIcon fontSize="small" />
              {fp?.backToLogin || 'Back to Login'}
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClientForgotPasswordPage;
