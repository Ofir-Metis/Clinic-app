import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SecurityHeadersConfig {
  csp?: {
    policy?: string;
    reportOnly?: string;
    reportUri?: string;
  };
  hsts?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string;
  referrerPolicy?: string;
  permissionsPolicy?: string[];
  customHeaders?: Record<string, string>;
}

export interface SecurityHeadersReport {
  headerName: string;
  isSet: boolean;
  value?: string;
  recommendation?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Security Headers Service
 * 
 * Provides utilities for managing and analyzing security headers.
 * Offers configuration validation, security recommendations, and header analysis.
 */
@Injectable()
export class SecurityHeadersService {
  private readonly logger = new Logger(SecurityHeadersService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Generate Content Security Policy based on application requirements
   */
  generateCSP(options: {
    allowInline?: boolean;
    allowEval?: boolean;
    allowGoogleAPIs?: boolean;
    allowOpenAI?: boolean;
    development?: boolean;
  } = {}): string {
    const {
      allowInline = false,
      allowEval = false,
      allowGoogleAPIs = true,
      allowOpenAI = true,
      development = false
    } = options;

    const directives: Record<string, string[]> = {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'font-src': ["'self'", 'data:'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'media-src': ["'self'", 'blob:'],
      'connect-src': ["'self'"],
      'frame-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    };

    // Add inline script/style support if needed (less secure)
    if (allowInline) {
      directives['script-src'].push("'unsafe-inline'");
      directives['style-src'].push("'unsafe-inline'");
    }

    // Add eval support if needed (less secure)
    if (allowEval) {
      directives['script-src'].push("'unsafe-eval'");
    }

    // Google APIs integration
    if (allowGoogleAPIs) {
      directives['script-src'].push('https://apis.google.com', 'https://accounts.google.com');
      directives['style-src'].push('https://fonts.googleapis.com');
      directives['font-src'].push('https://fonts.gstatic.com');
      directives['frame-src'].push('https://accounts.google.com');
      directives['connect-src'].push('https://accounts.google.com');
    }

    // OpenAI API integration
    if (allowOpenAI) {
      directives['connect-src'].push('https://api.openai.com');
    }

    // Development-specific allowances
    if (development) {
      directives['connect-src'].push('http://localhost:*', 'ws://localhost:*', 'ws:', 'wss:');
      directives['script-src'].push("'unsafe-inline'", "'unsafe-eval'"); // For HMR
    } else {
      directives['block-all-mixed-content'] = [];
    }

    // Convert directives to CSP string
    return Object.entries(directives)
      .map(([directive, sources]) => 
        sources.length > 0 ? `${directive} ${sources.join(' ')}` : directive
      )
      .join('; ');
  }

  /**
   * Generate Permissions Policy based on application needs
   */
  generatePermissionsPolicy(options: {
    allowCamera?: boolean;
    allowMicrophone?: boolean;
    allowGeolocation?: boolean;
    allowPayment?: boolean;
    allowFullscreen?: boolean;
  } = {}): string {
    const {
      allowCamera = true,
      allowMicrophone = true,
      allowGeolocation = false,
      allowPayment = true,
      allowFullscreen = true
    } = options;

    const permissions: Record<string, string> = {
      'accelerometer': '()',
      'autoplay': '()',
      'camera': allowCamera ? '(self)' : '()',
      'cross-origin-isolated': '()',
      'display-capture': '()',
      'encrypted-media': '()',
      'fullscreen': allowFullscreen ? '(self)' : '()',
      'geolocation': allowGeolocation ? '(self)' : '()',
      'gyroscope': '()',
      'keyboard-map': '()',
      'magnetometer': '()',
      'microphone': allowMicrophone ? '(self)' : '()',
      'midi': '()',
      'payment': allowPayment ? '(self)' : '()',
      'picture-in-picture': '()',
      'publickey-credentials-get': '(self)',
      'screen-wake-lock': '()',
      'sync-xhr': '()',
      'usb': '()',
      'web-share': '(self)',
      'xr-spatial-tracking': '()'
    };

    return Object.entries(permissions)
      .map(([permission, value]) => `${permission}=${value}`)
      .join(', ');
  }

  /**
   * Validate current security headers configuration
   */
  validateConfiguration(): SecurityHeadersReport[] {
    const reports: SecurityHeadersReport[] = [];

    // Check CSP configuration
    const cspPolicy = this.configService.get('CSP_POLICY');
    reports.push({
      headerName: 'Content-Security-Policy',
      isSet: !!cspPolicy,
      value: cspPolicy,
      recommendation: !cspPolicy ? 'Configure CSP_POLICY environment variable' : undefined,
      severity: !cspPolicy ? 'high' : 'low'
    });

    // Check Frame Options
    const frameOptions = this.configService.get('X_FRAME_OPTIONS', 'DENY');
    reports.push({
      headerName: 'X-Frame-Options',
      isSet: true,
      value: frameOptions,
      recommendation: frameOptions !== 'DENY' && frameOptions !== 'SAMEORIGIN' 
        ? 'Use DENY or SAMEORIGIN for better security' 
        : undefined,
      severity: frameOptions === 'ALLOWALL' ? 'high' : 'low'
    });

    // Check HSTS in production
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const hstsMaxAge = this.configService.get('HSTS_MAX_AGE');
    reports.push({
      headerName: 'Strict-Transport-Security',
      isSet: isProduction && !!hstsMaxAge,
      value: hstsMaxAge,
      recommendation: isProduction && !hstsMaxAge 
        ? 'Configure HSTS_MAX_AGE for production deployment' 
        : undefined,
      severity: isProduction && !hstsMaxAge ? 'critical' : 'low'
    });

    // Check Referrer Policy
    const referrerPolicy = this.configService.get('REFERRER_POLICY');
    reports.push({
      headerName: 'Referrer-Policy',
      isSet: !!referrerPolicy,
      value: referrerPolicy || 'strict-origin-when-cross-origin',
      recommendation: !referrerPolicy 
        ? 'Consider setting REFERRER_POLICY environment variable' 
        : undefined,
      severity: 'low'
    });

    // Check for insecure configurations
    if (cspPolicy && cspPolicy.includes("'unsafe-inline'")) {
      reports.push({
        headerName: 'CSP Inline Scripts',
        isSet: true,
        value: 'unsafe-inline detected',
        recommendation: 'Remove unsafe-inline and use nonces or hashes for better security',
        severity: 'medium'
      });
    }

    if (cspPolicy && cspPolicy.includes("'unsafe-eval'")) {
      reports.push({
        headerName: 'CSP Eval',
        isSet: true,
        value: 'unsafe-eval detected',
        recommendation: 'Remove unsafe-eval if possible for better security',
        severity: 'medium'
      });
    }

    return reports;
  }

  /**
   * Generate security headers recommendations for production
   */
  getProductionRecommendations(): {
    required: Record<string, string>;
    recommended: Record<string, string>;
    optional: Record<string, string>;
  } {
    return {
      required: {
        'Content-Security-Policy': this.generateCSP({ development: false }),
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      },
      recommended: {
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': this.generatePermissionsPolicy(),
        'X-XSS-Protection': '1; mode=block',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private'
      },
      optional: {
        'X-Security-Contact': 'security@clinic-platform.com',
        'X-API-Version': '1.0',
        'X-Privacy-Policy': 'https://clinic-platform.com/privacy',
        'X-Terms-Of-Service': 'https://clinic-platform.com/terms'
      }
    };
  }

  /**
   * Analyze security headers from a response
   */
  analyzeHeaders(headers: Record<string, string>): {
    score: number;
    maxScore: number;
    issues: Array<{
      header: string;
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      fix: string;
    }>;
    recommendations: string[];
  } {
    const issues: Array<{
      header: string;
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      fix: string;
    }> = [];

    const recommendations: string[] = [];
    let score = 0;
    const maxScore = 100;

    // Check Content Security Policy (25 points)
    const csp = headers['content-security-policy'] || headers['Content-Security-Policy'];
    if (!csp) {
      issues.push({
        header: 'Content-Security-Policy',
        issue: 'Missing CSP header',
        severity: 'high',
        fix: 'Add Content-Security-Policy header to prevent XSS attacks'
      });
    } else {
      score += 25;
      if (csp.includes("'unsafe-inline'")) {
        issues.push({
          header: 'Content-Security-Policy',
          issue: 'CSP allows unsafe-inline',
          severity: 'medium',
          fix: 'Remove unsafe-inline and use nonces or hashes'
        });
        score -= 5;
      }
      if (csp.includes("'unsafe-eval'")) {
        issues.push({
          header: 'Content-Security-Policy',
          issue: 'CSP allows unsafe-eval',
          severity: 'medium',
          fix: 'Remove unsafe-eval if possible'
        });
        score -= 5;
      }
    }

    // Check X-Frame-Options (20 points)
    const frameOptions = headers['x-frame-options'] || headers['X-Frame-Options'];
    if (!frameOptions) {
      issues.push({
        header: 'X-Frame-Options',
        issue: 'Missing X-Frame-Options header',
        severity: 'high',
        fix: 'Add X-Frame-Options: DENY or SAMEORIGIN'
      });
    } else if (frameOptions.toUpperCase() === 'ALLOWALL') {
      issues.push({
        header: 'X-Frame-Options',
        issue: 'X-Frame-Options allows all frames',
        severity: 'high',
        fix: 'Change to DENY or SAMEORIGIN'
      });
    } else {
      score += 20;
    }

    // Check X-Content-Type-Options (15 points)
    const contentTypeOptions = headers['x-content-type-options'] || headers['X-Content-Type-Options'];
    if (!contentTypeOptions || contentTypeOptions !== 'nosniff') {
      issues.push({
        header: 'X-Content-Type-Options',
        issue: 'Missing or incorrect X-Content-Type-Options',
        severity: 'medium',
        fix: 'Add X-Content-Type-Options: nosniff'
      });
    } else {
      score += 15;
    }

    // Check HSTS (20 points)
    const hsts = headers['strict-transport-security'] || headers['Strict-Transport-Security'];
    if (!hsts) {
      issues.push({
        header: 'Strict-Transport-Security',
        issue: 'Missing HSTS header',
        severity: 'high',
        fix: 'Add Strict-Transport-Security header for HTTPS enforcement'
      });
    } else {
      score += 20;
      if (!hsts.includes('includeSubDomains')) {
        recommendations.push('Consider adding includeSubDomains to HSTS');
      }
      if (!hsts.includes('preload')) {
        recommendations.push('Consider adding preload to HSTS');
      }
    }

    // Check Referrer Policy (10 points)
    const referrerPolicy = headers['referrer-policy'] || headers['Referrer-Policy'];
    if (!referrerPolicy) {
      issues.push({
        header: 'Referrer-Policy',
        issue: 'Missing Referrer-Policy header',
        severity: 'low',
        fix: 'Add Referrer-Policy: strict-origin-when-cross-origin'
      });
    } else {
      score += 10;
    }

    // Check Permissions Policy (10 points)
    const permissionsPolicy = headers['permissions-policy'] || headers['Permissions-Policy'];
    if (!permissionsPolicy) {
      recommendations.push('Consider adding Permissions-Policy header');
    } else {
      score += 10;
    }

    // Additional recommendations
    if (!headers['x-xss-protection'] && !headers['X-XSS-Protection']) {
      recommendations.push('Consider adding X-XSS-Protection for legacy browser support');
    }

    if (headers['server'] || headers['Server']) {
      recommendations.push('Consider removing or genericizing Server header');
    }

    if (headers['x-powered-by'] || headers['X-Powered-By']) {
      recommendations.push('Remove X-Powered-By header to prevent technology disclosure');
    }

    return { score, maxScore, issues, recommendations };
  }

  /**
   * Get security headers best practices documentation
   */
  getBestPractices(): Record<string, {
    description: string;
    recommendation: string;
    example: string;
    references: string[];
  }> {
    return {
      'Content-Security-Policy': {
        description: 'Prevents XSS attacks by controlling which resources can be loaded',
        recommendation: 'Use restrictive policy, avoid unsafe-inline and unsafe-eval',
        example: "default-src 'self'; script-src 'self' https://apis.google.com",
        references: [
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
          'https://csp.withgoogle.com/docs/index.html'
        ]
      },
      'Strict-Transport-Security': {
        description: 'Enforces HTTPS connections to prevent man-in-the-middle attacks',
        recommendation: 'Use long max-age, include subdomains, consider preload',
        example: 'max-age=31536000; includeSubDomains; preload',
        references: [
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
          'https://hstspreload.org/'
        ]
      },
      'X-Frame-Options': {
        description: 'Prevents clickjacking attacks by controlling frame embedding',
        recommendation: 'Use DENY unless framing is required, then use SAMEORIGIN',
        example: 'DENY',
        references: [
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options'
        ]
      },
      'X-Content-Type-Options': {
        description: 'Prevents MIME sniffing attacks',
        recommendation: 'Always set to nosniff',
        example: 'nosniff',
        references: [
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options'
        ]
      },
      'Referrer-Policy': {
        description: 'Controls how much referrer information is included with requests',
        recommendation: 'Use strict-origin-when-cross-origin for privacy',
        example: 'strict-origin-when-cross-origin',
        references: [
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy'
        ]
      },
      'Permissions-Policy': {
        description: 'Controls which browser features can be used',
        recommendation: 'Restrict unnecessary features to minimize attack surface',
        example: 'camera=(self), microphone=(self), geolocation=()',
        references: [
          'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy'
        ]
      }
    };
  }
}