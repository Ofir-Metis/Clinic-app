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
import { useTranslation } from '../contexts/LanguageContext';
import { logger } from '../logger';
import { theme } from '../theme';
import { API_URL, GOOGLE_CLIENT_ID } from '../env';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorAlert from '../components/ErrorAlert';
import LoadingButton from '../components/LoadingButton';
import LoadingOverlay from '../components/LoadingOverlay';

const PatientLoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { error: errorState, handleError, clearError, setRetryAction } = useErrorHandler();
  const theme = useMemo(() => theme(i18n.dir()), [i18n]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid').required('Required'),
      password: Yup.string().required('Required'),
    }),
    onSubmit: async (values) => {
      logger.info('login attempt', values.email);
      setError('');
      clearError();
      
      const attemptLogin = async () => {
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
          handleError(e, 'Login failed. Please try again.');
        }
      };
      
      setRetryAction(attemptLogin);
      await attemptLogin();
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
              autoComplete="email"
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
              autoComplete="current-password"
            />
            <LoadingButton 
              color="primary" 
              variant="contained" 
              type="submit" 
              fullWidth 
              loading={formik.isSubmitting}
              aria-label="login"
            >
              {t('login')}
            </LoadingButton>
            <Box sx={{ textAlign: 'center', my: 2 }}>{t('or')}</Box>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin onSuccess={() => {}} onError={() => {}} width="100%" />
            </Box>
          </Box>
        </Box>
        {errorState && <ErrorAlert error={errorState} onRetry={errorState.retryAction} />}
        {formik.isSubmitting && <LoadingOverlay />}
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default PatientLoginPage;
