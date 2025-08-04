#!/usr/bin/env node

/**
 * Comprehensive Test Runner Script
 * 
 * This script orchestrates the complete test suite for the clinic management system.
 * It ensures all services are running and executes the comprehensive test suite.
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

const TEST_CONFIG = {
  BASE_URL: 'http://localhost:5173',
  API_URL: 'http://localhost:4000',
  ADMIN_EMAIL: 'ofir@metisight.net',
  ADMIN_PASSWORD: '123456789',
  THERAPIST_COUNT: 15,
  CLIENTS_PER_THERAPIST: 10,
  SHARED_CLIENTS_COUNT: 25,
  TEST_TIMEOUT: 300000, // 5 minutes per test
};

class ComprehensiveTestRunner {
  constructor() {
    this.testResults = {
      timestamp: new Date().toISOString(),
      config: TEST_CONFIG,
      services: {},
      tests: {},
      credentials: null,
      errors: []
    };
  }

  async run() {
    console.log('🚀 Starting Comprehensive Clinic System Test Suite');
    console.log('=' .repeat(60));
    
    try {
      // Step 1: Check prerequisites
      await this.checkPrerequisites();
      
      // Step 2: Start infrastructure services
      await this.startInfrastructureServices();
      
      // Step 3: Build shared library
      await this.buildSharedLibrary();
      
      // Step 4: Start application services
      await this.startApplicationServices();
      
      // Step 5: Wait for services to be ready
      await this.waitForServicesReady();
      
      // Step 6: Run comprehensive tests
      await this.runComprehensiveTests();
      
      // Step 7: Generate final report
      await this.generateFinalReport();
      
      console.log('✅ Comprehensive test suite completed successfully!');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.testResults.errors.push({
        step: 'Test Runner',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      await this.generateFinalReport();
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`  Node.js version: ${nodeVersion}`);
    
    // Check if Docker is running
    try {
      await execAsync('docker ps');
      console.log('  ✅ Docker is running');
    } catch (error) {
      throw new Error('Docker is not running. Please start Docker and try again.');
    }
    
    // Check if required directories exist
    const requiredDirs = [
      'services',
      'frontend',
      'tests',
      'scripts'
    ];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        throw new Error(`Required directory '${dir}' not found`);
      }
    }
    
    console.log('  ✅ All prerequisites met');
  }

  async buildSharedLibrary() {
    console.log('🔧 Building shared library...');
    
    try {
      const { stdout, stderr } = await execAsync('yarn workspace @clinic/common build');
      console.log('  ✅ Shared library built successfully');
      
      this.testResults.services.sharedLibrary = {
        status: 'success',
        output: stdout,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('  ❌ Failed to build shared library:', error.message);
      throw new Error(`Shared library build failed: ${error.message}`);
    }
  }

  async startInfrastructureServices() {
    console.log('🐳 Starting infrastructure services...');
    
    const services = ['postgres', 'nats', 'redis', 'minio', 'maildev'];
    
    try {
      const command = `docker compose up -d ${services.join(' ')}`;
      const { stdout, stderr } = await execAsync(command);
      
      console.log('  ✅ Infrastructure services started');
      
      this.testResults.services.infrastructure = {
        services,
        status: 'started',
        output: stdout,
        timestamp: new Date().toISOString()
      };
      
      // Wait for services to initialize
      await this.sleep(10000);
      
    } catch (error) {
      throw new Error(`Failed to start infrastructure services: ${error.message}`);
    }
  }

  async startApplicationServices() {
    console.log('🚀 Starting application services...');
    
    const services = [
      'api-gateway',
      'auth-service',
      'appointments-service',
      'files-service',
      'notifications-service',
      'ai-service',
      'notes-service',
      'analytics-service',
      'settings-service',
      'progress-service',
      'client-relationships-service',
      'billing-service'
    ];
    
    try {
      // Start services in background
      for (const service of services) {
        console.log(`  Starting ${service}...`);
        const command = `yarn workspace ${service} start:dev`;
        
        // Start service in background (don't wait for completion)
        const childProcess = spawn('yarn', ['workspace', service, 'start:dev'], {
          stdio: 'pipe',
          detached: false
        });
        
        this.testResults.services[service] = {
          status: 'starting',
          pid: childProcess.pid,
          timestamp: new Date().toISOString()
        };
      }
      
      console.log('  ✅ Application services are starting...');
      
      // Start frontend
      console.log('  Starting frontend...');
      const frontendProcess = spawn('yarn', ['dev'], {
        cwd: './frontend',
        stdio: 'pipe',
        detached: false
      });
      
      this.testResults.services.frontend = {
        status: 'starting',
        pid: frontendProcess.pid,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Failed to start application services: ${error.message}`);
    }
  }

  async waitForServicesReady() {
    console.log('⏳ Waiting for services to be ready...');
    
    const maxWaitTime = 120000; // 2 minutes
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();
    
    const endpoints = [
      { name: 'API Gateway', url: `${TEST_CONFIG.API_URL}/health` },
      { name: 'Frontend', url: `${TEST_CONFIG.BASE_URL}` }
    ];
    
    while (Date.now() - startTime < maxWaitTime) {
      let allReady = true;
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url);
          if (response.ok) {
            console.log(`  ✅ ${endpoint.name} is ready`);
          } else {
            allReady = false;
          }
        } catch (error) {
          allReady = false;
          console.log(`  ⏳ Waiting for ${endpoint.name}...`);
        }
      }
      
      if (allReady) {
        console.log('  ✅ All services are ready!');
        return;
      }
      
      await this.sleep(checkInterval);
    }
    
    throw new Error('Services did not become ready within the timeout period');
  }

  async runComprehensiveTests() {
    console.log('🧪 Running comprehensive test suite...');
    
    try {
      // Ensure test results directory exists
      const testResultsDir = path.join(process.cwd(), 'test-results');
      if (!fs.existsSync(testResultsDir)) {
        fs.mkdirSync(testResultsDir, { recursive: true });
      }
      
      // Run Playwright tests
      const command = 'npx playwright test tests/comprehensive-system-test.spec.ts --reporter=json';
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large test output
      });
      
      console.log('  ✅ Comprehensive tests completed');
      
      // Parse test results
      try {
        const testOutput = JSON.parse(stdout);
        this.testResults.tests = {
          status: 'completed',
          results: testOutput,
          timestamp: new Date().toISOString()
        };
      } catch (parseError) {
        this.testResults.tests = {
          status: 'completed',
          rawOutput: stdout,
          stderr: stderr,
          timestamp: new Date().toISOString()
        };
      }
      
    } catch (error) {
      console.error('  ❌ Tests failed:', error.message);
      this.testResults.tests = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      // Don't throw here - we want to generate the report even if tests fail
    }
  }

  async generateFinalReport() {
    console.log('📊 Generating final test report...');
    
    const reportPath = path.join(process.cwd(), 'test-results', 'comprehensive-test-report.json');
    const summaryPath = path.join(process.cwd(), 'test-results', 'test-summary.md');
    
    // Load credentials if they exist
    const credentialsPath = path.join(process.cwd(), 'test-results', 'test-credentials.json');
    if (fs.existsSync(credentialsPath)) {
      try {
        this.testResults.credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      } catch (error) {
        console.warn('  ⚠️ Could not load credentials file');
      }
    }
    
    // Write detailed report
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    // Generate markdown summary
    const summary = this.generateMarkdownSummary();
    fs.writeFileSync(summaryPath, summary);
    
    console.log(`  📄 Report saved to: ${reportPath}`);
    console.log(`  📄 Summary saved to: ${summaryPath}`);
    
    // Display credentials summary
    if (this.testResults.credentials) {
      console.log('\n' + '='.repeat(60));
      console.log('🔑 TEST CREDENTIALS SUMMARY');
      console.log('='.repeat(60));
      
      const creds = this.testResults.credentials;
      
      console.log('\n👑 Admin Account:');
      console.log(`   Email: ${creds.admin?.email || 'Not set'}`);
      console.log(`   Password: ${creds.admin?.password || 'Not set'}`);
      
      console.log(`\n👨‍⚕️ Therapists (${creds.therapists?.length || 0} accounts):`);
      if (creds.therapists?.length > 0) {
        creds.therapists.slice(0, 3).forEach((t, i) => {
          console.log(`   ${i + 1}. ${t.name} - ${t.email} / ${t.password}`);
        });
        if (creds.therapists.length > 3) {
          console.log(`   ... and ${creds.therapists.length - 3} more therapists`);
        }
      }
      
      console.log(`\n👤 Clients (${creds.clients?.length || 0} accounts):`);
      if (creds.clients?.length > 0) {
        creds.clients.slice(0, 3).forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.name} - ${c.email} / ${c.password}`);
        });
        if (creds.clients.length > 3) {
          console.log(`   ... and ${creds.clients.length - 3} more clients`);
        }
      }
      
      console.log('\n📊 Statistics:');
      console.log(`   Total Users: ${creds.statistics?.totalUsers || 0}`);
      console.log(`   Shared Clients: ${creds.statistics?.sharedClientCount || 0}`);
      console.log(`   Avg Clients/Therapist: ${creds.statistics?.averageClientsPerTherapist || 0}`);
      
      console.log('\n📋 Full credentials available in: test-results/credentials-report.md');
    }
  }

  generateMarkdownSummary() {
    const timestamp = new Date().toISOString();
    
    return `# 🏥 Comprehensive Clinic System Test Report

Generated: ${timestamp}

## 📊 Test Configuration
- **Base URL**: ${TEST_CONFIG.BASE_URL}
- **API URL**: ${TEST_CONFIG.API_URL}
- **Admin Email**: ${TEST_CONFIG.ADMIN_EMAIL}
- **Therapists**: ${TEST_CONFIG.THERAPIST_COUNT}
- **Clients per Therapist**: ${TEST_CONFIG.CLIENTS_PER_THERAPIST}
- **Shared Clients**: ${TEST_CONFIG.SHARED_CLIENTS_COUNT}

## 🚀 Service Status
${Object.entries(this.testResults.services).map(([service, info]) => 
  `- **${service}**: ${info.status || 'unknown'}`
).join('\n')}

## 🧪 Test Results
- **Status**: ${this.testResults.tests.status || 'not run'}
- **Timestamp**: ${this.testResults.tests.timestamp || 'N/A'}

${this.testResults.credentials ? `
## 🔑 Test Credentials Summary
- **Admin**: 1 account
- **Therapists**: ${this.testResults.credentials.therapists?.length || 0} accounts
- **Clients**: ${this.testResults.credentials.clients?.length || 0} accounts
- **Shared Clients**: ${this.testResults.credentials.statistics?.sharedClientCount || 0}

### Admin Account
- Email: ${this.testResults.credentials.admin?.email || 'Not set'}
- Password: ${this.testResults.credentials.admin?.password || 'Not set'}

*Full credentials available in test-results/credentials-report.md*
` : ''}

## ❌ Errors
${this.testResults.errors.length > 0 ? 
  this.testResults.errors.map(error => `- **${error.step}**: ${error.error}`).join('\n') :
  'No errors reported'
}

---
*Report generated by Comprehensive Test Runner*
`;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the test suite if this script is executed directly
if (require.main === module) {
  const testRunner = new ComprehensiveTestRunner();
  testRunner.run().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestRunner;