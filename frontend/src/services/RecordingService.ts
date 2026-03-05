/**
 * RecordingService - WebRTC-based session recording with chunked upload
 * Handles audio/video recording for therapy sessions with scalable architecture
 */

export interface RecordingConfig {
  audioOnly?: boolean;
  videoBitrate?: number;
  audioBitrate?: number;
  maxChunkSize?: number; // MB
  uploadEndpoint?: string;
  recordingMode?: 'camera' | 'screen' | 'both'; // New: support different recording modes
  screenRecordingOptions?: {
    includeSystemAudio?: boolean;
    captureEntireScreen?: boolean;
    preferCurrentTab?: boolean;
  };
}

export interface RecordingMetadata {
  sessionId: string;
  participantId: string;
  startTime: Date;
  duration?: number;
  fileSize?: number;
  format: string;
  recordingMode?: 'camera' | 'screen' | 'both';
  meetingUrl?: string; // Google Meet URL if applicable
  isOnlineMeeting?: boolean;
}

export interface RecordingChunk {
  data: Blob;
  chunkIndex: number;
  timestamp: number;
  isLast: boolean;
}

export interface RecordingEvent {
  type: 'started' | 'paused' | 'resumed' | 'stopped' | 'error' | 'chunk_ready' | 'upload_progress';
  data?: any;
  timestamp: Date;
}

