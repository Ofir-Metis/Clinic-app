import { GlobalConfig } from '@jest/types';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Global setup for integration tests
 * This runs once before all test suites
 */
export default async function globalSetup(globalConfig: GlobalConfig): Promise<void> {
  console.log('🚀 Global Integration Test Setup Starting...');

  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'error';
    process.env.TEST_MODE = 'integration';
    
    // Create test output directories
    await createTestDirectories();
    
    // Validate system requirements
    await validateRequirements();
    
    // Prepare test database schemas
    await prepareTestSchemas();
    
    // Build dependencies
    await buildDependencies();
    
    // Setup global test data
    await setupGlobalTestData();
    
    // Warm up services
    await warmupServices();
    
    console.log('✅ Global Integration Test Setup Completed');
    
  } catch (error) {
    console.error('❌ Global Integration Test Setup Failed:', error);
    throw error;
  }
}

/**
 * Create necessary test directories
 */
async function createTestDirectories(): Promise<void> {
  const directories = [
    'test-results',
    'test-results/coverage',
    'test-results/reports',
    'test-results/logs',
    'test-results/artifacts',
    'test-data',
    'test-data/fixtures',
    'test-data/snapshots'
  ];

  for (const dir of directories) {
    const fullPath = path.join(__dirname, dir);
    try {
      await fs.mkdir(fullPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  console.log('📁 Test directories created');
}

/**
 * Validate system requirements
 */
async function validateRequirements(): Promise<void> {
  const requirements = [
    { command: 'docker --version', name: 'Docker' },
    { command: 'docker-compose --version', name: 'Docker Compose' },
    { command: 'node --version', name: 'Node.js' },
    { command: 'yarn --version', name: 'Yarn' }
  ];

  for (const req of requirements) {
    try {
      await execCommand(req.command);
    } catch (error) {
      throw new Error(`${req.name} is not available or not working properly`);
    }
  }

  // Check Docker daemon
  try {
    await execCommand('docker ps');
  } catch (error) {
    throw new Error('Docker daemon is not running');
  }

  // Check available memory
  const memInfo = await fs.readFile('/proc/meminfo', 'utf8').catch(() => '');
  if (memInfo) {
    const memTotal = memInfo.match(/MemTotal:\s*(\d+)\s*kB/);
    if (memTotal) {
      const totalMemoryGB = parseInt(memTotal[1]) / 1024 / 1024;
      if (totalMemoryGB < 4) {
        console.warn('⚠️ Warning: Less than 4GB RAM available. Tests may be slower.');
      }
    }
  }

  console.log('🔍 System requirements validated');
}

/**
 * Prepare test database schemas
 */
async function prepareTestSchemas(): Promise<void> {
  const schemaPath = path.join(__dirname, '../../scripts/test-schema.sql');
  
  const schema = `
-- Test database schema for integration tests
-- This schema is created once during global setup

-- Create test-specific extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create test schemas
CREATE SCHEMA IF NOT EXISTS test_auth;
CREATE SCHEMA IF NOT EXISTS test_appointments;
CREATE SCHEMA IF NOT EXISTS test_files;
CREATE SCHEMA IF NOT EXISTS test_notifications;
CREATE SCHEMA IF NOT EXISTS test_ai;
CREATE SCHEMA IF NOT EXISTS test_notes;
CREATE SCHEMA IF NOT EXISTS test_analytics;
CREATE SCHEMA IF NOT EXISTS test_settings;
CREATE SCHEMA IF NOT EXISTS test_billing;
CREATE SCHEMA IF NOT EXISTS test_performance;
CREATE SCHEMA IF NOT EXISTS test_audit;

-- Grant permissions for test user
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'test_user') THEN
        CREATE ROLE test_user LOGIN PASSWORD 'test_password';
    END IF;
END
$$;

-- Function to clean test data
CREATE OR REPLACE FUNCTION clean_test_data()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Disable foreign key checks
    SET session_replication_role = replica;
    
    -- Truncate all test tables
    FOR rec IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname LIKE 'test_%'
    LOOP
        EXECUTE format('TRUNCATE TABLE %I.%I RESTART IDENTITY CASCADE', rec.schemaname, rec.tablename);
    END LOOP;
    
    -- Re-enable foreign key checks
    SET session_replication_role = DEFAULT;
END;
$$ LANGUAGE plpgsql;

-- Function to seed test data
CREATE OR REPLACE FUNCTION seed_test_data()
RETURNS void AS $$
BEGIN
    -- This will be populated with test data seeding logic
    -- Called by individual test suites as needed
    NULL;
END;
$$ LANGUAGE plpgsql;
`;

  await fs.writeFile(schemaPath, schema);
  console.log('🗄️ Test database schemas prepared');
}

/**
 * Build dependencies
 */
async function buildDependencies(): Promise<void> {
  const rootDir = path.join(__dirname, '../../');
  
  // Build common library first (critical dependency)
  console.log('🔨 Building @clinic/common library...');
  await execCommand('yarn workspace @clinic/common build', { cwd: rootDir });
  
  // Install test dependencies
  console.log('📦 Installing test dependencies...');
  await execCommand('yarn install --frozen-lockfile', { cwd: __dirname });
  
  console.log('✅ Dependencies built successfully');
}

/**
 * Setup global test data
 */
async function setupGlobalTestData(): Promise<void> {
  const testDataDir = path.join(__dirname, 'test-data');
  
  // Create fixture data
  const fixtures = {
    users: {
      testClient: {
        id: 'test-client-id',
        email: 'test-client@example.com',
        firstName: 'Test',
        lastName: 'Client',
        role: 'client',
        isActive: true,
        isEmailVerified: true
      },
      testCoach: {
        id: 'test-coach-id',
        email: 'test-coach@example.com',
        firstName: 'Test',
        lastName: 'Coach',
        role: 'coach',
        isActive: true,
        isEmailVerified: true,
        specializations: ['life-coaching', 'wellness']
      },
      testAdmin: {
        id: 'test-admin-id',
        email: 'test-admin@example.com',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'admin',
        isActive: true,
        isEmailVerified: true
      }
    },
    appointments: {
      sampleAppointment: {
        id: 'test-appointment-id',
        title: 'Test Appointment',
        description: 'Integration test appointment',
        type: 'video',
        status: 'scheduled'
      }
    },
    files: {
      testFile: {
        id: 'test-file-id',
        fileName: 'test-file.txt',
        mimeType: 'text/plain',
        category: 'document',
        fileSize: 1024
      }
    }
  };

  const fixturesPath = path.join(testDataDir, 'fixtures', 'global-fixtures.json');
  await fs.writeFile(fixturesPath, JSON.stringify(fixtures, null, 2));
  
  // Create test media files
  const mediaDir = path.join(testDataDir, 'media');
  await fs.mkdir(mediaDir, { recursive: true });
  
  // Create sample test files
  const testFiles = [
    { name: 'test-image.jpg', content: Buffer.from('fake-image-data') },
    { name: 'test-audio.mp3', content: Buffer.from('fake-audio-data'.repeat(1000)) },
    { name: 'test-video.mp4', content: Buffer.from('fake-video-data'.repeat(5000)) },
    { name: 'test-document.pdf', content: Buffer.from('fake-pdf-data'.repeat(500)) }
  ];

  for (const file of testFiles) {
    await fs.writeFile(path.join(mediaDir, file.name), file.content);
  }

  console.log('📋 Global test data prepared');
}

/**
 * Warm up services
 */
async function warmupServices(): Promise<void> {
  // Pre-pull Docker images to avoid delays during tests
  const images = [
    'postgres:15-alpine',
    'redis:7-alpine',
    'nats:2-alpine',
    'minio/minio:latest'
  ];

  console.log('🐳 Pre-pulling Docker images...');
  
  const pullPromises = images.map(image => 
    execCommand(`docker pull ${image}`).catch(error => {
      console.warn(`⚠️ Failed to pull ${image}:`, error.message);
    })
  );

  await Promise.allSettled(pullPromises);
  
  // Create shared Docker network for tests
  try {
    await execCommand('docker network create clinic-test-network');
  } catch (error) {
    // Network might already exist
  }

  console.log('🔥 Services warmed up');
}

/**
 * Execute shell command
 */
function execCommand(command: string, options: any = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('sh', ['-c', command], {
      stdio: 'pipe',
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed: ${command}\n${stderr}`));
      }
    });

    child.on('error', reject);
  });
}

/**
 * Write global setup status
 */
async function writeSetupStatus(): Promise<void> {
  const status = {
    setupCompletedAt: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memoryUsage: process.memoryUsage(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      CI: process.env.CI,
      GITHUB_ACTIONS: process.env.GITHUB_ACTIONS
    }
  };

  const statusPath = path.join(__dirname, 'test-results', 'setup-status.json');
  await fs.writeFile(statusPath, JSON.stringify(status, null, 2));
}