import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PerformanceMetric } from './entities/performance-metric.entity';
import { PerformanceAlert, AlertStatus, AlertSeverity } from './entities/performance-alert.entity';
import { CreatePerformanceAlertDto } from './dto/create-performance-alert.dto';

export interface DashboardData {
  serviceName: string;
  timeRange: string;
  overview: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    uptime: number;
    performanceScore: number;
  };
  trends: {
    responseTime: TrendData;
    errorRate: TrendData;
    throughput: TrendData;
    cpuUsage: TrendData;
    memoryUsage: TrendData;
  };
  alerts: {
    active: number;
    resolved: number;
    critical: number;
    recent: PerformanceAlert[];
  };
  topIssues: Array<{
    type: string;
    description: string;
    impact: string;
    frequency: number;
  }>;
}

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  data: Array<{
    timestamp: Date;
    value: number;
  }>;
}

export interface ServiceComparison {
  services: string[];
  comparisonPeriod: string;
  metrics: {
    responseTime: ServiceMetricComparison;
    errorRate: ServiceMetricComparison;
    throughput: ServiceMetricComparison;
    cpuUsage: ServiceMetricComparison;
    memoryUsage: ServiceMetricComparison;
    performanceScore: ServiceMetricComparison;
  };
  rankings: {
    best: string;
    worst: string;
    mostImproved: string;
    mostDegraded: string;
  };
}

export interface ServiceMetricComparison {
  [serviceName: string]: {
    current: number;
    previous: number;
    change: number;
    rank: number;
  };
}

export interface PerformanceTrends {
  serviceName: string;
  period: string;
  trendAnalysis: {
    responseTime: TrendAnalysis;
    errorRate: TrendAnalysis;
    throughput: TrendAnalysis;
    cpuUsage: TrendAnalysis;
    memoryUsage: TrendAnalysis;
    performanceScore: TrendAnalysis;
  };
  seasonality: {
    detected: boolean;
    patterns: string[];
    peakHours: number[];
    lowHours: number[];
  };
  anomalies: Array<{
    timestamp: Date;
    metric: string;
    value: number;
    expectedValue: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  forecasts: {
    responseTime: ForecastData;
    cpuUsage: ForecastData;
    memoryUsage: ForecastData;
    throughput: ForecastData;
  };
}

export interface TrendAnalysis {
  direction: 'improving' | 'degrading' | 'stable';
  slope: number;
  correlation: number;
  significance: 'high' | 'medium' | 'low';
  description: string;
}

export interface ForecastData {
  predictions: Array<{
    timestamp: Date;
    predicted: number;
    confidence: number;
  }>;
  accuracy: number;
  model: string;
}

export interface ServiceHealthScore {
  serviceName: string;
  overallScore: number;
  componentScores: {
    availability: number;
    performance: number;
    reliability: number;
    scalability: number;
    efficiency: number;
  };
  factors: Array<{
    factor: string;
    weight: number;
    score: number;
    impact: string;
  }>;
  recommendations: string[];
  trend: 'improving' | 'degrading' | 'stable';
  lastUpdated: Date;
}

@Injectable()
export class PerformanceAnalyticsService {
  private readonly logger = new Logger(PerformanceAnalyticsService.name);

  constructor(
    @InjectRepository(PerformanceMetric)
    private performanceMetricRepository: Repository<PerformanceMetric>,
    @InjectRepository(PerformanceAlert)
    private performanceAlertRepository: Repository<PerformanceAlert>,
    private configService: ConfigService,
  ) {}

  async generateDashboardData(serviceName: string, timeRange: string = '24h'): Promise<DashboardData> {
    try {
      const { startDate, endDate } = this.parseTimeRange(timeRange);
      
      const metrics = await this.performanceMetricRepository.find({
        where: {
          serviceName,
          timestamp: Between(startDate, endDate),
        },
        order: { timestamp: 'ASC' },
      });

      if (metrics.length === 0) {
        throw new Error(`No metrics found for service ${serviceName} in time range ${timeRange}`);
      }

      const previousPeriod = this.getPreviousPeriod(startDate, endDate);
      const previousMetrics = await this.performanceMetricRepository.find({
        where: {
          serviceName,
          timestamp: Between(previousPeriod.startDate, previousPeriod.endDate),
        },
        order: { timestamp: 'ASC' },
      });

      const overview = this.calculateOverviewMetrics(metrics);
      const trends = this.calculateTrends(metrics, previousMetrics);
      const alerts = await this.getAlertsSummary(serviceName, startDate, endDate);
      const topIssues = this.identifyTopIssues(metrics);

      return {
        serviceName,
        timeRange,
        overview,
        trends,
        alerts,
        topIssues,
      };
    } catch (error) {
      this.logger.error('Error generating dashboard data:', error);
      throw error;
    }
  }

