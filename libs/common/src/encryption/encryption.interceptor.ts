import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AdvancedEncryptionService } from './advanced-encryption.service';
import { EncryptionMetadata, EncryptedEntity } from './database-encryption.decorator';

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EncryptionInterceptor.name);

  constructor(private readonly encryptionService: AdvancedEncryptionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const encryptionContext = this.createEncryptionContext(request);

    return next.handle().pipe(
      map(async (data) => {
        if (data) {
          return await this.processResponseData(data, encryptionContext);
        }
        return data;
      }),
      catchError(async (error) => {
        this.logger.error('Encryption interceptor error:', error);
        throw error;
      })
    );
  }

  /**
   * Process response data for encryption/decryption
   */
  private async processResponseData(data: any, context: any): Promise<any> {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.processResponseData(item, context)));
    }

    // Handle objects with encrypted entities
    if (typeof data === 'object' && data.constructor) {
      // Check if it's an encrypted entity
      if (data instanceof EncryptedEntity) {
        await data.decryptFields(this.encryptionService, context);
        return data;
      }

      // Check if it has encrypted fields using metadata
      const encryptedFields = EncryptionMetadata.getEncryptedFields(data.constructor);
      if (encryptedFields.length > 0) {
        await this.decryptEntityFields(data, encryptedFields, context);
      }

      // Recursively process nested objects
      for (const key in data) {
        if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
          data[key] = await this.processResponseData(data[key], context);
        }
      }
    }

    return data;
  }

  /**
   * Decrypt entity fields
   */
  private async decryptEntityFields(
    entity: any,
    encryptedFields: Array<{ field: string | symbol; options: any }>,
    context: any
  ): Promise<void> {
    for (const { field, options } of encryptedFields) {
      const value = entity[field];
      
      if (value && typeof value === 'string' && this.isEncryptedValue(value)) {
        try {
          const encryptedData = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
          const decrypted = await this.encryptionService.decryptData(encryptedData, {
            expectedDataType: options.dataType || 'entity_field',
            userId: context?.userId,
            validateMetadata: true
          });
          
          entity[field] = decrypted.toString('utf8');
          
        } catch (error) {
          this.logger.error(`Failed to decrypt field ${field.toString()}:`, error);
          // Don't throw error, just log it to prevent breaking the response
        }
      }
    }
  }

  /**
   * Check if a value is encrypted
   */
  private isEncryptedValue(value: string): boolean {
    try {
      const parsed = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
      return !!(parsed.data && parsed.iv && parsed.keyVersion && parsed.algorithm);
    } catch {
      return false;
    }
  }

  /**
   * Create encryption context from request
   */
  private createEncryptionContext(request: any): any {
    return {
      userId: request.user?.id,
      userAgent: request.get('user-agent'),
      ipAddress: request.ip,
      sessionId: request.sessionID,
      timestamp: new Date(),
      service: 'encryption-interceptor'
    };
  }
}

/**
 * Request encryption interceptor for handling encrypted data in requests
 */
@Injectable()
export class RequestEncryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestEncryptionInterceptor.name);

  constructor(private readonly encryptionService: AdvancedEncryptionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const encryptionContext = this.createEncryptionContext(request);

    // Process request body for entities that need encryption
    if (request.body && typeof request.body === 'object') {
      this.processRequestData(request.body, encryptionContext);
    }

    return next.handle();
  }

  /**
   * Process request data for encryption before saving
   */
  private async processRequestData(data: any, context: any): Promise<void> {
    if (!data) return;

    // Handle arrays
    if (Array.isArray(data)) {
      for (const item of data) {
        await this.processRequestData(item, context);
      }
      return;
    }

    // Handle objects with entities that need encryption
    if (typeof data === 'object' && data.constructor) {
      // Check if it's an encrypted entity
      if (data instanceof EncryptedEntity) {
        await data.encryptFields(this.encryptionService, context);
        return;
      }

      // Check if it has encrypted fields using metadata
      const encryptedFields = EncryptionMetadata.getEncryptedFields(data.constructor);
      if (encryptedFields.length > 0) {
        await this.encryptEntityFields(data, encryptedFields, context);
      }

      // Recursively process nested objects
      for (const key in data) {
        if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
          await this.processRequestData(data[key], context);
        }
      }
    }
  }

  /**
   * Encrypt entity fields
   */
  private async encryptEntityFields(
    entity: any,
    encryptedFields: Array<{ field: string | symbol; options: any }>,
    context: any
  ): Promise<void> {
    for (const { field, options } of encryptedFields) {
      const value = entity[field];
      
      if (value && typeof value === 'string' && !this.isEncryptedValue(value)) {
        try {
          const encrypted = await this.encryptionService.encryptData(value, {
            dataType: options.dataType || 'entity_field',
            userId: context?.userId,
            compressionEnabled: options.compressionEnabled,
            customMetadata: {
              entityClass: entity.constructor.name,
              fieldName: field.toString(),
              ...options.customMetadata,
              ...context
            }
          });
          
          entity[field] = Buffer.from(JSON.stringify(encrypted)).toString('base64');
          
          // Create search hash if searchable
          if (options.searchable) {
            const hashField = `${field.toString()}_hash`;
            entity[hashField] = this.createSearchHash(value);
          }
          
        } catch (error) {
          this.logger.error(`Failed to encrypt field ${field.toString()}:`, error);
          throw new Error(`Encryption failed for field ${field.toString()}`);
        }
      }
    }
  }

  /**
   * Check if a value is already encrypted
   */
  private isEncryptedValue(value: string): boolean {
    try {
      const parsed = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
      return !!(parsed.data && parsed.iv && parsed.keyVersion && parsed.algorithm);
    } catch {
      return false;
    }
  }

  /**
   * Create search hash for encrypted field
   */
  private createSearchHash(value: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(value.toLowerCase()).digest('hex');
  }

  /**
   * Create encryption context from request
   */
  private createEncryptionContext(request: any): any {
    return {
      userId: request.user?.id,
      userAgent: request.get('user-agent'),
      ipAddress: request.ip,
      sessionId: request.sessionID,
      timestamp: new Date(),
      service: 'request-encryption-interceptor'
    };
  }
}

