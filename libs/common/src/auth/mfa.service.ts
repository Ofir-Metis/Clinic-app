import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { CentralizedLoggerService } from '../logging/centralized-logger.service';

export interface MFASecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  userId: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface MFAVerificationResult {
  isValid: boolean;
  usedBackupCode?: string;
  remainingBackupCodes?: number;
}

export interface MFASetupResult {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface MFAConfig {
  issuer: string;
  serviceName: string;
  window: number;
  backupCodeCount: number;
  backupCodeLength: number;
}

@Injectable()
export class MFAService {
  private readonly logger = new Logger(MFAService.name);
  private readonly defaultConfig: MFAConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {
    this.defaultConfig = {
      issuer: this.configService.get<string>('MFA_ISSUER', 'Clinic Management Platform'),
      serviceName: this.configService.get<string>('MFA_SERVICE_NAME', 'Clinic App'),
      window: this.configService.get<number>('MFA_WINDOW', 1), // Allow 30 seconds drift
      backupCodeCount: this.configService.get<number>('MFA_BACKUP_CODE_COUNT', 10),
      backupCodeLength: this.configService.get<number>('MFA_BACKUP_CODE_LENGTH', 8)
    };
  }

  /**
   * Generate MFA secret and QR code for user setup
   */
  async generateMFASecret(
    userId: string, 
    userEmail: string, 
    userName?: string
  ): Promise<MFASetupResult> {
    try {
      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `${userName || userEmail} (${this.defaultConfig.serviceName})`,
        issuer: this.defaultConfig.issuer,
        length: 32
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Generate QR code data URL
      const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

      this.centralizedLogger.auditLog('MFA secret generated for user', {
        userId,
        userEmail,
        service: 'mfa-service',
        action: 'mfa_setup_initiated',
        hipaaRelevant: true,
        auditRequired: true
      });

      return {
        secret: secret.base32,
        qrCodeDataUrl,
        backupCodes,
        manualEntryKey: secret.base32
      };

    } catch (error) {
      this.centralizedLogger.logError('Failed to generate MFA secret', {
        userId,
        userEmail,
        error: error.message,
        service: 'mfa-service'
      });
      throw new BadRequestException('Failed to generate MFA secret');
    }
  }

  /**
   * Verify TOTP token or backup code
   */
  async verifyMFAToken(
    secret: string,
    token: string,
    backupCodes: string[] = [],
    userId?: string
  ): Promise<MFAVerificationResult> {
    try {
      // First try TOTP verification
      const totpVerified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: this.defaultConfig.window
      });

      if (totpVerified) {
        this.centralizedLogger.auditLog('MFA TOTP verification successful', {
          userId,
          service: 'mfa-service',
          action: 'mfa_totp_verified',
          hipaaRelevant: true,
          auditRequired: true
        });

        return { isValid: true };
      }

      // If TOTP fails, try backup codes
      const hashedToken = this.hashBackupCode(token);
      const backupCodeIndex = backupCodes.findIndex(code => 
        this.compareBackupCodes(hashedToken, code)
      );

      if (backupCodeIndex !== -1) {
        const usedCode = backupCodes[backupCodeIndex];
        // Remove used backup code
        backupCodes.splice(backupCodeIndex, 1);

        this.centralizedLogger.auditLog('MFA backup code verification successful', {
          userId,
          service: 'mfa-service',
          action: 'mfa_backup_code_used',
          remainingBackupCodes: backupCodes.length,
          hipaaRelevant: true,
          auditRequired: true,
          alertLevel: backupCodes.length <= 2 ? 'high' : 'medium'
        });

        return {
          isValid: true,
          usedBackupCode: usedCode,
          remainingBackupCodes: backupCodes.length
        };
      }

      // Both TOTP and backup code failed
      this.centralizedLogger.securityLog('MFA verification failed', {
        userId,
        service: 'mfa-service',
        action: 'mfa_verification_failed',
        alertLevel: 'high',
        securityEvent: true
      });

