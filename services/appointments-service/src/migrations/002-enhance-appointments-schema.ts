/**
 * Migration to enhance appointments table with meeting types and recording support
 * Transforms existing appointments table to support flexible meeting management
 */

import { MigrationInterface, QueryRunner, TableColumn, Index } from 'typeorm';

export class EnhanceAppointmentsSchema1704067300000 implements MigrationInterface {
  name = 'EnhanceAppointmentsSchema1704067300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table exists (create if not)
    const hasTable = await queryRunner.hasTable('appointments');
    
    if (!hasTable) {
      // Create appointments table if it doesn't exist
      await queryRunner.query(`
        CREATE TABLE "appointments" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "therapist_id" uuid NOT NULL,
          "client_id" uuid NOT NULL,
          "start_time" timestamptz NOT NULL,
          "end_time" timestamptz NOT NULL,
          "meeting_type" varchar NOT NULL DEFAULT 'in-person',
          "status" varchar NOT NULL DEFAULT 'scheduled',
          "title" varchar(200) NOT NULL,
          "description" text,
          "meeting_config" jsonb NOT NULL DEFAULT '{}',
          "google_event_id" varchar,
          "google_account_id" uuid,
          "calendar_synced" boolean DEFAULT false,
          "last_calendar_sync" timestamptz,
          "recording_session_id" uuid,
          "recording_status" varchar,
          "recording_files" jsonb,
          "reminder_sent" boolean DEFAULT false,
          "confirmation_sent" boolean DEFAULT false,
          "reminder_times" jsonb DEFAULT '["24h", "1h"]',
          "client_timezone" varchar,
          "client_preferences" jsonb,
          "notes" text,
          "tags" jsonb,
          "is_recurring" boolean DEFAULT false,
          "recurring_pattern" jsonb,
          "parent_appointment_id" uuid,
          "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
          "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
          "created_by" uuid NOT NULL,
          "updated_by" uuid
        )
      `);
    } else {
      // Alter existing table to add new columns
      
      // Change id to UUID if it's not already
      const idColumn = await queryRunner.getTable('appointments').then(table => 
        table?.columns.find(col => col.name === 'id')
      );
      
      if (idColumn && idColumn.type !== 'uuid') {
        // Backup existing data
        await queryRunner.query(`
          CREATE TABLE appointments_backup AS SELECT * FROM appointments;
        `);
        
        // Drop and recreate with UUID
        await queryRunner.query(`DROP TABLE appointments CASCADE;`);
        
        // Create new table structure
        await queryRunner.query(`
          CREATE TABLE "appointments" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "therapist_id" uuid NOT NULL,
            "client_id" uuid NOT NULL,
            "start_time" timestamptz NOT NULL,
            "end_time" timestamptz NOT NULL,
            "meeting_type" varchar NOT NULL DEFAULT 'in-person',
            "status" varchar NOT NULL DEFAULT 'scheduled',
            "title" varchar(200) NOT NULL DEFAULT 'Therapy Session',
            "description" text,
            "meeting_config" jsonb NOT NULL DEFAULT '{"type": "in-person", "googleMeetEnabled": false, "waitingRoomEnabled": true, "recordingSettings": {"enabled": false, "type": "none", "quality": "medium", "autoStart": false, "includeTranscription": false, "retentionDays": 30, "shareWithClient": false}, "allowClientToJoinEarly": false, "meetingDuration": 60}',
            "google_event_id" varchar,
            "google_account_id" uuid,
            "calendar_synced" boolean DEFAULT false,
            "last_calendar_sync" timestamptz,
            "recording_session_id" uuid,
            "recording_status" varchar,
            "recording_files" jsonb,
            "reminder_sent" boolean DEFAULT false,
            "confirmation_sent" boolean DEFAULT false,
            "reminder_times" jsonb DEFAULT '["24h", "1h"]',
            "client_timezone" varchar,
            "client_preferences" jsonb,
            "notes" text,
            "tags" jsonb,
            "is_recurring" boolean DEFAULT false,
            "recurring_pattern" jsonb,
            "parent_appointment_id" uuid,
            "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
            "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
            "created_by" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
            "updated_by" uuid
          )
        `);
        
        // Note: Manual data migration would be needed here in production
        // This is a breaking change that requires careful handling
      } else {
        // Add new columns to existing table
        const columns = [
          new TableColumn({
            name: 'title',
            type: 'varchar',
            length: '200',
            isNullable: false,
            default: "'Therapy Session'"
          }),
          new TableColumn({
            name: 'description',
            type: 'text',
            isNullable: true
          }),
          new TableColumn({
            name: 'meeting_config',
            type: 'jsonb',
            isNullable: false,
            default: `'{"type": "in-person", "googleMeetEnabled": false, "waitingRoomEnabled": true, "recordingSettings": {"enabled": false, "type": "none", "quality": "medium", "autoStart": false, "includeTranscription": false, "retentionDays": 30, "shareWithClient": false}, "allowClientToJoinEarly": false, "meetingDuration": 60}'`
          }),
          new TableColumn({
            name: 'google_event_id',
            type: 'varchar',
            isNullable: true
          }),
          new TableColumn({
            name: 'google_account_id',
            type: 'uuid',
            isNullable: true
          }),
          new TableColumn({
            name: 'calendar_synced',
            type: 'boolean',
            default: false
          }),
          new TableColumn({
            name: 'last_calendar_sync',
            type: 'timestamptz',
            isNullable: true
          }),
          new TableColumn({
            name: 'recording_session_id',
            type: 'uuid',
            isNullable: true
          }),
          new TableColumn({
            name: 'recording_status',
            type: 'varchar',
            isNullable: true
          }),
          new TableColumn({
            name: 'recording_files',
            type: 'jsonb',
            isNullable: true
          }),
          new TableColumn({
            name: 'reminder_sent',
            type: 'boolean',
            default: false
          }),
          new TableColumn({
            name: 'confirmation_sent',
            type: 'boolean',
            default: false
          }),
          new TableColumn({
            name: 'reminder_times',
            type: 'jsonb',
            default: `'["24h", "1h"]'`
          }),
          new TableColumn({
            name: 'client_timezone',
            type: 'varchar',
            isNullable: true
          }),
          new TableColumn({
            name: 'client_preferences',
            type: 'jsonb',
            isNullable: true
          }),
          new TableColumn({
            name: 'notes',
            type: 'text',
            isNullable: true
          }),
          new TableColumn({
            name: 'tags',
            type: 'jsonb',
            isNullable: true
          }),
          new TableColumn({
            name: 'is_recurring',
            type: 'boolean',
            default: false
          }),
          new TableColumn({
            name: 'recurring_pattern',
            type: 'jsonb',
            isNullable: true
          }),
          new TableColumn({
            name: 'parent_appointment_id',
            type: 'uuid',
            isNullable: true
          }),
          new TableColumn({
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
            default: "'00000000-0000-0000-0000-000000000001'"
          }),
          new TableColumn({
            name: 'updated_by',
            type: 'uuid',
            isNullable: true
          })
        ];

        for (const column of columns) {
          const hasColumn = await queryRunner.hasColumn('appointments', column.name);
          if (!hasColumn) {
            await queryRunner.addColumn('appointments', column);
          }
        }

        // Update meeting_type column to enum if it exists but is wrong type
        const meetingTypeColumn = await queryRunner.getTable('appointments').then(table => 
          table?.columns.find(col => col.name === 'meeting_type')
        );
        
        if (meetingTypeColumn && meetingTypeColumn.type !== 'enum') {
          await queryRunner.query(`
            ALTER TABLE appointments 
            ALTER COLUMN meeting_type TYPE varchar(50),
            ALTER COLUMN meeting_type SET DEFAULT 'in-person'
          `);
        }

        // Update status column to use better enum values
        const statusColumn = await queryRunner.getTable('appointments').then(table => 
          table?.columns.find(col => col.name === 'status')
        );
        
        if (statusColumn) {
          await queryRunner.query(`
            ALTER TABLE appointments 
            ALTER COLUMN status TYPE varchar(50),
            ALTER COLUMN status SET DEFAULT 'scheduled'
          `);
        }
      }
    }

