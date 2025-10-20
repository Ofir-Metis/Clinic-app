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
exports.BulkheadService = exports.BulkheadRejectionError = void 0;
const common_1 = require("@nestjs/common");
class BulkheadRejectionError extends Error {
    constructor(message, bulkheadName) {
        super(message);
        this.bulkheadName = bulkheadName;
        this.name = 'BulkheadRejectionError';
    }
}
exports.BulkheadRejectionError = BulkheadRejectionError;
let BulkheadService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var BulkheadService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(BulkheadService.name);
            this.bulkheads = new Map();
        }
        /**
         * Create or get a bulkhead for a specific resource/operation
         */
        getBulkhead(name, config) {
            if (!this.bulkheads.has(name)) {
                this.createBulkhead(name, config);
            }
            return this.bulkheads.get(name);
        }
        /**
         * Execute an operation with bulkhead isolation
         */
        async execute(bulkheadName, operation, config) {
            const bulkhead = this.getBulkhead(bulkheadName, config);
            const startTime = Date.now();
            bulkhead.metrics.totalCalls++;
            // Check if we can execute immediately
            if (bulkhead.activeCalls.size < bulkhead.config.maxConcurrentCalls) {
                return this.executeImmediate(bulkhead, operation, startTime);
            }
            // Check if we can queue the request
            if (bulkhead.waitingQueue.length >= bulkhead.config.maxWaitingCalls) {
                bulkhead.metrics.rejectedCalls++;
                this.updateRejectionRate(bulkhead.metrics);
                const error = new BulkheadRejectionError(`Bulkhead '${bulkheadName}' is full. Active: ${bulkhead.activeCalls.size}, ` +
                    `Waiting: ${bulkhead.waitingQueue.length}, Max waiting: ${bulkhead.config.maxWaitingCalls}`, bulkheadName);
                this.logger.warn(error.message);
                throw error;
            }
            // Queue the request
            return this.executeQueued(bulkhead, operation, startTime, bulkheadName);
        }
        /**
         * Execute operation immediately
         */
        async executeImmediate(bulkhead, operation, startTime) {
            const promise = this.executeWithTracking(bulkhead, operation, startTime);
            bulkhead.activeCalls.add(promise);
            try {
                return await promise;
            }
            finally {
                bulkhead.activeCalls.delete(promise);
                this.processQueue(bulkhead);
            }
        }
        /**
         * Execute operation from queue
         */
        executeQueued(bulkhead, operation, startTime, bulkheadName) {
            return new Promise((resolve, reject) => {
                const callRequest = {
                    operation,
                    resolve,
                    reject,
                    timestamp: startTime,
                };
                // Set timeout for waiting in queue
                if (bulkhead.config.timeout > 0) {
                    callRequest.timeoutHandle = setTimeout(() => {
                        // Remove from queue if still there
                        const index = bulkhead.waitingQueue.indexOf(callRequest);
                        if (index !== -1) {
                            bulkhead.waitingQueue.splice(index, 1);
                            bulkhead.metrics.rejectedCalls++;
                            this.updateRejectionRate(bulkhead.metrics);
                            reject(new BulkheadRejectionError(`Bulkhead '${bulkheadName}' queue timeout after ${bulkhead.config.timeout}ms`, bulkheadName));
                        }
                    }, bulkhead.config.timeout);
                }
                bulkhead.waitingQueue.push(callRequest);
                bulkhead.metrics.currentWaitingCalls = bulkhead.waitingQueue.length;
            });
        }
        /**
         * Execute operation with performance tracking
         */
        async executeWithTracking(bulkhead, operation, startTime) {
            bulkhead.metrics.currentActiveCalls = bulkhead.activeCalls.size;
            try {
                const result = await operation();
                const executionTime = Date.now() - startTime;
                bulkhead.metrics.successfulCalls++;
                this.updateAverageExecutionTime(bulkhead.metrics, executionTime);
                return result;
            }
            catch (error) {
                bulkhead.metrics.failedCalls++;
                // If isolate failures is enabled, we might want to temporarily reduce capacity
                if (bulkhead.config.isolateFailures) {
                    this.handleFailureIsolation(bulkhead, error);
                }
                throw error;
            }
            finally {
                bulkhead.metrics.currentActiveCalls = bulkhead.activeCalls.size - 1;
            }
        }
        /**
         * Process the waiting queue
         */
        processQueue(bulkhead) {
            while (bulkhead.waitingQueue.length > 0 &&
                bulkhead.activeCalls.size < bulkhead.config.maxConcurrentCalls) {
                const callRequest = bulkhead.waitingQueue.shift();
                bulkhead.metrics.currentWaitingCalls = bulkhead.waitingQueue.length;
                // Clear timeout if set
                if (callRequest.timeoutHandle) {
                    clearTimeout(callRequest.timeoutHandle);
                }
                // Calculate wait time
                const waitTime = Date.now() - callRequest.timestamp;
                bulkhead.metrics.maxWaitTime = Math.max(bulkhead.metrics.maxWaitTime, waitTime);
                // Execute the operation
                const promise = this.executeWithTracking(bulkhead, callRequest.operation, callRequest.timestamp);
                bulkhead.activeCalls.add(promise);
                promise
                    .then(result => {
                    callRequest.resolve(result);
                })
                    .catch(error => {
                    callRequest.reject(error);
                })
                    .finally(() => {
                    bulkhead.activeCalls.delete(promise);
                    this.processQueue(bulkhead);
                });
            }
        }
        /**
         * Handle failure isolation
         */
        handleFailureIsolation(bulkhead, error) {
            // Log failure for monitoring
            this.logger.warn(`Bulkhead failure isolation triggered:`, error.message);
            // Could implement more sophisticated failure isolation here:
            // - Temporarily reduce max concurrent calls
            // - Increase timeouts
            // - Apply exponential backoff
        }
        /**
         * Create a new bulkhead with configuration
         */
        createBulkhead(name, configOverrides) {
            const defaultConfig = {
                maxConcurrentCalls: this.configService.get('BULKHEAD_MAX_CONCURRENT_CALLS', 10),
                maxWaitingCalls: this.configService.get('BULKHEAD_MAX_WAITING_CALLS', 20),
                timeout: this.configService.get('BULKHEAD_TIMEOUT', 30000), // 30 seconds
                isolateFailures: this.configService.get('BULKHEAD_ISOLATE_FAILURES', true),
            };
            const config = { ...defaultConfig, ...configOverrides };
            const bulkhead = {
                config,
                metrics: {
                    totalCalls: 0,
                    successfulCalls: 0,
                    failedCalls: 0,
                    rejectedCalls: 0,
                    currentActiveCalls: 0,
                    currentWaitingCalls: 0,
                    averageExecutionTime: 0,
                    maxWaitTime: 0,
                    rejectionRate: 0,
                },
                activeCalls: new Set(),
                waitingQueue: [],
            };
            this.bulkheads.set(name, bulkhead);
            this.logger.log(`Created bulkhead: ${name}`, config);
        }
        /**
         * Update average execution time using exponential moving average
         */
        updateAverageExecutionTime(metrics, executionTime) {
            if (metrics.averageExecutionTime === 0) {
                metrics.averageExecutionTime = executionTime;
            }
            else {
                const alpha = 0.1; // Smoothing factor
                metrics.averageExecutionTime =
                    alpha * executionTime + (1 - alpha) * metrics.averageExecutionTime;
            }
        }
        /**
         * Update rejection rate
         */
        updateRejectionRate(metrics) {
            if (metrics.totalCalls > 0) {
                metrics.rejectionRate = (metrics.rejectedCalls / metrics.totalCalls) * 100;
            }
        }
        /**
         * Get bulkhead status and metrics
         */
        getStatus(name) {
            const bulkhead = this.bulkheads.get(name);
            if (!bulkhead) {
                return null;
            }
            return {
                name,
                config: bulkhead.config,
                metrics: { ...bulkhead.metrics },
                activeCallsCount: bulkhead.activeCalls.size,
                waitingQueueLength: bulkhead.waitingQueue.length,
                utilizationRate: (bulkhead.activeCalls.size / bulkhead.config.maxConcurrentCalls) * 100,
            };
        }
        /**
         * Get all bulkheads status
         */
        getAllStatus() {
            const statuses = {};
            for (const [name] of this.bulkheads) {
                statuses[name] = this.getStatus(name);
            }
            return statuses;
        }
        /**
         * Update bulkhead configuration
         */
        updateConfig(name, newConfig) {
            const bulkhead = this.bulkheads.get(name);
            if (!bulkhead) {
                throw new Error(`Bulkhead ${name} not found`);
            }
            bulkhead.config = { ...bulkhead.config, ...newConfig };
            this.logger.log(`Updated bulkhead configuration: ${name}`, bulkhead.config);
        }
        /**
         * Clear bulkhead metrics
         */
        clearMetrics(name) {
            const bulkhead = this.bulkheads.get(name);
            if (!bulkhead) {
                throw new Error(`Bulkhead ${name} not found`);
            }
            bulkhead.metrics = {
                totalCalls: 0,
                successfulCalls: 0,
                failedCalls: 0,
                rejectedCalls: 0,
                currentActiveCalls: bulkhead.activeCalls.size,
                currentWaitingCalls: bulkhead.waitingQueue.length,
                averageExecutionTime: 0,
                maxWaitTime: 0,
                rejectionRate: 0,
            };
            this.logger.log(`Cleared metrics for bulkhead: ${name}`);
        }
        /**
         * Clear all metrics
         */
        clearAllMetrics() {
            for (const [name, bulkhead] of this.bulkheads) {
                bulkhead.metrics = {
                    totalCalls: 0,
                    successfulCalls: 0,
                    failedCalls: 0,
                    rejectedCalls: 0,
                    currentActiveCalls: bulkhead.activeCalls.size,
                    currentWaitingCalls: bulkhead.waitingQueue.length,
                    averageExecutionTime: 0,
                    maxWaitTime: 0,
                    rejectionRate: 0,
                };
            }
            this.logger.log('Cleared all bulkhead metrics');
        }
        /**
         * Force clear all waiting queues (useful for shutdown)
         */
        clearAllQueues() {
            for (const [name, bulkhead] of this.bulkheads) {
                bulkhead.waitingQueue.forEach(request => {
                    if (request.timeoutHandle) {
                        clearTimeout(request.timeoutHandle);
                    }
                    request.reject(new BulkheadRejectionError(`Bulkhead '${name}' is being shut down`, name));
                });
                bulkhead.waitingQueue.length = 0;
                bulkhead.metrics.currentWaitingCalls = 0;
            }
            this.logger.log('Cleared all bulkhead queues');
        }
        /**
         * Get overall system status
         */
        getSystemStatus() {
            let totalActiveCalls = 0;
            let totalWaitingCalls = 0;
            let totalBulkheads = 0;
            let healthyBulkheads = 0;
            for (const [name, bulkhead] of this.bulkheads) {
                totalBulkheads++;
                totalActiveCalls += bulkhead.activeCalls.size;
                totalWaitingCalls += bulkhead.waitingQueue.length;
                // Consider bulkhead healthy if rejection rate is below 10%
                if (bulkhead.metrics.rejectionRate < 10) {
                    healthyBulkheads++;
                }
            }
            return {
                totalBulkheads,
                healthyBulkheads,
                healthyBulkheadPercentage: totalBulkheads > 0 ? (healthyBulkheads / totalBulkheads) * 100 : 100,
                totalActiveCalls,
                totalWaitingCalls,
                systemHealth: healthyBulkheads === totalBulkheads ? 'healthy' :
                    healthyBulkheads > totalBulkheads * 0.8 ? 'degraded' : 'unhealthy',
            };
        }
        /**
         * Create a bulkhead-protected function wrapper
         */
        protect(bulkheadName, fn, config) {
            return (...args) => {
                return this.execute(bulkheadName, () => fn(...args), config);
            };
        }
        /**
         * Graceful shutdown
         */
        async gracefulShutdown(timeoutMs = 30000) {
            this.logger.log('Starting graceful shutdown of bulkhead service...');
            // Clear all waiting queues
            this.clearAllQueues();
            // Wait for active calls to complete
            const shutdownPromise = new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    let totalActiveCalls = 0;
                    for (const [, bulkhead] of this.bulkheads) {
                        totalActiveCalls += bulkhead.activeCalls.size;
                    }
                    if (totalActiveCalls === 0) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
            try {
                await Promise.race([
                    shutdownPromise,
                    new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Graceful shutdown timeout')), timeoutMs);
                    })
                ]);
                this.logger.log('Graceful shutdown completed');
            }
            catch (error) {
                this.logger.warn('Graceful shutdown timeout, some operations may be interrupted');
            }
        }
    };
    __setFunctionName(_classThis, "BulkheadService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BulkheadService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BulkheadService = _classThis;
})();
exports.BulkheadService = BulkheadService;
