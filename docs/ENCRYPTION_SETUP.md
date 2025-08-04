# Advanced Encryption Setup Guide

This guide covers the setup and configuration of the comprehensive encryption system for data at rest and in transit.

## 🔐 Overview

The encryption system provides:
- **Advanced Data Encryption**: AES-256-GCM with automatic key rotation
- **TLS/SSL Security**: TLS 1.3 with perfect forward secrecy
- **Database Field Encryption**: Automatic encryption/decryption with decorators
- **File Encryption**: Streaming encryption for large files
- **HIPAA Compliance**: Healthcare-grade security standards

## 📋 Prerequisites

1. **Node.js 20+** with crypto support
2. **OpenSSL 1.1.1+** for certificate management
3. **Docker** (optional, for testing)
4. **Valid TLS certificates** for production

## ⚙️ Environment Configuration

### Required Environment Variables

```bash
# Encryption Configuration
ENCRYPTION_ALGORITHM=aes-256-gcm
KEY_ROTATION_DAYS=30
ENCRYPTION_COMPRESSION=true
KEY_DERIVATION_ITERATIONS=100000

# TLS Configuration
TLS_MIN_VERSION=TLSv1.3
TLS_MAX_VERSION=TLSv1.3
TLS_CERT_PATH=./certs/server.crt
TLS_KEY_PATH=./certs/server.key
TLS_CA_PATH=./certs/ca.crt
TLS_DH_PARAM_PATH=./certs/dhparam.pem

# HSTS Configuration
HSTS_ENABLED=true
HSTS_MAX_AGE=63072000
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true

# Healthcare-Specific Settings
HEALTHCARE_TLS_CERT_PATH=./certs/healthcare-server.crt
HEALTHCARE_TLS_KEY_PATH=./certs/healthcare-server.key
HEALTHCARE_PHI_ENCRYPTION_KEY=<generate-secure-key>
HEALTHCARE_KEY_ROTATION_DAYS=30
HEALTHCARE_HSTS_MAX_AGE=63072000

# Security Features
TLS_OCSP_STAPLING=true
PERFECT_FORWARD_SECRECY=true
CERT_TRANSPARENCY=true
```

### Healthcare Environment Variables

```bash
# PHI Encryption (Required for healthcare)
PHI_ENCRYPTION_KEY=<32-character-hex-key>
HEALTHCARE_ENCRYPTION_COMPRESSION=true
HEALTHCARE_PERFECT_FORWARD_SECRECY=true
HEALTHCARE_OCSP_STAPLING=true

# Audit and Compliance
AUDIT_RETENTION_DAYS=2555  # 7 years
AUTOMATIC_COMPLIANCE_REPORTING=true
HIPAA_ENFORCEMENT=true
COMPLIANCE_FRAMEWORKS=HIPAA,HITECH,SOC2
```

## 🔧 Setup Instructions

### 1. Generate Encryption Keys

```bash
# Create key directory
mkdir -p .keys
chmod 700 .keys

# Generate master encryption key
openssl rand -hex 32 > .keys/master.key
chmod 600 .keys/master.key

# Generate PHI encryption key
openssl rand -hex 32 > .keys/phi.key
chmod 600 .keys/phi.key
```

### 2. Generate TLS Certificates

#### Development (Self-Signed)

```bash
# Create certificate directory
mkdir -p certs
cd certs

# Generate private key
openssl genrsa -out server.key 4096

# Generate certificate signing request
openssl req -new -key server.key -out server.csr \
  -subj "/C=US/ST=State/L=City/O=Clinic/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

# Generate DH parameters for Perfect Forward Secrecy
openssl dhparam -out dhparam.pem 4096

# Set proper permissions
chmod 600 server.key
chmod 644 server.crt dhparam.pem
```

#### Production (Let's Encrypt or Commercial CA)

```bash
# Example with certbot (Let's Encrypt)
certbot certonly --standalone \
  -d your-domain.com \
  --email admin@your-domain.com \
  --agree-tos

# Copy certificates to application directory
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certs/server.crt
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./certs/server.key

# Generate DH parameters
openssl dhparam -out ./certs/dhparam.pem 4096
```

### 3. Database Setup for Encrypted Fields

```sql
-- Example table with encrypted fields
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Encrypted fields (stored as TEXT)
    full_name TEXT, -- Encrypted
    email TEXT, -- Encrypted
    phone_number TEXT, -- Encrypted
    ssn TEXT, -- Encrypted
    address TEXT, -- Encrypted
    medical_history TEXT, -- Encrypted
    
    -- Search hashes for encrypted fields
    full_name_hash VARCHAR(64),
    email_hash VARCHAR(64),
    phone_number_hash VARCHAR(64),
    
    -- Non-encrypted fields
    date_of_birth DATE,
    gender VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes on hash fields for searching
CREATE INDEX idx_patients_name_hash ON patients(full_name_hash);
CREATE INDEX idx_patients_email_hash ON patients(email_hash);
CREATE INDEX idx_patients_phone_hash ON patients(phone_number_hash);
```

### 4. Application Configuration

#### main.ts (NestJS)

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TLSSecurityService } from '@clinic/common';

