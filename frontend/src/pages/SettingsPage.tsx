import React, { useEffect, useState } from 'react';
import {
  Tabs,
  Tab,
  Box,
  TextField,
  Switch,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { fetchSettings, saveSettings } from '../api/settings';
import { logger } from '../logger';

interface Setting {
  key: string;
  value: string;
  category: string;
}

const categories = [
  'Profile',
  'Billing & Subscription',
  'Payments',
  'Notifications',
  'Security',
];

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState(0);
  const [initial, setInitial] = useState<Setting[]>([]);
  const [snack, setSnack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width:600px)');


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
    <Box sx={{ display: 'flex', p: 2, flexDirection: isMobile ? 'column' : 'row' }}>
        {isMobile ? (
          <IconButton onClick={() => setTab((t) => (t + 1) % categories.length))}>
            <MenuIcon />
          </IconButton>
        ) : (
          <Tabs
            orientation="vertical"
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ borderRight: 1, borderColor: 'divider', minWidth: 200 }}
          >
            {categories.map((c) => (
              <Tab key={c} label={t(c)} />
            ))}
          </Tabs>
        )}
        <Box sx={{ flexGrow: 1, p: 2 }}>
          <form onSubmit={formik.handleSubmit}>
            {tab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={t('Language')}
                  name="lang"
                  value={formik.values.lang}
                  onChange={(e) => {
                    formik.handleChange(e);
                    logger.debug('change lang', e.target.value);
                  }}
                  select
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                </TextField>
                <Switch
                  checked={formik.values.emailAlerts}
                  onChange={(e) => {
                    formik.handleChange(e);
                    logger.debug('change emailAlerts', e.target.checked);
                  }}
                  name="emailAlerts"
                />
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" sx={{ mr: 1 }}>
                {t('Save Changes')}
              </Button>
              <Button variant="outlined" onClick={handleReset}>
                {t('Reset to Defaults')}
              </Button>
            </Box>
          </form>
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Snackbar
            open={!!snack}
            autoHideDuration={4000}
            onClose={() => setSnack(null)}
            message={snack}
          />
        </Box>
      </Box>
  );
};

export default SettingsPage;
