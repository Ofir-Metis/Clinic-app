/**
 * Migration: Create Session Analysis Tables
 * Creates tables for session summaries and transcriptions
 */

import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateSessionAnalysisTables1698000000001 implements MigrationInterface {
  name = 'CreateSessionAnalysisTables1698000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create session_summaries table
    await queryRunner.createTable(
      new Table({
        name: 'session_summaries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'appointment_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'coach_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'session_type',
            type: 'enum',
            enum: ['initial-consultation', 'follow-up', 'goal-setting', 'progress-review', 'breakthrough', 'other'],
            default: "'other'",
          },
          {
            name: 'processing_status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed', 'requires-review'],
            default: "'pending'",
          },
          {
            name: 'key_insights',
            type: 'text',
            isArray: true,
            default: 'ARRAY[]::text[]',
          },
          {
            name: 'progress_made',
            type: 'text',
            isArray: true,
            default: 'ARRAY[]::text[]',
          },
          {
            name: 'challenges_discussed',
            type: 'text',
            isArray: true,
            default: 'ARRAY[]::text[]',
          },
          {
            name: 'action_items',
            type: 'text',
            isArray: true,
            default: 'ARRAY[]::text[]',
          },
          {
            name: 'next_session_focus',
            type: 'text',
            default: "''",
          },
          {
            name: 'emotional_tone',
            type: 'enum',
            enum: ['positive', 'neutral', 'challenging', 'breakthrough'],
            default: "'neutral'",
          },
          {
            name: 'client_engagement',
            type: 'enum',
            enum: ['high', 'medium', 'low'],
            default: "'medium'",
          },
          {
            name: 'coaching_techniques',
            type: 'text',
            isArray: true,
            default: 'ARRAY[]::text[]',
          },
          {
            name: 'breakthrough_moments',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'homework',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'follow_up_required',
            type: 'boolean',
            default: false,
          },
          {
            name: 'confidence_level',
            type: 'decimal',
            precision: 3,
            scale: 1,
            default: 0,
          },
          {
            name: 'raw_transcript',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'transcript_length',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'session_duration_minutes',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'processing_time_ms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'processing_error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ai_metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'reviewed_by_coach',
            type: 'boolean',
            default: false,
          },
          {
            name: 'coach_feedback',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'coach_rating',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'reviewed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'shared_with_client',
            type: 'boolean',
            default: false,
          },
          {
            name: 'client_viewed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'client_viewed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create transcriptions table
    await queryRunner.createTable(
      new Table({
        name: 'transcriptions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'appointment_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'recording_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'coach_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'original_filename',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '1000',
          },
          {
            name: 'file_size',
            type: 'bigint',
          },
          {
            name: 'duration_seconds',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: "'pending'",
          },
          {
            name: 'full_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'character_count',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'word_count',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'audio_quality',
            type: 'enum',
            enum: ['excellent', 'good', 'fair', 'poor'],
            isNullable: true,
          },
          {
            name: 'confidence_score',
            type: 'decimal',
            precision: 4,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'language_detected',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'segments',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'speaker_count',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'has_speaker_labels',
            type: 'boolean',
            default: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'processing_started_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'processing_completed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_details',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'noise_reduced',
            type: 'boolean',
            default: false,
          },
          {
            name: 'audio_enhanced',
            type: 'boolean',
            default: false,
          },
          {
            name: 'preprocessing_config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'key_phrases',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'topics',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'sentiment_analysis',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'contains_sensitive_data',
            type: 'boolean',
            default: false,
          },
          {
            name: 'redacted_phrases',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'client_access_allowed',
            type: 'boolean',
            default: true,
          },
          {
            name: 'session_summary_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes for session_summaries
    await queryRunner.createIndex(
      'session_summaries',
      new Index({
        name: 'IDX_session_summaries_appointment_id',
        columnNames: ['appointment_id'],
      })
    );

    await queryRunner.createIndex(
      'session_summaries',
      new Index({
        name: 'IDX_session_summaries_coach_id',
        columnNames: ['coach_id'],
      })
    );

    await queryRunner.createIndex(
      'session_summaries',
      new Index({
        name: 'IDX_session_summaries_client_id',
        columnNames: ['client_id'],
      })
    );

    await queryRunner.createIndex(
      'session_summaries',
      new Index({
        name: 'IDX_session_summaries_processing_status',
        columnNames: ['processing_status'],
      })
    );

    await queryRunner.createIndex(
      'session_summaries',
      new Index({
        name: 'IDX_session_summaries_created_at',
        columnNames: ['created_at'],
      })
    );

    // Create indexes for transcriptions
    await queryRunner.createIndex(
      'transcriptions',
      new Index({
        name: 'IDX_transcriptions_appointment_id',
        columnNames: ['appointment_id'],
      })
    );

    await queryRunner.createIndex(
      'transcriptions',
      new Index({
        name: 'IDX_transcriptions_recording_id',
        columnNames: ['recording_id'],
      })
    );

    await queryRunner.createIndex(
      'transcriptions',
      new Index({
        name: 'IDX_transcriptions_coach_id',
        columnNames: ['coach_id'],
      })
    );

    await queryRunner.createIndex(
      'transcriptions',
      new Index({
        name: 'IDX_transcriptions_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'transcriptions',
      new Index({
        name: 'IDX_transcriptions_created_at',
        columnNames: ['created_at'],
      })
    );

    // Create foreign key constraint
    await queryRunner.query(`
      ALTER TABLE transcriptions 
      ADD CONSTRAINT FK_transcriptions_session_summary 
      FOREIGN KEY (session_summary_id) 
      REFERENCES session_summaries(id) 
      ON DELETE SET NULL
    `);

    // Create full-text search index for transcription text
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_transcriptions_fulltext_search 
      ON transcriptions 
      USING gin(to_tsvector('english', COALESCE(full_text, '')))
    `);

    // Create trigger for updated_at timestamps
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_session_summaries_updated_at 
      BEFORE UPDATE ON session_summaries 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_transcriptions_updated_at 
      BEFORE UPDATE ON transcriptions 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query('DROP TRIGGER IF EXISTS update_session_summaries_updated_at ON session_summaries');
    await queryRunner.query('DROP TRIGGER IF EXISTS update_transcriptions_updated_at ON transcriptions');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_updated_at_column()');

    // Drop full-text search index
    await queryRunner.query('DROP INDEX IF EXISTS IDX_transcriptions_fulltext_search');

    // Drop foreign key constraint
    await queryRunner.query('ALTER TABLE transcriptions DROP CONSTRAINT IF EXISTS FK_transcriptions_session_summary');

    // Drop indexes
    await queryRunner.dropIndex('transcriptions', 'IDX_transcriptions_created_at');
    await queryRunner.dropIndex('transcriptions', 'IDX_transcriptions_status');
    await queryRunner.dropIndex('transcriptions', 'IDX_transcriptions_coach_id');
    await queryRunner.dropIndex('transcriptions', 'IDX_transcriptions_recording_id');
    await queryRunner.dropIndex('transcriptions', 'IDX_transcriptions_appointment_id');

    await queryRunner.dropIndex('session_summaries', 'IDX_session_summaries_created_at');
    await queryRunner.dropIndex('session_summaries', 'IDX_session_summaries_processing_status');
    await queryRunner.dropIndex('session_summaries', 'IDX_session_summaries_client_id');
    await queryRunner.dropIndex('session_summaries', 'IDX_session_summaries_coach_id');
    await queryRunner.dropIndex('session_summaries', 'IDX_session_summaries_appointment_id');

    // Drop tables
    await queryRunner.dropTable('transcriptions');
    await queryRunner.dropTable('session_summaries');
  }
}