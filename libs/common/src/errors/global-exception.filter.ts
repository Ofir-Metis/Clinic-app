/**
 * Global Exception Filter - Comprehensive error handling with monitoring and recovery
 * Provides structured error responses, logging, monitoring, and automated recovery
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { 
  BaseCustomException, 
  isRetryableError, 
  getRetryStrategy, 
  shouldAutoRecover,
  ErrorContext,
  ErrorAnalytics 
} from './custom-exceptions';
import { StructuredLoggerService } from '../logging/structured-logger.service';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error: string;
  errorCode?: string;
  requestId?: string;
  correlationId?: string;
  context?: any;
  recovery?: {
    suggested?: string[];
    retryable?: boolean;
    retryAfter?: number;
  };
  support?: {
    contactEmail?: string;
    documentationUrl?: string;
    statusPageUrl?: string;
  };
}

export interface ErrorMetrics {
  errorCount: number;
  errorsByType: Record<string, number>;
  errorsByStatusCode: Record<number, number>;
  errorsByCategory: Record<string, number>;
  averageResponseTime: number;
  lastError?: {
    timestamp: string;
    type: string;
    message: string;
  };
}

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);
  private readonly structuredLogger: StructuredLoggerService;
  private errorMetrics: ErrorMetrics;
  private readonly environment: string;
  private readonly supportConfig: {
    contactEmail: string;
    documentationUrl: string;
    statusPageUrl: string;
  };

  constructor(structuredLogger?: StructuredLoggerService) {
    this.structuredLogger = structuredLogger || new StructuredLoggerService();
    this.environment = process.env.NODE_ENV || 'development';
    this.initializeMetrics();
    this.supportConfig = {
      contactEmail: process.env.SUPPORT_EMAIL || 'support@clinic-app.com',
      documentationUrl: process.env.DOCS_URL || 'https://docs.clinic-app.com',
      statusPageUrl: process.env.STATUS_PAGE_URL || 'https://status.clinic-app.com',
    };
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const startTime = Date.now();
    const requestId = request.headers['x-request-id'] as string || this.generateRequestId();
    const correlationId = request.headers['x-correlation-id'] as string;

    try {
      // Process the exception
      const errorInfo = this.processException(exception, request);
      
      // Log the error
      this.logError(exception, errorInfo, request, requestId);
      
      // Update metrics
      this.updateErrorMetrics(errorInfo);
      
      // Check for automated recovery
      if (shouldAutoRecover(exception)) {
        this.attemptAutomatedRecovery(exception, request);
      }
      
      // Send monitoring alerts if needed
      this.sendMonitoringAlerts(errorInfo, request);
      
      // Generate error response
      const errorResponse = this.createErrorResponse(
        errorInfo,
        request,
        requestId,
        correlationId,
        startTime
      );
      
      // Set retry headers for retryable errors
      if (errorInfo.retryable) {
        const retryAfter = this.calculateRetryDelay(errorInfo.retryCount || 0);
        response.setHeader('Retry-After', Math.ceil(retryAfter / 1000));
        response.setHeader('X-RateLimit-Reset', Date.now() + retryAfter);
      }
      
      // Set security headers
      this.setSecurityHeaders(response, errorInfo);
      
      response.status(errorInfo.statusCode).json(errorResponse);
      
    } catch (filterError) {
      // Fallback error handling if the filter itself fails
      this.logger.error('Exception filter failed:', filterError);
      this.handleFilterFailure(response, exception, requestId);
    }
  }

  private processException(exception: unknown, request: Request) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let context: ErrorContext = {};
    let recovery: any = {};
    let analytics: ErrorAnalytics = {
      category: 'technical',
      severity: 'medium',
      impact: 'system',
      tags: [],
    };
    let retryable = false;
    let originalError = exception;

    if (exception instanceof BaseCustomException) {
      // Custom exceptions with full context
      statusCode = exception.getStatus();
      message = exception.message;
      errorCode = exception.errorCode;
      context = exception.context;
      recovery = exception.recovery;
      analytics = exception.analytics;
      retryable = recovery.retryable || false;
      
    } else if (exception instanceof HttpException) {
      // Standard HTTP exceptions
      statusCode = exception.getStatus();
      message = exception.message;
      
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        context = { metadata: response };
      }
      
      retryable = isRetryableError(exception);
      
    } else if (exception instanceof Error) {
      // Standard JavaScript errors
      message = exception.message;
      context = { 
        metadata: { 
          name: exception.name,
          stack: exception.stack?.split('\n').slice(0, 5), // Limit stack trace
        }
      };
      
      // Categorize common error types
      if (exception.name === 'ValidationError') {
        statusCode = HttpStatus.BAD_REQUEST;
        errorCode = 'VALIDATION_ERROR';
        analytics.category = 'business';
        analytics.severity = 'low';
      } else if (exception.name === 'TimeoutError') {
        statusCode = HttpStatus.REQUEST_TIMEOUT;
        errorCode = 'TIMEOUT_ERROR';
        retryable = true;
        analytics.tags.push('timeout');
      } else if (exception.name === 'DatabaseError') {
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorCode = 'DATABASE_ERROR';
        retryable = true;
        analytics.severity = 'high';
        analytics.tags.push('database');
      }
      
    } else {
      // Unknown exception type
      message = 'An unexpected error occurred';
      context = { metadata: { type: typeof exception, value: String(exception) } };
      analytics.severity = 'critical';
      analytics.tags.push('unknown_error');
    }

    // Extract additional context from request
    const requestContext: ErrorContext = {
      requestId: request.headers['x-request-id'] as string,
      userId: (request as any).user?.id,
      sessionId: (request as any).session?.id,
      metadata: {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        ...context.metadata,
      },
    };

    return {
      statusCode,
      message,
      errorCode,
      context: { ...context, ...requestContext },
      recovery,
      analytics,
      retryable,
      originalError,
      retryCount: this.getRetryCount(request),
    };
  }

  private logError(
    exception: unknown, 
    errorInfo: any, 
    request: Request, 
    requestId: string
  ) {
    const logContext: ErrorContext = {
      ...errorInfo.context,
      requestId,
      function: 'global_exception_handler',
    };

    if (errorInfo.statusCode >= 500) {
      // Server errors - log as error with full context
      this.structuredLogger.logWithContext(
        'error',
        `Server Error: ${errorInfo.message}`,
        logContext,
        errorInfo.originalError instanceof Error ? errorInfo.originalError : undefined
      );
      
      // Also log security events for certain error types
      if (errorInfo.analytics.category === 'security') {
        this.structuredLogger.logSecurityEvent(
          errorInfo.errorCode,
          errorInfo.analytics.severity,
          logContext
        );
      }
      
    } else if (errorInfo.statusCode >= 400) {
      // Client errors - log as warning
      this.structuredLogger.logWithContext(
        'warn',
        `Client Error: ${errorInfo.message}`,
        logContext
      );
      
    } else {
      // Other status codes - log as info
      this.structuredLogger.logWithContext(
        'info',
        `Request processed with status ${errorInfo.statusCode}: ${errorInfo.message}`,
        logContext
      );
    }

    // Log performance impact for slow requests
    const responseTime = Date.now() - (request as any).startTime;
    if (responseTime > 5000) { // 5 seconds
      this.structuredLogger.logPerformanceMetric(
        'slow_error_response',
        responseTime,
        logContext
      );
    }
  }

  private updateErrorMetrics(errorInfo: any) {
    this.errorMetrics.errorCount++;
    
    // Update error type counts
    const errorType = errorInfo.errorCode || 'UNKNOWN';
    this.errorMetrics.errorsByType[errorType] = (this.errorMetrics.errorsByType[errorType] || 0) + 1;
    
    // Update status code counts
    this.errorMetrics.errorsByStatusCode[errorInfo.statusCode] = 
      (this.errorMetrics.errorsByStatusCode[errorInfo.statusCode] || 0) + 1;
    
    // Update category counts
    const category = errorInfo.analytics.category;
    this.errorMetrics.errorsByCategory[category] = (this.errorMetrics.errorsByCategory[category] || 0) + 1;
    
    // Update last error info
    this.errorMetrics.lastError = {
      timestamp: new Date().toISOString(),
      type: errorType,
      message: errorInfo.message,
    };
  }

  private createErrorResponse(
    errorInfo: any,
    request: Request,
    requestId: string,
    correlationId?: string,
    startTime: number = Date.now()
  ): ErrorResponse {
    const baseResponse: ErrorResponse = {
      statusCode: errorInfo.statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.sanitizeErrorMessage(errorInfo.message, errorInfo.statusCode),
      error: this.getErrorName(errorInfo.statusCode),
      requestId,
    };

    // Add correlation ID if present
    if (correlationId) {
      baseResponse.correlationId = correlationId;
    }

    // Add error code for custom exceptions
    if (errorInfo.errorCode && errorInfo.errorCode !== 'INTERNAL_SERVER_ERROR') {
      baseResponse.errorCode = errorInfo.errorCode;
    }

    // Add recovery information for retryable errors
    if (errorInfo.retryable && errorInfo.recovery) {
      baseResponse.recovery = {
        suggested: errorInfo.recovery.suggested,
        retryable: true,
        retryAfter: this.calculateRetryDelay(errorInfo.retryCount || 0),
      };
    }

    // Add support information for server errors
    if (errorInfo.statusCode >= 500) {
      baseResponse.support = this.supportConfig;
    }

    // Add context for development environment
    if (this.environment === 'development' && errorInfo.context) {
      baseResponse.context = {
        ...errorInfo.context,
        analytics: errorInfo.analytics,
      };
    }

    return baseResponse;
  }

  private attemptAutomatedRecovery(exception: unknown, request: Request) {
    // TODO: Implement automated recovery strategies
    // - Clear cache for cache-related errors
    // - Restart database connections
    // - Reset circuit breakers
    // - Scale services if needed
    
    this.structuredLogger.logWithContext(
      'info',
      'Attempting automated recovery',
      {
        requestId: request.headers['x-request-id'] as string,
        function: 'automated_recovery',
        metadata: { exceptionType: exception?.constructor?.name },
      }
    );
  }

  private sendMonitoringAlerts(errorInfo: any, request: Request) {
    // Send alerts for critical errors
    if (errorInfo.analytics.severity === 'critical') {
      this.sendCriticalErrorAlert(errorInfo, request);
    }
    
    // Send alerts for high error rates
    if (this.isErrorRateHigh()) {
      this.sendHighErrorRateAlert();
    }
    
    // Send alerts for security incidents
    if (errorInfo.analytics.category === 'security') {
      this.sendSecurityAlert(errorInfo, request);
    }
  }

  private sendCriticalErrorAlert(errorInfo: any, request: Request) {
    // TODO: Integrate with alerting systems (PagerDuty, Slack, etc.)
    this.logger.error(`CRITICAL ERROR ALERT: ${errorInfo.message}`, {
      errorCode: errorInfo.errorCode,
      requestId: request.headers['x-request-id'],
      url: request.url,
      userId: (request as any).user?.id,
    });
  }

  private sendHighErrorRateAlert() {
    // TODO: Implement error rate monitoring
    this.logger.warn('High error rate detected', {
      errorCount: this.errorMetrics.errorCount,
      timestamp: new Date().toISOString(),
    });
  }

  private sendSecurityAlert(errorInfo: any, request: Request) {
    // TODO: Integrate with security monitoring systems
    this.logger.error(`SECURITY ALERT: ${errorInfo.message}`, {
      errorCode: errorInfo.errorCode,
      requestId: request.headers['x-request-id'],
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      severity: errorInfo.analytics.severity,
    });
  }

  private setSecurityHeaders(response: Response, errorInfo: any) {
    // Prevent information leakage
    response.removeHeader('x-powered-by');
    
    // Add security headers for sensitive errors
    if (errorInfo.analytics.category === 'security') {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-Frame-Options', 'DENY');
    }
  }

  private handleFilterFailure(response: Response, originalException: unknown, requestId: string) {
    const fallbackResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      message: 'An unexpected error occurred',
      error: 'Internal Server Error',
      requestId,
    };

    try {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(fallbackResponse);
    } catch (responseError) {
      // Last resort - write directly to response
      response.end(JSON.stringify(fallbackResponse));
    }
  }

  // Utility methods
  private initializeMetrics() {
    this.errorMetrics = {
      errorCount: 0,
      errorsByType: {},
      errorsByStatusCode: {},
      errorsByCategory: {},
      averageResponseTime: 0,
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private getRetryCount(request: Request): number {
    return parseInt(request.headers['x-retry-count'] as string) || 0;
  }

  private calculateRetryDelay(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
    return Math.min(1000 * Math.pow(2, retryCount), 16000);
  }

  private sanitizeErrorMessage(message: string, statusCode: number): string {
    // Don't expose internal details in production for server errors
    if (this.environment === 'production' && statusCode >= 500) {
      return 'An internal server error occurred. Please try again later.';
    }
    
    // Sanitize sensitive information from error messages
    return message
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/key[=:]\s*\S+/gi, 'key=***');
  }

  private getErrorName(statusCode: number): string {
    const errorNames: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };
    
    return errorNames[statusCode] || 'Unknown Error';
  }

  private isErrorRateHigh(): boolean {
    // TODO: Implement sophisticated error rate detection
    // For now, simple threshold check
    return this.errorMetrics.errorCount > 100; // per time window
  }

  // Public methods for metrics and health checks
  getErrorMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  resetMetrics() {
    this.initializeMetrics();
  }

  getHealthStatus() {
    const recentErrors = this.errorMetrics.errorCount;
    const criticalErrors = this.errorMetrics.errorsByCategory['critical'] || 0;
    
    return {
      status: criticalErrors > 0 ? 'unhealthy' : recentErrors > 50 ? 'degraded' : 'healthy',
      errorCount: recentErrors,
      criticalErrors,
      lastError: this.errorMetrics.lastError,
      timestamp: new Date().toISOString(),
    };
  }
}