"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
let HealthService = HealthService_1 = class HealthService {
    constructor() {
        this.logger = new common_1.Logger(HealthService_1.name);
        this.services = {
            'auth-service': { port: 3001, critical: true },
            'appointments-service': { port: 3002, critical: false },
            'files-service': { port: 3003, critical: true },
            'notifications-service': { port: 3004, critical: false },
            'ai-service': { port: 3005, critical: false },
            'notes-service': { port: 3006, critical: false },
            'analytics-service': { port: 3007, critical: false },
            'settings-service': { port: 3008, critical: false },
            'billing-service': { port: 3009, critical: false },
        };
    }
    async checkAllServices() {
        const serviceNames = Object.keys(this.services);
        return this.checkServices(serviceNames);
    }
    async checkServices(serviceNames) {
        const healthChecks = serviceNames.map(async (serviceName) => {
            const health = await this.checkService(serviceName);
            return { serviceName, health };
        });
        const results = await Promise.allSettled(healthChecks);
        const serviceHealths = {};
        results.forEach((result, index) => {
            const serviceName = serviceNames[index];
            if (result.status === 'fulfilled') {
                serviceHealths[serviceName] = result.value.health;
            }
            else {
                serviceHealths[serviceName] = {
                    status: 'unhealthy',
                    error: result.reason?.message || 'Health check failed'
                };
                this.logger.error(`Health check failed for ${serviceName}`, result.reason?.stack);
            }
        });
        return serviceHealths;
    }
    async checkService(serviceName) {
        const serviceConfig = this.services[serviceName];
        if (!serviceConfig) {
            return {
                status: 'unhealthy',
                error: 'Service not configured'
            };
        }
        const startTime = Date.now();
        try {
            const response = await this.makeHealthRequest(serviceConfig.port);
            const responseTime = Date.now() - startTime;
            if (response.ok) {
                this.logger.log(`Health check successful for ${serviceName}`);
                return {
                    status: 'healthy',
                    responseTime
                };
            }
            else {
                return {
                    status: 'degraded',
                    responseTime,
                    error: `HTTP ${response.status}`
                };
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            this.logger.warn(`Health check failed for ${serviceName}`);
            return {
                status: 'unhealthy',
                responseTime,
                error: error.message
            };
        }
    }
    async makeHealthRequest(port) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
            const response = await fetch(`http://localhost:${port}/health`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'api-gateway-health-check',
                    'Accept': 'application/json'
                }
            });
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    async getCriticalServicesHealth() {
        const criticalServices = Object.entries(this.services)
            .filter(([, config]) => config.critical)
            .map(([name]) => name);
        return this.checkServices(criticalServices);
    }
    async isSystemReady() {
        const criticalHealth = await this.getCriticalServicesHealth();
        return Object.values(criticalHealth)
            .every(health => health.status === 'healthy');
    }
    getServiceConfig(serviceName) {
        return this.services[serviceName];
    }
    getConfiguredServices() {
        return Object.keys(this.services);
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = HealthService_1 = __decorate([
    (0, common_1.Injectable)()
], HealthService);
//# sourceMappingURL=health.service.js.map