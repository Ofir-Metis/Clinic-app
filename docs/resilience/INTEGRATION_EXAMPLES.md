# Resilience Patterns Integration Examples

## Overview

This document provides practical examples of integrating resilience patterns into various healthcare platform services. These examples demonstrate real-world usage scenarios and best practices.

## 🏥 Healthcare Service Examples

### 1. Patient Record Service

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ResilienceService } from '../resilience/resilience.service';
import { PatientRepository } from './patient.repository';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    private resilienceService: ResilienceService,
    private patientRepository: PatientRepository,
    private cacheService: CacheService
  ) {}

  /**
   * Get patient record with comprehensive resilience protection
   */
  async getPatientRecord(patientId: string) {
    const operation = async () => {
      this.logger.log(`Fetching patient record: ${patientId}`);
      return await this.patientRepository.findById(patientId);
    };

    const fallback = async () => {
      this.logger.warn(`Using cached data for patient: ${patientId}`);
      const cached = await this.cacheService.get(`patient:${patientId}`);
      if (cached) {
        return { ...cached, _fromCache: true };
      }
      throw new Error('Patient record not available');
    };

    return this.resilienceService.executeDatabase(
      'get-patient-record',
      operation,
      fallback
    );
  }

  /**
   * Update patient record with critical operation protection
   */
  async updatePatientRecord(patientId: string, updateData: any) {
    const operation = async () => {
      const updated = await this.patientRepository.update(patientId, updateData);
      
      // Update cache after successful database update
      await this.cacheService.set(`patient:${patientId}`, updated, 3600);
      
      return updated;
    };

    // No fallback for critical update operations
    return this.resilienceService.executeCritical(
      'update-patient-record',
      operation
    );
  }

  /**
   * Search patients with external API integration
   */
  async searchPatients(criteria: any) {
    const operation = async () => {
      // Primary search using database
      const dbResults = await this.patientRepository.search(criteria);
      
      // Enhance with external insurance data
      const enhancedResults = await Promise.all(
        dbResults.map(async (patient) => {
          try {
            const insuranceData = await this.getInsuranceInfo(patient.id);
            return { ...patient, insurance: insuranceData };
          } catch (error) {
            // Don't fail entire search if insurance lookup fails
            return patient;
          }
        })
      );
      
      return enhancedResults;
    };

    const fallback = async () => {
      // Fallback to basic database search without insurance data
      return await this.patientRepository.search(criteria);
    };

    return this.resilienceService.executeDatabase(
      'search-patients',
      operation,
      fallback
    );
  }

  /**
   * Get insurance information with external API resilience
   */
  private async getInsuranceInfo(patientId: string) {
    const operation = async () => {
      return await this.externalInsuranceAPI.getPatientInsurance(patientId);
    };

    const fallback = async () => {
      // Return cached insurance data or basic info
      const cached = await this.cacheService.get(`insurance:${patientId}`);
      return cached || { status: 'unknown', provider: 'N/A' };
    };

    return this.resilienceService.executeExternalAPI(
      'get-insurance-info',
      operation,
      fallback
    );
  }
}
```

### 2. Appointment Scheduling Service

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ResilienceService } from '../resilience/resilience.service';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private resilienceService: ResilienceService,
    private appointmentRepository: AppointmentRepository,
    private notificationService: NotificationService,
    private calendarService: CalendarService
  ) {}

  /**
   * Schedule appointment with multiple external integrations
   */
  async scheduleAppointment(appointmentData: CreateAppointmentDto) {
    const operation = async () => {
      // 1. Create appointment in database
      const appointment = await this.appointmentRepository.create(appointmentData);
      
      // 2. Send confirmation notification (with resilience)
      await this.sendConfirmationNotification(appointment);
      
      // 3. Update external calendar (with resilience)
      await this.updateExternalCalendar(appointment);
      
      // 4. Check insurance authorization if needed
      if (appointmentData.requiresAuthorization) {
        await this.checkInsuranceAuthorization(appointment);
      }
      
      return appointment;
    };

    const fallback = async () => {
      // Fallback: Create appointment without external integrations
      const appointment = await this.appointmentRepository.create({
        ...appointmentData,
        status: 'pending_confirmation',
        notes: 'Created with limited integration - requires manual verification'
      });
      
      // Queue for manual processing
      await this.queueForManualProcessing(appointment);
      
      return appointment;
    };

    return this.resilienceService.executeCritical(
      'schedule-appointment',
      operation,
      fallback
    );
  }

  /**
   * Send confirmation notification with resilience
   */
  private async sendConfirmationNotification(appointment: any) {
    const operation = async () => {
      await this.notificationService.sendAppointmentConfirmation(appointment);
    };

    const fallback = async () => {
      // Fallback: Queue notification for later delivery
      await this.notificationService.queueNotification({
        type: 'appointment_confirmation',
        appointmentId: appointment.id,
        priority: 'high'
      });
    };

    return this.resilienceService.executeInternalService(
      'send-appointment-confirmation',
      operation,
      fallback
    );
  }

  /**
   * Update external calendar with resilience
   */
  private async updateExternalCalendar(appointment: any) {
    const operation = async () => {
      await this.calendarService.createEvent(appointment);
    };

    const fallback = async () => {
      // Fallback: Mark for manual calendar update
      await this.appointmentRepository.update(appointment.id, {
        requiresCalendarSync: true,
        calendarSyncStatus: 'pending'
      });
    };

    return this.resilienceService.executeExternalAPI(
      'update-external-calendar',
      operation,
      fallback
    );
  }

  /**
   * Bulk appointment operations with bulkhead protection
   */
  async processBulkAppointments(appointments: CreateAppointmentDto[]) {
    const processAppointment = async (appointmentData: CreateAppointmentDto) => {
      return this.scheduleAppointment(appointmentData);
    };

    // Use file operations pattern for bulk processing
    const results = await Promise.allSettled(
      appointments.map(appointment =>
        this.resilienceService.executeFileOperation(
          'process-bulk-appointment',
          () => processAppointment(appointment)
        )
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.logger.log(`Bulk appointment processing: ${successful} successful, ${failed} failed`);

    return {
      total: appointments.length,
      successful,
      failed,
      results: results.map((result, index) => ({
        index,
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    };
  }
}
```

