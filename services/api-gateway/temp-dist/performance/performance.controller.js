"use strict";
/**
 * PerformanceController - Performance optimization and monitoring tools
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
exports.PerformanceController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let PerformanceController = (() => {
    let _classDecorators = [(0, common_1.Controller)('performance'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getPerformanceDashboard_decorators;
    let _getRealTimeMetrics_decorators;
    let _getDatabaseOptimization_decorators;
    let _optimizeQuery_decorators;
    let _adjustConnectionPool_decorators;
    let _getCacheConfigurations_decorators;
    let _updateCacheConfiguration_decorators;
    let _flushCache_decorators;
    let _warmUpCache_decorators;
    let _getLoadBalancers_decorators;
    let _updateLoadBalancingAlgorithm_decorators;
    let _addUpstream_decorators;
    let _removeUpstream_decorators;
    let _getCpuProfiling_decorators;
    let _getMemoryProfiling_decorators;
    let _startProfiling_decorators;
    let _runLoadTest_decorators;
    let _getLoadTestResults_decorators;
    let _getPerformanceAlerts_decorators;
    let _createPerformanceThreshold_decorators;
    let _getPerformanceSummary_decorators;
    let _generatePerformanceReport_decorators;
    var PerformanceController = _classThis = class {
        constructor(performanceService) {
            this.performanceService = (__runInitializers(this, _instanceExtraInitializers), performanceService);
            this.logger = new common_1.Logger(PerformanceController.name);
        }
        /**
         * Performance Dashboard and Overview
         */
        async getPerformanceDashboard(req) {
            try {
                const dashboard = await this.performanceService.getPerformanceDashboard();
                this.logger.log(`User ${req.user.sub} viewed performance dashboard`);
                return {
                    success: true,
                    data: dashboard,
                };
            }
            catch (error) {
                this.logger.error('Failed to get performance dashboard:', error);
                throw new common_1.HttpException('Failed to retrieve performance dashboard', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getRealTimeMetrics(req) {
            try {
                const metrics = await this.performanceService.getRealTimeMetrics();
                return {
                    success: true,
                    data: metrics,
                };
            }
            catch (error) {
                this.logger.error('Failed to get real-time metrics:', error);
                throw new common_1.HttpException('Failed to retrieve real-time metrics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Database Performance Optimization
         */
        async getDatabaseOptimization(req) {
            try {
                const optimization = await this.performanceService.getDatabaseOptimization();
                return {
                    success: true,
                    data: optimization,
                };
            }
            catch (error) {
                this.logger.error('Failed to get database optimization:', error);
                throw new common_1.HttpException('Failed to retrieve database optimization data', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async optimizeQuery(optimizeRequest, req) {
            try {
                const result = await this.performanceService.optimizeQuery(optimizeRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} optimized query ${optimizeRequest.queryId}`);
                return {
                    success: true,
                    data: result,
                    message: 'Query optimization initiated',
                };
            }
            catch (error) {
                this.logger.error('Failed to optimize query:', error);
                throw new common_1.HttpException('Failed to optimize query', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async adjustConnectionPool(adjustRequest, req) {
            try {
                const result = await this.performanceService.adjustConnectionPool(adjustRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} adjusted connection pool for ${adjustRequest.service}`);
                return {
                    success: true,
                    data: result,
                    message: 'Connection pool configuration updated',
                };
            }
            catch (error) {
                this.logger.error('Failed to adjust connection pool:', error);
                throw new common_1.HttpException('Failed to adjust connection pool', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Cache Management and Optimization
         */
        async getCacheConfigurations(req) {
            try {
                const configurations = await this.performanceService.getCacheConfigurations();
                return {
                    success: true,
                    data: configurations,
                };
            }
            catch (error) {
                this.logger.error('Failed to get cache configurations:', error);
                throw new common_1.HttpException('Failed to retrieve cache configurations', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateCacheConfiguration(cacheId, configuration, req) {
            try {
                const updatedCache = await this.performanceService.updateCacheConfiguration(cacheId, configuration, req.user.sub);
                this.logger.log(`User ${req.user.sub} updated cache configuration ${cacheId}`);
                return {
                    success: true,
                    data: updatedCache,
                    message: 'Cache configuration updated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to update cache configuration:', error);
                throw new common_1.HttpException('Failed to update cache configuration', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async flushCache(cacheId, flushRequest, req) {
            try {
                const result = await this.performanceService.flushCache(cacheId, flushRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} flushed cache ${cacheId} - ${flushRequest.reason}`);
                return {
                    success: true,
                    data: result,
                    message: 'Cache flush completed successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to flush cache:', error);
                throw new common_1.HttpException('Failed to flush cache', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async warmUpCache(cacheId, warmUpRequest, req) {
            try {
                const result = await this.performanceService.warmUpCache(cacheId, warmUpRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} initiated cache warm-up for ${cacheId}`);
                return {
                    success: true,
                    data: result,
                    message: 'Cache warm-up initiated',
                };
            }
            catch (error) {
                this.logger.error('Failed to warm up cache:', error);
                throw new common_1.HttpException('Failed to warm up cache', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Load Balancing and Traffic Management
         */
        async getLoadBalancers(req) {
            try {
                const loadBalancers = await this.performanceService.getLoadBalancers();
                return {
                    success: true,
                    data: loadBalancers,
                };
            }
            catch (error) {
                this.logger.error('Failed to get load balancers:', error);
                throw new common_1.HttpException('Failed to retrieve load balancers', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateLoadBalancingAlgorithm(balancerId, algorithmRequest, req) {
            try {
                const result = await this.performanceService.updateLoadBalancingAlgorithm(balancerId, algorithmRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} updated load balancing algorithm for ${balancerId}`);
                return {
                    success: true,
                    data: result,
                    message: 'Load balancing algorithm updated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to update load balancing algorithm:', error);
                throw new common_1.HttpException('Failed to update load balancing algorithm', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async addUpstream(balancerId, upstreamRequest, req) {
            try {
                const result = await this.performanceService.addUpstream(balancerId, upstreamRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} added upstream ${upstreamRequest.url} to ${balancerId}`);
                return {
                    success: true,
                    data: result,
                    message: 'Upstream added successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to add upstream:', error);
                throw new common_1.HttpException('Failed to add upstream', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async removeUpstream(balancerId, upstreamId, req) {
            try {
                await this.performanceService.removeUpstream(balancerId, upstreamId, req.user.sub);
                this.logger.log(`User ${req.user.sub} removed upstream ${upstreamId} from ${balancerId}`);
                return {
                    success: true,
                    message: 'Upstream removed successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to remove upstream:', error);
                throw new common_1.HttpException('Failed to remove upstream', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Performance Profiling and Analysis
         */
        async getCpuProfiling(duration = 60, service, req) {
            try {
                const profiling = await this.performanceService.getCpuProfiling(duration, service);
                return {
                    success: true,
                    data: profiling,
                };
            }
            catch (error) {
                this.logger.error('Failed to get CPU profiling:', error);
                throw new common_1.HttpException('Failed to retrieve CPU profiling', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getMemoryProfiling(service, req) {
            try {
                const profiling = await this.performanceService.getMemoryProfiling(service);
                return {
                    success: true,
                    data: profiling,
                };
            }
            catch (error) {
                this.logger.error('Failed to get memory profiling:', error);
                throw new common_1.HttpException('Failed to retrieve memory profiling', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async startProfiling(profilingRequest, req) {
            try {
                const session = await this.performanceService.startProfiling(profilingRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} started ${profilingRequest.type} profiling`);
                return {
                    success: true,
                    data: session,
                    message: 'Profiling session started',
                };
            }
            catch (error) {
                this.logger.error('Failed to start profiling:', error);
                throw new common_1.HttpException('Failed to start profiling', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Performance Testing and Benchmarking
         */
        async runLoadTest(loadTestRequest, req) {
            try {
                const testSession = await this.performanceService.runLoadTest(loadTestRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} started load test: ${loadTestRequest.name}`);
                return {
                    success: true,
                    data: testSession,
                    message: 'Load test initiated',
                };
            }
            catch (error) {
                this.logger.error('Failed to run load test:', error);
                throw new common_1.HttpException('Failed to run load test', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getLoadTestResults(testId, req) {
            try {
                const results = await this.performanceService.getLoadTestResults(testId);
                return {
                    success: true,
                    data: results,
                };
            }
            catch (error) {
                this.logger.error('Failed to get load test results:', error);
                throw new common_1.HttpException('Failed to retrieve load test results', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Performance Alerts and Notifications
         */
        async getPerformanceAlerts(req) {
            try {
                const alerts = await this.performanceService.getPerformanceAlerts();
                return {
                    success: true,
                    data: alerts,
                };
            }
            catch (error) {
                this.logger.error('Failed to get performance alerts:', error);
                throw new common_1.HttpException('Failed to retrieve performance alerts', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createPerformanceThreshold(thresholdRequest, req) {
            try {
                const threshold = await this.performanceService.createPerformanceThreshold(thresholdRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} created performance threshold: ${thresholdRequest.name}`);
                return {
                    success: true,
                    data: threshold,
                    message: 'Performance threshold created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create performance threshold:', error);
                throw new common_1.HttpException('Failed to create performance threshold', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Performance Reports and Analytics
         */
        async getPerformanceSummary(period = '24h', service, req) {
            try {
                const summary = await this.performanceService.getPerformanceSummary(period, service);
                return {
                    success: true,
                    data: summary,
                };
            }
            catch (error) {
                this.logger.error('Failed to get performance summary:', error);
                throw new common_1.HttpException('Failed to retrieve performance summary', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async generatePerformanceReport(reportRequest, req) {
            try {
                const report = await this.performanceService.generatePerformanceReport(reportRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} generated ${reportRequest.type} performance report`);
                return {
                    success: true,
                    data: report,
                    message: 'Performance report generation initiated',
                };
            }
            catch (error) {
                this.logger.error('Failed to generate performance report:', error);
                throw new common_1.HttpException('Failed to generate performance report', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "PerformanceController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getPerformanceDashboard_decorators = [(0, common_1.Get)('dashboard'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _getRealTimeMetrics_decorators = [(0, common_1.Get)('real-time-metrics'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _getDatabaseOptimization_decorators = [(0, common_1.Get)('database/optimization'), (0, common_2.RequireRoles)('admin', 'performance_engineer', 'dba')];
        _optimizeQuery_decorators = [(0, common_1.Post)('database/optimize-query'), (0, common_2.RequireRoles)('admin', 'performance_engineer', 'dba')];
        _adjustConnectionPool_decorators = [(0, common_1.Post)('database/connection-pool/adjust'), (0, common_2.RequireRoles)('admin', 'performance_engineer', 'dba')];
        _getCacheConfigurations_decorators = [(0, common_1.Get)('cache/configurations'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _updateCacheConfiguration_decorators = [(0, common_1.Put)('cache/:cacheId/configuration'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _flushCache_decorators = [(0, common_1.Post)('cache/:cacheId/flush'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _warmUpCache_decorators = [(0, common_1.Post)('cache/:cacheId/warm-up'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _getLoadBalancers_decorators = [(0, common_1.Get)('load-balancers'), (0, common_2.RequireRoles)('admin', 'performance_engineer', 'network_engineer')];
        _updateLoadBalancingAlgorithm_decorators = [(0, common_1.Put)('load-balancers/:balancerId/algorithm'), (0, common_2.RequireRoles)('admin', 'performance_engineer', 'network_engineer')];
        _addUpstream_decorators = [(0, common_1.Post)('load-balancers/:balancerId/upstream'), (0, common_2.RequireRoles)('admin', 'performance_engineer', 'network_engineer')];
        _removeUpstream_decorators = [(0, common_1.Delete)('load-balancers/:balancerId/upstream/:upstreamId'), (0, common_2.RequireRoles)('admin', 'performance_engineer', 'network_engineer')];
        _getCpuProfiling_decorators = [(0, common_1.Get)('profiling/cpu'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _getMemoryProfiling_decorators = [(0, common_1.Get)('profiling/memory'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _startProfiling_decorators = [(0, common_1.Post)('profiling/start'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _runLoadTest_decorators = [(0, common_1.Post)('testing/load-test'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _getLoadTestResults_decorators = [(0, common_1.Get)('testing/results/:testId'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _getPerformanceAlerts_decorators = [(0, common_1.Get)('alerts'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _createPerformanceThreshold_decorators = [(0, common_1.Post)('alerts/threshold'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _getPerformanceSummary_decorators = [(0, common_1.Get)('reports/summary'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        _generatePerformanceReport_decorators = [(0, common_1.Post)('reports/generate'), (0, common_2.RequireRoles)('admin', 'performance_engineer')];
        __esDecorate(_classThis, null, _getPerformanceDashboard_decorators, { kind: "method", name: "getPerformanceDashboard", static: false, private: false, access: { has: obj => "getPerformanceDashboard" in obj, get: obj => obj.getPerformanceDashboard }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRealTimeMetrics_decorators, { kind: "method", name: "getRealTimeMetrics", static: false, private: false, access: { has: obj => "getRealTimeMetrics" in obj, get: obj => obj.getRealTimeMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDatabaseOptimization_decorators, { kind: "method", name: "getDatabaseOptimization", static: false, private: false, access: { has: obj => "getDatabaseOptimization" in obj, get: obj => obj.getDatabaseOptimization }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _optimizeQuery_decorators, { kind: "method", name: "optimizeQuery", static: false, private: false, access: { has: obj => "optimizeQuery" in obj, get: obj => obj.optimizeQuery }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _adjustConnectionPool_decorators, { kind: "method", name: "adjustConnectionPool", static: false, private: false, access: { has: obj => "adjustConnectionPool" in obj, get: obj => obj.adjustConnectionPool }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCacheConfigurations_decorators, { kind: "method", name: "getCacheConfigurations", static: false, private: false, access: { has: obj => "getCacheConfigurations" in obj, get: obj => obj.getCacheConfigurations }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateCacheConfiguration_decorators, { kind: "method", name: "updateCacheConfiguration", static: false, private: false, access: { has: obj => "updateCacheConfiguration" in obj, get: obj => obj.updateCacheConfiguration }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _flushCache_decorators, { kind: "method", name: "flushCache", static: false, private: false, access: { has: obj => "flushCache" in obj, get: obj => obj.flushCache }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _warmUpCache_decorators, { kind: "method", name: "warmUpCache", static: false, private: false, access: { has: obj => "warmUpCache" in obj, get: obj => obj.warmUpCache }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLoadBalancers_decorators, { kind: "method", name: "getLoadBalancers", static: false, private: false, access: { has: obj => "getLoadBalancers" in obj, get: obj => obj.getLoadBalancers }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateLoadBalancingAlgorithm_decorators, { kind: "method", name: "updateLoadBalancingAlgorithm", static: false, private: false, access: { has: obj => "updateLoadBalancingAlgorithm" in obj, get: obj => obj.updateLoadBalancingAlgorithm }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addUpstream_decorators, { kind: "method", name: "addUpstream", static: false, private: false, access: { has: obj => "addUpstream" in obj, get: obj => obj.addUpstream }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _removeUpstream_decorators, { kind: "method", name: "removeUpstream", static: false, private: false, access: { has: obj => "removeUpstream" in obj, get: obj => obj.removeUpstream }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCpuProfiling_decorators, { kind: "method", name: "getCpuProfiling", static: false, private: false, access: { has: obj => "getCpuProfiling" in obj, get: obj => obj.getCpuProfiling }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMemoryProfiling_decorators, { kind: "method", name: "getMemoryProfiling", static: false, private: false, access: { has: obj => "getMemoryProfiling" in obj, get: obj => obj.getMemoryProfiling }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _startProfiling_decorators, { kind: "method", name: "startProfiling", static: false, private: false, access: { has: obj => "startProfiling" in obj, get: obj => obj.startProfiling }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _runLoadTest_decorators, { kind: "method", name: "runLoadTest", static: false, private: false, access: { has: obj => "runLoadTest" in obj, get: obj => obj.runLoadTest }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLoadTestResults_decorators, { kind: "method", name: "getLoadTestResults", static: false, private: false, access: { has: obj => "getLoadTestResults" in obj, get: obj => obj.getLoadTestResults }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPerformanceAlerts_decorators, { kind: "method", name: "getPerformanceAlerts", static: false, private: false, access: { has: obj => "getPerformanceAlerts" in obj, get: obj => obj.getPerformanceAlerts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createPerformanceThreshold_decorators, { kind: "method", name: "createPerformanceThreshold", static: false, private: false, access: { has: obj => "createPerformanceThreshold" in obj, get: obj => obj.createPerformanceThreshold }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPerformanceSummary_decorators, { kind: "method", name: "getPerformanceSummary", static: false, private: false, access: { has: obj => "getPerformanceSummary" in obj, get: obj => obj.getPerformanceSummary }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generatePerformanceReport_decorators, { kind: "method", name: "generatePerformanceReport", static: false, private: false, access: { has: obj => "generatePerformanceReport" in obj, get: obj => obj.generatePerformanceReport }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PerformanceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PerformanceController = _classThis;
})();
exports.PerformanceController = PerformanceController;
