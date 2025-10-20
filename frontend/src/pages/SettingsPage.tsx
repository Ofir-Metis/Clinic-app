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
  useTheme
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
  AutoAwesome as SparkleIcon
} from '@mui/icons-material';
import { useLanguage, useTranslation } from '../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../i18n/index';
import WellnessLayout from '../layouts/WellnessLayout';

interface Setting {
  key: string;
  value: string;
  category: string;
}

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const { language, changeLanguage, isChangingLanguage, currentLanguageInfo, t } = useLanguage();
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSnack(t.status.saved);
    } catch (error) {
      setError(t.errors.general);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
        {/* Settings Navigation */}
        <Card sx={{ 
          width: { xs: '100%', md: 320 },
          height: 'fit-content',
          position: { md: 'sticky' },
          top: { md: 100 },
          background: alpha(theme.palette.background.paper, 0.85),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08)'
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
                  minHeight: { xs: 88, sm: 80 }, // Enhanced mobile touch targets
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  px: { xs: 2, sm: 3 }, // Better mobile padding
                  py: { xs: 2.5, sm: 2 }, // More vertical space on mobile
                  borderRadius: 2,
                  margin: 1,
                  transition: 'all 0.3s ease',
                  '&.Mui-selected': {
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    borderLeft: { md: `4px solid ${theme.palette.primary.main}` },
                    borderBottom: { xs: `4px solid ${theme.palette.primary.main}`, md: 'none' },
                    '& .MuiAvatar-root': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      transform: 'scale(1.1)'
                    }
                  },
                  '&:hover': {
                    background: alpha(theme.palette.primary.light, 0.05),
                    transform: 'translateY(-1px)'
                  }
                },
              }}
            >
              {categories.map((category, index) => (
                <Tab 
                  key={category.key} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%', textAlign: 'left' }}>
                      <Avatar sx={{ 
                        width: 40, 
                        height: 40, 
                        bgcolor: tab === index ? 'primary.main' : alpha(theme.palette.grey[400], 0.3),
                        color: tab === index ? 'white' : 'grey.600',
                        transition: 'all 0.3s ease'
                      }}>
                        {category.icon}
                      </Avatar>
                      <Box sx={{ flex: 1, display: 'block' }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: tab === index ? 600 : 500,
                            mb: { xs: 0, sm: 0.5 }, // Reduce margin on mobile
                            color: tab === index ? 'primary.main' : 'text.primary',
                            fontSize: { xs: '0.875rem', sm: '1rem' }, // Mobile-optimized sizing
                            lineHeight: { xs: 1.3, sm: 1.5 }
                          }}
                        >
                          {category.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            display: { xs: 'none', sm: '-webkit-box' }, // Hide descriptions on mobile for cleaner UI
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            lineHeight: 1.2
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
          background: alpha(theme.palette.background.paper, 0.85),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar sx={{ 
                mr: 2, 
                bgcolor: 'primary.main',
                width: 48,
                height: 48
              }}>
                {categories[tab]?.icon}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {categories[tab]?.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {categories[tab]?.description}
                </Typography>
              </Box>
            </Box>
            
            <Fade in timeout={300}>
              <Box>
                {/* Language Settings Tab */}
                {tab === 2 && (
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
                {tab === 3 && (
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
                {tab === 4 && (
                  <Stack spacing={4}>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotificationsIcon color="primary" />
                      Notification Preferences
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
                  <Stack spacing={4}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" />
                        Profile Information
                      </Typography>

                      <Grid container spacing={{ xs: 3, sm: 4 }}>
                        <Grid item xs={12} sm={6} md={6}>
                          <Stack spacing={3}>
                            <TextField
                              fullWidth
                              label="Full Name"
                              placeholder={t.placeholders.name}
                              variant="outlined"
                              defaultValue="Dr. Sarah Johnson"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            />
                            <TextField
                              fullWidth
                              label="Email Address"
                              placeholder={t.placeholders.email}
                              variant="outlined"
                              defaultValue="sarah.johnson@coaching.com"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            />
                            <TextField
                              fullWidth
                              label="Phone Number"
                              placeholder="+1 (555) 123-4567"
                              variant="outlined"
                              defaultValue="+1 (555) 123-4567"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            />
                          </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6} md={6}>
                          <Stack spacing={3}>
                            <TextField
                              fullWidth
                              label="Professional Title"
                              placeholder="e.g., Life Coach, Personal Development Expert"
                              variant="outlined"
                              defaultValue="Certified Life & Wellness Coach"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            />
                            <TextField
                              fullWidth
                              label="Specialization"
                              placeholder="e.g., Career Coaching, Mindfulness, Goal Achievement"
                              variant="outlined"
                              defaultValue="Personal Growth & Mindfulness"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            />
                            <TextField
                              fullWidth
                              label="Location"
                              placeholder="City, Country"
                              variant="outlined"
                              defaultValue="San Francisco, CA"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            />
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                    
                    <Divider />
                    
                    <Box>
                      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                        Bio & Description
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Professional Bio"
                        placeholder="Share your coaching philosophy and approach..."
                        variant="outlined"
                        defaultValue="I'm passionate about helping individuals unlock their potential and create meaningful, fulfilling lives. With over 5 years of experience in personal development coaching, I specialize in mindfulness-based approaches to goal achievement and life transformation."
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
                        Application Preferences
                      </Typography>

                      <Grid container spacing={{ xs: 3, sm: 4 }}>
                        <Grid item xs={12} sm={6} md={6}>
                          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                            Session Defaults
                          </Typography>
                          <Stack spacing={3}>
                            <TextField
                              select
                              fullWidth
                              label="Default Session Duration"
                              defaultValue="60"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            >
                              <MenuItem value="30">30 minutes</MenuItem>
                              <MenuItem value="45">45 minutes</MenuItem>
                              <MenuItem value="60">60 minutes</MenuItem>
                              <MenuItem value="90">90 minutes</MenuItem>
                            </TextField>
                            
                            <TextField
                              select
                              fullWidth
                              label="Default Meeting Type"
                              defaultValue="online"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            >
                              <MenuItem value="online">🌐 Online Session</MenuItem>
                              <MenuItem value="in-person">🏢 In-Person Meeting</MenuItem>
                              <MenuItem value="hybrid">🔄 Hybrid (Client Choice)</MenuItem>
                            </TextField>
                            
                            <FormControlLabel
                              control={<Switch defaultChecked />}
                              label="Auto-generate session summaries"
                              sx={{ 
                                '& .MuiFormControlLabel-label': { 
                                  fontSize: '1rem',
                                  fontWeight: 500
                                }
                              }}
                            />
                            <FormControlLabel
                              control={<Switch defaultChecked />}
                              label="Send session reminders 24h before"
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
                            Interface Options
                          </Typography>
                          <Stack spacing={3}>
                            <TextField
                              select
                              fullWidth
                              label="Dashboard View"
                              defaultValue="cards"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: alpha(theme.palette.background.paper, 0.5)
                                }
                              }}
                            >
                              <MenuItem value="cards">📋 Card View</MenuItem>
                              <MenuItem value="list">📝 List View</MenuItem>
                              <MenuItem value="calendar">📅 Calendar View</MenuItem>
                            </TextField>
                            
                            <FormControlLabel
                              control={<Switch defaultChecked />}
                              label="Show motivational quotes"
                              sx={{ 
                                '& .MuiFormControlLabel-label': { 
                                  fontSize: '1rem',
                                  fontWeight: 500
                                }
                              }}
                            />
                            <FormControlLabel
                              control={<Switch />}
                              label="Enable celebration animations"
                              sx={{ 
                                '& .MuiFormControlLabel-label': { 
                                  fontSize: '1rem',
                                  fontWeight: 500
                                }
                              }}
                            />
                            <FormControlLabel
                              control={<Switch defaultChecked />}
                              label="Compact navigation menu"
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
                {tab === 5 && (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    color: 'text.secondary'
                  }}>
                    <SparkleIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      Privacy & Security Settings Coming Soon! 🔒
                    </Typography>
                    <Typography variant="body1">
                      We're preparing advanced privacy controls for your coaching practice!
                    </Typography>
                  </Box>
                )}
              </Box>
            </Fade>
            
            {/* Save Button */}
            <Box sx={{ mt: 6, pt: 4, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button 
                  variant="contained" 
                  size="large"
                  disabled={isLoading}
                  onClick={handleSaveSettings}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
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
                  mt: 3,
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontSize: '1rem'
                  }
                }}
              >
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
    </WellnessLayout>
  );
};

export default SettingsPage;
