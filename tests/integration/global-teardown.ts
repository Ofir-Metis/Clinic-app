import { GlobalConfig } from '@jest/types';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Global teardown for integration tests
 * This runs once after all test suites have completed
 */
export default async function globalTeardown(globalConfig: GlobalConfig): Promise<void> {
  console.log('🧹 Global Integration Test Teardown Starting...');

  try {
    // Cleanup Docker resources
    await cleanupDockerResources();
    
    // Archive test artifacts
    await archiveTestArtifacts();
    
    // Generate final reports
    await generateFinalReports();
    
    // Cleanup temporary files
    await cleanupTemporaryFiles();
    
    // Display summary
    await displayTeardownSummary();
    
    console.log('✅ Global Integration Test Teardown Completed');
    
  } catch (error) {
    console.error('❌ Global Integration Test Teardown Failed:', error);
    // Don't throw error to avoid masking test results
  }
}

/**
 * Cleanup Docker resources created during tests
 */
async function cleanupDockerResources(): Promise<void> {
  console.log('🐳 Cleaning up Docker resources...');

  try {
    // Stop and remove test containers
    const stopContainers = execCommand(
      'docker ps -q --filter "name=test" | xargs -r docker stop'
    ).catch(() => {}); // Ignore errors if no containers

    const removeContainers = stopContainers.then(() =>
      execCommand('docker ps -aq --filter "name=test" | xargs -r docker rm')
    ).catch(() => {});

    // Remove test networks
    const removeNetworks = execCommand(
      'docker network ls -q --filter "name=test" | xargs -r docker network rm'
    ).catch(() => {});

    // Remove test volumes
    const removeVolumes = execCommand(
      'docker volume ls -q --filter "name=test" | xargs -r docker volume rm'
    ).catch(() => {});

    // Clean up dangling images
    const removeDanglingImages = execCommand(
      'docker image prune -f'
    ).catch(() => {});

    await Promise.allSettled([
      removeContainers,
      removeNetworks,
      removeVolumes,
      removeDanglingImages
    ]);

    console.log('✅ Docker resources cleaned up');
  } catch (error) {
    console.warn('⚠️ Some Docker resources could not be cleaned up:', error.message);
  }
}

/**
 * Archive test artifacts for later analysis
 */
async function archiveTestArtifacts(): Promise<void> {
  console.log('📦 Archiving test artifacts...');

  const artifactsDir = path.join(__dirname, 'test-results', 'artifacts');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveDir = path.join(__dirname, 'test-results', 'archives', timestamp);

  try {
    await fs.mkdir(archiveDir, { recursive: true });

    // Archive important files
    const filesToArchive = [
      'test-results/reports',
      'test-results/coverage',
      'test-results/logs',
      'test-results/setup-status.json'
    ];

    for (const filePattern of filesToArchive) {
      try {
        const sourcePath = path.join(__dirname, filePattern);
        const destPath = path.join(archiveDir, path.basename(filePattern));
        
        await execCommand(`cp -r "${sourcePath}" "${destPath}"`);
      } catch (error) {
        // File might not exist, continue
      }
    }

    // Create archive summary
    const archiveSummary = {
      createdAt: new Date().toISOString(),
      testSession: timestamp,
      nodeVersion: process.version,
      platform: process.platform,
      ci: !!process.env.CI,
      gitCommit: process.env.GITHUB_SHA || 'unknown',
      branch: process.env.GITHUB_REF_NAME || 'unknown'
    };

    await fs.writeFile(
      path.join(archiveDir, 'archive-summary.json'),
      JSON.stringify(archiveSummary, null, 2)
    );

    console.log(`✅ Test artifacts archived to: ${archiveDir}`);
  } catch (error) {
    console.warn('⚠️ Failed to archive some test artifacts:', error.message);
  }
}

/**
 * Generate final consolidated reports
 */
async function generateFinalReports(): Promise<void> {
  console.log('📊 Generating final reports...');

  try {
    const reportsDir = path.join(__dirname, 'test-results', 'reports');
    
    // Collect all test results
    const testResults = await collectTestResults(reportsDir);
    
    // Generate consolidated report
    const consolidatedReport = generateConsolidatedReport(testResults);
    
    await fs.writeFile(
      path.join(reportsDir, 'consolidated-report.json'),
      JSON.stringify(consolidatedReport, null, 2)
    );

    // Generate HTML dashboard
    const htmlReport = generateHTMLDashboard(consolidatedReport);
    
    await fs.writeFile(
      path.join(reportsDir, 'test-dashboard.html'),
      htmlReport
    );

    // Generate CI-friendly report
    if (process.env.CI) {
      const ciReport = generateCIReport(consolidatedReport);
      await fs.writeFile(
        path.join(reportsDir, 'ci-report.md'),
        ciReport
      );
    }

    console.log('✅ Final reports generated');
  } catch (error) {
    console.warn('⚠️ Failed to generate some final reports:', error.message);
  }
}

/**
 * Collect test results from all test files
 */
