/**
 * ViewSwitchingGuard - Authentication guard for therapist-client view switching
 * Handles impersonation tokens and permission checks
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, JwtPayload } from './jwt.service';

export interface ViewSwitchingMetadata {
  allowImpersonation?: boolean;
  requireOriginalRole?: 'coach' | 'admin';
  restrictToOwnClients?: boolean;
}

/**
 * Decorator to configure view switching behavior for endpoints
 */
export const ViewSwitching = (options: ViewSwitchingMetadata = {}) => 
  SetMetadata('viewSwitching', {
    allowImpersonation: true,
    requireOriginalRole: 'coach',
    restrictToOwnClients: true,
    ...options,
  });

@Injectable()
export class ViewSwitchingGuard implements CanActivate {
  private readonly logger = new Logger(ViewSwitchingGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const metadata = this.reflector.get<ViewSwitchingMetadata>('viewSwitching', context.getHandler());

    // If no view switching metadata, allow normal access
    if (!metadata) {
      return true;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new ForbiddenException('Authentication required for view switching');
    }

    const token = this.jwtService.extractTokenFromHeader(authHeader);
    if (!token) {
      throw new ForbiddenException('Invalid authentication token format');
    }

    const decoded = this.jwtService.validateToken(token);
    if (!decoded.valid || !decoded.payload) {
      throw new ForbiddenException('Invalid authentication token');
    }

    const payload = decoded.payload;

    // Check if this is an impersonation request
    if (payload.isImpersonating) {
      return this.validateImpersonation(payload, metadata, request);
    }

    // For non-impersonation requests, check if user has permission to impersonate
    if (metadata.requireOriginalRole) {
      const hasRole = payload.role === metadata.requireOriginalRole || payload.role === 'admin';
      if (!hasRole) {
        throw new ForbiddenException(
          `Role ${metadata.requireOriginalRole} or admin required for view switching`
        );
      }
    }

    // Store user info in request for controllers to use
    request.user = payload;
    request.viewSwitching = {
      canImpersonate: this.jwtService.hasPermission(payload, 'clients:impersonate'),
      isImpersonating: false,
    };

    return true;
  }

  private async validateImpersonation(
    payload: JwtPayload,
    metadata: ViewSwitchingMetadata,
    request: any,
  ): Promise<boolean> {
    if (!metadata.allowImpersonation) {
      throw new ForbiddenException('Impersonation not allowed for this endpoint');
    }

    if (!payload.originalUserId || !payload.viewingAsClientId) {
      throw new ForbiddenException('Invalid impersonation token structure');
    }

    // Verify the original user has permission to impersonate
    const originalUserId = payload.originalUserId;
    const clientId = payload.viewingAsClientId;

    // Check if therapist can access this specific client
    if (metadata.restrictToOwnClients) {
      const canAccess = this.jwtService.canAccessClient(originalUserId, clientId);
      if (!canAccess) {
        throw new ForbiddenException(
          `Therapist ${originalUserId} does not have access to client ${clientId}`
        );
      }
    }

    // Check if the request is trying to access resources belonging to the client
    const requestedClientId = this.extractClientIdFromRequest(request);
    if (requestedClientId && requestedClientId !== clientId) {
      throw new ForbiddenException(
        'Cannot access resources for different client during impersonation'
      );
    }

    this.logger.log(
      `✅ Impersonation validated: Therapist ${originalUserId} viewing as client ${clientId}`
    );

    // Store impersonation info in request
    request.user = payload;
    request.viewSwitching = {
      canImpersonate: false, // Can't impersonate while already impersonating
      isImpersonating: true,
      originalUserId,
      viewingAsClientId: clientId,
    };

    return true;
  }

  private extractClientIdFromRequest(request: any): string | null {
    // Try to extract client ID from various parts of the request
    return (
      request.params?.clientId ||
      request.params?.userId ||
      request.query?.clientId ||
      request.body?.clientId ||
      null
    );
  }
}