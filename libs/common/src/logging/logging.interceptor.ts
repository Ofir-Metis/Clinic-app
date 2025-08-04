import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CentralizedLoggerService, HealthcareLogContext } from './centralized-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CentralizedLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const requestId = uuidv4();

    // Handle HTTP requests
    if (context.getType() === 'http') {
      return this.handleHttpRequest(context, next, startTime, requestId);
    }

    // Handle other context types (GraphQL, RPC, etc.)
    return this.handleGenericRequest(context, next, startTime, requestId);
  }

  private handleHttpRequest(
    context: ExecutionContext,
    next: CallHandler,
    startTime: number,
    requestId: string
  ): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Extract context information
    const logContext: HealthcareLogContext = {
      requestId,
      correlationId: request.headers['x-correlation-id'] as string || requestId,
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ipAddress: this.getClientIp(request),
      userId: request.user?.id || request.user?.sub,
      sessionId: request.sessionID || request.headers['x-session-id'] as string,
      service: process.env.SERVICE_NAME || 'clinic-app',
      module: controller.name,
      action: handler.name,
      metadata: {
        controller: controller.name,
        handler: handler.name,
        params: this.sanitizeParams(request.params),
        query: this.sanitizeQuery(request.query),
        headers: this.sanitizeHeaders(request.headers)
      }
    };

    // Determine if this is healthcare-related data
    if (this.isHealthcareEndpoint(request.url)) {
      logContext.dataType = this.determineDataType(request.url);
      logContext.hipaaCompliant = true;
      logContext.auditRequired = true;
      logContext.complianceContext = {
        regulation: 'HIPAA',
        dataClassification: 'restricted',
        retentionPeriod: '7-years',
        encryptionRequired: true
      };
    }

    // Set request ID in response headers
    response.setHeader('X-Request-ID', requestId);
    response.setHeader('X-Correlation-ID', logContext.correlationId);

    // Log incoming request
    return this.logger.runWithContext(logContext, () => {
      this.logger.info('Incoming request', {
        ...logContext,
        message: `${request.method} ${request.url}`,
        requestSize: request.get('content-length') || 0
      });

      return next.handle().pipe(
        tap((data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log successful response
          this.logger.info('Request completed', {
            ...logContext,
            statusCode,
            duration,
            responseSize: JSON.stringify(data || {}).length,
            success: true
          });

          // Performance logging
          if (duration > 1000) {
            this.logger.performanceLog(`${request.method} ${request.url}`, duration, logContext);
          }

          // Healthcare audit logging
          if (logContext.auditRequired) {
            this.logger.auditLog(
              `${request.method} ${request.url} - Success`,
              {
                ...logContext,
                statusCode,
                duration,
                outcome: 'success'
              }
            );
          }
        }),
        catchError((error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || error.statusCode || 500;

          // Log error response
          this.logger.logError('Request failed', {
            ...logContext,
            statusCode,
            duration,
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name,
              ...(error.response && { response: error.response })
            },
            success: false
          });

          // Security logging for failed requests
          if (statusCode === 401 || statusCode === 403) {
            this.logger.securityLog(
              `Unauthorized access attempt: ${request.method} ${request.url}`,
              {
                ...logContext,
                statusCode,
                securityEvent: 'unauthorized_access',
                alertLevel: 'medium'
              }
            );
          }

          // Healthcare audit logging for errors
          if (logContext.auditRequired) {
            this.logger.auditLog(
              `${request.method} ${request.url} - Error`,
              {
                ...logContext,
                statusCode,
                duration,
                outcome: 'error',
                errorMessage: error.message
              }
            );
          }

          throw error;
        })
      );
    });
  }

  private handleGenericRequest(
    context: ExecutionContext,
    next: CallHandler,
    startTime: number,
    requestId: string
  ): Observable<any> {
    const handler = context.getHandler();
    const controller = context.getClass();

    const logContext: HealthcareLogContext = {
      requestId,
      correlationId: requestId,
      service: process.env.SERVICE_NAME || 'clinic-app',
      module: controller.name,
      action: handler.name,
      metadata: {
        controller: controller.name,
        handler: handler.name,
        contextType: context.getType()
      }
    };

    return this.logger.runWithContext(logContext, () => {
      this.logger.info('Processing request', logContext);

      return next.handle().pipe(
        tap(() => {
          const duration = Date.now() - startTime;
          this.logger.info('Request processed successfully', {
            ...logContext,
            duration,
            success: true
          });
        }),
        catchError((error) => {
          const duration = Date.now() - startTime;
          this.logger.logError('Request processing failed', {
            ...logContext,
            duration,
            error: {
              message: error.message,
              stack: error.stack,
              name: error.name
            },
            success: false
          });
          throw error;
        })
      );
    });
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private sanitizeParams(params: any): any {
    if (!params) return {};
    
    const sanitized = { ...params };
    
    // Remove sensitive parameters
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeQuery(query: any): any {
    if (!query) return {};
    
    const sanitized = { ...query };
    
    // Remove sensitive query parameters
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'apikey'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-session-token'
    ];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private isHealthcareEndpoint(url: string): boolean {
    const healthcarePatterns = [
      '/api/patients',
      '/api/medical-records',
      '/api/sessions',
      '/api/appointments',
      '/api/notes',
      '/api/files',
      '/api/coaching',
      '/api/therapy',
      '/api/analytics',
      '/api/reports'
    ];

    return healthcarePatterns.some(pattern => url.includes(pattern));
  }

  private determineDataType(url: string): 'phi' | 'pii' | 'general' | 'system' {
    if (url.includes('/patients') || url.includes('/medical-records') || url.includes('/sessions')) {
      return 'phi'; // Protected Health Information
    }
    
    if (url.includes('/users') || url.includes('/profile') || url.includes('/contact')) {
      return 'pii'; // Personally Identifiable Information
    }
    
    if (url.includes('/health') || url.includes('/metrics') || url.includes('/status')) {
      return 'system';
    }
    
    return 'general';
  }
}