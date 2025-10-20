"use strict";
/**
 * GoogleWebhooksController - Handles incoming Google Calendar webhooks
 * Processes real-time calendar changes and syncs with appointment system
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
exports.GoogleWebhooksController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let GoogleWebhooksController = (() => {
    let _classDecorators = [(0, common_1.Controller)('api/webhooks/google-calendar')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _handleWebhook_decorators;
    let _setupWebhook_decorators;
    let _stopWebhook_decorators;
    let _syncCalendar_decorators;
    let _getEvents_decorators;
    let _healthCheck_decorators;
    let _verifyWebhook_decorators;
    var GoogleWebhooksController = _classThis = class {
        constructor(googleCalendarService) {
            this.googleCalendarService = (__runInitializers(this, _instanceExtraInitializers), googleCalendarService);
            this.logger = new common_1.Logger(GoogleWebhooksController.name);
        }
        /**
         * Handle Google Calendar webhook notifications
         * This endpoint receives real-time updates when calendar events change
         */
        async handleWebhook(body, headers) {
            try {
                this.logger.log('📨 Received Google Calendar webhook notification');
                // Log webhook headers for debugging
                this.logger.debug('Webhook headers:', {
                    'x-goog-channel-id': headers['x-goog-channel-id'],
                    'x-goog-channel-token': headers['x-goog-channel-token'],
                    'x-goog-channel-expiration': headers['x-goog-channel-expiration'],
                    'x-goog-resource-id': headers['x-goog-resource-id'],
                    'x-goog-resource-uri': headers['x-goog-resource-uri'],
                    'x-goog-resource-state': headers['x-goog-resource-state'],
                    'x-goog-message-number': headers['x-goog-message-number'],
                });
                // Google Calendar webhooks often have empty body, data is in headers
                const notification = {
                    kind: 'api#channel',
                    id: headers['x-goog-channel-id'] || '',
                    resourceId: headers['x-goog-resource-id'] || '',
                    resourceUri: headers['x-goog-resource-uri'] || '',
                    token: headers['x-goog-channel-token'],
                    expiration: headers['x-goog-channel-expiration'] || '',
                };
                // Skip sync notifications (initial setup)
                const resourceState = headers['x-goog-resource-state'];
                if (resourceState === 'sync') {
                    this.logger.log('📡 Received sync notification - webhook channel established');
                    return { status: 'ok', message: 'Sync notification received' };
                }
                // Process the notification
                const result = await this.googleCalendarService.processWebhookNotification(notification, headers);
                if (!result.success) {
                    this.logger.error('❌ Webhook processing failed:', result.errors);
                    throw new common_1.HttpException(`Webhook processing failed: ${result.errors.join(', ')}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                }
                this.logger.log(`✅ Webhook processed successfully: ${result.appointmentsCreated} created, ${result.appointmentsUpdated} updated`);
                return {
                    status: 'success',
                    eventsProcessed: result.eventsProcessed,
                    appointmentsCreated: result.appointmentsCreated,
                    appointmentsUpdated: result.appointmentsUpdated,
                };
            }
            catch (error) {
                this.logger.error('❌ Webhook handling failed:', error);
                throw new common_1.HttpException(`Webhook handling failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Setup webhook for a calendar (authenticated endpoint)
         */
        async setupWebhook(setupData) {
            try {
                this.logger.log(`🔧 Setting up webhook for calendar ${setupData.calendarId || 'primary'}`);
                const webhookInfo = await this.googleCalendarService.setupCalendarWebhook(setupData.accessToken, setupData.calendarId, setupData.channelId);
                return {
                    status: 'success',
                    message: 'Webhook setup completed',
                    webhook: {
                        channelId: webhookInfo.id,
                        resourceId: webhookInfo.resourceId,
                        expiration: new Date(parseInt(webhookInfo.expiration)),
                    },
                };
            }
            catch (error) {
                this.logger.error('❌ Webhook setup failed:', error);
                throw new common_1.HttpException(`Webhook setup failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Stop webhook subscription (authenticated endpoint)
         */
        async stopWebhook(stopData) {
            try {
                this.logger.log(`🛑 Stopping webhook for channel ${stopData.channelId}`);
                await this.googleCalendarService.stopCalendarWebhook(stopData.accessToken, stopData.channelId, stopData.resourceId);
                return {
                    status: 'success',
                    message: 'Webhook stopped successfully',
                };
            }
            catch (error) {
                this.logger.error('❌ Stop webhook failed:', error);
                throw new common_1.HttpException(`Stop webhook failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Manual sync calendar events (authenticated endpoint)
         */
        async syncCalendar(syncData) {
            try {
                const calendarId = syncData.calendarId || 'primary';
                // Default to sync next 30 days
                const startDate = syncData.startDate ? new Date(syncData.startDate) : new Date();
                const endDate = syncData.endDate ? new Date(syncData.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                this.logger.log(`🔄 Manual sync requested for calendar ${calendarId}`);
                const result = await this.googleCalendarService.syncCalendarEvents(syncData.accessToken, calendarId, { start: startDate, end: endDate });
                return result;
            }
            catch (error) {
                this.logger.error('❌ Manual sync failed:', error);
                throw new common_1.HttpException(`Manual sync failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get calendar events (authenticated endpoint)
         */
        async getEvents(accessToken, calendarId, timeMin, timeMax, maxResults) {
            try {
                if (!accessToken) {
                    throw new common_1.HttpException('Access token is required', common_1.HttpStatus.BAD_REQUEST);
                }
                const events = await this.googleCalendarService.getCalendarEvents(accessToken, calendarId || 'primary', timeMin ? new Date(timeMin) : undefined, timeMax ? new Date(timeMax) : undefined, maxResults ? parseInt(maxResults) : 50);
                return {
                    status: 'success',
                    events: events.map(event => ({
                        id: event.id,
                        title: event.summary,
                        description: event.description,
                        start: {
                            dateTime: event.start.dateTime,
                            timeZone: event.start.timeZone,
                        },
                        end: {
                            dateTime: event.end.dateTime,
                            timeZone: event.end.timeZone,
                        },
                        location: event.location,
                        status: event.status,
                        attendees: event.attendees,
                        conferenceData: event.conferenceData,
                        created: event.created,
                        updated: event.updated,
                    })),
                };
            }
            catch (error) {
                this.logger.error('❌ Get events failed:', error);
                throw new common_1.HttpException(`Get events failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Health check endpoint to verify webhook is accessible
         */
        async healthCheck() {
            return {
                status: 'ok',
                message: 'Google Calendar webhook endpoint is healthy',
                timestamp: new Date().toISOString(),
            };
        }
        /**
         * Webhook verification challenge (used by Google during setup)
         */
        async verifyWebhook(challenge) {
            if (challenge) {
                this.logger.log('📋 Webhook verification challenge received');
                return challenge;
            }
            return {
                status: 'ok',
                message: 'Google Calendar webhook endpoint',
            };
        }
    };
    __setFunctionName(_classThis, "GoogleWebhooksController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handleWebhook_decorators = [(0, common_1.Post)()];
        _setupWebhook_decorators = [(0, common_1.Post)('setup'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _stopWebhook_decorators = [(0, common_1.Post)('stop'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _syncCalendar_decorators = [(0, common_1.Post)('sync'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _getEvents_decorators = [(0, common_1.Get)('events'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _healthCheck_decorators = [(0, common_1.Get)('health')];
        _verifyWebhook_decorators = [(0, common_1.Get)()];
        __esDecorate(_classThis, null, _handleWebhook_decorators, { kind: "method", name: "handleWebhook", static: false, private: false, access: { has: obj => "handleWebhook" in obj, get: obj => obj.handleWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _setupWebhook_decorators, { kind: "method", name: "setupWebhook", static: false, private: false, access: { has: obj => "setupWebhook" in obj, get: obj => obj.setupWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _stopWebhook_decorators, { kind: "method", name: "stopWebhook", static: false, private: false, access: { has: obj => "stopWebhook" in obj, get: obj => obj.stopWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _syncCalendar_decorators, { kind: "method", name: "syncCalendar", static: false, private: false, access: { has: obj => "syncCalendar" in obj, get: obj => obj.syncCalendar }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getEvents_decorators, { kind: "method", name: "getEvents", static: false, private: false, access: { has: obj => "getEvents" in obj, get: obj => obj.getEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _healthCheck_decorators, { kind: "method", name: "healthCheck", static: false, private: false, access: { has: obj => "healthCheck" in obj, get: obj => obj.healthCheck }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _verifyWebhook_decorators, { kind: "method", name: "verifyWebhook", static: false, private: false, access: { has: obj => "verifyWebhook" in obj, get: obj => obj.verifyWebhook }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GoogleWebhooksController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GoogleWebhooksController = _classThis;
})();
exports.GoogleWebhooksController = GoogleWebhooksController;
