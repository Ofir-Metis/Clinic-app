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
exports.ResilienceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const common_2 = require("@clinic/common");
class UpdatePatternConfigDto {
}
class CreatePatternDto {
}
let ResilienceController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Resilience'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_1.Controller)('resilience')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getSystemHealth_decorators;
    let _getPatterns_decorators;
    let _getPattern_decorators;
    let _createPattern_decorators;
    let _updatePattern_decorators;
    let _getCircuitBreakers_decorators;
    let _getCircuitBreaker_decorators;
    let _resetCircuitBreaker_decorators;
    let _forceOpenCircuitBreaker_decorators;
    let _forceClosedCircuitBreaker_decorators;
    let _getRetryMetrics_decorators;
    let _getRetryMetricsForOperation_decorators;
    let _clearRetryMetricsForOperation_decorators;
    let _getTimeoutMetrics_decorators;
    let _getTimeoutMetricsForOperation_decorators;
    let _getTimeoutConfig_decorators;
    let _getTimeoutStatus_decorators;
    let _getBulkheads_decorators;
    let _getBulkhead_decorators;
    let _getBulkheadSystemStatus_decorators;
    let _clearBulkheadMetrics_decorators;
    let _clearAllMetrics_decorators;
    let _testPattern_decorators;
    var ResilienceController = _classThis = class {
        constructor(resilienceService, circuitBreakerService, retryService, timeoutService, bulkheadService) {
            this.resilienceService = (__runInitializers(this, _instanceExtraInitializers), resilienceService);
            this.circuitBreakerService = circuitBreakerService;
            this.retryService = retryService;
            this.timeoutService = timeoutService;
            this.bulkheadService = bulkheadService;
        }
        async getSystemHealth() {
            try {
                return await this.resilienceService.getSystemHealth();
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to get system health: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        getPatterns() {
            try {
                const patterns = {};
                // Since patterns are private, we'll need to access them through the service
                // For now, return the known pattern names
                const knownPatterns = ['database', 'external-api', 'internal-service', 'file-operations', 'critical'];
                knownPatterns.forEach(name => {
                    const pattern = this.resilienceService.getPattern(name);
                    if (pattern) {
                        patterns[name] = pattern;
                    }
                });
                return patterns;
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to get patterns: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        getPattern(name) {
            try {
                const pattern = this.resilienceService.getPattern(name);
                if (!pattern) {
                    throw new common_1.HttpException(`Pattern '${name}' not found`, common_1.HttpStatus.NOT_FOUND);
                }
                return pattern;
            }
            catch (error) {
                if (error instanceof common_1.HttpException) {
                    throw error;
                }
                throw new common_1.HttpException(`Failed to get pattern: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        createPattern(createPatternDto) {
            try {
                const pattern = {
                    name: createPatternDto.name,
                    description: createPatternDto.description,
                    config: createPatternDto.config,
                };
                this.resilienceService.registerPattern(pattern);
                return { message: `Pattern '${createPatternDto.name}' created successfully`, pattern };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to create pattern: ${error.message}`, common_1.HttpStatus.BAD_REQUEST);
            }
        }
        updatePattern(name, config) {
            try {
                this.resilienceService.updatePattern(name, config);
                const updatedPattern = this.resilienceService.getPattern(name);
                return { message: `Pattern '${name}' updated successfully`, pattern: updatedPattern };
            }
            catch (error) {
                if (error.message.includes('not found')) {
                    throw new common_1.HttpException(`Pattern '${name}' not found`, common_1.HttpStatus.NOT_FOUND);
                }
                throw new common_1.HttpException(`Failed to update pattern: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // Circuit Breaker endpoints
        getCircuitBreakers() {
            try {
                return this.circuitBreakerService.getAllStatus();
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to get circuit breakers: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        getCircuitBreaker(name) {
            try {
                const status = this.circuitBreakerService.getStatus(name);
                if (!status) {
                    throw new common_1.HttpException(`Circuit breaker '${name}' not found`, common_1.HttpStatus.NOT_FOUND);
                }
                return status;
            }
            catch (error) {
                if (error instanceof common_1.HttpException) {
                    throw error;
                }
                throw new common_1.HttpException(`Failed to get circuit breaker: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        resetCircuitBreaker(name) {
            try {
                this.circuitBreakerService.reset(name);
                return { message: `Circuit breaker '${name}' reset successfully` };
            }
            catch (error) {
                if (error.message.includes('not found')) {
                    throw new common_1.HttpException(`Circuit breaker '${name}' not found`, common_1.HttpStatus.NOT_FOUND);
                }
                throw new common_1.HttpException(`Failed to reset circuit breaker: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        forceOpenCircuitBreaker(name, body) {
            try {
                this.circuitBreakerService.forceOpen(name, body.reason);
                return { message: `Circuit breaker '${name}' forced open successfully` };
            }
            catch (error) {
                if (error.message.includes('not found')) {
                    throw new common_1.HttpException(`Circuit breaker '${name}' not found`, common_1.HttpStatus.NOT_FOUND);
                }
                throw new common_1.HttpException(`Failed to force open circuit breaker: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        forceClosedCircuitBreaker(name, body) {
            try {
                this.circuitBreakerService.forceClosed(name, body.reason);
                return { message: `Circuit breaker '${name}' forced closed successfully` };
            }
            catch (error) {
                if (error.message.includes('not found')) {
                    throw new common_1.HttpException(`Circuit breaker '${name}' not found`, common_1.HttpStatus.NOT_FOUND);
                }
                throw new common_1.HttpException(`Failed to force closed circuit breaker: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // Retry metrics endpoints
        getRetryMetrics() {
            try {
                return this.retryService.getAllMetrics();
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to get retry metrics: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        getRetryMetricsForOperation(operation) {
            try {
                const metrics = this.retryService.getMetrics(operation);
                if (!metrics) {
                    throw new common_1.HttpException(`Retry metrics for operation '${operation}' not found`, common_1.HttpStatus.NOT_FOUND);
                }
                return metrics;
            }
            catch (error) {
                if (error instanceof common_1.HttpException) {
                    throw error;
                }
                throw new common_1.HttpException(`Failed to get retry metrics: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        clearRetryMetricsForOperation(operation) {
            try {
                this.retryService.clearMetrics(operation);
                return { message: `Retry metrics for operation '${operation}' cleared successfully` };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to clear retry metrics: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // Timeout metrics endpoints
        getTimeoutMetrics() {
            try {
                return this.timeoutService.getAllMetrics();
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to get timeout metrics: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        getTimeoutMetricsForOperation(operation) {
            try {
                const metrics = this.timeoutService.getMetrics(operation);
                if (!metrics) {
                    throw new common_1.HttpException(`Timeout metrics for operation '${operation}' not found`, common_1.HttpStatus.NOT_FOUND);
                }
                return metrics;
            }
            catch (error) {
                if (error instanceof common_1.HttpException) {
                    throw error;
                }
                throw new common_1.HttpException(`Failed to get timeout metrics: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        getTimeoutConfig() {
            try {
                return this.timeoutService.getConfig();
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to get timeout config: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        getTimeoutStatus() {
            try {
                return {
                    activeTimeoutCount: this.timeoutService.getActiveTimeoutCount(),
                    config: this.timeoutService.getConfig(),
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to get timeout status: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // Bulkhead endpoints
        getBulkheads() {
            try {
                return this.bulkheadService.getAllStatus();
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to get bulkheads: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        getBulkhead(name) {
            try {
                const status = this.bulkheadService.getStatus(name);
                if (!status) {
                    throw new common_1.HttpException(`Bulkhead '${name}' not found`, common_1.HttpStatus.NOT_FOUND);
                }
                return status;
            }
            catch (error) {
                if (error instanceof common_1.HttpException) {
                    throw error;
                }
                throw new common_1.HttpException(`Failed to get bulkhead: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        getBulkheadSystemStatus() {
            try {
                return this.bulkheadService.getSystemStatus();
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to get bulkhead system status: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        clearBulkheadMetrics(name) {
            try {
                this.bulkheadService.clearMetrics(name);
                return { message: `Bulkhead metrics for '${name}' cleared successfully` };
            }
            catch (error) {
                if (error.message.includes('not found')) {
                    throw new common_1.HttpException(`Bulkhead '${name}' not found`, common_1.HttpStatus.NOT_FOUND);
                }
                throw new common_1.HttpException(`Failed to clear bulkhead metrics: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        // System operations
        clearAllMetrics() {
            try {
                this.resilienceService.clearAllMetrics();
                return { message: 'All resilience metrics cleared successfully' };
            }
            catch (error) {
                throw new common_1.HttpException(`Failed to clear all metrics: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async testPattern(pattern, shouldFail) {
            try {
                const willFail = shouldFail === 'true';
                const testOperation = async () => {
                    if (willFail) {
                        throw new Error('Test operation failure');
                    }
                    return { message: 'Test operation succeeded', timestamp: new Date() };
                };
                const fallback = async () => {
                    return { message: 'Fallback operation executed', timestamp: new Date() };
                };
                const result = await this.resilienceService.execute(pattern, 'test-operation', testOperation, fallback);
                return {
                    pattern,
                    testConfiguration: { shouldFail: willFail },
                    result,
                    timestamp: new Date(),
                };
            }
            catch (error) {
                throw new common_1.HttpException(`Pattern test failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "ResilienceController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getSystemHealth_decorators = [(0, common_1.Get)('health'), (0, swagger_1.ApiOperation)({ summary: 'Get comprehensive system health status' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'System health status retrieved successfully' })];
        _getPatterns_decorators = [(0, common_1.Get)('patterns'), (0, swagger_1.ApiOperation)({ summary: 'Get all resilience patterns' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Resilience patterns retrieved successfully' })];
        _getPattern_decorators = [(0, common_1.Get)('patterns/:name'), (0, swagger_1.ApiOperation)({ summary: 'Get specific resilience pattern' }), (0, swagger_1.ApiParam)({ name: 'name', description: 'Pattern name' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Pattern retrieved successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Pattern not found' })];
        _createPattern_decorators = [(0, common_1.Post)('patterns'), (0, swagger_1.ApiOperation)({ summary: 'Create custom resilience pattern' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'Pattern created successfully' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid pattern configuration' })];
        _updatePattern_decorators = [(0, common_1.Put)('patterns/:name'), (0, swagger_1.ApiOperation)({ summary: 'Update resilience pattern configuration' }), (0, swagger_1.ApiParam)({ name: 'name', description: 'Pattern name' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Pattern updated successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Pattern not found' })];
        _getCircuitBreakers_decorators = [(0, common_1.Get)('circuit-breakers'), (0, swagger_1.ApiOperation)({ summary: 'Get all circuit breaker statuses' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Circuit breaker statuses retrieved successfully' })];
        _getCircuitBreaker_decorators = [(0, common_1.Get)('circuit-breakers/:name'), (0, swagger_1.ApiOperation)({ summary: 'Get specific circuit breaker status' }), (0, swagger_1.ApiParam)({ name: 'name', description: 'Circuit breaker name' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Circuit breaker status retrieved successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Circuit breaker not found' })];
        _resetCircuitBreaker_decorators = [(0, common_1.Post)('circuit-breakers/:name/reset'), (0, swagger_1.ApiOperation)({ summary: 'Reset circuit breaker' }), (0, swagger_1.ApiParam)({ name: 'name', description: 'Circuit breaker name' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Circuit breaker reset successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Circuit breaker not found' })];
        _forceOpenCircuitBreaker_decorators = [(0, common_1.Post)('circuit-breakers/:name/force-open'), (0, swagger_1.ApiOperation)({ summary: 'Force circuit breaker to open state' }), (0, swagger_1.ApiParam)({ name: 'name', description: 'Circuit breaker name' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Circuit breaker forced open successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Circuit breaker not found' })];
        _forceClosedCircuitBreaker_decorators = [(0, common_1.Post)('circuit-breakers/:name/force-closed'), (0, swagger_1.ApiOperation)({ summary: 'Force circuit breaker to closed state' }), (0, swagger_1.ApiParam)({ name: 'name', description: 'Circuit breaker name' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Circuit breaker forced closed successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Circuit breaker not found' })];
        _getRetryMetrics_decorators = [(0, common_1.Get)('retry-metrics'), (0, swagger_1.ApiOperation)({ summary: 'Get all retry metrics' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Retry metrics retrieved successfully' })];
        _getRetryMetricsForOperation_decorators = [(0, common_1.Get)('retry-metrics/:operation'), (0, swagger_1.ApiOperation)({ summary: 'Get retry metrics for specific operation' }), (0, swagger_1.ApiParam)({ name: 'operation', description: 'Operation name' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Retry metrics retrieved successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Operation metrics not found' })];
        _clearRetryMetricsForOperation_decorators = [(0, common_1.Delete)('retry-metrics/:operation'), (0, swagger_1.ApiOperation)({ summary: 'Clear retry metrics for specific operation' }), (0, swagger_1.ApiParam)({ name: 'operation', description: 'Operation name' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Retry metrics cleared successfully' })];
        _getTimeoutMetrics_decorators = [(0, common_1.Get)('timeout-metrics'), (0, swagger_1.ApiOperation)({ summary: 'Get all timeout metrics' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Timeout metrics retrieved successfully' })];
        _getTimeoutMetricsForOperation_decorators = [(0, common_1.Get)('timeout-metrics/:operation'), (0, swagger_1.ApiOperation)({ summary: 'Get timeout metrics for specific operation' }), (0, swagger_1.ApiParam)({ name: 'operation', description: 'Operation name' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Timeout metrics retrieved successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Operation metrics not found' })];
        _getTimeoutConfig_decorators = [(0, common_1.Get)('timeout-config'), (0, swagger_1.ApiOperation)({ summary: 'Get timeout service configuration' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Timeout configuration retrieved successfully' })];
        _getTimeoutStatus_decorators = [(0, common_1.Get)('timeout-status'), (0, swagger_1.ApiOperation)({ summary: 'Get timeout service status' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Timeout status retrieved successfully' })];
        _getBulkheads_decorators = [(0, common_1.Get)('bulkheads'), (0, swagger_1.ApiOperation)({ summary: 'Get all bulkhead statuses' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Bulkhead statuses retrieved successfully' })];
        _getBulkhead_decorators = [(0, common_1.Get)('bulkheads/:name'), (0, swagger_1.ApiOperation)({ summary: 'Get specific bulkhead status' }), (0, swagger_1.ApiParam)({ name: 'name', description: 'Bulkhead name' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Bulkhead status retrieved successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Bulkhead not found' })];
        _getBulkheadSystemStatus_decorators = [(0, common_1.Get)('bulkheads/system/status'), (0, swagger_1.ApiOperation)({ summary: 'Get bulkhead system status' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Bulkhead system status retrieved successfully' })];
        _clearBulkheadMetrics_decorators = [(0, common_1.Delete)('bulkheads/:name/metrics'), (0, swagger_1.ApiOperation)({ summary: 'Clear bulkhead metrics' }), (0, swagger_1.ApiParam)({ name: 'name', description: 'Bulkhead name' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Bulkhead metrics cleared successfully' }), (0, swagger_1.ApiResponse)({ status: 404, description: 'Bulkhead not found' })];
        _clearAllMetrics_decorators = [(0, common_1.Delete)('metrics'), (0, swagger_1.ApiOperation)({ summary: 'Clear all resilience metrics' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'All metrics cleared successfully' })];
        _testPattern_decorators = [(0, common_1.Post)('test/:pattern'), (0, swagger_1.ApiOperation)({ summary: 'Test resilience pattern with dummy operation' }), (0, swagger_1.ApiParam)({ name: 'pattern', description: 'Pattern name to test' }), (0, swagger_1.ApiQuery)({ name: 'shouldFail', required: false, description: 'Whether the test should fail' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Pattern test completed successfully' })];
        __esDecorate(_classThis, null, _getSystemHealth_decorators, { kind: "method", name: "getSystemHealth", static: false, private: false, access: { has: obj => "getSystemHealth" in obj, get: obj => obj.getSystemHealth }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPatterns_decorators, { kind: "method", name: "getPatterns", static: false, private: false, access: { has: obj => "getPatterns" in obj, get: obj => obj.getPatterns }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPattern_decorators, { kind: "method", name: "getPattern", static: false, private: false, access: { has: obj => "getPattern" in obj, get: obj => obj.getPattern }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createPattern_decorators, { kind: "method", name: "createPattern", static: false, private: false, access: { has: obj => "createPattern" in obj, get: obj => obj.createPattern }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updatePattern_decorators, { kind: "method", name: "updatePattern", static: false, private: false, access: { has: obj => "updatePattern" in obj, get: obj => obj.updatePattern }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCircuitBreakers_decorators, { kind: "method", name: "getCircuitBreakers", static: false, private: false, access: { has: obj => "getCircuitBreakers" in obj, get: obj => obj.getCircuitBreakers }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCircuitBreaker_decorators, { kind: "method", name: "getCircuitBreaker", static: false, private: false, access: { has: obj => "getCircuitBreaker" in obj, get: obj => obj.getCircuitBreaker }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resetCircuitBreaker_decorators, { kind: "method", name: "resetCircuitBreaker", static: false, private: false, access: { has: obj => "resetCircuitBreaker" in obj, get: obj => obj.resetCircuitBreaker }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _forceOpenCircuitBreaker_decorators, { kind: "method", name: "forceOpenCircuitBreaker", static: false, private: false, access: { has: obj => "forceOpenCircuitBreaker" in obj, get: obj => obj.forceOpenCircuitBreaker }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _forceClosedCircuitBreaker_decorators, { kind: "method", name: "forceClosedCircuitBreaker", static: false, private: false, access: { has: obj => "forceClosedCircuitBreaker" in obj, get: obj => obj.forceClosedCircuitBreaker }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRetryMetrics_decorators, { kind: "method", name: "getRetryMetrics", static: false, private: false, access: { has: obj => "getRetryMetrics" in obj, get: obj => obj.getRetryMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRetryMetricsForOperation_decorators, { kind: "method", name: "getRetryMetricsForOperation", static: false, private: false, access: { has: obj => "getRetryMetricsForOperation" in obj, get: obj => obj.getRetryMetricsForOperation }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _clearRetryMetricsForOperation_decorators, { kind: "method", name: "clearRetryMetricsForOperation", static: false, private: false, access: { has: obj => "clearRetryMetricsForOperation" in obj, get: obj => obj.clearRetryMetricsForOperation }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTimeoutMetrics_decorators, { kind: "method", name: "getTimeoutMetrics", static: false, private: false, access: { has: obj => "getTimeoutMetrics" in obj, get: obj => obj.getTimeoutMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTimeoutMetricsForOperation_decorators, { kind: "method", name: "getTimeoutMetricsForOperation", static: false, private: false, access: { has: obj => "getTimeoutMetricsForOperation" in obj, get: obj => obj.getTimeoutMetricsForOperation }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTimeoutConfig_decorators, { kind: "method", name: "getTimeoutConfig", static: false, private: false, access: { has: obj => "getTimeoutConfig" in obj, get: obj => obj.getTimeoutConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTimeoutStatus_decorators, { kind: "method", name: "getTimeoutStatus", static: false, private: false, access: { has: obj => "getTimeoutStatus" in obj, get: obj => obj.getTimeoutStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBulkheads_decorators, { kind: "method", name: "getBulkheads", static: false, private: false, access: { has: obj => "getBulkheads" in obj, get: obj => obj.getBulkheads }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBulkhead_decorators, { kind: "method", name: "getBulkhead", static: false, private: false, access: { has: obj => "getBulkhead" in obj, get: obj => obj.getBulkhead }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBulkheadSystemStatus_decorators, { kind: "method", name: "getBulkheadSystemStatus", static: false, private: false, access: { has: obj => "getBulkheadSystemStatus" in obj, get: obj => obj.getBulkheadSystemStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _clearBulkheadMetrics_decorators, { kind: "method", name: "clearBulkheadMetrics", static: false, private: false, access: { has: obj => "clearBulkheadMetrics" in obj, get: obj => obj.clearBulkheadMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _clearAllMetrics_decorators, { kind: "method", name: "clearAllMetrics", static: false, private: false, access: { has: obj => "clearAllMetrics" in obj, get: obj => obj.clearAllMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _testPattern_decorators, { kind: "method", name: "testPattern", static: false, private: false, access: { has: obj => "testPattern" in obj, get: obj => obj.testPattern }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ResilienceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ResilienceController = _classThis;
})();
exports.ResilienceController = ResilienceController;
