import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Card,
  Tabs,
  Tab,
  TextField,
  Button,
  Divider,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';

/**
 * AuthPage renders login and registration forms with Google authentication.
 */
const AuthPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState(0);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    type: 'therapist',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const theme = createTheme({
    direction: i18n.dir(),
    palette: {
      primary: { main: '#00A699' },
      background: { default: '#F5F5F5' },
    },
    typography: { fontFamily: 'Roboto' },
  });

  const handleTabChange = (_: React.SyntheticEvent, value: number) => {
    setTab(value);
    setErrors({});
  };

  const handleLogin = () => {
    const newErrors: { [key: string]: string } = {};
    if (!loginData.email) newErrors.email = t('required');
    if (!loginData.password) newErrors.password = t('required');
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      // submit login
    }
  };

  const handleRegister = () => {
    const newErrors: { [key: string]: string } = {};
    if (!registerData.fullName) newErrors.fullName = t('required');
    if (!registerData.email) newErrors.email = t('required');
    if (!registerData.password) newErrors.password = t('required');
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      // submit register
    }
  };

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Card sx={{ p: 3, width: '100%', maxWidth: 420, boxShadow: 3 }}>
            <Tabs
              value={tab}
              onChange={handleTabChange}
              textColor="primary"
              indicatorColor="primary"
              variant="fullWidth"
              aria-label="auth tabs"
            >
              <Tab label={t('login')} aria-label="login tab" />
              <Tab label={t('register')} aria-label="register tab" />
            </Tabs>
            {tab === 0 && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label={t('email')}
                  margin="normal"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  aria-label="email"
                />
                {errors.email && (
                  <Typography variant="body2" sx={{ color: '#D32F2F' }}>
                    {errors.email}
                  </Typography>
                )}
                <TextField
                  fullWidth
                  type="password"
                  label={t('password')}
                  margin="normal"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  aria-label="password"
                />
                {errors.password && (
                  <Typography variant="body2" sx={{ color: '#D32F2F' }}>
                    {errors.password}
                  </Typography>
                )}
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={handleLogin}
                  aria-label="login"
                >
                  {t('login')}
                </Button>
                <Divider sx={{ my: 2 }}>{t('or')}</Divider>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin onSuccess={() => {}} onError={() => {}} width="100%" />
                </Box>
              </Box>
            )}
            {tab === 1 && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label={t('fullName')}
                  margin="normal"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                  aria-label="full name"
                />
                {errors.fullName && (
                  <Typography variant="body2" sx={{ color: '#D32F2F' }}>
                    {errors.fullName}
                  </Typography>
                )}
                <TextField
                  fullWidth
                  label={t('email')}
                  margin="normal"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  aria-label="email"
                />
                {errors.email && (
                  <Typography variant="body2" sx={{ color: '#D32F2F' }}>
                    {errors.email}
                  </Typography>
                )}
                <TextField
                  fullWidth
                  type="password"
                  label={t('password')}
                  margin="normal"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  aria-label="password"
                />
                {errors.password && (
                  <Typography variant="body2" sx={{ color: '#D32F2F' }}>
                    {errors.password}
                  </Typography>
                )}
                <RadioGroup
                  row
                  value={registerData.type}
                  onChange={(e) => setRegisterData({ ...registerData, type: e.target.value })}
                  sx={{ mt: 1 }}
                  aria-label="user type"
                >
                  <FormControlLabel
                    value="therapist"
                    control={<Radio />}
                    label={t('therapist')}
                  />
                  <FormControlLabel value="patient" control={<Radio />} label={t('patient')} />
                </RadioGroup>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={handleRegister}
                  aria-label="register"
                >
                  {t('register')}
                </Button>
                <Divider sx={{ my: 2 }}>{t('or')}</Divider>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin onSuccess={() => {}} onError={() => {}} width="100%" />
                </Box>
              </Box>
            )}
          </Card>
        </Box>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default AuthPage;