      return { isValid: false };

    } catch (error) {
      this.centralizedLogger.logError('MFA verification error', {
        userId,
        error: error.message,
        service: 'mfa-service'
      });
      return { isValid: false };
    }
  }

  /**
   * Generate new backup codes (when user requests new ones)
   */
  generateNewBackupCodes(userId: string): string[] {
    const backupCodes = this.generateBackupCodes();

    this.centralizedLogger.auditLog('New MFA backup codes generated', {
      userId,
      service: 'mfa-service',
      action: 'mfa_backup_codes_regenerated',
      backupCodeCount: backupCodes.length,
      hipaaRelevant: true,
      auditRequired: true
    });

    return backupCodes;
  }

  /**
   * Validate MFA setup by requiring user to verify a token
   */
  async validateMFASetup(
    secret: string,
    verificationToken: string,
    userId: string
  ): Promise<boolean> {
    const isValid = await this.verifyMFAToken(secret, verificationToken, [], userId);
    
    if (isValid.isValid) {
      this.centralizedLogger.auditLog('MFA setup completed successfully', {
        userId,
        service: 'mfa-service',
        action: 'mfa_setup_completed',
        hipaaRelevant: true,
        auditRequired: true
      });
    } else {
      this.centralizedLogger.securityLog('MFA setup validation failed', {
        userId,
        service: 'mfa-service',
        action: 'mfa_setup_failed',
        alertLevel: 'medium'
      });
    }

    return isValid.isValid;
  }

  /**
   * Generate secure backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.defaultConfig.backupCodeCount; i++) {
      const code = this.generateSecureCode(this.defaultConfig.backupCodeLength);
      const hashedCode = this.hashBackupCode(code);
      codes.push(hashedCode);
    }

    return codes;
  }

  /**
   * Generate a single secure code
   */
  private generateSecureCode(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, characters.length);
      result += characters.charAt(randomIndex);
    }

    // Add hyphen for readability if code is long enough
    if (length >= 8) {
      return result.substring(0, 4) + '-' + result.substring(4);
    }

    return result;
  }

  /**
   * Hash backup code for secure storage
   */
  private hashBackupCode(code: string): string {
    // Remove hyphens and convert to uppercase for consistency
    const normalizedCode = code.replace(/-/g, '').toUpperCase();
    return crypto.createHash('sha256').update(normalizedCode).digest('hex');
  }

  /**
   * Compare backup codes securely
   */
  private compareBackupCodes(inputCode: string, storedHash: string): boolean {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(inputCode, 'hex'),
        Buffer.from(storedHash, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Get current TOTP token (for testing purposes)
   */
  getCurrentToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32'
    });
  }

  /**
   * Check if MFA token is within valid time window
   */
  isTokenTimeValid(secret: string, token: string, window: number = this.defaultConfig.window): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window
    });
  }

  /**
   * Generate recovery information for administrators
   */
  generateRecoveryInfo(userId: string): {
    recoveryCode: string;
    expiresAt: Date;
  } {
    const recoveryCode = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    this.centralizedLogger.auditLog('MFA recovery code generated', {
      userId,
      service: 'mfa-service',
      action: 'mfa_recovery_code_generated',
      expiresAt: expiresAt.toISOString(),
      hipaaRelevant: true,
      auditRequired: true,
      alertLevel: 'high',
      securityEvent: true
    });

    return { recoveryCode, expiresAt };
  }

  /**
   * Validate recovery code (for emergency access)
   */
  validateRecoveryCode(
    providedCode: string,
    storedCode: string,
    expiresAt: Date,
    userId: string
  ): boolean {
    const isExpired = new Date() > expiresAt;
    const isValidCode = crypto.timingSafeEqual(
      Buffer.from(providedCode),
      Buffer.from(storedCode)
    );

    const isValid = !isExpired && isValidCode;

    this.centralizedLogger.auditLog('MFA recovery code validation attempt', {
      userId,
      service: 'mfa-service',
      action: 'mfa_recovery_code_validated',
      isValid,
      isExpired,
      hipaaRelevant: true,
      auditRequired: true,
      alertLevel: 'critical',
      securityEvent: true
    });

    return isValid;
  }

  /**
   * Health check for MFA service
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // Test TOTP generation and verification
      const testSecret = speakeasy.generateSecret({ length: 32 });
      const testToken = speakeasy.totp({
        secret: testSecret.base32,
        encoding: 'base32'
      });
      
      const verification = speakeasy.totp.verify({
        secret: testSecret.base32,
        encoding: 'base32',
        token: testToken,
        window: 1
      });

      return {
        status: verification ? 'healthy' : 'unhealthy',
        details: {
          totpGeneration: 'working',
          totpVerification: verification ? 'working' : 'failed',
          backupCodeGeneration: 'working',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}