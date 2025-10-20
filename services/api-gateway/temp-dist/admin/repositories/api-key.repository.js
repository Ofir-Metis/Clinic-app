"use strict";
/**
 * ApiKeyRepository - Repository for API keys with custom queries
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
exports.ApiKeyRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const api_key_entity_1 = require("../entities/api-key.entity");
let ApiKeyRepository = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = typeorm_1.Repository;
    var ApiKeyRepository = _classThis = class extends _classSuper {
        constructor(dataSource) {
            super(api_key_entity_1.ApiKey, dataSource.createEntityManager());
            this.dataSource = dataSource;
        }
        async findByKeyHash(keyHash) {
            return this.findOne({ where: { keyHash } });
        }
        async findByClientId(clientId) {
            return this.find({
                where: { clientId },
                order: { createdAt: 'DESC' },
            });
        }
        async findActiveKeys() {
            return this.find({
                where: { status: 'active' },
                order: { lastUsed: 'DESC' },
            });
        }
        async findExpiredKeys() {
            return this.createQueryBuilder('key')
                .where('key.expiresAt IS NOT NULL')
                .andWhere('key.expiresAt < :now', { now: new Date() })
                .andWhere('key.status = :status', { status: 'active' })
                .getMany();
        }
        async updateUsageStats(keyId, requestCount = 1) {
            await this.createQueryBuilder()
                .update(api_key_entity_1.ApiKey)
                .set({
                totalRequests: () => 'totalRequests + :requestCount',
                requestsThisMonth: () => 'requestsThisMonth + :requestCount',
                lastUsed: new Date(),
            })
                .where('id = :keyId', { keyId })
                .setParameter('requestCount', requestCount)
                .execute();
        }
        async resetMonthlyUsage() {
            await this.createQueryBuilder()
                .update(api_key_entity_1.ApiKey)
                .set({ requestsThisMonth: 0 })
                .execute();
        }
        async getUsageAnalytics(startDate, endDate) {
            const totalKeys = await this.count();
            const activeKeys = await this.count({ where: { status: 'active' } });
            // Total requests (sum from all keys)
            const totalRequestsResult = await this.createQueryBuilder('key')
                .select('SUM(key.totalRequests)', 'total')
                .getRawOne();
            const totalRequests = parseInt(totalRequestsResult?.total || '0');
            // Top keys by usage
            const topKeysByUsage = await this.createQueryBuilder('key')
                .select([
                'key.id',
                'key.name',
                'key.clientName',
                'key.totalRequests',
                'key.requestsThisMonth',
            ])
                .orderBy('key.totalRequests', 'DESC')
                .limit(10)
                .getMany();
            // Keys by status
            const statusStats = await this.createQueryBuilder('key')
                .select('key.status, COUNT(*) as count')
                .groupBy('key.status')
                .getRawMany();
            const keysByStatus = statusStats.reduce((acc, stat) => ({
                ...acc,
                [stat.status]: parseInt(stat.count),
            }), {});
            // Expiring keys (within next 30 days)
            const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const expiringKeys = await this.count({
                where: {
                    status: 'active',
                    expiresAt: (0, typeorm_1.Between)(new Date(), thirtyDaysFromNow),
                },
            });
            return {
                totalKeys,
                activeKeys,
                totalRequests,
                topKeysByUsage,
                keysByStatus,
                expiringKeys,
            };
        }
        async findKeysNeedingRotation(days = 90) {
            const rotationDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            return this.createQueryBuilder('key')
                .where('key.status = :status', { status: 'active' })
                .andWhere('(key.regeneratedAt IS NULL AND key.createdAt < :rotationDate)')
                .orWhere('key.regeneratedAt < :rotationDate')
                .setParameter('rotationDate', rotationDate)
                .getMany();
        }
        async getClientUsageReport(clientId, days = 30) {
            const keys = await this.findByClientId(clientId);
            const totalKeys = keys.length;
            const activeKeys = keys.filter(k => k.status === 'active').length;
            const totalRequests = keys.reduce((sum, k) => sum + k.totalRequests, 0);
            const requestsThisMonth = keys.reduce((sum, k) => sum + k.requestsThisMonth, 0);
            // Mock additional metrics (in real implementation, these would come from monitoring data)
            const avgResponseTime = 125.5;
            const errorRate = 0.02;
            const rateLimitHits = Math.floor(totalRequests * 0.001); // 0.1% rate limit hits
            return {
                clientId,
                totalKeys,
                activeKeys,
                totalRequests,
                requestsThisMonth,
                avgResponseTime,
                errorRate,
                rateLimitHits,
                keys: keys.map(k => ({
                    id: k.id,
                    name: k.name,
                    status: k.status,
                    totalRequests: k.totalRequests,
                    lastUsed: k.lastUsed,
                })),
            };
        }
    };
    __setFunctionName(_classThis, "ApiKeyRepository");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ApiKeyRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ApiKeyRepository = _classThis;
})();
exports.ApiKeyRepository = ApiKeyRepository;