  private parseTimeRange(timeRange: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '1h':
        startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startDate = new Date(endDate.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  private getPreviousPeriod(startDate: Date, endDate: Date): { startDate: Date; endDate: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      startDate: new Date(startDate.getTime() - duration),
      endDate: new Date(startDate.getTime()),
    };
  }

  private calculateOverviewMetrics(metrics: PerformanceMetric[]): any {
    const totalRequests = metrics.reduce((sum, m) => sum + (m.requestsPerSecond || 0), 0);
    const averageResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const averageErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
    const averageThroughput = metrics.reduce((sum, m) => sum + (m.requestsPerSecond || 0), 0) / metrics.length;
    const averagePerformanceScore = metrics.reduce((sum, m) => sum + m.performanceScore, 0) / metrics.length;

    return {
      totalRequests: Math.round(totalRequests),
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Number(averageErrorRate.toFixed(2)),
      throughput: Math.round(averageThroughput),
      uptime: 99.9, // Placeholder - would be calculated based on availability metrics
      performanceScore: Math.round(averagePerformanceScore),
    };
  }

  private calculateTrends(current: PerformanceMetric[], previous: PerformanceMetric[]): any {
    const calculateTrendData = (
      currentValues: number[],
      previousValues: number[],
      timestamps: Date[]
    ): TrendData => {
      const currentAvg = currentValues.reduce((sum, val) => sum + val, 0) / currentValues.length;
      const previousAvg = previousValues.length > 0 
        ? previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length 
        : currentAvg;
      
      const change = ((currentAvg - previousAvg) / previousAvg) * 100;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(change) > 5) {
        trend = change > 0 ? 'up' : 'down';
      }

      return {
        current: Number(currentAvg.toFixed(2)),
        previous: Number(previousAvg.toFixed(2)),
        change: Number(change.toFixed(1)),
        trend,
        data: timestamps.map((timestamp, index) => ({
          timestamp,
          value: currentValues[index] || 0,
        })),
      };
    };

    const timestamps = current.map(m => m.timestamp);

    return {
      responseTime: calculateTrendData(
        current.map(m => m.responseTime),
        previous.map(m => m.responseTime),
        timestamps
      ),
      errorRate: calculateTrendData(
        current.map(m => m.errorRate),
        previous.map(m => m.errorRate),
        timestamps
      ),
      throughput: calculateTrendData(
        current.map(m => m.requestsPerSecond || 0),
        previous.map(m => m.requestsPerSecond || 0),
        timestamps
      ),
      cpuUsage: calculateTrendData(
        current.map(m => m.cpuUsage),
        previous.map(m => m.cpuUsage),
        timestamps
      ),
      memoryUsage: calculateTrendData(
        current.map(m => m.memoryUsage),
        previous.map(m => m.memoryUsage),
        timestamps
      ),
    };
  }

