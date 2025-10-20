/**
 * Transcription Entity - Stores audio transcription data and metadata
 * Links recordings to text content for AI processing
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { SessionSummary } from './session-summary.entity';

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AudioQuality = 'excellent' | 'good' | 'fair' | 'poor';

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence?: number;
}

interface TranscriptionMetadata {
  model: string;
  language: string;
  detected_language?: string;
  duration: number;
  file_size: number;
  sample_rate?: number;
  channels?: number;
  format?: string;
  processing_time_ms: number;
  whisper_version?: string;
}

@Entity('transcriptions')
@Index(['appointmentId'])
@Index(['recordingId'])
@Index(['status'])
@Index(['createdAt'])
export class Transcription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'appointment_id' })
  appointmentId!: string;

  @Column({ name: 'recording_id' })
  recordingId!: string;

  @Column({ name: 'coach_id' })
  coachId!: string;

  @Column({ name: 'client_id' })
  clientId!: string;

  // File Information
  @Column({ name: 'original_filename' })
  originalFilename!: string;

  @Column({ name: 'file_path' })
  filePath!: string;

  @Column({ name: 'file_size' })
  fileSize!: number; // in bytes

  @Column({ name: 'duration_seconds', type: 'decimal', precision: 10, scale: 2 })
  durationSeconds!: number;

  // Transcription Status
  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status!: TranscriptionStatus;

  @Column('text', { name: 'full_text', nullable: true })
  fullText?: string;

  @Column({ name: 'character_count', nullable: true })
  characterCount?: number;

  @Column({ name: 'word_count', nullable: true })
  wordCount?: number;

  // Quality Metrics
  @Column({
    type: 'enum',
    enum: ['excellent', 'good', 'fair', 'poor'],
    nullable: true,
    name: 'audio_quality'
  })
  audioQuality?: AudioQuality;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 4, scale: 3, nullable: true })
  confidenceScore?: number;

  @Column({ name: 'language_detected', nullable: true })
  languageDetected?: string;

  // Segmentation Data
  @Column('jsonb', { nullable: true })
  segments?: TranscriptionSegment[];

  @Column({ name: 'speaker_count', nullable: true })
  speakerCount?: number;

  @Column({ name: 'has_speaker_labels', default: false })
  hasSpeakerLabels!: boolean;

  // Processing Information
  @Column('jsonb', { nullable: true })
  metadata?: TranscriptionMetadata;

  @Column({ name: 'processing_started_at', nullable: true })
  processingStartedAt?: Date;

  @Column({ name: 'processing_completed_at', nullable: true })
  processingCompletedAt?: Date;

  @Column('text', { nullable: true, name: 'error_message' })
  errorMessage?: string;

  @Column('text', { nullable: true, name: 'error_details' })
  errorDetails?: string;

  // Preprocessing
  @Column({ name: 'noise_reduced', default: false })
  noiseReduced!: boolean;

  @Column({ name: 'audio_enhanced', default: false })
  audioEnhanced!: boolean;

  @Column('jsonb', { nullable: true, name: 'preprocessing_config' })
  preprocessingConfig?: {
    noise_reduction: boolean;
    volume_normalization: boolean;
    silence_removal: boolean;
    filters_applied: string[];
  };

  // Content Analysis
  @Column('text', { array: true, nullable: true, name: 'key_phrases' })
  keyPhrases?: string[];

  @Column('text', { array: true, nullable: true })
  topics?: string[];

  @Column('jsonb', { nullable: true, name: 'sentiment_analysis' })
  sentimentAnalysis?: {
    overall_sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: { [emotion: string]: number };
  };

  // Privacy and Access
  @Column({ name: 'contains_sensitive_data', default: false })
  containsSensitiveData!: boolean;

  @Column('text', { array: true, nullable: true, name: 'redacted_phrases' })
  redactedPhrases?: string[];

  @Column({ name: 'client_access_allowed', default: true })
  clientAccessAllowed!: boolean;

  // Relationship to Summary
  @OneToOne(() => SessionSummary, { nullable: true })
  @JoinColumn({ name: 'session_summary_id' })
  sessionSummary?: SessionSummary;

  @Column({ name: 'session_summary_id', nullable: true })
  sessionSummaryId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Computed Properties
  get isComplete(): boolean {
    return this.status === 'completed' && !!this.fullText;
  }

  get processingDurationMs(): number | null {
    if (!this.processingStartedAt || !this.processingCompletedAt) {
      return null;
    }
    return this.processingCompletedAt.getTime() - this.processingStartedAt.getTime();
  }

  get averageConfidence(): number {
    if (!this.segments?.length) return this.confidenceScore || 0;
    
    const confidences = this.segments
      .map(s => s.confidence)
      .filter(c => c !== undefined) as number[];
    
    if (!confidences.length) return this.confidenceScore || 0;
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  get durationText(): string {
    const minutes = Math.floor(this.durationSeconds / 60);
    const seconds = Math.floor(this.durationSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Helper Methods
  getTextPreview(length: number = 150): string {
    if (!this.fullText) return 'Transcription pending...';
    
    if (this.fullText.length <= length) {
      return this.fullText;
    }
    
    return this.fullText.substring(0, length).trim() + '...';
  }

  getSpeakerSegments(speakerLabel?: string): TranscriptionSegment[] {
    if (!this.segments) return [];
    
    if (!speakerLabel) return this.segments;
    
    return this.segments.filter(segment => segment.speaker === speakerLabel);
  }

  getSegmentAtTime(timeSeconds: number): TranscriptionSegment | null {
    if (!this.segments) return null;
    
    return this.segments.find(segment => 
      timeSeconds >= segment.start && timeSeconds <= segment.end
    ) || null;
  }

  getQualityScore(): number {
    let score = 0;
    
    // Audio quality contribution (40%)
    switch (this.audioQuality) {
      case 'excellent': score += 40; break;
      case 'good': score += 30; break;
      case 'fair': score += 20; break;
      case 'poor': score += 10; break;
      default: score += 25; // unknown
    }
    
    // Confidence score contribution (40%)
    score += (this.averageConfidence * 40);
    
    // Processing success contribution (20%)
    if (this.status === 'completed' && this.fullText) {
      score += 20;
    }
    
    return Math.round(score);
  }

  // Validation
  validateForProcessing(): string[] {
    const errors: string[] = [];
    
    if (!this.filePath) {
      errors.push('No file path specified');
    }
    
    if (!this.fileSize || this.fileSize === 0) {
      errors.push('Invalid file size');
    }
    
    if (!this.durationSeconds || this.durationSeconds <= 0) {
      errors.push('Invalid duration');
    }
    
    if (this.durationSeconds > 7200) { // 2 hours
      errors.push('Audio file too long for processing');
    }
    
    if (this.fileSize > 100 * 1024 * 1024) { // 100MB
      errors.push('Audio file too large for processing');
    }
    
    return errors;
  }

  // Search functionality
  searchText(query: string, caseSensitive: boolean = false): { 
    found: boolean; 
    matches: number; 
    segments: TranscriptionSegment[] 
  } {
    if (!this.fullText) {
      return { found: false, matches: 0, segments: [] };
    }
    
    const searchText = caseSensitive ? this.fullText : this.fullText.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    
    const matches = (searchText.match(new RegExp(searchQuery, 'g')) || []).length;
    
    let matchingSegments: TranscriptionSegment[] = [];
    if (this.segments && matches > 0) {
      matchingSegments = this.segments.filter(segment => {
        const segmentText = caseSensitive ? segment.text : segment.text.toLowerCase();
        return segmentText.includes(searchQuery);
      });
    }
    
    return {
      found: matches > 0,
      matches,
      segments: matchingSegments
    };
  }
}