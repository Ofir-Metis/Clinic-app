#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testDevServer() {
    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        defaultViewport: { width: 1280, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Capture all console logs and errors
    const logs = [];
    const errors = [];
    
    page.on('console', msg => {
        const logEntry = `${msg.type().toUpperCase()}: ${msg.text()}`;
        logs.push(logEntry);
        console.log('🌐 ' + logEntry);
    });
    
    page.on('pageerror', err => {
        const errorEntry = `PAGE ERROR: ${err.message}\n${err.stack}`;
        errors.push(errorEntry);
        console.log('❌ ' + errorEntry);
    });
    
    try {
        console.log('🔍 Testing development server at http://localhost:5174/');
        
        // Navigate to development server
        await page.goto('http://localhost:5174/', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        // Wait for React to render and errors to surface
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check what's actually rendered
        const bodyText = await page.$eval('body', el => el.textContent.substring(0, 500));
        console.log('📄 Dev Server Content:', bodyText);
        
        // Take a screenshot
        await page.screenshot({ 
            path: 'screenshots/dev-server-test.png',
            fullPage: true
        });
        console.log('📸 Development server screenshot saved');
        
        console.log('\n📊 Development Server Summary:');
        console.log(`Total console logs: ${logs.length}`);
        console.log(`Total page errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 Development Server Errors:');
            errors.forEach(error => console.log(error));
        }
        
    } catch (error) {
        console.error('💥 Dev server test failed:', error.message);
        
        // If dev server fails, let's check if it's running
        console.log('🔍 Checking if dev server is responding...');
        try {
            const response = await page.goto('http://localhost:5174/', { timeout: 5000 });
            console.log(`Dev server status: ${response ? response.status() : 'No response'}`);
        } catch (e) {
            console.log('❌ Dev server is not accessible');
        }
    } finally {
        await browser.close();
    }
}

testDevServer().catch(console.error);