"use strict";
/**
 * AnalyticsService - Comprehensive analytics for coaching sessions and recordings
 * Provides insights, trends, performance metrics, and data visualization support
 */
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
let AnalyticsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AnalyticsService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(AnalyticsService.name);
        }
        /**
         * Get comprehensive session metrics
         */
        async getSessionMetrics(filters = {}) {
            try {
                // In a real implementation, query your database with filters
                const mockMetrics = {
                    totalSessions: 1247,
                    completedSessions: 1189,
                    cancelledSessions: 58,
                    averageDuration: 52.3, // minutes
                    totalDuration: 65234, // total minutes
                    averageRating: 4.7,
                    engagementScore: 8.2,
                };
                this.logger.log(`📊 Generated session metrics: ${mockMetrics.totalSessions} total sessions`);
                return mockMetrics;
            }
            catch (error) {
                this.logger.error('Failed to get session metrics:', error);
                throw new Error(`Session metrics failed: ${error.message}`);
            }
        }
        /**
         * Get recording and AI processing metrics
         */
        async getRecordingMetrics(filters = {}) {
            try {
                const mockMetrics = {
                    totalRecordings: 1189,
                    totalStorageUsed: 45.7 * 1024 * 1024 * 1024, // 45.7 GB
                    averageFileSize: 38.4 * 1024 * 1024, // 38.4 MB average
                    averageTranscriptionAccuracy: 96.3,
                    processingSuccessRate: 98.7,
                    totalProcessingTime: 2847, // minutes
                    costAnalysis: {
                        storage: 23.45,
                        transcription: 156.78,
                        aiProcessing: 234.67,
                        total: 414.90,
                    },
                };
                this.logger.log(`🎥 Generated recording metrics: ${mockMetrics.totalRecordings} recordings, ${(mockMetrics.totalStorageUsed / (1024 ** 3)).toFixed(1)}GB storage`);
                return mockMetrics;
            }
            catch (error) {
                this.logger.error('Failed to get recording metrics:', error);
                throw new Error(`Recording metrics failed: ${error.message}`);
            }
        }
        /**
         * Get detailed client progress analytics
         */
        async getClientProgressMetrics(clientId) {
            try {
                const mockMetrics = {
                    clientId,
                    clientName: 'John Smith',
                    totalSessions: 12,
                    progressTrend: 'improving',
                    goalCompletionRate: 78.5,
                    engagementLevel: 'high',
                    lastSessionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                    keyMetrics: {
                        moodProgression: [
                            { date: new Date('2024-01-01'), mood: 5, session: 'session_1' },
                            { date: new Date('2024-01-08'), mood: 6, session: 'session_2' },
                            { date: new Date('2024-01-15'), mood: 7, session: 'session_3' },
                            { date: new Date('2024-01-22'), mood: 8, session: 'session_4' },
                        ],
                        goalProgress: [
                            { goal: 'Reduce stress levels', progress: 85, target: new Date('2024-03-01') },
                            { goal: 'Improve work-life balance', progress: 70, target: new Date('2024-02-15') },
                            { goal: 'Build confidence', progress: 92, target: new Date('2024-02-01') },
                        ],
                        sessionRatings: [
                            { date: new Date('2024-01-01'), rating: 7, sessionId: 'session_1' },
                            { date: new Date('2024-01-08'), rating: 8, sessionId: 'session_2' },
                            { date: new Date('2024-01-15'), rating: 9, sessionId: 'session_3' },
                        ],
                        actionItemCompletion: [
                            { date: new Date('2024-01-01'), completed: 2, total: 3 },
                            { date: new Date('2024-01-08'), completed: 3, total: 4 },
                            { date: new Date('2024-01-15'), completed: 4, total: 4 },
                        ],
                    },
                    insights: {
                        strengths: ['High motivation', 'Consistent attendance', 'Strong self-reflection'],
                        challenges: ['Time management', 'Boundary setting'],
                        recommendations: ['Continue mindfulness practice', 'Focus on stress management techniques'],
                        riskFactors: ['High workload periods', 'Limited support system'],
                    },
                };
                this.logger.log(`👤 Generated client progress metrics for ${clientId}: ${mockMetrics.progressTrend} trend`);
                return mockMetrics;
            }
            catch (error) {
                this.logger.error(`Failed to get client progress metrics for ${clientId}:`, error);
                throw new Error(`Client progress metrics failed: ${error.message}`);
            }
        }
        /**
         * Get coach performance analytics
         */
        async getCoachPerformanceMetrics(coachId) {
            try {
                const mockMetrics = {
                    coachId,
                    coachName: 'Sarah Johnson',
                    totalClients: 24,
                    activeClients: 18,
                    totalSessions: 342,
                    averageSessionRating: 4.8,
                    clientRetentionRate: 89.3,
                    averageClientProgress: 76.4,
                    specialties: ['Stress Management', 'Career Coaching', 'Life Balance'],
                    performance: {
                        effectiveness: 8.7,
                        communication: 9.2,
                        goalAchievement: 8.1,
                        clientSatisfaction: 8.9,
                    },
                    trends: {
                        sessionVolume: [
                            { month: 'Jan', count: 28 },
                            { month: 'Feb', count: 32 },
                            { month: 'Mar', count: 35 },
                            { month: 'Apr', count: 31 },
                            { month: 'May', count: 38 },
                            { month: 'Jun', count: 42 },
                        ],
                        clientRatings: [
                            { month: 'Jan', rating: 4.6 },
                            { month: 'Feb', rating: 4.7 },
                            { month: 'Mar', rating: 4.8 },
                            { month: 'Apr', rating: 4.8 },
                            { month: 'May', rating: 4.9 },
                            { month: 'Jun', rating: 4.8 },
                        ],
                        goalCompletionRates: [
                            { month: 'Jan', rate: 72 },
                            { month: 'Feb', rate: 75 },
                            { month: 'Mar', rate: 78 },
                            { month: 'Apr', rate: 76 },
                            { month: 'May', rate: 81 },
                            { month: 'Jun', rate: 83 },
                        ],
                    },
                };
                this.logger.log(`👨‍💼 Generated coach performance metrics for ${coachId}: ${mockMetrics.averageSessionRating}/5 rating`);
                return mockMetrics;
            }
            catch (error) {
                this.logger.error(`Failed to get coach performance metrics for ${coachId}:`, error);
                throw new Error(`Coach performance metrics failed: ${error.message}`);
            }
        }
        /**
         * Get program analytics
         */
        async getProgramAnalytics(programId) {
            try {
                const mockPrograms = [
                    {
                        programId: 'life-balance-mastery',
                        programName: 'Life Balance Mastery',
                        totalEnrollments: 156,
                        activeEnrollments: 89,
                        completionRate: 78.5,
                        dropoutRate: 12.8,
                        averageCompletionTime: 67.3, // days
                        averageRating: 4.8,
                        revenueGenerated: 187200,
                        modulePerformance: [
                            {
                                moduleId: 'module_1',
                                moduleName: 'Foundation: Understanding Life Balance',
                                completionRate: 95.2,
                                averageTimeSpent: 85, // minutes
                                difficultyRating: 3.2,
                                engagementScore: 8.7,
                            },
                            {
                                moduleId: 'module_2',
                                moduleName: 'Time Management & Priorities',
                                completionRate: 89.1,
                                averageTimeSpent: 102,
                                difficultyRating: 4.1,
                                engagementScore: 8.3,
                            },
                        ],
                        outcomeMetrics: {
                            goalAchievementRate: 82.4,
                            clientSatisfactionScore: 4.7,
                            skillImprovementScore: 8.1,
                            lifeImpactScore: 8.5,
                        },
                    },
                    {
                        programId: 'stress-management',
                        programName: 'Stress & Resilience Building',
                        totalEnrollments: 234,
                        activeEnrollments: 142,
                        completionRate: 83.2,
                        dropoutRate: 8.9,
                        averageCompletionTime: 45.7,
                        averageRating: 4.7,
                        revenueGenerated: 140400,
                        modulePerformance: [
                            {
                                moduleId: 'stress_module_1',
                                moduleName: 'Understanding Stress',
                                completionRate: 97.1,
                                averageTimeSpent: 65,
                                difficultyRating: 2.8,
                                engagementScore: 8.9,
                            },
                        ],
                        outcomeMetrics: {
                            goalAchievementRate: 87.3,
                            clientSatisfactionScore: 4.6,
                            skillImprovementScore: 8.4,
                            lifeImpactScore: 8.7,
                        },
                    },
                ];
                const filteredPrograms = programId ? mockPrograms.filter(p => p.programId === programId) : mockPrograms;
                this.logger.log(`📚 Generated program analytics for ${filteredPrograms.length} programs`);
                return filteredPrograms;
            }
            catch (error) {
                this.logger.error('Failed to get program analytics:', error);
                throw new Error(`Program analytics failed: ${error.message}`);
            }
        }
        /**
         * Get business metrics and KPIs
         */
        async getBusinessMetrics(filters = {}) {
            try {
                const mockMetrics = {
                    revenue: {
                        total: 487650,
                        monthly: [
                            { month: 'Jan', amount: 67890 },
                            { month: 'Feb', amount: 72340 },
                            { month: 'Mar', amount: 81250 },
                            { month: 'Apr', amount: 78920 },
                            { month: 'May', amount: 89670 },
                            { month: 'Jun', amount: 97580 },
                        ],
                        byProgram: [
                            { program: 'Life Balance Mastery', amount: 187200 },
                            { program: 'Stress Management', amount: 140400 },
                            { program: 'Career Transition', amount: 160050 },
                        ],
                        byCoach: [
                            { coach: 'Sarah Johnson', amount: 123450 },
                            { coach: 'Mike Chen', amount: 98760 },
                            { coach: 'Emma Davis', amount: 87690 },
                        ],
                    },
                    growth: {
                        clientAcquisition: [
                            { month: 'Jan', newClients: 23, churnClients: 4 },
                            { month: 'Feb', newClients: 28, churnClients: 3 },
                            { month: 'Mar', newClients: 35, churnClients: 5 },
                            { month: 'Apr', newClients: 31, churnClients: 2 },
                            { month: 'May', newClients: 42, churnClients: 6 },
                            { month: 'Jun', newClients: 38, churnClients: 4 },
                        ],
                        sessionVolume: [
                            { month: 'Jan', sessions: 156 },
                            { month: 'Feb', sessions: 178 },
                            { month: 'Mar', sessions: 203 },
                            { month: 'Apr', sessions: 189 },
                            { month: 'May', sessions: 234 },
                            { month: 'Jun', sessions: 267 },
                        ],
                        revenueGrowth: [
                            { month: 'Jan', growth: 15.2 },
                            { month: 'Feb', growth: 6.6 },
                            { month: 'Mar', growth: 12.3 },
                            { month: 'Apr', growth: -2.9 },
                            { month: 'May', growth: 13.6 },
                            { month: 'Jun', growth: 8.8 },
                        ],
                    },
                    retention: {
                        clientRetentionRate: 87.3,
                        averageClientLifetime: 8.4, // months
                        churnRate: 12.7,
                        reasonsForChurn: [
                            { reason: 'Achieved goals', percentage: 35.2 },
                            { reason: 'Financial constraints', percentage: 23.1 },
                            { reason: 'Time constraints', percentage: 18.7 },
                            { reason: 'Lack of engagement', percentage: 12.4 },
                            { reason: 'Other', percentage: 10.6 },
                        ],
                    },
                    efficiency: {
                        averageSessionCost: 28.50,
                        clientAcquisitionCost: 145.00,
                        lifetimeValue: 1847.00,
                        profitabilityPerCoach: [
                            { coach: 'Sarah Johnson', profit: 67890 },
                            { coach: 'Mike Chen', profit: 54320 },
                            { coach: 'Emma Davis', profit: 48760 },
                        ],
                    },
                };
                this.logger.log(`💰 Generated business metrics: $${mockMetrics.revenue.total.toLocaleString()} total revenue`);
                return mockMetrics;
            }
            catch (error) {
                this.logger.error('Failed to get business metrics:', error);
                throw new Error(`Business metrics failed: ${error.message}`);
            }
        }
        /**
         * Generate comprehensive insights dashboard
         */
        async getInsightsDashboard(filters = {}) {
            try {
                const dashboard = {
                    overview: {
                        totalClients: 187,
                        activeClients: 142,
                        totalSessions: 1247,
                        totalRecordings: 1189,
                        averageClientProgress: 76.4,
                        clientSatisfactionScore: 4.7,
                    },
                    trends: {
                        clientGrowth: [
                            { month: 'Jan', clients: 134 },
                            { month: 'Feb', clients: 141 },
                            { month: 'Mar', clients: 156 },
                            { month: 'Apr', clients: 168 },
                            { month: 'May', clients: 178 },
                            { month: 'Jun', clients: 187 },
                        ],
                        sessionVolume: [
                            { month: 'Jan', sessions: 156 },
                            { month: 'Feb', sessions: 178 },
                            { month: 'Mar', sessions: 203 },
                            { month: 'Apr', sessions: 189 },
                            { month: 'May', sessions: 234 },
                            { month: 'Jun', sessions: 267 },
                        ],
                        engagementScores: [
                            { month: 'Jan', score: 7.8 },
                            { month: 'Feb', score: 8.1 },
                            { month: 'Mar', score: 8.3 },
                            { month: 'Apr', score: 8.0 },
                            { month: 'May', score: 8.5 },
                            { month: 'Jun', score: 8.7 },
                        ],
                        goalCompletionRates: [
                            { month: 'Jan', rate: 72.4 },
                            { month: 'Feb', rate: 75.1 },
                            { month: 'Mar', rate: 78.3 },
                            { month: 'Apr', rate: 76.8 },
                            { month: 'May', rate: 81.2 },
                            { month: 'Jun', rate: 83.7 },
                        ],
                    },
                    topInsights: [
                        {
                            type: 'success',
                            title: 'Strong Client Retention',
                            description: 'Client retention rate has improved to 87.3%, exceeding industry average of 75%',
                            impact: 'high',
                            trend: 'up',
                            metric: 87.3,
                            actionItems: [
                                'Continue current retention strategies',
                                'Share best practices across all coaches',
                                'Consider expanding successful programs',
                            ],
                        },
                        {
                            type: 'opportunity',
                            title: 'Growing Demand for Stress Management',
                            description: 'Stress management program has 234 enrollments, highest engagement scores',
                            impact: 'high',
                            trend: 'up',
                            metric: 8.9,
                            actionItems: [
                                'Develop advanced stress management modules',
                                'Train more coaches in stress management techniques',
                                'Create group coaching options',
                            ],
                        },
                        {
                            type: 'warning',
                            title: 'AI Processing Costs Rising',
                            description: 'AI processing costs increased 23% this month due to higher usage',
                            impact: 'medium',
                            trend: 'up',
                            metric: 23,
                            actionItems: [
                                'Optimize AI prompts for efficiency',
                                'Implement cost monitoring alerts',
                                'Review pricing tiers for AI features',
                            ],
                        },
                    ],
                    recommendations: [
                        {
                            category: 'growth',
                            priority: 'high',
                            title: 'Expand Stress Management Offerings',
                            description: 'High demand and excellent outcomes suggest opportunity for expansion',
                            expectedImpact: '25% increase in program revenue',
                            timeline: '2-3 months',
                            resources: ['Additional coach training', 'Content development', 'Marketing campaign'],
                        },
                        {
                            category: 'efficiency',
                            priority: 'medium',
                            title: 'Optimize AI Usage',
                            description: 'Implement cost-effective AI processing strategies',
                            expectedImpact: '15% reduction in AI costs',
                            timeline: '1 month',
                            resources: ['Development time', 'Prompt optimization', 'Usage monitoring'],
                        },
                        {
                            category: 'quality',
                            priority: 'high',
                            title: 'Enhance Coach Training',
                            description: 'Top-performing coaches show specific patterns worth replicating',
                            expectedImpact: '10% improvement in client outcomes',
                            timeline: '6 weeks',
                            resources: ['Training materials', 'Mentorship program', 'Performance tracking'],
                        },
                    ],
                };
                this.logger.log(`📈 Generated insights dashboard with ${dashboard.topInsights.length} key insights`);
                return dashboard;
            }
            catch (error) {
                this.logger.error('Failed to generate insights dashboard:', error);
                throw new Error(`Insights dashboard failed: ${error.message}`);
            }
        }
        /**
         * Generate comparative analysis report
         */
        async generateComparativeAnalysis(comparisonType, entities, metrics) {
            try {
                // Mock comparative analysis
                const analysis = {
                    comparisonType,
                    entities,
                    metrics,
                    results: entities.map(entity => ({
                        entity,
                        metrics: metrics.reduce((acc, metric) => {
                            acc[metric] = Math.random() * 100;
                            return acc;
                        }, {}),
                    })),
                    insights: [
                        'Top performer shows 23% higher client satisfaction',
                        'Program completion rates vary significantly by delivery method',
                        'Peak performance months align with reduced external stressors',
                    ],
                    recommendations: [
                        'Implement best practices from top performers',
                        'Standardize high-impact delivery methods',
                        'Adjust scheduling for optimal client availability',
                    ],
                    generatedAt: new Date(),
                };
                this.logger.log(`🔍 Generated comparative analysis: ${comparisonType} for ${entities.length} entities`);
                return analysis;
            }
            catch (error) {
                this.logger.error('Failed to generate comparative analysis:', error);
                throw new Error(`Comparative analysis failed: ${error.message}`);
            }
        }
        /**
         * Export analytics data
         */
        async exportAnalyticsData(exportType, format, filters = {}) {
            try {
                // Mock export generation
                const fileName = `${exportType}_analytics_${Date.now()}.${format}`;
                const mockExport = {
                    downloadUrl: `/exports/${fileName}`,
                    fileName,
                    fileSize: Math.floor(Math.random() * 1000000) + 100000, // Random size between 100KB-1MB
                    generatedAt: new Date(),
                };
                this.logger.log(`📊 Generated ${exportType} analytics export: ${fileName}`);
                return mockExport;
            }
            catch (error) {
                this.logger.error('Failed to export analytics data:', error);
                throw new Error(`Analytics export failed: ${error.message}`);
            }
        }
    };
    __setFunctionName(_classThis, "AnalyticsService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AnalyticsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AnalyticsService = _classThis;
})();
exports.AnalyticsService = AnalyticsService;
