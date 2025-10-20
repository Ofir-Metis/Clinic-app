"use strict";
/**
 * ConfigService - Configuration management and environment controls implementation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let ConfigService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ConfigService = _classThis = class {
        constructor(httpService) {
            this.httpService = httpService;
            this.logger = new common_1.Logger(ConfigService.name);
        }
        /**
         * Get comprehensive configuration overview
         */
        async getConfigOverview() {
            try {
                // In production, this would query actual configuration stores
                const mockOverview = {
                    totalConfigurations: 456,
                    environments: 4,
                    activeDeployments: 2,
                    featureFlags: 23,
                    configurationHealth: {
                        validConfigurations: 441,
                        invalidConfigurations: 8,
                        driftDetected: 7
                    },
                    recentChanges: [
                        {
                            key: 'database.max_connections',
                            environment: 'production',
                            action: 'update',
                            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                            changedBy: 'admin_001'
                        },
                        {
                            key: 'features.new_appointment_flow',
                            environment: 'staging',
                            action: 'create',
                            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                            changedBy: 'admin_002'
                        }
                    ],
                    environmentStatus: {
                        production: {
                            status: 'healthy',
                            configCount: 156,
                            lastDeployment: new Date(Date.now() - 6 * 60 * 60 * 1000)
                        },
                        staging: {
                            status: 'degraded',
                            configCount: 134,
                            lastDeployment: new Date(Date.now() - 2 * 60 * 60 * 1000)
                        },
                        development: {
                            status: 'healthy',
                            configCount: 123,
                            lastDeployment: new Date(Date.now() - 30 * 60 * 1000)
                        },
                        test: {
                            status: 'healthy',
                            configCount: 43,
                            lastDeployment: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    }
                };
                this.logger.log('Configuration overview retrieved');
                return mockOverview;
            }
            catch (error) {
                this.logger.error('Failed to get configuration overview:', error);
                throw new common_1.HttpException('Failed to retrieve configuration overview', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get configuration items with filtering
         */
        async getConfigItems(filters) {
            try {
                const { environment, service, category, search } = filters;
                // Mock configuration items
                let mockItems = [
                    {
                        id: 'config_001',
                        key: 'database.max_connections',
                        value: 100,
                        type: 'number',
                        environment: 'production',
                        service: 'api-gateway',
                        category: 'database',
                        description: 'Maximum number of database connections',
                        isSecret: false,
                        lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000),
                        modifiedBy: 'admin_001',
                        version: 3,
                        tags: ['database', 'performance']
                    },
                    {
                        id: 'config_002',
                        key: 'jwt.secret',
                        value: '***ENCRYPTED***',
                        type: 'encrypted',
                        environment: 'production',
                        service: 'auth-service',
                        category: 'security',
                        description: 'JWT signing secret key',
                        isSecret: true,
                        lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        modifiedBy: 'admin_001',
                        version: 1,
                        tags: ['security', 'authentication']
                    },
                    {
                        id: 'config_003',
                        key: 'features.new_appointment_flow',
                        value: false,
                        type: 'boolean',
                        environment: 'production',
                        service: 'appointments-service',
                        category: 'features',
                        description: 'Enable new appointment booking flow',
                        isSecret: false,
                        lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        modifiedBy: 'admin_002',
                        version: 2,
                        tags: ['feature-flag', 'appointments']
                    },
                    {
                        id: 'config_004',
                        key: 'email.smtp_settings',
                        value: {
                            host: 'smtp.clinic.com',
                            port: 587,
                            secure: true,
                            auth: {
                                user: 'noreply@clinic.com'
                            }
                        },
                        type: 'json',
                        environment: 'production',
                        service: 'notifications-service',
                        category: 'email',
                        description: 'SMTP configuration for email sending',
                        isSecret: false,
                        lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                        modifiedBy: 'admin_001',
                        version: 1,
                        tags: ['email', 'notifications']
                    }
                ];
                // Apply filters
                if (environment) {
                    mockItems = mockItems.filter(item => item.environment === environment);
                }
                if (service) {
                    mockItems = mockItems.filter(item => item.service === service);
                }
                if (category) {
                    mockItems = mockItems.filter(item => item.category === category);
                }
                if (search) {
                    mockItems = mockItems.filter(item => item.key.toLowerCase().includes(search.toLowerCase()) ||
                        item.description.toLowerCase().includes(search.toLowerCase()));
                }
                return mockItems;
            }
            catch (error) {
                this.logger.error('Failed to get configuration items:', error);
                throw new common_1.HttpException('Failed to retrieve configuration items', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Create configuration item
         */
        async createConfigItem(item, adminUserId) {
            try {
                const configId = `config_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
                const createdItem = {
                    id: configId,
                    ...item,
                    lastModified: new Date(),
                    modifiedBy: adminUserId,
                    version: 1
                };
                // In production, validate configuration and save to config store
                this.logger.log(`Configuration item ${item.key} created in ${item.environment} by admin ${adminUserId}`);
                return createdItem;
            }
            catch (error) {
                this.logger.error('Failed to create configuration item:', error);
                throw new common_1.HttpException('Failed to create configuration item', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Update configuration item
         */
        async updateConfigItem(itemId, item, adminUserId) {
            try {
                const updatedItem = {
                    id: itemId,
                    ...item,
                    lastModified: new Date(),
                    modifiedBy: adminUserId,
                    version: (item.version || 1) + 1
                };
                // In production, validate and update configuration
                this.logger.log(`Configuration item ${itemId} updated by admin ${adminUserId}`);
                return updatedItem;
            }
            catch (error) {
                this.logger.error('Failed to update configuration item:', error);
                throw new common_1.HttpException('Failed to update configuration item', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Delete configuration item
         */
        async deleteConfigItem(itemId, adminUserId) {
            try {
                // In production, remove from configuration store and log change
                this.logger.log(`Configuration item ${itemId} deleted by admin ${adminUserId}`);
            }
            catch (error) {
                this.logger.error('Failed to delete configuration item:', error);
                throw new common_1.HttpException('Failed to delete configuration item', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get environments
         */
        async getEnvironments() {
            try {
                const mockEnvironments = [
                    {
                        id: 'env_prod',
                        name: 'production',
                        displayName: 'Production',
                        type: 'production',
                        status: 'active',
                        description: 'Production environment for live traffic',
                        variables: {
                            NODE_ENV: 'production',
                            LOG_LEVEL: 'warn',
                            RATE_LIMIT: 1000
                        },
                        deploymentConfig: {
                            autoDeployment: false,
                            approvalRequired: true,
                            rollbackEnabled: true,
                            healthCheckTimeout: 300
                        },
                        resources: {
                            cpu: '2000m',
                            memory: '4Gi',
                            storage: '100Gi',
                            replicas: 3
                        },
                        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                        createdBy: 'admin_001'
                    },
                    {
                        id: 'env_staging',
                        name: 'staging',
                        displayName: 'Staging',
                        type: 'staging',
                        status: 'active',
                        description: 'Staging environment for pre-production testing',
                        variables: {
                            NODE_ENV: 'staging',
                            LOG_LEVEL: 'info',
                            RATE_LIMIT: 500
                        },
                        deploymentConfig: {
                            autoDeployment: true,
                            approvalRequired: false,
                            rollbackEnabled: true,
                            healthCheckTimeout: 180
                        },
                        resources: {
                            cpu: '1000m',
                            memory: '2Gi',
                            storage: '50Gi',
                            replicas: 2
                        },
                        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                        createdBy: 'admin_001'
                    },
                    {
                        id: 'env_dev',
                        name: 'development',
                        displayName: 'Development',
                        type: 'development',
                        status: 'active',
                        description: 'Development environment for active development',
                        variables: {
                            NODE_ENV: 'development',
                            LOG_LEVEL: 'debug',
                            RATE_LIMIT: 100
                        },
                        deploymentConfig: {
                            autoDeployment: true,
                            approvalRequired: false,
                            rollbackEnabled: false,
                            healthCheckTimeout: 60
                        },
                        resources: {
                            cpu: '500m',
                            memory: '1Gi',
                            storage: '20Gi',
                            replicas: 1
                        },
                        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        createdBy: 'admin_002'
                    }
                ];
                return mockEnvironments;
            }
            catch (error) {
                this.logger.error('Failed to get environments:', error);
                throw new common_1.HttpException('Failed to retrieve environments', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Create environment
         */
        async createEnvironment(environment, adminUserId) {
            try {
                const envId = `env_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
                const createdEnvironment = {
                    id: envId,
                    ...environment,
                    createdAt: new Date(),
                    createdBy: adminUserId
                };
                this.logger.log(`Environment ${environment.name} created by admin ${adminUserId}`);
                return createdEnvironment;
            }
            catch (error) {
                this.logger.error('Failed to create environment:', error);
                throw new common_1.HttpException('Failed to create environment', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Update environment
         */
        async updateEnvironment(envId, environment, adminUserId) {
            try {
                const updatedEnvironment = {
                    id: envId,
                    ...environment,
                    updatedAt: new Date(),
                    updatedBy: adminUserId
                };
                this.logger.log(`Environment ${envId} updated by admin ${adminUserId}`);
                return updatedEnvironment;
            }
            catch (error) {
                this.logger.error('Failed to update environment:', error);
                throw new common_1.HttpException('Failed to update environment', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Deploy configuration changes
         */
        async deploy(deploymentRequest, adminUserId) {
            try {
                const deploymentId = `deploy_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
                const deployment = {
                    id: deploymentId,
                    environment: deploymentRequest.environment,
                    services: deploymentRequest.services,
                    version: deploymentRequest.version || `v${Date.now()}`,
                    status: 'pending',
                    initiatedBy: adminUserId,
                    initiatedAt: new Date(),
                    configChanges: deploymentRequest.configChanges || [],
                    rollbackPlan: deploymentRequest.rollbackPlan,
                    logs: [
                        {
                            timestamp: new Date(),
                            level: 'info',
                            message: `Deployment ${deploymentId} initiated by ${adminUserId}`,
                            details: { services: deploymentRequest.services }
                        }
                    ],
                    healthChecks: []
                };
                // Simulate deployment process
                setTimeout(() => {
                    this.simulateDeploymentProgress(deploymentId);
                }, 1000);
                this.logger.log(`Deployment ${deploymentId} initiated for ${deploymentRequest.environment}`);
                return deployment;
            }
            catch (error) {
                this.logger.error('Failed to initiate deployment:', error);
                throw new common_1.HttpException('Failed to initiate deployment', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async simulateDeploymentProgress(deploymentId) {
            // Simulate deployment stages for demo purposes
            this.logger.log(`Deployment ${deploymentId} progressing through stages`);
            setTimeout(() => {
                this.logger.log(`Deployment ${deploymentId} completed successfully`);
            }, 10000);
        }
        /**
         * Get deployments with filtering
         */
        async getDeployments(filters) {
            try {
                const mockDeployments = [
                    {
                        id: 'deploy_001',
                        environment: 'production',
                        services: ['api-gateway', 'auth-service'],
                        version: 'v1.2.3',
                        status: 'completed',
                        initiatedBy: 'admin_001',
                        initiatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
                        completedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
                        configChanges: [
                            {
                                key: 'database.max_connections',
                                oldValue: 80,
                                newValue: 100,
                                action: 'update'
                            }
                        ],
                        logs: [
                            {
                                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                                level: 'info',
                                message: 'Deployment initiated'
                            },
                            {
                                timestamp: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
                                level: 'info',
                                message: 'Deployment completed successfully'
                            }
                        ],
                        healthChecks: [
                            {
                                service: 'api-gateway',
                                status: 'pass',
                                timestamp: new Date(Date.now() - 5.4 * 60 * 60 * 1000)
                            },
                            {
                                service: 'auth-service',
                                status: 'pass',
                                timestamp: new Date(Date.now() - 5.4 * 60 * 60 * 1000)
                            }
                        ]
                    },
                    {
                        id: 'deploy_002',
                        environment: 'staging',
                        services: ['appointments-service'],
                        version: 'v1.3.0-rc1',
                        status: 'running',
                        initiatedBy: 'admin_002',
                        initiatedAt: new Date(Date.now() - 30 * 60 * 1000),
                        configChanges: [
                            {
                                key: 'features.new_appointment_flow',
                                oldValue: false,
                                newValue: true,
                                action: 'update'
                            }
                        ],
                        logs: [
                            {
                                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                                level: 'info',
                                message: 'Deployment initiated'
                            },
                            {
                                timestamp: new Date(Date.now() - 25 * 60 * 1000),
                                level: 'info',
                                message: 'Configuration updated successfully'
                            }
                        ],
                        healthChecks: []
                    }
                ];
                // Apply filters
                let filteredDeployments = mockDeployments;
                if (filters.environment) {
                    filteredDeployments = filteredDeployments.filter(d => d.environment === filters.environment);
                }
                if (filters.status) {
                    filteredDeployments = filteredDeployments.filter(d => d.status === filters.status);
                }
                return filteredDeployments.slice(0, filters.limit || 50);
            }
            catch (error) {
                this.logger.error('Failed to get deployments:', error);
                throw new common_1.HttpException('Failed to retrieve deployments', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Rollback deployment
         */
        async rollback(deploymentId, rollbackOptions, adminUserId) {
            try {
                const rollbackId = `rollback_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
                const result = {
                    id: rollbackId,
                    deploymentId,
                    status: 'initiated',
                    reason: rollbackOptions.reason,
                    initiatedBy: adminUserId,
                    initiatedAt: new Date()
                };
                this.logger.log(`Rollback ${rollbackId} initiated for deployment ${deploymentId} by admin ${adminUserId}`);
                return result;
            }
            catch (error) {
                this.logger.error('Failed to initiate rollback:', error);
                throw new common_1.HttpException('Failed to initiate rollback', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get feature flags
         */
        async getFeatureFlags(environment) {
            try {
                let mockFlags = [
                    {
                        id: 'flag_001',
                        key: 'new_appointment_flow',
                        name: 'New Appointment Flow',
                        description: 'Enable the redesigned appointment booking flow',
                        enabled: false,
                        environments: ['development', 'staging'],
                        rules: [
                            {
                                condition: 'user_segment',
                                userSegments: ['beta_testers'],
                                percentage: 50
                            }
                        ],
                        createdBy: 'admin_002',
                        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                    },
                    {
                        id: 'flag_002',
                        key: 'enhanced_security',
                        name: 'Enhanced Security Features',
                        description: 'Enable additional security features like 2FA',
                        enabled: true,
                        environments: ['production', 'staging'],
                        rules: [
                            {
                                condition: 'percentage',
                                percentage: 100
                            }
                        ],
                        createdBy: 'admin_001',
                        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
                    }
                ];
                if (environment) {
                    mockFlags = mockFlags.filter(flag => flag.environments.includes(environment));
                }
                return mockFlags;
            }
            catch (error) {
                this.logger.error('Failed to get feature flags:', error);
                throw new common_1.HttpException('Failed to retrieve feature flags', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Create feature flag
         */
        async createFeatureFlag(featureFlag, adminUserId) {
            try {
                const flagId = `flag_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
                const createdFlag = {
                    id: flagId,
                    ...featureFlag,
                    createdBy: adminUserId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                this.logger.log(`Feature flag ${featureFlag.key} created by admin ${adminUserId}`);
                return createdFlag;
            }
            catch (error) {
                this.logger.error('Failed to create feature flag:', error);
                throw new common_1.HttpException('Failed to create feature flag', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Toggle feature flag
         */
        async toggleFeatureFlag(flagId, toggleData, adminUserId) {
            try {
                const result = {
                    flagId,
                    enabled: toggleData.enabled,
                    environment: toggleData.environment || 'all',
                    toggledBy: adminUserId,
                    toggledAt: new Date()
                };
                this.logger.log(`Feature flag ${flagId} ${toggleData.enabled ? 'enabled' : 'disabled'} by admin ${adminUserId}`);
                return result;
            }
            catch (error) {
                this.logger.error('Failed to toggle feature flag:', error);
                throw new common_1.HttpException('Failed to toggle feature flag', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get configuration templates
         */
        async getConfigTemplates() {
            try {
                const mockTemplates = [
                    {
                        id: 'template_001',
                        name: 'Microservice Base Configuration',
                        description: 'Base configuration template for new microservices',
                        category: 'service',
                        template: {
                            'server.port': '${PORT}',
                            'database.url': '${DATABASE_URL}',
                            'redis.url': '${REDIS_URL}',
                            'logging.level': '${LOG_LEVEL}',
                            'metrics.enabled': true,
                            'health.enabled': true
                        },
                        variables: [
                            {
                                key: 'PORT',
                                type: 'number',
                                required: true,
                                defaultValue: 3000,
                                description: 'Service port number'
                            },
                            {
                                key: 'DATABASE_URL',
                                type: 'string',
                                required: true,
                                description: 'Database connection URL'
                            },
                            {
                                key: 'REDIS_URL',
                                type: 'string',
                                required: false,
                                defaultValue: 'redis://localhost:6379',
                                description: 'Redis connection URL'
                            },
                            {
                                key: 'LOG_LEVEL',
                                type: 'string',
                                required: false,
                                defaultValue: 'info',
                                description: 'Logging level (debug, info, warn, error)'
                            }
                        ],
                        createdBy: 'admin_001',
                        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                ];
                return mockTemplates;
            }
            catch (error) {
                this.logger.error('Failed to get configuration templates:', error);
                throw new common_1.HttpException('Failed to retrieve configuration templates', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Create configuration template
         */
        async createConfigTemplate(template, adminUserId) {
            try {
                const templateId = `template_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
                const createdTemplate = {
                    id: templateId,
                    ...template,
                    createdBy: adminUserId,
                    createdAt: new Date()
                };
                this.logger.log(`Configuration template ${template.name} created by admin ${adminUserId}`);
                return createdTemplate;
            }
            catch (error) {
                this.logger.error('Failed to create configuration template:', error);
                throw new common_1.HttpException('Failed to create configuration template', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Apply configuration template
         */
        async applyConfigTemplate(templateId, applyData, adminUserId) {
            try {
                const applicationId = `apply_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
                const result = {
                    id: applicationId,
                    templateId,
                    environment: applyData.environment,
                    variables: applyData.variables,
                    services: applyData.services || ['all'],
                    appliedBy: adminUserId,
                    appliedAt: new Date(),
                    status: 'completed',
                    configsCreated: Object.keys(applyData.variables).length
                };
                this.logger.log(`Configuration template ${templateId} applied to ${applyData.environment} by admin ${adminUserId}`);
                return result;
            }
            catch (error) {
                this.logger.error('Failed to apply configuration template:', error);
                throw new common_1.HttpException('Failed to apply configuration template', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Validate configuration
         */
        async validateConfiguration(validationRequest) {
            try {
                const mockValidation = {
                    environment: validationRequest.environment,
                    timestamp: new Date(),
                    overallStatus: 'warning',
                    results: [
                        {
                            key: 'database.max_connections',
                            service: 'api-gateway',
                            status: 'valid',
                            issues: [],
                            recommendations: []
                        },
                        {
                            key: 'jwt.secret',
                            service: 'auth-service',
                            status: 'warning',
                            issues: ['Secret key length is below recommended 256 bits'],
                            recommendations: ['Use a longer secret key for better security']
                        },
                        {
                            key: 'redis.timeout',
                            service: 'notifications-service',
                            status: 'error',
                            issues: ['Configuration key is missing'],
                            recommendations: ['Add redis.timeout configuration with recommended value of 5000ms']
                        }
                    ],
                    summary: {
                        totalChecked: 45,
                        validCount: 40,
                        warningCount: 3,
                        errorCount: 2
                    }
                };
                return mockValidation;
            }
            catch (error) {
                this.logger.error('Failed to validate configuration:', error);
                throw new common_1.HttpException('Failed to validate configuration', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Detect configuration drift
         */
        async detectConfigurationDrift(environment) {
            try {
                const mockDrift = {
                    environment: environment || 'production',
                    detectionTime: new Date(),
                    driftItems: [
                        {
                            key: 'database.pool_size',
                            service: 'api-gateway',
                            expectedValue: 20,
                            actualValue: 15,
                            driftType: 'modified',
                            severity: 'medium',
                            recommendations: ['Update runtime configuration to match expected value']
                        },
                        {
                            key: 'logging.debug_enabled',
                            service: 'auth-service',
                            expectedValue: false,
                            actualValue: null,
                            driftType: 'missing',
                            severity: 'low',
                            recommendations: ['Add missing configuration key with default value']
                        }
                    ],
                    summary: {
                        totalDrifts: 2,
                        criticalDrifts: 0,
                        affectedServices: ['api-gateway', 'auth-service']
                    }
                };
                return mockDrift;
            }
            catch (error) {
                this.logger.error('Failed to detect configuration drift:', error);
                throw new common_1.HttpException('Failed to detect configuration drift', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get configuration history
         */
        async getConfigurationHistory(filters) {
            try {
                const mockHistory = [
                    {
                        id: 'history_001',
                        configId: 'config_001',
                        key: 'database.max_connections',
                        environment: 'production',
                        action: 'update',
                        oldValue: 80,
                        newValue: 100,
                        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                        changedBy: 'admin_001',
                        reason: 'Increase connection limit for better performance',
                        deploymentId: 'deploy_001'
                    },
                    {
                        id: 'history_002',
                        configId: 'config_003',
                        key: 'features.new_appointment_flow',
                        environment: 'staging',
                        action: 'create',
                        oldValue: null,
                        newValue: true,
                        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                        changedBy: 'admin_002',
                        reason: 'Enable feature for testing'
                    }
                ];
                // Apply filters
                let filteredHistory = mockHistory;
                if (filters.key) {
                    filteredHistory = filteredHistory.filter(h => h.key.includes(filters.key));
                }
                if (filters.environment) {
                    filteredHistory = filteredHistory.filter(h => h.environment === filters.environment);
                }
                return filteredHistory.slice(0, filters.limit || 100);
            }
            catch (error) {
                this.logger.error('Failed to get configuration history:', error);
                throw new common_1.HttpException('Failed to retrieve configuration history', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Restore configuration from history
         */
        async restoreConfiguration(historyId, restoreOptions, adminUserId) {
            try {
                const restoreId = `restore_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
                const result = {
                    id: restoreId,
                    historyId,
                    reason: restoreOptions.reason,
                    restoredBy: adminUserId,
                    restoredAt: new Date(),
                    status: 'completed'
                };
                this.logger.log(`Configuration restored from history ${historyId} by admin ${adminUserId}: ${restoreOptions.reason}`);
                return result;
            }
            catch (error) {
                this.logger.error('Failed to restore configuration:', error);
                throw new common_1.HttpException('Failed to restore configuration', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "ConfigService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ConfigService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ConfigService = _classThis;
})();
exports.ConfigService = ConfigService;
