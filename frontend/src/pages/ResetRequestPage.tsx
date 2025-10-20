import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  CssBaseline,
  ThemeProvider,
  Typography,
  Link,
  useTheme,
  alpha,
} from '@mui/material';
import { ArrowBack as BackIcon, Email as EmailIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useTranslation } from '../contexts/LanguageContext';
import { theme } from '../theme';

const ResetRequestPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [sent, setSent] = useState(false);
  const theme = useTheme();

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: Yup.object({
      email: Yup.string().email(t('required')).required(t('required')),
    }),
    onSubmit: async (values) => {
      await axios.post(`/api/auth/reset/request`, values);
      setSent(true);
    },
  });

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
            <EmailIcon sx={{ 
              fontSize: { xs: 48, sm: 56 }, 
              color: theme.palette.primary.main, 
              mb: 2 
            }} />
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
              Reset Your Password
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
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
          </Box>

          {sent ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography 
                variant="h6" 
                color="primary" 
                data-testid="reset-sent"
                sx={{ mb: 2, fontWeight: 600 }}
              >
                ✓ Reset Link Sent!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Check your email for password reset instructions. If you don't see it, check your spam folder.
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                startIcon={<BackIcon />}
                sx={{ borderRadius: 3 }}
              >
                Back to Login
              </Button>
            </Box>
          ) : (
            <>
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
                autoComplete="email"
                size="medium"
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': { borderRadius: 3 }
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
                  mb: 3,
                  py: { xs: 1.5, sm: 1.75 },
                  fontSize: { xs: '1rem', sm: '1.125rem' },
                  height: { xs: 48, sm: 52 },
                  borderRadius: 3,
                  fontWeight: 600,
                }}
              >
                {formik.isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
              </Button>
              <Button
                component={RouterLink}
                to="/login"
                variant="text"
                startIcon={<BackIcon />}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                Back to Login
              </Button>
            </>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ResetRequestPage;
