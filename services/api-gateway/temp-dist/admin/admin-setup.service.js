"use strict";
/**
 * AdminSetupService - Service for creating and managing admin users
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
exports.AdminSetupService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
let AdminSetupService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var AdminSetupService = _classThis = class {
        constructor(jwtService) {
            this.jwtService = jwtService;
            this.logger = new common_1.Logger(AdminSetupService.name);
        }
        /**
         * Create admin user with proper permissions
         */
        async createAdminUser(userData) {
            try {
                // Generate user ID
                const userId = `admin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                // Hash password
                const saltRounds = 12; // Higher security for admin accounts
                const passwordHash = await bcrypt.hash(userData.password, saltRounds);
                // Create user data
                const userRecord = {
                    id: userId,
                    email: userData.email,
                    password_hash: passwordHash,
                    role: 'admin',
                    status: 'active',
                    email_verified: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                // Create profile data
                const profileRecord = {
                    user_id: userId,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    phone_number: '+1-555-ADMIN',
                    timezone: 'UTC',
                    language: 'en',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                // Admin permissions
                const adminPermissions = [
                    'admin:*',
                    'users:*',
                    'system:*',
                    'analytics:*',
                    'maintenance:*',
                    'audit:*',
                    'clients:impersonate',
                    'appointments:*',
                    'notes:*',
                    'files:*',
                    'notifications:*',
                    'recordings:*',
                    'ai:*',
                    'settings:*',
                ];
                // In a real implementation, these would be database operations
                // For now, we'll log the operations and generate tokens
                this.logger.log('📝 Creating admin user record...');
                this.logger.log('User:', JSON.stringify(userRecord, null, 2));
                this.logger.log('👤 Creating admin profile...');
                this.logger.log('Profile:', JSON.stringify(profileRecord, null, 2));
                this.logger.log('🔑 Granting admin permissions...');
                this.logger.log('Permissions:', adminPermissions);
                // Generate JWT tokens for immediate login
                const tokenPayload = {
                    sub: userId,
                    email: userData.email,
                    role: 'admin',
                    permissions: adminPermissions,
                };
                const tokens = this.jwtService.generateTokens(tokenPayload);
                // Log admin creation for audit
                await this.logAdminCreation(userId, userData.email);
                // In production, you would save to database here:
                /*
                await this.userRepository.create(userRecord);
                await this.profileRepository.create(profileRecord);
                await this.permissionRepository.createMany(
                  adminPermissions.map(permission => ({
                    user_id: userId,
                    permission,
                    granted_at: new Date(),
                    granted_by: 'system',
                  }))
                );
                */
                this.logger.log(`✅ Admin user created successfully: ${userData.email}`);
                return {
                    userId,
                    email: userData.email,
                    tokens,
                };
            }
            catch (error) {
                this.logger.error('Failed to create admin user:', error);
                throw error;
            }
        }
        /**
         * Check if any admin users exist
         */
        async checkExistingAdmin() {
            try {
                // Mock implementation - in production, query database
                // SELECT COUNT(*) FROM users WHERE role = 'admin' AND status = 'active'
                this.logger.log('🔍 Checking for existing admin users...');
                // For demo purposes, we'll return false to allow admin creation
                // In production, implement actual database query
                const mockAdminExists = false;
                this.logger.log(`Found existing admin: ${mockAdminExists}`);
                return mockAdminExists;
            }
            catch (error) {
                this.logger.error('Failed to check existing admin:', error);
                return false;
            }
        }
        /**
         * Get count of admin users
         */
        async getAdminCount() {
            try {
                // Mock implementation - in production, query database
                this.logger.log('📊 Getting admin user count...');
                // For demo purposes, return 0
                const mockAdminCount = 0;
                this.logger.log(`Admin user count: ${mockAdminCount}`);
                return mockAdminCount;
            }
            catch (error) {
                this.logger.error('Failed to get admin count:', error);
                return 0;
            }
        }
        /**
         * Log admin creation for audit trail
         */
        async logAdminCreation(userId, email) {
            try {
                const auditEntry = {
                    id: `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    user_id: 'system',
                    action: 'create_admin_user',
                    resource_type: 'user',
                    resource_id: userId,
                    details: {
                        email,
                        method: 'admin_setup_service',
                        timestamp: new Date().toISOString(),
                    },
                    ip_address: '127.0.0.1',
                    user_agent: 'admin-setup-service',
                    created_at: new Date().toISOString(),
                };
                this.logger.log('📝 Logging admin creation...');
                this.logger.log('Audit:', JSON.stringify(auditEntry, null, 2));
                // In production, save to audit_logs table
                // await this.auditRepository.create(auditEntry);
            }
            catch (error) {
                this.logger.error('Failed to log admin creation:', error);
                // Don't throw error here as it's not critical
            }
        }
        /**
         * Validate admin password strength
         */
        validateAdminPassword(password) {
            const errors = [];
            if (password.length < 8) {
                errors.push('Password must be at least 8 characters long');
            }
            if (!/[A-Z]/.test(password)) {
                errors.push('Password must contain at least one uppercase letter');
            }
            if (!/[a-z]/.test(password)) {
                errors.push('Password must contain at least one lowercase letter');
            }
            if (!/[0-9]/.test(password)) {
                errors.push('Password must contain at least one number');
            }
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
                errors.push('Password must contain at least one special character');
            }
            return {
                valid: errors.length === 0,
                errors,
            };
        }
        /**
         * Generate secure admin password
         */
        generateSecurePassword() {
            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
            const numbers = '0123456789';
            const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const allChars = uppercase + lowercase + numbers + symbols;
            let password = '';
            // Ensure at least one character from each category
            password += uppercase[Math.floor(Math.random() * uppercase.length)];
            password += lowercase[Math.floor(Math.random() * lowercase.length)];
            password += numbers[Math.floor(Math.random() * numbers.length)];
            password += symbols[Math.floor(Math.random() * symbols.length)];
            // Fill the rest randomly
            for (let i = 4; i < 16; i++) {
                password += allChars[Math.floor(Math.random() * allChars.length)];
            }
            // Shuffle the password
            return password.split('').sort(() => Math.random() - 0.5).join('');
        }
    };
    __setFunctionName(_classThis, "AdminSetupService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminSetupService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminSetupService = _classThis;
})();
exports.AdminSetupService = AdminSetupService;
