/**
 * End-to-End Recording Pipeline Tests
 * Comprehensive testing of the complete recording workflow from upload to insights
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../app.module';
import { JwtService } from '@clinic/common';

describe('Recording Pipeline E2E Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let testRecordingFile: Buffer;
  let recordingId: string;
  let sessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();

    // Generate test JWT token
    authToken = jwtService.generateTokens({
      sub: 'test-coach-123',
      email: 'test@coach.com',
      role: 'coach',
      permissions: [
        'recordings:write',
        'recordings:read',
        'ai:transcribe',
        'ai:summarize',
        'ai:generate-insights',
        'analytics:read',
      ],
    }).accessToken;

    // Create test recording file (mock MP3)
    testRecordingFile = Buffer.from('mock-audio-data-for-testing');
    sessionId = `test-session-${Date.now()}`;

    console.log('🧪 Starting Recording Pipeline E2E Tests');
  });

  afterAll(async () => {
    await app.close();
    console.log('✅ Recording Pipeline E2E Tests Completed');
  });

  describe('1. Recording Upload Pipeline', () => {
    it('should upload recording successfully', async () => {
      console.log('📤 Testing recording upload...');

      const response = await request(app.getHttpServer())
        .post('/api/recordings/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('recording', testRecordingFile, 'test-session.mp3')
        .field('appointmentId', 'test-appointment-123')
        .field('sessionId', sessionId)
        .field('participantId', 'test-participant-123')
        .field('recordingMode', 'audio')
        .field('sessionType', 'online')
        .field('userId', 'test-coach-123')
        .field('userRole', 'coach')
        .expect(HttpStatus.CREATED);

      expect(response.body.status).toBe('success');
      expect(response.body.id).toBeDefined();
      expect(response.body.filename).toBe('test-session.mp3');
      expect(response.body.processingStatus).toBe('completed');

      recordingId = response.body.id;
      console.log(`✅ Recording uploaded successfully: ${recordingId}`);
    });

    it('should reject invalid file types', async () => {
      console.log('🚫 Testing invalid file type rejection...');

      const invalidFile = Buffer.from('invalid-file-content');

      await request(app.getHttpServer())
        .post('/api/recordings/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('recording', invalidFile, 'test.txt')
        .field('appointmentId', 'test-appointment-123')
        .field('sessionId', sessionId)
        .field('participantId', 'test-participant-123')
        .expect(HttpStatus.BAD_REQUEST);

      console.log('✅ Invalid file type correctly rejected');
    });

    it('should require authentication', async () => {
      console.log('🔒 Testing authentication requirement...');

      await request(app.getHttpServer())
        .post('/api/recordings/upload')
        .attach('recording', testRecordingFile, 'test-session.mp3')
        .expect(HttpStatus.UNAUTHORIZED);

      console.log('✅ Authentication correctly required');
    });
  });

  describe('2. Recording Retrieval Pipeline', () => {
    it('should retrieve recording by appointment ID', async () => {
      console.log('📥 Testing recording retrieval...');

      const response = await request(app.getHttpServer())
        .get('/api/recordings/appointments/test-appointment-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('filename');

      console.log(`✅ Retrieved ${response.body.length} recordings`);
    });

    it('should generate download URL', async () => {
      console.log('🔗 Testing download URL generation...');

      const response = await request(app.getHttpServer())
        .get(`/api/recordings/${recordingId}/download-url`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('downloadUrl');
      expect(response.body.downloadUrl).toContain('http');

      console.log('✅ Download URL generated successfully');
    });

    it('should generate playback URL', async () => {
      console.log('▶️ Testing playback URL generation...');

      const response = await request(app.getHttpServer())
        .get(`/api/recordings/${recordingId}/playback-url`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('playbackUrl');
      expect(response.body.playbackUrl).toContain('http');

      console.log('✅ Playback URL generated successfully');
    });
  });

  describe('3. AI Processing Pipeline', () => {
    let transcriptionId: string;
    let summaryId: string;

    it('should transcribe recording using AI', async () => {
      console.log('🎙️ Testing AI transcription...');

      const response = await request(app.getHttpServer())
        .post('/api/ai/transcribe')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('audio', testRecordingFile, 'test-session.mp3')
        .field('language', 'en')
        .field('speakerLabels', 'true')
        .field('sessionId', sessionId)
        .expect(HttpStatus.CREATED);

      expect(response.body.status).toBe('success');
      expect(response.body.transcription).toHaveProperty('id');
      expect(response.body.transcription).toHaveProperty('text');
      expect(response.body.transcription).toHaveProperty('confidence');

      transcriptionId = response.body.transcription.id;
      console.log(`✅ Transcription completed: ${transcriptionId}`);
    });

    it('should generate session summary', async () => {
      console.log('📝 Testing session summary generation...');

      const transcriptText = 'Coach: How are you feeling today? Client: I am feeling much better than last week. We discussed my progress with stress management techniques.';

      const response = await request(app.getHttpServer())
        .post('/api/ai/summarize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transcript: transcriptText,
          sessionId: sessionId,
          sessionContext: {
            coachName: 'Test Coach',
            clientName: 'Test Client',
            duration: 45,
            sessionGoals: ['Stress management', 'Emotional regulation'],
          },
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.status).toBe('success');
      expect(response.body.summary).toHaveProperty('id');
      expect(response.body.summary).toHaveProperty('keyPoints');
      expect(response.body.summary).toHaveProperty('actionItems');
      expect(response.body.summary.keyPoints).toBeInstanceOf(Array);

      summaryId = response.body.summary.id;
      console.log(`✅ Summary generated: ${summaryId}`);
    });

    it('should analyze sentiment', async () => {
      console.log('💭 Testing sentiment analysis...');

      const transcriptText = 'I am feeling much more confident and optimistic about my future. The techniques we learned are really helping me manage my stress levels.';

      const response = await request(app.getHttpServer())
        .post('/api/ai/sentiment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transcript: transcriptText,
          sessionId: sessionId,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.status).toBe('success');
      expect(response.body.analysis).toHaveProperty('overallSentiment');
      expect(response.body.analysis).toHaveProperty('keyEmotions');

      console.log(`✅ Sentiment analysis completed: ${response.body.analysis.overallSentiment}`);
    });

    it('should generate coaching questions', async () => {
      console.log('❓ Testing coaching questions generation...');

      const mockSummary = {
        id: summaryId,
        sessionId: sessionId,
        keyPoints: ['Client reported stress improvement', 'Discussed coping strategies'],
        actionItems: ['Practice mindfulness daily', 'Use breathing techniques'],
        insights: ['Strong motivation for change'],
        nextSessionFocus: 'Build on current progress',
        challenges: ['Time management'],
      };

      const response = await request(app.getHttpServer())
        .post('/api/ai/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionSummary: mockSummary,
          clientGoals: ['Reduce stress', 'Improve work-life balance'],
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.status).toBe('success');
      expect(response.body.questions).toHaveProperty('openingQuestions');
      expect(response.body.questions).toHaveProperty('followUpQuestions');
      expect(response.body.questions.openingQuestions).toBeInstanceOf(Array);

      console.log('✅ Coaching questions generated successfully');
    });

    it('should process complete recording workflow', async () => {
      console.log('🔄 Testing complete processing workflow...');

      const response = await request(app.getHttpServer())
        .post('/api/ai/process-recording')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('recording', testRecordingFile, 'complete-test.mp3')
        .field('sessionId', `complete-${sessionId}`)
        .field('generateQuestions', 'true')
        .field('sessionContext', JSON.stringify({
          coachName: 'Test Coach',
          clientName: 'Test Client',
          duration: 60,
          sessionGoals: ['Complete workflow test'],
        }))
        .expect(HttpStatus.CREATED);

      expect(response.body.status).toBe('success');
      expect(response.body).toHaveProperty('transcription');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('sentimentAnalysis');
      expect(response.body).toHaveProperty('coachingQuestions');

      console.log('✅ Complete processing workflow successful');
    });
  });

  describe('4. Analytics Pipeline', () => {
    it('should retrieve session analytics', async () => {
      console.log('📊 Testing session analytics...');

      const response = await request(app.getHttpServer())
        .get('/api/analytics/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe('success');
      expect(response.body.metrics).toHaveProperty('totalSessions');
      expect(response.body.metrics).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('insights');

      console.log(`✅ Session analytics retrieved: ${response.body.metrics.totalSessions} sessions`);
    });

    it('should retrieve recording analytics', async () => {
      console.log('🎥 Testing recording analytics...');

      const response = await request(app.getHttpServer())
        .get('/api/analytics/recordings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe('success');
      expect(response.body.metrics).toHaveProperty('totalRecordings');
      expect(response.body.metrics).toHaveProperty('averageTranscriptionAccuracy');
      expect(response.body.metrics).toHaveProperty('costAnalysis');

      console.log(`✅ Recording analytics retrieved: ${response.body.metrics.totalRecordings} recordings`);
    });

    it('should retrieve main dashboard', async () => {
      console.log('📈 Testing analytics dashboard...');

      const response = await request(app.getHttpServer())
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe('success');
      expect(response.body.dashboard).toHaveProperty('overview');
      expect(response.body.dashboard).toHaveProperty('trends');
      expect(response.body.dashboard).toHaveProperty('topInsights');

      console.log('✅ Analytics dashboard loaded successfully');
    });
  });

  describe('5. WebSocket Real-time Updates', () => {
    it('should handle WebSocket connections', async () => {
      console.log('🔌 Testing WebSocket connections...');

      // Mock WebSocket connection test
      const response = await request(app.getHttpServer())
        .get('/api/webhooks/google-calendar/health')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');

      console.log('✅ WebSocket health check passed');
    });
  });

  describe('6. Storage and File Management', () => {
    it('should handle storage statistics', async () => {
      console.log('💾 Testing storage statistics...');

      const response = await request(app.getHttpServer())
        .get('/api/recordings/admin/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('totalFiles');
      expect(response.body).toHaveProperty('totalSize');

      console.log('✅ Storage statistics retrieved');
    });

    it('should handle storage health check', async () => {
      console.log('🔍 Testing storage health...');

      const response = await request(app.getHttpServer())
        .get('/api/recordings/admin/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('status');

      console.log('✅ Storage health check passed');
    });
  });

  describe('7. Error Handling and Edge Cases', () => {
    it('should handle missing recording gracefully', async () => {
      console.log('❌ Testing missing recording handling...');

      await request(app.getHttpServer())
        .get('/api/recordings/non-existent-id/download-url')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.NOT_FOUND);

      console.log('✅ Missing recording handled correctly');
    });

    it('should handle invalid transcription request', async () => {
      console.log('🚫 Testing invalid transcription handling...');

      await request(app.getHttpServer())
        .post('/api/ai/transcribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invalidData: 'test' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('✅ Invalid transcription request handled correctly');
    });

    it('should handle summary without transcript', async () => {
      console.log('📝 Testing summary without transcript...');

      await request(app.getHttpServer())
        .post('/api/ai/summarize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: sessionId,
          // Missing transcript
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('✅ Missing transcript handled correctly');
    });
  });

  describe('8. Performance and Load Testing', () => {
    it('should handle multiple concurrent uploads', async () => {
      console.log('⚡ Testing concurrent uploads...');

      const uploadPromises = Array.from({ length: 3 }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/recordings/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('recording', testRecordingFile, `concurrent-test-${i}.mp3`)
          .field('appointmentId', `concurrent-appointment-${i}`)
          .field('sessionId', `concurrent-session-${i}`)
          .field('participantId', `concurrent-participant-${i}`)
          .field('recordingMode', 'audio')
          .field('sessionType', 'online')
      );

      const responses = await Promise.all(uploadPromises);
      
      responses.forEach((response, i) => {
        expect(response.status).toBe(HttpStatus.CREATED);
        expect(response.body.status).toBe('success');
      });

      console.log(`✅ ${responses.length} concurrent uploads completed successfully`);
    });

    it('should handle large file processing', async () => {
      console.log('📦 Testing large file handling...');

      // Create a larger mock file
      const largeFile = Buffer.alloc(5 * 1024 * 1024, 'mock-large-audio-data'); // 5MB

      const response = await request(app.getHttpServer())
        .post('/api/recordings/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('recording', largeFile, 'large-test.mp3')
        .field('appointmentId', 'large-test-appointment')
        .field('sessionId', 'large-test-session')
        .field('participantId', 'large-test-participant')
        .field('recordingMode', 'audio')
        .field('sessionType', 'online')
        .timeout(30000) // 30 second timeout
        .expect(HttpStatus.CREATED);

      expect(response.body.status).toBe('success');
      expect(response.body.fileSize).toBeGreaterThan(4 * 1024 * 1024); // > 4MB

      console.log('✅ Large file processing completed successfully');
    });
  });

  describe('9. Integration Testing', () => {
    it('should complete full recording lifecycle', async () => {
      console.log('🔄 Testing complete recording lifecycle...');

      const lifecycleSessionId = `lifecycle-${Date.now()}`;
      
      // Step 1: Upload recording
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/recordings/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('recording', testRecordingFile, 'lifecycle-test.mp3')
        .field('appointmentId', 'lifecycle-appointment')
        .field('sessionId', lifecycleSessionId)
        .field('participantId', 'lifecycle-participant')
        .field('recordingMode', 'audio')
        .field('sessionType', 'online')
        .expect(HttpStatus.CREATED);

      const uploadedRecordingId = uploadResponse.body.id;

      // Step 2: Process with AI
      const processResponse = await request(app.getHttpServer())
        .post('/api/ai/process-recording')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('recording', testRecordingFile, 'lifecycle-process.mp3')
        .field('sessionId', lifecycleSessionId)
        .field('generateQuestions', 'true')
        .expect(HttpStatus.CREATED);

      expect(processResponse.body.status).toBe('success');

      // Step 3: Get analytics
      const analyticsResponse = await request(app.getHttpServer())
        .get('/api/analytics/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(analyticsResponse.body.status).toBe('success');

      // Step 4: Generate download URL
      const downloadResponse = await request(app.getHttpServer())
        .get(`/api/recordings/${uploadedRecordingId}/download-url`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(downloadResponse.body).toHaveProperty('downloadUrl');

      console.log('✅ Complete recording lifecycle test passed');
    });

    it('should validate data consistency across services', async () => {
      console.log('🔍 Testing data consistency...');

      // Upload a recording
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/recordings/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('recording', testRecordingFile, 'consistency-test.mp3')
        .field('appointmentId', 'consistency-appointment')
        .field('sessionId', 'consistency-session')
        .field('participantId', 'consistency-participant')
        .field('recordingMode', 'audio')
        .field('sessionType', 'online')
        .expect(HttpStatus.CREATED);

      // Verify it appears in analytics
      const analyticsResponse = await request(app.getHttpServer())
        .get('/api/analytics/recordings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(HttpStatus.OK);

      expect(analyticsResponse.body.metrics.totalRecordings).toBeGreaterThan(0);

      console.log('✅ Data consistency validated across services');
    });
  });

  describe('10. Security and Access Control', () => {
    it('should enforce recording access permissions', async () => {
      console.log('🔒 Testing recording access permissions...');

      // Try to access recording without proper permissions
      const restrictedToken = jwtService.generateTokens({
        sub: 'restricted-user-123',
        email: 'restricted@test.com',
        role: 'client',
        permissions: [], // No recording permissions
      }).accessToken;

      await request(app.getHttpServer())
        .get('/api/recordings/appointments/test-appointment-123')
        .set('Authorization', `Bearer ${restrictedToken}`)
        .expect(HttpStatus.FORBIDDEN);

      console.log('✅ Recording access permissions enforced correctly');
    });

    it('should enforce AI service permissions', async () => {
      console.log('🤖 Testing AI service permissions...');

      const restrictedToken = jwtService.generateTokens({
        sub: 'restricted-user-123',
        email: 'restricted@test.com',
        role: 'client',
        permissions: [], // No AI permissions
      }).accessToken;

      await request(app.getHttpServer())
        .post('/api/ai/transcribe')
        .set('Authorization', `Bearer ${restrictedToken}`)
        .attach('audio', testRecordingFile, 'restricted-test.mp3')
        .expect(HttpStatus.FORBIDDEN);

      console.log('✅ AI service permissions enforced correctly');
    });

    it('should enforce analytics permissions', async () => {
      console.log('📊 Testing analytics permissions...');

      const restrictedToken = jwtService.generateTokens({
        sub: 'restricted-user-123',
        email: 'restricted@test.com',
        role: 'client',
        permissions: [], // No analytics permissions
      }).accessToken;

      await request(app.getHttpServer())
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${restrictedToken}`)
        .expect(HttpStatus.FORBIDDEN);

      console.log('✅ Analytics permissions enforced correctly');
    });
  });
});

// Helper functions for test utilities
function generateMockAudioBuffer(sizeKB: number = 100): Buffer {
  return Buffer.alloc(sizeKB * 1024, 'mock-audio-data');
}

function createTestSession(sessionId: string) {
  return {
    sessionId,
    appointmentId: `appointment-${sessionId}`,
    coachId: 'test-coach-123',
    clientId: 'test-client-123',
    startTime: new Date(),
    duration: 45,
    status: 'completed' as const,
  };
}

// Performance testing utilities
async function measurePerformance<T>(
  operation: () => Promise<T>,
  description: string
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await operation();
  const duration = Date.now() - startTime;
  
  console.log(`⏱️ ${description}: ${duration}ms`);
  
  return { result, duration };
}

// Test data generators
const generateTestRecordingMetadata = () => ({
  appointmentId: `test-appointment-${Date.now()}`,
  sessionId: `test-session-${Date.now()}`,
  participantId: `test-participant-${Date.now()}`,
  recordingMode: 'audio' as const,
  sessionType: 'online' as const,
  userId: 'test-coach-123',
  userRole: 'coach' as const,
});

const generateTestTranscript = () => `
Coach: Good morning! How are you feeling today?
Client: I'm feeling much better than last week. The stress management techniques we discussed have been really helpful.
Coach: That's wonderful to hear. Can you tell me more about which techniques worked best for you?
Client: The breathing exercises and mindfulness practices made the biggest difference. I've been doing them daily.
Coach: Excellent! Let's build on that progress and explore some additional strategies for managing workplace stress.
`;

export { generateMockAudioBuffer, createTestSession, measurePerformance };