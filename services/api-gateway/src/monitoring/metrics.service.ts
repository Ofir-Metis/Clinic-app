/**
 * Metrics Service
 * Collects and exposes production metrics for monitoring
 */

import { Injectable, Logger } from '@nestjs/common';

export interface ApiMetrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    rate: number;
  };
  response: {
    averageTime: number;
    p95Time: number;
    p99Time: number;
  };
  status: {
    [key: number]: number;
  };
  endpoints: {
    [endpoint: string]: EndpointMetric;
  };
}

export interface EndpointMetric {
  requests: number;
  averageTime: number;
  errors: number;
  lastAccess: Date;
}

export interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    usage: number;
  };
  cpu: {
    usage: number;
  };
  uptime: number;
  timestamp: Date;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly startTime = Date.now();
  
  // Request metrics
  private totalRequests = 0;
  private successfulRequests = 0;
  private errorRequests = 0;
  private statusCounts = new Map<number, number>();
  
  // Response time tracking
  private responseTimes: number[] = [];
  private readonly maxResponseTimesSamples = 1000; // Keep last 1000 samples
  
  // Endpoint tracking
  private endpointMetrics = new Map<string, EndpointMetric>();
  
  // Rate limiting
  private requestTimestamps: number[] = [];
  private readonly rateLimitWindow = 60000; // 1 minute

  /**
   * Record a request with response time and status
   */
  recordRequest(
    endpoint: string, 
    method: string, 
    statusCode: number, 
    responseTime: number
  ): void {
    const now = Date.now();
    const endpointKey = `${method} ${endpoint}`;
    
    // Update total counts
    this.totalRequests++;
    if (statusCode >= 200 && statusCode < 400) {
      this.successfulRequests++;
    } else {
      this.errorRequests++;
    }
    
    // Update status code counts
    this.statusCounts.set(statusCode, (this.statusCounts.get(statusCode) || 0) + 1);
    
    // Record response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimesSamples) {
      this.responseTimes.shift(); // Remove oldest sample
    }
    
    // Update endpoint metrics
    const endpointMetric = this.endpointMetrics.get(endpointKey) || {
      requests: 0,
      averageTime: 0,
      errors: 0,
      lastAccess: new Date(now)
    };
    
    // Calculate running average
    const totalTime = endpointMetric.averageTime * endpointMetric.requests + responseTime;
    endpointMetric.requests++;
    endpointMetric.averageTime = totalTime / endpointMetric.requests;
    endpointMetric.lastAccess = new Date(now);
    
    if (statusCode >= 400) {
      endpointMetric.errors++;
    }
    
    this.endpointMetrics.set(endpointKey, endpointMetric);
    
    // Update rate limiting data
    this.requestTimestamps.push(now);
    this.cleanupOldTimestamps(now);
  }

  /**
   * Get API metrics
   */
  getApiMetrics(): ApiMetrics {
    const now = Date.now();
    const rate = this.calculateRequestRate();
    
    return {
      requests: {
        total: this.totalRequests,
        success: this.successfulRequests,
        errors: this.errorRequests,
        rate: rate
      },
      response: {
        averageTime: this.calculateAverageResponseTime(),
        p95Time: this.calculatePercentile(95),
        p99Time: this.calculatePercentile(99)
      },
      status: Object.fromEntries(this.statusCounts),
      endpoints: Object.fromEntries(this.endpointMetrics)
    };
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        usage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      cpu: {
        usage: Math.round(((cpuUsage.user + cpuUsage.system) / 1000000) * 100) / 100 // ms to percentage approximation
      },
      uptime: Date.now() - this.startTime,
      timestamp: new Date()
    };
  }

  /**
   * Get combined metrics for monitoring endpoints
   */
  getFullMetrics() {
    return {
      api: this.getApiMetrics(),
      system: this.getSystemMetrics(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all metrics (useful for testing or periodic resets)
   */
  reset(): void {
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.errorRequests = 0;
    this.statusCounts.clear();
    this.responseTimes = [];
    this.endpointMetrics.clear();
    this.requestTimestamps = [];
    
    this.logger.log('All metrics have been reset');
  }

  /**
   * Get top endpoints by request count
   */
  getTopEndpoints(limit = 10): Array<{ endpoint: string; metric: EndpointMetric }> {
    return Array.from(this.endpointMetrics.entries())
      .map(([endpoint, metric]) => ({ endpoint, metric }))
      .sort((a, b) => b.metric.requests - a.metric.requests)
      .slice(0, limit);
  }

  /**
   * Get slowest endpoints by average response time
   */
  getSlowestEndpoints(limit = 10): Array<{ endpoint: string; metric: EndpointMetric }> {
    return Array.from(this.endpointMetrics.entries())
      .map(([endpoint, metric]) => ({ endpoint, metric }))
      .sort((a, b) => b.metric.averageTime - a.metric.averageTime)
      .slice(0, limit);
  }

  /**
   * Get endpoints with highest error rates
   */
  getErrorProneEndpoints(limit = 10): Array<{ endpoint: string; metric: EndpointMetric; errorRate: number }> {
    return Array.from(this.endpointMetrics.entries())
      .map(([endpoint, metric]) => ({
        endpoint,
        metric,
        errorRate: metric.requests > 0 ? (metric.errors / metric.requests) * 100 : 0
      }))
      .filter(item => item.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);
  }

  /**
   * Check if system is under high load
   */
  isUnderHighLoad(): boolean {
    const metrics = this.getSystemMetrics();
    const rate = this.calculateRequestRate();
    
    return (
      metrics.memory.usage > 85 || // Memory usage > 85%
      rate > 1000 || // More than 1000 requests per minute
      this.calculateAverageResponseTime() > 2000 // Average response time > 2s
    );
  }

  /**
   * Get health score based on metrics
   */
  getHealthScore(): number {
    const apiMetrics = this.getApiMetrics();
    const systemMetrics = this.getSystemMetrics();
    
    let score = 100;
    
    // Deduct points for high error rate
    const errorRate = apiMetrics.requests.total > 0 
      ? (apiMetrics.requests.errors / apiMetrics.requests.total) * 100 
      : 0;
    
    if (errorRate > 5) score -= 30; // > 5% error rate
    else if (errorRate > 1) score -= 10; // > 1% error rate
    
    // Deduct points for high response times
    if (apiMetrics.response.averageTime > 2000) score -= 25; // > 2s average
    else if (apiMetrics.response.averageTime > 1000) score -= 10; // > 1s average
    
    // Deduct points for high memory usage
    if (systemMetrics.memory.usage > 90) score -= 25;
    else if (systemMetrics.memory.usage > 80) score -= 10;
    
    // Deduct points for high request rate without proportional success
    const rate = this.calculateRequestRate();
    if (rate > 1000 && errorRate > 2) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  private calculateAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  private calculatePercentile(percentile: number): number {
    if (this.responseTimes.length === 0) return 0;
    
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return Math.round(sorted[Math.max(0, index)] || 0);
  }

  private calculateRequestRate(): number {
    // Requests per minute
    const now = Date.now();
    const recentRequests = this.requestTimestamps.filter(
      timestamp => now - timestamp <= this.rateLimitWindow
    );
    return recentRequests.length;
  }

  private cleanupOldTimestamps(now: number): void {
    // Remove timestamps older than the rate limit window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp <= this.rateLimitWindow
    );
  }
}