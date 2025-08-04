/**
 * MonitoringController - Advanced system monitoring and alerting
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
import { MonitoringService } from './monitoring.service';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // in seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  channels: string[]; // email, slack, sms, webhook
  tags: Record<string, string>;
}

export interface MetricQuery {
  metric: string;
  startTime: string;
  endTime: string;
  interval?: string;
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'count';
  filters?: Record<string, string>;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  layout: 'grid' | 'list' | 'custom';
  widgets: DashboardWidget[];
  refreshInterval: number;
  shared: boolean;
  createdBy: string;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'stat' | 'gauge' | 'table' | 'alert_list';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: {
    metric?: string;
    query?: string;
    timeRange?: string;
    visualization?: 'line' | 'bar' | 'pie' | 'area';
    thresholds?: Array<{ value: number; color: string }>;
  };
}

@Controller('monitoring')
@UseGuards(JwtAuthGuard)
export class MonitoringController {
  private readonly logger = new Logger(MonitoringController.name);

  constructor(private monitoringService: MonitoringService) {}

  /**
   * Get monitoring overview and health status
   */
  @Get('overview')
  @RequireRoles('admin')
  async getMonitoringOverview(@Request() req: any) {
    try {
      const overview = await this.monitoringService.getMonitoringOverview();
      
      this.logger.log(`Admin ${req.user.sub} viewed monitoring overview`);
      
      return {
        success: true,
        data: overview,
      };
    } catch (error) {
      this.logger.error('Failed to get monitoring overview:', error);
      throw new HttpException(
        'Failed to retrieve monitoring overview',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get system metrics with time series data
   */
  @Post('metrics/query')
  @RequireRoles('admin')
  async queryMetrics(
    @Body() query: MetricQuery,
    @Request() req: any,
  ) {
    try {
      const metrics = await this.monitoringService.queryMetrics(query);
      
      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      this.logger.error('Failed to query metrics:', error);
      throw new HttpException(
        'Failed to query metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get real-time system status
   */
  @Get('status/realtime')
  @RequireRoles('admin')
  async getRealtimeStatus(@Request() req: any) {
    try {
      const status = await this.monitoringService.getRealtimeStatus();
      
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      this.logger.error('Failed to get realtime status:', error);
      throw new HttpException(
        'Failed to retrieve realtime status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Alert Management
   */
  @Get('alerts/rules')
  @RequireRoles('admin')
  async getAlertRules(@Request() req: any) {
    try {
      const rules = await this.monitoringService.getAlertRules();
      
      return {
        success: true,
        data: rules,
      };
    } catch (error) {
      this.logger.error('Failed to get alert rules:', error);
      throw new HttpException(
        'Failed to retrieve alert rules',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('alerts/rules')
  @RequireRoles('admin')
  async createAlertRule(
    @Body() rule: Omit<AlertRule, 'id'>,
    @Request() req: any,
  ) {
    try {
      const createdRule = await this.monitoringService.createAlertRule(
        rule,
        req.user.sub
      );
      
      this.logger.log(`Admin ${req.user.sub} created alert rule: ${rule.name}`);
      
      return {
        success: true,
        data: createdRule,
        message: 'Alert rule created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create alert rule:', error);
      throw new HttpException(
        'Failed to create alert rule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('alerts/rules/:ruleId')
  @RequireRoles('admin')
  async updateAlertRule(
    @Param('ruleId') ruleId: string,
    @Body() rule: Partial<AlertRule>,
    @Request() req: any,
  ) {
    try {
      const updatedRule = await this.monitoringService.updateAlertRule(
        ruleId,
        rule,
        req.user.sub
      );
      
      this.logger.log(`Admin ${req.user.sub} updated alert rule ${ruleId}`);
      
      return {
        success: true,
        data: updatedRule,
        message: 'Alert rule updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update alert rule:', error);
      throw new HttpException(
        'Failed to update alert rule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('alerts/rules/:ruleId')
  @RequireRoles('admin')
  async deleteAlertRule(
    @Param('ruleId') ruleId: string,
    @Request() req: any,
  ) {
    try {
      await this.monitoringService.deleteAlertRule(ruleId, req.user.sub);
      
      this.logger.log(`Admin ${req.user.sub} deleted alert rule ${ruleId}`);
      
      return {
        success: true,
        message: 'Alert rule deleted successfully',
      };
    } catch (error) {
      this.logger.error('Failed to delete alert rule:', error);
      throw new HttpException(
        'Failed to delete alert rule',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get active alerts
   */
  @Get('alerts/active')
  @RequireRoles('admin')
  async getActiveAlerts(
    @Query('severity') severity?: string,
    @Query('limit') limit: number = 100,
    @Request() req?: any,
  ) {
    try {
      const alerts = await this.monitoringService.getActiveAlerts({
        severity,
        limit,
      });
      
      return {
        success: true,
        data: alerts,
      };
    } catch (error) {
      this.logger.error('Failed to get active alerts:', error);
      throw new HttpException(
        'Failed to retrieve active alerts',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Acknowledge alert
   */
  @Post('alerts/:alertId/acknowledge')
  @RequireRoles('admin')
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Body() body: { notes?: string },
    @Request() req?: any,
  ) {
    try {
      await this.monitoringService.acknowledgeAlert(
        alertId,
        req.user.sub,
        body.notes
      );
      
      this.logger.log(`Admin ${req.user.sub} acknowledged alert ${alertId}`);
      
      return {
        success: true,
        message: 'Alert acknowledged successfully',
      };
    } catch (error) {
      this.logger.error('Failed to acknowledge alert:', error);
      throw new HttpException(
        'Failed to acknowledge alert',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Resolve alert
   */
  @Post('alerts/:alertId/resolve')
  @RequireRoles('admin')
  async resolveAlert(
    @Param('alertId') alertId: string,
    @Body() body: { resolution: string },
    @Request() req: any,
  ) {
    try {
      await this.monitoringService.resolveAlert(
        alertId,
        req.user.sub,
        body.resolution
      );
      
      this.logger.log(`Admin ${req.user.sub} resolved alert ${alertId}`);
      
      return {
        success: true,
        message: 'Alert resolved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to resolve alert:', error);
      throw new HttpException(
        'Failed to resolve alert',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Dashboard Management
   */
  @Get('dashboards')
  @RequireRoles('admin')
  async getDashboards(@Request() req: any) {
    try {
      const dashboards = await this.monitoringService.getDashboards(req.user.sub);
      
      return {
        success: true,
        data: dashboards,
      };
    } catch (error) {
      this.logger.error('Failed to get dashboards:', error);
      throw new HttpException(
        'Failed to retrieve dashboards',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('dashboards')
  @RequireRoles('admin')
  async createDashboard(
    @Body() dashboard: Omit<DashboardConfig, 'id' | 'createdBy'>,
    @Request() req: any,
  ) {
    try {
      const createdDashboard = await this.monitoringService.createDashboard(
        dashboard,
        req.user.sub
      );
      
      this.logger.log(`Admin ${req.user.sub} created dashboard: ${dashboard.name}`);
      
      return {
        success: true,
        data: createdDashboard,
        message: 'Dashboard created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create dashboard:', error);
      throw new HttpException(
        'Failed to create dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('dashboards/:dashboardId')
  @RequireRoles('admin')
  async getDashboard(
    @Param('dashboardId') dashboardId: string,
    @Request() req: any,
  ) {
    try {
      const dashboard = await this.monitoringService.getDashboard(dashboardId);
      
      return {
        success: true,
        data: dashboard,
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard ${dashboardId}:`, error);
      throw new HttpException(
        'Failed to retrieve dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Performance Analytics
   */
  @Get('performance/summary')
  @RequireRoles('admin')
  async getPerformanceSummary(
    @Query('timeRange') timeRange: string = '24h',
    @Request() req?: any,
  ) {
    try {
      const summary = await this.monitoringService.getPerformanceSummary(timeRange);
      
      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      this.logger.error('Failed to get performance summary:', error);
      throw new HttpException(
        'Failed to retrieve performance summary',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('performance/bottlenecks')
  @RequireRoles('admin')
  async getBottlenecks(@Request() req: any) {
    try {
      const bottlenecks = await this.monitoringService.getBottlenecks();
      
      return {
        success: true,
        data: bottlenecks,
      };
    } catch (error) {
      this.logger.error('Failed to get bottlenecks:', error);
      throw new HttpException(
        'Failed to retrieve bottlenecks',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Service Health Checks
   */
  @Get('health/services')
  @RequireRoles('admin')
  async getServiceHealth(@Request() req: any) {
    try {
      const health = await this.monitoringService.getServiceHealth();
      
      return {
        success: true,
        data: health,
      };
    } catch (error) {
      this.logger.error('Failed to get service health:', error);
      throw new HttpException(
        'Failed to retrieve service health',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('health/services/:serviceName/check')
  @RequireRoles('admin')
  async runHealthCheck(
    @Param('serviceName') serviceName: string,
    @Request() req: any,
  ) {
    try {
      const result = await this.monitoringService.runHealthCheck(serviceName);
      
      this.logger.log(`Admin ${req.user.sub} ran health check for ${serviceName}`);
      
      return {
        success: true,
        data: result,
        message: 'Health check completed',
      };
    } catch (error) {
      this.logger.error(`Failed to run health check for ${serviceName}:`, error);
      throw new HttpException(
        'Failed to run health check',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Log Analytics
   */
  @Post('logs/search')
  @RequireRoles('admin')
  async searchLogs(
    @Body() searchRequest: {
      query: string;
      timeRange: string;
      services?: string[];
      level?: string;
      limit?: number;
    },
    @Request() req?: any,
  ) {
    try {
      const logs = await this.monitoringService.searchLogs(searchRequest);
      
      return {
        success: true,
        data: logs,
      };
    } catch (error) {
      this.logger.error('Failed to search logs:', error);
      throw new HttpException(
        'Failed to search logs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('logs/patterns')
  @RequireRoles('admin')
  async getLogPatterns(
    @Query('timeRange') timeRange: string = '24h',
    @Request() req?: any,
  ) {
    try {
      const patterns = await this.monitoringService.getLogPatterns(timeRange);
      
      return {
        success: true,
        data: patterns,
      };
    } catch (error) {
      this.logger.error('Failed to get log patterns:', error);
      throw new HttpException(
        'Failed to retrieve log patterns',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}