### 3. Medical File Upload Service

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ResilienceService } from '../resilience/resilience.service';

@Injectable()
export class MedicalFileService {
  private readonly logger = new Logger(MedicalFileService.name);

  constructor(
    private resilienceService: ResilienceService,
    private fileRepository: FileRepository,
    private storageService: StorageService,
    private virusScanService: VirusScanService,
    private ocrService: OCRService
  ) {}

  /**
   * Upload medical file with comprehensive processing
   */
  async uploadMedicalFile(fileData: Buffer, metadata: FileMetadata) {
    const operation = async () => {
      // 1. Virus scan (critical security check)
      await this.performVirusScan(fileData, metadata.filename);
      
      // 2. Upload to secure storage
      const storageResult = await this.uploadToSecureStorage(fileData, metadata);
      
      // 3. Create file record in database
      const fileRecord = await this.fileRepository.create({
        ...metadata,
        storageUrl: storageResult.url,
        size: fileData.length,
        uploadedAt: new Date()
      });
      
      // 4. Perform OCR for text extraction (non-critical)
      this.performOCRProcessing(fileRecord.id, fileData).catch(error => {
        this.logger.warn(`OCR processing failed for file ${fileRecord.id}:`, error);
      });
      
      return fileRecord;
    };

    const fallback = async () => {
      // Fallback: Store file temporarily and queue for manual processing
      const tempStorage = await this.storageService.uploadToTemporary(fileData, metadata);
      
      const fileRecord = await this.fileRepository.create({
        ...metadata,
        storageUrl: tempStorage.url,
        status: 'pending_processing',
        requiresManualReview: true,
        size: fileData.length,
        uploadedAt: new Date()
      });
      
      // Queue for manual processing
      await this.queueForManualProcessing(fileRecord);
      
      return fileRecord;
    };

    return this.resilienceService.executeFileOperation(
      'upload-medical-file',
      operation,
      fallback
    );
  }

  /**
   * Virus scan with external service resilience
   */
  private async performVirusScan(fileData: Buffer, filename: string) {
    const operation = async () => {
      const scanResult = await this.virusScanService.scanFile(fileData);
      if (!scanResult.clean) {
        throw new Error(`Virus detected in file: ${filename}`);
      }
      return scanResult;
    };

    const fallback = async () => {
      // Fallback: Use basic file type validation and queue for manual review
      this.logger.warn(`Virus scan service unavailable for file: ${filename}`);
      
      // Basic validation
      if (this.isExecutableFile(filename)) {
        throw new Error(`Executable files not allowed: ${filename}`);
      }
      
      return { clean: true, scannedAt: new Date(), method: 'basic_validation' };
    };

    return this.resilienceService.executeExternalAPI(
      'virus-scan',
      operation,
      fallback
    );
  }

