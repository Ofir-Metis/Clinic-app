/**
 * Migration to create Google integration tables
 * Creates tables for Google accounts, calendar sync logs, and email logs
 */

import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateGoogleIntegrationTables1704067200000 implements MigrationInterface {
  name = 'CreateGoogleIntegrationTables1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create google_accounts table
    await queryRunner.createTable(
      new Table({
        name: 'google_accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'profile_picture',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'access_token',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'refresh_token',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'token_expires_at',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'scopes',
            type: 'text',
            isNullable: false,
            default: "''",
          },
          {
            name: 'calendar_sync_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'gmail_sync_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'calendar_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            default: "'primary'",
          },
          {
            name: 'sync_status',
            type: 'enum',
            enum: ['active', 'expired', 'revoked', 'error'],
            default: "'active'",
          },
          {
            name: 'last_calendar_sync',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'last_gmail_sync',
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

    // Create calendar_sync_logs table
    await queryRunner.createTable(
      new Table({
        name: 'calendar_sync_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'google_account_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'appointment_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'google_event_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'sync_direction',
            type: 'enum',
            enum: ['to_google', 'from_google', 'bidirectional'],
            isNullable: false,
          },
          {
            name: 'sync_result',
            type: 'enum',
            enum: ['success', 'failed', 'conflict', 'skipped'],
            isNullable: false,
          },
          {
            name: 'sync_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'event_title',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'event_start',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'event_end',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'attendee_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'conflict_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'sync_metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'next_retry_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'synced_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create email_logs table
    await queryRunner.createTable(
      new Table({
        name: 'email_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'google_account_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'appointment_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'recipient_email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'recipient_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'message_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'thread_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'email_type',
            type: 'enum',
            enum: ['confirmation', 'reminder', 'cancellation', 'reschedule', 'custom', 'follow_up'],
            isNullable: false,
          },
          {
            name: 'template_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'has_attachments',
            type: 'boolean',
            default: false,
          },
          {
            name: 'attachment_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'body_preview',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'scheduled_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'sent_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'delivered_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['sent', 'delivered', 'failed', 'bounced', 'spam'],
            default: "'sent'",
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'next_retry_at',
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

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'google_accounts',
      new Index('IDX_google_accounts_user_id', ['user_id'])
    );

    await queryRunner.createIndex(
      'google_accounts',
      new Index('IDX_google_accounts_email', ['email'])
    );

    await queryRunner.createIndex(
      'google_accounts',
      new Index('IDX_google_accounts_sync_status', ['sync_status'])
    );

    await queryRunner.createIndex(
      'calendar_sync_logs',
      new Index('IDX_calendar_sync_logs_google_account_id', ['google_account_id'])
    );

    await queryRunner.createIndex(
      'calendar_sync_logs',
      new Index('IDX_calendar_sync_logs_appointment_id', ['appointment_id'])
    );

    await queryRunner.createIndex(
      'calendar_sync_logs',
      new Index('IDX_calendar_sync_logs_google_event_id', ['google_event_id'])
    );

    await queryRunner.createIndex(
      'calendar_sync_logs',
      new Index('IDX_calendar_sync_logs_sync_result', ['sync_result'])
    );

    await queryRunner.createIndex(
      'calendar_sync_logs',
      new Index('IDX_calendar_sync_logs_synced_at', ['synced_at'])
    );

    await queryRunner.createIndex(
      'email_logs',
      new Index('IDX_email_logs_google_account_id', ['google_account_id'])
    );

    await queryRunner.createIndex(
      'email_logs',
      new Index('IDX_email_logs_appointment_id', ['appointment_id'])
    );

    await queryRunner.createIndex(
      'email_logs',
      new Index('IDX_email_logs_recipient_email', ['recipient_email'])
    );

    await queryRunner.createIndex(
      'email_logs',
      new Index('IDX_email_logs_email_type', ['email_type'])
    );

    await queryRunner.createIndex(
      'email_logs',
      new Index('IDX_email_logs_status', ['status'])
    );

    await queryRunner.createIndex(
      'email_logs',
      new Index('IDX_email_logs_sent_at', ['sent_at'])
    );

    // Add foreign key constraints (assuming users table exists in main database)
    // Note: In a microservices architecture, foreign keys across services are typically avoided
    // These would be enforced at the application level instead
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('email_logs', 'IDX_email_logs_sent_at');
    await queryRunner.dropIndex('email_logs', 'IDX_email_logs_status');
    await queryRunner.dropIndex('email_logs', 'IDX_email_logs_email_type');
    await queryRunner.dropIndex('email_logs', 'IDX_email_logs_recipient_email');
    await queryRunner.dropIndex('email_logs', 'IDX_email_logs_appointment_id');
    await queryRunner.dropIndex('email_logs', 'IDX_email_logs_google_account_id');

    await queryRunner.dropIndex('calendar_sync_logs', 'IDX_calendar_sync_logs_synced_at');
    await queryRunner.dropIndex('calendar_sync_logs', 'IDX_calendar_sync_logs_sync_result');
    await queryRunner.dropIndex('calendar_sync_logs', 'IDX_calendar_sync_logs_google_event_id');
    await queryRunner.dropIndex('calendar_sync_logs', 'IDX_calendar_sync_logs_appointment_id');
    await queryRunner.dropIndex('calendar_sync_logs', 'IDX_calendar_sync_logs_google_account_id');

    await queryRunner.dropIndex('google_accounts', 'IDX_google_accounts_sync_status');
    await queryRunner.dropIndex('google_accounts', 'IDX_google_accounts_email');
    await queryRunner.dropIndex('google_accounts', 'IDX_google_accounts_user_id');

    // Drop tables
    await queryRunner.dropTable('email_logs');
    await queryRunner.dropTable('calendar_sync_logs');
    await queryRunner.dropTable('google_accounts');
  }
}