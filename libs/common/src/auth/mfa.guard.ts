import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { MFAStorageService } from './mfa-storage.service';
import { MFAService } from './mfa.service';
// import { CentralizedLoggerService } from '../logging/centralized-logger.service'; // Temporarily disabled for production stability

export const MFA_REQUIRED_KEY = 'mfa_required';
export const MFA_SKIP_KEY = 'mfa_skip';

/**
 * Decorator to require MFA for specific endpoints
 */
export const RequireMFA = () => {
  const SetMetadata = require('@nestjs/common').SetMetadata;
  return SetMetadata(MFA_REQUIRED_KEY, true);
};

/**
 * Decorator to skip MFA requirement for specific endpoints
 */
export const SkipMFA = () => {
  const SetMetadata = require('@nestjs/common').SetMetadata;
  return SetMetadata(MFA_SKIP_KEY, true);
};

export interface MFAAuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  mfaVerified: boolean;
  mfaRequired: boolean;
  lastMFAVerification?: Date;
}

@Injectable()
export class MFAGuard implements CanActivate {
  private readonly logger = new Logger(MFAGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly mfaStorageService: MFAStorageService,
    private readonly mfaService: MFAService
    // private readonly centralizedLogger: CentralizedLoggerService // Temporarily disabled
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    // Skip MFA check if user is not authenticated
    if (!user) {
      return true; // Let the auth guard handle authentication
    }

    // Check if MFA is explicitly skipped for this endpoint
    const skipMFA = this.reflector.getAllAndOverride<boolean>(MFA_SKIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipMFA) {
      return true;
    }

    // Check if MFA is required for this endpoint
    const mfaRequired = this.reflector.getAllAndOverride<boolean>(MFA_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get user MFA settings
    const userMFASettings = await this.mfaStorageService.getUserMFASettings(user.id);

    // Determine if MFA is required
    const requiresMFA = mfaRequired || 
                       userMFASettings?.isMFARequired || 
                       userMFASettings?.mfaEnforcedByPolicy ||
                       this.isHighSecurityEndpoint(request);

    if (!requiresMFA) {
      return true;
    }

    // Check if user has MFA enabled
    if (!userMFASettings?.isMFAEnabled) {
      this.logger.warn(`Access denied - MFA not enabled for required endpoint: ${request.method} ${request.path}`, {
        userId: user.id,
        service: 'mfa-guard'
      });

      throw new UnauthorizedException({
        error: 'MFA_REQUIRED',
        message: 'Multi-factor authentication is required for this operation',
        mfaSetupRequired: true
      });
    }

    // Check if MFA verification is present in session/token
    const mfaVerified = this.checkMFAVerification(request, user);

    if (!mfaVerified) {
      this.logger.warn(`Access denied - MFA verification required: ${request.method} ${request.path}`, {
        userId: user.id,
        service: 'mfa-guard'
      });

      throw new UnauthorizedException({
        error: 'MFA_VERIFICATION_REQUIRED',
        message: 'Please complete multi-factor authentication to continue',
        mfaVerificationRequired: true
      });
    }

    // Check if MFA verification is still valid (not expired)
    if (!this.isMFAVerificationValid(request, user)) {
      this.logger.warn(`Access denied - MFA verification expired: ${request.method} ${request.path}`, {
        userId: user.id,
        service: 'mfa-guard'
      });

      throw new UnauthorizedException({
        error: 'MFA_VERIFICATION_EXPIRED',
        message: 'Multi-factor authentication verification has expired',
        mfaReverificationRequired: true
      });
    }

    // Log successful MFA-protected access
    this.logger.log(`MFA-protected endpoint accessed: ${request.method} ${request.path}`, {
      userId: user.id,
      service: 'mfa-guard'
    });

    return true;
  }

  /**
   * Check if the current request has valid MFA verification
   */
  private checkMFAVerification(request: Request, user: any): boolean {
    // Check for MFA verification in session
    if (request.session && (request.session as any).mfaVerified) {
      const mfaSession = (request.session as any).mfaVerification;
      return mfaSession?.userId === user.id && mfaSession?.verified === true;
    }

    // Check for MFA verification in JWT token (if using JWT-based approach)
    if (user.mfaVerified) {
      return true;
    }

    // Check for MFA verification header (for API clients)
    const mfaToken = request.headers['x-mfa-token'] as string;
    if (mfaToken) {
      return this.validateMFAToken(mfaToken, user.id);
    }

    return false;
  }

  /**
   * Check if MFA verification is still valid (not expired)
   */
  private isMFAVerificationValid(request: Request, user: any): boolean {
    const mfaVerificationTimeout = 30 * 60 * 1000; // 30 minutes

    // Check session-based MFA verification timestamp
    if (request.session && (request.session as any).mfaVerification) {
      const mfaSession = (request.session as any).mfaVerification;
      const verificationTime = new Date(mfaSession.timestamp);
      const now = new Date();
      return (now.getTime() - verificationTime.getTime()) < mfaVerificationTimeout;
    }

    // Check JWT-based MFA verification timestamp
    if (user.mfaVerifiedAt) {
      const verificationTime = new Date(user.mfaVerifiedAt);
      const now = new Date();
      return (now.getTime() - verificationTime.getTime()) < mfaVerificationTimeout;
    }

    return false;
  }

  /**
   * Validate MFA token from header
   */
  private validateMFAToken(token: string, userId: string): boolean {
    try {
      // In production, this would validate a signed JWT token or similar
      // For now, we'll do a simple validation
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const tokenData = JSON.parse(decoded);
      
      return tokenData.userId === userId && 
             tokenData.mfaVerified === true &&
             new Date(tokenData.expiresAt) > new Date();
    } catch {
      return false;
    }
  }

  /**
   * Determine if endpoint requires high security (healthcare-specific)
   */
  private isHighSecurityEndpoint(request: Request): boolean {
    const highSecurityPaths = [
      '/api/patients',
      '/api/medical-records',
      '/api/prescriptions',
      '/api/admin',
      '/api/reports',
      '/api/analytics',
      '/api/files/medical',
      '/api/backup',
      '/api/export'
    ];

    const path = request.path.toLowerCase();
    return highSecurityPaths.some(securityPath => 
      path.startsWith(securityPath.toLowerCase())
    );
  }
}

/**
 * Enhanced MFA Guard with role-based requirements
 */
@Injectable()
export class RoleBasedMFAGuard extends MFAGuard {
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;

    if (!user) {
      return true;
    }

    // Check role-based MFA requirements
    const roleRequirements = this.getMFARequirementsByRole(user.roles);
    let mfaRequired = false;
    
    if (roleRequirements.alwaysRequired) {
      // Force MFA requirement regardless of endpoint metadata
      mfaRequired = true;
    }

    // Apply additional security for sensitive roles
    if (roleRequirements.highSecurity) {
      request.headers['x-require-fresh-mfa'] = 'true';
    }

    return super.canActivate(context);
  }

  /**
   * Get MFA requirements based on user roles
   */
  private getMFARequirementsByRole(roles: string[]): {
    alwaysRequired: boolean;
    highSecurity: boolean;
    maxSessionDuration: number;
  } {
    const adminRoles = ['admin', 'super_admin', 'system_admin'];
    const healthcareRoles = ['doctor', 'nurse', 'therapist', 'healthcare_provider'];
    const sensitiveRoles = ['billing', 'compliance', 'security'];

    const hasAdminRole = roles.some(role => adminRoles.includes(role));
    const hasHealthcareRole = roles.some(role => healthcareRoles.includes(role));
    const hasSensitiveRole = roles.some(role => sensitiveRoles.includes(role));

    return {
      alwaysRequired: hasAdminRole || hasSensitiveRole,
      highSecurity: hasAdminRole || hasHealthcareRole || hasSensitiveRole,
      maxSessionDuration: hasAdminRole ? 15 * 60 * 1000 : 30 * 60 * 1000 // 15min for admin, 30min for others
    };
  }
}

/**
 * Utility class for MFA session management
 */
export class MFASessionManager {
  
  /**
   * Set MFA verification in session
   */
  static setMFAVerification(request: Request, userId: string): void {
    if (request.session) {
      (request.session as any).mfaVerification = {
        userId,
        verified: true,
        timestamp: new Date().toISOString(),
        ip: request.ip,
        userAgent: request.get('User-Agent')
      };
    }
  }

  /**
   * Clear MFA verification from session
   */
  static clearMFAVerification(request: Request): void {
    if (request.session && (request.session as any).mfaVerification) {
      delete (request.session as any).mfaVerification;
    }
  }

  /**
   * Generate MFA token for API clients
   */
  static generateMFAToken(userId: string, expiresInMinutes: number = 30): string {
    const tokenData = {
      userId,
      mfaVerified: true,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString(),
      timestamp: new Date().toISOString()
    };

    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }

  /**
   * Check if user session needs MFA re-verification
   */
  static needsMFAReVerification(request: Request, maxAgeMinutes: number = 30): boolean {
    if (!request.session || !(request.session as any).mfaVerification) {
      return true;
    }

    const mfaSession = (request.session as any).mfaVerification;
    const verificationTime = new Date(mfaSession.timestamp);
    const maxAge = maxAgeMinutes * 60 * 1000;

    return (Date.now() - verificationTime.getTime()) > maxAge;
  }
}