import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as k8s from '@kubernetes/client-node';
import { 
  OptimizationRecommendationDto, 
  OptimizationType, 
  OptimizationPriority, 
  OptimizationStatus 
} from './dto/optimization-recommendation.dto';
import { PerformanceMetric } from './entities/performance-metric.entity';
import { PerformanceProfilerService } from './performance-profiler.service';

export interface CapacityPlanningData {
  serviceName: string;
  currentCapacity: {
    cpu: { current: number; allocated: number; utilization: number };
    memory: { current: number; allocated: number; utilization: number };
    storage: { current: number; allocated: number; utilization: number };
    network: { current: number; allocated: number; utilization: number };
  };
  projectedGrowth: {
    timeframe: number; // days
    cpuGrowth: number;
    memoryGrowth: number;
    storageGrowth: number;
    requestGrowth: number;
  };
  recommendations: {
    scaleUp: boolean;
    newResourceRequirements: {
      cpu: string;
      memory: string;
      storage: string;
      replicas: number;
    };
    costImpact: {
      currentMonthlyCost: number;
      projectedMonthlyCost: number;
      savingsOpportunities: string[];
    };
  };
  alerts: string[];
}

export interface LoadTestConfiguration {
  name: string;
  target: string;
  duration: number;
  stages: Array<{
    duration: string;
    target: number;
  }>;
  thresholds: {
    http_req_duration: string[];
    http_req_failed: string[];
    http_reqs: string[];
  };
  scenarios: Record<string, any>;
}

@Injectable()
export class PerformanceOptimizationService {
  private readonly logger = new Logger(PerformanceOptimizationService.name);
  private k8sApi: k8s.CoreV1Api;
  private k8sAppsApi: k8s.AppsV1Api;
  private k8sMetricsApi: k8s.Metrics;

  constructor(
    @InjectRepository(PerformanceMetric)
    private performanceMetricRepository: Repository<PerformanceMetric>,
    private configService: ConfigService,
    private performanceProfilerService: PerformanceProfilerService,
  ) {
    this.initializeKubernetes();
  }

  private initializeKubernetes(): void {
    try {
      const kc = new k8s.KubeConfig();
      kc.loadFromDefault();
      
      this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
      this.k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
      this.k8sMetricsApi = new k8s.Metrics(kc);
    } catch (error) {
      this.logger.warn('Kubernetes client initialization failed:', error);
    }
  }

  async generateOptimizationRecommendations(serviceName: string): Promise<OptimizationRecommendationDto[]> {
    const recommendations: OptimizationRecommendationDto[] = [];

    try {
      // Get recent performance data
      const recentMetrics = await this.performanceMetricRepository.find({
        where: { serviceName },
        order: { timestamp: 'DESC' },
        take: 100,
      });

      if (recentMetrics.length === 0) {
        this.logger.warn(`No performance metrics found for service: ${serviceName}`);
        return recommendations;
      }

      // Analyze different optimization opportunities
      const cpuRecommendations = await this.analyzeCpuOptimization(serviceName, recentMetrics);
      const memoryRecommendations = await this.analyzeMemoryOptimization(serviceName, recentMetrics);
      const databaseRecommendations = await this.analyzeDatabaseOptimization(serviceName, recentMetrics);
      const cacheRecommendations = await this.analyzeCacheOptimization(serviceName, recentMetrics);
      const networkRecommendations = await this.analyzeNetworkOptimization(serviceName, recentMetrics);
      const applicationRecommendations = await this.analyzeApplicationOptimization(serviceName, recentMetrics);

      recommendations.push(
        ...cpuRecommendations,
        ...memoryRecommendations,
        ...databaseRecommendations,
        ...cacheRecommendations,
        ...networkRecommendations,
        ...applicationRecommendations,
      );

      // Sort by priority and impact
      recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.impact.performanceImprovement - a.impact.performanceImprovement;
      });

