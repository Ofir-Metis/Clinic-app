import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { ValidateIf, IsString, IsOptional } from 'class-validator';
import { AdvancedEncryptionService } from './advanced-encryption.service';

// Metadata keys
export const ENCRYPT_FIELD_KEY = 'encrypt_field';
export const ENCRYPT_OPTIONS_KEY = 'encrypt_options';

// Encryption options interface
export interface EncryptionFieldOptions {
  dataType?: string;
  compressionEnabled?: boolean;
  required?: boolean;
  searchable?: boolean; // If true, also store hash for searching
  customMetadata?: Record<string, any>;
}

/**
 * Decorator to mark entity fields for encryption
 */
export const EncryptField = (options: EncryptionFieldOptions = {}): PropertyDecorator => {
  return (target: any, propertyKey: string | symbol) => {
    // Set encryption metadata
    const existingFields = Reflect.getMetadata(ENCRYPT_FIELD_KEY, target.constructor) || [];
    existingFields.push({ field: propertyKey, options });
    Reflect.defineMetadata(ENCRYPT_FIELD_KEY, existingFields, target.constructor);
    
    // Add class-transformer to handle encryption/decryption during serialization
    Transform(({ value, obj, key, type }) => {
      // This will be handled by the encryption interceptor
      return value;
    })(target, propertyKey);
    
    // Add validation
    if (options.required) {
      IsString()(target, propertyKey);
    } else {
      IsOptional()(target, propertyKey);
      ValidateIf((obj, value) => value !== null && value !== undefined)(target, propertyKey);
    }
  };
};

/**
 * Decorator to mark entire entity class for encryption
 */
export const EncryptEntity = (options: {
  keyRotationDays?: number;
  compressionEnabled?: boolean;
  auditEnabled?: boolean;
  customMetadata?: Record<string, any>;
} = {}): ClassDecorator => {
  return (target: any) => {
    SetMetadata(ENCRYPT_OPTIONS_KEY, options)(target);
  };
};

/**
 * Parameter decorator to inject encryption context
 */
export const EncryptionContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      userId: request.user?.id,
      userAgent: request.get('user-agent'),
      ipAddress: request.ip,
      sessionId: request.sessionID,
      timestamp: new Date(),
      service: 'database-encryption'
    };
  }
);

/**
 * Validation decorator for encrypted fields
 */
export const IsEncrypted = (validationOptions?: {
  message?: string;
}): PropertyDecorator => {
  return (target: any, propertyKey: string | symbol) => {
    // Custom validation logic for encrypted data
    ValidateIf((obj, value) => {
      if (!value) return false;
      
      try {
        // Check if value looks like encrypted data
        const parsed = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
        return parsed.data && parsed.iv && parsed.keyVersion && parsed.algorithm;
      } catch {
        return false;
      }
    }, {
      message: validationOptions?.message || 'Field must contain valid encrypted data'
    })(target, propertyKey);
  };
};

/**
 * Utility class for encryption metadata management
 */
export class EncryptionMetadata {
  /**
   * Get encrypted fields for an entity class
   */
  static getEncryptedFields(entityClass: any): Array<{
    field: string | symbol;
    options: EncryptionFieldOptions;
  }> {
    return Reflect.getMetadata(ENCRYPT_FIELD_KEY, entityClass) || [];
  }

  /**
   * Get encryption options for an entity class
   */
  static getEncryptionOptions(entityClass: any): any {
    return Reflect.getMetadata(ENCRYPT_OPTIONS_KEY, entityClass) || {};
  }

  /**
   * Check if a field is encrypted
   */
  static isFieldEncrypted(entityClass: any, fieldName: string | symbol): boolean {
    const encryptedFields = this.getEncryptedFields(entityClass);
    return encryptedFields.some(field => field.field === fieldName);
  }

  /**
   * Get encryption options for a specific field
   */
  static getFieldEncryptionOptions(
    entityClass: any, 
    fieldName: string | symbol
  ): EncryptionFieldOptions | undefined {
    const encryptedFields = this.getEncryptedFields(entityClass);
    const field = encryptedFields.find(f => f.field === fieldName);
    return field?.options;
  }
}

/**
 * Base entity class with encryption support
 */
