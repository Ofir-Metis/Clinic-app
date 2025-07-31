import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { RecordingUpload } from './files/recording-upload.entity';
import { RecordingChunk } from './files/recording-chunk.entity';

// Load environment variables
config({ path: '../../.env' });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: +(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  database: process.env.POSTGRES_DB || 'clinic_db',
  entities: [RecordingUpload, RecordingChunk],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
});