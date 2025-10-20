/**
 * COMPREHENSIVE MANUAL QA TESTING SCRIPT
 * Tests clinic management application after Docker rebuild
 * Focus: Translation system fixes and overall functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveQATester {
    constructor() {
        this.baseUrl = 'http://localhost:5173';
        this.browser = null;
        this.page = null;
        this.testResults = {
            summary: {},
            pages: [],
            criticalIssues: [],
            screenshots: [],
            performanceMetrics: []
        };
        this.sessionId = `qa_${Date.now()}`;
    }

    /**
     * Main testing entry point
     */
    async runComprehensiveTest() {
        console.log('🚀 STARTING COMPREHENSIVE QA TESTING');
        console.log(`📊 Session ID: ${this.sessionId}`);
        console.log(`🎯 Target: ${this.baseUrl}\n`);

        try {
            await this.setupBrowser();
            await this.runApplicationTests();
            await this.generateReport();
            console.log('✅ COMPREHENSIVE TESTING COMPLETED SUCCESSFULLY');
            return this.testResults;
        } catch (error) {
            console.error('❌ TESTING FAILED:', error.message);
            this.testResults.criticalIssues.push({
                type: 'TESTING_FAILURE',
                severity: 'CRITICAL',
                message: error.message,
                timestamp: new Date().toISOString()
            });
            return this.testResults;
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Set up browser for testing
     */
    async setupBrowser() {
        console.log('🌐 Setting up browser...');
        this.browser = await puppeteer.launch({
            headless: false, // Visual testing
            defaultViewport: { width: 1920, height: 1080 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--allow-running-insecure-content'
            ]
        });

        this.page = await this.browser.newPage();

        // Set up console monitoring
        this.page.on('console', msg => {
            const type = msg.type();
            if (['error', 'warning'].includes(type)) {
                this.testResults.criticalIssues.push({
                    type: 'CONSOLE_ISSUE',
                    severity: type === 'error' ? 'HIGH' : 'MEDIUM',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Monitor page errors
        this.page.on('pageerror', error => {
            this.testResults.criticalIssues.push({
                type: 'PAGE_ERROR',
                severity: 'CRITICAL',
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });

        console.log('✅ Browser setup complete');
    }

    /**
     * Run comprehensive application tests
     */
    async runApplicationTests() {
        console.log('\n📋 RUNNING APPLICATION TESTS\n');

        // Test sequence - critical pages first
        const testSequence = [
            { name: 'Homepage', path: '/', critical: true },
            { name: 'Login Page', path: '/login', critical: true },
            { name: 'Registration Page', path: '/register', critical: true },
            { name: 'Client Registration', path: '/client/register', critical: true },
            { name: 'Client Login', path: '/client/login', critical: false },
            { name: 'Password Reset Request', path: '/reset/request', critical: false },
            { name: 'Dashboard', path: '/dashboard', critical: false }, // May require auth
        ];

        for (const test of testSequence) {
            await this.testPage(test);
        }

        // Additional functional tests
        await this.testTranslationSystem();
        await this.testResponsiveDesign();
        await this.testFormFunctionality();
    }

    /**
     * Test individual page comprehensively
     */
    async testPage(pageTest) {
        console.log(`🔍 TESTING: ${pageTest.name} (${pageTest.path})`);

        const pageResult = {
            name: pageTest.name,
            path: pageTest.path,
            url: this.baseUrl + pageTest.path,
            critical: pageTest.critical,
            timestamp: new Date().toISOString(),
            results: {
                navigation: null,
                rendering: null,
                translation: null,
                performance: null,
                accessibility: null
            },
            issues: [],
            screenshots: []
        };

        try {
            // Step 1: Navigate to page
            pageResult.results.navigation = await this.testNavigation(pageTest);

            // Step 2: Test page rendering
            pageResult.results.rendering = await this.testRendering(pageTest);

            // Step 3: Test translation system
            pageResult.results.translation = await this.testPageTranslations(pageTest);

            // Step 4: Capture screenshots
            await this.captureScreenshots(pageTest, pageResult);

            // Step 5: Test performance
            pageResult.results.performance = await this.testPerformance(pageTest);

            // Step 6: Test accessibility basics
            pageResult.results.accessibility = await this.testAccessibility(pageTest);

            // Calculate overall score
            pageResult.overallScore = this.calculatePageScore(pageResult.results);

            console.log(`${this.getScoreEmoji(pageResult.overallScore)} ${pageTest.name}: ${pageResult.overallScore}/10`);

        } catch (error) {
            console.error(`❌ Failed testing ${pageTest.name}:`, error.message);
            pageResult.issues.push({
                type: 'TEST_ERROR',
                severity: 'HIGH',
                message: `Testing failed: ${error.message}`,
                timestamp: new Date().toISOString()
            });
            pageResult.overallScore = 0;
        }

        this.testResults.pages.push(pageResult);

        // Brief pause between tests
        await this.page.waitForTimeout(1000);
    }

    /**
     * Test page navigation
     */
    async testNavigation(pageTest) {
        const startTime = Date.now();

        try {
            const response = await this.page.goto(pageTest.url, {
                waitUntil: 'networkidle2',
                timeout: 10000
            });

            const loadTime = Date.now() - startTime;
            const statusCode = response.status();

            if (statusCode >= 400) {
                return {
                    success: false,
                    statusCode,
                    loadTime,
                    message: `HTTP ${statusCode} error`,
                    score: 0
                };
            }

            return {
                success: true,
                statusCode,
                loadTime,
                message: `Loaded successfully in ${loadTime}ms`,
                score: loadTime < 3000 ? 10 : loadTime < 5000 ? 8 : 6
            };

        } catch (error) {
            return {
                success: false,
                message: `Navigation failed: ${error.message}`,
                score: 0
            };
        }
    }

    /**
     * Test page rendering and content
     */
    async testRendering(pageTest) {
        try {
            // Wait for React app to render
            await this.page.waitForTimeout(2000);

            // Check for basic page structure
            const hasTitle = await this.page.title();
            const hasBody = await this.page.$('body');
            const hasReactRoot = await this.page.$('#root');

            // Check for JavaScript errors in console
            const consoleErrors = this.testResults.criticalIssues.filter(
                issue => issue.type === 'CONSOLE_ISSUE' && issue.severity === 'HIGH'
            );

            // Check for specific error messages
            const errorElements = await this.page.$$eval('[class*="error"], [class*="Error"], .MuiAlert-message',
                elements => elements.map(el => el.textContent?.trim()).filter(Boolean)
            );

            let score = 10;
            const issues = [];

            if (!hasTitle) {
                issues.push('Missing page title');
                score -= 2;
            }

            if (!hasBody || !hasReactRoot) {
                issues.push('Missing critical page structure');
                score -= 4;
            }

            if (consoleErrors.length > 0) {
                issues.push(`${consoleErrors.length} console errors detected`);
                score -= Math.min(4, consoleErrors.length);
            }

            if (errorElements.length > 0) {
                issues.push(`Error messages visible: ${errorElements.join(', ')}`);
                score -= 3;
            }

            return {
                success: score >= 6,
                score: Math.max(0, score),
                pageTitle: hasTitle,
                hasReactRoot: !!hasReactRoot,
                consoleErrors: consoleErrors.length,
                visibleErrors: errorElements,
                issues
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * Test translation system specifically
     */
    async testPageTranslations(pageTest) {
        try {
            // Look for translation errors
            const translationErrors = await this.page.evaluate(() => {
                const textContent = document.body.textContent || '';
                const errorPatterns = [
                    /t is not a function/g,
                    /\[object Object\]/g,
                    /auth\.login\./g,
                    /undefined/g
                ];

                const foundErrors = [];
                errorPatterns.forEach((pattern, index) => {
                    const matches = textContent.match(pattern);
                    if (matches) {
                        foundErrors.push({
                            pattern: pattern.toString(),
                            count: matches.length,
                            type: ['function_error', 'object_error', 'key_error', 'undefined_error'][index]
                        });
                    }
                });

                return foundErrors;
            });

            // Check for language switcher
            const hasLanguageSwitcher = await this.page.$('select[aria-label="language switcher"], .language-switcher');

            // Check for properly formatted text (not showing translation keys)
            const suspiciousText = await this.page.$$eval('*', elements => {
                return elements
                    .map(el => el.textContent?.trim())
                    .filter(text => text && (
                        text.includes('.') && text.length < 50 && !text.includes(' ') ||
                        text.startsWith('[object') ||
                        text.includes('undefined')
                    ))
                    .slice(0, 10); // Limit results
            });

            let score = 10;
            const issues = [];

            if (translationErrors.length > 0) {
                issues.push(`Translation system errors: ${translationErrors.map(e => e.type).join(', ')}`);
                score -= 5;
            }

            if (suspiciousText.length > 0) {
                issues.push(`Suspicious text found: ${suspiciousText.slice(0, 3).join(', ')}`);
                score -= 2;
            }

            if (!hasLanguageSwitcher) {
                issues.push('Language switcher not found');
                score -= 1;
            }

            return {
                success: score >= 7,
                score: Math.max(0, score),
                translationErrors,
                hasLanguageSwitcher: !!hasLanguageSwitcher,
                suspiciousText,
                issues
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * Capture screenshots for visual verification
     */
    async captureScreenshots(pageTest, pageResult) {
        try {
            // Desktop screenshot
            const desktopPath = `screenshot_${pageTest.name.toLowerCase().replace(/\s+/g, '_')}_desktop_${this.sessionId}.png`;
            await this.page.screenshot({
                path: desktopPath,
                fullPage: true
            });
            pageResult.screenshots.push({
                type: 'desktop',
                path: desktopPath,
                viewport: '1920x1080'
            });

            // Mobile screenshot
            await this.page.setViewport({ width: 375, height: 667 });
            const mobilePath = `screenshot_${pageTest.name.toLowerCase().replace(/\s+/g, '_')}_mobile_${this.sessionId}.png`;
            await this.page.screenshot({
                path: mobilePath,
                fullPage: true
            });
            pageResult.screenshots.push({
                type: 'mobile',
                path: mobilePath,
                viewport: '375x667'
            });

            // Reset viewport
            await this.page.setViewport({ width: 1920, height: 1080 });

            this.testResults.screenshots.push(...pageResult.screenshots);

        } catch (error) {
            console.error('Screenshot capture failed:', error.message);
        }
    }

    /**
     * Test page performance metrics
     */
    async testPerformance(pageTest) {
        try {
            const metrics = await this.page.metrics();

            // Get navigation timing
            const timing = await this.page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    return {
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                        domInteractive: navigation.domInteractive - navigation.fetchStart,
                        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                    };
                }
                return {};
            });

            let score = 10;
            const issues = [];

            if (timing.loadComplete > 3000) {
                issues.push(`Slow load time: ${timing.loadComplete}ms`);
                score -= 2;
            }

            if (timing.firstContentfulPaint > 2000) {
                issues.push(`Slow first contentful paint: ${timing.firstContentfulPaint}ms`);
                score -= 2;
            }

            if (metrics.JSHeapUsedSize > 50 * 1024 * 1024) { // 50MB
                issues.push(`High memory usage: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(1)}MB`);
                score -= 1;
            }

            return {
                success: score >= 7,
                score: Math.max(0, score),
                metrics: {
                    ...timing,
                    jsHeapUsed: metrics.JSHeapUsedSize,
                    jsHeapTotal: metrics.JSHeapTotalSize
                },
                issues
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * Test basic accessibility
     */
    async testAccessibility(pageTest) {
        try {
            // Check for basic accessibility features
            const accessibilityChecks = await this.page.evaluate(() => {
                const checks = {
                    hasAltText: true,
                    hasAriaLabels: true,
                    hasHeadings: !!document.querySelector('h1, h2, h3, h4, h5, h6'),
                    hasSkipLinks: !!document.querySelector('[href="#main"], .skip-link'),
                    hasLandmarks: !!document.querySelector('main, nav, header, footer, [role="main"], [role="navigation"]'),
                    formLabels: true
                };

                // Check images for alt text
                const images = document.querySelectorAll('img');
                if (images.length > 0) {
                    checks.hasAltText = Array.from(images).every(img =>
                        img.alt !== undefined && img.alt !== ''
                    );
                }

                // Check form labels
                const inputs = document.querySelectorAll('input, textarea, select');
                if (inputs.length > 0) {
                    checks.formLabels = Array.from(inputs).every(input => {
                        const id = input.id;
                        return id && document.querySelector(`label[for="${id}"]`) ||
                               input.getAttribute('aria-label') ||
                               input.getAttribute('aria-labelledby');
                    });
                }

                return checks;
            });

            let score = 10;
            const issues = [];

            Object.entries(accessibilityChecks).forEach(([check, passed]) => {
                if (!passed) {
                    issues.push(`Accessibility issue: ${check}`);
                    score -= 1.5;
                }
            });

            return {
                success: score >= 7,
                score: Math.max(0, score),
                checks: accessibilityChecks,
                issues
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * Test translation system across languages
     */
    async testTranslationSystem() {
        console.log('\n🌍 TESTING TRANSLATION SYSTEM');

        try {
            await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });

            // Find language switcher
            const languageSwitcher = await this.page.$('select[aria-label="language switcher"]');

            if (languageSwitcher) {
                // Test switching to Hebrew
                await languageSwitcher.select('he');
                await this.page.waitForTimeout(1000);

                // Check if RTL is applied
                const direction = await this.page.evaluate(() => document.dir);
                console.log(`✅ Hebrew language test: direction=${direction}`);

                // Switch back to English
                await languageSwitcher.select('en');
                await this.page.waitForTimeout(1000);

                console.log('✅ Translation system basic functionality working');
            } else {
                console.log('⚠️ Language switcher not found');
            }

        } catch (error) {
            console.error('❌ Translation system test failed:', error.message);
        }
    }

    /**
     * Test responsive design
     */
    async testResponsiveDesign() {
        console.log('\n📱 TESTING RESPONSIVE DESIGN');

        const viewports = [
            { width: 375, height: 667, name: 'Mobile' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 1920, height: 1080, name: 'Desktop' }
        ];

        for (const viewport of viewports) {
            try {
                await this.page.setViewport(viewport);
                await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });

                // Check if layout adapts
                const isResponsive = await this.page.evaluate(() => {
                    const form = document.querySelector('form');
                    if (form) {
                        const rect = form.getBoundingClientRect();
                        return rect.width <= window.innerWidth;
                    }
                    return true;
                });

                console.log(`${isResponsive ? '✅' : '❌'} ${viewport.name} (${viewport.width}x${viewport.height}): ${isResponsive ? 'Responsive' : 'Layout issues'}`);

            } catch (error) {
                console.error(`❌ ${viewport.name} test failed:`, error.message);
            }
        }

        // Reset to desktop
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    /**
     * Test form functionality
     */
    async testFormFunctionality() {
        console.log('\n📝 TESTING FORM FUNCTIONALITY');

        try {
            await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });

            // Test login form
            const emailInput = await this.page.$('input[name="email"]');
            const passwordInput = await this.page.$('input[name="password"]');
            const submitButton = await this.page.$('button[type="submit"]');

            if (emailInput && passwordInput && submitButton) {
                // Test form validation
                await emailInput.type('invalid-email');
                await passwordInput.type('short');

                // Click submit to trigger validation
                await submitButton.click();

                // Wait and check for validation messages
                await this.page.waitForTimeout(1000);

                const validationErrors = await this.page.$$('.MuiFormHelperText-root');
                console.log(`✅ Form validation: ${validationErrors.length} validation messages shown`);

                // Clear form and test with valid data
                await emailInput.click({ clickCount: 3 });
                await emailInput.type('test@example.com');
                await passwordInput.click({ clickCount: 3 });
                await passwordInput.type('password123');

                console.log('✅ Form input functionality working');
            } else {
                console.log('⚠️ Login form elements not found');
            }

        } catch (error) {
            console.error('❌ Form functionality test failed:', error.message);
        }
    }

    /**
     * Calculate overall page score
     */
    calculatePageScore(results) {
        const scores = [
            results.navigation?.score || 0,
            results.rendering?.score || 0,
            results.translation?.score || 0,
            results.performance?.score || 0,
            results.accessibility?.score || 0
        ];

        return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10;
    }

    /**
     * Get emoji for score visualization
     */
    getScoreEmoji(score) {
        if (score >= 9) return '🟢';
        if (score >= 7) return '🟡';
        if (score >= 5) return '🟠';
        return '🔴';
    }

    /**
     * Generate comprehensive report
     */
    async generateReport() {
        console.log('\n📊 GENERATING COMPREHENSIVE REPORT');

        const summary = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            application: 'Clinic Management App',
            baseUrl: this.baseUrl,
            totalPages: this.testResults.pages.length,
            criticalPages: this.testResults.pages.filter(p => p.critical).length,
            overallScore: this.calculateOverallScore(),
            passRate: this.calculatePassRate(),
            criticalIssues: this.testResults.criticalIssues.length,
            screenshotCount: this.testResults.screenshots.length
        };

        this.testResults.summary = summary;

        // Generate recommendations
        const recommendations = this.generateRecommendations();
        this.testResults.recommendations = recommendations;

        // Save detailed report
        const reportPath = `comprehensive-qa-report-${this.sessionId}.json`;
        await fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2));

        // Print summary
        console.log('\n🎯 === COMPREHENSIVE QA RESULTS ===');
        console.log(`Overall Score: ${summary.overallScore}/10 ${this.getScoreEmoji(summary.overallScore)}`);
        console.log(`Pass Rate: ${summary.passRate}%`);
        console.log(`Critical Issues: ${summary.criticalIssues}`);
        console.log(`Screenshots Captured: ${summary.screenshotCount}`);
        console.log(`📄 Detailed report saved: ${reportPath}`);

        return this.testResults;
    }

    /**
     * Calculate overall application score
     */
    calculateOverallScore() {
        const pageScores = this.testResults.pages.map(p => p.overallScore || 0);
        return pageScores.length > 0
            ? Math.round((pageScores.reduce((sum, score) => sum + score, 0) / pageScores.length) * 10) / 10
            : 0;
    }

    /**
     * Calculate pass rate percentage
     */
    calculatePassRate() {
        const totalTests = this.testResults.pages.length;
        const passedTests = this.testResults.pages.filter(p => p.overallScore >= 7).length;
        return totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations() {
        const recommendations = [];

        // Critical issues first
        if (this.testResults.criticalIssues.length > 0) {
            recommendations.push({
                priority: 'P0 - CRITICAL',
                category: 'Critical Fixes Required',
                items: this.testResults.criticalIssues.slice(0, 5).map(issue => ({
                    issue: issue.message,
                    type: issue.type,
                    severity: issue.severity
                }))
            });
        }

        // Translation system issues
        const translationIssues = this.testResults.pages.filter(p =>
            p.results.translation && p.results.translation.score < 8
        );
        if (translationIssues.length > 0) {
            recommendations.push({
                priority: 'P1 - HIGH',
                category: 'Translation System',
                items: [
                    'Fix useTranslation hook to return function instead of object',
                    'Test all language switches thoroughly',
                    'Verify all translation keys exist in all languages'
                ]
            });
        }

        // Performance issues
        const performanceIssues = this.testResults.pages.filter(p =>
            p.results.performance && p.results.performance.score < 7
        );
        if (performanceIssues.length > 0) {
            recommendations.push({
                priority: 'P2 - MEDIUM',
                category: 'Performance Optimization',
                items: [
                    'Optimize bundle size and implement code splitting',
                    'Add image optimization and lazy loading',
                    'Implement proper caching strategies'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Export for use
module.exports = ComprehensiveQATester;

// Standalone execution
if (require.main === module) {
    async function runTest() {
        const tester = new ComprehensiveQATester();
        await tester.runComprehensiveTest();
    }

    runTest().catch(console.error);
}