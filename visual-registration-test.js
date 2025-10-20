#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function visualRegistrationTest() {
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
        console.log('👀 VISUAL REGISTRATION CONFIRMATION TEST');
        console.log('==========================================\n');
        
        // Step 1: Navigate to registration page
        console.log('📍 Step 1: Loading registration page...');
        await page.goto('http://localhost:5173/register', { 
            waitUntil: 'networkidle2',
            timeout: 15000 
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take screenshot of initial page
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const step1Screenshot = path.join(screenshotsDir, `${timestamp}_step1_initial_page.png`);
        await page.screenshot({ 
            path: step1Screenshot,
            fullPage: true
        });
        console.log(`📸 Step 1 Screenshot: ${step1Screenshot}`);
        
        // Check page content
        const pageTitle = await page.title();
        const bodyText = await page.$eval('body', el => el.textContent.substring(0, 200));
        console.log(`📄 Page Title: ${pageTitle}`);
        console.log(`📄 Page Content Preview: ${bodyText.trim()}`);
        
        // Step 2: Check form elements
        console.log('\n📍 Step 2: Analyzing form elements...');
        
        const formCheck = await page.evaluate(() => {
            const nameField = document.querySelector('#name');
            const emailField = document.querySelector('#email');
            const passwordField = document.querySelector('#password');
            const confirmPasswordField = document.querySelector('#confirmPassword');
            const submitButton = document.querySelector('button[type="submit"]');
            
            return {
                nameField: nameField ? { found: true, placeholder: nameField.placeholder, label: nameField.getAttribute('aria-label') } : { found: false },
                emailField: emailField ? { found: true, placeholder: emailField.placeholder, label: emailField.getAttribute('aria-label') } : { found: false },
                passwordField: passwordField ? { found: true, placeholder: passwordField.placeholder, label: passwordField.getAttribute('aria-label') } : { found: false },
                confirmPasswordField: confirmPasswordField ? { found: true, placeholder: confirmPasswordField.placeholder, label: confirmPasswordField.getAttribute('aria-label') } : { found: false },
                submitButton: submitButton ? { found: true, text: submitButton.textContent, disabled: submitButton.disabled } : { found: false }
            };
        });
        
        console.log('Form Element Analysis:');
        for (const [field, info] of Object.entries(formCheck)) {
            if (info.found) {
                console.log(`  ✅ ${field}: Found ${info.text ? `"${info.text}"` : ''} ${info.disabled ? '(DISABLED)' : ''}`);
            } else {
                console.log(`  ❌ ${field}: NOT FOUND`);
            }
        }
        
        // Step 3: Fill the form
        console.log('\n📍 Step 3: Attempting to fill registration form...');
        
        const testData = {
            name: 'Visual Test User',
            email: `visualtest_${Date.now()}@clinic.com`,
            password: 'VisualTest123!'
        };
        
        console.log(`📧 Test Email: ${testData.email}`);
        
        try {
            // Fill name
            if (formCheck.nameField.found) {
                await page.type('#name', testData.name);
                console.log('✅ Name field filled');
            }
            
            // Fill email
            if (formCheck.emailField.found) {
                await page.type('#email', testData.email);
                console.log('✅ Email field filled');
            }
            
            // Fill password
            if (formCheck.passwordField.found) {
                await page.type('#password', testData.password);
                console.log('✅ Password field filled');
            }
            
            // Fill confirm password
            if (formCheck.confirmPasswordField.found) {
                await page.type('#confirmPassword', testData.password);
                console.log('✅ Confirm password field filled');
            }
            
            // Take screenshot after filling
            const step3Screenshot = path.join(screenshotsDir, `${timestamp}_step3_form_filled.png`);
            await page.screenshot({ 
                path: step3Screenshot,
                fullPage: true
            });
            console.log(`📸 Step 3 Screenshot: ${step3Screenshot}`);
            
        } catch (error) {
            console.log(`❌ Error filling form: ${error.message}`);
        }
        
        // Step 4: Check for validation errors before submit
        console.log('\n📍 Step 4: Checking for validation errors...');
        
        const validationErrors = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('.MuiFormHelperText-root.Mui-error, [class*="error"]');
            return Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text);
        });
        
        if (validationErrors.length > 0) {
            console.log('⚠️ Validation errors found:');
            validationErrors.forEach((error, i) => console.log(`   ${i+1}. ${error}`));
        } else {
            console.log('✅ No validation errors visible');
        }
        
        // Step 5: Submit the form
        console.log('\n📍 Step 5: Submitting the form...');
        
        if (formCheck.submitButton.found && !formCheck.submitButton.disabled) {
            const submitButton = await page.$('button[type="submit"]');
            await submitButton.click();
            console.log('🔘 Submit button clicked');
            
            // Wait for response
            console.log('⏳ Waiting for response (8 seconds)...');
            await new Promise(resolve => setTimeout(resolve, 8000));
            
            // Take screenshot after submit
            const step5Screenshot = path.join(screenshotsDir, `${timestamp}_step5_after_submit.png`);
            await page.screenshot({ 
                path: step5Screenshot,
                fullPage: true
            });
            console.log(`📸 Step 5 Screenshot: ${step5Screenshot}`);
            
            // Check final URL and state
            const finalUrl = page.url();
            console.log(`📍 Final URL: ${finalUrl}`);
            
            // Check for success/error messages
            const messages = await page.evaluate(() => {
                const alerts = document.querySelectorAll('.MuiAlert-message');
                const errors = document.querySelectorAll('.MuiFormHelperText-root.Mui-error');
                const success = document.querySelectorAll('[class*="success"]');
                
                return {
                    alerts: Array.from(alerts).map(el => el.textContent.trim()),
                    errors: Array.from(errors).map(el => el.textContent.trim()),
                    success: Array.from(success).map(el => el.textContent.trim())
                };
            });
            
            if (messages.alerts.length > 0) {
                console.log('🚨 Alert messages:');
                messages.alerts.forEach((msg, i) => console.log(`   ${i+1}. ${msg}`));
            }
            
            if (messages.errors.length > 0) {
                console.log('❌ Error messages:');
                messages.errors.forEach((msg, i) => console.log(`   ${i+1}. ${msg}`));
            }
            
            if (messages.success.length > 0) {
                console.log('🎉 Success messages:');
                messages.success.forEach((msg, i) => console.log(`   ${i+1}. ${msg}`));
            }
            
            // Final assessment
            if (finalUrl.includes('/dashboard')) {
                console.log('\n🎉 SUCCESS! Registration completed - redirected to dashboard');
            } else if (finalUrl.includes('/register')) {
                console.log('\n⚠️ Still on registration page - registration may have failed');
            } else {
                console.log(`\n❓ Unexpected redirect to: ${finalUrl}`);
            }
            
        } else if (formCheck.submitButton.disabled) {
            console.log('❌ Submit button is DISABLED - form validation preventing submission');
        } else {
            console.log('❌ Submit button not found');
        }
        
        console.log('\n📊 VISUAL TEST SUMMARY');
        console.log('=======================');
        console.log(`Console logs captured: ${logs.length}`);
        console.log(`Screenshots saved: 3+ in ${screenshotsDir}`);
        console.log(`Final URL: ${page.url()}`);
        
        console.log('\n📸 Screenshots taken:');
        console.log(`1. Initial page load`);
        console.log(`2. Form filled`);
        console.log(`3. After submission`);
        
    } catch (error) {
        console.error(`💥 Visual test failed: ${error.message}`);
        
        const errorScreenshot = path.join(screenshotsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}_error.png`);
        await page.screenshot({ 
            path: errorScreenshot,
            fullPage: true
        });
        console.log(`📸 Error screenshot: ${errorScreenshot}`);
        
    } finally {
        console.log('\n✅ Visual confirmation complete - browser will stay open for 10 seconds for manual inspection');
        
        // Keep browser open for manual inspection
        setTimeout(async () => {
            await browser.close();
        }, 10000);
    }
}

visualRegistrationTest().catch(console.error);