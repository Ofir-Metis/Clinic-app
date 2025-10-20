import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  Stack,
  Box,
  Collapse,
  Typography,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Refresh as RetryIcon,
  Support as SupportIcon,
  Login as LoginIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { ApiError } from '../utils/errorMessages';

interface ErrorAlertProps {
  error: ApiError;
  onRetry?: () => void;
  onClose?: () => void;
  showDetails?: boolean;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onRetry,
  onClose,
  showDetails = false,
  className
}) => {
  const [showDetailsExpanded, setShowDetailsExpanded] = React.useState(false);
  const theme = useTheme();

  const handleAction = () => {
    switch (error.action) {
      case 'retry':
        onRetry?.();
        break;
      case 'contact_support':
        // Open support contact (could be email, chat, etc.)
        window.open('mailto:support@clinic-app.com?subject=Error Report&body=' + encodeURIComponent(
          `Error Code: ${error.code}\nMessage: ${error.message}\nDetails: ${error.details || 'None'}`
        ));
        break;
      case 'login_required':
        // This is typically handled automatically by the error handler
        window.location.href = '/login';
        break;
      default:
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAction();
    }
  };

  const getActionButton = () => {
    switch (error.action) {
      case 'retry':
        return (
          <Button
            size="small"
            startIcon={<RetryIcon />}
            onClick={handleAction}
            onKeyDown={handleKeyDown}
            variant="outlined"
            color={error.severity as any}
            sx={{
              '&:focus': {
                outline: `2px solid ${theme.palette[error.severity as 'error' | 'warning' | 'info'].main}`,
                outlineOffset: '2px',
              }
            }}
          >
            Try Again
          </Button>
        );
      case 'contact_support':
        return (
          <Button
            size="small"
            startIcon={<SupportIcon />}
            onClick={handleAction}
            onKeyDown={handleKeyDown}
            variant="outlined"
            color={error.severity as any}
            sx={{
              '&:focus': {
                outline: `2px solid ${theme.palette[error.severity as 'error' | 'warning' | 'info'].main}`,
                outlineOffset: '2px',
              }
            }}
          >
            Contact Support
          </Button>
        );
      case 'login_required':
        return (
          <Button
            size="small"
            startIcon={<LoginIcon />}
            onClick={handleAction}
            onKeyDown={handleKeyDown}
            variant="outlined"
            color={error.severity as any}
            sx={{
              '&:focus': {
                outline: `2px solid ${theme.palette[error.severity as 'error' | 'warning' | 'info'].main}`,
                outlineOffset: '2px',
              }
            }}
          >
            Login
          </Button>
        );
      default:
        return null;
    }
  };

  const copyErrorDetails = () => {
    const errorText = `Error Code: ${error.code}\nMessage: ${error.message}\nDetails: ${error.details || 'None'}`;
    navigator.clipboard.writeText(errorText);
  };

  return (
    <Alert
      severity={error.severity}
      onClose={onClose}
      className={className}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={0}
      sx={{
        '& .MuiAlert-message': {
          width: '100%'
        },
        '&:focus': {
          outline: `2px solid ${theme.palette[error.severity as 'error' | 'warning' | 'info'].main}`,
          outlineOffset: '2px',
        },
        // Enhanced error styling for prominence
        ...(error.severity === 'error' && {
          border: '2px solid',
          borderColor: 'error.main',
          backgroundColor: 'error.light',
          boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)',
          '& .MuiAlert-icon': {
            fontSize: '1.5rem'
          },
          '& .MuiAlertTitle-root': {
            fontWeight: 700,
            fontSize: '1.1rem'
          }
        }),
        // Enhanced warning styling
        ...(error.severity === 'warning' && {
          border: '2px solid',
          borderColor: 'warning.main',
          backgroundColor: 'warning.light',
          boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
          '& .MuiAlert-icon': {
            fontSize: '1.3rem'
          }
        })
      }}
    >
      <AlertTitle sx={{ fontWeight: 600 }}>
        {error.severity === 'error' ? 'Something went wrong' : 
         error.severity === 'warning' ? 'Attention needed' : 'Information'}
      </AlertTitle>
      
      <Typography variant="body2" sx={{ mb: error.action !== 'none' ? 2 : 0 }}>
        {error.userMessage}
      </Typography>

      {(error.action !== 'none' || showDetails) && (
        <Stack direction="row" spacing={1} alignItems="center">
          {error.action !== 'none' && getActionButton()}
          
          {showDetails && (error.details || process.env.NODE_ENV === 'development') && (
            <Button
              size="small"
              startIcon={showDetailsExpanded ? <CollapseIcon /> : <ExpandIcon />}
              onClick={() => setShowDetailsExpanded(!showDetailsExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowDetailsExpanded(!showDetailsExpanded);
                }
              }}
              variant="text"
              color="inherit"
              sx={{
                minWidth: 'auto',
                '&:focus': {
                  outline: `2px solid ${theme.palette[error.severity as 'error' | 'warning' | 'info'].main}`,
                  outlineOffset: '2px',
                }
              }}
              aria-expanded={showDetailsExpanded}
              aria-controls="error-details"
            >
              Details
            </Button>
          )}
        </Stack>
      )}

      {showDetails && showDetailsExpanded && (
        <Collapse in={showDetailsExpanded}>
          <Box
            id="error-details"
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: 1,
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Technical Details
              </Typography>
              <IconButton
                size="small"
                onClick={copyErrorDetails}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    copyErrorDetails();
                  }
                }}
                title="Copy error details"
                aria-label="Copy error details to clipboard"
                sx={{
                  '&:focus': {
                    outline: `2px solid ${theme.palette[error.severity as 'error' | 'warning' | 'info'].main}`,
                    outlineOffset: '2px',
                  }
                }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>
            </Stack>
            
            <Typography variant="caption" component="div" color="text.secondary">
              <strong>Code:</strong> {error.code}
            </Typography>
            <Typography variant="caption" component="div" color="text.secondary">
              <strong>Message:</strong> {error.message}
            </Typography>
            {error.details && (
              <Typography variant="caption" component="div" color="text.secondary">
                <strong>Details:</strong> {error.details}
              </Typography>
            )}
            
            {process.env.NODE_ENV === 'development' && (
              <Typography variant="caption" component="div" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                Note: Technical details are visible in development mode only.
              </Typography>
            )}
          </Box>
        </Collapse>
      )}
    </Alert>
  );
};

export default ErrorAlert;