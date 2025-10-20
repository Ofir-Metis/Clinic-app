import React from 'react';
import {
  Button,
  ButtonProps,
  CircularProgress,
  Box,
  alpha,
  useTheme
} from '@mui/material';

interface LoadingButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  loading?: boolean;
  loadingText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  showLoadingIcon?: boolean;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  startIcon,
  endIcon,
  showLoadingIcon = true,
  disabled,
  ...props
}) => {
  const theme = useTheme();

  const getLoadingIcon = () => {
    if (!showLoadingIcon) return null;
    
    return (
      <CircularProgress 
        size={20} 
        color="inherit"
        sx={{
          color: props.variant === 'contained' 
            ? theme.palette.primary.contrastText 
            : theme.palette.primary.main
        }}
      />
    );
  };

  const getButtonContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showLoadingIcon && getLoadingIcon()}
          {loadingText || children}
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {startIcon}
        {children}
        {endIcon}
      </Box>
    );
  };

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      sx={{
        ...props.sx,
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:disabled': {
          background: loading ? undefined : alpha(theme.palette.action.disabled, 0.12),
        },
        // Add subtle animation when loading
        ...(loading && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(45deg, transparent, ${alpha(theme.palette.common.white, 0.1)}, transparent)`,
            animation: 'shimmer 1.5s ease-in-out infinite',
          }
        }),
        '@keyframes shimmer': {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      }}
    >
      {getButtonContent()}
    </Button>
  );
};

export default LoadingButton;