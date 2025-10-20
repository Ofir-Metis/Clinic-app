/**
 * WebSocketService - Frontend service for real-time WebSocket communication
 * Handles connection to recording status WebSocket gateway
 */

import { io, Socket } from 'socket.io-client';

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
  joinedAt: Date;
}

export interface SessionStatus {
  sessionId: string;
  isActive: boolean;
  participantCount: number;
  participants: SessionParticipant[];
}

export type WebSocketEventCallback = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private currentSessionId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventCallbacks = new Map<string, WebSocketEventCallback[]>();

  constructor() {
    this.setupEventHandlers();
  }

  // Connection management
  public connect(authToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.socket?.connected) {
          resolve();
          return;
        }

        const wsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';
        
        this.socket = io(`${wsUrl}/recording-status`, {
          auth: {
            token: authToken,
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.socket.on('connect', () => {
          console.log('✅ WebSocket connected:', this.socket?.id);
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error(`Failed to connect after ${this.maxReconnectAttempts} attempts`));
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 WebSocket disconnected:', reason);
          this.triggerEvent('disconnected', { reason });
        });

        this.socket.on('error', (error) => {
          console.error('❌ WebSocket error:', error);
          this.triggerEvent('error', error);
        });

        // Set up event listeners
        this.setupSocketEventListeners();

      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentSessionId = null;
      console.log('🔌 WebSocket disconnected');
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Session management
  public async joinSession(sessionId: string, userId: string, role: 'coach' | 'client'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.socket.emit('join_session', { sessionId, userId, role });

      const timeoutId = setTimeout(() => {
        reject(new Error('Join session timeout'));
      }, 10000);

      this.socket.once('session_joined', (data) => {
        clearTimeout(timeoutId);
        this.currentSessionId = sessionId;
        console.log(`✅ Joined session ${sessionId}:`, data);
        resolve();
      });

      this.socket.once('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  public async leaveSession(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.currentSessionId) {
        resolve();
        return;
      }

      this.socket.emit('leave_session', { sessionId: this.currentSessionId });

      const timeoutId = setTimeout(() => {
        reject(new Error('Leave session timeout'));
      }, 5000);

      this.socket.once('session_left', () => {
        clearTimeout(timeoutId);
        this.currentSessionId = null;
        console.log('✅ Left session');
        resolve();
      });
    });
  }

  // Recording status updates
  public sendRecordingUpdate(event: Omit<RecordingStatusEvent, 'timestamp'>): void {
    if (!this.socket?.connected || !this.currentSessionId) {
      console.warn('Cannot send recording update: not connected to session');
      return;
    }

    this.socket.emit('recording_status_update', {
      ...event,
      sessionId: this.currentSessionId,
    });
  }

  public getSessionStatus(sessionId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot get session status: not connected');
      return;
    }

    this.socket.emit('get_session_status', { sessionId });
  }

  // Event handling
  public addEventListener(event: string, callback: WebSocketEventCallback): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  public removeEventListener(event: string, callback: WebSocketEventCallback): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  public removeAllEventListeners(event?: string): void {
    if (event) {
      this.eventCallbacks.delete(event);
    } else {
      this.eventCallbacks.clear();
    }
  }

  // Private methods
  private setupEventHandlers(): void {
    // Set up default event handlers
  }

  private setupSocketEventListeners(): void {
    if (!this.socket) return;

    // Recording status events
    this.socket.on('recording_status_updated', (event: RecordingStatusEvent) => {
      console.log('🎥 Recording status update:', event);
      this.triggerEvent('recording_status_updated', event);
    });

    // Session events
    this.socket.on('session_joined', (data) => {
      console.log('👥 Session joined:', data);
      this.triggerEvent('session_joined', data);
    });

    this.socket.on('session_left', (data) => {
      console.log('👥 Session left:', data);
      this.triggerEvent('session_left', data);
    });

    this.socket.on('participant_joined', (data) => {
      console.log('👤 Participant joined:', data);
      this.triggerEvent('participant_joined', data);
    });

    this.socket.on('participant_left', (data) => {
      console.log('👤 Participant left:', data);
      this.triggerEvent('participant_left', data);
    });

    this.socket.on('session_status', (status: SessionStatus) => {
      console.log('📊 Session status:', status);
      this.triggerEvent('session_status', status);
    });
  }

  private triggerEvent(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event callback for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  public getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  public getConnectionStatus(): {
    connected: boolean;
    sessionId: string | null;
    socketId: string | null;
  } {
    return {
      connected: this.isConnected(),
      sessionId: this.currentSessionId,
      socketId: this.socket?.id || null,
    };
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;