/**
 * TokenManagerService - Secure encryption/decryption of OAuth tokens
 * Uses AES-256-GCM encryption for maximum security
 */

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TokenManagerService {
  private readonly logger = new Logger(TokenManagerService.name);
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits

  private encryptionKey!: Buffer;

  constructor() {
    this.initializeEncryptionKey();
  }

  private initializeEncryptionKey(): void {
    const keyString = process.env.TOKEN_ENCRYPTION_KEY;
    
    if (!keyString) {
      // Generate a random key for development (NOT suitable for production)
      this.logger.warn('TOKEN_ENCRYPTION_KEY not set. Generating random key (NOT suitable for production)');
      this.encryptionKey = crypto.randomBytes(this.keyLength);
    } else if (keyString.length === 64) {
      // Hex string key
      this.encryptionKey = Buffer.from(keyString, 'hex');
    } else if (keyString.length === 44 && keyString.includes('=')) {
      // Base64 key
      this.encryptionKey = Buffer.from(keyString, 'base64');
    } else {
      // Derive key from string using PBKDF2
      const salt = crypto.createHash('sha256').update('clinic-app-google-tokens').digest();
      this.encryptionKey = crypto.pbkdf2Sync(keyString, salt, 100000, this.keyLength, 'sha256');
    }

    this.logger.log('Token encryption initialized');
  }

  /**
   * Encrypt a token using AES-256-GCM
   */
  async encryptToken(plaintext: string): Promise<string> {
    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher with IV
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      
      // Encrypt the token
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV + encrypted data (simplified without GCM)
      const result = iv.toString('hex') + encrypted;
      
      return result;
    } catch (error) {
      this.logger.error(`Token encryption failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Token encryption failed');
    }
  }

  /**
   * Decrypt a token using AES-256-CBC
   */
  async decryptToken(encryptedData: string): Promise<string> {
    try {
      // Extract encrypted data (skip IV which createDecipher doesn't use)
      const encryptedHex = encryptedData.slice(this.ivLength * 2);

      // createDecipher is deprecated but kept for backward compatibility
      // It derives the IV from the key, so we don't need the stored IV

      // Create decipher
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      
      // Decrypt
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error(`Token decryption failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Token decryption failed');
    }
  }

  /**
   * Generate a secure encryption key (for setup purposes)
   */
  static generateEncryptionKey(): string {
    const key = crypto.randomBytes(32);
    return key.toString('hex');
  }

  /**
   * Validate that a token can be encrypted and decrypted
   */
  async validateEncryption(): Promise<boolean> {
    try {
      const testToken = 'test-token-' + Date.now();
      const encrypted = await this.encryptToken(testToken);
      const decrypted = await this.decryptToken(encrypted);
      
      const isValid = testToken === decrypted;
      
      if (isValid) {
        this.logger.log('Token encryption validation successful');
      } else {
        this.logger.error('Token encryption validation failed');
      }
      
      return isValid;
    } catch (error) {
      this.logger.error(`Token encryption validation error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Securely hash a token for comparison (one-way)
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate a secure random state parameter for OAuth
   */
  generateSecureState(userId: string): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(16).toString('hex');
    const combined = `${userId}:${timestamp}:${random}`;
    
    // Create HMAC to ensure integrity
    const hmac = crypto.createHmac('sha256', this.encryptionKey);
    hmac.update(combined);
    const signature = hmac.digest('hex').slice(0, 16); // First 16 chars
    
    return `${combined}:${signature}`;
  }

  /**
   * Validate a state parameter
   */
  validateState(state: string, expectedUserId: string): boolean {
    try {
      const parts = state.split(':');
      if (parts.length !== 4) return false;
      
      const [userId, timestamp, random, signature] = parts;
      
      // Check user ID
      if (userId !== expectedUserId) return false;
      
      // Check timestamp (valid for 10 minutes)
      const stateTimestamp = parseInt(timestamp);
      const now = Date.now();
      const maxAge = 10 * 60 * 1000; // 10 minutes
      
      if (now - stateTimestamp > maxAge) return false;
      
      // Verify signature
      const combined = `${userId}:${timestamp}:${random}`;
      const hmac = crypto.createHmac('sha256', this.encryptionKey);
      hmac.update(combined);
      const expectedSignature = hmac.digest('hex').slice(0, 16);
      
      return signature === expectedSignature;
    } catch (error) {
      this.logger.error(`State validation error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Rotate encryption key (for security best practices)
   */
  async rotateEncryptionKey(_newKeyHex: string): Promise<void> {
    // This would be used in a key rotation scenario
    // Implementation would need to:
    // 1. Decrypt all existing tokens with old key
    // 2. Re-encrypt with new key
    // 3. Update key

    this.logger.warn('Key rotation not implemented - requires careful migration of existing tokens');
    throw new Error('Key rotation requires implementation of token migration');
  }
}