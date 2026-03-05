import { ChunkedUploadService } from './ChunkedUploadService';

// Mock axios/api
jest.mock('../api/auth', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn()
  }
}));

describe('ChunkedUploadService', () => {
  let service: ChunkedUploadService;
  let mockApi: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi = require('../api/auth').api;
    service = new ChunkedUploadService({
      chunkSize: 1024 * 1024, // 1MB for testing
      maxRetries: 2,
      retryDelay: 100
    });
  });

  describe('constructor', () => {
    it('creates service with default config', () => {
      const defaultService = new ChunkedUploadService();
      expect(defaultService).toBeDefined();
    });

    it('creates service with custom config', () => {
      const customService = new ChunkedUploadService({
        chunkSize: 50 * 1024 * 1024,
        maxRetries: 5
      });
      expect(customService).toBeDefined();
    });
  });

  describe('uploadFile', () => {
    it('initializes upload and uploads chunks', async () => {
      const mockFile = new Blob(['x'.repeat(2 * 1024 * 1024)], { type: 'video/webm' });

      mockApi.post.mockImplementation((url: string) => {
        if (url === '/api/uploads/init') {
          return Promise.resolve({ data: { uploadId: 'upload-123', lastCompletedChunk: -1 } });
        }
        if (url === '/api/uploads/chunk') {
          return Promise.resolve({ data: { success: true } });
        }
        if (url.includes('/finalize')) {
          return Promise.resolve({
            data: {
              uploadId: 'upload-123',
              fileId: 'file-456',
              fileUrl: 'https://cdn.example.com/file.webm',
              totalSize: mockFile.size
            }
          });
        }
        return Promise.resolve({ data: {} });
      });

      const onProgress = jest.fn();
      const result = await service.uploadFile(mockFile, {
        sessionId: 'session-123',
        fileName: 'recording.webm'
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/uploads/init', expect.any(Object));
      expect(result.fileId).toBe('file-456');
    });

    it('handles upload failure with retry', async () => {
      const mockFile = new Blob(['small'], { type: 'video/webm' });

      let attempts = 0;
      mockApi.post.mockImplementation((url: string) => {
        if (url === '/api/uploads/init') {
          return Promise.resolve({ data: { uploadId: 'upload-123', lastCompletedChunk: -1 } });
        }
        if (url === '/api/uploads/chunk') {
          attempts++;
          if (attempts < 2) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({ data: { success: true } });
        }
        if (url.includes('/finalize')) {
          return Promise.resolve({
            data: {
              uploadId: 'upload-123',
              fileId: 'file-456',
              fileUrl: 'https://cdn.example.com/file.webm',
              totalSize: mockFile.size
            }
          });
        }
        return Promise.resolve({ data: {} });
      });

      const result = await service.uploadFile(mockFile, {});
      expect(attempts).toBe(2); // Should retry once
      expect(result.fileId).toBe('file-456');
    });
  });

  describe('pauseUpload', () => {
    it('pauses an active upload', () => {
      // This tests that pause doesn't throw
      expect(() => service.pauseUpload('nonexistent-id')).not.toThrow();
    });
  });

  describe('cancelUpload', () => {
    it('cancels and cleans up upload', async () => {
      mockApi.delete.mockResolvedValue({ data: { success: true } });

      await service.cancelUpload('upload-123');
      expect(mockApi.delete).toHaveBeenCalledWith('/api/uploads/upload-123');
    });
  });

  describe('getActiveUploads', () => {
    it('returns empty array initially', () => {
      const uploads = service.getActiveUploads();
      expect(uploads).toEqual([]);
    });
  });
});
