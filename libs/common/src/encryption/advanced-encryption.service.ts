import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface EncryptionConfig {
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
  keyRotationDays: number;
  keyDerivationIterations: number;
  saltLength: number;
  ivLength: number;
  tagLength: number;
  compressionEnabled: boolean;
}

export interface EncryptedData {
  data: string;
  iv: string;
  tag?: string;
  salt?: string;
  keyVersion: string;
  algorithm: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface KeyManagement {
  currentKeyId: string;
  previousKeyIds: string[];
  keyCreatedAt: Date;
  keyExpiresAt: Date;
  rotationSchedule: string;
}

export interface EncryptionMetrics {
  totalOperations: number;
  encryptOperations: number;
  decryptOperations: number;
  keyRotations: number;
  failedOperations: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
  dataVolumeEncrypted: number;
}

@Injectable()
export class AdvancedEncryptionService {
  private readonly logger = new Logger(AdvancedEncryptionService.name);
  private readonly config: EncryptionConfig;
  private readonly masterKeys = new Map<string, Buffer>();
  private readonly keyManagement: KeyManagement;
  private readonly metrics: EncryptionMetrics;
  private keyRotationTimer?: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      algorithm: this.configService.get<string>('ENCRYPTION_ALGORITHM', 'aes-256-gcm') as any,
      keyRotationDays: this.configService.get<number>('KEY_ROTATION_DAYS', 90),
      keyDerivationIterations: this.configService.get<number>('KEY_DERIVATION_ITERATIONS', 100000),
      saltLength: 32,
      ivLength: 16,
      tagLength: 16,
      compressionEnabled: this.configService.get<boolean>('ENCRYPTION_COMPRESSION', true)
    };

    this.keyManagement = {
      currentKeyId: this.generateKeyId(),
      previousKeyIds: [],
      keyCreatedAt: new Date(),
      keyExpiresAt: new Date(Date.now() + this.config.keyRotationDays * 24 * 60 * 60 * 1000),
      rotationSchedule: `Every ${this.config.keyRotationDays} days`
    };

    this.metrics = {
      totalOperations: 0,
      encryptOperations: 0,
      decryptOperations: 0,
      keyRotations: 0,
      failedOperations: 0,
      averageEncryptionTime: 0,
      averageDecryptionTime: 0,
      dataVolumeEncrypted: 0
    };

