import { Controller, Get, Post, Body, Query, Logger, Headers, Req } from '@nestjs/common';
import { Request } from 'express';
import { SecurityHeadersService } from '../services/security-headers.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';

interface CSPGenerationRequest {
  allowInline?: boolean;
  allowEval?: boolean;
  allowGoogleAPIs?: boolean;
  allowOpenAI?: boolean;
  development?: boolean;
}

interface PermissionsPolicyRequest {
  allowCamera?: boolean;
  allowMicrophone?: boolean;
  allowGeolocation?: boolean;
  allowPayment?: boolean;
  allowFullscreen?: boolean;
}

/**
 * Security Headers Controller
 * 
 * Provides endpoints for security headers management, analysis, and recommendations.
 * These endpoints are primarily used by administrators and security teams.
 */
@ApiTags('Security Headers')
@Controller('security/headers')
export class SecurityHeadersController {
  private readonly logger = new Logger(SecurityHeadersController.name);

  constructor(private readonly securityHeadersService: SecurityHeadersService) {}

  /**
   * Get current security headers configuration status
   */
  @Get('status')
  @ApiOperation({ 
    summary: 'Get security headers status',
    description: 'Returns the current security headers configuration and validation results'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Security headers status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        configuration: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              headerName: { type: 'string' },
              isSet: { type: 'boolean' },
              value: { type: 'string' },
              recommendation: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalHeaders: { type: 'number' },
            configured: { type: 'number' },
            issues: { type: 'number' },
            criticalIssues: { type: 'number' }
          }
        }
      }
    }
  })
  getSecurityHeadersStatus() {
    try {
      const validation = this.securityHeadersService.validateConfiguration();
      
      const summary = {
        totalHeaders: validation.length,
        configured: validation.filter(v => v.isSet).length,
        issues: validation.filter(v => v.recommendation).length,
        criticalIssues: validation.filter(v => v.severity === 'critical').length
      };

      this.logger.debug('Security headers status requested', { summary });

      return {
        configuration: validation,
        summary,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get security headers status:', error.message);
      throw error;
    }
  }

  /**
   * Generate Content Security Policy
   */
  @Post('csp/generate')
  @ApiOperation({ 
    summary: 'Generate Content Security Policy',
    description: 'Generates a CSP header based on application requirements'
  })
  @ApiBody({
    description: 'CSP generation options',
    schema: {
      type: 'object',
      properties: {
        allowInline: { type: 'boolean', default: false },
        allowEval: { type: 'boolean', default: false },
        allowGoogleAPIs: { type: 'boolean', default: true },
        allowOpenAI: { type: 'boolean', default: true },
        development: { type: 'boolean', default: false }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'CSP generated successfully',
    schema: {
      type: 'object',
      properties: {
        policy: { type: 'string' },
        directives: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  generateCSP(@Body() options: CSPGenerationRequest = {}) {
    try {
      const policy = this.securityHeadersService.generateCSP(options);
      const directives = policy.split('; ');
      
      const warnings = [];
      const recommendations = [];

      // Analyze generated policy for warnings
      if (options.allowInline) {
        warnings.push('unsafe-inline allows arbitrary script execution - use nonces or hashes instead');
      }
      if (options.allowEval) {
        warnings.push('unsafe-eval allows code evaluation - remove if possible');
      }
      if (options.development) {
        warnings.push('Development mode allows less secure directives - ensure production uses stricter policy');
      }

      // Generate recommendations
      recommendations.push('Test CSP in report-only mode before enforcing');
      recommendations.push('Use CSP violation reports to identify legitimate resources');
      recommendations.push('Regularly review and update CSP directives');

      this.logger.log('CSP generated with options:', options);

      return {
        policy,
        directives,
        warnings,
        recommendations,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to generate CSP:', error.message);
      throw error;
    }
  }

  /**
   * Generate Permissions Policy
   */
  @Post('permissions-policy/generate')
  @ApiOperation({ 
    summary: 'Generate Permissions Policy',
    description: 'Generates a Permissions Policy header based on application needs'
  })
  @ApiBody({
    description: 'Permissions policy generation options',
    schema: {
      type: 'object',
      properties: {
        allowCamera: { type: 'boolean', default: true },
        allowMicrophone: { type: 'boolean', default: true },
        allowGeolocation: { type: 'boolean', default: false },
        allowPayment: { type: 'boolean', default: true },
        allowFullscreen: { type: 'boolean', default: true }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Permissions Policy generated successfully'
  })
  generatePermissionsPolicy(@Body() options: PermissionsPolicyRequest = {}) {
    try {
      const policy = this.securityHeadersService.generatePermissionsPolicy(options);
      const permissions = policy.split(', ');

      const enabledFeatures = Object.entries(options)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature);

      this.logger.log('Permissions Policy generated with options:', options);

      return {
        policy,
        permissions,
        enabledFeatures,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to generate Permissions Policy:', error.message);
      throw error;
    }
  }

  /**
   * Get production security headers recommendations
   */
  @Get('recommendations/production')
  @ApiOperation({ 
    summary: 'Get production recommendations',
    description: 'Returns recommended security headers configuration for production deployment'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Production recommendations retrieved successfully'
  })
  getProductionRecommendations() {
    try {
      const recommendations = this.securityHeadersService.getProductionRecommendations();
      
      this.logger.debug('Production recommendations requested');

      return {
        ...recommendations,
        notes: [
          'Required headers must be implemented for basic security',
          'Recommended headers provide additional protection',
          'Optional headers improve security posture and compliance',
          'Test all headers in staging environment before production deployment'
        ],
        implementation: {
          nginx: 'Configure headers in nginx.conf or server block',
          apache: 'Use .htaccess or virtual host configuration',
          cloudflare: 'Configure Transform Rules for header modification',
          application: 'Use SecurityHeadersMiddleware in NestJS application'
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get production recommendations:', error.message);
      throw error;
    }
  }

  /**
   * Analyze security headers from request
   */
  @Post('analyze')
  @ApiOperation({ 
    summary: 'Analyze security headers',
    description: 'Analyzes provided security headers and returns security score with recommendations'
  })
  @ApiBody({
    description: 'Headers to analyze',
    schema: {
      type: 'object',
      additionalProperties: { type: 'string' }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Headers analyzed successfully',
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        maxScore: { type: 'number' },
        grade: { type: 'string' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              header: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              fix: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  })
  analyzeHeaders(@Body() headers: Record<string, string>) {
    try {
      const analysis = this.securityHeadersService.analyzeHeaders(headers);
      
      // Calculate grade based on score
      const percentage = (analysis.score / analysis.maxScore) * 100;
      let grade = 'F';
      if (percentage >= 90) grade = 'A';
      else if (percentage >= 80) grade = 'B';
      else if (percentage >= 70) grade = 'C';
      else if (percentage >= 60) grade = 'D';

      this.logger.log(`Headers analyzed - Score: ${analysis.score}/${analysis.maxScore} (${grade})`);

      return {
        ...analysis,
        grade,
        percentage: Math.round(percentage),
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to analyze headers:', error.message);
      throw error;
    }
  }

  /**
   * Analyze current response headers
   */
  @Get('analyze/current')
  @ApiOperation({ 
    summary: 'Analyze current response headers',
    description: 'Analyzes the security headers set by this application'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Current headers analyzed successfully'
  })
  analyzeCurrentHeaders(@Req() req: Request, @Headers() headers: Record<string, string>) {
    try {
      // Note: Response headers are not available in the request
      // This endpoint would need to be implemented differently to capture response headers
      // For now, we'll analyze request headers as an example
      
      const analysis = this.securityHeadersService.analyzeHeaders(headers);
      
      this.logger.debug('Current headers analysis requested', {
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent')
      });

      return {
        ...analysis,
        note: 'This analysis is based on request headers. For response header analysis, use a security scanner or browser developer tools.',
        requestInfo: {
          url: req.url,
          method: req.method,
          userAgent: req.get('User-Agent')
        },
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to analyze current headers:', error.message);
      throw error;
    }
  }

  /**
   * Get security headers best practices
   */
  @Get('best-practices')
  @ApiOperation({ 
    summary: 'Get security headers best practices',
    description: 'Returns comprehensive best practices guide for security headers'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Best practices retrieved successfully'
  })
  getBestPractices() {
    try {
      const bestPractices = this.securityHeadersService.getBestPractices();
      
      this.logger.debug('Best practices requested');

      return {
        headers: bestPractices,
        generalPrinciples: [
          'Always test headers in staging before production',
          'Use Content-Security-Policy report-only mode during development',
          'Regularly review and update security policies',
          'Monitor CSP violation reports for policy adjustments',
          'Implement headers at multiple layers (application, reverse proxy, CDN)',
          'Keep security headers up to date with latest standards'
        ],
        tools: [
          'https://securityheaders.com/ - Online security headers scanner',
          'https://csp-evaluator.withgoogle.com/ - CSP evaluation tool',
          'https://observatory.mozilla.org/ - Mozilla Observatory scanner',
          'Browser Developer Tools - Network tab for header inspection'
        ],
        compliance: {
          'OWASP': 'Security headers help address OWASP Top 10 vulnerabilities',
          'PCI DSS': 'Required for payment card data protection',
          'HIPAA': 'Supports healthcare data security requirements',
          'GDPR': 'Privacy headers support data protection compliance'
        },
        retrievedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to get best practices:', error.message);
      throw error;
    }
  }

  /**
   * Test CSP violation reporting endpoint
   */
  @Post('csp/violation-report')
  @ApiOperation({ 
    summary: 'CSP violation report endpoint',
    description: 'Receives and logs CSP violation reports from browsers'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Violation report received'
  })
  handleCSPViolation(@Body() report: any, @Req() req: Request) {
    try {
      // Log CSP violation for analysis
      this.logger.warn('CSP Violation Report received:', {
        report,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      // In production, you might want to:
      // 1. Store violations in database
      // 2. Send alerts for critical violations
      // 3. Analyze patterns for policy adjustments
      // 4. Generate violation reports

      return {
        status: 'received',
        message: 'CSP violation report logged successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to handle CSP violation:', error.message);
      throw error;
    }
  }
}