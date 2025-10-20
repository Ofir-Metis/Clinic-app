#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testDuplicateEmailRegistration() {
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: false,
        defaultViewport: { width: 1280, height: 800 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    let logs = [];
    page.on('console', msg => {
        const log = `${msg.type().toUpperCase()}: ${msg.text()}`;
        logs.push(log);
        console.log('🌐', log);
    });
    
    page.on('pageerror', err => {
        const error = `PAGE ERROR: ${err.message}`;
        logs.push(error);
        console.log('❌', error);
    });
    
    try {
        console.log('🔄 DUPLICATE EMAIL REGISTRATION TEST');
        console.log('=====================================\n');
        
        // Step 1: Navigate to registration page
        console.log('📍 Step 1: Loading registration page...');
        await page.goto('http://localhost:5173/register', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 2: Fill form with existing email
        console.log('\n📍 Step 2: Filling form with existing email (demo@clinic.com)...');
        
        await page.type('#name', 'Duplicate User');
        await page.type('#email', 'demo@clinic.com'); // This email already exists
        await page.type('#password', 'password123');
        await page.type('#confirmPassword', 'password123');
        
        console.log('✅ Form filled with existing email');
        
        // Take screenshot before submission
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const beforeSubmitScreenshot = path.join(screenshotsDir, `${timestamp}_duplicate_email_before_submit.png`);
        await page.screenshot({ 
            path: beforeSubmitScreenshot,
            fullPage: true
        });
        console.log(`📸 Before submit screenshot: ${beforeSubmitScreenshot}`);
        
        // Step 3: Submit the form
        console.log('\n📍 Step 3: Submitting form with duplicate email...');
        
        const submitButton = await page.$('button[type="submit"]');
        await submitButton.click();
        console.log('🔘 Submit button clicked');
        
        // Wait for response and error handling
        console.log('⏳ Waiting for error handling (10 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Take screenshot after submission
        const afterSubmitScreenshot = path.join(screenshotsDir, `${timestamp}_duplicate_email_after_submit.png`);
        await page.screenshot({ 
            path: afterSubmitScreenshot,
            fullPage: true
        });
        console.log(`📸 After submit screenshot: ${afterSubmitScreenshot}`);
        
        // Check current URL
        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);
        
        // Step 4: Check for error messages
        console.log('\n📍 Step 4: Checking for error messages...');
        
        const errorMessages = await page.evaluate(() => {
            // Look for various error message containers
            const selectors = [
                '.MuiAlert-message',
                '[data-testid="error-alert"]',
                '.error-message', 
                '.MuiFormHelperText-root.Mui-error',
                '[class*="error"]',
                '[role="alert"]'
            ];
            
            const messages = [];
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 0) {
                        messages.push({ selector, text });
                    }
                });
            });
            
            return messages;
        });
        
        console.log(`Found ${errorMessages.length} potential error messages:`);
        errorMessages.forEach((msg, i) => {
            console.log(`   ${i+1}. [${msg.selector}] "${msg.text}"`);
        });
        
        // Check if still on registration page vs redirected
        if (currentUrl.includes('/register')) {
            console.log('\n✅ Good: Still on registration page (as expected for error)');
            
            if (errorMessages.length > 0) {
                console.log('🎉 SUCCESS: Error messages are being displayed to user!');
                errorMessages.forEach((msg, i) => {
                    if (msg.text.toLowerCase().includes('email') || msg.text.toLowerCase().includes('exists') || msg.text.toLowerCase().includes('already')) {
                        console.log(`   ⭐ Relevant error message found: "${msg.text}"`);
                    }
                });
            } else {
                console.log('⚠️ ISSUE: No error messages visible to user');
                console.log('   This means users won\'t know why registration failed');
            }
            
        } else if (currentUrl.includes('/dashboard')) {
            console.log('\n❌ ERROR: User was redirected to dashboard (should not happen with duplicate email)');
        } else {
            console.log(`\n❓ Unexpected redirect to: ${currentUrl}`);
        }
        
        // Step 5: Check form state
        console.log('\n📍 Step 5: Checking form state...');
        
        const formState = await page.evaluate(() => {
            const submitButton = document.querySelector('button[type="submit"]');
            const form = document.querySelector('form');
            
            return {
                submitButtonText: submitButton ? submitButton.textContent : 'Not found',
                submitButtonDisabled: submitButton ? submitButton.disabled : false,
                formVisible: !!form,
                emailFieldValue: document.querySelector('#email')?.value || '',
                nameFieldValue: document.querySelector('#name')?.value || ''
            };
        });
        
        console.log('Form state after submission:');
        console.log(`   Submit button: "${formState.submitButtonText}" ${formState.submitButtonDisabled ? '(DISABLED)' : '(ENABLED)'}`);
        console.log(`   Email field: "${formState.emailFieldValue}"`);
        console.log(`   Name field: "${formState.nameFieldValue}"`);
        console.log(`   Form visible: ${formState.formVisible}`);
        
        console.log('\n📊 TEST SUMMARY');
        console.log('================');
        console.log(`Final URL: ${currentUrl}`);
        console.log(`Error messages found: ${errorMessages.length}`);
        console.log(`Console logs captured: ${logs.length}`);
        
        if (currentUrl.includes('/register') && errorMessages.length > 0) {
            console.log('\n✅ REGISTRATION ERROR HANDLING: WORKING CORRECTLY');
            console.log('   - User stays on registration page');
            console.log('   - Error messages are displayed');
            console.log('   - Form is ready for correction');
        } else if (currentUrl.includes('/register') && errorMessages.length === 0) {
            console.log('\n⚠️ REGISTRATION ERROR HANDLING: PARTIALLY WORKING');
            console.log('   - User stays on registration page (good)');
            console.log('   - BUT no error messages shown (needs improvement)');
        } else {
            console.log('\n❌ REGISTRATION ERROR HANDLING: NOT WORKING');
            console.log('   - User should stay on registration page with error message');
        }
        
    } catch (error) {
        console.error(`💥 Test failed: ${error.message}`);
        
        const errorScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_test_error.png`);
        await page.screenshot({ 
            path: errorScreenshot,
            fullPage: true
        });
        console.log(`📸 Test error screenshot: ${errorScreenshot}`);
        
    } finally {
        console.log('\n📝 Duplicate email registration test complete');
        console.log('📸 Check screenshots folder for visual evidence');
        
        // Keep browser open for inspection
        setTimeout(async () => {
            await browser.close();
        }, 5000);
    }
}

testDuplicateEmailRegistration().catch(console.error);