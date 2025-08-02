/**
 * RecordingStatusGateway - WebSocket gateway for real-time coaching session recording status
 * Provides real-time updates for recording start/stop/pause events and status changes
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LoggingInterceptor, WebSocketJwtGuard, JwtService, JwtPayload } from '@clinic/common';
import { UseInterceptors } from '@nestjs/common';

export interface RecordingStatusEvent {
  type: 'recording_started' | 'recording_stopped' | 'recording_paused' | 'recording_resumed' | 'recording_error' | 'chunk_ready' | 'upload_progress';
  sessionId: string;
  participantId: string;
  coachId?: string;
  clientId?: string;
  recordingId?: string;
  timestamp: Date;
  data?: {
    duration?: number;
    fileSize?: number;
    chunkCount?: number;
    uploadProgress?: number;
    error?: string;
    metadata?: any;
  };
}

export interface SessionParticipant {
  userId: string;
  role: 'coach' | 'client';
  sessionId: string;
  socketId: string;
  joinedAt: Date;
}

@Injectable()
@UseInterceptors(LoggingInterceptor)
@UseGuards(WebSocketJwtGuard)
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/recording-status',
  transports: ['websocket', 'polling'],
})
export class RecordingStatusGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RecordingStatusGateway.name);
  private readonly sessions = new Map<string, Set<SessionParticipant>>(); // sessionId -> participants
  private readonly userSockets = new Map<string, string>(); // userId -> socketId
  private readonly socketUsers = new Map<string, SessionParticipant>(); // socketId -> participant

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('RecordingStatusGateway initialized');
  }

  async handleConnection(client: Socket) {
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

    } catch (error) {
      this.logger.error(`Connection error for ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
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

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @MessageBody() data: { sessionId: string; userId: string; role: 'coach' | 'client' },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { sessionId, userId, role } = data;

      // Validate session access (in production, check permissions)
      if (!sessionId || !userId || !role) {
        client.emit('error', { message: 'Invalid session data' });
        return;
      }

      const participant: SessionParticipant = {
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
      this.sessions.get(sessionId)!.add(participant);

      // Update mappings
      this.socketUsers.set(client.id, participant);
      this.userSockets.set(userId, client.id);

      // Join socket room for this session
      await client.join(`session_${sessionId}`);

      // Notify participant of successful join
      client.emit('session_joined', {
        sessionId,
        participantCount: this.sessions.get(sessionId)!.size,
        participants: Array.from(this.sessions.get(sessionId)!).map(p => ({
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
    } catch (error) {
      this.logger.error('Error joining session:', error);
      client.emit('error', { message: 'Failed to join session' });
    }
  }

  @SubscribeMessage('leave_session')
  async handleLeaveSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
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
    } catch (error) {
      this.logger.error('Error leaving session:', error);
      client.emit('error', { message: 'Failed to leave session' });
    }
  }

  @SubscribeMessage('recording_status_update')
  async handleRecordingStatusUpdate(
    @MessageBody() event: RecordingStatusEvent,
    @ConnectedSocket() client: Socket,
  ) {
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
      const enrichedEvent: RecordingStatusEvent = {
        ...event,
        timestamp: new Date(),
      };

      // Set coach/client IDs based on participant role
      if (participant.role === 'coach') {
        enrichedEvent.coachId = participant.userId;
      } else {
        enrichedEvent.clientId = participant.userId;
      }

      // Broadcast to all session participants
      this.notifySessionParticipants(participant.sessionId, 'recording_status_updated', enrichedEvent);

      // Log the event
      this.logger.log(`Recording status update: ${event.type} for session ${participant.sessionId}`);

      // Store recording event for audit (in production, save to database)
      await this.storeRecordingEvent(enrichedEvent);

    } catch (error) {
      this.logger.error('Error handling recording status update:', error);
      client.emit('error', { message: 'Failed to update recording status' });
    }
  }

  @SubscribeMessage('get_session_status')
  async handleGetSessionStatus(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
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

    } catch (error) {
      this.logger.error('Error getting session status:', error);
      client.emit('error', { message: 'Failed to get session status' });
    }
  }

  // Public methods for external services to send updates
  public async broadcastRecordingEvent(event: RecordingStatusEvent) {
    try {
      // Broadcast to specific session
      this.server.to(`session_${event.sessionId}`).emit('recording_status_updated', event);
      
      // Store the event
      await this.storeRecordingEvent(event);
      
      this.logger.log(`Broadcasted recording event: ${event.type} for session ${event.sessionId}`);
    } catch (error) {
      this.logger.error('Error broadcasting recording event:', error);
    }
  }

  public async notifySessionParticipants(sessionId: string, eventType: string, data: any, excludeSocketId?: string) {
    try {
      const room = `session_${sessionId}`;
      
      if (excludeSocketId) {
        this.server.to(room).except(excludeSocketId).emit(eventType, {
          sessionId,
          timestamp: new Date(),
          ...data,
        });
      } else {
        this.server.to(room).emit(eventType, {
          sessionId,
          timestamp: new Date(),
          ...data,
        });
      }
    } catch (error) {
      this.logger.error('Error notifying session participants:', error);
    }
  }

  public getSessionParticipants(sessionId: string): SessionParticipant[] {
    const participants = this.sessions.get(sessionId);
    return participants ? Array.from(participants) : [];
  }

  public getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Private helper methods
  private extractUserFromToken(token: string): { userId: string; role: 'coach' | 'client' } | null {
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
        role: payload.role as 'coach' | 'client',
      };
    } catch (error) {
      this.logger.error('Error extracting user from token:', error);
      return null;
    }
  }

  private async storeRecordingEvent(event: RecordingStatusEvent): Promise<void> {
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
    } catch (error) {
      this.logger.error('Error storing recording event:', error);
    }
  }
}