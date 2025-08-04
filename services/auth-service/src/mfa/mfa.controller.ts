import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  MFAService, 
  MFAStorageService, 
  MFAGuard, 
  RequireMFA, 
  SkipMFA,
  MFASessionManager,
  CentralizedLoggerService
} from '@clinic/common';

export class SetupMFADto {
  verificationToken: string;
}

export class VerifyMFADto {
  token: string;
}

export class GenerateBackupCodesDto {
  currentToken: string;
}

export class VerifyRecoveryDto {
  recoveryCode: string;
  newPassword?: string;
}

@Controller('mfa')
@UseGuards(JwtAuthGuard)
export class MFAController {
  private readonly logger = new Logger(MFAController.name);

  constructor(
    private readonly mfaService: MFAService,
    private readonly mfaStorageService: MFAStorageService,
    private readonly centralizedLogger: CentralizedLoggerService
  ) {}

  /**
   * Generate MFA setup QR code and backup codes
   */
  @Post('setup')
  @SkipMFA()
  async setupMFA(@Request() req: any) {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name;

    try {
      // Check if user already has MFA enabled
      const existingMFA = await this.mfaStorageService.getUserMFASettings(userId);
      if (existingMFA?.isMFAEnabled) {
        throw new BadRequestException('MFA is already enabled for this user');
      }

      // Generate MFA secret and QR code
      const setupResult = await this.mfaService.generateMFASecret(
        userId, 
        userEmail, 
        userName
      );

      // Store the secret (not enabled yet)
      await this.mfaStorageService.storeMFASecret(
        userId,
        setupResult.secret,
        setupResult.backupCodes
      );

      this.centralizedLogger.auditLog('MFA setup initiated', {
        userId,
        userEmail,
        service: 'mfa-controller',
        action: 'mfa_setup_initiated',
        hipaaRelevant: true,
        auditRequired: true
      });

      // Return setup information (never return the raw secret)
      return {
        qrCodeDataUrl: setupResult.qrCodeDataUrl,
        manualEntryKey: setupResult.manualEntryKey,
        backupCodes: setupResult.backupCodes.map(code => 
          // Return display-friendly version of backup codes
          code.replace(/^.{56}/, '****') // Hide most of the hash for security
        ),
        instructions: {
          step1: 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)',
          step2: 'Or manually enter the key into your authenticator app',
          step3: 'Save your backup codes in a secure location',
          step4: 'Complete setup by verifying a token from your authenticator app'
        }
      };

    } catch (error) {
      this.centralizedLogger.logError('MFA setup failed', {
        userId,
        userEmail,
        error: error.message,
        service: 'mfa-controller'
      });
      throw error;
    }
  }

  /**
   * Complete MFA setup by verifying a token
   */
  @Post('setup/verify')
  @SkipMFA()
  @HttpCode(HttpStatus.OK)
  async completeMFASetup(@Request() req: any, @Body() setupDto: SetupMFADto) {
    const userId = req.user.id;

    try {
      // Get stored MFA secret
      const mfaEntity = await this.mfaStorageService.getMFASecret(userId);
      if (!mfaEntity) {
        throw new BadRequestException('MFA setup not found. Please start setup process again.');
      }

      if (mfaEntity.isEnabled) {
        throw new BadRequestException('MFA is already enabled for this user');
      }

      // Verify the setup token
      const isValid = await this.mfaService.validateMFASetup(
        mfaEntity.secret,
        setupDto.verificationToken,
        userId
      );

      if (!isValid) {
        throw new BadRequestException('Invalid verification token. Please try again.');
      }

      // Enable MFA for the user
      await this.mfaStorageService.enableMFA(userId);

      this.centralizedLogger.auditLog('MFA setup completed successfully', {
        userId,
        service: 'mfa-controller',
        action: 'mfa_setup_completed',
        hipaaRelevant: true,
        auditRequired: true
      });

      return {
        success: true,
        message: 'Multi-factor authentication has been successfully enabled',
        mfaEnabled: true
      };

    } catch (error) {
      this.centralizedLogger.logError('MFA setup verification failed', {
        userId,
        error: error.message,
        service: 'mfa-controller'
      });
      throw error;
    }
  }

  /**
   * Verify MFA token for authentication
   */
  @Post('verify')
  @SkipMFA()
  @HttpCode(HttpStatus.OK)
  async verifyMFA(@Request() req: any, @Body() verifyDto: VerifyMFADto) {
    const userId = req.user.id;

    try {
      // Get user's MFA settings
      const mfaEntity = await this.mfaStorageService.getMFASecret(userId);
      if (!mfaEntity || !mfaEntity.isEnabled) {
        throw new BadRequestException('MFA is not enabled for this user');
      }

      // Verify the token
      const verificationResult = await this.mfaService.verifyMFAToken(
        mfaEntity.secret,
        verifyDto.token,
        mfaEntity.backupCodes,
        userId
      );

      if (!verificationResult.isValid) {
        throw new UnauthorizedException('Invalid MFA token');
      }

      // Update backup codes if one was used
      if (verificationResult.usedBackupCode) {
        await this.mfaStorageService.updateBackupCodes(
          userId,
          mfaEntity.backupCodes.filter(code => code !== verificationResult.usedBackupCode)
        );
      }

      // Record MFA usage
      await this.mfaStorageService.recordMFAUsage(
        userId,
        verificationResult.usedBackupCode ? 'backup_code' : 'totp'
      );

      // Set MFA verification in session
      MFASessionManager.setMFAVerification(req, userId);

      // Generate MFA token for API clients
      const mfaToken = MFASessionManager.generateMFAToken(userId, 30);

      this.centralizedLogger.auditLog('MFA verification successful', {
        userId,
        method: verificationResult.usedBackupCode ? 'backup_code' : 'totp',
        remainingBackupCodes: verificationResult.remainingBackupCodes,
        service: 'mfa-controller',
        action: 'mfa_verified',
        hipaaRelevant: true,
        auditRequired: true
      });

      return {
        success: true,
        message: 'MFA verification successful',
        mfaToken,
        remainingBackupCodes: verificationResult.remainingBackupCodes,
        sessionDuration: '30 minutes'
      };

    } catch (error) {
      this.centralizedLogger.securityLog('MFA verification failed', {
        userId,
        error: error.message,
        service: 'mfa-controller',
        alertLevel: 'medium'
      });
      throw error;
    }
  }

  /**
   * Get MFA status for current user
   */
  @Get('status')
  @SkipMFA()
  async getMFAStatus(@Request() req: any) {
    const userId = req.user.id;

    try {
      const mfaSettings = await this.mfaStorageService.getUserMFASettings(userId);
      const mfaEntity = await this.mfaStorageService.getMFASecret(userId);

      return {
        mfaEnabled: mfaSettings?.isMFAEnabled || false,
        mfaRequired: mfaSettings?.isMFARequired || false,
        mfaEnforcedByPolicy: mfaSettings?.mfaEnforcedByPolicy || false,
        hasVerifiedMFA: mfaSettings?.hasVerifiedMFA || false,
        backupCodesRemaining: mfaSettings?.backupCodesRemaining || 0,
        lastMFAUsed: mfaSettings?.lastMFAUsed,
        setupRequired: !mfaSettings?.isMFAEnabled && mfaSettings?.isMFARequired
      };

    } catch (error) {
      this.centralizedLogger.logError('Failed to get MFA status', {
        userId,
        error: error.message,
        service: 'mfa-controller'
      });
      throw error;
    }
  }

  /**
   * Generate new backup codes
   */
  @Post('backup-codes/regenerate')
  @UseGuards(MFAGuard)
  @RequireMFA()
  async regenerateBackupCodes(@Request() req: any, @Body() dto: GenerateBackupCodesDto) {
    const userId = req.user.id;

    try {
      // Verify current TOTP token before generating new backup codes
      const mfaEntity = await this.mfaStorageService.getMFASecret(userId);
      if (!mfaEntity) {
        throw new BadRequestException('MFA is not enabled for this user');
      }

      const isCurrentTokenValid = await this.mfaService.verifyMFAToken(
        mfaEntity.secret,
        dto.currentToken,
        [],
        userId
      );

      if (!isCurrentTokenValid.isValid) {
        throw new UnauthorizedException('Invalid current MFA token');
      }

      // Generate new backup codes
      const newBackupCodes = this.mfaService.generateNewBackupCodes(userId);

      // Update stored backup codes
      await this.mfaStorageService.updateBackupCodes(userId, newBackupCodes);

      this.centralizedLogger.auditLog('MFA backup codes regenerated', {
        userId,
        service: 'mfa-controller',
        action: 'mfa_backup_codes_regenerated',
        hipaaRelevant: true,
        auditRequired: true
      });

      return {
        success: true,
        message: 'New backup codes generated successfully',
        backupCodes: newBackupCodes.map(code => 
          code.replace(/^.{56}/, '****') // Hide hash for display
        ),
        warning: 'Please save these backup codes in a secure location. Your old backup codes are no longer valid.'
      };

    } catch (error) {
      this.centralizedLogger.logError('Failed to regenerate backup codes', {
        userId,
        error: error.message,
        service: 'mfa-controller'
      });
      throw error;
    }
  }

  /**
   * Disable MFA (requires current verification)
   */
  @Post('disable')
  @UseGuards(MFAGuard)
  @RequireMFA()
  async disableMFA(@Request() req: any, @Body() dto: VerifyMFADto) {
    const userId = req.user.id;

    try {
      // Verify current token before disabling
      const mfaEntity = await this.mfaStorageService.getMFASecret(userId);
      if (!mfaEntity) {
        throw new BadRequestException('MFA is not enabled for this user');
      }

      const isValid = await this.mfaService.verifyMFAToken(
        mfaEntity.secret,
        dto.token,
        mfaEntity.backupCodes,
        userId
      );

      if (!isValid.isValid) {
        throw new UnauthorizedException('Invalid MFA token');
      }

      // Check if MFA is enforced by policy
      const mfaSettings = await this.mfaStorageService.getUserMFASettings(userId);
      if (mfaSettings?.mfaEnforcedByPolicy) {
        throw new BadRequestException('MFA cannot be disabled due to organizational policy');
      }

      // Disable MFA
      await this.mfaStorageService.disableMFA(userId, userId);

      this.centralizedLogger.auditLog('MFA disabled by user', {
        userId,
        service: 'mfa-controller',
        action: 'mfa_disabled',
        hipaaRelevant: true,
        auditRequired: true,
        alertLevel: 'medium'
      });

      return {
        success: true,
        message: 'Multi-factor authentication has been disabled',
        warning: 'Your account security has been reduced. Consider re-enabling MFA.'
      };

    } catch (error) {
      this.centralizedLogger.logError('Failed to disable MFA', {
        userId,
        error: error.message,
        service: 'mfa-controller'
      });
      throw error;
    }
  }

  /**
   * Generate emergency recovery code (admin only)
   */
  @Post('recovery/generate')
  @RequireMFA()
  async generateRecoveryCode(@Request() req: any) {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    try {
      // Check if user has admin privileges
      const hasAdminRole = userRoles.some(role => 
        ['admin', 'super_admin', 'system_admin'].includes(role)
      );

      if (!hasAdminRole) {
        throw new UnauthorizedException('Insufficient privileges to generate recovery codes');
      }

      // Generate recovery code
      const recoveryInfo = this.mfaService.generateRecoveryInfo(userId);

      // Store recovery code
      await this.mfaStorageService.storeRecoveryCode(
        userId,
        recoveryInfo.recoveryCode,
        recoveryInfo.expiresAt
      );

      return {
        success: true,
        recoveryCode: recoveryInfo.recoveryCode,
        expiresAt: recoveryInfo.expiresAt,
        warning: 'This recovery code expires in 24 hours and can only be used once.'
      };

    } catch (error) {
      this.centralizedLogger.logError('Failed to generate recovery code', {
        userId,
        error: error.message,
        service: 'mfa-controller'
      });
      throw error;
    }
  }

  /**
   * Use emergency recovery code
   */
  @Post('recovery/verify')
  @SkipMFA()
  @HttpCode(HttpStatus.OK)
  async verifyRecoveryCode(@Request() req: any, @Body() dto: VerifyRecoveryDto) {
    const userId = req.user.id;

    try {
      // Get stored recovery code
      const recoveryData = await this.mfaStorageService.getRecoveryCode(userId);
      if (!recoveryData) {
        throw new BadRequestException('No recovery code found for this user');
      }

      // Validate recovery code
      const isValid = this.mfaService.validateRecoveryCode(
        dto.recoveryCode,
        recoveryData.recoveryCode,
        recoveryData.expiresAt,
        userId
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid or expired recovery code');
      }

      // Clear the used recovery code
      await this.mfaStorageService.clearRecoveryCode(userId);

      // Set MFA verification (temporary emergency access)
      MFASessionManager.setMFAVerification(req, userId);

      // Generate temporary MFA token
      const mfaToken = MFASessionManager.generateMFAToken(userId, 60); // 1 hour

      return {
        success: true,
        message: 'Emergency recovery successful',
        mfaToken,
        temporaryAccess: true,
        sessionDuration: '60 minutes',
        warning: 'You have emergency access. Please set up MFA again as soon as possible.'
      };

    } catch (error) {
      this.centralizedLogger.securityLog('Recovery code verification failed', {
        userId,
        error: error.message,
        service: 'mfa-controller',
        alertLevel: 'high'
      });
      throw error;
    }
  }

  /**
   * Health check for MFA service
   */
  @Get('health')
  @SkipMFA()
  async healthCheck() {
    try {
      const mfaServiceHealth = await this.mfaService.healthCheck();
      const storageHealth = await this.mfaStorageService.healthCheck();
      const stats = await this.mfaStorageService.getMFAStatistics();

      return {
        status: mfaServiceHealth.status === 'healthy' && storageHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        services: {
          mfaService: mfaServiceHealth,
          storage: storageHealth
        },
        statistics: stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}