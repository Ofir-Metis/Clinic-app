#!/usr/bin/env node

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

interface TestConfig {
  pattern?: string;
  services?: string[];
  parallel?: boolean;
  verbose?: boolean;
  coverage?: boolean;
  timeout?: number;
  retries?: number;
  bail?: boolean;
  reporter?: 'default' | 'json' | 'junit';
  outputDir?: string;
}

class IntegrationTestRunner {
  private config: TestConfig;
  private testResults: Map<string, any> = new Map();

  constructor(config: TestConfig = {}) {
    this.config = {
      pattern: '**/*.integration.spec.ts',
      services: [],
      parallel: true,
      verbose: false,
      coverage: true,
      timeout: 300000, // 5 minutes
      retries: 2,
      bail: false,
      reporter: 'default',
      outputDir: path.join(__dirname, '../test-results'),
      ...config
    };
  }

  /**
   * Run integration tests with full environment setup
   */
  async run(): Promise<void> {
    console.log('🚀 Starting Integration Test Runner');
    console.log('Configuration:', JSON.stringify(this.config, null, 2));

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Validate prerequisites
      await this.validatePrerequisites();

      // Setup test environment
      await this.setupTestEnvironment();

      // Discover test files
      const testFiles = await this.discoverTests();
      console.log(`📁 Found ${testFiles.length} test files`);

      // Run tests
      const results = await this.executeTests(testFiles);

      // Generate reports
      await this.generateReports(results);

      // Cleanup
      await this.cleanup();

      // Exit with appropriate code
      const hasFailures = results.some(r => r.success === false);
      process.exit(hasFailures ? 1 : 0);

    } catch (error) {
      console.error('❌ Integration test runner failed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Validate prerequisites for running tests
   */
  private async validatePrerequisites(): Promise<void> {
    console.log('🔍 Validating prerequisites...');

    const requiredCommands = ['docker', 'docker-compose', 'node', 'yarn'];
    const missingCommands = [];

    for (const cmd of requiredCommands) {
      try {
        await this.execCommand(`which ${cmd}`);
      } catch (error) {
        missingCommands.push(cmd);
      }
    }

    if (missingCommands.length > 0) {
      throw new Error(`Missing required commands: ${missingCommands.join(', ')}`);
    }

    // Check Docker daemon
    try {
      await this.execCommand('docker ps');
    } catch (error) {
      throw new Error('Docker daemon is not running');
    }

    // Check Node.js version
    const nodeVersion = await this.execCommand('node --version');
    const version = nodeVersion.trim().replace('v', '');
    const majorVersion = parseInt(version.split('.')[0]);
    
    if (majorVersion < 18) {
      throw new Error(`Node.js version ${version} is not supported. Minimum version is 18.`);
    }

    console.log('✅ Prerequisites validated');
  }

  /**
   * Setup test environment
   */
  private async setupTestEnvironment(): Promise<void> {
    console.log('🏗️ Setting up test environment...');

    // Build common library first
    console.log('Building shared common library...');
    await this.execCommand('yarn workspace @clinic/common build', {
      cwd: path.join(__dirname, '../../')
    });

    // Install test dependencies
    console.log('Installing test dependencies...');
    await this.execCommand('yarn install', {
      cwd: __dirname
    });

    console.log('✅ Test environment ready');
  }

  /**
   * Discover test files based on pattern and service filters
   */
  private async discoverTests(): Promise<string[]> {
    const testDir = path.join(__dirname, 'services');
    const files = await fs.readdir(testDir);
    
    let testFiles = files.filter(file => file.endsWith('.integration.spec.ts'));

    // Filter by services if specified
    if (this.config.services && this.config.services.length > 0) {
      testFiles = testFiles.filter(file => {
        const serviceName = file.replace('.integration.spec.ts', '');
        return this.config.services!.includes(serviceName);
      });
    }

    return testFiles.map(file => path.join(testDir, file));
  }

  /**
   * Execute tests
   */
  private async executeTests(testFiles: string[]): Promise<any[]> {
    console.log(`🧪 Executing ${testFiles.length} test suites...`);

    const results = [];

    if (this.config.parallel) {
      // Run tests in parallel
      const promises = testFiles.map(testFile => this.runSingleTest(testFile));
      const settledResults = await Promise.allSettled(promises);
      
      for (let i = 0; i < settledResults.length; i++) {
        const result = settledResults[i];
        results.push({
          testFile: testFiles[i],
          success: result.status === 'fulfilled',
          result: result.status === 'fulfilled' ? result.value : result.reason,
          duration: 0 // TODO: Track duration
        });
      }
    } else {
      // Run tests sequentially
      for (const testFile of testFiles) {
        const startTime = Date.now();
        try {
          const result = await this.runSingleTest(testFile);
          const duration = Date.now() - startTime;
          
          results.push({
            testFile,
            success: true,
            result,
            duration
          });

          console.log(`✅ ${path.basename(testFile)} completed in ${duration}ms`);
        } catch (error) {
          const duration = Date.now() - startTime;
          
          results.push({
            testFile,
            success: false,
            result: error,
            duration
          });

          console.error(`❌ ${path.basename(testFile)} failed in ${duration}ms:`, error.message);

          if (this.config.bail) {
            console.log('🛑 Bailing out due to test failure');
            break;
          }
        }
      }
    }

    return results;
  }

  /**
   * Run a single test file
   */
  private async runSingleTest(testFile: string): Promise<any> {
    const testName = path.basename(testFile, '.integration.spec.ts');
    console.log(`🧪 Running ${testName} tests...`);

    const jestArgs = [
      '--testPathPattern', testFile,
      '--testTimeout', this.config.timeout!.toString(),
      '--maxWorkers', '1', // Force single worker for integration tests
      '--verbose', this.config.verbose ? 'true' : 'false',
      '--detectOpenHandles',
      '--forceExit'
    ];

    if (this.config.coverage) {
      jestArgs.push('--coverage');
      jestArgs.push('--coverageDirectory', path.join(this.config.outputDir!, 'coverage', testName));
    }

    if (this.config.reporter === 'json') {
      jestArgs.push('--json');
      jestArgs.push('--outputFile', path.join(this.config.outputDir!, `${testName}-results.json`));
    } else if (this.config.reporter === 'junit') {
      jestArgs.push('--reporters=default');
      jestArgs.push('--reporters=jest-junit');
      jestArgs.push('--testResultsProcessor=jest-junit');
    }

    // Set environment variables for the test
    const testEnv = {
      ...process.env,
      NODE_ENV: 'test',
      JEST_TIMEOUT: this.config.timeout!.toString(),
      TEST_SERVICE: testName,
      LOG_LEVEL: this.config.verbose ? 'debug' : 'error'
    };

    let attempt = 0;
    const maxAttempts = this.config.retries! + 1;

    while (attempt < maxAttempts) {
      try {
        const result = await this.execCommand(
          `npx jest ${jestArgs.join(' ')}`,
          {
            cwd: __dirname,
            env: testEnv
          }
        );

        // Parse Jest output if needed
        return this.parseJestOutput(result);
      } catch (error) {
        attempt++;
        
        if (attempt < maxAttempts) {
          console.warn(`⚠️ ${testName} failed (attempt ${attempt}/${maxAttempts}), retrying...`);
          await this.sleep(2000); // Wait 2 seconds before retry
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Parse Jest output for structured results
   */
  private parseJestOutput(output: string): any {
    try {
      // Try to extract JSON from Jest output
      const lines = output.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{') && line.includes('testResults'));
      
      if (jsonLine) {
        return JSON.parse(jsonLine);
      }
    } catch (error) {
      // Fall back to raw output
    }

    return {
      rawOutput: output,
      success: !output.includes('FAIL') && !output.includes('failed')
    };
  }

  /**
   * Generate test reports
   */
  private async generateReports(results: any[]): Promise<void> {
    console.log('📊 Generating test reports...');

    const summary = {
      totalTests: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      duration: results.reduce((sum, r) => sum + (r.duration || 0), 0),
      timestamp: new Date().toISOString(),
      results: results
    };

    // Write summary report
    const summaryPath = path.join(this.config.outputDir!, 'test-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

    // Write human-readable report
    const humanReport = this.generateHumanReadableReport(summary);
    const humanReportPath = path.join(this.config.outputDir!, 'test-report.md');
    await fs.writeFile(humanReportPath, humanReport);

    // Display summary
    console.log('\n📊 Test Results Summary:');
    console.log(`Total: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passed} ✅`);
    console.log(`Failed: ${summary.failed} ❌`);
    console.log(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    
    if (summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${path.basename(r.testFile)}`);
      });
    }

    console.log(`\n📁 Reports saved to: ${this.config.outputDir}`);
  }

  /**
   * Generate human-readable test report
   */
  private generateHumanReadableReport(summary: any): string {
    const report = [
      '# Integration Test Report',
      '',
      `**Generated:** ${summary.timestamp}`,
      `**Total Tests:** ${summary.totalTests}`,
      `**Passed:** ${summary.passed} ✅`,
      `**Failed:** ${summary.failed} ❌`,
      `**Duration:** ${(summary.duration / 1000).toFixed(2)} seconds`,
      '',
      '## Test Results',
      ''
    ];

    summary.results.forEach((result: any) => {
      const testName = path.basename(result.testFile, '.integration.spec.ts');
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      const duration = result.duration ? `(${(result.duration / 1000).toFixed(2)}s)` : '';
      
      report.push(`### ${testName} ${status} ${duration}`);
      
      if (!result.success && result.result?.message) {
        report.push('```');
        report.push(result.result.message);
        report.push('```');
      }
      
      report.push('');
    });

    return report.join('\n');
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test resources...');
    
    try {
      // Stop any running test containers
      await this.execCommand('docker ps -q --filter "name=test" | xargs -r docker stop');
      await this.execCommand('docker ps -aq --filter "name=test" | xargs -r docker rm');
      
      // Remove test networks
      await this.execCommand('docker network ls -q --filter "name=test" | xargs -r docker network rm');
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.warn('⚠️ Cleanup encountered issues:', error.message);
    }
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.outputDir!, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Execute shell command with promise
   */
  private execCommand(command: string, options: any = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], {
        stdio: this.config.verbose ? 'inherit' : 'pipe',
        ...options
      });

      let stdout = '';
      let stderr = '';

      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }

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
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: TestConfig = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--pattern':
        config.pattern = args[++i];
        break;
      case '--services':
        config.services = args[++i].split(',');
        break;
      case '--parallel':
        config.parallel = true;
        break;
      case '--sequential':
        config.parallel = false;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--no-coverage':
        config.coverage = false;
        break;
      case '--timeout':
        config.timeout = parseInt(args[++i]);
        break;
      case '--retries':
        config.retries = parseInt(args[++i]);
        break;
      case '--bail':
        config.bail = true;
        break;
      case '--reporter':
        config.reporter = args[++i] as 'default' | 'json' | 'junit';
        break;
      case '--output-dir':
        config.outputDir = args[++i];
        break;
      case '--help':
        console.log(`
Integration Test Runner

Usage: node test-runner.ts [options]

Options:
  --pattern <pattern>     Test file pattern (default: **/*.integration.spec.ts)
  --services <services>   Comma-separated list of services to test
  --parallel              Run tests in parallel (default)
  --sequential            Run tests sequentially
  --verbose               Enable verbose output
  --no-coverage           Disable coverage collection
  --timeout <ms>          Test timeout in milliseconds (default: 300000)
  --retries <num>         Number of retries for failed tests (default: 2)
  --bail                  Stop on first failure
  --reporter <type>       Reporter type: default, json, junit
  --output-dir <dir>      Output directory for reports
  --help                  Show this help message

Examples:
  node test-runner.ts --services auth,appointments --verbose
  node test-runner.ts --pattern "**/auth.*.spec.ts" --sequential
  node test-runner.ts --reporter json --output-dir ./reports
        `);
        process.exit(0);
    }
  }

  const runner = new IntegrationTestRunner(config);
  runner.run();
}

export { IntegrationTestRunner, TestConfig };