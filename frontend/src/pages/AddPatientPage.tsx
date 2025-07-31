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
  Grid,
  Avatar,
  Stack,
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
import { useTranslation } from 'react-i18next';
import { addPatient } from '../api/patients';
import { logger } from '../logger';
import WellnessLayout from '../layouts/WellnessLayout';

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
    <WellnessLayout
      title="Add New Patient"
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
          👤 Add New Client
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create a new client profile for your wellness practice
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
                    label={t('firstName', 'First Name')}
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
                    label={t('lastName', 'Last Name')}
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
                    label={t('email', 'Email Address')}
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
                    label={t('phone', 'Phone Number')}
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
                            {t('whatsappOptIn', 'WhatsApp Notifications')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Allow sending appointment reminders via WhatsApp
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label={t('role', 'Account Type')}
                    {...formik.getFieldProps('role')}
                    error={formik.touched.role && Boolean(formik.errors.role)}
                    helperText={formik.touched.role && formik.errors.role}
                  >
                    <MenuItem value="patient">{t('patient', 'Client/Patient')}</MenuItem>
                    <MenuItem value="therapist">{t('therapist', 'Therapist')}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    background: 'rgba(139, 90, 135, 0.04)',
                    border: '1px solid rgba(139, 90, 135, 0.12)',
                    textAlign: 'center',
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t('inviteInfo', 'An invitation will be sent to the client\'s email address with login instructions.')}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ position: 'relative' }}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      size="large"
                      fullWidth 
                      disabled={formik.isSubmitting}
                      startIcon={<PersonAddIcon />}
                      sx={{ height: 56 }}
                    >
                      {t('savePatient', 'Add Client')}
                    </Button>
                    {formik.isSubmitting && (
                      <CircularProgress 
                        size={24} 
                        sx={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          mt: -1.5, 
                          ml: -1.5 
                        }} 
                      />
                    )}
                  </Box>
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
    </WellnessLayout>
  );
};

export default AddPatientPage;