    this.initializeEncryption();
  }

  /**
   * Initialize encryption service with master keys and rotation schedule
   */
  private async initializeEncryption(): Promise<void> {
    try {
      // Initialize current master key
      await this.initializeMasterKey(this.keyManagement.currentKeyId);
      
      // Load previous keys for decryption
      await this.loadPreviousKeys();
      
      // Schedule automatic key rotation
      this.scheduleKeyRotation();
      
      this.logger.log('Advanced encryption service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize encryption service:', error);
      throw error;
    }
  }

  /**
   * Encrypt data with advanced security features
   */
  async encryptData(
    data: string | Buffer,
    context?: {
      dataType?: string;
      userId?: string;
      compressionEnabled?: boolean;
      customMetadata?: Record<string, any>;
    }
  ): Promise<EncryptedData> {
    const startTime = Date.now();
    
    try {
      // Convert data to buffer
      const inputData = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
      
      // Apply compression if enabled
      let processedData = inputData;
      const shouldCompress = context?.compressionEnabled ?? this.config.compressionEnabled;
      if (shouldCompress && inputData.length > 1024) { // Only compress larger data
        processedData = await this.compressData(inputData);
      }

      // Generate cryptographic parameters
      const iv = crypto.randomBytes(this.config.ivLength);
      const salt = crypto.randomBytes(this.config.saltLength);
      
      // Derive encryption key
      const masterKey = this.masterKeys.get(this.keyManagement.currentKeyId);
      if (!masterKey) {
        throw new Error('Master key not available');
      }
      
      const derivedKey = crypto.pbkdf2Sync(
        masterKey,
        salt,
        this.config.keyDerivationIterations,
        32, // 256 bits
        'sha512'
      );

      // Perform encryption
      const cipher = crypto.createCipher(this.config.algorithm, derivedKey);
      cipher.setAAD(Buffer.from(JSON.stringify({
        keyId: this.keyManagement.currentKeyId,
        dataType: context?.dataType || 'generic',
        userId: context?.userId,
        timestamp: new Date().toISOString()
      })));

      let encrypted = cipher.update(processedData);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      const tag = this.config.algorithm.includes('gcm') ? cipher.getAuthTag() : undefined;

      const result: EncryptedData = {
        data: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag?.toString('base64'),
        salt: salt.toString('base64'),
        keyVersion: this.keyManagement.currentKeyId,
        algorithm: this.config.algorithm,
        timestamp: new Date().toISOString(),
        metadata: {
          compressed: shouldCompress && inputData.length > 1024,
          originalSize: inputData.length,
          encryptedSize: encrypted.length,
          dataType: context?.dataType,
          userId: context?.userId,
          ...context?.customMetadata
        }
      };

      // Update metrics
      const encryptionTime = Date.now() - startTime;
      this.updateMetrics('encrypt', encryptionTime, inputData.length);

      this.logger.debug(`Data encrypted successfully (${encryptionTime}ms, ${inputData.length} bytes)`);
      return result;

    } catch (error) {
      this.metrics.failedOperations++;
      this.logger.error('Encryption failed:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data with automatic key version handling
   */
  async decryptData(
    encryptedData: EncryptedData,
    context?: {
      expectedDataType?: string;
      userId?: string;
      validateMetadata?: boolean;
    }
  ): Promise<Buffer> {
    const startTime = Date.now();
    
    try {
      // Validate encrypted data structure
      this.validateEncryptedData(encryptedData);
      
      // Get the appropriate key for decryption
      const keyId = encryptedData.keyVersion;
      const masterKey = this.masterKeys.get(keyId);
      if (!masterKey) {
        throw new Error(`Decryption key not available for version: ${keyId}`);
      }

      // Recreate cryptographic parameters
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const salt = Buffer.from(encryptedData.salt || '', 'base64');
      const tag = encryptedData.tag ? Buffer.from(encryptedData.tag, 'base64') : undefined;
      const encrypted = Buffer.from(encryptedData.data, 'base64');

      // Derive decryption key
      const derivedKey = crypto.pbkdf2Sync(
        masterKey,
        salt,
        this.config.keyDerivationIterations,
        32,
        'sha512'
      );

      // Perform decryption
      const decipher = crypto.createDecipher(encryptedData.algorithm as any, derivedKey);
      
      if (tag && encryptedData.algorithm.includes('gcm')) {
        decipher.setAuthTag(tag);
        decipher.setAAD(Buffer.from(JSON.stringify({
          keyId: keyId,
          dataType: encryptedData.metadata?.dataType || 'generic',
          userId: encryptedData.metadata?.userId,
          timestamp: encryptedData.timestamp
        })));
      }

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // Decompress if needed
      if (encryptedData.metadata?.compressed) {
        decrypted = await this.decompressData(decrypted);
      }

      // Validate metadata if requested
      if (context?.validateMetadata) {
        this.validateDecryptionContext(encryptedData, context);
      }

      // Update metrics
      const decryptionTime = Date.now() - startTime;
      this.updateMetrics('decrypt', decryptionTime, decrypted.length);

      this.logger.debug(`Data decrypted successfully (${decryptionTime}ms, ${decrypted.length} bytes)`);
      return decrypted;

    } catch (error) {
      this.metrics.failedOperations++;
      this.logger.error('Decryption failed:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt file with streaming support for large files
   */
  async encryptFile(
    inputPath: string,
    outputPath: string,
    context?: {
      deleteOriginal?: boolean;
      chunkSize?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<EncryptedData> {
    const startTime = Date.now();
    
    try {
      const stats = fs.statSync(inputPath);
      const fileSize = stats.size;
      const chunkSize = context?.chunkSize || 1024 * 1024; // 1MB chunks

      // Generate encryption parameters
      const iv = crypto.randomBytes(this.config.ivLength);
      const salt = crypto.randomBytes(this.config.saltLength);
      const masterKey = this.masterKeys.get(this.keyManagement.currentKeyId);
      
      if (!masterKey) {
        throw new Error('Master key not available');
      }

      const derivedKey = crypto.pbkdf2Sync(
        masterKey,
        salt,
        this.config.keyDerivationIterations,
        32,
        'sha512'
      );

      // Create streams
      const readStream = fs.createReadStream(inputPath, { highWaterMark: chunkSize });
      const writeStream = fs.createWriteStream(outputPath);
      const cipher = crypto.createCipher(this.config.algorithm, derivedKey);

      // Handle streaming encryption
      await new Promise<void>((resolve, reject) => {
        readStream.pipe(cipher).pipe(writeStream);
        
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        readStream.on('error', reject);
        cipher.on('error', reject);
      });

      const tag = this.config.algorithm.includes('gcm') ? cipher.getAuthTag() : undefined;

      // Create metadata file
      const metadata: EncryptedData = {
        data: outputPath,
        iv: iv.toString('base64'),
        tag: tag?.toString('base64'),
        salt: salt.toString('base64'),
        keyVersion: this.keyManagement.currentKeyId,
        algorithm: this.config.algorithm,
        timestamp: new Date().toISOString(),
        metadata: {
          originalPath: inputPath,
          fileSize,
          encryptedSize: fs.statSync(outputPath).size,
          encryptionTime: Date.now() - startTime,
          chunkSize,
          ...context?.metadata
        }
      };

      // Save metadata
      fs.writeFileSync(outputPath + '.meta', JSON.stringify(metadata, null, 2));

      // Delete original if requested
      if (context?.deleteOriginal) {
        fs.unlinkSync(inputPath);
      }

      this.updateMetrics('encrypt', Date.now() - startTime, fileSize);
      this.logger.log(`File encrypted: ${inputPath} -> ${outputPath} (${fileSize} bytes)`);

      return metadata;

    } catch (error) {
      this.metrics.failedOperations++;
      this.logger.error('File encryption failed:', error);
      throw new Error(`File encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt file with streaming support
   */
  async decryptFile(
    encryptedPath: string,
    outputPath: string,
    metadataPath?: string,
    context?: {
      deleteEncrypted?: boolean;
      chunkSize?: number;
    }
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Load metadata
      const metaPath = metadataPath || encryptedPath + '.meta';
      const metadata: EncryptedData = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

      // Get decryption key
      const masterKey = this.masterKeys.get(metadata.keyVersion);
      if (!masterKey) {
        throw new Error(`Decryption key not available for version: ${metadata.keyVersion}`);
      }

      // Recreate parameters
      const iv = Buffer.from(metadata.iv, 'base64');
      const salt = Buffer.from(metadata.salt || '', 'base64');
      const tag = metadata.tag ? Buffer.from(metadata.tag, 'base64') : undefined;

      const derivedKey = crypto.pbkdf2Sync(
        masterKey,
        salt,
        this.config.keyDerivationIterations,
        32,
        'sha512'
      );

      // Create streams
      const chunkSize = context?.chunkSize || 1024 * 1024;
      const readStream = fs.createReadStream(encryptedPath, { highWaterMark: chunkSize });
      const writeStream = fs.createWriteStream(outputPath);
      const decipher = crypto.createDecipher(metadata.algorithm as any, derivedKey);

      if (tag && metadata.algorithm.includes('gcm')) {
        decipher.setAuthTag(tag);
      }

      // Handle streaming decryption
      await new Promise<void>((resolve, reject) => {
        readStream.pipe(decipher).pipe(writeStream);
        
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        readStream.on('error', reject);
        decipher.on('error', reject);
      });

      // Delete encrypted files if requested
      if (context?.deleteEncrypted) {
        fs.unlinkSync(encryptedPath);
        fs.unlinkSync(metaPath);
      }

      const decryptionTime = Date.now() - startTime;
      this.updateMetrics('decrypt', decryptionTime, metadata.metadata?.fileSize || 0);
      
      this.logger.log(`File decrypted: ${encryptedPath} -> ${outputPath} (${decryptionTime}ms)`);

    } catch (error) {
      this.metrics.failedOperations++;
      this.logger.error('File decryption failed:', error);
      throw new Error(`File decryption failed: ${error.message}`);
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<void> {
    try {
      this.logger.log('Starting key rotation...');

      // Archive current key
      this.keyManagement.previousKeyIds.unshift(this.keyManagement.currentKeyId);
      
      // Generate new key
      const newKeyId = this.generateKeyId();
      await this.initializeMasterKey(newKeyId);
      
      // Update key management
      this.keyManagement.currentKeyId = newKeyId;
      this.keyManagement.keyCreatedAt = new Date();
      this.keyManagement.keyExpiresAt = new Date(
        Date.now() + this.config.keyRotationDays * 24 * 60 * 60 * 1000
      );

      // Keep only last 10 keys for decryption
      if (this.keyManagement.previousKeyIds.length > 10) {
        const removedKeyId = this.keyManagement.previousKeyIds.pop();
        if (removedKeyId) {
          this.masterKeys.delete(removedKeyId);
        }
      }

      this.metrics.keyRotations++;
      this.logger.log(`Key rotation completed. New key ID: ${newKeyId}`);

    } catch (error) {
      this.logger.error('Key rotation failed:', error);
      throw error;
    }
  }

  /**
   * Get encryption metrics
   */
  getMetrics(): EncryptionMetrics & KeyManagement {
    return {
      ...this.metrics,
      ...this.keyManagement
    };
  }

  /**
   * Validate encryption health
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    details: Record<string, any>;
  }> {
    const issues: string[] = [];
    
    // Check key availability
    if (!this.masterKeys.has(this.keyManagement.currentKeyId)) {
      issues.push('Current master key not available');
    }

    // Check key expiration
    const daysUntilExpiry = Math.floor(
      (this.keyManagement.keyExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    
    if (daysUntilExpiry < 7) {
      issues.push(`Key expires in ${daysUntilExpiry} days`);
    }

    // Check failure rate
    const failureRate = this.metrics.totalOperations > 0 
      ? (this.metrics.failedOperations / this.metrics.totalOperations) * 100 
      : 0;
    
    if (failureRate > 1) {
      issues.push(`High failure rate: ${failureRate.toFixed(2)}%`);
    }

    // Test encryption/decryption
    try {
      const testData = 'encryption-health-check';
      const encrypted = await this.encryptData(testData);
      const decrypted = await this.decryptData(encrypted);
      
      if (decrypted.toString('utf8') !== testData) {
        issues.push('Encryption test failed');
      }
    } catch (error) {
      issues.push(`Encryption test error: ${error.message}`);
    }

    const status = issues.length === 0 ? 'healthy' : 
                  issues.some(i => i.includes('critical') || i.includes('failed')) ? 'critical' : 'warning';

    return {
      status,
      details: {
        issues,
        metrics: this.metrics,
        keyManagement: this.keyManagement,
        daysUntilExpiry,
        failureRate: failureRate.toFixed(2) + '%'
      }
    };
  }

  // Private helper methods

  private async initializeMasterKey(keyId: string): Promise<void> {
    const keyPath = path.join(process.cwd(), '.keys', `${keyId}.key`);
    
    let masterKey: Buffer;
    if (fs.existsSync(keyPath)) {
      // Load existing key
      masterKey = fs.readFileSync(keyPath);
    } else {
      // Generate new key
      masterKey = crypto.randomBytes(32); // 256 bits
      
      // Ensure key directory exists
      const keyDir = path.dirname(keyPath);
      if (!fs.existsSync(keyDir)) {
        fs.mkdirSync(keyDir, { recursive: true, mode: 0o700 });
      }
      
      // Save key securely
      fs.writeFileSync(keyPath, masterKey, { mode: 0o600 });
    }
    
    this.masterKeys.set(keyId, masterKey);
  }

  private async loadPreviousKeys(): Promise<void> {
    const keyDir = path.join(process.cwd(), '.keys');
    if (!fs.existsSync(keyDir)) return;

    const keyFiles = fs.readdirSync(keyDir).filter(f => f.endsWith('.key'));
    
    for (const keyFile of keyFiles) {
      const keyId = path.basename(keyFile, '.key');
      if (keyId !== this.keyManagement.currentKeyId && !this.masterKeys.has(keyId)) {
        await this.initializeMasterKey(keyId);
        if (!this.keyManagement.previousKeyIds.includes(keyId)) {
          this.keyManagement.previousKeyIds.push(keyId);
        }
      }
    }
  }

  private scheduleKeyRotation(): void {
    const rotationInterval = this.config.keyRotationDays * 24 * 60 * 60 * 1000;
    
    this.keyRotationTimer = setInterval(async () => {
      try {
        await this.rotateKeys();
      } catch (error) {
        this.logger.error('Scheduled key rotation failed:', error);
      }
    }, rotationInterval);
  }

  private generateKeyId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `key-${timestamp}-${random}`;
  }

  private async compressData(data: Buffer): Promise<Buffer> {
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(data, (err, compressed) => {
        if (err) reject(err);
        else resolve(compressed);
      });
    });
  }

  private async decompressData(data: Buffer): Promise<Buffer> {
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
      zlib.gunzip(data, (err, decompressed) => {
        if (err) reject(err);
        else resolve(decompressed);
      });
    });
  }

  private validateEncryptedData(data: EncryptedData): void {
    const required = ['data', 'iv', 'keyVersion', 'algorithm', 'timestamp'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  private validateDecryptionContext(
    encryptedData: EncryptedData,
    context: { expectedDataType?: string; userId?: string; validateMetadata?: boolean }
  ): void {
    if (context.expectedDataType && encryptedData.metadata?.dataType !== context.expectedDataType) {
      throw new Error('Data type mismatch');
    }
    
    if (context.userId && encryptedData.metadata?.userId !== context.userId) {
      throw new Error('User ID mismatch');
    }
  }

  private updateMetrics(operation: 'encrypt' | 'decrypt', timeMs: number, dataSize: number): void {
    this.metrics.totalOperations++;
    
    if (operation === 'encrypt') {
      this.metrics.encryptOperations++;
      this.metrics.averageEncryptionTime = (
        (this.metrics.averageEncryptionTime * (this.metrics.encryptOperations - 1) + timeMs) /
        this.metrics.encryptOperations
      );
      this.metrics.dataVolumeEncrypted += dataSize;
    } else {
      this.metrics.decryptOperations++;
      this.metrics.averageDecryptionTime = (
        (this.metrics.averageDecryptionTime * (this.metrics.decryptOperations - 1) + timeMs) /
        this.metrics.decryptOperations
      );
    }
  }

  onModuleDestroy(): void {
    if (this.keyRotationTimer) {
      clearInterval(this.keyRotationTimer);
    }
  }
}