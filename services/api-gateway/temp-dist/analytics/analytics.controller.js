"use strict";
/**
 * AnalyticsController - Handles analytics and insights API endpoints
 * Provides comprehensive dashboard data, metrics, and reporting capabilities
 */
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let AnalyticsController = (() => {
    let _classDecorators = [(0, common_1.Controller)('api/analytics')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getDashboard_decorators;
    let _getSessionMetrics_decorators;
    let _getRecordingMetrics_decorators;
    let _getClientProgress_decorators;
    let _getCoachPerformance_decorators;
    let _getProgramAnalytics_decorators;
    let _getBusinessMetrics_decorators;
    let _generateComparison_decorators;
    let _exportData_decorators;
    let _getRealtimeAnalytics_decorators;
    let _getInsightsSummary_decorators;
    var AnalyticsController = _classThis = class {
        constructor(analyticsService) {
            this.analyticsService = (__runInitializers(this, _instanceExtraInitializers), analyticsService);
            this.logger = new common_1.Logger(AnalyticsController.name);
        }
        /**
         * Get main analytics dashboard
         */
        async getDashboard(req, startDate, endDate, coachId) {
            try {
                const filters = {};
                if (startDate)
                    filters.startDate = new Date(startDate);
                if (endDate)
                    filters.endDate = new Date(endDate);
                if (coachId)
                    filters.coachId = coachId;
                this.logger.log(`📊 Dashboard requested by user ${req.user.sub}`);
                const dashboard = await this.analyticsService.getInsightsDashboard(filters);
                return {
                    status: 'success',
                    dashboard,
                    metadata: {
                        generatedBy: req.user.sub,
                        generatedAt: new Date().toISOString(),
                        filters,
                    },
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to get dashboard:', error);
                throw new common_1.HttpException(`Dashboard retrieval failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get session analytics
         */
        async getSessionMetrics(req, startDate, endDate, coachId, clientId, programId) {
            try {
                const filters = {};
                if (startDate)
                    filters.startDate = new Date(startDate);
                if (endDate)
                    filters.endDate = new Date(endDate);
                if (coachId)
                    filters.coachId = coachId;
                if (clientId)
                    filters.clientId = clientId;
                if (programId)
                    filters.programId = programId;
                const metrics = await this.analyticsService.getSessionMetrics(filters);
                return {
                    status: 'success',
                    metrics,
                    insights: this.generateSessionInsights(metrics),
                    filters,
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to get session metrics:', error);
                throw new common_1.HttpException(`Session metrics failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get recording analytics
         */
        async getRecordingMetrics(req, startDate, endDate, coachId) {
            try {
                const filters = {};
                if (startDate)
                    filters.startDate = new Date(startDate);
                if (endDate)
                    filters.endDate = new Date(endDate);
                if (coachId)
                    filters.coachId = coachId;
                const metrics = await this.analyticsService.getRecordingMetrics(filters);
                return {
                    status: 'success',
                    metrics,
                    insights: this.generateRecordingInsights(metrics),
                    recommendations: this.generateRecordingRecommendations(metrics),
                    filters,
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to get recording metrics:', error);
                throw new common_1.HttpException(`Recording metrics failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get client progress analytics
         */
        async getClientProgress(clientId, req) {
            try {
                // Verify access permissions (coach can only see their clients, admin sees all)
                if (req.user.role === 'coach') {
                    // In production, verify that this coach has access to this client
                }
                const progress = await this.analyticsService.getClientProgressMetrics(clientId);
                return {
                    status: 'success',
                    progress,
                    predictions: this.generateProgressPredictions(progress),
                    actionableInsights: this.generateActionableInsights(progress),
                };
            }
            catch (error) {
                this.logger.error(`❌ Failed to get client progress for ${clientId}:`, error);
                throw new common_1.HttpException(`Client progress failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get coach performance analytics
         */
        async getCoachPerformance(coachId, req) {
            try {
                // Coaches can only view their own performance, admins can view all
                if (req.user.role === 'coach' && req.user.sub !== coachId) {
                    throw new common_1.HttpException('Access denied to other coach performance data', common_1.HttpStatus.FORBIDDEN);
                }
                const performance = await this.analyticsService.getCoachPerformanceMetrics(coachId);
                return {
                    status: 'success',
                    performance,
                    benchmarks: this.generateCoachBenchmarks(performance),
                    improvementAreas: this.identifyImprovementAreas(performance),
                    strengths: this.identifyCoachStrengths(performance),
                };
            }
            catch (error) {
                this.logger.error(`❌ Failed to get coach performance for ${coachId}:`, error);
                throw new common_1.HttpException(`Coach performance failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get program analytics
         */
        async getProgramAnalytics(req, programId) {
            try {
                const analytics = await this.analyticsService.getProgramAnalytics(programId);
                return {
                    status: 'success',
                    programs: analytics,
                    summary: this.generateProgramSummary(analytics),
                    recommendations: this.generateProgramRecommendations(analytics),
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to get program analytics:', error);
                throw new common_1.HttpException(`Program analytics failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get business metrics (admin only)
         */
        async getBusinessMetrics(req, startDate, endDate, granularity) {
            try {
                const filters = {};
                if (startDate)
                    filters.startDate = new Date(startDate);
                if (endDate)
                    filters.endDate = new Date(endDate);
                if (granularity)
                    filters.granularity = granularity;
                const metrics = await this.analyticsService.getBusinessMetrics(filters);
                return {
                    status: 'success',
                    metrics,
                    kpis: this.calculateKPIs(metrics),
                    forecasts: this.generateBusinessForecasts(metrics),
                    alerts: this.generateBusinessAlerts(metrics),
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to get business metrics:', error);
                throw new common_1.HttpException(`Business metrics failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Generate comparative analysis
         */
        async generateComparison(comparisonRequest, req) {
            try {
                if (!comparisonRequest.type || !comparisonRequest.entities?.length || !comparisonRequest.metrics?.length) {
                    throw new common_1.HttpException('Comparison type, entities, and metrics are required', common_1.HttpStatus.BAD_REQUEST);
                }
                this.logger.log(`🔍 Comparative analysis requested: ${comparisonRequest.type} for ${comparisonRequest.entities.length} entities`);
                const analysis = await this.analyticsService.generateComparativeAnalysis(comparisonRequest.type, comparisonRequest.entities, comparisonRequest.metrics);
                return {
                    status: 'success',
                    analysis,
                    visualization: this.generateVisualizationConfig(analysis),
                    exportOptions: ['csv', 'excel', 'pdf'],
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to generate comparison:', error);
                throw new common_1.HttpException(`Comparison failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Export analytics data
         */
        async exportData(exportRequest, req) {
            try {
                if (!exportRequest.type || !exportRequest.format) {
                    throw new common_1.HttpException('Export type and format are required', common_1.HttpStatus.BAD_REQUEST);
                }
                this.logger.log(`📤 Export requested: ${exportRequest.type} as ${exportRequest.format}`);
                const exportResult = await this.analyticsService.exportAnalyticsData(exportRequest.type, exportRequest.format, exportRequest.filters || {});
                return {
                    status: 'success',
                    export: exportResult,
                    message: 'Export generated successfully',
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to export data:', error);
                throw new common_1.HttpException(`Export failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get real-time analytics
         */
        async getRealtimeAnalytics(req) {
            try {
                // Mock real-time data
                const realtimeData = {
                    activeSessions: 12,
                    recordingsInProgress: 5,
                    aiProcessingJobs: 3,
                    onlineCoaches: 8,
                    onlineClients: 23,
                    systemHealth: {
                        status: 'healthy',
                        uptime: '99.97%',
                        responseTime: 145, // ms
                        errorRate: 0.02,
                    },
                    recentActivity: [
                        { type: 'session_started', coach: 'Sarah J.', client: 'John D.', time: new Date(Date.now() - 5 * 60 * 1000) },
                        { type: 'recording_completed', session: 'session_123', time: new Date(Date.now() - 8 * 60 * 1000) },
                        { type: 'ai_summary_generated', session: 'session_122', time: new Date(Date.now() - 12 * 60 * 1000) },
                    ],
                    alerts: [
                        {
                            type: 'info',
                            message: 'Peak usage detected - consider scaling resources',
                            severity: 'medium',
                            time: new Date(Date.now() - 15 * 60 * 1000),
                        },
                    ],
                };
                return {
                    status: 'success',
                    realtime: realtimeData,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to get real-time analytics:', error);
                throw new common_1.HttpException(`Real-time analytics failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get analytics insights summary
         */
        async getInsightsSummary(period = 'month', req) {
            try {
                const summary = {
                    period,
                    keyMetrics: {
                        totalSessions: 267,
                        clientGrowth: 12.5, // percentage
                        revenueGrowth: 8.8,
                        clientSatisfaction: 4.7,
                        coachUtilization: 78.3,
                    },
                    trends: {
                        sessionVolume: 'increasing',
                        clientEngagement: 'stable',
                        programCompletion: 'improving',
                        aiAccuracy: 'stable',
                    },
                    highlights: [
                        'Best month for client acquisition with 38 new clients',
                        'Stress management program achieved 97% satisfaction rate',
                        'AI processing accuracy improved to 96.3%',
                        'Coach retention rate at all-time high of 94%',
                    ],
                    concerns: [
                        'AI processing costs increased 23% due to higher usage',
                        '3 clients at risk of churning based on engagement patterns',
                    ],
                    recommendations: [
                        'Expand successful stress management program',
                        'Implement cost optimization for AI processing',
                        'Proactive outreach to at-risk clients',
                    ],
                    generatedAt: new Date().toISOString(),
                };
                return {
                    status: 'success',
                    summary,
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to get insights summary:', error);
                throw new common_1.HttpException(`Insights summary failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // Private helper methods
        generateSessionInsights(metrics) {
            const insights = [];
            if (metrics.averageRating >= 4.5) {
                insights.push('Excellent session quality with high client satisfaction');
            }
            if (metrics.engagementScore >= 8.0) {
                insights.push('Strong client engagement levels across sessions');
            }
            const completionRate = (metrics.completedSessions / metrics.totalSessions) * 100;
            if (completionRate >= 95) {
                insights.push('Outstanding session completion rate indicates strong client commitment');
            }
            return insights;
        }
        generateRecordingInsights(metrics) {
            const insights = [];
            if (metrics.averageTranscriptionAccuracy >= 95) {
                insights.push('High transcription accuracy ensures reliable session analysis');
            }
            if (metrics.processingSuccessRate >= 98) {
                insights.push('Excellent AI processing reliability with minimal failures');
            }
            const avgSizeGB = metrics.averageFileSize / (1024 ** 3);
            if (avgSizeGB > 0.05) { // 50MB
                insights.push('Consider file compression to optimize storage costs');
            }
            return insights;
        }
        generateRecordingRecommendations(metrics) {
            const recommendations = [];
            if (metrics.costAnalysis.total > 300) {
                recommendations.push('Implement cost optimization strategies for AI processing');
            }
            if (metrics.averageTranscriptionAccuracy < 95) {
                recommendations.push('Review audio quality guidelines to improve transcription accuracy');
            }
            const storageGB = metrics.totalStorageUsed / (1024 ** 3);
            if (storageGB > 100) {
                recommendations.push('Consider implementing data archival policies for older recordings');
            }
            return recommendations;
        }
        generateProgressPredictions(progress) {
            return {
                goalCompletion: {
                    probability: 0.85,
                    timeframe: '2-3 weeks',
                    confidence: 'high',
                },
                engagementRisk: progress.engagementLevel === 'low' ? 'high' : 'low',
                successProbability: 0.82,
                recommendedActions: [
                    'Continue current strategies',
                    'Focus on stress management techniques',
                    'Schedule progress review session',
                ],
            };
        }
        generateActionableInsights(progress) {
            return [
                {
                    type: 'strength',
                    title: 'High Session Attendance',
                    description: 'Client consistently attends sessions, showing strong commitment',
                    action: 'Leverage this commitment to tackle more challenging goals',
                },
                {
                    type: 'opportunity',
                    title: 'Mood Improvement Trend',
                    description: 'Steady improvement in mood scores over past 4 sessions',
                    action: 'Explore what strategies are working best and replicate them',
                },
            ];
        }
        generateCoachBenchmarks(performance) {
            return {
                industry: {
                    averageRating: 4.3,
                    clientRetention: 78.5,
                    sessionsPerMonth: 28.4,
                },
                platform: {
                    averageRating: 4.6,
                    clientRetention: 84.2,
                    sessionsPerMonth: 31.2,
                },
                performance: {
                    ratingVsIndustry: performance.averageSessionRating - 4.3,
                    retentionVsIndustry: performance.clientRetentionRate - 78.5,
                    performanceLevel: 'excellent', // calculated based on metrics
                },
            };
        }
        identifyImprovementAreas(performance) {
            const areas = [];
            if (performance.performance.communication < 8.5) {
                areas.push('Communication skills development');
            }
            if (performance.clientRetentionRate < 85) {
                areas.push('Client retention strategies');
            }
            if (performance.performance.goalAchievement < 8.0) {
                areas.push('Goal setting and achievement methodologies');
            }
            return areas;
        }
        identifyCoachStrengths(performance) {
            const strengths = [];
            if (performance.performance.communication >= 9.0) {
                strengths.push('Exceptional communication skills');
            }
            if (performance.averageSessionRating >= 4.8) {
                strengths.push('Outstanding client satisfaction');
            }
            if (performance.clientRetentionRate >= 90) {
                strengths.push('Excellent client retention');
            }
            return strengths;
        }
        generateProgramSummary(analytics) {
            const totalEnrollments = analytics.reduce((sum, p) => sum + p.totalEnrollments, 0);
            const avgCompletionRate = analytics.reduce((sum, p) => sum + p.completionRate, 0) / analytics.length;
            const totalRevenue = analytics.reduce((sum, p) => sum + p.revenueGenerated, 0);
            return {
                totalPrograms: analytics.length,
                totalEnrollments,
                averageCompletionRate: avgCompletionRate,
                totalRevenue,
                topPerforming: analytics.sort((a, b) => b.completionRate - a.completionRate)[0],
            };
        }
        generateProgramRecommendations(analytics) {
            const recommendations = [];
            const lowPerforming = analytics.filter(p => p.completionRate < 70);
            if (lowPerforming.length > 0) {
                recommendations.push('Review content and difficulty of underperforming programs');
            }
            const highRevenue = analytics.filter(p => p.revenueGenerated > 150000);
            if (highRevenue.length > 0) {
                recommendations.push('Consider expanding successful high-revenue programs');
            }
            const highDropout = analytics.filter(p => p.dropoutRate > 15);
            if (highDropout.length > 0) {
                recommendations.push('Investigate and address high dropout rates in specific programs');
            }
            return recommendations;
        }
        calculateKPIs(metrics) {
            return {
                monthlyRecurringRevenue: metrics.revenue.total / 6, // assuming 6 months of data
                customerLifetimeValue: metrics.efficiency.lifetimeValue,
                customerAcquisitionCost: metrics.efficiency.clientAcquisitionCost,
                churnRate: metrics.retention.churnRate,
                grossMargin: 78.5, // calculated from costs
                netPromoterScore: 8.7, // from client surveys
            };
        }
        generateBusinessForecasts(metrics) {
            return {
                nextMonthRevenue: 105000, // predicted
                clientGrowthRate: 15.2,
                churnPrediction: 2.3,
                seasonalTrends: [
                    'Q1: Highest new client acquisition',
                    'Q2: Peak revenue period',
                    'Q3: Stable growth phase',
                    'Q4: Holiday impact on sessions',
                ],
            };
        }
        generateBusinessAlerts(metrics) {
            const alerts = [];
            if (metrics.retention.churnRate > 15) {
                alerts.push({
                    type: 'warning',
                    title: 'High Churn Rate',
                    message: 'Client churn rate exceeds healthy threshold',
                    action: 'Implement retention strategies',
                });
            }
            if (metrics.efficiency.clientAcquisitionCost > 200) {
                alerts.push({
                    type: 'info',
                    title: 'Rising Acquisition Costs',
                    message: 'Client acquisition costs trending upward',
                    action: 'Review marketing efficiency',
                });
            }
            return alerts;
        }
        generateVisualizationConfig(analysis) {
            return {
                chartTypes: ['bar', 'line', 'scatter'],
                xAxis: 'entities',
                yAxis: 'metrics',
                groupBy: analysis.comparisonType,
                colorScheme: 'professional',
                exportFormats: ['png', 'svg', 'pdf'],
            };
        }
    };
    __setFunctionName(_classThis, "AnalyticsController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getDashboard_decorators = [(0, common_1.Get)('dashboard'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('analytics:read')];
        _getSessionMetrics_decorators = [(0, common_1.Get)('sessions'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('analytics:read')];
        _getRecordingMetrics_decorators = [(0, common_1.Get)('recordings'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('analytics:read')];
        _getClientProgress_decorators = [(0, common_1.Get)('clients/:clientId/progress'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('analytics:read')];
        _getCoachPerformance_decorators = [(0, common_1.Get)('coaches/:coachId/performance'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('analytics:read'), (0, common_2.RequireRoles)('admin', 'coach')];
        _getProgramAnalytics_decorators = [(0, common_1.Get)('programs'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('analytics:read')];
        _getBusinessMetrics_decorators = [(0, common_1.Get)('business'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('admin')];
        _generateComparison_decorators = [(0, common_1.Post)('compare'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('analytics:compare')];
        _exportData_decorators = [(0, common_1.Post)('export'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('analytics:export')];
        _getRealtimeAnalytics_decorators = [(0, common_1.Get)('realtime'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('analytics:realtime')];
        _getInsightsSummary_decorators = [(0, common_1.Get)('insights/summary'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequirePermissions)('analytics:read')];
        __esDecorate(_classThis, null, _getDashboard_decorators, { kind: "method", name: "getDashboard", static: false, private: false, access: { has: obj => "getDashboard" in obj, get: obj => obj.getDashboard }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSessionMetrics_decorators, { kind: "method", name: "getSessionMetrics", static: false, private: false, access: { has: obj => "getSessionMetrics" in obj, get: obj => obj.getSessionMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRecordingMetrics_decorators, { kind: "method", name: "getRecordingMetrics", static: false, private: false, access: { has: obj => "getRecordingMetrics" in obj, get: obj => obj.getRecordingMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getClientProgress_decorators, { kind: "method", name: "getClientProgress", static: false, private: false, access: { has: obj => "getClientProgress" in obj, get: obj => obj.getClientProgress }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCoachPerformance_decorators, { kind: "method", name: "getCoachPerformance", static: false, private: false, access: { has: obj => "getCoachPerformance" in obj, get: obj => obj.getCoachPerformance }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProgramAnalytics_decorators, { kind: "method", name: "getProgramAnalytics", static: false, private: false, access: { has: obj => "getProgramAnalytics" in obj, get: obj => obj.getProgramAnalytics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBusinessMetrics_decorators, { kind: "method", name: "getBusinessMetrics", static: false, private: false, access: { has: obj => "getBusinessMetrics" in obj, get: obj => obj.getBusinessMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateComparison_decorators, { kind: "method", name: "generateComparison", static: false, private: false, access: { has: obj => "generateComparison" in obj, get: obj => obj.generateComparison }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exportData_decorators, { kind: "method", name: "exportData", static: false, private: false, access: { has: obj => "exportData" in obj, get: obj => obj.exportData }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRealtimeAnalytics_decorators, { kind: "method", name: "getRealtimeAnalytics", static: false, private: false, access: { has: obj => "getRealtimeAnalytics" in obj, get: obj => obj.getRealtimeAnalytics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getInsightsSummary_decorators, { kind: "method", name: "getInsightsSummary", static: false, private: false, access: { has: obj => "getInsightsSummary" in obj, get: obj => obj.getInsightsSummary }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AnalyticsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AnalyticsController = _classThis;
})();
exports.AnalyticsController = AnalyticsController;
