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
exports.RetryService = void 0;
const common_1 = require("@nestjs/common");
let RetryService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var RetryService = _classThis = class {
        constructor(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(RetryService.name);
            this.retryMetrics = new Map();
        }
        /**
         * Execute an operation with retry logic
         */
        async execute(operationName, operation, config) {
            const retryConfig = this.getRetryConfig(config);
            const attempts = [];
            let lastError;
            // Initialize metrics if not exists
            if (!this.retryMetrics.has(operationName)) {
                this.retryMetrics.set(operationName, {
                    totalOperations: 0,
                    successfulOperations: 0,
                    failedOperations: 0,
                    totalRetries: 0,
                    averageRetries: 0,
                    successAfterRetries: 0,
                });
            }
            const metrics = this.retryMetrics.get(operationName);
            metrics.totalOperations++;
            for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
                const attemptInfo = {
                    attempt: attempt + 1,
                    delay: 0,
                    timestamp: new Date(),
                };
                try {
                    const result = await operation();
                    // Record successful attempt
                    attempts.push(attemptInfo);
                    metrics.successfulOperations++;
                    if (attempt > 0) {
                        metrics.successAfterRetries++;
                        metrics.totalRetries += attempt;
                        this.logger.log(`Operation '${operationName}' succeeded after ${attempt} retries`);
                    }
                    this.updateAverageRetries(metrics);
                    return result;
                }
                catch (error) {
                    lastError = error;
                    attemptInfo.error = lastError;
                    attempts.push(attemptInfo);
                    // Check if error is retryable
                    if (!this.isRetryableError(lastError, retryConfig)) {
                        this.logger.error(`Operation '${operationName}' failed with non-retryable error:`, lastError.message);
                        metrics.failedOperations++;
                        throw lastError;
                    }
                    // If this was the last attempt, don't wait
                    if (attempt === retryConfig.maxRetries) {
                        this.logger.error(`Operation '${operationName}' failed after ${retryConfig.maxRetries + 1} attempts:`, lastError.message);
                        metrics.failedOperations++;
                        metrics.totalRetries += attempt;
                        this.updateAverageRetries(metrics);
                        throw lastError;
                    }
                    // Calculate delay for next attempt
                    const delay = this.calculateDelay(attempt, retryConfig);
                    attemptInfo.delay = delay;
                    this.logger.warn(`Operation '${operationName}' failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), ` +
                        `retrying in ${delay}ms: ${lastError.message}`);
                    // Wait before next attempt
                    await this.sleep(delay);
                }
            }
            // This should never be reached, but TypeScript requires it
            throw lastError;
        }
        /**
         * Execute with exponential backoff and circuit breaker integration
         */
        async executeWithBackoff(operationName, operation, config, onRetry) {
            const retryConfig = this.getRetryConfig(config);
            let lastError;
            for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
                try {
                    return await operation();
                }
                catch (error) {
                    lastError = error;
                    // Call retry callback if provided
                    if (onRetry) {
                        onRetry(attempt + 1, lastError);
                    }
                    // Check if error is retryable
                    if (!this.isRetryableError(lastError, retryConfig)) {
                        throw lastError;
                    }
                    // If this was the last attempt, don't wait
                    if (attempt === retryConfig.maxRetries) {
                        throw lastError;
                    }
                    // Calculate delay with exponential backoff
                    const delay = this.calculateExponentialBackoffDelay(attempt, retryConfig);
                    this.logger.warn(`Exponential backoff retry for '${operationName}' (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), ` +
                        `waiting ${delay}ms: ${lastError.message}`);
                    await this.sleep(delay);
                }
            }
            throw lastError;
        }
        /**
         * Execute with fixed interval retry
         */
        async executeWithFixedInterval(operationName, operation, maxRetries = 3, intervalMs = 1000) {
            let lastError;
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    return await operation();
                }
                catch (error) {
                    lastError = error;
                    if (attempt === maxRetries) {
                        this.logger.error(`Fixed interval retry for '${operationName}' failed after ${maxRetries + 1} attempts:`, lastError.message);
                        throw lastError;
                    }
                    this.logger.warn(`Fixed interval retry for '${operationName}' (attempt ${attempt + 1}/${maxRetries + 1}), ` +
                        `waiting ${intervalMs}ms: ${lastError.message}`);
                    await this.sleep(intervalMs);
                }
            }
            throw lastError;
        }
        /**
         * Execute with custom retry condition
         */
        async executeWithCondition(operationName, operation, shouldRetry, maxRetries = 3, delayMs = 1000) {
            let lastError;
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    return await operation();
                }
                catch (error) {
                    lastError = error;
                    // Check custom retry condition
                    if (!shouldRetry(lastError, attempt + 1) || attempt === maxRetries) {
                        this.logger.error(`Conditional retry for '${operationName}' stopped after ${attempt + 1} attempts:`, lastError.message);
                        throw lastError;
                    }
                    this.logger.warn(`Conditional retry for '${operationName}' (attempt ${attempt + 1}/${maxRetries + 1}), ` +
                        `waiting ${delayMs}ms: ${lastError.message}`);
                    await this.sleep(delayMs);
                }
            }
            throw lastError;
        }
        /**
         * Get default retry configuration
         */
        getRetryConfig(overrides) {
            const defaultConfig = {
                maxRetries: this.configService.get('RETRY_MAX_RETRIES', 3),
                initialDelay: this.configService.get('RETRY_INITIAL_DELAY', 1000),
                maxDelay: this.configService.get('RETRY_MAX_DELAY', 30000),
                backoffMultiplier: this.configService.get('RETRY_BACKOFF_MULTIPLIER', 2),
                jitter: this.configService.get('RETRY_JITTER', true),
                retryableErrors: this.configService.get('RETRY_RETRYABLE_ERRORS', [
                    'ECONNREFUSED',
                    'ENOTFOUND',
                    'ETIMEDOUT',
                    'ECONNRESET',
                    'EHOSTUNREACH',
                    'ENETUNREACH',
                    'EAI_AGAIN',
                    'Operation timeout',
                    'socket hang up',
                    'Request failed',
                    'Service unavailable',
                    'Internal server error',
                    'Bad gateway',
                    'Gateway timeout',
                ]).split(','),
                nonRetryableErrors: this.configService.get('RETRY_NON_RETRYABLE_ERRORS', [
                    'Authentication failed',
                    'Unauthorized',
                    'Forbidden',
                    'Not found',
                    'Bad request',
                    'Validation error',
                    'Invalid input',
                    'Conflict',
                    'Precondition failed',
                ]).split(','),
            };
            return { ...defaultConfig, ...overrides };
        }
        /**
         * Check if an error is retryable
         */
        isRetryableError(error, config) {
            const errorMessage = error.message.toLowerCase();
            const errorName = error.name.toLowerCase();
            // Check non-retryable errors first (these take precedence)
            const isNonRetryable = config.nonRetryableErrors.some(nonRetryableError => errorMessage.includes(nonRetryableError.toLowerCase()) ||
                errorName.includes(nonRetryableError.toLowerCase()));
            if (isNonRetryable) {
                return false;
            }
            // Check retryable errors
            const isRetryable = config.retryableErrors.some(retryableError => errorMessage.includes(retryableError.toLowerCase()) ||
                errorName.includes(retryableError.toLowerCase()));
            // For HTTP errors, retry 5xx but not 4xx
            if ('status' in error || 'statusCode' in error) {
                const status = error.status || error.statusCode;
                if (status >= 500 && status < 600) {
                    return true;
                }
                if (status >= 400 && status < 500) {
                    return false;
                }
            }
            return isRetryable;
        }
        /**
         * Calculate delay with jitter
         */
        calculateDelay(attempt, config) {
            let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
            delay = Math.min(delay, config.maxDelay);
            // Add jitter to prevent thundering herd
            if (config.jitter) {
                const jitterAmount = delay * 0.1; // 10% jitter
                delay += Math.random() * jitterAmount - jitterAmount / 2;
            }
            return Math.round(delay);
        }
        /**
         * Calculate exponential backoff delay
         */
        calculateExponentialBackoffDelay(attempt, config) {
            const exponentialDelay = config.initialDelay * Math.pow(2, attempt);
            let delay = Math.min(exponentialDelay, config.maxDelay);
            // Add jitter
            if (config.jitter) {
                const jitterRange = delay * 0.2; // 20% jitter for exponential backoff
                delay += Math.random() * jitterRange - jitterRange / 2;
            }
            return Math.round(Math.max(delay, 0));
        }
        /**
         * Sleep for specified milliseconds
         */
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        /**
         * Update average retries metric
         */
        updateAverageRetries(metrics) {
            if (metrics.successfulOperations > 0) {
                metrics.averageRetries = metrics.totalRetries / metrics.successfulOperations;
            }
        }
        /**
         * Get retry metrics for an operation
         */
        getMetrics(operationName) {
            return this.retryMetrics.get(operationName) || null;
        }
        /**
         * Get all retry metrics
         */
        getAllMetrics() {
            const allMetrics = {};
            for (const [name, metrics] of this.retryMetrics) {
                allMetrics[name] = { ...metrics };
            }
            return allMetrics;
        }
        /**
         * Clear metrics for an operation
         */
        clearMetrics(operationName) {
            this.retryMetrics.delete(operationName);
        }
        /**
         * Clear all metrics
         */
        clearAllMetrics() {
            this.retryMetrics.clear();
        }
        /**
         * Create a retryable operation wrapper
         */
        createRetryableOperation(operationName, operation, config) {
            return () => this.execute(operationName, operation, config);
        }
    };
    __setFunctionName(_classThis, "RetryService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RetryService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RetryService = _classThis;
})();
exports.RetryService = RetryService;
