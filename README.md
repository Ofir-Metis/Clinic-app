# 🏥 Healthcare Platform - Complete Clinic Management System

A comprehensive, HIPAA-compliant microservices platform for healthcare providers with automated CI/CD deployment, AI-powered insights, and full client portal management.

[![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen.svg)](https://github.com/clinic-app/clinic-app)
[![HIPAA Compliant](https://img.shields.io/badge/HIPAA-Compliant-blue.svg)](https://github.com/clinic-app/clinic-app)
[![CI/CD Automated](https://img.shields.io/badge/CI%2FCD-Automated-orange.svg)](https://github.com/clinic-app/clinic-app)
[![Multi-Cloud](https://img.shields.io/badge/Multi--Cloud-AWS%7CAzure%7CGCP-yellow.svg)](https://github.com/clinic-app/clinic-app)

## 📋 Table of Contents

- [🎯 Project Overview](#-project-overview)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [🔧 Prerequisites](#-prerequisites)
- [📦 Installation](#-installation)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🚀 Deployment Options](#-deployment-options)
- [🔒 Security & Compliance](#-security--compliance)
- [🧪 Testing](#-testing)
- [📊 Monitoring](#-monitoring)
- [🔧 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)

## 🎯 Project Overview

Healthcare Platform is a full-stack, microservices-based clinic management system designed for modern healthcare providers. Built with enterprise-grade security, HIPAA compliance, and automated deployment pipelines.

### 🏥 Healthcare Focus
- **Client-Centered**: Use "Clients" not "Patients" 
- **Coaching Sessions**: Focus on empowerment and growth
- **Wellness Journey**: Track progress and achievements
- **HIPAA Compliant**: Built-in audit trails and security

### 🚀 Production-Ready Features
- **Automated CI/CD**: Git push → Staging → Production with approval
- **Zero-Downtime Deployments**: Blue-green deployment strategy
- **Multi-Cloud Support**: AWS, Azure, GCP, or self-hosted
- **Enterprise Security**: JWT, MFA, encryption, audit logging
- **Auto-Scaling**: Horizontal scaling with health checks

## ✨ Key Features

### 👥 **User Management**
- **Client Portal**: Self-service appointment booking, progress tracking
- **Coach Dashboard**: Session management, client insights, analytics
- **Admin Dashboard**: System management, user administration, compliance

### 📅 **Appointment System**
- **Smart Scheduling**: AI-powered appointment optimization
- **Google Calendar Integration**: Two-way sync with external calendars
- **Automated Reminders**: SMS and email notifications via Twilio

### 🎙️ **Session Management**
- **Recording Capabilities**: Audio/video session recording (MP4, MOV, AVI, MP3, WAV)
- **AI Transcription**: Whisper API integration for session transcription
- **Session Summaries**: GPT-4 powered insights and recommendations
- **Secure Note-Taking**: HIPAA-compliant clinical notes

### 🤖 **AI Integration**
- **OpenAI GPT-4**: Session analysis and insights
- **Whisper API**: Automatic transcription services
- **Smart Recommendations**: AI-powered coaching suggestions
- **Progress Analytics**: Machine learning-based progress tracking

### 💳 **Billing System**
- **Israeli Compliance**: Tranzilla, CardCom integration
- **International Payments**: Stripe integration
- **Automated Invoicing**: Tax-compliant billing
- **Revenue Tracking**: Real-time financial analytics

### 🔐 **Security & Compliance**
- **HIPAA Compliant**: Comprehensive audit trails
- **Multi-Factor Authentication**: TOTP-based MFA
- **Encryption**: Data at rest and in transit
- **Role-Based Access**: Granular permissions system

## 🏗️ Architecture

### Microservices Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend│◄──►│   API Gateway    │◄──►│  Load Balancer  │
│   (Material-UI) │    │   (NestJS)       │    │    (Nginx)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
            ┌──────────────┬──────────────┬──────────────┐
            │ Auth Service │Files Service │Notes Service │
            │   (JWT/MFA)  │(File Upload) │(Clinical)    │
            └──────────────┴──────────────┴──────────────┘
                    │           │           │
                    └───────────┼───────────┘
                                ▼
                    ┌──────────────────────────┐
                    │     NATS Message Bus     │
                    └──────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│ PostgreSQL   │    │      Redis       │    │   MinIO/S3   │
│ (Database)   │    │    (Caching)     │    │ (File Store) │
└──────────────┘    └──────────────────┘    └──────────────┘
```

### 🔧 **Technology Stack**

#### **Backend Services**
- **NestJS 10.x** - Node.js framework with TypeScript
- **TypeORM** - Database ORM with PostgreSQL 15
- **NATS 2.x** - Message broker for service communication
- **Redis 7.x** - Caching and session storage
- **JWT** - Authentication with refresh tokens

#### **Frontend**
- **React 18.x** - Modern UI framework
- **TypeScript 5.3.x** - Type-safe development
- **Material-UI 5.x** - Healthcare-focused design system
- **Vite 4.x** - Fast development and build tool

#### **Infrastructure**
- **Docker** - Containerization with multi-stage builds
- **Nginx** - Load balancing and SSL termination
- **GitHub Actions** - Automated CI/CD pipelines
- **Prometheus/Grafana** - Monitoring and alerting

#### **Cloud & Deployment**
- **AWS ECS** - Container orchestration
- **Azure Container Apps** - Serverless containers
- **Google Cloud Run** - Serverless platform
- **Self-Hosted** - Docker Compose deployment

## 🚀 Quick Start

### 🔧 Prerequisites

- **Node.js 20+** ([Download](https://nodejs.org/))
- **Yarn** package manager (`npm install -g yarn`)
- **Docker & Docker Compose** ([Download](https://www.docker.com/))
- **Git** version control

### 📦 Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourorg/clinic-app.git
cd clinic-app

# 2. Use Node.js 20+
nvm install 20 && nvm use 20

# 3. Install dependencies
yarn install

# 4. Build shared library (REQUIRED FIRST)
yarn workspace @clinic/common build

# 5. Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env

# 6. Start all services
./scripts/dev.sh

# 7. Open your browser
# Frontend: http://localhost:5173
# API Docs: http://localhost:4000/api-docs
# Admin: http://localhost:5173/admin
```

### 🎉 **You're Ready!**

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:4000/health
- **Admin Dashboard**: http://localhost:5173/admin
- **API Documentation**: http://localhost:4000/api-docs

## ⚙️ Environment Configuration

### 🔐 **Step-by-Step Environment Setup**

The platform uses different environment files for different deployment targets:

- **`.env`** - Local development
- **`.env.staging`** - Staging environment  
- **`.env.production`** - Production environment

### 📝 **Required Environment Variables**

#### **1. Database Configuration**
```bash
# PostgreSQL Database
POSTGRES_HOST=localhost                    # Production: your-db-host.com
POSTGRES_PORT=5432                        # Keep as 5432
POSTGRES_DB=clinic                        # Production: clinic_production
POSTGRES_USER=postgres                    # Production: your-db-username
POSTGRES_PASSWORD=postgres                 # Production: CHANGE-TO-STRONG-PASSWORD
```

#### **2. Authentication & Security**
```bash
# JWT Configuration
JWT_SECRET=change-me-in-production         # Production: Generate 64-char random string
SESSION_SECRET=session-secret-change-me    # Production: Generate 64-char random string

# Encryption
ENCRYPTION_KEY=encryption-key-32-chars     # Production: Generate 32-char key
```

#### **3. External Services**

##### **OpenAI Integration**
```bash
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-key         # Production: Your actual OpenAI key
OPENAI_ORG_ID=org-your-org-id             # Production: Your organization ID
```

##### **Twilio SMS/Voice**
```bash
# Get from: https://console.twilio.com/
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxx       # Production: Your Twilio Account SID
TWILIO_AUTH_TOKEN=your-auth-token          # Production: Your Twilio Auth Token
TWILIO_PHONE_NUMBER=+1234567890            # Production: Your Twilio phone number
```

##### **Google Integration**
```bash
# Get from: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your-client-id            # Production: Your Google OAuth Client ID
GOOGLE_CLIENT_SECRET=your-client-secret    # Production: Your Google OAuth Client Secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback  # Production: https://yourdomain.com/auth/google/callback
```

#### **4. Payment Processing**

##### **Stripe (International)**
```bash
# Get from: https://dashboard.stripe.com/
STRIPE_SECRET_KEY=sk_test_your_key         # Production: sk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret    # Production: Your production webhook secret
```

##### **Israeli Payment Gateways**
```bash
# Tranzilla
TRANZILLA_TERMINAL=your-terminal           # Production: Your Tranzilla terminal
TRANZILLA_USERNAME=your-username           # Production: Your Tranzilla username
TRANZILLA_PASSWORD=your-password           # Production: Your Tranzilla password

# CardCom
CARDCOM_TERMINAL=your-terminal             # Production: Your CardCom terminal
CARDCOM_USERNAME=your-username             # Production: Your CardCom username
CARDCOM_PASSWORD=your-password             # Production: Your CardCom password
```

#### **5. File Storage**

##### **Local Development (MinIO)**
```bash
MINIO_ENDPOINT=localhost                   # Production: your-s3-endpoint.com
MINIO_PORT=9000                           # Production: 443 (for S3)
MINIO_ACCESS_KEY=minioadmin               # Production: Your S3 access key
MINIO_SECRET_KEY=minioadmin               # Production: Your S3 secret key
MINIO_BUCKET_NAME=clinic-dev              # Production: clinic-production
```

##### **Production (AWS S3)**
```bash
S3_ENDPOINT=s3.amazonaws.com              # Your S3 endpoint
S3_ACCESS_KEY=AKIA...                     # Your AWS access key
S3_SECRET_KEY=your-secret-key             # Your AWS secret key
S3_BUCKET=clinic-production               # Your S3 bucket name
S3_REGION=us-east-1                       # Your AWS region
```

#### **6. Email Configuration**

##### **Development (MailDev)**
```bash
SMTP_HOST=maildev                         # Production: your-smtp-host.com
SMTP_PORT=1025                           # Production: 587 (TLS) or 465 (SSL)
SMTP_USER=                               # Production: your-email@domain.com
SMTP_PASS=                               # Production: your-email-password
EMAIL_FROM=dev@clinic-app.com            # Production: noreply@yourdomain.com
```

##### **Production (Gmail/SendGrid/SES)**
```bash
SMTP_HOST=smtp.gmail.com                  # Or smtp.sendgrid.net, email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587                            # 587 for TLS
SMTP_USER=your-email@gmail.com           # Your email or API username
SMTP_PASS=your-app-password              # App password or API key
SMTP_TLS=true                            # Enable TLS encryption
```

#### **7. Frontend Environment Variables**

Create `frontend/.env`:
```bash
# API Configuration
VITE_API_URL=http://localhost:4000        # Production: https://api.yourdomain.com
VITE_WS_URL=ws://localhost:4000           # Production: wss://api.yourdomain.com
VITE_ENVIRONMENT=development              # Production: production

# Google OAuth (Frontend)
VITE_GOOGLE_CLIENT_ID=your-client-id      # Same as backend GOOGLE_CLIENT_ID

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXX       # Production: Your GA4 ID
VITE_SENTRY_DSN=https://your-sentry-dsn   # Production: Your Sentry DSN
```

### 🔒 **Production Security Checklist**

Before going to production, ensure you:

#### ✅ **Change All Default Passwords**
```bash
# Generate strong passwords (example)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -hex 64)
SESSION_SECRET=$(openssl rand -hex 64)
ENCRYPTION_KEY=$(openssl rand -hex 32)
```

#### ✅ **Use Production Service Keys**
- Replace `sk_test_` with `sk_live_` for Stripe
- Use production Twilio credentials
- Use production OpenAI API key
- Configure production OAuth callbacks

#### ✅ **Enable Security Features**
```bash
# Production security settings
NODE_ENV=production
MFA_REQUIRED=true
HTTPS_ONLY=true
SECURE_COOKIES=true
RATE_LIMITING_ENABLED=true
```

#### ✅ **Configure Monitoring**
```bash
# Monitoring and alerting
SENTRY_DSN=your-production-sentry-dsn
GRAFANA_ADMIN_PASSWORD=secure-password
SLACK_WEBHOOK_URL=your-slack-webhook
```

### 🚀 **Environment Setup Script**

Use our automated environment setup script:

```bash
# Run the environment setup wizard
./scripts/setup-environment.sh

# This will:
# 1. Guide you through each environment variable
# 2. Validate configurations
# 3. Generate secure passwords
# 4. Test external service connections
# 5. Create production-ready .env files
```

## 🚀 Deployment Options

The platform supports multiple deployment strategies with automated CI/CD:

### 🏠 **Self-Hosted (Current Default)**
```bash
# Simple git push deployment
git add .
git commit -m "feat: new feature"
git push origin main

# ✅ Automatic staging deployment
# ✅ Production approval workflow
# ✅ Zero-downtime deployment
```

**Benefits:**
- ✅ Full control over infrastructure
- ✅ Lower costs for small deployments
- ✅ HIPAA compliant with proper setup
- ✅ Already configured and ready

### ☁️ **Cloud Deployment Options**

#### 🟠 **AWS (Amazon Web Services)**
- **Services**: ECS, ECR, RDS, ElastiCache, S3
- **Cost**: ~$200-500/month
- **Setup**: Configure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in GitHub secrets

#### 🔵 **Azure (Microsoft)**  
- **Services**: Container Apps, ACR, PostgreSQL, Redis, Blob Storage
- **Cost**: ~$150-400/month
- **Setup**: Configure `AZURE_CREDENTIALS` in GitHub secrets

#### 🟢 **Google Cloud Platform**
- **Services**: Cloud Run, Artifact Registry, Cloud SQL, Memorystore
- **Cost**: ~$100-300/month  
- **Setup**: Configure `GCP_PROJECT_ID` and `GCP_SA_KEY` in GitHub secrets

### 🔄 **Automated CI/CD Pipeline**

Every `git push` triggers:
1. **Security Scan** - Vulnerability detection
2. **Build & Test** - All services with 80% coverage
3. **Deploy to Staging** - Automatic staging deployment  
4. **Comprehensive Testing** - 26 automated smoke tests
5. **Production Approval** - Manual approval gate
6. **Production Deployment** - Zero-downtime blue-green deployment
7. **Health Validation** - Post-deployment checks
8. **Notifications** - Slack/team alerts

### 📖 **Detailed Deployment Guides**

- **[Self-Hosted Deployment](docs/DEPLOYMENT.md)** - Complete Docker Compose guide
- **[Cloud Deployment Guide](docs/CLOUD_DEPLOYMENT.md)** - AWS, Azure, GCP instructions
- **[Production Checklist](docs/PRODUCTION_CHECKLIST.md)** - Pre-deployment validation

## 🔒 Security & Compliance

### 🏥 **HIPAA Compliance**
- ✅ **Audit Logging** - All access and changes logged
- ✅ **Data Encryption** - At rest and in transit (AES-256)
- ✅ **Access Controls** - Role-based permissions (client/coach/admin)
- ✅ **Business Associate Agreements** - Cloud provider BAAs available
- ✅ **Data Retention** - Configurable retention policies
- ✅ **Secure Communications** - TLS 1.3, HTTPS everywhere

### 🔐 **Security Features**
- **Multi-Factor Authentication** - TOTP-based MFA for all users
- **JWT Tokens** - Secure authentication with refresh tokens
- **Rate Limiting** - DDoS protection and abuse prevention
- **Input Validation** - XSS and injection attack prevention
- **Security Headers** - HSTS, CSP, X-Frame-Options
- **Vulnerability Scanning** - Automated security scans in CI/CD

### 🔍 **Audit & Monitoring**
- **Real-time Monitoring** - Prometheus + Grafana dashboards
- **Security Alerts** - Automated alerting for suspicious activity
- **Compliance Reports** - Automated HIPAA compliance reporting
- **Access Logs** - Comprehensive audit trails for all user actions

## 🧪 Testing

### 🎯 **Comprehensive Test Suite**

```bash
# Run all tests
./scripts/test.sh

# Individual test types
yarn test                    # Unit tests (80% coverage required)
yarn test:e2e               # End-to-end tests
yarn test:integration       # Integration tests
./scripts/staging-smoke-tests.sh  # 26 smoke tests
```

### 🌐 **Cross-Platform Testing**
- **Desktop**: Chrome, Firefox, Safari (1920x1080)
- **Mobile**: iOS Safari, Android Chrome (responsive design)
- **Tablet**: iPad Pro, Android tablets (adaptive layouts)

### 🔒 **Security Testing**
- **Vulnerability Scanning** - Trivy security scanner
- **Dependency Checking** - Automated CVE detection
- **Penetration Testing** - Security validation
- **HIPAA Compliance Testing** - Healthcare-specific validation

### 📊 **Performance Testing**
- **Load Testing** - 100+ concurrent users
- **Response Time** - < 2s page loads, < 200ms API responses
- **File Upload** - 500MB file handling
- **Real-time Features** - WebSocket performance

## 📊 Monitoring

### 📈 **Built-in Monitoring Stack**
- **Prometheus** - Metrics collection and storage
- **Grafana** - Dashboards and visualization
- **Loki** - Log aggregation and search
- **AlertManager** - Alert routing and notifications

### 🚨 **Alerting & Notifications**
- **Slack Integration** - Real-time deployment and error alerts
- **Email Alerts** - Critical system notifications  
- **PagerDuty** - On-call incident management
- **Health Checks** - Automated service monitoring

### 📊 **Key Metrics Tracked**
- **System Health** - CPU, memory, disk usage
- **Application Performance** - Response times, error rates
- **Business Metrics** - User activity, session counts
- **Security Events** - Failed logins, suspicious activity

## 🔧 Troubleshooting

### 🐛 **Common Issues**

#### **"@clinic/common not found" Error**
```bash
# Solution: Build shared library first
yarn workspace @clinic/common build
```

#### **Database Connection Failed**
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# View database logs  
docker-compose logs postgres
```

#### **Port Already in Use**
```bash
# Check what's using the port
lsof -i :4000

# Kill the process
kill -9 $(lsof -t -i:4000)
```

#### **Frontend Not Loading**
```bash
# Check if frontend is running
curl http://localhost:5173/health

# Restart frontend
cd frontend && yarn dev
```

### 🆘 **Emergency Recovery**

#### **Production Rollback**
```bash
# Emergency rollback to previous version
./scripts/rollback-production.sh "Emergency: Critical issue detected"
```

#### **Database Recovery**
```bash
# Restore from backup
./scripts/restore-production.sh <backup-id>
```

### 📞 **Support Contacts**

- **DevOps Team**: devops@clinic-app.com
- **Emergency Slack**: #emergency-alerts
- **On-call**: Use PagerDuty integration
- **Documentation**: [Full Troubleshooting Guide](docs/TROUBLESHOOTING.md)

## 🤝 Contributing

### 🔄 **Development Workflow**

1. **Fork & Clone**
```bash
git clone https://github.com/yourusername/clinic-app.git
cd clinic-app
```

2. **Create Feature Branch**
```bash
git checkout -b feature/amazing-new-feature
```

3. **Develop & Test**
```bash
# Install dependencies
yarn install

# Build shared library
yarn workspace @clinic/common build

# Run tests
./scripts/test.sh

# Start development environment
./scripts/dev.sh
```

4. **Commit & Push**
```bash
# Use conventional commits
git commit -m "feat: add amazing new feature"
git push origin feature/amazing-new-feature
```

5. **Create Pull Request**
- Open PR against `main` branch
- Ensure all tests pass
- Request code review

### 📝 **Code Standards**
- **TypeScript** - Strict mode, no `any` types
- **ESLint + Prettier** - Automated code formatting
- **Conventional Commits** - Structured commit messages
- **80% Test Coverage** - Minimum coverage requirement
- **SOLID Principles** - Clean architecture patterns

### 🏥 **Healthcare-Specific Guidelines**
- Use "Clients" not "Patients"
- "Coaching Sessions" not "Appointments"  
- "Growth Journey" not "Treatment"
- Prioritize data privacy and security
- Follow HIPAA compliance guidelines

---

## 🎉 **Ready to Deploy!**

Your healthcare platform is now ready for production with:

- ✅ **Automated CI/CD** - Git push to production with approval
- ✅ **Multi-cloud deployment** - AWS, Azure, GCP, or self-hosted
- ✅ **HIPAA compliance** - Built-in security and audit trails
- ✅ **Zero-downtime deployments** - Blue-green deployment strategy
- ✅ **Comprehensive monitoring** - Real-time alerts and dashboards
- ✅ **Enterprise security** - MFA, encryption, access controls

### 🚀 **Quick Deploy**
```bash
git add .
git commit -m "feat: deploy healthcare platform"
git push origin main
# ✅ Automatic staging deployment!
# ✅ Approve for production when ready!
```

For detailed deployment instructions, see:
- **[Complete Deployment Guide](docs/DEPLOYMENT.md)**
- **[Cloud Deployment Options](docs/CLOUD_DEPLOYMENT.md)**
- **[Environment Configuration Guide](docs/ENVIRONMENT_SETUP.md)**

---

**Built with ❤️ for Healthcare Providers**

*Empowering wellness journeys through technology* 🌟