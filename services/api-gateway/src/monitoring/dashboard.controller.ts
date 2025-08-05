import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService, DashboardConfig, DashboardData } from './dashboard.service';
import { CustomMetricsService, HealthcareMetrics } from './custom-metrics.service';
import { JwtAuthGuard } from '@clinic/common/auth';
import { RolesGuard, Roles } from '@clinic/common/auth';
import { StructuredLoggerService } from '@clinic/common/logging';

/**
 * Dashboard Controller
 * 
 * Provides REST API endpoints for accessing monitoring dashboards,
 * custom metrics, and real-time healthcare analytics.
 */

@ApiTags('monitoring')
@ApiBearerAuth()
@Controller('monitoring/dashboards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);
  
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly customMetricsService: CustomMetricsService,
    private readonly structuredLogger: StructuredLoggerService
  ) {}
  
  /**
   * Get all available dashboards for the current user
   */
  @Get()
  @Roles('admin', 'manager', 'therapist')
  @ApiOperation({ 
    summary: 'Get available dashboards',
    description: 'Returns all dashboards accessible by the current user role'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available dashboards',
    type: [Object]
  })
  async getAvailableDashboards(@Query('role') userRole: string = 'admin') {
    try {
      const dashboards = this.dashboardService.getAvailableDashboards(userRole);
      
      this.structuredLogger.info('Available dashboards retrieved', {
        operation: 'get_available_dashboards',
        userRole,
        dashboardCount: dashboards.length
      });
      
      return {
        success: true,
        data: dashboards,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Failed to get available dashboards', error);
      throw new HttpException(
        'Failed to retrieve dashboards',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get specific dashboard configuration
   */
  @Get(':dashboardId/config')
  @Roles('admin', 'manager')
  @ApiOperation({ 
    summary: 'Get dashboard configuration',
    description: 'Returns the configuration for a specific dashboard'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard configuration',
    type: Object
  })
  async getDashboardConfig(@Param('dashboardId') dashboardId: string) {
    try {
      const config = this.dashboardService.getDashboardConfig(dashboardId);
      
      if (!config) {
        throw new HttpException(
          `Dashboard not found: ${dashboardId}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: config,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Failed to get dashboard config', error);
      throw new HttpException(
        'Failed to retrieve dashboard configuration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get dashboard data with real-time metrics
   */
  @Get(':dashboardId/data')
  @Roles('admin', 'manager', 'therapist')
  @ApiOperation({ 
    summary: 'Get dashboard data',
    description: 'Returns real-time dashboard data including metrics and alerts'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard data with metrics and alerts',
    type: Object
  })
  async getDashboardData(
    @Param('dashboardId') dashboardId: string,
    @Query('refresh') forceRefresh: boolean = false
  ) {
    try {
      if (forceRefresh) {
        this.dashboardService.clearDashboardCache(dashboardId);
      }
      
      const dashboardData = await this.dashboardService.getDashboardData(dashboardId);
      
      if (!dashboardData) {
        throw new HttpException(
          `Dashboard not found: ${dashboardId}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      this.structuredLogger.info('Dashboard data retrieved', {
        operation: 'get_dashboard_data',
        dashboardId,
        status: dashboardData.status,
        alertCount: dashboardData.alerts.length,
        forceRefresh
      });
      
      return {
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Failed to get dashboard data for ${dashboardId}`, error);
      throw new HttpException(
        'Failed to retrieve dashboard data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get raw healthcare metrics
   */
  @Get('metrics/healthcare')
  @Roles('admin', 'manager')
  @ApiOperation({ 
    summary: 'Get healthcare metrics',
    description: 'Returns raw healthcare metrics data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Healthcare metrics data',
    type: Object
  })
  async getHealthcareMetrics() {
    try {
      const metrics = await this.customMetricsService.collectHealthcareMetrics();
      
      this.structuredLogger.info('Healthcare metrics retrieved', {
        operation: 'get_healthcare_metrics',
        activeUsers: metrics.activeUsers.total,
        completedSessions: metrics.sessions.completed
      });
      
      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Failed to get healthcare metrics', error);
      throw new HttpException(
        'Failed to retrieve healthcare metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get system health status
   */
  @Get('health')
  @Roles('admin', 'manager', 'therapist')
  @ApiOperation({ 
    summary: 'Get system health',
    description: 'Returns current system health status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System health status',
    type: Object
  })
  async getSystemHealth() {
    try {
      const metrics = await this.customMetricsService.collectHealthcareMetrics();
      const systemHealth = metrics.systemHealth;
      
      // Determine overall health status
      const healthStatus = this.calculateHealthStatus(systemHealth);
      
      return {
        success: true,
        data: {
          status: healthStatus,
          metrics: systemHealth,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0'
        }
      };
      
    } catch (error) {
      this.logger.error('Failed to get system health', error);
      throw new HttpException(
        'Failed to retrieve system health',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Create custom dashboard
   */
  @Post()
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Create custom dashboard',
    description: 'Creates a new custom monitoring dashboard'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Dashboard created successfully'
  })
  async createCustomDashboard(@Body() dashboardConfig: DashboardConfig) {
    try {
      // Validate dashboard configuration
      this.validateDashboardConfig(dashboardConfig);
      
      await this.dashboardService.createCustomDashboard(dashboardConfig);
      
      this.structuredLogger.info('Custom dashboard created', {
        operation: 'create_custom_dashboard',
        dashboardId: dashboardConfig.dashboardId,
        widgetCount: dashboardConfig.widgets.length
      });
      
      return {
        success: true,
        message: 'Dashboard created successfully',
        dashboardId: dashboardConfig.dashboardId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Failed to create custom dashboard', error);
      throw new HttpException(
        'Failed to create dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Update dashboard configuration
   */
  @Put(':dashboardId/config')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Update dashboard configuration',
    description: 'Updates the configuration of an existing dashboard'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard updated successfully'
  })
  async updateDashboardConfig(
    @Param('dashboardId') dashboardId: string,
    @Body() updates: Partial<DashboardConfig>
  ) {
    try {
      await this.dashboardService.updateDashboardConfig(dashboardId, updates);
      
      this.structuredLogger.info('Dashboard configuration updated', {
        operation: 'update_dashboard_config',
        dashboardId,
        updates: Object.keys(updates)
      });
      
      return {
        success: true,
        message: 'Dashboard configuration updated successfully',
        dashboardId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new HttpException(
          `Dashboard not found: ${dashboardId}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      this.logger.error('Failed to update dashboard config', error);
      throw new HttpException(
        'Failed to update dashboard configuration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Clear dashboard cache
   */
  @Delete(':dashboardId/cache')
  @Roles('admin')
  @ApiOperation({ 
    summary: 'Clear dashboard cache',
    description: 'Clears the cache for a specific dashboard to force data refresh'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache cleared successfully'
  })
  async clearDashboardCache(@Param('dashboardId') dashboardId: string) {
    try {
      this.dashboardService.clearDashboardCache(dashboardId);
      
      return {
        success: true,
        message: 'Dashboard cache cleared successfully',
        dashboardId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Failed to clear dashboard cache', error);
      throw new HttpException(
        'Failed to clear dashboard cache',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  /**
   * Get dashboard alerts
   */
  @Get(':dashboardId/alerts')
  @Roles('admin', 'manager')
  @ApiOperation({ 
    summary: 'Get dashboard alerts',
    description: 'Returns current alerts for a specific dashboard'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard alerts',
    type: [Object]
  })
  async getDashboardAlerts(@Param('dashboardId') dashboardId: string) {
    try {
      const dashboardData = await this.dashboardService.getDashboardData(dashboardId);
      
      if (!dashboardData) {
        throw new HttpException(
          `Dashboard not found: ${dashboardId}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      return {
        success: true,
        data: {
          alerts: dashboardData.alerts,
          status: dashboardData.status,
          alertCount: dashboardData.alerts.length
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Failed to get dashboard alerts', error);
      throw new HttpException(
        'Failed to retrieve dashboard alerts',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  // Helper methods
  
  private calculateHealthStatus(systemHealth: any): 'healthy' | 'warning' | 'critical' {
    const thresholds = {
      apiResponseTime: 2000, // ms
      memoryUsage: 80, // MB
      cpuUsage: 85, // percentage
      diskUsage: 90 // percentage
    };
    
    if (
      systemHealth.apiResponseTime > thresholds.apiResponseTime * 2 ||
      systemHealth.memoryUsage > 150 ||
      systemHealth.cpuUsage > 95 ||
      systemHealth.diskUsage > 95
    ) {
      return 'critical';
    }
    
    if (
      systemHealth.apiResponseTime > thresholds.apiResponseTime ||
      systemHealth.memoryUsage > thresholds.memoryUsage ||
      systemHealth.cpuUsage > thresholds.cpuUsage ||
      systemHealth.diskUsage > thresholds.diskUsage
    ) {
      return 'warning';
    }
    
    return 'healthy';
  }
  
  private validateDashboardConfig(config: DashboardConfig): void {
    if (!config.dashboardId || !config.name) {
      throw new HttpException(
        'Dashboard ID and name are required',
        HttpStatus.BAD_REQUEST
      );
    }
    
    if (!config.widgets || config.widgets.length === 0) {
      throw new HttpException(
        'Dashboard must have at least one widget',
        HttpStatus.BAD_REQUEST
      );
    }
    
    if (!config.accessRoles || config.accessRoles.length === 0) {
      throw new HttpException(
        'Dashboard must specify access roles',
        HttpStatus.BAD_REQUEST
      );
    }
    
    // Validate widget configurations
    config.widgets.forEach((widget, index) => {
      if (!widget.id || !widget.type || !widget.title || !widget.dataSource) {
        throw new HttpException(
          `Widget ${index} is missing required fields`,
          HttpStatus.BAD_REQUEST
        );
      }
    });
  }
}