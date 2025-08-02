/**
 * JWT Guards - Authentication guards for REST endpoints and WebSocket connections
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, JwtPayload } from './jwt.service';
import { SetMetadata } from '@nestjs/common';

// Decorator for setting required permissions
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

// Decorator for allowing public access
export const Public = () => SetMetadata('public', true);

// Decorator for requiring specific roles
export const RequireRoles = (...roles: string[]) =>
  SetMetadata('roles', roles);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is public
    const isPublic = this.reflector.get<boolean>('public', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.warn('❌ No authorization header provided');
      throw new UnauthorizedException('Authorization header required');
    }

    const token = this.jwtService.extractTokenFromHeader(authHeader);
    if (!token) {
      this.logger.warn('❌ Invalid authorization header format');
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const decodedToken = this.jwtService.validateToken(token);
    if (!decodedToken.valid) {
      this.logger.warn(`❌ Token validation failed: ${decodedToken.error}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach user info to request
    request.user = decodedToken.payload;

    // Add view switching context
    request.viewSwitching = {
      isImpersonating: this.jwtService.isImpersonating(decodedToken.payload!),
      originalUserId: this.jwtService.getRealUserId(decodedToken.payload!),
      currentUserId: decodedToken.payload!.sub,
    };

    // Check role requirements (considering impersonation)
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (requiredRoles && !requiredRoles.includes(decodedToken.payload!.role)) {
      // For impersonation, check if the original user has the required role
      if (request.viewSwitching.isImpersonating) {
        // In a real implementation, you'd fetch the original user's role from the database
        // For now, we'll assume the original user is a coach if they can impersonate
        const originalRole = 'coach'; // This should be fetched from database
        if (!requiredRoles.includes(originalRole)) {
          this.logger.warn(
            `❌ Insufficient role during impersonation: current=${decodedToken.payload!.role}, original=${originalRole}, required: ${requiredRoles.join(', ')}`
          );
          throw new ForbiddenException('Insufficient permissions');
        }
      } else {
        this.logger.warn(
          `❌ Insufficient role: ${decodedToken.payload!.role}, required: ${requiredRoles.join(', ')}`
        );
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    // Check permission requirements
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (requiredPermissions) {
      const hasAllPermissions = requiredPermissions.every(permission =>
        this.jwtService.hasPermission(decodedToken.payload!, permission)
      );

      if (!hasAllPermissions) {
        this.logger.warn(
          `❌ Missing permissions: ${requiredPermissions.join(', ')} for user ${decodedToken.payload!.sub}`
        );
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    const logMessage = request.viewSwitching.isImpersonating 
      ? `✅ Authorized impersonation: ${request.viewSwitching.originalUserId} viewing as ${decodedToken.payload!.sub} (${decodedToken.payload!.role})`
      : `✅ Authorized user ${decodedToken.payload!.sub} (${decodedToken.payload!.role})`;
    
    this.logger.log(logMessage);
    return true;
  }
}

@Injectable()
export class WebSocketJwtGuard implements CanActivate {
  private readonly logger = new Logger(WebSocketJwtGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    // Try to get token from handshake auth or from message data
    let token = client.handshake?.auth?.token;
    
    if (!token && data?.token) {
      token = data.token;
    }

    if (!token) {
      // Try to extract from authorization header
      const authHeader = client.handshake?.headers?.authorization;
      if (authHeader) {
        token = this.jwtService.extractTokenFromHeader(authHeader);
      }
    }

    if (!token) {
      this.logger.warn('❌ No WebSocket authentication token provided');
      client.emit('error', { message: 'Authentication required' });
      client.disconnect();
      return false;
    }

    // Try session token first, then regular token
    let decodedToken = this.jwtService.validateSessionToken(token);
    if (!decodedToken.valid) {
      decodedToken = this.jwtService.validateToken(token);
    }

    if (!decodedToken.valid) {
      this.logger.warn(`❌ WebSocket token validation failed: ${decodedToken.error}`);
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
      return false;
    }

    // Attach user info to client
    client.user = decodedToken.payload;

    this.logger.log(`✅ WebSocket authorized user ${decodedToken.payload!.sub} (${decodedToken.payload!.role})`);
    return true;
  }
}

@Injectable()
export class RecordingAccessGuard implements CanActivate {
  private readonly logger = new Logger(RecordingAccessGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Extract appointment/session ID from request
    const appointmentId = request.params.appointmentId || request.body.appointmentId;
    const sessionId = request.params.sessionId || request.body.sessionId;
    const recordingId = request.params.recordingId;

    // Coaches can access all recordings
    if (user.role === 'coach') {
      return true;
    }

    // Clients can only access their own session recordings
    if (user.role === 'client') {
      // In a real implementation, you'd verify the client has access to this appointment/session
      // For now, we'll check if the sessionId matches their token sessionId
      if (user.sessionId && (sessionId === user.sessionId || appointmentId === user.appointmentId)) {
        return true;
      }

      this.logger.warn(
        `❌ Client ${user.sub} attempted to access unauthorized recording ${recordingId}`
      );
      throw new ForbiddenException('Access denied to this recording');
    }

    return false;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (user.role !== 'admin' && user.role !== 'coach') {
      this.logger.warn(`❌ Non-admin user ${user.sub} attempted admin access`);
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}