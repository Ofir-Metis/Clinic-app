import { createTheme } from '@mui/material';

// Wellness-focused color palette for mental health professionals
const wellnessColors = {
  // Primary colors - calming and professional
  primary: '#2E7D6B', // Deep teal - trust, healing, balance
  primaryLight: '#4A9B8A',
  primaryDark: '#1F5A4E',
  
  // Secondary colors - warmth and growth
  secondary: '#8B5A87', // Muted purple - wisdom, transformation
  secondaryLight: '#A47BA0',
  secondaryDark: '#6B446A',
  
  // Accent colors
  accent: '#F4A261', // Warm orange - optimism, energy
  accentLight: '#F6B685',
  accentDark: '#E8934A',
  
  // Wellness backgrounds
  wellnessLight: '#F0F8F4', // Very light mint
  wellnessUltraLight: '#FAFCFB',
  
  // Glass effects
  glassLight: 'rgba(255, 255, 255, 0.85)',
  glassMedium: 'rgba(255, 255, 255, 0.70)',
  glassDark: 'rgba(255, 255, 255, 0.60)',
  
  // Gradients
  primaryGradient: 'linear-gradient(135deg, #F0F8F4 0%, #E6F3F0 25%, #D4E9E2 100%)',
  warmGradient: 'linear-gradient(135deg, #FFF8F0 0%, #F4F1E8 50%, #E8F0E6 100%)',
};

export const theme = createTheme({
  palette: {
    primary: { 
      main: wellnessColors.primary,
      light: wellnessColors.primaryLight,
      dark: wellnessColors.primaryDark,
    },
    secondary: { 
      main: wellnessColors.secondary,
      light: wellnessColors.secondaryLight,
      dark: wellnessColors.secondaryDark,
    },
    background: { 
      default: wellnessColors.wellnessLight,
      paper: wellnessColors.glassLight,
    },
    text: {
      primary: '#2C3E50', // Darker, more readable
      secondary: '#5D6D7E',
    },
    success: { main: '#27AE60' }, // Growth green
    warning: { main: wellnessColors.accent },
    info: { main: '#3498DB' }, // Calming blue
  },
  
  typography: { 
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem', lineHeight: 1.2 },
    h2: { fontWeight: 600, fontSize: '2rem', lineHeight: 1.3 },
    h3: { fontWeight: 600, fontSize: '1.75rem', lineHeight: 1.3 },
    h4: { fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.4 },
    h5: { fontWeight: 500, fontSize: '1.25rem', lineHeight: 1.4 },
    h6: { fontWeight: 500, fontSize: '1.125rem', lineHeight: 1.4 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'none' as const },
  },
  
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },
  
  spacing: 8, // Base spacing unit
  
  shape: {
    borderRadius: 16,
  },
  
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: wellnessColors.primaryGradient,
          minHeight: '100vh',
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
      },
    },
    
    MuiPaper: { 
      styleOverrides: { 
        root: { 
          backdropFilter: 'blur(20px)',
          background: wellnessColors.glassLight,
          border: `1px solid rgba(255, 255, 255, 0.25)`,
          borderRadius: 16,
        } 
      } 
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)',
          background: wellnessColors.glassLight,
          border: `1px solid rgba(255, 255, 255, 0.25)`,
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 16px 48px rgba(46, 125, 107, 0.12), 0 8px 24px rgba(46, 125, 107, 0.06)',
          },
        },
      },
    },
    
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 600,
          padding: '10px 24px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(46, 125, 107, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${wellnessColors.primary} 0%, ${wellnessColors.primaryDark} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${wellnessColors.primaryDark} 0%, ${wellnessColors.primary} 100%)`,
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            background: 'rgba(46, 125, 107, 0.04)',
          },
        },
      },
    },
    
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            background: wellnessColors.glassMedium,
            backdropFilter: 'blur(16px)',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: wellnessColors.glassLight,
            },
            '&.Mui-focused': {
              background: wellnessColors.glassLight,
              boxShadow: `0 0 0 3px rgba(46, 125, 107, 0.1)`,
            },
            '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
              WebkitBoxShadow: '0 0 0 100px rgba(46, 125, 107, 0.06) inset',
              WebkitTextFillColor: '#1a1a1a',
              caretColor: '#1a1a1a',
              borderRadius: 'inherit',
            },
          },
        },
      },
    },
    
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: wellnessColors.glassLight,
          backdropFilter: 'blur(24px)',
          borderRadius: '0 24px 24px 0',
          border: `1px solid rgba(255, 255, 255, 0.25)`,
          borderLeft: 'none',
        },
      },
    },
    
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          background: wellnessColors.glassLight,
          backdropFilter: 'blur(24px)',
          borderRadius: '24px 24px 0 0',
          border: `1px solid rgba(255, 255, 255, 0.25)`,
          borderBottom: 'none',
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 60,
            '&.Mui-selected': {
              color: wellnessColors.primary,
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 600,
              },
            },
          },
        },
      },
    },
    
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 12px 32px rgba(46, 125, 107, 0.2), 0 4px 16px rgba(46, 125, 107, 0.1)',
          background: `linear-gradient(135deg, ${wellnessColors.primary} 0%, ${wellnessColors.primaryLight} 100%)`,
          '&:hover': {
            boxShadow: '0 16px 40px rgba(46, 125, 107, 0.25), 0 8px 24px rgba(46, 125, 107, 0.15)',
            transform: 'scale(1.05)',
          },
        },
      },
    },
    
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: wellnessColors.glassLight,
          backdropFilter: 'blur(24px)',
          borderBottom: `1px solid rgba(255, 255, 255, 0.25)`,
          boxShadow: '0 4px 16px rgba(46, 125, 107, 0.04)',
        },
      },
    },
    
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          transition: 'all 0.2s ease',
          '&:hover': {
            background: 'rgba(46, 125, 107, 0.06)',
            transform: 'translateX(4px)',
          },
          '&.Mui-selected': {
            background: `linear-gradient(90deg, rgba(46, 125, 107, 0.12) 0%, rgba(46, 125, 107, 0.06) 100%)`,
            borderLeft: `3px solid ${wellnessColors.primary}`,
            '&:hover': {
              background: `linear-gradient(90deg, rgba(46, 125, 107, 0.16) 0%, rgba(46, 125, 107, 0.08) 100%)`,
            },
          },
        },
      },
    },
  },
});
