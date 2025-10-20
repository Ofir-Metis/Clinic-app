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
exports.TimeoutService = exports.TimeoutError = void 0;
const common_1 = require("@nestjs/common");
class TimeoutError extends Error {
    constructor(message, timeoutMs, operationName) {
        super(message);
        this.timeoutMs = timeoutMs;
        this.operationName = operationName;
        this.name = 'TimeoutError';
    }
}
exports.TimeoutError = TimeoutError;
let TimeoutService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var TimeoutService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(TimeoutService.name);
            this.timeoutMetrics = new Map();
            this.activeTimeouts = new Set();
            this.config = {
                defaultTimeout: this.configService.get('TIMEOUT_DEFAULT', 30000), // 30 seconds
                gracefulShutdownTimeout: this.configService.get('TIMEOUT_GRACEFUL_SHUTDOWN', 10000), // 10 seconds
                maxConcurrentTimeouts: this.configService.get('TIMEOUT_MAX_CONCURRENT', 1000),
            };
        }
        /**
         * Execute an operation with timeout
         */
        async execute(operationName, operation, timeoutMs, onTimeout) {
            const timeout = timeoutMs || this.config.defaultTimeout;
            const startTime = Date.now();
            // Initialize metrics if not exists
            if (!this.timeoutMetrics.has(operationName)) {
                this.timeoutMetrics.set(operationName, {
                    totalOperations: 0,
                    timedOutOperations: 0,
                    successfulOperations: 0,
                    averageExecutionTime: 0,
                    timeoutRate: 0,
                });
            }
            const metrics = this.timeoutMetrics.get(operationName);
            metrics.totalOperations++;
            // Check if we've reached max concurrent timeouts
            if (this.activeTimeouts.size >= this.config.maxConcurrentTimeouts) {
                this.logger.warn(`Maximum concurrent timeouts reached (${this.config.maxConcurrentTimeouts}), ` +
                    `executing operation '${operationName}' without timeout`);
                try {
                    const result = await operation();
                    this.updateSuccessMetrics(metrics, Date.now() - startTime);
                    return result;
                }
                catch (error) {
                    throw error;
                }
            }
            return new Promise((resolve, reject) => {
                let isCompleted = false;
                // Create timeout handler
                const timeoutHandle = setTimeout(() => {
                    if (!isCompleted) {
                        isCompleted = true;
                        this.activeTimeouts.delete(timeoutHandle);
                        // Update timeout metrics
                        metrics.timedOutOperations++;
                        this.updateTimeoutRate(metrics);
                        // Call timeout callback if provided
                        if (onTimeout) {
                            try {
                                onTimeout();
                            }
                            catch (callbackError) {
                                this.logger.error('Error in timeout callback:', callbackError);
                            }
                        }
                        const error = new TimeoutError(`Operation '${operationName}' timed out after ${timeout}ms`, timeout, operationName);
                        this.logger.error(error.message);
                        reject(error);
                    }
                }, timeout);
                this.activeTimeouts.add(timeoutHandle);
                // Execute the operation
                operation()
                    .then(result => {
                    if (!isCompleted) {
                        isCompleted = true;
                        clearTimeout(timeoutHandle);
                        this.activeTimeouts.delete(timeoutHandle);
                        // Update success metrics
                        this.updateSuccessMetrics(metrics, Date.now() - startTime);
                        resolve(result);
                    }
                })
                    .catch(error => {
                    if (!isCompleted) {
                        isCompleted = true;
                        clearTimeout(timeoutHandle);
                        this.activeTimeouts.delete(timeoutHandle);
                        reject(error);
                    }
                });
            });
        }
        /**
         * Execute with adaptive timeout based on historical performance
         */
        async executeWithAdaptiveTimeout(operationName, operation, baseTimeoutMs, adaptiveFactor = 1.5) {
            const baseTimeout = baseTimeoutMs || this.config.defaultTimeout;
            const metrics = this.timeoutMetrics.get(operationName);
            let adaptiveTimeout = baseTimeout;
            if (metrics && metrics.averageExecutionTime > 0) {
                // Use average execution time with a multiplier as adaptive timeout
                adaptiveTimeout = Math.max(Math.min(metrics.averageExecutionTime * adaptiveFactor, baseTimeout * 2), baseTimeout * 0.5);
                this.logger.debug(`Using adaptive timeout for '${operationName}': ${adaptiveTimeout}ms ` +
                    `(avg: ${metrics.averageExecutionTime}ms, base: ${baseTimeout}ms)`);
            }
            return this.execute(operationName, operation, adaptiveTimeout);
        }
        /**
         * Execute with progressive timeout (starts with short timeout, increases on retries)
         */
        async executeWithProgressiveTimeout(operationName, operation, baseTimeoutMs = 5000, maxTimeoutMs = 30000, timeoutMultiplier = 2, maxAttempts = 3) {
            let currentTimeout = baseTimeoutMs;
            let lastError;
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    return await this.execute(`${operationName}-progressive-${attempt}`, operation, currentTimeout);
                }
                catch (error) {
                    lastError = error;
                    // If it's not a timeout error or this is the last attempt, throw
                    if (!(error instanceof TimeoutError) || attempt === maxAttempts) {
                        throw error;
                    }
                    // Increase timeout for next attempt
                    currentTimeout = Math.min(currentTimeout * timeoutMultiplier, maxTimeoutMs);
                    this.logger.warn(`Progressive timeout attempt ${attempt} failed for '${operationName}', ` +
                        `increasing timeout to ${currentTimeout}ms`);
                }
            }
            throw lastError;
        }
        /**
         * Execute multiple operations concurrently with timeout
         */
        async executeAll(operations, globalTimeoutMs) {
            const promises = operations.map(({ name, operation, timeout }) => this.execute(name, operation, timeout));
            if (globalTimeoutMs) {
                const globalTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new TimeoutError(`Global timeout of ${globalTimeoutMs}ms exceeded for batch operations`, globalTimeoutMs, 'batch-operations'));
                    }, globalTimeoutMs);
                });
                return Promise.race([
                    Promise.all(promises),
                    globalTimeoutPromise
                ]);
            }
            return Promise.all(promises);
        }
        /**
         * Execute with race condition (first successful result wins)
         */
        async executeRace(operations, globalTimeoutMs) {
            const promises = operations.map(({ name, operation, timeout }) => this.execute(name, operation, timeout));
            if (globalTimeoutMs) {
                const globalTimeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new TimeoutError(`Global timeout of ${globalTimeoutMs}ms exceeded for race operations`, globalTimeoutMs, 'race-operations'));
                    }, globalTimeoutMs);
                });
                return Promise.race([
                    Promise.race(promises),
                    globalTimeoutPromise
                ]);
            }
            return Promise.race(promises);
        }
        /**
         * Create a timeout-wrapped function
         */
        wrap(operationName, fn, timeoutMs) {
            return (...args) => {
                return this.execute(operationName, () => fn(...args), timeoutMs);
            };
        }
        /**
         * Set timeout for a promise
         */
        static promiseTimeout(promise, timeoutMs, errorMessage) {
            return new Promise((resolve, reject) => {
                const timeoutHandle = setTimeout(() => {
                    reject(new TimeoutError(errorMessage || `Promise timed out after ${timeoutMs}ms`, timeoutMs));
                }, timeoutMs);
                promise
                    .then(result => {
                    clearTimeout(timeoutHandle);
                    resolve(result);
                })
                    .catch(error => {
                    clearTimeout(timeoutHandle);
                    reject(error);
                });
            });
        }
        /**
         * Update success metrics
         */
        updateSuccessMetrics(metrics, executionTime) {
            metrics.successfulOperations++;
            // Update average execution time using exponential moving average
            if (metrics.averageExecutionTime === 0) {
                metrics.averageExecutionTime = executionTime;
            }
            else {
                const alpha = 0.1; // Smoothing factor
                metrics.averageExecutionTime =
                    alpha * executionTime + (1 - alpha) * metrics.averageExecutionTime;
            }
            this.updateTimeoutRate(metrics);
        }
        /**
         * Update timeout rate
         */
        updateTimeoutRate(metrics) {
            if (metrics.totalOperations > 0) {
                metrics.timeoutRate = (metrics.timedOutOperations / metrics.totalOperations) * 100;
            }
        }
        /**
         * Get timeout metrics for an operation
         */
        getMetrics(operationName) {
            return this.timeoutMetrics.get(operationName) || null;
        }
        /**
         * Get all timeout metrics
         */
        getAllMetrics() {
            const allMetrics = {};
            for (const [name, metrics] of this.timeoutMetrics) {
                allMetrics[name] = { ...metrics };
            }
            return allMetrics;
        }
        /**
         * Get current timeout configuration
         */
        getConfig() {
            return { ...this.config };
        }
        /**
         * Update timeout configuration
         */
        updateConfig(newConfig) {
            this.config = { ...this.config, ...newConfig };
            this.logger.log('Timeout configuration updated', this.config);
        }
        /**
         * Get active timeout count
         */
        getActiveTimeoutCount() {
            return this.activeTimeouts.size;
        }
        /**
         * Clear all active timeouts (useful for graceful shutdown)
         */
        clearAllTimeouts() {
            for (const timeout of this.activeTimeouts) {
                clearTimeout(timeout);
            }
            this.activeTimeouts.clear();
            this.logger.log('All active timeouts cleared');
        }
        /**
         * Clear metrics for an operation
         */
        clearMetrics(operationName) {
            this.timeoutMetrics.delete(operationName);
        }
        /**
         * Clear all metrics
         */
        clearAllMetrics() {
            this.timeoutMetrics.clear();
        }
        /**
         * Graceful shutdown
         */
        async gracefulShutdown() {
            this.logger.log('Starting graceful shutdown of timeout service...');
            const shutdownPromise = new Promise((resolve) => {
                if (this.activeTimeouts.size === 0) {
                    resolve();
                    return;
                }
                // Wait for active operations to complete or timeout
                const checkInterval = setInterval(() => {
                    if (this.activeTimeouts.size === 0) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
            try {
                await TimeoutService.promiseTimeout(shutdownPromise, this.config.gracefulShutdownTimeout, 'Graceful shutdown timeout exceeded');
                this.logger.log('Graceful shutdown completed');
            }
            catch (error) {
                this.logger.warn('Graceful shutdown timeout, forcing cleanup');
                this.clearAllTimeouts();
            }
        }
    };
    __setFunctionName(_classThis, "TimeoutService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TimeoutService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TimeoutService = _classThis;
})();
exports.TimeoutService = TimeoutService;
