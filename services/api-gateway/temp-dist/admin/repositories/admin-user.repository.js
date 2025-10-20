"use strict";
/**
 * AdminUserRepository - Repository for admin users with custom queries
 */
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const admin_user_entity_1 = require("../entities/admin-user.entity");
let AdminUserRepository = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = typeorm_1.Repository;
    var AdminUserRepository = _classThis = class extends _classSuper {
        constructor(dataSource) {
            super(admin_user_entity_1.AdminUser, dataSource.createEntityManager());
            this.dataSource = dataSource;
        }
        async findByEmail(email) {
            return this.findOne({ where: { email } });
        }
        async findActiveUsers() {
            return this.find({
                where: { isActive: true },
                order: { createdAt: 'DESC' },
            });
        }
        async findByRole(role) {
            return this.find({
                where: { role },
                order: { lastName: 'ASC', firstName: 'ASC' },
            });
        }
        async getUserStats() {
            const totalUsers = await this.count();
            const activeUsers = await this.count({ where: { isActive: true } });
            const verifiedUsers = await this.count({ where: { isVerified: true } });
            const mfaEnabledUsers = await this.count({ where: { mfaEnabled: true } });
            const lockedUsers = await this.createQueryBuilder('user')
                .where('user.lockedUntil > :now', { now: new Date() })
                .getCount();
            // Get user count by role
            const roleStats = await this.createQueryBuilder('user')
                .select('user.role, COUNT(*) as count')
                .groupBy('user.role')
                .getRawMany();
            const usersByRole = roleStats.reduce((acc, stat) => {
                acc[stat.role] = parseInt(stat.count);
                return acc;
            }, {});
            return {
                totalUsers,
                activeUsers,
                verifiedUsers,
                mfaEnabledUsers,
                lockedUsers,
                usersByRole,
            };
        }
        async updateLoginInfo(userId, ipAddress) {
            await this.update(userId, {
                lastLoginAt: new Date(),
                lastLoginIp: ipAddress,
                failedLoginAttempts: 0,
                lockedUntil: null,
            });
        }
        async incrementFailedAttempts(userId) {
            await this.createQueryBuilder()
                .update(admin_user_entity_1.AdminUser)
                .set({
                failedLoginAttempts: () => 'failedLoginAttempts + 1',
            })
                .where('id = :userId', { userId })
                .execute();
        }
        async lockUser(userId, lockDuration) {
            const lockedUntil = new Date(Date.now() + lockDuration);
            await this.update(userId, { lockedUntil });
        }
        async findUsersWithExpiredPasswords(days) {
            return this.createQueryBuilder('user')
                .where('user.lastPasswordChangeAt < :expiredDate OR user.lastPasswordChangeAt IS NULL', {
                expiredDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            })
                .andWhere('user.isActive = :isActive', { isActive: true })
                .getMany();
        }
        async findRecentlyActiveUsers(hours) {
            return this.createQueryBuilder('user')
                .where('user.lastLoginAt > :recentDate', {
                recentDate: new Date(Date.now() - hours * 60 * 60 * 1000),
            })
                .orderBy('user.lastLoginAt', 'DESC')
                .getMany();
        }
    };
    __setFunctionName(_classThis, "AdminUserRepository");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminUserRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminUserRepository = _classThis;
})();
exports.AdminUserRepository = AdminUserRepository;
