import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BaseIntegrationTest } from '../integration-test-setup';
import { FilesModule } from '../../../services/files-service/src/files/files.module';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Files Service Integration Tests', () => {
  let integrationTest: BaseIntegrationTest;
  let clientToken: string;
  let coachToken: string;
  let clientUserId: string;
  let coachUserId: string;

  beforeAll(async () => {
    integrationTest = new (class extends BaseIntegrationTest {
      protected configureTestApp(): void {
        // Configure multer for file uploads
        this.app.useGlobalInterceptors(/* file upload interceptors */);
      }
    })();

    await integrationTest.setupTest(async () => {
      const config = integrationTest['testEnv'].getConfig();
      
      return Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                POSTGRES_HOST: config.postgres.host,
                POSTGRES_PORT: config.postgres.port,
                POSTGRES_USER: config.postgres.username,
                POSTGRES_PASSWORD: config.postgres.password,
                POSTGRES_DB: config.postgres.database,
                JWT_SECRET: 'test-jwt-secret-key',
                S3_ENDPOINT: config.minio.endpoint,
                S3_PORT: config.minio.port,
                S3_ACCESS_KEY: config.minio.accessKey,
                S3_SECRET_KEY: config.minio.secretKey,
                S3_BUCKET: 'test-clinic-files',
                S3_REGION: 'us-east-1',
                MAX_FILE_SIZE: '500MB',
                ALLOWED_MIME_TYPES: 'video/mp4,video/mov,video/avi,audio/mp3,audio/wav,audio/m4a,video/webm,image/jpeg,image/png,application/pdf',
              })
            ]
          }),
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: config.postgres.host,
            port: config.postgres.port,
            username: config.postgres.username,
            password: config.postgres.password,
            database: config.postgres.database,
            entities: ['src/**/*.entity{.ts,.js}'],
            synchronize: true,
            dropSchema: false,
          }),
          FilesModule,
        ],
      }).compile();
    });
  });

  afterAll(async () => {
    await integrationTest.teardownTest();
  });

  beforeEach(async () => {
    await integrationTest.cleanDatabase();
    await integrationTest.seedTestData();

    // Create test users
    const client = await integrationTest.createTestUser('client', {
      email: 'client-files@example.com',
      password: 'TestPassword123!'
    });
    clientUserId = client.id;
    clientToken = await integrationTest.authenticateUser('client-files@example.com', 'TestPassword123!');

    const coach = await integrationTest.createTestUser('coach', {
      email: 'coach-files@example.com',
      password: 'TestPassword123!'
    });
    coachUserId = coach.id;
    coachToken = await integrationTest.authenticateUser('coach-files@example.com', 'TestPassword123!');
  });

  describe('File Upload', () => {
    it('should upload image file successfully', async () => {
      // Create test image buffer
      const testImageBuffer = Buffer.from('fake-image-data');
      
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', testImageBuffer, {
          filename: 'test-image.jpg',
          contentType: 'image/jpeg'
        })
        .field('category', 'profile')
        .field('description', 'Test profile image')
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        fileName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        category: 'profile',
        description: 'Test profile image',
        uploadedBy: clientUserId,
        fileSize: testImageBuffer.length,
        storageUrl: expect.any(String),
        status: 'uploaded'
      });
    });

    it('should upload audio recording successfully', async () => {
      const testAudioBuffer = Buffer.from('fake-audio-data'.repeat(1000));
      
      const response = await integrationTest['authenticatedRequest'](coachToken)
        .post('/files/upload')
        .attach('file', testAudioBuffer, {
          filename: 'session-recording.mp3',
          contentType: 'audio/mp3'
        })
        .field('category', 'session_recording')
        .field('sessionId', 'test-session-123')
        .field('description', 'Coaching session recording')
        .expect(201);

      expect(response.body).toMatchObject({
        fileName: 'session-recording.mp3',
        mimeType: 'audio/mp3',
        category: 'session_recording',
        sessionId: 'test-session-123',
        uploadedBy: coachUserId,
        status: 'uploaded'
      });
    });

    it('should upload video file successfully', async () => {
      const testVideoBuffer = Buffer.from('fake-video-data'.repeat(5000));
      
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', testVideoBuffer, {
          filename: 'session-video.mp4',
          contentType: 'video/mp4'
        })
        .field('category', 'session_recording')
        .field('isEncrypted', 'true')
        .expect(201);

      expect(response.body).toMatchObject({
        fileName: 'session-video.mp4',
        mimeType: 'video/mp4',
        category: 'session_recording',
        isEncrypted: true,
        status: 'uploaded'
      });
    });

    it('should upload PDF document successfully', async () => {
      const testPdfBuffer = Buffer.from('fake-pdf-data'.repeat(500));
      
      const response = await integrationTest['authenticatedRequest'](coachToken)
        .post('/files/upload')
        .attach('file', testPdfBuffer, {
          filename: 'coaching-worksheet.pdf',
          contentType: 'application/pdf'
        })
        .field('category', 'worksheet')
        .field('description', 'Client worksheet for goal setting')
        .expect(201);

      expect(response.body).toMatchObject({
        fileName: 'coaching-worksheet.pdf',
        mimeType: 'application/pdf',
        category: 'worksheet',
        status: 'uploaded'
      });
    });

    it('should reject unsupported file types', async () => {
      const testBuffer = Buffer.from('fake-executable-data');
      
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', testBuffer, {
          filename: 'malicious.exe',
          contentType: 'application/octet-stream'
        })
        .field('category', 'other')
        .expect(400);

      expect(response.body.message).toContain('File type not supported');
    });

    it('should reject files exceeding size limit', async () => {
      // Create a large buffer (simulate file > 500MB)
      const largeBuffer = Buffer.alloc(600 * 1024 * 1024); // 600MB
      
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', largeBuffer, {
          filename: 'large-file.mp4',
          contentType: 'video/mp4'
        })
        .field('category', 'session_recording')
        .expect(413);

      expect(response.body.message).toContain('File size exceeds limit');
    });

    it('should handle file upload with metadata', async () => {
      const testBuffer = Buffer.from('file-with-metadata');
      
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', testBuffer, {
          filename: 'metadata-file.jpg',
          contentType: 'image/jpeg'
        })
        .field('category', 'profile')
        .field('tags', JSON.stringify(['profile', 'avatar', 'client']))
        .field('metadata', JSON.stringify({
          resolution: '1920x1080',
          camera: 'iPhone 13',
          location: 'coaching_office'
        }))
        .expect(201);

      expect(response.body.tags).toEqual(['profile', 'avatar', 'client']);
      expect(response.body.metadata).toMatchObject({
        resolution: '1920x1080',
        camera: 'iPhone 13',
        location: 'coaching_office'
      });
    });
  });

  describe('Chunked File Upload', () => {
    it('should handle chunked upload for large files', async () => {
      const totalSize = 50 * 1024 * 1024; // 50MB
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(totalSize / chunkSize);
      
      // Initialize chunked upload
      const initResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload/chunked/init')
        .send({
          fileName: 'large-video.mp4',
          fileSize: totalSize,
          mimeType: 'video/mp4',
          totalChunks,
          category: 'session_recording'
        })
        .expect(201);

      const uploadId = initResponse.body.uploadId;
      expect(uploadId).toBeDefined();

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const currentChunkSize = Math.min(chunkSize, totalSize - i * chunkSize);
        const chunkBuffer = Buffer.alloc(currentChunkSize, i); // Fill with chunk number
        
        await integrationTest['authenticatedRequest'](clientToken)
          .post(`/files/upload/chunked/${uploadId}/chunk/${i}`)
          .attach('chunk', chunkBuffer, {
            filename: `chunk-${i}`,
            contentType: 'application/octet-stream'
          })
          .expect(200);
      }

      // Complete chunked upload
      const completeResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/upload/chunked/${uploadId}/complete`)
        .expect(201);

      expect(completeResponse.body).toMatchObject({
        id: expect.any(String),
        fileName: 'large-video.mp4',
        fileSize: totalSize,
        mimeType: 'video/mp4',
        status: 'uploaded'
      });
    });

    it('should handle chunked upload cancellation', async () => {
      const initResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload/chunked/init')
        .send({
          fileName: 'cancelled-upload.mp4',
          fileSize: 10 * 1024 * 1024,
          mimeType: 'video/mp4',
          totalChunks: 2,
          category: 'session_recording'
        })
        .expect(201);

      const uploadId = initResponse.body.uploadId;

      // Cancel upload
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .delete(`/files/upload/chunked/${uploadId}`)
        .expect(200);

      expect(response.body.message).toContain('Upload cancelled');
    });

    it('should resume interrupted chunked upload', async () => {
      const totalChunks = 3;
      const chunkSize = 1024;

      // Initialize upload
      const initResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload/chunked/init')
        .send({
          fileName: 'resume-test.mp3',
          fileSize: totalChunks * chunkSize,
          mimeType: 'audio/mp3',
          totalChunks,
          category: 'session_recording'
        });

      const uploadId = initResponse.body.uploadId;

      // Upload first chunk only
      await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/upload/chunked/${uploadId}/chunk/0`)
        .attach('chunk', Buffer.alloc(chunkSize, 0), 'chunk-0')
        .expect(200);

      // Check upload status
      const statusResponse = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/upload/chunked/${uploadId}/status`)
        .expect(200);

      expect(statusResponse.body).toMatchObject({
        uploadId,
        uploadedChunks: [0],
        totalChunks,
        isComplete: false
      });

      // Resume with remaining chunks
      for (let i = 1; i < totalChunks; i++) {
        await integrationTest['authenticatedRequest'](clientToken)
          .post(`/files/upload/chunked/${uploadId}/chunk/${i}`)
          .attach('chunk', Buffer.alloc(chunkSize, i), `chunk-${i}`)
          .expect(200);
      }

      // Complete upload
      await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/upload/chunked/${uploadId}/complete`)
        .expect(201);
    });
  });

  describe('File Retrieval', () => {
    let uploadedFileId: string;

    beforeEach(async () => {
      // Upload a test file
      const testBuffer = Buffer.from('test-file-content');
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', testBuffer, {
          filename: 'test-retrieval.txt',
          contentType: 'text/plain'
        })
        .field('category', 'document');
      
      uploadedFileId = response.body.id;
    });

    it('should get file metadata', async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${uploadedFileId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: uploadedFileId,
        fileName: 'test-retrieval.txt',
        mimeType: 'text/plain',
        category: 'document',
        uploadedBy: clientUserId
      });
    });

    it('should download file content', async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${uploadedFileId}/download`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/plain');
      expect(response.text).toBe('test-file-content');
    });

    it('should get file stream for large files', async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${uploadedFileId}/stream`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/plain');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should generate presigned download URL', async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${uploadedFileId}/download-url`)
        .query({ expiresIn: '3600' }) // 1 hour
        .expect(200);

      expect(response.body).toMatchObject({
        downloadUrl: expect.any(String),
        expiresAt: expect.any(String)
      });

      // URL should be accessible without authentication
      const downloadResponse = await fetch(response.body.downloadUrl);
      expect(downloadResponse.ok).toBe(true);
    });

    it('should list user files with pagination', async () => {
      // Upload additional files
      for (let i = 0; i < 5; i++) {
        await integrationTest['authenticatedRequest'](clientToken)
          .post('/files/upload')
          .attach('file', Buffer.from(`content-${i}`), {
            filename: `file-${i}.txt`,
            contentType: 'text/plain'
          })
          .field('category', 'document');
      }

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get('/files/my-files')
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body).toMatchObject({
        files: expect.any(Array),
        pagination: {
          currentPage: 1,
          totalPages: expect.any(Number),
          totalFiles: expect.any(Number),
          hasNext: expect.any(Boolean),
          hasPrev: expect.any(Boolean)
        }
      });

      expect(response.body.files).toHaveLength(3);
    });

    it('should filter files by category', async () => {
      // Upload files in different categories
      await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', Buffer.from('profile-image'), {
          filename: 'profile.jpg',
          contentType: 'image/jpeg'
        })
        .field('category', 'profile');

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get('/files/my-files')
        .query({ category: 'profile' })
        .expect(200);

      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].category).toBe('profile');
    });

    it('should search files by name', async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get('/files/search')
        .query({ query: 'test-retrieval' })
        .expect(200);

      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].fileName).toContain('test-retrieval');
    });
  });

  describe('File Processing', () => {
    it('should process image file (generate thumbnails)', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');
      
      const uploadResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', testImageBuffer, {
          filename: 'process-image.jpg',
          contentType: 'image/jpeg'
        })
        .field('category', 'profile')
        .field('generateThumbnails', 'true');

      const fileId = uploadResponse.body.id;

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${fileId}/processing-status`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'completed',
        thumbnails: expect.any(Array)
      });
    });

    it('should extract metadata from audio file', async () => {
      const testAudioBuffer = Buffer.from('fake-audio-data');
      
      const uploadResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', testAudioBuffer, {
          filename: 'audio-metadata.mp3',
          contentType: 'audio/mp3'
        })
        .field('category', 'session_recording')
        .field('extractMetadata', 'true');

      const fileId = uploadResponse.body.id;

      // Check processing status
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${fileId}/metadata`)
        .expect(200);

      expect(response.body).toMatchObject({
        duration: expect.any(Number),
        bitrate: expect.any(Number),
        format: expect.any(String)
      });
    });

    it('should scan file for viruses', async () => {
      const testBuffer = Buffer.from('clean-file-content');
      
      const uploadResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', testBuffer, {
          filename: 'virus-scan.txt',
          contentType: 'text/plain'
        })
        .field('category', 'document')
        .field('virusScan', 'true');

      const fileId = uploadResponse.body.id;

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${fileId}/security-scan`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'clean',
        scannedAt: expect.any(String),
        scanEngine: expect.any(String)
      });
    });
  });

  describe('File Sharing and Permissions', () => {
    let fileId: string;

    beforeEach(async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', Buffer.from('shared-content'), {
          filename: 'shared-file.txt',
          contentType: 'text/plain'
        })
        .field('category', 'document');
      
      fileId = response.body.id;
    });

    it('should share file with another user', async () => {
      const shareData = {
        shareWithUserId: coachUserId,
        permissions: ['read'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/${fileId}/share`)
        .send(shareData)
        .expect(200);

      expect(response.body).toMatchObject({
        shareId: expect.any(String),
        fileId,
        sharedWith: coachUserId,
        permissions: ['read'],
        expiresAt: expect.any(String)
      });
    });

    it('should generate public share link', async () => {
      const shareData = {
        isPublic: true,
        permissions: ['read'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/${fileId}/share`)
        .send(shareData)
        .expect(200);

      expect(response.body).toMatchObject({
        shareId: expect.any(String),
        shareUrl: expect.any(String),
        isPublic: true
      });

      // Verify public access works
      const publicResponse = await integrationTest['testAgent']
        .get(`/files/shared/${response.body.shareId}`)
        .expect(200);

      expect(publicResponse.body.fileName).toBe('shared-file.txt');
    });

    it('should revoke file share', async () => {
      // Create share first
      const shareResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/${fileId}/share`)
        .send({
          shareWithUserId: coachUserId,
          permissions: ['read']
        });

      const shareId = shareResponse.body.shareId;

      // Revoke share
      await integrationTest['authenticatedRequest'](clientToken)
        .delete(`/files/${fileId}/share/${shareId}`)
        .expect(200);

      // Verify access is revoked
      await integrationTest['authenticatedRequest'](coachToken)
        .get(`/files/${fileId}`)
        .expect(403);
    });

    it('should list shared files', async () => {
      // Share a file with coach
      await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/${fileId}/share`)
        .send({
          shareWithUserId: coachUserId,
          permissions: ['read']
        });

      const response = await integrationTest['authenticatedRequest'](coachToken)
        .get('/files/shared-with-me')
        .expect(200);

      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].id).toBe(fileId);
    });
  });

  describe('File Versioning', () => {
    let originalFileId: string;

    beforeEach(async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', Buffer.from('original-content'), {
          filename: 'versioned-file.txt',
          contentType: 'text/plain'
        })
        .field('category', 'document');
      
      originalFileId = response.body.id;
    });

    it('should create new version of existing file', async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/${originalFileId}/versions`)
        .attach('file', Buffer.from('updated-content'), {
          filename: 'versioned-file.txt',
          contentType: 'text/plain'
        })
        .field('versionNotes', 'Updated content for clarity')
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        parentFileId: originalFileId,
        version: 2,
        versionNotes: 'Updated content for clarity'
      });
    });

    it('should list file versions', async () => {
      // Create a new version
      await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/${originalFileId}/versions`)
        .attach('file', Buffer.from('version-2'), 'versioned-file.txt')
        .field('versionNotes', 'Version 2');

      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${originalFileId}/versions`)
        .expect(200);

      expect(response.body.versions).toHaveLength(2);
      expect(response.body.versions[0].version).toBe(1);
      expect(response.body.versions[1].version).toBe(2);
    });

    it('should restore previous version', async () => {
      // Create new version
      const newVersionResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/${originalFileId}/versions`)
        .attach('file', Buffer.from('version-2'), 'versioned-file.txt');

      const newVersionId = newVersionResponse.body.id;

      // Restore original version
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/${originalFileId}/restore-version`)
        .send({ versionId: originalFileId })
        .expect(200);

      expect(response.body.message).toContain('Version restored');
    });
  });

  describe('File Security and Encryption', () => {
    it('should encrypt sensitive files', async () => {
      const sensitiveContent = Buffer.from('sensitive-medical-data');
      
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', sensitiveContent, {
          filename: 'medical-record.pdf',
          contentType: 'application/pdf'
        })
        .field('category', 'medical_record')
        .field('encrypt', 'true')
        .field('sensitivityLevel', 'high')
        .expect(201);

      expect(response.body).toMatchObject({
        isEncrypted: true,
        sensitivityLevel: 'high',
        encryptionAlgorithm: expect.any(String)
      });
    });

    it('should require additional authentication for sensitive files', async () => {
      // Upload sensitive file
      const uploadResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', Buffer.from('highly-sensitive'), {
          filename: 'sensitive.txt',
          contentType: 'text/plain'
        })
        .field('category', 'confidential')
        .field('requireMFA', 'true');

      const fileId = uploadResponse.body.id;

      // Try to access without MFA
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${fileId}/download`)
        .expect(403);

      expect(response.body.message).toContain('MFA required');
    });

    it('should audit file access', async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', Buffer.from('audited-content'), {
          filename: 'audited-file.txt',
          contentType: 'text/plain'
        })
        .field('category', 'document')
        .field('auditAccess', 'true');

      const fileId = response.body.id;

      // Access the file
      await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${fileId}/download`)
        .expect(200);

      // Check audit log
      const auditResponse = await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${fileId}/audit-log`)
        .expect(200);

      expect(auditResponse.body.auditEntries).toHaveLength(2); // Upload + Download
      expect(auditResponse.body.auditEntries[1]).toMatchObject({
        action: 'download',
        userId: clientUserId,
        timestamp: expect.any(String)
      });
    });
  });

  describe('File Cleanup and Maintenance', () => {
    it('should delete file permanently', async () => {
      const uploadResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', Buffer.from('to-be-deleted'), {
          filename: 'delete-me.txt',
          contentType: 'text/plain'
        })
        .field('category', 'document');

      const fileId = uploadResponse.body.id;

      // Delete file
      await integrationTest['authenticatedRequest'](clientToken)
        .delete(`/files/${fileId}`)
        .expect(200);

      // Verify file is deleted
      await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${fileId}`)
        .expect(404);
    });

    it('should soft delete file (move to trash)', async () => {
      const uploadResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', Buffer.from('soft-delete-me'), {
          filename: 'trash-me.txt',
          contentType: 'text/plain'
        })
        .field('category', 'document');

      const fileId = uploadResponse.body.id;

      // Soft delete
      await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/${fileId}/trash`)
        .expect(200);

      // File should not appear in normal listings
      const listResponse = await integrationTest['authenticatedRequest'](clientToken)
        .get('/files/my-files')
        .expect(200);

      expect(listResponse.body.files.find(f => f.id === fileId)).toBeUndefined();

      // But should appear in trash
      const trashResponse = await integrationTest['authenticatedRequest'](clientToken)
        .get('/files/trash')
        .expect(200);

      expect(trashResponse.body.files.find(f => f.id === fileId)).toBeDefined();
    });

    it('should restore file from trash', async () => {
      const uploadResponse = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', Buffer.from('restore-me'), {
          filename: 'restore-me.txt',
          contentType: 'text/plain'
        })
        .field('category', 'document');

      const fileId = uploadResponse.body.id;

      // Trash the file
      await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/${fileId}/trash`)
        .expect(200);

      // Restore from trash
      await integrationTest['authenticatedRequest'](clientToken)
        .post(`/files/${fileId}/restore`)
        .expect(200);

      // File should be back in normal listings
      const listResponse = await integrationTest['authenticatedRequest'](clientToken)
        .get('/files/my-files')
        .expect(200);

      expect(listResponse.body.files.find(f => f.id === fileId)).toBeDefined();
    });

    it('should clean up expired files automatically', async () => {
      const response = await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/upload')
        .attach('file', Buffer.from('expires-soon'), {
          filename: 'temp-file.txt',
          contentType: 'text/plain'
        })
        .field('category', 'temporary')
        .field('expiresAt', new Date(Date.now() + 1000).toISOString()); // Expires in 1 second

      const fileId = response.body.id;

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Run cleanup job
      await integrationTest['authenticatedRequest'](clientToken)
        .post('/files/maintenance/cleanup-expired')
        .expect(200);

      // File should be gone
      await integrationTest['authenticatedRequest'](clientToken)
        .get(`/files/${fileId}`)
        .expect(404);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent file uploads', async () => {
      const uploadPromises = Array.from({ length: 10 }, (_, i) =>
        integrationTest['authenticatedRequest'](clientToken)
          .post('/files/upload')
          .attach('file', Buffer.from(`concurrent-file-${i}`), {
            filename: `concurrent-${i}.txt`,
            contentType: 'text/plain'
          })
          .field('category', 'document')
      );

      const results = await Promise.allSettled(uploadPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      expect(successful).toBe(10);
    });

    it('should implement file upload queue for resource management', async () => {
      // Simulate high load scenario
      const largeUploads = Array.from({ length: 5 }, (_, i) =>
        integrationTest['authenticatedRequest'](clientToken)
          .post('/files/upload')
          .attach('file', Buffer.alloc(10 * 1024 * 1024, i), { // 10MB files
            filename: `large-file-${i}.bin`,
            contentType: 'application/octet-stream'
          })
          .field('category', 'session_recording')
      );

      const results = await Promise.allSettled(largeUploads);
      
      // Some uploads should be queued rather than processed immediately
      const queued = results.filter(r => 
        r.status === 'fulfilled' && (r.value as any).body.status === 'queued'
      ).length;

      expect(queued).toBeGreaterThan(0);
    });

    it('should optimize file storage usage', async () => {
      // Check storage usage before uploads
      const initialUsage = await integrationTest['authenticatedRequest'](clientToken)
        .get('/files/storage-usage')
        .expect(200);

      // Upload multiple files
      for (let i = 0; i < 3; i++) {
        await integrationTest['authenticatedRequest'](clientToken)
          .post('/files/upload')
          .attach('file', Buffer.alloc(1024 * 1024, i), { // 1MB each
            filename: `usage-test-${i}.bin`,
            contentType: 'application/octet-stream'
          })
          .field('category', 'document');
      }

      // Check storage usage after uploads
      const finalUsage = await integrationTest['authenticatedRequest'](clientToken)
        .get('/files/storage-usage')
        .expect(200);

      expect(finalUsage.body.totalSize).toBeGreaterThan(initialUsage.body.totalSize);
      expect(finalUsage.body.fileCount).toBe(initialUsage.body.fileCount + 3);
    });
  });
});