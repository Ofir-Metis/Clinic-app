"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardResponseDto = exports.DashboardAnalyticsDto = exports.DashboardStatsDto = exports.NoteSummaryDto = exports.AppointmentSummaryDto = exports.DashboardQueryDto = exports.DashboardView = exports.TimeRange = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var TimeRange;
(function (TimeRange) {
    TimeRange["TODAY"] = "today";
    TimeRange["WEEK"] = "week";
    TimeRange["MONTH"] = "month";
    TimeRange["QUARTER"] = "quarter";
    TimeRange["YEAR"] = "year";
    TimeRange["CUSTOM"] = "custom";
})(TimeRange || (exports.TimeRange = TimeRange = {}));
var DashboardView;
(function (DashboardView) {
    DashboardView["CLIENT"] = "client";
    DashboardView["THERAPIST"] = "therapist";
    DashboardView["ADMIN"] = "admin";
})(DashboardView || (exports.DashboardView = DashboardView = {}));
let DashboardQueryDto = (() => {
    var _a;
    let _timeRange_decorators;
    let _timeRange_initializers = [];
    let _timeRange_extraInitializers = [];
    let _view_decorators;
    let _view_initializers = [];
    let _view_extraInitializers = [];
    let _startDate_decorators;
    let _startDate_initializers = [];
    let _startDate_extraInitializers = [];
    let _endDate_decorators;
    let _endDate_initializers = [];
    let _endDate_extraInitializers = [];
    let _limit_decorators;
    let _limit_initializers = [];
    let _limit_extraInitializers = [];
    let _includeAnalytics_decorators;
    let _includeAnalytics_initializers = [];
    let _includeAnalytics_extraInitializers = [];
    return _a = class DashboardQueryDto {
            constructor() {
                this.timeRange = __runInitializers(this, _timeRange_initializers, TimeRange.WEEK);
                this.view = (__runInitializers(this, _timeRange_extraInitializers), __runInitializers(this, _view_initializers, void 0));
                this.startDate = (__runInitializers(this, _view_extraInitializers), __runInitializers(this, _startDate_initializers, void 0));
                this.endDate = (__runInitializers(this, _startDate_extraInitializers), __runInitializers(this, _endDate_initializers, void 0));
                this.limit = (__runInitializers(this, _endDate_extraInitializers), __runInitializers(this, _limit_initializers, 20));
                this.includeAnalytics = (__runInitializers(this, _limit_extraInitializers), __runInitializers(this, _includeAnalytics_initializers, false));
                __runInitializers(this, _includeAnalytics_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _timeRange_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Time range for dashboard data',
                    enum: TimeRange,
                    default: TimeRange.WEEK,
                    example: TimeRange.WEEK
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(TimeRange)];
            _view_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Dashboard view type based on user role',
                    enum: DashboardView,
                    example: DashboardView.CLIENT
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(DashboardView)];
            _startDate_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Start date for custom time range (ISO 8601 format)',
                    type: 'string',
                    format: 'date-time',
                    required: false,
                    example: '2024-01-01T00:00:00Z'
                }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(() => Date), (0, class_validator_1.IsDate)()];
            _endDate_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'End date for custom time range (ISO 8601 format)',
                    type: 'string',
                    format: 'date-time',
                    required: false,
                    example: '2024-01-31T23:59:59Z'
                }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(() => Date), (0, class_validator_1.IsDate)()];
            _limit_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Maximum number of items to return',
                    minimum: 1,
                    maximum: 100,
                    default: 20,
                    example: 20
                }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(() => Number), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(100)];
            _includeAnalytics_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Include detailed analytics data',
                    default: false,
                    example: false
                }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true)];
            __esDecorate(null, null, _timeRange_decorators, { kind: "field", name: "timeRange", static: false, private: false, access: { has: obj => "timeRange" in obj, get: obj => obj.timeRange, set: (obj, value) => { obj.timeRange = value; } }, metadata: _metadata }, _timeRange_initializers, _timeRange_extraInitializers);
            __esDecorate(null, null, _view_decorators, { kind: "field", name: "view", static: false, private: false, access: { has: obj => "view" in obj, get: obj => obj.view, set: (obj, value) => { obj.view = value; } }, metadata: _metadata }, _view_initializers, _view_extraInitializers);
            __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: obj => "startDate" in obj, get: obj => obj.startDate, set: (obj, value) => { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
            __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: obj => "endDate" in obj, get: obj => obj.endDate, set: (obj, value) => { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
            __esDecorate(null, null, _limit_decorators, { kind: "field", name: "limit", static: false, private: false, access: { has: obj => "limit" in obj, get: obj => obj.limit, set: (obj, value) => { obj.limit = value; } }, metadata: _metadata }, _limit_initializers, _limit_extraInitializers);
            __esDecorate(null, null, _includeAnalytics_decorators, { kind: "field", name: "includeAnalytics", static: false, private: false, access: { has: obj => "includeAnalytics" in obj, get: obj => obj.includeAnalytics, set: (obj, value) => { obj.includeAnalytics = value; } }, metadata: _metadata }, _includeAnalytics_initializers, _includeAnalytics_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.DashboardQueryDto = DashboardQueryDto;
let AppointmentSummaryDto = (() => {
    var _a;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _patientName_decorators;
    let _patientName_initializers = [];
    let _patientName_extraInitializers = [];
    let _therapistName_decorators;
    let _therapistName_initializers = [];
    let _therapistName_extraInitializers = [];
    let _scheduledAt_decorators;
    let _scheduledAt_initializers = [];
    let _scheduledAt_extraInitializers = [];
    let _duration_decorators;
    let _duration_initializers = [];
    let _duration_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _location_decorators;
    let _location_initializers = [];
    let _location_extraInitializers = [];
    return _a = class AppointmentSummaryDto {
            constructor() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.patientName = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _patientName_initializers, void 0));
                this.therapistName = (__runInitializers(this, _patientName_extraInitializers), __runInitializers(this, _therapistName_initializers, void 0));
                this.scheduledAt = (__runInitializers(this, _therapistName_extraInitializers), __runInitializers(this, _scheduledAt_initializers, void 0));
                this.duration = (__runInitializers(this, _scheduledAt_extraInitializers), __runInitializers(this, _duration_initializers, void 0));
                this.type = (__runInitializers(this, _duration_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.status = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.location = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _location_initializers, void 0));
                __runInitializers(this, _location_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Unique appointment identifier',
                    example: 'apt_123456789'
                })];
            _patientName_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Patient full name',
                    example: 'John Doe'
                })];
            _therapistName_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Therapist full name',
                    example: 'Dr. Sarah Johnson'
                })];
            _scheduledAt_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Scheduled appointment date and time',
                    type: 'string',
                    format: 'date-time',
                    example: '2024-02-01T15:00:00Z'
                })];
            _duration_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Appointment duration in minutes',
                    example: 60
                })];
            _type_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Appointment type',
                    example: 'individual_therapy'
                })];
            _status_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Current appointment status',
                    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
                    example: 'scheduled'
                })];
            _location_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Meeting location or room',
                    example: 'Room 201'
                })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _patientName_decorators, { kind: "field", name: "patientName", static: false, private: false, access: { has: obj => "patientName" in obj, get: obj => obj.patientName, set: (obj, value) => { obj.patientName = value; } }, metadata: _metadata }, _patientName_initializers, _patientName_extraInitializers);
            __esDecorate(null, null, _therapistName_decorators, { kind: "field", name: "therapistName", static: false, private: false, access: { has: obj => "therapistName" in obj, get: obj => obj.therapistName, set: (obj, value) => { obj.therapistName = value; } }, metadata: _metadata }, _therapistName_initializers, _therapistName_extraInitializers);
            __esDecorate(null, null, _scheduledAt_decorators, { kind: "field", name: "scheduledAt", static: false, private: false, access: { has: obj => "scheduledAt" in obj, get: obj => obj.scheduledAt, set: (obj, value) => { obj.scheduledAt = value; } }, metadata: _metadata }, _scheduledAt_initializers, _scheduledAt_extraInitializers);
            __esDecorate(null, null, _duration_decorators, { kind: "field", name: "duration", static: false, private: false, access: { has: obj => "duration" in obj, get: obj => obj.duration, set: (obj, value) => { obj.duration = value; } }, metadata: _metadata }, _duration_initializers, _duration_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _location_decorators, { kind: "field", name: "location", static: false, private: false, access: { has: obj => "location" in obj, get: obj => obj.location, set: (obj, value) => { obj.location = value; } }, metadata: _metadata }, _location_initializers, _location_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.AppointmentSummaryDto = AppointmentSummaryDto;
let NoteSummaryDto = (() => {
    var _a;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _patientName_decorators;
    let _patientName_initializers = [];
    let _patientName_extraInitializers = [];
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _preview_decorators;
    let _preview_initializers = [];
    let _preview_extraInitializers = [];
    let _authorName_decorators;
    let _authorName_initializers = [];
    let _authorName_extraInitializers = [];
    let _createdAt_decorators;
    let _createdAt_initializers = [];
    let _createdAt_extraInitializers = [];
    let _priority_decorators;
    let _priority_initializers = [];
    let _priority_extraInitializers = [];
    let _category_decorators;
    let _category_initializers = [];
    let _category_extraInitializers = [];
    return _a = class NoteSummaryDto {
            constructor() {
                this.id = __runInitializers(this, _id_initializers, void 0);
                this.patientName = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _patientName_initializers, void 0));
                this.title = (__runInitializers(this, _patientName_extraInitializers), __runInitializers(this, _title_initializers, void 0));
                this.preview = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _preview_initializers, void 0));
                this.authorName = (__runInitializers(this, _preview_extraInitializers), __runInitializers(this, _authorName_initializers, void 0));
                this.createdAt = (__runInitializers(this, _authorName_extraInitializers), __runInitializers(this, _createdAt_initializers, void 0));
                this.priority = (__runInitializers(this, _createdAt_extraInitializers), __runInitializers(this, _priority_initializers, void 0));
                this.category = (__runInitializers(this, _priority_extraInitializers), __runInitializers(this, _category_initializers, void 0));
                __runInitializers(this, _category_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _id_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Unique note identifier',
                    example: 'note_987654321'
                })];
            _patientName_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Associated patient name',
                    example: 'John Doe'
                })];
            _title_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Note title or subject',
                    example: 'Progress Update - Week 4'
                })];
            _preview_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Note content preview (first 100 characters)',
                    example: 'Patient shows significant improvement in anxiety management techniques...'
                })];
            _authorName_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Author of the note',
                    example: 'Dr. Sarah Johnson'
                })];
            _createdAt_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Note creation date',
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-30T14:30:00Z'
                })];
            _priority_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Note priority level',
                    enum: ['low', 'normal', 'high', 'urgent'],
                    example: 'normal'
                })];
            _category_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Note category or type',
                    example: 'progress_note'
                })];
            __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
            __esDecorate(null, null, _patientName_decorators, { kind: "field", name: "patientName", static: false, private: false, access: { has: obj => "patientName" in obj, get: obj => obj.patientName, set: (obj, value) => { obj.patientName = value; } }, metadata: _metadata }, _patientName_initializers, _patientName_extraInitializers);
            __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
            __esDecorate(null, null, _preview_decorators, { kind: "field", name: "preview", static: false, private: false, access: { has: obj => "preview" in obj, get: obj => obj.preview, set: (obj, value) => { obj.preview = value; } }, metadata: _metadata }, _preview_initializers, _preview_extraInitializers);
            __esDecorate(null, null, _authorName_decorators, { kind: "field", name: "authorName", static: false, private: false, access: { has: obj => "authorName" in obj, get: obj => obj.authorName, set: (obj, value) => { obj.authorName = value; } }, metadata: _metadata }, _authorName_initializers, _authorName_extraInitializers);
            __esDecorate(null, null, _createdAt_decorators, { kind: "field", name: "createdAt", static: false, private: false, access: { has: obj => "createdAt" in obj, get: obj => obj.createdAt, set: (obj, value) => { obj.createdAt = value; } }, metadata: _metadata }, _createdAt_initializers, _createdAt_extraInitializers);
            __esDecorate(null, null, _priority_decorators, { kind: "field", name: "priority", static: false, private: false, access: { has: obj => "priority" in obj, get: obj => obj.priority, set: (obj, value) => { obj.priority = value; } }, metadata: _metadata }, _priority_initializers, _priority_extraInitializers);
            __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: obj => "category" in obj, get: obj => obj.category, set: (obj, value) => { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.NoteSummaryDto = NoteSummaryDto;
let DashboardStatsDto = (() => {
    var _a;
    let _totalPatients_decorators;
    let _totalPatients_initializers = [];
    let _totalPatients_extraInitializers = [];
    let _appointmentsToday_decorators;
    let _appointmentsToday_initializers = [];
    let _appointmentsToday_extraInitializers = [];
    let _appointmentsThisWeek_decorators;
    let _appointmentsThisWeek_initializers = [];
    let _appointmentsThisWeek_extraInitializers = [];
    let _completedSessionsThisMonth_decorators;
    let _completedSessionsThisMonth_initializers = [];
    let _completedSessionsThisMonth_extraInitializers = [];
    let _averageRating_decorators;
    let _averageRating_initializers = [];
    let _averageRating_extraInitializers = [];
    let _satisfactionScore_decorators;
    let _satisfactionScore_initializers = [];
    let _satisfactionScore_extraInitializers = [];
    let _newPatientsThisMonth_decorators;
    let _newPatientsThisMonth_initializers = [];
    let _newPatientsThisMonth_extraInitializers = [];
    let _monthlyRevenue_decorators;
    let _monthlyRevenue_initializers = [];
    let _monthlyRevenue_extraInitializers = [];
    let _pendingAppointments_decorators;
    let _pendingAppointments_initializers = [];
    let _pendingAppointments_extraInitializers = [];
    let _overdueTasks_decorators;
    let _overdueTasks_initializers = [];
    let _overdueTasks_extraInitializers = [];
    return _a = class DashboardStatsDto {
            constructor() {
                this.totalPatients = __runInitializers(this, _totalPatients_initializers, void 0);
                this.appointmentsToday = (__runInitializers(this, _totalPatients_extraInitializers), __runInitializers(this, _appointmentsToday_initializers, void 0));
                this.appointmentsThisWeek = (__runInitializers(this, _appointmentsToday_extraInitializers), __runInitializers(this, _appointmentsThisWeek_initializers, void 0));
                this.completedSessionsThisMonth = (__runInitializers(this, _appointmentsThisWeek_extraInitializers), __runInitializers(this, _completedSessionsThisMonth_initializers, void 0));
                this.averageRating = (__runInitializers(this, _completedSessionsThisMonth_extraInitializers), __runInitializers(this, _averageRating_initializers, void 0));
                this.satisfactionScore = (__runInitializers(this, _averageRating_extraInitializers), __runInitializers(this, _satisfactionScore_initializers, void 0));
                this.newPatientsThisMonth = (__runInitializers(this, _satisfactionScore_extraInitializers), __runInitializers(this, _newPatientsThisMonth_initializers, void 0));
                this.monthlyRevenue = (__runInitializers(this, _newPatientsThisMonth_extraInitializers), __runInitializers(this, _monthlyRevenue_initializers, void 0));
                this.pendingAppointments = (__runInitializers(this, _monthlyRevenue_extraInitializers), __runInitializers(this, _pendingAppointments_initializers, void 0));
                this.overdueTasks = (__runInitializers(this, _pendingAppointments_extraInitializers), __runInitializers(this, _overdueTasks_initializers, void 0));
                __runInitializers(this, _overdueTasks_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _totalPatients_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Total number of active patients',
                    example: 152
                })];
            _appointmentsToday_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Number of appointments today',
                    example: 8
                })];
            _appointmentsThisWeek_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Number of appointments this week',
                    example: 35
                })];
            _completedSessionsThisMonth_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Number of completed sessions this month',
                    example: 127
                })];
            _averageRating_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Average session rating (1-5 scale)',
                    example: 4.6
                })];
            _satisfactionScore_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Patient satisfaction score (0-100)',
                    example: 92
                })];
            _newPatientsThisMonth_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Number of new patients this month',
                    example: 12
                })];
            _monthlyRevenue_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Revenue for the current month',
                    example: 25650.00
                })];
            _pendingAppointments_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Pending appointments requiring attention',
                    example: 3
                })];
            _overdueTasks_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Overdue tasks or follow-ups',
                    example: 2
                })];
            __esDecorate(null, null, _totalPatients_decorators, { kind: "field", name: "totalPatients", static: false, private: false, access: { has: obj => "totalPatients" in obj, get: obj => obj.totalPatients, set: (obj, value) => { obj.totalPatients = value; } }, metadata: _metadata }, _totalPatients_initializers, _totalPatients_extraInitializers);
            __esDecorate(null, null, _appointmentsToday_decorators, { kind: "field", name: "appointmentsToday", static: false, private: false, access: { has: obj => "appointmentsToday" in obj, get: obj => obj.appointmentsToday, set: (obj, value) => { obj.appointmentsToday = value; } }, metadata: _metadata }, _appointmentsToday_initializers, _appointmentsToday_extraInitializers);
            __esDecorate(null, null, _appointmentsThisWeek_decorators, { kind: "field", name: "appointmentsThisWeek", static: false, private: false, access: { has: obj => "appointmentsThisWeek" in obj, get: obj => obj.appointmentsThisWeek, set: (obj, value) => { obj.appointmentsThisWeek = value; } }, metadata: _metadata }, _appointmentsThisWeek_initializers, _appointmentsThisWeek_extraInitializers);
            __esDecorate(null, null, _completedSessionsThisMonth_decorators, { kind: "field", name: "completedSessionsThisMonth", static: false, private: false, access: { has: obj => "completedSessionsThisMonth" in obj, get: obj => obj.completedSessionsThisMonth, set: (obj, value) => { obj.completedSessionsThisMonth = value; } }, metadata: _metadata }, _completedSessionsThisMonth_initializers, _completedSessionsThisMonth_extraInitializers);
            __esDecorate(null, null, _averageRating_decorators, { kind: "field", name: "averageRating", static: false, private: false, access: { has: obj => "averageRating" in obj, get: obj => obj.averageRating, set: (obj, value) => { obj.averageRating = value; } }, metadata: _metadata }, _averageRating_initializers, _averageRating_extraInitializers);
            __esDecorate(null, null, _satisfactionScore_decorators, { kind: "field", name: "satisfactionScore", static: false, private: false, access: { has: obj => "satisfactionScore" in obj, get: obj => obj.satisfactionScore, set: (obj, value) => { obj.satisfactionScore = value; } }, metadata: _metadata }, _satisfactionScore_initializers, _satisfactionScore_extraInitializers);
            __esDecorate(null, null, _newPatientsThisMonth_decorators, { kind: "field", name: "newPatientsThisMonth", static: false, private: false, access: { has: obj => "newPatientsThisMonth" in obj, get: obj => obj.newPatientsThisMonth, set: (obj, value) => { obj.newPatientsThisMonth = value; } }, metadata: _metadata }, _newPatientsThisMonth_initializers, _newPatientsThisMonth_extraInitializers);
            __esDecorate(null, null, _monthlyRevenue_decorators, { kind: "field", name: "monthlyRevenue", static: false, private: false, access: { has: obj => "monthlyRevenue" in obj, get: obj => obj.monthlyRevenue, set: (obj, value) => { obj.monthlyRevenue = value; } }, metadata: _metadata }, _monthlyRevenue_initializers, _monthlyRevenue_extraInitializers);
            __esDecorate(null, null, _pendingAppointments_decorators, { kind: "field", name: "pendingAppointments", static: false, private: false, access: { has: obj => "pendingAppointments" in obj, get: obj => obj.pendingAppointments, set: (obj, value) => { obj.pendingAppointments = value; } }, metadata: _metadata }, _pendingAppointments_initializers, _pendingAppointments_extraInitializers);
            __esDecorate(null, null, _overdueTasks_decorators, { kind: "field", name: "overdueTasks", static: false, private: false, access: { has: obj => "overdueTasks" in obj, get: obj => obj.overdueTasks, set: (obj, value) => { obj.overdueTasks = value; } }, metadata: _metadata }, _overdueTasks_initializers, _overdueTasks_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.DashboardStatsDto = DashboardStatsDto;
let DashboardAnalyticsDto = (() => {
    var _a;
    let _patientGrowth_decorators;
    let _patientGrowth_initializers = [];
    let _patientGrowth_extraInitializers = [];
    let _sessionCompletionRates_decorators;
    let _sessionCompletionRates_initializers = [];
    let _sessionCompletionRates_extraInitializers = [];
    let _revenueTrends_decorators;
    let _revenueTrends_initializers = [];
    let _revenueTrends_extraInitializers = [];
    let _popularAppointmentTypes_decorators;
    let _popularAppointmentTypes_initializers = [];
    let _popularAppointmentTypes_extraInitializers = [];
    return _a = class DashboardAnalyticsDto {
            constructor() {
                this.patientGrowth = __runInitializers(this, _patientGrowth_initializers, void 0);
                this.sessionCompletionRates = (__runInitializers(this, _patientGrowth_extraInitializers), __runInitializers(this, _sessionCompletionRates_initializers, void 0));
                this.revenueTrends = (__runInitializers(this, _sessionCompletionRates_extraInitializers), __runInitializers(this, _revenueTrends_initializers, void 0));
                this.popularAppointmentTypes = (__runInitializers(this, _revenueTrends_extraInitializers), __runInitializers(this, _popularAppointmentTypes_initializers, void 0));
                __runInitializers(this, _popularAppointmentTypes_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _patientGrowth_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Patient growth trend over time',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            date: { type: 'string', format: 'date' },
                            count: { type: 'number' }
                        }
                    }
                })];
            _sessionCompletionRates_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Session completion rates by week',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            week: { type: 'string' },
                            completed: { type: 'number' },
                            total: { type: 'number' },
                            rate: { type: 'number' }
                        }
                    }
                })];
            _revenueTrends_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Revenue trends by period',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            period: { type: 'string' },
                            revenue: { type: 'number' },
                            growth: { type: 'number' }
                        }
                    }
                })];
            _popularAppointmentTypes_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Most popular appointment types',
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            type: { type: 'string' },
                            count: { type: 'number' },
                            percentage: { type: 'number' }
                        }
                    }
                })];
            __esDecorate(null, null, _patientGrowth_decorators, { kind: "field", name: "patientGrowth", static: false, private: false, access: { has: obj => "patientGrowth" in obj, get: obj => obj.patientGrowth, set: (obj, value) => { obj.patientGrowth = value; } }, metadata: _metadata }, _patientGrowth_initializers, _patientGrowth_extraInitializers);
            __esDecorate(null, null, _sessionCompletionRates_decorators, { kind: "field", name: "sessionCompletionRates", static: false, private: false, access: { has: obj => "sessionCompletionRates" in obj, get: obj => obj.sessionCompletionRates, set: (obj, value) => { obj.sessionCompletionRates = value; } }, metadata: _metadata }, _sessionCompletionRates_initializers, _sessionCompletionRates_extraInitializers);
            __esDecorate(null, null, _revenueTrends_decorators, { kind: "field", name: "revenueTrends", static: false, private: false, access: { has: obj => "revenueTrends" in obj, get: obj => obj.revenueTrends, set: (obj, value) => { obj.revenueTrends = value; } }, metadata: _metadata }, _revenueTrends_initializers, _revenueTrends_extraInitializers);
            __esDecorate(null, null, _popularAppointmentTypes_decorators, { kind: "field", name: "popularAppointmentTypes", static: false, private: false, access: { has: obj => "popularAppointmentTypes" in obj, get: obj => obj.popularAppointmentTypes, set: (obj, value) => { obj.popularAppointmentTypes = value; } }, metadata: _metadata }, _popularAppointmentTypes_initializers, _popularAppointmentTypes_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.DashboardAnalyticsDto = DashboardAnalyticsDto;
let DashboardResponseDto = (() => {
    var _a;
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _data_decorators;
    let _data_initializers = [];
    let _data_extraInitializers = [];
    let _timestamp_decorators;
    let _timestamp_initializers = [];
    let _timestamp_extraInitializers = [];
    let _cacheStatus_decorators;
    let _cacheStatus_initializers = [];
    let _cacheStatus_extraInitializers = [];
    return _a = class DashboardResponseDto {
            constructor() {
                this.status = __runInitializers(this, _status_initializers, void 0);
                this.data = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _data_initializers, void 0));
                this.timestamp = (__runInitializers(this, _data_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0));
                this.cacheStatus = (__runInitializers(this, _timestamp_extraInitializers), __runInitializers(this, _cacheStatus_initializers, void 0));
                __runInitializers(this, _cacheStatus_extraInitializers);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _status_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Operation status',
                    example: 'success'
                })];
            _data_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Dashboard data',
                    type: 'object',
                    properties: {
                        appointments: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/AppointmentSummaryDto' }
                        },
                        notes: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/NoteSummaryDto' }
                        },
                        stats: { $ref: '#/components/schemas/DashboardStatsDto' },
                        analytics: { $ref: '#/components/schemas/DashboardAnalyticsDto' }
                    }
                })];
            _timestamp_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Response timestamp',
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-31T10:30:00Z'
                })];
            _cacheStatus_decorators = [(0, swagger_1.ApiProperty)({
                    description: 'Data cache status',
                    example: 'hit'
                })];
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _data_decorators, { kind: "field", name: "data", static: false, private: false, access: { has: obj => "data" in obj, get: obj => obj.data, set: (obj, value) => { obj.data = value; } }, metadata: _metadata }, _data_initializers, _data_extraInitializers);
            __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: obj => "timestamp" in obj, get: obj => obj.timestamp, set: (obj, value) => { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
            __esDecorate(null, null, _cacheStatus_decorators, { kind: "field", name: "cacheStatus", static: false, private: false, access: { has: obj => "cacheStatus" in obj, get: obj => obj.cacheStatus, set: (obj, value) => { obj.cacheStatus = value; } }, metadata: _metadata }, _cacheStatus_initializers, _cacheStatus_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.DashboardResponseDto = DashboardResponseDto;