export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordingChunks: Blob[] = [];
  private isRecording = false;
  private startTime: Date | null = null;
  private config: RecordingConfig;
  private metadata: RecordingMetadata | null = null;
  private eventListeners: ((event: RecordingEvent) => void)[] = [];
  private uploadQueue: RecordingChunk[] = [];
  private chunkIndex = 0;

  constructor(config: RecordingConfig = {}) {
    this.config = {
      audioOnly: false,
      videoBitrate: 2500000, // 2.5 Mbps
      audioBitrate: 128000,  // 128 kbps
      maxChunkSize: 5, // 5MB chunks for scalable upload
      uploadEndpoint: '/api/recordings/upload',
      recordingMode: 'camera', // Default to camera recording
      screenRecordingOptions: {
        includeSystemAudio: true,
        captureEntireScreen: false,
        preferCurrentTab: true
      },
      ...config
    };
  }

  /**
   * Check browser compatibility for recording features
   */
  static checkCompatibility(): {
    supported: boolean;
    features: {
      mediaRecorder: boolean;
      getUserMedia: boolean;
      getDisplayMedia: boolean;
      webRTC: boolean;
    };
    recommendations?: string[];
  } {
    const navigator = window.navigator as any;
    const features = {
      mediaRecorder: typeof MediaRecorder !== 'undefined',
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      getDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
      webRTC: !!(window.RTCPeerConnection || (window as unknown as { webkitRTCPeerConnection?: typeof RTCPeerConnection }).webkitRTCPeerConnection)
    };

    const supported = features.mediaRecorder && features.getUserMedia;
    const recommendations: string[] = [];

    if (!supported) {
      if (!features.getUserMedia) {
        recommendations.push('Browser does not support camera/microphone access');
      }
      if (!features.mediaRecorder) {
        recommendations.push('Browser does not support media recording');
      }
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        recommendations.push('HTTPS required for media recording in production');
      }
    }

    return { supported, features, recommendations: recommendations.length ? recommendations : undefined };
  }

  /**
   * Start recording session with proper permission handling
   */
  async startRecording(metadata: RecordingMetadata): Promise<void> {
    try {
      if (this.isRecording) {
        throw new Error('Recording already in progress');
      }

      // Check compatibility first
      const compatibility = RecordingService.checkCompatibility();
      if (!compatibility.supported) {
        throw new Error(`Recording not supported: ${compatibility.recommendations?.join(', ')}`);
      }

      this.metadata = metadata;
      this.recordingChunks = [];
      this.chunkIndex = 0;

      // Request media permissions based on recording mode
      this.mediaStream = await this.acquireMediaStream(metadata);

      // For Google Meet, detect if we're recording a meeting
      if (metadata.meetingUrl && metadata.meetingUrl.includes('meet.google.com')) {
        metadata.isOnlineMeeting = true;
        metadata.recordingMode = this.config.recordingMode || 'screen';
      }

      // Initialize MediaRecorder with optimal settings
      const mimeType = this.selectOptimalMimeType();
      const options: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: this.config.videoBitrate,
        audioBitsPerSecond: this.config.audioBitrate
      };

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

      // Set up event handlers
      this.setupMediaRecorderEvents();

      // Start recording
      this.mediaRecorder.start(10000); // 10-second chunks for real-time processing
      this.isRecording = true;
      this.startTime = new Date();

      this.emitEvent({
        type: 'started',
        data: { metadata: this.metadata, mimeType },
        timestamp: new Date()
      });

    } catch (error) {
      await this.cleanup();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.emitEvent({
        type: 'error',
        data: { error: errorMessage, code: 'START_RECORDING_FAILED' },
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Stop recording and initiate upload process
   */
  async stopRecording(): Promise<{ recordingId: string; fileSize: number }> {
    return new Promise((resolve, reject) => {
      if (!this.isRecording || !this.mediaRecorder) {
        reject(new Error('No active recording to stop'));
        return;
      }

      const originalDataAvailable = this.mediaRecorder.ondataavailable;
      const originalStop = this.mediaRecorder.onstop;

      this.mediaRecorder.onstop = async (event) => {
        try {
          // Call original handler first
          if (originalStop && this.mediaRecorder) originalStop.call(this.mediaRecorder, event);

          const duration = this.startTime ? Date.now() - this.startTime.getTime() : 0;
          const finalBlob = new Blob(this.recordingChunks, { 
            type: this.mediaRecorder?.mimeType || 'video/webm' 
          });

          if (this.metadata) {
            this.metadata.duration = duration;
            this.metadata.fileSize = finalBlob.size;
          }

          // Start upload process
          const recordingId = await this.uploadRecording(finalBlob);

          await this.cleanup();

          this.emitEvent({
            type: 'stopped',
            data: { 
              recordingId, 
              duration, 
              fileSize: finalBlob.size,
              metadata: this.metadata 
            },
            timestamp: new Date()
          });

          resolve({ recordingId, fileSize: finalBlob.size });

        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  /**
   * Pause recording (if supported)
   */
  pauseRecording(): void {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error('No active recording to pause');
    }

    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.emitEvent({
        type: 'paused',
        timestamp: new Date()
      });
    }
  }

  /**
   * Resume paused recording
   */
  resumeRecording(): void {
    if (!this.mediaRecorder) {
      throw new Error('No recording to resume');
    }

    if (this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.emitEvent({
        type: 'resumed',
        timestamp: new Date()
      });
    }
  }

  /**
   * Get the current media stream (for visualization)
   */
  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  /**
   * Get current recording status
   */
  getStatus(): {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    chunkCount: number;
    estimatedFileSize: number;
    state: string;
  } {
    const duration = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    const estimatedFileSize = this.recordingChunks.reduce((size, chunk) => size + chunk.size, 0);

    return {
      isRecording: this.isRecording,
      isPaused: this.mediaRecorder?.state === 'paused',
      duration,
      chunkCount: this.recordingChunks.length,
      estimatedFileSize,
      state: this.mediaRecorder?.state || 'inactive'
    };
  }

  /**
   * Add event listener for recording events
   */
  addEventListener(listener: (event: RecordingEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: RecordingEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }

    this.isRecording = false;
    this.startTime = null;
    this.recordingChunks = [];
    this.uploadQueue = [];
  }

  /**
   * Private: Setup MediaRecorder event handlers
   */
  private setupMediaRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordingChunks.push(event.data);
        
        // Create chunk for upload queue
        const chunk: RecordingChunk = {
          data: event.data,
          chunkIndex: this.chunkIndex++,
          timestamp: Date.now(),
          isLast: false
        };

        this.uploadQueue.push(chunk);
        this.emitEvent({
          type: 'chunk_ready',
          data: { chunkSize: event.data.size, chunkIndex: chunk.chunkIndex },
          timestamp: new Date()
        });

        // Upload chunk if queue is getting large (for real-time upload)
        if (this.uploadQueue.length >= 3) {
          this.processUploadQueue();
        }
      }
    };

    this.mediaRecorder.onerror = (event) => {
      this.emitEvent({
        type: 'error',
        data: { error: 'MediaRecorder error', event },
        timestamp: new Date()
      });
    };
  }

  /**
   * Private: Select optimal MIME type based on browser support
   */
  private selectOptimalMimeType(): string {
    const possibleTypes = [
      'video/webm; codecs=vp9,opus',
      'video/webm; codecs=vp8,opus',
      'video/webm; codecs=h264,opus',
      'video/webm',
      'video/mp4; codecs=h264,aac',
      'video/mp4'
    ];

    if (this.config.audioOnly) {
      return MediaRecorder.isTypeSupported('audio/webm; codecs=opus') 
        ? 'audio/webm; codecs=opus'
        : 'audio/webm';
    }

    for (const type of possibleTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm'; // fallback
  }

  /**
   * Private: Upload recording with chunked approach
   */
  private async uploadRecording(blob: Blob): Promise<string> {
    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // For testing: Download the recording locally instead of uploading
    if (this.config.uploadEndpoint === '/api/recordings/upload') {
      // Testing mode - download locally
      this.downloadRecording(blob, recordingId);
      
      // Simulate upload progress
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        this.emitEvent({
          type: 'upload_progress',
          data: { 
            progress: ((i + 1) / 5) * 100,
            chunkIndex: i,
            totalChunks: 5
          },
          timestamp: new Date()
        });
      }
      
      return recordingId;
    }

    // Original upload logic for production
    const chunkSize = (this.config.maxChunkSize || 5) * 1024 * 1024; // Convert MB to bytes
    const totalChunks = Math.ceil(blob.size / chunkSize);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, blob.size);
        const chunk = blob.slice(start, end);

        await this.uploadChunk(recordingId, chunk, i, totalChunks);

        // Emit progress event
        this.emitEvent({
          type: 'upload_progress',
          data: { 
            progress: ((i + 1) / totalChunks) * 100,
            chunkIndex: i,
            totalChunks 
          },
          timestamp: new Date()
        });
      }

      return recordingId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Upload failed: ${errorMessage}`);
    }
  }

  /**
   * Private: Download recording locally for testing
   */
  private downloadRecording(blob: Blob, recordingId: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename based on metadata
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = this.config.audioOnly ? 'webm' : 'webm';
    const sessionInfo = this.metadata?.sessionId ? `_session-${this.metadata.sessionId}` : '';
    const meetingInfo = this.metadata?.isOnlineMeeting ? '_GoogleMeet' : '_InPerson';
    
    link.download = `recording_${timestamp}${sessionInfo}${meetingInfo}_${recordingId.slice(-8)}.${extension}`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    console.log(`📥 Recording downloaded locally: ${link.download}`);
    console.log(`📊 File size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`🎥 Recording mode: ${this.metadata?.recordingMode || 'camera'}`);
    console.log(`⏱️ Duration: ${this.metadata?.duration ? (this.metadata.duration / 1000).toFixed(1) + 's' : 'unknown'}`);
  }

  /**
   * Private: Upload individual chunk with retry logic
   */
  private async uploadChunk(recordingId: string, chunk: Blob, chunkIndex: number, totalChunks: number): Promise<void> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('recordingId', recordingId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('metadata', JSON.stringify(this.metadata));

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await fetch(this.config.uploadEndpoint!, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
        }

        return; // Success
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Private: Process upload queue for real-time chunk uploading
   */
  private async processUploadQueue(): Promise<void> {
    // Implementation for real-time chunk processing
    // This would upload chunks as they become available during recording
    // For now, we'll batch upload after recording stops
  }

  /**
   * Private: Acquire media stream based on recording mode
   */
  private async acquireMediaStream(metadata: RecordingMetadata): Promise<MediaStream> {
    const mode = this.config.recordingMode || 'camera';
    
    switch (mode) {
      case 'screen':
        return await this.getScreenMediaStream();
      
      case 'camera':
        return await this.getCameraMediaStream();
      
      case 'both':
        return await this.getCombinedMediaStream();
      
      default:
        throw new Error(`Unsupported recording mode: ${mode}`);
    }
  }

  /**
   * Private: Get camera/microphone media stream
   */
  private async getCameraMediaStream(): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    };

    if (!this.config.audioOnly) {
      constraints.video = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      };
    }

    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  /**
   * Private: Get screen capture media stream (for Google Meet recording)
   */
  private async getScreenMediaStream(): Promise<MediaStream> {
    try {
      const displayMediaOptions: any = {
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: this.config.screenRecordingOptions?.includeSystemAudio || false
      };

      // For Google Meet, prefer current tab capture
      if (this.config.screenRecordingOptions?.preferCurrentTab) {
        displayMediaOptions.video.mediaSource = 'tab';
      } else if (this.config.screenRecordingOptions?.captureEntireScreen) {
        displayMediaOptions.video.mediaSource = 'screen';
      } else {
        displayMediaOptions.video.mediaSource = 'window';
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      // Also get microphone audio for therapist voice
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Combine screen video with microphone audio
      const combinedStream = new MediaStream();
      
      // Add video track from screen
      screenStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      // Add audio tracks (system audio if available, microphone always)
      if (screenStream.getAudioTracks().length > 0) {
        screenStream.getAudioTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
      }
      
      audioStream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      return combinedStream;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Screen recording not available, falling back to camera:', errorMessage);
      return await this.getCameraMediaStream();
    }
  }

  /**
   * Private: Get combined camera and screen media stream
   */
  private async getCombinedMediaStream(): Promise<MediaStream> {
    try {
      const [cameraStream, screenStream] = await Promise.all([
        this.getCameraMediaStream(),
        navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: this.config.screenRecordingOptions?.includeSystemAudio || false
        })
      ]);

      // Combine both streams
      const combinedStream = new MediaStream();
      
      // Add all tracks from both streams
      [...cameraStream.getTracks(), ...screenStream.getTracks()].forEach(track => {
        combinedStream.addTrack(track);
      });

      return combinedStream;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Combined recording not available, using camera only:', errorMessage);
      return await this.getCameraMediaStream();
    }
  }

  /**
   * Private: Emit event to all listeners
   */
  private emitEvent(event: RecordingEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in recording event listener:', error);
      }
    });
  }
}

export default RecordingService;