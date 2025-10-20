"use strict";
/**
 * Metrics Controller
 * Exposes metrics endpoints for production monitoring
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
exports.MetricsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const common_2 = require("@clinic/common");
let MetricsController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Monitoring'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('metrics'), (0, common_1.UseGuards)(common_2.JwtAuthGuard, common_2.RolesGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getMetrics_decorators;
    let _getMetricsSummary_decorators;
    let _getEndpointAnalysis_decorators;
    let _getCircuitBreakers_decorators;
    let _getPrometheusMetrics_decorators;
    let _getConfig_decorators;
    var MetricsController = _classThis = class {
        constructor(metricsService, circuitBreakerService, configService) {
            this.metricsService = (__runInitializers(this, _instanceExtraInitializers), metricsService);
            this.circuitBreakerService = circuitBreakerService;
            this.configService = configService;
        }
        async getMetrics() {
            const metrics = this.metricsService.getFullMetrics();
            const circuitBreakers = this.circuitBreakerService.getAllStats();
            return {
                ...metrics,
                circuitBreakers,
                healthScore: this.metricsService.getHealthScore(),
                isUnderHighLoad: this.metricsService.isUnderHighLoad()
            };
        }
        async getMetricsSummary() {
            const apiMetrics = this.metricsService.getApiMetrics();
            const systemMetrics = this.metricsService.getSystemMetrics();
            const circuitBreakers = this.circuitBreakerService.getAllStats();
            const errorRate = apiMetrics.requests.total > 0
                ? (apiMetrics.requests.errors / apiMetrics.requests.total) * 100
                : 0;
            const activeCircuitBreakers = Object.values(circuitBreakers)
                .filter(cb => cb.state === 'OPEN').length;
            return {
                healthScore: this.metricsService.getHealthScore(),
                requestRate: apiMetrics.requests.rate,
                errorRate: Math.round(errorRate * 100) / 100,
                averageResponseTime: apiMetrics.response.averageTime,
                memoryUsage: systemMetrics.memory.usage,
                isUnderHighLoad: this.metricsService.isUnderHighLoad(),
                activeCircuitBreakers,
                timestamp: new Date().toISOString()
            };
        }
        async getEndpointAnalysis(limit = '10') {
            const limitNum = parseInt(limit, 10) || 10;
            return {
                topEndpoints: this.metricsService.getTopEndpoints(limitNum),
                slowestEndpoints: this.metricsService.getSlowestEndpoints(limitNum),
                errorProneEndpoints: this.metricsService.getErrorProneEndpoints(limitNum),
                timestamp: new Date().toISOString()
            };
        }
        async getCircuitBreakers() {
            return {
                circuitBreakers: this.circuitBreakerService.getAllStats(),
                timestamp: new Date().toISOString()
            };
        }
        async getPrometheusMetrics() {
            const apiMetrics = this.metricsService.getApiMetrics();
            const systemMetrics = this.metricsService.getSystemMetrics();
            let output = '';
            // API request metrics
            output += '# HELP api_requests_total Total number of API requests\n';
            output += '# TYPE api_requests_total counter\n';
            output += `api_requests_total{status="success"} ${apiMetrics.requests.success}\n`;
            output += `api_requests_total{status="error"} ${apiMetrics.requests.errors}\n`;
            output += '\n';
            // Response time metrics
            output += '# HELP api_response_time_ms Average response time in milliseconds\n';
            output += '# TYPE api_response_time_ms gauge\n';
            output += `api_response_time_ms ${apiMetrics.response.averageTime}\n`;
            output += '\n';
            // Memory metrics
            output += '# HELP system_memory_usage_percent Memory usage percentage\n';
            output += '# TYPE system_memory_usage_percent gauge\n';
            output += `system_memory_usage_percent ${systemMetrics.memory.usage}\n`;
            output += '\n';
            // Status code metrics
            output += '# HELP api_status_codes_total HTTP status code counts\n';
            output += '# TYPE api_status_codes_total counter\n';
            for (const [status, count] of Object.entries(apiMetrics.status)) {
                output += `api_status_codes_total{code="${status}"} ${count}\n`;
            }
            return output;
        }
        async getConfig() {
            return this.configService.getHealthStatus();
        }
    };
    __setFunctionName(_classThis, "MetricsController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getMetrics_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({
                summary: 'Get comprehensive API metrics',
                description: `
      Provides comprehensive metrics about API performance, request patterns, and system health.
      
      **Metrics Include:**
      - Request counts and success/error rates
      - Response time statistics (average, P95, P99)
      - Status code distribution
      - Per-endpoint performance metrics
      - System resource usage
      - Circuit breaker status
      
      **Use Cases:**
      - Performance monitoring and alerting
      - Capacity planning
      - System health dashboards
      - SLA monitoring
      - Debugging performance issues
    `
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Metrics retrieved successfully',
                schema: {
                    type: 'object',
                    properties: {
                        api: {
                            type: 'object',
                            properties: {
                                requests: {
                                    type: 'object',
                                    properties: {
                                        total: { type: 'number', example: 15420 },
                                        success: { type: 'number', example: 14832 },
                                        errors: { type: 'number', example: 588 },
                                        rate: { type: 'number', example: 245, description: 'Requests per minute' }
                                    }
                                },
                                response: {
                                    type: 'object',
                                    properties: {
                                        averageTime: { type: 'number', example: 187, description: 'Average response time in ms' },
                                        p95Time: { type: 'number', example: 450, description: '95th percentile response time in ms' },
                                        p99Time: { type: 'number', example: 890, description: '99th percentile response time in ms' }
                                    }
                                },
                                status: {
                                    type: 'object',
                                    description: 'HTTP status code distribution',
                                    example: { '200': 12450, '400': 234, '401': 123, '500': 89 }
                                },
                                endpoints: {
                                    type: 'object',
                                    description: 'Per-endpoint metrics',
                                    additionalProperties: {
                                        type: 'object',
                                        properties: {
                                            requests: { type: 'number' },
                                            averageTime: { type: 'number' },
                                            errors: { type: 'number' },
                                            lastAccess: { type: 'string', format: 'date-time' }
                                        }
                                    }
                                }
                            }
                        },
                        system: {
                            type: 'object',
                            properties: {
                                memory: {
                                    type: 'object',
                                    properties: {
                                        used: { type: 'number', example: 256, description: 'Used memory in MB' },
                                        total: { type: 'number', example: 512, description: 'Total memory in MB' },
                                        usage: { type: 'number', example: 50, description: 'Memory usage percentage' }
                                    }
                                },
                                uptime: { type: 'number', example: 3600000, description: 'Uptime in milliseconds' }
                            }
                        },
                        circuitBreakers: {
                            type: 'object',
                            description: 'Circuit breaker status for each service'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-31T10:30:00Z'
                        }
                    }
                }
            }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.SUPER_ADMIN)];
        _getMetricsSummary_decorators = [(0, common_1.Get)('summary'), (0, swagger_1.ApiOperation)({
                summary: 'Get metrics summary for dashboards',
                description: `
      Provides a condensed view of key metrics suitable for dashboards and quick health checks.
      
      **Summary Includes:**
      - Overall health score (0-100)
      - Request rate and error rate
      - Average response time
      - Memory usage
      - Active alerts or issues
    `
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Metrics summary retrieved successfully',
                schema: {
                    type: 'object',
                    properties: {
                        healthScore: { type: 'number', example: 87, description: 'Overall health score (0-100)' },
                        requestRate: { type: 'number', example: 245, description: 'Requests per minute' },
                        errorRate: { type: 'number', example: 3.8, description: 'Error rate percentage' },
                        averageResponseTime: { type: 'number', example: 187, description: 'Average response time in ms' },
                        memoryUsage: { type: 'number', example: 50, description: 'Memory usage percentage' },
                        isUnderHighLoad: { type: 'boolean', example: false },
                        activeCircuitBreakers: { type: 'number', example: 0, description: 'Number of open circuit breakers' },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                }
            }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.SUPER_ADMIN)];
        _getEndpointAnalysis_decorators = [(0, common_1.Get)('endpoints'), (0, swagger_1.ApiOperation)({
                summary: 'Get endpoint performance analysis',
                description: 'Detailed analysis of endpoint performance including top endpoints, slowest endpoints, and error-prone endpoints.'
            }), (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: 'number', description: 'Limit results per category' }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Endpoint analysis retrieved successfully'
            }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.SUPER_ADMIN)];
        _getCircuitBreakers_decorators = [(0, common_1.Get)('circuit-breakers'), (0, swagger_1.ApiOperation)({
                summary: 'Get circuit breaker status',
                description: `
      Provides detailed status of all circuit breakers protecting microservice communications.
      
      **Circuit States:**
      - **CLOSED**: Normal operation, requests pass through
      - **OPEN**: Circuit is open, requests are blocked or redirected to fallback
      - **HALF_OPEN**: Testing if service has recovered
      
      **Use Cases:**
      - Monitor service health and resilience
      - Identify problematic microservices
      - Plan service recovery strategies
      - Alert on service degradation
    `
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Circuit breaker status retrieved successfully',
                schema: {
                    type: 'object',
                    additionalProperties: {
                        type: 'object',
                        properties: {
                            state: { type: 'string', enum: ['CLOSED', 'OPEN', 'HALF_OPEN'] },
                            failures: { type: 'number', example: 3 },
                            successes: { type: 'number', example: 147 },
                            requests: { type: 'number', example: 150 },
                            errorRate: { type: 'number', example: 0.02 },
                            lastFailureTime: { type: 'string', format: 'date-time' },
                            nextAttempt: { type: 'string', format: 'date-time' }
                        }
                    }
                }
            }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.SUPER_ADMIN)];
        _getPrometheusMetrics_decorators = [(0, common_1.Get)('prometheus'), (0, swagger_1.ApiOperation)({
                summary: 'Get metrics in Prometheus format',
                description: 'Exports metrics in Prometheus format for integration with Prometheus monitoring systems.'
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Metrics in Prometheus format',
                content: {
                    'text/plain': {
                        example: `# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{status="success"} 14832
api_requests_total{status="error"} 588

# HELP api_response_time_seconds Response time in seconds
# TYPE api_response_time_seconds histogram
api_response_time_seconds_bucket{le="0.1"} 8921
api_response_time_seconds_bucket{le="0.5"} 13456`
                    }
                }
            }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.SUPER_ADMIN)];
        _getConfig_decorators = [(0, common_1.Get)('config'), (0, swagger_1.ApiOperation)({
                summary: 'Get production configuration status',
                description: 'Provides visibility into production configuration for debugging and validation.'
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Configuration status retrieved successfully'
            }), (0, common_2.Roles)(common_2.UserRole.ADMIN, common_2.UserRole.SUPER_ADMIN)];
        __esDecorate(_classThis, null, _getMetrics_decorators, { kind: "method", name: "getMetrics", static: false, private: false, access: { has: obj => "getMetrics" in obj, get: obj => obj.getMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMetricsSummary_decorators, { kind: "method", name: "getMetricsSummary", static: false, private: false, access: { has: obj => "getMetricsSummary" in obj, get: obj => obj.getMetricsSummary }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getEndpointAnalysis_decorators, { kind: "method", name: "getEndpointAnalysis", static: false, private: false, access: { has: obj => "getEndpointAnalysis" in obj, get: obj => obj.getEndpointAnalysis }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCircuitBreakers_decorators, { kind: "method", name: "getCircuitBreakers", static: false, private: false, access: { has: obj => "getCircuitBreakers" in obj, get: obj => obj.getCircuitBreakers }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPrometheusMetrics_decorators, { kind: "method", name: "getPrometheusMetrics", static: false, private: false, access: { has: obj => "getPrometheusMetrics" in obj, get: obj => obj.getPrometheusMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getConfig_decorators, { kind: "method", name: "getConfig", static: false, private: false, access: { has: obj => "getConfig" in obj, get: obj => obj.getConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MetricsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MetricsController = _classThis;
})();
exports.MetricsController = MetricsController;
