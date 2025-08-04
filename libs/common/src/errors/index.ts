/**
 * Error handling module exports
 */

export * from './custom-exceptions';
export * from './global-exception.filter';
export * from './error-handler.service';

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

export type {
  ErrorContext as ErrorHandlerContext,
  ErrorResponse as ErrorHandlerResponse
} from './error-handler.service';