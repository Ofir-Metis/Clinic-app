# Session Management Implementation

This document describes the enterprise-grade session management system for the Clinic platform, providing healthcare-compliant secure session handling with comprehensive security features.

## Overview

The session management system provides secure authentication and authorization with healthcare-specific security requirements:

- **Healthcare-grade security** with HIPAA compliance
- **Multi-level security** (standard, elevated, admin)
- **Device fingerprinting** and anomaly detection
- **Concurrent session management** with limits
- **Automatic session rotation** for security
- **Comprehensive audit logging** and monitoring

## Architecture

### Components

1. **SessionManagementService** - Core session logic and validation
2. **SessionGuard** - Request-level session validation and security enforcement
3. **SessionManagementController** - Session management API endpoints
4. **SessionManagementModule** - Configuration and dependency injection

### Security Levels

#### Standard Level
- **Duration**: Up to 8 hours (configurable)
- **Use Case**: Regular client interactions
- **Security**: Basic session validation
- **Features**: Standard timeout, basic device tracking

#### Elevated Level
- **Duration**: Up to 6 hours (configurable)
- **Use Case**: Healthcare providers, coaches
- **Security**: Enhanced validation, stricter timeouts
- **Features**: Device fingerprinting, IP monitoring

#### Admin Level
- **Duration**: Up to 4 hours (configurable)
- **Use Case**: System administrators
- **Security**: Maximum security validation
- **Features**: Strict IP checking, mandatory 2FA, comprehensive logging

## Configuration

### Environment Variables

```bash
# Session Management Configuration
SESSION_MAX_AGE=28800000            # Maximum session age (8 hours)
SESSION_INACTIVITY_TIMEOUT=1800000  # Inactivity timeout (30 minutes)
MAX_CONCURRENT_SESSIONS=3           # Max concurrent sessions per user
SESSION_SECRET_KEY="your-session-secret-key"  # Session signing key
ENABLE_DEVICE_TRACKING=true         # Enable device fingerprinting
REQUIRE_SECURE_TRANSPORT=true       # Require HTTPS for sessions
ENABLE_SESSION_ROTATION=true        # Enable automatic session rotation
SESSION_CLEANUP_INTERVAL=300000     # Cleanup interval (5 minutes)
```

### Application Integration

#### 1. Import Module
```typescript
// app.module.ts
import { SessionManagementModule } from '@clinic/common';

@Module({
  imports: [SessionManagementModule],
})
export class AppModule {}
```

#### 2. Apply Guards
```typescript
// controller.ts
import { SessionGuard, RequireElevated, RequireSessionPermissions } from '@clinic/common';

@Controller('api')
@UseGuards(SessionGuard)
export class ApiController {
  @Get('profile')
  getProfile() { /* Standard session required */ }

  @Post('admin/users')
  @RequireElevated()
  createUser() { /* Elevated session required */ }

  @Delete('system/reset')
  @RequireSessionPermissions(['system:admin'])
  resetSystem() { /* Specific permissions required */ }
}
```

## API Endpoints

### Authentication Endpoints

#### Login (Create Session)
```http
POST /auth/sessions/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "rememberMe": false,
  "deviceTrust": true,
  "twoFactorCode": "123456"
}
```

**Response:**
```json
{
  "sessionId": "session-token-here",
  "expiresAt": "2024-02-15T18:00:00Z",
  "securityLevel": "elevated",
  "requiresTwoFactor": false
}
```

#### Validate Session
```http
GET /auth/sessions/validate
Authorization: Bearer <session-token>
```

#### Logout
```http
POST /auth/sessions/logout
Authorization: Bearer <session-token>
```

#### Logout All Sessions
```http
POST /auth/sessions/logout-all
Authorization: Bearer <session-token>
```

### Session Management Endpoints

#### List User Sessions
```http
GET /auth/sessions/list
Authorization: Bearer <session-token>
```

