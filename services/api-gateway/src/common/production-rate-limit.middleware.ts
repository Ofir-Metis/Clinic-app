/**
 * Production Rate Limiting Middleware
 * Configurable rate limiting based on production configuration
 */

import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ProductionConfigService } from '../config/production.config';
import { MetricsService } from '../monitoring/metrics.service';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class ProductionRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ProductionRateLimitMiddleware.name);
  private readonly clientRequests = new Map<string, RateLimitEntry>();
  
  private rateLimitWindow: number;
  private rateLimitMax: number;

  constructor(
    private readonly productionConfig: ProductionConfigService,
    private readonly metricsService: MetricsService,
  ) {
    const securityConfig = this.productionConfig.getSecurityConfig();
    this.rateLimitWindow = securityConfig.rateLimitWindow;
    this.rateLimitMax = securityConfig.rateLimitMax;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const clientId = this.getClientIdentifier(req);
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanupExpiredEntries(now);
    
    // Get or create rate limit entry
    let entry = this.clientRequests.get(clientId);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.rateLimitWindow
      };
      this.clientRequests.set(clientId, entry);
    }
    
    // Check rate limit
    if (entry.count >= this.rateLimitMax) {
      const timeUntilReset = Math.ceil((entry.resetTime - now) / 1000);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': this.rateLimitMax.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': entry.resetTime.toString(),
        'Retry-After': timeUntilReset.toString(),
      });
      
      // Log rate limit violation
      this.logger.warn(`Rate limit exceeded for client ${clientId}. ${entry.count} requests in window.`);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          error: 'Rate limit exceeded',
          retryAfter: timeUntilReset,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    
    // Increment request count
    entry.count++;
    
    // Set rate limit headers
    const remaining = Math.max(0, this.rateLimitMax - entry.count);
    res.set({
      'X-RateLimit-Limit': this.rateLimitMax.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': entry.resetTime.toString(),
    });
    
    next();
  }

  private getClientIdentifier(req: Request): string {
    // Use multiple factors for client identification
    const forwarded = req.headers['x-forwarded-for'] as string;
    const realIp = req.headers['x-real-ip'] as string;
    const remoteAddress = req.connection?.remoteAddress;
    
    const ip = forwarded?.split(',')[0]?.trim() || realIp || remoteAddress || 'unknown';
    
    // Include user agent for additional uniqueness (hashed to avoid storing full UA)
    const userAgent = req.headers['user-agent'] || '';
    const userAgentHash = this.simpleHash(userAgent);
    
    return `${ip}:${userAgentHash}`;
  }
  
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private cleanupExpiredEntries(now: number): void {
    // Remove entries that have expired (run occasionally)
    if (Math.random() < 0.01) { // 1% chance per request to trigger cleanup
      for (const [clientId, entry] of this.clientRequests.entries()) {
        if (now > entry.resetTime) {
          this.clientRequests.delete(clientId);
        }
      }
      
      if (this.clientRequests.size > 1000) {
        this.logger.warn(`Rate limit cache has ${this.clientRequests.size} entries, consider tuning cleanup`);
      }
    }
  }
}