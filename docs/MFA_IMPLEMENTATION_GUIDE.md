# Multi-Factor Authentication (MFA) Implementation Guide

## Overview

This guide covers the comprehensive Multi-Factor Authentication (MFA) system implemented for the clinic management platform, providing healthcare-grade security with HIPAA compliance, audit trails, and production-ready features.

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Configuration](#configuration)
4. [Usage Examples](#usage-examples)
5. [API Endpoints](#api-endpoints)
6. [Security Features](#security-features)
7. [Healthcare Compliance](#healthcare-compliance)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    MFA Architecture                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (QR Code, Token Input)                           │
│  ↓                                                          │
│  Auth Service (MFA Controller)                              │
│  ↓                                                          │
│  MFA Service (TOTP Generation/Verification)                 │
│  ↓                                                          │
│  MFA Storage Service (Encrypted Storage)                    │
│  ↓                                                          │
│  MFA Guard (Route Protection)                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Services

- **MFAService**: Core TOTP generation and verification
- **MFAStorageService**: Encrypted storage with audit trails
- **MFAGuard**: Route protection and session management
- **MFAController**: API endpoints for MFA operations

## Features

### ✅ Core MFA Features
- **TOTP Support**: Google Authenticator, Authy, Microsoft Authenticator
- **QR Code Generation**: Easy setup with authenticator apps
- **Backup Codes**: 10 single-use recovery codes
- **Emergency Recovery**: Admin-generated recovery codes
- **Session Management**: 30-minute MFA verification sessions
- **Role-based Requirements**: Automatic MFA for admin/healthcare roles

### 🏥 Healthcare Features
- **HIPAA Compliance**: Encrypted storage and comprehensive audit trails
- **PHI Protection**: Secure handling of healthcare authentication data
- **Audit Logging**: Complete MFA access and usage tracking
- **Emergency Access**: Recovery codes for critical healthcare situations
- **Policy Enforcement**: Organization-wide MFA requirements

### 🛡️ Security Features
- **Encrypted Storage**: AES-256-CBC encryption for secrets and backup codes
- **Timing Attack Protection**: Secure comparison functions
- **Brute Force Protection**: Rate limiting and account lockouts
- **Session Security**: Secure session management with expiration
- **Recovery Code Limits**: Single-use recovery codes with monitoring

## Configuration

### Environment Variables

```bash
# MFA Configuration
MFA_ISSUER="Clinic Management Platform"
MFA_SERVICE_NAME="Clinic Auth"
MFA_WINDOW=1
MFA_BACKUP_CODE_COUNT=10
MFA_BACKUP_CODE_LENGTH=8

# Encryption
MFA_ENCRYPTION_KEY="your-32-character-encryption-key-here"
HEALTHCARE_MFA_ENCRYPTION_KEY="healthcare-specific-key"

# Policy Settings
MFA_ENFORCE_FOR_ADMINS=true
MFA_ENFORCE_FOR_HEALTHCARE=true
MFA_SESSION_TIMEOUT=1800  # 30 minutes
```

### Module Setup

#### Basic Configuration

```typescript
import { MFAModule } from '@clinic/common';

@Module({
  imports: [
    MFAModule.forRoot({
      isGlobal: true,
      issuer: 'Clinic Management Platform',
      serviceName: 'Clinic Auth',
      window: 1,
      backupCodeCount: 10,
      encryptionKey: process.env.MFA_ENCRYPTION_KEY
    })
  ]
})
export class AuthModule {}
```

#### Healthcare-Specific Configuration

```typescript
import { HealthcareMFAModule } from '@clinic/common';

@Module({
  imports: [
    HealthcareMFAModule.forRoot({
      isGlobal: true,
      encryptionKey: process.env.HEALTHCARE_MFA_ENCRYPTION_KEY
    })
  ]
})
export class HealthcareModule {}
```

## Usage Examples

### Controller Setup

```typescript
import { 
  MFAGuard, 
  RequireMFA, 
  SkipMFA 
} from '@clinic/common';

@Controller('patients')
@UseGuards(JwtAuthGuard, MFAGuard)
export class PatientController {
  
  @Get(':id')
  @RequireMFA() // Require MFA for patient data access
  async getPatient(@Param('id') id: string) {
    return this.patientService.findById(id);
  }

  @Get('public/info')
  @SkipMFA() // Skip MFA for public endpoints
  async getPublicInfo() {
    return this.patientService.getPublicInfo();
  }
}
```

### Service Integration

```typescript
import { MFAService, MFAStorageService } from '@clinic/common';

@Injectable()
export class CustomAuthService {
  constructor(
    private readonly mfaService: MFAService,
    private readonly mfaStorageService: MFAStorageService
  ) {}

  async setupUserMFA(userId: string, email: string) {
    const setupResult = await this.mfaService.generateMFASecret(
      userId, 
      email
    );
    
    await this.mfaStorageService.storeMFASecret(
      userId,
      setupResult.secret,
      setupResult.backupCodes
    );

    return {
      qrCodeDataUrl: setupResult.qrCodeDataUrl,
      backupCodes: setupResult.backupCodes
    };
  }
}
```

## API Endpoints

### MFA Setup

#### POST /mfa/setup
Generate MFA secret and QR code for user setup.

**Request**: Authenticated user required
**Response**:
```json
{
  "qrCodeDataUrl": "data:image/png;base64,...",
  "manualEntryKey": "JBSWY3DPEHPK3PXP",
  "backupCodes": ["****-1234", "****-5678", ...],
  "instructions": {
    "step1": "Scan the QR code with your authenticator app",
    "step2": "Or manually enter the key",
    "step3": "Save backup codes securely",
    "step4": "Complete setup by verifying a token"
  }
}
```

#### POST /mfa/setup/verify
Complete MFA setup by verifying a token.

**Request**:
```json
{
  "verificationToken": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Multi-factor authentication enabled",
  "mfaEnabled": true
}
```

### MFA Verification

#### POST /mfa/verify
Verify MFA token for authentication.

**Request**:
```json
{
  "token": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "MFA verification successful",
  "mfaToken": "eyJhbGciOiJIUzI1NiIs...",
  "remainingBackupCodes": 9,
  "sessionDuration": "30 minutes"
}
```

### MFA Status

#### GET /mfa/status
Get MFA status for current user.

**Response**:
```json
{
  "mfaEnabled": true,
  "mfaRequired": true,
  "mfaEnforcedByPolicy": true,
  "hasVerifiedMFA": true,
  "backupCodesRemaining": 8,
  "lastMFAUsed": "2024-01-15T10:30:00Z",
  "setupRequired": false
}
```

### Backup Codes

#### POST /mfa/backup-codes/regenerate
Generate new backup codes (requires current MFA verification).

**Request**:
```json
{
  "currentToken": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "New backup codes generated",
  "backupCodes": ["****-1234", "****-5678", ...],
  "warning": "Old backup codes are no longer valid"
}
```

### Emergency Recovery

#### POST /mfa/recovery/generate
Generate emergency recovery code (admin only).

**Response**:
```json
{
  "success": true,
  "recoveryCode": "abc123def456...",
  "expiresAt": "2024-01-16T10:30:00Z",
  "warning": "Expires in 24 hours, single use only"
}
```

#### POST /mfa/recovery/verify
Use emergency recovery code.

**Request**:
```json
{
  "recoveryCode": "abc123def456..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Emergency recovery successful",
  "mfaToken": "eyJhbGciOiJIUzI1NiIs...",
  "temporaryAccess": true,
  "sessionDuration": "60 minutes",
  "warning": "Set up MFA again immediately"
}
```

## Security Features

### Encryption

All MFA secrets and backup codes are encrypted using AES-256-CBC:

```typescript
// Example encryption (simplified)
const encrypted = crypto.createCipher('aes-256-cbc', encryptionKey)
  .update(secret, 'utf8', 'hex') + 
  crypto.createCipher('aes-256-cbc', encryptionKey).final('hex');
```

### Secure Comparisons

Timing attack protection for backup code verification:

```typescript
const isValid = crypto.timingSafeEqual(
  Buffer.from(providedCode),
  Buffer.from(storedHash)
);
```

### Session Management

```typescript
// Set MFA verification in session
MFASessionManager.setMFAVerification(request, userId);

// Check if re-verification needed
const needsReauth = MFASessionManager.needsMFAReVerification(request, 30);
```

## Healthcare Compliance

### HIPAA Audit Trails

All MFA operations are logged for compliance:

```json
{
  "event": "mfa_verification_successful",
  "userId": "user-123",
  "method": "totp",
  "timestamp": "2024-01-15T10:30:00Z",
  "ipAddress": "10.0.1.100",
  "userAgent": "Mozilla/5.0...",
  "hipaaRelevant": true,
  "auditRequired": true
}
```

### Data Classification

- **PHI Protection**: MFA secrets treated as protected health information
- **Encryption Requirements**: All healthcare-related MFA data encrypted
- **Access Controls**: Role-based MFA requirements for healthcare staff
- **Retention Policies**: 7-year audit log retention for compliance

### Emergency Access

Healthcare-specific emergency access procedures:

```typescript
// Generate recovery code for critical situations
const recovery = await mfaService.generateRecoveryInfo(userId);

// Audit emergency access
centralizedLogger.auditLog('Emergency MFA recovery used', {
  userId,
  reason: 'patient_emergency',
  authorizedBy: 'admin-user-id',
  hipaaRelevant: true,
  alertLevel: 'critical'
});
```

## Deployment

### Production Checklist

1. **Environment Variables**:
   - [ ] MFA_ENCRYPTION_KEY (32+ characters)
   - [ ] HEALTHCARE_MFA_ENCRYPTION_KEY
   - [ ] MFA_ISSUER and MFA_SERVICE_NAME

2. **Database Setup**:
   - [ ] MFA secrets table with encryption
   - [ ] Backup codes storage
   - [ ] User MFA settings table

3. **Security Configuration**:
   - [ ] Rate limiting on MFA endpoints
   - [ ] HTTPS enforcement
   - [ ] Session security settings

4. **Monitoring**:
   - [ ] MFA usage metrics
   - [ ] Failed authentication alerts
   - [ ] Backup code depletion alerts

### Docker Configuration

```dockerfile
# Add MFA dependencies
RUN yarn add speakeasy qrcode @types/speakeasy @types/qrcode

# Environment variables
ENV MFA_ENCRYPTION_KEY=your-production-key
ENV MFA_ISSUER="Your Healthcare Platform"
ENV MFA_ENFORCE_FOR_ADMINS=true
```

### Health Checks

```bash
# Check MFA service health
curl http://localhost:3001/mfa/health

# Expected response
{
  "status": "healthy",
  "services": {
    "mfaService": { "status": "healthy" },
    "storage": { "status": "healthy" }
  },
  "statistics": {
    "totalUsers": 150,
    "usersWithMFAEnabled": 142,
    "mfaAdoptionRate": "94.67%"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Invalid TOTP Tokens

```bash
# Check time synchronization
ntpdate -s time.nist.gov

# Verify time window setting
echo $MFA_WINDOW  # Should be 1 for strict healthcare compliance
```

#### 2. Encryption Errors

```bash
# Verify encryption key length
node -e "console.log(process.env.MFA_ENCRYPTION_KEY.length)"
# Should be 32+ characters

# Test encryption/decryption
curl -X GET "http://localhost:3001/mfa/health"
```

#### 3. QR Code Generation Issues

```typescript
// Debug QR code generation
const qrCode = await QRCode.toDataURL(secret.otpauth_url);
console.log('QR Code length:', qrCode.length);
console.log('Secret:', secret.base32);
```

#### 4. Session Management Problems

```typescript
// Check session configuration
console.log('Session timeout:', process.env.MFA_SESSION_TIMEOUT);

// Verify session storage
if (request.session?.mfaVerification) {
  console.log('MFA session valid');
} else {
  console.log('MFA session missing or expired');
}
```

### Debug Commands

```bash
# Enable MFA debug logging
DEBUG=mfa:* npm start

# View MFA-specific logs
docker logs clinic-app_auth-service_1 | grep "MFA"

# Check Redis session storage
docker exec -it clinic-app_redis_1 redis-cli
> KEYS session:*
> GET session:sess_abc123
```

### Performance Monitoring

```typescript
// Monitor MFA operations
const startTime = Date.now();
await mfaService.verifyMFAToken(secret, token);
const duration = Date.now() - startTime;

if (duration > 1000) {
  logger.warn('Slow MFA verification', { duration, userId });
}
```

### Security Alerts

Monitor for these security events:

- Multiple failed MFA attempts
- Backup code depletion (< 3 remaining)
- Emergency recovery code usage
- MFA disabled for required users
- Unusual authentication patterns

```typescript
// Example alert configuration
if (failedAttempts >= 5) {
  alertingService.triggerAlert('security-multiple-mfa-failures', {
    userId,
    attempts: failedAttempts,
    timeWindow: '5 minutes'
  });
}
```

## Integration Examples

### Frontend Integration (React)

```typescript
// MFA Setup Component
const MFASetup = () => {
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  
  const setupMFA = async () => {
    const response = await fetch('/api/auth/mfa/setup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    setQrCode(data.qrCodeDataUrl);
    setBackupCodes(data.backupCodes);
  };

  return (
    <div>
      {qrCode && <img src={qrCode} alt="MFA QR Code" />}
      <div>
        <h3>Backup Codes</h3>
        {backupCodes.map(code => <div key={code}>{code}</div>)}
      </div>
    </div>
  );
};
```

### Mobile App Integration

```typescript
// MFA Token Verification
const verifyMFAToken = async (token: string) => {
  try {
    const response = await fetch('/api/auth/mfa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ token })
    });

    if (response.ok) {
      const data = await response.json();
      // Store MFA token for subsequent requests
      await AsyncStorage.setItem('mfaToken', data.mfaToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error('MFA verification failed:', error);
    return false;
  }
};
```

This comprehensive MFA implementation provides healthcare-grade security with HIPAA compliance, making it suitable for production deployment in clinical environments.