#### Terminate Specific Session
```http
DELETE /auth/sessions/{sessionId}
Authorization: Bearer <session-token>
```

#### Elevate Session Security
```http
POST /auth/sessions/elevate
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "twoFactorCode": "123456",
  "targetLevel": "admin"
}
```

#### Session Analytics (Admin)
```http
GET /auth/sessions/analytics
Authorization: Bearer <admin-session-token>
```

## Security Features

### Session Validation

1. **Expiration Checking**
   - Maximum session age validation
   - Inactivity timeout enforcement
   - Automatic cleanup of expired sessions

2. **Security Validation**
   - IP address consistency checking
   - User-Agent monitoring
   - Device fingerprint validation
   - Secure transport enforcement

3. **Anomaly Detection**
   - Suspicious session activity detection
   - Concurrent session limit enforcement
   - Device change detection
   - Geographic location monitoring

### Device Fingerprinting

```typescript
// Automatic device fingerprinting
const fingerprint = generateDeviceFingerprint(request);
// Based on: User-Agent, Accept-Language, Accept-Encoding

// Session validation includes device check
if (session.deviceFingerprint !== currentFingerprint) {
  // Security alert for admin sessions
  // Warning log for standard sessions
}
```

### Session Rotation

```typescript
// Automatic session rotation based on age
if (sessionAge > rotationThreshold) {
  const newSession = await rotateSession(oldSessionId, request);
  // Client receives new session ID
}
```

## Usage Examples

### Basic Session Protection

```typescript
@Controller('api')
@UseGuards(SessionGuard)
export class ApiController {
  @Get('profile')
  getProfile(@Req() req: Request) {
    const userId = req.sessionData.userId;
    const securityLevel = req.sessionData.securityLevel;
    // Profile access with session validation
  }
}
```

### Elevated Security Requirements

```typescript
@Controller('admin')
@UseGuards(SessionGuard)
export class AdminController {
  @Get('users')
  @RequireElevated()
  getAllUsers(@Req() req: Request) {
    // Requires elevated session (2FA or admin role)
    const adminId = req.sessionData.userId;
  }
}
```

### Permission-Based Access

```typescript
@Controller('healthcare')
@UseGuards(SessionGuard)
export class HealthcareController {
  @Get('patient-records')
  @RequireSessionPermissions(['healthcare:read', 'hipaa:access'])
  getPatientRecords(@Req() req: Request) {
    // Requires specific permissions
    const providerId = req.sessionData.userId;
  }
}
```

### Frontend Integration

```typescript
// React component with session management
import { useSession } from '../hooks/useSession';

function ProtectedComponent() {
  const { session, isLoading, error, logout, elevateSession } = useSession();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Session error: {error}</div>;
  if (!session) return <LoginForm />;

  return (
    <div>
      <p>Welcome, {session.userId}</p>
      <p>Security Level: {session.securityLevel}</p>
      {session.securityLevel === 'standard' && (
        <button onClick={elevateSession}>
          Enable 2FA for elevated access
        </button>
      )}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Session Decorators

### @SessionExempt()
Exempts endpoints from session validation (public endpoints).

```typescript
@Get('public/health')
@SessionExempt()
healthCheck() {
  return { status: 'ok' };
}
```

### @RequireElevated()
Requires elevated session security (2FA verified or admin role).

```typescript
@Post('sensitive-operation')
@RequireElevated()
performSensitiveOperation() {
  // Requires elevated security
}
```

### @RequireSessionPermissions(['permission'])
Requires specific permissions in addition to valid session.

```typescript
@Delete('critical-data')
@RequireSessionPermissions(['data:delete', 'admin:super'])
deleteCriticalData() {
  // Requires specific permissions
}
```

## Monitoring and Analytics

### Session Metrics

```typescript
const metrics = sessionManagementService.getSessionMetrics();

