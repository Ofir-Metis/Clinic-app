"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSimpleModule = void 0;
const common_1 = require("@nestjs/common");
const health_simple_controller_1 = require("./health/health-simple.controller");
const health_service_1 = require("./health/health.service");
let AppSimpleModule = class AppSimpleModule {
};
exports.AppSimpleModule = AppSimpleModule;
exports.AppSimpleModule = AppSimpleModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [health_simple_controller_1.HealthSimpleController],
        providers: [health_service_1.HealthService],
    })
], AppSimpleModule);
//# sourceMappingURL=app-simple.module.js.map