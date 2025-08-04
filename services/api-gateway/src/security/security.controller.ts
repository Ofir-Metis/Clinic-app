/**
 * SecurityController - Advanced security management for admin console
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard, RequireRoles } from '@clinic/common';
import { SecurityService } from './security.service';

export interface MFASetupRequest {
  method: 'totp' | 'sms' | 'email';
  phoneNumber?: string;
  email?: string;
}

export interface MFAVerifyRequest {
  code: string;
  backupCode?: string;
}

export interface SessionManagementRequest {
  action: 'terminate' | 'extend' | 'terminate_all';
  sessionId?: string;
  reason?: string;
}

export interface SecurityPolicyUpdate {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number;
  };
  sessionPolicy: {
    maxConcurrentSessions: number;
    sessionTimeout: number;
    idleTimeout: number;
    requireMFAForAdmin: boolean;
  };
  accessPolicy: {
    allowedIPs: string[];
    blockedIPs: string[];
    allowedCountries: string[];
    maxFailedAttempts: number;
    lockoutDuration: number;
  };
}

@Controller('security')
@UseGuards(JwtAuthGuard)
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);

  constructor(private securityService: SecurityService) {}

  /**
   * Get security overview and status
   */
  @Get('overview')
  @RequireRoles('admin')
  async getSecurityOverview(@Request() req: any) {
    try {
      const overview = await this.securityService.getSecurityOverview();
      
      this.logger.log(`Admin ${req.user.sub} viewed security overview`);
      
      return {
        success: true,
        data: overview,
      };
    } catch (error) {
      this.logger.error('Failed to get security overview:', error);
      throw new HttpException(
        'Failed to retrieve security overview',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Multi-Factor Authentication Management
   */
  @Post('mfa/setup')
  async setupMFA(
    @Body() body: MFASetupRequest,
    @Request() req: any,
  ) {
    try {
      const result = await this.securityService.setupMFA(req.user.sub, body);
      
      this.logger.log(`User ${req.user.sub} set up MFA method: ${body.method}`);
      
      return {
        success: true,
        data: result,
        message: 'MFA setup initiated',
      };
    } catch (error) {
      this.logger.error('Failed to setup MFA:', error);
      throw new HttpException(
        'Failed to setup MFA',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('mfa/verify')
  async verifyMFA(
    @Body() body: MFAVerifyRequest,
    @Request() req: any,
  ) {
    try {
      const result = await this.securityService.verifyMFA(req.user.sub, body);
      
      this.logger.log(`User ${req.user.sub} verified MFA`);
      
      return {
        success: true,
        data: result,
        message: 'MFA verified successfully',
      };
    } catch (error) {
      this.logger.error('Failed to verify MFA:', error);
      throw new HttpException(
        'Invalid MFA code',
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Delete('mfa/disable')
  async disableMFA(@Request() req: any) {
    try {
      await this.securityService.disableMFA(req.user.sub);
      
      this.logger.log(`User ${req.user.sub} disabled MFA`);
      
      return {
        success: true,
        message: 'MFA disabled successfully',
      };
    } catch (error) {
      this.logger.error('Failed to disable MFA:', error);
      throw new HttpException(
        'Failed to disable MFA',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('mfa/backup-codes')
  async generateBackupCodes(@Request() req: any) {
    try {
      const codes = await this.securityService.generateBackupCodes(req.user.sub);
      
      this.logger.log(`User ${req.user.sub} generated backup codes`);
      
      return {
        success: true,
        data: { backupCodes: codes },
        message: 'Backup codes generated',
      };
    } catch (error) {
      this.logger.error('Failed to generate backup codes:', error);
      throw new HttpException(
        'Failed to generate backup codes',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Session Management
   */
  @Get('sessions')
  async getUserSessions(@Request() req: any) {
    try {
      const sessions = await this.securityService.getUserSessions(req.user.sub);
      
      return {
        success: true,
        data: { sessions },
      };
    } catch (error) {
      this.logger.error('Failed to get user sessions:', error);
      throw new HttpException(
        'Failed to retrieve sessions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sessions/all')
  @RequireRoles('admin')
  async getAllActiveSessions(@Request() req: any) {
    try {
      const sessions = await this.securityService.getAllActiveSessions();
      
      this.logger.log(`Admin ${req.user.sub} viewed all active sessions`);
      
      return {
        success: true,
        data: { sessions },
      };
    } catch (error) {
      this.logger.error('Failed to get all sessions:', error);
      throw new HttpException(
        'Failed to retrieve sessions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sessions/manage')
  async manageSession(
    @Body() body: SessionManagementRequest,
    @Request() req: any,
  ) {
    try {
      const result = await this.securityService.manageSession(
        req.user.sub,
        body,
        req.user.role === 'admin'
      );
      
      this.logger.log(
        `User ${req.user.sub} performed session action: ${body.action}`
      );
      
      return {
        success: true,
        data: result,
        message: `Session ${body.action} completed`,
      };
    } catch (error) {
      this.logger.error('Failed to manage session:', error);
      throw new HttpException(
        'Failed to manage session',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Security Events and Audit
   */
  @Get('events')
  @RequireRoles('admin')
  async getSecurityEvents(
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
    @Query('severity') severity?: string,
    @Query('type') type?: string,
    @Request() req?: any,
  ) {
    try {
      const events = await this.securityService.getSecurityEvents({
        limit,
        offset,
        severity,
        type,
      });
      
      return {
        success: true,
        data: events,
      };
    } catch (error) {
      this.logger.error('Failed to get security events:', error);
      throw new HttpException(
        'Failed to retrieve security events',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('events/:eventId/acknowledge')
  @RequireRoles('admin')
  async acknowledgeSecurityEvent(
    @Param('eventId') eventId: string,
    @Request() req: any,
  ) {
    try {
      await this.securityService.acknowledgeSecurityEvent(
        eventId,
        req.user.sub
      );
      
      this.logger.log(
        `Admin ${req.user.sub} acknowledged security event ${eventId}`
      );
      
      return {
        success: true,
        message: 'Security event acknowledged',
      };
    } catch (error) {
      this.logger.error('Failed to acknowledge security event:', error);
      throw new HttpException(
        'Failed to acknowledge security event',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Security Policy Management
   */
  @Get('policies')
  @RequireRoles('admin')
  async getSecurityPolicies(@Request() req: any) {
    try {
      const policies = await this.securityService.getSecurityPolicies();
      
      return {
        success: true,
        data: policies,
      };
    } catch (error) {
      this.logger.error('Failed to get security policies:', error);
      throw new HttpException(
        'Failed to retrieve security policies',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('policies')
  @RequireRoles('admin')
  async updateSecurityPolicies(
    @Body() policies: SecurityPolicyUpdate,
    @Request() req: any,
  ) {
    try {
      const result = await this.securityService.updateSecurityPolicies(
        policies,
        req.user.sub
      );
      
      this.logger.log(`Admin ${req.user.sub} updated security policies`);
      
      return {
        success: true,
        data: result,
        message: 'Security policies updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update security policies:', error);
      throw new HttpException(
        'Failed to update security policies',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * IP Access Control
   */
  @Post('access-control/ip')
  @RequireRoles('admin')
  async manageIPAccess(
    @Body() body: {
      action: 'allow' | 'block' | 'remove';
      ipAddress: string;
      reason?: string;
    },
    @Request() req: any,
  ) {
    try {
      const result = await this.securityService.manageIPAccess(
        body.action,
        body.ipAddress,
        req.user.sub,
        body.reason
      );
      
      this.logger.log(
        `Admin ${req.user.sub} ${body.action}ed IP ${body.ipAddress}`
      );
      
      return {
        success: true,
        data: result,
        message: `IP ${body.action} completed`,
      };
    } catch (error) {
      this.logger.error('Failed to manage IP access:', error);
      throw new HttpException(
        'Failed to manage IP access',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Password Policy Enforcement
   */
  @Post('password/validate')
  async validatePassword(
    @Body() body: { password: string },
    @Request() req: any,
  ) {
    try {
      const validation = await this.securityService.validatePassword(
        body.password
      );
      
      return {
        success: true,
        data: validation,
      };
    } catch (error) {
      this.logger.error('Failed to validate password:', error);
      throw new HttpException(
        'Failed to validate password',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('password/force-reset')
  @RequireRoles('admin')
  async forcePasswordReset(
    @Body() body: { userId: string; reason: string },
    @Request() req: any,
  ) {
    try {
      const result = await this.securityService.forcePasswordReset(
        body.userId,
        req.user.sub,
        body.reason
      );
      
      this.logger.log(
        `Admin ${req.user.sub} forced password reset for user ${body.userId}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Password reset forced successfully',
      };
    } catch (error) {
      this.logger.error('Failed to force password reset:', error);
      throw new HttpException(
        'Failed to force password reset',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Security Compliance Reports
   */
  @Get('compliance/report')
  @RequireRoles('admin')
  async generateComplianceReport(
    @Query('type') type: 'hipaa' | 'gdpr' | 'soc2' = 'hipaa',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?: any,
  ) {
    try {
      const report = await this.securityService.generateComplianceReport(
        type,
        startDate,
        endDate
      );
      
      this.logger.log(
        `Admin ${req.user.sub} generated ${type.toUpperCase()} compliance report`
      );
      
      return {
        success: true,
        data: report,
        message: 'Compliance report generated',
      };
    } catch (error) {
      this.logger.error('Failed to generate compliance report:', error);
      throw new HttpException(
        'Failed to generate compliance report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}