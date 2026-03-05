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
  Select,
  MenuItem,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import zxcvbn from 'zxcvbn';
import { jwtDecode } from 'jwt-decode';
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
    title: translations.auth?.register?.pageTitle || 'Register',
    description: translations.auth?.register?.pageDescription || 'Join our wellness coaching platform. Create your account to start your journey toward personal growth and transformation.',
    keywords: translations.auth?.register?.pageKeywords || 'register, sign up, wellness coaching, join platform, wellness coach, life coach, personal growth'
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
        // Extract ID from JWT token (sub field contains user ID)
        let userId = '0';
        try {
          const decoded = jwtDecode<{ sub: number | string }>(response.data.access_token);
          userId = decoded.sub?.toString() || '0';
        } catch (e) {
          logger.warn('Failed to decode JWT for user ID', e);
        }

        const userData = {
          id: userId,
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
        setSuccessMessage(translations.ui?.welcomeAboard || 'Welcome aboard! Setting up your dashboard...');

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
          position: 'relative',
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
                bgcolor: 'rgba(255,255,255,0.8)',
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
          <Box component="form" onSubmit={formik.handleSubmit} sx={{
            p: 4,
            bgcolor: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
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
                    <IconButton onClick={() => setShowPassword((p) => !p)} aria-label={translations.ui?.togglePasswordVisibility || "toggle password visibility"} edge="end" sx={{ mr: 0.5 }}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {/* Password Strength Indicator */}
            {formik.values.password && (
              <Box sx={{ width: '100%', mt: -1, mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={strength}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      bgcolor: strength < 50 ? 'error.main' : strength < 75 ? 'warning.main' : 'success.main',
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {translations.auth?.register?.passwordStrength || 'Password strength'}: {
                    strength < 25 ? (translations.auth?.register?.strengthWeak || 'Weak') :
                    strength < 50 ? (translations.auth?.register?.strengthFair || 'Fair') :
                    strength < 75 ? (translations.auth?.register?.strengthGood || 'Good') :
                    (translations.auth?.register?.strengthStrong || 'Strong')
                  }
                </Typography>
              </Box>
            )}
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
              <GoogleLogin onSuccess={() => {}} onError={() => {}} width={400} />
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
