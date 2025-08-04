import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CentralizedLoggerService, HealthcareLogContext } from '../logging/centralized-logger.service';
import { v4 as uuidv4 } from 'uuid';

export interface ErrorContext extends HealthcareLogContext {
  errorId?: string;
  errorType?: 'validation' | 'business' | 'system' | 'security' | 'compliance';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  recoverable?: boolean;
  userMessage?: string;
  internalMessage?: string;
  stackTrace?: string;
  requestData?: any;
  systemState?: any;
  affectedResources?: string[];
  complianceImpact?: boolean;
  notificationRequired?: boolean;
  escalationLevel?: number;
}

export interface ErrorResponse {
  success: false;
  errorId: string;
  message: string;
  code: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: any;
  correlationId?: string;
  supportReference?: string;
}

@Injectable()
export class ErrorHandlerService {
  private readonly logger = new Logger(ErrorHandlerService.name);
  private readonly environment: string;
  private readonly serviceName: string;

  constructor(
    private readonly centralizedLogger: CentralizedLoggerService,
    private readonly configService: ConfigService
  ) {
    this.environment = this.configService.get<string>('NODE_ENV', 'development');
    this.serviceName = this.configService.get<string>('SERVICE_NAME', 'clinic-app');
  }

  /**
   * Handle and process errors with comprehensive logging and compliance
   */
  handleError(
    error: Error | HttpException | any,
    context?: Partial<ErrorContext>
  ): ErrorResponse {
    const errorId = uuidv4();
    const timestamp = new Date().toISOString();

    // Determine error characteristics
    const errorInfo = this.analyzeError(error);
    const statusCode = this.getStatusCode(error);
    const errorType = this.determineErrorType(error, context);
    const severity = this.determineSeverity(error, statusCode, context);

    // Create comprehensive error context
    const errorContext: ErrorContext = {
      ...context,
      errorId,
      errorType,
      severity,
      recoverable: this.isRecoverable(error, statusCode),
      internalMessage: error.message,
      userMessage: this.getUserFriendlyMessage(error, errorType),
      stackTrace: error.stack,
      complianceImpact: this.hasComplianceImpact(error, context),
      notificationRequired: this.requiresNotification(severity, errorType),
      escalationLevel: this.getEscalationLevel(severity, errorType),
      metadata: {
        ...context?.metadata,
        errorName: error.name,
        errorConstructor: error.constructor.name,
        statusCode,
        timestamp,
        service: this.serviceName,
        environment: this.environment
      }
    };

    // Log the error based on severity and type
    this.logError(error, errorContext);

    // Healthcare compliance logging
    if (errorContext.complianceImpact || errorContext.dataType === 'phi') {
      this.logComplianceError(error, errorContext);
    }

    // Security incident logging
    if (errorType === 'security') {
      this.logSecurityError(error, errorContext);
    }

    // Business impact logging
    if (errorType === 'business' || errorContext.patientId || errorContext.providerId) {
      this.logBusinessError(error, errorContext);
    }

    // Create sanitized error response
    return this.createErrorResponse(error, errorContext, statusCode);
  }

  /**
   * Handle validation errors with field-specific details
   */
  handleValidationError(
    validationErrors: any[],
    context?: Partial<ErrorContext>
  ): ErrorResponse {
    const errorId = uuidv4();
    const timestamp = new Date().toISOString();

    const errorContext: ErrorContext = {
      ...context,
      errorId,
      errorType: 'validation',
      severity: 'low',
      recoverable: true,
      userMessage: 'Please check your input and try again',
      internalMessage: 'Validation failed',
      complianceImpact: false,
      notificationRequired: false,
      escalationLevel: 0,
      metadata: {
        ...context?.metadata,
        validationErrors: this.sanitizeValidationErrors(validationErrors),
        errorCount: validationErrors.length,
        timestamp,
        service: this.serviceName
      }
    };

    this.centralizedLogger.warning('Validation error occurred', errorContext);

    return {
      success: false,
      errorId,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp,
      path: context?.url,
      details: {
        fields: this.formatValidationErrors(validationErrors)
      },
      correlationId: context?.correlationId,
      supportReference: `VAL-${errorId.substring(0, 8)}`
    };
  }

