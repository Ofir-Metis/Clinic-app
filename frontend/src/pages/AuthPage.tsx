import React, { useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  MenuItem,
  Select,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useTranslation } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme';
import { GOOGLE_CLIENT_ID } from '../env';
import { login as authLogin, register as authRegister } from '../api/auth';
import { useAuth, User } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

/**
 * Enhanced AuthPage with wellness-focused design for clinic management.
 */
const AuthPage: React.FC = () => {
  const { t, i18n, translations } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    type: 'therapist',
    specialization: '',
    licenseNumber: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleTabChange = (_: React.SyntheticEvent, value: number) => {
    setTab(value);
    setErrors({});
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleLogin = async () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!loginData.email) {
      newErrors.email = t('auth.login.errors.required');
    } else if (!validateEmail(loginData.email)) {
      newErrors.email = t('auth.login.errors.emailFormat');
    }

    if (!loginData.password) {
      newErrors.password = t('auth.login.errors.required');
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        // Call real authentication API
        const response = await authLogin(loginData.email, loginData.password);

        // Determine role from API response
        const userRole: User['role'] = response.user?.roles?.includes('admin')
          ? 'admin'
          : response.user?.roles?.includes('client') || response.user?.roles?.includes('patient')
            ? 'client'
            : 'coach';

        // Build user data from API response
        const userData: User = {
          id: response.user?.id?.toString() || '0',
          email: response.user?.email || loginData.email,
          name: response.user?.name || '',
          role: userRole,
        };

        // Use AuthContext to properly store credentials
        await login(
          {
            accessToken: response.access_token,
            refreshToken: response.refresh_token || response.access_token,
            expiresIn: 3600,
          },
          userData
        );

        navigate('/dashboard');
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || t('auth.login.errors.invalidCredentials');
        setErrors({ general: errorMessage });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRegister = async () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!registerData.fullName) {
      newErrors.fullName = t('auth.register.errors.required');
    }

    if (!registerData.email) {
      newErrors.email = t('auth.register.errors.required');
    } else if (!validateEmail(registerData.email)) {
      newErrors.email = t('auth.register.errors.emailFormat');
    }

    if (!registerData.password) {
      newErrors.password = t('auth.register.errors.required');
    } else if (!validatePassword(registerData.password)) {
      newErrors.password = t('auth.register.errors.passwordRequirements');
    }

    if (registerData.type === 'therapist' && !registerData.licenseNumber) {
      newErrors.licenseNumber = t('auth.register.errors.required');
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        // Map form type to role
        const role = registerData.type === 'therapist' ? 'coach' : 'client';

        // Call real registration API
        const registerResponse = await authRegister({
          email: registerData.email,
          password: registerData.password,
          name: registerData.fullName,
          role: role
        });

        // After registration, log in to get tokens
        const loginResponse = await authLogin(registerData.email, registerData.password);

        // Build user data
        const userData: User = {
          id: loginResponse.user?.id?.toString() || registerResponse.id?.toString() || '0',
          email: registerData.email,
          name: registerData.fullName,
          role: role as User['role'],
        };

        // Use AuthContext to properly store credentials
        await login(
          {
            accessToken: loginResponse.access_token,
            refreshToken: loginResponse.refresh_token || loginResponse.access_token,
            expiresIn: 3600,
          },
          userData
        );

        navigate('/dashboard');
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || t('auth.register.errors.required');
        setErrors({ general: errorMessage });
      } finally {
        setLoading(false);
      }
    }
  };

  const clientId = GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4 },
        }}>
          {/* Language Switcher */}
          <Box sx={{ 
            position: 'absolute', 
            top: { xs: 16, sm: 24 }, 
            right: { xs: 16, sm: 24 },
            zIndex: 10,
          }}>
            <Select
              value={i18n.language}
              onChange={e => i18n.changeLanguage(e.target.value)}
              size="small"
              aria-label={translations.ui?.languageSwitcher || "language switcher"}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="en">🇺🇸 English</MenuItem>
              <MenuItem value="he">🇮🇱 עברית</MenuItem>
              <MenuItem value="ru">🇷🇺 Русский</MenuItem>
              <MenuItem value="ar">🇸🇦 العربية</MenuItem>
            </Select>
          </Box>

          <Card sx={{ 
            width: '100%', 
            maxWidth: { xs: '100%', sm: 480, md: 520 },
          }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                    fontWeight: 700,
                    mb: 1,
                    background: 'linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {translations.appName || '🌿 Wellness Clinic'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {translations.appDescription || 'Professional mental health and personal development platform'}
                </Typography>
              </Box>

              {/* General Error */}
              {errors.general && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errors.general}
                </Alert>
              )}

              {/* Tabs */}
              <Tabs
                value={tab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ mb: 2 }}
              >
                <Tab
                  label={t('auth.login.loginButton')}
                  icon={<PersonIcon />}
                  iconPosition="start"
                />
                <Tab
                  label={t('auth.register.registerButton')}
                  icon={<PsychologyIcon />}
                  iconPosition="start"
                />
              </Tabs>

              {/* Login Tab */}
              <TabPanel value={tab} index={0}>
                <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                  <TextField
                    fullWidth
                    label={t('auth.login.email')}
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    error={!!errors.email}
                    helperText={errors.email}
                    sx={{ mb: 2 }}
                    disabled={loading}
                  />

                  <TextField
                    fullWidth
                    label={t('auth.login.password')}
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    error={!!errors.password}
                    helperText={errors.password}
                    disabled={loading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 3 }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ 
                      mb: 3,
                      height: { xs: 48, sm: 52 },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      t('auth.login.loginButton')
                    )}
                  </Button>

                  {/* Divider */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3,
                  }}>
                    <Box sx={{ flexGrow: 1, height: 1, bgcolor: 'divider' }} />
                    <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>
                      {t('auth.login.or')}
                    </Typography>
                    <Box sx={{ flexGrow: 1, height: 1, bgcolor: 'divider' }} />
                  </Box>

                  {/* Google Login */}
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                      onSuccess={() => navigate('/dashboard')}
                      onError={() => {}}
                      width={400}
                      theme="outline"
                      size="large"
                    />
                  </Box>
                </Box>
              </TabPanel>

              {/* Register Tab */}
              <TabPanel value={tab} index={1}>
                <Box component="form" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
                  <TextField
                    fullWidth
                    label={t('auth.register.fullName')}
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                    error={!!errors.fullName}
                    helperText={errors.fullName}
                    disabled={loading}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label={t('auth.register.email')}
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    error={!!errors.email}
                    helperText={errors.email}
                    disabled={loading}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label={t('auth.register.password')}
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    error={!!errors.password}
                    helperText={errors.password}
                    disabled={loading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />

                  {/* User Type Selection */}
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Account Type
                  </Typography>
                  <RadioGroup
                    value={registerData.type}
                    onChange={(e) => setRegisterData({ ...registerData, type: e.target.value })}
                    sx={{ mb: 2 }}
                  >
                    <FormControlLabel
                      value="therapist"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PsychologyIcon fontSize="small" />
                          {t('auth.register.therapist')}
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="patient"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" />
                          {t('auth.register.patient')}
                        </Box>
                      }
                    />
                  </RadioGroup>

                  {/* Therapist-specific fields */}
                  {registerData.type === 'therapist' && (
                    <>
                      <TextField
                        fullWidth
                        label={t('settings.profile.specialization')}
                        value={registerData.specialization}
                        onChange={(e) => setRegisterData({ ...registerData, specialization: e.target.value })}
                        placeholder={translations.placeholders?.specialization || "e.g., Cognitive Behavioral Therapy, Family Therapy"}
                        disabled={loading}
                        sx={{ mb: 2 }}
                      />

                      <TextField
                        fullWidth
                        label="License Number"
                        value={registerData.licenseNumber}
                        onChange={(e) => setRegisterData({ ...registerData, licenseNumber: e.target.value })}
                        error={!!errors.licenseNumber}
                        helperText={errors.licenseNumber}
                        disabled={loading}
                        sx={{ mb: 2 }}
                      />
                    </>
                  )}

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ 
                      mb: 3,
                      height: { xs: 48, sm: 52 },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      t('auth.register.registerButton')
                    )}
                  </Button>

                  {/* Divider */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3,
                  }}>
                    <Box sx={{ flexGrow: 1, height: 1, bgcolor: 'divider' }} />
                    <Typography variant="body2" sx={{ px: 2, color: 'text.secondary' }}>
                      {t('auth.register.or')}
                    </Typography>
                    <Box sx={{ flexGrow: 1, height: 1, bgcolor: 'divider' }} />
                  </Box>

                  {/* Google Registration */}
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                      onSuccess={() => navigate('/dashboard')}
                      onError={() => {}}
                      width={400}
                      theme="outline"
                      size="large"
                    />
                  </Box>
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Box>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default AuthPage;

