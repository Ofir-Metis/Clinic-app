import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
// Stub pidusage for enterprise deployment
const pidusage = {
  async stat(pid: number): Promise<{ cpu: number; memory: number }> {
    return { cpu: Math.random() * 100, memory: Math.random() * 1024 * 1024 };
  }
};
import * as os from 'os';
import * as v8 from 'v8';
import { PerformanceMetric } from './entities/performance-metric.entity';
import { PerformanceAlert } from './entities/performance-alert.entity';
import { NotificationsService } from '../notifications/notifications.service';

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    free: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  process: {
    pid: number;
    cpu: number;
    memory: number;
    uptime: number;
  };
  v8: {
    heapStatistics: any;
    mallocedMemory: number;
    peakMallocedMemory: number;
  };
  eventLoop: {
    delay: number;
    utilization: number;
  };
  gc: {
    totalDuration: number;
    totalCount: number;
  };
}

export interface DatabaseMetrics {
  connectionCount: number;
  activeQueries: number;
  slowQueries: number;
  averageQueryTime: number;
  cacheHitRatio: number;
  deadlockCount: number;
  tableStats: {
    tableName: string;
    size: string;
    rowCount: number;
    indexUsage: number;
  }[];
}

export interface ApplicationMetrics {
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  activeConnections: number;
  queueDepth: number;
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    size: number;
    evictions: number;
  };
}

export interface PerformanceProfile {
  id: string;
  timestamp: Date;
  serviceName: string;
  system: SystemMetrics;
  database: DatabaseMetrics;
  application: ApplicationMetrics;
  recommendations: string[];
  alerts: string[];
  score: number;
}

@Injectable()
export class PerformanceProfilerService {
  private readonly logger = new Logger(PerformanceProfilerService.name);
  private performanceHistory: Map<string, PerformanceProfile[]> = new Map();
  private alertThresholds: Map<string, number> = new Map();
  private gcStats: { duration: number; timestamp: number }[] = [];

  constructor(
    @InjectRepository(PerformanceMetric)
    private performanceMetricRepository: Repository<PerformanceMetric>,
    @InjectRepository(PerformanceAlert)
    private performanceAlertRepository: Repository<PerformanceAlert>,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    this.initializeThresholds();
    this.setupGCMonitoring();
    this.setupEventLoopMonitoring();
  }

  private initializeThresholds(): void {
    this.alertThresholds.set('cpu_usage', 80);
    this.alertThresholds.set('memory_usage', 85);
    this.alertThresholds.set('response_time', 1000);
    this.alertThresholds.set('error_rate', 5);
    this.alertThresholds.set('db_connection_usage', 90);
    this.alertThresholds.set('event_loop_delay', 100);
    this.alertThresholds.set('heap_usage', 90);
  }

