import React, { useMemo, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Alert,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logger } from '../logger';
import { createAppTheme } from '../theme';
import { API_URL, GOOGLE_CLIENT_ID } from '../env';

const PatientLoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const theme = useMemo(() => createAppTheme(i18n.dir()), [i18n]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid').required('Required'),
      password: Yup.string().required('Required'),
    }),
    onSubmit: async (values) => {
      logger.info('login attempt', values.email);
      setError('');
      try {
        const { data } = await axios.post(
          `${API_URL}/auth/login`,
          values,
          { withCredentials: true },
        );
        localStorage.setItem('token', data.access_token);
        logger.debug('login success');
        navigate('/patient/history');
      } catch (e) {
        logger.error('login failed', e);
        setError(t('loginFailed', 'Login failed'));
      }
    },
  });

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ''}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: 3, bgcolor: 'background.paper', boxShadow: 3, width: '100%', maxWidth: 360 }}>
            {error && <Alert severity="error">{error}</Alert>}
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
              type="password"
              id="password"
              name="password"
              label={t('password')}
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              aria-label="password"
            />
            <Button color="primary" variant="contained" type="submit" fullWidth disabled={formik.isSubmitting} aria-label="login">
              {formik.isSubmitting ? <CircularProgress size={24} /> : t('login')}
            </Button>
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

export default PatientLoginPage;
