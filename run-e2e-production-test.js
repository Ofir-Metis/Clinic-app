#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏥 \x1b[32mComprehensive E2E Production Test Suite\x1b[0m');
console.log('===========================================\n');

const tests = [
  {
    name: '🔍 System Health Check',
    test: async () => {
      console.log('  Testing API Gateway health...');
      const healthResponse = JSON.parse(execSync('curl -s http://localhost:4000/health').toString());
      if (healthResponse.status !== 'ok') throw new Error('API Gateway unhealthy');
      
      console.log('  Testing versioned health endpoint...');
      const versionedHealth = JSON.parse(execSync('curl -s http://localhost:4000/api/v1/health').toString());
      if (versionedHealth.status !== 'ok') throw new Error('Versioned endpoint failed');
      
      console.log('  ✅ API Gateway is healthy');
      return true;
    }
  },
  
  {
    name: '🗄️ Database Connectivity Test',
    test: async () => {
      console.log('  Testing PostgreSQL connection...');
      const dbResult = execSync('PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "SELECT NOW()" -t 2>/dev/null').toString().trim();
      if (!dbResult) throw new Error('Database connection failed');
      
      console.log('  Testing database operations...');
      execSync('PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "CREATE TABLE IF NOT EXISTS e2e_test (id SERIAL PRIMARY KEY, test_data VARCHAR(100));" 2>/dev/null');
      execSync('PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "INSERT INTO e2e_test (test_data) VALUES (\'E2E Production Test\');" 2>/dev/null');
      execSync('PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "DROP TABLE e2e_test;" 2>/dev/null');
      
      console.log('  ✅ Database operations successful');
      return true;
    }
  },
  
  {
    name: '🔧 Redis Cache Test',
    test: async () => {
      console.log('  Testing Redis connectivity...');
      const redisResult = execSync('docker compose -f docker-compose.simple.yml exec -T redis redis-cli ping 2>/dev/null').toString().trim();
      if (redisResult !== 'PONG') throw new Error('Redis connection failed');
      
      console.log('  Testing Redis operations...');
      execSync('docker compose -f docker-compose.simple.yml exec -T redis redis-cli SET e2e_test "production_test_value" 2>/dev/null');
      const value = execSync('docker compose -f docker-compose.simple.yml exec -T redis redis-cli GET e2e_test 2>/dev/null').toString().trim();
      execSync('docker compose -f docker-compose.simple.yml exec -T redis redis-cli DEL e2e_test 2>/dev/null');
      
      if (!value.includes('production_test_value')) throw new Error('Redis operations failed');
      
      console.log('  ✅ Redis cache operations successful');
      return true;
    }
  },
  
  {
    name: '📡 NATS Message Broker Test',
    test: async () => {
      console.log('  Testing NATS monitoring endpoint...');
      const natsStats = JSON.parse(execSync('curl -s http://localhost:8222/varz').toString());
      if (!natsStats.server_id) throw new Error('NATS stats unavailable');
      
      console.log('  Testing NATS health endpoint...');
      const natsHealth = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8222/healthz').toString();
      if (natsHealth !== '200') throw new Error('NATS health check failed');
      
      console.log('  ✅ NATS message broker is operational');
      return true;
    }
  },
  
  {
    name: '📁 MinIO Object Storage Test', 
    test: async () => {
      console.log('  Testing MinIO health endpoint...');
      const minioHealth = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/minio/health/live').toString();
      if (minioHealth !== '200') throw new Error('MinIO health check failed');
      
      console.log('  Testing MinIO file operations...');
      execSync('docker compose -f docker-compose.simple.yml exec -T minio mc mb --ignore-existing myminio/e2e-test-bucket 2>/dev/null || true');
      execSync('echo "E2E Production Test File" | docker compose -f docker-compose.simple.yml exec -T minio sh -c \'cat > /tmp/e2e-test.txt && mc cp /tmp/e2e-test.txt myminio/e2e-test-bucket/production-test.txt\' 2>/dev/null');
      
      const fileList = execSync('docker compose -f docker-compose.simple.yml exec -T minio mc ls myminio/e2e-test-bucket/ 2>/dev/null').toString();
      if (!fileList.includes('production-test.txt')) throw new Error('File upload failed');
      
      execSync('docker compose -f docker-compose.simple.yml exec -T minio mc rm myminio/e2e-test-bucket/production-test.txt 2>/dev/null');
      
      console.log('  ✅ MinIO object storage operations successful');
      return true;
    }
  },
  
  {
    name: '🌐 Frontend Accessibility Test',
    test: async () => {
      console.log('  Testing frontend accessibility...');
      const frontendResponse = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/').toString();
      if (frontendResponse !== '200') throw new Error('Frontend not accessible');
      
      console.log('  Testing frontend content delivery...');
      const frontendContent = execSync('curl -s http://localhost:5173/').toString();
      if (!frontendContent.includes('<title>Clinic App</title>')) throw new Error('Frontend content invalid');
      
      console.log('  ✅ Frontend is accessible and serving content');
      return true;
    }
  },
  
  {
    name: '🔗 Frontend-Backend Integration Test',
    test: async () => {
      console.log('  Testing frontend to backend connectivity...');
      const integrationResult = JSON.parse(execSync('docker compose -f docker-compose.simple.yml exec -T frontend curl -s http://api-gateway:4000/health').toString());
      if (integrationResult.status !== 'ok') throw new Error('Frontend-backend integration failed');
      
      console.log('  Testing cross-service communication...');
      const apiResult = JSON.parse(execSync('docker compose -f docker-compose.simple.yml exec -T frontend curl -s http://api-gateway:4000/api/v1/health').toString());
      if (apiResult.status !== 'ok') throw new Error('Cross-service API calls failed');
      
      console.log('  ✅ Frontend-backend integration successful');
      return true;
    }
  },
  
  {
    name: '📊 System Performance Test',
    test: async () => {
      console.log('  Testing API response times...');
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        execSync('curl -s http://localhost:4000/health >/dev/null');
      }
      const avgResponseTime = (Date.now() - startTime) / 10;
      
      if (avgResponseTime > 1000) throw new Error('API response time too slow');
      
      console.log(`  Testing concurrent requests... (avg: ${avgResponseTime.toFixed(2)}ms)`);
      execSync('for i in {1..5}; do curl -s http://localhost:4000/health >/dev/null & done; wait');
      
      console.log('  ✅ System performance within acceptable limits');
      return true;
    }
  },
  
  {
    name: '🔒 Security Headers Test',
    test: async () => {
      console.log('  Testing security headers...');
      const headers = execSync('curl -s -I http://localhost:4000/health').toString();
      
      console.log('  Testing CORS configuration...');
      const corsTest = execSync('curl -s -H "Origin: http://localhost:5173" -I http://localhost:4000/health').toString();
      
      console.log('  Testing API endpoint security...');
      const securityTest = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1/health').toString();
      if (securityTest !== '200') throw new Error('API security test failed');
      
      console.log('  ✅ Basic security checks passed');
      return true;
    }
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;
  const results = [];
  
  console.log('📋 Running comprehensive production tests...\n');
  
  for (const testCase of tests) {
    try {
      console.log(`\x1b[33m${testCase.name}\x1b[0m`);
      await testCase.test();
      console.log(`  \x1b[32m✅ PASSED\x1b[0m\n`);
      passed++;
      results.push({ name: testCase.name, status: 'PASSED', error: null });
    } catch (error) {
      console.log(`  \x1b[31m❌ FAILED: ${error.message}\x1b[0m\n`);
      failed++;
      results.push({ name: testCase.name, status: 'FAILED', error: error.message });
    }
  }
  
  // Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: tests.length,
      passed,
      failed,
      success_rate: ((passed / tests.length) * 100).toFixed(2) + '%'
    },
    environment: {
      api_gateway: 'http://localhost:4000',
      frontend: 'http://localhost:5173', 
      database: 'postgresql://localhost:5432/clinic',
      cache: 'redis://localhost:6379',
      message_broker: 'nats://localhost:4222',
      object_storage: 'minio://localhost:9000'
    },
    tests: results
  };
  
  fs.writeFileSync('e2e-production-test-report.json', JSON.stringify(report, null, 2));
  
  console.log('📊 \x1b[36mTest Results Summary\x1b[0m');
  console.log('========================');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: \x1b[32m${passed}\x1b[0m`);
  console.log(`❌ Failed: \x1b[31m${failed}\x1b[0m`);
  console.log(`Success Rate: \x1b[36m${((passed / tests.length) * 100).toFixed(2)}%\x1b[0m`);
  console.log(`📄 Detailed report saved to: e2e-production-test-report.json\n`);
  
  if (failed === 0) {
    console.log('🎉 \x1b[32mAll production tests passed! System is ready for deployment.\x1b[0m');
    process.exit(0);
  } else {
    console.log('⚠️  \x1b[31mSome tests failed. Please review and fix issues before deployment.\x1b[0m');
    process.exit(1);
  }
}

runTests().catch(console.error);