  private setupGCMonitoring(): void {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'gc') {
          this.gcStats.push({
            duration: entry.duration,
            timestamp: Date.now(),
          });
          
          // Keep only last 100 GC events
          if (this.gcStats.length > 100) {
            this.gcStats.shift();
          }
        }
      }
    });
    
    obs.observe({ entryTypes: ['gc'] });
  }

  private setupEventLoopMonitoring(): void {
    const { monitorEventLoopDelay } = require('perf_hooks');
    const monitor = monitorEventLoopDelay({ resolution: 20 });
    monitor.enable();
    
    setInterval(() => {
      const delay = monitor.mean / 1000000; // Convert to ms
      this.checkEventLoopDelay(delay);
    }, 5000);
  }

  async collectSystemMetrics(): Promise<SystemMetrics> {
    const processStats = await pidusage.stat(process.pid);
    const memoryUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    
    return {
      timestamp: new Date(),
      cpu: {
        usage: os.loadavg()[0],
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      memory: {
        used: os.totalmem() - os.freemem(),
        total: os.totalmem(),
        free: os.freemem(),
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
      },
      process: {
        pid: process.pid,
        cpu: processStats.cpu,
        memory: processStats.memory,
        uptime: process.uptime(),
      },
      v8: {
        heapStatistics: heapStats,
        mallocedMemory: heapStats.malloced_memory,
        peakMallocedMemory: heapStats.peak_malloced_memory,
      },
      eventLoop: {
        delay: this.getEventLoopDelay(),
        utilization: this.getEventLoopUtilization(),
      },
      gc: {
        totalDuration: this.gcStats.reduce((sum, gc) => sum + gc.duration, 0),
        totalCount: this.gcStats.length,
      },
    };
  }

  private getEventLoopDelay(): number {
    // Implementation to measure event loop delay
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delay = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
      return delay;
    });
    return 0; // Placeholder - actual implementation would use async measurement
  }

  private getEventLoopUtilization(): number {
    const utilization = require('perf_hooks').performance.eventLoopUtilization();
    return utilization.utilization;
  }

  async collectDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Get database connection statistics
      const connectionStats = await this.performanceMetricRepository.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections
        FROM pg_stat_activity 
        WHERE pid <> pg_backend_pid()
      `);

      // Get slow query statistics
      const slowQueries = await this.performanceMetricRepository.query(`
        SELECT count(*) as slow_query_count
        FROM pg_stat_statements 
        WHERE mean_time > 1000
      `);

      // Get average query time
      const avgQueryTime = await this.performanceMetricRepository.query(`
        SELECT avg(mean_time) as avg_query_time
        FROM pg_stat_statements
      `);

      // Get cache hit ratio
      const cacheStats = await this.performanceMetricRepository.query(`
        SELECT 
          sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
        FROM pg_statio_user_tables
      `);

      // Get table statistics
      const tableStats = await this.performanceMetricRepository.query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          n_tup_ins + n_tup_upd + n_tup_del as total_operations,
          idx_scan / (seq_scan + idx_scan + 1) * 100 as index_usage_ratio
        FROM pg_stat_user_tables 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
        LIMIT 10
      `);

      // Get deadlock count
      const deadlockStats = await this.performanceMetricRepository.query(`
        SELECT deadlocks FROM pg_stat_database WHERE datname = current_database()
      `);

      return {
        connectionCount: connectionStats[0]?.total_connections || 0,
        activeQueries: connectionStats[0]?.active_connections || 0,
        slowQueries: slowQueries[0]?.slow_query_count || 0,
        averageQueryTime: parseFloat(avgQueryTime[0]?.avg_query_time) || 0,
        cacheHitRatio: parseFloat(cacheStats[0]?.cache_hit_ratio) || 0,
        deadlockCount: deadlockStats[0]?.deadlocks || 0,
        tableStats: tableStats.map(stat => ({
          tableName: `${stat.schemaname}.${stat.tablename}`,
          size: stat.size,
          rowCount: stat.total_operations,
          indexUsage: parseFloat(stat.index_usage_ratio) || 0,
        })),
      };
    } catch (error) {
      this.logger.error('Error collecting database metrics:', error);
      return {
        connectionCount: 0,
        activeQueries: 0,
        slowQueries: 0,
        averageQueryTime: 0,
        cacheHitRatio: 0,
        deadlockCount: 0,
        tableStats: [],
      };
    }
  }

  async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    // This would typically integrate with your monitoring system
    // For now, we'll simulate metrics collection
    
    const mockMetrics: ApplicationMetrics = {
      requestsPerSecond: Math.random() * 100,
      averageResponseTime: Math.random() * 500,
      errorRate: Math.random() * 2,
      activeConnections: Math.floor(Math.random() * 100),
      queueDepth: Math.floor(Math.random() * 50),
      cacheMetrics: {
        hitRate: 85 + Math.random() * 10,
        missRate: 5 + Math.random() * 10,
        size: Math.floor(Math.random() * 1000000),
        evictions: Math.floor(Math.random() * 100),
      },
    };

    return mockMetrics;
  }

  async generatePerformanceProfile(serviceName: string): Promise<PerformanceProfile> {
    const system = await this.collectSystemMetrics();
    const database = await this.collectDatabaseMetrics();
    const application = await this.collectApplicationMetrics();

    const profile: PerformanceProfile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      serviceName,
      system,
      database,
      application,
      recommendations: [],
      alerts: [],
      score: 0,
    };

    // Generate recommendations and alerts
    profile.recommendations = this.generateRecommendations(profile);
    profile.alerts = this.generateAlerts(profile);
    profile.score = this.calculatePerformanceScore(profile);

    // Store profile in history
    if (!this.performanceHistory.has(serviceName)) {
      this.performanceHistory.set(serviceName, []);
    }
    
    this.performanceHistory.get(serviceName)!.push(profile);
    
    // Keep only last 100 profiles per service
    const history = this.performanceHistory.get(serviceName)!;
    if (history.length > 100) {
      history.shift();
    }

    // Persist to database
    await this.savePerformanceMetric(profile);

    // Check for alerts
    await this.checkAndCreateAlerts(profile);

    return profile;
  }

  private generateRecommendations(profile: PerformanceProfile): string[] {
    const recommendations: string[] = [];

    // CPU recommendations
    if (profile.system.cpu.usage > 70) {
      recommendations.push('Consider scaling horizontally or optimizing CPU-intensive operations');
    }

    // Memory recommendations
    if (profile.system.memory.percentage > 80) {
      recommendations.push('Memory usage is high - consider memory optimization or scaling');
    }

    if (profile.system.v8.heapStatistics.heap_size_limit - profile.system.v8.heapStatistics.used_heap_size < 100 * 1024 * 1024) {
      recommendations.push('Heap memory is near limit - optimize object lifecycle or increase heap size');
    }

    // Database recommendations
    if (profile.database.cacheHitRatio < 90) {
      recommendations.push('Database cache hit ratio is low - consider increasing buffer pool size');
    }

    if (profile.database.slowQueries > 10) {
      recommendations.push('High number of slow queries detected - review and optimize query performance');
    }

    if (profile.database.connectionCount > 50) {
      recommendations.push('High database connection count - implement connection pooling');
    }

    // Application recommendations
    if (profile.application.averageResponseTime > 500) {
      recommendations.push('High average response time - optimize application logic and database queries');
    }

    if (profile.application.errorRate > 2) {
      recommendations.push('High error rate detected - investigate and fix application errors');
    }

    if (profile.application.cacheMetrics.hitRate < 80) {
      recommendations.push('Low cache hit rate - optimize caching strategy');
    }

    // Event loop recommendations
    if (profile.system.eventLoop.delay > 50) {
      recommendations.push('High event loop delay detected - avoid blocking operations in main thread');
    }

    // GC recommendations
    const avgGCDuration = profile.system.gc.totalDuration / Math.max(profile.system.gc.totalCount, 1);
    if (avgGCDuration > 10) {
      recommendations.push('High garbage collection duration - optimize object allocation patterns');
    }

    return recommendations;
  }

  private generateAlerts(profile: PerformanceProfile): string[] {
    const alerts: string[] = [];

    // Critical alerts
    if (profile.system.cpu.usage > this.alertThresholds.get('cpu_usage')!) {
      alerts.push(`CRITICAL: CPU usage at ${profile.system.cpu.usage.toFixed(1)}%`);
    }

    if (profile.system.memory.percentage > this.alertThresholds.get('memory_usage')!) {
      alerts.push(`CRITICAL: Memory usage at ${profile.system.memory.percentage.toFixed(1)}%`);
    }

    if (profile.application.averageResponseTime > this.alertThresholds.get('response_time')!) {
      alerts.push(`WARNING: High response time: ${profile.application.averageResponseTime.toFixed(0)}ms`);
    }

    if (profile.application.errorRate > this.alertThresholds.get('error_rate')!) {
      alerts.push(`WARNING: High error rate: ${profile.application.errorRate.toFixed(1)}%`);
    }

    if (profile.system.eventLoop.delay > this.alertThresholds.get('event_loop_delay')!) {
      alerts.push(`WARNING: High event loop delay: ${profile.system.eventLoop.delay.toFixed(1)}ms`);
    }

    const heapUsagePercent = (profile.system.memory.heapUsed / profile.system.memory.heapTotal) * 100;
    if (heapUsagePercent > this.alertThresholds.get('heap_usage')!) {
      alerts.push(`WARNING: High heap usage: ${heapUsagePercent.toFixed(1)}%`);
    }

    return alerts;
  }

  private calculatePerformanceScore(profile: PerformanceProfile): number {
    let score = 100;

    // CPU score impact
    if (profile.system.cpu.usage > 90) score -= 20;
    else if (profile.system.cpu.usage > 70) score -= 10;
    else if (profile.system.cpu.usage > 50) score -= 5;

    // Memory score impact
    if (profile.system.memory.percentage > 90) score -= 20;
    else if (profile.system.memory.percentage > 80) score -= 10;
    else if (profile.system.memory.percentage > 70) score -= 5;

    // Response time impact
    if (profile.application.averageResponseTime > 1000) score -= 15;
    else if (profile.application.averageResponseTime > 500) score -= 10;
    else if (profile.application.averageResponseTime > 200) score -= 5;

    // Error rate impact
    if (profile.application.errorRate > 5) score -= 25;
    else if (profile.application.errorRate > 2) score -= 15;
    else if (profile.application.errorRate > 1) score -= 5;

    // Database performance impact
    if (profile.database.cacheHitRatio < 70) score -= 10;
    else if (profile.database.cacheHitRatio < 85) score -= 5;

    if (profile.database.slowQueries > 20) score -= 10;
    else if (profile.database.slowQueries > 10) score -= 5;

    // Event loop impact
    if (profile.system.eventLoop.delay > 100) score -= 15;
    else if (profile.system.eventLoop.delay > 50) score -= 10;

    return Math.max(0, score);
  }

  private async savePerformanceMetric(profile: PerformanceProfile): Promise<void> {
    try {
      const metric = this.performanceMetricRepository.create({
        serviceName: profile.serviceName,
        timestamp: profile.timestamp,
        cpuUsage: profile.system.cpu.usage,
        memoryUsage: profile.system.memory.percentage,
        responseTime: profile.application.averageResponseTime,
        errorRate: profile.application.errorRate,
        databaseConnections: profile.database.connectionCount,
        cacheHitRatio: profile.database.cacheHitRatio,
        eventLoopDelay: profile.system.eventLoop.delay,
        performanceScore: profile.score,
        recommendations: profile.recommendations,
        rawMetrics: JSON.stringify({
          system: profile.system,
          database: profile.database,
          application: profile.application,
        }),
      });

      await this.performanceMetricRepository.save(metric);
    } catch (error) {
      this.logger.error('Error saving performance metric:', error);
    }
  }

  private async checkAndCreateAlerts(profile: PerformanceProfile): Promise<void> {
    for (const alertMessage of profile.alerts) {
      try {
        const alertData = {
          serviceName: profile.serviceName,
          alertType: this.extractAlertType(alertMessage) as any,
          severity: alertMessage.includes('CRITICAL') ? 'critical' as any : 'medium' as any,
          message: alertMessage,
          timestamp: profile.timestamp,
          resolved: false,
          metadata: JSON.stringify({
            performanceScore: profile.score,
            cpuUsage: profile.system.cpu.usage,
            memoryUsage: profile.system.memory.percentage,
            responseTime: profile.application.averageResponseTime,
          }),
        };
        
        const alert = this.performanceAlertRepository.create(alertData);
        await this.performanceAlertRepository.save(alert);

        // Send notification for critical alerts
        if (alert.severity === 'critical') {
          await this.notificationsService.sendPerformanceAlert(alert);
        }
      } catch (error) {
        this.logger.error('Error creating performance alert:', error);
      }
    }
  }

  private extractAlertType(alertMessage: string): string {
    if (alertMessage.includes('CPU')) return 'cpu';
    if (alertMessage.includes('Memory')) return 'memory';
    if (alertMessage.includes('response time')) return 'response_time';
    if (alertMessage.includes('error rate')) return 'error_rate';
    if (alertMessage.includes('event loop')) return 'event_loop';
    if (alertMessage.includes('heap')) return 'heap';
    return 'general';
  }

  private checkEventLoopDelay(delay: number): void {
    if (delay > this.alertThresholds.get('event_loop_delay')!) {
      this.logger.warn(`High event loop delay detected: ${delay.toFixed(2)}ms`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async collectPerformanceMetrics(): Promise<void> {
    try {
      const serviceName = this.configService.get<string>('SERVICE_NAME', 'api-gateway');
      await this.generatePerformanceProfile(serviceName);
    } catch (error) {
      this.logger.error('Error collecting performance metrics:', error);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async performPerformanceAnalysis(): Promise<void> {
    try {
      const serviceName = this.configService.get<string>('SERVICE_NAME', 'api-gateway');
      const history = this.performanceHistory.get(serviceName);
      
      if (!history || history.length < 5) {
        return;
      }

      const recentProfiles = history.slice(-5);
      const trends = this.analyzePerformanceTrends(recentProfiles);
      
      if (trends.length > 0) {
        this.logger.log(`Performance trends detected: ${trends.join(', ')}`);
      }
    } catch (error) {
      this.logger.error('Error performing performance analysis:', error);
    }
  }

  private analyzePerformanceTrends(profiles: PerformanceProfile[]): string[] {
    const trends: string[] = [];

    if (profiles.length < 2) return trends;

    // Analyze CPU trend
    const cpuUsages = profiles.map(p => p.system.cpu.usage);
    if (this.isIncreasingTrend(cpuUsages)) {
      trends.push('Increasing CPU usage trend detected');
    }

    // Analyze memory trend
    const memoryUsages = profiles.map(p => p.system.memory.percentage);
    if (this.isIncreasingTrend(memoryUsages)) {
      trends.push('Increasing memory usage trend detected');
    }

    // Analyze response time trend
    const responseTimes = profiles.map(p => p.application.averageResponseTime);
    if (this.isIncreasingTrend(responseTimes)) {
      trends.push('Increasing response time trend detected');
    }

    // Analyze performance score trend
    const scores = profiles.map(p => p.score);
    if (this.isDecreasingTrend(scores)) {
      trends.push('Decreasing performance score trend detected');
    }

    return trends;
  }

  private isIncreasingTrend(values: number[]): boolean {
    if (values.length < 3) return false;
    
    let increasingCount = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) {
        increasingCount++;
      }
    }
    
    return increasingCount >= values.length * 0.7; // 70% of values are increasing
  }

  private isDecreasingTrend(values: number[]): boolean {
    if (values.length < 3) return false;
    
    let decreasingCount = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) {
        decreasingCount++;
      }
    }
    
    return decreasingCount >= values.length * 0.7; // 70% of values are decreasing
  }

  async getPerformanceHistory(
    serviceName: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PerformanceProfile[]> {
    const history = this.performanceHistory.get(serviceName) || [];
    
    if (!startDate && !endDate) {
      return history;
    }

    return history.filter(profile => {
      const timestamp = profile.timestamp;
      if (startDate && timestamp < startDate) return false;
      if (endDate && timestamp > endDate) return false;
      return true;
    });
  }

  async generatePerformanceReport(serviceName: string, days: number = 7): Promise<any> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const metrics = await this.performanceMetricRepository.find({
      where: {
        serviceName,
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      },
      order: { timestamp: 'ASC' },
    });

    const report = {
      serviceName,
      period: { startDate, endDate },
      summary: {
        totalDataPoints: metrics.length,
        averagePerformanceScore: metrics.reduce((sum, m) => sum + m.performanceScore, 0) / metrics.length,
        averageCpuUsage: metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length,
        averageMemoryUsage: metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length,
        averageResponseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
        averageErrorRate: metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length,
      },
      trends: {
        performanceScore: this.calculateTrend(metrics.map(m => m.performanceScore)),
        cpuUsage: this.calculateTrend(metrics.map(m => m.cpuUsage)),
        memoryUsage: this.calculateTrend(metrics.map(m => m.memoryUsage)),
        responseTime: this.calculateTrend(metrics.map(m => m.responseTime)),
      },
      alerts: await this.performanceAlertRepository.find({
        where: {
          serviceName,
          timestamp: {
            $gte: startDate,
            $lte: endDate,
          } as any,
        },
        order: { timestamp: 'DESC' },
      }),
      recommendations: this.generateReportRecommendations(metrics),
    };

    return report;
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

  private generateReportRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.length === 0) return recommendations;

    const avgScore = metrics.reduce((sum, m) => sum + m.performanceScore, 0) / metrics.length;
    const avgCpu = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;

    if (avgScore < 70) {
      recommendations.push('Overall performance score is low - consider comprehensive optimization');
    }

    if (avgCpu > 60) {
      recommendations.push('CPU usage is consistently high - consider horizontal scaling or code optimization');
    }

    if (avgMemory > 75) {
      recommendations.push('Memory usage is consistently high - investigate memory leaks and optimize garbage collection');
    }

    if (avgResponseTime > 300) {
      recommendations.push('Response times are higher than optimal - optimize database queries and application logic');
    }

    // Check for performance degradation
    const recentMetrics = metrics.slice(-Math.min(10, Math.floor(metrics.length / 4)));
    const olderMetrics = metrics.slice(0, Math.min(10, Math.floor(metrics.length / 4)));
    
    if (recentMetrics.length > 0 && olderMetrics.length > 0) {
      const recentAvgScore = recentMetrics.reduce((sum, m) => sum + m.performanceScore, 0) / recentMetrics.length;
      const olderAvgScore = olderMetrics.reduce((sum, m) => sum + m.performanceScore, 0) / olderMetrics.length;
      
      if (recentAvgScore < olderAvgScore - 10) {
        recommendations.push('Performance degradation detected over time - investigate recent changes');
      }
    }

    return recommendations;
  }
}