/**
 * Migration: Create Recording Tables
 * Creates tables for chunked upload tracking and recording management
 */

import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateRecordingTables1751576200 implements MigrationInterface {
  name = 'CreateRecordingTables1751576200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create recording_uploads table
    await queryRunner.createTable(
      new Table({
        name: 'recording_uploads',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'recordingId',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false
          },
          {
            name: 'sessionId',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'participantId',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 's3Key',
            type: 'varchar',
            length: '500',
            isNullable: false
          },
          {
            name: 's3UploadId',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 's3Location',
            type: 'varchar',
            length: '500',
            isNullable: true
          },
          {
            name: 'totalChunks',
            type: 'int',
            isNullable: false
          },
          {
            name: 'uploadedChunks',
            type: 'int',
            default: 0
          },
          {
            name: 'estimatedSize',
            type: 'bigint',
            isNullable: false
          },
          {
            name: 'uploadedSize',
            type: 'bigint',
            default: 0
          },
          {
            name: 'mimeType',
            type: 'varchar',
            length: '100',
            isNullable: false
          },
          {
            name: 'originalName',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'uploading', 'completed', 'failed', 'aborted'],
            default: "'pending'"
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    );

    // Create recording_chunks table
    await queryRunner.createTable(
      new Table({
        name: 'recording_chunks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()'
          },
          {
            name: 'recordingId',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'chunkIndex',
            type: 'int',
            isNullable: false
          },
          {
            name: 'size',
            type: 'int',
            isNullable: false
          },
          {
            name: 'etag',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'retryCount',
            type: 'int',
            isNullable: true
          },
          {
            name: 'lastError',
            type: 'text',
            isNullable: true
          },
          {
            name: 'uploadedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    );

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX "IDX_recording_uploads_recordingId" ON recording_uploads ("recordingId");
      CREATE INDEX "IDX_recording_uploads_session_participant" ON recording_uploads ("sessionId", "participantId");
      CREATE INDEX "IDX_recording_uploads_status_updated" ON recording_uploads (status, "updatedAt");
      CREATE INDEX "IDX_recording_chunks_recordingId" ON recording_chunks ("recordingId");
      CREATE UNIQUE INDEX "IDX_recording_chunks_unique" ON recording_chunks ("recordingId", "chunkIndex");
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE recording_chunks 
      ADD CONSTRAINT FK_recording_chunks_upload 
      FOREIGN KEY (recordingId) 
      REFERENCES recording_uploads(recordingId) 
      ON DELETE CASCADE
    `);

    // Create view for recording statistics
    await queryRunner.query(`
      CREATE VIEW recording_stats AS
      SELECT 
        DATE(createdAt) as date,
        status,
        COUNT(*) as count,
        SUM(uploadedSize) as totalSize,
        AVG(uploadedSize) as avgSize,
        AVG(EXTRACT(EPOCH FROM (completedAt - createdAt))) as avgUploadTimeSeconds
      FROM recording_uploads 
      GROUP BY DATE(createdAt), status
      ORDER BY date DESC, status;
    `);

    console.log('Recording tables and indexes created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop view
    await queryRunner.query('DROP VIEW IF EXISTS recording_stats');

    // Drop foreign key constraint
    await queryRunner.query('ALTER TABLE recording_chunks DROP CONSTRAINT IF EXISTS FK_recording_chunks_upload');

    // Drop indexes
    await queryRunner.dropIndex('recording_chunks', 'IDX_recording_chunks_unique');
    await queryRunner.dropIndex('recording_chunks', 'IDX_recording_chunks_recordingId');
    await queryRunner.dropIndex('recording_uploads', 'IDX_recording_uploads_status_updated');
    await queryRunner.dropIndex('recording_uploads', 'IDX_recording_uploads_session_participant');
    await queryRunner.dropIndex('recording_uploads', 'IDX_recording_uploads_recordingId');

    // Drop tables
    await queryRunner.dropTable('recording_chunks');
    await queryRunner.dropTable('recording_uploads');

    console.log('Recording tables dropped successfully');
  }
}