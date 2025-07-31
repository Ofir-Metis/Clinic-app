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
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import zxcvbn from 'zxcvbn';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logger } from '../logger';
import { theme } from '../theme';
import { GOOGLE_CLIENT_ID } from '../env';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email(t('required')).required(t('required')),
      password: Yup.string().required(t('required')),
    }),
    onSubmit: async (values) => {
      logger.info('login attempt', values.email);
      setError('');
      try {
        const { data } = await axios.post(
          `/api/auth/login`,
          values,
          { withCredentials: true },
        );
        localStorage.setItem('token', data.access_token);
        logger.debug('login success');
        navigate('/dashboard');
      } catch (e) {
        logger.error('login failed', e);
        setError(t('loginFailed'));
      }
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
              onChange={e => i18n.changeLanguage(e.target.value)}
              size="small"
              aria-label="language switcher"
              sx={{ 
                minWidth: 120,
                '& .MuiSelect-select': {
                  py: 1,
                  fontSize: '0.875rem',
                },
              }}
            >
              <MenuItem value="en">🇺🇸 English</MenuItem>
              <MenuItem value="he">🇮🇱 עברית</MenuItem>
              <MenuItem value="ru">🇷🇺 Русский</MenuItem>
              <MenuItem value="ar">🇸🇦 العربية</MenuItem>
            </Select>
          </Box>
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
                Welcome Back
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
                Continue your journey in mental wellness and growth
              </Typography>
            </Box>
            {error && (
              <Box sx={{ 
                width: '100%', 
                p: 2, 
                mb: 2,
                borderRadius: 2,
                background: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.2)',
              }}>
                <Typography role="alert" color="error" variant="body2" textAlign="center">
                  {error}
                </Typography>
              </Box>
            )}
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label={t('email')}
              placeholder="Enter your email address"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              aria-label="email"
              size="medium"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              fullWidth
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label={t('password')}
              placeholder="Enter your password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              aria-label="password"
              size="medium"
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={() => setShowPassword((p) => !p)} 
                      aria-label="toggle password visibility" 
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
                sx={{ 
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {t('forgotPassword')}
              </Link>
            </Box>

            <Button 
              color="primary" 
              variant="contained" 
              type="submit" 
              fullWidth 
              disabled={formik.isSubmitting} 
              aria-label="login" 
              size="large"
              sx={{ 
                mb: 3,
                py: { xs: 1.5, sm: 1.75 },
                fontSize: { xs: '1rem', sm: '1.125rem' },
                height: { xs: 48, sm: 52 },
              }}
            >
              {formik.isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                t('login')
              )}
            </Button>

            {/* Divider */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%', 
              my: 3,
            }}>
              <Box sx={{ flexGrow: 1, height: 1, bgcolor: 'divider' }} />
              <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>
                {t('or')}
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
                onSuccess={() => {}} 
                onError={() => {}} 
                width="100%" 
                theme="outline"
                size="large"
              />
            </Box>

            {/* Sign Up Button */}
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Don't have an account?
              </Typography>
              <Button 
                component={RouterLink} 
                to="/register" 
                color="secondary" 
                variant="outlined" 
                fullWidth 
                aria-label="sign up" 
                size="large"
                sx={{ 
                  py: { xs: 1.5, sm: 1.75 },
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  height: { xs: 48, sm: 52 },
                }}
              >
                {t('register')}
              </Button>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
