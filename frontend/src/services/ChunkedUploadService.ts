/**
 * ChunkedUploadService - Handles chunked uploads for large recording files
 * Features: 100MB chunks, resume capability, progress tracking, retry logic
 */

import apiClient from '../api/client';

export interface UploadProgress {
  uploadId: string;
  fileName: string;
  totalSize: number;
  uploadedSize: number;
  progress: number; // 0-100
  currentChunk: number;
  totalChunks: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
  error?: string;
  startTime: Date;
  estimatedTimeRemaining?: number; // milliseconds
  uploadSpeed?: number; // bytes per second
}

export interface UploadResult {
  uploadId: string;
  fileId: string;
  fileUrl: string;
  totalSize: number;
  duration: number; // milliseconds
}

export interface ChunkedUploadConfig {
  chunkSize?: number; // bytes, default 100MB
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: Error, progress: UploadProgress) => void;
}

const DEFAULT_CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 2000; // 2 seconds

export class ChunkedUploadService {
  private config: Required<ChunkedUploadConfig>;
  private activeUploads: Map<string, UploadProgress> = new Map();
  private uploadControllers: Map<string, AbortController> = new Map();

  constructor(config: ChunkedUploadConfig = {}) {
    this.config = {
      chunkSize: config.chunkSize || DEFAULT_CHUNK_SIZE,
      maxRetries: config.maxRetries || DEFAULT_MAX_RETRIES,
      retryDelay: config.retryDelay || DEFAULT_RETRY_DELAY,
      onProgress: config.onProgress || (() => {}),
      onComplete: config.onComplete || (() => {}),
      onError: config.onError || (() => {}),
    };
  }

  /**
   * Start uploading a file in chunks
   */
  async uploadFile(
    file: File | Blob,
    metadata: {
      sessionId?: string;
      recordingId?: string;
      fileName?: string;
      mimeType?: string;
    } = {}
  ): Promise<UploadResult> {
    const uploadId = this.generateUploadId();
    const fileName = metadata.fileName || (file instanceof File ? file.name : `recording_${Date.now()}`);
    const totalChunks = Math.ceil(file.size / this.config.chunkSize);

    const progress: UploadProgress = {
      uploadId,
      fileName,
      totalSize: file.size,
      uploadedSize: 0,
      progress: 0,
      currentChunk: 0,
      totalChunks,
      status: 'pending',
      startTime: new Date(),
    };

    this.activeUploads.set(uploadId, progress);

    try {
      // Initialize upload on server
      const initResponse = await this.initializeUpload(uploadId, {
        fileName,
        totalSize: file.size,
        totalChunks,
        mimeType: metadata.mimeType || file.type,
        sessionId: metadata.sessionId,
        recordingId: metadata.recordingId,
      });

      // Check if we can resume from a previous upload
      const startChunk = initResponse.lastCompletedChunk + 1;
      progress.currentChunk = startChunk;
      progress.uploadedSize = startChunk * this.config.chunkSize;
      progress.status = 'uploading';

      // Upload chunks
      for (let i = startChunk; i < totalChunks; i++) {
        // Check if upload was cancelled
        if (!this.activeUploads.has(uploadId)) {
          throw new Error('Upload cancelled');
        }

        const start = i * this.config.chunkSize;
        const end = Math.min(start + this.config.chunkSize, file.size);
        const chunk = file.slice(start, end);

        await this.uploadChunkWithRetry(uploadId, chunk, i, totalChunks);

        // Update progress
        progress.currentChunk = i + 1;
        progress.uploadedSize = Math.min(end, file.size);
        progress.progress = Math.round((progress.uploadedSize / progress.totalSize) * 100);

        // Calculate upload speed and ETA
        const elapsed = Date.now() - progress.startTime.getTime();
        progress.uploadSpeed = progress.uploadedSize / (elapsed / 1000);
        const remainingBytes = progress.totalSize - progress.uploadedSize;
        progress.estimatedTimeRemaining = progress.uploadSpeed > 0
          ? (remainingBytes / progress.uploadSpeed) * 1000
          : undefined;

        this.config.onProgress(progress);
      }

      // Finalize upload
      const result = await this.finalizeUpload(uploadId, {
        fileName,
        totalSize: file.size,
        totalChunks,
        mimeType: metadata.mimeType || file.type,
      });

      progress.status = 'completed';
      progress.progress = 100;
      this.config.onProgress(progress);
      this.config.onComplete(result);

      // Clean up
      this.activeUploads.delete(uploadId);
      this.uploadControllers.delete(uploadId);

      return result;

    } catch (error) {
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : 'Upload failed';
      this.config.onProgress(progress);
      this.config.onError(error instanceof Error ? error : new Error('Upload failed'), progress);
      throw error;
    }
  }

