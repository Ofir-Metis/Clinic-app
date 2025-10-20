"use strict";
/**
 * ConfigController - Configuration management and environment controls
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
exports.ConfigController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let ConfigController = (() => {
    let _classDecorators = [(0, common_1.Controller)('config'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getConfigOverview_decorators;
    let _getConfigItems_decorators;
    let _createConfigItem_decorators;
    let _updateConfigItem_decorators;
    let _deleteConfigItem_decorators;
    let _getEnvironments_decorators;
    let _createEnvironment_decorators;
    let _updateEnvironment_decorators;
    let _deploy_decorators;
    let _getDeployments_decorators;
    let _rollback_decorators;
    let _getFeatureFlags_decorators;
    let _createFeatureFlag_decorators;
    let _toggleFeatureFlag_decorators;
    let _getConfigTemplates_decorators;
    let _createConfigTemplate_decorators;
    let _applyConfigTemplate_decorators;
    let _validateConfiguration_decorators;
    let _detectConfigurationDrift_decorators;
    let _getConfigurationHistory_decorators;
    let _restoreConfiguration_decorators;
    var ConfigController = _classThis = class {
        constructor(configService) {
            this.configService = (__runInitializers(this, _instanceExtraInitializers), configService);
            this.logger = new common_1.Logger(ConfigController.name);
        }
        /**
         * Get configuration overview
         */
        async getConfigOverview(req) {
            try {
                const overview = await this.configService.getConfigOverview();
                this.logger.log(`Admin ${req.user.sub} viewed configuration overview`);
                return {
                    success: true,
                    data: overview,
                };
            }
            catch (error) {
                this.logger.error('Failed to get configuration overview:', error);
                throw new common_1.HttpException('Failed to retrieve configuration overview', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Configuration Management
         */
        async getConfigItems(environment, service, category, search, req) {
            try {
                const items = await this.configService.getConfigItems({
                    environment,
                    service,
                    category,
                    search,
                });
                return {
                    success: true,
                    data: items,
                };
            }
            catch (error) {
                this.logger.error('Failed to get configuration items:', error);
                throw new common_1.HttpException('Failed to retrieve configuration items', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createConfigItem(item, req) {
            try {
                const createdItem = await this.configService.createConfigItem(item, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} created config item: ${item.key} in ${item.environment}`);
                return {
                    success: true,
                    data: createdItem,
                    message: 'Configuration item created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create configuration item:', error);
                throw new common_1.HttpException('Failed to create configuration item', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateConfigItem(itemId, item, req) {
            try {
                const updatedItem = await this.configService.updateConfigItem(itemId, item, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} updated config item ${itemId}`);
                return {
                    success: true,
                    data: updatedItem,
                    message: 'Configuration item updated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to update configuration item:', error);
                throw new common_1.HttpException('Failed to update configuration item', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async deleteConfigItem(itemId, req) {
            try {
                await this.configService.deleteConfigItem(itemId, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} deleted config item ${itemId}`);
                return {
                    success: true,
                    message: 'Configuration item deleted successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to delete configuration item:', error);
                throw new common_1.HttpException('Failed to delete configuration item', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Environment Management
         */
        async getEnvironments(req) {
            try {
                const environments = await this.configService.getEnvironments();
                return {
                    success: true,
                    data: environments,
                };
            }
            catch (error) {
                this.logger.error('Failed to get environments:', error);
                throw new common_1.HttpException('Failed to retrieve environments', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createEnvironment(environment, req) {
            try {
                const createdEnvironment = await this.configService.createEnvironment(environment, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} created environment: ${environment.name}`);
                return {
                    success: true,
                    data: createdEnvironment,
                    message: 'Environment created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create environment:', error);
                throw new common_1.HttpException('Failed to create environment', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateEnvironment(envId, environment, req) {
            try {
                const updatedEnvironment = await this.configService.updateEnvironment(envId, environment, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} updated environment ${envId}`);
                return {
                    success: true,
                    data: updatedEnvironment,
                    message: 'Environment updated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to update environment:', error);
                throw new common_1.HttpException('Failed to update environment', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Deployment Management
         */
        async deploy(deploymentRequest, req) {
            try {
                const deployment = await this.configService.deploy(deploymentRequest, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} initiated deployment to ${deploymentRequest.environment}`);
                return {
                    success: true,
                    data: deployment,
                    message: 'Deployment initiated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to initiate deployment:', error);
                throw new common_1.HttpException('Failed to initiate deployment', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getDeployments(environment, status, limit = 50, req) {
            try {
                const deployments = await this.configService.getDeployments({
                    environment,
                    status,
                    limit,
                });
                return {
                    success: true,
                    data: deployments,
                };
            }
            catch (error) {
                this.logger.error('Failed to get deployments:', error);
                throw new common_1.HttpException('Failed to retrieve deployments', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async rollback(deploymentId, rollbackOptions, req) {
            try {
                const result = await this.configService.rollback(deploymentId, rollbackOptions, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} initiated rollback for deployment ${deploymentId}`);
                return {
                    success: true,
                    data: result,
                    message: 'Rollback initiated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to initiate rollback:', error);
                throw new common_1.HttpException('Failed to initiate rollback', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Feature Flags Management
         */
        async getFeatureFlags(environment, req) {
            try {
                const featureFlags = await this.configService.getFeatureFlags(environment);
                return {
                    success: true,
                    data: featureFlags,
                };
            }
            catch (error) {
                this.logger.error('Failed to get feature flags:', error);
                throw new common_1.HttpException('Failed to retrieve feature flags', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createFeatureFlag(featureFlag, req) {
            try {
                const createdFlag = await this.configService.createFeatureFlag(featureFlag, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} created feature flag: ${featureFlag.key}`);
                return {
                    success: true,
                    data: createdFlag,
                    message: 'Feature flag created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create feature flag:', error);
                throw new common_1.HttpException('Failed to create feature flag', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async toggleFeatureFlag(flagId, toggleData, req) {
            try {
                const result = await this.configService.toggleFeatureFlag(flagId, toggleData, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} ${toggleData.enabled ? 'enabled' : 'disabled'} feature flag ${flagId}`);
                return {
                    success: true,
                    data: result,
                    message: `Feature flag ${toggleData.enabled ? 'enabled' : 'disabled'} successfully`,
                };
            }
            catch (error) {
                this.logger.error('Failed to toggle feature flag:', error);
                throw new common_1.HttpException('Failed to toggle feature flag', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Configuration Templates
         */
        async getConfigTemplates(req) {
            try {
                const templates = await this.configService.getConfigTemplates();
                return {
                    success: true,
                    data: templates,
                };
            }
            catch (error) {
                this.logger.error('Failed to get configuration templates:', error);
                throw new common_1.HttpException('Failed to retrieve configuration templates', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createConfigTemplate(template, req) {
            try {
                const createdTemplate = await this.configService.createConfigTemplate(template, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} created config template: ${template.name}`);
                return {
                    success: true,
                    data: createdTemplate,
                    message: 'Configuration template created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create configuration template:', error);
                throw new common_1.HttpException('Failed to create configuration template', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async applyConfigTemplate(templateId, applyData, req) {
            try {
                const result = await this.configService.applyConfigTemplate(templateId, applyData, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} applied config template ${templateId} to ${applyData.environment}`);
                return {
                    success: true,
                    data: result,
                    message: 'Configuration template applied successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to apply configuration template:', error);
                throw new common_1.HttpException('Failed to apply configuration template', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Configuration Validation and Drift Detection
         */
        async validateConfiguration(validationRequest, req) {
            try {
                const validation = await this.configService.validateConfiguration(validationRequest);
                this.logger.log(`Admin ${req.user.sub} validated configuration for ${validationRequest.environment}`);
                return {
                    success: true,
                    data: validation,
                    message: 'Configuration validation completed',
                };
            }
            catch (error) {
                this.logger.error('Failed to validate configuration:', error);
                throw new common_1.HttpException('Failed to validate configuration', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async detectConfigurationDrift(environment, req) {
            try {
                const drift = await this.configService.detectConfigurationDrift(environment);
                return {
                    success: true,
                    data: drift,
                };
            }
            catch (error) {
                this.logger.error('Failed to detect configuration drift:', error);
                throw new common_1.HttpException('Failed to detect configuration drift', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Configuration History and Audit
         */
        async getConfigurationHistory(key, environment, limit = 100, req) {
            try {
                const history = await this.configService.getConfigurationHistory({
                    key,
                    environment,
                    limit,
                });
                return {
                    success: true,
                    data: history,
                };
            }
            catch (error) {
                this.logger.error('Failed to get configuration history:', error);
                throw new common_1.HttpException('Failed to retrieve configuration history', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async restoreConfiguration(historyId, restoreOptions, req) {
            try {
                const result = await this.configService.restoreConfiguration(historyId, restoreOptions, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} restored configuration from history ${historyId}`);
                return {
                    success: true,
                    data: result,
                    message: 'Configuration restored successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to restore configuration:', error);
                throw new common_1.HttpException('Failed to restore configuration', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "ConfigController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getConfigOverview_decorators = [(0, common_1.Get)('overview'), (0, common_2.RequireRoles)('admin')];
        _getConfigItems_decorators = [(0, common_1.Get)('items'), (0, common_2.RequireRoles)('admin')];
        _createConfigItem_decorators = [(0, common_1.Post)('items'), (0, common_2.RequireRoles)('admin')];
        _updateConfigItem_decorators = [(0, common_1.Put)('items/:itemId'), (0, common_2.RequireRoles)('admin')];
        _deleteConfigItem_decorators = [(0, common_1.Delete)('items/:itemId'), (0, common_2.RequireRoles)('admin')];
        _getEnvironments_decorators = [(0, common_1.Get)('environments'), (0, common_2.RequireRoles)('admin')];
        _createEnvironment_decorators = [(0, common_1.Post)('environments'), (0, common_2.RequireRoles)('admin')];
        _updateEnvironment_decorators = [(0, common_1.Put)('environments/:envId'), (0, common_2.RequireRoles)('admin')];
        _deploy_decorators = [(0, common_1.Post)('deploy'), (0, common_2.RequireRoles)('admin')];
        _getDeployments_decorators = [(0, common_1.Get)('deployments'), (0, common_2.RequireRoles)('admin')];
        _rollback_decorators = [(0, common_1.Post)('deployments/:deploymentId/rollback'), (0, common_2.RequireRoles)('admin')];
        _getFeatureFlags_decorators = [(0, common_1.Get)('feature-flags'), (0, common_2.RequireRoles)('admin')];
        _createFeatureFlag_decorators = [(0, common_1.Post)('feature-flags'), (0, common_2.RequireRoles)('admin')];
        _toggleFeatureFlag_decorators = [(0, common_1.Put)('feature-flags/:flagId/toggle'), (0, common_2.RequireRoles)('admin')];
        _getConfigTemplates_decorators = [(0, common_1.Get)('templates'), (0, common_2.RequireRoles)('admin')];
        _createConfigTemplate_decorators = [(0, common_1.Post)('templates'), (0, common_2.RequireRoles)('admin')];
        _applyConfigTemplate_decorators = [(0, common_1.Post)('templates/:templateId/apply'), (0, common_2.RequireRoles)('admin')];
        _validateConfiguration_decorators = [(0, common_1.Post)('validate'), (0, common_2.RequireRoles)('admin')];
        _detectConfigurationDrift_decorators = [(0, common_1.Get)('drift-detection'), (0, common_2.RequireRoles)('admin')];
        _getConfigurationHistory_decorators = [(0, common_1.Get)('history'), (0, common_2.RequireRoles)('admin')];
        _restoreConfiguration_decorators = [(0, common_1.Post)('restore/:historyId'), (0, common_2.RequireRoles)('admin')];
        __esDecorate(_classThis, null, _getConfigOverview_decorators, { kind: "method", name: "getConfigOverview", static: false, private: false, access: { has: obj => "getConfigOverview" in obj, get: obj => obj.getConfigOverview }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getConfigItems_decorators, { kind: "method", name: "getConfigItems", static: false, private: false, access: { has: obj => "getConfigItems" in obj, get: obj => obj.getConfigItems }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createConfigItem_decorators, { kind: "method", name: "createConfigItem", static: false, private: false, access: { has: obj => "createConfigItem" in obj, get: obj => obj.createConfigItem }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateConfigItem_decorators, { kind: "method", name: "updateConfigItem", static: false, private: false, access: { has: obj => "updateConfigItem" in obj, get: obj => obj.updateConfigItem }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteConfigItem_decorators, { kind: "method", name: "deleteConfigItem", static: false, private: false, access: { has: obj => "deleteConfigItem" in obj, get: obj => obj.deleteConfigItem }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getEnvironments_decorators, { kind: "method", name: "getEnvironments", static: false, private: false, access: { has: obj => "getEnvironments" in obj, get: obj => obj.getEnvironments }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createEnvironment_decorators, { kind: "method", name: "createEnvironment", static: false, private: false, access: { has: obj => "createEnvironment" in obj, get: obj => obj.createEnvironment }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateEnvironment_decorators, { kind: "method", name: "updateEnvironment", static: false, private: false, access: { has: obj => "updateEnvironment" in obj, get: obj => obj.updateEnvironment }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deploy_decorators, { kind: "method", name: "deploy", static: false, private: false, access: { has: obj => "deploy" in obj, get: obj => obj.deploy }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDeployments_decorators, { kind: "method", name: "getDeployments", static: false, private: false, access: { has: obj => "getDeployments" in obj, get: obj => obj.getDeployments }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _rollback_decorators, { kind: "method", name: "rollback", static: false, private: false, access: { has: obj => "rollback" in obj, get: obj => obj.rollback }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFeatureFlags_decorators, { kind: "method", name: "getFeatureFlags", static: false, private: false, access: { has: obj => "getFeatureFlags" in obj, get: obj => obj.getFeatureFlags }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createFeatureFlag_decorators, { kind: "method", name: "createFeatureFlag", static: false, private: false, access: { has: obj => "createFeatureFlag" in obj, get: obj => obj.createFeatureFlag }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _toggleFeatureFlag_decorators, { kind: "method", name: "toggleFeatureFlag", static: false, private: false, access: { has: obj => "toggleFeatureFlag" in obj, get: obj => obj.toggleFeatureFlag }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getConfigTemplates_decorators, { kind: "method", name: "getConfigTemplates", static: false, private: false, access: { has: obj => "getConfigTemplates" in obj, get: obj => obj.getConfigTemplates }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createConfigTemplate_decorators, { kind: "method", name: "createConfigTemplate", static: false, private: false, access: { has: obj => "createConfigTemplate" in obj, get: obj => obj.createConfigTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _applyConfigTemplate_decorators, { kind: "method", name: "applyConfigTemplate", static: false, private: false, access: { has: obj => "applyConfigTemplate" in obj, get: obj => obj.applyConfigTemplate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _validateConfiguration_decorators, { kind: "method", name: "validateConfiguration", static: false, private: false, access: { has: obj => "validateConfiguration" in obj, get: obj => obj.validateConfiguration }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _detectConfigurationDrift_decorators, { kind: "method", name: "detectConfigurationDrift", static: false, private: false, access: { has: obj => "detectConfigurationDrift" in obj, get: obj => obj.detectConfigurationDrift }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getConfigurationHistory_decorators, { kind: "method", name: "getConfigurationHistory", static: false, private: false, access: { has: obj => "getConfigurationHistory" in obj, get: obj => obj.getConfigurationHistory }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _restoreConfiguration_decorators, { kind: "method", name: "restoreConfiguration", static: false, private: false, access: { has: obj => "restoreConfiguration" in obj, get: obj => obj.restoreConfiguration }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ConfigController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ConfigController = _classThis;
})();
exports.ConfigController = ConfigController;
