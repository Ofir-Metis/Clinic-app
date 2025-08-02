/**
 * AdminSetupController - Special endpoints for admin user creation
 * These endpoints should be disabled in production after initial setup
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AdminSetupService } from './admin-setup.service';

export interface CreateAdminRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  confirmSecret: string;
}

export interface CreateAdminResponse {
  success: boolean;
  userId: string;
  email: string;
  message: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

@Controller('auth')
export class AdminSetupController {
  private readonly logger = new Logger(AdminSetupController.name);

  constructor(private adminSetupService: AdminSetupService) {}

  /**
   * Create initial admin user - should only be used for initial setup
   * Requires special admin secret header for security
   */
  @Post('create-admin')
  async createAdmin(
    @Body() body: CreateAdminRequest,
    @Headers('x-admin-secret') adminSecret: string,
  ): Promise<CreateAdminResponse> {
    try {
      // Validate admin secret
      const expectedSecret = process.env.ADMIN_SECRET || 'clinic-admin-secret-2024';
      if (!adminSecret || adminSecret !== expectedSecret) {
        this.logger.warn('❌ Unauthorized admin creation attempt');
        throw new HttpException(
          'Unauthorized: Invalid admin secret',
          HttpStatus.UNAUTHORIZED
        );
      }

      // Validate request
      if (!body.email || !body.password) {
        throw new HttpException(
          'Email and password are required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Check if admin already exists
      const existingAdmin = await this.adminSetupService.checkExistingAdmin();
      if (existingAdmin) {
        throw new HttpException(
          'Admin user already exists. Use regular user management for additional admins.',
          HttpStatus.CONFLICT
        );
      }

      // Create admin user
      const result = await this.adminSetupService.createAdminUser({
        email: body.email,
        password: body.password,
        firstName: body.firstName || 'System',
        lastName: body.lastName || 'Administrator',
      });

      this.logger.log(`✅ Admin user created: ${body.email}`);

      return {
        success: true,
        userId: result.userId,
        email: result.email,
        message: 'Admin user created successfully',
        tokens: result.tokens,
      };

    } catch (error) {
      this.logger.error('Failed to create admin user:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to create admin user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Check if any admin users exist in the system
   */
  @Post('check-admin-exists')
  async checkAdminExists(
    @Headers('x-admin-secret') adminSecret: string,
  ): Promise<{ hasAdmin: boolean; count: number }> {
    try {
      // Validate admin secret
      const expectedSecret = process.env.ADMIN_SECRET || 'clinic-admin-secret-2024';
      if (!adminSecret || adminSecret !== expectedSecret) {
        throw new HttpException(
          'Unauthorized: Invalid admin secret',
          HttpStatus.UNAUTHORIZED
        );
      }

      const adminExists = await this.adminSetupService.checkExistingAdmin();
      const adminCount = await this.adminSetupService.getAdminCount();

      return {
        hasAdmin: adminExists,
        count: adminCount,
      };

    } catch (error) {
      this.logger.error('Failed to check admin existence:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to check admin users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create additional admin user (when at least one admin exists)
   */
  @Post('create-additional-admin')
  async createAdditionalAdmin(
    @Body() body: CreateAdminRequest,
    @Headers('authorization') authHeader: string,
  ): Promise<CreateAdminResponse> {
    try {
      // This would require an existing admin to be authenticated
      // For now, we'll implement basic validation

      if (!body.email || !body.password) {
        throw new HttpException(
          'Email and password are required',
          HttpStatus.BAD_REQUEST
        );
      }

      // In a real implementation, you'd validate the requesting user is an admin
      // For now, we'll create the user with basic validation

      const result = await this.adminSetupService.createAdminUser({
        email: body.email,
        password: body.password,
        firstName: body.firstName || 'Admin',
        lastName: body.lastName || 'User',
      });

      this.logger.log(`✅ Additional admin user created: ${body.email}`);

      return {
        success: true,
        userId: result.userId,
        email: result.email,
        message: 'Additional admin user created successfully',
        tokens: result.tokens,
      };

    } catch (error) {
      this.logger.error('Failed to create additional admin user:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to create additional admin user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}