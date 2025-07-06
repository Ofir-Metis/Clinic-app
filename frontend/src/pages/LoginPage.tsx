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
import { createAppTheme } from '../theme';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const theme = useMemo(() => createAppTheme(i18n.dir()), [i18n]);

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
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: 3, bgcolor: 'background.paper', boxShadow: 3, width: '100%', maxWidth: 360 }}>
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
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">{t('passwordStrength')}</Typography>
              <LinearProgress variant="determinate" value={strength} aria-label="password strength" />
            </Box>
            <Button color="primary" variant="contained" type="submit" fullWidth disabled={formik.isSubmitting} aria-label="login" sx={{ mt: 2 }}>
              {formik.isSubmitting ? <CircularProgress size={24} /> : t('login')}
            </Button>
            <Box sx={{ textAlign: 'right', my: 1 }}>
              <Link component={RouterLink} to="/reset/request" underline="hover">
                {t('forgotPassword')}
              </Link>
            </Box>
            <Box sx={{ textAlign: 'center', my: 2 }}>{t('or')}</Box>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin onSuccess={() => {}} onError={() => {}} width="100%" />
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
