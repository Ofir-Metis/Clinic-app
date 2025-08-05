#!/usr/bin/env node

/**
 * Test Infrastructure Validation Script
 * 
 * Validates that all enhanced E2E test components are properly configured
 * and ready for production use.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'enhanced-e2e-suite.spec.ts',
  'healthcare-workflow-tests.spec.ts',
  'test-integration.spec.ts',
  'run-enhanced-test-suite.js',
  'playwright.config.ts',
  'package.json'
];

const REQUIRED_DIRECTORIES = [
  'test-results',
  'fixtures'
];

const FIXTURE_FILES = [
  'fixtures/test-data-manager.ts',
  'fixtures/user-credentials.ts',
  'fixtures/api-test-suite.ts',
  'fixtures/therapist-ui-tests.ts',
  'fixtures/client-ui-tests.ts',
  'fixtures/admin-ui-tests.ts'
];

async function main() {
  console.log('🔍 Validating Enhanced E2E Test Infrastructure...\n');

  let validationErrors = [];
  let validationWarnings = [];

  // Check required files
  console.log('📁 Checking required files...');
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      validationErrors.push(`Missing required file: ${file}`);
    }
  }

  // Check required directories
  console.log('\n📂 Checking required directories...');
  for (const dir of REQUIRED_DIRECTORIES) {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`  ✅ ${dir}/`);
    } else {
      console.log(`  ⚠️  ${dir}/ - Creating...`);
      fs.mkdirSync(dirPath, { recursive: true });
      validationWarnings.push(`Created missing directory: ${dir}`);
    }
  }

  // Check fixture files
  console.log('\n🧩 Checking fixture files...');
  for (const file of FIXTURE_FILES) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ⚠️  ${file} - Missing (from existing test suite)`);
      validationWarnings.push(`Missing fixture file: ${file} (may exist in comprehensive test suite)`);
    }
  }

  // Validate Playwright configuration
  console.log('\n⚙️  Validating Playwright configuration...');
  try {
    const configPath = path.join(__dirname, 'playwright.config.ts');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      const configChecks = [
        { check: 'timeout', pattern: /timeout:\s*\d+/, required: true },
        { check: 'baseURL', pattern: /baseURL:\s*['"]http:\/\/localhost:5173['"]/, required: true },
        { check: 'projects', pattern: /projects:\s*\[/, required: true },
        { check: 'chromium', pattern: /name:\s*['"]chromium['"]/, required: true },
        { check: 'firefox', pattern: /name:\s*['"]firefox['"]/, required: false },
        { check: 'webkit', pattern: /name:\s*['"]webkit['"]/, required: false }
      ];
      
      for (const { check, pattern, required } of configChecks) {
        if (pattern.test(configContent)) {
          console.log(`  ✅ ${check} configuration found`);
        } else if (required) {
          console.log(`  ❌ ${check} configuration missing`);
          validationErrors.push(`Missing required Playwright config: ${check}`);
        } else {
          console.log(`  ⚠️  ${check} configuration missing (optional)`);
          validationWarnings.push(`Optional Playwright config missing: ${check}`);
        }
      }
    } else {
      validationErrors.push('Playwright configuration file missing');
    }
  } catch (error) {
    validationErrors.push(`Error reading Playwright config: ${error.message}`);
  }

  // Validate package.json scripts
  console.log('\n📦 Validating package.json scripts...');
  try {
    const packagePath = path.join(__dirname, 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredScripts = [
        'test',
        'test:enhanced',
        'test:healthcare',
        'test:performance',
        'test:security',
        'test:accessibility',
        'install:browsers'
      ];
      
      for (const script of requiredScripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          console.log(`  ✅ ${script} script found`);
        } else {
          console.log(`  ❌ ${script} script missing`);
          validationErrors.push(`Missing package.json script: ${script}`);
        }
      }
    }
  } catch (error) {
    validationErrors.push(`Error reading package.json: ${error.message}`);
  }

  // Validate test file structure
  console.log('\n🧪 Validating test file structure...');
  const enhancedTestFile = path.join(__dirname, 'enhanced-e2e-suite.spec.ts');
  if (fs.existsSync(enhancedTestFile)) {
    const testContent = fs.readFileSync(enhancedTestFile, 'utf8');
    
    const testCategories = [
      'Performance Testing',
      'Security Testing',
      'Accessibility Testing',
      'Mobile Responsiveness',
      'Cross-Browser Compatibility',
      'Healthcare Workflow Testing',
      'Error Handling & Recovery',
      'Data Integrity Testing'
    ];
    
    for (const category of testCategories) {
      if (testContent.includes(category)) {
        console.log(`  ✅ ${category} test category found`);
      } else {
        console.log(`  ⚠️  ${category} test category missing`);
        validationWarnings.push(`Test category missing: ${category}`);
      }
    }
  }

  // Validate healthcare workflow tests
  console.log('\n🏥 Validating healthcare workflow tests...');
  const healthcareTestFile = path.join(__dirname, 'healthcare-workflow-tests.spec.ts');
  if (fs.existsSync(healthcareTestFile)) {
    const healthcareContent = fs.readFileSync(healthcareTestFile, 'utf8');
    
    const healthcareCategories = [
      'Clinical Care Workflows',
      'HIPAA Compliance Workflows',
      'Emergency Procedures',
      'Clinical Documentation',
      'Provider-Patient Communication'
    ];
    
    for (const category of healthcareCategories) {
      if (healthcareContent.includes(category)) {
        console.log(`  ✅ ${category} found`);
      } else {
        console.log(`  ⚠️  ${category} missing`);
        validationWarnings.push(`Healthcare workflow missing: ${category}`);
      }
    }
  }

  // Generate validation report
  console.log('\n📊 Generating validation report...');
  const reportData = {
    timestamp: new Date().toISOString(),
    validation: {
      status: validationErrors.length === 0 ? 'PASSED' : 'FAILED',
      errors: validationErrors,
      warnings: validationWarnings,
      filesChecked: REQUIRED_FILES.length,
      directoriesChecked: REQUIRED_DIRECTORIES.length,
      fixturesChecked: FIXTURE_FILES.length
    },
    infrastructure: {
      enhancedTestSuite: fs.existsSync(path.join(__dirname, 'enhanced-e2e-suite.spec.ts')),
      healthcareWorkflows: fs.existsSync(path.join(__dirname, 'healthcare-workflow-tests.spec.ts')),
      testIntegration: fs.existsSync(path.join(__dirname, 'test-integration.spec.ts')),
      playwrightConfig: fs.existsSync(path.join(__dirname, 'playwright.config.ts')),
      testRunner: fs.existsSync(path.join(__dirname, 'run-enhanced-test-suite.js'))
    }
  };

  const reportPath = path.join(__dirname, 'test-results', 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  
  if (validationErrors.length === 0) {
    console.log('✅ VALIDATION PASSED - Enhanced E2E test infrastructure is ready!');
  } else {
    console.log('❌ VALIDATION FAILED - Issues need to be resolved:');
    validationErrors.forEach(error => console.log(`   • ${error}`));
  }
  
  if (validationWarnings.length > 0) {
    console.log(`\n⚠️  ${validationWarnings.length} warnings (non-critical):`);
    validationWarnings.forEach(warning => console.log(`   • ${warning}`));
  }

  console.log(`\n📁 Validation report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(validationErrors.length === 0 ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

module.exports = { main };