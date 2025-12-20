"use strict";
/**
 * ViewSwitchingService - Business logic for coach-client view switching
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
exports.ViewSwitchingService = void 0;
const common_1 = require("@nestjs/common");
let ViewSwitchingService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ViewSwitchingService = _classThis = class {
        constructor(jwtService) {
            this.jwtService = jwtService;
            this.logger = new common_1.Logger(ViewSwitchingService.name);
        }
        /**
         * Switch coach to client view
         */
        async switchToClientView(coachPayload, clientId, clientEmail) {
            try {
                // Validate coach permissions
                if (!this.jwtService.hasPermission(coachPayload, 'clients:impersonate')) {
                    throw new Error('Insufficient permissions for view switching');
                }
                // Verify client access
                const canAccess = await this.canCoachAccessClient(coachPayload.sub, clientId);
                if (!canAccess) {
                    throw new Error('No access to specified client');
                }
                // Generate impersonation token
                const tokens = this.jwtService.generateImpersonationToken(coachPayload, clientId, clientEmail);
                // Log the switch for audit
                this.logger.log(`🎭 View switch: Coach ${coachPayload.sub} → Client ${clientId}`);
                return tokens;
            }
            catch (error) {
                this.logger.error('Failed to switch to client view:', error);
                throw error;
            }
        }
        /**
         * Exit client view and return to coach view
         */
        async exitClientView(impersonationToken) {
            try {
                const tokens = await this.jwtService.exitImpersonation(impersonationToken);
                this.logger.log('🎭 Exited client view, returned to coach view');
                return tokens;
            }
            catch (error) {
                this.logger.error('Failed to exit client view:', error);
                throw error;
            }
        }
        /**
         * Check if coach can access specific client
         */
        async canCoachAccessClient(coachId, clientId) {
            try {
                // In a real implementation, this would query the database
                // to check coach-client relationships
                // Mock data for demonstration
                const coachClientRelations = await this.getCoachClientRelations(coachId);
                const hasAccess = coachClientRelations.some(relation => relation.clientId === clientId && relation.status === 'active');
                this.logger.log(`🔍 Access check: Coach ${coachId} → Client ${clientId}: ${hasAccess ? '✅' : '❌'}`);
                return hasAccess;
            }
            catch (error) {
                this.logger.error('Failed to check client access:', error);
                return false;
            }
        }
        /**
         * Get client information by ID
         */
        async getClientInfo(clientId) {
            try {
                // Mock implementation - replace with actual database query
                const mockClients = [
                    {
                        id: 'client_001',
                        name: 'Sarah Johnson',
                        email: 'sarah.johnson@example.com',
                        avatar: 'https://i.pravatar.cc/150?u=sarah',
                        lastActive: new Date('2024-01-15T10:30:00Z'),
                        status: 'active',
                        coachId: 'coach_001',
                    },
                    {
                        id: 'client_002',
                        name: 'Michael Chen',
                        email: 'michael.chen@example.com',
                        avatar: 'https://i.pravatar.cc/150?u=michael',
                        lastActive: new Date('2024-01-14T14:22:00Z'),
                        status: 'active',
                        coachId: 'coach_001',
                    },
                    {
                        id: 'client_003',
                        name: 'Emma Rodriguez',
                        email: 'emma.rodriguez@example.com',
                        avatar: 'https://i.pravatar.cc/150?u=emma',
                        lastActive: new Date('2024-01-13T09:15:00Z'),
                        status: 'active',
                        coachId: 'coach_002',
                    },
                ];
                const client = mockClients.find(c => c.id === clientId);
                if (client) {
                    this.logger.log(`📋 Retrieved client info for ${clientId}: ${client.name}`);
                }
                return client || null;
            }
            catch (error) {
                this.logger.error('Failed to get client info:', error);
                return null;
            }
        }
        /**
         * Get coach information by ID
         */
        async getCoachInfo(coachId) {
            try {
                // Mock implementation - replace with actual database query
                const mockCoachs = [
                    {
                        id: 'coach_001',
                        name: 'Dr. Jennifer Smith',
                        email: 'jennifer.smith@clinic.com',
                        specialization: 'Cognitive Behavioral Therapy',
                        avatar: 'https://i.pravatar.cc/150?u=jennifer',
                    },
                    {
                        id: 'coach_002',
                        name: 'Dr. Robert Wilson',
                        email: 'robert.wilson@clinic.com',
                        specialization: 'Family Therapy',
                        avatar: 'https://i.pravatar.cc/150?u=robert',
                    },
                ];
                const coach = mockCoachs.find(t => t.id === coachId);
                if (coach) {
                    this.logger.log(`👨‍⚕️ Retrieved coach info for ${coachId}: ${coach.name}`);
                }
                return coach || null;
            }
            catch (error) {
                this.logger.error('Failed to get coach info:', error);
                return null;
            }
        }
        /**
         * Get all clients accessible to a coach
         */
        async getCoachClients(coachId) {
            try {
                // Mock implementation - replace with actual database query
                const allClients = await this.getAllClients();
                const coachClients = allClients.filter(client => client.coachId === coachId && client.status === 'active');
                this.logger.log(`📋 Retrieved ${coachClients.length} clients for coach ${coachId}`);
                return coachClients;
            }
            catch (error) {
                this.logger.error('Failed to get coach clients:', error);
                return [];
            }
        }
        /**
         * Get coach-client relations (for access control)
         */
        async getCoachClientRelations(coachId) {
            // Mock implementation
            const relations = [
                {
                    clientId: 'client_001',
                    status: 'active',
                    assignedAt: new Date('2024-01-01T00:00:00Z'),
                },
                {
                    clientId: 'client_002',
                    status: 'active',
                    assignedAt: new Date('2024-01-05T00:00:00Z'),
                },
            ];
            return coachId === 'coach_001' ? relations : [];
        }
        /**
         * Get all clients (helper method)
         */
        async getAllClients() {
            // Mock data - replace with actual database query
            return [
                {
                    id: 'client_001',
                    name: 'Sarah Johnson',
                    email: 'sarah.johnson@example.com',
                    avatar: 'https://i.pravatar.cc/150?u=sarah',
                    lastActive: new Date('2024-01-15T10:30:00Z'),
                    status: 'active',
                    coachId: 'coach_001',
                },
                {
                    id: 'client_002',
                    name: 'Michael Chen',
                    email: 'michael.chen@example.com',
                    avatar: 'https://i.pravatar.cc/150?u=michael',
                    lastActive: new Date('2024-01-14T14:22:00Z'),
                    status: 'active',
                    coachId: 'coach_001',
                },
                {
                    id: 'client_003',
                    name: 'Emma Rodriguez',
                    email: 'emma.rodriguez@example.com',
                    avatar: 'https://i.pravatar.cc/150?u=emma',
                    lastActive: new Date('2024-01-13T09:15:00Z'),
                    status: 'active',
                    coachId: 'coach_002',
                },
            ];
        }
        /**
         * Log impersonation activity for audit
         */
        async logImpersonationActivity(action, coachId, clientId) {
            try {
                const logEntry = {
                    timestamp: new Date(),
                    action,
                    coachId,
                    clientId,
                    source: 'view-switching-service',
                };
                // In a real implementation, this would be stored in an audit log table
                this.logger.log(`📝 Audit Log: ${JSON.stringify(logEntry)}`);
            }
            catch (error) {
                this.logger.error('Failed to log impersonation activity:', error);
            }
        }
    };
    __setFunctionName(_classThis, "ViewSwitchingService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ViewSwitchingService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ViewSwitchingService = _classThis;
})();
exports.ViewSwitchingService = ViewSwitchingService;
