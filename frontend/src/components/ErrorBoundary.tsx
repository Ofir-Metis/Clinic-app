import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleRefresh = () => {
    // Reset error state and reload
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Optionally reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            p: 4
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 500,
              width: '100%'
            }}
          >
            <ErrorOutline 
              color="error" 
              sx={{ fontSize: 64, mb: 2 }} 
            />
            
            <Typography variant="h5" color="error" gutterBottom>
              Oops! Something went wrong
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleRefresh}
              sx={{ mr: 2 }}
            >
              Try Again
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </Button>
            
            {this.state.error && (
              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" color="error">
                  Error Details (Development Mode):
                </Typography>
                <Typography variant="caption" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap',
                  backgroundColor: '#f5f5f5',
                  p: 2,
                  borderRadius: 1,
                  mt: 1,
                  fontSize: '0.75rem'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;