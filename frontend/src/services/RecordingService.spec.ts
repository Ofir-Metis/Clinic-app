/**
 * RecordingService Tests - Comprehensive test suite for WebRTC recording
 */

import RecordingService, { RecordingEvent, RecordingMetadata } from './RecordingService';

// Mock MediaRecorder and related APIs
class MockMediaRecorder {
  public state: 'inactive' | 'recording' | 'paused' = 'inactive';
  public mimeType = 'video/webm';
  public ondataavailable: ((event: any) => void) | null = null;
  public onstop: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  
  private chunks: Blob[] = [];
  
  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    if (options?.mimeType) {
      this.mimeType = options.mimeType;
    }
  }

  start(timeslice?: number): void {
    this.state = 'recording';
    // Simulate data chunks
    setTimeout(() => {
      const mockBlob = new Blob(['mock chunk 1'], { type: this.mimeType });
      this.ondataavailable?.({ data: mockBlob });
    }, 100);
    
    setTimeout(() => {
      const mockBlob = new Blob(['mock chunk 2'], { type: this.mimeType });
      this.ondataavailable?.({ data: mockBlob });
    }, 200);
  }

  stop(): void {
    this.state = 'inactive';
    setTimeout(() => {
      this.onstop?.({});
    }, 50);
  }

  pause(): void {
    this.state = 'paused';
  }

  resume(): void {
    this.state = 'recording';
  }

  static isTypeSupported(mimeType: string): boolean {
    return ['video/webm', 'audio/webm', 'video/mp4'].includes(mimeType.split(';')[0]);
  }
}

class MockMediaStream {
  private tracks: MockMediaStreamTrack[] = [];

  constructor() {
    this.tracks = [
      new MockMediaStreamTrack('audio', 'audio-track-1'),
      new MockMediaStreamTrack('video', 'video-track-1')
    ];
  }

  getTracks(): MockMediaStreamTrack[] {
    return this.tracks;
  }
}

class MockMediaStreamTrack {
  public kind: string;
  public id: string;
  public enabled = true;

  constructor(kind: string, id: string) {
    this.kind = kind;
    this.id = id;
  }

  stop(): void {
    this.enabled = false;
  }
}

// Mock global objects
const mockGetUserMedia = jest.fn();
const mockFetch = jest.fn();

// Setup global mocks
beforeAll(() => {
  // Mock MediaRecorder
  (global as any).MediaRecorder = MockMediaRecorder;
  
  // Mock navigator.mediaDevices
  Object.defineProperty(global.navigator, 'mediaDevices', {
    writable: true,
    value: { getUserMedia: mockGetUserMedia }
  });

  // Mock fetch
  global.fetch = mockFetch;

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: { protocol: 'https:', hostname: 'localhost' },
    writable: true
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(() => 'mock-token'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });
});

