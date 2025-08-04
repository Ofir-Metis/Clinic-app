import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global test teardown for comprehensive clinic system tests
 * 
 * This teardown:
 * - Generates final test summary
 * - Cleans up temporary test data
 * - Preserves important test artifacts
 */
async function globalTeardown(config: FullConfig) {
  console.log('🏁 Global test teardown starting...');
  
  try {
    // Generate test completion timestamp
    const completionTime = new Date().toISOString();
    const testResultsDir = path.join(process.cwd(), 'test-results');
    
    // Create completion marker
    const completionFile = path.join(testResultsDir, 'test-completion.json');
    const completionData = {
      completedAt: completionTime,
      testSuite: 'Comprehensive Clinic System Tests',
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        workingDirectory: process.cwd()
      }
    };
    
    fs.writeFileSync(completionFile, JSON.stringify(completionData, null, 2));
    
    // Log summary of test artifacts
    console.log('📊 Test artifacts summary:');
    
    const artifacts = [
      'test-credentials.json',
      'credentials-report.md',
      'comprehensive-test-report.json',
      'playwright-report.json',
      'junit-report.xml'
    ];
    
    artifacts.forEach(artifact => {
      const artifactPath = path.join(testResultsDir, artifact);
      if (fs.existsSync(artifactPath)) {
        const stats = fs.statSync(artifactPath);
        console.log(`  ✅ ${artifact} (${Math.round(stats.size / 1024)}KB)`);
      } else {
        console.log(`  ❌ ${artifact} (missing)`);
      }
    });
    
    console.log(`\n📁 All test results saved to: ${testResultsDir}`);
    console.log('✅ Global test teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global test teardown failed:', error.message);
    // Don't throw here - we don't want teardown failures to fail the tests
  }
}

export default globalTeardown;