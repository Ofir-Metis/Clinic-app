import { Controller, Get, Post, Res, Req, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Security Headers Demo Controller
 * 
 * Demonstrates how security headers are automatically applied to responses.
 * Use this controller to test and verify security header implementation.
 */
@ApiTags('Security Headers Demo')
@Controller('examples/security-headers')
export class SecurityHeadersDemoController {
  private readonly logger = new Logger(SecurityHeadersDemoController.name);

  /**
   * Standard endpoint - security headers applied automatically
   */
  @Get('standard')
  @ApiOperation({ 
    summary: 'Standard endpoint with security headers',
    description: 'Demonstrates automatic security headers application'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Response includes all configured security headers'
  })
  getStandardResponse() {
    return {
      message: 'This response includes comprehensive security headers',
      headers: {
        'Content-Security-Policy': 'Prevents XSS attacks',
        'X-Frame-Options': 'Prevents clickjacking',
        'X-Content-Type-Options': 'Prevents MIME sniffing',
        'Strict-Transport-Security': 'Enforces HTTPS (production only)',
        'Referrer-Policy': 'Controls referrer information',
        'Permissions-Policy': 'Restricts browser features',
        'X-XSS-Protection': 'Legacy XSS protection'
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Sensitive endpoint - additional cache control headers
   */
  @Get('sensitive')
  @ApiOperation({ 
    summary: 'Sensitive endpoint with cache control',
    description: 'Demonstrates additional security headers for sensitive data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Response includes cache control headers for sensitive data'
  })
  getSensitiveData() {
    return {
      message: 'This sensitive data response includes no-cache headers',
      sensitiveData: {
        userId: '12345',
        sessionInfo: 'confidential',
        personalData: 'protected'
      },
      securityNote: 'Cache-Control headers prevent caching of sensitive data',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * API endpoint showing current security headers
   */
  @Get('current-headers')
  @ApiOperation({ 
    summary: 'Show current security headers',
    description: 'Returns the security headers that would be set on this response'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Current security headers configuration'
  })
  getCurrentHeaders(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Capture headers that will be sent
    const securityHeaders = {
      'Content-Security-Policy': res.getHeader('Content-Security-Policy'),
      'X-Frame-Options': res.getHeader('X-Frame-Options'),
      'X-Content-Type-Options': res.getHeader('X-Content-Type-Options'),
      'X-XSS-Protection': res.getHeader('X-XSS-Protection'),
      'Referrer-Policy': res.getHeader('Referrer-Policy'),
      'Permissions-Policy': res.getHeader('Permissions-Policy'),
      'Strict-Transport-Security': res.getHeader('Strict-Transport-Security'),
      'Cache-Control': res.getHeader('Cache-Control')
    };

    // Remove undefined headers
    const setHeaders = Object.fromEntries(
      Object.entries(securityHeaders).filter(([_, value]) => value !== undefined)
    );

    this.logger.debug('Security headers inspection requested', {
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    });

    return {
      message: 'Current security headers configuration',
      endpoint: `${req.method} ${req.url}`,
      securityHeaders: setHeaders,
      headerCount: Object.keys(setHeaders).length,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test CSP with inline script (should be blocked if CSP is working)
   */
  @Get('csp-test')
  @ApiOperation({ 
    summary: 'CSP test endpoint',
    description: 'Returns HTML with inline script to test CSP effectiveness'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'HTML content for CSP testing',
    content: {
      'text/html': {
        schema: { type: 'string' }
      }
    }
  })
  getCSPTest(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>CSP Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .test-result { padding: 20px; margin: 20px 0; border-radius: 5px; }
        .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .danger { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    </style>
</head>
<body>
    <h1>Content Security Policy Test</h1>
    
    <div class="test-result success">
        <h3>✅ This content loaded successfully</h3>
        <p>The page loaded, which means basic CSP is working.</p>
    </div>
    
    <div id="inline-script-test" class="test-result danger">
        <h3>❌ Inline Script Test</h3>
        <p>If CSP is working correctly, the inline script below will be blocked and this text will remain red.</p>
    </div>
    
    <div id="eval-test" class="test-result danger">
        <h3>❌ Eval Test</h3> 
        <p>If CSP is working correctly, eval() will be blocked and this text will remain red.</p>
    </div>
    
    <!-- This inline script should be blocked by CSP -->
    <script>
        console.log('If you see this message, inline scripts are NOT blocked by CSP');
        document.getElementById('inline-script-test').className = 'test-result danger';
        document.getElementById('inline-script-test').innerHTML = 
            '<h3>⚠️ CSP NOT WORKING</h3><p>Inline scripts are being executed!</p>';
    </script>
    
    <script>
        try {
            eval('console.log("If you see this, eval is NOT blocked by CSP"); document.getElementById("eval-test").className = "test-result danger"; document.getElementById("eval-test").innerHTML = "<h3>⚠️ CSP NOT WORKING</h3><p>eval() is being executed!</p>";');
        } catch (e) {
            console.log('Good! eval() was blocked by CSP:', e.message);
            document.getElementById('eval-test').className = 'test-result success';
            document.getElementById('eval-test').innerHTML = 
                '<h3>✅ CSP Working</h3><p>eval() was successfully blocked!</p>';
        }
    </script>
    
    <div class="test-result">
        <h3>How to interpret results:</h3>
        <ul>
            <li><strong>Green boxes:</strong> Security features working correctly</li>
            <li><strong>Red boxes:</strong> Security features NOT working or bypassed</li>
            <li><strong>Check browser console:</strong> CSP violations should be logged</li>
            <li><strong>Network tab:</strong> Check response headers for CSP policy</li>
        </ul>
    </div>
    
    <div class="test-result">
        <h3>Expected CSP Headers:</h3>
        <pre id="expected-headers">
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
        </pre>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Test frame embedding (should be blocked by X-Frame-Options)
   */
  @Get('frame-test')
  @ApiOperation({ 
    summary: 'Frame options test',
    description: 'Returns embeddable content to test X-Frame-Options header'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'HTML content for frame testing'
  })
  getFrameTest(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Frame Options Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f0f8ff; }
        .info { padding: 15px; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="info">
        <h2>🔒 Frame Protection Test</h2>
        <p>If you can see this content in an iframe, then X-Frame-Options is NOT working.</p>
        <p>If this page refuses to load in an iframe, then X-Frame-Options is working correctly!</p>
        <p><strong>Current time:</strong> ${new Date().toISOString()}</p>
    </div>
    
    <script>
        if (window.parent !== window) {
            document.body.innerHTML = 
                '<div style="color: red; padding: 20px; border: 2px solid red;">' +
                '<h2>⚠️ SECURITY WARNING</h2>' +
                '<p>This page is being displayed in an iframe, which means X-Frame-Options is not working!</p>' +
                '</div>';
        }
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Security headers test summary
   */
  @Post('test-summary')
  @ApiOperation({ 
    summary: 'Security headers test summary',
    description: 'Provides a comprehensive test summary for security headers'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Test summary with recommendations'
  })
  getTestSummary(@Req() req: Request) {
    const tests = [
      {
        name: 'Content Security Policy',
        endpoint: '/examples/security-headers/csp-test',
        description: 'Test CSP by attempting to execute inline scripts',
        expectedResult: 'Inline scripts should be blocked and logged as violations'
      },
      {
        name: 'X-Frame-Options',
        endpoint: '/examples/security-headers/frame-test',
        description: 'Test frame protection by embedding in iframe',
        expectedResult: 'Page should refuse to load in iframe'
      },
      {
        name: 'Security Headers Inspection',
        endpoint: '/examples/security-headers/current-headers',
        description: 'View all security headers currently set',
        expectedResult: 'All major security headers should be present'
      },
      {
        name: 'Sensitive Data Caching',
        endpoint: '/examples/security-headers/sensitive',
        description: 'Test cache control headers for sensitive endpoints',
        expectedResult: 'Cache-Control: no-store headers should be set'
      }
    ];

    const recommendations = [
      'Use browser developer tools to inspect response headers',
      'Check browser console for CSP violation reports',
      'Test with online security scanners (securityheaders.com)',
      'Verify HSTS is working in production with HTTPS',
      'Test with different browsers for compatibility',
      'Monitor CSP violation reports in production'
    ];

    this.logger.log('Security headers test summary requested', {
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    return {
      message: 'Security Headers Test Suite',
      tests,
      recommendations,
      tools: [
        'https://securityheaders.com/ - Online security headers scanner',
        'https://csp-evaluator.withgoogle.com/ - CSP policy evaluator',
        'Browser Developer Tools - Network tab for header inspection',
        'https://observatory.mozilla.org/ - Mozilla security observatory'
      ],
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  }
}