    // Create indexes for better query performance
    const indexes = [
      new Index('IDX_appointments_therapist_id', ['therapist_id']),
      new Index('IDX_appointments_client_id', ['client_id']),
      new Index('IDX_appointments_start_time', ['start_time']),
      new Index('IDX_appointments_status', ['status']),
      new Index('IDX_appointments_meeting_type', ['meeting_type']),
      new Index('IDX_appointments_google_event_id', ['google_event_id']),
      new Index('IDX_appointments_recording_session_id', ['recording_session_id']),
      new Index('IDX_appointments_created_at', ['created_at']),
      new Index('IDX_appointments_therapist_start_time', ['therapist_id', 'start_time']),
      new Index('IDX_appointments_client_start_time', ['client_id', 'start_time']),
      new Index('IDX_appointments_status_start_time', ['status', 'start_time'])
    ];

    for (const index of indexes) {
      try {
        await queryRunner.createIndex('appointments', index);
      } catch (error) {
        // Index might already exist, continue
        console.log(`Index ${index.name} might already exist: ${error}`);
      }
    }

    // Update existing appointments with default meeting config if they don't have it
    await queryRunner.query(`
      UPDATE appointments 
      SET meeting_config = '{"type": "in-person", "googleMeetEnabled": false, "waitingRoomEnabled": true, "recordingSettings": {"enabled": false, "type": "none", "quality": "medium", "autoStart": false, "includeTranscription": false, "retentionDays": 30, "shareWithClient": false}, "allowClientToJoinEarly": false, "meetingDuration": 60}'
      WHERE meeting_config IS NULL OR meeting_config = '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    const indexes = [
      'IDX_appointments_therapist_id',
      'IDX_appointments_client_id', 
      'IDX_appointments_start_time',
      'IDX_appointments_status',
      'IDX_appointments_meeting_type',
      'IDX_appointments_google_event_id',
      'IDX_appointments_recording_session_id',
      'IDX_appointments_created_at',
      'IDX_appointments_therapist_start_time',
      'IDX_appointments_client_start_time',
      'IDX_appointments_status_start_time'
    ];

    for (const indexName of indexes) {
      try {
        await queryRunner.dropIndex('appointments', indexName);
      } catch (error) {
        // Index might not exist, continue
        console.log(`Index ${indexName} might not exist: ${error}`);
      }
    }

    // Remove added columns (this is destructive - be careful in production)
    const columnsToRemove = [
      'title', 'description', 'meeting_config', 'google_event_id', 'google_account_id',
      'calendar_synced', 'last_calendar_sync', 'recording_session_id', 'recording_status',
      'recording_files', 'reminder_sent', 'confirmation_sent', 'reminder_times',
      'client_timezone', 'client_preferences', 'notes', 'tags', 'is_recurring',
      'recurring_pattern', 'parent_appointment_id', 'created_by', 'updated_by'
    ];

    for (const columnName of columnsToRemove) {
      try {
        const hasColumn = await queryRunner.hasColumn('appointments', columnName);
        if (hasColumn) {
          await queryRunner.dropColumn('appointments', columnName);
        }
      } catch (error) {
        console.log(`Could not drop column ${columnName}: ${error}`);
      }
    }

    // Restore backup if it exists
    const hasBackup = await queryRunner.hasTable('appointments_backup');
    if (hasBackup) {
      await queryRunner.query(`DROP TABLE IF EXISTS appointments CASCADE`);
      await queryRunner.query(`ALTER TABLE appointments_backup RENAME TO appointments`);
    }
  }
}