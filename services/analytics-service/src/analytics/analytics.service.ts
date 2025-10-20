import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StructuredLoggerService } from '@clinic/common';
import { CreateReportDto, ReportFiltersDto, AnalyticsReportDto, AnalyticsChartDto, TimePeriod } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: StructuredLoggerService,
  ) {}

  /**
   * Get dashboard analytics overview
   */
  async getDashboardAnalytics(filters: { period: string; coachId?: string }): Promise<any> {
    try {
      const { startDate, endDate } = this.parsePeriod(filters.period);
      const coachFilter = filters.coachId ? 'AND coach_id = $3' : '';
      const params: (Date | string)[] = [startDate, endDate];
      if (filters.coachId) params.push(filters.coachId);

      const [
        appointmentStats,
        clientStats,
        revenueStats,
        completionRates
      ] = await Promise.all([
        this.getAppointmentStatistics(startDate, endDate, filters.coachId),
        this.getClientStatistics(startDate, endDate, filters.coachId),
        this.getRevenueStatistics(startDate, endDate, filters.coachId),
        this.getCompletionRates(startDate, endDate, filters.coachId),
      ]);

      return {
        period: filters.period,
        summary: {
          totalAppointments: appointmentStats.total,
          totalClients: clientStats.total,
          totalRevenue: revenueStats.total,
          averageRating: completionRates.averageRating,
          completionRate: completionRates.completionRate,
        },
        trends: {
          appointments: appointmentStats.trend,
          clients: clientStats.trend,
          revenue: revenueStats.trend,
        },
        charts: [
          await this.generateAppointmentChart(startDate, endDate, filters.coachId),
          await this.generateRevenueChart(startDate, endDate, filters.coachId),
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard analytics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get appointment analytics
   */
  async getAppointmentAnalytics(filters: ReportFiltersDto): Promise<any> {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      const coachId = filters.coachId;

      const appointmentData = await this.dataSource.query(`
        SELECT 
          DATE(start_time) as date,
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
          COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_appointments,
          AVG(CASE WHEN rating IS NOT NULL THEN rating END) as average_rating
        FROM appointments 
        WHERE start_time BETWEEN $1 AND $2
        ${coachId ? 'AND coach_id = $3' : ''}
        GROUP BY DATE(start_time)
        ORDER BY date
      `, coachId ? [startDate, endDate, coachId] : [startDate, endDate]);

      const appointmentTypes = await this.dataSource.query(`
        SELECT 
          type,
          COUNT(*) as count,
          AVG(duration_minutes) as avg_duration
        FROM appointments 
        WHERE start_time BETWEEN $1 AND $2
        ${coachId ? 'AND coach_id = $3' : ''}
        GROUP BY type
        ORDER BY count DESC
      `, coachId ? [startDate, endDate, coachId] : [startDate, endDate]);

      return {
        summary: {
          totalAppointments: appointmentData.reduce((sum: number, row: any) => sum + parseInt(row.total_appointments), 0),
          completionRate: this.calculateCompletionRate(appointmentData),
          averageRating: this.calculateAverageRating(appointmentData),
          cancellationRate: this.calculateCancellationRate(appointmentData),
        },
        dailyTrend: appointmentData,
        appointmentTypes,
        insights: await this.generateAppointmentInsights(appointmentData),
      };
    } catch (error) {
      this.logger.error(`Failed to get appointment analytics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get client analytics
   */
  async getClientAnalytics(filters: ReportFiltersDto): Promise<any> {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      const coachId = filters.coachId;

      const clientGrowth = await this.dataSource.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_clients
        FROM users 
        WHERE role = 'client' 
        AND created_at BETWEEN $1 AND $2
        ${coachId ? 'AND coach_id = $3' : ''}
        GROUP BY DATE(created_at)
        ORDER BY date
      `, coachId ? [startDate, endDate, coachId] : [startDate, endDate]);

      const clientRetention = await this.getClientRetentionData(startDate, endDate, coachId);
      const clientEngagement = await this.getClientEngagementData(startDate, endDate, coachId);

      return {
        summary: {
          totalClients: clientGrowth.reduce((sum: number, row: any) => sum + parseInt(row.new_clients), 0),
          retentionRate: clientRetention.rate,
          engagementScore: clientEngagement.averageScore,
        },
        growth: clientGrowth,
        retention: clientRetention.data,
        engagement: clientEngagement.data,
        insights: await this.generateClientInsights(clientGrowth, clientRetention, clientEngagement),
      };
    } catch (error) {
      this.logger.error(`Failed to get client analytics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(filters: ReportFiltersDto): Promise<any> {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      const coachId = filters.coachId;

      // This would typically query a payments/billing table
      // For now, we'll simulate with appointment data
      const revenueData = await this.dataSource.query(`
        SELECT 
          DATE(start_time) as date,
          COUNT(*) * 100 as estimated_revenue,
          type as service_type
        FROM appointments 
        WHERE start_time BETWEEN $1 AND $2
        AND status = 'completed'
        ${coachId ? 'AND coach_id = $3' : ''}
        GROUP BY DATE(start_time), type
        ORDER BY date
      `, coachId ? [startDate, endDate, coachId] : [startDate, endDate]);

      return {
        summary: {
          totalRevenue: revenueData.reduce((sum: number, row: any) => sum + parseFloat(row.estimated_revenue), 0),
          averagePerSession: this.calculateAverageRevenue(revenueData),
          growth: this.calculateRevenueGrowth(revenueData),
        },
        dailyRevenue: revenueData,
        revenueByService: this.groupRevenueByService(revenueData),
        insights: await this.generateRevenueInsights(revenueData),
      };
    } catch (error) {
      this.logger.error(`Failed to get revenue analytics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(filters: ReportFiltersDto): Promise<any> {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      const coachId = filters.coachId;

      const performanceData = await this.dataSource.query(`
        SELECT 
          AVG(rating) as average_rating,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sessions,
          COUNT(*) as total_sessions
        FROM appointments 
        WHERE start_time BETWEEN $1 AND $2
        ${coachId ? 'AND coach_id = $3' : ''}
      `, coachId ? [startDate, endDate, coachId] : [startDate, endDate]);

      return {
        ratings: {
          average: parseFloat(performanceData[0]?.average_rating || 0),
          distribution: await this.getRatingDistribution(startDate, endDate, coachId),
        },
        sessions: {
          completion_rate: this.calculateSessionCompletionRate(performanceData[0]),
          cancellation_rate: this.calculateSessionCancellationRate(performanceData[0]),
        },
        productivity: await this.getProductivityMetrics(startDate, endDate, coachId),
        insights: await this.generatePerformanceInsights(performanceData[0]),
      };
    } catch (error) {
      this.logger.error(`Failed to get performance metrics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(filters: ReportFiltersDto): Promise<any> {
    try {
      const { startDate, endDate } = this.getDateRange(filters);
      const coachId = filters.coachId;

      const trends = await Promise.all([
        this.getAppointmentTrends(startDate, endDate, coachId),
        this.getClientTrends(startDate, endDate, coachId),
        this.getRevenueTrends(startDate, endDate, coachId),
      ]);

      return {
        appointments: trends[0],
        clients: trends[1],
        revenue: trends[2],
        predictions: await this.generatePredictions(trends),
      };
    } catch (error) {
      this.logger.error(`Failed to get trend analysis: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(userId: string, createReportDto: CreateReportDto): Promise<AnalyticsReportDto> {
    try {
      const reportId = this.generateReportId();
      const { startDate, endDate } = this.getDateRange(createReportDto.filters);

      // Process metrics based on configuration
      const metrics = await this.processMetrics(createReportDto.metrics, startDate, endDate, createReportDto.filters);
      
      // Generate charts
      const charts = await this.generateCharts(createReportDto.charts || [], startDate, endDate, createReportDto.filters);

      const report: AnalyticsReportDto = {
        id: reportId,
        name: createReportDto.name,
        type: createReportDto.type,
        description: createReportDto.description,
        generatedAt: new Date(),
        filters: createReportDto.filters,
        metrics,
        charts,
        insights: await this.generateReportInsights(metrics, charts),
      };

      // Store report (in production, this would save to database)
      await this.storeReport(report, userId);

      return report;
    } catch (error) {
      this.logger.error(`Failed to generate custom report: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get available reports
   */
  async getAvailableReports(userId: string, userRole: string): Promise<any[]> {
    // In production, this would query stored reports from database
    return [
      {
        id: 'default-dashboard',
        name: 'Dashboard Overview',
        type: 'dashboard',
        description: 'General overview of key metrics',
        isDefault: true,
      },
      {
        id: 'appointments-report',
        name: 'Appointments Analysis',
        type: 'appointments',
        description: 'Detailed appointment statistics and trends',
        isDefault: true,
      },
    ];
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string, userId: string, userRole: string): Promise<AnalyticsReportDto> {
    // In production, this would fetch from database
    throw new Error('Report not found');
  }

  /**
   * Export report
   */
  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv', userId: string, userRole: string): Promise<any> {
    // Implementation would generate the requested format
    return {
      downloadUrl: `https://cdn.example.com/reports/${reportId}.${format}`,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    };
  }

  /**
   * Get AI-powered insights
   */
  async getAIInsights(filters: ReportFiltersDto): Promise<any> {
    // This would integrate with AI service for advanced insights
    return {
      insights: [
        {
          key: 'appointment_trend',
          message: 'Your appointment bookings have increased by 15% this month',
          type: 'positive',
          priority: 'high',
        },
        {
          key: 'client_retention',
          message: 'Client retention rate could be improved with follow-up sessions',
          type: 'neutral',
          priority: 'medium',
        },
      ],
      recommendations: [
        'Consider offering package deals to improve client retention',
        'Schedule follow-up appointments proactively',
      ],
    };
  }

  /**
   * Get industry benchmarks
   */
  async getIndustryBenchmarks(userRole: string, category?: string): Promise<any> {
    return {
      benchmarks: {
        appointmentCompletionRate: 0.85,
        clientRetentionRate: 0.75,
        averageSessionRating: 4.2,
        revenueGrowthRate: 0.12,
      },
      userPerformance: {
        appointmentCompletionRate: 0.90,
        clientRetentionRate: 0.80,
        averageSessionRating: 4.5,
        revenueGrowthRate: 0.15,
      },
      comparison: 'above_average',
    };
  }

  /**
   * Get cohort analysis
   */
  async getCohortAnalysis(filters: ReportFiltersDto): Promise<any> {
    // Implementation for cohort analysis
    return {
      cohorts: [],
      retention: {},
      insights: [],
    };
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(filters: ReportFiltersDto): Promise<any> {
    // Implementation for predictive analytics using ML models
    return {
      predictions: {
        nextMonthAppointments: 45,
        clientChurnRisk: 0.12,
        revenueProjection: 5200,
      },
      confidence: 0.85,
      factors: [
        'Historical booking patterns',
        'Seasonal trends',
        'Client engagement levels',
      ],
    };
  }

  // Private helper methods
  private parsePeriod(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '6m':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  private getDateRange(filters: ReportFiltersDto): { startDate: Date; endDate: Date } {
    if (filters.startDate && filters.endDate) {
      return {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      };
    }

    return this.parsePeriod(filters.period || '30d');
  }

  private async getAppointmentStatistics(startDate: Date, endDate: Date, coachId?: string): Promise<any> {
    // Implementation details...
    return { total: 0, trend: 'stable' };
  }

  private async getClientStatistics(startDate: Date, endDate: Date, coachId?: string): Promise<any> {
    // Implementation details...
    return { total: 0, trend: 'stable' };
  }

  private async getRevenueStatistics(startDate: Date, endDate: Date, coachId?: string): Promise<any> {
    // Implementation details...
    return { total: 0, trend: 'stable' };
  }

  private async getCompletionRates(startDate: Date, endDate: Date, coachId?: string): Promise<any> {
    // Implementation details...
    return { averageRating: 4.5, completionRate: 0.85 };
  }

  private async generateAppointmentChart(startDate: Date, endDate: Date, coachId?: string): Promise<AnalyticsChartDto> {
    // Implementation details...
    return {
      config: {
        type: 'line',
        title: 'Appointments Trend',
        xAxis: 'date',
        yAxis: 'count',
      },
      data: [],
    };
  }

  private async generateRevenueChart(startDate: Date, endDate: Date, coachId?: string): Promise<AnalyticsChartDto> {
    // Implementation details...
    return {
      config: {
        type: 'bar',
        title: 'Revenue Trend',
        xAxis: 'date',
        yAxis: 'revenue',
      },
      data: [],
    };
  }

  private calculateCompletionRate(data: any[]): number {
    // Implementation details...
    return 0.85;
  }

  private calculateAverageRating(data: any[]): number {
    // Implementation details...
    return 4.5;
  }

  private calculateCancellationRate(data: any[]): number {
    // Implementation details...
    return 0.15;
  }

  private async generateAppointmentInsights(data: any[]): Promise<any[]> {
    // Implementation details...
    return [];
  }

  private async getClientRetentionData(startDate: Date, endDate: Date, coachId?: string): Promise<any> {
    // Implementation details...
    return { rate: 0.75, data: [] };
  }

  private async getClientEngagementData(startDate: Date, endDate: Date, coachId?: string): Promise<any> {
    // Implementation details...
    return { averageScore: 7.5, data: [] };
  }

  private async generateClientInsights(growth: any, retention: any, engagement: any): Promise<any[]> {
    // Implementation details...
    return [];
  }

  private calculateAverageRevenue(data: any[]): number {
    // Implementation details...
    return 100;
  }

  private calculateRevenueGrowth(data: any[]): number {
    // Implementation details...
    return 0.15;
  }

  private groupRevenueByService(data: any[]): any[] {
    // Implementation details...
    return [];
  }

  private async generateRevenueInsights(data: any[]): Promise<any[]> {
    // Implementation details...
    return [];
  }

  private async getRatingDistribution(startDate: Date, endDate: Date, coachId?: string): Promise<any> {
    // Implementation details...
    return {};
  }

  private calculateSessionCompletionRate(data: any): number {
    // Implementation details...
    return 0.85;
  }

  private calculateSessionCancellationRate(data: any): number {
    // Implementation details...
    return 0.15;
  }

  private async getProductivityMetrics(startDate: Date, endDate: Date, coachId?: string): Promise<any> {
    // Implementation details...
    return {};
  }

  private async generatePerformanceInsights(data: any): Promise<any[]> {
    // Implementation details...
    return [];
  }

  private async getAppointmentTrends(startDate: Date, endDate: Date, coachId?: string): Promise<any> {
    // Implementation details...
    return {};
  }

  private async getClientTrends(startDate: Date, endDate: Date, coachId?: string): Promise<any> {
    // Implementation details...
    return {};
  }

  private async getRevenueTrends(startDate: Date, endDate: Date, coachId?: string): Promise<any> {
    // Implementation details...
    return {};
  }

  private async generatePredictions(trends: any[]): Promise<any> {
    // Implementation details...
    return {};
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processMetrics(metricsConfig: any[], startDate: Date, endDate: Date, filters: ReportFiltersDto): Promise<Record<string, number>> {
    // Implementation details...
    return {};
  }

  private async generateCharts(chartsConfig: any[], startDate: Date, endDate: Date, filters: ReportFiltersDto): Promise<AnalyticsChartDto[]> {
    // Implementation details...
    return [];
  }

  private async generateReportInsights(metrics: Record<string, number>, charts: AnalyticsChartDto[]): Promise<any[]> {
    // Implementation details...
    return [];
  }

  private async storeReport(report: AnalyticsReportDto, userId: string): Promise<void> {
    // Implementation details - store in database
  }
}
