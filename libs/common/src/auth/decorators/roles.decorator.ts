/**
 * Roles Decorator - Type-safe role-based access control decorator
 * Implements enterprise security patterns for role verification
 */

import { SetMetadata } from '@nestjs/common';

import type { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a controller method or class
 * @param roles - Array of roles that can access the resource
 * 
 * @example
 * ```typescript
 * @Roles('admin', 'super_admin')
 * @Get('/admin/users')
 * async getUsers() {
 *   return this.userService.findAll();
 * }
 * ```
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);