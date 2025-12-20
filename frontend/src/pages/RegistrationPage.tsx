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
  Typography,
  LinearProgress,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import zxcvbn from 'zxcvbn';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { logger } from '../logger';
import { theme } from '../theme';
import { GOOGLE_CLIENT_ID, API_URL } from '../env';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useAuth } from '../AuthContext';
import ErrorAlert from '../components/ErrorAlert';
import LoadingButton from '../components/LoadingButton';
import LoadingOverlay from '../components/LoadingOverlay';
import { usePageTitle } from '../hooks/usePageTitle';

const RegistrationPage: React.FC = () => {
  const { t, i18n, translations } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { error, handleError, clearError, setRetryAction } = useErrorHandler();
  const { login } = useAuth();

  // Set page title and meta tags
  usePageTitle({
    title: 'Register',
    description: 'Join our wellness coaching platform. Create your account to start your journey toward personal growth and transformation.',
    keywords: 'register, sign up, wellness coaching, join platform, wellness coach, life coach, personal growth'
  });

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '', confirmPassword: '', role: 'therapist' },
    validationSchema: Yup.object({
      name: Yup.string().required(t('auth.register.errors.required')),
      email: Yup.string().email(t('auth.register.errors.emailFormat')).required(t('auth.register.errors.required')),
      password: Yup.string()
        .min(8, t('auth.register.errors.passwordRequirements'))
        .required(t('auth.register.errors.required')),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], t('auth.register.errors.confirmPassword'))
        .required(t('auth.register.errors.required')),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      logger.info('register attempt', values.email);
      clearError();
      
      try {
        const response = await axios.post(`${API_URL}/auth/register`, values, { withCredentials: true });
        logger.debug('register success');
        
        // Create user object from registration data
        const userData = {
          id: 'registered', // Will be updated with real ID if needed
          email: values.email,
          role: values.role === 'patient' ? 'client' : 'coach' as 'coach' | 'client',
          name: values.name
        };
        
        // Create token data from response
        const tokens = {
          accessToken: response.data.access_token,
          refreshToken: response.data.access_token, // Use same token as refresh for now
          expiresIn: 3600
        };
        
        // Log the user in
        login(tokens, userData);

        // Show success message briefly before redirect
        setSuccessMessage(`Welcome aboard! Setting up your dashboard...`);

        // Delay redirect slightly to show success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } catch (e) {
        logger.error('register failed', e);
        handleError(e, 'auth');
      } finally {
        setSubmitting(false);
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
          background: 'linear-gradient(135deg, #e0f7fa 0%, #f5f5f5 100%)',
        }}>
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
            <Typography
              component="h1"
              variant="h4"
              fontWeight={700}
              mb={2}
              fontFamily="Roboto, sans-serif"
            >
              {translations.auth.register.title}
            </Typography>
            <TextField
              margin="normal"
              fullWidth
              id="name"
              name="name"
              label={translations.auth.register.fullName}
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              aria-label="name"
              autoComplete="name"
              sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.7)' }}
            />
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label={translations.auth.register.email}
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              aria-label="email"
              autoComplete="email"
              sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.7)' }}
            />
            <TextField
              margin="normal"
              fullWidth
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label={translations.auth.register.password}
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              aria-label="password"
              autoComplete="new-password"
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
            <TextField
              margin="normal"
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label={translations.auth.register.confirmPassword}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              aria-label="confirm password"
              autoComplete="new-password"
              sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.7)' }}
            />
            <FormControl component="fieldset" sx={{ mt: 1, width: '100%' }}>
              <RadioGroup row name="role" value={formik.values.role} onChange={formik.handleChange} aria-label="role" sx={{ justifyContent: 'center' }}>
                <FormControlLabel value="therapist" control={<Radio />} label={translations.auth.register.therapist} />
                <FormControlLabel value="patient" control={<Radio />} label={translations.auth.register.patient} />
              </RadioGroup>
            </FormControl>
            <LoadingButton
              color="primary"
              variant="contained"
              type="submit"
              fullWidth
              loading={formik.isSubmitting}
              aria-label="register"
              sx={{ mt: 2, borderRadius: 3, fontWeight: 700, fontSize: 18, py: 1.5 }}
            >
              {translations.auth.register.submitButton}
            </LoadingButton>
            <Box sx={{ textAlign: 'center', my: 2, width: '100%' }}>{translations.auth.register.or}</Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <GoogleLogin onSuccess={() => {}} onError={() => {}} width="100%" />
            </Box>
          </Box>
        </Box>
        {error && <ErrorAlert error={error} onRetry={error.retryAction} />}
        {formik.isSubmitting && <LoadingOverlay />}
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default RegistrationPage;