  /**
   * Secure storage upload with resilience
   */
  private async uploadToSecureStorage(fileData: Buffer, metadata: FileMetadata) {
    const operation = async () => {
      return await this.storageService.uploadEncrypted(fileData, {
        ...metadata,
        encryption: 'AES256',
        compliance: 'HIPAA'
      });
    };

    const fallback = async () => {
      // Fallback: Upload to secondary storage location
      return await this.storageService.uploadToSecondary(fileData, metadata);
    };

    return this.resilienceService.executeFileOperation(
      'secure-storage-upload',
      operation,
      fallback
    );
  }

  /**
   * OCR processing with timeout and retry
   */
  private async performOCRProcessing(fileId: string, fileData: Buffer) {
    const operation = async () => {
      const ocrResult = await this.ocrService.extractText(fileData);
      
      // Save OCR results
      await this.fileRepository.update(fileId, {
        ocrText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        ocrProcessedAt: new Date()
      });
      
      return ocrResult;
    };

    // OCR is non-critical, so we use a more lenient pattern
    return this.resilienceService.executeInternalService(
      'ocr-processing',
      operation
    );
  }

  /**
   * Batch file processing with bulkhead protection
   */
  async processBatchFiles(files: Array<{ data: Buffer; metadata: FileMetadata }>) {
    const processFile = (file: { data: Buffer; metadata: FileMetadata }) => {
      return this.uploadMedicalFile(file.data, file.metadata);
    };

    // Process files with controlled concurrency
    const results = [];
    const batchSize = 5; // Process 5 files at a time
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map((file, index) =>
          this.resilienceService.executeFileOperation(
            `batch-file-${i + index}`,
            () => processFile(file)
          )
        )
      );
      
      results.push(...batchResults);
    }

    return this.compileBatchResults(results);
  }
}
```

### 4. AI Analysis Service

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ResilienceService } from '../resilience/resilience.service';

@Injectable()
export class AIAnalysisService {
  private readonly logger = new Logger(AIAnalysisService.name);

  constructor(
    private resilienceService: ResilienceService,
    private openaiService: OpenAIService,
    private analysisRepository: AnalysisRepository,
    private cacheService: CacheService
  ) {}

  /**
   * Analyze session recording with AI
   */
  async analyzeSessionRecording(sessionId: string, audioData: Buffer) {
    const operation = async () => {
      // 1. Transcribe audio using Whisper API
      const transcript = await this.transcribeAudio(audioData);
      
      // 2. Analyze transcript using GPT-4
      const analysis = await this.analyzeTranscript(transcript);
      
      // 3. Generate summary and insights
      const summary = await this.generateSummary(analysis, transcript);
      
      // 4. Save analysis results
      const analysisRecord = await this.analysisRepository.create({
        sessionId,
        transcript: transcript.text,
        analysis: analysis.insights,
        summary: summary.content,
        confidence: analysis.confidence,
        processedAt: new Date()
      });
      
      return analysisRecord;
    };

    const fallback = async () => {
      // Fallback: Queue for manual analysis
      const analysisRecord = await this.analysisRepository.create({
        sessionId,
        status: 'pending_manual_analysis',
        requiresManualReview: true,
        processedAt: new Date(),
        notes: 'AI analysis unavailable - queued for manual processing'
      });
      
      await this.queueForManualAnalysis(sessionId, audioData);
      
      return analysisRecord;
    };

    return this.resilienceService.executeExternalAPI(
      'analyze-session-recording',
      operation,
      fallback
    );
  }

  /**
   * Transcribe audio with Whisper API resilience
   */
  private async transcribeAudio(audioData: Buffer) {
    const operation = async () => {
      return await this.openaiService.transcribeAudio(audioData, {
        model: 'whisper-1',
        language: 'en',
        response_format: 'json'
      });
    };

    const fallback = async () => {
      // Fallback: Use local speech-to-text service or return placeholder
      this.logger.warn('OpenAI Whisper API unavailable, using local transcription');
      
      try {
        return await this.localTranscriptionService.transcribe(audioData);
      } catch (error) {
        return {
          text: '[Transcription unavailable - manual transcription required]',
          confidence: 0,
          provider: 'fallback'
        };
      }
    };

    return this.resilienceService.executeExternalAPI(
      'transcribe-audio',
      operation,
      fallback
    );
  }

  /**
   * Analyze transcript with GPT-4 resilience
   */
  private async analyzeTranscript(transcript: any) {
    const operation = async () => {
      const prompt = this.buildAnalysisPrompt(transcript.text);
      
      const response = await this.openaiService.createCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });
      
      return {
        insights: response.choices[0].message.content,
        confidence: 0.9,
        model: 'gpt-4'
      };
    };

    const fallback = async () => {
      // Fallback: Use rule-based analysis or cached similar analyses
      const cacheKey = this.generateCacheKey(transcript.text);
      const cachedAnalysis = await this.cacheService.get(`analysis:${cacheKey}`);
      
      if (cachedAnalysis) {
        return { ...cachedAnalysis, confidence: 0.5, source: 'cached' };
      }
      
      // Basic rule-based analysis
      return await this.performBasicAnalysis(transcript.text);
    };

    return this.resilienceService.executeExternalAPI(
      'analyze-transcript',
      operation,
      fallback
    );
  }

  /**
   * Generate summary with progressive timeout
   */
  private async generateSummary(analysis: any, transcript: any) {
    const operation = async () => {
      const summaryPrompt = this.buildSummaryPrompt(analysis.insights, transcript.text);
      
      const response = await this.openaiService.createCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: summaryPrompt }],
        temperature: 0.2,
        max_tokens: 500
      });
      
      return {
        content: response.choices[0].message.content,
        generatedAt: new Date(),
        model: 'gpt-4'
      };
    };

    // Use progressive timeout: start with 15s, increase to 30s, then 60s
    return this.resilienceService.execute(
      'external-api',
      'generate-summary',
      async () => {
        return await this.timeoutService.executeWithProgressiveTimeout(
          'gpt-4-summary',
          operation,
          15000, // Start with 15 seconds
          60000, // Max 60 seconds
          2,     // Double timeout each retry
          3      // Max 3 attempts
        );
      }
    );
  }
}
```

