"use strict";
/**
 * GoogleOAuthService - Handles Google OAuth 2.0 authentication for Calendar API access
 * Manages access tokens, refresh tokens, and user consent
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
exports.GoogleOAuthService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let GoogleOAuthService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var GoogleOAuthService = _classThis = class {
        constructor(configService, httpService) {
            this.configService = configService;
            this.httpService = httpService;
            this.logger = new common_1.Logger(GoogleOAuthService.name);
            this.scopes = [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ];
            this.clientId = this.configService.get('GOOGLE_CLIENT_ID', '');
            this.clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET', '');
            this.redirectUri = this.configService.get('GOOGLE_REDIRECT_URI', 'http://localhost:3000/auth/google/callback');
            if (!this.clientId || !this.clientSecret) {
                this.logger.warn('⚠️  Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
            }
        }
        /**
         * Generate Google OAuth authorization URL
         */
        getAuthorizationUrl(state) {
            const params = new URLSearchParams({
                client_id: this.clientId,
                redirect_uri: this.redirectUri,
                scope: this.scopes.join(' '),
                response_type: 'code',
                access_type: 'offline',
                prompt: 'consent',
            });
            if (state) {
                params.append('state', state);
            }
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
            this.logger.log('🔗 Generated Google OAuth authorization URL');
            return authUrl;
        }
        /**
         * Exchange authorization code for access tokens
         */
        async exchangeCodeForTokens(code) {
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post('https://oauth2.googleapis.com/token', {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: this.redirectUri,
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }));
                this.logger.log('🔑 Successfully exchanged authorization code for tokens');
                return response.data;
            }
            catch (error) {
                this.logger.error('❌ Failed to exchange code for tokens:', error.response?.data || error.message);
                throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
            }
        }
        /**
         * Refresh access token using refresh token
         */
        async refreshAccessToken(refreshToken) {
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post('https://oauth2.googleapis.com/token', {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token',
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }));
                this.logger.log('🔄 Successfully refreshed access token');
                // Refresh tokens might not always include a new refresh token
                const tokens = response.data;
                if (!tokens.refresh_token) {
                    tokens.refresh_token = refreshToken; // Keep the original refresh token
                }
                return tokens;
            }
            catch (error) {
                this.logger.error('❌ Failed to refresh access token:', error.response?.data || error.message);
                throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
            }
        }
        /**
         * Revoke access token
         */
        async revokeToken(token) {
            try {
                await (0, rxjs_1.firstValueFrom)(this.httpService.post(`https://oauth2.googleapis.com/revoke?token=${token}`, {}, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }));
                this.logger.log('🚫 Successfully revoked access token');
            }
            catch (error) {
                this.logger.error('❌ Failed to revoke token:', error.response?.data || error.message);
                throw new Error(`Token revocation failed: ${error.response?.data?.error_description || error.message}`);
            }
        }
        /**
         * Get user information using access token
         */
        async getUserInfo(accessToken) {
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }));
                this.logger.log(`👤 Retrieved user info for ${response.data.email}`);
                return response.data;
            }
            catch (error) {
                this.logger.error('❌ Failed to get user info:', error.response?.data || error.message);
                throw new Error(`Get user info failed: ${error.response?.data?.error?.message || error.message}`);
            }
        }
        /**
         * Validate access token
         */
        async validateToken(accessToken) {
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`));
                const tokenInfo = response.data;
                return {
                    valid: true,
                    expiresIn: parseInt(tokenInfo.expires_in),
                    scope: tokenInfo.scope,
                    email: tokenInfo.email,
                };
            }
            catch (error) {
                this.logger.warn('🔍 Token validation failed:', error.response?.data || error.message);
                return { valid: false };
            }
        }
        /**
         * Check if token needs refresh (expires within 5 minutes)
         */
        needsRefresh(expiresIn) {
            return expiresIn < 300; // 5 minutes
        }
        /**
         * Get calendar list for authenticated user
         */
        async getCalendarList(accessToken) {
            try {
                const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }));
                this.logger.log(`📅 Retrieved ${response.data.items?.length || 0} calendars`);
                return response.data.items || [];
            }
            catch (error) {
                this.logger.error('❌ Failed to get calendar list:', error.response?.data || error.message);
                throw new Error(`Get calendar list failed: ${error.response?.data?.error?.message || error.message}`);
            }
        }
        /**
         * Generate state parameter for OAuth flow (to prevent CSRF)
         */
        generateState(userId) {
            const timestamp = Date.now().toString();
            const random = Math.random().toString(36).substring(7);
            return Buffer.from(`${userId}:${timestamp}:${random}`).toString('base64');
        }
        /**
         * Verify state parameter from OAuth callback
         */
        verifyState(state, expectedUserId) {
            try {
                const decoded = Buffer.from(state, 'base64').toString();
                const [userId, timestamp, random] = decoded.split(':');
                // Check if user ID matches
                if (userId !== expectedUserId) {
                    return false;
                }
                // Check if state is not too old (within 10 minutes)
                const stateAge = Date.now() - parseInt(timestamp);
                if (stateAge > 10 * 60 * 1000) {
                    return false;
                }
                return true;
            }
            catch (error) {
                this.logger.error('❌ State verification failed:', error);
                return false;
            }
        }
        /**
         * Check if current scopes include calendar access
         */
        hasCalendarScope(scope) {
            const requiredScopes = [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events',
            ];
            return requiredScopes.some(requiredScope => scope.includes(requiredScope));
        }
    };
    __setFunctionName(_classThis, "GoogleOAuthService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GoogleOAuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GoogleOAuthService = _classThis;
})();
exports.GoogleOAuthService = GoogleOAuthService;
