import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { Transform } from 'class-transformer';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }
    return value;
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') return str;
    
    return str
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove javascript: urls
      .replace(/javascript:/gi, '')
      // Remove on* event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove data: urls (potential XSS)
      .replace(/data:\s*text\/html/gi, '')
      // Basic HTML sanitization - remove dangerous tags
      .replace(/<(iframe|object|embed|form|meta|link|style)[^>]*>/gi, '')
      // Trim whitespace
      .trim();
  }
}

/**
 * Decorator to apply string sanitization to class properties
 */
export function Sanitize() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/data:\s*text\/html/gi, '')
        .replace(/<(iframe|object|embed|form|meta|link|style)[^>]*>/gi, '')
        .trim();
    }
    return value;
  });
}

/**
 * Decorator for strict HTML sanitization (removes all HTML)
 */
export function StrictSanitize() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .replace(/<[^>]*>/g, '') // Remove all HTML tags
        .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities
        .trim();
    }
    return value;
  });
}