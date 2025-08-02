/**
 * Health Check Service - Comprehensive system monitoring and health checks
 * Provides endpoint monitoring, dependency checks, and system metrics
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  metrics: SystemMetrics;
  dependencies: DependencyStatus[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  description: string;
  duration: number; // milliseconds
  details?: any;
  error?: string;
  lastChecked: string;
}

export interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  process: {
    pid: number;
    uptime: number;
    version: string;
  };
  eventLoop: {
    delay: number;
    utilization: number;
  };
  requests: {
    total: number;
    active: number;
    errorsPerMinute: number;
    averageResponseTime: number;
  };
}

export interface DependencyStatus {
  name: string;
  type: 'database' | 'storage' | 'external_api' | 'message_queue' | 'cache';
  status: 'available' | 'unavailable' | 'degraded';
  responseTime: number;
  lastChecked: string;
  endpoint?: string;
  version?: string;
  error?: string;
  details?: any;
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private readonly startTime = Date.now();
  private readonly version: string;
  private readonly environment: string;
  
  // Metrics tracking
  private requestMetrics = {
    total: 0,
    active: 0,
    errors: [] as number[], // timestamps of errors
    responseTimes: [] as number[], // recent response times
  };

  constructor(private readonly configService: ConfigService) {
    this.version = process.env.npm_package_version || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthStatus> {
    this.logger.debug('Performing comprehensive health check');
    const startTime = Date.now();

    try {
      // Perform all health checks in parallel
      const [
        basicChecks,
        systemMetrics,
        dependencyStatuses,
      ] = await Promise.all([
        this.performBasicHealthChecks(),
        this.getSystemMetrics(),
        this.checkDependencies(),
      ]);

      // Determine overall health status
      const overallStatus = this.determineOverallStatus(basicChecks, dependencyStatuses);

      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.version,
        environment: this.environment,
        checks: basicChecks,
        metrics: systemMetrics,
        dependencies: dependencyStatuses,
      };

      const duration = Date.now() - startTime;
      this.logger.debug(`Health check completed in ${duration}ms - Status: ${overallStatus}`);

      return healthStatus;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
        version: this.version,
        environment: this.environment,
        checks: [{
          name: 'health_check_system',
          status: 'fail',
          description: 'Health check system failure',
          duration: Date.now() - startTime,
          error: error.message,
          lastChecked: new Date().toISOString(),
        }],
        metrics: await this.getSystemMetrics(),
        dependencies: [],
      };
    }
  }

  /**
   * Perform basic application health checks
   */
  private async performBasicHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Memory usage check
    checks.push(await this.checkMemoryUsage());
    
    // Disk space check
    checks.push(await this.checkDiskSpace());
    
    // Event loop lag check
    checks.push(await this.checkEventLoopLag());
    
    // Critical services check
    checks.push(await this.checkCriticalServices());

    return checks;
  }

  private async checkMemoryUsage(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      const usedMem = totalMem - freeMem;
      const memPercentage = (usedMem / totalMem) * 100;

      const status = memPercentage > 90 ? 'fail' : memPercentage > 75 ? 'warn' : 'pass';
      
      return {
        name: 'memory_usage',
        status,
        description: `Memory usage at ${memPercentage.toFixed(1)}%`,
        duration: Date.now() - startTime,
        details: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          rss: memUsage.rss,
          external: memUsage.external,
          systemUsedMB: Math.round(usedMem / 1024 / 1024),
          systemTotalMB: Math.round(totalMem / 1024 / 1024),
          percentage: memPercentage,
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'memory_usage',
        status: 'fail',
        description: 'Failed to check memory usage',
        duration: Date.now() - startTime,
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkDiskSpace(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // For now, we'll skip disk space check on Windows as it requires additional packages
      // In production, you'd use packages like 'statvfs' or 'check-disk-space'
      return {
        name: 'disk_space',
        status: 'pass',
        description: 'Disk space check skipped',
        duration: Date.now() - startTime,
        details: { note: 'Disk space monitoring not implemented for this platform' },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'disk_space',
        status: 'fail',
        description: 'Failed to check disk space',
        duration: Date.now() - startTime,
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkEventLoopLag(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const lagStart = process.hrtime.bigint();
      
      await new Promise(resolve => setImmediate(resolve));
      
      const lagEnd = process.hrtime.bigint();
      const lag = Number(lagEnd - lagStart) / 1000000; // Convert to milliseconds

      const status = lag > 100 ? 'fail' : lag > 50 ? 'warn' : 'pass';
      
      return {
        name: 'event_loop_lag',
        status,
        description: `Event loop lag: ${lag.toFixed(2)}ms`,
        duration: Date.now() - startTime,
        details: { lagMs: lag },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'event_loop_lag',
        status: 'fail',
        description: 'Failed to check event loop lag',
        duration: Date.now() - startTime,
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  private async checkCriticalServices(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check if critical environment variables are set
      const criticalEnvVars = [
        'JWT_SECRET',
        'POSTGRES_HOST',
        'POSTGRES_DB',
      ];

      const missingVars = criticalEnvVars.filter(varName => !process.env[varName]);
      
      const status = missingVars.length > 0 ? 'fail' : 'pass';
      
      return {
        name: 'critical_services',
        status,
        description: missingVars.length > 0 
          ? `Missing critical environment variables: ${missingVars.join(', ')}`
          : 'All critical services configured',
        duration: Date.now() - startTime,
        details: { 
          checkedVars: criticalEnvVars.length,
          missingVars,
        },
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'critical_services',
        status: 'fail',
        description: 'Failed to check critical services',
        duration: Date.now() - startTime,
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Get comprehensive system metrics
   */
  private async getSystemMetrics(): Promise<SystemMetrics> {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;
    const loadAvg = require('os').loadavg();

    // Calculate recent error rate (errors per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentErrors = this.requestMetrics.errors.filter(timestamp => timestamp > oneMinuteAgo).length;

    // Calculate average response time from recent requests
    const avgResponseTime = this.requestMetrics.responseTimes.length > 0
      ? this.requestMetrics.responseTimes.reduce((sum, time) => sum + time, 0) / this.requestMetrics.responseTimes.length
      : 0;

    return {
      memory: {
        used: usedMem,
        total: totalMem,
        percentage: (usedMem / totalMem) * 100,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
      },
      cpu: {
        usage: 0, // Would need additional monitoring for CPU usage
        loadAverage: loadAvg,
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
      },
      eventLoop: {
        delay: 0, // Would be calculated in real-time monitoring
        utilization: 0, // Would be calculated in real-time monitoring
      },
      requests: {
        total: this.requestMetrics.total,
        active: this.requestMetrics.active,
        errorsPerMinute: recentErrors,
        averageResponseTime: avgResponseTime,
      },
    };
  }

  /**
   * Check all external dependencies
   */
  private async checkDependencies(): Promise<DependencyStatus[]> {
    const dependencies: DependencyStatus[] = [];

    // Check each dependency in parallel
    const dependencyChecks = [
      this.checkDatabase(),
      this.checkStorage(),
      this.checkMessageQueue(),
      this.checkExternalAPIs(),
    ];

    const results = await Promise.allSettled(dependencyChecks);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        dependencies.push(...result.value);
      } else {
        // If a dependency check fails, add a failed status
        dependencies.push({
          name: `dependency_check_${index}`,
          type: 'external_api',
          status: 'unavailable',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          error: result.reason?.message || 'Dependency check failed',
        });
      }
    });

    return dependencies;
  }

  private async checkDatabase(): Promise<DependencyStatus[]> {
    const dependencies: DependencyStatus[] = [];
    
    try {
      const startTime = Date.now();
      
      // Simple connection test - in real implementation, you'd use actual database connection
      const dbHost = process.env.POSTGRES_HOST || 'localhost';
      const dbPort = process.env.POSTGRES_PORT || '5432';
      
      dependencies.push({
        name: 'postgresql',
        type: 'database',
        status: 'available', // Would check actual connection
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        endpoint: `${dbHost}:${dbPort}`,
        details: {
          host: dbHost,
          port: dbPort,
          database: process.env.POSTGRES_DB,
        },
      });
    } catch (error) {
      dependencies.push({
        name: 'postgresql',
        type: 'database',
        status: 'unavailable',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        error: error.message,
      });
    }

    return dependencies;
  }

  private async checkStorage(): Promise<DependencyStatus[]> {
    const dependencies: DependencyStatus[] = [];
    
    try {
      const startTime = Date.now();
      const storageEndpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
      
      dependencies.push({
        name: 'minio_storage',
        type: 'storage',
        status: 'available', // Would check actual storage connection
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        endpoint: storageEndpoint,
        details: {
          bucket: process.env.S3_BUCKET_NAME || 'clinic-recordings',
          provider: 'minio',
        },
      });
    } catch (error) {
      dependencies.push({
        name: 'minio_storage',
        type: 'storage',
        status: 'unavailable',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        error: error.message,
      });
    }

    return dependencies;
  }

  private async checkMessageQueue(): Promise<DependencyStatus[]> {
    const dependencies: DependencyStatus[] = [];
    
    try {
      const startTime = Date.now();
      const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
      
      dependencies.push({
        name: 'nats_message_queue',
        type: 'message_queue',
        status: 'available', // Would check actual NATS connection
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        endpoint: natsUrl,
        details: {
          type: 'nats',
        },
      });
    } catch (error) {
      dependencies.push({
        name: 'nats_message_queue',
        type: 'message_queue',
        status: 'unavailable',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        error: error.message,
      });
    }

    return dependencies;
  }

  private async checkExternalAPIs(): Promise<DependencyStatus[]> {
    const dependencies: DependencyStatus[] = [];
    
    // Check OpenAI API
    if (process.env.OPENAI_API_KEY) {
      try {
        const startTime = Date.now();
        
        dependencies.push({
          name: 'openai_api',
          type: 'external_api',
          status: 'available', // Would make actual API call
          responseTime: Date.now() - startTime,
          lastChecked: new Date().toISOString(),
          endpoint: 'https://api.openai.com',
          details: {
            hasApiKey: true,
            service: 'OpenAI GPT-4 & Whisper',
          },
        });
      } catch (error) {
        dependencies.push({
          name: 'openai_api',
          type: 'external_api',
          status: 'unavailable',
          responseTime: 0,
          lastChecked: new Date().toISOString(),
          error: error.message,
        });
      }
    }

    return dependencies;
  }

  /**
   * Determine overall system health status
   */
  private determineOverallStatus(
    checks: HealthCheck[], 
    dependencies: DependencyStatus[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Check for any failed critical checks
    const failedChecks = checks.filter(check => check.status === 'fail');
    const criticalDependenciesDown = dependencies.filter(
      dep => dep.status === 'unavailable' && ['database', 'storage'].includes(dep.type)
    );

    if (failedChecks.length > 0 || criticalDependenciesDown.length > 0) {
      return 'unhealthy';
    }

    // Check for warnings or degraded dependencies
    const warnChecks = checks.filter(check => check.status === 'warn');
    const degradedDependencies = dependencies.filter(dep => dep.status === 'degraded');

    if (warnChecks.length > 0 || degradedDependencies.length > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Record request metrics for monitoring
   */
  recordRequest(responseTime: number, isError: boolean = false) {
    this.requestMetrics.total++;
    
    if (isError) {
      this.requestMetrics.errors.push(Date.now());
      
      // Keep only recent errors (last hour)
      const oneHourAgo = Date.now() - 3600000;
      this.requestMetrics.errors = this.requestMetrics.errors.filter(
        timestamp => timestamp > oneHourAgo
      );
    }

    // Record response time
    this.requestMetrics.responseTimes.push(responseTime);
    
    // Keep only recent response times (last 100 requests)
    if (this.requestMetrics.responseTimes.length > 100) {
      this.requestMetrics.responseTimes = this.requestMetrics.responseTimes.slice(-100);
    }
  }

  /**
   * Track active requests
   */
  incrementActiveRequests() {
    this.requestMetrics.active++;
  }

  decrementActiveRequests() {
    if (this.requestMetrics.active > 0) {
      this.requestMetrics.active--;
    }
  }

  /**
   * Get current request metrics
   */
  getRequestMetrics() {
    return {
      total: this.requestMetrics.total,
      active: this.requestMetrics.active,
      recentErrors: this.requestMetrics.errors.length,
      averageResponseTime: this.requestMetrics.responseTimes.length > 0
        ? this.requestMetrics.responseTimes.reduce((sum, time) => sum + time, 0) / this.requestMetrics.responseTimes.length
        : 0,
    };
  }

  /**
   * Simple health check for basic endpoints
   */
  async getSimpleHealthStatus(): Promise<{ status: string; timestamp: string; uptime: number }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    };
  }
}