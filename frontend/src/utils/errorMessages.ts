import { AxiosError } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  userMessage: string;
  severity: 'error' | 'warning' | 'info';
  action?: 'retry' | 'contact_support' | 'login_required' | 'none';
}

export const getApiErrorMessage = (error: unknown): ApiError => {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;
    const code = error.code || 'UNKNOWN_ERROR';

    // Network errors
    if (!error.response) {
      if (code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          userMessage: 'Unable to connect to the server. Please check your internet connection and try again.',
          severity: 'error',
          action: 'retry'
        };
      }

      if (code === 'TIMEOUT' || error.message.includes('timeout')) {
        return {
          code: 'REQUEST_TIMEOUT',
          message: 'Request timed out',
          userMessage: 'The request is taking longer than expected. Please try again.',
          severity: 'warning',
          action: 'retry'
        };
      }
    }

    // HTTP status code based errors
    switch (status) {
      case 400:
        return {
          code: 'BAD_REQUEST',
          message: data?.message || 'Invalid request',
          details: data?.details,
          userMessage: data?.message || 'Please check your input and try again.',
          severity: 'error',
          action: 'none'
        };

      case 401:
        return {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          userMessage: 'Your session has expired. Please log in again.',
          severity: 'error',
          action: 'login_required'
        };

      case 403:
        return {
          code: 'FORBIDDEN',
          message: 'Access denied',
          userMessage: 'You don\'t have permission to access this resource.',
          severity: 'error',
          action: 'none'
        };

      case 404:
        return {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          userMessage: 'The requested resource could not be found.',
          severity: 'error',
          action: 'none'
        };

      case 409:
        return {
          code: 'CONFLICT',
          message: data?.message || 'Conflict occurred',
          userMessage: data?.message || 'A conflict occurred. The resource may already exist.',
          severity: 'warning',
          action: 'none'
        };

      case 429:
        return {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          userMessage: 'You\'ve made too many requests. Please wait a moment and try again.',
          severity: 'warning',
          action: 'retry'
        };

      case 500:
        return {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          userMessage: 'Something went wrong on our end. Our team has been notified.',
          severity: 'error',
          action: 'contact_support'
        };

      case 502:
      case 503:
      case 504:
        return {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service unavailable',
          userMessage: 'Our services are temporarily unavailable. Please try again in a few minutes.',
          severity: 'error',
          action: 'retry'
        };

      default:
        return {
          code: 'HTTP_ERROR',
          message: `HTTP ${status}: ${data?.message || error.message}`,
          userMessage: 'An unexpected error occurred. Please try again.',
          severity: 'error',
          action: 'retry'
        };
    }
  }

  // Handle generic JavaScript errors
  if (error instanceof Error) {
    return {
      code: 'JAVASCRIPT_ERROR',
      message: error.message,
      userMessage: 'An unexpected error occurred. Please refresh the page and try again.',
      severity: 'error',
      action: 'retry'
    };
  }

  // Handle unknown errors
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error occurred',
    userMessage: 'Something unexpected happened. Please try again or contact support if the problem persists.',
    severity: 'error',
    action: 'contact_support'
  };
};

// Domain-specific error messages
export const getAuthErrorMessage = (error: unknown): ApiError => {
  const baseError = getApiErrorMessage(error);
  
  // Override with auth-specific messages
  if (baseError.code === 'BAD_REQUEST') {
    if (baseError.message.toLowerCase().includes('password')) {
      return {
        ...baseError,
        userMessage: 'Invalid email or password. Please check your credentials and try again.'
      };
    }
    if (baseError.message.toLowerCase().includes('email')) {
      return {
        ...baseError,
        userMessage: 'Please enter a valid email address.'
      };
    }
  }

  if (baseError.code === 'UNAUTHORIZED') {
    return {
      ...baseError,
      userMessage: 'Invalid credentials. Please check your email and password.'
    };
  }

  if (baseError.code === 'CONFLICT') {
    return {
      ...baseError,
      userMessage: 'An account with this email address already exists. Please try logging in instead.'
    };
  }

  // Handle server errors that might be related to duplicate emails during registration
  if (baseError.code === 'INTERNAL_SERVER_ERROR') {
    // Check if the error response contains clues about duplicate email
    const errorText = baseError.message?.toLowerCase() || '';
    const detailsText = baseError.details?.toLowerCase() || '';
    
    if (errorText.includes('email') && (errorText.includes('exists') || errorText.includes('duplicate') || errorText.includes('unique'))) {
      return {
        ...baseError,
        userMessage: 'An account with this email address already exists. Please try logging in instead.',
        severity: 'warning',
        action: 'none'
      };
    }
    
    // For registration-related server errors, provide a more helpful message
    return {
      ...baseError,
      userMessage: 'Unable to complete registration. This email address may already be in use. Please try a different email or contact support.',
      severity: 'warning',
      action: 'none'
    };
  }

  return baseError;
};

export const getClientErrorMessage = (error: unknown): ApiError => {
  const baseError = getApiErrorMessage(error);
  
  // Override with client-specific messages
  if (baseError.code === 'NOT_FOUND') {
    return {
      ...baseError,
      userMessage: 'Client not found. They may have been removed or the link is invalid.'
    };
  }

  return baseError;
};

export const getAppointmentErrorMessage = (error: unknown): ApiError => {
  const baseError = getApiErrorMessage(error);
  
  // Override with appointment-specific messages
  if (baseError.code === 'CONFLICT') {
    return {
      ...baseError,
      userMessage: 'This time slot is no longer available. Please choose a different time.'
    };
  }

  if (baseError.code === 'BAD_REQUEST') {
    if (baseError.message.toLowerCase().includes('time') || baseError.message.toLowerCase().includes('date')) {
      return {
        ...baseError,
        userMessage: 'Please select a valid date and time for your appointment.'
      };
    }
  }

  return baseError;
};