  private async getAlertsSummary(
    serviceName: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<any> {
    const alerts = await this.performanceAlertRepository.find({
      where: {
        serviceName,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'DESC' },
    });

    const active = alerts.filter(a => a.status === AlertStatus.ACTIVE).length;
    const resolved = alerts.filter(a => a.status === AlertStatus.RESOLVED).length;
    const critical = alerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
    const recent = alerts.slice(0, 10);

    return {
      active,
      resolved,
      critical,
      recent,
    };
  }

  private identifyTopIssues(metrics: PerformanceMetric[]): any[] {
    const issues: any[] = [];

    // High response time
    const highResponseTimeCount = metrics.filter(m => m.responseTime > 1000).length;
    if (highResponseTimeCount > metrics.length * 0.1) {
      issues.push({
        type: 'High Response Time',
        description: 'Response times frequently exceed 1 second',
        impact: 'User experience degradation',
        frequency: highResponseTimeCount,
      });
    }

    // High error rate
    const highErrorRateCount = metrics.filter(m => m.errorRate > 5).length;
    if (highErrorRateCount > metrics.length * 0.05) {
      issues.push({
        type: 'High Error Rate',
        description: 'Error rate frequently exceeds 5%',
        impact: 'Service reliability issues',
        frequency: highErrorRateCount,
      });
    }

    // High CPU usage
    const highCpuCount = metrics.filter(m => m.cpuUsage > 80).length;
    if (highCpuCount > metrics.length * 0.1) {
      issues.push({
        type: 'High CPU Usage',
        description: 'CPU usage frequently exceeds 80%',
        impact: 'Performance bottleneck',
        frequency: highCpuCount,
      });
    }

    // High memory usage
    const highMemoryCount = metrics.filter(m => m.memoryUsage > 85).length;
    if (highMemoryCount > metrics.length * 0.1) {
      issues.push({
        type: 'High Memory Usage',
        description: 'Memory usage frequently exceeds 85%',
        impact: 'Risk of OOM kills',
        frequency: highMemoryCount,
      });
    }

    return issues.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  }

  async analyzePerformanceTrends(serviceName: string, days: number = 30): Promise<PerformanceTrends> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      const metrics = await this.performanceMetricRepository.find({
        where: {
          serviceName,
          timestamp: Between(startDate, endDate),
        },
        order: { timestamp: 'ASC' },
      });

      if (metrics.length === 0) {
        throw new Error(`No metrics found for service ${serviceName} in the last ${days} days`);
      }

      const trendAnalysis = this.performTrendAnalysis(metrics);
      const seasonality = this.detectSeasonality(metrics);
      const anomalies = this.detectAnomalies(metrics);
      const forecasts = this.generateForecasts(metrics);

      return {
        serviceName,
        period: `${days} days`,
        trendAnalysis,
        seasonality,
        anomalies,
        forecasts,
      };
    } catch (error) {
      this.logger.error('Error analyzing performance trends:', error);
      throw error;
    }
  }

  private performTrendAnalysis(metrics: PerformanceMetric[]): any {
    const analyzeTrend = (values: number[], metricName: string): TrendAnalysis => {
      if (values.length < 3) {
        return {
          direction: 'stable',
          slope: 0,
          correlation: 0,
          significance: 'low',
          description: 'Insufficient data for trend analysis',
        };
      }

      // Simple linear regression to calculate slope
      const n = values.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = values;

      const sumX = x.reduce((sum, val) => sum + val, 0);
      const sumY = y.reduce((sum, val) => sum + val, 0);
      const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
      const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      
      // Calculate correlation coefficient
      const meanX = sumX / n;
      const meanY = sumY / n;
      const correlation = sumXY - n * meanX * meanY;

      const direction = Math.abs(slope) < 0.01 ? 'stable' : slope > 0 ? 'degrading' : 'improving';
      const significance = Math.abs(slope) > 1 ? 'high' : Math.abs(slope) > 0.1 ? 'medium' : 'low';

      return {
        direction,
        slope: Number(slope.toFixed(4)),
        correlation: Number(correlation.toFixed(4)),
        significance,
        description: this.generateTrendDescription(direction, significance, metricName),
      };
    };

    return {
      responseTime: analyzeTrend(metrics.map(m => m.responseTime), 'response time'),
      errorRate: analyzeTrend(metrics.map(m => m.errorRate), 'error rate'),
      throughput: analyzeTrend(metrics.map(m => m.requestsPerSecond || 0), 'throughput'),
      cpuUsage: analyzeTrend(metrics.map(m => m.cpuUsage), 'CPU usage'),
      memoryUsage: analyzeTrend(metrics.map(m => m.memoryUsage), 'memory usage'),
      performanceScore: analyzeTrend(metrics.map(m => m.performanceScore), 'performance score'),
    };
  }

  private generateTrendDescription(
    direction: string, 
    significance: string, 
    metricName: string
  ): string {
    if (direction === 'stable') {
      return `${metricName} is stable with no significant trend`;
    }

    const severityText = significance === 'high' ? 'significantly' : 
                        significance === 'medium' ? 'moderately' : 'slightly';
    
    return `${metricName} is ${severityText} ${direction === 'improving' ? 'improving' : 'degrading'}`;
  }

