"use strict";
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
exports.ResilienceService = void 0;
const common_1 = require("@nestjs/common");
let ResilienceService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ResilienceService = _classThis = class {
        constructor(circuitBreakerService, retryService, timeoutService, bulkheadService) {
            this.circuitBreakerService = circuitBreakerService;
            this.retryService = retryService;
            this.timeoutService = timeoutService;
            this.bulkheadService = bulkheadService;
            this.logger = new common_1.Logger(ResilienceService.name);
            this.patterns = new Map();
            this.initializeDefaultPatterns();
        }
        /**
         * Execute operation with comprehensive resilience patterns
         */
        async execute(patternName, operationName, operation, fallback) {
            const pattern = this.patterns.get(patternName);
            if (!pattern) {
                throw new Error(`Resilience pattern '${patternName}' not found`);
            }
            const config = pattern.config;
            const fullOperationName = `${patternName}-${operationName}`;
            try {
                // Apply resilience patterns in order: Bulkhead -> Circuit Breaker -> Retry -> Timeout
                let wrappedOperation = operation;
                // 1. Apply timeout if enabled
                if (config.timeout?.enabled) {
                    const timeoutMs = config.timeout.timeoutMs;
                    const originalOperation = wrappedOperation;
                    wrappedOperation = () => this.timeoutService.execute(`${fullOperationName}-timeout`, originalOperation, timeoutMs);
                }
                // 2. Apply retry if enabled
                if (config.retry?.enabled) {
                    const retryConfig = {
                        maxRetries: config.retry.maxRetries,
                        initialDelay: config.retry.initialDelay,
                        backoffMultiplier: config.retry.backoffMultiplier,
                    };
                    const originalOperation = wrappedOperation;
                    wrappedOperation = () => this.retryService.execute(`${fullOperationName}-retry`, originalOperation, retryConfig);
                }
                // 3. Apply circuit breaker if enabled
                if (config.circuitBreaker?.enabled) {
                    const circuitBreakerConfig = {
                        failureThreshold: config.circuitBreaker.failureThreshold,
                        recoveryTimeout: config.circuitBreaker.recoveryTimeout,
                        successThreshold: config.circuitBreaker.successThreshold,
                    };
                    const originalOperation = wrappedOperation;
                    wrappedOperation = () => this.circuitBreakerService.execute(`${fullOperationName}-circuit-breaker`, originalOperation, fallback, circuitBreakerConfig);
                }
                // 4. Apply bulkhead if enabled
                if (config.bulkhead?.enabled) {
                    const bulkheadConfig = {
                        maxConcurrentCalls: config.bulkhead.maxConcurrentCalls,
                        maxWaitingCalls: config.bulkhead.maxWaitingCalls,
                    };
                    const originalOperation = wrappedOperation;
                    wrappedOperation = () => this.bulkheadService.execute(`${fullOperationName}-bulkhead`, originalOperation, bulkheadConfig);
                }
                return await wrappedOperation();
            }
            catch (error) {
                this.logger.error(`Resilience pattern '${patternName}' failed for operation '${operationName}':`, error);
                throw error;
            }
        }
        /**
         * Execute with database-specific resilience pattern
         */
        async executeDatabase(operationName, operation, fallback) {
            return this.execute('database', operationName, operation, fallback);
        }
        /**
         * Execute with external API resilience pattern
         */
        async executeExternalAPI(operationName, operation, fallback) {
            return this.execute('external-api', operationName, operation, fallback);
        }
        /**
         * Execute with internal service resilience pattern
         */
        async executeInternalService(operationName, operation, fallback) {
            return this.execute('internal-service', operationName, operation, fallback);
        }
        /**
         * Execute with file operations resilience pattern
         */
        async executeFileOperation(operationName, operation, fallback) {
            return this.execute('file-operations', operationName, operation, fallback);
        }
        /**
         * Execute with critical operations resilience pattern
         */
        async executeCritical(operationName, operation, fallback) {
            return this.execute('critical', operationName, operation, fallback);
        }
        /**
         * Register a custom resilience pattern
         */
        registerPattern(pattern) {
            this.patterns.set(pattern.name, pattern);
            this.logger.log(`Registered resilience pattern: ${pattern.name}`);
        }
        /**
         * Get pattern configuration
         */
        getPattern(name) {
            return this.patterns.get(name);
        }
        /**
         * Update pattern configuration
         */
        updatePattern(name, config) {
            const pattern = this.patterns.get(name);
            if (!pattern) {
                throw new Error(`Pattern '${name}' not found`);
            }
            pattern.config = { ...pattern.config, ...config };
            this.logger.log(`Updated resilience pattern: ${name}`, pattern.config);
        }
        /**
         * Get comprehensive system health status
         */
        async getSystemHealth() {
            const circuitBreakers = this.circuitBreakerService.getAllStatus();
            const retryMetrics = this.retryService.getAllMetrics();
            const timeoutMetrics = this.timeoutService.getAllMetrics();
            const bulkheadStatus = this.bulkheadService.getSystemStatus();
            // Run health checks for patterns that have them
            const patternHealthChecks = {};
            for (const [name, pattern] of this.patterns) {
                if (pattern.healthCheck) {
                    try {
                        patternHealthChecks[name] = await pattern.healthCheck();
                    }
                    catch (error) {
                        patternHealthChecks[name] = false;
                        this.logger.error(`Health check failed for pattern '${name}':`, error);
                    }
                }
            }
            // Calculate overall health score
            let healthyComponents = 0;
            let totalComponents = 0;
            // Check circuit breakers
            for (const [name, status] of Object.entries(circuitBreakers)) {
                totalComponents++;
                if (status.state === 'closed') {
                    healthyComponents++;
                }
            }
            // Check bulkhead system health
            totalComponents++;
            if (bulkheadStatus.systemHealth === 'healthy') {
                healthyComponents++;
            }
            else if (bulkheadStatus.systemHealth === 'degraded') {
                healthyComponents += 0.5;
            }
            // Check pattern health checks
            for (const [name, isHealthy] of Object.entries(patternHealthChecks)) {
                totalComponents++;
                if (isHealthy) {
                    healthyComponents++;
                }
            }
            const healthScore = totalComponents > 0 ? (healthyComponents / totalComponents) * 100 : 100;
            const systemStatus = healthScore >= 90 ? 'healthy' :
                healthScore >= 70 ? 'degraded' : 'unhealthy';
            return {
                systemStatus,
                healthScore: Math.round(healthScore),
                components: {
                    circuitBreakers,
                    retryMetrics,
                    timeoutMetrics,
                    bulkheadStatus,
                    patternHealthChecks,
                },
                patterns: Array.from(this.patterns.keys()),
                recommendations: this.generateHealthRecommendations(circuitBreakers, bulkheadStatus, systemStatus),
            };
        }
        /**
         * Generate health recommendations based on system status
         */
        generateHealthRecommendations(circuitBreakers, bulkheadStatus, systemStatus) {
            const recommendations = [];
            // Check circuit breaker states
            for (const [name, status] of Object.entries(circuitBreakers)) {
                const cb = status;
                if (cb.state === 'open') {
                    recommendations.push(`Circuit breaker '${name}' is open - investigate service issues`);
                }
                else if (cb.state === 'half_open') {
                    recommendations.push(`Circuit breaker '${name}' is half-open - monitor recovery`);
                }
                if (cb.metrics.failureRate > 10) {
                    recommendations.push(`High failure rate (${cb.metrics.failureRate}%) for '${name}' - check service health`);
                }
            }
            // Check bulkhead status
            if (bulkheadStatus.systemHealth !== 'healthy') {
                recommendations.push('Bulkhead system is experiencing degradation - consider scaling resources');
            }
            if (bulkheadStatus.totalWaitingCalls > 100) {
                recommendations.push('High number of waiting calls - consider increasing bulkhead capacity');
            }
            // General system recommendations
            if (systemStatus === 'unhealthy') {
                recommendations.push('System health is poor - immediate attention required');
                recommendations.push('Consider enabling maintenance mode and reviewing all services');
            }
            else if (systemStatus === 'degraded') {
                recommendations.push('System health is degraded - monitor closely and prepare for scaling');
            }
            if (recommendations.length === 0) {
                recommendations.push('All resilience patterns are operating normally');
            }
            return recommendations;
        }
        /**
         * Initialize default resilience patterns
         */
        initializeDefaultPatterns() {
            // Database operations pattern
            this.registerPattern({
                name: 'database',
                description: 'Resilience pattern for database operations',
                config: {
                    circuitBreaker: {
                        enabled: true,
                        failureThreshold: 5,
                        recoveryTimeout: 30000, // 30 seconds
                        successThreshold: 3,
                    },
                    retry: {
                        enabled: true,
                        maxRetries: 3,
                        initialDelay: 1000,
                        backoffMultiplier: 2,
                    },
                    timeout: {
                        enabled: true,
                        timeoutMs: 30000, // 30 seconds
                    },
                    bulkhead: {
                        enabled: true,
                        maxConcurrentCalls: 20,
                        maxWaitingCalls: 50,
                    },
                },
            });
            // External API calls pattern
            this.registerPattern({
                name: 'external-api',
                description: 'Resilience pattern for external API calls',
                config: {
                    circuitBreaker: {
                        enabled: true,
                        failureThreshold: 3,
                        recoveryTimeout: 60000, // 1 minute
                        successThreshold: 2,
                    },
                    retry: {
                        enabled: true,
                        maxRetries: 5,
                        initialDelay: 2000,
                        backoffMultiplier: 2,
                    },
                    timeout: {
                        enabled: true,
                        timeoutMs: 15000, // 15 seconds
                    },
                    bulkhead: {
                        enabled: true,
                        maxConcurrentCalls: 10,
                        maxWaitingCalls: 20,
                    },
                },
            });
            // Internal service calls pattern
            this.registerPattern({
                name: 'internal-service',
                description: 'Resilience pattern for internal service calls',
                config: {
                    circuitBreaker: {
                        enabled: true,
                        failureThreshold: 5,
                        recoveryTimeout: 20000, // 20 seconds
                        successThreshold: 3,
                    },
                    retry: {
                        enabled: true,
                        maxRetries: 2,
                        initialDelay: 500,
                        backoffMultiplier: 2,
                    },
                    timeout: {
                        enabled: true,
                        timeoutMs: 10000, // 10 seconds
                    },
                    bulkhead: {
                        enabled: true,
                        maxConcurrentCalls: 30,
                        maxWaitingCalls: 60,
                    },
                },
            });
            // File operations pattern
            this.registerPattern({
                name: 'file-operations',
                description: 'Resilience pattern for file operations',
                config: {
                    circuitBreaker: {
                        enabled: true,
                        failureThreshold: 3,
                        recoveryTimeout: 15000, // 15 seconds
                        successThreshold: 2,
                    },
                    retry: {
                        enabled: true,
                        maxRetries: 3,
                        initialDelay: 1000,
                        backoffMultiplier: 1.5,
                    },
                    timeout: {
                        enabled: true,
                        timeoutMs: 60000, // 1 minute for file operations
                    },
                    bulkhead: {
                        enabled: true,
                        maxConcurrentCalls: 5,
                        maxWaitingCalls: 15,
                    },
                },
            });
            // Critical operations pattern
            this.registerPattern({
                name: 'critical',
                description: 'Resilience pattern for critical operations',
                config: {
                    circuitBreaker: {
                        enabled: true,
                        failureThreshold: 2,
                        recoveryTimeout: 10000, // 10 seconds
                        successThreshold: 5,
                    },
                    retry: {
                        enabled: true,
                        maxRetries: 5,
                        initialDelay: 500,
                        backoffMultiplier: 1.2,
                    },
                    timeout: {
                        enabled: true,
                        timeoutMs: 5000, // 5 seconds
                    },
                    bulkhead: {
                        enabled: true,
                        maxConcurrentCalls: 50,
                        maxWaitingCalls: 100,
                    },
                },
            });
            this.logger.log('Initialized default resilience patterns');
        }
        /**
         * Create a protected function wrapper with specified pattern
         */
        protect(patternName, operationName, fn, fallback) {
            return (...args) => {
                const operation = () => fn(...args);
                const fallbackOperation = fallback ? () => fallback(...args) : undefined;
                return this.execute(patternName, operationName, operation, fallbackOperation);
            };
        }
        /**
         * Clear all metrics across all services
         */
        clearAllMetrics() {
            this.retryService.clearAllMetrics();
            this.timeoutService.clearAllMetrics();
            this.bulkheadService.clearAllMetrics();
            // Note: Circuit breaker doesn't have a clearAllMetrics method as it maintains state
            this.logger.log('Cleared all resilience metrics');
        }
        /**
         * Graceful shutdown of all resilience services
         */
        async gracefulShutdown(timeoutMs = 30000) {
            this.logger.log('Starting graceful shutdown of resilience service...');
            const shutdownPromises = [
                this.timeoutService.gracefulShutdown(),
                this.bulkheadService.gracefulShutdown(timeoutMs),
            ];
            try {
                await Promise.allSettled(shutdownPromises);
                this.logger.log('Resilience service graceful shutdown completed');
            }
            catch (error) {
                this.logger.error('Error during resilience service shutdown:', error);
            }
        }
    };
    __setFunctionName(_classThis, "ResilienceService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ResilienceService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ResilienceService = _classThis;
})();
exports.ResilienceService = ResilienceService;
