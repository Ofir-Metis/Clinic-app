"use strict";
/**
 * SecurityController - Advanced security management for admin console
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
exports.SecurityController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let SecurityController = (() => {
    let _classDecorators = [(0, common_1.Controller)('security'), (0, common_1.UseGuards)(common_2.JwtAuthGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getSecurityOverview_decorators;
    let _setupMFA_decorators;
    let _verifyMFA_decorators;
    let _disableMFA_decorators;
    let _generateBackupCodes_decorators;
    let _getUserSessions_decorators;
    let _getAllActiveSessions_decorators;
    let _manageSession_decorators;
    let _getSecurityEvents_decorators;
    let _acknowledgeSecurityEvent_decorators;
    let _getSecurityPolicies_decorators;
    let _updateSecurityPolicies_decorators;
    let _manageIPAccess_decorators;
    let _validatePassword_decorators;
    let _forcePasswordReset_decorators;
    let _generateComplianceReport_decorators;
    var SecurityController = _classThis = class {
        constructor(securityService) {
            this.securityService = (__runInitializers(this, _instanceExtraInitializers), securityService);
            this.logger = new common_1.Logger(SecurityController.name);
        }
        /**
         * Get security overview and status
         */
        async getSecurityOverview(req) {
            try {
                const overview = await this.securityService.getSecurityOverview();
                this.logger.log(`Admin ${req.user.sub} viewed security overview`);
                return {
                    success: true,
                    data: overview,
                };
            }
            catch (error) {
                this.logger.error('Failed to get security overview:', error);
                throw new common_1.HttpException('Failed to retrieve security overview', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Multi-Factor Authentication Management
         */
        async setupMFA(body, req) {
            try {
                const result = await this.securityService.setupMFA(req.user.sub, body);
                this.logger.log(`User ${req.user.sub} set up MFA method: ${body.method}`);
                return {
                    success: true,
                    data: result,
                    message: 'MFA setup initiated',
                };
            }
            catch (error) {
                this.logger.error('Failed to setup MFA:', error);
                throw new common_1.HttpException('Failed to setup MFA', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async verifyMFA(body, req) {
            try {
                const result = await this.securityService.verifyMFA(req.user.sub, body);
                this.logger.log(`User ${req.user.sub} verified MFA`);
                return {
                    success: true,
                    data: result,
                    message: 'MFA verified successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to verify MFA:', error);
                throw new common_1.HttpException('Invalid MFA code', common_1.HttpStatus.UNAUTHORIZED);
            }
        }
        async disableMFA(req) {
            try {
                await this.securityService.disableMFA(req.user.sub);
                this.logger.log(`User ${req.user.sub} disabled MFA`);
                return {
                    success: true,
                    message: 'MFA disabled successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to disable MFA:', error);
                throw new common_1.HttpException('Failed to disable MFA', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async generateBackupCodes(req) {
            try {
                const codes = await this.securityService.generateBackupCodes(req.user.sub);
                this.logger.log(`User ${req.user.sub} generated backup codes`);
                return {
                    success: true,
                    data: { backupCodes: codes },
                    message: 'Backup codes generated',
                };
            }
            catch (error) {
                this.logger.error('Failed to generate backup codes:', error);
                throw new common_1.HttpException('Failed to generate backup codes', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Session Management
         */
        async getUserSessions(req) {
            try {
                const sessions = await this.securityService.getUserSessions(req.user.sub);
                return {
                    success: true,
                    data: { sessions },
                };
            }
            catch (error) {
                this.logger.error('Failed to get user sessions:', error);
                throw new common_1.HttpException('Failed to retrieve sessions', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async getAllActiveSessions(req) {
            try {
                const sessions = await this.securityService.getAllActiveSessions();
                this.logger.log(`Admin ${req.user.sub} viewed all active sessions`);
                return {
                    success: true,
                    data: { sessions },
                };
            }
            catch (error) {
                this.logger.error('Failed to get all sessions:', error);
                throw new common_1.HttpException('Failed to retrieve sessions', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async manageSession(body, req) {
            try {
                const result = await this.securityService.manageSession(req.user.sub, body, req.user.role === 'admin');
                this.logger.log(`User ${req.user.sub} performed session action: ${body.action}`);
                return {
                    success: true,
                    data: result,
                    message: `Session ${body.action} completed`,
                };
            }
            catch (error) {
                this.logger.error('Failed to manage session:', error);
                throw new common_1.HttpException('Failed to manage session', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Security Events and Audit
         */
        async getSecurityEvents(limit = 100, offset = 0, severity, type, req) {
            try {
                const events = await this.securityService.getSecurityEvents({
                    limit,
                    offset,
                    severity,
                    type,
                });
                return {
                    success: true,
                    data: events,
                };
            }
            catch (error) {
                this.logger.error('Failed to get security events:', error);
                throw new common_1.HttpException('Failed to retrieve security events', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async acknowledgeSecurityEvent(eventId, req) {
            try {
                await this.securityService.acknowledgeSecurityEvent(eventId, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} acknowledged security event ${eventId}`);
                return {
                    success: true,
                    message: 'Security event acknowledged',
                };
            }
            catch (error) {
                this.logger.error('Failed to acknowledge security event:', error);
                throw new common_1.HttpException('Failed to acknowledge security event', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Security Policy Management
         */
        async getSecurityPolicies(req) {
            try {
                const policies = await this.securityService.getSecurityPolicies();
                return {
                    success: true,
                    data: policies,
                };
            }
            catch (error) {
                this.logger.error('Failed to get security policies:', error);
                throw new common_1.HttpException('Failed to retrieve security policies', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async updateSecurityPolicies(policies, req) {
            try {
                const result = await this.securityService.updateSecurityPolicies(policies, req.user.sub);
                this.logger.log(`Admin ${req.user.sub} updated security policies`);
                return {
                    success: true,
                    data: result,
                    message: 'Security policies updated successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to update security policies:', error);
                throw new common_1.HttpException('Failed to update security policies', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * IP Access Control
         */
        async manageIPAccess(body, req) {
            try {
                const result = await this.securityService.manageIPAccess(body.action, body.ipAddress, req.user.sub, body.reason);
                this.logger.log(`Admin ${req.user.sub} ${body.action}ed IP ${body.ipAddress}`);
                return {
                    success: true,
                    data: result,
                    message: `IP ${body.action} completed`,
                };
            }
            catch (error) {
                this.logger.error('Failed to manage IP access:', error);
                throw new common_1.HttpException('Failed to manage IP access', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Password Policy Enforcement
         */
        async validatePassword(body, req) {
            try {
                const validation = await this.securityService.validatePassword(body.password);
                return {
                    success: true,
                    data: validation,
                };
            }
            catch (error) {
                this.logger.error('Failed to validate password:', error);
                throw new common_1.HttpException('Failed to validate password', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        async forcePasswordReset(body, req) {
            try {
                const result = await this.securityService.forcePasswordReset(body.userId, req.user.sub, body.reason);
                this.logger.log(`Admin ${req.user.sub} forced password reset for user ${body.userId}`);
                return {
                    success: true,
                    data: result,
                    message: 'Password reset forced successfully',
                };
            }
            catch (error) {
                this.logger.error('Failed to force password reset:', error);
                throw new common_1.HttpException('Failed to force password reset', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Security Compliance Reports
         */
        async generateComplianceReport(type = 'hipaa', startDate, endDate, req) {
            try {
                const report = await this.securityService.generateComplianceReport(type, startDate, endDate);
                this.logger.log(`Admin ${req.user.sub} generated ${type.toUpperCase()} compliance report`);
                return {
                    success: true,
                    data: report,
                    message: 'Compliance report generated',
                };
            }
            catch (error) {
                this.logger.error('Failed to generate compliance report:', error);
                throw new common_1.HttpException('Failed to generate compliance report', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "SecurityController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getSecurityOverview_decorators = [(0, common_1.Get)('overview'), (0, common_2.RequireRoles)('admin')];
        _setupMFA_decorators = [(0, common_1.Post)('mfa/setup')];
        _verifyMFA_decorators = [(0, common_1.Post)('mfa/verify')];
        _disableMFA_decorators = [(0, common_1.Delete)('mfa/disable')];
        _generateBackupCodes_decorators = [(0, common_1.Get)('mfa/backup-codes')];
        _getUserSessions_decorators = [(0, common_1.Get)('sessions')];
        _getAllActiveSessions_decorators = [(0, common_1.Get)('sessions/all'), (0, common_2.RequireRoles)('admin')];
        _manageSession_decorators = [(0, common_1.Post)('sessions/manage')];
        _getSecurityEvents_decorators = [(0, common_1.Get)('events'), (0, common_2.RequireRoles)('admin')];
        _acknowledgeSecurityEvent_decorators = [(0, common_1.Post)('events/:eventId/acknowledge'), (0, common_2.RequireRoles)('admin')];
        _getSecurityPolicies_decorators = [(0, common_1.Get)('policies'), (0, common_2.RequireRoles)('admin')];
        _updateSecurityPolicies_decorators = [(0, common_1.Put)('policies'), (0, common_2.RequireRoles)('admin')];
        _manageIPAccess_decorators = [(0, common_1.Post)('access-control/ip'), (0, common_2.RequireRoles)('admin')];
        _validatePassword_decorators = [(0, common_1.Post)('password/validate')];
        _forcePasswordReset_decorators = [(0, common_1.Post)('password/force-reset'), (0, common_2.RequireRoles)('admin')];
        _generateComplianceReport_decorators = [(0, common_1.Get)('compliance/report'), (0, common_2.RequireRoles)('admin')];
        __esDecorate(_classThis, null, _getSecurityOverview_decorators, { kind: "method", name: "getSecurityOverview", static: false, private: false, access: { has: obj => "getSecurityOverview" in obj, get: obj => obj.getSecurityOverview }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _setupMFA_decorators, { kind: "method", name: "setupMFA", static: false, private: false, access: { has: obj => "setupMFA" in obj, get: obj => obj.setupMFA }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyMFA_decorators, { kind: "method", name: "verifyMFA", static: false, private: false, access: { has: obj => "verifyMFA" in obj, get: obj => obj.verifyMFA }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _disableMFA_decorators, { kind: "method", name: "disableMFA", static: false, private: false, access: { has: obj => "disableMFA" in obj, get: obj => obj.disableMFA }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateBackupCodes_decorators, { kind: "method", name: "generateBackupCodes", static: false, private: false, access: { has: obj => "generateBackupCodes" in obj, get: obj => obj.generateBackupCodes }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getUserSessions_decorators, { kind: "method", name: "getUserSessions", static: false, private: false, access: { has: obj => "getUserSessions" in obj, get: obj => obj.getUserSessions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllActiveSessions_decorators, { kind: "method", name: "getAllActiveSessions", static: false, private: false, access: { has: obj => "getAllActiveSessions" in obj, get: obj => obj.getAllActiveSessions }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _manageSession_decorators, { kind: "method", name: "manageSession", static: false, private: false, access: { has: obj => "manageSession" in obj, get: obj => obj.manageSession }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSecurityEvents_decorators, { kind: "method", name: "getSecurityEvents", static: false, private: false, access: { has: obj => "getSecurityEvents" in obj, get: obj => obj.getSecurityEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _acknowledgeSecurityEvent_decorators, { kind: "method", name: "acknowledgeSecurityEvent", static: false, private: false, access: { has: obj => "acknowledgeSecurityEvent" in obj, get: obj => obj.acknowledgeSecurityEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSecurityPolicies_decorators, { kind: "method", name: "getSecurityPolicies", static: false, private: false, access: { has: obj => "getSecurityPolicies" in obj, get: obj => obj.getSecurityPolicies }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateSecurityPolicies_decorators, { kind: "method", name: "updateSecurityPolicies", static: false, private: false, access: { has: obj => "updateSecurityPolicies" in obj, get: obj => obj.updateSecurityPolicies }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _manageIPAccess_decorators, { kind: "method", name: "manageIPAccess", static: false, private: false, access: { has: obj => "manageIPAccess" in obj, get: obj => obj.manageIPAccess }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _validatePassword_decorators, { kind: "method", name: "validatePassword", static: false, private: false, access: { has: obj => "validatePassword" in obj, get: obj => obj.validatePassword }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _forcePasswordReset_decorators, { kind: "method", name: "forcePasswordReset", static: false, private: false, access: { has: obj => "forcePasswordReset" in obj, get: obj => obj.forcePasswordReset }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateComplianceReport_decorators, { kind: "method", name: "generateComplianceReport", static: false, private: false, access: { has: obj => "generateComplianceReport" in obj, get: obj => obj.generateComplianceReport }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SecurityController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SecurityController = _classThis;
})();
exports.SecurityController = SecurityController;
