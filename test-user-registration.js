#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testUserRegistration() {
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
    
    // Capture ALL console output
    page.on('console', msg => {
        console.log(`🌐 [${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    
    page.on('pageerror', err => {
        console.log(`❌ [PAGE ERROR] ${err.message}`);
    });

    page.on('response', response => {
        if (response.url().includes('/auth/')) {
            console.log(`🔑 [API] ${response.method()} ${response.url()} → ${response.status()}`);
        }
    });
    
    try {
        console.log('🔍 USER REGISTRATION TEST - Simulating real user experience');
        console.log('===========================================================\n');
        
        // Test both available ports
        const urls = ['http://localhost:5173', 'http://localhost:5174'];
        let workingUrl = null;
        
        for (const baseUrl of urls) {
            try {
                console.log(`📍 Testing ${baseUrl}/register...`);
                await page.goto(`${baseUrl}/register`, { 
                    waitUntil: 'networkidle2',
                    timeout: 8000 
                });
                workingUrl = baseUrl;
                console.log(`✅ Successfully loaded ${baseUrl}`);
                break;
            } catch (error) {
                console.log(`❌ Failed to load ${baseUrl}: ${error.message}`);
            }
        }
        
        if (!workingUrl) {
            console.log('❌ Neither port 5173 nor 5174 is accessible');
            return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take initial screenshot
        const initialScreenshot = path.join(screenshotsDir, 'user_registration_initial.png');
        await page.screenshot({ path: initialScreenshot, fullPage: true });
        console.log(`📸 Initial screenshot saved: ${initialScreenshot}`);
        
        // Check form elements
        const formElements = {
            name: await page.$('#name'),
            email: await page.$('#email'), 
            password: await page.$('#password'),
            confirmPassword: await page.$('#confirmPassword'),
            submitButton: await page.$('button[type="submit"]')
        };
        
        console.log('\n📋 Form Element Check:');
        for (const [field, element] of Object.entries(formElements)) {
            console.log(`   ${field}: ${element ? '✅ Found' : '❌ Missing'}`);
        }
        
        if (!formElements.email || !formElements.password) {
            console.log('❌ Critical form fields missing');
            return;
        }
        
        // Fill the form like a real user would
        console.log('\n📝 Filling registration form...');
        
        const testEmail = `realuser_${Date.now()}@clinic.com`;
        console.log(`📧 Using email: ${testEmail}`);
        
        try {
            if (formElements.name) {
                await page.type('#name', 'Real Test User');
                console.log('✅ Name filled');
            }
            
            await page.type('#email', testEmail);
            console.log('✅ Email filled');
            
            await page.type('#password', 'MyStrongPass123!');
            console.log('✅ Password filled');
            
            if (formElements.confirmPassword) {
                await page.type('#confirmPassword', 'MyStrongPass123!');
                console.log('✅ Confirm password filled');
            }
            
        } catch (error) {
            console.log(`❌ Error filling form: ${error.message}`);
        }
        
        // Take screenshot of filled form
        const filledScreenshot = path.join(screenshotsDir, 'user_registration_filled.png');
        await page.screenshot({ path: filledScreenshot, fullPage: true });
        console.log(`📸 Filled form screenshot saved: ${filledScreenshot}`);
        
        // Check for any visible validation errors
        const validationErrors = await page.$$eval('[class*="error"], .MuiFormHelperText-root.Mui-error', 
            elements => elements.map(el => el.textContent.trim()).filter(text => text)
        );
        
        if (validationErrors.length > 0) {
            console.log('⚠️ Validation errors visible:');
            validationErrors.forEach((error, i) => console.log(`   ${i+1}. ${error}`));
        }
        
        // Submit the form
        console.log('\n🚀 Submitting registration form...');
        
        if (formElements.submitButton) {
            await formElements.submitButton.click();
            console.log('✅ Submit button clicked');
            
            // Wait and watch for responses
            console.log('⏳ Waiting for response (10 seconds)...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Check final state
            const finalUrl = page.url();
            console.log(`📍 Final URL: ${finalUrl}`);
            
            // Take final screenshot
            const finalScreenshot = path.join(screenshotsDir, 'user_registration_final.png');
            await page.screenshot({ path: finalScreenshot, fullPage: true });
            console.log(`📸 Final screenshot saved: ${finalScreenshot}`);
            
            // Analyze result
            if (finalUrl.includes('/dashboard')) {
                console.log('🎉 SUCCESS! User was registered and redirected to dashboard!');
            } else if (finalUrl.includes('/register')) {
                console.log('⚠️ Still on registration page - checking for errors...');
                
                // Look for any error messages
                const errorMessages = await page.$$eval('[class*="error"], .MuiAlert-message', 
                    elements => elements.map(el => el.textContent.trim()).filter(text => text)
                );
                
                if (errorMessages.length > 0) {
                    console.log('❌ Error messages found:');
                    errorMessages.forEach((error, i) => console.log(`   ${i+1}. ${error}`));
                } else {
                    console.log('🤔 No error messages visible - form may be silently failing');
                }
            } else {
                console.log(`❓ Unexpected redirect to: ${finalUrl}`);
            }
            
        } else {
            console.log('❌ Submit button not found');
        }
        
    } catch (error) {
        console.error(`💥 Test failed: ${error.message}`);
        
        // Take error screenshot
        const errorScreenshot = path.join(screenshotsDir, 'user_registration_error.png');
        await page.screenshot({ path: errorScreenshot, fullPage: true });
        console.log(`📸 Error screenshot saved: ${errorScreenshot}`);
        
    } finally {
        console.log('\n📝 User registration test complete');
        console.log('🔍 Screenshots saved in screenshots/ folder for analysis');
        console.log('🌐 Browser left open for manual inspection');
        
        // Leave browser open so you can inspect
        // await browser.close();
    }
}

testUserRegistration().catch(console.error);