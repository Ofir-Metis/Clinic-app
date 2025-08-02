/**
 * useWebSocket - React hook for WebSocket connection management
 * Provides easy integration with WebSocket service for real-time features
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import webSocketService, { RecordingStatusEvent, SessionStatus, WebSocketEventCallback } from '../services/WebSocketService';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  authToken?: string;
  sessionId?: string;
  userId?: string;
  role?: 'coach' | 'client';
}

export interface WebSocketConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  sessionId: string | null;
  sessionJoined: boolean;
}

export interface UseWebSocketReturn {
  connectionState: WebSocketConnectionState;
  connect: (authToken: string) => Promise<void>;
  disconnect: () => void;
  joinSession: (sessionId: string, userId: string, role: 'coach' | 'client') => Promise<void>;
  leaveSession: () => Promise<void>;
  sendRecordingUpdate: (event: Omit<RecordingStatusEvent, 'timestamp' | 'sessionId'>) => void;
  getSessionStatus: (sessionId: string) => void;
  addEventListener: (event: string, callback: WebSocketEventCallback) => void;
  removeEventListener: (event: string, callback: WebSocketEventCallback) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    autoConnect = false,
    authToken,
    sessionId,
    userId,
    role = 'client'
  } = options;

  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    sessionId: null,
    sessionJoined: false,
  });

  const eventListenersRef = useRef<Map<string, WebSocketEventCallback>>(new Map());
  const mountedRef = useRef(true);

  // Update connection state
  const updateConnectionState = useCallback((updates: Partial<WebSocketConnectionState>) => {
    if (!mountedRef.current) return;
    
    setConnectionState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async (token: string) => {
    if (connectionState.connecting || connectionState.connected) return;

    updateConnectionState({ connecting: true, error: null });

    try {
      await webSocketService.connect(token);
      updateConnectionState({ 
        connected: true, 
        connecting: false, 
        error: null 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      updateConnectionState({ 
        connected: false, 
        connecting: false, 
        error: errorMessage 
      });
      throw error;
    }
  }, [connectionState.connecting, connectionState.connected, updateConnectionState]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    updateConnectionState({ 
      connected: false, 
      connecting: false, 
      sessionId: null, 
      sessionJoined: false,
      error: null 
    });
  }, [updateConnectionState]);

  // Join session
  const joinSession = useCallback(async (sessionId: string, userId: string, role: 'coach' | 'client') => {
    if (!connectionState.connected) {
      throw new Error('WebSocket not connected');
    }

    try {
      await webSocketService.joinSession(sessionId, userId, role);
      updateConnectionState({ 
        sessionId, 
        sessionJoined: true 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join session';
      updateConnectionState({ error: errorMessage });
      throw error;
    }
  }, [connectionState.connected, updateConnectionState]);

  // Leave session
  const leaveSession = useCallback(async () => {
    if (!connectionState.sessionJoined) return;

    try {
      await webSocketService.leaveSession();
      updateConnectionState({ 
        sessionId: null, 
        sessionJoined: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave session';
      updateConnectionState({ error: errorMessage });
      throw error;
    }
  }, [connectionState.sessionJoined, updateConnectionState]);

  // Send recording update
  const sendRecordingUpdate = useCallback((event: Omit<RecordingStatusEvent, 'timestamp' | 'sessionId'>) => {
    webSocketService.sendRecordingUpdate(event);
  }, []);

  // Get session status
  const getSessionStatus = useCallback((sessionId: string) => {
    webSocketService.getSessionStatus(sessionId);
  }, []);

  // Add event listener with cleanup tracking
  const addEventListener = useCallback((event: string, callback: WebSocketEventCallback) => {
    webSocketService.addEventListener(event, callback);
    
    // Track for cleanup
    const key = `${event}_${Date.now()}_${Math.random()}`;
    eventListenersRef.current.set(key, callback);
    
    return key;
  }, []);

  // Remove event listener
  const removeEventListener = useCallback((event: string, callback: WebSocketEventCallback) => {
    webSocketService.removeEventListener(event, callback);
    
    // Remove from tracking
    for (const [key, trackedCallback] of eventListenersRef.current.entries()) {
      if (trackedCallback === callback) {
        eventListenersRef.current.delete(key);
        break;
      }
    }
  }, []);

  // Set up connection status listeners
  useEffect(() => {
    const handleDisconnected = () => {
      updateConnectionState({ 
        connected: false, 
        sessionId: null, 
        sessionJoined: false 
      });
    };

    const handleError = (error: any) => {
      const errorMessage = error?.message || 'WebSocket error';
      updateConnectionState({ error: errorMessage });
    };

    webSocketService.addEventListener('disconnected', handleDisconnected);
    webSocketService.addEventListener('error', handleError);

    return () => {
      webSocketService.removeEventListener('disconnected', handleDisconnected);
      webSocketService.removeEventListener('error', handleError);
    };
  }, [updateConnectionState]);

  // Auto-connect on mount if configured
  useEffect(() => {
    if (autoConnect && authToken && !connectionState.connected && !connectionState.connecting) {
      connect(authToken).catch(console.error);
    }
  }, [autoConnect, authToken, connectionState.connected, connectionState.connecting, connect]);

  // Auto-join session if configured
  useEffect(() => {
    if (connectionState.connected && sessionId && userId && !connectionState.sessionJoined) {
      joinSession(sessionId, userId, role).catch(console.error);
    }
  }, [
    connectionState.connected, 
    connectionState.sessionJoined, 
    sessionId, 
    userId, 
    role, 
    joinSession
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      // Clean up event listeners
      for (const [, callback] of eventListenersRef.current.entries()) {
        // Event listeners are automatically cleaned up when component unmounts
      }
      eventListenersRef.current.clear();

      // Leave session if joined
      if (connectionState.sessionJoined) {
        webSocketService.leaveSession().catch(console.error);
      }
    };
  }, [connectionState.sessionJoined]);

  return {
    connectionState,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    sendRecordingUpdate,
    getSessionStatus,
    addEventListener,
    removeEventListener,
  };
};

export default useWebSocket;