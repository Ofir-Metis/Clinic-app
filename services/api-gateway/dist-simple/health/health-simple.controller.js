"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HealthSimpleController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthSimpleController = void 0;
const common_1 = require("@nestjs/common");
const health_service_1 = require("./health.service");
let HealthSimpleController = HealthSimpleController_1 = class HealthSimpleController {
    constructor(healthService) {
        this.healthService = healthService;
        this.logger = new common_1.Logger(HealthSimpleController_1.name);
    }
    async getHealth() {
        this.logger.log('Health check requested');
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0-simple'
        };
    }
    async getStatus() {
        return await this.healthService.getSystemStatus();
    }
    async getRoot() {
        return {
            message: 'Healthcare Clinic Platform API Gateway',
            status: 'operational',
            version: '1.0.0-simple',
            documentation: '/api-docs',
            health: '/health'
        };
    }
};
exports.HealthSimpleController = HealthSimpleController;
__decorate([
    (0, common_1.Get)('/health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthSimpleController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthSimpleController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthSimpleController.prototype, "getRoot", null);
exports.HealthSimpleController = HealthSimpleController = HealthSimpleController_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [health_service_1.HealthService])
], HealthSimpleController);
//# sourceMappingURL=health-simple.controller.js.map