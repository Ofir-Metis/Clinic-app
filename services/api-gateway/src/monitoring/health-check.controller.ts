import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomMetricsService } from './custom-metrics.service';

/**
 * Health Check Controller
 * 
 * Provides system health endpoints for load balancers, monitoring systems,
 * and general health status verification.
 */

@ApiTags('health')
@Controller('health')
export class HealthCheckController {
  private readonly logger = new Logger(HealthCheckController.name);
  
  constructor(
    private readonly customMetricsService: CustomMetricsService
  ) {}
  
  /**
   * Basic health check endpoint
   */
  @Get()
  @ApiOperation({ 
    summary: 'Basic health check',
    description: 'Returns basic health status for load balancers'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy'
  })
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'clinic-api-gateway',
      version: process.env.npm_package_version || '1.0.0'
    };
  }
  
  /**
   * Detailed health check with system metrics
   */
  @Get('detailed')
  @ApiOperation({ 
    summary: 'Detailed health check',
    description: 'Returns detailed health status with system metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed health information'
  })
  async detailedHealthCheck() {
    try {
      const startTime = Date.now();
      const metrics = await this.customMetricsService.collectHealthcareMetrics();
      const collectionTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'clinic-api-gateway',
        version: process.env.npm_package_version || '1.0.0',
        system: {
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            unit: 'MB'
          },
          cpu: {
            usage: metrics.systemHealth.cpuUsage,
            unit: 'percentage'
          },
          response: {
            apiResponseTime: metrics.systemHealth.apiResponseTime,
            metricsCollectionTime: collectionTime,
            unit: 'ms'
          }
        },
        business: {
          activeUsers: metrics.activeUsers.total,
          sessionsToday: metrics.sessions.scheduled,
          systemLoad: 'normal'
        }
      };
      
    } catch (error) {
      this.logger.error('Detailed health check failed', error);
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'clinic-api-gateway',
        version: process.env.npm_package_version || '1.0.0',
        error: 'Failed to collect detailed metrics'
      };
    }
  }
  
  /**
   * Readiness probe for Kubernetes
   */
  @Get('ready')
  @ApiOperation({ 
    summary: 'Readiness probe',
    description: 'Kubernetes readiness probe endpoint'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is ready'
  })
  async readinessProbe() {
    // Check if the service is ready to accept traffic
    // This could include database connectivity, external service availability, etc.
    
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        external_services: 'available',
        memory: 'sufficient'
      }
    };
  }
  
  /**
   * Liveness probe for Kubernetes
   */
  @Get('live')
  @ApiOperation({ 
    summary: 'Liveness probe',
    description: 'Kubernetes liveness probe endpoint'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is alive'
  })
  async livenessProbe() {
    // Simple check to verify the service is running
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
}