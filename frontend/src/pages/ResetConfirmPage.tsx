import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Typography,
  LinearProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import zxcvbn from 'zxcvbn';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ResetConfirmPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const theme = useMemo(
    () =>
      createTheme({
        direction: i18n.dir(),
        palette: { primary: { main: '#00A699' }, background: { default: '#F5F5F5' } },
        typography: { fontFamily: 'Roboto' },
      }),
    [i18n],
  );

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
      await axios.post(`/api/auth/reset/confirm`, { token, password: values.password });
      navigate('/');
    },
  });

  const strength = zxcvbn(formik.values.password || '').score * 25;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: 3, bgcolor: 'background.paper', boxShadow: 3, width: '100%', maxWidth: 360 }}>
          <TextField
            margin="normal"
            fullWidth
            id="password"
            name="password"
            type="password"
            label={t('newPassword')}
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            aria-label="new password"
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
            label={t('confirmNewPassword')}
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            aria-label="confirm new password"
          />
          <Button color="primary" variant="contained" type="submit" fullWidth disabled={formik.isSubmitting} sx={{ mt: 2 }}>
            {formik.isSubmitting ? <CircularProgress size={24} /> : t('resetPassword')}
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ResetConfirmPage;
