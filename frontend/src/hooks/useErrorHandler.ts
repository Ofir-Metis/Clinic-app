import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ApiError, 
  getApiErrorMessage, 
  getAuthErrorMessage, 
  getClientErrorMessage, 
  getAppointmentErrorMessage 
} from '../utils/errorMessages';

export type ErrorContext = 'auth' | 'client' | 'appointment' | 'general';

interface UseErrorHandlerReturn {
  error: ApiError | null;
  isError: boolean;
  handleError: (error: unknown, context?: ErrorContext) => void;
  clearError: () => void;
  retryAction?: () => void;
  setRetryAction: (action: () => void) => void;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<ApiError | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | undefined>(undefined);
  const navigate = useNavigate();

  const handleError = useCallback((error: unknown, context: ErrorContext = 'general') => {
    let apiError: ApiError;

    // Get context-specific error message
    switch (context) {
      case 'auth':
        apiError = getAuthErrorMessage(error);
        break;
      case 'client':
        apiError = getClientErrorMessage(error);
        break;
      case 'appointment':
        apiError = getAppointmentErrorMessage(error);
        break;
      default:
        apiError = getApiErrorMessage(error);
    }

    setError(apiError);

    // Handle automatic actions
    if (apiError.action === 'login_required') {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        navigate('/login', { 
          replace: true,
          state: { 
            message: 'Your session has expired. Please log in again.',
            severity: 'warning'
          }
        });
      }, 2000);
    }

    // Log error for debugging (in development) or monitoring (in production)
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 API Error Details');
      console.error('Context:', context);
      console.error('Original Error:', error);
      console.error('Processed Error:', apiError);
      console.groupEnd();
    } else {
      // In production, you might want to send this to a monitoring service
      // Example: Sentry.captureException(error, { extra: { apiError, context } });
    }
  }, [navigate]);

  const clearError = useCallback(() => {
    setError(null);
    setRetryAction(undefined);
  }, []);

  const setRetryActionCallback = useCallback((action: () => void) => {
    setRetryAction(() => action);
  }, []);

  return {
    error,
    isError: !!error,
    handleError,
    clearError,
    retryAction,
    setRetryAction: setRetryActionCallback
  };
};