export abstract class EncryptedEntity {
  /**
   * Automatically encrypt all marked fields before saving
   */
  async encryptFields(encryptionService: AdvancedEncryptionService, context?: any): Promise<void> {
    const encryptedFields = EncryptionMetadata.getEncryptedFields(this.constructor);
    
    for (const { field, options } of encryptedFields) {
      const value = (this as any)[field];
      
      if (value && typeof value === 'string' && !this.isAlreadyEncrypted(value)) {
        try {
          const encrypted = await encryptionService.encryptData(value, {
            dataType: options.dataType || 'entity_field',
            userId: context?.userId,
            compressionEnabled: options.compressionEnabled,
            customMetadata: {
              entityClass: this.constructor.name,
              fieldName: field.toString(),
              ...options.customMetadata,
              ...context
            }
          });
          
          (this as any)[field] = Buffer.from(JSON.stringify(encrypted)).toString('base64');
          
          // Create search hash if searchable
          if (options.searchable) {
            const hashField = `${field.toString()}_hash`;
            (this as any)[hashField] = this.createSearchHash(value);
          }
          
        } catch (error) {
          throw new Error(`Failed to encrypt field ${field.toString()}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Automatically decrypt all marked fields after loading
   */
  async decryptFields(encryptionService: AdvancedEncryptionService, context?: any): Promise<void> {
    const encryptedFields = EncryptionMetadata.getEncryptedFields(this.constructor);
    
    for (const { field, options } of encryptedFields) {
      const value = (this as any)[field];
      
      if (value && typeof value === 'string' && this.isAlreadyEncrypted(value)) {
        try {
          const encryptedData = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
          const decrypted = await encryptionService.decryptData(encryptedData, {
            expectedDataType: options.dataType || 'entity_field',
            userId: context?.userId,
            validateMetadata: true
          });
          
          (this as any)[field] = decrypted.toString('utf8');
          
        } catch (error) {
          throw new Error(`Failed to decrypt field ${field.toString()}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Check if a value is already encrypted
   */
  private isAlreadyEncrypted(value: string): boolean {
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
   * Search by encrypted field (using hash)
   */
  static createSearchHashForValue(value: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(value.toLowerCase()).digest('hex');
  }
}

/**
 * Type-safe encrypted field interface
 */
export interface EncryptedField<T = string> {
  encrypted: string;
  decrypted?: T;
  searchHash?: string;
  metadata?: {
    keyVersion: string;
    algorithm: string;
    timestamp: string;
    dataType?: string;
  };
}

/**
 * Helper functions for working with encrypted data
 */
export class EncryptionUtils {
  /**
   * Create an encrypted field wrapper
   */
  static createEncryptedField<T = string>(
    encrypted: string,
    decrypted?: T,
    searchHash?: string
  ): EncryptedField<T> {
    return {
      encrypted,
      decrypted,
      searchHash
    };
  }

  /**
   * Extract metadata from encrypted data
   */
  static extractMetadata(encryptedValue: string): any {
    try {
      const parsed = JSON.parse(Buffer.from(encryptedValue, 'base64').toString('utf8'));
      return {
        keyVersion: parsed.keyVersion,
        algorithm: parsed.algorithm,
        timestamp: parsed.timestamp,
        dataType: parsed.metadata?.dataType
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if encrypted data needs key rotation
   */
  static needsKeyRotation(
    encryptedValue: string,
    currentKeyVersion: string,
    maxKeyAge: number = 90 // days
  ): boolean {
    const metadata = this.extractMetadata(encryptedValue);
    if (!metadata) return true;

    // Check if using old key version
    if (metadata.keyVersion !== currentKeyVersion) {
      return true;
    }

    // Check if data is too old
    const dataAge = Date.now() - new Date(metadata.timestamp).getTime();
    const maxAge = maxKeyAge * 24 * 60 * 60 * 1000; // Convert to milliseconds
    
    return dataAge > maxAge;
  }

  /**
   * Bulk re-encrypt data with new key
   */
  static async reEncryptWithNewKey(
    encryptionService: AdvancedEncryptionService,
    encryptedValues: string[],
    context?: any
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (const encryptedValue of encryptedValues) {
      try {
        // Decrypt with old key
        const encryptedData = JSON.parse(Buffer.from(encryptedValue, 'base64').toString('utf8'));
        const decrypted = await encryptionService.decryptData(encryptedData, context);
        
        // Re-encrypt with current key
        const reEncrypted = await encryptionService.encryptData(decrypted.toString('utf8'), {
          ...context,
          dataType: encryptedData.metadata?.dataType
        });
        
        results.push(Buffer.from(JSON.stringify(reEncrypted)).toString('base64'));
        
      } catch (error) {
        throw new Error(`Failed to re-encrypt data: ${error.message}`);
      }
    }
    
    return results;
  }
}