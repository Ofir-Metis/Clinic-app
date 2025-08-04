import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString, IsNumber, IsArray, IsOptional, MaxLength, Min, Max, validate } from 'class-validator';

export const PAYLOAD_VALIDATION_KEY = 'payload_validation';

export interface PayloadValidationOptions {
  maxSize?: number;
  allowedFields?: string[];
  requiredFields?: string[];
  maxDepth?: number;
  maxArrayLength?: number;
  sanitize?: boolean;
}

/**
 * Decorator to enforce payload validation rules
 */
export const PayloadValidation = (options: PayloadValidationOptions) =>
  SetMetadata(PAYLOAD_VALIDATION_KEY, options);

/**
 * Decorator for safe file upload validation
 */
export const ValidatedFileUpload = createParamDecorator(
  (options: { maxSize?: number; allowedTypes?: string[] }, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const files = request.files || request.file;
    
    if (!files) {
      return null;
    }

    const maxSize = options?.maxSize || 500 * 1024 * 1024; // 500MB default
    const allowedTypes = options?.allowedTypes || [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/mov', 'video/avi', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm',
      'application/pdf', 'text/plain'
    ];

    const validateFile = (file: any) => {
      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`);
      }

      // Validate MIME type
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(`File type '${file.mimetype}' is not allowed`);
      }

      // Validate filename
      if (!file.originalname || file.originalname.length > 255) {
        throw new Error('Invalid filename');
      }

      // Check for dangerous file extensions
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
      const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
      
      if (dangerousExtensions.includes(fileExtension)) {
        throw new Error(`File extension '${fileExtension}' is not allowed`);
      }

      return {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
        filename: file.filename,
      };
    };

    // Handle single file or array of files
    if (Array.isArray(files)) {
      return files.map(validateFile);
    } else {
      return validateFile(files);
    }
  },
);

/**
 * Decorator for validated JSON payload with size and structure limits
 */
export const ValidatedPayload = createParamDecorator(
  (options: PayloadValidationOptions = {}, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body;

    if (!body) {
      return body;
    }

    // Validate payload size
    const bodyString = JSON.stringify(body);
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    
    if (bodyString.length > maxSize) {
      throw new Error(`Payload size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    // Validate object depth to prevent deeply nested attacks
    const maxDepth = options.maxDepth || 10;
    if (getObjectDepth(body) > maxDepth) {
      throw new Error(`Payload structure exceeds maximum depth of ${maxDepth} levels`);
    }

    // Validate array lengths
    const maxArrayLength = options.maxArrayLength || 1000;
    validateArrayLengths(body, maxArrayLength);

    // Validate allowed fields if specified
    if (options.allowedFields) {
      validateAllowedFields(body, options.allowedFields);
    }

    // Check required fields
    if (options.requiredFields) {
      validateRequiredFields(body, options.requiredFields);
    }

    // Sanitize if requested
    if (options.sanitize) {
      return sanitizePayload(body);
    }

    return body;
  },
);

/**
 * Transform decorator for safe string input with length limits
 */
export function SafeString(maxLength: number = 1000) {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    // Limit length
    let sanitized = value.substring(0, maxLength);
    
    // Remove dangerous patterns
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:\s*text\/html/gi, '');

    return sanitized.trim();
  });
}

/**
 * Transform decorator for safe numeric input
 */
export function SafeNumber(min?: number, max?: number) {
  return Transform(({ value }) => {
    const num = Number(value);
    
    if (isNaN(num)) {
      throw new Error('Invalid number format');
    }
    
    if (min !== undefined && num < min) {
      throw new Error(`Number must be at least ${min}`);
    }
    
    if (max !== undefined && num > max) {
      throw new Error(`Number must be at most ${max}`);
    }
    
    return num;
  });
}

/**
 * DTO class for safe user input validation
 */
export class SafeUserInputDto {
  @IsString()
  @MaxLength(100)
  @SafeString(100)
  name: string;

  @IsString()
  @MaxLength(500)
  @SafeString(500)
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(999999)
  @SafeNumber(0, 999999)
  @IsOptional()
  value?: number;

  @IsArray()
  @MaxLength(50, { each: true })
  @IsOptional()
  tags?: string[];
}

// Helper functions
function getObjectDepth(obj: any, depth = 0): number {
  if (obj === null || typeof obj !== 'object') {
    return depth;
  }

  let maxDepth = depth;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentDepth = getObjectDepth(obj[key], depth + 1);
      maxDepth = Math.max(maxDepth, currentDepth);
    }
  }

  return maxDepth;
}

function validateArrayLengths(obj: any, maxLength: number): void {
  if (Array.isArray(obj)) {
    if (obj.length > maxLength) {
      throw new Error(`Array length exceeds maximum allowed length of ${maxLength}`);
    }
    obj.forEach(item => validateArrayLengths(item, maxLength));
  } else if (obj !== null && typeof obj === 'object') {
    Object.values(obj).forEach(value => validateArrayLengths(value, maxLength));
  }
}

function validateAllowedFields(obj: any, allowedFields: string[]): void {
  if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !allowedFields.includes(key)) {
        throw new Error(`Field '${key}' is not allowed`);
      }
      
      if (typeof obj[key] === 'object') {
        validateAllowedFields(obj[key], allowedFields);
      }
    }
  }
}

function validateRequiredFields(obj: any, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
      throw new Error(`Required field '${field}' is missing`);
    }
  }
}

function sanitizePayload(obj: any): any {
  if (typeof obj === 'string') {
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:\s*text\/html/gi, '')
      .trim();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizePayload(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}