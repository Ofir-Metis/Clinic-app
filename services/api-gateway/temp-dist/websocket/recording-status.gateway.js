"use strict";
/**
 * RecordingStatusGateway - WebSocket gateway for real-time coaching session recording status
 * Provides real-time updates for recording start/stop/pause events and status changes
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
exports.RecordingStatusGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const common_2 = require("@clinic/common");
const common_3 = require("@nestjs/common");
let RecordingStatusGateway = (() => {
    let _classDecorators = [(0, common_1.Injectable)(), (0, common_3.UseInterceptors)(common_2.LoggingInterceptor), (0, common_1.UseGuards)(common_2.WebSocketJwtGuard), (0, websockets_1.WebSocketGateway)({
            cors: {
                origin: process.env.FRONTEND_ORIGIN || '*',
                credentials: true,
            },
            namespace: '/recording-status',
            transports: ['websocket', 'polling'],
        })];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _server_decorators;
    let _server_initializers = [];
    let _server_extraInitializers = [];
    let _handleJoinSession_decorators;
    let _handleLeaveSession_decorators;
    let _handleRecordingStatusUpdate_decorators;
    let _handleGetSessionStatus_decorators;
    var RecordingStatusGateway = _classThis = class {
        constructor(jwtService) {
            this.jwtService = (__runInitializers(this, _instanceExtraInitializers), jwtService);
            this.server = __runInitializers(this, _server_initializers, void 0);
            this.logger = (__runInitializers(this, _server_extraInitializers), new common_1.Logger(RecordingStatusGateway.name));
            this.sessions = new Map(); // sessionId -> participants
            this.userSockets = new Map(); // userId -> socketId
            this.socketUsers = new Map(); // socketId -> participant
        }
        afterInit(server) {
            this.logger.log('RecordingStatusGateway initialized');
        }
        async handleConnection(client) {
            this.logger.log(`Client connected: ${client.id}`);
            try {
                // Extract auth token from handshake
                const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
                if (!token) {
                    this.logger.warn(`Connection rejected: No auth token provided for ${client.id}`);
                    client.disconnect();
                    return;
                }
                // TODO: Validate JWT token and extract user info
                // For now, we'll mock this - in production, validate the JWT
                const userInfo = this.extractUserFromToken(token);
                if (!userInfo) {
                    this.logger.warn(`Connection rejected: Invalid token for ${client.id}`);
                    client.disconnect();
                    return;
                }
                // Store socket mapping
                this.userSockets.set(userInfo.userId, client.id);
                this.logger.log(`User ${userInfo.userId} (${userInfo.role}) connected with socket ${client.id}`);
            }
            catch (error) {
                this.logger.error(`Connection error for ${client.id}:`, error);
                client.disconnect();
            }
        }
        handleDisconnect(client) {
            this.logger.log(`Client disconnected: ${client.id}`);
            const participant = this.socketUsers.get(client.id);
            if (participant) {
                // Remove from session
                const sessionParticipants = this.sessions.get(participant.sessionId);
                if (sessionParticipants) {
                    sessionParticipants.delete(participant);
                    if (sessionParticipants.size === 0) {
                        this.sessions.delete(participant.sessionId);
                    }
                }
                // Remove from mappings
                this.userSockets.delete(participant.userId);
                this.socketUsers.delete(client.id);
                // Notify other participants
                this.notifySessionParticipants(participant.sessionId, 'participant_left', {
                    userId: participant.userId,
                    role: participant.role,
                }, client.id);
                this.logger.log(`User ${participant.userId} left session ${participant.sessionId}`);
            }
        }
        async handleJoinSession(data, client) {
            try {
                const { sessionId, userId, role } = data;
                // Validate session access (in production, check permissions)
                if (!sessionId || !userId || !role) {
                    client.emit('error', { message: 'Invalid session data' });
                    return;
                }
                const participant = {
                    userId,
                    role,
                    sessionId,
                    socketId: client.id,
                    joinedAt: new Date(),
                };
                // Add to session
                if (!this.sessions.has(sessionId)) {
                    this.sessions.set(sessionId, new Set());
                }
                this.sessions.get(sessionId).add(participant);
                // Update mappings
                this.socketUsers.set(client.id, participant);
                this.userSockets.set(userId, client.id);
                // Join socket room for this session
                await client.join(`session_${sessionId}`);
                // Notify participant of successful join
                client.emit('session_joined', {
                    sessionId,
                    participantCount: this.sessions.get(sessionId).size,
                    participants: Array.from(this.sessions.get(sessionId)).map(p => ({
                        userId: p.userId,
                        role: p.role,
                        joinedAt: p.joinedAt,
                    })),
                });
                // Notify other participants
                this.notifySessionParticipants(sessionId, 'participant_joined', {
                    userId,
                    role,
                    joinedAt: participant.joinedAt,
                }, client.id);
                this.logger.log(`User ${userId} (${role}) joined session ${sessionId}`);
            }
            catch (error) {
                this.logger.error('Error joining session:', error);
                client.emit('error', { message: 'Failed to join session' });
            }
        }
        async handleLeaveSession(data, client) {
            try {
                const participant = this.socketUsers.get(client.id);
                if (!participant) {
                    client.emit('error', { message: 'Not in any session' });
                    return;
                }
                await client.leave(`session_${participant.sessionId}`);
                // Remove from session
                const sessionParticipants = this.sessions.get(participant.sessionId);
                if (sessionParticipants) {
                    sessionParticipants.delete(participant);
                    if (sessionParticipants.size === 0) {
                        this.sessions.delete(participant.sessionId);
                    }
                }
                // Remove from mappings
                this.socketUsers.delete(client.id);
                // Notify other participants
                this.notifySessionParticipants(participant.sessionId, 'participant_left', {
                    userId: participant.userId,
                    role: participant.role,
                }, client.id);
                client.emit('session_left', { sessionId: participant.sessionId });
                this.logger.log(`User ${participant.userId} left session ${participant.sessionId}`);
            }
            catch (error) {
                this.logger.error('Error leaving session:', error);
                client.emit('error', { message: 'Failed to leave session' });
            }
        }
        async handleRecordingStatusUpdate(event, client) {
            try {
                const participant = this.socketUsers.get(client.id);
                if (!participant) {
                    client.emit('error', { message: 'Not in any session' });
                    return;
                }
                // Validate that user can send recording updates (typically only coaches)
                if (participant.role !== 'coach') {
                    client.emit('error', { message: 'Only coaches can send recording updates' });
                    return;
                }
                // Add metadata
                const enrichedEvent = {
                    ...event,
                    timestamp: new Date(),
                };
                // Set coach/client IDs based on participant role
                if (participant.role === 'coach') {
                    enrichedEvent.coachId = participant.userId;
                }
                else {
                    enrichedEvent.clientId = participant.userId;
                }
                // Broadcast to all session participants
                this.notifySessionParticipants(participant.sessionId, 'recording_status_updated', enrichedEvent);
                // Log the event
                this.logger.log(`Recording status update: ${event.type} for session ${participant.sessionId}`);
                // Store recording event for audit (in production, save to database)
                await this.storeRecordingEvent(enrichedEvent);
            }
            catch (error) {
                this.logger.error('Error handling recording status update:', error);
                client.emit('error', { message: 'Failed to update recording status' });
            }
        }
        async handleGetSessionStatus(data, client) {
            try {
                const sessionParticipants = this.sessions.get(data.sessionId);
                if (!sessionParticipants) {
                    client.emit('session_status', {
                        sessionId: data.sessionId,
                        isActive: false,
                        participantCount: 0,
                        participants: [],
                    });
                    return;
                }
                const participants = Array.from(sessionParticipants).map(p => ({
                    userId: p.userId,
                    role: p.role,
                    joinedAt: p.joinedAt,
                }));
                client.emit('session_status', {
                    sessionId: data.sessionId,
                    isActive: true,
                    participantCount: sessionParticipants.size,
                    participants,
                });
            }
            catch (error) {
                this.logger.error('Error getting session status:', error);
                client.emit('error', { message: 'Failed to get session status' });
            }
        }
        // Public methods for external services to send updates
        async broadcastRecordingEvent(event) {
            try {
                // Broadcast to specific session
                this.server.to(`session_${event.sessionId}`).emit('recording_status_updated', event);
                // Store the event
                await this.storeRecordingEvent(event);
                this.logger.log(`Broadcasted recording event: ${event.type} for session ${event.sessionId}`);
            }
            catch (error) {
                this.logger.error('Error broadcasting recording event:', error);
            }
        }
        async notifySessionParticipants(sessionId, eventType, data, excludeSocketId) {
            try {
                const room = `session_${sessionId}`;
                if (excludeSocketId) {
                    this.server.to(room).except(excludeSocketId).emit(eventType, {
                        sessionId,
                        timestamp: new Date(),
                        ...data,
                    });
                }
                else {
                    this.server.to(room).emit(eventType, {
                        sessionId,
                        timestamp: new Date(),
                        ...data,
                    });
                }
            }
            catch (error) {
                this.logger.error('Error notifying session participants:', error);
            }
        }
        getSessionParticipants(sessionId) {
            const participants = this.sessions.get(sessionId);
            return participants ? Array.from(participants) : [];
        }
        getActiveSessionsCount() {
            return this.sessions.size;
        }
        getConnectedUsersCount() {
            return this.userSockets.size;
        }
        // Private helper methods
        extractUserFromToken(token) {
            try {
                // Use JWT service for proper token validation
                const validationResult = this.jwtService.validateToken(token);
                if (!validationResult.valid || !validationResult.payload) {
                    this.logger.warn('Invalid token provided to WebSocket connection');
                    return null;
                }
                const payload = validationResult.payload;
                return {
                    userId: payload.sub,
                    role: payload.role,
                };
            }
            catch (error) {
                this.logger.error('Error extracting user from token:', error);
                return null;
            }
        }
        async storeRecordingEvent(event) {
            try {
                // TODO: In production, store events in database for audit trail
                // For now, just log the event
                this.logger.debug('Recording event stored:', {
                    type: event.type,
                    sessionId: event.sessionId,
                    timestamp: event.timestamp,
                    recordingId: event.recordingId,
                });
                // Example of what you might store:
                // await this.recordingEventsRepository.save({
                //   type: event.type,
                //   sessionId: event.sessionId,
                //   participantId: event.participantId,
                //   coachId: event.coachId,
                //   clientId: event.clientId,
                //   recordingId: event.recordingId,
                //   timestamp: event.timestamp,
                //   data: event.data,
                // });
            }
            catch (error) {
                this.logger.error('Error storing recording event:', error);
            }
        }
    };
    __setFunctionName(_classThis, "RecordingStatusGateway");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _server_decorators = [(0, websockets_1.WebSocketServer)()];
        _handleJoinSession_decorators = [(0, websockets_1.SubscribeMessage)('join_session')];
        _handleLeaveSession_decorators = [(0, websockets_1.SubscribeMessage)('leave_session')];
        _handleRecordingStatusUpdate_decorators = [(0, websockets_1.SubscribeMessage)('recording_status_update')];
        _handleGetSessionStatus_decorators = [(0, websockets_1.SubscribeMessage)('get_session_status')];
        __esDecorate(_classThis, null, _handleJoinSession_decorators, { kind: "method", name: "handleJoinSession", static: false, private: false, access: { has: obj => "handleJoinSession" in obj, get: obj => obj.handleJoinSession }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleLeaveSession_decorators, { kind: "method", name: "handleLeaveSession", static: false, private: false, access: { has: obj => "handleLeaveSession" in obj, get: obj => obj.handleLeaveSession }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleRecordingStatusUpdate_decorators, { kind: "method", name: "handleRecordingStatusUpdate", static: false, private: false, access: { has: obj => "handleRecordingStatusUpdate" in obj, get: obj => obj.handleRecordingStatusUpdate }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _handleGetSessionStatus_decorators, { kind: "method", name: "handleGetSessionStatus", static: false, private: false, access: { has: obj => "handleGetSessionStatus" in obj, get: obj => obj.handleGetSessionStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, null, _server_decorators, { kind: "field", name: "server", static: false, private: false, access: { has: obj => "server" in obj, get: obj => obj.server, set: (obj, value) => { obj.server = value; } }, metadata: _metadata }, _server_initializers, _server_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RecordingStatusGateway = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RecordingStatusGateway = _classThis;
})();
exports.RecordingStatusGateway = RecordingStatusGateway;
