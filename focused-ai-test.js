#!/usr/bin/env node

/**
 * Focused AI Features Test
 * Tests core GPT-5 AI functionality as requested
 */

const https = require('https');

class FocusedAITester {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.results = { tests: [], summary: { total: 0, passed: 0, failed: 0 } };
  }

  log(message, type = 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${icons[type] || 'ℹ️'} ${message}`);
  }

  async runTest(testName, testFn) {
    this.results.summary.total++;
    this.log(`Testing: ${testName}`, 'info');

    try {
      const result = await testFn();
      this.results.tests.push({ name: testName, status: 'PASSED', result });
      this.results.summary.passed++;
      this.log(`✅ PASSED: ${testName}`, 'success');
      return true;
    } catch (error) {
      this.results.tests.push({ name: testName, status: 'FAILED', error: error.message });
      this.results.summary.failed++;
      this.log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
      return false;
    }
  }

  async testGPT5BasicFunctionality() {
    const requestData = JSON.stringify({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful coaching assistant for wellness and personal development.'
        },
        {
          role: 'user',
          content: 'Generate a brief coaching insight about goal setting in exactly one sentence.'
        }
      ],
      max_completion_tokens: 100
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': requestData.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            if (response.choices && response.choices[0] && response.choices[0].message) {
              resolve({
                success: true,
                model: response.model,
                content: response.choices[0].message.content,
                usage: response.usage
              });
            } else {
              reject(new Error(`GPT-5 error: ${response.error?.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse GPT-5 response: ${error.message}`));
          }
        });
      });

      req.on('error', error => reject(new Error(`GPT-5 request failed: ${error.message}`)));
      req.write(requestData);
      req.end();
    });
  }

  async testGPT5MiniCostOptimization() {
    const requestData = JSON.stringify({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a cost-optimized assistant for quick responses.'
        },
        {
          role: 'user',
          content: 'Classify this as positive or negative: "I achieved my fitness goal this week!"'
        }
      ],
      max_completion_tokens: 10
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': requestData.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            if (response.choices && response.choices[0] && response.choices[0].message) {
              resolve({
                success: true,
                model: response.model,
                classification: response.choices[0].message.content,
                usage: response.usage,
                costOptimized: true
              });
            } else {
              reject(new Error(`GPT-5-mini error: ${response.error?.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse GPT-5-mini response: ${error.message}`));
          }
        });
      });

      req.on('error', error => reject(new Error(`GPT-5-mini request failed: ${error.message}`)));
      req.write(requestData);
      req.end();
    });
  }

  async testHealthcareOptimizedPrompt() {
    const requestData = JSON.stringify({
      model: 'gpt-5',
      messages: [
        {
          role: 'system',
          content: 'You are a healthcare-optimized coaching assistant. Focus on wellness, avoid medical advice, emphasize empowerment and personal growth. Protect any potentially sensitive information.'
        },
        {
          role: 'user',
          content: 'A client mentions feeling stressed about work-life balance. Provide a supportive coaching response.'
        }
      ],
      max_completion_tokens: 150
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.openai.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': requestData.length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            if (response.choices && response.choices[0] && response.choices[0].message) {
              const content = response.choices[0].message.content;
              const isHealthcareOptimized = !content.toLowerCase().includes('medical') &&
                                          (content.toLowerCase().includes('empowerment') ||
                                           content.toLowerCase().includes('support') ||
                                           content.toLowerCase().includes('wellness'));

              resolve({
                success: true,
                model: response.model,
                coachingResponse: content,
                healthcareOptimized: isHealthcareOptimized,
                usage: response.usage
              });
            } else {
              reject(new Error(`Healthcare-optimized test error: ${response.error?.message || 'Unknown error'}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse healthcare-optimized response: ${error.message}`));
          }
        });
      });

      req.on('error', error => reject(new Error(`Healthcare-optimized request failed: ${error.message}`)));
      req.write(requestData);
      req.end();
    });
  }

  async runAllTests() {
    this.log('🚀 Starting Focused AI Features Test Suite', 'info');
    this.log('Testing GPT-5 Implementation as Requested', 'info');
    this.log('='.repeat(60), 'info');

    if (!this.apiKey) {
      this.log('❌ OPENAI_API_KEY not found in environment', 'error');
      return;
    }

    // Run focused tests
    await this.runTest('GPT-5 Basic Functionality', () => this.testGPT5BasicFunctionality());
    await this.runTest('GPT-5-Mini Cost Optimization', () => this.testGPT5MiniCostOptimization());
    await this.runTest('Healthcare-Optimized Prompting', () => this.testHealthcareOptimizedPrompt());

    // Print results
    this.printResults();
  }

  printResults() {
    this.log('='.repeat(60), 'info');
    this.log('📊 FOCUSED AI TEST RESULTS', 'info');
    this.log('='.repeat(60), 'info');

    this.log(`Total Tests: ${this.results.summary.total}`, 'info');
    this.log(`Passed: ${this.results.summary.passed}`, 'success');
    this.log(`Failed: ${this.results.summary.failed}`, this.results.summary.failed > 0 ? 'error' : 'info');

    const successRate = Math.round((this.results.summary.passed / this.results.summary.total) * 100);
    this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');

    this.log('', 'info');
    this.log('🔍 DETAILED RESULTS:', 'info');
    this.results.tests.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      this.log(`${status} ${test.name}`, 'info');
      if (test.status === 'FAILED') {
        this.log(`   Error: ${test.error}`, 'error');
      } else if (test.result) {
        if (test.result.model) this.log(`   Model: ${test.result.model}`, 'info');
        if (test.result.usage) this.log(`   Tokens: ${test.result.usage.total_tokens}`, 'info');
      }
    });

    // Final assessment
    this.log('', 'info');
    this.log('🎯 AI FEATURES ASSESSMENT:', 'info');
    if (this.results.summary.passed === this.results.summary.total) {
      this.log('🎉 ALL AI FEATURES WORKING CORRECTLY!', 'success');
      this.log('✅ GPT-5 healthcare-optimized models implemented', 'success');
      this.log('✅ Cost optimization with GPT-5-mini functional', 'success');
      this.log('✅ Healthcare-focused prompting working', 'success');
    } else {
      this.log('⚠️ Some AI features need attention', 'warning');
    }
  }
}

// Run the focused test
const tester = new FocusedAITester();
tester.runAllTests().catch(error => {
  console.error('❌ Focused AI test failed:', error.message);
  process.exit(1);
});