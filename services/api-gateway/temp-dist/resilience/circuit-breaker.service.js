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
exports.CircuitBreakerService = exports.CircuitBreakerState = void 0;
const common_1 = require("@nestjs/common");
var CircuitBreakerState;
(function (CircuitBreakerState) {
    CircuitBreakerState["CLOSED"] = "closed";
    CircuitBreakerState["OPEN"] = "open";
    CircuitBreakerState["HALF_OPEN"] = "half_open";
})(CircuitBreakerState || (exports.CircuitBreakerState = CircuitBreakerState = {}));
let CircuitBreakerService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var CircuitBreakerService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(CircuitBreakerService.name);
            this.circuitBreakers = new Map();
        }
        /**
         * Create or get a circuit breaker for a specific service/operation
         */
        getCircuitBreaker(name, config) {
            if (!this.circuitBreakers.has(name)) {
                this.createCircuitBreaker(name, config);
            }
            return this.circuitBreakers.get(name);
        }
        /**
         * Execute a function with circuit breaker protection
         */
        async execute(circuitBreakerName, operation, fallback, config) {
            const breaker = this.getCircuitBreaker(circuitBreakerName, config);
            // Check if circuit breaker allows the call
            if (!this.canExecute(breaker)) {
                this.logger.warn(`Circuit breaker ${circuitBreakerName} is OPEN - calling fallback`);
                if (fallback) {
                    return await fallback();
                }
                throw new Error(`Circuit breaker ${circuitBreakerName} is OPEN and no fallback provided`);
            }
            const startTime = Date.now();
            let success = false;
            try {
                // Set timeout for the operation
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Operation timeout')), breaker.config.timeout);
                });
                const result = await Promise.race([operation(), timeoutPromise]);
                success = true;
                const duration = Date.now() - startTime;
                this.recordSuccess(breaker, duration);
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                this.recordFailure(breaker, error, duration);
                // If fallback is available and we should use it
                if (fallback && this.shouldUseFallback(breaker, error)) {
                    this.logger.warn(`Operation failed, using fallback for ${circuitBreakerName}:`, error);
                    return await fallback();
                }
                throw error;
            }
        }
        /**
         * Create a new circuit breaker with default configuration
         */
        createCircuitBreaker(name, configOverrides) {
            const defaultConfig = {
                failureThreshold: this.configService.get('CIRCUIT_BREAKER_FAILURE_THRESHOLD', 5),
                recoveryTimeout: this.configService.get('CIRCUIT_BREAKER_RECOVERY_TIMEOUT', 60000), // 1 minute
                successThreshold: this.configService.get('CIRCUIT_BREAKER_SUCCESS_THRESHOLD', 3),
                timeout: this.configService.get('CIRCUIT_BREAKER_TIMEOUT', 30000), // 30 seconds
                monitoringPeriod: this.configService.get('CIRCUIT_BREAKER_MONITORING_PERIOD', 60000), // 1 minute
                slowCallThreshold: this.configService.get('CIRCUIT_BREAKER_SLOW_CALL_THRESHOLD', 5000), // 5 seconds
                slowCallRateThreshold: this.configService.get('CIRCUIT_BREAKER_SLOW_CALL_RATE_THRESHOLD', 0.5), // 50%
                minimumCalls: this.configService.get('CIRCUIT_BREAKER_MINIMUM_CALLS', 10),
            };
            const config = { ...defaultConfig, ...configOverrides };
            const breaker = {
                state: CircuitBreakerState.CLOSED,
                config,
                metrics: {
                    totalCalls: 0,
                    successfulCalls: 0,
                    failedCalls: 0,
                    slowCalls: 0,
                    stateTransitions: [],
                },
                lastStateChange: new Date(),
                consecutiveSuccesses: 0,
            };
            this.circuitBreakers.set(name, breaker);
            this.logger.log(`Created circuit breaker: ${name}`, config);
        }
        /**
         * Check if the circuit breaker allows execution
         */
        canExecute(breaker) {
            const now = new Date();
            switch (breaker.state) {
                case CircuitBreakerState.CLOSED:
                    return true;
                case CircuitBreakerState.OPEN:
                    // Check if recovery timeout has passed
                    if (breaker.nextAttemptTime && now >= breaker.nextAttemptTime) {
                        this.transitionTo(breaker, CircuitBreakerState.HALF_OPEN, 'Recovery timeout elapsed');
                        return true;
                    }
                    return false;
                case CircuitBreakerState.HALF_OPEN:
                    return true;
                default:
                    return false;
            }
        }
        /**
         * Record a successful operation
         */
        recordSuccess(breaker, duration) {
            breaker.metrics.totalCalls++;
            breaker.metrics.successfulCalls++;
            breaker.metrics.lastSuccessTime = new Date();
            if (duration > breaker.config.slowCallThreshold) {
                breaker.metrics.slowCalls++;
            }
            // Handle state transitions based on success
            if (breaker.state === CircuitBreakerState.HALF_OPEN) {
                breaker.consecutiveSuccesses++;
                if (breaker.consecutiveSuccesses >= breaker.config.successThreshold) {
                    this.transitionTo(breaker, CircuitBreakerState.CLOSED, 'Sufficient successful calls in half-open state');
                }
            }
            // Reset consecutive successes if we're in closed state
            if (breaker.state === CircuitBreakerState.CLOSED) {
                breaker.consecutiveSuccesses = 0;
            }
            this.evaluateCircuitState(breaker);
        }
        /**
         * Record a failed operation
         */
        recordFailure(breaker, error, duration) {
            breaker.metrics.totalCalls++;
            breaker.metrics.failedCalls++;
            breaker.metrics.lastFailureTime = new Date();
            if (duration > breaker.config.slowCallThreshold) {
                breaker.metrics.slowCalls++;
            }
            // Reset consecutive successes on failure
            breaker.consecutiveSuccesses = 0;
            // If we're in half-open state, go back to open on any failure
            if (breaker.state === CircuitBreakerState.HALF_OPEN) {
                this.transitionTo(breaker, CircuitBreakerState.OPEN, `Failure in half-open state: ${error.message}`);
                return;
            }
            this.evaluateCircuitState(breaker);
        }
        /**
         * Evaluate if circuit state should change based on current metrics
         */
        evaluateCircuitState(breaker) {
            const metrics = breaker.metrics;
            const config = breaker.config;
            // Only evaluate if we have minimum number of calls
            if (metrics.totalCalls < config.minimumCalls) {
                return;
            }
            // Calculate failure rate within monitoring period
            const now = new Date();
            const monitoringPeriodStart = new Date(now.getTime() - config.monitoringPeriod);
            // For simplicity, we'll use overall failure rate
            // In production, you might want to maintain a sliding window
            const failureRate = metrics.failedCalls / metrics.totalCalls;
            const slowCallRate = metrics.slowCalls / metrics.totalCalls;
            // Check if we should open the circuit
            if (breaker.state === CircuitBreakerState.CLOSED) {
                const shouldOpen = (failureRate >= (config.failureThreshold / 100) ||
                    slowCallRate >= config.slowCallRateThreshold);
                if (shouldOpen) {
                    const reason = failureRate >= (config.failureThreshold / 100)
                        ? `High failure rate: ${(failureRate * 100).toFixed(2)}%`
                        : `High slow call rate: ${(slowCallRate * 100).toFixed(2)}%`;
                    this.transitionTo(breaker, CircuitBreakerState.OPEN, reason);
                }
            }
        }
        /**
         * Transition circuit breaker to a new state
         */
        transitionTo(breaker, newState, reason) {
            const oldState = breaker.state;
            breaker.state = newState;
            breaker.lastStateChange = new Date();
            // Set next attempt time for open state
            if (newState === CircuitBreakerState.OPEN) {
                breaker.nextAttemptTime = new Date(Date.now() + breaker.config.recoveryTimeout);
            }
            else {
                breaker.nextAttemptTime = undefined;
            }
            // Record state transition
            breaker.metrics.stateTransitions.push({
                from: oldState,
                to: newState,
                timestamp: new Date(),
                reason,
            });
            // Keep only last 100 transitions
            if (breaker.metrics.stateTransitions.length > 100) {
                breaker.metrics.stateTransitions = breaker.metrics.stateTransitions.slice(-100);
            }
            this.logger.warn(`Circuit breaker state transition: ${oldState} -> ${newState}. Reason: ${reason}`);
        }
        /**
         * Determine if fallback should be used based on error type
         */
        shouldUseFallback(breaker, error) {
            // Use fallback for timeouts and network errors
            const useFallbackErrors = [
                'Operation timeout',
                'ECONNREFUSED',
                'ENOTFOUND',
                'ETIMEDOUT',
                'ECONNRESET',
            ];
            return useFallbackErrors.some(errorType => error.message.includes(errorType) || error.name.includes(errorType));
        }
        /**
         * Get circuit breaker status and metrics
         */
        getStatus(name) {
            const breaker = this.circuitBreakers.get(name);
            if (!breaker) {
                return null;
            }
            const metrics = breaker.metrics;
            const failureRate = metrics.totalCalls > 0 ? (metrics.failedCalls / metrics.totalCalls) * 100 : 0;
            const successRate = metrics.totalCalls > 0 ? (metrics.successfulCalls / metrics.totalCalls) * 100 : 0;
            const slowCallRate = metrics.totalCalls > 0 ? (metrics.slowCalls / metrics.totalCalls) * 100 : 0;
            return {
                name,
                state: breaker.state,
                config: breaker.config,
                metrics: {
                    ...metrics,
                    failureRate: Number(failureRate.toFixed(2)),
                    successRate: Number(successRate.toFixed(2)),
                    slowCallRate: Number(slowCallRate.toFixed(2)),
                },
                lastStateChange: breaker.lastStateChange,
                nextAttemptTime: breaker.nextAttemptTime,
                consecutiveSuccesses: breaker.consecutiveSuccesses,
            };
        }
        /**
         * Get all circuit breakers status
         */
        getAllStatus() {
            const statuses = {};
            for (const [name] of this.circuitBreakers) {
                statuses[name] = this.getStatus(name);
            }
            return statuses;
        }
        /**
         * Reset a circuit breaker (useful for testing or manual intervention)
         */
        reset(name) {
            const breaker = this.circuitBreakers.get(name);
            if (!breaker) {
                throw new Error(`Circuit breaker ${name} not found`);
            }
            breaker.state = CircuitBreakerState.CLOSED;
            breaker.metrics = {
                totalCalls: 0,
                successfulCalls: 0,
                failedCalls: 0,
                slowCalls: 0,
                stateTransitions: [],
            };
            breaker.lastStateChange = new Date();
            breaker.nextAttemptTime = undefined;
            breaker.consecutiveSuccesses = 0;
            this.logger.log(`Reset circuit breaker: ${name}`);
        }
        /**
         * Force circuit breaker to open state (useful for maintenance)
         */
        forceOpen(name, reason = 'Manual intervention') {
            const breaker = this.circuitBreakers.get(name);
            if (!breaker) {
                throw new Error(`Circuit breaker ${name} not found`);
            }
            this.transitionTo(breaker, CircuitBreakerState.OPEN, reason);
        }
        /**
         * Force circuit breaker to closed state
         */
        forceClosed(name, reason = 'Manual intervention') {
            const breaker = this.circuitBreakers.get(name);
            if (!breaker) {
                throw new Error(`Circuit breaker ${name} not found`);
            }
            this.transitionTo(breaker, CircuitBreakerState.CLOSED, reason);
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
