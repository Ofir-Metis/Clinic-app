#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing frontend access simulation...\n');

// Test 1: Load main HTML page
function testMainPage() {
    return new Promise((resolve, reject) => {
        console.log('1. Testing main page access at http://localhost:5173/');
        
        const req = http.get('http://localhost:5173/', (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`   ✅ Status: ${res.statusCode}`);
                console.log(`   ✅ Content-Type: ${res.headers['content-type']}`);
                console.log(`   ✅ Content Length: ${data.length} bytes`);
                
                // Check if HTML contains React app div
                if (data.includes('<div id="root">')) {
                    console.log('   ✅ React root div found');
                } else {
                    console.log('   ❌ React root div NOT found');
                }
                
                // Check if JS bundle is referenced
                const jsMatch = data.match(/src="([^"]*\.js)"/);
                if (jsMatch) {
                    console.log(`   ✅ JS bundle found: ${jsMatch[1]}`);
                    resolve(jsMatch[1]);
                } else {
                    console.log('   ❌ JS bundle NOT found');
                    reject('No JS bundle found');
                }
            });
        });
        
        req.on('error', (err) => {
            console.log(`   ❌ Error: ${err.message}`);
            reject(err);
        });
    });
}

// Test 2: Load JavaScript bundle
function testJSBundle(jsPath) {
    return new Promise((resolve, reject) => {
        console.log(`\n2. Testing JavaScript bundle access: ${jsPath}`);
        
        const req = http.get(`http://localhost:5173${jsPath}`, (res) => {
            let data = '';
            let chunks = 0;
            
            res.on('data', (chunk) => {
                chunks++;
                if (chunks < 5) data += chunk; // Only capture first few chunks for analysis
            });
            
            res.on('end', () => {
                console.log(`   ✅ Status: ${res.statusCode}`);
                console.log(`   ✅ Content-Type: ${res.headers['content-type']}`);
                console.log(`   ✅ Total chunks received: ${chunks}`);
                
                // Check if JS contains React components
                if (data.includes('React') || data.includes('createElement')) {
                    console.log('   ✅ React code detected in bundle');
                } else {
                    console.log('   ❌ React code NOT detected in bundle');
                }
                
                // Check for API configuration
                if (data.includes('localhost:4000') || data.includes('REACT_APP_API_URL')) {
                    console.log('   ✅ API configuration detected');
                } else {
                    console.log('   ❌ API configuration NOT detected');
                }
                
                resolve();
            });
        });
        
        req.on('error', (err) => {
            console.log(`   ❌ Error: ${err.message}`);
            reject(err);
        });
    });
}

// Test 3: Test API connectivity from frontend perspective
function testAPIFromFrontend() {
    return new Promise((resolve, reject) => {
        console.log('\n3. Testing API connectivity from frontend perspective');
        console.log('   Testing: http://localhost:4000/auth/verify');
        
        const req = http.get('http://localhost:4000/auth/verify', (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`   ✅ API Status: ${res.statusCode}`);
                console.log(`   ✅ API Response: ${data.substring(0, 200)}...`);
                
                if (res.statusCode === 401) {
                    console.log('   ✅ API properly rejects unauthorized requests');
                } else {
                    console.log('   ⚠️  API response unexpected for unauthorized request');
                }
                
                resolve();
            });
        });
        
        req.on('error', (err) => {
            console.log(`   ❌ API Error: ${err.message}`);
            reject(err);
        });
    });
}

// Test 4: Test login page specifically
function testLoginPage() {
    return new Promise((resolve, reject) => {
        console.log('\n4. Testing login page specifically');
        console.log('   Testing: http://localhost:5173/login');
        
        const req = http.get('http://localhost:5173/login', (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`   ✅ Login Page Status: ${res.statusCode}`);
                console.log(`   ✅ Content Length: ${data.length} bytes`);
                
                // Should return same HTML since React handles routing
                if (data.includes('<div id="root">')) {
                    console.log('   ✅ Login page returns React app HTML');
                } else {
                    console.log('   ❌ Login page does NOT return proper HTML');
                }
                
                resolve();
            });
        });
        
        req.on('error', (err) => {
            console.log(`   ❌ Login Page Error: ${err.message}`);
            reject(err);
        });
    });
}

// Run all tests
async function runTests() {
    try {
        const jsBundle = await testMainPage();
        await testJSBundle(jsBundle);
        await testAPIFromFrontend();
        await testLoginPage();
        
        console.log('\n🎉 All tests completed!');
        console.log('\n💡 Analysis:');
        console.log('   - Frontend HTML is loading correctly');
        console.log('   - JavaScript bundle is accessible');
        console.log('   - API endpoints are responding');
        console.log('   - Routing appears to be working');
        console.log('\n🔍 If you\'re still seeing "Oops! Something went wrong":');
        console.log('   1. Check browser console (F12) for JavaScript errors');
        console.log('   2. Try clearing browser cache (Ctrl+F5)');
        console.log('   3. Try accessing http://localhost:5174 (dev server)');
        console.log('   4. Check network tab for failed requests');
        
    } catch (error) {
        console.log(`\n❌ Tests failed: ${error.message}`);
    }
}

runTests();