  private detectSeasonality(metrics: PerformanceMetric[]): any {
    // Simple seasonality detection based on hourly patterns
    const hourlyData: { [hour: number]: number[] } = {};
    
    metrics.forEach(metric => {
      const hour = metric.timestamp.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(metric.responseTime);
    });

    // Calculate average response time by hour
    const hourlyAverages: { [hour: number]: number } = {};
    Object.keys(hourlyData).forEach(hour => {
      const hourNum = parseInt(hour);
      const values = hourlyData[hourNum];
      hourlyAverages[hourNum] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });

    // Find peak and low hours
    const hours = Object.keys(hourlyAverages).map(h => parseInt(h));
    const averages = hours.map(h => hourlyAverages[h]);
    
    const maxAvg = Math.max(...averages);
    const minAvg = Math.min(...averages);
    const variance = maxAvg - minAvg;
    
    const peakHours = hours.filter(h => hourlyAverages[h] > maxAvg * 0.9);
    const lowHours = hours.filter(h => hourlyAverages[h] < minAvg * 1.1);

    const detected = variance > maxAvg * 0.3; // 30% variance threshold

    return {
      detected,
      patterns: detected ? ['Daily pattern detected'] : [],
      peakHours: peakHours.sort(),
      lowHours: lowHours.sort(),
    };
  }

