import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CacheManagerService, CacheConfig } from './cache-manager.service';
import { CentralizedLoggerService } from '../logging/centralized-logger.service';
import {
  CACHE_KEY,
  CACHE_TTL_KEY,
  CACHE_TAGS_KEY,
  CACHE_NAMESPACE_KEY,
  CACHE_HEALTHCARE_KEY
} from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheManager: CacheManagerService,
    private readonly reflector: Reflector,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Get cache configuration from decorators
    const cacheConfig = this.getCacheConfig(handler, controller);
    
    // Skip caching if not configured or for non-GET requests by default
    if (!cacheConfig || (request.method !== 'GET' && !cacheConfig.cacheNonGet)) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request, cacheConfig);
    const healthcareContext = this.extractHealthcareContext(request);
    
    try {
      // Try to get from cache
      const cachedResult = await this.cacheManager.get(
        cacheKey, 
        cacheConfig, 
        healthcareContext
      );

      if (cachedResult !== null) {
        // Set cache headers
        this.setCacheHeaders(response, 'HIT', cacheConfig);
        
        this.centralizedLogger.performanceLog(
          'Cache hit for HTTP request',
          0,
          {
            ...healthcareContext,
            cacheKey: this.sanitizeCacheKey(cacheKey),
            method: request.method,
            url: request.url,
            cacheHit: true
          }
        );

        return of(cachedResult);
      }

      // Cache miss - execute handler and cache result
      return next.handle().pipe(
        tap(async (result) => {
          try {
            // Only cache successful responses
            if (this.shouldCacheResult(result, response.statusCode, cacheConfig)) {
              await this.cacheManager.set(
                cacheKey,
                result,
                cacheConfig,
                healthcareContext
              );

              this.setCacheHeaders(response, 'MISS', cacheConfig);
              
              this.centralizedLogger.performanceLog(
                'Cache set for HTTP request',
                0,
                {
                  ...healthcareContext,
                  cacheKey: this.sanitizeCacheKey(cacheKey),
                  method: request.method,
                  url: request.url,
                  cacheHit: false,
                  cached: true
                }
              );
            }
          } catch (error) {
            this.centralizedLogger.logError('Failed to cache HTTP response', {
              ...healthcareContext,
              cacheKey: this.sanitizeCacheKey(cacheKey),
              error: error.message,
              method: request.method,
              url: request.url
            });
          }
        })
      );

    } catch (error) {
      this.centralizedLogger.logError('Cache interceptor error', {
        ...healthcareContext,
        error: error.message,
        method: request.method,
        url: request.url
      });

      // Continue without cache on error
      return next.handle();
    }
  }

  private getCacheConfig(handler: Function, controller: Function): CacheConfig | null {
    // Get configuration from method decorator
    const methodConfig = this.reflector.get<Partial<CacheConfig>>(CACHE_KEY, handler);
    
    // Get configuration from class decorator
    const classConfig = this.reflector.get<Partial<CacheConfig>>(CACHE_KEY, controller);
    
    // Get individual cache settings
    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, handler) ||
                this.reflector.get<number>(CACHE_TTL_KEY, controller);
    
    const tags = this.reflector.get<string[]>(CACHE_TAGS_KEY, handler) ||
                 this.reflector.get<string[]>(CACHE_TAGS_KEY, controller) || [];
    
    const namespace = this.reflector.get<string>(CACHE_NAMESPACE_KEY, handler) ||
                      this.reflector.get<string>(CACHE_NAMESPACE_KEY, controller);
    
    const healthcareData = this.reflector.get<boolean>(CACHE_HEALTHCARE_KEY, handler) ||
                           this.reflector.get<boolean>(CACHE_HEALTHCARE_KEY, controller);

    // Merge configurations
    if (methodConfig || classConfig || ttl || tags.length > 0 || namespace || healthcareData) {
      return {
        ttl: ttl || methodConfig?.ttl || classConfig?.ttl || 3600,
        tags: [...tags, ...(methodConfig?.tags || []), ...(classConfig?.tags || [])],
        namespace: namespace || methodConfig?.namespace || classConfig?.namespace,
        healthcareData: healthcareData || methodConfig?.healthcareData || classConfig?.healthcareData,
        hipaaCompliant: healthcareData || methodConfig?.hipaaCompliant || classConfig?.hipaaCompliant,
        encryptionRequired: healthcareData || methodConfig?.encryptionRequired || classConfig?.encryptionRequired,
        serialize: methodConfig?.serialize !== false && classConfig?.serialize !== false,
        compress: methodConfig?.compress || classConfig?.compress,
        cacheNonGet: methodConfig?.cacheNonGet || classConfig?.cacheNonGet,
        ...classConfig,
        ...methodConfig
      };
    }

    return null;
  }

  private generateCacheKey(request: Request, config: CacheConfig): string {
    const components = [
      request.method,
      request.path,
      this.serializeQuery(request.query),
      this.serializeHeaders(request.headers, config),
      request.user?.id || 'anonymous'
    ];

    if (config.includeBody && request.body) {
      components.push(this.serializeBody(request.body, config));
    }

    const baseKey = components.filter(Boolean).join(':');
    
    // Add namespace if specified
    if (config.namespace) {
      return `${config.namespace}:${baseKey}`;
    }

    return baseKey;
  }

  private serializeQuery(query: any): string {
    if (!query || Object.keys(query).length === 0) {
      return '';
    }

    // Sort keys for consistent cache keys
    const sortedKeys = Object.keys(query).sort();
    const serialized = sortedKeys
      .map(key => `${key}=${query[key]}`)
      .join('&');

    return Buffer.from(serialized).toString('base64');
  }

  private serializeHeaders(headers: any, config: CacheConfig): string {
    if (!config.includeHeaders) {
      return '';
    }

    // Only include specific headers that might affect response
    const relevantHeaders = [
      'accept',
      'accept-language',
      'authorization',
      'x-api-version'
    ];

    const headerPairs = relevantHeaders
      .filter(header => headers[header])
      .map(header => `${header}:${headers[header]}`)
      .join('|');

    return headerPairs ? Buffer.from(headerPairs).toString('base64') : '';
  }

  private serializeBody(body: any, config: CacheConfig): string {
    if (!body || typeof body !== 'object') {
      return '';
    }

    try {
      // Sanitize sensitive data from body
      const sanitizedBody = this.sanitizeBody(body, config);
      const serialized = JSON.stringify(sanitizedBody);
      return Buffer.from(serialized).toString('base64');
    } catch (error) {
      this.logger.warn('Failed to serialize request body for cache key', error);
      return '';
    }
  }

  private sanitizeBody(body: any, config: CacheConfig): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'creditCard',
      'ssn',
      'socialSecurityNumber'
    ];

    // Add healthcare-specific sensitive keys
    if (config.healthcareData) {
      sensitiveKeys.push(
        'patientId',
        'medicalRecord',
        'diagnosis',
        'treatment',
        'prescription'
      );
    }

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      const result = Array.isArray(obj) ? [] : {};

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
            result[key] = '[SANITIZED]';
          } else if (typeof obj[key] === 'object') {
            result[key] = sanitizeObject(obj[key]);
          } else {
            result[key] = obj[key];
          }
        }
      }

      return result;
    };

    return sanitizeObject(sanitized);
  }

  private extractHealthcareContext(request: Request): any {
    return {
      requestId: request.headers['x-request-id'] as string,
      correlationId: request.headers['x-correlation-id'] as string,
      userId: request.user?.id || request.user?.sub,
      sessionId: request.sessionID || request.headers['x-session-id'] as string,
      ipAddress: this.getClientIp(request),
      userAgent: request.get('User-Agent'),
      service: process.env.SERVICE_NAME || 'clinic-app',
      method: request.method,
      url: request.url
    };
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

  private shouldCacheResult(result: any, statusCode: number, config: CacheConfig): boolean {
    // Don't cache error responses by default
    if (statusCode >= 400 && !config.cacheErrors) {
      return false;
    }

    // Don't cache null or undefined results by default
    if ((result === null || result === undefined) && !config.cacheNullValues) {
      return false;
    }

    // Don't cache empty arrays or objects by default
    if (config.skipEmptyResults) {
      if (Array.isArray(result) && result.length === 0) {
        return false;
      }
      if (typeof result === 'object' && result !== null && Object.keys(result).length === 0) {
        return false;
      }
    }

    // Custom validation function
    if (config.shouldCache && typeof config.shouldCache === 'function') {
      return config.shouldCache(result, statusCode);
    }

    return true;
  }

  private setCacheHeaders(response: Response, status: 'HIT' | 'MISS', config: CacheConfig): void {
    response.setHeader('X-Cache', status);
    response.setHeader('X-Cache-TTL', config.ttl?.toString() || '3600');
    
    if (config.tags && config.tags.length > 0) {
      response.setHeader('X-Cache-Tags', config.tags.join(','));
    }

    if (status === 'HIT') {
      response.setHeader('X-Cache-Age', '0'); // This would be calculated from actual cache entry
    }

    // Add cache control headers
    if (status === 'HIT' && config.ttl) {
      response.setHeader('Cache-Control', `public, max-age=${config.ttl}`);
    }
  }

  private sanitizeCacheKey(key: string): string {
    // Remove sensitive information from cache keys for logging
    return key.replace(/user:\d+/g, 'user:***')
              .replace(/session:[a-f0-9]+/g, 'session:***')
              .replace(/patient:\d+/g, 'patient:***')
              .replace(/:([A-Za-z0-9+/]{20,})/g, ':***'); // Base64 encoded data
  }
}

// Extended cache configuration interface for interceptor
declare module './cache-manager.service' {
  interface CacheConfig {
    cacheNonGet?: boolean; // Cache non-GET requests
    includeHeaders?: boolean; // Include headers in cache key
    includeBody?: boolean; // Include request body in cache key
    cacheErrors?: boolean; // Cache error responses
    cacheNullValues?: boolean; // Cache null/undefined values
    skipEmptyResults?: boolean; // Skip caching empty arrays/objects
    shouldCache?: (result: any, statusCode: number) => boolean; // Custom cache validation
  }
}