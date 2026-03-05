/**
 * Roles Guard - Enterprise-grade role-based access control
 * Implements secure role verification with comprehensive logging
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { User } from '../types';
import { CentralizedLoggerService } from '../../logging/centralized-logger.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

import type { UserRole } from '../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly logger: CentralizedLoggerService
  ) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as User;

    if (!user) {
      this.logger.securityLog('Authorization attempt without user', {
        endpoint: request.url,
        method: request.method,
        ipAddress: request.ip,
        userAgent: request.get('User-Agent'),
        requiredRoles: requiredRoles.join(','),
        auditRequired: true,
        alertLevel: 'high',
        dataType: 'system'
      });

      throw new ForbiddenException('Authentication required');
    }

    const hasRole = requiredRoles.some(requiredRole => {
      if (user.roles && Array.isArray(user.roles)) {
        return user.roles.includes(requiredRole);
      }
      return user.role === requiredRole;
    });

    if (!hasRole) {
      this.logger.securityLog('Insufficient role privileges', {
        userId: user.id,
        userRole: user.role || (user.roles ? user.roles.join(',') : 'none'),
        requiredRoles: requiredRoles.join(','),
        endpoint: request.url,
        method: request.method,
        ipAddress: request.ip,
        auditRequired: true,
        alertLevel: 'medium',
        dataType: 'system'
      });

      throw new ForbiddenException('Insufficient permissions');
    }

    // Log successful authorization for audit trails
    this.logger.auditLog('Role-based access granted', {
      userId: user.id,
      userRole: user.role,
      requiredRoles,
      endpoint: request.url,
      method: request.method,
      dataType: 'system',
      auditRequired: true,
      hipaaRelevant: true
    });

    return true;
  }
}