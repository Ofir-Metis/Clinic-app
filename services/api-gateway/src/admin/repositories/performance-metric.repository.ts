/**
 * PerformanceMetricRepository - Repository for performance metrics with custom queries
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Repository, Between } from 'typeorm';
import { PerformanceMetric } from '../entities/performance-metric.entity';

@Injectable()
export class PerformanceMetricRepository extends Repository<PerformanceMetric> {
  constructor(private dataSource: DataSource) {
    super(PerformanceMetric, dataSource.createEntityManager());
  }

  async recordMetric(
    service: string,
    metricName: string,
    value: number,
    unit?: string,
    tags?: Record<string, string>,
    metadata?: Record<string, any>,
  ): Promise<PerformanceMetric> {
    const metric = this.create({
      service,
      metricName,
      value,
      unit,
      tags,
      metadata,
      timestamp: new Date(),
    });

    return this.save(metric);
  }

  async getMetricSeries(
    service: string,
    metricName: string,
    startTime: Date,
    endTime: Date,
    interval: 'minute' | 'hour' | 'day' = 'hour',
  ): Promise<Array<{ timestamp: Date; value: number; count: number }>> {
    let timeFormat: string;
    switch (interval) {
      case 'minute':
        timeFormat = '%Y-%m-%d %H:%i:00';
        break;
      case 'hour':
        timeFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        timeFormat = '%Y-%m-%d 00:00:00';
        break;
    }

    const result = await this.createQueryBuilder('metric')
      .select([
        `DATE_FORMAT(metric.timestamp, '${timeFormat}') as timestamp`,
        'AVG(metric.value) as value',
        'COUNT(*) as count',
      ])
      .where('metric.service = :service', { service })
      .andWhere('metric.metricName = :metricName', { metricName })
      .andWhere('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
      .groupBy(`DATE_FORMAT(metric.timestamp, '${timeFormat}')`)
      .orderBy('timestamp', 'ASC')
      .getRawMany();

    return result.map(row => ({
      timestamp: new Date(row.timestamp),
      value: parseFloat(row.value),
      count: parseInt(row.count),
    }));
  }

  async getServiceMetrics(
    service: string,
    startTime: Date,
    endTime: Date,
  ): Promise<Array<{
    metricName: string;
    currentValue: number;
    avgValue: number;
    minValue: number;
    maxValue: number;
    count: number;
  }>> {
    const result = await this.createQueryBuilder('metric')
      .select([
        'metric.metricName',
        'metric.value as currentValue',
        'AVG(metric.value) as avgValue',
        'MIN(metric.value) as minValue',
        'MAX(metric.value) as maxValue',
        'COUNT(*) as count',
      ])
      .where('metric.service = :service', { service })
      .andWhere('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
      .groupBy('metric.metricName')
      .orderBy('metric.metricName', 'ASC')
      .getRawMany();

    return result.map(row => ({
      metricName: row.metricName,
      currentValue: parseFloat(row.currentValue),
      avgValue: parseFloat(row.avgValue),
      minValue: parseFloat(row.minValue),
      maxValue: parseFloat(row.maxValue),
      count: parseInt(row.count),
    }));
  }

  async getSystemOverview(
    startTime: Date,
    endTime: Date,
  ): Promise<{
    services: string[];
    metrics: Record<string, {
      responseTime: number;
      throughput: number;
      errorRate: number;
      cpuUsage: number;
      memoryUsage: number;
    }>;
    totalRequests: number;
    avgResponseTime: number;
    overallErrorRate: number;
  }> {
    // Get distinct services
    const servicesResult = await this.createQueryBuilder('metric')
      .select('DISTINCT metric.service')
      .where('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
      .getRawMany();

    const services = servicesResult.map(row => row.service);

    // Get metrics for each service
    const metricsPromises = services.map(async service => {
      const serviceMetrics = await this.getServiceMetrics(service, startTime, endTime);
      
      const getMetricValue = (metricName: string) => {
        const metric = serviceMetrics.find(m => m.metricName === metricName);
        return metric ? metric.avgValue : 0;
      };

      return {
        service,
        metrics: {
          responseTime: getMetricValue('response_time'),
          throughput: getMetricValue('requests_per_second'),
          errorRate: getMetricValue('error_rate'),
          cpuUsage: getMetricValue('cpu_usage'),
          memoryUsage: getMetricValue('memory_usage'),
        },
      };
    });

    const serviceMetricsResults = await Promise.all(metricsPromises);
    const metrics = serviceMetricsResults.reduce((acc, result) => {
      acc[result.service] = result.metrics;
      return acc;
    }, {});

    // Calculate overall metrics
    const totalRequestsResult = await this.createQueryBuilder('metric')
      .select('SUM(metric.value) as total')
      .where('metric.metricName = :metricName', { metricName: 'total_requests' })
      .andWhere('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
      .getRawOne();

    const avgResponseTimeResult = await this.createQueryBuilder('metric')
      .select('AVG(metric.value) as avg')
      .where('metric.metricName = :metricName', { metricName: 'response_time' })
      .andWhere('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
      .getRawOne();

    const errorRateResult = await this.createQueryBuilder('metric')
      .select('AVG(metric.value) as avg')
      .where('metric.metricName = :metricName', { metricName: 'error_rate' })
      .andWhere('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
      .getRawOne();

    return {
      services,
      metrics,
      totalRequests: parseInt(totalRequestsResult?.total || '0'),
      avgResponseTime: parseFloat(avgResponseTimeResult?.avg || '0'),
      overallErrorRate: parseFloat(errorRateResult?.avg || '0'),
    };
  }

  async getTopSlowQueries(
    service: string,
    limit: number = 10,
    hours: number = 24,
  ): Promise<Array<{
    query: string;
    avgDuration: number;
    maxDuration: number;
    executionCount: number;
    totalDuration: number;
  }>> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const result = await this.createQueryBuilder('metric')
      .select([
        "JSON_UNQUOTE(JSON_EXTRACT(metric.metadata, '$.query')) as query",
        'AVG(metric.value) as avgDuration',
        'MAX(metric.value) as maxDuration',
        'COUNT(*) as executionCount',
        'SUM(metric.value) as totalDuration',
      ])
      .where('metric.service = :service', { service })
      .andWhere('metric.metricName = :metricName', { metricName: 'query_duration' })
      .andWhere('metric.timestamp > :startTime', { startTime })
      .groupBy("JSON_UNQUOTE(JSON_EXTRACT(metric.metadata, '$.query'))")
      .orderBy('avgDuration', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map(row => ({
      query: row.query || 'Unknown Query',
      avgDuration: parseFloat(row.avgDuration),
      maxDuration: parseFloat(row.maxDuration),
      executionCount: parseInt(row.executionCount),
      totalDuration: parseFloat(row.totalDuration),
    }));
  }

  async getAlertConditions(): Promise<Array<{
    service: string;
    metricName: string;
    currentValue: number;
    threshold: number;
    condition: 'above' | 'below';
    severity: 'warning' | 'critical';
  }>> {
    // This would typically check against predefined thresholds
    // For now, we'll return some example conditions based on common thresholds
    const recentMetrics = await this.createQueryBuilder('metric')
      .select([
        'metric.service',
        'metric.metricName',
        'AVG(metric.value) as currentValue',
      ])
      .where('metric.timestamp > :recentTime', { 
        recentTime: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
      })
      .groupBy('metric.service, metric.metricName')
      .getRawMany();

    const alerts = [];
    
    for (const metric of recentMetrics) {
      const value = parseFloat(metric.currentValue);
      
      // Define thresholds for common metrics
      const thresholds = {
        'response_time': { warning: 1000, critical: 2000, condition: 'above' },
        'error_rate': { warning: 0.05, critical: 0.1, condition: 'above' },
        'cpu_usage': { warning: 80, critical: 90, condition: 'above' },
        'memory_usage': { warning: 85, critical: 95, condition: 'above' },
        'disk_usage': { warning: 80, critical: 90, condition: 'above' },
      };

      const threshold = thresholds[metric.metricName];
      if (threshold) {
        if (value >= threshold.critical) {
          alerts.push({
            service: metric.service,
            metricName: metric.metricName,
            currentValue: value,
            threshold: threshold.critical,
            condition: threshold.condition as 'above' | 'below',
            severity: 'critical' as const,
          });
        } else if (value >= threshold.warning) {
          alerts.push({
            service: metric.service,
            metricName: metric.metricName,
            currentValue: value,
            threshold: threshold.warning,
            condition: threshold.condition as 'above' | 'below',
            severity: 'warning' as const,
          });
        }
      }
    }

    return alerts;
  }

  async cleanupOldMetrics(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    const result = await this.createQueryBuilder()
      .delete()
      .from(PerformanceMetric)
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}