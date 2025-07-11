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
import { useTranslation } from 'react-i18next';
import { logger } from '../logger';
import { createAppTheme } from '../theme';
import { GOOGLE_CLIENT_ID } from '../env';

const RegistrationPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const theme = useMemo(() => createAppTheme(i18n.dir()), [i18n]);

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '', confirmPassword: '', role: 'therapist' },
    validationSchema: Yup.object({
      name: Yup.string().required(t('required')),
      email: Yup.string().email(t('required')).required(t('required')),
      password: Yup.string()
        .min(8, t('passwordRequirements'))
        .required(t('required')),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], t('confirmPassword'))
        .required(t('required')),
    }),
    onSubmit: async (values) => {
      logger.info('register attempt', values.email);
      try {
        await axios.post(`/api/auth/register`, values, { withCredentials: true });
        logger.debug('register success');
        navigate('/dashboard');
      } catch (e) {
        logger.error('register failed', e);
      }
    },
  });

  const strength = zxcvbn(formik.values.password || '').score * 25;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ''}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: 3, bgcolor: 'background.paper', boxShadow: 3, width: '100%', maxWidth: 360 }}>
            <TextField
              margin="normal"
              fullWidth
              id="name"
              name="name"
              label={t('fullName')}
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              aria-label="name"
            />
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
            <TextField
              margin="normal"
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label={t('confirmPassword')}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              aria-label="confirm password"
            />
            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <RadioGroup row name="role" value={formik.values.role} onChange={formik.handleChange} aria-label="role">
                <FormControlLabel value="therapist" control={<Radio />} label={t('therapist')} />
                <FormControlLabel value="patient" control={<Radio />} label={t('patient')} />
              </RadioGroup>
            </FormControl>
            <Button color="primary" variant="contained" type="submit" fullWidth disabled={formik.isSubmitting} aria-label="register" sx={{ mt: 2 }}>
              {formik.isSubmitting ? <CircularProgress size={24} /> : t('register')}
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

export default RegistrationPage;