async function collectTestResults(reportsDir: string): Promise<any[]> {
  const results = [];
  
  try {
    const files = await fs.readdir(reportsDir);
    const resultFiles = files.filter(f => f.endsWith('-results.json'));
    
    for (const file of resultFiles) {
      try {
        const content = await fs.readFile(path.join(reportsDir, file), 'utf8');
        const result = JSON.parse(content);
        results.push({
          testFile: file.replace('-results.json', ''),
          ...result
        });
      } catch (error) {
        console.warn(`⚠️ Failed to parse result file ${file}:`, error.message);
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to collect test results:', error.message);
  }

  return results;
}

/**
 * Generate consolidated report from all test results
 */
function generateConsolidatedReport(testResults: any[]): any {
  const totalTests = testResults.reduce((sum, r) => sum + (r.numTotalTests || 0), 0);
  const passedTests = testResults.reduce((sum, r) => sum + (r.numPassedTests || 0), 0);
  const failedTests = testResults.reduce((sum, r) => sum + (r.numFailedTests || 0), 0);
  const skippedTests = testResults.reduce((sum, r) => sum + (r.numPendingTests || 0), 0);
  
  const totalDuration = testResults.reduce((sum, r) => {
    const testSuites = r.testResults || [];
    return sum + testSuites.reduce((suiteSum: number, suite: any) => 
      suiteSum + (suite.perfStats?.end - suite.perfStats?.start || 0), 0);
  }, 0);

  const coverage = testResults.find(r => r.coverageMap)?.coverageMap;

  return {
    summary: {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : '0',
      totalDuration: Math.round(totalDuration / 1000), // Convert to seconds
      generatedAt: new Date().toISOString()
    },
    testResults,
    coverage,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ci: !!process.env.CI,
      memoryUsage: process.memoryUsage()
    }
  };
}

/**
 * Generate HTML dashboard
 */
function generateHTMLDashboard(report: any): string {
  const { summary } = report;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Healthcare Platform Integration Test Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
        .test-results { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .test-file { margin-bottom: 15px; padding: 15px; border-left: 4px solid #28a745; background: #f8f9fa; }
        .test-file.failed { border-left-color: #dc3545; }
        .test-file h3 { margin: 0 0 10px 0; }
        .test-stats { display: flex; gap: 15px; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Healthcare Platform Integration Tests</h1>
            <p>Generated: ${summary.generatedAt}</p>
            <p>Duration: ${summary.totalDuration}s | Success Rate: ${summary.successRate}%</p>
        </div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-value success">${summary.passedTests}</div>
                <div class="metric-label">Passed Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value failure">${summary.failedTests}</div>
                <div class="metric-label">Failed Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value warning">${summary.skippedTests}</div>
                <div class="metric-label">Skipped Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value info">${summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
        </div>

        <div class="test-results">
            <h2>Test Results by Service</h2>
            ${report.testResults.map((result: any) => `
                <div class="test-file ${result.numFailedTests > 0 ? 'failed' : ''}">
                    <h3>${result.testFile}</h3>
                    <div class="test-stats">
                        <span>✅ ${result.numPassedTests || 0} passed</span>
                        <span>❌ ${result.numFailedTests || 0} failed</span>
                        <span>⏸️ ${result.numPendingTests || 0} skipped</span>
                        <span>⏱️ ${Math.round((result.perfStats?.end - result.perfStats?.start || 0) / 1000)}s</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generate CI-friendly markdown report
 */
function generateCIReport(report: any): string {
  const { summary } = report;
  
  return `# 🏥 Healthcare Platform Integration Test Results

## Summary
- **Total Tests:** ${summary.totalTests}
- **Passed:** ${summary.passedTests} ✅
- **Failed:** ${summary.failedTests} ❌
- **Skipped:** ${summary.skippedTests} ⏸️
- **Success Rate:** ${summary.successRate}%
- **Duration:** ${summary.totalDuration}s

## Test Results by Service

${report.testResults.map((result: any) => `
### ${result.testFile}
- Passed: ${result.numPassedTests || 0} ✅
- Failed: ${result.numFailedTests || 0} ❌
- Skipped: ${result.numPendingTests || 0} ⏸️
- Duration: ${Math.round((result.perfStats?.end - result.perfStats?.start || 0) / 1000)}s
`).join('')}

## Environment
- Node.js: ${report.environment.nodeVersion}
- Platform: ${report.environment.platform}
- CI: ${report.environment.ci ? 'Yes' : 'No'}
- Generated: ${summary.generatedAt}
`;
}

/**
 * Cleanup temporary files
 */
async function cleanupTemporaryFiles(): Promise<void> {
  console.log('🗑️ Cleaning up temporary files...');

  const tempDirs = [
    path.join(__dirname, 'test-data', 'temp'),
    path.join(__dirname, 'node_modules', '.cache'),
    '/tmp/clinic-test-*'
  ];

  for (const dir of tempDirs) {
    try {
      await execCommand(`rm -rf ${dir}`);
    } catch (error) {
      // Directory might not exist
    }
  }

  console.log('✅ Temporary files cleaned up');
}

/**
 * Display teardown summary
 */
async function displayTeardownSummary(): Promise<void> {
  try {
    const reportsDir = path.join(__dirname, 'test-results', 'reports');
    const consolidatedReportPath = path.join(reportsDir, 'consolidated-report.json');
    
    const reportContent = await fs.readFile(consolidatedReportPath, 'utf8');
    const report = JSON.parse(reportContent);
    
    console.log('\n🎯 Integration Test Session Summary:');
    console.log('=====================================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests} ✅`);
    console.log(`Failed: ${report.summary.failedTests} ❌`);
    console.log(`Skipped: ${report.summary.skippedTests} ⏸️`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    console.log(`Total Duration: ${report.summary.totalDuration}s`);
    console.log(`Reports Available: ${reportsDir}`);
    
    if (report.summary.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      report.testResults.forEach((result: any) => {
        if (result.numFailedTests > 0) {
          console.log(`  - ${result.testFile}: ${result.numFailedTests} failures`);
        }
      });
    }
    
  } catch (error) {
    console.log('✅ Integration tests completed');
  }
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