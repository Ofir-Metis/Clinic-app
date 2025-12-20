"use strict";
/**
 * PerformanceService - Business logic for performance optimization and monitoring
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
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
let PerformanceService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PerformanceService = _classThis = class {
        constructor() {
            this.logger = new common_1.Logger(PerformanceService.name);
            // Mock data stores (in production, these would be database operations)
            this.performanceData = new Map();
            this.cacheConfigurations = new Map();
            this.loadBalancers = new Map();
            this.profilingSessions = new Map();
            this.loadTestSessions = new Map();
            this.performanceAlerts = new Map();
            this.initializeMockData();
        }
        initializeMockData() {
            // Mock cache configurations
            const mockCaches = [
                {
                    id: 'cache_redis_1',
                    name: 'Primary Redis Cache',
                    type: 'redis',
                    enabled: true,
                    configuration: {
                        maxSize: '2GB',
                        ttl: 3600,
                        evictionPolicy: 'allkeys-lru',
                        compressionEnabled: true,
                        persistenceEnabled: true,
                    },
                    metrics: {
                        hitRate: 89.5,
                        missRate: 10.5,
                        evictionRate: 2.1,
                        currentSize: '1.7GB',
                        requestCount: 2456890,
                        averageGetTime: 0.8,
                        averageSetTime: 1.2,
                    },
                    keyPatterns: [
                        { pattern: 'user:*', hitRate: 92.3, count: 125000, avgTtl: 3600 },
                        { pattern: 'session:*', hitRate: 95.7, count: 85000, avgTtl: 1800 },
                        { pattern: 'appointment:*', hitRate: 87.2, count: 45000, avgTtl: 7200 },
                    ],
                },
                {
                    id: 'cache_memory_1',
                    name: 'Application Memory Cache',
                    type: 'memory',
                    enabled: true,
                    configuration: {
                        maxSize: '512MB',
                        ttl: 300,
                        evictionPolicy: 'lru',
                        compressionEnabled: false,
                        persistenceEnabled: false,
                    },
                    metrics: {
                        hitRate: 76.8,
                        missRate: 23.2,
                        evictionRate: 8.5,
                        currentSize: '487MB',
                        requestCount: 856432,
                        averageGetTime: 0.2,
                        averageSetTime: 0.3,
                    },
                    keyPatterns: [
                        { pattern: 'config:*', hitRate: 98.5, count: 5000, avgTtl: 1800 },
                        { pattern: 'temp:*', hitRate: 45.2, count: 25000, avgTtl: 60 },
                    ],
                },
            ];
            mockCaches.forEach(cache => this.cacheConfigurations.set(cache.id, cache));
            // Mock load balancers
            const mockLoadBalancers = [
                {
                    id: 'lb_api_gateway',
                    name: 'API Gateway Load Balancer',
                    algorithm: 'least_connections',
                    enabled: true,
                    upstreams: [
                        {
                            id: 'upstream_1',
                            url: 'http://api-gateway-1:4000',
                            weight: 1,
                            status: 'healthy',
                            responseTime: 45,
                            activeConnections: 125,
                            totalRequests: 2456789,
                            successRate: 99.98,
                        },
                        {
                            id: 'upstream_2',
                            url: 'http://api-gateway-2:4000',
                            weight: 1,
                            status: 'healthy',
                            responseTime: 52,
                            activeConnections: 118,
                            totalRequests: 2398456,
                            successRate: 99.97,
                        },
                        {
                            id: 'upstream_3',
                            url: 'http://api-gateway-3:4000',
                            weight: 1,
                            status: 'maintenance',
                            responseTime: 0,
                            activeConnections: 0,
                            totalRequests: 0,
                            successRate: 0,
                        },
                    ],
                    healthCheck: {
                        enabled: true,
                        interval: 30,
                        timeout: 5,
                        healthyThreshold: 2,
                        unhealthyThreshold: 3,
                        path: '/health',
                    },
                    metrics: {
                        totalRequests: 4855245,
                        successfulRequests: 4848673,
                        failedRequests: 6572,
                        avgResponseTime: 48.5,
                        throughput: 2500,
                    },
                },
            ];
            mockLoadBalancers.forEach(lb => this.loadBalancers.set(lb.id, lb));
            // Mock performance alerts
            const mockAlerts = [
                {
                    id: 'alert_1',
                    name: 'High Response Time',
                    metric: 'response_time',
                    condition: 'greater_than',
                    threshold: 1000,
                    currentValue: 1250,
                    severity: 'high',
                    status: 'active',
                    triggeredAt: new Date(Date.now() - 15 * 60 * 1000),
                    service: 'api-gateway',
                },
                {
                    id: 'alert_2',
                    name: 'Cache Hit Rate Low',
                    metric: 'cache_hit_rate',
                    condition: 'less_than',
                    threshold: 80,
                    currentValue: 76.8,
                    severity: 'medium',
                    status: 'active',
                    triggeredAt: new Date(Date.now() - 45 * 60 * 1000),
                    service: 'memory-cache',
                },
            ];
            mockAlerts.forEach(alert => this.performanceAlerts.set(alert.id, alert));
        }
        async getPerformanceDashboard() {
            return {
                overview: {
                    avgResponseTime: 125.5,
                    throughput: 2500,
                    errorRate: 0.02,
                    apdex: 0.95,
                    uptime: 99.98,
                },
                realTimeMetrics: {
                    currentRps: 2500,
                    activeConnections: 245,
                    cpuUsage: 45.8,
                    memoryUsage: 68.2,
                    diskIO: 125.5,
                    networkIO: 856.2,
                },
                slowQueries: [
                    {
                        id: 'query_1',
                        query: 'SELECT * FROM appointments WHERE date >= ? AND coach_id = ?',
                        duration: 2450,
                        executionCount: 125,
                        avgDuration: 1200,
                        service: 'appointments-service',
                        timestamp: new Date(Date.now() - 10 * 60 * 1000),
                    },
                    {
                        id: 'query_2',
                        query: 'SELECT u.*, p.* FROM users u JOIN patient_profiles p ON u.id = p.user_id',
                        duration: 1850,
                        executionCount: 89,
                        avgDuration: 950,
                        service: 'auth-service',
                        timestamp: new Date(Date.now() - 25 * 60 * 1000),
                    },
                ],
                cacheMetrics: {
                    hitRate: 89.5,
                    missRate: 10.5,
                    evictionRate: 2.1,
                    size: 1.7,
                    maxSize: 2.0,
                    totalRequests: 2456890,
                },
                recommendations: [
                    {
                        id: 'rec_1',
                        type: 'database',
                        priority: 'high',
                        title: 'Add Index for Appointment Queries',
                        description: 'Create composite index on (date, coach_id) for appointments table',
                        impact: 'Reduce query time by 60-80%',
                        effort: 'Low (5 minutes)',
                        estimatedImprovement: '1.5s → 0.3s avg query time',
                    },
                    {
                        id: 'rec_2',
                        type: 'cache',
                        priority: 'medium',
                        title: 'Increase Memory Cache Size',
                        description: 'Application memory cache is near capacity and showing high eviction rate',
                        impact: 'Improve cache hit rate by 15-20%',
                        effort: 'Medium (configuration change + restart)',
                        estimatedImprovement: '76% → 90% hit rate',
                    },
                    {
                        id: 'rec_3',
                        type: 'code',
                        priority: 'medium',
                        title: 'Optimize User Profile Joins',
                        description: 'Implement selective field loading for user profile queries',
                        impact: 'Reduce memory usage and query time',
                        effort: 'High (code refactoring)',
                        estimatedImprovement: '30% faster user queries',
                    },
                ],
            };
        }
        async getRealTimeMetrics() {
            return {
                timestamp: new Date(),
                cpu: {
                    usage: Math.random() * 20 + 40, // 40-60%
                    cores: 8,
                    loadAverage: [1.2, 1.5, 1.8],
                },
                memory: {
                    usage: Math.random() * 10 + 65, // 65-75%
                    total: '16GB',
                    available: '4.2GB',
                    heapUsage: Math.random() * 10 + 45, // 45-55%
                },
                network: {
                    inbound: Math.random() * 200 + 800, // 800-1000 MB/s
                    outbound: Math.random() * 150 + 600, // 600-750 MB/s
                    connections: Math.random() * 50 + 200, // 200-250
                },
                disk: {
                    readIOPS: Math.random() * 100 + 150, // 150-250
                    writeIOPS: Math.random() * 50 + 75, // 75-125
                    utilization: Math.random() * 10 + 15, // 15-25%
                },
                application: {
                    requestsPerSecond: Math.random() * 500 + 2000, // 2000-2500
                    activeRequests: Math.random() * 20 + 10, // 10-30
                    queuedRequests: Math.random() * 5, // 0-5
                    responseTime: Math.random() * 50 + 100, // 100-150ms
                },
            };
        }
        async getDatabaseOptimization() {
            return {
                connectionPools: [
                    {
                        service: 'api-gateway',
                        poolSize: 20,
                        activeConnections: 15,
                        idleConnections: 5,
                        waitingConnections: 2,
                        maxWaitTime: 150,
                        avgConnectionTime: 45,
                    },
                    {
                        service: 'auth-service',
                        poolSize: 15,
                        activeConnections: 8,
                        idleConnections: 7,
                        waitingConnections: 0,
                        maxWaitTime: 0,
                        avgConnectionTime: 32,
                    },
                    {
                        service: 'appointments-service',
                        poolSize: 25,
                        activeConnections: 22,
                        idleConnections: 3,
                        waitingConnections: 5,
                        maxWaitTime: 280,
                        avgConnectionTime: 67,
                    },
                ],
                queryPerformance: [
                    {
                        id: 'query_1',
                        query: 'SELECT * FROM appointments WHERE date >= ? AND coach_id = ?',
                        table: 'appointments',
                        avgDuration: 1200,
                        executionCount: 1250,
                        totalDuration: 1500000,
                        slowestExecution: 2450,
                        indexUsage: false,
                        optimizationSuggestions: [
                            'Add composite index on (date, coach_id)',
                            'Consider partitioning by date',
                            'Use LIMIT clause if not all results needed',
                        ],
                    },
                    {
                        id: 'query_2',
                        query: 'SELECT u.*, p.* FROM users u JOIN patient_profiles p ON u.id = p.user_id',
                        table: 'users',
                        avgDuration: 950,
                        executionCount: 890,
                        totalDuration: 845500,
                        slowestExecution: 1850,
                        indexUsage: true,
                        optimizationSuggestions: [
                            'Select only required fields instead of *',
                            'Consider denormalizing frequently accessed data',
                            'Add covering index for common field combinations',
                        ],
                    },
                ],
                indexAnalysis: [
                    {
                        table: 'appointments',
                        index: 'idx_coach_id',
                        usage: 85,
                        size: '2.5MB',
                        effectiveness: 'high',
                        recommendation: 'Keep - frequently used',
                    },
                    {
                        table: 'appointments',
                        index: 'idx_patient_id_status',
                        usage: 12,
                        size: '1.8MB',
                        effectiveness: 'low',
                        recommendation: 'Consider dropping - rarely used',
                    },
                    {
                        table: 'users',
                        index: 'idx_email_verified',
                        usage: 0,
                        size: '850KB',
                        effectiveness: 'unused',
                        recommendation: 'Drop - not used in 90 days',
                    },
                ],
                transactionMetrics: {
                    avgTransactionTime: 45.5,
                    deadlockCount: 2,
                    lockWaitTime: 125.5,
                    rollbackRate: 0.08,
                },
            };
        }
        async getCacheConfigurations() {
            return Array.from(this.cacheConfigurations.values());
        }
        async updateCacheConfiguration(cacheId, configuration, userId) {
            const cache = this.cacheConfigurations.get(cacheId);
            if (!cache) {
                throw new Error('Cache configuration not found');
            }
            cache.configuration = { ...cache.configuration, ...configuration };
            cache.updatedAt = new Date();
            cache.updatedBy = userId;
            this.cacheConfigurations.set(cacheId, cache);
            return cache;
        }
        async flushCache(cacheId, flushRequest, userId) {
            const cache = this.cacheConfigurations.get(cacheId);
            if (!cache) {
                throw new Error('Cache not found');
            }
            // Mock cache flush operation
            const result = {
                cacheId,
                flushed: flushRequest.selective ? 'selective' : 'all',
                pattern: flushRequest.pattern || 'all',
                keysAffected: flushRequest.selective ? Math.floor(Math.random() * 10000) : cache.metrics.requestCount,
                timestamp: new Date(),
                initiatedBy: userId,
                reason: flushRequest.reason,
            };
            // Reset cache metrics after flush
            if (!flushRequest.selective) {
                cache.metrics.requestCount = 0;
                cache.metrics.currentSize = '0B';
            }
            return result;
        }
        async warmUpCache(cacheId, warmUpRequest, userId) {
            const cache = this.cacheConfigurations.get(cacheId);
            if (!cache) {
                throw new Error('Cache not found');
            }
            // Mock cache warm-up operation
            const sessionId = `warmup_${Date.now()}`;
            const warmUpSession = {
                sessionId,
                cacheId,
                keyPatterns: warmUpRequest.keyPatterns,
                priority: warmUpRequest.priority,
                batchSize: warmUpRequest.batchSize,
                status: 'running',
                progress: 0,
                estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                startedAt: new Date(),
                initiatedBy: userId,
            };
            // Simulate warm-up progress
            setTimeout(() => {
                warmUpSession.status = 'completed';
                warmUpSession.progress = 100;
            }, 5000);
            return warmUpSession;
        }
        async getLoadBalancers() {
            return Array.from(this.loadBalancers.values());
        }
        async updateLoadBalancingAlgorithm(balancerId, algorithmRequest, userId) {
            const loadBalancer = this.loadBalancers.get(balancerId);
            if (!loadBalancer) {
                throw new Error('Load balancer not found');
            }
            loadBalancer.algorithm = algorithmRequest.algorithm;
            loadBalancer.updatedAt = new Date();
            loadBalancer.updatedBy = userId;
            this.loadBalancers.set(balancerId, loadBalancer);
            return loadBalancer;
        }
        async addUpstream(balancerId, upstreamRequest, userId) {
            const loadBalancer = this.loadBalancers.get(balancerId);
            if (!loadBalancer) {
                throw new Error('Load balancer not found');
            }
            const upstream = {
                id: `upstream_${Date.now()}`,
                url: upstreamRequest.url,
                weight: upstreamRequest.weight,
                status: 'healthy',
                responseTime: 0,
                activeConnections: 0,
                totalRequests: 0,
                successRate: 0,
                addedAt: new Date(),
                addedBy: userId,
            };
            loadBalancer.upstreams.push(upstream);
            this.loadBalancers.set(balancerId, loadBalancer);
            return upstream;
        }
        async removeUpstream(balancerId, upstreamId, userId) {
            const loadBalancer = this.loadBalancers.get(balancerId);
            if (!loadBalancer) {
                throw new Error('Load balancer not found');
            }
            loadBalancer.upstreams = loadBalancer.upstreams.filter(upstream => upstream.id !== upstreamId);
            this.loadBalancers.set(balancerId, loadBalancer);
        }
        async optimizeQuery(optimizeRequest, userId) {
            // Mock query optimization
            const optimization = {
                queryId: optimizeRequest.queryId,
                type: optimizeRequest.optimizationType,
                status: 'in_progress',
                estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
                actions: [],
                initiatedBy: userId,
                startedAt: new Date(),
            };
            switch (optimizeRequest.optimizationType) {
                case 'index':
                    optimization.actions.push('Creating composite index on (date, coach_id)');
                    optimization.actions.push('Analyzing index usage patterns');
                    break;
                case 'rewrite':
                    optimization.actions.push('Rewriting query to use selective field loading');
                    optimization.actions.push('Adding appropriate WHERE clauses');
                    break;
                case 'cache':
                    optimization.actions.push('Implementing query result caching');
                    optimization.actions.push('Setting up cache invalidation strategy');
                    break;
                case 'partition':
                    optimization.actions.push('Creating date-based table partitions');
                    optimization.actions.push('Migrating existing data to partitions');
                    break;
            }
            return optimization;
        }
        async adjustConnectionPool(adjustRequest, userId) {
            // Mock connection pool adjustment
            const adjustment = {
                service: adjustRequest.service,
                previousConfiguration: {
                    minConnections: 5,
                    maxConnections: 20,
                    connectionTimeout: 30000,
                    idleTimeout: 600000,
                },
                newConfiguration: {
                    minConnections: adjustRequest.minConnections,
                    maxConnections: adjustRequest.maxConnections,
                    connectionTimeout: adjustRequest.connectionTimeout,
                    idleTimeout: adjustRequest.idleTimeout,
                },
                status: 'applied',
                appliedAt: new Date(),
                appliedBy: userId,
            };
            return adjustment;
        }
        async getCpuProfiling(duration, service) {
            // Mock CPU profiling data
            return {
                duration,
                service: service || 'all',
                samplingRate: 100,
                totalSamples: Math.floor(duration * 100),
                hotSpots: [
                    {
                        function: 'getUserProfile',
                        file: 'src/users/users.service.ts',
                        line: 125,
                        cpuTime: 25.5,
                        samples: 2550,
                        percentage: 25.5,
                    },
                    {
                        function: 'validateAppointment',
                        file: 'src/appointments/appointments.service.ts',
                        line: 89,
                        cpuTime: 18.2,
                        samples: 1820,
                        percentage: 18.2,
                    },
                    {
                        function: 'encryptData',
                        file: 'src/common/crypto.service.ts',
                        line: 45,
                        cpuTime: 12.8,
                        samples: 1280,
                        percentage: 12.8,
                    },
                ],
                callGraph: [
                    {
                        caller: 'main',
                        callee: 'getUserProfile',
                        calls: 1250,
                        totalTime: 2550,
                    },
                    {
                        caller: 'getUserProfile',
                        callee: 'encryptData',
                        calls: 1250,
                        totalTime: 1280,
                    },
                ],
                recommendations: [
                    'Consider caching user profile data to reduce database queries',
                    'Optimize encryption algorithm or use hardware acceleration',
                    'Implement connection pooling for database operations',
                ],
            };
        }
        async getMemoryProfiling(service) {
            // Mock memory profiling data
            return {
                service: service || 'all',
                heapSize: '512MB',
                usedMemory: '387MB',
                freeMemory: '125MB',
                memoryLeaks: [
                    {
                        location: 'src/cache/memory-cache.service.ts:67',
                        type: 'growing array',
                        size: '25MB',
                        growthRate: '2MB/hour',
                        severity: 'medium',
                    },
                ],
                memoryUsageByType: [
                    { type: 'objects', size: '245MB', percentage: 63.3 },
                    { type: 'strings', size: '89MB', percentage: 23.0 },
                    { type: 'arrays', size: '35MB', percentage: 9.0 },
                    { type: 'functions', size: '18MB', percentage: 4.7 },
                ],
                largestObjects: [
                    {
                        type: 'Map',
                        size: '45MB',
                        location: 'src/cache/memory-cache.service.ts',
                        retainedSize: '45MB',
                    },
                    {
                        type: 'Array',
                        size: '28MB',
                        location: 'src/appointments/appointments.service.ts',
                        retainedSize: '28MB',
                    },
                ],
                gcMetrics: {
                    collections: 125,
                    totalGcTime: '2.5s',
                    avgGcTime: '20ms',
                    maxGcTime: '150ms',
                },
                recommendations: [
                    'Fix memory leak in memory-cache service',
                    'Implement object pooling for frequently created objects',
                    'Consider using WeakMap for cache implementations',
                ],
            };
        }
        async startProfiling(profilingRequest, userId) {
            const sessionId = `profile_${Date.now()}`;
            const session = {
                sessionId,
                type: profilingRequest.type,
                duration: profilingRequest.duration,
                service: profilingRequest.service || 'all',
                samplingRate: profilingRequest.samplingRate || 100,
                status: 'running',
                startedAt: new Date(),
                estimatedCompletion: new Date(Date.now() + profilingRequest.duration * 1000),
                initiatedBy: userId,
            };
            this.profilingSessions.set(sessionId, session);
            // Simulate profiling completion
            setTimeout(() => {
                session.status = 'completed';
                session.completedAt = new Date();
            }, Math.min(profilingRequest.duration * 1000, 10000)); // Max 10 seconds for demo
            return session;
        }
        async runLoadTest(loadTestRequest, userId) {
            const testId = `loadtest_${Date.now()}`;
            const testSession = {
                testId,
                name: loadTestRequest.name,
                target: loadTestRequest.target,
                duration: loadTestRequest.duration,
                concurrency: loadTestRequest.concurrency,
                requestPattern: loadTestRequest.requestPattern,
                thresholds: loadTestRequest.thresholds,
                status: 'running',
                startedAt: new Date(),
                estimatedCompletion: new Date(Date.now() + loadTestRequest.duration * 1000),
                initiatedBy: userId,
                progress: 0,
            };
            this.loadTestSessions.set(testId, testSession);
            // Simulate test progress
            const progressInterval = setInterval(() => {
                testSession.progress += 10;
                if (testSession.progress >= 100) {
                    clearInterval(progressInterval);
                    testSession.status = 'completed';
                    testSession.completedAt = new Date();
                }
            }, loadTestRequest.duration * 100); // Update every 10% of duration
            return testSession;
        }
        async getLoadTestResults(testId) {
            const session = this.loadTestSessions.get(testId);
            if (!session) {
                throw new Error('Load test session not found');
            }
            // Mock load test results
            return {
                testId,
                session,
                results: {
                    summary: {
                        totalRequests: 125000,
                        successfulRequests: 124756,
                        failedRequests: 244,
                        avgResponseTime: 145.5,
                        medianResponseTime: 120,
                        p95ResponseTime: 280,
                        p99ResponseTime: 450,
                        throughput: 2083.33,
                        errorRate: 0.195,
                    },
                    responseTimeDistribution: [
                        { range: '0-50ms', count: 25000, percentage: 20 },
                        { range: '50-100ms', count: 37500, percentage: 30 },
                        { range: '100-200ms', count: 50000, percentage: 40 },
                        { range: '200-500ms', count: 12000, percentage: 9.6 },
                        { range: '500ms+', count: 500, percentage: 0.4 },
                    ],
                    errorBreakdown: [
                        { type: 'timeout', count: 150, percentage: 61.5 },
                        { type: 'connection_refused', count: 55, percentage: 22.5 },
                        { type: 'server_error', count: 39, percentage: 16.0 },
                    ],
                    thresholdResults: {
                        responseTime: {
                            threshold: session?.thresholds?.responseTime || 200,
                            actual: 145.5,
                            passed: true,
                        },
                        errorRate: {
                            threshold: session?.thresholds?.errorRate || 1,
                            actual: 0.195,
                            passed: true,
                        },
                        throughput: {
                            threshold: session?.thresholds?.throughput || 2000,
                            actual: 2083.33,
                            passed: true,
                        },
                    },
                },
            };
        }
        async getPerformanceAlerts() {
            return Array.from(this.performanceAlerts.values()).map(alert => ({
                ...alert,
                duration: alert.status === 'active' ? Date.now() - alert.triggeredAt.getTime() : null,
            }));
        }
        async createPerformanceThreshold(thresholdRequest, userId) {
            const threshold = {
                id: `threshold_${Date.now()}`,
                ...thresholdRequest,
                enabled: true,
                createdAt: new Date(),
                createdBy: userId,
                lastTriggered: null,
                triggerCount: 0,
            };
            return threshold;
        }
        async getPerformanceSummary(period, service) {
            // Mock performance summary
            return {
                period,
                service: service || 'all',
                metrics: {
                    availability: 99.98,
                    avgResponseTime: 125.5,
                    throughput: 2500,
                    errorRate: 0.02,
                    apdex: 0.95,
                },
                trends: {
                    responseTime: {
                        current: 125.5,
                        previous: 135.8,
                        change: -7.6,
                        trend: 'improving',
                    },
                    throughput: {
                        current: 2500,
                        previous: 2350,
                        change: 6.4,
                        trend: 'improving',
                    },
                    errorRate: {
                        current: 0.02,
                        previous: 0.03,
                        change: -33.3,
                        trend: 'improving',
                    },
                },
                topIssues: [
                    {
                        issue: 'Slow database queries',
                        impact: 'high',
                        frequency: 125,
                        avgDuration: 1200,
                        services: ['appointments-service'],
                    },
                    {
                        issue: 'Memory cache evictions',
                        impact: 'medium',
                        frequency: 85,
                        avgDuration: null,
                        services: ['api-gateway'],
                    },
                ],
                recommendations: [
                    'Optimize database queries with indexes',
                    'Increase memory cache size',
                    'Implement connection pooling',
                ],
            };
        }
        async generatePerformanceReport(reportRequest, userId) {
            const reportId = `report_${Date.now()}`;
            const report = {
                reportId,
                type: reportRequest.type,
                startDate: reportRequest.startDate,
                endDate: reportRequest.endDate,
                services: reportRequest.services,
                metrics: reportRequest.metrics,
                format: reportRequest.format,
                status: 'generating',
                progress: 0,
                generatedBy: userId,
                createdAt: new Date(),
                estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            };
            // Simulate report generation
            setTimeout(() => {
                report.status = 'completed';
                report.progress = 100;
                report.downloadUrl = `/api/performance/reports/${reportId}/download`;
                report.completedAt = new Date();
            }, 5000);
            return report;
        }
    };
    __setFunctionName(_classThis, "PerformanceService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PerformanceService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PerformanceService = _classThis;
})();
exports.PerformanceService = PerformanceService;
