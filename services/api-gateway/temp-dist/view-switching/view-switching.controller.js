"use strict";
/**
 * ViewSwitchingController - API endpoints for coach-client view switching
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
exports.ViewSwitchingController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
const common_3 = require("@clinic/common");
let ViewSwitchingController = (() => {
    let _classDecorators = [(0, common_1.Controller)('view-switching'), (0, common_1.UseGuards)(common_2.JwtAuthGuard, common_3.ViewSwitchingGuard)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _switchToClient_decorators;
    let _exitImpersonation_decorators;
    let _getCurrentStatus_decorators;
    let _getAccessibleClients_decorators;
    let _getClientInfo_decorators;
    var ViewSwitchingController = _classThis = class {
        constructor(viewSwitchingService) {
            this.viewSwitchingService = (__runInitializers(this, _instanceExtraInitializers), viewSwitchingService);
            this.logger = new common_1.Logger(ViewSwitchingController.name);
        }
        /**
         * Switch to client view
         */
        async switchToClient(body, req) {
            try {
                const coachPayload = req.user;
                const { clientId } = body;
                if (!clientId) {
                    throw new common_1.HttpException('Client ID is required', common_1.HttpStatus.BAD_REQUEST);
                }
                // Verify coach can access this client
                const canAccess = await this.viewSwitchingService.canCoachAccessClient(coachPayload.sub, clientId);
                if (!canAccess) {
                    throw new common_1.HttpException('You do not have access to this client', common_1.HttpStatus.FORBIDDEN);
                }
                // Get client information
                const clientInfo = await this.viewSwitchingService.getClientInfo(clientId);
                if (!clientInfo) {
                    throw new common_1.HttpException('Client not found', common_1.HttpStatus.NOT_FOUND);
                }
                // Generate impersonation token
                const tokens = await this.viewSwitchingService.switchToClientView(coachPayload, clientId, clientInfo.email);
                this.logger.log(`🎭 Coach ${coachPayload.sub} switched to client view for ${clientId}`);
                return {
                    success: true,
                    tokens,
                    user: {
                        id: clientId,
                        email: clientInfo.email,
                        role: 'client',
                        isImpersonating: true,
                        originalUserId: coachPayload.sub,
                        viewingAsClientId: clientId,
                    },
                    message: `Switched to client view for ${clientInfo.name}`,
                };
            }
            catch (error) {
                this.logger.error('Failed to switch to client view:', error);
                if (error instanceof common_1.HttpException) {
                    throw error;
                }
                throw new common_1.HttpException('Failed to switch to client view', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Return to coach view
         */
        async exitImpersonation(req) {
            try {
                const currentPayload = req.user;
                if (!currentPayload.isImpersonating) {
                    throw new common_1.HttpException('Not currently in client view', common_1.HttpStatus.BAD_REQUEST);
                }
                const tokens = await this.viewSwitchingService.exitClientView(req.headers.authorization.replace('Bearer ', ''));
                // Get coach information
                const coachInfo = await this.viewSwitchingService.getCoachInfo(currentPayload.originalUserId);
                this.logger.log(`🎭 Coach ${currentPayload.originalUserId} exited client view for ${currentPayload.viewingAsClientId}`);
                return {
                    success: true,
                    tokens,
                    user: {
                        id: currentPayload.originalUserId,
                        email: coachInfo.email,
                        role: 'coach',
                        isImpersonating: false,
                    },
                    message: 'Returned to coach view',
                };
            }
            catch (error) {
                this.logger.error('Failed to exit impersonation:', error);
                if (error instanceof common_1.HttpException) {
                    throw error;
                }
                throw new common_1.HttpException('Failed to exit client view', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get current view switching status
         */
        getCurrentStatus(req) {
            const payload = req.user;
            const viewSwitching = req.viewSwitching;
            return {
                success: true,
                user: {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role,
                    isImpersonating: viewSwitching.isImpersonating,
                    originalUserId: viewSwitching.originalUserId,
                    viewingAsClientId: viewSwitching.viewingAsClientId,
                },
                message: viewSwitching.isImpersonating
                    ? `Viewing as client ${viewSwitching.viewingAsClientId}`
                    : 'In normal coach view',
            };
        }
        /**
         * Get list of clients accessible for view switching
         */
        async getAccessibleClients(req) {
            try {
                const coachPayload = req.user;
                const clients = await this.viewSwitchingService.getCoachClients(coachPayload.sub);
                return {
                    success: true,
                    clients: clients.map(client => ({
                        id: client.id,
                        name: client.name,
                        email: client.email,
                        avatar: client.avatar,
                        lastActive: client.lastActive,
                    })),
                    message: `Found ${clients.length} accessible clients`,
                };
            }
            catch (error) {
                this.logger.error('Failed to get accessible clients:', error);
                throw new common_1.HttpException('Failed to retrieve client list', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        /**
         * Get client info by ID (for coaches)
         */
        async getClientInfo(clientId, req) {
            try {
                const coachPayload = req.user;
                // Verify access
                const canAccess = await this.viewSwitchingService.canCoachAccessClient(coachPayload.sub, clientId);
                if (!canAccess) {
                    throw new common_1.HttpException('You do not have access to this client', common_1.HttpStatus.FORBIDDEN);
                }
                const clientInfo = await this.viewSwitchingService.getClientInfo(clientId);
                if (!clientInfo) {
                    throw new common_1.HttpException('Client not found', common_1.HttpStatus.NOT_FOUND);
                }
                return {
                    success: true,
                    client: clientInfo,
                    message: 'Client information retrieved',
                };
            }
            catch (error) {
                this.logger.error('Failed to get client info:', error);
                if (error instanceof common_1.HttpException) {
                    throw error;
                }
                throw new common_1.HttpException('Failed to retrieve client information', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    };
    __setFunctionName(_classThis, "ViewSwitchingController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _switchToClient_decorators = [(0, common_1.Post)('switch-to-client'), (0, common_3.ViewSwitching)({
                allowImpersonation: false,
                requireOriginalRole: 'coach',
                restrictToOwnClients: true
            })];
        _exitImpersonation_decorators = [(0, common_1.Post)('exit-impersonation'), (0, common_3.ViewSwitching)({
                allowImpersonation: true,
                requireOriginalRole: 'coach'
            })];
        _getCurrentStatus_decorators = [(0, common_1.Get)('status'), (0, common_3.ViewSwitching)({ allowImpersonation: true })];
        _getAccessibleClients_decorators = [(0, common_1.Get)('accessible-clients'), (0, common_3.ViewSwitching)({
                allowImpersonation: false,
                requireOriginalRole: 'coach'
            })];
        _getClientInfo_decorators = [(0, common_1.Get)('client/:clientId'), (0, common_3.ViewSwitching)({
                allowImpersonation: false,
                requireOriginalRole: 'coach',
                restrictToOwnClients: true
            })];
        __esDecorate(_classThis, null, _switchToClient_decorators, { kind: "method", name: "switchToClient", static: false, private: false, access: { has: obj => "switchToClient" in obj, get: obj => obj.switchToClient }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _exitImpersonation_decorators, { kind: "method", name: "exitImpersonation", static: false, private: false, access: { has: obj => "exitImpersonation" in obj, get: obj => obj.exitImpersonation }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getCurrentStatus_decorators, { kind: "method", name: "getCurrentStatus", static: false, private: false, access: { has: obj => "getCurrentStatus" in obj, get: obj => obj.getCurrentStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAccessibleClients_decorators, { kind: "method", name: "getAccessibleClients", static: false, private: false, access: { has: obj => "getAccessibleClients" in obj, get: obj => obj.getAccessibleClients }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getClientInfo_decorators, { kind: "method", name: "getClientInfo", static: false, private: false, access: { has: obj => "getClientInfo" in obj, get: obj => obj.getClientInfo }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ViewSwitchingController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ViewSwitchingController = _classThis;
})();
exports.ViewSwitchingController = ViewSwitchingController;