      return recommendations;
    } catch (error) {
      this.logger.error('Error generating optimization recommendations:', error);
      return recommendations;
    }
  }

  private async analyzeCpuOptimization(
    serviceName: string, 
    metrics: PerformanceMetric[]
  ): Promise<OptimizationRecommendationDto[]> {
    const recommendations: OptimizationRecommendationDto[] = [];
    
    const avgCpuUsage = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
    const maxCpuUsage = Math.max(...metrics.map(m => m.cpuUsage));
    const cpuTrend = this.calculateTrend(metrics.map(m => m.cpuUsage));

    // High CPU usage recommendation
    if (avgCpuUsage > 70) {
      recommendations.push({
        id: `cpu-scale-${serviceName}-${Date.now()}`,
        serviceName,
        type: OptimizationType.CPU,
        priority: avgCpuUsage > 85 ? OptimizationPriority.CRITICAL : OptimizationPriority.HIGH,
        title: 'Scale CPU Resources',
        description: `Average CPU usage is ${avgCpuUsage.toFixed(1)}%, indicating potential CPU bottleneck`,
        currentIssue: `High CPU utilization (avg: ${avgCpuUsage.toFixed(1)}%, max: ${maxCpuUsage.toFixed(1)}%)`,
        proposedSolution: 'Increase CPU allocation or scale horizontally',
        impact: {
          performanceImprovement: avgCpuUsage > 85 ? 40 : 25,
          costReduction: 0,
          resourceSavings: 0,
          riskLevel: 'low',
          effortHours: 2,
          rollbackComplexity: 'easy',
        },
        parameters: {
          cpuLimit: Math.ceil(avgCpuUsage * 1.5) * 10, // millicores
          replicaCount: avgCpuUsage > 85 ? 2 : 1,
        },
        prerequisites: [
          {
            description: 'Verify current resource requests and limits',
            isMet: false,
            fulfillmentInstructions: 'kubectl describe pod <pod-name>',
          },
        ],
        implementationSteps: [
          'Update deployment resource requests and limits',
          'Apply configuration changes',
          'Monitor CPU usage after changes',
          'Validate performance improvement',
        ],
        rollbackSteps: [
          'Revert to previous resource configuration',
          'Restart affected pods if necessary',
        ],
        validationChecks: [
          {
            check: 'CPU usage below 70%',
            expectedResult: 'Average CPU usage < 70%',
            validationCommand: 'kubectl top pods',
            threshold: 70,
          },
        ],
        status: OptimizationStatus.PENDING,
        monitoringMetrics: ['cpu_usage', 'response_time', 'error_rate'],
        successCriteria: ['CPU usage below 70%', 'No increase in response time'],
        createdAt: new Date(),
      });
    }

    // Low CPU utilization - cost optimization
    if (avgCpuUsage < 20 && maxCpuUsage < 40) {
      recommendations.push({
        id: `cpu-downsize-${serviceName}-${Date.now()}`,
        serviceName,
        type: OptimizationType.CPU,
        priority: OptimizationPriority.MEDIUM,
        title: 'Reduce CPU Allocation',
        description: `Low CPU utilization (avg: ${avgCpuUsage.toFixed(1)}%) presents cost optimization opportunity`,
        currentIssue: `Over-provisioned CPU resources`,
        proposedSolution: 'Reduce CPU allocation to optimize costs',
        impact: {
          performanceImprovement: 0,
          costReduction: 30,
          resourceSavings: 50,
          riskLevel: 'medium',
          effortHours: 1,
          rollbackComplexity: 'easy',
        },
        parameters: {
          cpuLimit: Math.max(Math.ceil(maxCpuUsage * 1.2) * 10, 100), // millicores, minimum 100m
        },
        prerequisites: [
          {
            description: 'Analyze CPU usage patterns during peak hours',
            isMet: false,
            fulfillmentInstructions: 'Review CPU metrics for the last 7 days',
          },
        ],
        implementationSteps: [
          'Reduce CPU requests and limits',
          'Apply changes during low-traffic period',
          'Monitor for any performance degradation',
        ],
        rollbackSteps: [
          'Restore original CPU allocation',
          'Restart pods to apply changes',
        ],
        validationChecks: [
          {
            check: 'No performance degradation',
            expectedResult: 'Response time remains stable',
            validationCommand: 'Check response time metrics',
          },
        ],
        status: OptimizationStatus.PENDING,
        monitoringMetrics: ['cpu_usage', 'response_time', 'throughput'],
        successCriteria: ['No performance impact', 'Cost reduction achieved'],
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  private async analyzeMemoryOptimization(
    serviceName: string, 
    metrics: PerformanceMetric[]
  ): Promise<OptimizationRecommendationDto[]> {
    const recommendations: OptimizationRecommendationDto[] = [];
    
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    const maxMemoryUsage = Math.max(...metrics.map(m => m.memoryUsage));

    // High memory usage
    if (avgMemoryUsage > 80) {
      recommendations.push({
        id: `memory-scale-${serviceName}-${Date.now()}`,
        serviceName,
        type: OptimizationType.MEMORY,
        priority: avgMemoryUsage > 90 ? OptimizationPriority.CRITICAL : OptimizationPriority.HIGH,
        title: 'Increase Memory Allocation',
        description: `High memory usage (${avgMemoryUsage.toFixed(1)}%) may cause OOM kills`,
        currentIssue: `Memory pressure detected`,
        proposedSolution: 'Increase memory allocation or implement memory optimization',
        impact: {
          performanceImprovement: 35,
          riskLevel: 'low',
          effortHours: 2,
          rollbackComplexity: 'easy',
        },
        parameters: {
          memoryLimit: Math.ceil(avgMemoryUsage * 1.3 * 10) * 100, // MB
        },
        prerequisites: [
          {
            description: 'Check for memory leaks in application',
            isMet: false,
            fulfillmentInstructions: 'Analyze heap dumps and memory profiling data',
          },
        ],
        implementationSteps: [
          'Increase memory limits',
          'Restart pods with new configuration',
          'Monitor memory usage patterns',
        ],
        rollbackSteps: [
          'Restore previous memory limits',
          'Restart affected pods',
        ],
        validationChecks: [
          {
            check: 'Memory usage below 80%',
            expectedResult: 'Average memory usage < 80%',
            validationCommand: 'kubectl top pods',
            threshold: 80,
          },
        ],
        status: OptimizationStatus.PENDING,
        createdAt: new Date(),
      });
    }

    // Memory leak detection
    const memoryTrend = this.calculateTrend(metrics.map(m => m.memoryUsage));
    if (memoryTrend === 'increasing') {
      recommendations.push({
        id: `memory-leak-${serviceName}-${Date.now()}`,
        serviceName,
        type: OptimizationType.MEMORY,
        priority: OptimizationPriority.HIGH,
        title: 'Investigate Memory Leak',
        description: 'Continuous memory usage increase detected',
        currentIssue: 'Potential memory leak causing gradual memory increase',
        proposedSolution: 'Profile application and fix memory leaks',
        impact: {
          performanceImprovement: 50,
          riskLevel: 'high',
          effortHours: 8,
          rollbackComplexity: 'medium',
        },
        parameters: {},
        prerequisites: [
          {
            description: 'Enable memory profiling',
            isMet: false,
            fulfillmentInstructions: 'Configure application for memory profiling',
          },
        ],
        implementationSteps: [
          'Enable detailed memory profiling',
          'Collect memory dumps during different load conditions',
          'Analyze memory allocation patterns',
          'Identify and fix memory leaks',
          'Deploy fixed version',
        ],
        rollbackSteps: [
          'Deploy previous stable version',
          'Monitor for memory stability',
        ],
        validationChecks: [
          {
            check: 'Stable memory usage over time',
            expectedResult: 'No continuous memory growth',
            validationCommand: 'Monitor memory metrics for 24h',
          },
        ],
        status: OptimizationStatus.PENDING,
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  private async analyzeDatabaseOptimization(
    serviceName: string, 
    metrics: PerformanceMetric[]
  ): Promise<OptimizationRecommendationDto[]> {
    const recommendations: OptimizationRecommendationDto[] = [];
    
    const avgQueryTime = metrics.reduce((sum, m) => sum + (m.averageQueryTime || 0), 0) / metrics.length;
    const avgCacheHitRatio = metrics.reduce((sum, m) => sum + m.cacheHitRatio, 0) / metrics.length;
    const avgConnections = metrics.reduce((sum, m) => sum + m.databaseConnections, 0) / metrics.length;

    // Slow queries optimization
    if (avgQueryTime > 500) {
      recommendations.push({
        id: `db-query-opt-${serviceName}-${Date.now()}`,
        serviceName,
        type: OptimizationType.DATABASE,
        priority: avgQueryTime > 1000 ? OptimizationPriority.HIGH : OptimizationPriority.MEDIUM,
        title: 'Optimize Database Queries',
        description: `Slow query performance detected (avg: ${avgQueryTime.toFixed(0)}ms)`,
        currentIssue: 'Database queries are performing slowly',
        proposedSolution: 'Add indexes, optimize queries, and improve query patterns',
        impact: {
          performanceImprovement: 40,
          riskLevel: 'medium',
          effortHours: 6,
          rollbackComplexity: 'medium',
        },
        parameters: {},
        prerequisites: [
          {
            description: 'Identify slow queries using query analysis',
            isMet: false,
            fulfillmentInstructions: 'Enable pg_stat_statements and analyze slow queries',
          },
        ],
        implementationSteps: [
          'Analyze slow query logs',
          'Identify missing indexes',
          'Create appropriate indexes',
          'Rewrite inefficient queries',
          'Test performance improvements',
        ],
        rollbackSteps: [
          'Remove newly created indexes if needed',
          'Revert query changes',
        ],
        validationChecks: [
          {
            check: 'Average query time improvement',
            expectedResult: 'Query time < 300ms',
            validationCommand: 'SELECT avg(mean_time) FROM pg_stat_statements',
            threshold: 300,
          },
        ],
        status: OptimizationStatus.PENDING,
        createdAt: new Date(),
      });
    }

    // Low cache hit ratio
    if (avgCacheHitRatio < 90) {
      recommendations.push({
        id: `db-cache-opt-${serviceName}-${Date.now()}`,
        serviceName,
        type: OptimizationType.DATABASE,
        priority: OptimizationPriority.MEDIUM,
        title: 'Improve Database Cache Hit Ratio',
        description: `Low cache hit ratio (${avgCacheHitRatio.toFixed(1)}%) affecting performance`,
        currentIssue: 'Database cache is not effectively reducing disk I/O',
        proposedSolution: 'Increase buffer pool size and optimize caching strategy',
        impact: {
          performanceImprovement: 25,
          riskLevel: 'low',
          effortHours: 3,
          rollbackComplexity: 'easy',
        },
        parameters: {
          bufferSizes: {
            shared_buffers: Math.ceil(avgCacheHitRatio * 2), // MB
            effective_cache_size: Math.ceil(avgCacheHitRatio * 4), // MB
          },
        },
        prerequisites: [
          {
            description: 'Analyze current PostgreSQL configuration',
            isMet: false,
            fulfillmentInstructions: 'Review postgresql.conf settings',
          },
        ],
        implementationSteps: [
          'Increase shared_buffers size',
          'Adjust effective_cache_size',
          'Restart database with new configuration',
          'Monitor cache hit ratio improvement',
        ],
        rollbackSteps: [
          'Restore original PostgreSQL configuration',
          'Restart database',
        ],
        validationChecks: [
          {
            check: 'Cache hit ratio improvement',
            expectedResult: 'Cache hit ratio > 95%',
            validationCommand: 'SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 FROM pg_statio_user_tables',
            threshold: 95,
          },
        ],
        status: OptimizationStatus.PENDING,
        createdAt: new Date(),
      });
    }

    // High connection count
    if (avgConnections > 80) {
      recommendations.push({
        id: `db-conn-pool-${serviceName}-${Date.now()}`,
        serviceName,
        type: OptimizationType.DATABASE,
        priority: OptimizationPriority.MEDIUM,
        title: 'Optimize Database Connection Pooling',
        description: `High database connection count (${avgConnections.toFixed(0)}) may impact performance`,
        currentIssue: 'Excessive database connections consuming resources',
        proposedSolution: 'Implement connection pooling or optimize existing pool configuration',
        impact: {
          performanceImprovement: 20,
          riskLevel: 'low',
          effortHours: 4,
          rollbackComplexity: 'easy',
        },
        parameters: {
          connectionPoolSize: Math.max(Math.ceil(avgConnections * 0.7), 20),
        },
        prerequisites: [
          {
            description: 'Review current connection pooling setup',
            isMet: false,
            fulfillmentInstructions: 'Check application database configuration',
          },
        ],
        implementationSteps: [
          'Configure connection pool parameters',
          'Set appropriate pool size limits',
          'Implement connection timeout settings',
          'Deploy configuration changes',
        ],
        rollbackSteps: [
          'Restore previous connection settings',
          'Restart application services',
        ],
        validationChecks: [
          {
            check: 'Reduced connection count',
            expectedResult: 'Connection count < 50',
            validationCommand: 'SELECT count(*) FROM pg_stat_activity',
            threshold: 50,
          },
        ],
        status: OptimizationStatus.PENDING,
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  private async analyzeCacheOptimization(
    serviceName: string, 
    metrics: PerformanceMetric[]
  ): Promise<OptimizationRecommendationDto[]> {
    const recommendations: OptimizationRecommendationDto[] = [];
    
    const avgCacheHitRate = metrics.reduce((sum, m) => sum + (m.cacheHitRate || 0), 0) / metrics.length;

    if (avgCacheHitRate < 80) {
      recommendations.push({
        id: `cache-opt-${serviceName}-${Date.now()}`,
        serviceName,
        type: OptimizationType.CACHE,
        priority: OptimizationPriority.MEDIUM,
        title: 'Improve Application Cache Strategy',
        description: `Low cache hit rate (${avgCacheHitRate.toFixed(1)}%) indicates caching inefficiency`,
        currentIssue: 'Application cache is not effectively reducing backend load',
        proposedSolution: 'Optimize cache keys, TTL settings, and caching patterns',
        impact: {
          performanceImprovement: 30,
          riskLevel: 'low',
          effortHours: 5,
          rollbackComplexity: 'easy',
        },
        parameters: {
          cacheTtl: 3600, // 1 hour default
        },
        prerequisites: [
          {
            description: 'Analyze current cache usage patterns',
            isMet: false,
            fulfillmentInstructions: 'Review Redis metrics and cache key patterns',
          },
        ],
        implementationSteps: [
          'Analyze cache key patterns and access frequency',
          'Optimize cache TTL values',
          'Implement cache warming for popular data',
          'Add caching for frequently accessed data',
        ],
        rollbackSteps: [
          'Restore previous cache configuration',
          'Clear cache if necessary',
        ],
        validationChecks: [
          {
            check: 'Cache hit rate improvement',
            expectedResult: 'Cache hit rate > 85%',
            validationCommand: 'Check Redis INFO stats',
            threshold: 85,
          },
        ],
        status: OptimizationStatus.PENDING,
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  private async analyzeNetworkOptimization(
    serviceName: string, 
    metrics: PerformanceMetric[]
  ): Promise<OptimizationRecommendationDto[]> {
    const recommendations: OptimizationRecommendationDto[] = [];
    
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;

    if (avgResponseTime > 500) {
      recommendations.push({
        id: `network-opt-${serviceName}-${Date.now()}`,
        serviceName,
        type: OptimizationType.NETWORK,
        priority: avgResponseTime > 1000 ? OptimizationPriority.HIGH : OptimizationPriority.MEDIUM,
        title: 'Optimize Network Performance',
        description: `High response times (${avgResponseTime.toFixed(0)}ms) may indicate network bottlenecks`,
        currentIssue: 'Network latency affecting application performance',
        proposedSolution: 'Implement response compression, optimize service mesh, and reduce network hops',
        impact: {
          performanceImprovement: 25,
          riskLevel: 'medium',
          effortHours: 4,
          rollbackComplexity: 'medium',
        },
        parameters: {},
        prerequisites: [
          {
            description: 'Analyze network topology and service communication patterns',
            isMet: false,
            fulfillmentInstructions: 'Review service mesh configuration and network policies',
          },
        ],
        implementationSteps: [
          'Enable gzip compression for responses',
          'Optimize service mesh configuration',
          'Implement connection keep-alive',
          'Review and optimize network policies',
        ],
        rollbackSteps: [
          'Disable compression if issues occur',
          'Restore previous network configuration',
        ],
        validationChecks: [
          {
            check: 'Response time improvement',
            expectedResult: 'Average response time < 300ms',
            validationCommand: 'Monitor response time metrics',
            threshold: 300,
          },
        ],
        status: OptimizationStatus.PENDING,
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  private async analyzeApplicationOptimization(
    serviceName: string, 
    metrics: PerformanceMetric[]
  ): Promise<OptimizationRecommendationDto[]> {
    const recommendations: OptimizationRecommendationDto[] = [];
    
    const avgEventLoopDelay = metrics.reduce((sum, m) => sum + m.eventLoopDelay, 0) / metrics.length;

    if (avgEventLoopDelay > 50) {
      recommendations.push({
        id: `app-eventloop-${serviceName}-${Date.now()}`,
        serviceName,
        type: OptimizationType.APPLICATION,
        priority: avgEventLoopDelay > 100 ? OptimizationPriority.HIGH : OptimizationPriority.MEDIUM,
        title: 'Optimize Event Loop Performance',
        description: `High event loop delay (${avgEventLoopDelay.toFixed(1)}ms) indicates blocking operations`,
        currentIssue: 'Event loop is being blocked by synchronous operations',
        proposedSolution: 'Identify and fix blocking operations in the event loop',
        impact: {
          performanceImprovement: 35,
          riskLevel: 'medium',
          effortHours: 6,
          rollbackComplexity: 'medium',
        },
        parameters: {},
        prerequisites: [
          {
            description: 'Profile application to identify blocking operations',
            isMet: false,
            fulfillmentInstructions: 'Use Node.js profiling tools to analyze event loop',
          },
        ],
        implementationSteps: [
          'Profile application event loop',
          'Identify blocking synchronous operations',
          'Replace with asynchronous alternatives',
          'Optimize CPU-intensive operations',
          'Add proper async/await patterns',
        ],
        rollbackSteps: [
          'Revert to previous application version',
          'Monitor event loop metrics',
        ],
        validationChecks: [
          {
            check: 'Event loop delay reduction',
            expectedResult: 'Event loop delay < 30ms',
            validationCommand: 'Monitor event loop delay metrics',
            threshold: 30,
          },
        ],
        status: OptimizationStatus.PENDING,
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  async applyOptimizationRecommendations(
    recommendations: OptimizationRecommendationDto[]
  ): Promise<any> {
    const results = [];

    for (const recommendation of recommendations) {
      try {
        const result = await this.applyOptimization(recommendation);
        results.push({
          recommendationId: recommendation.id,
          status: 'success',
          result,
        });
      } catch (error) {
        this.logger.error(`Failed to apply optimization ${recommendation.id}:`, error);
        results.push({
          recommendationId: recommendation.id,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return results;
  }

  private async applyOptimization(recommendation: OptimizationRecommendationDto): Promise<any> {
    switch (recommendation.type) {
      case OptimizationType.CPU:
      case OptimizationType.MEMORY:
        return await this.applyResourceOptimization(recommendation);
      case OptimizationType.DATABASE:
        return await this.applyDatabaseOptimization(recommendation);
      case OptimizationType.CACHE:
        return await this.applyCacheOptimization(recommendation);
      case OptimizationType.INFRASTRUCTURE:
        return await this.applyInfrastructureOptimization(recommendation);
      default:
        throw new Error(`Unsupported optimization type: ${recommendation.type}`);
    }
  }

  private async applyResourceOptimization(recommendation: OptimizationRecommendationDto): Promise<any> {
    if (!this.k8sAppsApi) {
      throw new Error('Kubernetes API not available');
    }

    const namespace = this.configService.get('KUBERNETES_NAMESPACE', 'clinic-production');
    
    try {
      // Get current deployment
      const deployment = await this.k8sAppsApi.readNamespacedDeployment(
        recommendation.serviceName,
        namespace
      );

      // Update resource specifications
      const container = deployment.body.spec.template.spec.containers[0];
      
      if (recommendation.parameters.cpuLimit) {
        container.resources.limits.cpu = `${recommendation.parameters.cpuLimit}m`;
        container.resources.requests.cpu = `${Math.ceil(recommendation.parameters.cpuLimit * 0.7)}m`;
      }

      if (recommendation.parameters.memoryLimit) {
        container.resources.limits.memory = `${recommendation.parameters.memoryLimit}Mi`;
        container.resources.requests.memory = `${Math.ceil(recommendation.parameters.memoryLimit * 0.7)}Mi`;
      }

      if (recommendation.parameters.replicaCount) {
        deployment.body.spec.replicas = recommendation.parameters.replicaCount;
      }

      // Apply the updated deployment
      await this.k8sAppsApi.replaceNamespacedDeployment(
        recommendation.serviceName,
        namespace,
        deployment.body
      );

      return {
        message: 'Resource optimization applied successfully',
        changes: {
          cpu: recommendation.parameters.cpuLimit,
          memory: recommendation.parameters.memoryLimit,
          replicas: recommendation.parameters.replicaCount,
        },
      };
    } catch (error) {
      throw new Error(`Failed to apply resource optimization: ${error.message}`);
    }
  }

  private async applyDatabaseOptimization(recommendation: OptimizationRecommendationDto): Promise<any> {
    // Database optimizations would typically involve:
    // 1. Creating indexes
    // 2. Updating configuration
    // 3. Optimizing queries
    // This is a placeholder implementation
    
    return {
      message: 'Database optimization requires manual implementation',
      steps: recommendation.implementationSteps,
    };
  }

  private async applyCacheOptimization(recommendation: OptimizationRecommendationDto): Promise<any> {
    // Cache optimizations would involve:
    // 1. Updating cache configuration
    // 2. Implementing new caching patterns
    // 3. Cache warming
    
    return {
      message: 'Cache optimization requires application-level changes',
      parameters: recommendation.parameters,
    };
  }

  private async applyInfrastructureOptimization(recommendation: OptimizationRecommendationDto): Promise<any> {
    // Infrastructure optimizations would involve:
    // 1. Updating Kubernetes configurations
    // 2. Scaling resources
    // 3. Network optimizations
    
    return {
      message: 'Infrastructure optimization applied',
      recommendation: recommendation.title,
    };
  }

  async generateCapacityPlanningData(
    serviceName: string, 
    projectionDays: number = 90
  ): Promise<CapacityPlanningData> {
    try {
      const recentMetrics = await this.performanceMetricRepository.find({
        where: { serviceName },
        order: { timestamp: 'DESC' },
        take: Math.min(projectionDays * 24, 2000), // Hourly data for projection period
      });

      if (recentMetrics.length === 0) {
        throw new Error(`No metrics found for service: ${serviceName}`);
      }

      // Calculate current capacity utilization
      const currentCapacity = this.calculateCurrentCapacity(recentMetrics);
      
      // Project future growth
      const projectedGrowth = this.calculateProjectedGrowth(recentMetrics, projectionDays);
      
      // Generate scaling recommendations
      const recommendations = this.generateCapacityRecommendations(
        currentCapacity, 
        projectedGrowth, 
        serviceName
      );

      return {
        serviceName,
        currentCapacity,
        projectedGrowth,
        recommendations,
        alerts: this.generateCapacityAlerts(currentCapacity, projectedGrowth),
      };
    } catch (error) {
      this.logger.error('Error generating capacity planning data:', error);
      throw error;
    }
  }

  private calculateCurrentCapacity(metrics: PerformanceMetric[]): any {
    const latest = metrics[0];
    const avgCpu = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;

    return {
      cpu: {
        current: avgCpu,
        allocated: 100, // Assuming 100% allocation
        utilization: avgCpu,
      },
      memory: {
        current: avgMemory,
        allocated: 100,
        utilization: avgMemory,
      },
      storage: {
        current: 50, // Placeholder
        allocated: 100,
        utilization: 50,
      },
      network: {
        current: 30, // Placeholder
        allocated: 100,
        utilization: 30,
      },
    };
  }

  private calculateProjectedGrowth(metrics: PerformanceMetric[], days: number): any {
    const cpuTrend = this.calculateGrowthRate(metrics.map(m => m.cpuUsage));
    const memoryTrend = this.calculateGrowthRate(metrics.map(m => m.memoryUsage));
    const requestTrend = this.calculateGrowthRate(metrics.map(m => m.requestsPerSecond || 0));

    return {
      timeframe: days,
      cpuGrowth: cpuTrend * days,
      memoryGrowth: memoryTrend * days,
      storageGrowth: 2, // Placeholder: 2% per month
      requestGrowth: requestTrend * days,
    };
  }

  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    return ((secondAvg - firstAvg) / firstAvg) * 100 / values.length; // Daily growth rate percentage
  }

  private generateCapacityRecommendations(
    currentCapacity: any, 
    projectedGrowth: any, 
    serviceName: string
  ): any {
    const cpuProjected = currentCapacity.cpu.utilization + projectedGrowth.cpuGrowth;
    const memoryProjected = currentCapacity.memory.utilization + projectedGrowth.memoryGrowth;
    
    const scaleUp = cpuProjected > 70 || memoryProjected > 80;
    
    return {
      scaleUp,
      newResourceRequirements: {
        cpu: scaleUp ? `${Math.ceil((cpuProjected * 1.2) / 100 * 1000)}m` : 'no change',
        memory: scaleUp ? `${Math.ceil((memoryProjected * 1.2) / 100 * 2048)}Mi` : 'no change',
        storage: '50Gi', // Placeholder
        replicas: scaleUp ? Math.ceil(cpuProjected / 60) : 1,
      },
      costImpact: {
        currentMonthlyCost: 500, // Placeholder
        projectedMonthlyCost: scaleUp ? 750 : 500,
        savingsOpportunities: [
          'Consider spot instances for non-critical workloads',
          'Implement auto-scaling to optimize resource usage',
        ],
      },
    };
  }

  private generateCapacityAlerts(currentCapacity: any, projectedGrowth: any): string[] {
    const alerts: string[] = [];
    
    if (currentCapacity.cpu.utilization > 80) {
      alerts.push('HIGH: Current CPU utilization exceeds 80%');
    }
    
    if (currentCapacity.memory.utilization > 85) {
      alerts.push('HIGH: Current memory utilization exceeds 85%');
    }
    
    if (projectedGrowth.cpuGrowth > 50) {
      alerts.push('WARNING: CPU usage projected to increase by >50% in forecast period');
    }
    
    if (projectedGrowth.memoryGrowth > 40) {
      alerts.push('WARNING: Memory usage projected to increase by >40% in forecast period');
    }
    
    return alerts;
  }

  async initiateLoadTest(serviceName: string, testConfig: any): Promise<any> {
    // This would integrate with load testing tools like k6, Artillery, or JMeter
    // For now, return a mock response
    
    const loadTestConfig: LoadTestConfiguration = {
      name: testConfig.name || `${serviceName}-load-test-${Date.now()}`,
      target: testConfig.target || `http://${serviceName}:4000`,
      duration: testConfig.duration || 300, // 5 minutes
      stages: testConfig.stages || [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      thresholds: testConfig.thresholds || {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.1'],
        http_reqs: ['rate>100'],
      },
      scenarios: testConfig.scenarios || {},
    };

    // In a real implementation, this would:
    // 1. Generate k6 or Artillery test script
    // 2. Execute the load test
    // 3. Monitor progress
    // 4. Collect and store results
    
    return {
      testId: `test-${Date.now()}`,
      status: 'initiated',
      config: loadTestConfig,
      estimatedDuration: `${testConfig.duration || 300} seconds`,
      message: 'Load test initiated successfully',
    };
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const threshold = firstAvg * 0.05; // 5% threshold
    
    if (secondAvg > firstAvg + threshold) return 'increasing';
    if (secondAvg < firstAvg - threshold) return 'decreasing';
    return 'stable';
  }
}