/**
 * RecordingBackupService - Auto-backup recordings to IndexedDB every 30 seconds
 * Features: Browser crash recovery, chunk management, recovery dialog
 */

const DB_NAME = 'ClinicRecordingBackups';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';
const BACKUP_INTERVAL = 30000; // 30 seconds

export interface RecordingBackup {
  id: string;
  sessionId: string;
  participantId: string;
  chunks: Blob[];
  metadata: {
    startTime: Date;
    lastUpdate: Date;
    duration: number;
    fileSize: number;
    mimeType: string;
    recordingMode: 'camera' | 'screen' | 'both';
    meetingUrl?: string;
  };
  status: 'recording' | 'interrupted' | 'recovered' | 'deleted';
}

export interface RecoveryInfo {
  recordingId: string;
  sessionId: string;
  duration: number;
  fileSize: number;
  lastUpdate: Date;
  recoverable: boolean;
}

export class RecordingBackupService {
  private db: IDBDatabase | null = null;
  private backupInterval: ReturnType<typeof setInterval> | null = null;
  private currentRecordingId: string | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDB(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB for recording backups');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('sessionId', 'sessionId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('lastUpdate', 'metadata.lastUpdate', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure database is ready
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDB();
    }
    if (!this.db) {
      throw new Error('IndexedDB not available');
    }
    return this.db;
  }

  /**
   * Start auto-backup for a recording
   */
  async startAutoBackup(
    recordingId: string,
    sessionId: string,
    participantId: string,
    mediaRecorder: MediaRecorder,
    metadata: {
      mimeType: string;
      recordingMode: 'camera' | 'screen' | 'both';
      meetingUrl?: string;
    }
  ): Promise<void> {
    await this.ensureDB();

    this.currentRecordingId = recordingId;
    this.mediaRecorder = mediaRecorder;

    // Create initial backup record
    const backup: RecordingBackup = {
      id: recordingId,
      sessionId,
      participantId,
      chunks: [],
      metadata: {
        startTime: new Date(),
        lastUpdate: new Date(),
        duration: 0,
        fileSize: 0,
        mimeType: metadata.mimeType,
        recordingMode: metadata.recordingMode,
        meetingUrl: metadata.meetingUrl,
      },
      status: 'recording',
    };

    await this.saveBackup(backup);

    // Set up data available handler to save chunks
    const originalOnDataAvailable = mediaRecorder.ondataavailable;
    mediaRecorder.ondataavailable = async (event) => {
      if (event.data && event.data.size > 0) {
        await this.saveChunk(recordingId, event.data);
      }

      // Call original handler if it exists
      if (originalOnDataAvailable) {
        originalOnDataAvailable.call(mediaRecorder, event);
      }
    };

    // Request data every 30 seconds for backup
    this.backupInterval = setInterval(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.requestData();
      }
    }, BACKUP_INTERVAL);

    console.log(`[Backup] Auto-backup started for recording ${recordingId}`);
  }

  /**
   * Stop auto-backup and optionally clean up
   */
  async stopAutoBackup(recordingId: string, keepBackup = false): Promise<void> {
    // Clear interval
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }

    this.currentRecordingId = null;
    this.mediaRecorder = null;

    if (!keepBackup) {
      await this.deleteBackup(recordingId);
      console.log(`[Backup] Auto-backup stopped and cleaned up for ${recordingId}`);
    } else {
      // Mark as interrupted if we're keeping it
      await this.updateBackupStatus(recordingId, 'interrupted');
      console.log(`[Backup] Auto-backup stopped but preserved for ${recordingId}`);
    }
  }

  /**
   * Save a chunk to the backup
   */
  private async saveChunk(recordingId: string, chunk: Blob): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(recordingId);

      request.onsuccess = () => {
        const backup: RecordingBackup = request.result;
        if (!backup) {
          reject(new Error('Backup not found'));
          return;
        }

        backup.chunks.push(chunk);
        backup.metadata.lastUpdate = new Date();
        backup.metadata.fileSize = backup.chunks.reduce((size, c) => size + c.size, 0);
        backup.metadata.duration = Date.now() - backup.metadata.startTime.getTime();

        const putRequest = store.put(backup);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save a backup record
   */
  private async saveBackup(backup: RecordingBackup): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(backup);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update backup status
   */
  private async updateBackupStatus(
    recordingId: string,
    status: RecordingBackup['status']
  ): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(recordingId);

      request.onsuccess = () => {
        const backup: RecordingBackup = request.result;
        if (!backup) {
          resolve();
          return;
        }

        backup.status = status;
        backup.metadata.lastUpdate = new Date();

        const putRequest = store.put(backup);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending (interrupted) recordings for recovery
   */
  async getPendingRecoveries(): Promise<RecoveryInfo[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll(IDBKeyRange.only('interrupted'));

      request.onsuccess = () => {
        const backups: RecordingBackup[] = request.result;
        const recoveries: RecoveryInfo[] = backups.map(backup => ({
          recordingId: backup.id,
          sessionId: backup.sessionId,
          duration: backup.metadata.duration,
          fileSize: backup.metadata.fileSize,
          lastUpdate: new Date(backup.metadata.lastUpdate),
          recoverable: backup.chunks.length > 0,
        }));
        resolve(recoveries);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Recover a recording from backup
   */
  async recoverRecording(recordingId: string): Promise<Blob | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(recordingId);

      request.onsuccess = () => {
        const backup: RecordingBackup = request.result;
        if (!backup || backup.chunks.length === 0) {
          resolve(null);
          return;
        }

        // Merge all chunks into a single Blob
        const blob = new Blob(backup.chunks, { type: backup.metadata.mimeType });
        resolve(blob);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get backup metadata
   */
  async getBackupMetadata(recordingId: string): Promise<RecordingBackup['metadata'] | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(recordingId);

      request.onsuccess = () => {
        const backup: RecordingBackup = request.result;
        resolve(backup?.metadata || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a backup
   */
  async deleteBackup(recordingId: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(recordingId);

      request.onsuccess = () => {
        console.log(`[Backup] Deleted backup for ${recordingId}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clean up old backups (older than 24 hours)
   */
  async cleanupOldBackups(maxAgeMs = 24 * 60 * 60 * 1000): Promise<number> {
    const db = await this.ensureDB();
    const cutoff = Date.now() - maxAgeMs;
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          const backup: RecordingBackup = cursor.value;
          const lastUpdate = new Date(backup.metadata.lastUpdate).getTime();

          if (lastUpdate < cutoff && backup.status !== 'recording') {
            cursor.delete();
            deletedCount++;
          }

          cursor.continue();
        } else {
          console.log(`[Backup] Cleaned up ${deletedCount} old backups`);
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage usage estimate
   */
  async getStorageUsage(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
      };
    }
    return { used: 0, available: 0 };
  }
}

// Singleton instance
let instance: RecordingBackupService | null = null;

export const getRecordingBackupService = (): RecordingBackupService => {
  if (!instance) {
    instance = new RecordingBackupService();
  }
  return instance;
};

export default RecordingBackupService;
