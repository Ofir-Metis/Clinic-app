# ⚙️ Environment Configuration Guide

## 📋 Complete Step-by-Step Environment Variable Setup

This guide provides detailed instructions for configuring all environment variables for development, staging, and production environments of the Healthcare Platform.

## 🎯 Overview

The platform uses different environment configurations:
- **Development** (`.env`) - Local development with Docker Compose
- **Staging** (`.env.staging`) - Staging environment for testing
- **Production** (`.env.production`) - Production environment with security

## 🚀 Quick Setup Wizard

Run our automated setup script to configure all environments:

```bash
./scripts/setup-environment.sh
```

This interactive wizard will:
1. Guide you through each environment variable
2. Validate external service connections
3. Generate secure passwords and keys
4. Create properly configured environment files
5. Test the complete setup

## 📝 Manual Configuration

If you prefer to configure manually, follow these detailed steps:

## 🔧 Step 1: Core Infrastructure

### Database Configuration

#### Development (Local PostgreSQL)
```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=clinic
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

#### Staging Environment
```bash
POSTGRES_HOST=staging-db.yourdomain.com    # Your staging database host
POSTGRES_PORT=5432
POSTGRES_DB=clinic_staging
POSTGRES_USER=clinic_staging_user          # Create dedicated staging user
POSTGRES_PASSWORD=<generate-strong-password>  # Use: openssl rand -base64 32
```

#### Production Environment
```bash
POSTGRES_HOST=prod-db.yourdomain.com       # Your production database host
POSTGRES_PORT=5432
POSTGRES_DB=clinic_production
POSTGRES_USER=clinic_prod_user             # Create dedicated production user
POSTGRES_PASSWORD=<generate-strong-password>  # Use: openssl rand -base64 32
POSTGRES_SSL_MODE=require                  # Force SSL in production
```

### Redis Configuration

#### Development
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                            # No password for local development
```

#### Staging
```bash
REDIS_HOST=staging-redis.yourdomain.com
REDIS_PORT=6379
REDIS_PASSWORD=<generate-redis-password>   # Use: openssl rand -base64 32
```

#### Production
```bash
REDIS_HOST=prod-redis.yourdomain.com
REDIS_PORT=6379
REDIS_PASSWORD=<generate-redis-password>   # Use: openssl rand -base64 32
REDIS_TLS=true                             # Enable TLS in production
```

### Message Queue (NATS)

#### Development
```bash
NATS_URL=nats://localhost:4222
```

#### Staging
```bash
NATS_URL=nats://staging-nats.yourdomain.com:4222
```

#### Production
```bash
NATS_URL=nats://prod-nats-cluster.yourdomain.com:4222
NATS_CLUSTER=true                          # Enable clustering for production
```

## 🔐 Step 2: Authentication & Security

### JWT Configuration

Generate secure secrets for each environment:

```bash
# Generate JWT secrets (64 characters recommended)
JWT_DEV_SECRET=$(openssl rand -hex 64)
JWT_STAGING_SECRET=$(openssl rand -hex 64)
JWT_PRODUCTION_SECRET=$(openssl rand -hex 64)

# Generate session secrets
SESSION_DEV_SECRET=$(openssl rand -hex 64)
SESSION_STAGING_SECRET=$(openssl rand -hex 64)
SESSION_PRODUCTION_SECRET=$(openssl rand -hex 64)

# Generate encryption keys (32 characters for AES-256)
ENCRYPTION_DEV_KEY=$(openssl rand -hex 32)
ENCRYPTION_STAGING_KEY=$(openssl rand -hex 32)
ENCRYPTION_PRODUCTION_KEY=$(openssl rand -hex 32)
```

#### Development
```bash
JWT_SECRET=your-jwt-dev-secret-64-chars
JWT_EXPIRES_IN=24h
SESSION_SECRET=your-session-dev-secret
ENCRYPTION_KEY=your-encryption-dev-key-32-chars
MFA_REQUIRED=false                         # Optional in development
```

#### Staging
```bash
JWT_SECRET=your-jwt-staging-secret-64-chars
JWT_EXPIRES_IN=8h                         # Shorter expiry for testing
SESSION_SECRET=your-session-staging-secret
ENCRYPTION_KEY=your-encryption-staging-key
MFA_REQUIRED=true                         # Test MFA in staging
```

#### Production
```bash
JWT_SECRET=your-jwt-production-secret-64-chars
JWT_EXPIRES_IN=1h                         # Short expiry for security
JWT_REFRESH_EXPIRES_IN=7d                 # Refresh token expiry
SESSION_SECRET=your-session-production-secret
ENCRYPTION_KEY=your-encryption-production-key
MFA_REQUIRED=true                         # Mandatory in production
SECURE_COOKIES=true                       # HTTPS-only cookies
```

## 🤖 Step 3: AI & External Services

