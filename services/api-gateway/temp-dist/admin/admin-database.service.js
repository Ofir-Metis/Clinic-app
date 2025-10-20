"use strict";
/**
 * AdminDatabaseService - Integration service for real database operations
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
exports.AdminDatabaseService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
let AdminDatabaseService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AdminDatabaseService = _classThis = class {
        constructor(adminUserRepository, apiKeyRepository, auditEventRepository, performanceMetricRepository, systemConfigRepository, systemAlertRepository, backupJobRepository) {
            this.adminUserRepository = adminUserRepository;
            this.apiKeyRepository = apiKeyRepository;
            this.auditEventRepository = auditEventRepository;
            this.performanceMetricRepository = performanceMetricRepository;
            this.systemConfigRepository = systemConfigRepository;
            this.systemAlertRepository = systemAlertRepository;
            this.backupJobRepository = backupJobRepository;
            this.logger = new common_1.Logger(AdminDatabaseService.name);
        }
        /**
         * Admin User Management
         */
        async createAdminUser(userData) {
            const passwordHash = await bcrypt.hash(userData.password, 12);
            const user = this.adminUserRepository.create({
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                passwordHash,
                role: userData.role,
                permissions: userData.permissions,
                createdBy: userData.createdBy,
                isActive: true,
                isVerified: false,
            });
            return this.adminUserRepository.save(user);
        }
        async validateAdminUser(email, password) {
            const user = await this.adminUserRepository.findByEmail(email);
            if (!user || !user.isActive) {
                return null;
            }
            if (user.lockedUntil && user.lockedUntil > new Date()) {
                throw new Error('Account is temporarily locked');
            }
            const isValidPassword = await bcrypt.compare(password, user.passwordHash);
            if (!isValidPassword) {
                await this.adminUserRepository.incrementFailedAttempts(user.id);
                if (user.failedLoginAttempts >= 4) { // 5 attempts total
                    await this.adminUserRepository.lockUser(user.id, 30 * 60 * 1000); // 30 minutes
                }
                return null;
            }
            await this.adminUserRepository.updateLoginInfo(user.id, '0.0.0.0'); // Would be real IP
            return user;
        }
        async getAdminUsers() {
            return this.adminUserRepository.findActiveUsers();
        }
        async getUserStats() {
            return this.adminUserRepository.getUserStats();
        }
        /**
         * API Key Management
         */
        async createApiKey(keyData) {
            const apiKey = this.generateApiKey();
            const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
            const keyPreview = `${apiKey.substring(0, 20)}...`;
            const apiKeyEntity = this.apiKeyRepository.create({
                ...keyData,
                keyHash,
                keyPreview,
                status: 'active',
            });
            const savedKey = await this.apiKeyRepository.save(apiKeyEntity);
            // Return the plain API key only on creation
            return {
                ...savedKey,
                apiKey,
            };
        }
        async getApiKeys(filters = {}) {
            let query = this.apiKeyRepository.createQueryBuilder('key');
            if (filters.clientId) {
                query.andWhere('key.clientId = :clientId', { clientId: filters.clientId });
            }
            if (filters.status) {
                query.andWhere('key.status = :status', { status: filters.status });
            }
            query.orderBy('key.createdAt', 'DESC');
            if (filters.limit) {
                query.limit(filters.limit);
            }
            if (filters.offset) {
                query.offset(filters.offset);
            }
            const [keys, total] = await query.getManyAndCount();
            return {
                keys,
                total,
                page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
                totalPages: Math.ceil(total / (filters.limit || 50)),
            };
        }
        async revokeApiKey(keyId, reason, revokedBy) {
            await this.apiKeyRepository.update(keyId, {
                status: 'revoked',
                revocationReason: reason,
                revokedAt: new Date(),
                revokedBy,
            });
        }
        async trackApiKeyUsage(keyHash, requestCount = 1) {
            const key = await this.apiKeyRepository.findByKeyHash(keyHash);
            if (key) {
                await this.apiKeyRepository.updateUsageStats(key.id, requestCount);
            }
        }
        generateApiKey() {
            return `clinic_${crypto.randomBytes(16).toString('hex')}`;
        }
        /**
         * Audit Trail Management
         */
        async createAuditEvent(eventData) {
            const auditEvent = this.auditEventRepository.create({
                ...eventData,
                timestamp: new Date(),
                riskLevel: eventData.riskLevel || 'low',
            });
            return this.auditEventRepository.save(auditEvent);
        }
        async getAuditEvents(filters = {}) {
            const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
            const endDate = filters.endDate ? new Date(filters.endDate) : new Date();
            return this.auditEventRepository.findByDateRange(startDate, endDate, filters.limit || 100, filters.offset || 0);
        }
        async getComplianceReport(startDate, endDate) {
            return this.auditEventRepository.getComplianceReport(startDate, endDate);
        }
        async getSuspiciousActivity(hours = 24) {
            return this.auditEventRepository.findSuspiciousActivity(hours);
        }
        /**
         * System Configuration Management
         */
        async getSystemConfig(key, environment = 'production') {
            return this.systemConfigRepository.findOne({
                where: { key, environment },
            });
        }
        async setSystemConfig(configData) {
            const config = this.systemConfigRepository.create({
                ...configData,
                environment: configData.environment || 'production',
                type: configData.type || 'string',
                version: 1,
            });
            return this.systemConfigRepository.save(config);
        }
        async getSystemConfigs(filters = {}) {
            let query = this.systemConfigRepository.createQueryBuilder('config');
            if (filters.environment) {
                query.andWhere('config.environment = :environment', { environment: filters.environment });
            }
            if (filters.service) {
                query.andWhere('config.service = :service', { service: filters.service });
            }
            if (filters.category) {
                query.andWhere('config.category = :category', { category: filters.category });
            }
            query.orderBy('config.category', 'ASC').addOrderBy('config.key', 'ASC');
            return query.getMany();
        }
        /**
         * System Alerts Management
         */
        async createSystemAlert(alertData) {
            const alert = this.systemAlertRepository.create(alertData);
            return this.systemAlertRepository.save(alert);
        }
        async getActiveAlerts() {
            return this.systemAlertRepository.find({
                where: { status: 'active' },
                order: { createdAt: 'DESC' },
            });
        }
        async resolveAlert(alertId, resolution, resolvedBy) {
            await this.systemAlertRepository.update(alertId, {
                status: 'resolved',
                resolution,
                resolvedAt: new Date(),
                resolvedBy,
            });
        }
        /**
         * Backup Management
         */
        async createBackupJob(jobData) {
            const job = this.backupJobRepository.create({
                ...jobData,
                status: 'pending',
                retentionDays: jobData.retentionDays || 30,
            });
            return this.backupJobRepository.save(job);
        }
        async updateBackupJobStatus(jobId, status, updates = {}) {
            const updateData = { status, ...updates };
            if (status === 'running' && !updates.startedAt) {
                updateData.startedAt = new Date();
            }
            if (status === 'completed' && !updates.completedAt) {
                updateData.completedAt = new Date();
                updateData.progressPercentage = 100;
            }
            await this.backupJobRepository.update(jobId, updateData);
        }
        async getBackupJobs(limit = 50) {
            return this.backupJobRepository.find({
                order: { createdAt: 'DESC' },
                take: limit,
            });
        }
        /**
         * Performance Metrics
         */
        async recordPerformanceMetric(service, metricName, value, unit, tags, metadata) {
            return this.performanceMetricRepository.recordMetric(service, metricName, value, unit, tags, metadata);
        }
        async getPerformanceMetrics(service, metricName, startTime, endTime, interval = 'hour') {
            return this.performanceMetricRepository.getMetricSeries(service, metricName, startTime, endTime, interval);
        }
        async getSystemPerformanceOverview(startTime, endTime) {
            return this.performanceMetricRepository.getSystemOverview(startTime, endTime);
        }
        async getSlowQueries(service, hours = 24, limit = 10) {
            return this.performanceMetricRepository.getTopSlowQueries(service, limit, hours);
        }
        /**
         * Health Checks and Monitoring
         */
        async getSystemHealth() {
            try {
                // Test database connectivity
                await this.adminUserRepository.count();
                // Get recent alerts
                const recentAlerts = await this.systemAlertRepository.find({
                    where: { status: 'active' },
                    order: { createdAt: 'DESC' },
                    take: 10,
                });
                // Get performance metrics alerts
                const performanceAlerts = await this.performanceMetricRepository.getAlertConditions();
                // Calculate health metrics
                const criticalAlerts = recentAlerts.filter(a => a.severity === 'critical').length;
                const warningAlerts = recentAlerts.filter(a => a.severity === 'warning').length;
                const status = criticalAlerts > 0 ? 'unhealthy' :
                    warningAlerts > 0 ? 'degraded' : 'healthy';
                return {
                    status,
                    database: {
                        connected: true,
                        responseTime: 0, // Would measure actual response time
                    },
                    alerts: {
                        total: recentAlerts.length,
                        critical: criticalAlerts,
                        warning: warningAlerts,
                        info: recentAlerts.filter(a => a.severity === 'info').length,
                    },
                    performance: {
                        alertConditions: performanceAlerts.length,
                    },
                    lastCheck: new Date(),
                };
            }
            catch (error) {
                this.logger.error('Health check failed:', error);
                return {
                    status: 'unhealthy',
                    database: {
                        connected: false,
                        error: error.message,
                    },
                    lastCheck: new Date(),
                };
            }
        }
        /**
         * Maintenance Operations
         */
        async cleanupOldData(retentionDays = 90) {
            const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
            // Clean up old audit events
            const deletedAuditEvents = await this.auditEventRepository
                .createQueryBuilder()
                .delete()
                .where('createdAt < :cutoffDate', { cutoffDate })
                .execute();
            // Clean up old performance metrics
            const deletedMetrics = await this.performanceMetricRepository
                .cleanupOldMetrics(retentionDays);
            // Clean up old backup jobs
            const deletedBackups = await this.backupJobRepository
                .createQueryBuilder()
                .delete()
                .where('createdAt < :cutoffDate AND status IN (:...statuses)', {
                cutoffDate,
                statuses: ['completed', 'failed'],
            })
                .execute();
            this.logger.log(`Cleanup completed: ${deletedAuditEvents.affected} audit events, ${deletedMetrics} metrics, ${deletedBackups.affected} backup jobs`);
            return {
                auditEvents: deletedAuditEvents.affected || 0,
                performanceMetrics: deletedMetrics,
                backupJobs: deletedBackups.affected || 0,
            };
        }
    };
    __setFunctionName(_classThis, "AdminDatabaseService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminDatabaseService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminDatabaseService = _classThis;
})();
exports.AdminDatabaseService = AdminDatabaseService;
