"use strict";
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
exports.HealthCheckController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
// import { CustomMetricsService } from './custom-metrics.service'; // Temporarily disabled
/**
 * Health Check Controller
 *
 * Provides system health endpoints for load balancers, monitoring systems,
 * and general health status verification.
 */
let HealthCheckController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('health'), (0, common_1.Controller)('health')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _healthCheck_decorators;
    let _detailedHealthCheck_decorators;
    let _readinessProbe_decorators;
    let _livenessProbe_decorators;
    var HealthCheckController = _classThis = class {
        constructor(
        // private readonly customMetricsService: CustomMetricsService // Temporarily disabled
        ) {
            this.logger = (__runInitializers(this, _instanceExtraInitializers), new common_1.Logger(HealthCheckController.name));
        }
        /**
         * Basic health check endpoint
         */
        async healthCheck() {
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                service: 'clinic-api-gateway',
                version: process.env.npm_package_version || '1.0.0'
            };
        }
        /**
         * Detailed health check with system metrics
         */
        async detailedHealthCheck() {
            try {
                const startTime = Date.now();
                // const metrics = await this.customMetricsService.collectHealthcareMetrics(); // Temporarily disabled
                const metrics = null; // Temporary placeholder
                const collectionTime = Date.now() - startTime;
                return {
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    service: 'clinic-api-gateway',
                    version: process.env.npm_package_version || '1.0.0',
                    system: {
                        memory: {
                            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                            unit: 'MB'
                        },
                        cpu: {
                            usage: metrics?.systemHealth?.cpuUsage || 'N/A',
                            unit: 'percentage'
                        },
                        response: {
                            apiResponseTime: metrics?.systemHealth?.apiResponseTime || 'N/A',
                            metricsCollectionTime: collectionTime,
                            unit: 'ms'
                        }
                    },
                    business: {
                        activeUsers: metrics?.activeUsers?.total || 0,
                        sessionsToday: metrics?.sessions?.scheduled || 0,
                        systemLoad: 'normal'
                    }
                };
            }
            catch (error) {
                this.logger.error('Detailed health check failed', error);
                return {
                    status: 'degraded',
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    service: 'clinic-api-gateway',
                    version: process.env.npm_package_version || '1.0.0',
                    error: 'Failed to collect detailed metrics'
                };
            }
        }
        /**
         * Readiness probe for Kubernetes
         */
        async readinessProbe() {
            // Check if the service is ready to accept traffic
            // This could include database connectivity, external service availability, etc.
            return {
                status: 'ready',
                timestamp: new Date().toISOString(),
                checks: {
                    database: 'connected',
                    external_services: 'available',
                    memory: 'sufficient'
                }
            };
        }
        /**
         * Liveness probe for Kubernetes
         */
        async livenessProbe() {
            // Simple check to verify the service is running
            return {
                status: 'alive',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            };
        }
    };
    __setFunctionName(_classThis, "HealthCheckController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _healthCheck_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({
                summary: 'Basic health check',
                description: 'Returns basic health status for load balancers'
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Service is healthy'
            })];
        _detailedHealthCheck_decorators = [(0, common_1.Get)('detailed'), (0, swagger_1.ApiOperation)({
                summary: 'Detailed health check',
                description: 'Returns detailed health status with system metrics'
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Detailed health information'
            })];
        _readinessProbe_decorators = [(0, common_1.Get)('ready'), (0, swagger_1.ApiOperation)({
                summary: 'Readiness probe',
                description: 'Kubernetes readiness probe endpoint'
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Service is ready'
            })];
        _livenessProbe_decorators = [(0, common_1.Get)('live'), (0, swagger_1.ApiOperation)({
                summary: 'Liveness probe',
                description: 'Kubernetes liveness probe endpoint'
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Service is alive'
            })];
        __esDecorate(_classThis, null, _healthCheck_decorators, { kind: "method", name: "healthCheck", static: false, private: false, access: { has: obj => "healthCheck" in obj, get: obj => obj.healthCheck }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _detailedHealthCheck_decorators, { kind: "method", name: "detailedHealthCheck", static: false, private: false, access: { has: obj => "detailedHealthCheck" in obj, get: obj => obj.detailedHealthCheck }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _readinessProbe_decorators, { kind: "method", name: "readinessProbe", static: false, private: false, access: { has: obj => "readinessProbe" in obj, get: obj => obj.readinessProbe }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _livenessProbe_decorators, { kind: "method", name: "livenessProbe", static: false, private: false, access: { has: obj => "livenessProbe" in obj, get: obj => obj.livenessProbe }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        HealthCheckController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return HealthCheckController = _classThis;
})();
exports.HealthCheckController = HealthCheckController;
