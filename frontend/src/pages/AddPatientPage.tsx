import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Typography,
  Box,
  Grid,
  Avatar,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from '../contexts/LanguageContext';
import { addPatient } from '../api/patients';
import { logger } from '../logger';
import WellnessLayout from '../layouts/WellnessLayout';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorAlert from '../components/ErrorAlert';
import LoadingButton from '../components/LoadingButton';
import LoadingOverlay from '../components/LoadingOverlay';
import { useAuth } from '../AuthContext';

const AddPatientPage: React.FC = () => {
  const { translations: t } = useTranslation();
  const { user } = useAuth();

  // Get the current coach's ID from auth context (prefer UUID coachId over numeric user.id)
  const therapistId = user?.coachId || user?.id;
  const [snack, setSnack] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);
  const { error, handleError, clearError, setRetryAction } = useErrorHandler();

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
      firstName: Yup.string().required(t.addPatientPage.required),
      lastName: Yup.string().required(t.addPatientPage.required),
      email: Yup.string().email(t.addPatientPage.invalidEmail).required(t.addPatientPage.required),
      phone: Yup.string()
        .required(t.addPatientPage.required)
        .test('phone-digits', t.addPatientPage.phoneInvalid, (value) => {
          if (!value) return false;
          const digits = value.replace(/\D/g, '');
          return digits.length >= 7 && digits.length <= 15;
        }),
      // Role is auto-set to 'client' - no validation needed
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      logger.debug('add patient submit', values);
      clearError();

      // Ensure we have a valid therapist ID
      if (!therapistId) {
        setSnack({ message: t.addPatientPage.coachNotFound, severity: 'error' });
        setSubmitting(false);
        return;
      }

      const attemptAddPatient = async () => {
        try {
          await addPatient({ ...values, therapistId });
          setSnack({ message: t.addPatientPage.patientSaved, severity: 'success' });
          resetForm();
        } catch (e) {
          logger.error('add patient error', e);
          setSnack({ message: t.addPatientPage.saveFailed, severity: 'error' });
          handleError(e, t.addPatientPage.saveFailed);
        } finally {
          setSubmitting(false);
        }
      };

      setRetryAction(attemptAddPatient);
      await attemptAddPatient();
    },
  });

  return (
    <WellnessLayout
      title={t.addPatientPage.title}
      showFab={false}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Avatar sx={{
          width: 80,
          height: 80,
          bgcolor: 'primary.main',
          mx: 'auto',
          mb: 2
        }}>
          <PersonAddIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography
          component="h1"
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t.addPatientPage.heading}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t.addPatientPage.subtitle}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ width: '100%', maxWidth: 600 }}>
          <CardContent sx={{ p: 4 }}>
            <form onSubmit={formik.handleSubmit} noValidate>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t.addPatientPage.firstName}
                    {...formik.getFieldProps('firstName')}
                    error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                    helperText={formik.touched.firstName && formik.errors.firstName}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t.addPatientPage.lastName}
                    {...formik.getFieldProps('lastName')}
                    error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                    helperText={formik.touched.lastName && formik.errors.lastName}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t.addPatientPage.email}
                    type="email"
                    {...formik.getFieldProps('email')}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t.addPatientPage.phone}
                    {...formik.getFieldProps('phone')}
                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                    helperText={formik.touched.phone && formik.errors.phone}
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(46, 125, 107, 0.04)',
                    border: '1px solid rgba(46, 125, 107, 0.12)',
                  }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...formik.getFieldProps('whatsappOptIn')}
                          checked={formik.values.whatsappOptIn}
                          icon={<WhatsAppIcon />}
                          checkedIcon={<WhatsAppIcon />}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {t.addPatientPage.whatsappOptIn}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.addPatientPage.whatsappDescription}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>
                {/* Role is auto-set to 'client' - hidden from UI */}
                <Grid item xs={12}>
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    background: 'rgba(139, 90, 135, 0.04)',
                    border: '1px solid rgba(139, 90, 135, 0.12)',
                    textAlign: 'center',
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t.addPatientPage.inviteInfo}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    loading={formik.isSubmitting}
                    startIcon={<PersonAddIcon />}
                    sx={{ height: 56 }}
                  >
                    {t.addPatientPage.addClient}
                  </LoadingButton>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
      
      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        message={snack?.message}
      />
      {error && <ErrorAlert error={error} onRetry={error.retryAction} />}
      {formik.isSubmitting && <LoadingOverlay />}
    </WellnessLayout>
  );
};

export default AddPatientPage;