## 🔧 Advanced Integration Patterns

### 1. Microservice Communication with Resilience

```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ResilienceService } from '../resilience/resilience.service';

@Injectable()
export class ServiceProxyService {
  constructor(
    private httpService: HttpService,
    private resilienceService: ResilienceService
  ) {}

  /**
   * Create resilient service proxy
   */
  createResilientProxy(serviceName: string, baseUrl: string) {
    return {
      get: (path: string, config?: any) => this.makeResilientRequest(
        serviceName, 'GET', `${baseUrl}${path}`, null, config
      ),
      post: (path: string, data?: any, config?: any) => this.makeResilientRequest(
        serviceName, 'POST', `${baseUrl}${path}`, data, config
      ),
      put: (path: string, data?: any, config?: any) => this.makeResilientRequest(
        serviceName, 'PUT', `${baseUrl}${path}`, data, config
      ),
      delete: (path: string, config?: any) => this.makeResilientRequest(
        serviceName, 'DELETE', `${baseUrl}${path}`, null, config
      ),
    };
  }

  private async makeResilientRequest(
    serviceName: string,
    method: string,
    url: string,
    data?: any,
    config?: any
  ) {
    const operation = async () => {
      const response = await this.httpService.request({
        method,
        url,
        data,
        ...config,
        timeout: 10000, // 10 second timeout
      }).toPromise();
      
      return response.data;
    };

    const fallback = async () => {
      // Service-specific fallback logic
      if (serviceName === 'user-service') {
        return this.getUserFallback(url);
      } else if (serviceName === 'notification-service') {
        return this.queueNotificationFallback(data);
      }
      
      throw new Error(`Service ${serviceName} unavailable and no fallback configured`);
    };

    return this.resilienceService.executeInternalService(
      `${serviceName}-${method.toLowerCase()}`,
      operation,
      fallback
    );
  }
}
```

### 2. Database Operations with Resilience

```typescript
import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { ResilienceService } from '../resilience/resilience.service';

@Injectable()
export class ResilientRepository<T> {
  constructor(
    private repository: Repository<T>,
    private dataSource: DataSource,
    private resilienceService: ResilienceService
  ) {}

  async find(options?: any): Promise<T[]> {
    const operation = async () => {
      return await this.repository.find(options);
    };

    const fallback = async () => {
      // Try read replica if available
      if (this.dataSource.hasMetadata('read-replica')) {
        const readReplica = this.dataSource.getRepository(this.repository.target, 'read-replica');
        return await readReplica.find(options);
      }
      throw new Error('Database unavailable');
    };

    return this.resilienceService.executeDatabase(
      'repository-find',
      operation,
      fallback
    );
  }

  async save(entity: T): Promise<T> {
    const operation = async () => {
      return await this.repository.save(entity);
    };

    // No fallback for write operations - they must succeed or fail
    return this.resilienceService.executeDatabase(
      'repository-save',
      operation
    );
  }

  async transaction<R>(fn: (manager: any) => Promise<R>): Promise<R> {
    const operation = async () => {
      return await this.dataSource.transaction(fn);
    };

    return this.resilienceService.executeCritical(
      'database-transaction',
      operation
    );
  }
}
```

### 3. Event-Driven Resilience

```typescript
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ResilienceService } from '../resilience/resilience.service';

@Injectable()
export class ResilientEventService {
  constructor(
    private eventEmitter: EventEmitter2,
    private resilienceService: ResilienceService
  ) {}

  async emitResilientEvent(eventName: string, payload: any) {
    const operation = async () => {
      this.eventEmitter.emit(eventName, payload);
      return { status: 'emitted', eventName, timestamp: new Date() };
    };

    const fallback = async () => {
      // Queue event for later processing
      await this.queueEvent(eventName, payload);
      return { status: 'queued', eventName, timestamp: new Date() };
    };

    return this.resilienceService.executeInternalService(
      'emit-event',
      operation,
      fallback
    );
  }

  async processEventWithResilience(eventName: string, handler: Function, payload: any) {
    const operation = async () => {
      return await handler(payload);
    };

    const fallback = async () => {
      // Log failure and queue for retry
      console.error(`Event handler failed for ${eventName}:`, payload);
      await this.queueEventForRetry(eventName, payload);
      return { status: 'queued_for_retry' };
    };

    return this.resilienceService.executeInternalService(
      `handle-${eventName}`,
      operation,
      fallback
    );
  }
}
```

## 📱 Frontend Integration

### React Hook for Resilient API Calls

```typescript
import { useState, useCallback } from 'react';
import { apiClient } from '../services/api-client';

interface UseResilientApiOptions {
  enableRetry?: boolean;
  maxRetries?: number;
  timeout?: number;
  fallbackData?: any;
}

export const useResilientApi = <T>(options: UseResilientApiOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    payload?: any
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.request({
        url: endpoint,
        method,
        data: payload,
        timeout: options.timeout || 30000,
        headers: {
          'X-Resilience-Pattern': 'frontend-api',
          'X-Max-Retries': options.maxRetries?.toString() || '3',
        },
      });

      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err as Error);
      
      // Use fallback data if available
      if (options.fallbackData) {
        setData(options.fallbackData);
        return options.fallbackData;
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [options]);

  return { data, loading, error, execute };
};
```

## 🧪 Testing Resilience Patterns

### Integration Test Example

```typescript
import { Test } from '@nestjs/testing';
import { ResilienceService } from '../resilience/resilience.service';
import { PatientService } from '../patient/patient.service';

describe('Patient Service Resilience Integration', () => {
  let patientService: PatientService;
  let resilienceService: ResilienceService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PatientService, ResilienceService],
    }).compile();

    patientService = module.get<PatientService>(PatientService);
    resilienceService = module.get<ResilienceService>(ResilienceService);
  });

  it('should fallback to cache when database fails', async () => {
    // Mock database failure
    jest.spyOn(patientRepository, 'findById').mockRejectedValue(new Error('DB connection failed'));
    
    // Mock cache success
    jest.spyOn(cacheService, 'get').mockResolvedValue({ id: '123', name: 'John Doe' });

    const result = await patientService.getPatientRecord('123');

    expect(result._fromCache).toBe(true);
    expect(result.name).toBe('John Doe');
  });

  it('should handle circuit breaker activation', async () => {
    // Simulate multiple failures to trigger circuit breaker
    const mockFailingOperation = jest.fn().mockRejectedValue(new Error('Service down'));
    
    for (let i = 0; i < 5; i++) {
      try {
        await resilienceService.executeExternalAPI('test-operation', mockFailingOperation);
      } catch (error) {
        // Expected
      }
    }

    // Circuit breaker should now be open
    const circuitBreakerStatus = resilienceService.circuitBreakerService.getStatus('external-api-test-operation');
    expect(circuitBreakerStatus?.state).toBe('open');
  });
});
```

---

These integration examples demonstrate how to effectively use resilience patterns throughout the healthcare platform, ensuring robust, fault-tolerant operations while maintaining the critical requirements of healthcare applications.