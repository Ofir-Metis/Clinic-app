/**
 * SIMPLE QA ANALYSIS SCRIPT
 * Fetches and analyzes clinic application pages for critical issues
 */

const http = require('http');
const fs = require('fs').promises;

class SimpleQAAnalyzer {
    constructor() {
        this.baseUrl = 'localhost:5173';
        this.results = {
            timestamp: new Date().toISOString(),
            summary: {},
            pages: [],
            criticalIssues: [],
            recommendations: []
        };
    }

    /**
     * Main analysis entry point
     */
    async runAnalysis() {
        console.log('🔍 STARTING SIMPLE QA ANALYSIS');
        console.log(`🎯 Target: http://${this.baseUrl}\n`);

        const testPages = [
            { name: 'Homepage', path: '/' },
            { name: 'Login Page', path: '/login' },
            { name: 'Registration Page', path: '/register' },
            { name: 'Client Registration', path: '/client/register' }
        ];

        for (const page of testPages) {
            await this.analyzePage(page);
        }

        await this.generateReport();
        return this.results;
    }

    /**
     * Fetch and analyze a single page
     */
    async analyzePage(page) {
        console.log(`📄 Analyzing: ${page.name} (${page.path})`);

        const pageResult = {
            name: page.name,
            path: page.path,
            url: `http://${this.baseUrl}${page.path}`,
            timestamp: new Date().toISOString(),
            status: null,
            content: null,
            issues: [],
            score: 0
        };

        try {
            const { statusCode, content } = await this.fetchPage(page.path);
            pageResult.status = statusCode;
            pageResult.content = content.substring(0, 2000); // First 2000 chars

            // Analyze content for issues
            const analysis = this.analyzeContent(content, page);
            pageResult.issues = analysis.issues;
            pageResult.score = analysis.score;

            console.log(`${this.getScoreEmoji(pageResult.score)} ${page.name}: ${pageResult.score}/10`);

            if (analysis.issues.length > 0) {
                console.log(`  Issues found: ${analysis.issues.slice(0, 2).join(', ')}`);
            }

        } catch (error) {
            console.error(`❌ Failed to analyze ${page.name}:`, error.message);
            pageResult.issues.push(`Failed to fetch: ${error.message}`);
            pageResult.score = 0;
        }

        this.results.pages.push(pageResult);
    }

    /**
     * Fetch page content via HTTP
     */
    async fetchPage(path) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 5173,
                path: path,
                method: 'GET',
                headers: {
                    'User-Agent': 'QA-Analyzer/1.0'
                }
            };

            const req = http.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        content: data
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    /**
     * Analyze page content for issues
     */
    analyzeContent(content, page) {
        const issues = [];
        let score = 10;

        // Check for React app structure
        if (!content.includes('<div id="root">')) {
            issues.push('Missing React root element');
            score -= 3;
        }

        // Check for translation system errors
        const translationErrors = [
            { pattern: /t is not a function/g, message: 'Translation function error' },
            { pattern: /\[object Object\]/g, message: 'Object rendering error' },
            { pattern: /auth\.login\./g, message: 'Untranslated keys visible' },
            { pattern: /undefined/g, message: 'Undefined values in content' }
        ];

        translationErrors.forEach(({ pattern, message }) => {
            const matches = content.match(pattern);
            if (matches && matches.length > 0) {
                issues.push(`${message} (${matches.length} occurrences)`);
                score -= Math.min(3, matches.length);
            }
        });

        // Check for basic HTML structure
        if (!content.includes('<title>')) {
            issues.push('Missing page title');
            score -= 1;
        }

        if (!content.includes('<meta')) {
            issues.push('Missing meta tags');
            score -= 0.5;
        }

        // Check for script errors in HTML
        if (content.includes('Error:') || content.includes('TypeError:')) {
            issues.push('JavaScript errors in page source');
            score -= 2;
        }

        // Check for Material-UI components (indicates React app loaded)
        if (!content.includes('MuiBox') && !content.includes('mui') && page.name !== 'Homepage') {
            issues.push('Material-UI components not rendered (React app may not be loading)');
            score -= 2;
        }

        return {
            issues,
            score: Math.max(0, score)
        };
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
        console.log('\n📊 GENERATING QA ANALYSIS REPORT');

        // Calculate summary
        const totalPages = this.results.pages.length;
        const avgScore = totalPages > 0
            ? this.results.pages.reduce((sum, p) => sum + p.score, 0) / totalPages
            : 0;
        const passRate = totalPages > 0
            ? (this.results.pages.filter(p => p.score >= 7).length / totalPages) * 100
            : 0;

        this.results.summary = {
            totalPages,
            averageScore: Math.round(avgScore * 10) / 10,
            passRate: Math.round(passRate),
            criticalIssues: this.results.pages.filter(p => p.score < 5).length
        };

        // Collect all critical issues
        this.results.criticalIssues = this.results.pages
            .filter(p => p.issues.length > 0)
            .map(p => ({
                page: p.name,
                issues: p.issues
            }));

        // Generate recommendations
        this.generateRecommendations();

        // Save report
        const reportPath = `simple-qa-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));

        // Print summary
        console.log('\n🎯 === QA ANALYSIS RESULTS ===');
        console.log(`Overall Score: ${this.results.summary.averageScore}/10 ${this.getScoreEmoji(this.results.summary.averageScore)}`);
        console.log(`Pass Rate: ${this.results.summary.passRate}%`);
        console.log(`Pages Analyzed: ${this.results.summary.totalPages}`);
        console.log(`Critical Issues: ${this.results.summary.criticalIssues}`);

        if (this.results.criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES FOUND:');
            this.results.criticalIssues.forEach(issue => {
                console.log(`  ${issue.page}: ${issue.issues.join(', ')}`);
            });
        }

        console.log(`\n📄 Detailed report saved: ${reportPath}`);

        return this.results;
    }

    /**
     * Generate actionable recommendations
     */
    generateRecommendations() {
        const allIssues = this.results.pages.flatMap(p => p.issues);
        const recommendations = [];

        // Translation system issues
        const translationIssues = allIssues.filter(issue =>
            issue.includes('Translation') || issue.includes('Untranslated') || issue.includes('function error')
        );

        if (translationIssues.length > 0) {
            recommendations.push({
                priority: 'P0 - CRITICAL',
                category: 'Translation System',
                description: 'Fix translation system to prevent "t is not a function" errors',
                action: 'Update useTranslation hook in LanguageContext.tsx to return function instead of object'
            });
        }

        // React app loading issues
        const reactIssues = allIssues.filter(issue =>
            issue.includes('React app') || issue.includes('Material-UI')
        );

        if (reactIssues.length > 0) {
            recommendations.push({
                priority: 'P1 - HIGH',
                category: 'Application Loading',
                description: 'React application not loading properly on some pages',
                action: 'Check for JavaScript errors and ensure proper routing configuration'
            });
        }

        // Basic structure issues
        const structureIssues = allIssues.filter(issue =>
            issue.includes('title') || issue.includes('meta') || issue.includes('root')
        );

        if (structureIssues.length > 0) {
            recommendations.push({
                priority: 'P2 - MEDIUM',
                category: 'Page Structure',
                description: 'Missing basic HTML structure elements',
                action: 'Ensure all pages have proper title, meta tags, and root elements'
            });
        }

        this.results.recommendations = recommendations;
    }
}

// Export for use
module.exports = SimpleQAAnalyzer;

// Standalone execution
if (require.main === module) {
    async function runAnalysis() {
        const analyzer = new SimpleQAAnalyzer();
        await analyzer.runAnalysis();
    }

    runAnalysis().catch(console.error);
}