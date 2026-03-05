/**
 * ClientRegisterPage - Registration for new coaching clients
 * Onboarding flow for clients joining their personal development journey
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Stack,
  Divider,
  Avatar,
  CircularProgress,
  useTheme,
  alpha,
  Fade,
  FormControlLabel,
  Checkbox,
  Step,
  Stepper,
  StepLabel,
  MenuItem
} from '@mui/material';
import {
  Psychology as MindIcon,
  AutoAwesome as SparkleIcon,
  PersonAdd as RegisterIcon,
  Login as LoginIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import { register as authRegister, login as authLogin } from '../../api/auth';
import { useAuth, User } from '../../contexts/AuthContext';

// Type for the register translations
interface RegisterTranslations {
  title?: string;
  subtitle?: string;
  steps?: string[];
  creatingAccount?: string;
  beginTransformation?: string;
  next?: string;
  back?: string;
  signInInstead?: string;
  alreadyHaveAccount?: string;
  quote?: string;
  quoteSubtitle?: string;
  fields?: Record<string, string>;
  goals?: Record<string, string>;
  coachingStyle?: Record<string, string>;
  sessionPreference?: Record<string, string>;
  terms?: Record<string, string>;
  errors?: Record<string, string>;
  placeholders?: Record<string, string>;
}

interface RegistrationFormData {
  // Step 1: Basic Info
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Step 2: Personal Info
  phone: string;
  dateOfBirth: string;
  coachCode: string;
  
  // Step 3: Goals & Preferences
  primaryGoals: string[];
  coachingStyle: string;
  sessionPreference: string;
  agreedToTerms: boolean;
}

const COACHING_GOALS = [
  'Career Advancement',
  'Personal Relationships',
  'Health & Wellness',
  'Financial Goals',
  'Self-Confidence',
  'Life Purpose',
  'Stress Management',
  'Communication Skills'
];

const COACHING_STYLES = [
  { value: 'structured', label: '📋 Structured & Goal-Oriented' },
  { value: 'flexible', label: '🌊 Flexible & Adaptive' },
  { value: 'supportive', label: '🤗 Supportive & Nurturing' },
  { value: 'challenging', label: '💪 Direct & Challenging' }
];

const SESSION_PREFERENCES = [
  { value: 'weekly', label: '📅 Weekly Sessions' },
  { value: 'biweekly', label: '📆 Bi-weekly Sessions' },
  { value: 'monthly', label: '🗓️ Monthly Check-ins' },
  { value: 'flexible', label: '⏰ Flexible Scheduling' }
];

const ClientRegisterPage: React.FC = () => {
  const theme = useTheme();
  const { translations } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Get translations with proper typing
  const clientPortal = translations.clientPortal as Record<string, unknown> | undefined;
  const rt = clientPortal?.register as RegisterTranslations | undefined;

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    coachCode: '',
    primaryGoals: [],
    coachingStyle: '',
    sessionPreference: '',
    agreedToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const steps = rt?.steps || ['Basic Information', 'Personal Details', 'Your Journey'];

  const handleInputChange = (field: keyof RegistrationFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError(null);
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      primaryGoals: prev.primaryGoals.includes(goal)
        ? prev.primaryGoals.filter(g => g !== goal)
        : [...prev.primaryGoals, goal]
    }));
  };

  const validateCurrentStep = () => {
    const errors: {[key: string]: string} = {};
    const errT = rt?.errors;

    if (activeStep === 0) {
      if (!formData.firstName.trim()) errors.firstName = errT?.firstNameRequired || 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = errT?.lastNameRequired || 'Last name is required';
      if (!validateEmail(formData.email)) errors.email = errT?.emailInvalid || 'Please enter a valid email address';
      if (!validatePassword(formData.password)) errors.password = errT?.passwordRequirements || 'Password must be at least 8 characters with letters and numbers';
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = errT?.passwordsMismatch || 'Passwords do not match';
    } else if (activeStep === 1) {
      if (!validatePhone(formData.phone)) errors.phone = errT?.phoneInvalid || 'Please enter a valid phone number';
      if (!formData.dateOfBirth) errors.dateOfBirth = errT?.dobRequired || 'Date of birth is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep() && activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Final validation before submission
    if (!validateCurrentStep()) {
      return;
    }
    
    const errT = rt?.errors;

    if (formData.password !== formData.confirmPassword) {
      setError(errT?.passwordsMismatch || 'Passwords do not match');
      return;
    }

    if (!formData.agreedToTerms) {
      setError(errT?.agreeToTerms || 'Please agree to the terms and conditions');
      return;
    }

    if (formData.primaryGoals.length === 0) {
      setError(errT?.selectGoal || 'Please select at least one primary goal');
      return;
    }

    setIsLoading(true);

    try {
      // Call real registration API
      const registerResponse = await authRegister({
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`,
        role: 'client'
      });

      // After registration, log in to get tokens
      const loginResponse = await authLogin(formData.email, formData.password);

      // Build user data
      const userData: User = {
        id: loginResponse.user?.id?.toString() || registerResponse.id?.toString() || '0',
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        role: 'client',
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

      // Navigate to client onboarding
      navigate('/client/onboarding');
    } catch (err: any) {
      // Unwrap nested error messages from API gateway
      const msg = err?.response?.data?.message;
      let errorMessage = 'Registration failed. Please try again.';
      if (typeof msg === 'string') {
        errorMessage = msg;
      } else if (typeof msg === 'object' && msg !== null) {
        const inner = msg?.message;
        errorMessage = typeof inner === 'string' ? inner
          : typeof inner === 'object' && inner !== null && typeof inner.message === 'string' ? inner.message
          : err?.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced validation logic
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  };

  const validatePhone = (phone: string) => {
    // Strip all non-digit characters except leading +
    const digits = phone.replace(/[^\d]/g, '');
    // Valid phone: 7-15 digits (ITU-T E.164 standard)
    return digits.length >= 7 && digits.length <= 15;
  };

  const isStep1Valid = formData.firstName.trim() && 
                     formData.lastName.trim() && 
                     validateEmail(formData.email) && 
                     validatePassword(formData.password) && 
                     formData.confirmPassword && 
                     formData.password === formData.confirmPassword;
                     
  const isStep2Valid = validatePhone(formData.phone) && formData.dateOfBirth;
  const isStep3Valid = formData.primaryGoals.length > 0 && formData.coachingStyle && formData.sessionPreference && formData.agreedToTerms;

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label={rt?.fields?.firstName || "First Name"}
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                placeholder={rt?.placeholders?.firstName || "Sarah"}
                autoComplete="given-name"
                error={Boolean(fieldErrors.firstName)}
                helperText={fieldErrors.firstName}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <TextField
                fullWidth
                label={rt?.fields?.lastName || "Last Name"}
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                placeholder={rt?.placeholders?.lastName || "Johnson"}
                autoComplete="family-name"
                error={Boolean(fieldErrors.lastName)}
                helperText={fieldErrors.lastName}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Box>
            
            <TextField
              fullWidth
              label={rt?.fields?.email || "Email Address"}
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder={rt?.placeholders?.email || "sarah.johnson@example.com"}
              autoComplete="email"
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              fullWidth
              label={rt?.fields?.password || "Password"}
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder={rt?.placeholders?.password || "Choose a strong password"}
              autoComplete="new-password"
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              fullWidth
              label={rt?.fields?.confirmPassword || "Confirm Password"}
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              placeholder={rt?.placeholders?.confirmPassword || "Confirm your password"}
              autoComplete="new-password"
              error={Boolean(fieldErrors.confirmPassword)}
              helperText={fieldErrors.confirmPassword}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <TextField
              fullWidth
              label={rt?.fields?.phone || "Phone Number"}
              value={formData.phone}
              onChange={handleInputChange('phone')}
              placeholder={rt?.placeholders?.phone || "+1 (555) 123-4567"}
              autoComplete="tel"
              error={Boolean(fieldErrors.phone)}
              helperText={fieldErrors.phone}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              fullWidth
              label={rt?.fields?.dateOfBirth || "Date of Birth"}
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange('dateOfBirth')}
              InputLabelProps={{ shrink: true }}
              autoComplete="bday"
              error={Boolean(fieldErrors.dateOfBirth)}
              helperText={fieldErrors.dateOfBirth}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              fullWidth
              label={rt?.fields?.coachCode || "Coach Code (Optional)"}
              value={formData.coachCode}
              onChange={handleInputChange('coachCode')}
              placeholder={rt?.fields?.coachCodePlaceholder || "If you have a specific coach code"}
              helperText={rt?.fields?.coachCodeHelper || "Enter your coach's referral code if provided"}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {rt?.goals?.title || "What are your primary goals? (Select all that apply)"}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {COACHING_GOALS.map((goal) => (
                  <Button
                    key={goal}
                    variant={formData.primaryGoals.includes(goal) ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => handleGoalToggle(goal)}
                    sx={{
                      borderRadius: 6,
                      textTransform: 'none',
                      '&.MuiButton-contained': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                      }
                    }}
                  >
                    {goal}
                  </Button>
                ))}
              </Box>
            </Box>
            
            <TextField
              select
              fullWidth
              label={rt?.coachingStyle?.label || "Preferred Coaching Style"}
              value={formData.coachingStyle}
              onChange={handleInputChange('coachingStyle')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            >
              {COACHING_STYLES.map((style) => (
                <MenuItem key={style.value} value={style.value}>
                  {(rt?.coachingStyle as Record<string, string>)?.[style.value] || style.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label={rt?.sessionPreference?.label || "Session Preference"}
              value={formData.sessionPreference}
              onChange={handleInputChange('sessionPreference')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            >
              {SESSION_PREFERENCES.map((pref) => (
                <MenuItem key={pref.value} value={pref.value}>
                  {(rt?.sessionPreference as Record<string, string>)?.[pref.value] || pref.label}
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.agreedToTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                />
              }
              label={
                <Typography variant="body2">
                  {rt?.terms?.agree || "I agree to the"}{' '}
                  <Link href="#" sx={{ textDecoration: 'none' }}>
                    {rt?.terms?.termsOfService || "Terms of Service"}
                  </Link>
                  {' '}{rt?.terms?.and || "and"}{' '}
                  <Link href="#" sx={{ textDecoration: 'none' }}>
                    {rt?.terms?.privacyPolicy || "Privacy Policy"}
                  </Link>
                </Typography>
              }
            />
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 50%, ${theme.palette.background.default} 100%)`,
        p: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: '100%',
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(46, 125, 107, 0.15)'
        }}
      >
        <CardContent sx={{ p: 6 }}>
          <LoadingOverlay
            loading={isLoading}
            message={rt?.creatingAccount || "Creating your account..."}
            variant="overlay"
            backdrop
          >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                fontSize: '2rem'
              }}
            >
              <MindIcon sx={{ fontSize: '2.5rem' }} />
            </Avatar>
            
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {rt?.title || 'Start Your Journey! 🚀'}
            </Typography>

            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              {rt?.subtitle || 'Join thousands transforming their lives'}
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Form Content */}
          <Box component="form" onSubmit={handleSubmit}>
            {getStepContent(activeStep)}

            {error && (
              <Fade in>
                <Alert
                  severity="error"
                  sx={{
                    mt: 3,
                    borderRadius: 3,
                    '& .MuiAlert-message': {
                      fontSize: '0.95rem'
                    }
                  }}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<BackIcon />}
                sx={{ borderRadius: 3 }}
              >
                {rt?.back || 'Back'}
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isStep3Valid || isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <RegisterIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`
                    }
                  }}
                >
                  {isLoading ? (rt?.creatingAccount || 'Creating Account...') : (rt?.beginTransformation || 'Begin Transformation')}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  disabled={
                    (activeStep === 0 && !isStep1Valid) ||
                    (activeStep === 1 && !isStep2Valid)
                  }
                  endIcon={<NextIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 600
                  }}
                >
                  {rt?.next || 'Next'}
                </Button>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {rt?.alreadyHaveAccount || 'Already have an account?'}
            </Typography>
          </Divider>

          {/* Login Link */}
          <Button
            component={RouterLink}
            to="/client/login"
            variant="outlined"
            size="large"
            fullWidth
            startIcon={<LoginIcon />}
            sx={{
              py: 2,
              borderRadius: 3,
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-1px)'
              }
            }}
          >
            {rt?.signInInstead || 'Sign In Instead'}
          </Button>

          {/* Motivational Footer */}
          <Box
            sx={{
              mt: 4,
              p: 3,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.1)} 100%)`,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
            }}
          >
            <SparkleIcon sx={{ fontSize: 32, color: theme.palette.success.main, mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              {rt?.quote || '"The best time to plant a tree was 20 years ago. The second best time is now."'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {rt?.quoteSubtitle || 'Your transformation begins with a single step 🌱'}
            </Typography>
          </Box>
          </LoadingOverlay>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClientRegisterPage;