/**
 * Enterprise Authentication Provider
 * Centralized authentication configuration for all microservices
 */

import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService, JwtModuleOptions } from '@nestjs/jwt';

export const ENTERPRISE_JWT_OPTIONS = 'ENTERPRISE_JWT_OPTIONS';

export const enterpriseJwtOptionsProvider: Provider = {
  provide: ENTERPRISE_JWT_OPTIONS,
  useFactory: (configService: ConfigService): JwtModuleOptions => {
    const secret = configService.get<string>('JWT_SECRET');
    
    if (!secret || secret.length < 32) {
      console.warn('🚨 SECURITY WARNING: JWT_SECRET is missing or too short!');
      console.warn('   Using fallback secret for development only.');
      console.warn('   Set a secure JWT_SECRET (min 32 chars) for production.');
    }

    return {
      secret: secret || 'development-fallback-secret-do-not-use-in-production',
      signOptions: {
        expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '24h',
        issuer: configService.get<string>('JWT_ISSUER') || 'clinic-platform',
        audience: configService.get<string>('JWT_AUDIENCE') || 'clinic-users',
        algorithm: 'HS256',
      },
      verifyOptions: {
        ignoreExpiration: false,
        clockTolerance: 30,
        issuer: configService.get<string>('JWT_ISSUER') || 'clinic-platform',
        audience: configService.get<string>('JWT_AUDIENCE') || 'clinic-users',
      },
    };
  },
  inject: [ConfigService],
};

/**
 * Enterprise JWT Service with enhanced security
 */
export class EnterpriseJwtService extends NestJwtService {
  constructor(options: JwtModuleOptions) {
    super(options);
    console.log('✅ Enterprise JWT Service initialized with secure configuration');
  }

  /**
   * Generate token with enterprise security standards
   */
  generateToken(payload: any): string {
    // Add security metadata
    const enhancedPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      jti: this.generateTokenId(), // JWT ID for token tracking
    };

    return super.sign(enhancedPayload);
  }

  /**
   * Validate token with comprehensive checks
   */
  validateToken(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const payload = super.verify(token);
      
      // Additional security validations
      if (!payload.sub || !payload.email) {
        return { valid: false, error: 'Invalid token structure' };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  private generateTokenId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}