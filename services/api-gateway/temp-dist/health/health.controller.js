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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let HealthController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Health'), (0, swagger_1.ApiExtraModels)(), (0, common_1.Controller)('health')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _check_decorators;
    let _liveness_decorators;
    let _readiness_decorators;
    var HealthController = _classThis = class {
        constructor(dataSource) {
            this.dataSource = (__runInitializers(this, _instanceExtraInitializers), dataSource);
            this.startTime = Date.now();
        }
        async check() {
            const timestamp = new Date().toISOString();
            const services = await this.checkServices();
            const overallStatus = this.getOverallStatus(services);
            const memoryUsage = process.memoryUsage();
            return {
                status: overallStatus,
                timestamp,
                version: process.env.npm_package_version || '1.0.0',
                services,
                uptime: Date.now() - this.startTime,
                memory: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    usage: `${Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)}%`,
                },
            };
        }
        liveness() {
            return { status: 'alive', timestamp: new Date().toISOString() };
        }
        async readiness() {
            try {
                // Check critical dependencies for readiness
                const dbHealth = await this.checkDatabase();
                if (dbHealth.status === 'unhealthy') {
                    throw new common_1.HttpException({ status: 'not ready', reason: 'Database unavailable' }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
                }
                return {
                    status: 'ready',
                    timestamp: new Date().toISOString(),
                    database: dbHealth.status
                };
            }
            catch (error) {
                throw new common_1.HttpException({ status: 'not ready', error: error.message }, common_1.HttpStatus.SERVICE_UNAVAILABLE);
            }
        }
        async checkServices() {
            const services = {
                database: await this.checkDatabase(),
                filesystem: await this.checkFilesystem(),
            };
            return services;
        }
        async checkDatabase() {
            const startTime = Date.now();
            try {
                if (!this.dataSource.isInitialized) {
                    await this.dataSource.initialize();
                }
                // Simple query to check database connectivity
                await this.dataSource.query('SELECT 1 as health_check');
                return {
                    status: 'healthy',
                    responseTime: Date.now() - startTime,
                    lastCheck: new Date().toISOString(),
                };
            }
            catch (error) {
                return {
                    status: 'unhealthy',
                    error: error.message,
                    lastCheck: new Date().toISOString(),
                };
            }
        }
        async checkFilesystem() {
            const startTime = Date.now();
            try {
                const fs = require('fs').promises;
                await fs.access('./');
                return {
                    status: 'healthy',
                    responseTime: Date.now() - startTime,
                    lastCheck: new Date().toISOString(),
                };
            }
            catch (error) {
                return {
                    status: 'unhealthy',
                    error: error.message,
                    lastCheck: new Date().toISOString(),
                };
            }
        }
        getOverallStatus(services) {
            const statuses = Object.values(services).map((service) => service.status);
            if (statuses.every(status => status === 'healthy')) {
                return 'healthy';
            }
            if (statuses.includes('unhealthy')) {
                const criticalServices = ['database'];
                const hasCriticalFailure = criticalServices.some(service => services[service]?.status === 'unhealthy');
                return hasCriticalFailure ? 'unhealthy' : 'degraded';
            }
            return 'degraded';
        }
    };
    __setFunctionName(_classThis, "HealthController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _check_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({
                summary: 'Comprehensive health check',
                description: `
      Performs a comprehensive health check of all system components and dependencies.
      
      **Checks Include:**
      - Database connectivity and performance
      - File system access
      - Memory usage and system resources
      - Service uptime
      - Overall system status assessment
      
      **Status Levels:**
      - **healthy**: All systems operational
      - **degraded**: Some non-critical issues detected
      - **unhealthy**: Critical system failures detected
      
      **Use Cases:**
      - Load balancer health checks
      - Monitoring system integration
      - System status dashboards
      - Automated alerting
    `
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Health check completed successfully',
                schema: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['healthy', 'unhealthy', 'degraded'],
                            example: 'healthy',
                            description: 'Overall system health status'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-31T10:30:00Z',
                            description: 'Health check execution time'
                        },
                        version: {
                            type: 'string',
                            example: '2.0.0',
                            description: 'Application version'
                        },
                        services: {
                            type: 'object',
                            properties: {
                                database: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                                        responseTime: { type: 'number', example: 15 },
                                        lastCheck: { type: 'string', format: 'date-time' },
                                        error: { type: 'string', description: 'Error message if unhealthy' }
                                    }
                                },
                                filesystem: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                                        responseTime: { type: 'number', example: 5 },
                                        lastCheck: { type: 'string', format: 'date-time' }
                                    }
                                }
                            }
                        },
                        uptime: {
                            type: 'number',
                            example: 3600000,
                            description: 'Application uptime in milliseconds'
                        },
                        memory: {
                            type: 'object',
                            properties: {
                                used: { type: 'number', example: 128, description: 'Used memory in MB' },
                                total: { type: 'number', example: 512, description: 'Total memory in MB' },
                                usage: { type: 'string', example: '25%', description: 'Memory usage percentage' }
                            }
                        }
                    }
                }
            }), (0, swagger_1.ApiResponse)({
                status: 503,
                description: 'Service unavailable - Critical systems unhealthy',
                schema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'unhealthy' },
                        timestamp: { type: 'string', format: 'date-time' },
                        error: { type: 'string', example: 'Database connection failed' },
                        services: { type: 'object' }
                    }
                }
            })];
        _liveness_decorators = [(0, common_1.Get)('liveness'), (0, swagger_1.ApiOperation)({
                summary: 'Kubernetes liveness probe',
                description: `
      Simple liveness probe endpoint for Kubernetes health checks.
      
      **Purpose:**
      - Indicates whether the application is running
      - Used by Kubernetes to determine if a pod should be restarted
      - Fast response with minimal resource usage
      
      **Response:**
      Always returns 200 OK if the application is responsive
      
      **Kubernetes Configuration:**
      \`\`\`yaml
      livenessProbe:
        httpGet:
          path: /health/liveness
          port: 4000
        initialDelaySeconds: 30
        periodSeconds: 10
      \`\`\`
    `
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Application is alive and responsive',
                schema: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'alive',
                            description: 'Liveness status'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-31T10:30:00Z',
                            description: 'Response timestamp'
                        }
                    }
                }
            })];
        _readiness_decorators = [(0, common_1.Get)('readiness'), (0, swagger_1.ApiOperation)({
                summary: 'Kubernetes readiness probe',
                description: `
      Readiness probe endpoint for Kubernetes deployment health checks.
      
      **Purpose:**
      - Indicates whether the application is ready to receive traffic
      - Checks critical dependencies (database, external services)
      - Used by Kubernetes to determine if a pod should receive requests
      
      **Checks:**
      - Database connectivity and responsiveness
      - Critical service dependencies
      - Application initialization status
      
      **Kubernetes Configuration:**
      \`\`\`yaml
      readinessProbe:
        httpGet:
          path: /health/readiness
          port: 4000
        initialDelaySeconds: 5
        periodSeconds: 5
        failureThreshold: 3
      \`\`\`
    `
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Application is ready to receive traffic',
                schema: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'ready',
                            description: 'Readiness status'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-31T10:30:00Z'
                        },
                        database: {
                            type: 'string',
                            example: 'healthy',
                            description: 'Database health status'
                        }
                    }
                }
            }), (0, swagger_1.ApiResponse)({
                status: 503,
                description: 'Service unavailable - Not ready to receive traffic',
                schema: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            example: 'not ready',
                            description: 'Readiness status'
                        },
                        reason: {
                            type: 'string',
                            example: 'Database unavailable',
                            description: 'Reason for not being ready'
                        },
                        error: {
                            type: 'string',
                            description: 'Detailed error message'
                        }
                    }
                }
            })];
        __esDecorate(_classThis, null, _check_decorators, { kind: "method", name: "check", static: false, private: false, access: { has: obj => "check" in obj, get: obj => obj.check }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _liveness_decorators, { kind: "method", name: "liveness", static: false, private: false, access: { has: obj => "liveness" in obj, get: obj => obj.liveness }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _readiness_decorators, { kind: "method", name: "readiness", static: false, private: false, access: { has: obj => "readiness" in obj, get: obj => obj.readiness }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        HealthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return HealthController = _classThis;
})();
exports.HealthController = HealthController;
