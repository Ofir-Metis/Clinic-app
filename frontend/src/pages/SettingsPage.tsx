import React, { useEffect, useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Tabs,
  Tab,
  Box,
  TextField,
  Switch,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  Typography,
  Card,
  CardContent,
  FormControlLabel,
  Divider,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  Language as LanguageIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { fetchSettings, saveSettings } from '../api/settings';
import { logger } from '../logger';
import { theme } from '../theme';
import WellnessLayout from '../layouts/WellnessLayout';

interface Setting {
  key: string;
  value: string;
  category: string;
}

const categories = [
  { key: 'Profile', label: 'Profile', icon: <PersonIcon /> },
  { key: 'Notifications', label: 'Notifications', icon: <NotificationsIcon /> },
  { key: 'Security', label: 'Security', icon: <SecurityIcon /> },
  { key: 'Billing', label: 'Billing & Subscription', icon: <PaymentIcon /> },
  { key: 'Language', label: 'Language & Region', icon: <LanguageIcon /> },
];

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState(0);
  const [initial, setInitial] = useState<Setting[]>([]);
  const [snack, setSnack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    logger.debug('load settings');
    fetchSettings()
      .then(setInitial)
      .catch(() => setError('load error'));
  }, []);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      lang: initial.find((s) => s.key === 'lang')?.value || 'en',
      emailAlerts: initial.find((s) => s.key === 'emailAlerts')?.value === 'true',
    },
    validationSchema: Yup.object({
      lang: Yup.string().required(),
      emailAlerts: Yup.boolean(),
    }),
    onSubmit: async (values) => {
      logger.debug('save settings', values);
      try {
        await saveSettings([
          { key: 'lang', value: values.lang, category: 'Profile' },
          { key: 'emailAlerts', value: String(values.emailAlerts), category: 'Notifications' },
        ]);
        setSnack('saved');
      } catch (e) {
        logger.debug('save error', e);
        setError('save failed');
      }
    },
  });

  const handleReset = () => {
    logger.debug('reset');
    formik.resetForm();
  };

  return (
    <WellnessLayout
        title="Settings"
        showFab={false}
      >
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
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
            ⚙️ Settings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Customize your wellness platform experience
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          {/* Settings Navigation */}
          <Card sx={{ 
            width: { xs: '100%', md: 280 },
            height: 'fit-content',
            position: { md: 'sticky' },
            top: { md: 100 },
          }}>
            <CardContent sx={{ p: 0 }}>
              <Tabs
                orientation={{ xs: 'horizontal', md: 'vertical' }}
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 60,
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    textAlign: 'left',
                    px: 3,
                    py: 2,
                    '&.Mui-selected': {
                      background: 'rgba(46, 125, 107, 0.08)',
                      borderRight: { md: '3px solid' },
                      borderBottom: { xs: '3px solid', md: 'none' },
                      borderColor: 'primary.main',
                    },
                  },
                }}
              >
                {categories.map((category, index) => (
                  <Tab 
                    key={category.key} 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Avatar sx={{ 
                          width: 32, 
                          height: 32, 
                          bgcolor: tab === index ? 'primary.main' : 'grey.100',
                          color: tab === index ? 'white' : 'grey.600',
                        }}>
                          {category.icon}
                        </Avatar>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: tab === index ? 600 : 400,
                            display: { xs: 'none', sm: 'block' },
                          }}
                        >
                          {t(category.label)}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Settings Content */}
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                {categories[tab]?.label}
              </Typography>
              
              <form onSubmit={formik.handleSubmit}>
                {/* Profile Tab */}
                {tab === 0 && (
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
                      <Stack spacing={3}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          placeholder="Enter your full name"
                          variant="outlined"
                        />
                        <TextField
                          fullWidth
                          label="Email Address"
                          placeholder="Enter your email"
                          variant="outlined"
                        />
                        <TextField
                          fullWidth
                          label="Professional Title"
                          placeholder="e.g., Licensed Clinical Social Worker"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                    
                    <Divider />
                    
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>Professional Information</Typography>
                      <Stack spacing={3}>
                        <TextField
                          fullWidth
                          label="License Number"
                          placeholder="Enter your license number"
                          variant="outlined"
                        />
                        <TextField
                          fullWidth
                          label="Specialization"
                          placeholder="e.g., Cognitive Behavioral Therapy"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                  </Stack>
                )}
                
                {/* Notifications Tab */}
                {tab === 1 && (
                  <Stack spacing={3}>
                    <Typography variant="h6">Notification Preferences</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formik.values.emailAlerts}
                          onChange={(e) => {
                            formik.handleChange(e);
                            logger.debug('change emailAlerts', e.target.checked);
                          }}
                          name="emailAlerts"
                        />
                      }
                      label="Email Notifications"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="Appointment Reminders"
                    />
                    <FormControlLabel
                      control={<Switch />}
                      label="New Client Notifications"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="System Updates"
                    />
                  </Stack>
                )}
                
                {/* Security Tab */}
                {tab === 2 && (
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2 }}>Password & Security</Typography>
                      <Stack spacing={3}>
                        <Button variant="outlined" sx={{ alignSelf: 'flex-start' }}>
                          Change Password
                        </Button>
                        <FormControlLabel
                          control={<Switch defaultChecked />}
                          label="Two-Factor Authentication"
                        />
                      </Stack>
                    </Box>
                  </Stack>
                )}
                
                {/* Language Tab */}
                {tab === 4 && (
                  <Stack spacing={3}>
                    <Typography variant="h6">Language & Region</Typography>
                    <TextField
                      label={t('Language')}
                      name="lang"
                      value={formik.values.lang}
                      onChange={(e) => {
                        formik.handleChange(e);
                        logger.debug('change lang', e.target.value);
                      }}
                      select
                      fullWidth
                    >
                      <MenuItem value="en">🇺🇸 English</MenuItem>
                      <MenuItem value="he">🇮🇱 עברית</MenuItem>
                      <MenuItem value="es">🇪🇸 Español</MenuItem>
                      <MenuItem value="ar">🇸🇦 العربية</MenuItem>
                    </TextField>
                  </Stack>
                )}
                
                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2}>
                    <Button type="submit" variant="contained" size="large">
                      {t('Save Changes')}
                    </Button>
                    <Button variant="outlined" size="large" onClick={handleReset}>
                      {t('Reset to Defaults')}
                    </Button>
                  </Stack>
                </Box>
              </form>
              
              {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 3 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
        
        <Snackbar
          open={!!snack}
          autoHideDuration={4000}
          onClose={() => setSnack(null)}
          message={snack}
        />
      </WellnessLayout>
  );
};

export default SettingsPage;
