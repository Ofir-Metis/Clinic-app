import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CentralizedLoggerService } from '../logging/centralized-logger.service';
import { MFASecret } from './mfa.service';

export class MFASecretEntity {
  id: string;
  userId: string;
  secret: string; // Encrypted
  backupCodes: string[]; // Hashed
  isEnabled: boolean;
  isVerified: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  lastBackupCodeUsedAt?: Date;
  recoveryCode?: string; // Encrypted
  recoveryCodeExpiresAt?: Date;
}

export interface MFAUserSettings {
  userId: string;
  isMFAEnabled: boolean;
  isMFARequired: boolean;
  hasVerifiedMFA: boolean;
  backupCodesRemaining: number;
  lastMFAUsed?: Date;
  mfaEnforcedByPolicy: boolean;
}

@Injectable()
export class MFAStorageService {
  private readonly logger = new Logger(MFAStorageService.name);

  constructor(
    // In production, you would inject the actual MFA entity repository
    // @InjectRepository(MFASecretEntity)
    // private readonly mfaRepository: Repository<MFASecretEntity>,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {
    // For now, we'll use in-memory storage for demonstration
    // In production, this should be a proper database table
  }

  // In-memory storage for demonstration (replace with database in production)
  private mfaSecrets = new Map<string, MFASecretEntity>();
  private userSettings = new Map<string, MFAUserSettings>();

  /**
   * Store MFA secret for user
   */
  async storeMFASecret(
    userId: string,
    secret: string,
    backupCodes: string[]
  ): Promise<void> {
    try {
      const encryptedSecret = this.encryptData(secret);
      
      const mfaEntity: MFASecretEntity = {
        id: this.generateId(),
        userId,
        secret: encryptedSecret,
        backupCodes, // Already hashed by MFAService
        isEnabled: false, // Will be enabled after verification
        isVerified: false,
        createdAt: new Date()
      };

      this.mfaSecrets.set(userId, mfaEntity);

      // Initialize user settings
      const userSetting: MFAUserSettings = {
        userId,
        isMFAEnabled: false,
        isMFARequired: this.isMFARequiredForUser(userId),
        hasVerifiedMFA: false,
        backupCodesRemaining: backupCodes.length,
        mfaEnforcedByPolicy: this.isMFAEnforcedByPolicy(userId)
      };

      this.userSettings.set(userId, userSetting);

      this.centralizedLogger.auditLog('MFA secret stored for user', {
        userId,
        service: 'mfa-storage-service',
        action: 'mfa_secret_stored',
        backupCodeCount: backupCodes.length,
        hipaaRelevant: true,
        auditRequired: true
      });

    } catch (error) {
      this.centralizedLogger.logError('Failed to store MFA secret', {
        userId,
        error: error.message,
        service: 'mfa-storage-service'
      });
      throw error;
    }
  }

  /**
   * Get MFA secret for user
   */
  async getMFASecret(userId: string): Promise<MFASecretEntity | null> {
    try {
      const mfaEntity = this.mfaSecrets.get(userId);
      
      if (mfaEntity) {
        // Decrypt the secret before returning
        const decryptedSecret = this.decryptData(mfaEntity.secret);
        return {
          ...mfaEntity,
          secret: decryptedSecret
        };
      }

      return null;

    } catch (error) {
      this.centralizedLogger.logError('Failed to retrieve MFA secret', {
        userId,
        error: error.message,
        service: 'mfa-storage-service'
      });
      return null;
    }
  }

