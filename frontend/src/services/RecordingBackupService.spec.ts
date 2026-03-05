import { RecordingBackupService, getRecordingBackupService } from './RecordingBackupService';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn()
};

const mockObjectStore = {
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  openCursor: jest.fn(),
  createIndex: jest.fn()
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore)
};

const mockDB = {
  transaction: jest.fn(() => mockTransaction),
  objectStoreNames: { contains: jest.fn(() => true) },
  createObjectStore: jest.fn(() => mockObjectStore)
};

// Setup IndexedDB mock
(global as any).indexedDB = mockIndexedDB;

describe('RecordingBackupService', () => {
  let service: RecordingBackupService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup successful DB open
    const mockRequest: any = {
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: mockDB,
      error: null
    };

    mockIndexedDB.open.mockImplementation(() => {
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess({ target: mockRequest });
        }
      }, 0);
      return mockRequest;
    });

    service = new RecordingBackupService();
  });

  describe('getRecordingBackupService', () => {
    it('returns singleton instance', () => {
      const instance1 = getRecordingBackupService();
      const instance2 = getRecordingBackupService();
      expect(instance1).toBe(instance2);
    });
  });

  describe('startAutoBackup', () => {
    it('initializes backup for a recording', async () => {
      const mockMediaRecorder: any = {
        state: 'recording',
        ondataavailable: null,
        requestData: jest.fn()
      };

      mockObjectStore.put.mockImplementation(() => {
        const req: any = { onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      });

      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for DB init

      await service.startAutoBackup(
        'rec-123',
        'session-456',
        'user-789',
        mockMediaRecorder,
        {
          mimeType: 'video/webm',
          recordingMode: 'camera'
        }
      );

      // Verify the backup record was created
      expect(mockObjectStore.put).toHaveBeenCalled();
    });
  });

  describe('stopAutoBackup', () => {
    it('stops backup and optionally keeps data', async () => {
      mockObjectStore.delete.mockImplementation(() => {
        const req: any = { onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      });

      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for DB init

      // Stop without keeping backup
      await service.stopAutoBackup('rec-123', false);
      expect(mockObjectStore.delete).toHaveBeenCalled();
    });
  });

  describe('getPendingRecoveries', () => {
    it('returns list of interrupted recordings', async () => {
      const mockBackups = [
        {
          id: 'rec-1',
          sessionId: 'session-1',
          chunks: [new Blob(['data'])],
          metadata: {
            duration: 60000,
            fileSize: 1024,
            lastUpdate: new Date()
          },
          status: 'interrupted'
        }
      ];

      const mockIndex = {
        getAll: jest.fn(() => {
          const req: any = { onsuccess: null, onerror: null, result: mockBackups };
          setTimeout(() => req.onsuccess && req.onsuccess(), 0);
          return req;
        })
      };

      mockObjectStore.index = jest.fn(() => mockIndex);

      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for DB init

      const recoveries = await service.getPendingRecoveries();
      expect(Array.isArray(recoveries)).toBe(true);
    });
  });

  describe('recoverRecording', () => {
    it('reconstructs blob from chunks', async () => {
      const mockChunks = [
        new Blob(['chunk1'], { type: 'video/webm' }),
        new Blob(['chunk2'], { type: 'video/webm' })
      ];

      const mockBackup = {
        id: 'rec-123',
        chunks: mockChunks,
        metadata: {
          mimeType: 'video/webm'
        }
      };

      mockObjectStore.get.mockImplementation(() => {
        const req: any = { onsuccess: null, onerror: null, result: mockBackup };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      });

      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for DB init

      const blob = await service.recoverRecording('rec-123');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob?.size).toBeGreaterThan(0);
    });

    it('returns null for empty backup', async () => {
      mockObjectStore.get.mockImplementation(() => {
        const req: any = { onsuccess: null, onerror: null, result: { chunks: [] } };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      });

      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for DB init

      const blob = await service.recoverRecording('rec-nonexistent');
      expect(blob).toBeNull();
    });
  });

  describe('deleteBackup', () => {
    it('removes backup from IndexedDB', async () => {
      mockObjectStore.delete.mockImplementation(() => {
        const req: any = { onsuccess: null, onerror: null };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req;
      });

      await new Promise(resolve => setTimeout(resolve, 10)); // Wait for DB init

      await service.deleteBackup('rec-123');
      expect(mockObjectStore.delete).toHaveBeenCalledWith('rec-123');
    });
  });

  describe('getStorageUsage', () => {
    it('returns storage estimate when available', async () => {
      (navigator as any).storage = {
        estimate: jest.fn().mockResolvedValue({ usage: 1000, quota: 1000000 })
      };

      const usage = await service.getStorageUsage();
      expect(usage.used).toBe(1000);
      expect(usage.available).toBe(1000000);
    });

    it('returns zeros when storage API not available', async () => {
      delete (navigator as any).storage;

      const usage = await service.getStorageUsage();
      expect(usage.used).toBe(0);
      expect(usage.available).toBe(0);
    });
  });
});
