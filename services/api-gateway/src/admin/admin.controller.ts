/**
 * AdminController - System administration dashboard endpoints
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard, RequireRoles } from '@clinic/common';
import { AdminService } from './admin.service';

export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    lastCheck: string;
    details?: any;
  }[];
  metrics: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    database: {
      connections: number;
      queries: number;
    };
  };
  alerts: {
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    resolved: boolean;
  }[];
}

export interface UserManagementResponse {
  users: {
    id: string;
    email: string;
    role: string;
    status: 'active' | 'inactive' | 'suspended';
    lastLogin: string;
    createdAt: string;
    subscription?: {
      plan: string;
      status: string;
      expiresAt: string;
    };
  }[];
  stats: {
    totalUsers: number;
    activeUsers: number;
    coaches: number;
    clients: number;
    admins: number;
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
@RequireRoles('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private adminService: AdminService) {}

  /**
   * Get system health overview
   */
  @Get('health')
  async getSystemHealth(@Request() req: any): Promise<SystemHealthResponse> {
    try {
      this.logger.log(`Admin ${req.user.sub} requested system health`);
      return await this.adminService.getSystemHealth();
    } catch (error) {
      this.logger.error('Failed to get system health:', error);
      throw new HttpException(
        'Failed to retrieve system health',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get system metrics and performance data
   */
  @Get('metrics')
  async getSystemMetrics(
    @Query('timeframe') timeframe: string = '1h',
    @Query('metric') metric?: string,
  ) {
    try {
      return await this.adminService.getSystemMetrics(timeframe, metric);
    } catch (error) {
      this.logger.error('Failed to get system metrics:', error);
      throw new HttpException(
        'Failed to retrieve system metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get system logs with filtering
   */
  @Get('logs')
  async getSystemLogs(
    @Query('level') level?: string,
    @Query('service') service?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ) {
    try {
      return await this.adminService.getSystemLogs({
        level,
        service,
        startDate,
        endDate,
        page,
        limit,
      });
    } catch (error) {
      this.logger.error('Failed to get system logs:', error);
      throw new HttpException(
        'Failed to retrieve system logs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get user management data
   */
  @Get('users')
  async getUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ): Promise<UserManagementResponse> {
    try {
      return await this.adminService.getUsers({
        role,
        status,
        search,
        page,
        limit,
      });
    } catch (error) {
      this.logger.error('Failed to get users:', error);
      throw new HttpException(
        'Failed to retrieve users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update user status
   */
  @Put('users/:userId/status')
  async updateUserStatus(
    @Param('userId') userId: string,
    @Body() body: { status: 'active' | 'inactive' | 'suspended'; reason?: string },
    @Request() req: any,
  ) {
    try {
      const result = await this.adminService.updateUserStatus(
        userId,
        body.status,
        req.user.sub,
        body.reason
      );

      this.logger.log(
        `Admin ${req.user.sub} updated user ${userId} status to ${body.status}`
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to update user status:', error);
      throw new HttpException(
        'Failed to update user status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get subscription analytics
   */
  @Get('subscriptions')
  async getSubscriptions(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    try {
      return await this.adminService.getSubscriptions({ status, plan });
    } catch (error) {
      this.logger.error('Failed to get subscriptions:', error);
      throw new HttpException(
        'Failed to retrieve subscriptions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update subscription
   */
  @Put('subscriptions/:subscriptionId')
  async updateSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: {
      plan?: string;
      status?: string;
      expiresAt?: string;
    },
    @Request() req: any,
  ) {
    try {
      const result = await this.adminService.updateSubscription(
        subscriptionId,
        body,
        req.user.sub
      );

      this.logger.log(
        `Admin ${req.user.sub} updated subscription ${subscriptionId}`
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to update subscription:', error);
      throw new HttpException(
        'Failed to update subscription',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get system configuration
   */
  @Get('config')
  async getSystemConfig() {
    try {
      return await this.adminService.getSystemConfig();
    } catch (error) {
      this.logger.error('Failed to get system config:', error);
      throw new HttpException(
        'Failed to retrieve system configuration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update system configuration
   */
  @Put('config')
  async updateSystemConfig(
    @Body() config: Record<string, any>,
    @Request() req: any,
  ) {
    try {
      const result = await this.adminService.updateSystemConfig(
        config,
        req.user.sub
      );

      this.logger.log(`Admin ${req.user.sub} updated system configuration`);

      return result;
    } catch (error) {
      this.logger.error('Failed to update system config:', error);
      throw new HttpException(
        'Failed to update system configuration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Execute system maintenance tasks
   */
  @Post('maintenance')
  async executeMaintenanceTask(
    @Body() body: {
      task: 'cleanup-logs' | 'optimize-db' | 'clear-cache' | 'backup-data';
      parameters?: Record<string, any>;
    },
    @Request() req: any,
  ) {
    try {
      this.logger.log(
        `Admin ${req.user.sub} initiated maintenance task: ${body.task}`
      );

      const result = await this.adminService.executeMaintenanceTask(
        body.task,
        body.parameters,
        req.user.sub
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to execute maintenance task:', error);
      throw new HttpException(
        'Failed to execute maintenance task',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get audit logs
   */
  @Get('audit')
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    try {
      return await this.adminService.getAuditLogs({
        userId,
        action,
        startDate,
        endDate,
        page,
        limit,
      });
    } catch (error) {
      this.logger.error('Failed to get audit logs:', error);
      throw new HttpException(
        'Failed to retrieve audit logs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get feature flags and toggles
   */
  @Get('features')
  async getFeatureFlags() {
    try {
      return await this.adminService.getFeatureFlags();
    } catch (error) {
      this.logger.error('Failed to get feature flags:', error);
      throw new HttpException(
        'Failed to retrieve feature flags',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update feature flags
   */
  @Put('features/:flagName')
  async updateFeatureFlag(
    @Param('flagName') flagName: string,
    @Body() body: { enabled: boolean; rolloutPercentage?: number },
    @Request() req: any,
  ) {
    try {
      const result = await this.adminService.updateFeatureFlag(
        flagName,
        body.enabled,
        body.rolloutPercentage,
        req.user.sub
      );

      this.logger.log(
        `Admin ${req.user.sub} updated feature flag ${flagName} to ${body.enabled}`
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to update feature flag:', error);
      throw new HttpException(
        'Failed to update feature flag',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}