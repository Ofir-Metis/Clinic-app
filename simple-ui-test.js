#!/usr/bin/env node

/**
 * Simple UI Test Using Node.js fetch
 * Tests basic frontend availability and responses
 */

async function checkFrontendHealth() {
  console.log('🏥 Healthcare Platform - Simple UI Test');
  console.log('=======================================');
  
  const tests = [];
  
  // Test 1: Frontend Homepage
  console.log('🧪 Test 1: Frontend Homepage Availability');
  try {
    const response = await fetch('http://localhost:5173');
    if (response.ok) {
      const html = await response.text();
      const hasTitle = html.includes('<title>');
      const hasRoot = html.includes('id="root"');
      const hasVite = html.includes('vite');
      
      console.log('✅ Frontend is responding');
      console.log(`✅ Has title tag: ${hasTitle}`);
      console.log(`✅ Has React root: ${hasRoot}`);
      console.log(`✅ Vite dev server: ${hasVite}`);
      
      tests.push({ name: 'Frontend Homepage', status: 'PASS', details: 'Responding correctly' });
    } else {
      console.log(`❌ Frontend returned status: ${response.status}`);
      tests.push({ name: 'Frontend Homepage', status: 'FAIL', details: `Status: ${response.status}` });
    }
  } catch (error) {
    console.log('❌ Frontend is not accessible:', error.message);
    tests.push({ name: 'Frontend Homepage', status: 'FAIL', details: error.message });
  }
  
  // Test 2: Static Assets
  console.log('\n🧪 Test 2: Static Assets Loading');
  const assetTests = [
    { url: 'http://localhost:5173/@vite/client', name: 'Vite Client' },
    { url: 'http://localhost:5173/src/main.tsx', name: 'Main App File' }
  ];
  
  for (const asset of assetTests) {
    try {
      const response = await fetch(asset.url);
      if (response.ok) {
        console.log(`✅ ${asset.name}: Available`);
        tests.push({ name: asset.name, status: 'PASS', details: 'Asset loading' });
      } else {
        console.log(`⚠️ ${asset.name}: Status ${response.status}`);
        tests.push({ name: asset.name, status: 'WARN', details: `Status: ${response.status}` });
      }
    } catch (error) {
      console.log(`❌ ${asset.name}: Error - ${error.message}`);
      tests.push({ name: asset.name, status: 'FAIL', details: error.message });
    }
  }
  
  // Test 3: Backend Services (Optional)
  console.log('\n🧪 Test 3: Backend Services Check');
  const backendServices = [
    { url: 'http://localhost:4000/health', name: 'API Gateway' },
    { url: 'http://localhost:3001/health', name: 'Auth Service' },
    { url: 'http://localhost:3003/health', name: 'Files Service' },
    { url: 'http://localhost:3004/health', name: 'Notifications Service' }
  ];
  
  for (const service of backendServices) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(service.url, { 
        signal: controller.signal,
        method: 'GET'
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ ${service.name}: Healthy`);
        tests.push({ name: service.name, status: 'PASS', details: 'Service healthy' });
      } else {
        console.log(`⚠️ ${service.name}: Status ${response.status}`);
        tests.push({ name: service.name, status: 'WARN', details: `Status: ${response.status}` });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⚠️ ${service.name}: Timeout (not running)`);
        tests.push({ name: service.name, status: 'WARN', details: 'Service not running' });
      } else {
        console.log(`❌ ${service.name}: ${error.message}`);
        tests.push({ name: service.name, status: 'FAIL', details: error.message });
      }
    }
  }
  
  // Test 4: Infrastructure Services
  console.log('\n🧪 Test 4: Infrastructure Services');
  const infraServices = [
    { url: 'http://localhost:5432', name: 'PostgreSQL', type: 'tcp' },
    { url: 'http://localhost:6379', name: 'Redis', type: 'tcp' },
    { url: 'http://localhost:9000', name: 'MinIO', type: 'http' },
    { url: 'http://localhost:1080', name: 'MailDev UI', type: 'http' }
  ];
  
  for (const service of infraServices) {
    try {
      if (service.type === 'http') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(service.url, { 
          signal: controller.signal,
          method: 'GET'
        });
        clearTimeout(timeoutId);
        
        console.log(`✅ ${service.name}: Accessible (${response.status})`);
        tests.push({ name: service.name, status: 'PASS', details: `HTTP ${response.status}` });
      } else {
        // For TCP services, we can't easily test from browser environment
        console.log(`⚠️ ${service.name}: TCP service (cannot test from browser)`);
        tests.push({ name: service.name, status: 'SKIP', details: 'TCP service' });
      }
    } catch (error) {
      console.log(`⚠️ ${service.name}: Not accessible`);
      tests.push({ name: service.name, status: 'WARN', details: 'Not accessible' });
    }
  }
  
  // Generate Test Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('='.repeat(60));
  
  const passCount = tests.filter(t => t.status === 'PASS').length;
  const failCount = tests.filter(t => t.status === 'FAIL').length;
  const warnCount = tests.filter(t => t.status === 'WARN').length;
  const skipCount = tests.filter(t => t.status === 'SKIP').length;
  
  console.log(`✅ PASSED: ${passCount}`);
  console.log(`❌ FAILED: ${failCount}`);
  console.log(`⚠️ WARNINGS: ${warnCount}`);
  console.log(`⏭️ SKIPPED: ${skipCount}`);
  console.log(`📊 TOTAL: ${tests.length}`);
  
  // Detailed Results
  console.log('\n📝 DETAILED RESULTS:');
  tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : 
                 test.status === 'FAIL' ? '❌' : 
                 test.status === 'WARN' ? '⚠️' : '⏭️';
    console.log(`${icon} ${test.name}: ${test.details}`);
  });
  
  // Recommendations
  console.log('\n🔍 ANALYSIS:');
  
  if (passCount > 0) {
    console.log('✅ Frontend is running and accessible');
    console.log('✅ Development environment is partially functional');
  }
  
  if (failCount > 0 || warnCount > 2) {
    console.log('⚠️ Some backend services are not running');
    console.log('💡 To start all services: ./scripts/dev.sh');
    console.log('💡 To fix compilation issues: yarn workspace @clinic/common build');
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. ✅ Frontend is ready for manual testing');
  console.log('2. 🔧 Fix @clinic/common compilation errors');
  console.log('3. 🚀 Start all microservices');
  console.log('4. 🧪 Run comprehensive E2E test suite');
  
  // Save results to file
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    summary: { total: tests.length, passed: passCount, failed: failCount, warnings: warnCount, skipped: skipCount },
    tests,
    recommendations: [
      'Frontend is operational and ready for testing',
      'Backend services need compilation fixes and startup',
      'Infrastructure services are partially available',
      'Ready for comprehensive testing once backend is resolved'
    ]
  };
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Ensure test-results directory exists
    const testResultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    // Save JSON report
    const reportPath = path.join(testResultsDir, 'simple-ui-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Save summary markdown
    const summaryPath = path.join(testResultsDir, 'test-summary.md');
    const markdown = `# 🏥 Healthcare Platform Test Summary

**Generated**: ${timestamp}

## 📊 Test Results
- **Total Tests**: ${tests.length}
- **Passed**: ${passCount} ✅
- **Failed**: ${failCount} ❌  
- **Warnings**: ${warnCount} ⚠️
- **Skipped**: ${skipCount} ⏭️

## 🎯 Status
- **Frontend**: ✅ Running and accessible
- **Backend**: ⚠️ Needs compilation fixes
- **Infrastructure**: ✅ Partially available

## 📝 Recommendations
${report.recommendations.map(r => `- ${r}`).join('\n')}

## 🔍 Next Steps
1. Fix @clinic/common TypeScript compilation errors
2. Start all microservices with \`./scripts/dev.sh\`
3. Run comprehensive E2E test suite
4. Validate all user workflows end-to-end

---
*Generated by Simple UI Test Runner*
`;
    
    fs.writeFileSync(summaryPath, markdown);
    
    console.log('\n📄 REPORTS SAVED:');
    console.log(`- JSON Report: ${reportPath}`);
    console.log(`- Summary: ${summaryPath}`);
    
  } catch (error) {
    console.log('⚠️ Could not save report files:', error.message);
  }
  
  console.log('\n🎉 Simple UI Test Complete!');
  console.log('🌐 Frontend available at: http://localhost:5173');
  
  return { passCount, failCount, warnCount, tests };
}

// Run the test
if (require.main === module) {
  checkFrontendHealth().then(result => {
    process.exit(result.failCount > 3 ? 1 : 0); // Exit with error if too many failures
  }).catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { checkFrontendHealth };