"use strict";
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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_dto_1 = require("./dto/dashboard.dto");
let DashboardController = (() => {
    let _classDecorators = [(0, swagger_1.ApiTags)('Dashboard'), (0, swagger_1.ApiBearerAuth)('JWT-auth'), (0, swagger_1.ApiExtraModels)(dashboard_dto_1.DashboardQueryDto, dashboard_dto_1.DashboardResponseDto, dashboard_dto_1.AppointmentSummaryDto, dashboard_dto_1.NoteSummaryDto, dashboard_dto_1.DashboardStatsDto, dashboard_dto_1.DashboardAnalyticsDto), (0, common_1.Controller)('dashboard')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _upcoming_decorators;
    let _recent_decorators;
    let _stats_decorators;
    let _overview_decorators;
    var DashboardController = _classThis = class {
        constructor(service) {
            this.service = (__runInitializers(this, _instanceExtraInitializers), service);
        }
        upcoming(query, req) {
            return this.service.appointments(query, req.user);
        }
        recent(query, priority, req) {
            return this.service.notes({ ...query, priority }, req?.user);
        }
        stats(query, req) {
            return this.service.stats(query, req.user);
        }
        overview(query, req) {
            return this.service.getCompleteOverview(query, req.user);
        }
    };
    __setFunctionName(_classThis, "DashboardController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _upcoming_decorators = [(0, common_1.Get)('appointments'), (0, swagger_1.ApiOperation)({
                summary: 'Get upcoming appointments',
                description: `
      Retrieves a list of upcoming appointments for the authenticated user.
      
      **Features:**
      - Role-based filtering (clients see their appointments, coaches see their schedule)
      - Customizable time range and limit
      - Real-time status updates
      - HIPAA-compliant data filtering
      
      **Use Cases:**
      - Client dashboard showing next appointments
      - Coach schedule overview
      - Admin appointment monitoring
    `
            }), (0, swagger_1.ApiQuery)({
                name: 'timeRange',
                enum: dashboard_dto_1.TimeRange,
                required: false,
                description: 'Time range for appointments (default: week)'
            }), (0, swagger_1.ApiQuery)({
                name: 'limit',
                type: 'number',
                required: false,
                description: 'Maximum number of appointments to return (1-100, default: 20)'
            }), (0, swagger_1.ApiQuery)({
                name: 'view',
                enum: dashboard_dto_1.DashboardView,
                required: false,
                description: 'Dashboard view type based on user role'
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Successfully retrieved upcoming appointments',
                schema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'success' },
                        data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AppointmentSummaryDto' }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                total: { type: 'number', example: 15 },
                                limit: { type: 'number', example: 20 },
                                hasMore: { type: 'boolean', example: false }
                            }
                        },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                }
            }), (0, swagger_1.ApiResponse)({
                status: 401,
                description: 'Unauthorized - Invalid or missing JWT token',
                schema: {
                    type: 'object',
                    properties: {
                        statusCode: { type: 'number', example: 401 },
                        message: { type: 'string', example: 'Unauthorized' },
                        error: { type: 'string', example: 'Unauthorized' }
                    }
                }
            }), (0, swagger_1.ApiResponse)({
                status: 403,
                description: 'Forbidden - Insufficient permissions',
                schema: {
                    type: 'object',
                    properties: {
                        statusCode: { type: 'number', example: 403 },
                        message: { type: 'string', example: 'Access denied' },
                        error: { type: 'string', example: 'Forbidden' }
                    }
                }
            }), (0, swagger_1.ApiResponse)({
                status: 429,
                description: 'Too Many Requests - Rate limit exceeded',
                schema: {
                    type: 'object',
                    properties: {
                        statusCode: { type: 'number', example: 429 },
                        message: { type: 'string', example: 'Rate limit exceeded' },
                        error: { type: 'string', example: 'Too Many Requests' }
                    }
                }
            })];
        _recent_decorators = [(0, common_1.Get)('notes'), (0, swagger_1.ApiOperation)({
                summary: 'Get recent notes',
                description: `
      Retrieves recent session notes and patient updates for the authenticated user.
      
      **Features:**
      - Role-based access control (only authorized notes visible)
      - HIPAA-compliant PHI filtering
      - Priority-based sorting
      - Search and filtering capabilities
      
      **Security:**
      - All PHI is properly encrypted
      - Audit logging for all access
      - Role-based data filtering
    `
            }), (0, swagger_1.ApiQuery)({
                name: 'timeRange',
                enum: dashboard_dto_1.TimeRange,
                required: false,
                description: 'Time range for notes (default: week)'
            }), (0, swagger_1.ApiQuery)({
                name: 'limit',
                type: 'number',
                required: false,
                description: 'Maximum number of notes to return (1-100, default: 20)'
            }), (0, swagger_1.ApiQuery)({
                name: 'priority',
                type: 'string',
                enum: ['low', 'normal', 'high', 'urgent'],
                required: false,
                description: 'Filter by note priority level'
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Successfully retrieved recent notes',
                schema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'success' },
                        data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/NoteSummaryDto' }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                total: { type: 'number', example: 8 },
                                limit: { type: 'number', example: 20 },
                                hasMore: { type: 'boolean', example: false }
                            }
                        },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                }
            }), (0, swagger_1.ApiResponse)({
                status: 401,
                description: 'Unauthorized - Invalid or missing JWT token'
            }), (0, swagger_1.ApiResponse)({
                status: 403,
                description: 'Forbidden - Insufficient permissions to access notes'
            })];
        _stats_decorators = [(0, common_1.Get)('stats'), (0, swagger_1.ApiOperation)({
                summary: 'Get dashboard statistics',
                description: `
      Retrieves comprehensive dashboard statistics and key performance indicators.
      
      **Metrics Include:**
      - Patient counts and growth
      - Appointment statistics
      - Session completion rates
      - Revenue and billing data
      - Performance indicators
      
      **Features:**
      - Real-time data aggregation
      - Role-based metric filtering
      - Customizable time ranges
      - Trend analysis
    `
            }), (0, swagger_1.ApiQuery)({
                name: 'timeRange',
                enum: dashboard_dto_1.TimeRange,
                required: false,
                description: 'Time range for statistics (default: month)'
            }), (0, swagger_1.ApiQuery)({
                name: 'includeAnalytics',
                type: 'boolean',
                required: false,
                description: 'Include detailed analytics data (default: false)'
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Successfully retrieved dashboard statistics',
                schema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'success' },
                        data: { $ref: '#/components/schemas/DashboardStatsDto' },
                        analytics: {
                            $ref: '#/components/schemas/DashboardAnalyticsDto',
                            description: 'Detailed analytics (only if includeAnalytics=true)'
                        },
                        timestamp: { type: 'string', format: 'date-time' },
                        cacheStatus: {
                            type: 'string',
                            example: 'hit',
                            description: 'Cache hit/miss status for performance monitoring'
                        }
                    }
                }
            }), (0, swagger_1.ApiResponse)({
                status: 401,
                description: 'Unauthorized - Invalid or missing JWT token'
            }), (0, swagger_1.ApiResponse)({
                status: 403,
                description: 'Forbidden - Insufficient permissions to view statistics'
            })];
        _overview_decorators = [(0, common_1.Get)('overview'), (0, swagger_1.ApiOperation)({
                summary: 'Get complete dashboard overview',
                description: `
      Retrieves a comprehensive dashboard overview combining appointments, notes, 
      and statistics in a single request for optimal performance.
      
      **Benefits:**
      - Reduced API calls for dashboard loading
      - Consistent data timestamps
      - Optimized for mobile and web dashboards
      - Single cache entry for better performance
    `
            }), (0, swagger_1.ApiResponse)({
                status: 200,
                description: 'Successfully retrieved complete dashboard overview',
                type: dashboard_dto_1.DashboardResponseDto
            }), (0, swagger_1.ApiResponse)({
                status: 401,
                description: 'Unauthorized - Invalid or missing JWT token'
            })];
        __esDecorate(_classThis, null, _upcoming_decorators, { kind: "method", name: "upcoming", static: false, private: false, access: { has: obj => "upcoming" in obj, get: obj => obj.upcoming }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _recent_decorators, { kind: "method", name: "recent", static: false, private: false, access: { has: obj => "recent" in obj, get: obj => obj.recent }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _stats_decorators, { kind: "method", name: "stats", static: false, private: false, access: { has: obj => "stats" in obj, get: obj => obj.stats }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _overview_decorators, { kind: "method", name: "overview", static: false, private: false, access: { has: obj => "overview" in obj, get: obj => obj.overview }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DashboardController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DashboardController = _classThis;
})();
exports.DashboardController = DashboardController;
