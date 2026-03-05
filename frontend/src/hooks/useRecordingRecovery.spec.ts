import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecordingRecovery } from './useRecordingRecovery';
import * as BackupService from '../services/RecordingBackupService';

// Mock the backup service
jest.mock('../services/RecordingBackupService', () => ({
  getRecordingBackupService: jest.fn()
}));

describe('useRecordingRecovery', () => {
  const mockBackupService = {
    getPendingRecoveries: jest.fn(),
    recoverRecording: jest.fn(),
    deleteBackup: jest.fn(),
    cleanupOldBackups: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (BackupService.getRecordingBackupService as jest.Mock).mockReturnValue(mockBackupService);
    mockBackupService.getPendingRecoveries.mockResolvedValue([]);
    mockBackupService.cleanupOldBackups.mockResolvedValue(0);
  });

  it('checks for recoveries on mount', async () => {
    renderHook(() => useRecordingRecovery());

    await waitFor(() => {
      expect(mockBackupService.getPendingRecoveries).toHaveBeenCalled();
    });
  });

  it('returns hasRecoveries=true when recoveries exist', async () => {
    mockBackupService.getPendingRecoveries.mockResolvedValue([
      {
        recordingId: 'rec-123',
        sessionId: 'session-456',
        duration: 60000,
        fileSize: 1024,
        lastUpdate: new Date(),
        recoverable: true
      }
    ]);

    const { result } = renderHook(() => useRecordingRecovery());

    await waitFor(() => {
      expect(result.current.state.hasRecoveries).toBe(true);
      expect(result.current.state.recoveries).toHaveLength(1);
      expect(result.current.state.showRecoveryDialog).toBe(true);
    });
  });

  it('filters out non-recoverable recordings', async () => {
    mockBackupService.getPendingRecoveries.mockResolvedValue([
      { recordingId: 'rec-1', recoverable: true },
      { recordingId: 'rec-2', recoverable: false }
    ]);

    const { result } = renderHook(() => useRecordingRecovery());

    await waitFor(() => {
      expect(result.current.state.recoveries).toHaveLength(1);
      expect(result.current.state.recoveries[0].recordingId).toBe('rec-1');
    });
  });

  describe('recoverRecording', () => {
    it('recovers and returns blob', async () => {
      const mockBlob = new Blob(['recovered data'], { type: 'video/webm' });
      mockBackupService.getPendingRecoveries.mockResolvedValue([
        { recordingId: 'rec-123', recoverable: true }
      ]);
      mockBackupService.recoverRecording.mockResolvedValue(mockBlob);
      mockBackupService.deleteBackup.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecordingRecovery());

      await waitFor(() => {
        expect(result.current.state.hasRecoveries).toBe(true);
      });

      let blob: Blob | null = null;
      await act(async () => {
        blob = await result.current.recoverRecording('rec-123');
      });

      expect(blob).toBe(mockBlob);
      expect(mockBackupService.deleteBackup).toHaveBeenCalledWith('rec-123');
    });

    it('returns null when no data found', async () => {
      mockBackupService.recoverRecording.mockResolvedValue(null);

      const { result } = renderHook(() => useRecordingRecovery());

      let blob: Blob | null = null;
      await act(async () => {
        blob = await result.current.recoverRecording('rec-nonexistent');
      });

      expect(blob).toBeNull();
      expect(result.current.state.error).toBe('No data found in backup');
    });

    it('handles recovery errors', async () => {
      mockBackupService.recoverRecording.mockRejectedValue(new Error('Recovery failed'));

      const { result } = renderHook(() => useRecordingRecovery());

      await act(async () => {
        await result.current.recoverRecording('rec-123');
      });

      expect(result.current.state.error).toBe('Recovery failed');
      expect(result.current.state.isRecovering).toBe(false);
    });
  });

  describe('discardRecovery', () => {
    it('removes recovery from list', async () => {
      mockBackupService.getPendingRecoveries.mockResolvedValue([
        { recordingId: 'rec-1', recoverable: true },
        { recordingId: 'rec-2', recoverable: true }
      ]);
      mockBackupService.deleteBackup.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecordingRecovery());

      await waitFor(() => {
        expect(result.current.state.recoveries).toHaveLength(2);
      });

      await act(async () => {
        await result.current.discardRecovery('rec-1');
      });

      expect(result.current.state.recoveries).toHaveLength(1);
      expect(result.current.state.recoveries[0].recordingId).toBe('rec-2');
      expect(mockBackupService.deleteBackup).toHaveBeenCalledWith('rec-1');
    });
  });

  describe('discardAllRecoveries', () => {
    it('removes all recoveries', async () => {
      mockBackupService.getPendingRecoveries.mockResolvedValue([
        { recordingId: 'rec-1', recoverable: true },
        { recordingId: 'rec-2', recoverable: true }
      ]);
      mockBackupService.deleteBackup.mockResolvedValue(undefined);

      const { result } = renderHook(() => useRecordingRecovery());

      await waitFor(() => {
        expect(result.current.state.recoveries).toHaveLength(2);
      });

      await act(async () => {
        await result.current.discardAllRecoveries();
      });

      expect(result.current.state.recoveries).toHaveLength(0);
      expect(result.current.state.hasRecoveries).toBe(false);
      expect(result.current.state.showRecoveryDialog).toBe(false);
      expect(mockBackupService.deleteBackup).toHaveBeenCalledTimes(2);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', async () => {
      const { result } = renderHook(() => useRecordingRecovery());

      expect(result.current.formatFileSize(0)).toBe('0 B');
      expect(result.current.formatFileSize(1024)).toBe('1 KB');
      expect(result.current.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(result.current.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('formatDuration', () => {
    it('formats duration correctly', async () => {
      const { result } = renderHook(() => useRecordingRecovery());

      expect(result.current.formatDuration(0)).toBe('0:00');
      expect(result.current.formatDuration(30000)).toBe('0:30');
      expect(result.current.formatDuration(90000)).toBe('1:30');
      expect(result.current.formatDuration(3661000)).toBe('1:01:01');
    });
  });

  describe('setShowRecoveryDialog', () => {
    it('toggles dialog visibility', async () => {
      const { result } = renderHook(() => useRecordingRecovery());

      expect(result.current.state.showRecoveryDialog).toBe(false);

      act(() => {
        result.current.setShowRecoveryDialog(true);
      });

      expect(result.current.state.showRecoveryDialog).toBe(true);

      act(() => {
        result.current.setShowRecoveryDialog(false);
      });

      expect(result.current.state.showRecoveryDialog).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('runs cleanup on mount', async () => {
      renderHook(() => useRecordingRecovery());

      await waitFor(() => {
        expect(mockBackupService.cleanupOldBackups).toHaveBeenCalled();
      });
    });
  });
});
