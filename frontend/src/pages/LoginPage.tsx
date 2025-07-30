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
          background: 'linear-gradient(135deg, #e0f7fa 0%, #f5f5f5 100%)',
        }}>
          {/* Language Switcher */}
          <Box sx={{ position: 'absolute', top: 24, right: 24 }}>
            <Select
              value={i18n.language}
              onChange={e => i18n.changeLanguage(e.target.value)}
              size="small"
              aria-label="language switcher"
              sx={{ bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 2, boxShadow: 1 }}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="he">עברית</MenuItem>
              <MenuItem value="ru">Русский</MenuItem>
              <MenuItem value="ar">العربية</MenuItem>
            </Select>
          </Box>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{
            p: 4,
            bgcolor: 'rgba(255,255,255,0.6)',
            boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.18)',
            width: '100%',
            maxWidth: 380,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}>
            <Typography variant="h4" fontWeight={700} mb={2} fontFamily="Roboto, sans-serif">
              {t('login')}
            </Typography>
            {error && (
              <Typography role="alert" color="error">
                {error}
              </Typography>
            )}
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label={t('email')}
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              aria-label="email"
              sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.7)' }}
            />
            <TextField
              margin="normal"
              fullWidth
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label={t('password')}
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              aria-label="password"
              sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.7)' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((p) => !p)} aria-label="toggle password visibility" edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button color="primary" variant="contained" type="submit" fullWidth disabled={formik.isSubmitting} aria-label="login" sx={{ mt: 2, borderRadius: 3, fontWeight: 700, fontSize: 18, py: 1.5 }}>
              {formik.isSubmitting ? <CircularProgress size={24} /> : t('login')}
            </Button>
            <Box sx={{ textAlign: 'right', my: 1, width: '100%' }}>
              <Link component={RouterLink} to="/reset/request" underline="hover">
                {t('forgotPassword')}
              </Link>
            </Box>
            <Box sx={{ textAlign: 'center', my: 2, width: '100%' }}>{t('or')}</Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <GoogleLogin onSuccess={() => {}} onError={() => {}} width="100%" />
            </Box>
            {/* Sign Up Button */}
            <Box sx={{ textAlign: 'center', mt: 2, width: '100%' }}>
              <Button component={RouterLink} to="/register" color="secondary" variant="outlined" fullWidth aria-label="sign up" sx={{ borderRadius: 3, fontWeight: 700, fontSize: 18, py: 1.5 }}>
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
