import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class EnhancedThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: any,
    storageService: any,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const request = req as Request & { user?: { sub?: string; id?: string } };
    
    // Use user ID if authenticated, otherwise fall back to IP
    const userId = request.user?.sub || request.user?.id;
    if (userId) {
      return `user-${userId}`;
    }

    // Enhanced IP tracking with X-Forwarded-For support
    const forwardedFor = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];
    const ip = forwardedFor || realIp || request.connection.remoteAddress || request.ip;
    
    return `ip-${Array.isArray(ip) ? ip[0] : ip}`;
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const endpoint = `${request.method} ${request.route?.path || request.url}`;
    
    // Log rate limit violations for security monitoring
    console.warn(`Rate limit exceeded for ${await this.getTracker(request)} on ${endpoint}`);
    
    throw new ThrottlerException('Too many requests. Please try again later.');
  }

  private getTimeUntilReset(): number {
    // Return seconds until rate limit resets
    return 60; // 1 minute default
  }
}