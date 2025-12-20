import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'clinic',
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/*{.ts,.js}')],
  synchronize: false, // Never use synchronize with migrations
  logging: ['query', 'error'],
  migrationsRun: false, // Don't auto-run migrations
};

// Export DataSource for TypeORM CLI
export const AppDataSource = new DataSource(dataSourceOptions);

// Initialize the datasource
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized for migrations');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization for migrations:', err);
  });

export default AppDataSource;
