import { Injectable, Logger } from '@nestjs/common';
import { CustomMetricsService, HealthcareMetrics } from './custom-metrics.service';
import { StructuredLoggerService } from '@clinic/common/logging';

/**
 * Dashboard Service
 * 
 * Provides dashboard data aggregation and management for monitoring interfaces.
 * Supports multiple dashboard types: operational, business, compliance, and executive.
 */

export interface DashboardConfig {
  dashboardId: string;
  name: string;
  description: string;
  refreshInterval: number; // seconds
  widgets: DashboardWidget[];
  accessRoles: string[];
  alertThresholds?: Record<string, number>;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'status';
  title: string;
  description?: string;
  dataSource: string;
  configuration: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DashboardData {
  dashboardId: string;
  timestamp: Date;
  metrics: HealthcareMetrics;
  alerts: DashboardAlert[];
  status: 'healthy' | 'warning' | 'critical';
  widgets: Record<string, any>;
}

export interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  source: string;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly dashboards: Map<string, DashboardConfig> = new Map();
  private readonly cachedData: Map<string, DashboardData> = new Map();
  
  constructor(
    private readonly customMetricsService: CustomMetricsService,
    private readonly structuredLogger: StructuredLoggerService
  ) {
    this.initializeDefaultDashboards();
  }
  
  /**
   * Initialize default healthcare monitoring dashboards
   */
  private initializeDefaultDashboards() {
    // Operational Dashboard
    const operationalDashboard: DashboardConfig = {
      dashboardId: 'operational',
      name: 'Operational Dashboard',
      description: 'Real-time system health and performance monitoring',
      refreshInterval: 30, // 30 seconds
      accessRoles: ['admin', 'ops'],
      alertThresholds: {
        apiResponseTime: 2000, // ms
        memoryUsage: 80, // percentage
        cpuUsage: 85, // percentage
        errorRate: 5 // percentage
      },
      widgets: [
        {
          id: 'system_health',
          type: 'status',
          title: 'System Health Overview',
          dataSource: 'systemHealth',
          configuration: {
            showDetails: true,
            colorCoding: true
          },
          position: { x: 0, y: 0, width: 6, height: 4 }
        },
        {
          id: 'active_users',
          type: 'metric',
          title: 'Active Users',
          dataSource: 'activeUsers',
          configuration: {
            displayType: 'gauge',
            showBreakdown: true
          },
          position: { x: 6, y: 0, width: 6, height: 4 }
        },
        {
          id: 'api_performance',
          type: 'chart',
          title: 'API Performance',
          dataSource: 'performance.apiEndpointMetrics',
          configuration: {
            chartType: 'line',
            timeRange: '1h',
            metrics: ['requestCount', 'averageResponseTime', 'errorRate']
          },
          position: { x: 0, y: 4, width: 12, height: 6 }
        }
      ]
    };
    
    // Business Dashboard
    const businessDashboard: DashboardConfig = {
      dashboardId: 'business',
      name: 'Business Dashboard',
      description: 'Key business metrics and operational KPIs',
      refreshInterval: 300, // 5 minutes
      accessRoles: ['admin', 'manager', 'therapist'],
      alertThresholds: {
        clientRetentionRate: 75, // percentage
        dailyRevenue: 2000, // minimum daily revenue
        sessionCompletionRate: 80 // percentage
      },
      widgets: [
        {
          id: 'sessions_overview',
          type: 'metric',
          title: 'Daily Sessions',
          dataSource: 'sessions',
          configuration: {
            displayType: 'cards',
            showTrends: true
          },
          position: { x: 0, y: 0, width: 8, height: 4 }
        },
        {
          id: 'revenue_metrics',
          type: 'chart',
          title: 'Revenue Trends',
          dataSource: 'business.revenueMetrics',
          configuration: {
            chartType: 'bar',
            timeRange: '30d',
            showComparison: true
          },
          position: { x: 8, y: 0, width: 4, height: 4 }
        },
        {
          id: 'client_metrics',
          type: 'table',
          title: 'Client Metrics',
          dataSource: 'business',
          configuration: {
            columns: ['newClientRegistrations', 'clientRetentionRate', 'averageSessionsPerClient'],
            sortable: true
          },
          position: { x: 0, y: 4, width: 12, height: 6 }
        }
      ]
    };
    
    // Compliance Dashboard
    const complianceDashboard: DashboardConfig = {
      dashboardId: 'compliance',
      name: 'HIPAA Compliance Dashboard',
      description: 'HIPAA compliance monitoring and audit tracking',
      refreshInterval: 600, // 10 minutes
      accessRoles: ['admin', 'compliance'],
      alertThresholds: {
        hipaaAuditEvents: 100, // daily threshold
        securityScanResults: 5, // high-risk findings
        backupFailures: 0
      },
      widgets: [
        {
          id: 'compliance_status',
          type: 'status',
          title: 'Compliance Status',
          dataSource: 'compliance',
          configuration: {
            showLastAudit: true,
            complianceScore: true
          },
          position: { x: 0, y: 0, width: 6, height: 4 }
        },
        {
          id: 'audit_events',
          type: 'chart',
          title: 'HIPAA Audit Events',
          dataSource: 'compliance.hipaaAuditEvents',
          configuration: {
            chartType: 'timeline',
            timeRange: '7d',
            groupBy: 'eventType'
          },
          position: { x: 6, y: 0, width: 6, height: 4 }
        },
        {
          id: 'security_scan',
          type: 'alert',
          title: 'Security Scan Results',
          dataSource: 'compliance.securityScanResults',
          configuration: {
            alertLevel: 'warning',
            showDetails: true
          },
          position: { x: 0, y: 4, width: 12, height: 4 }
        }
      ]
    };
    
    // Executive Dashboard
    const executiveDashboard: DashboardConfig = {
      dashboardId: 'executive',
      name: 'Executive Dashboard',
      description: 'High-level business overview and key performance indicators',
      refreshInterval: 900, // 15 minutes
      accessRoles: ['admin', 'executive'],
      widgets: [
        {
          id: 'kpi_summary',
          type: 'metric',
          title: 'Key Performance Indicators',
          dataSource: 'business',
          configuration: {
            displayType: 'summary',
            showTargets: true,
            period: 'monthly'
          },
          position: { x: 0, y: 0, width: 12, height: 4 }
        },
        {
          id: 'growth_trends',
          type: 'chart',
          title: 'Growth Trends',
          dataSource: 'business',
          configuration: {
            chartType: 'area',
            timeRange: '90d',
            metrics: ['newClientRegistrations', 'revenueMetrics', 'sessionCount']
          },
          position: { x: 0, y: 4, width: 8, height: 6 }
        },
        {
          id: 'system_overview',
          type: 'status',
          title: 'System Overview',
          dataSource: 'systemHealth',
          configuration: {
            simplified: true,
            uptime: true
          },
          position: { x: 8, y: 4, width: 4, height: 6 }
        }
      ]
    };
    
    this.dashboards.set('operational', operationalDashboard);
    this.dashboards.set('business', businessDashboard);
    this.dashboards.set('compliance', complianceDashboard);
    this.dashboards.set('executive', executiveDashboard);
    
    this.logger.log('Default dashboards initialized', {
      dashboardCount: this.dashboards.size
    });
  }
  
