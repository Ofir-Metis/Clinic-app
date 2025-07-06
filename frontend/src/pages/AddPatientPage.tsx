import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  MenuItem,
  Snackbar,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { addPatient } from '../api/patients';
import { logger } from '../logger';

const AddPatientPage: React.FC<{ therapistId?: number }> = ({ therapistId = 1 }) => {
  const { t, i18n } = useTranslation();
  const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      whatsappOptIn: false,
      role: 'patient',
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required(t('required')),
      lastName: Yup.string().required(t('required')),
      email: Yup.string().email(t('invalidEmail')).required(t('required')),
      phone: Yup.string().required(t('required')),
      role: Yup.string().required(t('required')),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      logger.debug('add patient submit', values);
      try {
        await addPatient({ ...values, therapistId });
        setSnack({ message: t('patientSaved'), severity: 'success' });
        resetForm();
      } catch (e) {
        logger.error('add patient error', e);
        setSnack({ message: t('saveFailed'), severity: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Card sx={{ width: 400 }}>
          <CardContent>
            <form onSubmit={formik.handleSubmit} noValidate>
              <TextField
                fullWidth
                margin="normal"
                label={t('firstName')}
                {...formik.getFieldProps('firstName')}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
              />
              <TextField
                fullWidth
                margin="normal"
                label={t('lastName')}
                {...formik.getFieldProps('lastName')}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
              />
              <TextField
                fullWidth
                margin="normal"
                label={t('email')}
                type="email"
                {...formik.getFieldProps('email')}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
              <TextField
                fullWidth
                margin="normal"
                label={t('phone')}
                {...formik.getFieldProps('phone')}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
              />
              <FormControlLabel
                control={<Checkbox {...formik.getFieldProps('whatsappOptIn')} checked={formik.values.whatsappOptIn} />}
                label={t('whatsappOptIn')}
              />
              <TextField
                select
                fullWidth
                margin="normal"
                label={t('role')}
                {...formik.getFieldProps('role')}
                error={formik.touched.role && Boolean(formik.errors.role)}
                helperText={formik.touched.role && formik.errors.role}
              >
                <MenuItem value="therapist">{t('therapist')}</MenuItem>
                <MenuItem value="patient">{t('patient')}</MenuItem>
              </TextField>
              <Box sx={{ position: 'relative', mt: 2 }}>
                <Button type="submit" variant="contained" fullWidth disabled={formik.isSubmitting}>
                  {t('savePatient')}
                </Button>
                {formik.isSubmitting && (
                  <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: -1.5, ml: -1.5 }} />
                )}
              </Box>
            </form>
            <Typography variant="body2" sx={{ mt: 2 }}>
              {t('inviteInfo')}
            </Typography>
          </CardContent>
        </Card>
      </Box>
      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack?.message}
      />
    </Box>
  );
};

export default AddPatientPage;
