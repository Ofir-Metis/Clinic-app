# CSRF Protection Implementation

This document describes the comprehensive CSRF (Cross-Site Request Forgery) protection implementation for the Clinic platform.

## Overview

CSRF protection is implemented using a token-based approach that validates state-changing requests to prevent unauthorized actions from external sites.

## Architecture

### Components

1. **CsrfGuard** - Global guard that validates CSRF tokens
2. **CsrfTokenService** - Manages token generation, validation, and lifecycle
3. **CsrfController** - Provides endpoints for token management
4. **CsrfModule** - Configures and exports CSRF components
5. **CsrfSetupMiddleware** - Sets up required headers and cookies

### Frontend Components

1. **useCsrfToken Hook** - React hook for token management
2. **CsrfProvider** - Context provider for CSRF tokens
3. **withCsrfToken HOC** - Higher-order component for token injection

## Configuration

### Environment Variables

```bash
# Enable/disable CSRF protection
ENABLE_CSRF_PROTECTION=true  # Set to 'true' for production

# CSRF token configuration
CSRF_TOKEN_LENGTH=32                 # Token length in bytes
CSRF_COOKIE_NAME="_csrf"            # Cookie name for token storage
CSRF_TOKEN_EXPIRY=86400000          # Token expiry (24 hours)
COOKIE_SECRET="your-secret-here"    # Secret for signing cookies
```

### Frontend Configuration

```bash
# React/Vite environment variables
VITE_CSRF_ENABLED=true  # Enable CSRF protection in frontend
```

## Usage

### Backend Usage

#### Apply CSRF Protection to Controllers

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { CsrfGuard } from '@clinic/common';

@Controller('api')
@UseGuards(CsrfGuard) // Apply to entire controller
export class ApiController {
  @Post('users')
  createUser() {
    // This endpoint requires CSRF token
  }
}
```

#### Exempt Specific Endpoints

```typescript
import { Controller, Post, Get } from '@nestjs/common';
import { CsrfExempt } from '@clinic/common';

@Controller('api')
export class ApiController {
  @Get('users')
  getUsers() {
    // GET requests are automatically exempt
  }

  @Post('public/feedback')
  @CsrfExempt() // Explicitly exempt this endpoint
  submitFeedback() {
    // Public endpoint without CSRF protection
  }
}
```

### Frontend Usage

#### Setup CSRF Provider

```typescript
// App.tsx
import { CsrfProvider } from './components/CsrfProvider';

function App() {
  return (
    <CsrfProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </BrowserRouter>
    </CsrfProvider>
  );
}
```

#### Use CSRF Token in Components

```typescript
import { useCsrfContext } from './components/CsrfProvider';
import { api } from './services/api';