  /**
   * Get dashboard configuration
   */
  getDashboardConfig(dashboardId: string): DashboardConfig | null {
    return this.dashboards.get(dashboardId) || null;
  }
  
  /**
   * Get all available dashboards for a user role
   */
  getAvailableDashboards(userRole: string): DashboardConfig[] {
    const availableDashboards: DashboardConfig[] = [];
    
    for (const dashboard of this.dashboards.values()) {
      if (dashboard.accessRoles.includes(userRole) || dashboard.accessRoles.includes('all')) {
        availableDashboards.push(dashboard);
      }
    }
    
    return availableDashboards;
  }
  
  /**
   * Get dashboard data with real-time metrics
   */
  async getDashboardData(dashboardId: string): Promise<DashboardData | null> {
    const config = this.dashboards.get(dashboardId);
    if (!config) {
      return null;
    }
    
    try {
      // Check cache first
      const cached = this.cachedData.get(dashboardId);
      const now = new Date();
      
      if (cached && (now.getTime() - cached.timestamp.getTime()) < (config.refreshInterval * 1000)) {
        return cached;
      }
      
      // Collect fresh metrics
      const metrics = await this.customMetricsService.collectHealthcareMetrics();
      
      // Generate alerts based on thresholds
      const alerts = this.generateAlerts(config, metrics);
      
      // Determine overall status
      const status = this.calculateDashboardStatus(alerts);
      
      // Process widgets data
      const widgets = this.processWidgetData(config.widgets, metrics);
      
      const dashboardData: DashboardData = {
        dashboardId,
        timestamp: now,
        metrics,
        alerts,
        status,
        widgets
      };
      
      // Cache the data
      this.cachedData.set(dashboardId, dashboardData);
      
      this.structuredLogger.info('Dashboard data generated', {
        operation: 'get_dashboard_data',
        dashboardId,
        alertCount: alerts.length,
        status
      });
      
      return dashboardData;
      
    } catch (error) {
      this.structuredLogger.error('Failed to generate dashboard data', {
        operation: 'get_dashboard_data',
        dashboardId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Generate alerts based on thresholds
   */
  private generateAlerts(config: DashboardConfig, metrics: HealthcareMetrics): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];
    
    if (!config.alertThresholds) {
      return alerts;
    }
    
    const thresholds = config.alertThresholds;
    
    // API Response Time Alert
    if (thresholds.apiResponseTime && metrics.systemHealth.apiResponseTime > thresholds.apiResponseTime) {
      alerts.push({
        id: `api_response_time_${Date.now()}`,
        type: 'warning',
        title: 'High API Response Time',
        message: `API response time (${metrics.systemHealth.apiResponseTime}ms) exceeds threshold (${thresholds.apiResponseTime}ms)`,
        timestamp: new Date(),
        acknowledged: false,
        source: 'system_health'
      });
    }
    
    // Memory Usage Alert
    if (thresholds.memoryUsage && metrics.systemHealth.memoryUsage > thresholds.memoryUsage) {
      alerts.push({
        id: `memory_usage_${Date.now()}`,
        type: 'critical',
        title: 'High Memory Usage',
        message: `Memory usage (${metrics.systemHealth.memoryUsage.toFixed(1)}MB) exceeds threshold`,
        timestamp: new Date(),
        acknowledged: false,
        source: 'system_health'
      });
    }
    
    // Client Retention Rate Alert
    if (thresholds.clientRetentionRate && metrics.business.clientRetentionRate < thresholds.clientRetentionRate) {
      alerts.push({
        id: `retention_rate_${Date.now()}`,
        type: 'warning',
        title: 'Low Client Retention Rate',
        message: `Client retention rate (${metrics.business.clientRetentionRate}%) is below target (${thresholds.clientRetentionRate}%)`,
        timestamp: new Date(),
        acknowledged: false,
        source: 'business_metrics'
      });
    }
    
    // HIPAA Audit Events Alert
    if (thresholds.hipaaAuditEvents && metrics.compliance.hipaaAuditEvents > thresholds.hipaaAuditEvents) {
      alerts.push({
        id: `hipaa_audit_${Date.now()}`,
        type: 'info',
        title: 'High HIPAA Audit Activity',
        message: `HIPAA audit events (${metrics.compliance.hipaaAuditEvents}) exceed normal threshold`,
        timestamp: new Date(),
        acknowledged: false,
        source: 'compliance'
      });
    }
    
    return alerts;
  }
  
  /**
   * Calculate overall dashboard status
   */
  private calculateDashboardStatus(alerts: DashboardAlert[]): 'healthy' | 'warning' | 'critical' {
    const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
    const warningAlerts = alerts.filter(alert => alert.type === 'warning');
    
    if (criticalAlerts.length > 0) {
      return 'critical';
    }
    
    if (warningAlerts.length > 0) {
      return 'warning';
    }
    
    return 'healthy';
  }
  
  /**
   * Process widget data based on widget configurations
   */
  private processWidgetData(widgets: DashboardWidget[], metrics: HealthcareMetrics): Record<string, any> {
    const widgetData: Record<string, any> = {};
    
    widgets.forEach(widget => {
      try {
        const data = this.extractWidgetData(widget.dataSource, metrics);
        widgetData[widget.id] = {
          ...data,
          configuration: widget.configuration,
          lastUpdated: new Date()
        };
      } catch (error) {
        this.logger.warn(`Failed to process widget data for ${widget.id}:`, error);
        widgetData[widget.id] = {
          error: 'Data unavailable',
          lastUpdated: new Date()
        };
      }
    });
    
    return widgetData;
  }
  
  /**
   * Extract data for a specific widget data source
   */
  private extractWidgetData(dataSource: string, metrics: HealthcareMetrics): any {
    const parts = dataSource.split('.');
    let data: any = metrics;
    
    for (const part of parts) {
      if (data && typeof data === 'object' && part in data) {
        data = data[part];
      } else {
        throw new Error(`Data source path not found: ${dataSource}`);
      }
    }
    
    return data;
  }
  
  /**
   * Create custom dashboard
   */
  async createCustomDashboard(config: DashboardConfig): Promise<void> {
    this.dashboards.set(config.dashboardId, config);
    
    this.structuredLogger.info('Custom dashboard created', {
      operation: 'create_custom_dashboard',
      dashboardId: config.dashboardId,
      widgetCount: config.widgets.length
    });
  }
  
  /**
   * Update dashboard configuration
   */
  async updateDashboardConfig(dashboardId: string, updates: Partial<DashboardConfig>): Promise<void> {
    const existing = this.dashboards.get(dashboardId);
    if (!existing) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }
    
    const updated = { ...existing, ...updates };
    this.dashboards.set(dashboardId, updated);
    
    // Clear cached data to force refresh
    this.cachedData.delete(dashboardId);
    
    this.structuredLogger.info('Dashboard configuration updated', {
      operation: 'update_dashboard_config',
      dashboardId,
      updates: Object.keys(updates)
    });
  }
  
  /**
   * Clear dashboard cache
   */
  clearDashboardCache(dashboardId?: string): void {
    if (dashboardId) {
      this.cachedData.delete(dashboardId);
    } else {
      this.cachedData.clear();
    }
    
    this.logger.log(`Dashboard cache cleared: ${dashboardId || 'all'}`);
  }
}