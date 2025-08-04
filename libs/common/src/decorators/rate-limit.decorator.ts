import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  ttl: number; // Time to live in milliseconds
  limit: number; // Request limit
  skipIf?: (request: any) => boolean;
  message?: string;
}

/**
 * Custom rate limiting decorator for specific endpoints
 * @param options Rate limiting configuration
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Strict rate limiting for sensitive endpoints (login, password reset)
 */
export const StrictRateLimit = () =>
  RateLimit({
    ttl: 900000, // 15 minutes
    limit: 5, // 5 attempts per 15 minutes
    message: 'Too many attempts. Please try again in 15 minutes.',
  });

/**
 * Moderate rate limiting for API endpoints
 */
export const ModerateRateLimit = () =>
  RateLimit({
    ttl: 60000, // 1 minute
    limit: 30, // 30 requests per minute
  });

/**
 * Lenient rate limiting for read-only endpoints
 */
export const LenientRateLimit = () =>
  RateLimit({
    ttl: 60000, // 1 minute
    limit: 100, // 100 requests per minute
  });