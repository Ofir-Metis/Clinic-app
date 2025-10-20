"use strict";
/**
 * AdminController - System administration dashboard endpoints
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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let AdminController = (() => {
    let _classDecorators = [(0, common_1.Controller)('admin'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('admin')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getSystemHealth_decorators;
    let _getSystemMetrics_decorators;
    let _getSystemLogs_decorators;
    let _getUsers_decorators;
    let _updateUserStatus_decorators;
    let _getSubscriptions_decorators;
    let _updateSubscription_decorators;
    let _getSystemConfig_decorators;
    let _updateSystemConfig_decorators;
    let _executeMaintenanceTask_decorators;
    let _getAuditLogs_decorators;
    let _getFeatureFlags_decorators;
    let _updateFeatureFlag_decorators;
    var AdminController = _classThis = class {
        constructor(adminService) {
            this.adminService = (__runInitializers(this, _instanceExtraInitializers), adminService);
            this.logger = new common_1.Logger(AdminController.name);
        }
        /**
         * Get system health overview
         */
        async getSystemHealth(req) {
            try {
                this.logger.log(`Admin ${req.user.sub} requested system health`);
                return await this.adminService.getSystemHealth();
            }
            catch (error) {
                this.logger.error('Failed to get system health:', error);
                throw new common_1.HttpException('Failed to retrieve system health', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get system metrics and performance data
         */
        async getSystemMetrics(timeframe = '1h', metric) {
            try {
                return await this.adminService.getSystemMetrics(timeframe, metric);
            }
            catch (error) {
                this.logger.error('Failed to get system metrics:', error);
                throw new common_1.HttpException('Failed to retrieve system metrics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get system logs with filtering
         */
        async getSystemLogs(level, service, startDate, endDate, page = 1, limit = 100) {
            try {
                return await this.adminService.getSystemLogs({
                    level,
                    service,
                    startDate,
                    endDate,
                    page,
                    limit,
                });
            }
            catch (error) {
                this.logger.error('Failed to get system logs:', error);
                throw new common_1.HttpException('Failed to retrieve system logs', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get user management data
         */
        async getUsers(role, status, search, page = 1, limit = 50) {
            try {
                return await this.adminService.getUsers({
                    role,
                    status,
                    search,
                    page,
                    limit,
                });
            }
            catch (error) {
                this.logger.error('Failed to get users:', error);
                throw new common_1.HttpException('Failed to retrieve users', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Update user status
         */
        async updateUserStatus(userId, body, req) {
            try {
                const result = await this.adminService.updateUserStatus(userId, body.status, req.user.sub, body.reason);
                this.logger.log(`Admin ${req.user.sub} updated user ${userId} status to ${body.status}`);
                return result;
            }
            catch (error) {
                this.logger.error('Failed to update user status:', error);
                throw new common_1.HttpException('Failed to update user status', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get subscription analytics
         */
        async getSubscriptions(status, plan) {
            try {
                return await this.adminService.getSubscriptions({ status, plan });
            }
            catch (error) {
                this.logger.error('Failed to get subscriptions:', error);
                throw new common_1.HttpException('Failed to retrieve subscriptions', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Update subscription
         */
        async updateSubscription(subscriptionId, body, req) {
            try {
                const result = await this.adminService.updateSubscription(subscriptionId, body, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} updated subscription ${subscriptionId}`);
                return result;
            }
            catch (error) {
                this.logger.error('Failed to update subscription:', error);
                throw new common_1.HttpException('Failed to update subscription', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get system configuration
         */
        async getSystemConfig() {
            try {
                return await this.adminService.getSystemConfig();
            }
            catch (error) {
                this.logger.error('Failed to get system config:', error);
                throw new common_1.HttpException('Failed to retrieve system configuration', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Update system configuration
         */
        async updateSystemConfig(config, req) {
            try {
                const result = await this.adminService.updateSystemConfig(config, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} updated system configuration`);
                return result;
            }
            catch (error) {
                this.logger.error('Failed to update system config:', error);
                throw new common_1.HttpException('Failed to update system configuration', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Execute system maintenance tasks
         */
        async executeMaintenanceTask(body, req) {
            try {
                this.logger.log(`Admin ${req.user.sub} initiated maintenance task: ${body.task}`);
                const result = await this.adminService.executeMaintenanceTask(body.task, body.parameters, req.user.sub);
                return result;
            }
            catch (error) {
                this.logger.error('Failed to execute maintenance task:', error);
                throw new common_1.HttpException('Failed to execute maintenance task', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get audit logs
         */
        async getAuditLogs(userId, action, startDate, endDate, page = 1, limit = 50) {
            try {
                return await this.adminService.getAuditLogs({
                    userId,
                    action,
                    startDate,
                    endDate,
                    page,
                    limit,
                });
            }
            catch (error) {
                this.logger.error('Failed to get audit logs:', error);
                throw new common_1.HttpException('Failed to retrieve audit logs', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get feature flags and toggles
         */
        async getFeatureFlags() {
            try {
                return await this.adminService.getFeatureFlags();
            }
            catch (error) {
                this.logger.error('Failed to get feature flags:', error);
                throw new common_1.HttpException('Failed to retrieve feature flags', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Update feature flags
         */
        async updateFeatureFlag(flagName, body, req) {
            try {
                const result = await this.adminService.updateFeatureFlag(flagName, body.enabled, body.rolloutPercentage, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} updated feature flag ${flagName} to ${body.enabled}`);
                return result;
            }
            catch (error) {
                this.logger.error('Failed to update feature flag:', error);
                throw new common_1.HttpException('Failed to update feature flag', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "AdminController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getSystemHealth_decorators = [(0, common_1.Get)('health')];
        _getSystemMetrics_decorators = [(0, common_1.Get)('metrics')];
        _getSystemLogs_decorators = [(0, common_1.Get)('logs')];
        _getUsers_decorators = [(0, common_1.Get)('users')];
        _updateUserStatus_decorators = [(0, common_1.Put)('users/:userId/status')];
        _getSubscriptions_decorators = [(0, common_1.Get)('subscriptions')];
        _updateSubscription_decorators = [(0, common_1.Put)('subscriptions/:subscriptionId')];
        _getSystemConfig_decorators = [(0, common_1.Get)('config')];
        _updateSystemConfig_decorators = [(0, common_1.Put)('config')];
        _executeMaintenanceTask_decorators = [(0, common_1.Post)('maintenance')];
        _getAuditLogs_decorators = [(0, common_1.Get)('audit')];
        _getFeatureFlags_decorators = [(0, common_1.Get)('features')];
        _updateFeatureFlag_decorators = [(0, common_1.Put)('features/:flagName')];
        __esDecorate(_classThis, null, _getSystemHealth_decorators, { kind: "method", name: "getSystemHealth", static: false, private: false, access: { has: obj => "getSystemHealth" in obj, get: obj => obj.getSystemHealth }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSystemMetrics_decorators, { kind: "method", name: "getSystemMetrics", static: false, private: false, access: { has: obj => "getSystemMetrics" in obj, get: obj => obj.getSystemMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSystemLogs_decorators, { kind: "method", name: "getSystemLogs", static: false, private: false, access: { has: obj => "getSystemLogs" in obj, get: obj => obj.getSystemLogs }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUsers_decorators, { kind: "method", name: "getUsers", static: false, private: false, access: { has: obj => "getUsers" in obj, get: obj => obj.getUsers }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateUserStatus_decorators, { kind: "method", name: "updateUserStatus", static: false, private: false, access: { has: obj => "updateUserStatus" in obj, get: obj => obj.updateUserStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSubscriptions_decorators, { kind: "method", name: "getSubscriptions", static: false, private: false, access: { has: obj => "getSubscriptions" in obj, get: obj => obj.getSubscriptions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateSubscription_decorators, { kind: "method", name: "updateSubscription", static: false, private: false, access: { has: obj => "updateSubscription" in obj, get: obj => obj.updateSubscription }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSystemConfig_decorators, { kind: "method", name: "getSystemConfig", static: false, private: false, access: { has: obj => "getSystemConfig" in obj, get: obj => obj.getSystemConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateSystemConfig_decorators, { kind: "method", name: "updateSystemConfig", static: false, private: false, access: { has: obj => "updateSystemConfig" in obj, get: obj => obj.updateSystemConfig }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _executeMaintenanceTask_decorators, { kind: "method", name: "executeMaintenanceTask", static: false, private: false, access: { has: obj => "executeMaintenanceTask" in obj, get: obj => obj.executeMaintenanceTask }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAuditLogs_decorators, { kind: "method", name: "getAuditLogs", static: false, private: false, access: { has: obj => "getAuditLogs" in obj, get: obj => obj.getAuditLogs }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFeatureFlags_decorators, { kind: "method", name: "getFeatureFlags", static: false, private: false, access: { has: obj => "getFeatureFlags" in obj, get: obj => obj.getFeatureFlags }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateFeatureFlag_decorators, { kind: "method", name: "updateFeatureFlag", static: false, private: false, access: { has: obj => "updateFeatureFlag" in obj, get: obj => obj.updateFeatureFlag }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminController = _classThis;
})();
exports.AdminController = AdminController;
