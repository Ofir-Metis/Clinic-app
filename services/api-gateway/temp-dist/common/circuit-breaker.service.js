"use strict";
/**
 * Circuit Breaker Service
 * Implements circuit breaker pattern for resilient microservice communication
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
exports.CircuitBreakerService = exports.CircuitState = void 0;
const common_1 = require("@nestjs/common");
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
let CircuitBreakerService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CircuitBreakerService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(CircuitBreakerService.name);
            this.circuits = new Map();
            const serviceConfig = this.configService.getServiceConfig();
            this.options = {
                timeout: serviceConfig.circuitBreakerTimeout,
                errorThreshold: serviceConfig.circuitBreakerThreshold,
                resetTimeout: 30000, // 30 seconds
                monitoringPeriod: 60000, // 1 minute
            };
            // Start monitoring circuit breakers
            this.startMonitoring();
        }
        /**
         * Execute a function with circuit breaker protection
         */
        async execute(serviceName, operation, fallback) {
            const circuit = this.getOrCreateCircuit(serviceName);
            // Check if circuit is open
            if (circuit.state === CircuitState.OPEN) {
                if (Date.now() - circuit.lastFailureTime < this.options.resetTimeout) {
                    const error = new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
                    this.logger.warn(`Circuit breaker blocked request to ${serviceName}`);
                    if (fallback) {
                        this.logger.log(`Executing fallback for ${serviceName}`);
                        return await fallback();
                    }
                    throw error;
                }
                else {
                    // Try to close the circuit
                    circuit.state = CircuitState.HALF_OPEN;
                    this.logger.log(`Circuit breaker for ${serviceName} moved to HALF_OPEN state`);
                }
            }
            const startTime = Date.now();
            try {
                // Execute the operation with timeout
                const result = await this.executeWithTimeout(operation, this.options.timeout);
                // Record success
                circuit.successes++;
                circuit.requests++;
                if (circuit.state === CircuitState.HALF_OPEN) {
                    circuit.state = CircuitState.CLOSED;
                    circuit.failures = 0;
                    this.logger.log(`Circuit breaker for ${serviceName} moved to CLOSED state`);
                }
                const duration = Date.now() - startTime;
                this.logger.debug(`Service call to ${serviceName} succeeded in ${duration}ms`);
                return result;
            }
            catch (error) {
                // Record failure
                circuit.failures++;
                circuit.requests++;
                circuit.lastFailureTime = Date.now();
                const errorRate = circuit.failures / circuit.requests;
                // Check if we should open the circuit
                if (circuit.failures >= this.options.errorThreshold && errorRate >= 0.5) {
                    circuit.state = CircuitState.OPEN;
                    this.logger.error(`Circuit breaker for ${serviceName} moved to OPEN state. Failures: ${circuit.failures}, Error rate: ${(errorRate * 100).toFixed(1)}%`);
                }
                const duration = Date.now() - startTime;
                this.logger.error(`Service call to ${serviceName} failed after ${duration}ms:`, error.message);
                if (fallback) {
                    this.logger.log(`Executing fallback for ${serviceName}`);
                    try {
                        return await fallback();
                    }
                    catch (fallbackError) {
                        this.logger.error(`Fallback for ${serviceName} also failed:`, fallbackError.message);
                        throw error; // Throw original error
                    }
                }
                throw error;
            }
        }
        /**
         * Get circuit breaker statistics for a service
         */
        getStats(serviceName) {
            const circuit = this.circuits.get(serviceName);
            if (!circuit)
                return null;
            const errorRate = circuit.requests > 0 ? circuit.failures / circuit.requests : 0;
            return {
                state: circuit.state,
                failures: circuit.failures,
                successes: circuit.successes,
                requests: circuit.requests,
                errorRate: Math.round(errorRate * 100) / 100,
                lastFailureTime: circuit.lastFailureTime ? new Date(circuit.lastFailureTime) : undefined,
                nextAttempt: circuit.state === CircuitState.OPEN && circuit.lastFailureTime
                    ? new Date(circuit.lastFailureTime + this.options.resetTimeout)
                    : undefined,
            };
        }
        /**
         * Get all circuit breaker statistics
         */
        getAllStats() {
            const stats = {};
            for (const [serviceName] of this.circuits) {
                const serviceStats = this.getStats(serviceName);
                if (serviceStats) {
                    stats[serviceName] = serviceStats;
                }
            }
            return stats;
        }
        /**
         * Reset circuit breaker for a service
         */
        reset(serviceName) {
            const circuit = this.circuits.get(serviceName);
            if (circuit) {
                circuit.state = CircuitState.CLOSED;
                circuit.failures = 0;
                circuit.successes = 0;
                circuit.requests = 0;
                circuit.lastFailureTime = 0;
                this.logger.log(`Circuit breaker for ${serviceName} has been reset`);
            }
        }
        /**
         * Reset all circuit breakers
         */
        resetAll() {
            for (const [serviceName] of this.circuits) {
                this.reset(serviceName);
            }
            this.logger.log('All circuit breakers have been reset');
        }
        getOrCreateCircuit(serviceName) {
            if (!this.circuits.has(serviceName)) {
                this.circuits.set(serviceName, {
                    state: CircuitState.CLOSED,
                    failures: 0,
                    successes: 0,
                    requests: 0,
                    lastFailureTime: 0,
                });
                this.logger.log(`Created new circuit breaker for service: ${serviceName}`);
            }
            return this.circuits.get(serviceName);
        }
        async executeWithTimeout(operation, timeout) {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    reject(new Error(`Operation timed out after ${timeout}ms`));
                }, timeout);
                operation()
                    .then((result) => {
                    clearTimeout(timer);
                    resolve(result);
                })
                    .catch((error) => {
                    clearTimeout(timer);
                    reject(error);
                });
            });
        }
        startMonitoring() {
            setInterval(() => {
                this.resetStatistics();
                this.logCircuitBreakerStats();
            }, this.options.monitoringPeriod);
        }
        resetStatistics() {
            // Reset statistics every monitoring period to prevent memory growth
            // and provide rolling window statistics
            for (const [serviceName, circuit] of this.circuits) {
                if (circuit.state === CircuitState.CLOSED && circuit.requests > 100) {
                    // Keep some history but prevent unbounded growth
                    circuit.failures = Math.floor(circuit.failures * 0.9);
                    circuit.successes = Math.floor(circuit.successes * 0.9);
                    circuit.requests = circuit.failures + circuit.successes;
                }
            }
        }
        logCircuitBreakerStats() {
            const stats = this.getAllStats();
            const activeCircuits = Object.keys(stats).length;
            if (activeCircuits > 0) {
                this.logger.debug(`Circuit Breaker Status - ${activeCircuits} active circuits`);
                for (const [serviceName, stat] of Object.entries(stats)) {
                    if (stat.state !== CircuitState.CLOSED || stat.failures > 0) {
                        this.logger.debug(`  ${serviceName}: ${stat.state} - Requests: ${stat.requests}, Failures: ${stat.failures}, Error Rate: ${(stat.errorRate * 100).toFixed(1)}%`);
                    }
                }
            }
        }
    };
    __setFunctionName(_classThis, "CircuitBreakerService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CircuitBreakerService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CircuitBreakerService = _classThis;
})();
exports.CircuitBreakerService = CircuitBreakerService;
