/**
 * Entity exports for the clinic recording system
 * Provides TypeORM entities for all database tables
 */

export * from './recording.entity';
export * from './transcription.entity';
export * from './session-summary.entity';

// Re-export types for external use
export type {
  RecordingStatus,
  ProcessingStatus,
  RecordingMode,
  SessionType,
  Quality,
} from './recording.entity';

export type {
  TranscriptionSegment,
  SpeakerLabel,
} from './transcription.entity';

export type {
  KeyPoint,
  ActionItem,
  SessionInsight,
  SessionContext,
  SentimentAnalysis,
} from './session-summary.entity';