import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  CssBaseline,
  ThemeProvider,
  Typography,
  LinearProgress,
  useTheme,
  alpha,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Lock as LockIcon,
  CheckCircle as SuccessIcon 
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import zxcvbn from 'zxcvbn';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { theme } from '../theme';

const ResetConfirmPage: React.FC = () => {
  const { t, i18n, translations } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const token = params.get('token') || '';

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: Yup.object({
      password: Yup.string().min(8, t('passwordRequirements')).required(t('required')),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], t('confirmPassword'))
        .required(t('required')),
    }),
    onSubmit: async (values) => {
      try {
        await axios.post(`/api/auth/reset/confirm`, { token, password: values.password });
        setResetSuccess(true);
        // Redirect after showing success message
        setTimeout(() => navigate('/login'), 2000);
      } catch (error) {
        // Handle error - could add error state here
        console.error('Password reset failed:', error);
      }
    },
  });

  const strength = zxcvbn(formik.values.password || '').score * 25;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 50%, ${theme.palette.background.default} 100%)`,
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, sm: 4 },
      }}>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{
          p: { xs: 3, sm: 4, md: 5 },
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(46, 125, 107, 0.15)',
          width: '100%',
          maxWidth: { xs: '100%', sm: 420, md: 460 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: { xs: 2, sm: 2.5 },
        }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 3 } }}>
            {resetSuccess ? (
              <SuccessIcon sx={{ 
                fontSize: { xs: 48, sm: 56 }, 
                color: theme.palette.success.main, 
                mb: 2 
              }} />
            ) : (
              <LockIcon sx={{ 
                fontSize: { xs: 48, sm: 56 }, 
                color: theme.palette.primary.main, 
                mb: 2 
              }} />
            )}
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                fontWeight: 700,
                mb: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {resetSuccess
                ? (translations.auth?.resetConfirm?.successTitle || 'Password Reset!')
                : (translations.auth?.resetConfirm?.title || 'Create New Password')}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                maxWidth: 300,
                mx: 'auto',
              }}
            >
              {resetSuccess
                ? (translations.auth?.resetConfirm?.successMessage || 'Your password has been successfully reset. Redirecting to login...')
                : (translations.auth?.resetConfirm?.subtitle || 'Choose a strong password to secure your account.')
              }
            </Typography>
          </Box>

          {resetSuccess ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={32} sx={{ color: theme.palette.success.main }} />
            </Box>
          ) : (
            <>
              <TextField
                margin="normal"
                fullWidth
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label={translations.auth?.resetConfirm?.newPassword || t('newPassword')}
                placeholder={translations.placeholders?.enterNewPassword || "Enter your new password"}
                value={formik.values.password}
                onChange={formik.handleChange}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                aria-label={translations.auth?.resetConfirm?.newPassword || "new password"}
                autoComplete="new-password"
                size="medium"
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': { borderRadius: 3 }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(prev => !prev)}
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
              <Box sx={{ width: '100%', mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {translations.auth?.resetConfirm?.passwordStrength || 'Password Strength'}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={strength} 
                  aria-label="password strength"
                  sx={{ 
                    mt: 0.5,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.grey[300], 0.3),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: 
                        strength < 25 ? theme.palette.error.main :
                        strength < 50 ? theme.palette.warning.main :
                        strength < 75 ? theme.palette.info.main :
                        theme.palette.success.main
                    }
                  }}
                />
              </Box>
              <TextField
                margin="normal"
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                label={translations.auth?.resetConfirm?.confirmNewPassword || t('confirmNewPassword')}
                placeholder={translations.placeholders?.confirmNewPassword || "Confirm your new password"}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                aria-label={translations.auth?.resetConfirm?.confirmNewPassword || "confirm new password"}
                autoComplete="new-password"
                size="medium"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': { borderRadius: 3 }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        aria-label={translations.ui?.togglePasswordVisibility || "toggle password visibility"}
                        edge="end"
                        sx={{ mr: 0.5 }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button 
                color="primary" 
                variant="contained" 
                type="submit" 
                fullWidth 
                disabled={formik.isSubmitting}
                size="large"
                sx={{ 
                  py: { xs: 1.5, sm: 1.75 },
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  height: { xs: 48, sm: 52 },
                  borderRadius: 3,
                  fontWeight: 600,
                }}
              >
                {formik.isSubmitting ? <CircularProgress size={24} color="inherit" /> : (translations.auth?.resetConfirm?.submitButton || 'Reset Password')}
              </Button>
            </>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ResetConfirmPage;