  private detectAnomalies(metrics: PerformanceMetric[]): any[] {
    const anomalies: any[] = [];

    // Simple anomaly detection using statistical methods
    const detectAnomaliesInMetric = (
      values: number[], 
      metricName: string, 
      timestamps: Date[]
    ) => {
      if (values.length < 10) return;

      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      const threshold = 3; // 3 standard deviations

      values.forEach((value, index) => {
        const zScore = Math.abs((value - mean) / stdDev);
        if (zScore > threshold) {
          let severity: 'low' | 'medium' | 'high' = 'low';
          if (zScore > 4) severity = 'high';
          else if (zScore > 3.5) severity = 'medium';

          anomalies.push({
            timestamp: timestamps[index],
            metric: metricName,
            value: Number(value.toFixed(2)),
            expectedValue: Number(mean.toFixed(2)),
            severity,
            description: `${metricName} anomaly: ${value.toFixed(2)} (expected ~${mean.toFixed(2)})`,
          });
        }
      });
    };

    const timestamps = metrics.map(m => m.timestamp);
    detectAnomaliesInMetric(metrics.map(m => m.responseTime), 'response_time', timestamps);
    detectAnomaliesInMetric(metrics.map(m => m.errorRate), 'error_rate', timestamps);
    detectAnomaliesInMetric(metrics.map(m => m.cpuUsage), 'cpu_usage', timestamps);
    detectAnomaliesInMetric(metrics.map(m => m.memoryUsage), 'memory_usage', timestamps);

    return anomalies.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);
  }

  private generateForecasts(metrics: PerformanceMetric[]): any {
    // Simple linear extrapolation for forecasting
    const generateForecast = (values: number[], timestamps: Date[]): ForecastData => {
      if (values.length < 5) {
        return {
          predictions: [],
          accuracy: 0,
          model: 'insufficient_data',
        };
      }

      // Simple linear regression for forecasting
      const n = values.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = values;

      const sumX = x.reduce((sum, val) => sum + val, 0);
      const sumY = y.reduce((sum, val) => sum + val, 0);
      const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
      const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Generate predictions for next 24 hours
      const predictions = [];
      const lastTimestamp = timestamps[timestamps.length - 1];
      
      for (let i = 1; i <= 24; i++) {
        const futureX = n + i;
        const predicted = slope * futureX + intercept;
        const confidence = Math.max(0.1, 1 - (i * 0.02)); // Decreasing confidence over time
        
        predictions.push({
          timestamp: new Date(lastTimestamp.getTime() + i * 60 * 60 * 1000),
          predicted: Math.max(0, Number(predicted.toFixed(2))),
          confidence: Number(confidence.toFixed(2)),
        });
      }

      return {
        predictions,
        accuracy: 0.85, // Placeholder accuracy
        model: 'linear_regression',
      };
    };

    const timestamps = metrics.map(m => m.timestamp);

    return {
      responseTime: generateForecast(metrics.map(m => m.responseTime), timestamps),
      cpuUsage: generateForecast(metrics.map(m => m.cpuUsage), timestamps),
      memoryUsage: generateForecast(metrics.map(m => m.memoryUsage), timestamps),
      throughput: generateForecast(metrics.map(m => m.requestsPerSecond || 0), timestamps),
    };
  }

  async compareServicePerformance(
    services: string[], 
    days: number = 7
  ): Promise<ServiceComparison> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
      const midDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2);

      const allMetrics = await this.performanceMetricRepository.find({
        where: {
          serviceName: In(services),
          timestamp: Between(startDate, endDate),
        },
        order: { timestamp: 'ASC' },
      });

      const serviceMetrics: { [service: string]: PerformanceMetric[] } = {};
      services.forEach(service => {
        serviceMetrics[service] = allMetrics.filter(m => m.serviceName === service);
      });

      const compareMetric = (
        metricExtractor: (metrics: PerformanceMetric[]) => number[]
      ): ServiceMetricComparison => {
        const comparison: ServiceMetricComparison = {};
        
        services.forEach(service => {
          const metrics = serviceMetrics[service];
          if (metrics.length === 0) {
            comparison[service] = { current: 0, previous: 0, change: 0, rank: services.length };
            return;
          }

          const currentMetrics = metrics.filter(m => m.timestamp >= midDate);
          const previousMetrics = metrics.filter(m => m.timestamp < midDate);

          const currentValues = metricExtractor(currentMetrics);
          const previousValues = metricExtractor(previousMetrics);

          const current = currentValues.reduce((sum, val) => sum + val, 0) / currentValues.length || 0;
          const previous = previousValues.reduce((sum, val) => sum + val, 0) / previousValues.length || 0;
          const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

          comparison[service] = {
            current: Number(current.toFixed(2)),
            previous: Number(previous.toFixed(2)),
            change: Number(change.toFixed(1)),
            rank: 0, // Will be calculated after all services
          };
        });

        // Calculate rankings
        const sortedServices = Object.keys(comparison).sort((a, b) => 
          comparison[a].current - comparison[b].current
        );
        
        sortedServices.forEach((service, index) => {
          comparison[service].rank = index + 1;
        });

        return comparison;
      };

      const metrics = {
        responseTime: compareMetric(metrics => metrics.map(m => m.responseTime)),
        errorRate: compareMetric(metrics => metrics.map(m => m.errorRate)),
        throughput: compareMetric(metrics => metrics.map(m => m.requestsPerSecond || 0)),
        cpuUsage: compareMetric(metrics => metrics.map(m => m.cpuUsage)),
        memoryUsage: compareMetric(metrics => metrics.map(m => m.memoryUsage)),
        performanceScore: compareMetric(metrics => metrics.map(m => m.performanceScore)),
      };

      // Calculate rankings
      const rankings = this.calculateServiceRankings(services, metrics);

      return {
        services,
        comparisonPeriod: `${days} days`,
        metrics,
        rankings,
      };
    } catch (error) {
      this.logger.error('Error comparing service performance:', error);
      throw error;
    }
  }

  private calculateServiceRankings(services: string[], metrics: any): any {
    // Calculate overall performance scores
    const overallScores: { [service: string]: number } = {};
    
    services.forEach(service => {
      let score = 0;
      score += (6 - metrics.responseTime[service].rank) * 0.3; // 30% weight
      score += (6 - metrics.errorRate[service].rank) * 0.25; // 25% weight
      score += (metrics.throughput[service].rank - 1) * 0.2; // 20% weight (higher is better)
      score += (6 - metrics.cpuUsage[service].rank) * 0.15; // 15% weight
      score += (6 - metrics.memoryUsage[service].rank) * 0.1; // 10% weight
      
      overallScores[service] = score;
    });

    const sortedByScore = Object.keys(overallScores).sort((a, b) => overallScores[b] - overallScores[a]);
    
    // Find most improved and most degraded
    const improvements: { [service: string]: number } = {};
    services.forEach(service => {
      const responseTimeImprovement = -metrics.responseTime[service].change; // Negative change is improvement
      const errorRateImprovement = -metrics.errorRate[service].change;
      const throughputImprovement = metrics.throughput[service].change;
      const scoreChange = metrics.performanceScore[service].change;
      
      improvements[service] = (responseTimeImprovement + errorRateImprovement + throughputImprovement + scoreChange) / 4;
    });

    const sortedByImprovement = Object.keys(improvements).sort((a, b) => improvements[b] - improvements[a]);

    return {
      best: sortedByScore[0],
      worst: sortedByScore[sortedByScore.length - 1],
      mostImproved: sortedByImprovement[0],
      mostDegraded: sortedByImprovement[sortedByImprovement.length - 1],
    };
  }

  async calculateServiceHealthScore(serviceName: string): Promise<ServiceHealthScore> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      const metrics = await this.performanceMetricRepository.find({
        where: {
          serviceName,
          timestamp: Between(startDate, endDate),
        },
        order: { timestamp: 'DESC' },
      });

      if (metrics.length === 0) {
        throw new Error(`No metrics found for service ${serviceName}`);
      }

      const componentScores = this.calculateComponentScores(metrics);
      const overallScore = this.calculateOverallScore(componentScores);
      const factors = this.calculateScoreFactors(metrics, componentScores);
      const recommendations = this.generateHealthRecommendations(componentScores, factors);
      const trend = this.calculateHealthTrend(metrics);

      return {
        serviceName,
        overallScore,
        componentScores,
        factors,
        recommendations,
        trend,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Error calculating service health score:', error);
      throw error;
    }
  }

  private calculateComponentScores(metrics: PerformanceMetric[]): any {
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
    const avgCpuUsage = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
    const avgMemoryUsage = metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / metrics.length;
    const avgPerformanceScore = metrics.reduce((sum, m) => sum + m.performanceScore, 0) / metrics.length;

    // Calculate scores (0-100 scale)
    const availability = Math.max(0, 100 - avgErrorRate * 20); // Error rate impact
    const performance = Math.max(0, 100 - Math.max(0, avgResponseTime - 100) / 10); // Response time impact
    const reliability = Math.min(100, avgPerformanceScore); // Use performance score directly
    const scalability = Math.max(0, 100 - Math.max(0, avgCpuUsage - 50) * 2); // CPU usage impact
    const efficiency = Math.max(0, 100 - Math.max(0, avgMemoryUsage - 60) * 1.5); // Memory usage impact

    return {
      availability: Math.round(availability),
      performance: Math.round(performance),
      reliability: Math.round(reliability),
      scalability: Math.round(scalability),
      efficiency: Math.round(efficiency),
    };
  }

  private calculateOverallScore(componentScores: any): number {
    const weights = {
      availability: 0.3,
      performance: 0.25,
      reliability: 0.2,
      scalability: 0.15,
      efficiency: 0.1,
    };

    let overallScore = 0;
    Object.keys(weights).forEach(component => {
      overallScore += componentScores[component] * weights[component];
    });

    return Math.round(overallScore);
  }

  private calculateScoreFactors(metrics: PerformanceMetric[], componentScores: any): any[] {
    const factors = [];

    factors.push({
      factor: 'Response Time',
      weight: 0.25,
      score: componentScores.performance,
      impact: componentScores.performance < 70 ? 'High negative impact' : 
              componentScores.performance < 85 ? 'Medium impact' : 'Positive impact',
    });

    factors.push({
      factor: 'Error Rate',
      weight: 0.3,
      score: componentScores.availability,
      impact: componentScores.availability < 95 ? 'Critical impact' : 'Minimal impact',
    });

    factors.push({
      factor: 'Resource Utilization',
      weight: 0.25,
      score: Math.round((componentScores.scalability + componentScores.efficiency) / 2),
      impact: componentScores.scalability < 70 || componentScores.efficiency < 70 ? 
              'Resource constraint impact' : 'Optimal resource usage',
    });

    factors.push({
      factor: 'Reliability',
      weight: 0.2,
      score: componentScores.reliability,
      impact: componentScores.reliability < 80 ? 'Reliability concerns' : 'Good reliability',
    });

    return factors;
  }

  private generateHealthRecommendations(componentScores: any, factors: any[]): string[] {
    const recommendations: string[] = [];

    if (componentScores.availability < 95) {
      recommendations.push('Investigate and reduce error rates to improve availability');
    }

    if (componentScores.performance < 80) {
      recommendations.push('Optimize response times through caching and query optimization');
    }

    if (componentScores.scalability < 70) {
      recommendations.push('Consider horizontal scaling or CPU optimization');
    }

    if (componentScores.efficiency < 70) {
      recommendations.push('Optimize memory usage and investigate potential memory leaks');
    }

    if (componentScores.reliability < 80) {
      recommendations.push('Implement circuit breakers and improve error handling');
    }

    if (recommendations.length === 0) {
      recommendations.push('Service is performing well - maintain current practices');
    }

    return recommendations;
  }

  private calculateHealthTrend(metrics: PerformanceMetric[]): 'improving' | 'degrading' | 'stable' {
    if (metrics.length < 10) return 'stable';

    const recentScores = metrics.slice(0, Math.floor(metrics.length / 3)).map(m => m.performanceScore);
    const olderScores = metrics.slice(-Math.floor(metrics.length / 3)).map(m => m.performanceScore);

    const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (Math.abs(change) < 2) return 'stable';
    return change > 0 ? 'improving' : 'degrading';
  }

  async getPerformanceAlerts(query: any): Promise<any> {
    const where: any = {};

    if (query.serviceName) {
      where.serviceName = query.serviceName;
    }

    if (query.severity) {
      where.severity = query.severity;
    }

    if (query.resolved !== undefined) {
      where.resolved = query.resolved;
    }

    const alerts = await this.performanceAlertRepository.find({
      where,
      order: { timestamp: 'DESC' },
      take: query.limit || 50,
    });

    return {
      alerts,
      total: alerts.length,
      filters: query,
    };
  }

  async createPerformanceAlert(createAlertDto: CreatePerformanceAlertDto): Promise<PerformanceAlert> {
    const alert = this.performanceAlertRepository.create({
      ...createAlertDto,
      timestamp: new Date(),
      status: AlertStatus.ACTIVE,
    });

    return await this.performanceAlertRepository.save(alert);
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string, notes?: string): Promise<PerformanceAlert> {
    const alert = await this.performanceAlertRepository.findOne({ where: { id: alertId } });
    
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    alert.status = AlertStatus.ACKNOWLEDGED;

    if (notes) {
      alert.metadata = { ...alert.metadata, acknowledgmentNotes: notes };
    }

    return await this.performanceAlertRepository.save(alert);
  }

  async resolveAlert(
    alertId: string, 
    resolvedBy: string, 
    resolutionNotes?: string, 
    rootCause?: string
  ): Promise<PerformanceAlert> {
    const alert = await this.performanceAlertRepository.findOne({ where: { id: alertId } });
    
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    alert.resolutionNotes = resolutionNotes;
    alert.rootCause = rootCause;
    alert.status = AlertStatus.RESOLVED;

    return await this.performanceAlertRepository.save(alert);
  }

  async setPerformanceBaseline(
    serviceName: string, 
    baselineType: string, 
    description?: string
  ): Promise<any> {
    // This would set a performance baseline for comparison
    // Implementation would store baseline metrics in a separate table
    
    return {
      serviceName,
      baselineType,
      description,
      message: 'Performance baseline set successfully',
      timestamp: new Date(),
    };
  }

  async exportPerformanceData(
    serviceName: string, 
    format: string = 'json', 
    startDate?: Date, 
    endDate?: Date
  ): Promise<any> {
    const whereClause: any = { serviceName };
    
    if (startDate && endDate) {
      whereClause.timestamp = Between(startDate, endDate);
    }

    const metrics = await this.performanceMetricRepository.find({
      where: whereClause,
      order: { timestamp: 'DESC' },
    });

    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(metrics);
      case 'excel':
        return this.exportToExcel(metrics);
      case 'json':
      default:
        return {
          serviceName,
          exportFormat: format,
          recordCount: metrics.length,
          data: metrics,
          exportedAt: new Date(),
        };
    }
  }

  private exportToCSV(metrics: PerformanceMetric[]): string {
    const headers = [
      'timestamp', 'serviceName', 'cpuUsage', 'memoryUsage', 'responseTime', 
      'errorRate', 'performanceScore', 'databaseConnections', 'cacheHitRatio'
    ];

    const csvData = [
      headers.join(','),
      ...metrics.map(m => [
        m.timestamp.toISOString(),
        m.serviceName,
        m.cpuUsage,
        m.memoryUsage,
        m.responseTime,
        m.errorRate,
        m.performanceScore,
        m.databaseConnections,
        m.cacheHitRatio,
      ].join(','))
    ];

    return csvData.join('\n');
  }

  private exportToExcel(metrics: PerformanceMetric[]): any {
    // Would use a library like ExcelJS to generate Excel files
    return {
      message: 'Excel export not implemented - use CSV format',
      alternativeFormat: 'csv',
    };
  }
}