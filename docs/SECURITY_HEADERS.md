# Security Headers Implementation

This document describes the comprehensive security headers implementation for the Clinic platform, providing protection against various web vulnerabilities and attacks.

## Overview

Security headers are HTTP response headers that instruct browsers to enable built-in security features. Our implementation provides defense against:

- **XSS (Cross-Site Scripting)** attacks
- **Clickjacking** attacks  
- **MIME sniffing** vulnerabilities
- **Man-in-the-middle** attacks
- **Information disclosure**
- **Unauthorized feature access**

## Architecture

### Components

1. **SecurityHeadersMiddleware** - Automatically applies security headers to all responses
2. **SecurityHeadersService** - Generates and analyzes security headers
3. **SecurityHeadersController** - Management endpoints for configuration and testing
4. **SecurityHeadersModule** - Configures and exports security components

## Security Headers Implemented

### 1. Content Security Policy (CSP)
**Purpose**: Prevents XSS attacks by controlling resource loading

**Default Policy**:
```
default-src 'self'; 
script-src 'self' https://apis.google.com https://accounts.google.com; 
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
font-src 'self' https://fonts.gstatic.com data:; 
img-src 'self' data: https: blob:; 
media-src 'self' blob:; 
connect-src 'self' https://api.openai.com https://accounts.google.com ws: wss:; 
frame-src 'self' https://accounts.google.com; 
object-src 'none'; 
base-uri 'self'; 
form-action 'self'; 
frame-ancestors 'none'; 
upgrade-insecure-requests
```

**Configuration**:
```bash
CSP_POLICY=""                    # Custom policy (overrides default)
CSP_REPORT_ONLY=""              # Test policy without blocking
CSP_REPORT_URI=""               # Violation reporting endpoint
```

### 2. X-Frame-Options
**Purpose**: Prevents clickjacking by controlling frame embedding

**Options**:
- `DENY` - Never allow framing (default)
- `SAMEORIGIN` - Allow framing by same origin
- `ALLOW-FROM uri` - Allow framing by specific URI

**Configuration**:
```bash
X_FRAME_OPTIONS="DENY"
```

### 3. X-Content-Type-Options
**Purpose**: Prevents MIME sniffing attacks

**Value**: `nosniff` (always set)

### 4. X-XSS-Protection
**Purpose**: Legacy XSS protection for older browsers

**Value**: `1; mode=block` (automatically set)

### 5. Strict-Transport-Security (HSTS)
**Purpose**: Enforces HTTPS connections

**Production Configuration**:
```bash
HSTS_MAX_AGE=31536000          # 1 year
HSTS_INCLUDE_SUBDOMAINS=true   # Include subdomains
HSTS_PRELOAD=true              # Enable HSTS preload list
```

**Generated Header**: `max-age=31536000; includeSubDomains; preload`

### 6. Referrer-Policy
**Purpose**: Controls referrer information disclosure

**Default**: `strict-origin-when-cross-origin`

**Configuration**:
```bash
REFERRER_POLICY="strict-origin-when-cross-origin"
```

### 7. Permissions-Policy
**Purpose**: Controls browser feature access

**Default Policy**:
```
accelerometer=(), autoplay=(), camera=(self), cross-origin-isolated=(), 
display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), 
gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(self), midi=(), 
payment=(self), picture-in-picture=(), publickey-credentials-get=(self), 
screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(self), xr-spatial-tracking=()
```

### 8. Custom Security Headers

#### Healthcare-Specific Headers
- `X-Privacy-Policy` - Link to privacy policy
- `X-Terms-Of-Service` - Link to terms of service
- `X-Security-Contact` - Security contact email

#### Technical Headers
- `X-API-Version` - API version information
- `X-Security-Features` - Enabled security features
- `X-RateLimit-Policy` - Rate limiting information

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Security Headers Configuration
CSP_POLICY=""                                    # Custom CSP (empty for auto-generated)
CSP_REPORT_ONLY=""                              # CSP report-only mode
CSP_REPORT_URI="/security/headers/csp/violation-report"  # Violation reports
X_FRAME_OPTIONS="DENY"                          # Frame options
REFERRER_POLICY="strict-origin-when-cross-origin"  # Referrer policy
HSTS_MAX_AGE=31536000                           # HSTS max age (seconds)
HSTS_INCLUDE_SUBDOMAINS=true                    # HSTS subdomains
HSTS_PRELOAD=true                               # HSTS preload
SET_GENERIC_SERVER_HEADER=false                 # Hide server technology
```

### Application Integration

#### 1. Import Module
```typescript
// app.module.ts
import { SecurityHeadersModule } from '@clinic/common';

