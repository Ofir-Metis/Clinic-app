"use strict";
/**
 * MonitoringController - Advanced system monitoring and alerting
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
exports.MonitoringController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let MonitoringController = (() => {
    let _classDecorators = [(0, common_1.Controller)('monitoring'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getMonitoringOverview_decorators;
    let _queryMetrics_decorators;
    let _getRealtimeStatus_decorators;
    let _getAlertRules_decorators;
    let _createAlertRule_decorators;
    let _updateAlertRule_decorators;
    let _deleteAlertRule_decorators;
    let _getActiveAlerts_decorators;
    let _acknowledgeAlert_decorators;
    let _resolveAlert_decorators;
    let _getDashboards_decorators;
    let _createDashboard_decorators;
    let _getDashboard_decorators;
    let _getPerformanceSummary_decorators;
    let _getBottlenecks_decorators;
    let _getServiceHealth_decorators;
    let _runHealthCheck_decorators;
    let _searchLogs_decorators;
    let _getLogPatterns_decorators;
    var MonitoringController = _classThis = class {
        constructor(monitoringService) {
            this.monitoringService = (__runInitializers(this, _instanceExtraInitializers), monitoringService);
            this.logger = new common_1.Logger(MonitoringController.name);
        }
        /**
         * Get monitoring overview and health status
         */
        async getMonitoringOverview(req) {
            try {
                const overview = await this.monitoringService.getMonitoringOverview();
                this.logger.log(`Admin ${req.user.sub} viewed monitoring overview`);
                return {
                    success: true,
                    data: overview,
                };
            }
            catch (error) {
                this.logger.error('Failed to get monitoring overview:', error);
                throw new common_1.HttpException('Failed to retrieve monitoring overview', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get system metrics with time series data
         */
        async queryMetrics(query, req) {
            try {
                const metrics = await this.monitoringService.queryMetrics(query);
                return {
                    success: true,
                    data: metrics,
                };
            }
            catch (error) {
                this.logger.error('Failed to query metrics:', error);
                throw new common_1.HttpException('Failed to query metrics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get real-time system status
         */
        async getRealtimeStatus(req) {
            try {
                const status = await this.monitoringService.getRealtimeStatus();
                return {
                    success: true,
                    data: status,
                };
            }
            catch (error) {
                this.logger.error('Failed to get realtime status:', error);
                throw new common_1.HttpException('Failed to retrieve realtime status', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Alert Management
         */
        async getAlertRules(req) {
            try {
                const rules = await this.monitoringService.getAlertRules();
                return {
                    success: true,
                    data: rules,
                };
            }
            catch (error) {
                this.logger.error('Failed to get alert rules:', error);
                throw new common_1.HttpException('Failed to retrieve alert rules', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createAlertRule(rule, req) {
            try {
                const createdRule = await this.monitoringService.createAlertRule(rule, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} created alert rule: ${rule.name}`);
                return {
                    success: true,
                    data: createdRule,
                    message: 'Alert rule created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create alert rule:', error);
                throw new common_1.HttpException('Failed to create alert rule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateAlertRule(ruleId, rule, req) {
            try {
                const updatedRule = await this.monitoringService.updateAlertRule(ruleId, rule, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} updated alert rule ${ruleId}`);
                return {
                    success: true,
                    data: updatedRule,
                    message: 'Alert rule updated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to update alert rule:', error);
                throw new common_1.HttpException('Failed to update alert rule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async deleteAlertRule(ruleId, req) {
            try {
                await this.monitoringService.deleteAlertRule(ruleId, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} deleted alert rule ${ruleId}`);
                return {
                    success: true,
                    message: 'Alert rule deleted successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to delete alert rule:', error);
                throw new common_1.HttpException('Failed to delete alert rule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get active alerts
         */
        async getActiveAlerts(severity, limit = 100, req) {
            try {
                const alerts = await this.monitoringService.getActiveAlerts({
                    severity,
                    limit,
                });
                return {
                    success: true,
                    data: alerts,
                };
            }
            catch (error) {
                this.logger.error('Failed to get active alerts:', error);
                throw new common_1.HttpException('Failed to retrieve active alerts', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Acknowledge alert
         */
        async acknowledgeAlert(alertId, body, req) {
            try {
                await this.monitoringService.acknowledgeAlert(alertId, req.user.sub, body.notes);
                this.logger.log(`Admin ${req.user.sub} acknowledged alert ${alertId}`);
                return {
                    success: true,
                    message: 'Alert acknowledged successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to acknowledge alert:', error);
                throw new common_1.HttpException('Failed to acknowledge alert', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Resolve alert
         */
        async resolveAlert(alertId, body, req) {
            try {
                await this.monitoringService.resolveAlert(alertId, req.user.sub, body.resolution);
                this.logger.log(`Admin ${req.user.sub} resolved alert ${alertId}`);
                return {
                    success: true,
                    message: 'Alert resolved successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to resolve alert:', error);
                throw new common_1.HttpException('Failed to resolve alert', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Dashboard Management
         */
        async getDashboards(req) {
            try {
                const dashboards = await this.monitoringService.getDashboards(req.user.sub);
                return {
                    success: true,
                    data: dashboards,
                };
            }
            catch (error) {
                this.logger.error('Failed to get dashboards:', error);
                throw new common_1.HttpException('Failed to retrieve dashboards', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createDashboard(dashboard, req) {
            try {
                const createdDashboard = await this.monitoringService.createDashboard(dashboard, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} created dashboard: ${dashboard.name}`);
                return {
                    success: true,
                    data: createdDashboard,
                    message: 'Dashboard created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create dashboard:', error);
                throw new common_1.HttpException('Failed to create dashboard', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getDashboard(dashboardId, req) {
            try {
                const dashboard = await this.monitoringService.getDashboard(dashboardId);
                return {
                    success: true,
                    data: dashboard,
                };
            }
            catch (error) {
                this.logger.error(`Failed to get dashboard ${dashboardId}:`, error);
                throw new common_1.HttpException('Failed to retrieve dashboard', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Performance Analytics
         */
        async getPerformanceSummary(timeRange = '24h', req) {
            try {
                const summary = await this.monitoringService.getPerformanceSummary(timeRange);
                return {
                    success: true,
                    data: summary,
                };
            }
            catch (error) {
                this.logger.error('Failed to get performance summary:', error);
                throw new common_1.HttpException('Failed to retrieve performance summary', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getBottlenecks(req) {
            try {
                const bottlenecks = await this.monitoringService.getBottlenecks();
                return {
                    success: true,
                    data: bottlenecks,
                };
            }
            catch (error) {
                this.logger.error('Failed to get bottlenecks:', error);
                throw new common_1.HttpException('Failed to retrieve bottlenecks', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Service Health Checks
         */
        async getServiceHealth(req) {
            try {
                const health = await this.monitoringService.getServiceHealth();
                return {
                    success: true,
                    data: health,
                };
            }
            catch (error) {
                this.logger.error('Failed to get service health:', error);
                throw new common_1.HttpException('Failed to retrieve service health', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async runHealthCheck(serviceName, req) {
            try {
                const result = await this.monitoringService.runHealthCheck(serviceName);
                this.logger.log(`Admin ${req.user.sub} ran health check for ${serviceName}`);
                return {
                    success: true,
                    data: result,
                    message: 'Health check completed',
                };
            }
            catch (error) {
                this.logger.error(`Failed to run health check for ${serviceName}:`, error);
                throw new common_1.HttpException('Failed to run health check', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Log Analytics
         */
        async searchLogs(searchRequest, req) {
            try {
                const logs = await this.monitoringService.searchLogs(searchRequest);
                return {
                    success: true,
                    data: logs,
                };
            }
            catch (error) {
                this.logger.error('Failed to search logs:', error);
                throw new common_1.HttpException('Failed to search logs', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getLogPatterns(timeRange = '24h', req) {
            try {
                const patterns = await this.monitoringService.getLogPatterns(timeRange);
                return {
                    success: true,
                    data: patterns,
                };
            }
            catch (error) {
                this.logger.error('Failed to get log patterns:', error);
                throw new common_1.HttpException('Failed to retrieve log patterns', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "MonitoringController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getMonitoringOverview_decorators = [(0, common_1.Get)('overview'), (0, common_2.RequireRoles)('admin')];
        _queryMetrics_decorators = [(0, common_1.Post)('metrics/query'), (0, common_2.RequireRoles)('admin')];
        _getRealtimeStatus_decorators = [(0, common_1.Get)('status/realtime'), (0, common_2.RequireRoles)('admin')];
        _getAlertRules_decorators = [(0, common_1.Get)('alerts/rules'), (0, common_2.RequireRoles)('admin')];
        _createAlertRule_decorators = [(0, common_1.Post)('alerts/rules'), (0, common_2.RequireRoles)('admin')];
        _updateAlertRule_decorators = [(0, common_1.Put)('alerts/rules/:ruleId'), (0, common_2.RequireRoles)('admin')];
        _deleteAlertRule_decorators = [(0, common_1.Delete)('alerts/rules/:ruleId'), (0, common_2.RequireRoles)('admin')];
        _getActiveAlerts_decorators = [(0, common_1.Get)('alerts/active'), (0, common_2.RequireRoles)('admin')];
        _acknowledgeAlert_decorators = [(0, common_1.Post)('alerts/:alertId/acknowledge'), (0, common_2.RequireRoles)('admin')];
        _resolveAlert_decorators = [(0, common_1.Post)('alerts/:alertId/resolve'), (0, common_2.RequireRoles)('admin')];
        _getDashboards_decorators = [(0, common_1.Get)('dashboards'), (0, common_2.RequireRoles)('admin')];
        _createDashboard_decorators = [(0, common_1.Post)('dashboards'), (0, common_2.RequireRoles)('admin')];
        _getDashboard_decorators = [(0, common_1.Get)('dashboards/:dashboardId'), (0, common_2.RequireRoles)('admin')];
        _getPerformanceSummary_decorators = [(0, common_1.Get)('performance/summary'), (0, common_2.RequireRoles)('admin')];
        _getBottlenecks_decorators = [(0, common_1.Get)('performance/bottlenecks'), (0, common_2.RequireRoles)('admin')];
        _getServiceHealth_decorators = [(0, common_1.Get)('health/services'), (0, common_2.RequireRoles)('admin')];
        _runHealthCheck_decorators = [(0, common_1.Post)('health/services/:serviceName/check'), (0, common_2.RequireRoles)('admin')];
        _searchLogs_decorators = [(0, common_1.Post)('logs/search'), (0, common_2.RequireRoles)('admin')];
        _getLogPatterns_decorators = [(0, common_1.Get)('logs/patterns'), (0, common_2.RequireRoles)('admin')];
        __esDecorate(_classThis, null, _getMonitoringOverview_decorators, { kind: "method", name: "getMonitoringOverview", static: false, private: false, access: { has: obj => "getMonitoringOverview" in obj, get: obj => obj.getMonitoringOverview }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _queryMetrics_decorators, { kind: "method", name: "queryMetrics", static: false, private: false, access: { has: obj => "queryMetrics" in obj, get: obj => obj.queryMetrics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRealtimeStatus_decorators, { kind: "method", name: "getRealtimeStatus", static: false, private: false, access: { has: obj => "getRealtimeStatus" in obj, get: obj => obj.getRealtimeStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAlertRules_decorators, { kind: "method", name: "getAlertRules", static: false, private: false, access: { has: obj => "getAlertRules" in obj, get: obj => obj.getAlertRules }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createAlertRule_decorators, { kind: "method", name: "createAlertRule", static: false, private: false, access: { has: obj => "createAlertRule" in obj, get: obj => obj.createAlertRule }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateAlertRule_decorators, { kind: "method", name: "updateAlertRule", static: false, private: false, access: { has: obj => "updateAlertRule" in obj, get: obj => obj.updateAlertRule }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteAlertRule_decorators, { kind: "method", name: "deleteAlertRule", static: false, private: false, access: { has: obj => "deleteAlertRule" in obj, get: obj => obj.deleteAlertRule }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getActiveAlerts_decorators, { kind: "method", name: "getActiveAlerts", static: false, private: false, access: { has: obj => "getActiveAlerts" in obj, get: obj => obj.getActiveAlerts }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _acknowledgeAlert_decorators, { kind: "method", name: "acknowledgeAlert", static: false, private: false, access: { has: obj => "acknowledgeAlert" in obj, get: obj => obj.acknowledgeAlert }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resolveAlert_decorators, { kind: "method", name: "resolveAlert", static: false, private: false, access: { has: obj => "resolveAlert" in obj, get: obj => obj.resolveAlert }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDashboards_decorators, { kind: "method", name: "getDashboards", static: false, private: false, access: { has: obj => "getDashboards" in obj, get: obj => obj.getDashboards }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createDashboard_decorators, { kind: "method", name: "createDashboard", static: false, private: false, access: { has: obj => "createDashboard" in obj, get: obj => obj.createDashboard }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDashboard_decorators, { kind: "method", name: "getDashboard", static: false, private: false, access: { has: obj => "getDashboard" in obj, get: obj => obj.getDashboard }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPerformanceSummary_decorators, { kind: "method", name: "getPerformanceSummary", static: false, private: false, access: { has: obj => "getPerformanceSummary" in obj, get: obj => obj.getPerformanceSummary }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBottlenecks_decorators, { kind: "method", name: "getBottlenecks", static: false, private: false, access: { has: obj => "getBottlenecks" in obj, get: obj => obj.getBottlenecks }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getServiceHealth_decorators, { kind: "method", name: "getServiceHealth", static: false, private: false, access: { has: obj => "getServiceHealth" in obj, get: obj => obj.getServiceHealth }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _runHealthCheck_decorators, { kind: "method", name: "runHealthCheck", static: false, private: false, access: { has: obj => "runHealthCheck" in obj, get: obj => obj.runHealthCheck }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _searchLogs_decorators, { kind: "method", name: "searchLogs", static: false, private: false, access: { has: obj => "searchLogs" in obj, get: obj => obj.searchLogs }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLogPatterns_decorators, { kind: "method", name: "getLogPatterns", static: false, private: false, access: { has: obj => "getLogPatterns" in obj, get: obj => obj.getLogPatterns }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MonitoringController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MonitoringController = _classThis;
})();
exports.MonitoringController = MonitoringController;
