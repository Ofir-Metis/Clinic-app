import { Controller, Get, Post, Body, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@clinic/common';
import { AnalyticsService } from './analytics.service';
import { CreateReportDto, ReportFiltersDto } from './dto/analytics.dto';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics overview' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  @Roles('coach', 'admin')
  async getDashboardAnalytics(
    @CurrentUser() user: any,
    @Query('period') period?: string,
    @Query('coachId') coachId?: string,
  ) {
    const filters = {
      period: period || '30d',
      coachId: user.role === 'admin' ? coachId : user.id,
    };

    return this.analyticsService.getDashboardAnalytics(filters);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Get appointment analytics' })
  @ApiResponse({ status: 200, description: 'Appointment analytics retrieved successfully' })
  @Roles('coach', 'admin')
  async getAppointmentAnalytics(
    @CurrentUser() user: any,
    @Query() filters: ReportFiltersDto,
  ) {
    const adjustedFilters = {
      ...filters,
      coachId: user.role === 'admin' ? filters.coachId : user.id,
    };

    return this.analyticsService.getAppointmentAnalytics(adjustedFilters);
  }

  @Get('clients')
  @ApiOperation({ summary: 'Get client analytics' })
  @ApiResponse({ status: 200, description: 'Client analytics retrieved successfully' })
  @Roles('coach', 'admin')
  async getClientAnalytics(
    @CurrentUser() user: any,
    @Query() filters: ReportFiltersDto,
  ) {
    const adjustedFilters = {
      ...filters,
      coachId: user.role === 'admin' ? filters.coachId : user.id,
    };

    return this.analyticsService.getClientAnalytics(adjustedFilters);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  @Roles('coach', 'admin')
  async getRevenueAnalytics(
    @CurrentUser() user: any,
    @Query() filters: ReportFiltersDto,
  ) {
    const adjustedFilters = {
      ...filters,
      coachId: user.role === 'admin' ? filters.coachId : user.id,
    };

    return this.analyticsService.getRevenueAnalytics(adjustedFilters);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  @Roles('coach', 'admin')
  async getPerformanceMetrics(
    @CurrentUser() user: any,
    @Query() filters: ReportFiltersDto,
  ) {
    const adjustedFilters = {
      ...filters,
      coachId: user.role === 'admin' ? filters.coachId : user.id,
    };

    return this.analyticsService.getPerformanceMetrics(adjustedFilters);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get trend analysis' })
  @ApiResponse({ status: 200, description: 'Trend analysis retrieved successfully' })
  @Roles('coach', 'admin')
  async getTrendAnalysis(
    @CurrentUser() user: any,
    @Query() filters: ReportFiltersDto,
  ) {
    const adjustedFilters = {
      ...filters,
      coachId: user.role === 'admin' ? filters.coachId : user.id,
    };

    return this.analyticsService.getTrendAnalysis(adjustedFilters);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get available reports' })
  @ApiResponse({ status: 200, description: 'Available reports retrieved successfully' })
  @Roles('coach', 'admin')
  async getAvailableReports(@CurrentUser() user: any) {
    return this.analyticsService.getAvailableReports(user.id, user.role);
  }

  @Post('reports')
  @ApiOperation({ summary: 'Generate custom report' })
  @ApiResponse({ status: 201, description: 'Custom report generated successfully' })
  @Roles('coach', 'admin')
  async generateReport(
    @CurrentUser() user: any,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.analyticsService.generateCustomReport(user.id, createReportDto);
  }

  @Get('reports/:reportId')
  @ApiOperation({ summary: 'Get specific report by ID' })
  @ApiParam({ name: 'reportId', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  @Roles('coach', 'admin')
  async getReport(
    @CurrentUser() user: any,
    @Param('reportId') reportId: string,
  ) {
    return this.analyticsService.getReportById(reportId, user.id, user.role);
  }

  @Get('reports/:reportId/export')
  @ApiOperation({ summary: 'Export report to various formats' })
  @ApiParam({ name: 'reportId', description: 'Report ID' })
  @ApiQuery({ name: 'format', enum: ['pdf', 'excel', 'csv'], description: 'Export format' })
  @ApiResponse({ status: 200, description: 'Report exported successfully' })
  @Roles('coach', 'admin')
  async exportReport(
    @CurrentUser() user: any,
    @Param('reportId') reportId: string,
    @Query('format') format: 'pdf' | 'excel' | 'csv' = 'pdf',
  ) {
    return this.analyticsService.exportReport(reportId, format, user.id, user.role);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get AI-powered insights' })
  @ApiResponse({ status: 200, description: 'AI insights retrieved successfully' })
  @Roles('coach', 'admin')
  async getAIInsights(
    @CurrentUser() user: any,
    @Query() filters: ReportFiltersDto,
  ) {
    const adjustedFilters = {
      ...filters,
      coachId: user.role === 'admin' ? filters.coachId : user.id,
    };

    return this.analyticsService.getAIInsights(adjustedFilters);
  }

  @Get('benchmarks')
  @ApiOperation({ summary: 'Get industry benchmarks' })
  @ApiResponse({ status: 200, description: 'Industry benchmarks retrieved successfully' })
  @Roles('coach', 'admin')
  async getIndustryBenchmarks(
    @CurrentUser() user: any,
    @Query('category') category?: string,
  ) {
    return this.analyticsService.getIndustryBenchmarks(user.role, category);
  }

  @Get('cohort-analysis')
  @ApiOperation({ summary: 'Get cohort analysis' })
  @ApiResponse({ status: 200, description: 'Cohort analysis retrieved successfully' })
  @Roles('admin')
  async getCohortAnalysis(
    @Query() filters: ReportFiltersDto,
  ) {
    return this.analyticsService.getCohortAnalysis(filters);
  }

  @Get('predictive')
  @ApiOperation({ summary: 'Get predictive analytics' })
  @ApiResponse({ status: 200, description: 'Predictive analytics retrieved successfully' })
  @Roles('coach', 'admin')
  async getPredictiveAnalytics(
    @CurrentUser() user: any,
    @Query() filters: ReportFiltersDto,
  ) {
    const adjustedFilters = {
      ...filters,
      coachId: user.role === 'admin' ? filters.coachId : user.id,
    };

    return this.analyticsService.getPredictiveAnalytics(adjustedFilters);
  }
}