### OpenAI Configuration

1. **Get API Key**: Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Create API Key**: Click "Create new secret key"
3. **Copy Key**: Save the key securely

#### Development
```bash
OPENAI_API_KEY=sk-your-development-key-here
OPENAI_ORG_ID=org-your-org-id              # Optional for personal accounts
AI_RATE_LIMIT=10                          # Lower limit for development
```

#### Staging
```bash
OPENAI_API_KEY=sk-your-staging-key-here    # Separate key for staging
OPENAI_ORG_ID=org-your-org-id
AI_RATE_LIMIT=50                          # Moderate limit for testing
```

#### Production
```bash
OPENAI_API_KEY=sk-your-production-key-here # Production key with higher limits
OPENAI_ORG_ID=org-your-org-id
AI_RATE_LIMIT=100                         # Production rate limit
```

### Twilio SMS/Voice Configuration

1. **Create Account**: Visit [Twilio Console](https://console.twilio.com/)
2. **Get Credentials**: Find Account SID and Auth Token
3. **Get Phone Number**: Purchase a Twilio phone number

#### Development
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    # Test credentials
TWILIO_AUTH_TOKEN=your-test-auth-token
TWILIO_PHONE_NUMBER=+15551234567                         # Test number
```

#### Staging
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    # Staging credentials
TWILIO_AUTH_TOKEN=your-staging-auth-token
TWILIO_PHONE_NUMBER=+15551234568                         # Staging number
```

#### Production
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    # Live credentials
TWILIO_AUTH_TOKEN=your-production-auth-token
TWILIO_PHONE_NUMBER=+15551234569                         # Production number
```

### Google OAuth Configuration

1. **Google Cloud Console**: Visit [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable APIs**: Enable Google+ API and Google Calendar API
3. **Create Credentials**: Create OAuth 2.0 Client ID

#### Development
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

#### Staging
```bash
GOOGLE_CLIENT_ID=your-staging-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-staging-client-secret
GOOGLE_REDIRECT_URI=https://staging.yourdomain.com/auth/google/callback
```

#### Production
```bash
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

## 💳 Step 4: Payment Processing

### Stripe Configuration

1. **Create Account**: Visit [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Get API Keys**: Developers → API Keys
3. **Setup Webhooks**: Developers → Webhooks

#### Development
```bash
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret
STRIPE_ENDPOINT_SECRET=whsec_local_webhook_secret
```

#### Staging
```bash
STRIPE_SECRET_KEY=sk_test_your_staging_key_here      # Still test keys for staging
STRIPE_PUBLISHABLE_KEY=pk_test_your_staging_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_staging_webhook_secret
```

#### Production
```bash
STRIPE_SECRET_KEY=sk_live_your_live_key_here         # Live keys for production
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id   # For marketplace features
```

### Israeli Payment Gateways

#### Tranzilla Configuration

1. **Contact Tranzilla**: Get merchant account
2. **Get Credentials**: Terminal, username, and password

```bash
# Development/Staging
TRANZILLA_TERMINAL=your-test-terminal
TRANZILLA_USERNAME=your-test-username
TRANZILLA_PASSWORD=your-test-password
TRANZILLA_CURRENCY=ILS

# Production
TRANZILLA_TERMINAL=your-live-terminal
TRANZILLA_USERNAME=your-live-username
TRANZILLA_PASSWORD=your-live-password
TRANZILLA_CURRENCY=ILS
```

#### CardCom Configuration

1. **Contact CardCom**: Get merchant account
2. **Get Credentials**: Terminal, username, and password

```bash
# Development/Staging
CARDCOM_TERMINAL=your-test-terminal
CARDCOM_USERNAME=your-test-username
CARDCOM_PASSWORD=your-test-password

# Production
CARDCOM_TERMINAL=your-live-terminal
CARDCOM_USERNAME=your-live-username
CARDCOM_PASSWORD=your-live-password
```

## 📁 Step 5: File Storage

### Local Development (MinIO)

```bash
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=clinic-dev
MINIO_USE_SSL=false
```

### Cloud Storage (AWS S3)

1. **Create S3 Bucket**: Visit AWS S3 Console
2. **Create IAM User**: With S3 access permissions
3. **Generate Access Keys**: For the IAM user

#### Staging
```bash
S3_ENDPOINT=s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY=AKIA...your-staging-access-key
S3_SECRET_KEY=your-staging-secret-key
S3_BUCKET=clinic-staging-files
MINIO_ENDPOINT=s3.amazonaws.com          # Keep for compatibility
MINIO_PORT=443
MINIO_ACCESS_KEY=AKIA...your-staging-access-key
MINIO_SECRET_KEY=your-staging-secret-key
MINIO_BUCKET_NAME=clinic-staging-files
MINIO_USE_SSL=true
```

#### Production
```bash
S3_ENDPOINT=s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY=AKIA...your-production-access-key
S3_SECRET_KEY=your-production-secret-key
S3_BUCKET=clinic-production-files
MINIO_ENDPOINT=s3.amazonaws.com          # Keep for compatibility
MINIO_PORT=443
MINIO_ACCESS_KEY=AKIA...your-production-access-key
MINIO_SECRET_KEY=your-production-secret-key
MINIO_BUCKET_NAME=clinic-production-files
MINIO_USE_SSL=true
```

## 📧 Step 6: Email Configuration

### Development (MailDev - Local Testing)

```bash
SMTP_HOST=maildev
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_TLS=false
EMAIL_FROM=dev@clinic-app.com
```

### Production Email Options

#### Option 1: Gmail SMTP

1. **Enable 2FA**: On your Gmail account
2. **Create App Password**: Google Account → Security → App passwords
3. **Use App Password**: Not your regular Gmail password

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-digit-app-password      # Not your regular password!
SMTP_TLS=true
EMAIL_FROM=noreply@yourdomain.com
```

#### Option 2: SendGrid

1. **Create Account**: Visit [SendGrid](https://sendgrid.com/)
2. **Create API Key**: Settings → API Keys
3. **Verify Domain**: Sender Authentication

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey                          # Literally "apikey"
SMTP_PASS=SG.your-sendgrid-api-key-here
SMTP_TLS=true
EMAIL_FROM=noreply@yourdomain.com
```

#### Option 3: AWS SES

1. **Setup SES**: AWS Simple Email Service
2. **Verify Domain**: Domain verification
3. **Create SMTP Credentials**: SMTP Settings

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_TLS=true
EMAIL_FROM=noreply@yourdomain.com
```

## 🌐 Step 7: Frontend Environment Variables

Create `frontend/.env` for each environment:

### Development

```bash
# API Configuration
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
VITE_ENVIRONMENT=development

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Payment
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key

# Optional Analytics
VITE_GOOGLE_ANALYTICS_ID=                 # Leave empty for development
VITE_SENTRY_DSN=                          # Leave empty for development
```

### Staging

```bash
# API Configuration
VITE_API_URL=https://staging-api.yourdomain.com
VITE_WS_URL=wss://staging-api.yourdomain.com
VITE_ENVIRONMENT=staging

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-staging-client-id.apps.googleusercontent.com

# Payment
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_staging_key

# Analytics
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX-X
VITE_SENTRY_DSN=https://your-staging-sentry-dsn@sentry.io/project
```

### Production

```bash
# API Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_ENVIRONMENT=production

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com

# Payment
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key

# Analytics
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX-X
VITE_SENTRY_DSN=https://your-production-sentry-dsn@sentry.io/project
VITE_HOTJAR_ID=your-hotjar-site-id
```

## 📊 Step 8: Monitoring & Analytics

### Grafana Configuration

```bash
# Development
GRAFANA_ADMIN_PASSWORD=admin

# Staging
GRAFANA_ADMIN_PASSWORD=secure-staging-password

# Production
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 32)
GRAFANA_SECRET_KEY=$(openssl rand -hex 32)
```

### Sentry Error Tracking

1. **Create Account**: Visit [Sentry](https://sentry.io/)
2. **Create Project**: For your platform
3. **Get DSN**: Project Settings → Client Keys

```bash
# Staging
SENTRY_DSN=https://your-staging-key@sentry.io/staging-project-id

# Production
SENTRY_DSN=https://your-production-key@sentry.io/production-project-id
SENTRY_ENVIRONMENT=production
```

### Slack Notifications

1. **Create Slack App**: Visit [Slack API](https://api.slack.com/apps)
2. **Enable Webhooks**: Incoming Webhooks
3. **Create Webhook URL**: For your channel

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

## 🔒 Step 9: Production Security Configuration

### Security Headers & Features

```bash
# Production security settings
NODE_ENV=production
HTTPS_ONLY=true
SECURE_COOKIES=true
HSTS_ENABLED=true
HSTS_MAX_AGE=31536000
CONTENT_SECURITY_POLICY_ENABLED=true
X_FRAME_OPTIONS=SAMEORIGIN
X_CONTENT_TYPE_OPTIONS=nosniff
```

### Rate Limiting & DDoS Protection

```bash
RATE_LIMIT_MAX=1000                       # Requests per window
RATE_LIMIT_WINDOW=900000                  # 15 minutes in milliseconds
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
DDOS_PROTECTION_ENABLED=true
```

### HIPAA Compliance Settings

```bash
HIPAA_AUDIT_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=2555             # 7 years (HIPAA requirement)
DATA_ENCRYPTION_AT_REST=true
DATA_ENCRYPTION_IN_TRANSIT=true
BACKUP_ENCRYPTION=true
PCI_COMPLIANCE_MODE=true                  # For payment processing
```

## ✅ Step 10: Validation & Testing

### Environment Validation Script

Create and run validation script:

```bash
# Create validation script
./scripts/validate-environment.sh

# This will test:
# 1. Database connectivity
# 2. External service connections
# 3. API key validity
# 4. Security configurations
# 5. Required environment variables
```

### Manual Testing Checklist

#### Database Connection
```bash
# Test PostgreSQL connection
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;"

# Test Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
```

#### External Services
```bash
# Test OpenAI API
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Test Twilio
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Test Stripe
curl https://api.stripe.com/v1/customers \
  -u "$STRIPE_SECRET_KEY:"
```

## 🚀 Step 11: Deployment Configuration

### CI/CD Environment Variables

Add these secrets to your GitHub repository:

1. Go to **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**
2. Add **New repository secret** for each:

#### Required GitHub Secrets

```bash
# Database
POSTGRES_STAGING_PASSWORD=your-staging-db-password
POSTGRES_PRODUCTION_PASSWORD=your-production-db-password

# Security
JWT_STAGING_SECRET=your-staging-jwt-secret
JWT_PRODUCTION_SECRET=your-production-jwt-secret
ENCRYPTION_STAGING_KEY=your-staging-encryption-key
ENCRYPTION_PRODUCTION_KEY=your-production-encryption-key

# External Services
OPENAI_STAGING_API_KEY=sk-your-staging-openai-key
OPENAI_PRODUCTION_API_KEY=sk-your-production-openai-key
TWILIO_STAGING_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_PRODUCTION_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_STAGING_AUTH_TOKEN=your-staging-auth-token
TWILIO_PRODUCTION_AUTH_TOKEN=your-production-auth-token

# Payment Processing
STRIPE_TEST_SECRET_KEY=sk_test_your_test_key
STRIPE_LIVE_SECRET_KEY=sk_live_your_live_key

# Cloud Services (if using cloud deployment)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-aws-secret
AZURE_CREDENTIALS={"clientId":"...","clientSecret":"..."}
GCP_PROJECT_ID=your-gcp-project
GCP_SA_KEY={"type":"service_account"...}

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## 🎯 Step 12: Final Configuration

### Complete Environment Files

After following all steps, your environment files should look like:

#### `.env` (Development)
```bash
# Development Environment - Healthcare Platform
NODE_ENV=development
PORT=4000

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=clinic
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Security
JWT_SECRET=your-dev-jwt-secret
SESSION_SECRET=your-dev-session-secret
ENCRYPTION_KEY=your-dev-encryption-key

# External Services
OPENAI_API_KEY=sk-your-dev-openai-key
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-dev-auth-token

# Payment
STRIPE_SECRET_KEY=sk_test_your_test_key

# Email
SMTP_HOST=maildev
SMTP_PORT=1025

# File Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Feature Flags
FEATURE_AI_ANALYSIS=true
FEATURE_GOOGLE_INTEGRATION=true
DEBUG_MODE=true
```

#### `.env.production` (Production)
```bash
# Production Environment - Healthcare Platform
NODE_ENV=production
PORT=4000

# Database
POSTGRES_HOST=your-production-db-host
POSTGRES_PORT=5432
POSTGRES_DB=clinic_production
POSTGRES_USER=clinic_prod_user
POSTGRES_PASSWORD=your-secure-db-password

# Security
JWT_SECRET=your-production-jwt-secret-64-chars
SESSION_SECRET=your-production-session-secret
ENCRYPTION_KEY=your-production-encryption-key
MFA_REQUIRED=true
HTTPS_ONLY=true

# External Services
OPENAI_API_KEY=sk-your-production-openai-key
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-production-auth-token

# Payment
STRIPE_SECRET_KEY=sk_live_your_live_key

# Email
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password

# File Storage
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_PORT=443
MINIO_ACCESS_KEY=your-s3-access-key
MINIO_SECRET_KEY=your-s3-secret-key
MINIO_USE_SSL=true

# HIPAA Compliance
HIPAA_AUDIT_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=2555
DATA_ENCRYPTION_AT_REST=true
```

## 🎉 You're Ready!

After completing all steps, you should have:

✅ **Development environment** ready for local development  
✅ **Staging environment** configured for testing  
✅ **Production environment** secured and compliant  
✅ **CI/CD secrets** configured in GitHub  
✅ **External services** connected and tested  
✅ **Security features** enabled and validated  

### Next Steps

1. **Test the setup**: Run `./scripts/dev.sh` to start development
2. **Deploy to staging**: Push to `main` branch for automatic staging deployment
3. **Deploy to production**: Approve staging deployment for production release

For troubleshooting, see the [Troubleshooting Guide](TROUBLESHOOTING.md).

---

**🏥 Your Healthcare Platform is now fully configured and ready for secure, HIPAA-compliant operation!** 🌟