  /**
   * Enable MFA for user after successful verification
   */
  async enableMFA(userId: string): Promise<void> {
    try {
      const mfaEntity = this.mfaSecrets.get(userId);
      const userSetting = this.userSettings.get(userId);

      if (mfaEntity && userSetting) {
        mfaEntity.isEnabled = true;
        mfaEntity.isVerified = true;
        
        userSetting.isMFAEnabled = true;
        userSetting.hasVerifiedMFA = true;

        this.mfaSecrets.set(userId, mfaEntity);
        this.userSettings.set(userId, userSetting);

        this.centralizedLogger.auditLog('MFA enabled for user', {
          userId,
          service: 'mfa-storage-service',
          action: 'mfa_enabled',
          hipaaRelevant: true,
          auditRequired: true
        });
      }

    } catch (error) {
      this.centralizedLogger.logError('Failed to enable MFA', {
        userId,
        error: error.message,
        service: 'mfa-storage-service'
      });
      throw error;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string, disabledBy?: string): Promise<void> {
    try {
      const userSetting = this.userSettings.get(userId);

      if (userSetting) {
        userSetting.isMFAEnabled = false;
        this.userSettings.set(userId, userSetting);

        this.centralizedLogger.auditLog('MFA disabled for user', {
          userId,
          disabledBy,
          service: 'mfa-storage-service',
          action: 'mfa_disabled',
          hipaaRelevant: true,
          auditRequired: true,
          alertLevel: 'medium'
        });
      }

    } catch (error) {
      this.centralizedLogger.logError('Failed to disable MFA', {
        userId,
        error: error.message,
        service: 'mfa-storage-service'
      });
      throw error;
    }
  }

  /**
   * Update backup codes after one is used
   */
  async updateBackupCodes(userId: string, remainingCodes: string[]): Promise<void> {
    try {
      const mfaEntity = this.mfaSecrets.get(userId);
      const userSetting = this.userSettings.get(userId);

      if (mfaEntity && userSetting) {
        mfaEntity.backupCodes = remainingCodes;
        mfaEntity.lastBackupCodeUsedAt = new Date();
        
        userSetting.backupCodesRemaining = remainingCodes.length;

        this.mfaSecrets.set(userId, mfaEntity);
        this.userSettings.set(userId, userSetting);

        // Alert if backup codes are running low
        if (remainingCodes.length <= 2) {
          this.centralizedLogger.securityLog('MFA backup codes running low', {
            userId,
            remainingBackupCodes: remainingCodes.length,
            service: 'mfa-storage-service',
            action: 'mfa_backup_codes_low',
            alertLevel: 'high'
          });
        }

        this.centralizedLogger.auditLog('MFA backup codes updated', {
          userId,
          remainingBackupCodes: remainingCodes.length,
          service: 'mfa-storage-service',
          action: 'mfa_backup_codes_updated',
          hipaaRelevant: true,
          auditRequired: true
        });
      }

    } catch (error) {
      this.centralizedLogger.logError('Failed to update backup codes', {
        userId,
        error: error.message,
        service: 'mfa-storage-service'
      });
      throw error;
    }
  }

  /**
   * Record successful MFA usage
   */
  async recordMFAUsage(userId: string, method: 'totp' | 'backup_code'): Promise<void> {
    try {
      const mfaEntity = this.mfaSecrets.get(userId);
      const userSetting = this.userSettings.get(userId);

      if (mfaEntity && userSetting) {
        mfaEntity.lastUsedAt = new Date();
        userSetting.lastMFAUsed = new Date();

        this.mfaSecrets.set(userId, mfaEntity);
        this.userSettings.set(userId, userSetting);

        this.centralizedLogger.auditLog('MFA usage recorded', {
          userId,
          method,
          service: 'mfa-storage-service',
          action: 'mfa_usage_recorded',
          hipaaRelevant: true,
          auditRequired: true
        });
      }

    } catch (error) {
      this.centralizedLogger.logError('Failed to record MFA usage', {
        userId,
        error: error.message,
        service: 'mfa-storage-service'
      });
    }
  }

  /**
   * Get user MFA settings
   */
  async getUserMFASettings(userId: string): Promise<MFAUserSettings | null> {
    return this.userSettings.get(userId) || null;
  }

  /**
   * Check if user has MFA enabled
   */
  async isUserMFAEnabled(userId: string): Promise<boolean> {
    const settings = await this.getUserMFASettings(userId);
    return settings?.isMFAEnabled || false;
  }

  /**
   * Check if MFA is required for user (based on role/policy)
   */
  isMFARequiredForUser(userId: string): boolean {
    // In production, this would check user roles and organizational policies
    // For healthcare platforms, MFA should be required for all users
    return true;
  }

  /**
   * Check if MFA is enforced by organizational policy
   */
  isMFAEnforcedByPolicy(userId: string): boolean {
    // In production, this would check organizational policies
    // Healthcare platforms typically enforce MFA for all users
    return true;
  }

  /**
   * Store recovery code for emergency access
   */
  async storeRecoveryCode(
    userId: string,
    recoveryCode: string,
    expiresAt: Date
  ): Promise<void> {
    try {
      const mfaEntity = this.mfaSecrets.get(userId);

      if (mfaEntity) {
        mfaEntity.recoveryCode = this.encryptData(recoveryCode);
        mfaEntity.recoveryCodeExpiresAt = expiresAt;
        
        this.mfaSecrets.set(userId, mfaEntity);

        this.centralizedLogger.auditLog('MFA recovery code stored', {
          userId,
          expiresAt: expiresAt.toISOString(),
          service: 'mfa-storage-service',
          action: 'mfa_recovery_code_stored',
          hipaaRelevant: true,
          auditRequired: true,
          alertLevel: 'high'
        });
      }

    } catch (error) {
      this.centralizedLogger.logError('Failed to store recovery code', {
        userId,
        error: error.message,
        service: 'mfa-storage-service'
      });
      throw error;
    }
  }

  /**
   * Get recovery code for validation
   */
  async getRecoveryCode(userId: string): Promise<{
    recoveryCode: string;
    expiresAt: Date;
  } | null> {
    try {
      const mfaEntity = this.mfaSecrets.get(userId);

      if (mfaEntity?.recoveryCode && mfaEntity?.recoveryCodeExpiresAt) {
        return {
          recoveryCode: this.decryptData(mfaEntity.recoveryCode),
          expiresAt: mfaEntity.recoveryCodeExpiresAt
        };
      }

      return null;

    } catch (error) {
      this.centralizedLogger.logError('Failed to retrieve recovery code', {
        userId,
        error: error.message,
        service: 'mfa-storage-service'
      });
      return null;
    }
  }

  /**
   * Clear recovery code after use
   */
  async clearRecoveryCode(userId: string): Promise<void> {
    try {
      const mfaEntity = this.mfaSecrets.get(userId);

      if (mfaEntity) {
        mfaEntity.recoveryCode = undefined;
        mfaEntity.recoveryCodeExpiresAt = undefined;
        this.mfaSecrets.set(userId, mfaEntity);

        this.centralizedLogger.auditLog('MFA recovery code cleared', {
          userId,
          service: 'mfa-storage-service',
          action: 'mfa_recovery_code_cleared',
          hipaaRelevant: true,
          auditRequired: true
        });
      }

    } catch (error) {
      this.centralizedLogger.logError('Failed to clear recovery code', {
        userId,
        error: error.message,
        service: 'mfa-storage-service'
      });
    }
  }

  /**
   * Get MFA statistics for monitoring
   */
  async getMFAStatistics(): Promise<{
    totalUsers: number;
    usersWithMFAEnabled: number;
    usersWithMFARequired: number;
    mfaAdoptionRate: number;
    recentMFAUsage: number;
  }> {
    const totalUsers = this.userSettings.size;
    const usersWithMFAEnabled = Array.from(this.userSettings.values())
      .filter(setting => setting.isMFAEnabled).length;
    const usersWithMFARequired = Array.from(this.userSettings.values())
      .filter(setting => setting.isMFARequired).length;
    
    const mfaAdoptionRate = totalUsers > 0 ? 
      (usersWithMFAEnabled / totalUsers) * 100 : 0;

    // Recent usage (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentMFAUsage = Array.from(this.userSettings.values())
      .filter(setting => 
        setting.lastMFAUsed && setting.lastMFAUsed > sevenDaysAgo
      ).length;

    return {
      totalUsers,
      usersWithMFAEnabled,
      usersWithMFARequired,
      mfaAdoptionRate,
      recentMFAUsage
    };
  }

  // Private helper methods

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private encryptData(data: string): string {
    // In production, use proper encryption with a secure key
    // This is a simple example - use AES-256-GCM in production
    const crypto = require('crypto');
    const key = process.env.MFA_ENCRYPTION_KEY || 'default-key-change-in-production';
    const cipher = crypto.createCipheriv('aes-256-cbc', key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptData(encryptedData: string): string {
    // In production, use proper decryption with the same secure key
    const crypto = require('crypto');
    const key = process.env.MFA_ENCRYPTION_KEY || 'default-key-change-in-production';
    const decipher = crypto.createDecipheriv('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Health check for MFA storage
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const stats = await this.getMFAStatistics();
      
      return {
        status: 'healthy',
        details: {
          storage: 'operational',
          totalMFAUsers: stats.totalUsers,
          mfaAdoptionRate: `${stats.mfaAdoptionRate.toFixed(2)}%`,
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