/**
 * Error handling module exports
 */

export * from './custom-exceptions';
export * from './global-exception.filter';

// Re-export commonly used types
export type { 
  ErrorContext, 
  ErrorRecovery, 
  ErrorAnalytics 
} from './custom-exceptions';

export type { 
  ErrorResponse, 
  ErrorMetrics 
} from './global-exception.filter';