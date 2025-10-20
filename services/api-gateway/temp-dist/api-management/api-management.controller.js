"use strict";
/**
 * ApiManagementController - API management and rate limiting controls
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
exports.ApiManagementController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let ApiManagementController = (() => {
    let _classDecorators = [(0, common_1.Controller)('api-management'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getApiOverview_decorators;
    let _getApiKeys_decorators;
    let _createApiKey_decorators;
    let _updateApiKey_decorators;
    let _revokeApiKey_decorators;
    let _regenerateApiKey_decorators;
    let _getRateLimitRules_decorators;
    let _createRateLimitRule_decorators;
    let _updateRateLimitRule_decorators;
    let _deleteRateLimitRule_decorators;
    let _getClientApplications_decorators;
    let _createClientApplication_decorators;
    let _updateClientApplication_decorators;
    let _approveClientApplication_decorators;
    let _getApiAnalytics_decorators;
    let _getUsageTrends_decorators;
    let _getEndpointPerformance_decorators;
    let _getThreatDetection_decorators;
    let _blockIpAddress_decorators;
    let _getBlockedIps_decorators;
    let _unblockIpAddress_decorators;
    let _getApiHealth_decorators;
    var ApiManagementController = _classThis = class {
        constructor(apiManagementService) {
            this.apiManagementService = (__runInitializers(this, _instanceExtraInitializers), apiManagementService);
            this.logger = new common_1.Logger(ApiManagementController.name);
        }
        /**
         * API Overview and Dashboard
         */
        async getApiOverview(req) {
            try {
                const overview = await this.apiManagementService.getApiOverview();
                this.logger.log(`User ${req.user.sub} viewed API management overview`);
                return {
                    success: true,
                    data: overview,
                };
            }
            catch (error) {
                this.logger.error('Failed to get API overview:', error);
                throw new common_1.HttpException('Failed to retrieve API overview', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * API Key Management
         */
        async getApiKeys(req, clientId, status, limit = 50, offset = 0) {
            try {
                const keys = await this.apiManagementService.getApiKeys({
                    clientId,
                    status,
                    limit,
                    offset,
                });
                return {
                    success: true,
                    data: keys,
                };
            }
            catch (error) {
                this.logger.error('Failed to get API keys:', error);
                throw new common_1.HttpException('Failed to retrieve API keys', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createApiKey(keyRequest, req) {
            try {
                const apiKey = await this.apiManagementService.createApiKey(keyRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} created API key for client ${keyRequest.clientId}`);
                return {
                    success: true,
                    data: apiKey,
                    message: 'API key created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create API key:', error);
                throw new common_1.HttpException('Failed to create API key', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateApiKey(keyId, update, req) {
            try {
                const updatedKey = await this.apiManagementService.updateApiKey(keyId, update, req.user.sub);
                this.logger.log(`User ${req.user.sub} updated API key ${keyId}`);
                return {
                    success: true,
                    data: updatedKey,
                    message: 'API key updated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to update API key:', error);
                throw new common_1.HttpException('Failed to update API key', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async revokeApiKey(keyId, revocation, req) {
            try {
                await this.apiManagementService.revokeApiKey(keyId, revocation.reason, req.user.sub);
                this.logger.log(`User ${req.user.sub} revoked API key ${keyId}`);
                return {
                    success: true,
                    message: 'API key revoked successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to revoke API key:', error);
                throw new common_1.HttpException('Failed to revoke API key', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async regenerateApiKey(keyId, req) {
            try {
                const newKey = await this.apiManagementService.regenerateApiKey(keyId, req.user.sub);
                this.logger.log(`User ${req.user.sub} regenerated API key ${keyId}`);
                return {
                    success: true,
                    data: newKey,
                    message: 'API key regenerated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to regenerate API key:', error);
                throw new common_1.HttpException('Failed to regenerate API key', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Rate Limiting Management
         */
        async getRateLimitRules(req) {
            try {
                const rules = await this.apiManagementService.getRateLimitRules();
                return {
                    success: true,
                    data: rules,
                };
            }
            catch (error) {
                this.logger.error('Failed to get rate limit rules:', error);
                throw new common_1.HttpException('Failed to retrieve rate limit rules', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createRateLimitRule(rule, req) {
            try {
                const createdRule = await this.apiManagementService.createRateLimitRule(rule, req.user.sub);
                this.logger.log(`User ${req.user.sub} created rate limit rule: ${rule.name}`);
                return {
                    success: true,
                    data: createdRule,
                    message: 'Rate limit rule created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create rate limit rule:', error);
                throw new common_1.HttpException('Failed to create rate limit rule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateRateLimitRule(ruleId, update, req) {
            try {
                const updatedRule = await this.apiManagementService.updateRateLimitRule(ruleId, update, req.user.sub);
                this.logger.log(`User ${req.user.sub} updated rate limit rule ${ruleId}`);
                return {
                    success: true,
                    data: updatedRule,
                    message: 'Rate limit rule updated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to update rate limit rule:', error);
                throw new common_1.HttpException('Failed to update rate limit rule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async deleteRateLimitRule(ruleId, req) {
            try {
                await this.apiManagementService.deleteRateLimitRule(ruleId, req.user.sub);
                this.logger.log(`User ${req.user.sub} deleted rate limit rule ${ruleId}`);
                return {
                    success: true,
                    message: 'Rate limit rule deleted successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to delete rate limit rule:', error);
                throw new common_1.HttpException('Failed to delete rate limit rule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Client Application Management
         */
        async getClientApplications(status, type, req) {
            try {
                const clients = await this.apiManagementService.getClientApplications({
                    status,
                    type,
                });
                return {
                    success: true,
                    data: clients,
                };
            }
            catch (error) {
                this.logger.error('Failed to get client applications:', error);
                throw new common_1.HttpException('Failed to retrieve client applications', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createClientApplication(client, req) {
            try {
                const createdClient = await this.apiManagementService.createClientApplication(client, req.user.sub);
                this.logger.log(`User ${req.user.sub} created client application: ${client.name}`);
                return {
                    success: true,
                    data: createdClient,
                    message: 'Client application created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create client application:', error);
                throw new common_1.HttpException('Failed to create client application', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateClientApplication(clientId, update, req) {
            try {
                const updatedClient = await this.apiManagementService.updateClientApplication(clientId, update, req.user.sub);
                this.logger.log(`User ${req.user.sub} updated client application ${clientId}`);
                return {
                    success: true,
                    data: updatedClient,
                    message: 'Client application updated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to update client application:', error);
                throw new common_1.HttpException('Failed to update client application', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async approveClientApplication(clientId, req) {
            try {
                const approvedClient = await this.apiManagementService.approveClientApplication(clientId, req.user.sub);
                this.logger.log(`User ${req.user.sub} approved client application ${clientId}`);
                return {
                    success: true,
                    data: approvedClient,
                    message: 'Client application approved successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to approve client application:', error);
                throw new common_1.HttpException('Failed to approve client application', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * API Analytics and Monitoring
         */
        async getApiAnalytics(period = '24h', clientId, req) {
            try {
                const analytics = await this.apiManagementService.getApiAnalytics(period, clientId);
                return {
                    success: true,
                    data: analytics,
                };
            }
            catch (error) {
                this.logger.error('Failed to get API analytics:', error);
                throw new common_1.HttpException('Failed to retrieve API analytics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getUsageTrends(metric, period = '7d', granularity = 'hour', req) {
            try {
                const trends = await this.apiManagementService.getUsageTrends(metric, period, granularity);
                return {
                    success: true,
                    data: trends,
                };
            }
            catch (error) {
                this.logger.error('Failed to get usage trends:', error);
                throw new common_1.HttpException('Failed to retrieve usage trends', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getEndpointPerformance(period = '24h', limit = 20, req) {
            try {
                const performance = await this.apiManagementService.getEndpointPerformance(period, limit);
                return {
                    success: true,
                    data: performance,
                };
            }
            catch (error) {
                this.logger.error('Failed to get endpoint performance:', error);
                throw new common_1.HttpException('Failed to retrieve endpoint performance', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * DDoS Protection and Security
         */
        async getThreatDetection(req) {
            try {
                const threats = await this.apiManagementService.getThreatDetection();
                return {
                    success: true,
                    data: threats,
                };
            }
            catch (error) {
                this.logger.error('Failed to get threat detection:', error);
                throw new common_1.HttpException('Failed to retrieve threat detection', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async blockIpAddress(blockRequest, req) {
            try {
                await this.apiManagementService.blockIpAddress(blockRequest, req.user.sub);
                this.logger.log(`User ${req.user.sub} blocked IP address ${blockRequest.ipAddress}`);
                return {
                    success: true,
                    message: 'IP address blocked successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to block IP address:', error);
                throw new common_1.HttpException('Failed to block IP address', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getBlockedIps(req) {
            try {
                const blockedIps = await this.apiManagementService.getBlockedIps();
                return {
                    success: true,
                    data: blockedIps,
                };
            }
            catch (error) {
                this.logger.error('Failed to get blocked IPs:', error);
                throw new common_1.HttpException('Failed to retrieve blocked IPs', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async unblockIpAddress(ipAddress, req) {
            try {
                await this.apiManagementService.unblockIpAddress(ipAddress, req.user.sub);
                this.logger.log(`User ${req.user.sub} unblocked IP address ${ipAddress}`);
                return {
                    success: true,
                    message: 'IP address unblocked successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to unblock IP address:', error);
                throw new common_1.HttpException('Failed to unblock IP address', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Health Check and System Status
         */
        async getApiHealth(req) {
            try {
                const health = await this.apiManagementService.getApiHealth();
                return {
                    success: true,
                    data: health,
                };
            }
            catch (error) {
                this.logger.error('Failed to get API health:', error);
                throw new common_1.HttpException('Failed to retrieve API health', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "ApiManagementController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getApiOverview_decorators = [(0, common_1.Get)('overview'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _getApiKeys_decorators = [(0, common_1.Get)('keys'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _createApiKey_decorators = [(0, common_1.Post)('keys'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _updateApiKey_decorators = [(0, common_1.Put)('keys/:keyId'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _revokeApiKey_decorators = [(0, common_1.Post)('keys/:keyId/revoke'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _regenerateApiKey_decorators = [(0, common_1.Post)('keys/:keyId/regenerate'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _getRateLimitRules_decorators = [(0, common_1.Get)('rate-limits'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _createRateLimitRule_decorators = [(0, common_1.Post)('rate-limits'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _updateRateLimitRule_decorators = [(0, common_1.Put)('rate-limits/:ruleId'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _deleteRateLimitRule_decorators = [(0, common_1.Delete)('rate-limits/:ruleId'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _getClientApplications_decorators = [(0, common_1.Get)('clients'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _createClientApplication_decorators = [(0, common_1.Post)('clients'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _updateClientApplication_decorators = [(0, common_1.Put)('clients/:clientId'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _approveClientApplication_decorators = [(0, common_1.Post)('clients/:clientId/approve'), (0, common_2.RequireRoles)('admin')];
        _getApiAnalytics_decorators = [(0, common_1.Get)('analytics'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _getUsageTrends_decorators = [(0, common_1.Get)('analytics/usage-trends'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _getEndpointPerformance_decorators = [(0, common_1.Get)('analytics/endpoint-performance'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        _getThreatDetection_decorators = [(0, common_1.Get)('security/threat-detection'), (0, common_2.RequireRoles)('admin', 'security_officer')];
        _blockIpAddress_decorators = [(0, common_1.Post)('security/block-ip'), (0, common_2.RequireRoles)('admin', 'security_officer')];
        _getBlockedIps_decorators = [(0, common_1.Get)('security/blocked-ips'), (0, common_2.RequireRoles)('admin', 'security_officer')];
        _unblockIpAddress_decorators = [(0, common_1.Delete)('security/blocked-ips/:ipAddress'), (0, common_2.RequireRoles)('admin', 'security_officer')];
        _getApiHealth_decorators = [(0, common_1.Get)('health'), (0, common_2.RequireRoles)('admin', 'api_manager')];
        __esDecorate(_classThis, null, _getApiOverview_decorators, { kind: "method", name: "getApiOverview", static: false, private: false, access: { has: obj => "getApiOverview" in obj, get: obj => obj.getApiOverview }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApiKeys_decorators, { kind: "method", name: "getApiKeys", static: false, private: false, access: { has: obj => "getApiKeys" in obj, get: obj => obj.getApiKeys }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createApiKey_decorators, { kind: "method", name: "createApiKey", static: false, private: false, access: { has: obj => "createApiKey" in obj, get: obj => obj.createApiKey }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateApiKey_decorators, { kind: "method", name: "updateApiKey", static: false, private: false, access: { has: obj => "updateApiKey" in obj, get: obj => obj.updateApiKey }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _revokeApiKey_decorators, { kind: "method", name: "revokeApiKey", static: false, private: false, access: { has: obj => "revokeApiKey" in obj, get: obj => obj.revokeApiKey }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _regenerateApiKey_decorators, { kind: "method", name: "regenerateApiKey", static: false, private: false, access: { has: obj => "regenerateApiKey" in obj, get: obj => obj.regenerateApiKey }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRateLimitRules_decorators, { kind: "method", name: "getRateLimitRules", static: false, private: false, access: { has: obj => "getRateLimitRules" in obj, get: obj => obj.getRateLimitRules }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createRateLimitRule_decorators, { kind: "method", name: "createRateLimitRule", static: false, private: false, access: { has: obj => "createRateLimitRule" in obj, get: obj => obj.createRateLimitRule }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateRateLimitRule_decorators, { kind: "method", name: "updateRateLimitRule", static: false, private: false, access: { has: obj => "updateRateLimitRule" in obj, get: obj => obj.updateRateLimitRule }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteRateLimitRule_decorators, { kind: "method", name: "deleteRateLimitRule", static: false, private: false, access: { has: obj => "deleteRateLimitRule" in obj, get: obj => obj.deleteRateLimitRule }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getClientApplications_decorators, { kind: "method", name: "getClientApplications", static: false, private: false, access: { has: obj => "getClientApplications" in obj, get: obj => obj.getClientApplications }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createClientApplication_decorators, { kind: "method", name: "createClientApplication", static: false, private: false, access: { has: obj => "createClientApplication" in obj, get: obj => obj.createClientApplication }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateClientApplication_decorators, { kind: "method", name: "updateClientApplication", static: false, private: false, access: { has: obj => "updateClientApplication" in obj, get: obj => obj.updateClientApplication }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _approveClientApplication_decorators, { kind: "method", name: "approveClientApplication", static: false, private: false, access: { has: obj => "approveClientApplication" in obj, get: obj => obj.approveClientApplication }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApiAnalytics_decorators, { kind: "method", name: "getApiAnalytics", static: false, private: false, access: { has: obj => "getApiAnalytics" in obj, get: obj => obj.getApiAnalytics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUsageTrends_decorators, { kind: "method", name: "getUsageTrends", static: false, private: false, access: { has: obj => "getUsageTrends" in obj, get: obj => obj.getUsageTrends }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getEndpointPerformance_decorators, { kind: "method", name: "getEndpointPerformance", static: false, private: false, access: { has: obj => "getEndpointPerformance" in obj, get: obj => obj.getEndpointPerformance }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getThreatDetection_decorators, { kind: "method", name: "getThreatDetection", static: false, private: false, access: { has: obj => "getThreatDetection" in obj, get: obj => obj.getThreatDetection }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _blockIpAddress_decorators, { kind: "method", name: "blockIpAddress", static: false, private: false, access: { has: obj => "blockIpAddress" in obj, get: obj => obj.blockIpAddress }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBlockedIps_decorators, { kind: "method", name: "getBlockedIps", static: false, private: false, access: { has: obj => "getBlockedIps" in obj, get: obj => obj.getBlockedIps }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _unblockIpAddress_decorators, { kind: "method", name: "unblockIpAddress", static: false, private: false, access: { has: obj => "unblockIpAddress" in obj, get: obj => obj.unblockIpAddress }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getApiHealth_decorators, { kind: "method", name: "getApiHealth", static: false, private: false, access: { has: obj => "getApiHealth" in obj, get: obj => obj.getApiHealth }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ApiManagementController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ApiManagementController = _classThis;
})();
exports.ApiManagementController = ApiManagementController;