/**
 * File encryption interceptor for handling file uploads/downloads
 */
@Injectable()
export class FileEncryptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FileEncryptionInterceptor.name);

  constructor(private readonly encryptionService: AdvancedEncryptionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Handle file uploads
    if (request.files || request.file) {
      return this.handleFileUpload(request, next);
    }

    // Handle file downloads
    if (this.isFileDownload(request)) {
      return this.handleFileDownload(request, response, next);
    }

    return next.handle();
  }

  /**
   * Handle encrypted file uploads
   */
  private handleFileUpload(request: any, next: CallHandler): Observable<any> {
    const encryptionContext = {
      userId: request.user?.id,
      userAgent: request.get('user-agent'),
      ipAddress: request.ip,
      sessionId: request.sessionID,
      service: 'file-encryption-interceptor'
    };

    // Process files for encryption
    const files = request.files || (request.file ? [request.file] : []);
    
    return next.handle().pipe(
      map(async (result) => {
        // Encrypt uploaded files if marked for encryption
        for (const file of files) {
          if (this.shouldEncryptFile(file, request)) {
            try {
              const encryptedPath = `${file.path}.encrypted`;
              await this.encryptionService.encryptFile(
                file.path,
                encryptedPath,
                {
                  deleteOriginal: true,
                  metadata: {
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    uploadedBy: request.user?.id,
                    ...encryptionContext
                  }
                }
              );
              
              // Update file path in result
              if (result && result.file) {
                result.file.path = encryptedPath;
                result.file.encrypted = true;
              }
              
            } catch (error) {
              this.logger.error('File encryption failed:', error);
              throw error;
            }
          }
        }
        
        return result;
      })
    );
  }

  /**
   * Handle encrypted file downloads
   */
  private handleFileDownload(request: any, response: any, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(async (result) => {
        // Check if file needs decryption
        if (result && result.filePath && this.isEncryptedFile(result.filePath)) {
          try {
            const decryptedPath = `${result.filePath}.decrypted`;
            await this.encryptionService.decryptFile(
              result.filePath,
              decryptedPath,
              `${result.filePath}.meta`,
              { deleteEncrypted: false }
            );
            
            // Update result to point to decrypted file
            result.filePath = decryptedPath;
            
            // Clean up decrypted file after response is sent
            response.on('finish', () => {
              const fs = require('fs');
              if (fs.existsSync(decryptedPath)) {
                fs.unlinkSync(decryptedPath);
              }
            });
            
          } catch (error) {
            this.logger.error('File decryption failed:', error);
            throw error;
          }
        }
        
        return result;
      })
    );
  }

  /**
   * Check if file should be encrypted
   */
  private shouldEncryptFile(file: any, request: any): boolean {
    // Encrypt files in healthcare/PHI contexts
    const encryptionPaths = ['/api/files/upload', '/api/recordings', '/api/medical-records'];
    const shouldEncrypt = encryptionPaths.some(path => request.url.includes(path));
    
    // Also encrypt based on file metadata or request parameters
    const encryptParam = request.query?.encrypt === 'true' || request.body?.encrypt === true;
    
    return shouldEncrypt || encryptParam;
  }

  /**
   * Check if this is a file download request
   */
  private isFileDownload(request: any): boolean {
    return request.url.includes('/download') || 
           request.url.includes('/files/') ||
           request.method === 'GET' && request.query?.file;
  }

  /**
   * Check if file is encrypted
   */
  private isEncryptedFile(filePath: string): boolean {
    const fs = require('fs');
    const metaPath = `${filePath}.meta`;
    
    return fs.existsSync(metaPath) && filePath.includes('.encrypted');
  }
}