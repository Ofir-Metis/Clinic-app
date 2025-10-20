#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function debugRegistration() {
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        defaultViewport: { width: 1280, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture ALL events
    page.on('console', msg => {
        console.log('🌐 CONSOLE:', msg.type().toUpperCase(), msg.text());
    });
    
    page.on('pageerror', err => {
        console.log('❌ PAGE ERROR:', err.message);
    });

    page.on('requestfailed', request => {
        console.log('🚫 REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    page.on('response', response => {
        if (response.url().includes('/auth/')) {
            console.log(`🔑 API Response: ${response.url()} - ${response.status()} ${response.statusText()}`);
        }
    });
    
    try {
        console.log('🔍 DEBUGGING REGISTRATION ISSUE');
        console.log('================================\n');
        
        // Try both ports
        const testUrls = [
            'http://localhost:5173/register',
            'http://localhost:5174/register'
        ];
        
        for (const testUrl of testUrls) {
            console.log(`\n📍 Testing URL: ${testUrl}`);
            
            try {
                await page.goto(testUrl, { 
                    waitUntil: 'networkidle2',
                    timeout: 10000 
                });
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Check if form exists
                const hasForm = await page.$('#email') !== null;
                const hasNameField = await page.$('#name') !== null;
                const hasPasswordField = await page.$('#password') !== null;
                const hasConfirmPasswordField = await page.$('#confirmPassword') !== null;
                const hasSubmitButton = await page.$('button[type="submit"]') !== null;
                
                console.log(`✅ Form found: ${hasForm}`);
                console.log(`✅ Name field: ${hasNameField}`);
                console.log(`✅ Email field: ${await page.$('#email') !== null}`);
                console.log(`✅ Password field: ${hasPasswordField}`);
                console.log(`✅ Confirm Password field: ${hasConfirmPasswordField}`);
                console.log(`✅ Submit button: ${hasSubmitButton}`);
                
                if (hasForm) {
                    // Take screenshot of form
                    const formScreenshot = path.join(screenshotsDir, `debug_form_${testUrl.includes('5173') ? '5173' : '5174'}.png`);
                    await page.screenshot({ path: formScreenshot, fullPage: true });
                    console.log(`📸 Form screenshot saved: ${formScreenshot}`);
                    
                    // Try to fill and submit
                    console.log('\n📝 Attempting to fill form...');
                    
                    if (hasNameField) await page.type('#name', 'Debug User');
                    await page.type('#email', `debug_${Date.now()}@clinic.com`);
                    await page.type('#password', 'debug123456');
                    if (hasConfirmPasswordField) await page.type('#confirmPassword', 'debug123456');
                    
                    console.log('✅ Form filled');
                    
                    // Take screenshot before submit
                    const beforeSubmitScreenshot = path.join(screenshotsDir, `debug_before_submit_${testUrl.includes('5173') ? '5173' : '5174'}.png`);
                    await page.screenshot({ path: beforeSubmitScreenshot, fullPage: true });
                    
                    // Submit
                    console.log('🔘 Clicking submit button...');
                    const submitButton = await page.$('button[type="submit"]');
                    await submitButton.click();
                    
                    // Wait and observe
                    console.log('⏳ Waiting for response...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // Check final state
                    const finalUrl = page.url();
                    console.log(`📍 Final URL: ${finalUrl}`);
                    
                    // Take final screenshot
                    const finalScreenshot = path.join(screenshotsDir, `debug_final_${testUrl.includes('5173') ? '5173' : '5174'}.png`);
                    await page.screenshot({ path: finalScreenshot, fullPage: true });
                    
                    // Check for validation errors
                    const errors = await page.$$eval('.MuiFormHelperText-root.Mui-error', els => 
                        els.map(el => el.textContent)
                    );
                    if (errors.length > 0) {
                        console.log('❌ Validation errors found:');
                        errors.forEach((error, i) => console.log(`   ${i+1}. ${error}`));
                    }
                    
                    break; // Stop after first successful form test
                }
            } catch (error) {
                console.log(`❌ Error testing ${testUrl}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('💥 Debug failed:', error.message);
    } finally {
        console.log('\n📝 Debug complete - leaving browser open for manual inspection');
        // Don't close browser - let user inspect
        // await browser.close();
    }
}

debugRegistration().catch(console.error);