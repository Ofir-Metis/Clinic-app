/**
 * useRecordingRecovery - Hook for recovering interrupted recordings
 * Checks for interrupted recordings on app load and provides recovery dialog
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getRecordingBackupService,
  RecoveryInfo,
} from '../services/RecordingBackupService';

export interface RecoveryState {
  /** Whether there are recordings available for recovery */
  hasRecoveries: boolean;
  /** List of recoverable recordings */
  recoveries: RecoveryInfo[];
  /** Whether the recovery dialog should be shown */
  showRecoveryDialog: boolean;
  /** Whether recovery is in progress */
  isRecovering: boolean;
  /** Any error that occurred during recovery */
  error: string | null;
}

export interface UseRecordingRecoveryReturn {
  state: RecoveryState;
  /** Check for recoverable recordings */
  checkForRecoveries: () => Promise<void>;
  /** Recover a specific recording */
  recoverRecording: (recordingId: string) => Promise<Blob | null>;
  /** Discard a specific recovery */
  discardRecovery: (recordingId: string) => Promise<void>;
  /** Discard all recoveries */
  discardAllRecoveries: () => Promise<void>;
  /** Show/hide the recovery dialog */
  setShowRecoveryDialog: (show: boolean) => void;
  /** Format file size for display */
  formatFileSize: (bytes: number) => string;
  /** Format duration for display */
  formatDuration: (ms: number) => string;
}

export function useRecordingRecovery(): UseRecordingRecoveryReturn {
  const [state, setState] = useState<RecoveryState>({
    hasRecoveries: false,
    recoveries: [],
    showRecoveryDialog: false,
    isRecovering: false,
    error: null,
  });

  const backupService = getRecordingBackupService();

  /**
   * Check for recoverable recordings
   */
  const checkForRecoveries = useCallback(async () => {
    try {
      const recoveries = await backupService.getPendingRecoveries();
      const recoverableRecoveries = recoveries.filter(r => r.recoverable);

      setState(prev => ({
        ...prev,
        hasRecoveries: recoverableRecoveries.length > 0,
        recoveries: recoverableRecoveries,
        showRecoveryDialog: recoverableRecoveries.length > 0,
        error: null,
      }));

      if (recoverableRecoveries.length > 0) {
        console.log(`[Recovery] Found ${recoverableRecoveries.length} recoverable recording(s)`);
      }
    } catch (error) {
      console.error('[Recovery] Failed to check for recoveries:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to check for recoveries',
      }));
    }
  }, [backupService]);

  /**
   * Recover a specific recording
   */
  const recoverRecording = useCallback(async (recordingId: string): Promise<Blob | null> => {
    setState(prev => ({ ...prev, isRecovering: true, error: null }));

    try {
      const blob = await backupService.recoverRecording(recordingId);

      if (blob) {
        console.log(`[Recovery] Successfully recovered recording ${recordingId}, size: ${blob.size} bytes`);

        // Remove from recoveries list
        setState(prev => ({
          ...prev,
          recoveries: prev.recoveries.filter(r => r.recordingId !== recordingId),
          hasRecoveries: prev.recoveries.length > 1,
          isRecovering: false,
        }));

        // Delete the backup after successful recovery
        await backupService.deleteBackup(recordingId);
      } else {
        setState(prev => ({
          ...prev,
          isRecovering: false,
          error: 'No data found in backup',
        }));
      }

      return blob;
    } catch (error) {
      console.error(`[Recovery] Failed to recover recording ${recordingId}:`, error);
      setState(prev => ({
        ...prev,
        isRecovering: false,
        error: error instanceof Error ? error.message : 'Recovery failed',
      }));
      return null;
    }
  }, [backupService]);

  /**
   * Discard a specific recovery
   */
  const discardRecovery = useCallback(async (recordingId: string): Promise<void> => {
    try {
      await backupService.deleteBackup(recordingId);

      setState(prev => {
        const newRecoveries = prev.recoveries.filter(r => r.recordingId !== recordingId);
        return {
          ...prev,
          recoveries: newRecoveries,
          hasRecoveries: newRecoveries.length > 0,
          showRecoveryDialog: newRecoveries.length > 0,
        };
      });

      console.log(`[Recovery] Discarded recovery for ${recordingId}`);
    } catch (error) {
      console.error(`[Recovery] Failed to discard recovery ${recordingId}:`, error);
    }
  }, [backupService]);

  /**
   * Discard all recoveries
   */
  const discardAllRecoveries = useCallback(async (): Promise<void> => {
    try {
      const promises = state.recoveries.map(r => backupService.deleteBackup(r.recordingId));
      await Promise.all(promises);

      setState(prev => ({
        ...prev,
        recoveries: [],
        hasRecoveries: false,
        showRecoveryDialog: false,
      }));

      console.log('[Recovery] Discarded all recoveries');
    } catch (error) {
      console.error('[Recovery] Failed to discard all recoveries:', error);
    }
  }, [backupService, state.recoveries]);

  /**
   * Set show recovery dialog
   */
  const setShowRecoveryDialog = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showRecoveryDialog: show }));
  }, []);

  /**
   * Format file size for display
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, []);

  /**
   * Format duration for display
   */
  const formatDuration = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }, []);

  // Check for recoveries on mount
  useEffect(() => {
    checkForRecoveries();
  }, [checkForRecoveries]);

  // Clean up old backups periodically
  useEffect(() => {
    const cleanup = async () => {
      try {
        const deleted = await backupService.cleanupOldBackups();
        if (deleted > 0) {
          console.log(`[Recovery] Cleaned up ${deleted} old backups`);
        }
      } catch (error) {
        console.error('[Recovery] Cleanup failed:', error);
      }
    };

    // Clean up on mount
    cleanup();

    // Clean up every hour
    const interval = setInterval(cleanup, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [backupService]);

  return {
    state,
    checkForRecoveries,
    recoverRecording,
    discardRecovery,
    discardAllRecoveries,
    setShowRecoveryDialog,
    formatFileSize,
    formatDuration,
  };
}

export default useRecordingRecovery;
