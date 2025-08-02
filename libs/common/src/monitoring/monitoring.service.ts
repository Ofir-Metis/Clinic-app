/**
 * Monitoring Service - Advanced application monitoring and metrics collection
 * Provides performance monitoring, alerting, and observability features
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage' | 'rate';
  timestamp: string;
  tags?: Record<string, string>;
  context?: any;
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  timestamp: string;
  resolved?: boolean;
  resolvedAt?: string;
  tags: string[];
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsRetentionHours: number;
  alertingEnabled: boolean;
  thresholds: {
    responseTime: number; // ms
    errorRate: number; // percentage
    memoryUsage: number; // percentage
    diskUsage: number; // percentage
    cpuUsage: number; // percentage
  };
  alerting: {
    channels: ('console' | 'email' | 'webhook' | 'slack')[];
    webhookUrl?: string;
    emailRecipients?: string[];
    slackWebhook?: string;
  };
}

export interface SystemSnapshot {
  timestamp: string;
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    activeConnections: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkIO: { in: number; out: number };
  };
  business: {
    activeUsers: number;
    recordingsProcessed: number;
    aiOperations: number;
    storageUsed: number;
  };
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly config: MonitoringConfig;
  private readonly metrics: Map<string, PerformanceMetric[]> = new Map();
  private readonly alerts: Map<string, Alert> = new Map();
  private readonly startTime = Date.now();

  // Performance tracking
  private requestStats = {
    total: 0,
    errors: 0,
    totalResponseTime: 0,
    active: 0,
    recent: [] as { timestamp: number; responseTime: number; success: boolean }[],
  };

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadMonitoringConfig();
    this.initializeMonitoring();
    
    if (this.config.enabled) {
      this.startPeriodicCollection();
    }
  }

  private loadMonitoringConfig(): MonitoringConfig {
    return {
      enabled: this.configService.get('MONITORING_ENABLED', 'true') === 'true',
      metricsRetentionHours: parseInt(this.configService.get('METRICS_RETENTION_HOURS', '24')),
      alertingEnabled: this.configService.get('ALERTING_ENABLED', 'true') === 'true',
      thresholds: {
        responseTime: parseInt(this.configService.get('THRESHOLD_RESPONSE_TIME', '2000')), // 2s
        errorRate: parseFloat(this.configService.get('THRESHOLD_ERROR_RATE', '5')), // 5%
        memoryUsage: parseFloat(this.configService.get('THRESHOLD_MEMORY_USAGE', '85')), // 85%
        diskUsage: parseFloat(this.configService.get('THRESHOLD_DISK_USAGE', '90')), // 90%
        cpuUsage: parseFloat(this.configService.get('THRESHOLD_CPU_USAGE', '80')), // 80%
      },
      alerting: {
        channels: (this.configService.get('ALERT_CHANNELS', 'console') as string).split(',') as any[],
        webhookUrl: this.configService.get('ALERT_WEBHOOK_URL'),
        emailRecipients: this.configService.get('ALERT_EMAIL_RECIPIENTS')?.split(','),
        slackWebhook: this.configService.get('ALERT_SLACK_WEBHOOK'),
      },
    };
  }

  private initializeMonitoring() {
    this.logger.log('🔍 Monitoring service initialized');
    this.logger.log(`📊 Metrics retention: ${this.config.metricsRetentionHours} hours`);
    this.logger.log(`🚨 Alerting: ${this.config.alertingEnabled ? 'enabled' : 'disabled'}`);
    
    // Set up uncaught exception monitoring
    process.on('uncaughtException', (error) => {
      this.recordError('uncaught_exception', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.recordError('unhandled_rejection', new Error(String(reason)));
    });
  }

  private startPeriodicCollection() {
    // Collect system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);

    // Process alerts every 30 seconds
    setInterval(() => {
      this.processAlerts();
    }, 30000);

    this.logger.log('⚡ Periodic metrics collection started');
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: PerformanceMetric['unit'], tags?: Record<string, string>, context?: any) {
    if (!this.config.enabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags,
      context,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);

    // Keep only recent metrics to prevent memory leaks
    const maxMetrics = 1000;
    const metrics = this.metrics.get(name)!;
    if (metrics.length > maxMetrics) {
      this.metrics.set(name, metrics.slice(-maxMetrics));
    }

    this.checkThresholds(metric);
  }

  /**
   * Record request performance
   */
  recordRequest(responseTime: number, success: boolean = true, tags?: Record<string, string>) {
    this.requestStats.total++;
    this.requestStats.totalResponseTime += responseTime;
    
    if (!success) {
      this.requestStats.errors++;
    }

    // Keep recent requests for analysis
    this.requestStats.recent.push({
      timestamp: Date.now(),
      responseTime,
      success,
    });

    // Keep only last 1000 requests
    if (this.requestStats.recent.length > 1000) {
      this.requestStats.recent = this.requestStats.recent.slice(-1000);
    }

    // Record as metrics
    this.recordMetric('http_request_duration', responseTime, 'ms', tags);
    this.recordMetric('http_requests_total', 1, 'count', { ...tags, success: success.toString() });

    // Calculate and record error rate
    const recentWindow = Date.now() - 300000; // 5 minutes
    const recentRequests = this.requestStats.recent.filter(r => r.timestamp > recentWindow);
    const recentErrors = recentRequests.filter(r => !r.success);
    const errorRate = recentRequests.length > 0 ? (recentErrors.length / recentRequests.length) * 100 : 0;
    
    this.recordMetric('http_error_rate', errorRate, 'percentage', tags);
  }

  /**
   * Record business metric
   */
  recordBusinessMetric(operation: string, value: number, unit: PerformanceMetric['unit'], context?: any) {
    this.recordMetric(`business_${operation}`, value, unit, { type: 'business' }, context);
  }

  /**
   * Record AI operation
   */
  recordAIOperation(operation: 'transcription' | 'summarization' | 'analysis', duration: number, cost?: number, success: boolean = true) {
    const tags = { operation, success: success.toString() };
    
    this.recordMetric('ai_operation_duration', duration, 'ms', tags);
    
    if (cost !== undefined) {
      this.recordMetric('ai_operation_cost', cost, 'count', tags);
    }
    
    this.recordMetric('ai_operations_total', 1, 'count', tags);
  }

  /**
   * Record storage operation
   */
  recordStorageOperation(operation: 'upload' | 'download' | 'delete', size: number, duration: number, success: boolean = true) {
    const tags = { operation, success: success.toString() };
    
    this.recordMetric('storage_operation_duration', duration, 'ms', tags);
    this.recordMetric('storage_operation_size', size, 'bytes', tags);
    this.recordMetric('storage_operations_total', 1, 'count', tags);
  }

  /**
   * Record database operation
   */
  recordDatabaseOperation(operation: string, duration: number, success: boolean = true) {
    const tags = { operation, success: success.toString() };
    
    this.recordMetric('db_operation_duration', duration, 'ms', tags);
    this.recordMetric('db_operations_total', 1, 'count', tags);
  }

  /**
   * Record error occurrence
   */
  recordError(type: string, error: Error, context?: any) {
    this.recordMetric('errors_total', 1, 'count', { type, error_name: error.name });
    
    this.logger.error(`Error recorded: ${type}`, {
      error: error.message,
      stack: error.stack,
      context,
    });

    // Create alert for critical errors
    if (['uncaught_exception', 'unhandled_rejection', 'database_error'].includes(type)) {
      this.createAlert('critical', `Critical Error: ${type}`, error.message, 'errors_total');
    }
  }

  /**
   * Create an alert
   */
  createAlert(level: Alert['level'], title: string, description: string, metric?: string, threshold?: number, currentValue?: number) {
    const alertId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const alert: Alert = {
      id: alertId,
      level,
      title,
      description,
      metric,
      threshold,
      currentValue,
      timestamp: new Date().toISOString(),
      resolved: false,
      tags: [level, metric || 'general'].filter(Boolean),
    };

    this.alerts.set(alertId, alert);
    
    if (this.config.alertingEnabled) {
      this.sendAlert(alert);
    }

    return alertId;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      
      this.logger.log(`Alert resolved: ${alert.title}`);
    }
  }

  /**
   * Get system snapshot
   */
  async getSystemSnapshot(): Promise<SystemSnapshot> {
    const now = new Date().toISOString();
    
    // Calculate recent performance metrics
    const recentWindow = Date.now() - 300000; // 5 minutes
    const recentRequests = this.requestStats.recent.filter(r => r.timestamp > recentWindow);
    const avgResponseTime = recentRequests.length > 0 
      ? recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / recentRequests.length
      : 0;
    const throughput = recentRequests.length / 5; // requests per minute
    const errorRate = recentRequests.length > 0 
      ? (recentRequests.filter(r => !r.success).length / recentRequests.length) * 100
      : 0;

    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    return {
      timestamp: now,
      performance: {
        responseTime: avgResponseTime,
        throughput,
        errorRate,
        activeConnections: this.requestStats.active,
      },
      resources: {
        memoryUsage,
        cpuUsage: 0, // Would need additional monitoring
        diskUsage: 0, // Would need additional monitoring
        networkIO: { in: 0, out: 0 }, // Would need additional monitoring
      },
      business: {
        activeUsers: 0, // Would come from session tracking
        recordingsProcessed: this.getMetricValue('business_recordings_processed') || 0,
        aiOperations: this.getMetricValue('ai_operations_total') || 0,
        storageUsed: this.getMetricValue('storage_usage_bytes') || 0,
      },
    };
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string, since?: Date): PerformanceMetric[] {
    const metrics = this.metrics.get(name) || [];
    
    if (since) {
      const sinceTimestamp = since.toISOString();
      return metrics.filter(m => m.timestamp >= sinceTimestamp);
    }
    
    return metrics;
  }

  /**
   * Get latest value for a metric
   */
  getMetricValue(name: string): number | undefined {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return undefined;
    
    return metrics[metrics.length - 1].value;
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats() {
    const totalMetrics = Array.from(this.metrics.values()).reduce((sum, metrics) => sum + metrics.length, 0);
    const activeAlerts = this.getActiveAlerts().length;
    
    return {
      enabled: this.config.enabled,
      uptime: Date.now() - this.startTime,
      metricsCount: totalMetrics,
      metricTypes: this.metrics.size,
      activeAlerts,
      totalAlerts: this.alerts.size,
      requestStats: {
        total: this.requestStats.total,
        errors: this.requestStats.errors,
        errorRate: this.requestStats.total > 0 ? (this.requestStats.errors / this.requestStats.total) * 100 : 0,
        averageResponseTime: this.requestStats.total > 0 ? this.requestStats.totalResponseTime / this.requestStats.total : 0,
        active: this.requestStats.active,
      },
    };
  }

  // Private methods
  private collectSystemMetrics() {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      this.recordMetric('memory_heap_used', memUsage.heapUsed, 'bytes');
      this.recordMetric('memory_heap_total', memUsage.heapTotal, 'bytes');
      this.recordMetric('memory_rss', memUsage.rss, 'bytes');
      this.recordMetric('memory_external', memUsage.external, 'bytes');

      // System memory
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      const usedMem = totalMem - freeMem;
      this.recordMetric('system_memory_used', usedMem, 'bytes');
      this.recordMetric('system_memory_usage_percent', (usedMem / totalMem) * 100, 'percentage');

      // Process metrics
      this.recordMetric('process_uptime', process.uptime(), 'count');
      this.recordMetric('process_active_handles', (process as any)._getActiveHandles().length, 'count');
      this.recordMetric('process_active_requests', (process as any)._getActiveRequests().length, 'count');

      // Load average (on Unix systems)
      try {
        const loadAvg = require('os').loadavg();
        this.recordMetric('system_load_1m', loadAvg[0], 'count');
        this.recordMetric('system_load_5m', loadAvg[1], 'count');
        this.recordMetric('system_load_15m', loadAvg[2], 'count');
      } catch (error) {
        // Load average not available on this platform
      }

    } catch (error) {
      this.logger.error('Failed to collect system metrics:', error);
    }
  }

  private checkThresholds(metric: PerformanceMetric) {
    const { name, value } = metric;
    
    // Check response time threshold
    if (name === 'http_request_duration' && value > this.config.thresholds.responseTime) {
      this.createAlert('warning', 'High Response Time', 
        `Response time ${value}ms exceeds threshold ${this.config.thresholds.responseTime}ms`,
        name, this.config.thresholds.responseTime, value);
    }
    
    // Check error rate threshold
    if (name === 'http_error_rate' && value > this.config.thresholds.errorRate) {
      this.createAlert('critical', 'High Error Rate',
        `Error rate ${value.toFixed(2)}% exceeds threshold ${this.config.thresholds.errorRate}%`,
        name, this.config.thresholds.errorRate, value);
    }
    
    // Check memory usage threshold
    if (name === 'system_memory_usage_percent' && value > this.config.thresholds.memoryUsage) {
      this.createAlert('warning', 'High Memory Usage',
        `Memory usage ${value.toFixed(2)}% exceeds threshold ${this.config.thresholds.memoryUsage}%`,
        name, this.config.thresholds.memoryUsage, value);
    }
  }

  private cleanupOldMetrics() {
    const cutoffTime = new Date(Date.now() - this.config.metricsRetentionHours * 60 * 60 * 1000).toISOString();
    
    for (const [name, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(m => m.timestamp >= cutoffTime);
      this.metrics.set(name, filteredMetrics);
    }

    // Clean up old alerts (keep resolved alerts for 24 hours)
    const alertCutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < alertCutoffTime) {
        this.alerts.delete(id);
      }
    }
  }

  private processAlerts() {
    // Auto-resolve alerts that are no longer triggering
    for (const [id, alert] of this.alerts.entries()) {
      if (!alert.resolved && alert.metric) {
        const latestValue = this.getMetricValue(alert.metric);
        
        if (latestValue !== undefined && alert.threshold !== undefined) {
          // Simple threshold check - could be more sophisticated
          if (latestValue < alert.threshold) {
            this.resolveAlert(id);
          }
        }
      }
    }
  }

  private async sendAlert(alert: Alert) {
    const channels = this.config.alerting.channels;
    
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'console':
            this.sendConsoleAlert(alert);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert);
            break;
          case 'email':
            await this.sendEmailAlert(alert);
            break;
          case 'slack':
            await this.sendSlackAlert(alert);
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to send alert via ${channel}:`, error);
      }
    }
  }

  private sendConsoleAlert(alert: Alert) {
    const emoji = alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️';
    this.logger.warn(`${emoji} ALERT [${alert.level.toUpperCase()}]: ${alert.title} - ${alert.description}`);
  }

  private async sendWebhookAlert(alert: Alert) {
    if (!this.config.alerting.webhookUrl) return;

    // TODO: Implement webhook alert sending
    this.logger.debug(`Would send webhook alert to ${this.config.alerting.webhookUrl}`);
  }

  private async sendEmailAlert(alert: Alert) {
    if (!this.config.alerting.emailRecipients?.length) return;

    // TODO: Implement email alert sending
    this.logger.debug(`Would send email alert to ${this.config.alerting.emailRecipients.join(', ')}`);
  }

  private async sendSlackAlert(alert: Alert) {
    if (!this.config.alerting.slackWebhook) return;

    // TODO: Implement Slack alert sending
    this.logger.debug(`Would send Slack alert`);
  }

  /**
   * Track active requests
   */
  incrementActiveRequests() {
    this.requestStats.active++;
  }

  decrementActiveRequests() {
    if (this.requestStats.active > 0) {
      this.requestStats.active--;
    }
  }
}