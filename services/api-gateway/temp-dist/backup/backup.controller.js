"use strict";
/**
 * BackupController - System backup and disaster recovery management
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
exports.BackupController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let BackupController = (() => {
    let _classDecorators = [(0, common_1.Controller)('backup'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getBackupOverview_decorators;
    let _getBackups_decorators;
    let _createBackup_decorators;
    let _getBackupDetails_decorators;
    let _deleteBackup_decorators;
    let _restoreBackup_decorators;
    let _getBackupSchedules_decorators;
    let _createBackupSchedule_decorators;
    let _updateBackupSchedule_decorators;
    let _deleteBackupSchedule_decorators;
    let _getDisasterRecoveryPlans_decorators;
    let _createDisasterRecoveryPlan_decorators;
    let _testDisasterRecoveryPlan_decorators;
    let _getStorageStatus_decorators;
    let _cleanupOldBackups_decorators;
    let _verifyBackup_decorators;
    let _getIntegrityReport_decorators;
    var BackupController = _classThis = class {
        constructor(backupService) {
            this.backupService = (__runInitializers(this, _instanceExtraInitializers), backupService);
            this.logger = new common_1.Logger(BackupController.name);
        }
        /**
         * Get backup overview and status
         */
        async getBackupOverview(req) {
            try {
                const overview = await this.backupService.getBackupOverview();
                this.logger.log(`Admin ${req.user.sub} viewed backup overview`);
                return {
                    success: true,
                    data: overview,
                };
            }
            catch (error) {
                this.logger.error('Failed to get backup overview:', error);
                throw new common_1.HttpException('Failed to retrieve backup overview', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get list of all backups
         */
        async getBackups(limit = 50, offset = 0, type, status, req) {
            try {
                const backups = await this.backupService.getBackups({
                    limit,
                    offset,
                    type,
                    status,
                });
                return {
                    success: true,
                    data: backups,
                };
            }
            catch (error) {
                this.logger.error('Failed to get backups:', error);
                throw new common_1.HttpException('Failed to retrieve backups', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Create a new backup
         */
        async createBackup(backupRequest, req) {
            try {
                const backup = await this.backupService.createBackup(backupRequest, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} initiated ${backupRequest.type} backup`);
                return {
                    success: true,
                    data: backup,
                    message: 'Backup initiated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create backup:', error);
                throw new common_1.HttpException('Failed to create backup', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get backup details
         */
        async getBackupDetails(backupId, req) {
            try {
                const backup = await this.backupService.getBackupDetails(backupId);
                return {
                    success: true,
                    data: backup,
                };
            }
            catch (error) {
                this.logger.error(`Failed to get backup ${backupId}:`, error);
                throw new common_1.HttpException('Failed to retrieve backup details', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Delete a backup
         */
        async deleteBackup(backupId, req) {
            try {
                await this.backupService.deleteBackup(backupId, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} deleted backup ${backupId}`);
                return {
                    success: true,
                    message: 'Backup deleted successfully',
                };
            }
            catch (error) {
                this.logger.error(`Failed to delete backup ${backupId}:`, error);
                throw new common_1.HttpException('Failed to delete backup', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Restore from backup
         */
        async restoreBackup(restoreRequest, req) {
            try {
                const result = await this.backupService.restoreBackup(restoreRequest, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} initiated restore from backup ${restoreRequest.backupId}`);
                return {
                    success: true,
                    data: result,
                    message: 'Restore initiated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to restore backup:', error);
                throw new common_1.HttpException('Failed to restore backup', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Backup Schedule Management
         */
        async getBackupSchedules(req) {
            try {
                const schedules = await this.backupService.getBackupSchedules();
                return {
                    success: true,
                    data: schedules,
                };
            }
            catch (error) {
                this.logger.error('Failed to get backup schedules:', error);
                throw new common_1.HttpException('Failed to retrieve backup schedules', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createBackupSchedule(scheduleRequest, req) {
            try {
                const schedule = await this.backupService.createBackupSchedule(scheduleRequest, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} created backup schedule: ${scheduleRequest.name}`);
                return {
                    success: true,
                    data: schedule,
                    message: 'Backup schedule created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create backup schedule:', error);
                throw new common_1.HttpException('Failed to create backup schedule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateBackupSchedule(scheduleId, scheduleRequest, req) {
            try {
                const schedule = await this.backupService.updateBackupSchedule(scheduleId, scheduleRequest, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} updated backup schedule ${scheduleId}`);
                return {
                    success: true,
                    data: schedule,
                    message: 'Backup schedule updated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to update backup schedule:', error);
                throw new common_1.HttpException('Failed to update backup schedule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async deleteBackupSchedule(scheduleId, req) {
            try {
                await this.backupService.deleteBackupSchedule(scheduleId, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} deleted backup schedule ${scheduleId}`);
                return {
                    success: true,
                    message: 'Backup schedule deleted successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to delete backup schedule:', error);
                throw new common_1.HttpException('Failed to delete backup schedule', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Disaster Recovery Planning
         */
        async getDisasterRecoveryPlans(req) {
            try {
                const plans = await this.backupService.getDisasterRecoveryPlans();
                return {
                    success: true,
                    data: plans,
                };
            }
            catch (error) {
                this.logger.error('Failed to get disaster recovery plans:', error);
                throw new common_1.HttpException('Failed to retrieve disaster recovery plans', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async createDisasterRecoveryPlan(plan, req) {
            try {
                const createdPlan = await this.backupService.createDisasterRecoveryPlan(plan, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} created disaster recovery plan: ${plan.name}`);
                return {
                    success: true,
                    data: createdPlan,
                    message: 'Disaster recovery plan created successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to create disaster recovery plan:', error);
                throw new common_1.HttpException('Failed to create disaster recovery plan', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async testDisasterRecoveryPlan(planId, testOptions, req) {
            try {
                const result = await this.backupService.testDisasterRecoveryPlan(planId, testOptions, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} ${testOptions.dryRun ? 'dry-run tested' : 'tested'} disaster recovery plan ${planId}`);
                return {
                    success: true,
                    data: result,
                    message: 'Disaster recovery test completed',
                };
            }
            catch (error) {
                this.logger.error('Failed to test disaster recovery plan:', error);
                throw new common_1.HttpException('Failed to test disaster recovery plan', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Backup Storage Management
         */
        async getStorageStatus(req) {
            try {
                const status = await this.backupService.getStorageStatus();
                return {
                    success: true,
                    data: status,
                };
            }
            catch (error) {
                this.logger.error('Failed to get storage status:', error);
                throw new common_1.HttpException('Failed to retrieve storage status', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async cleanupOldBackups(options, req) {
            try {
                const result = await this.backupService.cleanupOldBackups(options, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} ${options.dryRun ? 'simulated' : 'performed'} backup cleanup`);
                return {
                    success: true,
                    data: result,
                    message: options.dryRun ? 'Cleanup simulation completed' : 'Backup cleanup completed',
                };
            }
            catch (error) {
                this.logger.error('Failed to cleanup backups:', error);
                throw new common_1.HttpException('Failed to cleanup backups', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Backup Verification and Integrity
         */
        async verifyBackup(backupId, req) {
            try {
                const result = await this.backupService.verifyBackup(backupId);
                this.logger.log(`Admin ${req.user.sub} verified backup ${backupId}`);
                return {
                    success: true,
                    data: result,
                    message: 'Backup verification completed',
                };
            }
            catch (error) {
                this.logger.error(`Failed to verify backup ${backupId}:`, error);
                throw new common_1.HttpException('Failed to verify backup', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getIntegrityReport(days = 30, req) {
            try {
                const report = await this.backupService.getIntegrityReport(days);
                return {
                    success: true,
                    data: report,
                };
            }
            catch (error) {
                this.logger.error('Failed to get integrity report:', error);
                throw new common_1.HttpException('Failed to retrieve integrity report', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "BackupController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getBackupOverview_decorators = [(0, common_1.Get)('overview'), (0, common_2.RequireRoles)('admin')];
        _getBackups_decorators = [(0, common_1.Get)('list'), (0, common_2.RequireRoles)('admin')];
        _createBackup_decorators = [(0, common_1.Post)('create'), (0, common_2.RequireRoles)('admin')];
        _getBackupDetails_decorators = [(0, common_1.Get)(':backupId'), (0, common_2.RequireRoles)('admin')];
        _deleteBackup_decorators = [(0, common_1.Delete)(':backupId'), (0, common_2.RequireRoles)('admin')];
        _restoreBackup_decorators = [(0, common_1.Post)('restore'), (0, common_2.RequireRoles)('admin')];
        _getBackupSchedules_decorators = [(0, common_1.Get)('schedules/list'), (0, common_2.RequireRoles)('admin')];
        _createBackupSchedule_decorators = [(0, common_1.Post)('schedules/create'), (0, common_2.RequireRoles)('admin')];
        _updateBackupSchedule_decorators = [(0, common_1.Put)('schedules/:scheduleId'), (0, common_2.RequireRoles)('admin')];
        _deleteBackupSchedule_decorators = [(0, common_1.Delete)('schedules/:scheduleId'), (0, common_2.RequireRoles)('admin')];
        _getDisasterRecoveryPlans_decorators = [(0, common_1.Get)('disaster-recovery/plans'), (0, common_2.RequireRoles)('admin')];
        _createDisasterRecoveryPlan_decorators = [(0, common_1.Post)('disaster-recovery/plans'), (0, common_2.RequireRoles)('admin')];
        _testDisasterRecoveryPlan_decorators = [(0, common_1.Post)('disaster-recovery/test/:planId'), (0, common_2.RequireRoles)('admin')];
        _getStorageStatus_decorators = [(0, common_1.Get)('storage/status'), (0, common_2.RequireRoles)('admin')];
        _cleanupOldBackups_decorators = [(0, common_1.Post)('storage/cleanup'), (0, common_2.RequireRoles)('admin')];
        _verifyBackup_decorators = [(0, common_1.Post)('verify/:backupId'), (0, common_2.RequireRoles)('admin')];
        _getIntegrityReport_decorators = [(0, common_1.Get)('integrity/report'), (0, common_2.RequireRoles)('admin')];
        __esDecorate(_classThis, null, _getBackupOverview_decorators, { kind: "method", name: "getBackupOverview", static: false, private: false, access: { has: obj => "getBackupOverview" in obj, get: obj => obj.getBackupOverview }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBackups_decorators, { kind: "method", name: "getBackups", static: false, private: false, access: { has: obj => "getBackups" in obj, get: obj => obj.getBackups }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createBackup_decorators, { kind: "method", name: "createBackup", static: false, private: false, access: { has: obj => "createBackup" in obj, get: obj => obj.createBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBackupDetails_decorators, { kind: "method", name: "getBackupDetails", static: false, private: false, access: { has: obj => "getBackupDetails" in obj, get: obj => obj.getBackupDetails }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteBackup_decorators, { kind: "method", name: "deleteBackup", static: false, private: false, access: { has: obj => "deleteBackup" in obj, get: obj => obj.deleteBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _restoreBackup_decorators, { kind: "method", name: "restoreBackup", static: false, private: false, access: { has: obj => "restoreBackup" in obj, get: obj => obj.restoreBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBackupSchedules_decorators, { kind: "method", name: "getBackupSchedules", static: false, private: false, access: { has: obj => "getBackupSchedules" in obj, get: obj => obj.getBackupSchedules }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createBackupSchedule_decorators, { kind: "method", name: "createBackupSchedule", static: false, private: false, access: { has: obj => "createBackupSchedule" in obj, get: obj => obj.createBackupSchedule }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateBackupSchedule_decorators, { kind: "method", name: "updateBackupSchedule", static: false, private: false, access: { has: obj => "updateBackupSchedule" in obj, get: obj => obj.updateBackupSchedule }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteBackupSchedule_decorators, { kind: "method", name: "deleteBackupSchedule", static: false, private: false, access: { has: obj => "deleteBackupSchedule" in obj, get: obj => obj.deleteBackupSchedule }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getDisasterRecoveryPlans_decorators, { kind: "method", name: "getDisasterRecoveryPlans", static: false, private: false, access: { has: obj => "getDisasterRecoveryPlans" in obj, get: obj => obj.getDisasterRecoveryPlans }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createDisasterRecoveryPlan_decorators, { kind: "method", name: "createDisasterRecoveryPlan", static: false, private: false, access: { has: obj => "createDisasterRecoveryPlan" in obj, get: obj => obj.createDisasterRecoveryPlan }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _testDisasterRecoveryPlan_decorators, { kind: "method", name: "testDisasterRecoveryPlan", static: false, private: false, access: { has: obj => "testDisasterRecoveryPlan" in obj, get: obj => obj.testDisasterRecoveryPlan }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStorageStatus_decorators, { kind: "method", name: "getStorageStatus", static: false, private: false, access: { has: obj => "getStorageStatus" in obj, get: obj => obj.getStorageStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cleanupOldBackups_decorators, { kind: "method", name: "cleanupOldBackups", static: false, private: false, access: { has: obj => "cleanupOldBackups" in obj, get: obj => obj.cleanupOldBackups }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyBackup_decorators, { kind: "method", name: "verifyBackup", static: false, private: false, access: { has: obj => "verifyBackup" in obj, get: obj => obj.verifyBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getIntegrityReport_decorators, { kind: "method", name: "getIntegrityReport", static: false, private: false, access: { has: obj => "getIntegrityReport" in obj, get: obj => obj.getIntegrityReport }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BackupController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BackupController = _classThis;
})();
exports.BackupController = BackupController;
