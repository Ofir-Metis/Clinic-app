"use strict";
/**
 * SecurityService - Advanced security management implementation
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
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let SecurityService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SecurityService = _classThis = class {
        constructor(httpService) {
            this.httpService = httpService;
            this.logger = new common_1.Logger(SecurityService.name);
        }
        /**
         * Get comprehensive security overview
         */
        async getSecurityOverview() {
            try {
                // In production, this would query real databases
                // For now, providing mock data with realistic metrics
                const mockOverview = {
                    mfaStatus: {
                        totalUsers: 247,
                        usersWithMFA: 198,
                        mfaMethods: {
                            totp: 156,
                            sms: 42,
                            email: 28,
                            hardware: 12
                        }
                    },
                    sessionSecurity: {
                        activeSessions: 89,
                        averageSessionDuration: 2.4, // hours
                        suspiciousSessions: 2
                    },
                    accessControl: {
                        allowedIPs: ['192.168.1.0/24', '10.0.0.0/8'],
                        blockedIPs: ['123.45.67.89', '98.76.54.32'],
                        recentBlocks: 5
                    },
                    securityEvents: {
                        totalToday: 34,
                        criticalEvents: 1,
                        unacknowledgedEvents: 7
                    },
                    compliance: {
                        passwordPolicyCompliance: 94.2,
                        mfaCompliance: 80.1,
                        sessionTimeoutCompliance: 98.7
                    }
                };
                this.logger.log('Security overview retrieved');
                return mockOverview;
            }
            catch (error) {
                this.logger.error('Failed to get security overview:', error);
                throw new common_1.HttpException('Failed to retrieve security overview', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Setup Multi-Factor Authentication
         */
        async setupMFA(userId, request) {
            try {
                const { method, phoneNumber, email } = request;
                switch (method) {
                    case 'totp':
                        return await this.setupTOTP(userId);
                    case 'sms':
                        return await this.setupSMS(userId, phoneNumber);
                    case 'email':
                        return await this.setupEmailMFA(userId, email);
                    default:
                        throw new common_1.HttpException('Unsupported MFA method', common_1.HttpStatus.BAD_REQUEST);
                }
            }
            catch (error) {
                this.logger.error(`Failed to setup MFA for user ${userId}:`, error);
                throw error;
            }
        }
        async setupTOTP(userId) {
            // Generate a random secret for TOTP (in production, use proper TOTP library)
            const secret = crypto.randomBytes(20).toString('hex');
            const issuer = 'Clinic Management System';
            const accountName = `Clinic App (${userId})`;
            // Generate QR code URL for authenticator apps
            const qrCodeUrl = `otpauth://totp/${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
            // In production, save the secret to database encrypted
            const backupCodes = this.generateBackupCodesPrivate(8);
            return {
                method: 'totp',
                secret: secret,
                qrCode: qrCodeUrl,
                backupCodes,
                message: 'TOTP setup initiated. Scan QR code with authenticator app.'
            };
        }
        async setupSMS(userId, phoneNumber) {
            if (!phoneNumber) {
                throw new common_1.HttpException('Phone number required for SMS MFA', common_1.HttpStatus.BAD_REQUEST);
            }
            // In production, validate phone number and send test SMS
            const backupCodes = this.generateBackupCodesPrivate(8);
            return {
                method: 'sms',
                backupCodes,
                message: `SMS MFA setup for ${phoneNumber}. Test code sent.`
            };
        }
        async setupEmailMFA(userId, email) {
            if (!email) {
                throw new common_1.HttpException('Email required for email MFA', common_1.HttpStatus.BAD_REQUEST);
            }
            // In production, send test email with verification code
            const backupCodes = this.generateBackupCodesPrivate(8);
            return {
                method: 'email',
                backupCodes,
                message: `Email MFA setup for ${email}. Verification code sent.`
            };
        }
        /**
         * Verify MFA code
         */
        async verifyMFA(userId, request) {
            try {
                const { code, backupCode } = request;
                // In production, this would verify against stored MFA settings
                if (backupCode) {
                    return await this.verifyBackupCode(userId, backupCode);
                }
                // Mock verification for demo
                const isValid = code === '123456' || this.verifyTOTPCode(code);
                if (isValid) {
                    await this.logSecurityEvent({
                        type: 'mfa_success',
                        severity: 'low',
                        userId,
                        description: 'MFA verification successful',
                        ipAddress: '127.0.0.1',
                        userAgent: 'Security Service',
                        details: { method: 'totp' }
                    });
                    return {
                        verified: true,
                        message: 'MFA verification successful'
                    };
                }
                else {
                    await this.logSecurityEvent({
                        type: 'mfa_failure',
                        severity: 'medium',
                        userId,
                        description: 'MFA verification failed',
                        ipAddress: '127.0.0.1',
                        userAgent: 'Security Service',
                        details: { attempts: 1 }
                    });
                    return {
                        verified: false,
                        message: 'Invalid MFA code'
                    };
                }
            }
            catch (error) {
                this.logger.error(`Failed to verify MFA for user ${userId}:`, error);
                throw new common_1.HttpException('MFA verification failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        verifyTOTPCode(code) {
            // In production, this would verify against user's stored TOTP secret
            // For demo, accept any 6-digit code
            return /^\d{6}$/.test(code);
        }
        async verifyBackupCode(userId, backupCode) {
            // In production, verify backup code against stored encrypted codes
            // and mark as used
            return {
                verified: true,
                message: 'Backup code verified successfully'
            };
        }
        /**
         * Disable MFA for user
         */
        async disableMFA(userId) {
            try {
                // In production, remove MFA settings from database
                await this.logSecurityEvent({
                    type: 'mfa_disabled',
                    severity: 'medium',
                    userId,
                    description: 'MFA disabled for user',
                    ipAddress: '127.0.0.1',
                    userAgent: 'Security Service',
                    details: { disabledBy: userId }
                });
                this.logger.log(`MFA disabled for user ${userId}`);
            }
            catch (error) {
                this.logger.error(`Failed to disable MFA for user ${userId}:`, error);
                throw new common_1.HttpException('Failed to disable MFA', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Generate backup codes
         */
        async generateBackupCodes(userId) {
            try {
                const codes = this.generateBackupCodesPrivate(10);
                // In production, encrypt and store codes in database
                await this.logSecurityEvent({
                    type: 'backup_codes_generated',
                    severity: 'low',
                    userId,
                    description: 'Backup codes generated',
                    ipAddress: '127.0.0.1',
                    userAgent: 'Security Service',
                    details: { codesCount: codes.length }
                });
                return codes;
            }
            catch (error) {
                this.logger.error(`Failed to generate backup codes for user ${userId}:`, error);
                throw new common_1.HttpException('Failed to generate backup codes', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        generateBackupCodesPrivate(count) {
            const codes = [];
            for (let i = 0; i < count; i++) {
                codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
            }
            return codes;
        }
        /**
         * Get user sessions
         */
        async getUserSessions(userId) {
            try {
                // In production, query actual session store (Redis/Database)
                const mockSessions = [
                    {
                        sessionId: 'sess_1234567890',
                        userId,
                        email: 'user@example.com',
                        ipAddress: '192.168.1.100',
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        location: 'New York, NY',
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                        lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
                        isActive: true,
                        deviceFingerprint: 'fp_abcd1234'
                    },
                    {
                        sessionId: 'sess_0987654321',
                        userId,
                        email: 'user@example.com',
                        ipAddress: '10.0.0.50',
                        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
                        location: 'San Francisco, CA',
                        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                        lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                        isActive: true,
                        deviceFingerprint: 'fp_efgh5678'
                    }
                ];
                return mockSessions;
            }
            catch (error) {
                this.logger.error(`Failed to get sessions for user ${userId}:`, error);
                throw new common_1.HttpException('Failed to retrieve sessions', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get all active sessions (admin only)
         */
        async getAllActiveSessions() {
            try {
                // In production, query all active sessions from session store
                const mockSessions = [
                    {
                        sessionId: 'sess_admin_001',
                        userId: 'admin_1234',
                        email: 'admin@clinic.com',
                        ipAddress: '192.168.1.10',
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        location: 'Office Network',
                        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                        lastActivity: new Date(Date.now() - 2 * 60 * 1000),
                        isActive: true,
                        deviceFingerprint: 'fp_admin_device'
                    },
                    {
                        sessionId: 'sess_user_001',
                        userId: 'user_5678',
                        email: 'coach@clinic.com',
                        ipAddress: '203.0.113.45',
                        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                        location: 'Remote Location',
                        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
                        lastActivity: new Date(Date.now() - 10 * 60 * 1000),
                        isActive: true,
                        deviceFingerprint: 'fp_coach_mac'
                    }
                ];
                return mockSessions;
            }
            catch (error) {
                this.logger.error('Failed to get all active sessions:', error);
                throw new common_1.HttpException('Failed to retrieve sessions', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Manage user sessions
         */
        async manageSession(userId, request, isAdmin) {
            try {
                const { action, sessionId, reason } = request;
                switch (action) {
                    case 'terminate':
                        return await this.terminateSession(sessionId, userId, isAdmin, reason);
                    case 'terminate_all':
                        return await this.terminateAllSessions(userId, isAdmin, reason);
                    case 'extend':
                        return await this.extendSession(sessionId, userId, isAdmin);
                    default:
                        throw new common_1.HttpException('Invalid session action', common_1.HttpStatus.BAD_REQUEST);
                }
            }
            catch (error) {
                this.logger.error(`Failed to manage session for user ${userId}:`, error);
                throw error;
            }
        }
        async terminateSession(sessionId, userId, isAdmin, reason) {
            // In production, remove session from store and invalidate tokens
            await this.logSecurityEvent({
                type: 'session_terminated',
                severity: 'low',
                userId: isAdmin ? userId : undefined,
                description: `Session ${sessionId} terminated`,
                ipAddress: '127.0.0.1',
                userAgent: 'Security Service',
                details: { sessionId, reason, terminatedBy: userId }
            });
            return {
                success: true,
                message: 'Session terminated successfully'
            };
        }
        async terminateAllSessions(userId, isAdmin, reason) {
            // In production, remove all user sessions from store
            await this.logSecurityEvent({
                type: 'all_sessions_terminated',
                severity: 'medium',
                userId,
                description: 'All user sessions terminated',
                ipAddress: '127.0.0.1',
                userAgent: 'Security Service',
                details: { reason, terminatedBy: userId, isAdmin }
            });
            return {
                success: true,
                message: 'All sessions terminated successfully'
            };
        }
        async extendSession(sessionId, userId, isAdmin) {
            // In production, update session expiration in store
            return {
                success: true,
                message: 'Session extended successfully'
            };
        }
        /**
         * Get security events with filtering
         */
        async getSecurityEvents(filters) {
            try {
                const { limit = 100, offset = 0, severity, type } = filters;
                // Mock security events for demonstration
                const mockEvents = [
                    {
                        id: 'evt_001',
                        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
                        type: 'login_attempt',
                        severity: 'medium',
                        userId: 'user_123',
                        email: 'user@example.com',
                        ipAddress: '203.0.113.100',
                        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        description: 'Failed login attempt - invalid password',
                        details: { attempts: 3, lockoutTriggered: false },
                        acknowledged: false
                    },
                    {
                        id: 'evt_002',
                        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                        type: 'suspicious_activity',
                        severity: 'high',
                        ipAddress: '198.51.100.42',
                        userAgent: 'curl/7.68.0',
                        description: 'Multiple rapid API requests from unusual IP',
                        details: { requestCount: 150, timeWindow: '5min', blocked: true },
                        acknowledged: false
                    },
                    {
                        id: 'evt_003',
                        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
                        type: 'mfa_failure',
                        severity: 'low',
                        userId: 'user_456',
                        email: 'coach@clinic.com',
                        ipAddress: '192.168.1.50',
                        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                        description: 'MFA verification failed - incorrect code',
                        details: { method: 'totp', attempts: 1 },
                        acknowledged: true,
                        acknowledgedBy: 'admin_001',
                        acknowledgedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
                    }
                ];
                // Apply filters
                let filteredEvents = mockEvents;
                if (severity) {
                    filteredEvents = filteredEvents.filter(event => event.severity === severity);
                }
                if (type) {
                    filteredEvents = filteredEvents.filter(event => event.type === type);
                }
                const total = filteredEvents.length;
                const events = filteredEvents.slice(offset, offset + limit);
                return {
                    events,
                    total,
                    pagination: {
                        limit,
                        offset,
                        hasMore: offset + limit < total
                    }
                };
            }
            catch (error) {
                this.logger.error('Failed to get security events:', error);
                throw new common_1.HttpException('Failed to retrieve security events', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Acknowledge security event
         */
        async acknowledgeSecurityEvent(eventId, adminUserId) {
            try {
                // In production, update event in database
                this.logger.log(`Security event ${eventId} acknowledged by admin ${adminUserId}`);
                await this.logSecurityEvent({
                    type: 'event_acknowledged',
                    severity: 'low',
                    userId: adminUserId,
                    description: `Security event ${eventId} acknowledged`,
                    ipAddress: '127.0.0.1',
                    userAgent: 'Security Service',
                    details: { eventId, acknowledgedBy: adminUserId }
                });
            }
            catch (error) {
                this.logger.error(`Failed to acknowledge security event ${eventId}:`, error);
                throw new common_1.HttpException('Failed to acknowledge security event', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get security policies
         */
        async getSecurityPolicies() {
            try {
                // In production, load from database or config service
                const mockPolicies = {
                    passwordPolicy: {
                        minLength: 12,
                        requireUppercase: true,
                        requireLowercase: true,
                        requireNumbers: true,
                        requireSpecialChars: true,
                        maxAge: 90, // days
                        preventReuse: 12 // last N passwords
                    },
                    sessionPolicy: {
                        maxConcurrentSessions: 5,
                        sessionTimeout: 8 * 60 * 60, // 8 hours in seconds
                        idleTimeout: 30 * 60, // 30 minutes in seconds
                        requireMFAForAdmin: true,
                        requireMFAForSensitiveOps: true
                    },
                    accessPolicy: {
                        allowedIPs: ['192.168.1.0/24', '10.0.0.0/8'],
                        blockedIPs: ['123.45.67.89', '98.76.54.32'],
                        allowedCountries: ['US', 'CA', 'UK'],
                        maxFailedAttempts: 5,
                        lockoutDuration: 15 * 60, // 15 minutes in seconds
                        requireDeviceVerification: true
                    }
                };
                return mockPolicies;
            }
            catch (error) {
                this.logger.error('Failed to get security policies:', error);
                throw new common_1.HttpException('Failed to retrieve security policies', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Update security policies
         */
        async updateSecurityPolicies(policies, adminUserId) {
            try {
                // In production, validate and save to database/config service
                await this.logSecurityEvent({
                    type: 'policies_updated',
                    severity: 'medium',
                    userId: adminUserId,
                    description: 'Security policies updated',
                    ipAddress: '127.0.0.1',
                    userAgent: 'Security Service',
                    details: { updatedBy: adminUserId, changes: policies }
                });
                this.logger.log(`Security policies updated by admin ${adminUserId}`);
                // Return updated policies (in production, retrieve from database)
                return await this.getSecurityPolicies();
            }
            catch (error) {
                this.logger.error('Failed to update security policies:', error);
                throw new common_1.HttpException('Failed to update security policies', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Manage IP access control
         */
        async manageIPAccess(action, ipAddress, adminUserId, reason) {
            try {
                // In production, update IP access lists in database/firewall
                await this.logSecurityEvent({
                    type: 'ip_access_changed',
                    severity: 'medium',
                    userId: adminUserId,
                    description: `IP ${ipAddress} ${action}ed`,
                    ipAddress: '127.0.0.1',
                    userAgent: 'Security Service',
                    details: { action, targetIP: ipAddress, reason, changedBy: adminUserId }
                });
                return {
                    success: true,
                    message: `IP ${ipAddress} ${action}ed successfully`
                };
            }
            catch (error) {
                this.logger.error(`Failed to ${action} IP ${ipAddress}:`, error);
                throw new common_1.HttpException(`Failed to ${action} IP`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Validate password against policy
         */
        async validatePassword(password) {
            try {
                const policies = await this.getSecurityPolicies();
                const requirements = {
                    minLength: password.length >= policies.passwordPolicy.minLength,
                    hasUppercase: /[A-Z]/.test(password),
                    hasLowercase: /[a-z]/.test(password),
                    hasNumbers: /\d/.test(password),
                    hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
                };
                const feedback = [];
                if (!requirements.minLength)
                    feedback.push(`Password must be at least ${policies.passwordPolicy.minLength} characters`);
                if (!requirements.hasUppercase)
                    feedback.push('Password must contain uppercase letters');
                if (!requirements.hasLowercase)
                    feedback.push('Password must contain lowercase letters');
                if (!requirements.hasNumbers)
                    feedback.push('Password must contain numbers');
                if (!requirements.hasSpecialChars)
                    feedback.push('Password must contain special characters');
                const score = Object.values(requirements).filter(Boolean).length / Object.keys(requirements).length * 100;
                const isValid = Object.values(requirements).every(Boolean);
                return {
                    isValid,
                    score,
                    feedback,
                    requirements
                };
            }
            catch (error) {
                this.logger.error('Failed to validate password:', error);
                throw new common_1.HttpException('Failed to validate password', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Force password reset for user
         */
        async forcePasswordReset(userId, adminUserId, reason) {
            try {
                // In production, generate secure reset token and save to database
                const resetToken = crypto.randomBytes(32).toString('hex');
                await this.logSecurityEvent({
                    type: 'password_reset_forced',
                    severity: 'medium',
                    userId,
                    description: `Password reset forced for user ${userId}`,
                    ipAddress: '127.0.0.1',
                    userAgent: 'Security Service',
                    details: { forcedBy: adminUserId, reason, resetToken }
                });
                return {
                    success: true,
                    resetToken,
                    message: 'Password reset forced successfully. Reset token generated.'
                };
            }
            catch (error) {
                this.logger.error(`Failed to force password reset for user ${userId}:`, error);
                throw new common_1.HttpException('Failed to force password reset', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Generate compliance report
         */
        async generateComplianceReport(type, startDate, endDate) {
            try {
                const now = new Date();
                const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
                const end = endDate ? new Date(endDate) : now;
                // Mock compliance report based on type
                const reports = {
                    hipaa: {
                        summary: {
                            accessControlCompliance: 96.2,
                            auditLogCompleteness: 98.7,
                            encryptionCompliance: 100,
                            userTrainingCompliance: 87.4,
                            breachIncidents: 0,
                            riskAssessmentStatus: 'current'
                        },
                        details: {
                            technicalSafeguards: {
                                accessControl: 'Implemented',
                                auditControls: 'Implemented',
                                integrity: 'Implemented',
                                personOrEntityAuthentication: 'Implemented',
                                transmissionSecurity: 'Implemented'
                            },
                            administrativeSafeguards: {
                                securityOfficer: 'Assigned',
                                workforceTraining: 'In Progress',
                                accessManagement: 'Implemented',
                                emergencyAccessProcedure: 'Documented'
                            }
                        },
                        recommendations: [
                            'Complete workforce training for remaining 12.6% of staff',
                            'Review and update risk assessment quarterly',
                            'Implement automated compliance monitoring'
                        ]
                    },
                    gdpr: {
                        summary: {
                            dataProcessingLawfulness: 94.1,
                            consentManagement: 91.8,
                            dataSubjectRights: 88.5,
                            dataProtectionByDesign: 85.2,
                            breachNotificationReadiness: 97.3,
                            dpoAppointment: 'Yes'
                        },
                        details: {
                            legalBasis: {
                                consent: '45%',
                                legitimateInterest: '30%',
                                contractualNecessity: '20%',
                                legalObligation: '5%'
                            },
                            dataSubjectRequests: {
                                accessRequests: 12,
                                rectificationRequests: 3,
                                erasureRequests: 1,
                                portabilityRequests: 2,
                                averageResponseTime: '18 days'
                            }
                        },
                        recommendations: [
                            'Improve data subject rights response time (target: 15 days)',
                            'Enhance privacy by design implementation',
                            'Update privacy notices for clarity'
                        ]
                    },
                    soc2: {
                        summary: {
                            securityControls: 92.7,
                            availabilityControls: 98.1,
                            processingIntegrityControls: 94.4,
                            confidentialityControls: 96.8,
                            privacyControls: 89.3,
                            overallMaturity: 'Level 3 - Defined'
                        },
                        details: {
                            controlFamilies: {
                                CC1_COSO: 'Implemented',
                                CC2_Communication: 'Implemented',
                                CC3_RiskAssessment: 'Implemented',
                                CC4_Monitoring: 'In Progress',
                                CC5_LogicalAccess: 'Implemented',
                                CC6_SystemOperations: 'Implemented'
                            },
                            exceptions: [
                                'Automated monitoring controls need enhancement',
                                'Incident response testing incomplete'
                            ]
                        },
                        recommendations: [
                            'Implement automated monitoring dashboard',
                            'Complete incident response tabletop exercises',
                            'Enhance privacy controls documentation'
                        ]
                    }
                };
                const report = reports[type];
                return {
                    reportType: type.toUpperCase(),
                    generatedAt: now,
                    period: {
                        startDate: start.toISOString().split('T')[0],
                        endDate: end.toISOString().split('T')[0]
                    },
                    ...report
                };
            }
            catch (error) {
                this.logger.error(`Failed to generate ${type} compliance report:`, error);
                throw new common_1.HttpException('Failed to generate compliance report', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Log security event
         */
        async logSecurityEvent(event) {
            try {
                const securityEvent = {
                    id: crypto.randomUUID(),
                    timestamp: new Date(),
                    type: event.type || 'suspicious_activity',
                    severity: event.severity || 'low',
                    userId: event.userId,
                    email: event.email,
                    ipAddress: event.ipAddress || '127.0.0.1',
                    userAgent: event.userAgent || 'SecurityService',
                    description: event.description || 'Security event logged',
                    details: event.details || {},
                    acknowledged: false
                };
                // In production, save to database
                this.logger.log(`Security event logged: ${securityEvent.type} - ${securityEvent.description}`);
            }
            catch (error) {
                this.logger.error('Failed to log security event:', error);
            }
        }
    };
    __setFunctionName(_classThis, "SecurityService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SecurityService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SecurityService = _classThis;
})();
exports.SecurityService = SecurityService;
