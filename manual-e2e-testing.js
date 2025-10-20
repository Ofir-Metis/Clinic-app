/**
 * Comprehensive Manual E2E Testing Script
 * Tests both UI/UX and Backend API functionality
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class E2ETestRunner {
  constructor() {
    this.baseUrl = 'http://127.0.0.1:4000';
    this.frontendUrl = 'http://127.0.0.1:5173';
    this.results = {
      frontend: [],
      backend: [],
      issues: [],
      passed: 0,
      failed: 0
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive E2E Testing');
    console.log('=====================================');
    
    // 1. Test Frontend Accessibility
    await this.testFrontendBasics();
    
    // 2. Test Backend Services Health
    await this.testBackendHealth();
    
    // 3. Test Authentication Flow
    await this.testAuthentication();
    
    // 4. Test Core Business APIs
    await this.testCoreApis();
    
    // 5. Generate Report
    this.generateReport();
  }

  async testFrontendBasics() {
    console.log('\n📱 FRONTEND TESTING');
    console.log('==================');
    
    try {
      // Test frontend accessibility
      const response = await fetch(this.frontendUrl, { timeout: 5000 });
      const html = await response.text();
      
      const tests = [
        {
          name: 'Frontend loads',
          passed: response.status === 200,
          details: `Status: ${response.status}`
        },
        {
          name: 'HTML contains React root',
          passed: html.includes('<div id="root">'),
          details: html.includes('<div id="root">') ? 'Root div found' : 'Missing React root'
        },
        {
          name: 'Assets loading properly',
          passed: html.includes('/assets/index-') && html.includes('.js'),
          details: html.includes('/assets/') ? 'Assets referenced' : 'No assets found'
        },
        {
          name: 'Title is set',
          passed: html.includes('<title>Clinic App</title>'),
          details: 'Application title present'
        },
        {
          name: 'Responsive meta tag',
          passed: html.includes('width=device-width'),
          details: 'Viewport meta tag configured'
        }
      ];
      
      this.processTestResults('Frontend Basic Tests', tests);
      
    } catch (error) {
      this.addIssue('CRITICAL', 'Frontend Inaccessible', error.message);
    }
  }

  async testBackendHealth() {
    console.log('\n🏥 BACKEND HEALTH TESTING');
    console.log('========================');
    
    const services = [
      { name: 'API Gateway', port: 4000, endpoint: '/health' },
      { name: 'Auth Service', port: 3001, endpoint: '/health' },
      { name: 'Files Service', port: 3003, endpoint: '/health' },
      { name: 'Notes Service', port: 3006, endpoint: '/health' },
      { name: 'Appointments Service', port: 3002, endpoint: '/api/v1/health' },
      { name: 'Analytics Service', port: 3007, endpoint: '/health' },
      { name: 'Settings Service', port: 3008, endpoint: '/health' },
      { name: 'Notifications Service', port: 3004, endpoint: '/health' },
      { name: 'Billing Service', port: 3009, endpoint: '/api/billing/health' },
      { name: 'Therapists Service', port: 3013, endpoint: '/health' },
      { name: 'Client Relationships', port: 3014, endpoint: '/health' }
    ];
    
    for (const service of services) {
      await this.testServiceHealth(service);
    }
  }

  async testServiceHealth(service) {
    try {
      const url = `http://127.0.0.1:${service.port}${service.endpoint}`;
      const response = await fetch(url, { 
        timeout: 3000,
        headers: { 'Accept': 'application/json' }
      });
      
      const isHealthy = response.status === 200;
      const data = await response.text();
      
      this.results.backend.push({
        service: service.name,
        status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
        port: service.port,
        response: response.status,
        data: data.substring(0, 200) + (data.length > 200 ? '...' : '')
      });
      
      if (isHealthy) {
        this.results.passed++;
        console.log(`  ✅ ${service.name} (${service.port}): HEALTHY`);
      } else {
        this.results.failed++;
        console.log(`  ❌ ${service.name} (${service.port}): UNHEALTHY - ${response.status}`);
        this.addIssue('HIGH', `${service.name} Health Check Failed`, `HTTP ${response.status}: ${data}`);
      }
      
    } catch (error) {
      this.results.failed++;
      console.log(`  ❌ ${service.name} (${service.port}): CONNECTION FAILED`);
      this.addIssue('CRITICAL', `${service.name} Unreachable`, error.message);
    }
  }

  async testAuthentication() {
    console.log('\n🔐 AUTHENTICATION TESTING');
    console.log('========================');
    
    const authTests = [
      { name: 'Login Endpoint Available', test: () => this.testLoginEndpoint() },
      { name: 'Register Endpoint Available', test: () => this.testRegisterEndpoint() },
      { name: 'JWT Token Validation', test: () => this.testJWTValidation() }
    ];
    
    for (const test of authTests) {
      try {
        const result = await test.test();
        if (result.passed) {
          console.log(`  ✅ ${test.name}`);
          this.results.passed++;
        } else {
          console.log(`  ❌ ${test.name}: ${result.error}`);
          this.results.failed++;
          this.addIssue('HIGH', `Auth Test Failed: ${test.name}`, result.error);
        }
      } catch (error) {
        console.log(`  ❌ ${test.name}: ${error.message}`);
        this.results.failed++;
        this.addIssue('HIGH', `Auth Test Error: ${test.name}`, error.message);
      }
    }
  }

  async testLoginEndpoint() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'invalid'
        }),
        timeout: 5000
      });
      
      // We expect this to fail with 401, not connection error
      return {
        passed: response.status === 401 || response.status === 400,
        error: response.status === 404 ? 'Login endpoint not found' : null
      };
    } catch (error) {
      return {
        passed: false,
        error: `Connection failed: ${error.message}`
      };
    }
  }

  async testRegisterEndpoint() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'invalid'
        }),
        timeout: 5000
      });
      
      return {
        passed: response.status !== 404,
        error: response.status === 404 ? 'Register endpoint not found' : null
      };
    } catch (error) {
      return {
        passed: false,
        error: `Connection failed: ${error.message}`
      };
    }
  }

  async testJWTValidation() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/profile`, {
        headers: { 
          'Authorization': 'Bearer invalid_token',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      return {
        passed: response.status === 401,
        error: response.status === 404 ? 'JWT validation endpoint not found' : null
      };
    } catch (error) {
      return {
        passed: false,
        error: `Connection failed: ${error.message}`
      };
    }
  }

  async testCoreApis() {
    console.log('\n🏢 CORE BUSINESS API TESTING');
    console.log('============================');
    
    const coreTests = [
      { name: 'Appointments API', url: `${this.baseUrl}/appointments` },
      { name: 'Patients API', url: `${this.baseUrl}/patients` },
      { name: 'Therapists API', url: `${this.baseUrl}/therapists` },
      { name: 'Files API', url: `${this.baseUrl}/files` },
      { name: 'Notes API', url: `${this.baseUrl}/notes` }
    ];
    
    for (const test of coreTests) {
      await this.testAPIEndpoint(test.name, test.url);
    }
  }

  async testAPIEndpoint(name, url) {
    try {
      const response = await fetch(url, { 
        timeout: 3000,
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.status === 200 || response.status === 401 || response.status === 403) {
        console.log(`  ✅ ${name}: Endpoint accessible`);
        this.results.passed++;
      } else if (response.status === 404) {
        console.log(`  ❌ ${name}: Endpoint not found`);
        this.results.failed++;
        this.addIssue('HIGH', `API Endpoint Missing: ${name}`, `${url} returned 404`);
      } else {
        console.log(`  ⚠️  ${name}: Unexpected status ${response.status}`);
        this.results.failed++;
        this.addIssue('MEDIUM', `API Endpoint Issue: ${name}`, `${url} returned ${response.status}`);
      }
      
    } catch (error) {
      console.log(`  ❌ ${name}: Connection failed`);
      this.results.failed++;
      this.addIssue('CRITICAL', `API Endpoint Unreachable: ${name}`, `${url} - ${error.message}`);
    }
  }

  processTestResults(category, tests) {
    console.log(`\n${category}:`);
    tests.forEach(test => {
      if (test.passed) {
        console.log(`  ✅ ${test.name}`);
        this.results.passed++;
      } else {
        console.log(`  ❌ ${test.name}: ${test.details}`);
        this.results.failed++;
        this.addIssue('HIGH', `UI Test Failed: ${test.name}`, test.details);
      }
    });
    
    this.results.frontend = [...this.results.frontend, ...tests];
  }

  addIssue(severity, title, description) {
    this.results.issues.push({
      severity,
      title,
      description,
      timestamp: new Date().toISOString()
    });
  }

  generateReport() {
    console.log('\n📊 COMPREHENSIVE E2E TEST RESULTS');
    console.log('=================================');
    
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
    
    console.log(`\n📈 OVERALL SUMMARY:`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${this.results.passed} ✅`);
    console.log(`   Failed: ${this.results.failed} ❌`);
    console.log(`   Pass Rate: ${passRate}%`);
    
    console.log(`\n🚨 ISSUES FOUND (${this.results.issues.length} total):`);
    
    const criticalIssues = this.results.issues.filter(i => i.severity === 'CRITICAL');
    const highIssues = this.results.issues.filter(i => i.severity === 'HIGH');
    const mediumIssues = this.results.issues.filter(i => i.severity === 'MEDIUM');
    
    console.log(`   🔴 CRITICAL: ${criticalIssues.length}`);
    console.log(`   🟡 HIGH: ${highIssues.length}`);
    console.log(`   🟢 MEDIUM: ${mediumIssues.length}`);
    
    if (criticalIssues.length > 0) {
      console.log(`\n🔴 CRITICAL ISSUES:`);
      criticalIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.title}`);
        console.log(`      ${issue.description}`);
      });
    }
    
    if (highIssues.length > 0) {
      console.log(`\n🟡 HIGH PRIORITY ISSUES:`);
      highIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.title}`);
        console.log(`      ${issue.description}`);
      });
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'e2e-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📁 Detailed report saved to: ${reportPath}`);
    
    console.log('\n🎯 RECOMMENDATIONS:');
    this.generateRecommendations();
  }

  generateRecommendations() {
    const critical = this.results.issues.filter(i => i.severity === 'CRITICAL').length;
    const high = this.results.issues.filter(i => i.severity === 'HIGH').length;
    
    if (critical > 0) {
      console.log(`   1. 🚨 ADDRESS CRITICAL ISSUES IMMEDIATELY - ${critical} blocking issues found`);
    }
    
    if (high > 0) {
      console.log(`   2. ⚠️  RESOLVE HIGH PRIORITY ISSUES - ${high} significant issues found`);
    }
    
    const backendFailures = this.results.backend.filter(s => s.status !== 'HEALTHY').length;
    if (backendFailures > 3) {
      console.log(`   3. 🔧 BACKEND STABILITY - ${backendFailures} services unhealthy`);
    }
    
    if (this.results.passed < this.results.failed) {
      console.log(`   4. 🧪 COMPREHENSIVE TESTING NEEDED - More tests failing than passing`);
    }
    
    console.log(`   5. ✅ CONTINUE MONITORING - Regular E2E testing recommended`);
  }
}

// Run the tests
const testRunner = new E2ETestRunner();
testRunner.runAllTests().catch(error => {
  console.error('🚨 Test runner failed:', error);
  process.exit(1);
});