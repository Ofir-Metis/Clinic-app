/**
 * TypeORM configuration for migrations
 * This configuration is used by the TypeORM CLI for running migrations
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { GoogleAccount } from '../entities/google-account.entity';
import { CalendarSyncLog } from '../entities/calendar-sync-log.entity';
import { EmailLog } from '../entities/email-log.entity';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'clinic_db',
  entities: [GoogleAccount, CalendarSyncLog, EmailLog],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false, // Never use synchronize in production
  logging: ['error', 'warn'],
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

export default AppDataSource;