console.log({
  totalSessions: metrics.totalSessions,
  activeSessions: metrics.activeSessions,
  expiredSessions: metrics.expiredSessions,
  suspiciousSessions: metrics.suspiciousSessions,
  averageSessionDuration: metrics.averageSessionDuration,
  concurrentUserSessions: metrics.concurrentUserSessions
});
```

### Security Event Logging

```javascript
// Automatic security event logging
{
  "event": "session_created",
  "sessionId": "abc123...",
  "userId": "user-456",
  "securityLevel": "elevated",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "deviceFingerprint": "def789...",
  "timestamp": "2024-02-15T10:30:00Z"
}

{
  "event": "security_alert",
  "type": "ip_address_change",
  "sessionId": "abc123...",
  "userId": "user-456",
  "originalIP": "192.168.1.100",
  "newIP": "10.0.0.50",
  "action": "session_terminated",
  "timestamp": "2024-02-15T11:00:00Z"
}
```

## Healthcare Compliance

### HIPAA Compliance Features

1. **Access Controls**
   - Role-based session security levels
   - Permission-based healthcare data access
   - Audit trail for all session activities

2. **Administrative Safeguards**
   - Automatic session timeouts
   - Concurrent session limits
   - Device and location tracking

3. **Technical Safeguards**
   - Encryption of session tokens
   - Secure transport requirements
   - Access monitoring and logging

### Audit Trail Requirements

```javascript
// Complete audit trail for healthcare access
{
  "auditEvent": "healthcare_data_access",
  "userId": "provider-123",
  "sessionId": "session-abc...",
  "securityLevel": "elevated",
  "permissions": ["healthcare:read", "hipaa:access"],
  "patientId": "patient-456",
  "dataType": "medical_records",
  "ipAddress": "192.168.1.100",
  "deviceFingerprint": "device-xyz...",
  "timestamp": "2024-02-15T14:30:00Z",
  "hipaaCompliant": true
}
```

## Security Best Practices

### Production Configuration

1. **Strong Session Secrets**
   ```bash
   SESSION_SECRET_KEY=$(openssl rand -hex 32)
   ```

2. **Appropriate Timeouts**
   ```bash
   # Admin sessions: 4 hours max
   # Healthcare providers: 6 hours max  
   # Clients: 8 hours max
   SESSION_INACTIVITY_TIMEOUT=1800000  # 30 minutes
   ```

3. **Device Tracking**
   ```bash
   ENABLE_DEVICE_TRACKING=true
   REQUIRE_SECURE_TRANSPORT=true
   ```

### Session Token Security

1. **Cryptographically Secure**
   - Uses crypto.randomBytes() for token generation
   - HMAC signing with secret key
   - Includes timestamp and random components

2. **Secure Transmission**
   - HTTPS required in production
   - Secure, HttpOnly cookies
   - SameSite=strict policy

3. **Storage Security**
   - Signed cookies for session storage
   - No sensitive data in tokens
   - Automatic cleanup of expired sessions

### Concurrent Session Management

```typescript
// Automatic enforcement of session limits
if (userSessions.size >= maxConcurrentSessions) {
  // Remove oldest sessions
  const oldestSessions = sessions
    .sort((a, b) => a.lastActivity - b.lastActivity)
    .slice(0, sessions.length - maxConcurrentSessions + 1);
  
  for (const session of oldestSessions) {
    await invalidateSession(session.sessionId);
  }
}
```

## Testing

### Unit Testing

```typescript
describe('SessionManagementService', () => {
  it('should create valid session', async () => {
    const { sessionId, session } = await service.createSession(user, request);
    
    expect(sessionId).toBeDefined();
    expect(session.userId).toBe(user.id);
    expect(session.expiresAt).toBeGreaterThan(Date.now());
  });

  it('should validate session correctly', async () => {
    const validation = await service.validateSession(sessionId, request);
    
    expect(validation.isValid).toBe(true);
    expect(validation.session).toBeDefined();
  });

  it('should detect expired sessions', async () => {
    // Mock expired session
    const expiredSession = { ...session, expiresAt: Date.now() - 1000 };
    
    const validation = await service.validateSession(sessionId, request);
    
    expect(validation.isValid).toBe(false);
    expect(validation.reason).toContain('expired');
  });
});
```

### Integration Testing

```typescript
describe('Session Guard Integration', () => {
  it('should protect endpoints with valid session', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${sessionId}`)
      .expect(200);
    
    expect(response.body.userId).toBeDefined();
  });

  it('should reject requests without session', async () => {
    await request(app)
      .get('/api/protected')
      .expect(401);
  });

  it('should enforce elevated security requirements', async () => {
    await request(app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${standardSessionId}`)
      .expect(401); // Should require elevated session
  });
});
```

## Troubleshooting

### Common Issues

1. **Session Not Found**
   ```
   Cause: Session expired or invalid session ID
   Solution: Re-authenticate to get new session
   ```

2. **IP Address Mismatch**
   ```
   Cause: User changed networks (mobile/VPN)
   Solution: For non-admin sessions, allow with warning
   ```

3. **Device Fingerprint Change**
   ```
   Cause: Browser settings change or different device
   Solution: Re-authentication required for security
   ```

4. **Concurrent Session Limit**
   ```
   Cause: User exceeded maximum allowed sessions
   Solution: Automatically remove oldest sessions
   ```

### Debug Mode

Enable detailed session logging:

```bash
NODE_ENV=development
LOG_LEVEL=debug
```

Monitor session activities:

```bash
# View session creation logs
grep "Session created" /var/log/application.log

