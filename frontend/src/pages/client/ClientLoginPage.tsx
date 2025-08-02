/**
 * ClientLoginPage - Authentication for coaching clients
 * Separate login flow for clients accessing their personal development portal
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
  Fade
} from '@mui/material';
import {
  Psychology as MindIcon,
  AutoAwesome as SparkleIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as RegisterIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';

interface LoginFormData {
  email: string;
  password: string;
}

const ClientLoginPage: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof LoginFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      // Mock API call - replace with actual client auth service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful login
      localStorage.setItem('clientToken', 'mock-client-token');
      localStorage.setItem('clientUser', JSON.stringify({
        id: '1',
        name: 'Sarah Johnson',
        email: formData.email,
        coachName: 'Dr. Emily Chen'
      }));
      
      navigate('/client/dashboard');
    } catch (err) {
      setError('Invalid email or password. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

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
          maxWidth: 450,
          width: '100%',
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(46, 125, 107, 0.15)'
        }}
      >
        <CardContent sx={{ p: 6 }}>
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
              Welcome Back! 🌟
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              Access Your Personal Growth Journey
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Continue your transformation with your dedicated coach
            </Typography>
          </Box>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="your.email@example.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: alpha(theme.palette.background.paper, 0.7),
                    '&:hover': {
                      background: alpha(theme.palette.background.paper, 0.9)
                    },
                    '&.Mui-focused': {
                      background: alpha(theme.palette.background.paper, 1)
                    }
                  }
                }}
              />
              
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder="Enter your password"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    background: alpha(theme.palette.background.paper, 0.7),
                    '&:hover': {
                      background: alpha(theme.palette.background.paper, 0.9)
                    },
                    '&.Mui-focused': {
                      background: alpha(theme.palette.background.paper, 1)
                    }
                  }
                }}
              />

              {error && (
                <Fade in>
                  <Alert
                    severity="error"
                    sx={{
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

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!isFormValid || isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                sx={{
                  py: 2,
                  borderRadius: 3,
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`
                  },
                  '&:disabled': {
                    background: alpha(theme.palette.grey[400], 0.5)
                  }
                }}
              >
                {isLoading ? 'Signing In...' : 'Start My Journey'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 4 }}>
            <Typography variant="body2" color="text.secondary">
              New to coaching?
            </Typography>
          </Divider>

          {/* Registration Link */}
          <Button
            component={RouterLink}
            to="/client/register"
            variant="outlined"
            size="large"
            fullWidth
            startIcon={<RegisterIcon />}
            sx={{
              py: 2,
              borderRadius: 3,
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-1px)',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
              }
            }}
          >
            Begin Your Transformation
          </Button>

          {/* Footer Links */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Stack direction="row" spacing={2} justifyContent="center" divider={<Typography color="text.disabled">•</Typography>}>
              <Link
                component={RouterLink}
                to="/client/forgot-password"
                variant="body2"
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Forgot Password?
              </Link>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Coach Login
              </Link>
            </Stack>
          </Box>

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
              "Every expert was once a beginner."
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Your journey of growth starts here ✨
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClientLoginPage;