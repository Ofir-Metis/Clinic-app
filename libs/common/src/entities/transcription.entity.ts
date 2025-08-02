/**
 * Transcription Entity - AI-generated transcripts
 * Stores transcription results from OpenAI Whisper or other speech-to-text services
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Recording } from './recording.entity';

export interface TranscriptionSegment {
  id: number;
  start: number; // start time in seconds
  end: number; // end time in seconds
  text: string;
  confidence?: number;
  speakerId?: string;
}

export interface SpeakerLabel {
  speakerId: string;
  speakerName?: string;
  segments: number[]; // segment IDs
  totalDuration: number; // total speaking time in seconds
  confidence: number;
}

@Entity('transcriptions')
@Index(['recordingId'])
@Index(['language'])
@Index(['confidence'])
@Index(['createdAt'])
export class Transcription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recording_id', type: 'uuid' })
  recordingId: string;

  // Transcription content
  @Column({ name: 'text', type: 'text' })
  text: string;

  @Column({ name: 'segments', type: 'jsonb', nullable: true })
  segments?: TranscriptionSegment[];

  @Column({ name: 'language', length: 10, default: 'en' })
  language: string;

  @Column({ name: 'confidence', type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidence?: number; // 0.0000 to 1.0000

  // Speaker identification
  @Column({ name: 'speaker_labels', type: 'jsonb', nullable: true })
  speakerLabels?: SpeakerLabel[];

  @Column({ name: 'speaker_count', type: 'int', default: 1 })
  speakerCount: number;

  // Processing metadata
  @Column({ name: 'model_used', length: 100, default: 'whisper-1' })
  modelUsed: string;

  @Column({ name: 'processing_time', type: 'int', nullable: true })
  processingTime?: number; // processing time in milliseconds

  @Column({ name: 'cost', type: 'decimal', precision: 10, scale: 4, nullable: true })
  cost?: number; // processing cost in USD

  // Quality metrics
  @Column({ name: 'word_count', type: 'int', nullable: true })
  wordCount?: number;

  @Column({ name: 'estimated_accuracy', type: 'decimal', precision: 5, scale: 4, nullable: true })
  estimatedAccuracy?: number;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Recording, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recording_id' })
  recording: Recording;

  // Helper methods
  getSegmentByTimeRange(startTime: number, endTime: number): TranscriptionSegment[] {
    if (!this.segments) return [];
    
    return this.segments.filter(segment => 
      segment.start >= startTime && segment.end <= endTime
    );
  }

  getTextByTimeRange(startTime: number, endTime: number): string {
    const segments = this.getSegmentByTimeRange(startTime, endTime);
    return segments.map(segment => segment.text).join(' ');
  }

  getSpeakerText(speakerId: string): string {
    if (!this.segments || !this.speakerLabels) return '';

    const speaker = this.speakerLabels.find(s => s.speakerId === speakerId);
    if (!speaker) return '';

    const speakerSegments = this.segments.filter(segment => 
      speaker.segments.includes(segment.id)
    );

    return speakerSegments.map(segment => segment.text).join(' ');
  }

  getAverageConfidence(): number {
    if (!this.segments || this.segments.length === 0) {
      return this.confidence || 0;
    }

    const segmentsWithConfidence = this.segments.filter(s => s.confidence !== undefined);
    if (segmentsWithConfidence.length === 0) {
      return this.confidence || 0;
    }

    const totalConfidence = segmentsWithConfidence.reduce((sum, segment) => 
      sum + (segment.confidence || 0), 0
    );

    return totalConfidence / segmentsWithConfidence.length;
  }

  getDurationInMinutes(): number {
    if (!this.segments || this.segments.length === 0) return 0;
    
    const lastSegment = this.segments[this.segments.length - 1];
    return Math.round((lastSegment.end / 60) * 100) / 100;
  }

  getWordsPerMinute(): number {
    if (!this.wordCount) return 0;
    
    const durationMinutes = this.getDurationInMinutes();
    if (durationMinutes === 0) return 0;
    
    return Math.round(this.wordCount / durationMinutes);
  }

  isHighQuality(): boolean {
    return this.getAverageConfidence() >= 0.85;
  }

  getSpeakerSummary(): { [speakerId: string]: { name?: string; duration: number; wordCount: number } } {
    if (!this.speakerLabels || !this.segments) return {};

    const summary: { [speakerId: string]: { name?: string; duration: number; wordCount: number } } = {};

    this.speakerLabels.forEach(speaker => {
      const speakerSegments = this.segments!.filter(segment => 
        speaker.segments.includes(segment.id)
      );

      const wordCount = speakerSegments.reduce((count, segment) => 
        count + segment.text.split(/\s+/).length, 0
      );

      summary[speaker.speakerId] = {
        name: speaker.speakerName,
        duration: speaker.totalDuration,
        wordCount
      };
    });

    return summary;
  }

  // Search functionality
  searchText(query: string, caseSensitive: boolean = false): TranscriptionSegment[] {
    if (!this.segments) return [];

    const searchQuery = caseSensitive ? query : query.toLowerCase();
    
    return this.segments.filter(segment => {
      const text = caseSensitive ? segment.text : segment.text.toLowerCase();
      return text.includes(searchQuery);
    });
  }

  getTimestampedText(): string {
    if (!this.segments) return this.text;

    return this.segments.map(segment => {
      const startTime = this.formatTime(segment.start);
      const endTime = this.formatTime(segment.end);
      return `[${startTime} - ${endTime}] ${segment.text}`;
    }).join('\n');
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}