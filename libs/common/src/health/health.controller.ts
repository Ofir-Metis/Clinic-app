/**
 * Health Controller - HTTP endpoints for health checks and monitoring
 * Provides standardized health check endpoints for load balancers and monitoring systems
 */

import { Controller, Get, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { HealthCheckService, HealthStatus } from './health-check.service';
import { MonitoringService } from '../monitoring/monitoring.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly monitoringService: MonitoringService
  ) {}

  /**
   * Simple health check endpoint
   * Used by load balancers and basic monitoring
   */
  @Get()
  async getHealth() {
    return this.healthCheckService.getSimpleHealthStatus();
  }

  /**
   * Liveness probe endpoint
   * Indicates if the application is running
   */
  @Get('live')
  async getLiveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Service is alive',
    };
  }

  /**
   * Readiness probe endpoint
   * Indicates if the application is ready to serve traffic
   */
  @Get('ready')
  async getReadiness() {
    const health = await this.healthCheckService.performHealthCheck();
    
    const isReady = health.status === 'healthy' || health.status === 'degraded';
    
    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      health: health.status,
      checks: health.checks.filter(check => check.status === 'fail').length,
      dependencies: health.dependencies.filter(dep => dep.status === 'unavailable').length,
    };
  }

  /**
   * Comprehensive health check endpoint
   * Provides detailed health information
   */
  @Get('detailed')
  async getDetailedHealth(): Promise<HealthStatus> {
    return this.healthCheckService.performHealthCheck();
  }

  /**
   * System metrics endpoint
   */
  @Get('metrics')
  async getMetrics() {
    const systemSnapshot = await this.monitoringService.getSystemSnapshot();
    const monitoringStats = this.monitoringService.getMonitoringStats();
    
    return {
      timestamp: new Date().toISOString(),
      system: systemSnapshot,
      monitoring: monitoringStats,
    };
  }

  /**
   * Performance metrics endpoint
   */
  @Get('performance')
  async getPerformanceMetrics() {
    const requestMetrics = this.healthCheckService.getRequestMetrics();
    const monitoringStats = this.monitoringService.getMonitoringStats();
    
    return {
      timestamp: new Date().toISOString(),
      requests: requestMetrics,
      monitoring: monitoringStats.requestStats,
      alerts: {
        active: this.monitoringService.getActiveAlerts().length,
        recent: this.monitoringService.getActiveAlerts().slice(0, 5),
      },
    };
  }

  /**
   * Service status endpoint for monitoring dashboards
   */
  @Get('status')
  async getServiceStatus() {
    const health = await this.healthCheckService.performHealthCheck();
    const metrics = await this.monitoringService.getSystemSnapshot();
    const activeAlerts = this.monitoringService.getActiveAlerts();
    
    // Determine service status based on health and alerts
    let serviceStatus = 'operational';
    
    if (health.status === 'unhealthy') {
      serviceStatus = 'major_outage';
    } else if (health.status === 'degraded' || activeAlerts.some(a => a.level === 'critical')) {
      serviceStatus = 'degraded_performance';
    } else if (activeAlerts.some(a => a.level === 'warning')) {
      serviceStatus = 'minor_issues';
    }
    
    return {
      status: serviceStatus,
      timestamp: new Date().toISOString(),
      uptime: health.uptime,
      version: health.version,
      environment: health.environment,
      summary: {
        health: health.status,
        failedChecks: health.checks.filter(c => c.status === 'fail').length,
        unavailableDependencies: health.dependencies.filter(d => d.status === 'unavailable').length,
        activeAlerts: activeAlerts.length,
        criticalAlerts: activeAlerts.filter(a => a.level === 'critical').length,
      },
      performance: {
        responseTime: metrics.performance.responseTime,
        errorRate: metrics.performance.errorRate,
        throughput: metrics.performance.throughput,
        memoryUsage: metrics.resources.memoryUsage,
      },
      incidents: activeAlerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        level: alert.level,
        started: alert.timestamp,
        description: alert.description,
      })),
    };
  }

  /**
   * Dependencies status endpoint
   */
  @Get('dependencies')
  async getDependenciesStatus() {
    const health = await this.healthCheckService.performHealthCheck();
    
    return {
      timestamp: new Date().toISOString(),
      dependencies: health.dependencies,
      summary: {
        total: health.dependencies.length,
        available: health.dependencies.filter(d => d.status === 'available').length,
        unavailable: health.dependencies.filter(d => d.status === 'unavailable').length,
        degraded: health.dependencies.filter(d => d.status === 'degraded').length,
      },
    };
  }

  /**
   * Alerts endpoint
   */
  @Get('alerts')
  async getAlerts() {
    const activeAlerts = this.monitoringService.getActiveAlerts();
    
    return {
      timestamp: new Date().toISOString(),
      alerts: activeAlerts,
      summary: {
        total: activeAlerts.length,
        critical: activeAlerts.filter(a => a.level === 'critical').length,
        warning: activeAlerts.filter(a => a.level === 'warning').length,
        info: activeAlerts.filter(a => a.level === 'info').length,
      },
    };
  }

  /**
   * Version and build information
   */
  @Get('version')
  async getVersionInfo() {
    return {
      version: process.env.npm_package_version || '1.0.0',
      name: process.env.npm_package_name || 'clinic-app',
      description: process.env.npm_package_description || 'Clinic Management Application',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      buildTime: process.env.BUILD_TIME || 'unknown',
      gitCommit: process.env.GIT_COMMIT || 'unknown',
      timestamp: new Date().toISOString(),
    };
  }
}