import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  CssBaseline,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';

const ResetRequestPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [sent, setSent] = useState(false);

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
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ p: 3, bgcolor: 'background.paper', boxShadow: 3, width: '100%', maxWidth: 360 }}>
          {sent && (
            <Typography color="primary" data-testid="reset-sent">
              {t('resetLinkSent')}
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
          <Button color="primary" variant="contained" type="submit" fullWidth disabled={formik.isSubmitting} sx={{ mt: 2 }}>
            {formik.isSubmitting ? <CircularProgress size={24} /> : t('sendResetLink')}
          </Button>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default ResetRequestPage;
