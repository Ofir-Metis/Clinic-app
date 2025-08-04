/**
 * PerformanceController - Performance optimization and monitoring tools
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
import { PerformanceService } from './performance.service';

export interface PerformanceDashboard {
  overview: {
    avgResponseTime: number;
    throughput: number;
    errorRate: number;
    apdex: number;
    uptime: number;
  };
  realTimeMetrics: {
    currentRps: number;
    activeConnections: number;
    cpuUsage: number;
    memoryUsage: number;
    diskIO: number;
    networkIO: number;
  };
  slowQueries: Array<{
    id: string;
    query: string;
    duration: number;
    executionCount: number;
    avgDuration: number;
    service: string;
    timestamp: Date;
  }>;
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    size: number;
    maxSize: number;
    totalRequests: number;
  };
  recommendations: Array<{
    id: string;
    type: 'database' | 'cache' | 'memory' | 'network' | 'code';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: string;
    effort: string;
    estimatedImprovement: string;
  }>;
}

export interface DatabaseOptimization {
  connectionPools: Array<{
    service: string;
    poolSize: number;
    activeConnections: number;
    idleConnections: number;
    waitingConnections: number;
    maxWaitTime: number;
    avgConnectionTime: number;
  }>;
  queryPerformance: Array<{
    id: string;
    query: string;
    table: string;
    avgDuration: number;
    executionCount: number;
    totalDuration: number;
    slowestExecution: number;
    indexUsage: boolean;
    optimizationSuggestions: string[];
  }>;
  indexAnalysis: Array<{
    table: string;
    index: string;
    usage: number;
    size: string;
    effectiveness: 'high' | 'medium' | 'low' | 'unused';
    recommendation: string;
  }>;
  transactionMetrics: {
    avgTransactionTime: number;
    deadlockCount: number;
    lockWaitTime: number;
    rollbackRate: number;
  };
}

export interface CacheConfiguration {
  id: string;
  name: string;
  type: 'redis' | 'memory' | 'cdn' | 'database';
  enabled: boolean;
  configuration: {
    maxSize: string;
    ttl: number;
    evictionPolicy: string;
    compressionEnabled: boolean;
    persistenceEnabled: boolean;
  };
  metrics: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    currentSize: string;
    requestCount: number;
    averageGetTime: number;
    averageSetTime: number;
  };
  keyPatterns: Array<{
    pattern: string;
    hitRate: number;
    count: number;
    avgTtl: number;
  }>;
}

export interface LoadBalancer {
  id: string;
  name: string;
  algorithm: 'round_robin' | 'least_connections' | 'ip_hash' | 'weighted';
  enabled: boolean;
  upstreams: Array<{
    id: string;
    url: string;
    weight: number;
    status: 'healthy' | 'unhealthy' | 'maintenance';
    responseTime: number;
    activeConnections: number;
    totalRequests: number;
    successRate: number;
  }>;
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
    healthyThreshold: number;
    unhealthyThreshold: number;
    path: string;
  };
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    throughput: number;
  };
}

@Controller('performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  private readonly logger = new Logger(PerformanceController.name);

  constructor(private performanceService: PerformanceService) {}

  /**
   * Performance Dashboard and Overview
   */
  @Get('dashboard')
  @RequireRoles('admin', 'performance_engineer')
  async getPerformanceDashboard(@Request() req: any) {
    try {
      const dashboard = await this.performanceService.getPerformanceDashboard();
      
      this.logger.log(`User ${req.user.sub} viewed performance dashboard`);
      
      return {
        success: true,
        data: dashboard,
      };
    } catch (error) {
      this.logger.error('Failed to get performance dashboard:', error);
      throw new HttpException(
        'Failed to retrieve performance dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('real-time-metrics')
  @RequireRoles('admin', 'performance_engineer')
  async getRealTimeMetrics(@Request() req: any) {
    try {
      const metrics = await this.performanceService.getRealTimeMetrics();
      
      return {
        success: true,
        data: metrics,
      };
    } catch (error) {
      this.logger.error('Failed to get real-time metrics:', error);
      throw new HttpException(
        'Failed to retrieve real-time metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Database Performance Optimization
   */
  @Get('database/optimization')
  @RequireRoles('admin', 'performance_engineer', 'dba')
  async getDatabaseOptimization(@Request() req: any) {
    try {
      const optimization = await this.performanceService.getDatabaseOptimization();
      
      return {
        success: true,
        data: optimization,
      };
    } catch (error) {
      this.logger.error('Failed to get database optimization:', error);
      throw new HttpException(
        'Failed to retrieve database optimization data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('database/optimize-query')
  @RequireRoles('admin', 'performance_engineer', 'dba')
  async optimizeQuery(
    @Body() optimizeRequest: {
      queryId: string;
      optimizationType: 'index' | 'rewrite' | 'cache' | 'partition';
      parameters?: Record<string, any>;
    },
    @Request() req?: any,
  ) {
    try {
      const result = await this.performanceService.optimizeQuery(
        optimizeRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} optimized query ${optimizeRequest.queryId}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Query optimization initiated',
      };
    } catch (error) {
      this.logger.error('Failed to optimize query:', error);
      throw new HttpException(
        'Failed to optimize query',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('database/connection-pool/adjust')
  @RequireRoles('admin', 'performance_engineer', 'dba')
  async adjustConnectionPool(
    @Body() adjustRequest: {
      service: string;
      minConnections: number;
      maxConnections: number;
      connectionTimeout: number;
      idleTimeout: number;
    },
    @Request() req: any,
  ) {
    try {
      const result = await this.performanceService.adjustConnectionPool(
        adjustRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} adjusted connection pool for ${adjustRequest.service}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Connection pool configuration updated',
      };
    } catch (error) {
      this.logger.error('Failed to adjust connection pool:', error);
      throw new HttpException(
        'Failed to adjust connection pool',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cache Management and Optimization
   */
  @Get('cache/configurations')
  @RequireRoles('admin', 'performance_engineer')
  async getCacheConfigurations(@Request() req: any) {
    try {
      const configurations = await this.performanceService.getCacheConfigurations();
      
      return {
        success: true,
        data: configurations,
      };
    } catch (error) {
      this.logger.error('Failed to get cache configurations:', error);
      throw new HttpException(
        'Failed to retrieve cache configurations',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('cache/:cacheId/configuration')
  @RequireRoles('admin', 'performance_engineer')
  async updateCacheConfiguration(
    @Param('cacheId') cacheId: string,
    @Body() configuration: Partial<CacheConfiguration['configuration']>,
    @Request() req: any,
  ) {
    try {
      const updatedCache = await this.performanceService.updateCacheConfiguration(
        cacheId,
        configuration,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} updated cache configuration ${cacheId}`
      );
      
      return {
        success: true,
        data: updatedCache,
        message: 'Cache configuration updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update cache configuration:', error);
      throw new HttpException(
        'Failed to update cache configuration',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('cache/:cacheId/flush')
  @RequireRoles('admin', 'performance_engineer')
  async flushCache(
    @Param('cacheId') cacheId: string,
    @Body() flushRequest: {
      pattern?: string;
      selective: boolean;
      reason: string;
    },
    @Request() req?: any,
  ) {
    try {
      const result = await this.performanceService.flushCache(
        cacheId,
        flushRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} flushed cache ${cacheId} - ${flushRequest.reason}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Cache flush completed successfully',
      };
    } catch (error) {
      this.logger.error('Failed to flush cache:', error);
      throw new HttpException(
        'Failed to flush cache',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('cache/:cacheId/warm-up')
  @RequireRoles('admin', 'performance_engineer')
  async warmUpCache(
    @Param('cacheId') cacheId: string,
    @Body() warmUpRequest: {
      keyPatterns: string[];
      priority: 'low' | 'medium' | 'high';
      batchSize: number;
    },
    @Request() req: any,
  ) {
    try {
      const result = await this.performanceService.warmUpCache(
        cacheId,
        warmUpRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} initiated cache warm-up for ${cacheId}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Cache warm-up initiated',
      };
    } catch (error) {
      this.logger.error('Failed to warm up cache:', error);
      throw new HttpException(
        'Failed to warm up cache',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Load Balancing and Traffic Management
   */
  @Get('load-balancers')
  @RequireRoles('admin', 'performance_engineer', 'network_engineer')
  async getLoadBalancers(@Request() req: any) {
    try {
      const loadBalancers = await this.performanceService.getLoadBalancers();
      
      return {
        success: true,
        data: loadBalancers,
      };
    } catch (error) {
      this.logger.error('Failed to get load balancers:', error);
      throw new HttpException(
        'Failed to retrieve load balancers',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('load-balancers/:balancerId/algorithm')
  @RequireRoles('admin', 'performance_engineer', 'network_engineer')
  async updateLoadBalancingAlgorithm(
    @Param('balancerId') balancerId: string,
    @Body() algorithmRequest: {
      algorithm: 'round_robin' | 'least_connections' | 'ip_hash' | 'weighted';
      parameters?: Record<string, any>;
    },
    @Request() req?: any,
  ) {
    try {
      const result = await this.performanceService.updateLoadBalancingAlgorithm(
        balancerId,
        algorithmRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} updated load balancing algorithm for ${balancerId}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Load balancing algorithm updated successfully',
      };
    } catch (error) {
      this.logger.error('Failed to update load balancing algorithm:', error);
      throw new HttpException(
        'Failed to update load balancing algorithm',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('load-balancers/:balancerId/upstream')
  @RequireRoles('admin', 'performance_engineer', 'network_engineer')
  async addUpstream(
    @Param('balancerId') balancerId: string,
    @Body() upstreamRequest: {
      url: string;
      weight: number;
      maxConnections?: number;
      healthCheckPath?: string;
    },
    @Request() req?: any,
  ) {
    try {
      const result = await this.performanceService.addUpstream(
        balancerId,
        upstreamRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} added upstream ${upstreamRequest.url} to ${balancerId}`
      );
      
      return {
        success: true,
        data: result,
        message: 'Upstream added successfully',
      };
    } catch (error) {
      this.logger.error('Failed to add upstream:', error);
      throw new HttpException(
        'Failed to add upstream',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('load-balancers/:balancerId/upstream/:upstreamId')
  @RequireRoles('admin', 'performance_engineer', 'network_engineer')
  async removeUpstream(
    @Param('balancerId') balancerId: string,
    @Param('upstreamId') upstreamId: string,
    @Request() req: any,
  ) {
    try {
      await this.performanceService.removeUpstream(
        balancerId,
        upstreamId,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} removed upstream ${upstreamId} from ${balancerId}`
      );
      
      return {
        success: true,
        message: 'Upstream removed successfully',
      };
    } catch (error) {
      this.logger.error('Failed to remove upstream:', error);
      throw new HttpException(
        'Failed to remove upstream',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Performance Profiling and Analysis
   */
  @Get('profiling/cpu')
  @RequireRoles('admin', 'performance_engineer')
  async getCpuProfiling(
    @Query('duration') duration: number = 60,
    @Query('service') service?: string,
    @Request() req?: any,
  ) {
    try {
      const profiling = await this.performanceService.getCpuProfiling(duration, service);
      
      return {
        success: true,
        data: profiling,
      };
    } catch (error) {
      this.logger.error('Failed to get CPU profiling:', error);
      throw new HttpException(
        'Failed to retrieve CPU profiling',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('profiling/memory')
  @RequireRoles('admin', 'performance_engineer')
  async getMemoryProfiling(
    @Query('service') service?: string,
    @Request() req?: any,
  ) {
    try {
      const profiling = await this.performanceService.getMemoryProfiling(service);
      
      return {
        success: true,
        data: profiling,
      };
    } catch (error) {
      this.logger.error('Failed to get memory profiling:', error);
      throw new HttpException(
        'Failed to retrieve memory profiling',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('profiling/start')
  @RequireRoles('admin', 'performance_engineer')
  async startProfiling(
    @Body() profilingRequest: {
      type: 'cpu' | 'memory' | 'heap' | 'goroutine';
      duration: number;
      service?: string;
      samplingRate?: number;
    },
    @Request() req?: any,
  ) {
    try {
      const session = await this.performanceService.startProfiling(
        profilingRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} started ${profilingRequest.type} profiling`
      );
      
      return {
        success: true,
        data: session,
        message: 'Profiling session started',
      };
    } catch (error) {
      this.logger.error('Failed to start profiling:', error);
      throw new HttpException(
        'Failed to start profiling',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Performance Testing and Benchmarking
   */
  @Post('testing/load-test')
  @RequireRoles('admin', 'performance_engineer')
  async runLoadTest(
    @Body() loadTestRequest: {
      name: string;
      target: string;
      duration: number;
      concurrency: number;
      rampUpTime: number;
      requestPattern: 'constant' | 'ramp' | 'spike' | 'stress';
      thresholds: {
        responseTime: number;
        errorRate: number;
        throughput: number;
      };
    },
    @Request() req: any,
  ) {
    try {
      const testSession = await this.performanceService.runLoadTest(
        loadTestRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} started load test: ${loadTestRequest.name}`
      );
      
      return {
        success: true,
        data: testSession,
        message: 'Load test initiated',
      };
    } catch (error) {
      this.logger.error('Failed to run load test:', error);
      throw new HttpException(
        'Failed to run load test',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('testing/results/:testId')
  @RequireRoles('admin', 'performance_engineer')
  async getLoadTestResults(
    @Param('testId') testId: string,
    @Request() req: any,
  ) {
    try {
      const results = await this.performanceService.getLoadTestResults(testId);
      
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      this.logger.error('Failed to get load test results:', error);
      throw new HttpException(
        'Failed to retrieve load test results',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Performance Alerts and Notifications
   */
  @Get('alerts')
  @RequireRoles('admin', 'performance_engineer')
  async getPerformanceAlerts(@Request() req: any) {
    try {
      const alerts = await this.performanceService.getPerformanceAlerts();
      
      return {
        success: true,
        data: alerts,
      };
    } catch (error) {
      this.logger.error('Failed to get performance alerts:', error);
      throw new HttpException(
        'Failed to retrieve performance alerts',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('alerts/threshold')
  @RequireRoles('admin', 'performance_engineer')
  async createPerformanceThreshold(
    @Body() thresholdRequest: {
      name: string;
      metric: string;
      condition: 'greater_than' | 'less_than' | 'equals';
      threshold: number;
      duration: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
      actions: string[];
    },
    @Request() req: any,
  ) {
    try {
      const threshold = await this.performanceService.createPerformanceThreshold(
        thresholdRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} created performance threshold: ${thresholdRequest.name}`
      );
      
      return {
        success: true,
        data: threshold,
        message: 'Performance threshold created successfully',
      };
    } catch (error) {
      this.logger.error('Failed to create performance threshold:', error);
      throw new HttpException(
        'Failed to create performance threshold',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Performance Reports and Analytics
   */
  @Get('reports/summary')
  @RequireRoles('admin', 'performance_engineer')
  async getPerformanceSummary(
    @Query('period') period: string = '24h',
    @Query('service') service?: string,
    @Request() req?: any,
  ) {
    try {
      const summary = await this.performanceService.getPerformanceSummary(period, service);
      
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

  @Post('reports/generate')
  @RequireRoles('admin', 'performance_engineer')
  async generatePerformanceReport(
    @Body() reportRequest: {
      type: 'daily' | 'weekly' | 'monthly' | 'custom';
      startDate: string;
      endDate: string;
      services: string[];
      metrics: string[];
      format: 'pdf' | 'xlsx' | 'json';
    },
    @Request() req: any,
  ) {
    try {
      const report = await this.performanceService.generatePerformanceReport(
        reportRequest,
        req.user.sub
      );
      
      this.logger.log(
        `User ${req.user.sub} generated ${reportRequest.type} performance report`
      );
      
      return {
        success: true,
        data: report,
        message: 'Performance report generation initiated',
      };
    } catch (error) {
      this.logger.error('Failed to generate performance report:', error);
      throw new HttpException(
        'Failed to generate performance report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}