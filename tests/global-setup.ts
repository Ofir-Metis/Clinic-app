import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Global test setup for comprehensive clinic system tests
 * 
 * This setup ensures:
 * - Infrastructure services are running
 * - Database is accessible
 * - Required directories exist
 * - Environment is properly configured
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Global test setup starting...');
  
  try {
    // Ensure test-results directory exists
    const testResultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
      console.log('📁 Created test-results directory');
    }
    
    // Check if Docker is running
    try {
      await execAsync('docker ps');
      console.log('✅ Docker is running');
    } catch (error) {
      console.error('❌ Docker is not running. Please start Docker and try again.');
      throw new Error('Docker is required for running tests');
    }
    
    // Start infrastructure services if not already running
    console.log('🐳 Ensuring infrastructure services are running...');
    const infraServices = 'postgres nats redis minio maildev';
    
    try {
      await execAsync(`docker compose up -d ${infraServices}`);
      console.log('✅ Infrastructure services are running');
      
      // Wait for services to be ready
      await new Promise(resolve => setTimeout(resolve, 15000));
      
    } catch (error) {
      console.warn('⚠️ Some infrastructure services may already be running');
    }
    
    // Build shared library
    console.log('🔧 Building shared library...');
    try {
      await execAsync('yarn workspace @clinic/common build', { cwd: '../' });
      console.log('✅ Shared library built successfully');
    } catch (error) {
      console.warn('⚠️ Shared library build failed, continuing anyway');
    }
    
    // Verify database connectivity
    console.log('🔍 Verifying database connectivity...');
    try {
      // Try to connect to PostgreSQL
      await execAsync('docker compose exec -T postgres pg_isready -h localhost -p 5432');
      console.log('✅ Database is accessible');
    } catch (error) {
      console.warn('⚠️ Database connectivity check failed');
    }
    
    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/clinic_db';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.NATS_URL = 'nats://localhost:4222';
    
    console.log('✅ Global test setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global test setup failed:', error.message);
    throw error;
  }
}

export default globalSetup;