# View security alerts
grep "Security alert" /var/log/application.log

# View session validation failures
grep "Session validation failed" /var/log/application.log
```

## Performance Considerations

### Memory Usage
- In-memory session storage for development
- Redis recommended for production scaling
- Automatic cleanup prevents memory leaks

### Database Impact
- No database queries for session validation
- Minimal overhead for session operations
- Efficient concurrent session tracking

### Network Overhead
- Session tokens: ~200-300 bytes
- Minimal impact on request size
- Efficient token validation

## Migration and Deployment

### From JWT-only Authentication

1. **Add Session Management Module**
   ```typescript
   @Module({
     imports: [
       // ... existing modules
       SessionManagementModule,
     ],
   })
   ```

2. **Replace JWT Guards with Session Guards**
   ```typescript
   // Before
   @UseGuards(JwtAuthGuard)
   
   // After  
   @UseGuards(SessionGuard)
   ```

3. **Update Frontend Authentication**
   ```typescript
   // Before: Store JWT in localStorage
   localStorage.setItem('token', jwt);
   
   // After: Use session cookies
   // Session automatically managed by cookies
   ```

### Production Deployment Checklist

- [ ] Configure strong session secrets
- [ ] Enable HTTPS/secure transport
- [ ] Set appropriate session timeouts
- [ ] Configure Redis for session storage (optional)
- [ ] Enable comprehensive logging
- [ ] Set up monitoring and alerting
- [ ] Test concurrent session limits
- [ ] Verify device tracking functionality
- [ ] Validate HIPAA compliance requirements

## Compliance and Auditing

### HIPAA Requirements Met

- ✅ **Access Control** - Role-based session security
- ✅ **Audit Controls** - Comprehensive session logging
- ✅ **Integrity** - Session tampering detection
- ✅ **Person Authentication** - Multi-factor session elevation
- ✅ **Transmission Security** - Encrypted session transport

### SOC 2 Type II Compliance

- ✅ **Security** - Session encryption and validation
- ✅ **Availability** - Session management reliability
- ✅ **Processing Integrity** - Session data accuracy
- ✅ **Confidentiality** - Session data protection
- ✅ **Privacy** - User session privacy controls

This session management implementation provides enterprise-grade security suitable for healthcare applications while maintaining usability and performance.