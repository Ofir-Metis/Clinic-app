"use strict";
/**
 * AuditEventRepository - Repository for audit events with custom queries
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
exports.AuditEventRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const audit_event_entity_1 = require("../entities/audit-event.entity");
let AuditEventRepository = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = typeorm_1.Repository;
    var AuditEventRepository = _classThis = class extends _classSuper {
        constructor(dataSource) {
            super(audit_event_entity_1.AuditEvent, dataSource.createEntityManager());
            this.dataSource = dataSource;
        }
        async findByDateRange(startDate, endDate, limit = 100, offset = 0) {
            const [events, total] = await this.findAndCount({
                where: {
                    timestamp: (0, typeorm_1.Between)(startDate, endDate),
                },
                order: { timestamp: 'DESC' },
                take: limit,
                skip: offset,
            });
            return { events, total };
        }
        async findByUser(userId, limit = 50) {
            return this.find({
                where: { userId },
                order: { timestamp: 'DESC' },
                take: limit,
            });
        }
        async findByRiskLevel(riskLevel, limit = 100) {
            return this.find({
                where: { riskLevel },
                order: { timestamp: 'DESC' },
                take: limit,
            });
        }
        async findFailedActions(hours = 24) {
            const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
            return this.find({
                where: {
                    outcome: 'failure',
                    timestamp: (0, typeorm_1.Between)(startDate, new Date()),
                },
                order: { timestamp: 'DESC' },
            });
        }
        async getComplianceReport(startDate, endDate) {
            const totalEvents = await this.count({
                where: {
                    timestamp: (0, typeorm_1.Between)(startDate, endDate),
                },
            });
            // Events by outcome
            const outcomeStats = await this.createQueryBuilder('event')
                .select('event.outcome, COUNT(*) as count')
                .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
                .groupBy('event.outcome')
                .getRawMany();
            // Events by risk level
            const riskStats = await this.createQueryBuilder('event')
                .select('event.riskLevel, COUNT(*) as count')
                .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
                .groupBy('event.riskLevel')
                .getRawMany();
            // Events by resource type
            const resourceStats = await this.createQueryBuilder('event')
                .select('event.resourceType, COUNT(*) as count')
                .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
                .groupBy('event.resourceType')
                .getRawMany();
            const criticalEvents = await this.count({
                where: {
                    riskLevel: 'critical',
                    timestamp: (0, typeorm_1.Between)(startDate, endDate),
                },
            });
            const failedActions = await this.count({
                where: {
                    outcome: 'failure',
                    timestamp: (0, typeorm_1.Between)(startDate, endDate),
                },
            });
            const complianceFlaggedEvents = await this.createQueryBuilder('event')
                .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
                .andWhere('JSON_LENGTH(event.complianceFlags) > 0')
                .getCount();
            return {
                totalEvents,
                eventsByOutcome: outcomeStats.reduce((acc, stat) => ({ ...acc, [stat.outcome]: parseInt(stat.count) }), {}),
                eventsByRiskLevel: riskStats.reduce((acc, stat) => ({ ...acc, [stat.riskLevel]: parseInt(stat.count) }), {}),
                eventsByResourceType: resourceStats.reduce((acc, stat) => ({ ...acc, [stat.resourceType]: parseInt(stat.count) }), {}),
                criticalEvents,
                failedActions,
                complianceFlaggedEvents,
            };
        }
        async findSuspiciousActivity(hours = 24) {
            const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
            // Multiple failed login attempts from same IP
            const multipleFailedLogins = await this.createQueryBuilder('event')
                .where('event.action = :action', { action: 'login_attempt' })
                .andWhere('event.outcome = :outcome', { outcome: 'failure' })
                .andWhere('event.timestamp > :startDate', { startDate })
                .groupBy('event.ipAddress')
                .having('COUNT(*) >= 5')
                .getMany();
            // Activity from new/unusual IP addresses
            const unusualIpAddresses = await this.createQueryBuilder('event')
                .where('event.timestamp > :startDate', { startDate })
                .andWhere('event.riskLevel IN (:...levels)', { levels: ['medium', 'high', 'critical'] })
                .getMany();
            // After-hours activity (assuming business hours 9-17)
            const afterHoursActivity = await this.createQueryBuilder('event')
                .where('event.timestamp > :startDate', { startDate })
                .andWhere('(HOUR(event.timestamp) < 9 OR HOUR(event.timestamp) > 17)')
                .andWhere('event.action NOT IN (:...automatedActions)', {
                automatedActions: ['system_backup', 'scheduled_job', 'health_check'],
            })
                .getMany();
            return {
                multipleFailedLogins,
                unusualIpAddresses,
                afterHoursActivity,
            };
        }
        async getAuditMetrics(days = 30) {
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            // Daily event counts
            const dailyEvents = await this.createQueryBuilder('event')
                .select('DATE(event.timestamp) as date, COUNT(*) as count')
                .where('event.timestamp > :startDate', { startDate })
                .groupBy('DATE(event.timestamp)')
                .orderBy('date', 'ASC')
                .getRawMany();
            // Top users by event count
            const topUsers = await this.createQueryBuilder('event')
                .select('event.userEmail, COUNT(*) as eventCount')
                .where('event.timestamp > :startDate', { startDate })
                .groupBy('event.userEmail')
                .orderBy('eventCount', 'DESC')
                .limit(10)
                .getRawMany();
            // Top actions
            const topActions = await this.createQueryBuilder('event')
                .select('event.action, COUNT(*) as count')
                .where('event.timestamp > :startDate', { startDate })
                .groupBy('event.action')
                .orderBy('count', 'DESC')
                .limit(10)
                .getRawMany();
            // Risk level trends
            const riskTrends = await this.createQueryBuilder('event')
                .select([
                'DATE(event.timestamp) as date',
                'SUM(CASE WHEN event.riskLevel = "critical" THEN 1 ELSE 0 END) as critical',
                'SUM(CASE WHEN event.riskLevel = "high" THEN 1 ELSE 0 END) as high',
                'SUM(CASE WHEN event.riskLevel = "medium" THEN 1 ELSE 0 END) as medium',
                'SUM(CASE WHEN event.riskLevel = "low" THEN 1 ELSE 0 END) as low',
            ])
                .where('event.timestamp > :startDate', { startDate })
                .groupBy('DATE(event.timestamp)')
                .orderBy('date', 'ASC')
                .getRawMany();
            return {
                dailyEventCounts: dailyEvents.map(e => ({ date: e.date, count: parseInt(e.count) })),
                topUsers: topUsers.map(u => ({ userEmail: u.userEmail, eventCount: parseInt(u.eventCount) })),
                topActions: topActions.map(a => ({ action: a.action, count: parseInt(a.count) })),
                riskTrends: riskTrends.map(r => ({
                    date: r.date,
                    critical: parseInt(r.critical),
                    high: parseInt(r.high),
                    medium: parseInt(r.medium),
                    low: parseInt(r.low),
                })),
            };
        }
    };
    __setFunctionName(_classThis, "AuditEventRepository");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuditEventRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuditEventRepository = _classThis;
})();
exports.AuditEventRepository = AuditEventRepository;