  /**
   * Resume a paused or failed upload
   */
  async resumeUpload(uploadId: string, file: File | Blob): Promise<UploadResult> {
    const status = await this.getUploadStatus(uploadId);

    if (status.status === 'completed') {
      throw new Error('Upload already completed');
    }

    // Update local progress
    const progress = this.activeUploads.get(uploadId);
    if (progress) {
      progress.status = 'uploading';
    }

    // Continue from last successful chunk
    return this.uploadFile(file, { recordingId: uploadId });
  }

  /**
   * Pause an active upload
   */
  pauseUpload(uploadId: string): void {
    const controller = this.uploadControllers.get(uploadId);
    if (controller) {
      controller.abort();
    }

    const progress = this.activeUploads.get(uploadId);
    if (progress) {
      progress.status = 'paused';
      this.config.onProgress(progress);
    }
  }

  /**
   * Cancel and delete an upload
   */
  async cancelUpload(uploadId: string): Promise<void> {
    // Abort any in-progress request
    const controller = this.uploadControllers.get(uploadId);
    if (controller) {
      controller.abort();
    }

    // Clean up local state
    this.activeUploads.delete(uploadId);
    this.uploadControllers.delete(uploadId);

    // Tell server to clean up chunks
    try {
      await apiClient.delete(`/api/uploads/${uploadId}`);
    } catch (error) {
      console.warn('Failed to clean up upload on server:', error);
    }
  }

  /**
   * Get status of an upload
   */
  async getUploadStatus(uploadId: string): Promise<UploadProgress> {
    // Check local state first
    const localProgress = this.activeUploads.get(uploadId);
    if (localProgress) {
      return localProgress;
    }

    // Check server
    const response = await apiClient.get(`/api/uploads/${uploadId}/status`);
    return response.data;
  }

  /**
   * Get all active uploads
   */
  getActiveUploads(): UploadProgress[] {
    return Array.from(this.activeUploads.values());
  }

  /**
   * Initialize upload on server
   */
  private async initializeUpload(
    uploadId: string,
    metadata: {
      fileName: string;
      totalSize: number;
      totalChunks: number;
      mimeType: string;
      sessionId?: string;
      recordingId?: string;
    }
  ): Promise<{ uploadId: string; lastCompletedChunk: number }> {
    const response = await apiClient.post('/api/uploads/init', {
      uploadId,
      ...metadata,
    });
    return response.data;
  }

  /**
   * Upload a single chunk with retry logic
   */
  private async uploadChunkWithRetry(
    uploadId: string,
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        await this.uploadChunk(uploadId, chunk, chunkIndex, totalChunks);
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Chunk upload failed');

        // Don't retry if upload was cancelled
        if (lastError.message === 'Upload cancelled') {
          throw lastError;
        }

        // Wait before retrying with exponential backoff
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Upload a single chunk
   */
  private async uploadChunk(
    uploadId: string,
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number
  ): Promise<void> {
    const controller = new AbortController();
    this.uploadControllers.set(uploadId, controller);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());

    try {
      await apiClient.post('/api/uploads/chunk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error('Upload cancelled');
      }
      throw error;
    }
  }

  /**
   * Finalize upload on server (merge chunks)
   */
  private async finalizeUpload(
    uploadId: string,
    metadata: {
      fileName: string;
      totalSize: number;
      totalChunks: number;
      mimeType: string;
    }
  ): Promise<UploadResult> {
    const startTime = this.activeUploads.get(uploadId)?.startTime || new Date();

    const response = await apiClient.post(`/api/uploads/${uploadId}/finalize`, metadata);

    return {
      ...response.data,
      duration: Date.now() - startTime.getTime(),
    };
  }

  /**
   * Generate unique upload ID
   */
  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance for convenience
let defaultInstance: ChunkedUploadService | null = null;

export const getChunkedUploadService = (config?: ChunkedUploadConfig): ChunkedUploadService => {
  if (!defaultInstance || config) {
    defaultInstance = new ChunkedUploadService(config);
  }
  return defaultInstance;
};

export default ChunkedUploadService;
