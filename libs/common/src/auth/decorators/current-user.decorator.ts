/**
 * Current User Decorator - Enterprise-grade user extraction decorator
 * Provides type-safe access to authenticated user information
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../types';

/**
 * Decorator to extract the current authenticated user from the request
 * 
 * @example
 * ```typescript
 * @Get('/profile')
 * async getProfile(@CurrentUser() user: User) {
 *   return this.userService.findById(user.id);
 * }
 * 
 * // Extract specific property
 * @Post('/appointments')
 * async createAppointment(
 *   @CurrentUser('id') userId: string,
 *   @Body() dto: CreateAppointmentDto
 * ) {
 *   return this.appointmentService.create(userId, dto);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | any => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as User;
    
    return data ? user?.[data] : user;
  },
);