describe('RecordingService', () => {
  let recordingService: RecordingService;
  let mockMediaStream: MockMediaStream;

  beforeEach(() => {
    recordingService = new RecordingService();
    mockMediaStream = new MockMediaStream();
    
    // Reset mocks
    mockGetUserMedia.mockClear();
    mockFetch.mockClear();
    
    // Default successful responses
    mockGetUserMedia.mockResolvedValue(mockMediaStream);
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(async () => {
    await recordingService.cleanup();
  });

  describe('Compatibility Checking', () => {
    it('should detect browser compatibility correctly', () => {
      const compatibility = RecordingService.checkCompatibility();
      
      expect(compatibility.supported).toBe(true);
      expect(compatibility.features.mediaRecorder).toBe(true);
      expect(compatibility.features.getUserMedia).toBe(true);
    });

    it('should provide recommendations for unsupported browsers', () => {
      // Mock unsupported browser
      delete (global as any).MediaRecorder;
      
      const compatibility = RecordingService.checkCompatibility();
      
      expect(compatibility.supported).toBe(false);
      expect(compatibility.recommendations).toContain('Browser does not support media recording');
      
      // Restore for other tests
      (global as any).MediaRecorder = MockMediaRecorder;
    });

    it('should warn about HTTP protocol in production', () => {
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'example.com' },
        writable: true
      });

      const compatibility = RecordingService.checkCompatibility();
      
      expect(compatibility.recommendations).toContain('HTTPS required for media recording in production');
      
      // Restore
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:', hostname: 'localhost' },
        writable: true
      });
    });
  });

  describe('Recording Lifecycle', () => {
    const mockMetadata: RecordingMetadata = {
      sessionId: 'session-123',
      participantId: 'participant-456',
      startTime: new Date(),
      format: 'video/webm'
    };

    it('should start recording successfully', async () => {
      const events: RecordingEvent[] = [];
      recordingService.addEventListener(event => events.push(event));

      await recordingService.startRecording(mockMetadata);

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });

      const status = recordingService.getStatus();
      expect(status.isRecording).toBe(true);
      expect(status.state).toBe('recording');

      // Check that started event was emitted
      expect(events.some(e => e.type === 'started')).toBe(true);
    });

    it('should handle audio-only recording', async () => {
      const audioOnlyService = new RecordingService({ audioOnly: true });
      
      await audioOnlyService.startRecording(mockMetadata);

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      await audioOnlyService.cleanup();
    });

    it('should stop recording and return recording details', async () => {
      await recordingService.startRecording(mockMetadata);
      
      // Wait for recording to start
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = await recordingService.stopRecording();

      expect(result).toHaveProperty('recordingId');
      expect(result).toHaveProperty('fileSize');
      expect(typeof result.recordingId).toBe('string');
      expect(typeof result.fileSize).toBe('number');

      const status = recordingService.getStatus();
      expect(status.isRecording).toBe(false);
    });

    it('should handle pause and resume functionality', async () => {
      await recordingService.startRecording(mockMetadata);

      recordingService.pauseRecording();
      let status = recordingService.getStatus();
      expect(status.isPaused).toBe(true);

      recordingService.resumeRecording();
      status = recordingService.getStatus();
      expect(status.isPaused).toBe(false);
    });

    it('should throw error when trying to start recording twice', async () => {
      await recordingService.startRecording(mockMetadata);

      await expect(recordingService.startRecording(mockMetadata))
        .rejects.toThrow('Recording already in progress');
    });

    it('should throw error when stopping non-active recording', async () => {
      await expect(recordingService.stopRecording())
        .rejects.toThrow('No active recording to stop');
    });
  });

  describe('Event System', () => {
    it('should emit recording events correctly', async () => {
      const events: RecordingEvent[] = [];
      recordingService.addEventListener(event => events.push(event));

      const mockMetadata: RecordingMetadata = {
        sessionId: 'session-123',
        participantId: 'participant-456',
        startTime: new Date(),
        format: 'video/webm'
      };

      await recordingService.startRecording(mockMetadata);
      
      // Wait for chunks to be generated
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'started')).toBe(true);
      expect(events.some(e => e.type === 'chunk_ready')).toBe(true);
    });

    it('should remove event listeners correctly', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      recordingService.addEventListener(listener1);
      recordingService.addEventListener(listener2);
      recordingService.removeEventListener(listener1);

      // Emit a mock event
      (recordingService as any).emitEvent({
        type: 'started',
        timestamp: new Date()
      });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('Upload Functionality', () => {
    it('should upload recording in chunks', async () => {
      const mockMetadata: RecordingMetadata = {
        sessionId: 'session-123',
        participantId: 'participant-456',
        startTime: new Date(),
        format: 'video/webm'
      };

      await recordingService.startRecording(mockMetadata);
      await new Promise(resolve => setTimeout(resolve, 250));
      await recordingService.stopRecording();

      // Verify chunked upload calls
      expect(mockFetch).toHaveBeenCalled();
      
      const fetchCalls = mockFetch.mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);

      // Verify upload endpoint and headers
      const [url, options] = fetchCalls[0];
      expect(options.method).toBe('POST');
      expect(options.headers.Authorization).toBe('Bearer mock-token');
      expect(options.body).toBeInstanceOf(FormData);
    });

    it('should handle upload failures with retry logic', async () => {
      // Mock fetch to fail initially then succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const mockMetadata: RecordingMetadata = {
        sessionId: 'session-123',
        participantId: 'participant-456',
        startTime: new Date(),
        format: 'video/webm'
      };

      await recordingService.startRecording(mockMetadata);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should succeed after retries
      const result = await recordingService.stopRecording();
      expect(result.recordingId).toBeDefined();
    });

    it('should emit upload progress events', async () => {
      const events: RecordingEvent[] = [];
      recordingService.addEventListener(event => {
        if (event.type === 'upload_progress') {
          events.push(event);
        }
      });

      const mockMetadata: RecordingMetadata = {
        sessionId: 'session-123',
        participantId: 'participant-456',
        startTime: new Date(),
        format: 'video/webm'
      };

      await recordingService.startRecording(mockMetadata);
      await new Promise(resolve => setTimeout(resolve, 100));
      await recordingService.stopRecording();

      const progressEvents = events.filter(e => e.type === 'upload_progress');
      expect(progressEvents.length).toBeGreaterThan(0);
      
      if (progressEvents.length > 0) {
        expect(progressEvents[0].data).toHaveProperty('progress');
        expect(progressEvents[0].data).toHaveProperty('chunkIndex');
        expect(progressEvents[0].data).toHaveProperty('totalChunks');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle getUserMedia permission denied', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      const mockMetadata: RecordingMetadata = {
        sessionId: 'session-123',
        participantId: 'participant-456',
        startTime: new Date(),
        format: 'video/webm'
      };

      await expect(recordingService.startRecording(mockMetadata))
        .rejects.toThrow('Permission denied');
    });

    it('should emit error events for MediaRecorder errors', async () => {
      const events: RecordingEvent[] = [];
      recordingService.addEventListener(event => events.push(event));

      const mockMetadata: RecordingMetadata = {
        sessionId: 'session-123',
        participantId: 'participant-456',
        startTime: new Date(),
        format: 'video/webm'
      };

      await recordingService.startRecording(mockMetadata);

      // Simulate MediaRecorder error
      const mockRecorder = (recordingService as any).mediaRecorder;
      mockRecorder.onerror({ error: 'Mock error' });

      const errorEvents = events.filter(e => e.type === 'error');
      expect(errorEvents.length).toBeGreaterThan(0);
    });

    it('should handle cleanup on error', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Device not found'));

      const mockMetadata: RecordingMetadata = {
        sessionId: 'session-123',
        participantId: 'participant-456',
        startTime: new Date(),
        format: 'video/webm'
      };

      try {
        await recordingService.startRecording(mockMetadata);
      } catch (error) {
        // Expected error
      }

      const status = recordingService.getStatus();
      expect(status.isRecording).toBe(false);
    });
  });

  describe('Status and Monitoring', () => {
    it('should provide accurate recording status', async () => {
      const mockMetadata: RecordingMetadata = {
        sessionId: 'session-123',
        participantId: 'participant-456',
        startTime: new Date(),
        format: 'video/webm'
      };

      let status = recordingService.getStatus();
      expect(status.isRecording).toBe(false);
      expect(status.duration).toBe(0);

      await recordingService.startRecording(mockMetadata);
      
      status = recordingService.getStatus();
      expect(status.isRecording).toBe(true);
      expect(status.state).toBe('recording');
      expect(status.duration).toBeGreaterThan(0);
    });

    it('should track file size estimation', async () => {
      const mockMetadata: RecordingMetadata = {
        sessionId: 'session-123',
        participantId: 'participant-456',
        startTime: new Date(),
        format: 'video/webm'
      };

      await recordingService.startRecording(mockMetadata);
      await new Promise(resolve => setTimeout(resolve, 250));

      const status = recordingService.getStatus();
      expect(status.estimatedFileSize).toBeGreaterThan(0);
      expect(status.chunkCount).toBeGreaterThan(0);
    });
  });

  describe('Configuration Options', () => {
    it('should apply custom configuration', () => {
      const customConfig = {
        audioOnly: true,
        videoBitrate: 1000000,
        audioBitrate: 64000,
        maxChunkSize: 10,
        uploadEndpoint: '/custom/upload'
      };

      const customService = new RecordingService(customConfig);
      
      expect((customService as any).config.audioOnly).toBe(true);
      expect((customService as any).config.videoBitrate).toBe(1000000);
      expect((customService as any).config.audioBitrate).toBe(64000);
      expect((customService as any).config.maxChunkSize).toBe(10);
      expect((customService as any).config.uploadEndpoint).toBe('/custom/upload');
    });

    it('should use default configuration when none provided', () => {
      const defaultService = new RecordingService();
      
      expect((defaultService as any).config.audioOnly).toBe(false);
      expect((defaultService as any).config.videoBitrate).toBe(2500000);
      expect((defaultService as any).config.audioBitrate).toBe(128000);
      expect((defaultService as any).config.maxChunkSize).toBe(5);
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should stop all media tracks on cleanup', async () => {
      const mockMetadata: RecordingMetadata = {
        sessionId: 'session-123',
        participantId: 'participant-456',
        startTime: new Date(),
        format: 'video/webm'
      };

      await recordingService.startRecording(mockMetadata);
      
      const tracks = mockMediaStream.getTracks();
      await recordingService.cleanup();

      tracks.forEach(track => {
        expect(track.enabled).toBe(false);
      });
    });

    it('should reset all internal state on cleanup', async () => {
      const mockMetadata: RecordingMetadata = {
        sessionId: 'session-123',
        participantId: 'participant-456',
        startTime: new Date(),
        format: 'video/webm'
      };

      await recordingService.startRecording(mockMetadata);
      await recordingService.cleanup();

      const status = recordingService.getStatus();
      expect(status.isRecording).toBe(false);
      expect(status.chunkCount).toBe(0);
      expect(status.estimatedFileSize).toBe(0);
    });
  });
});