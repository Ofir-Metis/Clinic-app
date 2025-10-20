"use strict";
/**
 * Metrics Service
 * Collects and exposes production metrics for monitoring
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
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
let MetricsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MetricsService = _classThis = class {
        constructor() {
            this.logger = new common_1.Logger(MetricsService.name);
            this.startTime = Date.now();
            // Request metrics
            this.totalRequests = 0;
            this.successfulRequests = 0;
            this.errorRequests = 0;
            this.statusCounts = new Map();
            // Response time tracking
            this.responseTimes = [];
            this.maxResponseTimesSamples = 1000; // Keep last 1000 samples
            // Endpoint tracking
            this.endpointMetrics = new Map();
            // Rate limiting
            this.requestTimestamps = [];
            this.rateLimitWindow = 60000; // 1 minute
        }
        /**
         * Record a request with response time and status
         */
        recordRequest(endpoint, method, statusCode, responseTime) {
            const now = Date.now();
            const endpointKey = `${method} ${endpoint}`;
            // Update total counts
            this.totalRequests++;
            if (statusCode >= 200 && statusCode < 400) {
                this.successfulRequests++;
            }
            else {
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
        getApiMetrics() {
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
        getSystemMetrics() {
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
        reset() {
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
        getTopEndpoints(limit = 10) {
            return Array.from(this.endpointMetrics.entries())
                .map(([endpoint, metric]) => ({ endpoint, metric }))
                .sort((a, b) => b.metric.requests - a.metric.requests)
                .slice(0, limit);
        }
        /**
         * Get slowest endpoints by average response time
         */
        getSlowestEndpoints(limit = 10) {
            return Array.from(this.endpointMetrics.entries())
                .map(([endpoint, metric]) => ({ endpoint, metric }))
                .sort((a, b) => b.metric.averageTime - a.metric.averageTime)
                .slice(0, limit);
        }
        /**
         * Get endpoints with highest error rates
         */
        getErrorProneEndpoints(limit = 10) {
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
        isUnderHighLoad() {
            const metrics = this.getSystemMetrics();
            const rate = this.calculateRequestRate();
            return (metrics.memory.usage > 85 || // Memory usage > 85%
                rate > 1000 || // More than 1000 requests per minute
                this.calculateAverageResponseTime() > 2000 // Average response time > 2s
            );
        }
        /**
         * Get health score based on metrics
         */
        getHealthScore() {
            const apiMetrics = this.getApiMetrics();
            const systemMetrics = this.getSystemMetrics();
            let score = 100;
            // Deduct points for high error rate
            const errorRate = apiMetrics.requests.total > 0
                ? (apiMetrics.requests.errors / apiMetrics.requests.total) * 100
                : 0;
            if (errorRate > 5)
                score -= 30; // > 5% error rate
            else if (errorRate > 1)
                score -= 10; // > 1% error rate
            // Deduct points for high response times
            if (apiMetrics.response.averageTime > 2000)
                score -= 25; // > 2s average
            else if (apiMetrics.response.averageTime > 1000)
                score -= 10; // > 1s average
            // Deduct points for high memory usage
            if (systemMetrics.memory.usage > 90)
                score -= 25;
            else if (systemMetrics.memory.usage > 80)
                score -= 10;
            // Deduct points for high request rate without proportional success
            const rate = this.calculateRequestRate();
            if (rate > 1000 && errorRate > 2)
                score -= 15;
            return Math.max(0, Math.min(100, score));
        }
        calculateAverageResponseTime() {
            if (this.responseTimes.length === 0)
                return 0;
            const sum = this.responseTimes.reduce((a, b) => a + b, 0);
            return Math.round(sum / this.responseTimes.length);
        }
        calculatePercentile(percentile) {
            if (this.responseTimes.length === 0)
                return 0;
            const sorted = [...this.responseTimes].sort((a, b) => a - b);
            const index = Math.ceil((percentile / 100) * sorted.length) - 1;
            return Math.round(sorted[Math.max(0, index)] || 0);
        }
        calculateRequestRate() {
            // Requests per minute
            const now = Date.now();
            const recentRequests = this.requestTimestamps.filter(timestamp => now - timestamp <= this.rateLimitWindow);
            return recentRequests.length;
        }
        cleanupOldTimestamps(now) {
            // Remove timestamps older than the rate limit window
            this.requestTimestamps = this.requestTimestamps.filter(timestamp => now - timestamp <= this.rateLimitWindow);
        }
    };
    __setFunctionName(_classThis, "MetricsService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MetricsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MetricsService = _classThis;
})();
exports.MetricsService = MetricsService;