  /**
   * Handle business logic errors
   */
  handleBusinessError(
    message: string,
    code: string,
    context?: Partial<ErrorContext>
  ): ErrorResponse {
    const errorId = uuidv4();
    const timestamp = new Date().toISOString();

    const errorContext: ErrorContext = {
      ...context,
      errorId,
      errorType: 'business',
      severity: 'medium',
      recoverable: true,
      userMessage: message,
      internalMessage: `Business rule violation: ${code}`,
      complianceImpact: this.isComplianceRelated(code, context),
      notificationRequired: false,
      escalationLevel: 1,
      metadata: {
        ...context?.metadata,
        businessRuleCode: code,
        timestamp,
        service: this.serviceName
      }
    };

    this.centralizedLogger.warning('Business error occurred', errorContext);

    if (errorContext.complianceImpact) {
      this.centralizedLogger.auditLog(`Business rule violation: ${code}`, errorContext);
    }

    return {
      success: false,
      errorId,
      message,
      code,
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp,
      path: context?.url,
      correlationId: context?.correlationId,
      supportReference: `BIZ-${errorId.substring(0, 8)}`
    };
  }

  /**
   * Handle system errors (database, external services, etc.)
   */
  handleSystemError(
    error: Error,
    context?: Partial<ErrorContext>
  ): ErrorResponse {
    const errorId = uuidv4();
    const timestamp = new Date().toISOString();

    const errorContext: ErrorContext = {
      ...context,
      errorId,
      errorType: 'system',
      severity: 'high',
      recoverable: this.isSystemErrorRecoverable(error),
      userMessage: 'A system error occurred. Please try again later.',
      internalMessage: error.message,
      stackTrace: error.stack,
      complianceImpact: false,
      notificationRequired: true,
      escalationLevel: 2,
      affectedResources: this.getAffectedResources(error, context),
      metadata: {
        ...context?.metadata,
        errorName: error.name,
        timestamp,
        service: this.serviceName
      }
    };

    this.centralizedLogger.logError('System error occurred', errorContext);

    // Check for database connectivity issues
    if (this.isDatabaseError(error)) {
      this.centralizedLogger.securityLog('Database connectivity issue detected', {
        ...errorContext,
        securityEvent: 'database_error',
        alertLevel: 'high'
      });
    }

    return {
      success: false,
      errorId,
      message: 'Internal server error',
      code: 'SYSTEM_ERROR',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path: context?.url,
      correlationId: context?.correlationId,
      supportReference: `SYS-${errorId.substring(0, 8)}`
    };
  }

  /**
   * Handle security-related errors
   */
  handleSecurityError(
    error: Error | string,
    securityEvent: string,
    context?: Partial<ErrorContext>
  ): ErrorResponse {
    const errorId = uuidv4();
    const timestamp = new Date().toISOString();
    const errorMessage = typeof error === 'string' ? error : error.message;

    const errorContext: ErrorContext = {
      ...context,
      errorId,
      errorType: 'security',
      severity: 'critical',
      recoverable: false,
      userMessage: 'Access denied',
      internalMessage: errorMessage,
      stackTrace: typeof error === 'object' ? error.stack : undefined,
      complianceImpact: true,
      notificationRequired: true,
      escalationLevel: 3,
      metadata: {
        ...context?.metadata,
        securityEvent,
        threatLevel: 'high',
        timestamp,
        service: this.serviceName
      }
    };

    this.centralizedLogger.securityLog(`Security error: ${securityEvent}`, errorContext);
    this.centralizedLogger.auditLog(`Security incident: ${securityEvent}`, errorContext);

    return {
      success: false,
      errorId,
      message: 'Access denied',
      code: 'SECURITY_ERROR',
      statusCode: HttpStatus.FORBIDDEN,
      timestamp,
      path: context?.url,
      correlationId: context?.correlationId,
      supportReference: `SEC-${errorId.substring(0, 8)}`
    };
  }

  /**
   * Handle compliance-related errors (HIPAA, GDPR, etc.)
   */
  handleComplianceError(
    error: Error | string,
    regulation: 'HIPAA' | 'GDPR' | 'SOC2',
    context?: Partial<ErrorContext>
  ): ErrorResponse {
    const errorId = uuidv4();
    const timestamp = new Date().toISOString();
    const errorMessage = typeof error === 'string' ? error : error.message;

    const errorContext: ErrorContext = {
      ...context,
      errorId,
      errorType: 'compliance',
      severity: 'critical',
      recoverable: false,
      userMessage: 'Operation not permitted due to compliance requirements',
      internalMessage: errorMessage,
      stackTrace: typeof error === 'object' ? error.stack : undefined,
      complianceImpact: true,
      notificationRequired: true,
      escalationLevel: 3,
      complianceContext: {
        regulation,
        dataClassification: 'restricted',
        retentionPeriod: '7-years',
        encryptionRequired: true
      },
      metadata: {
        ...context?.metadata,
        regulation,
        complianceViolation: true,
        timestamp,
        service: this.serviceName
      }
    };

    this.centralizedLogger.auditLog(`Compliance error: ${regulation} violation`, errorContext);
    this.centralizedLogger.securityLog(`Compliance violation detected: ${regulation}`, errorContext);

    return {
      success: false,
      errorId,
      message: 'Operation not permitted',
      code: 'COMPLIANCE_ERROR',
      statusCode: HttpStatus.FORBIDDEN,
      timestamp,
      path: context?.url,
      correlationId: context?.correlationId,
      supportReference: `CMP-${errorId.substring(0, 8)}`
    };
  }