async function bootstrap() {
  // Get TLS options
  const tlsService = new TLSSecurityService();
  const httpsOptions = tlsService.getHTTPSOptions();
  
  // Create HTTPS application
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
    logger: ['log', 'error', 'warn', 'debug', 'verbose']
  });
  
  // Apply security headers
  const securityHeaders = tlsService.getSecurityHeaders();
  app.use((req, res, next) => {
    Object.entries(securityHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    next();
  });
  
  await app.listen(4000);
}
bootstrap();
```

## 💻 Usage Examples

### 1. Entity with Encrypted Fields

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { EncryptField, EncryptEntity, EncryptedEntity } from '@clinic/common';

@Entity('patients')
@EncryptEntity({
  keyRotationDays: 30,
  compressionEnabled: true,
  auditEnabled: true
})
export class PatientEntity extends EncryptedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @EncryptField({
    dataType: 'patient_name',
    required: true,
    searchable: true
  })
  fullName: string;

  @Column()
  @EncryptField({
    dataType: 'ssn',
    compressionEnabled: false
  })
  socialSecurityNumber: string;

  // Search hash (automatically created)
  @Column({ nullable: true })
  fullName_hash: string;
}
```

### 2. Service with Manual Encryption

```typescript
import { Injectable } from '@nestjs/common';
import { AdvancedEncryptionService } from '@clinic/common';

@Injectable()
export class PatientService {
  constructor(
    private readonly encryptionService: AdvancedEncryptionService
  ) {}

  async encryptSensitiveData(data: string, userId: string) {
    return await this.encryptionService.encryptData(data, {
      dataType: 'medical_record',
      userId,
      compressionEnabled: true,
      customMetadata: {
        service: 'patient-service',
        sensitivity: 'high'
      }
    });
  }

  async decryptSensitiveData(encryptedData: any) {
    const decrypted = await this.encryptionService.decryptData(encryptedData);
    return decrypted.toString('utf8');
  }
}
```

### 3. Controller with Encryption

```typescript
import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { EncryptionInterceptor } from '@clinic/common';

@Controller('patients')
@UseInterceptors(EncryptionInterceptor)
export class PatientController {
  @Post()
  async createPatient(@Body() patientData: PatientDto) {
    // Data automatically encrypted by interceptor
    return await this.patientService.create(patientData);
  }
}
```

## 🔍 Testing Encryption

### 1. Health Check

```bash
curl -X GET https://localhost:4000/api/encryption/health \
  -H "Authorization: Bearer <token>"
```

### 2. Encrypt Data

```bash
curl -X POST https://localhost:4000/api/encryption/encrypt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "data": "sensitive patient information",
    "dataType": "medical_record",
    "compressionEnabled": true
  }'
```

### 3. Certificate Information

```bash
curl -X GET https://localhost:4000/api/encryption/certificate-info \
  -H "Authorization: Bearer <token>"
```

## 🔄 Key Rotation

### Automatic Rotation

Keys are automatically rotated based on the `KEY_ROTATION_DAYS` setting. For healthcare applications, this defaults to 30 days.

### Manual Rotation

```bash
curl -X POST https://localhost:4000/api/encryption/rotate-keys \
  -H "Authorization: Bearer <token>" \
  -H "X-MFA-Token: <mfa-token>"
```

## 📊 Monitoring

### Encryption Metrics

```bash
curl -X GET https://localhost:4000/api/encryption/metrics \
  -H "Authorization: Bearer <token>"
```

Response includes:
- Total encryption/decryption operations
- Average processing times
- Key rotation history
- Failure rates
- Data volume encrypted

### TLS Health

```bash
curl -X GET https://localhost:4000/api/encryption/certificate-info \
  -H "Authorization: Bearer <token>"
```

## 🛡️ Security Considerations

### 1. Key Management

- **Never commit keys to version control**
- Store keys in secure key management systems (AWS KMS, Azure Key Vault)
- Use different keys for different environments
- Implement key escrow for regulatory compliance

### 2. Certificate Management

- Use certificates from trusted CAs in production
- Implement certificate transparency monitoring
- Set up automated certificate renewal
- Monitor certificate expiration dates

### 3. Algorithm Selection

- **AES-256-GCM**: Recommended for most use cases
- **ChaCha20-Poly1305**: Alternative for high-performance requirements
- **TLS 1.3**: Required for maximum security
- **Perfect Forward Secrecy**: Always enabled

### 4. Compliance Requirements

- **HIPAA**: 7-year data retention, audit trails, access controls
- **SOC2**: Encryption at rest and in transit, key rotation
- **ISO27001**: Risk assessment, security controls
- **GDPR**: Data minimization, right to be forgotten

## 🔧 Troubleshooting

### Common Issues

1. **Certificate Errors**
   ```bash
   # Check certificate validity
   openssl x509 -in certs/server.crt -text -noout
   
   # Verify certificate chain
   openssl verify -CAfile certs/ca.crt certs/server.crt
   ```

2. **Key Permission Issues**
   ```bash
   # Fix key permissions
   chmod 600 .keys/*.key
   chmod 600 certs/*.key
   ```

3. **TLS Handshake Failures**
   ```bash
   # Test TLS connection
   openssl s_client -connect localhost:4000 -tls1_3
   ```

4. **Encryption Performance**
   - Enable compression for large data
   - Use streaming for files > 1MB
   - Monitor key rotation frequency

### Performance Optimization

1. **Hardware Acceleration**
   - Use AES-NI CPU instructions
   - Enable hardware crypto modules
   - Consider HSM for high-volume operations

2. **Memory Management**
   - Clear sensitive data from memory
   - Use secure memory allocation
   - Implement proper garbage collection

3. **Caching Strategy**
   - Cache encryption keys securely
   - Implement connection pooling for TLS
   - Use HTTP/2 for better performance

## 📚 References

- [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [TLS 1.3 RFC](https://tools.ietf.org/html/rfc8446)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)