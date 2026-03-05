import React, { useEffect, useState, useCallback } from 'react';
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
  Typography,
  Card,
  CardContent,
  FormControlLabel,
  Divider,
  Avatar,
  Stack,
  Grid,
  Chip,
  IconButton,
  Fade,
  CircularProgress,
  alpha,
  useTheme,
  InputAdornment,
  Slide
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Payment as PaymentIcon,
  Language as LanguageIcon,
  Settings as SettingsIcon,
  Palette as ThemeIcon,
  Security as PrivacyIcon,
  Check as CheckIcon,
  Translate as TranslateIcon,
  AutoAwesome as SparkleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { useLanguage, useTranslation } from '../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../i18n/index';
import WellnessLayout from '../layouts/WellnessLayout';
import { useAuth } from '../AuthContext';
import { fetchSettings, saveSettings } from '../api/settings';
import { updateTherapistProfile } from '../api/therapist';
import { logger } from '../logger';
import { GoogleIntegrationSettings } from '../components/google/GoogleIntegrationSettings';

interface Setting {
  key: string;
  value: string;
  category: string;
}

// Form data interface
interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  professionalTitle: string;
  specialization: string;
  location: string;
  bio: string;
}

// Form errors interface
interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  [key: string]: string | undefined;
}

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const { translations: t, language, isRTL, i18n } = useTranslation();
  const { currentLanguageInfo, isChangingLanguage } = useLanguage();
  const { user } = useAuth();
  const changeLanguage = i18n.changeLanguage;
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state management - initialized with empty values, populated from user context
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    phone: '',
    professionalTitle: '',
    specialization: '',
    location: '',
    bio: ''
  });

  const [initialFormData, setInitialFormData] = useState<ProfileFormData>(formData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  // Populate form data from authenticated user and load settings from API
  useEffect(() => {
    if (user) {
      const userData: ProfileFormData = {
        fullName: user.name || '',
        email: user.email || '',
        phone: '',
        professionalTitle: '',
        specialization: '',
        location: '',
        bio: '',
      };
      setFormData(userData);
      setInitialFormData(userData);

      // Load saved settings from backend
      fetchSettings()
        .then((settings: Setting[]) => {
          if (!Array.isArray(settings)) return;
          const profileUpdates: Partial<ProfileFormData> = {};
          settings.forEach((s: Setting) => {
            if (s.category === 'profile') {
              if (s.key === 'phone') profileUpdates.phone = s.value;
              if (s.key === 'professionalTitle') profileUpdates.professionalTitle = s.value;
              if (s.key === 'specialization') profileUpdates.specialization = s.value;
              if (s.key === 'location') profileUpdates.location = s.value;
              if (s.key === 'bio') profileUpdates.bio = s.value;
            }
          });
          if (Object.keys(profileUpdates).length > 0) {
            setFormData((prev) => {
              const merged = { ...prev, ...profileUpdates };
              setInitialFormData(merged);
              return merged;
            });
          }
        })
        .catch((e) => {
          logger.debug('Failed to load settings, using defaults', e);
        });
    }
  }, [user]);

  // Track form changes
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setIsDirty(hasChanges);
  }, [formData, initialFormData]);

  // Form validation
  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Invalid email format';
        break;
      case 'phone':
        if (value && value.trim()) {
          const phoneRegex = /^[\d\s\-\+\(\)]+$/;
          if (!phoneRegex.test(value)) return 'Invalid phone format';
        }
        break;
    }
    return undefined;
  }, []);

  // Handle field change
  const handleFieldChange = useCallback((field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validate field
    const error = validateField(field, value);
    setFormErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, [validateField]);

  // Handle discard changes
  const handleDiscardChanges = useCallback(() => {
    setFormData(initialFormData);
    setFormErrors({});
    setIsDirty(false);
  }, [initialFormData]);

  const categories = [
    {
      key: 'profile',
      title: t.settings.sections.profile.title,
      description: t.settings.sections.profile.description,
      icon: <PersonIcon />
    },
    {
      key: 'preferences',
      title: t.settings.sections.preferences.title,
      description: t.settings.sections.preferences.description,
      icon: <SettingsIcon />
    },
    {
      key: 'google',
      title: t.settings.sections.google.title,
      description: t.settings.sections.google.description,
      icon: <GoogleIcon />
    },
    {
      key: 'language',
      title: t.settings.sections.language.title,
      description: t.settings.sections.language.description,
      icon: <TranslateIcon />
    },
    {
      key: 'theme',
      title: t.settings.sections.theme.title,
      description: t.settings.sections.theme.description,
      icon: <ThemeIcon />
    },
    {
      key: 'notifications',
      title: t.settings.sections.notifications.title,
      description: t.settings.sections.notifications.description,
      icon: <NotificationsIcon />
    },
    {
      key: 'privacy',
      title: t.settings.sections.privacy.title,
      description: t.settings.sections.privacy.description,
      icon: <PrivacyIcon />
    }
  ];


  const handleLanguageChange = async (newLanguage: any) => {
    setIsLoading(true);
    try {
      await changeLanguage(newLanguage);
      setSnack(t.settings.language.changeSuccess);
    } catch (error) {
      setError(t.errors.general);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    //  Validate all fields
    const errors: FormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof ProfileFormData]);
      if (error) {
        errors[key] = error;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError(t.settings?.errors?.pleaseFixErrors || 'Please fix the errors before saving');
      return;
    }

    setIsLoading(true);
    try {
      // Save profile fields to settings service
      const settingsPayload: Setting[] = [
        { key: 'phone', value: formData.phone, category: 'profile' },
        { key: 'professionalTitle', value: formData.professionalTitle, category: 'profile' },
        { key: 'specialization', value: formData.specialization, category: 'profile' },
        { key: 'location', value: formData.location, category: 'profile' },
        { key: 'bio', value: formData.bio, category: 'profile' },
      ];
      await saveSettings(settingsPayload);

      // Also update coach profile (name, email) via the coach profile API
      if (user?.id) {
        await updateTherapistProfile(user.id, {
          userId: user.id,
          name: formData.fullName,
          title: formData.professionalTitle,
          bio: formData.bio,
          services: [],
          media: [],
        });
      }

      setInitialFormData(formData);
      setIsDirty(false);
      setSnack(t.status.saved);
    } catch (err) {
      logger.error('Failed to save settings', err);
      setError(t.errors.general);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <WellnessLayout
        title={t.settings.title}
        showFab={false}
      >
      {/* Header Section */}
      <Box sx={{ 
        mb: 4, 
        textAlign: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
        borderRadius: 3,
        p: 4
      }}>
        <SparkleIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            mb: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t.settings.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          {t.settings.subtitle}
        </Typography>
        <Chip 
          label={`${t.settings.language.current}: ${currentLanguageInfo.flag} ${currentLanguageInfo.nativeName}`}
          color="primary"
          variant="outlined"
          sx={{ mt: 2 }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        {/* Settings Navigation */}
        <Card sx={{
          width: { xs: '100%', lg: 360 },
          maxHeight: { lg: 'calc(100vh - 200px)' },
          overflowY: 'auto',
          position: { lg: 'sticky' },
          top: { lg: 100 },
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08)'
        }}>
          <CardContent sx={{ p: 0 }}>
            <Tabs
              orientation={{ xs: 'horizontal', lg: 'vertical' }}
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: { xs: 72, sm: 68, lg: 'auto' },
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  px: { xs: 2, sm: 2.5, lg: 3 },
                  py: { xs: 2, sm: 2, lg: 2.5 },
                  borderRadius: 2,
                  margin: { xs: 0.5, lg: 1 },
                  transition: 'all 0.3s ease',
                  '&.Mui-selected': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`,
                    borderLeft: { lg: `4px solid ${theme.palette.primary.main}` },
                    borderBottom: { xs: `4px solid ${theme.palette.primary.main}`, lg: 'none' },
                    '& .MuiAvatar-root': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      transform: 'scale(1.1)'
                    }
                  },
                  '&:hover': {
                    background: alpha(theme.palette.primary.light, 0.08),
                    transform: { lg: 'translateX(4px)' }
                  }
                },
              }}
            >
              {categories.map((category, index) => (
                <Tab
                  key={category.key}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, lg: 2 }, width: '100%', textAlign: 'left' }}>
                      <Avatar sx={{
                        width: { xs: 36, lg: 40 },
                        height: { xs: 36, lg: 40 },
                        bgcolor: tab === index ? 'primary.main' : alpha(theme.palette.grey[400], 0.3),
                        color: tab === index ? 'white' : 'grey.600',
                        transition: 'all 0.3s ease',
                        flexShrink: 0
                      }}>
                        {category.icon}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: tab === index ? 600 : 500,
                            mb: 0.5,
                            color: tab === index ? 'primary.main' : 'text.primary',
                            fontSize: { xs: '0.875rem', sm: '0.95rem', lg: '1rem' },
                            lineHeight: 1.4,
                            wordBreak: 'break-word'
                          }}
                        >
                          {category.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            display: { xs: 'none', sm: 'block' },
                            fontSize: { sm: '0.75rem', lg: '0.8rem' },
                            lineHeight: 1.3,
                            wordBreak: 'break-word',
                            whiteSpace: 'normal'
                          }}
                        >
                          {category.description}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <Card sx={{
          flex: 1,
          minWidth: 0,
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08)'
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, lg: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 3, lg: 4 }, gap: 2 }}>
              <Avatar sx={{
                bgcolor: 'primary.main',
                width: { xs: 44, lg: 48 },
                height: { xs: 44, lg: 48 },
                flexShrink: 0
              }}>
                {categories[tab]?.icon}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem', lg: '2rem' } }}>
                  {categories[tab]?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', lg: '1rem' } }}>
                  {categories[tab]?.description}
                </Typography>
              </Box>
            </Box>
            
            <Fade in timeout={300}>
              <Box>
                {/* Google Integration Tab */}
                {tab === 2 && (
                  <GoogleIntegrationSettings currentUserId={user?.id?.toString() || ''} />
                )}

                {/* Language Settings Tab */}
                {tab === 3 && (
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TranslateIcon color="primary" />
                        {t.settings.language.title}
                      </Typography>
                      
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        {t.settings.language.description}
                      </Typography>

                      {/* Current Language Display */}
                      <Card sx={{ 
                        mb: 4, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
                        border: `2px solid ${theme.palette.primary.main}`,
                        borderRadius: 3
                      }}>
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                            {t.settings.language.current}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                            <Typography variant="h2">{currentLanguageInfo.flag}</Typography>
                            <Box>
                              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                {currentLanguageInfo.nativeName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {currentLanguageInfo.description}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Available Languages */}
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        {t.settings.language.available}
                      </Typography>
                      
                      <Grid container spacing={3}>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <Grid item xs={12} sm={6} md={4} key={lang.code}>
                            <Card
                              sx={{
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: language === lang.code 
                                  ? `2px solid ${theme.palette.primary.main}` 
                                  : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                background: language === lang.code
                                  ? `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.1)} 100%)`
                                  : alpha(theme.palette.background.paper, 0.5),
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                                  border: `2px solid ${theme.palette.primary.light}`
                                },
                                position: 'relative'
                              }}
                              onClick={() => handleLanguageChange(lang.code)}
                            >
                              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                {language === lang.code && (
                                  <CheckIcon 
                                    sx={{ 
                                      position: 'absolute',
                                      top: 8,
                                      right: 8,
                                      color: 'primary.main',
                                      fontSize: 24
                                    }} 
                                  />
                                )}
                                
                                <Typography variant="h1" sx={{ mb: 2 }}>
                                  {lang.flag}
                                </Typography>
                                
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                  {lang.nativeName}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {lang.name}
                                </Typography>
                                
                                <Typography variant="caption" color="text.secondary" sx={{ 
                                  display: 'block',
                                  fontSize: '0.75rem',
                                  lineHeight: 1.3
                                }}>
                                  {lang.description}
                                </Typography>
                                
                                {isChangingLanguage && language !== lang.code && (
                                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                    <CircularProgress size={20} />
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Stack>
                )}

                {/* Theme Settings Tab */}
                {tab === 4 && (
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ThemeIcon color="primary" />
                        {t.settings.theme.title}
                      </Typography>
                      
                      <Grid container spacing={{ xs: 2, sm: 3 }}>
                        <Grid item xs={12} sm={6} md={4}>
                          <Card sx={{
                            cursor: 'pointer',
                            textAlign: 'center',
                            p: { xs: 2.5, sm: 3 }, // Better mobile padding
                            minHeight: { xs: 120, sm: 140 }, // Consistent mobile height
                            border: `2px solid ${theme.palette.divider}`,
                            borderRadius: 3,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              borderColor: 'primary.main',
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                            },
                            '&:active': { // Better mobile feedback
                              transform: 'translateY(0px)',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }}>
                            <Typography variant="h3" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '2rem', sm: '2.5rem' } }}>☀️</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                              {t.settings.theme.light}
                            </Typography>
                          </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                          <Card sx={{
                            cursor: 'pointer',
                            textAlign: 'center',
                            p: { xs: 2.5, sm: 3 }, // Better mobile padding
                            minHeight: { xs: 120, sm: 140 }, // Consistent mobile height
                            border: `2px solid ${theme.palette.divider}`,
                            borderRadius: 3,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              borderColor: 'primary.main',
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
                            },
                            '&:active': { // Better mobile feedback
                              transform: 'translateY(0px)',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
                            }
                          }}>
                            <Typography variant="h3" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '2rem', sm: '2.5rem' } }}>🌙</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                              {t.settings.theme.dark}
                            </Typography>
                          </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                          <Card sx={{
                            cursor: 'pointer',
                            textAlign: 'center',
                            p: { xs: 2.5, sm: 3 }, // Better mobile padding
                            minHeight: { xs: 120, sm: 140 }, // Consistent mobile height
                            border: `2px solid ${theme.palette.primary.main}`,
                            background: alpha(theme.palette.primary.light, 0.1),
                            borderRadius: 3,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              borderColor: 'primary.dark',
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`
                            },
                            '&:active': { // Better mobile feedback
                              transform: 'translateY(0px)',
                              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                            }
                          }}>
                            <Typography variant="h3" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '2rem', sm: '2.5rem' } }}>🌗</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                              {t.settings.theme.auto}
                            </Typography>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  </Stack>
                )}

                {/* Notifications Tab */}
                {tab === 5 && (
                  <Stack spacing={4}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotificationsIcon color="primary" />
                      {t.settings.notifications.heading}
                    </Typography>
                    
                    <Stack spacing={3}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label={t.settings.notifications.email}
                        sx={{ 
                          '& .MuiFormControlLabel-label': { 
                            fontSize: '1rem',
                            fontWeight: 500
                          }
                        }}
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label={t.settings.notifications.push}
                        sx={{ 
                          '& .MuiFormControlLabel-label': { 
                            fontSize: '1rem',
                            fontWeight: 500
                          }
                        }}
                      />
                      <FormControlLabel
                        control={<Switch />}
                        label={t.settings.notifications.sms}
                        sx={{ 
                          '& .MuiFormControlLabel-label': { 
                            fontSize: '1rem',
                            fontWeight: 500
                          }
                        }}
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label={t.settings.notifications.coaching}
                        sx={{ 
                          '& .MuiFormControlLabel-label': { 
                            fontSize: '1rem',
                            fontWeight: 500
                          }
                        }}
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label={t.settings.notifications.goals}
                        sx={{ 
                          '& .MuiFormControlLabel-label': { 
                            fontSize: '1rem',
                            fontWeight: 500
                          }
                        }}
                      />
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label={t.settings.notifications.milestones}
                        sx={{ 
                          '& .MuiFormControlLabel-label': { 
                            fontSize: '1rem',
                            fontWeight: 500
                          }
                        }}
                      />
                    </Stack>
                  </Stack>
                )}

                {/* Profile Tab */}
                {tab === 0 && (
                  <Stack spacing={6}>
                    {/* Personal Information Section */}
                    <Box>
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon color="primary" />
                          {t.settings.profile.information}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t.settings.profile.informationDescription}
                        </Typography>
                      </Box>

                      <Stack spacing={3}>
                        {/* Full Name - Single column (most important) */}
                        <TextField
                          fullWidth
                          required
                          label={t.settings.profile.fullName}
                          placeholder={t.placeholders.name}
                          variant="outlined"
                          value={formData.fullName}
                          onChange={(e) => handleFieldChange('fullName', e.target.value)}
                          error={Boolean(formErrors.fullName)}
                          helperText={formErrors.fullName || t.settings?.profile?.fullNameHelper || 'Your full professional name as it appears on credentials'}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon color="action" />
                              </InputAdornment>
                            ),
                            endAdornment: !formErrors.fullName && formData.fullName && (
                              <InputAdornment position="end">
                                <CheckCircleIcon color="success" fontSize="small" />
                              </InputAdornment>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              background: alpha(theme.palette.background.paper, 0.5)
                            }
                          }}
                        />

                        {/* Email and Phone - Paired (related contact info) */}
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              required
                              type="email"
                              label={t.settings.profile.email}
                              placeholder={t.placeholders.email}
                              variant="outlined"
                              value={formData.email}
                              onChange={(e) => handleFieldChange('email', e.target.value)}
                              error={Boolean(formErrors.email)}
                              helperText={formErrors.email || t.settings?.profile?.emailHelper || 'Used for login and important notifications'}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <EmailIcon color="action" />
                                  </InputAdornment>
                                ),
                                endAdornment: !formErrors.email && formData.email && (
                                  <InputAdornment position="end">
                                    <CheckCircleIcon color="success" fontSize="small" />
                                  </InputAdornment>
                                )
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label={t.settings.profile.phone}
                              placeholder={t.settings?.profile?.phonePlaceholder || "+1 (555) 123-4567"}
                              variant="outlined"
                              value={formData.phone}
                              onChange={(e) => handleFieldChange('phone', e.target.value)}
                              error={Boolean(formErrors.phone)}
                              helperText={formErrors.phone || t.settings?.profile?.phoneHelper || 'For client contact and appointment reminders'}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <PhoneIcon color="action" />
                                  </InputAdornment>
                                )
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Professional Information Section */}
                    <Box>
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WorkIcon color="primary" />
                          {t.settings.profile.professionalDetails}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t.settings.profile.professionalDetailsDescription}
                        </Typography>
                      </Box>

                      <Stack spacing={3}>
                        {/* Professional Title and Specialization - Paired (related professional info) */}
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label={t.settings.profile.professionalTitle}
                              placeholder={t.settings?.profile?.professionalTitlePlaceholder || "e.g., Life Coach, Personal Development Expert"}
                              variant="outlined"
                              value={formData.professionalTitle}
                              onChange={(e) => handleFieldChange('professionalTitle', e.target.value)}
                              helperText={t.settings?.profile?.professionalTitleHelper || "Your professional title or certification"}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label={t.settings.profile.specialization}
                              placeholder={t.settings?.profile?.specializationPlaceholder || "e.g., Career Coaching, Mindfulness, Goal Achievement"}
                              variant="outlined"
                              value={formData.specialization}
                              onChange={(e) => handleFieldChange('specialization', e.target.value)}
                              helperText={t.settings?.profile?.specializationHelper || "Your areas of coaching expertise"}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            />
                          </Grid>
                        </Grid>

                        {/* Location - Single column */}
                        <TextField
                          fullWidth
                          label={t.settings.profile.location}
                          placeholder={t.settings?.profile?.locationPlaceholder || "City, Country"}
                          variant="outlined"
                          value={formData.location}
                          onChange={(e) => handleFieldChange('location', e.target.value)}
                          helperText={t.settings?.profile?.locationHelper || "Your practice location (city and country)"}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationIcon color="action" />
                              </InputAdornment>
                            )
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              background: alpha(theme.palette.background.paper, 0.5)
                            }
                          }}
                        />
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Bio Section */}
                    <Box>
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                          {t.settings.profile.bioSection}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t.settings.profile.bioSectionDescription}
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label={t.settings.profile.professionalBio}
                        placeholder={t.settings.profile.bioPlaceholder}
                        variant="outlined"
                        value={formData.bio}
                        onChange={(e) => handleFieldChange('bio', e.target.value)}
                        helperText={`${formData.bio.length}/500 characters - Share your coaching philosophy and experience`}
                        inputProps={{ maxLength: 500 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            background: alpha(theme.palette.background.paper, 0.5)
                          }
                        }}
                      />
                    </Box>
                  </Stack>
                )}

                {/* Preferences Tab */}
                {tab === 1 && (
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SettingsIcon color="primary" />
                        {t.settings.preferences.heading}
                      </Typography>

                      <Grid container spacing={{ xs: 3, sm: 4 }}>
                        <Grid item xs={12} sm={6} md={6}>
                          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                            {t.settings.preferences.sessionDefaults}
                          </Typography>
                          <Stack spacing={3}>
                            <TextField
                              select
                              fullWidth
                              label={t.settings.preferences.defaultDuration}
                              defaultValue="60"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            >
                              <MenuItem value="30">{t.settings.preferences.duration30}</MenuItem>
                              <MenuItem value="45">{t.settings.preferences.duration45}</MenuItem>
                              <MenuItem value="60">{t.settings.preferences.duration60}</MenuItem>
                              <MenuItem value="90">{t.settings.preferences.duration90}</MenuItem>
                            </TextField>

                            <TextField
                              select
                              fullWidth
                              label={t.settings.preferences.defaultMeetingType}
                              defaultValue="online"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            >
                              <MenuItem value="online">🌐 {t.settings.preferences.meetingOnline}</MenuItem>
                              <MenuItem value="in-person">🏢 {t.settings.preferences.meetingInPerson}</MenuItem>
                              <MenuItem value="hybrid">🔄 {t.settings.preferences.meetingHybrid}</MenuItem>
                            </TextField>

                            <FormControlLabel
                              control={<Switch defaultChecked />}
                              label={t.settings.preferences.autoSummaries}
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  fontSize: '1rem',
                                  fontWeight: 500
                                }
                              }}
                            />
                            <FormControlLabel
                              control={<Switch defaultChecked />}
                              label={t.settings.preferences.sendReminders}
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  fontSize: '1rem',
                                  fontWeight: 500
                                }
                              }}
                            />
                          </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6} md={6}>
                          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                            {t.settings.preferences.interfaceOptions}
                          </Typography>
                          <Stack spacing={3}>
                            <TextField
                              select
                              fullWidth
                              label={t.settings.preferences.dashboardView}
                              defaultValue="cards"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            >
                              <MenuItem value="cards">📋 {t.settings.preferences.viewCards}</MenuItem>
                              <MenuItem value="list">📝 {t.settings.preferences.viewList}</MenuItem>
                              <MenuItem value="calendar">📅 {t.settings.preferences.viewCalendar}</MenuItem>
                            </TextField>

                            <FormControlLabel
                              control={<Switch defaultChecked />}
                              label={t.settings.preferences.showQuotes}
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  fontSize: '1rem',
                                  fontWeight: 500
                                }
                              }}
                            />
                            <FormControlLabel
                              control={<Switch />}
                              label={t.settings.preferences.enableAnimations}
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  fontSize: '1rem',
                                  fontWeight: 500
                                }
                              }}
                            />
                            <FormControlLabel
                              control={<Switch defaultChecked />}
                              label={t.settings.preferences.compactMenu}
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  fontSize: '1rem',
                                  fontWeight: 500
                                }
                              }}
                            />
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  </Stack>
                )}

                {/* Privacy Tab placeholder */}
                {tab === 6 && (
                  <Box sx={{
                    textAlign: 'center',
                    py: 8,
                    color: 'text.secondary'
                  }}>
                    <SparkleIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      {t.settings.privacy.comingSoon} 🔒
                    </Typography>
                    <Typography variant="body1">
                      {t.settings.privacy.comingSoonDescription}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Fade>
          </CardContent>
        </Card>
      </Box>

    </WellnessLayout>

      {/* Sticky Save Bar - Only shows when form is dirty */}
      <Slide direction="up" in={isDirty} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: `linear-gradient(to top, ${alpha(theme.palette.background.paper, 0.98)}, ${alpha(theme.palette.background.paper, 0.95)})`,
            backdropFilter: 'blur(20px)',
            borderTop: `2px solid ${theme.palette.primary.main}`,
            boxShadow: `0 -8px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
            zIndex: theme.zIndex.appBar - 1,
            py: 2,
            px: 3
          }}
        >
          <Box sx={{
            maxWidth: 1200,
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ErrorIcon color="warning" />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {t.settings.unsavedChanges.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t.settings.unsavedChanges.description}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={handleDiscardChanges}
                disabled={isLoading}
                sx={{
                  borderRadius: 2,
                  minWidth: 120
                }}
              >
                {t.settings.unsavedChanges.discard}
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveSettings}
                disabled={isLoading || Object.keys(formErrors).some(key => formErrors[key])}
                sx={{
                  borderRadius: 2,
                  minWidth: 120,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  }
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : t.actions.save}
              </Button>
            </Stack>
          </Box>

          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{
                mt: 2,
                maxWidth: 1200,
                mx: 'auto',
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontSize: '0.875rem'
                }
              }}
            >
              {error}
            </Alert>
          )}
        </Box>
      </Slide>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack(null)}
          severity="success"
          sx={{
            borderRadius: 3,
            minWidth: 300,
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          {snack}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SettingsPage;
