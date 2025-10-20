import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Fade,
  Backdrop,
  useTheme,
  alpha
} from '@mui/material';

interface LoadingOverlayProps {
  loading: boolean;
  message?: string;
  backdrop?: boolean;
  children?: React.ReactNode;
  variant?: 'overlay' | 'inline' | 'backdrop';
  size?: 'small' | 'medium' | 'large';
  progress?: number; // Progress percentage (0-100)
  showProgress?: boolean;
  timeout?: number; // Auto-timeout in milliseconds
  onTimeout?: () => void;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  message = 'Loading...',
  backdrop = false,
  children,
  variant = 'overlay',
  size = 'medium',
  progress,
  showProgress = false,
  timeout,
  onTimeout
}) => {
  const theme = useTheme();

  // Auto-timeout functionality
  React.useEffect(() => {
    if (loading && timeout && onTimeout) {
      const timer = setTimeout(() => {
        onTimeout();
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [loading, timeout, onTimeout]);

  const getSpinnerSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 60;
      default: return 40;
    }
  };

  const LoadingContent = () => (
    <Box
      role="status"
      aria-live="polite"
      aria-label={showProgress && progress !== undefined ? `${message} ${progress}% complete` : message}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        minWidth: showProgress ? 280 : 'auto'
      }}
    >
      {showProgress && progress !== undefined ? (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={progress}
            size={getSpinnerSize()}
            thickness={4}
            sx={{
              color: theme.palette.primary.main,
              transition: 'all 0.3s ease',
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              {`${Math.round(progress)}%`}
            </Typography>
          </Box>
        </Box>
      ) : (
        <CircularProgress
          size={getSpinnerSize()}
          thickness={4}
          aria-hidden="true"
          sx={{
            color: theme.palette.primary.main,
            // Add pulsing animation for indeterminate progress
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(1)',
                opacity: 1,
              },
              '50%': {
                transform: 'scale(1.05)',
                opacity: 0.8,
              },
              '100%': {
                transform: 'scale(1)',
                opacity: 1,
              },
            },
          }}
        />
      )}

      {message && (
        <Typography
          variant={size === 'large' ? 'h6' : 'body2'}
          color="text.secondary"
          sx={{
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: 300
          }}
        >
          {message}
        </Typography>
      )}

      {showProgress && progress !== undefined && (
        <Box sx={{ width: '100%', maxWidth: 240, mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                transition: 'transform 0.3s ease',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );

  // Backdrop variant - full screen overlay
  if (variant === 'backdrop') {
    return (
      <Backdrop
        open={loading}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: alpha(theme.palette.common.black, 0.7),
          backdropFilter: 'blur(4px)',
        }}
      >
        <LoadingContent />
      </Backdrop>
    );
  }

  // Inline variant - simple loading indicator
  if (variant === 'inline') {
    return loading ? (
      <Fade in={loading}>
        <LoadingContent />
      </Fade>
    ) : (
      <>{children}</>
    );
  }

  // Overlay variant - positioned over existing content
  return (
    <Box sx={{ position: 'relative', minHeight: loading ? '200px' : 'auto' }}>
      {/* Content */}
      <Box sx={{ opacity: loading ? 0.3 : 1, transition: 'opacity 0.3s ease' }}>
        {children}
      </Box>
      
      {/* Loading overlay */}
      <Fade in={loading}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: backdrop 
              ? alpha(theme.palette.background.default, 0.8) 
              : 'transparent',
            backdropFilter: backdrop ? 'blur(2px)' : 'none',
            zIndex: 10,
            borderRadius: 'inherit'
          }}
        >
          <LoadingContent />
        </Box>
      </Fade>
    </Box>
  );
};

export default LoadingOverlay;