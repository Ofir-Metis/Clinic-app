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
  const { t } = useTranslation();
  const navigate = useNavigate();
  
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

  const steps = ['Basic Information', 'Personal Details', 'Your Journey'];

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
    
    if (activeStep === 0) {
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
      if (!validateEmail(formData.email)) errors.email = 'Please enter a valid email address';
      if (!validatePassword(formData.password)) errors.password = 'Password must be at least 8 characters with letters and numbers';
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    } else if (activeStep === 1) {
      if (!validatePhone(formData.phone)) errors.phone = 'Please enter a valid phone number';
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
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
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }
    
    if (formData.primaryGoals.length === 0) {
      setError('Please select at least one primary goal');
      return;
    }

    setIsLoading(true);
    
    try {
      // Mock API call - replace with actual client registration service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful registration
      localStorage.setItem('clientToken', 'mock-client-token');
      localStorage.setItem('clientUser', JSON.stringify({
        id: '1',
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        goals: formData.primaryGoals,
        coachingStyle: formData.coachingStyle
      }));
      
      navigate('/client/onboarding');
    } catch (err) {
      setError('Registration failed. Please try again.');
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
    const phoneRegex = /^[\+]?[1-9][\d]{0,3}[-\s]?[\(]?[0-9]{1,4}[\)]?[-\s]?[0-9]{1,4}[-\s]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
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
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                placeholder="Sarah"
                autoComplete="given-name"
                error={Boolean(fieldErrors.firstName)}
                helperText={fieldErrors.firstName}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                placeholder="Johnson"
                autoComplete="family-name"
                error={Boolean(fieldErrors.lastName)}
                helperText={fieldErrors.lastName}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Box>
            
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="sarah.johnson@example.com"
              autoComplete="email"
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              placeholder="Choose a strong password"
              autoComplete="new-password"
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            
            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              placeholder="Confirm your password"
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
              label="Phone Number"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              placeholder="+1 (555) 123-4567"
              autoComplete="tel"
              error={Boolean(fieldErrors.phone)}
              helperText={fieldErrors.phone}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            
            <TextField
              fullWidth
              label="Date of Birth"
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
              label="Coach Code (Optional)"
              value={formData.coachCode}
              onChange={handleInputChange('coachCode')}
              placeholder="If you have a specific coach code"
              helperText="Enter your coach's referral code if provided"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                What are your primary goals? (Select all that apply)
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
              label="Preferred Coaching Style"
              value={formData.coachingStyle}
              onChange={handleInputChange('coachingStyle')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            >
              {COACHING_STYLES.map((style) => (
                <MenuItem key={style.value} value={style.value}>
                  {style.label}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              select
              fullWidth
              label="Session Preference"
              value={formData.sessionPreference}
              onChange={handleInputChange('sessionPreference')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            >
              {SESSION_PREFERENCES.map((pref) => (
                <MenuItem key={pref.value} value={pref.value}>
                  {pref.label}
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
                  I agree to the{' '}
                  <Link href="#" sx={{ textDecoration: 'none' }}>
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="#" sx={{ textDecoration: 'none' }}>
                    Privacy Policy
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
            message="Creating your account..."
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
              Start Your Journey! 🚀
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Join thousands transforming their lives
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
                Back
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
                  {isLoading ? 'Creating Account...' : 'Begin Transformation'}
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
                  Next
                </Button>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?
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
            Sign In Instead
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
              "The best time to plant a tree was 20 years ago. The second best time is now."
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Your transformation begins with a single step 🌱
            </Typography>
          </Box>
          </LoadingOverlay>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClientRegisterPage;