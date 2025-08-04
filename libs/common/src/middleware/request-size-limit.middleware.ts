import { Injectable, NestMiddleware, PayloadTooLargeException, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

export interface RequestSizeLimitConfig {
  maxBodySize: number; // in bytes
  maxFileSize: number; // in bytes
  maxFiles: number;
  allowedMimeTypes: string[];
  maxUrlLength: number;
  maxHeaderSize: number;
}

@Injectable()
export class RequestSizeLimitMiddleware implements NestMiddleware {
  private readonly config: RequestSizeLimitConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      maxBodySize: this.parseSize(this.configService.get('MAX_BODY_SIZE', '10mb')),
      maxFileSize: this.parseSize(this.configService.get('MAX_FILE_SIZE', '500mb')),
      maxFiles: parseInt(this.configService.get('MAX_FILES', '10')),
      allowedMimeTypes: this.configService.get('ALLOWED_MIME_TYPES', 
        'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/mov,video/avi,audio/mp3,audio/wav,audio/m4a,audio/webm,application/pdf,text/plain'
      ).split(','),
      maxUrlLength: parseInt(this.configService.get('MAX_URL_LENGTH', '2048')),
      maxHeaderSize: parseInt(this.configService.get('MAX_HEADER_SIZE', '8192')),
    };
  }

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate URL length
      this.validateUrlLength(req);
      
      // Validate headers size
      this.validateHeadersSize(req);
      
      // Validate content type and size for requests with body
      if (this.hasBody(req)) {
        this.validateContentType(req);
        this.validateBodySize(req);
      }
      
      // Add request size tracking
      this.trackRequestSize(req);
      
      next();
    } catch (error) {
      next(error);
    }
  }

  private validateUrlLength(req: Request): void {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    
    if (fullUrl.length > this.config.maxUrlLength) {
      throw new BadRequestException(
        `URL length exceeds maximum allowed size of ${this.config.maxUrlLength} characters`
      );
    }
  }

  private validateHeadersSize(req: Request): void {
    const headersString = JSON.stringify(req.headers);
    
    if (headersString.length > this.config.maxHeaderSize) {
      throw new BadRequestException(
        `Request headers size exceeds maximum allowed size of ${this.config.maxHeaderSize} bytes`
      );
    }
  }

  private validateContentType(req: Request): void {
    const contentType = req.get('content-type');
    
    if (!contentType) {
      return; // Allow requests without content-type
    }

    // Extract base content type (ignore charset, boundary, etc.)
    const baseContentType = contentType.split(';')[0].trim().toLowerCase();
    
    // Allow common API content types
    const allowedApiTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'text/plain',
      'multipart/form-data'
    ];

    // Check if it's a file upload or API call
    const isFileUpload = baseContentType === 'multipart/form-data';
    const isApiCall = allowedApiTypes.includes(baseContentType);
    
    if (!isApiCall && !isFileUpload) {
      // For other content types, check against allowed MIME types
      if (!this.config.allowedMimeTypes.includes(baseContentType)) {
        throw new BadRequestException(
          `Content type '${baseContentType}' is not allowed`
        );
      }
    }
  }

  private validateBodySize(req: Request): void {
    const contentLength = req.get('content-length');
    
    if (contentLength) {
      const size = parseInt(contentLength);
      const contentType = req.get('content-type')?.split(';')[0].trim().toLowerCase();
      
      // Use different limits for different content types
      if (contentType === 'multipart/form-data') {
        // File uploads can be larger
        if (size > this.config.maxFileSize) {
          throw new PayloadTooLargeException(
            `File size exceeds maximum allowed size of ${this.formatSize(this.config.maxFileSize)}`
          );
        }
      } else {
        // Regular API requests have smaller limits
        if (size > this.config.maxBodySize) {
          throw new PayloadTooLargeException(
            `Request body size exceeds maximum allowed size of ${this.formatSize(this.config.maxBodySize)}`
          );
        }
      }
    }
  }

  private hasBody(req: Request): boolean {
    const method = req.method.toLowerCase();
    return ['post', 'put', 'patch'].includes(method);
  }

  private trackRequestSize(req: Request): void {
    // Add request size information to request object for monitoring
    const contentLength = req.get('content-length');
    const urlLength = req.originalUrl.length;
    const headersSize = JSON.stringify(req.headers).length;
    
    (req as any).sizeInfo = {
      contentLength: contentLength ? parseInt(contentLength) : 0,
      urlLength,
      headersSize,
      totalSize: (contentLength ? parseInt(contentLength) : 0) + urlLength + headersSize,
    };
  }

  private parseSize(sizeStr: string): number {
    const units = {
      'b': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024,
    };

    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    
    if (!match) {
      throw new Error(`Invalid size format: ${sizeStr}`);
    }

    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    
    return Math.floor(value * units[unit]);
  }

  private formatSize(bytes: number): string {
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