@Module({
  imports: [SecurityHeadersModule],
})
export class AppModule {}
```

#### 2. Apply Middleware
```typescript
// main.ts
import { SecurityHeadersMiddleware } from '@clinic/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply security headers first
  app.use(new SecurityHeadersMiddleware(app.get('ConfigService')).use);
  
  await app.listen(3000);
}
```

## API Endpoints

### Management Endpoints

#### Get Security Status
```http
GET /security/headers/status
```
Returns current security headers configuration and validation.

#### Generate CSP Policy
```http
POST /security/headers/csp/generate
Content-Type: application/json

{
  "allowInline": false,
  "allowEval": false,
  "allowGoogleAPIs": true,
  "allowOpenAI": true,
  "development": false
}
```

#### Analyze Headers
```http
POST /security/headers/analyze
Content-Type: application/json

{
  "Content-Security-Policy": "default-src 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff"
}
```

#### Get Production Recommendations
```http
GET /security/headers/recommendations/production
```

### Testing Endpoints

#### CSP Test Page
```http
GET /examples/security-headers/csp-test
```
Returns HTML page for testing CSP effectiveness.

#### Frame Options Test
```http
GET /examples/security-headers/frame-test
```
Returns HTML page for testing clickjacking protection.

#### Current Headers Inspection
```http
GET /examples/security-headers/current-headers
```
Shows all security headers currently applied.

## Development vs Production

### Development Configuration
- More permissive CSP (allows localhost connections)
- Detailed logging of security headers
- CSP report-only mode recommended for testing
- No HSTS (HTTPS not required)

### Production Configuration
- Strict CSP policy
- HSTS enabled with long max-age
- All security headers enforced
- Violation reporting enabled
- Generic server headers to hide technology stack

## Testing and Validation

### Automated Testing

```typescript
describe('Security Headers', () => {
  it('should set CSP header', async () => {
    const response = await request(app).get('/api/users');
    expect(response.headers['content-security-policy']).toBeDefined();
  });

  it('should prevent framing', async () => {
    const response = await request(app).get('/sensitive-page');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('should set HSTS in production', async () => {
    process.env.NODE_ENV = 'production';
    const response = await request(app).get('/');
    expect(response.headers['strict-transport-security']).toContain('max-age=');
  });
});
```

### Manual Testing

1. **Browser Developer Tools**
   - Open Network tab
   - Inspect response headers
   - Verify all security headers are present

2. **CSP Testing**
   - Visit `/examples/security-headers/csp-test`
   - Check console for violation reports
   - Verify inline scripts are blocked

3. **Frame Protection Testing**
   - Try embedding `/examples/security-headers/frame-test` in iframe
   - Should refuse to load or show warning

4. **Online Security Scanners**
   - [SecurityHeaders.com](https://securityheaders.com/)
   - [Mozilla Observatory](https://observatory.mozilla.org/)
   - [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

## Compliance and Standards

### Security Standards
- **OWASP Top 10**: Addresses A03:2021 - Injection and A05:2021 - Security Misconfiguration
- **NIST Cybersecurity Framework**: Implements PR.AC-4 (Access Control)
- **CIS Controls**: Supports Control 13 (Network Monitoring and Defense)

### Healthcare Compliance
- **HIPAA Security Rule**: Administrative and technical safeguards
- **SOC 2 Type II**: Security and availability criteria
- **ISO 27001**: Information security controls

### Browser Compatibility
- **CSP**: Supported by all modern browsers
- **HSTS**: Supported by all modern browsers  
- **X-Frame-Options**: Universal support
- **Permissions-Policy**: Modern browsers (replacing Feature-Policy)

## Monitoring and Maintenance

### CSP Violation Monitoring

Set up violation reporting:

```bash
CSP_REPORT_URI="/security/headers/csp/violation-report"
```

Monitor violation logs:
```javascript
// Custom violation handler
app.post('/security/headers/csp/violation-report', (req, res) => {
  console.log('CSP Violation:', req.body);
  
  // Store in database for analysis
  // Alert on critical violations
  // Generate reports for policy adjustments
  
  res.status(200).send('OK');
});
```

### Header Analysis Service

```typescript
import { SecurityHeadersService } from '@clinic/common';

const service = new SecurityHeadersService(configService);

// Regular security assessment
const analysis = service.analyzeHeaders(responseHeaders);
console.log(`Security Score: ${analysis.score}/${analysis.maxScore}`);

// Validation alerts
const validation = service.validateConfiguration();
const criticalIssues = validation.filter(v => v.severity === 'critical');

if (criticalIssues.length > 0) {
  // Send alerts for critical security issues
  alertService.sendSecurityAlert(criticalIssues);
}
```

## Troubleshooting

### Common Issues

1. **CSP Violations in Development**
   ```bash
   # Allow localhost for development
   CSP_POLICY="default-src 'self'; connect-src 'self' http://localhost:* ws://localhost:*"
   ```

2. **Inline Styles Blocked**
   ```bash
   # Use nonces instead of unsafe-inline
   style-src 'self' 'nonce-{generated-nonce}'
   ```

3. **HSTS Not Working**
   ```bash
   # Ensure HTTPS is enabled in production
   NODE_ENV=production
   HTTPS=true
   ```

4. **Frame Embedding Required**
   ```bash
   # Allow same-origin framing
   X_FRAME_OPTIONS="SAMEORIGIN"
   ```

### Debug Mode

Enable detailed logging:
```bash
NODE_ENV=development
LOG_LEVEL=debug
```

This provides:
- Detailed header setting logs
- CSP violation reports
- Configuration validation warnings
- Performance metrics

## Performance Impact

### Minimal Overhead
- Headers add ~2-5KB to response size
- No database queries required
- Cached configuration values
- Negligible CPU impact

### Optimization Tips
1. Use CDN/reverse proxy for header injection
2. Cache security configuration
3. Use CSP nonces for better performance than hashes
4. Monitor violation reports to optimize policies

## Security Best Practices

### 1. Regular Review
- Review CSP violations monthly
- Update policies based on application changes
- Monitor security scanner reports
- Stay updated with security standards

### 2. Layered Security
- Implement headers at multiple levels (application, proxy, CDN)
- Use both CSP and X-XSS-Protection for defense in depth
- Combine with other security measures (authentication, authorization)

### 3. Testing Strategy
- Test headers in staging before production
- Use CSP report-only mode for new policies
- Validate with automated security tests
- Regular penetration testing

### 4. Incident Response
- Monitor CSP violation spikes (may indicate attacks)
- Have rollback plan for problematic policies
- Document header changes and rationale
- Train team on security header concepts

## Migration Guide

### From Basic Setup
1. Install SecurityHeadersModule
2. Configure environment variables
3. Remove existing helmet CSP configuration
4. Test in development environment
5. Deploy to staging for validation
6. Deploy to production with monitoring

### From Helmet.js
1. Disable helmet security headers:
   ```typescript
   app.use(helmet({
     contentSecurityPolicy: false,
     hsts: false,
     frameguard: false,
     // ... other disabled features
   }));
   ```

2. Add SecurityHeadersMiddleware before other middleware
3. Migrate existing CSP policies to environment variables
4. Test thoroughly before production deployment

## Support and Resources

### Documentation Links
- [MDN Security Headers Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#Security)
- [OWASP Security Headers Project](https://owasp.org/www-project-secure-headers/)
- [CSP Quick Reference](https://content-security-policy.com/)

### Tools and Validators
- [SecurityHeaders.com Scanner](https://securityheaders.com/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Helmet.js Documentation](https://helmetjs.github.io/)

### Internal Resources
- Security team contact: security@clinic-platform.com
- Internal security documentation: `/docs/SECURITY.md`
- Incident response playbook: `/docs/INCIDENT_RESPONSE.md`