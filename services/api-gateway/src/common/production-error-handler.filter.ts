/**
 * Production Error Handler Filter
 * Comprehensive error handling with logging, monitoring, and security
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MetricsService } from '../monitoring/metrics.service';
import { ProductionConfigService } from '../config/production.config';
import { CentralizedLoggerService } from '@clinic/common';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  correlationId: string;
  requestId?: string;
}

@Injectable()
@Catch()
export class ProductionErrorHandlerFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProductionErrorHandlerFilter.name);

  constructor(
    private readonly metricsService: MetricsService,
    private readonly productionConfig: ProductionConfigService,
    private readonly loggerService: CentralizedLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const correlationId = this.generateCorrelationId();
    const requestId = (request as any).id || 'unknown';
    
    // Determine error details
    const { statusCode, message, error } = this.extractErrorDetails(exception);
    
    // Log the error with context
    this.logError(exception, request, correlationId, statusCode);
    
    // Record error metrics
    this.recordErrorMetrics(request, statusCode);
    
    // Create standardized error response
    const errorResponse = this.createErrorResponse({
      statusCode,
      message,
      error,
      request,
      correlationId,
      requestId,
    });
    
    // Send response
    response.status(statusCode).json(errorResponse);
  }

  private extractErrorDetails(exception: unknown): {
    statusCode: number;
    message: string;
    error?: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      
      if (typeof response === 'string') {
        return {
          statusCode: status,
          message: response,
          error: exception.name,
        };
      } else if (typeof response === 'object' && response !== null) {
        const responseObj = response as any;
        return {
          statusCode: status,
          message: responseObj.message || exception.message,
          error: responseObj.error || exception.name,
        };
      }
      
      return {
        statusCode: status,
        message: exception.message,
        error: exception.name,
      };
    }
    
    // Handle non-HTTP exceptions
    if (exception instanceof Error) {
      // Check for specific error types
      if (exception.name === 'ValidationError') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          error: 'ValidationError',
        };
      }
      
      if (exception.name === 'CastError' || exception.message.includes('Cast to ObjectId failed')) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid resource identifier',
          error: 'CastError',
        };
      }
      
      if (exception.name === 'TimeoutError') {
        return {
          statusCode: HttpStatus.GATEWAY_TIMEOUT,
          message: 'Request timeout',
          error: 'TimeoutError',
        };
      }
      
      // Database connection errors
      if (exception.message.includes('ECONNREFUSED') || exception.message.includes('Connection terminated')) {
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Service temporarily unavailable',
          error: 'ServiceUnavailable',
        };
      }
      
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: this.productionConfig.isProduction() ? 'Internal server error' : exception.message,
        error: exception.name,
      };
    }
    
    // Unknown error type
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: 'UnknownError',
    };
  }

  private createErrorResponse(params: {
    statusCode: number;
    message: string;
    error?: string;
    request: Request;
    correlationId: string;
    requestId: string;
  }): ErrorResponse {
    const { statusCode, message, error, request, correlationId, requestId } = params;
    
    const response: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      correlationId,
      requestId,
    };
    
    // Only include error type in non-production or for client errors
    if (!this.productionConfig.isProduction() || statusCode < 500) {
      response.error = error;
    }
    
    return response;
  }

  private logError(
    exception: unknown,
    request: Request,
    correlationId: string,
    statusCode: number,
  ): void {
    const userId = (request as any).user?.id || 'anonymous';
    const userAgent = request.get('User-Agent') || 'unknown';
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    
    const context = {
      correlationId,
      userId,
      ip,
      userAgent,
      method: request.method,
      url: request.url,
      query: request.query,
      params: request.params,
      statusCode,
    };
    
    // Log different levels based on error severity
    if (statusCode >= 500) {
      // Server errors - high priority
      this.loggerService.error({
        message: 'Server error occurred',
        error: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        context,
        level: 'error',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
      });
    } else if (statusCode >= 400) {
      // Client errors - medium priority
      this.loggerService.warn({
        message: 'Client error occurred',
        error: exception instanceof Error ? exception.message : String(exception),
        context,
        level: 'warn',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Security-related errors
    if (statusCode === HttpStatus.UNAUTHORIZED || statusCode === HttpStatus.FORBIDDEN) {
      this.loggerService.warn({
        message: 'Security violation detected',
        context: {
          ...context,
          securityEvent: true,
          severity: 'medium',
        },
        level: 'warn',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private recordErrorMetrics(request: Request, statusCode: number): void {
    try {
      // This will be recorded by the MetricsInterceptor as well,
      // but we can add additional error-specific metrics here
      const endpoint = this.normalizeEndpoint(request.url);
      
      // Record error by type
      if (statusCode >= 500) {
        this.logger.error(`Server error on ${request.method} ${endpoint} - Status: ${statusCode}`);
      } else if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
        this.logger.warn(`Rate limit exceeded on ${request.method} ${endpoint}`);
      } else if (statusCode === HttpStatus.UNAUTHORIZED) {
        this.logger.warn(`Unauthorized access attempt on ${request.method} ${endpoint}`);
      }
      
    } catch (error) {
      // Don't let metrics recording fail the error response
      this.logger.error('Failed to record error metrics:', error.message);
    }
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeEndpoint(url: string): string {
    return url
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\/[a-f0-9]{24}/g, '/:objectId')
      .split('?')[0]; // Remove query parameters
  }
}