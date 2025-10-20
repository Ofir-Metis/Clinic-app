#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugReactErrors() {
    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        defaultViewport: { width: 1280, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Capture all console logs and errors
    const logs = [];
    const errors = [];
    const networkFailures = [];
    
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
    
    page.on('requestfailed', req => {
        const failureEntry = `NETWORK FAIL: ${req.url()} - ${req.failure().errorText}`;
        networkFailures.push(failureEntry);
        console.log('🚫 ' + failureEntry);
    });
    
    // Monitor response status codes
    page.on('response', response => {
        if (response.status() >= 400) {
            console.log(`❌ ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        console.log('🔍 Loading http://localhost:5173/');
        
        // Navigate to the page
        await page.goto('http://localhost:5173/', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        // Wait for React to render and errors to surface
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check what's actually rendered
        const bodyText = await page.$eval('body', el => el.textContent.substring(0, 500));
        console.log('📄 Page content (first 500 chars):', bodyText);
        
        // Check for React error boundaries
        const hasErrorBoundary = await page.$('.error-boundary, [data-error-boundary]');
        if (hasErrorBoundary) {
            const errorText = await hasErrorBoundary.textContent();
            console.log('🚨 Error Boundary Text:', errorText);
        }
        
        // Check React DevTools if available
        const reactVersion = await page.evaluate(() => {
            if (window.React) return window.React.version;
            if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) return 'React detected by DevTools';
            return 'React not detected';
        });
        console.log('⚛️  React Status:', reactVersion);
        
        // Check for specific missing resources
        const missingResources = [];
        await page.evaluate(() => {
            // Check for missing stylesheets
            const links = document.querySelectorAll('link[rel="stylesheet"]');
            links.forEach(link => {
                if (link.href && !link.sheet) {
                    console.log('Missing stylesheet:', link.href);
                }
            });
            
            // Check for missing scripts
            const scripts = document.querySelectorAll('script[src]');
            scripts.forEach(script => {
                console.log('Script found:', script.src);
            });
        });
        
        console.log('\n📊 Summary:');
        console.log(`Total console logs: ${logs.length}`);
        console.log(`Total page errors: ${errors.length}`);
        console.log(`Total network failures: ${networkFailures.length}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 Page Errors:');
            errors.forEach(error => console.log(error));
        }
        
        if (networkFailures.length > 0) {
            console.log('\n🚫 Network Failures:');
            networkFailures.forEach(failure => console.log(failure));
        }
        
        // Take a final screenshot
        await page.screenshot({ 
            path: 'screenshots/debug-react-error.png',
            fullPage: true
        });
        console.log('📸 Debug screenshot saved');
        
    } catch (error) {
        console.error('💥 Debug failed:', error.message);
    } finally {
        await browser.close();
    }
}

debugReactErrors().catch(console.error);