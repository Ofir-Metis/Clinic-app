/**
 * Enterprise JWT Authentication Module
 * Centralized JWT configuration for all microservices
 * Production-grade security with proper validation
 */

import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

@Global()
@Module({
  imports: [
    PassportModule.register({ 
      defaultStrategy: 'jwt',
      session: false 
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || (() => {
        console.warn('⚠️  WARNING: JWT_SECRET not set. Using fallback secret for development only.');
        return 'development-fallback-secret-do-not-use-in-production';
      })(),
      signOptions: { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: process.env.JWT_ISSUER || 'clinic-platform',
        audience: process.env.JWT_AUDIENCE || 'clinic-users',
        algorithm: 'HS256'
      },
      verifyOptions: {
        ignoreExpiration: false,
        clockTolerance: 30, // 30 seconds clock skew tolerance
        maxAge: process.env.JWT_MAX_AGE || '24h'
      }
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [JwtModule, PassportModule, JwtStrategy, JwtAuthGuard],
})
export class EnterpriseJwtModule {
  constructor() {
    // Validate JWT configuration on module initialization
    this.validateJwtConfiguration();
  }

  private validateJwtConfiguration(): void {
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
      console.warn('🚨 SECURITY WARNING: JWT_SECRET environment variable not set!');
      console.warn('   Using fallback secret for development only.');
      console.warn('   Set JWT_SECRET environment variable in production.');
    } else if (secret.length < 32) {
      console.warn('🚨 SECURITY WARNING: JWT_SECRET is too short!');
      console.warn('   Use at least 32 characters for production security.');
    } else {
      console.log('✅ JWT Configuration validated successfully');
    }
  }
}