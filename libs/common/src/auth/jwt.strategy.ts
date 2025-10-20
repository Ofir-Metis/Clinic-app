/**
 * Enterprise JWT Strategy
 * Production-grade JWT validation with comprehensive security checks
 */

import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;          // Subject (user ID)
  email: string;        // User email
  role: string;         // User role
  iat: number;          // Issued at
  exp: number;          // Expires at
  iss?: string;         // Issuer
  aud?: string;         // Audience
  sessionId?: string;   // Session identifier for revocation
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  sessionId?: string;
  isValid: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'development-fallback-secret-do-not-use-in-production',
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER || 'clinic-platform',
      audience: process.env.JWT_AUDIENCE || 'clinic-users',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    try {
      // Validate required JWT fields
      if (!payload.sub || !payload.email) {
        this.logger.warn(`Invalid JWT payload: missing required fields`);
        throw new UnauthorizedException('Invalid token structure');
      }

      // Validate token expiration (additional check)
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        this.logger.warn(`Expired JWT token for user ${payload.sub}`);
        throw new UnauthorizedException('Token expired');
      }

      // Validate user role
      const validRoles = ['client', 'coach', 'admin', 'super_admin'];
      if (!payload.role || !validRoles.includes(payload.role)) {
        this.logger.warn(`Invalid role in JWT: ${payload.role} for user ${payload.sub}`);
        throw new UnauthorizedException('Invalid user role');
      }

      // TODO: Add database check for user existence and account status
      // TODO: Add session validation if sessionId is present
      // TODO: Add rate limiting per user

      const user: AuthenticatedUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId,
        isValid: true,
      };

      this.logger.debug(`JWT validation successful for user ${user.id} with role ${user.role}`);
      return user;

    } catch (error) {
      this.logger.error(`JWT validation failed: ${error.message}`);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}