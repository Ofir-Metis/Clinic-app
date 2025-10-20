"use strict";
/**
 * AdminSetupController - Special endpoints for admin user creation
 * These endpoints should be disabled in production after initial setup
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
exports.AdminSetupController = void 0;
const common_1 = require("@nestjs/common");
let AdminSetupController = (() => {
    let _classDecorators = [(0, common_1.Controller)('auth')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createAdmin_decorators;
    let _checkAdminExists_decorators;
    let _createAdditionalAdmin_decorators;
    var AdminSetupController = _classThis = class {
        constructor(adminSetupService) {
            this.adminSetupService = (__runInitializers(this, _instanceExtraInitializers), adminSetupService);
            this.logger = new common_1.Logger(AdminSetupController.name);
        }
        /**
         * Create initial admin user - should only be used for initial setup
         * Requires special admin secret header for security
         */
        async createAdmin(body, adminSecret) {
            try {
                // Validate admin secret
                const expectedSecret = process.env.ADMIN_SECRET || 'clinic-admin-secret-2024';
                if (!adminSecret || adminSecret !== expectedSecret) {
                    this.logger.warn('❌ Unauthorized admin creation attempt');
                    throw new common_1.HttpException('Unauthorized: Invalid admin secret', common_1.HttpStatus.UNAUTHORIZED);
                }
                // Validate request
                if (!body.email || !body.password) {
                    throw new common_1.HttpException('Email and password are required', common_1.HttpStatus.BAD_REQUEST);
                }
                // Check if admin already exists
                const existingAdmin = await this.adminSetupService.checkExistingAdmin();
                if (existingAdmin) {
                    throw new common_1.HttpException('Admin user already exists. Use regular user management for additional admins.', common_1.HttpStatus.CONFLICT);
                }
                // Create admin user
                const result = await this.adminSetupService.createAdminUser({
                    email: body.email,
                    password: body.password,
                    firstName: body.firstName || 'System',
                    lastName: body.lastName || 'Administrator',
                });
                this.logger.log(`✅ Admin user created: ${body.email}`);
                return {
                    success: true,
                    userId: result.userId,
                    email: result.email,
                    message: 'Admin user created successfully',
                    tokens: result.tokens,
                };
            }
            catch (error) {
                this.logger.error('Failed to create admin user:', error);
                if (error instanceof common_1.HttpException) {
                    throw error;
                }
                throw new common_1.HttpException('Failed to create admin user', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Check if any admin users exist in the system
         */
        async checkAdminExists(adminSecret) {
            try {
                // Validate admin secret
                const expectedSecret = process.env.ADMIN_SECRET || 'clinic-admin-secret-2024';
                if (!adminSecret || adminSecret !== expectedSecret) {
                    throw new common_1.HttpException('Unauthorized: Invalid admin secret', common_1.HttpStatus.UNAUTHORIZED);
                }
                const adminExists = await this.adminSetupService.checkExistingAdmin();
                const adminCount = await this.adminSetupService.getAdminCount();
                return {
                    hasAdmin: adminExists,
                    count: adminCount,
                };
            }
            catch (error) {
                this.logger.error('Failed to check admin existence:', error);
                if (error instanceof common_1.HttpException) {
                    throw error;
                }
                throw new common_1.HttpException('Failed to check admin users', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Create additional admin user (when at least one admin exists)
         */
        async createAdditionalAdmin(body, authHeader) {
            try {
                // This would require an existing admin to be authenticated
                // For now, we'll implement basic validation
                if (!body.email || !body.password) {
                    throw new common_1.HttpException('Email and password are required', common_1.HttpStatus.BAD_REQUEST);
                }
                // In a real implementation, you'd validate the requesting user is an admin
                // For now, we'll create the user with basic validation
                const result = await this.adminSetupService.createAdminUser({
                    email: body.email,
                    password: body.password,
                    firstName: body.firstName || 'Admin',
                    lastName: body.lastName || 'User',
                });
                this.logger.log(`✅ Additional admin user created: ${body.email}`);
                return {
                    success: true,
                    userId: result.userId,
                    email: result.email,
                    message: 'Additional admin user created successfully',
                    tokens: result.tokens,
                };
            }
            catch (error) {
                this.logger.error('Failed to create additional admin user:', error);
                if (error instanceof common_1.HttpException) {
                    throw error;
                }
                throw new common_1.HttpException('Failed to create additional admin user', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "AdminSetupController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createAdmin_decorators = [(0, common_1.Post)('create-admin')];
        _checkAdminExists_decorators = [(0, common_1.Post)('check-admin-exists')];
        _createAdditionalAdmin_decorators = [(0, common_1.Post)('create-additional-admin')];
        __esDecorate(_classThis, null, _createAdmin_decorators, { kind: "method", name: "createAdmin", static: false, private: false, access: { has: obj => "createAdmin" in obj, get: obj => obj.createAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _checkAdminExists_decorators, { kind: "method", name: "checkAdminExists", static: false, private: false, access: { has: obj => "checkAdminExists" in obj, get: obj => obj.checkAdminExists }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createAdditionalAdmin_decorators, { kind: "method", name: "createAdditionalAdmin", static: false, private: false, access: { has: obj => "createAdditionalAdmin" in obj, get: obj => obj.createAdditionalAdmin }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminSetupController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminSetupController = _classThis;
})();
exports.AdminSetupController = AdminSetupController;
