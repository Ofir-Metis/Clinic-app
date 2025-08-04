/**
 * Custom Exception Classes - Comprehensive error handling for the clinic system
 * Provides structured error types with context, recovery suggestions, and monitoring
 */

import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorContext {
  // Request context
  requestId?: string;
  userId?: string;
  sessionId?: string;
  
  // Business context
  appointmentId?: string;
  recordingId?: string;
  clientId?: string;
  coachId?: string;
  
  // Technical context
  service?: string;
  module?: string;
  function?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface ErrorRecovery {
  suggested?: string[];
  automated?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  backoffStrategy?: 'linear' | 'exponential' | 'fixed';
}

export interface ErrorAnalytics {
  category: 'business' | 'technical' | 'security' | 'performance' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: 'user' | 'system' | 'business' | 'security';
  tags: string[];
  correlationId?: string;
}

export abstract class BaseCustomException extends HttpException {
  public readonly errorCode: string;
  public readonly context: ErrorContext;
  public readonly recovery: ErrorRecovery;
  public readonly analytics: ErrorAnalytics;
  public readonly timestamp: string;
  public readonly name: string = 'BaseCustomException';

  constructor(
    message: string,
    statusCode: HttpStatus,
    errorCode: string,
    context: ErrorContext = {},
    recovery: ErrorRecovery = {},
    analytics: Partial<ErrorAnalytics> = {}
  ) {
    super(message, statusCode);
    
    this.errorCode = errorCode;
    this.context = {
      ...context,
      timestamp: new Date().toISOString(),
    };
    this.recovery = recovery;
    this.analytics = {
      category: 'technical',
      severity: 'medium',
      impact: 'system',
      tags: [],
      ...analytics,
    };
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.getStatus(),
      errorCode: this.errorCode,
      context: this.context,
      recovery: this.recovery,
      analytics: this.analytics,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// ===================================================================
// BUSINESS LOGIC EXCEPTIONS
// ===================================================================

export class RecordingException extends BaseCustomException {
  constructor(
    message: string,
    context: ErrorContext = {},
    recovery: ErrorRecovery = {},
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST
  ) {
    super(
      message,
      statusCode,
      'RECORDING_ERROR',
      context,
      recovery,
      {
        category: 'business',
        severity: 'medium',
        impact: 'user',
        tags: ['recording', 'file_upload'],
      }
    );
  }
}

export class RecordingNotFoundError extends RecordingException {
  constructor(recordingId: string, context: ErrorContext = {}) {
    super(
      `Recording not found: ${recordingId}`,
      { ...context, recordingId },
      {
        suggested: [
          'Verify the recording ID is correct',
          'Check if the recording was deleted',
          'Ensure you have access permissions',
        ],
        retryable: false,
      },
      HttpStatus.NOT_FOUND
    );
    this.analytics.severity = 'low';
  }
}

export class RecordingUploadError extends RecordingException {
  constructor(reason: string, context: ErrorContext = {}) {
    super(
      `Recording upload failed: ${reason}`,
      context,
      {
        suggested: [
          'Check file size and format',
          'Verify storage service is available',
          'Retry the upload',
        ],
        retryable: true,
        maxRetries: 3,
        backoffStrategy: 'exponential',
      },
      HttpStatus.BAD_REQUEST
    );
    this.analytics.severity = 'high';
    this.analytics.tags.push('upload_failure');
  }
}

export class RecordingProcessingError extends RecordingException {
  constructor(stage: string, reason: string, context: ErrorContext = {}) {
    super(
      `Recording processing failed at ${stage}: ${reason}`,
      { ...context, metadata: { stage, reason } },
      {
        suggested: [
          'Check AI service availability',
          'Verify file format compatibility',
          'Review processing logs',
        ],
        retryable: true,
        maxRetries: 2,
        automated: true,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
    this.analytics.category = 'technical';
    this.analytics.severity = 'high';
    this.analytics.tags = ['processing', 'ai', stage];
  }
}

// ===================================================================
// AI SERVICE EXCEPTIONS
// ===================================================================

export class AIServiceException extends BaseCustomException {
  constructor(
    message: string,
    context: ErrorContext = {},
    recovery: ErrorRecovery = {},
    statusCode: HttpStatus = HttpStatus.SERVICE_UNAVAILABLE
  ) {
    super(
      message,
      statusCode,
      'AI_SERVICE_ERROR',
      context,
      recovery,
      {
        category: 'external',
        severity: 'medium',
        impact: 'business',
        tags: ['ai', 'external_service'],
      }
    );
  }
}

export class TranscriptionError extends AIServiceException {
  constructor(reason: string, context: ErrorContext = {}) {
    super(
      `Transcription failed: ${reason}`,
      context,
      {
        suggested: [
          'Check audio quality and format',
          'Verify OpenAI API key and credits',
          'Try with a shorter audio file',
        ],
        retryable: true,
        maxRetries: 2,
        backoffStrategy: 'linear',
      }
    );
    this.analytics.tags.push('transcription');
  }
}

export class SummarizationError extends AIServiceException {
  constructor(reason: string, context: ErrorContext = {}) {
    super(
      `Summarization failed: ${reason}`,
      context,
      {
        suggested: [
          'Check transcript quality',
          'Verify GPT-4 API availability',
          'Try with shorter text',
        ],
        retryable: true,
        maxRetries: 3,
      }
    );
    this.analytics.tags.push('summarization');
  }
}

export class AIQuotaExceededError extends AIServiceException {
  constructor(service: string, context: ErrorContext = {}) {
    super(
      `AI service quota exceeded for ${service}`,
      { ...context, metadata: { service } },
      {
        suggested: [
          'Check API usage limits',
          'Upgrade API plan if needed',
          'Implement rate limiting',
        ],
        retryable: false,
      },
      HttpStatus.TOO_MANY_REQUESTS
    );
    this.analytics.severity = 'critical';
    this.analytics.impact = 'business';
    this.analytics.tags = ['quota', 'billing', service];
  }
}

// ===================================================================
// AUTHENTICATION & AUTHORIZATION EXCEPTIONS
// ===================================================================

export class AuthException extends BaseCustomException {
  constructor(
    message: string,
    context: ErrorContext = {},
    recovery: ErrorRecovery = {},
    statusCode: HttpStatus = HttpStatus.UNAUTHORIZED
  ) {
    super(
      message,
      statusCode,
      'AUTH_ERROR',
      context,
      recovery,
      {
        category: 'security',
        severity: 'medium',
        impact: 'security',
        tags: ['authentication', 'security'],
      }
    );
  }
}

export class InvalidTokenError extends AuthException {
  constructor(tokenType: string = 'access', context: ErrorContext = {}) {
    super(
      `Invalid ${tokenType} token`,
      { ...context, metadata: { tokenType } },
      {
        suggested: [
          'Refresh the authentication token',
          'Login again',
          'Check token expiration',
        ],
        retryable: false,
      }
    );
    this.analytics.tags.push('invalid_token');
  }
}

export class InsufficientPermissionsError extends AuthException {
  constructor(requiredPermission: string, context: ErrorContext = {}) {
    super(
      `Insufficient permissions: ${requiredPermission} required`,
      { ...context, metadata: { requiredPermission } },
      {
        suggested: [
          'Contact administrator for permissions',
          'Check user role assignments',
          'Verify account status',
        ],
        retryable: false,
      },
      HttpStatus.FORBIDDEN
    );
    this.analytics.tags.push('insufficient_permissions');
  }
}

export class AccountLockedError extends AuthException {
  constructor(reason: string, unlockTime?: Date, context: ErrorContext = {}) {
    super(
      `Account locked: ${reason}`,
      { ...context, metadata: { reason, unlockTime } },
      {
        suggested: [
          'Wait for automatic unlock',
          'Contact support for assistance',
          'Check account security settings',
        ],
        retryable: false,
      }
    );
    this.analytics.severity = 'high';
    this.analytics.tags.push('account_locked');
  }
}

// ===================================================================
// STORAGE EXCEPTIONS
// ===================================================================

export class StorageException extends BaseCustomException {
  constructor(
    message: string,
    context: ErrorContext = {},
    recovery: ErrorRecovery = {},
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(
      message,
      statusCode,
      'STORAGE_ERROR',
      context,
      recovery,
      {
        category: 'technical',
        severity: 'medium',
        impact: 'system',
        tags: ['storage', 'infrastructure'],
      }
    );
  }
}

export class StorageQuotaExceededError extends StorageException {
  constructor(currentUsage: number, limit: number, context: ErrorContext = {}) {
    super(
      `Storage quota exceeded: ${currentUsage}/${limit} bytes`,
      { ...context, metadata: { currentUsage, limit } },
      {
        suggested: [
          'Delete old recordings',
          'Upgrade storage plan',
          'Enable automatic archiving',
        ],
        retryable: false,
      },
      HttpStatus.INTERNAL_SERVER_ERROR // Use 500 instead of 507
    );
    this.analytics.severity = 'high';
    this.analytics.impact = 'business';
    this.analytics.tags.push('quota_exceeded');
  }
}

export class FileNotFoundError extends StorageException {
  constructor(key: string, context: ErrorContext = {}) {
    super(
      `File not found: ${key}`,
      { ...context, metadata: { key } },
      {
        suggested: [
          'Check file path is correct',
          'Verify file was uploaded successfully',
          'Check file retention policies',
        ],
        retryable: false,
      },
      HttpStatus.NOT_FOUND
    );
    this.analytics.severity = 'low';
  }
}

export class StorageServiceUnavailableError extends StorageException {
  constructor(service: string, context: ErrorContext = {}) {
    super(
      `Storage service unavailable: ${service}`,
      { ...context, metadata: { service } },
      {
        suggested: [
          'Check service health',
          'Verify network connectivity',
          'Try again later',
        ],
        retryable: true,
        maxRetries: 3,
        automated: true,
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
    this.analytics.severity = 'critical';
    this.analytics.tags.push('service_unavailable');
  }
}

// ===================================================================
// DATABASE EXCEPTIONS
// ===================================================================

export class DatabaseException extends BaseCustomException {
  constructor(
    message: string,
    context: ErrorContext = {},
    recovery: ErrorRecovery = {},
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    super(
      message,
      statusCode,
      'DATABASE_ERROR',
      context,
      recovery,
      {
        category: 'technical',
        severity: 'high',
        impact: 'system',
        tags: ['database', 'persistence'],
      }
    );
  }
}

export class DatabaseConnectionError extends DatabaseException {
  constructor(context: ErrorContext = {}) {
    super(
      'Database connection failed',
      context,
      {
        suggested: [
          'Check database service status',
          'Verify connection credentials',
          'Check network connectivity',
        ],
        retryable: true,
        automated: true,
        maxRetries: 5,
        backoffStrategy: 'exponential',
      }
    );
    this.analytics.severity = 'critical';
    this.analytics.tags.push('connection_failure');
  }
}

export class QueryTimeoutError extends DatabaseException {
  constructor(query: string, timeout: number, context: ErrorContext = {}) {
    super(
      `Query timeout after ${timeout}ms`,
      { ...context, metadata: { query: query.substring(0, 100), timeout } },
      {
        suggested: [
          'Optimize query performance',
          'Add database indexes',
          'Increase query timeout',
        ],
        retryable: true,
        maxRetries: 2,
      }
    );
    this.analytics.tags.push('query_timeout');
  }
}

export class DataIntegrityError extends DatabaseException {
  constructor(constraint: string, context: ErrorContext = {}) {
    super(
      `Data integrity violation: ${constraint}`,
      { ...context, metadata: { constraint } },
      {
        suggested: [
          'Check data validation rules',
          'Verify foreign key relationships',
          'Review business logic',
        ],
        retryable: false,
      },
      HttpStatus.CONFLICT
    );
    this.analytics.tags.push('data_integrity');
  }
}

// ===================================================================
// VALIDATION EXCEPTIONS
// ===================================================================

export class ValidationException extends BaseCustomException {
  constructor(
    message: string,
    errors: Record<string, string[]>,
    context: ErrorContext = {}
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'VALIDATION_ERROR',
      { ...context, metadata: { errors } },
      {
        suggested: [
          'Check input data format',
          'Review validation requirements',
          'Ensure all required fields are provided',
        ],
        retryable: false,
      },
      {
        category: 'business',
        severity: 'low',
        impact: 'user',
        tags: ['validation', 'input_error'],
      }
    );
  }
}

export class FileValidationError extends ValidationException {
  constructor(fileName: string, issues: string[], context: ErrorContext = {}) {
    super(
      `File validation failed: ${fileName}`,
      { file: issues },
      { ...context, metadata: { fileName, issues } }
    );
    this.analytics.tags.push('file_validation');
  }
}

// ===================================================================
// EXTERNAL SERVICE EXCEPTIONS
// ===================================================================

export class ExternalServiceException extends BaseCustomException {
  constructor(
    serviceName: string,
    message: string,
    context: ErrorContext = {},
    recovery: ErrorRecovery = {},
    statusCode: HttpStatus = HttpStatus.SERVICE_UNAVAILABLE
  ) {
    super(
      `${serviceName}: ${message}`,
      statusCode,
      'EXTERNAL_SERVICE_ERROR',
      { ...context, metadata: { serviceName } },
      recovery,
      {
        category: 'external',
        severity: 'medium',
        impact: 'system',
        tags: ['external_service', serviceName.toLowerCase()],
      }
    );
  }
}

export class GoogleCalendarError extends ExternalServiceException {
  constructor(operation: string, reason: string, context: ErrorContext = {}) {
    super(
      'Google Calendar',
      `${operation} failed: ${reason}`,
      { ...context, metadata: { operation, reason } },
      {
        suggested: [
          'Check Google API credentials',
          'Verify calendar permissions',
          'Check API quota limits',
        ],
        retryable: true,
        maxRetries: 3,
      }
    );
    this.analytics.tags.push('google_calendar', operation);
  }
}

export class EmailServiceError extends ExternalServiceException {
  constructor(operation: string, reason: string, context: ErrorContext = {}) {
    super(
      'Email Service',
      `${operation} failed: ${reason}`,
      { ...context, metadata: { operation, reason } },
      {
        suggested: [
          'Check SMTP configuration',
          'Verify email credentials',
          'Check recipient email validity',
        ],
        retryable: true,
        maxRetries: 2,
      }
    );
    this.analytics.tags.push('email', operation);
  }
}

// ===================================================================
// BUSINESS LOGIC EXCEPTIONS
// ===================================================================

export class BusinessLogicException extends BaseCustomException {
  constructor(
    message: string,
    context: ErrorContext = {},
    recovery: ErrorRecovery = {},
    statusCode: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY
  ) {
    super(
      message,
      statusCode,
      'BUSINESS_LOGIC_ERROR',
      context,
      recovery,
      {
        category: 'business',
        severity: 'medium',
        impact: 'business',
        tags: ['business_logic'],
      }
    );
  }
}

export class AppointmentConflictError extends BusinessLogicException {
  constructor(appointmentId: string, conflictTime: Date, context: ErrorContext = {}) {
    super(
      `Appointment conflict detected`,
      { ...context, appointmentId, metadata: { conflictTime } },
      {
        suggested: [
          'Choose a different time slot',
          'Check calendar availability',
          'Reschedule conflicting appointment',
        ],
        retryable: false,
      }
    );
    this.analytics.tags.push('appointment_conflict');
  }
}

export class ProgramEnrollmentError extends BusinessLogicException {
  constructor(programId: string, reason: string, context: ErrorContext = {}) {
    super(
      `Cannot enroll in program ${programId}: ${reason}`,
      { ...context, metadata: { programId, reason } },
      {
        suggested: [
          'Check program prerequisites',
          'Verify enrollment capacity',
          'Review program status',
        ],
        retryable: false,
      }
    );
    this.analytics.tags.push('program_enrollment');
  }
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

export function isRetryableError(error: any): boolean {
  if (error instanceof BaseCustomException) {
    return error.recovery.retryable === true;
  }
  
  // Check for common retryable HTTP status codes
  const retryableStatusCodes = [
    HttpStatus.REQUEST_TIMEOUT,
    HttpStatus.TOO_MANY_REQUESTS,
    HttpStatus.INTERNAL_SERVER_ERROR,
    HttpStatus.BAD_GATEWAY,
    HttpStatus.SERVICE_UNAVAILABLE,
    HttpStatus.GATEWAY_TIMEOUT,
  ];
  
  return retryableStatusCodes.includes(error.status || error.statusCode);
}

export function getRetryStrategy(error: any): { maxRetries: number; backoffStrategy: string } {
  if (error instanceof BaseCustomException && error.recovery) {
    return {
      maxRetries: error.recovery.maxRetries || 3,
      backoffStrategy: error.recovery.backoffStrategy || 'exponential',
    };
  }
  
  return { maxRetries: 3, backoffStrategy: 'exponential' };
}

export function shouldAutoRecover(error: any): boolean {
  if (error instanceof BaseCustomException) {
    return error.recovery.automated === true;
  }
  
  return false;
}