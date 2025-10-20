/**
 * Metrics Interceptor
 * Automatically collects metrics for all HTTP requests
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from '../monitoring/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    const method = request.method;
    const endpoint = this.getEndpoint(request);
    
    return next
      .handle()
      .pipe(
        tap({
          next: () => {
            const responseTime = Date.now() - startTime;
            const statusCode = response.statusCode;
            
            // Record the request metrics
            this.metricsService.recordRequest(endpoint, method, statusCode, responseTime);
            
            // Log slow requests
            if (responseTime > 1000) {
              this.logger.warn(`Slow request: ${method} ${endpoint} - ${responseTime}ms - Status: ${statusCode}`);
            }
          },
          error: (error) => {
            const responseTime = Date.now() - startTime;
            const statusCode = error.status || 500;
            
            // Record the failed request
            this.metricsService.recordRequest(endpoint, method, statusCode, responseTime);
            
            // Log the error
            this.logger.error(`Request failed: ${method} ${endpoint} - ${responseTime}ms - Status: ${statusCode} - Error: ${error.message}`);
          }
        })
      );
  }

  private getEndpoint(request: Request): string {
    // Get the route pattern instead of the exact path for better grouping
    const route = request.route?.path || request.path;
    
    // Normalize common ID patterns
    const normalizedRoute = route
      .replace(/\/\d+/g, '/:id')           // Replace numeric IDs
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid') // Replace UUIDs
      .replace(/\/[a-f0-9]{24}/g, '/:objectId'); // Replace MongoDB ObjectIds
    
    return normalizedRoute;
  }
}