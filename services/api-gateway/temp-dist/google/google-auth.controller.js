"use strict";
/**
 * GoogleAuthController - Handles Google OAuth 2.0 authentication flow
 * Manages user authorization, token exchange, and calendar access setup
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
exports.GoogleAuthController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
let GoogleAuthController = (() => {
    let _classDecorators = [(0, common_1.Controller)('api/auth/google')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _authorize_decorators;
    let _handleCallback_decorators;
    let _refreshToken_decorators;
    let _revokeAccess_decorators;
    let _validateToken_decorators;
    let _setupIntegration_decorators;
    let _getIntegrationStatus_decorators;
    var GoogleAuthController = _classThis = class {
        constructor(googleOAuthService, googleCalendarService) {
            this.googleOAuthService = (__runInitializers(this, _instanceExtraInitializers), googleOAuthService);
            this.googleCalendarService = googleCalendarService;
            this.logger = new common_1.Logger(GoogleAuthController.name);
        }
        /**
         * Initiate Google OAuth flow
         */
        async authorize(req) {
            try {
                const userId = req.user.sub;
                const state = this.googleOAuthService.generateState(userId);
                const authUrl = this.googleOAuthService.getAuthorizationUrl(state);
                this.logger.log(`🔗 Generated OAuth URL for user ${userId}`);
                return {
                    status: 'success',
                    authUrl,
                    message: 'Visit the authorization URL to grant calendar access',
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to generate authorization URL:', error);
                throw new common_1.HttpException(`Authorization URL generation failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Handle OAuth callback from Google
         */
        async handleCallback(code, state, error) {
            try {
                if (error) {
                    this.logger.error(`❌ OAuth error: ${error}`);
                    throw new common_1.HttpException(`OAuth authorization failed: ${error}`, common_1.HttpStatus.BAD_REQUEST);
                }
                if (!code) {
                    throw new common_1.HttpException('Authorization code is required', common_1.HttpStatus.BAD_REQUEST);
                }
                if (!state) {
                    throw new common_1.HttpException('State parameter is required', common_1.HttpStatus.BAD_REQUEST);
                }
                // Exchange code for tokens
                const tokens = await this.googleOAuthService.exchangeCodeForTokens(code);
                // Get user information
                const userInfo = await this.googleOAuthService.getUserInfo(tokens.access_token);
                // Get user's calendars
                const calendars = await this.googleOAuthService.getCalendarList(tokens.access_token);
                this.logger.log(`✅ OAuth completed for user ${userInfo.email}`);
                // In a real implementation, you'd:
                // 1. Verify the state parameter against the logged-in user
                // 2. Store the tokens securely in your database
                // 3. Associate the Google account with the user
                // 4. Optionally set up webhooks automatically
                return {
                    status: 'success',
                    message: 'Google Calendar access granted successfully',
                    user: {
                        id: userInfo.id,
                        email: userInfo.email,
                        name: userInfo.name,
                    },
                    calendars: calendars.map(cal => ({
                        id: cal.id,
                        summary: cal.summary,
                        description: cal.description,
                        primary: cal.primary,
                        accessRole: cal.accessRole,
                    })),
                    tokenInfo: {
                        hasAccessToken: !!tokens.access_token,
                        hasRefreshToken: !!tokens.refresh_token,
                        expiresIn: tokens.expires_in,
                        scope: tokens.scope,
                    },
                };
            }
            catch (error) {
                this.logger.error('❌ OAuth callback failed:', error);
                throw new common_1.HttpException(`OAuth callback failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Refresh access token
         */
        async refreshToken(refreshData, req) {
            try {
                if (!refreshData.refreshToken) {
                    throw new common_1.HttpException('Refresh token is required', common_1.HttpStatus.BAD_REQUEST);
                }
                const tokens = await this.googleOAuthService.refreshAccessToken(refreshData.refreshToken);
                this.logger.log(`🔄 Refreshed tokens for user ${req.user.sub}`);
                return {
                    status: 'success',
                    message: 'Tokens refreshed successfully',
                    tokenInfo: {
                        hasAccessToken: !!tokens.access_token,
                        hasRefreshToken: !!tokens.refresh_token,
                        expiresIn: tokens.expires_in,
                        scope: tokens.scope,
                    },
                };
            }
            catch (error) {
                this.logger.error('❌ Token refresh failed:', error);
                throw new common_1.HttpException(`Token refresh failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Revoke Google access
         */
        async revokeAccess(revokeData, req) {
            try {
                if (!revokeData.accessToken) {
                    throw new common_1.HttpException('Access token is required', common_1.HttpStatus.BAD_REQUEST);
                }
                await this.googleOAuthService.revokeToken(revokeData.accessToken);
                this.logger.log(`🚫 Revoked Google access for user ${req.user.sub}`);
                return {
                    status: 'success',
                    message: 'Google Calendar access revoked successfully',
                };
            }
            catch (error) {
                this.logger.error('❌ Token revocation failed:', error);
                throw new common_1.HttpException(`Token revocation failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Validate current access token
         */
        async validateToken(validateData, req) {
            try {
                if (!validateData.accessToken) {
                    throw new common_1.HttpException('Access token is required', common_1.HttpStatus.BAD_REQUEST);
                }
                const validation = await this.googleOAuthService.validateToken(validateData.accessToken);
                return {
                    status: 'success',
                    valid: validation.valid,
                    tokenInfo: validation.valid ? {
                        expiresIn: validation.expiresIn,
                        scope: validation.scope,
                        email: validation.email,
                        needsRefresh: this.googleOAuthService.needsRefresh(validation.expiresIn || 0),
                        hasCalendarAccess: this.googleOAuthService.hasCalendarScope(validation.scope || ''),
                    } : null,
                };
            }
            catch (error) {
                this.logger.error('❌ Token validation failed:', error);
                throw new common_1.HttpException(`Token validation failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Setup calendar integration (OAuth + Webhook)
         */
        async setupIntegration(setupData, req) {
            try {
                if (!setupData.accessToken) {
                    throw new common_1.HttpException('Access token is required', common_1.HttpStatus.BAD_REQUEST);
                }
                const userId = req.user.sub;
                const calendarId = setupData.calendarId || 'primary';
                // Validate token first
                const validation = await this.googleOAuthService.validateToken(setupData.accessToken);
                if (!validation.valid) {
                    throw new common_1.HttpException('Invalid or expired access token', common_1.HttpStatus.UNAUTHORIZED);
                }
                // Check calendar permissions
                if (!this.googleOAuthService.hasCalendarScope(validation.scope || '')) {
                    throw new common_1.HttpException('Calendar access not granted. Please re-authorize with calendar permissions.', common_1.HttpStatus.FORBIDDEN);
                }
                const result = {
                    status: 'success',
                    message: 'Calendar integration setup completed',
                    calendarId,
                    tokenValid: true,
                    calendarAccess: true,
                };
                // Set up webhook if requested
                if (setupData.enableWebhook !== false) {
                    try {
                        const webhookInfo = await this.googleCalendarService.setupCalendarWebhook(setupData.accessToken, calendarId, `channel_${userId}_${Date.now()}`);
                        result.webhook = {
                            enabled: true,
                            channelId: webhookInfo.id,
                            resourceId: webhookInfo.resourceId,
                            expiration: new Date(parseInt(webhookInfo.expiration)),
                        };
                        this.logger.log(`🔔 Webhook setup completed for user ${userId}, calendar ${calendarId}`);
                    }
                    catch (webhookError) {
                        this.logger.warn(`⚠️  Webhook setup failed for user ${userId}:`, webhookError.message);
                        result.webhook = {
                            enabled: false,
                            error: webhookError.message,
                        };
                    }
                }
                // Perform initial sync
                try {
                    const syncResult = await this.googleCalendarService.syncCalendarEvents(setupData.accessToken, calendarId, {
                        start: new Date(),
                        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
                    });
                    result.initialSync = {
                        success: syncResult.success,
                        eventsProcessed: syncResult.eventsProcessed,
                        appointmentsCreated: syncResult.appointmentsCreated,
                        appointmentsUpdated: syncResult.appointmentsUpdated,
                    };
                    this.logger.log(`📅 Initial sync completed for user ${userId}: ${syncResult.appointmentsCreated} created, ${syncResult.appointmentsUpdated} updated`);
                }
                catch (syncError) {
                    this.logger.warn(`⚠️  Initial sync failed for user ${userId}:`, syncError.message);
                    result.initialSync = {
                        success: false,
                        error: syncError.message,
                    };
                }
                return result;
            }
            catch (error) {
                this.logger.error('❌ Integration setup failed:', error);
                throw new common_1.HttpException(`Integration setup failed: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get integration status
         */
        async getIntegrationStatus(req) {
            try {
                const userId = req.user.sub;
                // In a real implementation, you'd:
                // 1. Check if user has valid Google tokens stored
                // 2. Check webhook status
                // 3. Get last sync information
                // 4. Return comprehensive status
                // Mock status for now
                const mockStatus = {
                    connected: false,
                    user: null,
                    calendars: [],
                    webhook: {
                        enabled: false,
                        channelId: null,
                        expiration: null,
                    },
                    lastSync: null,
                    tokenStatus: {
                        valid: false,
                        expiresIn: null,
                        needsRefresh: false,
                    },
                };
                return {
                    status: 'success',
                    integration: mockStatus,
                };
            }
            catch (error) {
                this.logger.error('❌ Failed to get integration status:', error);
                throw new common_1.HttpException(`Failed to get integration status: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "GoogleAuthController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _authorize_decorators = [(0, common_1.Get)('authorize'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _handleCallback_decorators = [(0, common_1.Get)('callback')];
        _refreshToken_decorators = [(0, common_1.Post)('refresh'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _revokeAccess_decorators = [(0, common_1.Post)('revoke'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _validateToken_decorators = [(0, common_1.Post)('validate'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _setupIntegration_decorators = [(0, common_1.Post)('setup-integration'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        _getIntegrationStatus_decorators = [(0, common_1.Get)('integration-status'), (0, common_1.UseGuards)(common_2.JwtAuthGuard), (0, common_2.RequireRoles)('coach', 'admin')];
        __esDecorate(_classThis, null, _authorize_decorators, { kind: "method", name: "authorize", static: false, private: false, access: { has: obj => "authorize" in obj, get: obj => obj.authorize }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleCallback_decorators, { kind: "method", name: "handleCallback", static: false, private: false, access: { has: obj => "handleCallback" in obj, get: obj => obj.handleCallback }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _refreshToken_decorators, { kind: "method", name: "refreshToken", static: false, private: false, access: { has: obj => "refreshToken" in obj, get: obj => obj.refreshToken }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _revokeAccess_decorators, { kind: "method", name: "revokeAccess", static: false, private: false, access: { has: obj => "revokeAccess" in obj, get: obj => obj.revokeAccess }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _validateToken_decorators, { kind: "method", name: "validateToken", static: false, private: false, access: { has: obj => "validateToken" in obj, get: obj => obj.validateToken }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _setupIntegration_decorators, { kind: "method", name: "setupIntegration", static: false, private: false, access: { has: obj => "setupIntegration" in obj, get: obj => obj.setupIntegration }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getIntegrationStatus_decorators, { kind: "method", name: "getIntegrationStatus", static: false, private: false, access: { has: obj => "getIntegrationStatus" in obj, get: obj => obj.getIntegrationStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GoogleAuthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GoogleAuthController = _classThis;
})();
exports.GoogleAuthController = GoogleAuthController;