function UserForm() {
  const { getTokenForRequest } = useCsrfContext();

  const handleSubmit = async (userData) => {
    try {
      await api.post('/users', userData, {
        headers: {
          'X-CSRF-Token': getTokenForRequest()
        }
      });
    } catch (error) {
      if (error.response?.status === 403) {
        // CSRF token invalid, refresh and retry
        await refreshToken();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

#### Use CSRF Hook Directly

```typescript
import { useCsrfToken } from '../hooks/useCsrfToken';

function MyComponent() {
  const { 
    token, 
    getTokenForRequest, 
    refreshToken, 
    isLoading, 
    error 
  } = useCsrfToken();

  // Token is automatically managed
  const makeApiCall = async () => {
    const csrfToken = getTokenForRequest();
    if (!csrfToken) {
      await refreshToken();
      return;
    }

    // Make API call with token
  };
}
```

## API Endpoints

The CSRF module provides several management endpoints:

### Get CSRF Token
```http
GET /csrf/token
```
Returns a new CSRF token and configuration.

### Refresh CSRF Token
```http
POST /csrf/refresh
```
Invalidates current token and returns a new one.

### Validate CSRF Token
```http
POST /csrf/validate
X-CSRF-Token: your-token-here
```
Tests if the provided token is valid.

### Get CSRF Status
```http
GET /csrf/status
```
Returns CSRF protection status and configuration.

## Token Submission Methods

CSRF tokens can be submitted in three ways (in order of precedence):

1. **HTTP Header (Recommended)**
   ```http
   X-CSRF-Token: your-token-here
   ```

2. **Form Field**
   ```html
   <input type="hidden" name="_csrf" value="your-token-here" />
   ```

3. **Query Parameter**
   ```http
   POST /api/users?csrf=your-token-here
   ```

## Security Features

### Token Security
- **Cryptographically Random**: Tokens use crypto.randomBytes()
- **Constant-Time Comparison**: Prevents timing attacks
- **Configurable Length**: Default 32 bytes (256 bits)
- **Automatic Expiry**: Tokens expire after 24 hours by default

### Request Validation
- **Method-Based**: Only validates POST, PUT, DELETE, PATCH requests
- **Session Binding**: Tokens are bound to user sessions
- **Origin Validation**: Additional protection through CORS
- **Audit Logging**: Failed validations are logged with context

### Storage Options
- **Session Storage**: Primary storage method (most secure)
- **Signed Cookies**: Fallback storage method
- **Unsigned Cookies**: Last resort (less secure)

## Production Deployment

### Enable CSRF Protection

1. Set environment variables:
   ```bash
   ENABLE_CSRF_PROTECTION=true
   COOKIE_SECRET=your-production-secret
   VITE_CSRF_ENABLED=true
   ```

2. Configure session middleware:
   ```typescript
   // main.ts
   app.use(session({
     secret: process.env.SESSION_SECRET,
     secure: true, // HTTPS only
     httpOnly: true,
     sameSite: 'strict'
   }));
   ```

3. Ensure HTTPS is enabled for production

### Monitoring and Logging

CSRF protection includes comprehensive logging:

- Token generation and validation
- Failed validation attempts with IP and User-Agent
- Configuration status and errors
- Performance metrics

Monitor these logs for potential attack attempts:
```bash
# Look for CSRF-related security events
grep "CSRF" /var/log/application.log

# Monitor failed validation attempts
grep "CSRF token validation failed" /var/log/application.log
```

## Testing

### Backend Testing

```typescript
describe('CSRF Protection', () => {
  it('should reject requests without CSRF token', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Test' })
      .expect(403);
    
    expect(response.body.message).toContain('CSRF token');
  });

  it('should accept requests with valid CSRF token', async () => {
    // Get token first
    const tokenResponse = await request(app)
      .get('/csrf/token')
      .expect(200);
    
    const token = tokenResponse.body.csrfToken;

    // Use token in request
    await request(app)
      .post('/api/users')
      .set('X-CSRF-Token', token)
      .send({ name: 'Test' })
      .expect(201);
  });
});
```

### Frontend Testing

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react';
import { CsrfProvider } from './CsrfProvider';

test('should include CSRF token in requests', async () => {
  const { getByRole } = render(
    <CsrfProvider>
      <UserForm />
    </CsrfProvider>
  );

  fireEvent.click(getByRole('button', { name: 'Submit' }));

  await waitFor(() => {
    expect(mockApi.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-CSRF-Token': expect.any(String)
        })
      })
    );
  });
});
```

## Troubleshooting

### Common Issues

1. **403 Forbidden - CSRF token required**
   - Ensure token is included in request
   - Check token format and placement
   - Verify CSRF protection is enabled

2. **403 Forbidden - Invalid CSRF token**
   - Token may be expired (refresh token)
   - Session may be invalid (re-authenticate)
   - Token may be corrupted (get new token)

3. **CSRF session not established**
   - Ensure session middleware is configured
   - Check cookie settings and domain
   - Verify HTTPS configuration in production

### Debug Mode

Enable detailed CSRF logging:

```bash
ENABLE_CSRF_PROTECTION=true
LOG_LEVEL=debug
```

This will provide detailed information about:
- Token generation and validation
- Session state
- Request processing
- Error details

## Performance Considerations

### Token Caching
- Tokens are cached in session/cookies
- Frontend automatically manages token lifecycle
- Minimal performance impact on requests

### Database Impact
- No database queries required for token validation
- Session storage handles persistence
- Scales horizontally with session storage

### Network Overhead
- Tokens add ~64 bytes to requests
- Negligible impact on performance
- Cached in browser for reuse

## Security Best Practices

1. **Always use HTTPS in production**
2. **Configure secure session cookies**
3. **Set appropriate token expiry times**
4. **Monitor CSRF validation failures**
5. **Use signed cookies when possible**
6. **Implement proper CORS policies**
7. **Regularly rotate cookie secrets**
8. **Train developers on CSRF concepts**

## Compliance

This CSRF implementation helps meet security compliance requirements:

- **OWASP Top 10**: Addresses A01:2021 – Broken Access Control
- **PCI DSS**: Requirement 6.5.10 - Protection against injection flaws
- **ISO 27001**: Information security management
- **NIST Cybersecurity Framework**: PR.AC-4 Access permissions

For healthcare applications, this also supports:
- **HIPAA Security Rule**: Administrative safeguards
- **SOC 2 Type II**: Security and availability criteria