  private analyzeError(error: any): any {
    return {
      name: error.name || 'Unknown',
      message: error.message || 'Unknown error',
      stack: error.stack,
      isHttpException: error instanceof HttpException,
      isCustomError: error.isCustomError || false,
      originalError: error.originalError || null
    };
  }

  private getStatusCode(error: any): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }
    
    // Map common error types to status codes
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }
    
    if (error.name === 'ValidationError') {
      return HttpStatus.BAD_REQUEST;
    }
    
    if (error.name === 'UnauthorizedError' || error.code === 'UNAUTHORIZED') {
      return HttpStatus.UNAUTHORIZED;
    }
    
    if (error.name === 'ForbiddenError' || error.code === 'FORBIDDEN') {
      return HttpStatus.FORBIDDEN;
    }
    
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private determineErrorType(error: any, context?: Partial<ErrorContext>): ErrorContext['errorType'] {
    if (context?.errorType) return context.errorType;
    
    if (error.name === 'ValidationError' || error.statusCode === 400) {
      return 'validation';
    }
    
    if (error.statusCode === 401 || error.statusCode === 403) {
      return 'security';
    }
    
    if (error.code?.startsWith('BUSINESS_')) {
      return 'business';
    }
    
    if (this.isDatabaseError(error) || this.isNetworkError(error)) {
      return 'system';
    }
    
    return 'system';
  }

  private determineSeverity(error: any, statusCode: number, context?: Partial<ErrorContext>): ErrorContext['severity'] {
    if (context?.severity) return context.severity;
    
    if (statusCode >= 500) return 'critical';
    if (statusCode === 401 || statusCode === 403) return 'high';
    if (statusCode >= 400) return 'medium';
    return 'low';
  }

  private isRecoverable(error: any, statusCode: number): boolean {
    // Security errors are typically not recoverable
    if (statusCode === 401 || statusCode === 403) return false;
    
    // Validation errors are recoverable
    if (statusCode === 400) return true;
    
    // System errors might be recoverable
    if (statusCode >= 500) {
      return this.isSystemErrorRecoverable(error);
    }
    
    return true;
  }

  private isSystemErrorRecoverable(error: any): boolean {
    // Database connection errors might be temporary
    if (this.isDatabaseError(error)) return true;
    
    // Network errors might be temporary
    if (this.isNetworkError(error)) return true;
    
    // Memory errors are typically not recoverable
    if (error.name === 'OutOfMemoryError') return false;
    
    return false;
  }

  private hasComplianceImpact(error: any, context?: Partial<ErrorContext>): boolean {
    // PHI or PII data involved
    if (context?.dataType === 'phi' || context?.dataType === 'pii') return true;
    
    // Patient or provider data involved
    if (context?.patientId || context?.providerId) return true;
    
    // Security errors have compliance impact
    if (error.statusCode === 401 || error.statusCode === 403) return true;
    
    return false;
  }

  private requiresNotification(severity: ErrorContext['severity'], errorType: ErrorContext['errorType']): boolean {
    if (severity === 'critical') return true;
    if (severity === 'high' && errorType === 'security') return true;
    if (errorType === 'compliance') return true;
    return false;
  }

  private getEscalationLevel(severity: ErrorContext['severity'], errorType: ErrorContext['errorType']): number {
    if (errorType === 'compliance' || errorType === 'security') return 3;
    if (severity === 'critical') return 3;
    if (severity === 'high') return 2;
    if (severity === 'medium') return 1;
    return 0;
  }

  private getUserFriendlyMessage(error: any, errorType: ErrorContext['errorType']): string {
    switch (errorType) {
      case 'validation':
        return 'Please check your input and try again.';
      case 'security':
        return 'Access denied. Please check your permissions.';
      case 'business':
        return error.message || 'Business rule violation occurred.';
      case 'compliance':
        return 'Operation not permitted due to compliance requirements.';
      case 'system':
      default:
        return 'A system error occurred. Please try again later.';
    }
  }

  private logError(error: any, context: ErrorContext): void {
    const logMethod = context.severity === 'critical' || context.severity === 'high' 
      ? 'logError' 
      : 'warning';

    this.centralizedLogger[logMethod]('Error occurred', {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        statusCode: this.getStatusCode(error)
      }
    });
  }

  private logComplianceError(error: any, context: ErrorContext): void {
    this.centralizedLogger.auditLog('Compliance error occurred', {
      ...context,
      auditRequired: true,
      hipaaCompliant: true,
      complianceContext: context.complianceContext || {
        regulation: 'HIPAA',
        dataClassification: 'restricted',
        retentionPeriod: '7-years',
        encryptionRequired: true
      }
    });
  }

  private logSecurityError(error: any, context: ErrorContext): void {
    this.centralizedLogger.securityLog('Security error occurred', {
      ...context,
      securityEvent: 'error_occurred',
      alertLevel: 'high'
    });
  }

  private logBusinessError(error: any, context: ErrorContext): void {
    this.centralizedLogger.businessLog('Business error occurred', {
      ...context,
      businessImpact: true,
      customerFacing: true
    });
  }

  private createErrorResponse(error: any, context: ErrorContext, statusCode: number): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      errorId: context.errorId!,
      message: context.userMessage!,
      code: this.getErrorCode(error, context.errorType!),
      statusCode,
      timestamp: new Date().toISOString(),
      correlationId: context.correlationId,
      supportReference: this.getSupportReference(context.errorType!, context.errorId!)
    };

    // Add path if available
    if (context.url) {
      response.path = context.url;
    }

    // Add details in development environment
    if (this.environment === 'development' || this.environment === 'test') {
      response.details = {
        internalMessage: context.internalMessage,
        errorType: context.errorType,
        severity: context.severity,
        recoverable: context.recoverable,
        ...(error.stack && { stack: error.stack })
      };
    }

    return response;
  }

  private getErrorCode(error: any, errorType: ErrorContext['errorType']): string {
    const prefix = errorType.toUpperCase();
    
    if (error.code) return `${prefix}_${error.code}`;
    if (error.name) return `${prefix}_${error.name.toUpperCase()}`;
    
    return `${prefix}_ERROR`;
  }

  private getSupportReference(errorType: ErrorContext['errorType'], errorId: string): string {
    const prefixes = {
      validation: 'VAL',
      business: 'BIZ',
      system: 'SYS',
      security: 'SEC',
      compliance: 'CMP'
    };
    
    const prefix = prefixes[errorType] || 'ERR';
    return `${prefix}-${errorId.substring(0, 8)}`;
  }

  private sanitizeValidationErrors(errors: any[]): any[] {
    return errors.map(error => ({
      field: error.property || error.field,
      code: error.code,
      message: error.message,
      value: '[SANITIZED]' // Don't log actual values for security
    }));
  }

  private formatValidationErrors(errors: any[]): any {
    const formatted: any = {};
    
    errors.forEach(error => {
      const field = error.property || error.field;
      if (field) {
        formatted[field] = {
          message: error.message,
          code: error.code
        };
      }
    });
    
    return formatted;
  }

  private isComplianceRelated(code: string, context?: Partial<ErrorContext>): boolean {
    const complianceCodes = ['HIPAA_', 'GDPR_', 'SOC2_', 'PHI_', 'PII_'];
    return complianceCodes.some(prefix => code.startsWith(prefix)) ||
           context?.dataType === 'phi' ||
           context?.dataType === 'pii';
  }

  private isDatabaseError(error: any): boolean {
    const dbErrorCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];
    const dbErrorNames = ['MongoError', 'SequelizeError', 'TypeORMError', 'QueryFailedError'];
    
    return dbErrorCodes.includes(error.code) ||
           dbErrorNames.some(name => error.name?.includes(name)) ||
           error.message?.includes('database') ||
           error.message?.includes('connection');
  }

  private isNetworkError(error: any): boolean {
    const networkErrorCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EHOSTUNREACH'];
    return networkErrorCodes.includes(error.code);
  }

  private getAffectedResources(error: any, context?: Partial<ErrorContext>): string[] {
    const resources: string[] = [];
    
    if (this.isDatabaseError(error)) {
      resources.push('database');
    }
    
    if (this.isNetworkError(error)) {
      resources.push('network');
    }
    
    if (context?.patientId) {
      resources.push(`patient:${context.patientId}`);
    }
    
    if (context?.providerId) {
      resources.push(`provider:${context.providerId}`);
    }
    
    if (context?.service) {
      resources.push(`service:${context.service}`);
    }
    
    return resources;
  }
}