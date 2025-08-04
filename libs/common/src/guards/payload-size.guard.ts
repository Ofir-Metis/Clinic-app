import { Injectable, CanActivate, ExecutionContext, PayloadTooLargeException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PAYLOAD_VALIDATION_KEY, PayloadValidationOptions } from '../decorators/payload-validation.decorator';
import { Request } from 'express';

@Injectable()
export class PayloadSizeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Get validation options from decorator
    const validationOptions = this.reflector.getAllAndOverride<PayloadValidationOptions>(
      PAYLOAD_VALIDATION_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Apply default validation if no specific options are set
    const options: PayloadValidationOptions = {
      maxSize: 10 * 1024 * 1024, // 10MB default
      maxDepth: 10,
      maxArrayLength: 1000,
      sanitize: true,
      ...validationOptions
    };

    try {
      // Validate content length
      this.validateContentLength(request, options);
      
      // Validate payload structure if body exists
      if (request.body) {
        this.validatePayloadStructure(request.body, options);
      }
      
      return true;
    } catch (error) {
      if (error instanceof PayloadTooLargeException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  private validateContentLength(request: Request, options: PayloadValidationOptions): void {
    const contentLength = request.get('content-length');
    
    if (contentLength) {
      const size = parseInt(contentLength);
      const contentType = request.get('content-type')?.split(';')[0].trim().toLowerCase();
      
      // Different limits for different content types
      let maxSize = options.maxSize!;
      
      if (contentType === 'multipart/form-data') {
        // File uploads can be larger (500MB default)
        maxSize = 500 * 1024 * 1024;
      }
      
      if (size > maxSize) {
        throw new PayloadTooLargeException(
          `Request size ${this.formatBytes(size)} exceeds maximum allowed size of ${this.formatBytes(maxSize)}`
        );
      }
    }
  }

  private validatePayloadStructure(payload: any, options: PayloadValidationOptions): void {
    // Validate JSON string size
    const payloadString = JSON.stringify(payload);
    if (payloadString.length > options.maxSize!) {
      throw new PayloadTooLargeException(
        `Payload size exceeds maximum allowed size of ${this.formatBytes(options.maxSize!)}`
      );
    }

    // Validate object depth
    const depth = this.getObjectDepth(payload);
    if (depth > options.maxDepth!) {
      throw new BadRequestException(
        `Payload structure exceeds maximum depth of ${options.maxDepth} levels`
      );
    }

    // Validate array lengths
    this.validateArrayLengths(payload, options.maxArrayLength!);

    // Validate field count to prevent object bomb attacks
    const fieldCount = this.countFields(payload);
    const maxFields = 1000; // Reasonable limit
    if (fieldCount > maxFields) {
      throw new BadRequestException(
        `Payload contains too many fields (${fieldCount}). Maximum allowed: ${maxFields}`
      );
    }

    // Validate string lengths
    this.validateStringLengths(payload);
  }

  private getObjectDepth(obj: any, currentDepth = 0): number {
    if (obj === null || typeof obj !== 'object') {
      return currentDepth;
    }

    let maxDepth = currentDepth;
    
    if (Array.isArray(obj)) {
      for (const item of obj) {
        maxDepth = Math.max(maxDepth, this.getObjectDepth(item, currentDepth + 1));
      }
    } else {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          maxDepth = Math.max(maxDepth, this.getObjectDepth(obj[key], currentDepth + 1));
        }
      }
    }

    return maxDepth;
  }

  private validateArrayLengths(obj: any, maxLength: number): void {
    if (Array.isArray(obj)) {
      if (obj.length > maxLength) {
        throw new BadRequestException(
          `Array length ${obj.length} exceeds maximum allowed length of ${maxLength}`
        );
      }
      
      obj.forEach(item => this.validateArrayLengths(item, maxLength));
    } else if (obj !== null && typeof obj === 'object') {
      Object.values(obj).forEach(value => this.validateArrayLengths(value, maxLength));
    }
  }

  private countFields(obj: any): number {
    if (obj === null || typeof obj !== 'object') {
      return 0;
    }

    let count = 0;
    
    if (Array.isArray(obj)) {
      obj.forEach(item => {
        count += this.countFields(item);
      });
    } else {
      count += Object.keys(obj).length;
      Object.values(obj).forEach(value => {
        count += this.countFields(value);
      });
    }

    return count;
  }

  private validateStringLengths(obj: any): void {
    const maxStringLength = 100000; // 100KB per string
    
    if (typeof obj === 'string') {
      if (obj.length > maxStringLength) {
        throw new BadRequestException(
          `String length ${obj.length} exceeds maximum allowed length of ${maxStringLength}`
        );
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(item => this.validateStringLengths(item));
    } else if (obj !== null && typeof obj === 'object') {
      Object.values(obj).forEach(value => this.validateStringLengths(value));
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }
}