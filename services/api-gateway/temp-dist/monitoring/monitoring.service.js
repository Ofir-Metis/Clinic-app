"use strict";
/**
 * MonitoringService - Advanced system monitoring and alerting implementation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let MonitoringService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MonitoringService = _classThis = class {
        constructor(httpService) {
            this.httpService = httpService;
            this.logger = new common_1.Logger(MonitoringService.name);
        }
        /**
         * Get comprehensive monitoring overview
         */
        async getMonitoringOverview() {
            try {
                // In production, this would aggregate data from various monitoring sources
                const mockOverview = {
                    systemStatus: 'healthy',
                    totalServices: 12,
                    healthyServices: 11,
                    activeAlerts: 3,
                    criticalAlerts: 0,
                    averageResponseTime: 145, // ms
                    errorRate: 0.02, // 2%
                    throughput: 1247, // requests/minute
                    uptime: 99.95, // percentage
                    lastUpdate: new Date()
                };
                this.logger.log('Monitoring overview retrieved');
                return mockOverview;
            }
            catch (error) {
                this.logger.error('Failed to get monitoring overview:', error);
                throw new common_1.HttpException('Failed to retrieve monitoring overview', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Query metrics with time series data
         */
        async queryMetrics(query) {
            try {
                const { metric, startTime, endTime, interval = '5m', aggregation = 'avg' } = query;
                // Generate mock time series data
                const start = new Date(startTime);
                const end = new Date(endTime);
                const intervalMs = this.parseInterval(interval);
                const dataPoints = [];
                let current = start;
                while (current <= end) {
                    // Generate realistic mock data based on metric type
                    let value = this.generateMockMetricValue(metric, current);
                    dataPoints.push({
                        timestamp: new Date(current),
                        value,
                        tags: { service: 'api-gateway', environment: 'production' }
                    });
                    current = new Date(current.getTime() + intervalMs);
                }
                const series = {
                    metric,
                    dataPoints,
                    aggregation,
                    unit: this.getMetricUnit(metric)
                };
                return series;
            }
            catch (error) {
                this.logger.error('Failed to query metrics:', error);
                throw new common_1.HttpException('Failed to query metrics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        parseInterval(interval) {
            const match = interval.match(/^(\d+)([smhd])$/);
            if (!match)
                return 300000; // default 5 minutes
            const value = parseInt(match[1]);
            const unit = match[2];
            switch (unit) {
                case 's': return value * 1000;
                case 'm': return value * 60 * 1000;
                case 'h': return value * 60 * 60 * 1000;
                case 'd': return value * 24 * 60 * 60 * 1000;
                default: return 300000;
            }
        }
        generateMockMetricValue(metric, timestamp) {
            const baseValue = Date.now() % 1000;
            switch (metric) {
                case 'cpu_usage':
                    return 20 + Math.sin(timestamp.getTime() / 300000) * 10 + Math.random() * 5;
                case 'memory_usage':
                    return 60 + Math.sin(timestamp.getTime() / 600000) * 15 + Math.random() * 8;
                case 'response_time':
                    return 100 + Math.sin(timestamp.getTime() / 180000) * 30 + Math.random() * 20;
                case 'error_rate':
                    return Math.max(0, 2 + Math.sin(timestamp.getTime() / 450000) * 1.5 + Math.random() * 1);
                case 'requests_per_second':
                    return 50 + Math.sin(timestamp.getTime() / 240000) * 20 + Math.random() * 10;
                default:
                    return Math.random() * 100;
            }
        }
        getMetricUnit(metric) {
            switch (metric) {
                case 'cpu_usage':
                case 'memory_usage':
                case 'error_rate':
                    return 'percent';
                case 'response_time':
                    return 'milliseconds';
                case 'requests_per_second':
                    return 'requests/sec';
                case 'disk_usage':
                    return 'bytes';
                default:
                    return 'count';
            }
        }
        /**
         * Get real-time system status
         */
        async getRealtimeStatus() {
            try {
                // In production, collect from actual system monitoring agents
                const mockStatus = {
                    cpu: {
                        usage: 23.4,
                        load: [1.2, 1.5, 1.8],
                        cores: 8
                    },
                    memory: {
                        used: 6442450944, // ~6GB
                        total: 16106127360, // ~16GB
                        percentage: 40.0
                    },
                    disk: {
                        used: 2199023255552, // ~2TB
                        total: 5497558138880, // ~5TB
                        percentage: 40.0,
                        iops: 1500
                    },
                    network: {
                        bytesIn: 1073741824, // 1GB
                        bytesOut: 2147483648, // 2GB
                        packetsIn: 1000000,
                        packetsOut: 900000
                    },
                    database: {
                        connections: 45,
                        maxConnections: 100,
                        queryTime: 12.5,
                        lockTime: 0.8
                    },
                    services: [
                        {
                            name: 'api-gateway',
                            status: 'up',
                            responseTime: 145,
                            errorRate: 0.02,
                            lastCheck: new Date()
                        },
                        {
                            name: 'auth-service',
                            status: 'up',
                            responseTime: 89,
                            errorRate: 0.01,
                            lastCheck: new Date()
                        },
                        {
                            name: 'notifications-service',
                            status: 'degraded',
                            responseTime: 892,
                            errorRate: 0.15,
                            lastCheck: new Date()
                        }
                    ]
                };
                return mockStatus;
            }
            catch (error) {
                this.logger.error('Failed to get realtime status:', error);
                throw new common_1.HttpException('Failed to retrieve realtime status', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get alert rules
         */
        async getAlertRules() {
            try {
                // Mock alert rules
                const mockRules = [
                    {
                        id: 'rule_001',
                        name: 'High CPU Usage',
                        description: 'Alert when CPU usage exceeds 80%',
                        metric: 'cpu_usage',
                        condition: 'gt',
                        threshold: 80,
                        duration: 300, // 5 minutes
                        severity: 'high',
                        enabled: true,
                        channels: ['email', 'slack'],
                        tags: { team: 'platform', service: 'infrastructure' }
                    },
                    {
                        id: 'rule_002',
                        name: 'High Error Rate',
                        description: 'Alert when error rate exceeds 5%',
                        metric: 'error_rate',
                        condition: 'gt',
                        threshold: 5,
                        duration: 180, // 3 minutes
                        severity: 'critical',
                        enabled: true,
                        channels: ['email', 'slack', 'sms'],
                        tags: { team: 'backend', service: 'api' }
                    },
                    {
                        id: 'rule_003',
                        name: 'Low Disk Space',
                        description: 'Alert when disk usage exceeds 90%',
                        metric: 'disk_usage',
                        condition: 'gt',
                        threshold: 90,
                        duration: 600, // 10 minutes
                        severity: 'medium',
                        enabled: true,
                        channels: ['email'],
                        tags: { team: 'platform', service: 'storage' }
                    }
                ];
                return mockRules;
            }
            catch (error) {
                this.logger.error('Failed to get alert rules:', error);
                throw new common_1.HttpException('Failed to retrieve alert rules', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Create alert rule
         */
        async createAlertRule(rule, adminUserId) {
            try {
                const ruleId = `rule_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
                const createdRule = {
                    id: ruleId,
                    ...rule,
                    createdBy: adminUserId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                this.logger.log(`Alert rule ${ruleId} created by admin ${adminUserId}`);
                return createdRule;
            }
            catch (error) {
                this.logger.error('Failed to create alert rule:', error);
                throw new common_1.HttpException('Failed to create alert rule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Update alert rule
         */
        async updateAlertRule(ruleId, rule, adminUserId) {
            try {
                const updatedRule = {
                    id: ruleId,
                    ...rule,
                    updatedBy: adminUserId,
                    updatedAt: new Date()
                };
                this.logger.log(`Alert rule ${ruleId} updated by admin ${adminUserId}`);
                return updatedRule;
            }
            catch (error) {
                this.logger.error('Failed to update alert rule:', error);
                throw new common_1.HttpException('Failed to update alert rule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Delete alert rule
         */
        async deleteAlertRule(ruleId, adminUserId) {
            try {
                this.logger.log(`Alert rule ${ruleId} deleted by admin ${adminUserId}`);
            }
            catch (error) {
                this.logger.error('Failed to delete alert rule:', error);
                throw new common_1.HttpException('Failed to delete alert rule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get active alerts
         */
        async getActiveAlerts(filters) {
            try {
                // Mock active alerts
                const mockAlerts = [
                    {
                        id: 'alert_001',
                        ruleId: 'rule_002',
                        ruleName: 'High Error Rate',
                        severity: 'critical',
                        status: 'firing',
                        message: 'Error rate is 7.2% (threshold: 5%)',
                        description: 'The error rate for the API gateway has exceeded the threshold',
                        startedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
                        value: 7.2,
                        threshold: 5,
                        tags: { service: 'api-gateway', environment: 'production' },
                        annotations: { runbook: 'https://wiki.company.com/runbooks/high-error-rate' }
                    },
                    {
                        id: 'alert_002',
                        ruleId: 'rule_003',
                        ruleName: 'Low Disk Space',
                        severity: 'medium',
                        status: 'acknowledged',
                        message: 'Disk usage is 92% (threshold: 90%)',
                        description: 'Disk space is running low on the primary database server',
                        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                        acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                        acknowledgedBy: 'admin_001',
                        value: 92,
                        threshold: 90,
                        tags: { service: 'database', environment: 'production' },
                        annotations: { note: 'Investigating log cleanup options' }
                    }
                ];
                // Apply filters
                let filteredAlerts = mockAlerts;
                if (filters.severity) {
                    filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
                }
                return filteredAlerts.slice(0, filters.limit || 100);
            }
            catch (error) {
                this.logger.error('Failed to get active alerts:', error);
                throw new common_1.HttpException('Failed to retrieve active alerts', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Acknowledge alert
         */
        async acknowledgeAlert(alertId, adminUserId, notes) {
            try {
                this.logger.log(`Alert ${alertId} acknowledged by admin ${adminUserId}`);
                if (notes) {
                    this.logger.log(`Acknowledgment notes: ${notes}`);
                }
            }
            catch (error) {
                this.logger.error('Failed to acknowledge alert:', error);
                throw new common_1.HttpException('Failed to acknowledge alert', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Resolve alert
         */
        async resolveAlert(alertId, adminUserId, resolution) {
            try {
                this.logger.log(`Alert ${alertId} resolved by admin ${adminUserId}: ${resolution}`);
            }
            catch (error) {
                this.logger.error('Failed to resolve alert:', error);
                throw new common_1.HttpException('Failed to resolve alert', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get dashboards
         */
        async getDashboards(userId) {
            try {
                // Mock dashboards
                const mockDashboards = [
                    {
                        id: 'dash_001',
                        name: 'System Overview',
                        description: 'High-level system health and performance metrics',
                        layout: 'grid',
                        refreshInterval: 30, // seconds
                        shared: true,
                        createdBy: 'admin_001',
                        widgets: [
                            {
                                id: 'widget_001',
                                type: 'stat',
                                title: 'CPU Usage',
                                position: { x: 0, y: 0, width: 6, height: 3 },
                                config: {
                                    metric: 'cpu_usage',
                                    timeRange: '1h',
                                    thresholds: [
                                        { value: 70, color: 'yellow' },
                                        { value: 85, color: 'red' }
                                    ]
                                }
                            }
                        ]
                    }
                ];
                return mockDashboards;
            }
            catch (error) {
                this.logger.error('Failed to get dashboards:', error);
                throw new common_1.HttpException('Failed to retrieve dashboards', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Create dashboard
         */
        async createDashboard(dashboard, adminUserId) {
            try {
                const dashboardId = `dash_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
                const createdDashboard = {
                    id: dashboardId,
                    ...dashboard,
                    createdBy: adminUserId,
                    createdAt: new Date()
                };
                this.logger.log(`Dashboard ${dashboardId} created by admin ${adminUserId}`);
                return createdDashboard;
            }
            catch (error) {
                this.logger.error('Failed to create dashboard:', error);
                throw new common_1.HttpException('Failed to create dashboard', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get specific dashboard
         */
        async getDashboard(dashboardId) {
            try {
                // Mock dashboard data
                const mockDashboard = {
                    id: dashboardId,
                    name: 'System Overview',
                    description: 'High-level system health and performance metrics',
                    layout: 'grid',
                    refreshInterval: 30,
                    shared: true,
                    createdBy: 'admin_001',
                    widgets: []
                };
                return mockDashboard;
            }
            catch (error) {
                this.logger.error(`Failed to get dashboard ${dashboardId}:`, error);
                throw new common_1.HttpException('Failed to retrieve dashboard', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get performance summary
         */
        async getPerformanceSummary(timeRange) {
            try {
                const mockSummary = {
                    timeRange,
                    overview: {
                        averageResponseTime: 145,
                        p95ResponseTime: 890,
                        p99ResponseTime: 2100,
                        errorRate: 2.1,
                        requestsPerSecond: 127.5,
                        availability: 99.95
                    },
                    trends: {
                        responseTimeChange: -5.2, // 5.2% improvement
                        errorRateChange: 1.8, // 1.8% increase
                        throughputChange: 12.4 // 12.4% increase
                    },
                    topEndpoints: [
                        {
                            endpoint: '/api/appointments',
                            requestCount: 45678,
                            averageResponseTime: 89,
                            errorRate: 0.5
                        },
                        {
                            endpoint: '/api/users/profile',
                            requestCount: 32145,
                            averageResponseTime: 156,
                            errorRate: 1.2
                        }
                    ],
                    errorAnalysis: {
                        topErrors: [
                            {
                                error: '500 Internal Server Error',
                                count: 234,
                                percentage: 45.2
                            },
                            {
                                error: '404 Not Found',
                                count: 178,
                                percentage: 34.4
                            }
                        ],
                        errorsByService: {
                            'api-gateway': 156,
                            'auth-service': 89,
                            'appointments-service': 167
                        }
                    }
                };
                return mockSummary;
            }
            catch (error) {
                this.logger.error('Failed to get performance summary:', error);
                throw new common_1.HttpException('Failed to retrieve performance summary', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get system bottlenecks
         */
        async getBottlenecks() {
            try {
                const mockBottlenecks = [
                    {
                        id: 'bottleneck_001',
                        type: 'database',
                        severity: 'medium',
                        component: 'PostgreSQL Connection Pool',
                        description: 'Database connection pool is approaching capacity',
                        impact: 'Potential query queueing and increased response times',
                        recommendation: 'Consider increasing max_connections or optimizing long-running queries',
                        detectedAt: new Date(Date.now() - 30 * 60 * 1000),
                        metrics: {
                            currentConnections: 85,
                            maxConnections: 100,
                            utilizationPercentage: 85
                        }
                    },
                    {
                        id: 'bottleneck_002',
                        type: 'application',
                        severity: 'low',
                        component: 'API Gateway Rate Limiting',
                        description: 'Rate limiting is rejecting 3% of requests',
                        impact: 'Some client requests are being throttled',
                        recommendation: 'Review rate limiting policies or scale API gateway instances',
                        detectedAt: new Date(Date.now() - 15 * 60 * 1000),
                        metrics: {
                            requestsPerSecond: 150,
                            rateLimitThreshold: 100,
                            rejectionRate: 3.2
                        }
                    }
                ];
                return mockBottlenecks;
            }
            catch (error) {
                this.logger.error('Failed to get bottlenecks:', error);
                throw new common_1.HttpException('Failed to retrieve bottlenecks', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get service health status
         */
        async getServiceHealth() {
            try {
                const mockHealth = {
                    overall: 'healthy',
                    services: [
                        {
                            name: 'api-gateway',
                            status: 'healthy',
                            uptime: '7d 14h 32m',
                            responseTime: 145,
                            lastCheck: new Date(),
                            healthChecks: {
                                database: 'pass',
                                redis: 'pass',
                                external_apis: 'pass'
                            }
                        },
                        {
                            name: 'auth-service',
                            status: 'healthy',
                            uptime: '7d 14h 28m',
                            responseTime: 89,
                            lastCheck: new Date(),
                            healthChecks: {
                                database: 'pass',
                                jwt_validation: 'pass'
                            }
                        },
                        {
                            name: 'notifications-service',
                            status: 'degraded',
                            uptime: '2d 8h 15m',
                            responseTime: 892,
                            lastCheck: new Date(),
                            healthChecks: {
                                email_provider: 'fail',
                                sms_provider: 'pass',
                                queue: 'pass'
                            }
                        }
                    ]
                };
                return mockHealth;
            }
            catch (error) {
                this.logger.error('Failed to get service health:', error);
                throw new common_1.HttpException('Failed to retrieve service health', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Run health check for specific service
         */
        async runHealthCheck(serviceName) {
            try {
                // In production, trigger actual health check
                const mockResult = {
                    service: serviceName,
                    timestamp: new Date(),
                    status: 'healthy',
                    responseTime: Math.floor(Math.random() * 200) + 50,
                    checks: {
                        connectivity: 'pass',
                        dependencies: 'pass',
                        resources: 'pass'
                    },
                    details: {
                        version: '1.2.3',
                        environment: 'production',
                        region: 'us-east-1'
                    }
                };
                this.logger.log(`Health check completed for ${serviceName}`);
                return mockResult;
            }
            catch (error) {
                this.logger.error(`Failed to run health check for ${serviceName}:`, error);
                throw new common_1.HttpException('Failed to run health check', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Search logs
         */
        async searchLogs(searchRequest) {
            try {
                const { query, timeRange, services, level, limit = 100 } = searchRequest;
                // Mock log search results
                const mockLogs = {
                    total: 1247,
                    logs: [
                        {
                            timestamp: new Date(),
                            level: 'error',
                            service: 'api-gateway',
                            message: 'Database connection timeout',
                            fields: {
                                userId: 'user_123',
                                endpoint: '/api/appointments',
                                duration: 5000
                            }
                        },
                        {
                            timestamp: new Date(Date.now() - 60000),
                            level: 'warn',
                            service: 'auth-service',
                            message: 'Rate limit exceeded for IP 192.168.1.100',
                            fields: {
                                ip: '192.168.1.100',
                                endpoint: '/api/auth/login',
                                attempts: 15
                            }
                        }
                    ],
                    aggregations: {
                        byLevel: {
                            error: 45,
                            warn: 123,
                            info: 890,
                            debug: 189
                        },
                        byService: {
                            'api-gateway': 567,
                            'auth-service': 234,
                            'notifications-service': 445
                        }
                    }
                };
                return mockLogs;
            }
            catch (error) {
                this.logger.error('Failed to search logs:', error);
                throw new common_1.HttpException('Failed to search logs', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get log patterns analysis
         */
        async getLogPatterns(timeRange) {
            try {
                const mockPatterns = {
                    timeRange,
                    patterns: [
                        {
                            pattern: 'Database connection timeout',
                            occurrences: 45,
                            trend: 'increasing',
                            firstSeen: new Date(Date.now() - 24 * 60 * 60 * 1000),
                            lastSeen: new Date(),
                            services: ['api-gateway', 'appointments-service']
                        },
                        {
                            pattern: 'Rate limit exceeded',
                            occurrences: 89,
                            trend: 'stable',
                            firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                            lastSeen: new Date(Date.now() - 5 * 60 * 1000),
                            services: ['api-gateway']
                        }
                    ],
                    anomalies: [
                        {
                            description: 'Unusual spike in 500 errors',
                            severity: 'high',
                            detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                            affectedServices: ['notifications-service']
                        }
                    ]
                };
                return mockPatterns;
            }
            catch (error) {
                this.logger.error('Failed to get log patterns:', error);
                throw new common_1.HttpException('Failed to retrieve log patterns', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "MonitoringService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MonitoringService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MonitoringService = _classThis;
})();
exports.MonitoringService = MonitoringService;
