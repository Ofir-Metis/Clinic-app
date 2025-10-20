"use strict";
/**
 * PerformanceMetricRepository - Repository for performance metrics with custom queries
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
exports.PerformanceMetricRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const performance_metric_entity_1 = require("../entities/performance-metric.entity");
let PerformanceMetricRepository = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = typeorm_1.Repository;
    var PerformanceMetricRepository = _classThis = class extends _classSuper {
        constructor(dataSource) {
            super(performance_metric_entity_1.PerformanceMetric, dataSource.createEntityManager());
            this.dataSource = dataSource;
        }
        async recordMetric(service, metricName, value, unit, tags, metadata) {
            const metric = this.create({
                service,
                metricName,
                value,
                unit,
                tags,
                metadata,
                timestamp: new Date(),
            });
            return this.save(metric);
        }
        async getMetricSeries(service, metricName, startTime, endTime, interval = 'hour') {
            let timeFormat;
            switch (interval) {
                case 'minute':
                    timeFormat = '%Y-%m-%d %H:%i:00';
                    break;
                case 'hour':
                    timeFormat = '%Y-%m-%d %H:00:00';
                    break;
                case 'day':
                    timeFormat = '%Y-%m-%d 00:00:00';
                    break;
            }
            const result = await this.createQueryBuilder('metric')
                .select([
                `DATE_FORMAT(metric.timestamp, '${timeFormat}') as timestamp`,
                'AVG(metric.value) as value',
                'COUNT(*) as count',
            ])
                .where('metric.service = :service', { service })
                .andWhere('metric.metricName = :metricName', { metricName })
                .andWhere('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
                .groupBy(`DATE_FORMAT(metric.timestamp, '${timeFormat}')`)
                .orderBy('timestamp', 'ASC')
                .getRawMany();
            return result.map(row => ({
                timestamp: new Date(row.timestamp),
                value: parseFloat(row.value),
                count: parseInt(row.count),
            }));
        }
        async getServiceMetrics(service, startTime, endTime) {
            const result = await this.createQueryBuilder('metric')
                .select([
                'metric.metricName',
                'metric.value as currentValue',
                'AVG(metric.value) as avgValue',
                'MIN(metric.value) as minValue',
                'MAX(metric.value) as maxValue',
                'COUNT(*) as count',
            ])
                .where('metric.service = :service', { service })
                .andWhere('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
                .groupBy('metric.metricName')
                .orderBy('metric.metricName', 'ASC')
                .getRawMany();
            return result.map(row => ({
                metricName: row.metricName,
                currentValue: parseFloat(row.currentValue),
                avgValue: parseFloat(row.avgValue),
                minValue: parseFloat(row.minValue),
                maxValue: parseFloat(row.maxValue),
                count: parseInt(row.count),
            }));
        }
        async getSystemOverview(startTime, endTime) {
            // Get distinct services
            const servicesResult = await this.createQueryBuilder('metric')
                .select('DISTINCT metric.service')
                .where('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
                .getRawMany();
            const services = servicesResult.map(row => row.service);
            // Get metrics for each service
            const metricsPromises = services.map(async (service) => {
                const serviceMetrics = await this.getServiceMetrics(service, startTime, endTime);
                const getMetricValue = (metricName) => {
                    const metric = serviceMetrics.find(m => m.metricName === metricName);
                    return metric ? metric.avgValue : 0;
                };
                return {
                    service,
                    metrics: {
                        responseTime: getMetricValue('response_time'),
                        throughput: getMetricValue('requests_per_second'),
                        errorRate: getMetricValue('error_rate'),
                        cpuUsage: getMetricValue('cpu_usage'),
                        memoryUsage: getMetricValue('memory_usage'),
                    },
                };
            });
            const serviceMetricsResults = await Promise.all(metricsPromises);
            const metrics = serviceMetricsResults.reduce((acc, result) => {
                acc[result.service] = result.metrics;
                return acc;
            }, {});
            // Calculate overall metrics
            const totalRequestsResult = await this.createQueryBuilder('metric')
                .select('SUM(metric.value) as total')
                .where('metric.metricName = :metricName', { metricName: 'total_requests' })
                .andWhere('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
                .getRawOne();
            const avgResponseTimeResult = await this.createQueryBuilder('metric')
                .select('AVG(metric.value) as avg')
                .where('metric.metricName = :metricName', { metricName: 'response_time' })
                .andWhere('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
                .getRawOne();
            const errorRateResult = await this.createQueryBuilder('metric')
                .select('AVG(metric.value) as avg')
                .where('metric.metricName = :metricName', { metricName: 'error_rate' })
                .andWhere('metric.timestamp BETWEEN :startTime AND :endTime', { startTime, endTime })
                .getRawOne();
            return {
                services,
                metrics,
                totalRequests: parseInt(totalRequestsResult?.total || '0'),
                avgResponseTime: parseFloat(avgResponseTimeResult?.avg || '0'),
                overallErrorRate: parseFloat(errorRateResult?.avg || '0'),
            };
        }
        async getTopSlowQueries(service, limit = 10, hours = 24) {
            const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
            const result = await this.createQueryBuilder('metric')
                .select([
                "JSON_UNQUOTE(JSON_EXTRACT(metric.metadata, '$.query')) as query",
                'AVG(metric.value) as avgDuration',
                'MAX(metric.value) as maxDuration',
                'COUNT(*) as executionCount',
                'SUM(metric.value) as totalDuration',
            ])
                .where('metric.service = :service', { service })
                .andWhere('metric.metricName = :metricName', { metricName: 'query_duration' })
                .andWhere('metric.timestamp > :startTime', { startTime })
                .groupBy("JSON_UNQUOTE(JSON_EXTRACT(metric.metadata, '$.query'))")
                .orderBy('avgDuration', 'DESC')
                .limit(limit)
                .getRawMany();
            return result.map(row => ({
                query: row.query || 'Unknown Query',
                avgDuration: parseFloat(row.avgDuration),
                maxDuration: parseFloat(row.maxDuration),
                executionCount: parseInt(row.executionCount),
                totalDuration: parseFloat(row.totalDuration),
            }));
        }
        async getAlertConditions() {
            // This would typically check against predefined thresholds
            // For now, we'll return some example conditions based on common thresholds
            const recentMetrics = await this.createQueryBuilder('metric')
                .select([
                'metric.service',
                'metric.metricName',
                'AVG(metric.value) as currentValue',
            ])
                .where('metric.timestamp > :recentTime', {
                recentTime: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
            })
                .groupBy('metric.service, metric.metricName')
                .getRawMany();
            const alerts = [];
            for (const metric of recentMetrics) {
                const value = parseFloat(metric.currentValue);
                // Define thresholds for common metrics
                const thresholds = {
                    'response_time': { warning: 1000, critical: 2000, condition: 'above' },
                    'error_rate': { warning: 0.05, critical: 0.1, condition: 'above' },
                    'cpu_usage': { warning: 80, critical: 90, condition: 'above' },
                    'memory_usage': { warning: 85, critical: 95, condition: 'above' },
                    'disk_usage': { warning: 80, critical: 90, condition: 'above' },
                };
                const threshold = thresholds[metric.metricName];
                if (threshold) {
                    if (value >= threshold.critical) {
                        alerts.push({
                            service: metric.service,
                            metricName: metric.metricName,
                            currentValue: value,
                            threshold: threshold.critical,
                            condition: threshold.condition,
                            severity: 'critical',
                        });
                    }
                    else if (value >= threshold.warning) {
                        alerts.push({
                            service: metric.service,
                            metricName: metric.metricName,
                            currentValue: value,
                            threshold: threshold.warning,
                            condition: threshold.condition,
                            severity: 'warning',
                        });
                    }
                }
            }
            return alerts;
        }
        async cleanupOldMetrics(retentionDays = 90) {
            const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
            const result = await this.createQueryBuilder()
                .delete()
                .from(performance_metric_entity_1.PerformanceMetric)
                .where('timestamp < :cutoffDate', { cutoffDate })
                .execute();
            return result.affected || 0;
        }
    };
    __setFunctionName(_classThis, "PerformanceMetricRepository");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PerformanceMetricRepository = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PerformanceMetricRepository = _classThis;
})();
exports.PerformanceMetricRepository = PerformanceMetricRepository;
