# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 APPLICATION PURPOSE

This is a **self-development coaching platform** designed for personal growth coaches, life coaches, and wellness practitioners. It is **NOT a mental health application** and is not intended for medical or therapeutic use.

### Target Users
- **Self-development coaches** - Personal growth and empowerment coaching
- **Life coaches** - Goal setting, achievement tracking, and lifestyle guidance  
- **Wellness practitioners** - Holistic wellness and mindfulness coaching
- **Business coaches** - Professional development and career guidance

### Important Disclaimers
- **NOT for mental health therapy** - This platform does not provide medical or psychological treatment
- **NOT for licensed therapists** - Not designed for clinical mental health services
- **Coaching focus only** - Emphasizes personal empowerment, growth, and self-improvement
- **Wellness terminology** - Uses empowerment-based language throughout the application

## 🏗️ CORE ARCHITECTURE & STANDARDS

### Microservices Architecture
- **Pattern**: NestJS microservices with NATS message broker
- **Communication**: HTTP via API Gateway + async NATS messaging
- **Database**: Shared PostgreSQL with TypeORM (auto-sync enabled)
- **Authentication**: JWT across all services
- **File Storage**: MinIO (dev) / S3 (prod) with chunked uploads

### Technology Stack
- **Backend**: NestJS 10.x, TypeORM, PostgreSQL 15, Redis 7, NATS 2
- **Frontend**: React 18.x, TypeScript 5.3.x, Material-UI 5.x, Vite 4.x
- **Testing**: Jest 29.x (80% coverage), Playwright E2E
- **AI/ML**: OpenAI GPT-4, Whisper API
- **Payments**: Stripe, Tranzilla, CardCom (Israeli compliance)

### Code Quality Requirements
- **SOLID Principles**: Mandatory across all services
- **Security**: Zero Trust, input validation, JWT security, HTTPS everywhere
- **Testing**: 80% coverage threshold, TDD/BDD approach
- **Performance**: Horizontal scaling, caching strategy, pagination

## 📋 ESSENTIAL COMMANDS

### Quick Start
```bash
nvm use 20                                  # Node.js 20+ required
yarn install                               # Install all workspaces
yarn workspace @clinic/common build        # Build shared library FIRST
cp .env.example .env                       # Configure environment
./scripts/dev.sh                           # Start all services
```

### Development Commands
- `./scripts/dev.sh` - Start all services with Docker Compose
- `yarn workspace @clinic/common build` - **Build shared library first (required)**
- `yarn workspace <service-name> start:dev` - Run individual service
- `cd frontend && yarn dev` - Frontend development server (port 5173)
- `./scripts/test.sh` - Run tests across all workspaces
- `./scripts/test-e2e.sh` - Playwright E2E tests

### Service Management
- `yarn workspace <service-name> migration:run` - Run database migrations
- `docker compose logs <service-name>` - View service logs
- `docker compose up postgres nats minio maildev redis` - Infrastructure only

### Testing & Quality
- `yarn lint` - ESLint code style check
- `yarn test` - Jest unit tests across workspaces
- `yarn format` - Prettier code formatting
- `./scripts/test-e2e.sh --browser firefox` - Specific browser E2E tests
- `./scripts/test-e2e.sh --headed --debug` - Debug mode E2E tests

### API Documentation
- `cd services/api-gateway && npm run docs:generate` - Generate comprehensive API documentation
- `cd services/api-gateway && npm run docs:serve` - Serve documentation locally on port 8080
- `cd services/api-gateway && npm run docs:build` - Build and generate full documentation pipeline
- **Live Documentation**: `http://localhost:4000/api-docs` (development mode)
- **Features**: Interactive Swagger UI, TypeScript SDK, Postman collections, HIPAA compliance docs

### Available Services
- **api-gateway** (port 4000) - Main entry point with WebSocket/GraphQL/REST
- **auth-service** (port 3001) - Authentication & user management
- **appointments-service** (port 3002) - Scheduling with Google Calendar sync
- **files-service** (port 3003) - File uploads & recordings (MinIO/S3)
- **notifications-service** (port 3004) - Email/SMS/WhatsApp via Twilio
- **ai-service** (port 3005) - OpenAI GPT-4 & Whisper integration
- **notes-service** (port 3006) - Session notes with rich text
- **analytics-service** (port 3007) - Advanced reporting & AI insights
- **settings-service** (port 3008) - User preferences & system config
- **billing-service** (port 3009) - Israeli VAT, Stripe/Tranzilla payments
- **search-service** (port 3010) - Elasticsearch global search & autocomplete
- **cdn-service** (port 3011) - Content delivery & image optimization
- **therapists-service** - Therapist profiles & specializations
- **google-integration-service** - Google OAuth, Calendar & Gmail

## 🏠 ARCHITECTURE OVERVIEW

### Service Communication
- **Frontend** → **API Gateway** (port 4000) → **Microservices**
- **NATS Messaging**: Async communication between services
- **JWT Flow**: Token passed through headers for authentication
- **Health Checks**: All services expose `/health` endpoints
- **WebSocket**: Real-time updates via Socket.IO in API Gateway

### Database Pattern
- **Single PostgreSQL**: Shared database with service-specific entities
- **TypeORM**: Auto-synchronization enabled for development
- **Migrations**: Service-specific migration commands available
- **Connection**: `psql -h localhost -p 5432 -U postgres -d clinic`

### File Structure
```
services/          # NestJS microservices
├── api-gateway/   # Main entry point (GraphQL, REST, WebSocket)
├── auth-service/  # JWT authentication & user management
├── billing-service/ # Israeli compliance & payment processing
└── ...
frontend/          # React + Vite + Material-UI
libs/
├── common/        # Shared utilities (build first!)
scripts/           # Development & deployment scripts
tests/             # Playwright E2E and integration test suites
```

## 🎨 FRONTEND STANDARDS

### React Best Practices
- **Components**: Functional components with hooks only
- **State**: Context + hooks, avoid global state when possible
- **Performance**: React.memo(), useCallback/useMemo, lazy loading
- **Routing**: Role-based access (`/client/*`, `/admin/*`)

### Design System
- **Material Design 3**: Wellness-focused theme with empowerment colors
- **Primary Color**: `#2E7D6B` (trust & empowerment)
- **Typography**: Inter font family, responsive scaling
- **Layout**: Mobile-first, glassmorphism effects
- **Terminology**: "Clients" not "Patients", "Coaching Sessions" not "Appointments"

### Translation System (MANDATORY)
**ALL user-visible text MUST use translation system**
```typescript
import { useTranslation } from '../contexts/LanguageContext';
const { t } = useTranslation();
// Use: {t.clientPortal.dashboard.title}
// Never: "Welcome to your dashboard"
```

## 🔐 SECURITY & ADMIN

### Admin Creation
```bash
# Recommended method
./scripts/create-admin.sh admin@clinic.com SecurePassword123

# Alternative methods
node scripts/create-admin.js admin@clinic.com SecurePassword123
psql -h localhost -p 5432 -U postgres -d clinic -f scripts/seed-admin.sql
```

### Security Features
- **Role-based Access**: client, coach, admin, super_admin
- **Admin Impersonation**: Secure view switching with audit trails
- **API Key Management**: Fine-grained permissions and rate limiting
- **Audit Logging**: All admin actions logged for compliance

## 🧪 TESTING INFRASTRUCTURE

### Test Commands
```bash
./scripts/test.sh                          # All tests with environment setup
./scripts/test-e2e.sh                      # Playwright E2E tests
./scripts/test-e2e.sh --browser firefox    # Specific browser
./scripts/test-e2e.sh --headed --debug     # Debug mode
yarn workspace <service> test              # Individual service tests

# Integration Testing
cd tests/integration                       # Navigate to integration tests
node test-runner.ts                        # Run all integration tests
node test-runner.ts --services auth,files  # Run specific service tests
node test-runner.ts --verbose --sequential # Debug mode with detailed output
```

### Test Requirements
- **80% Coverage**: Minimum threshold enforced
- **Test Pyramid**: Unit (70%) > Integration (20%) > E2E (10%)
- **Environment**: `scripts/test.sh` sets up test environment variables
- **Cross-browser**: Chrome, Firefox, Safari via Playwright
- **Integration Tests**: Docker-orchestrated environment with healthcare-specific test scenarios
- **Performance Testing**: Built-in benchmarking and load testing capabilities

## 🎙️ KEY FEATURES

### Recording & AI
- **Session Recording**: WebSocket status updates, chunked uploads to MinIO/S3
- **AI Integration**: GPT-4 session summaries, Whisper transcription
- **File Support**: MP4, MOV, AVI, MP3, WAV, M4A, WebM (500MB max)

### Client Portal
- **Client Dashboard**: Growth tracking, achievements, goal setting
- **Booking System**: Self-service appointment scheduling
- **Coach Discovery**: Find coaches by specialization
- **URL Pattern**: `/client/*` routes with dedicated authentication

### Admin Dashboard
- **System Management**: User management, system health, configuration
- **Security Settings**: API keys, audit logs, access control
- **URL Pattern**: `/admin/*` routes with elevated permissions

### Google Integration
- **Calendar Sync**: Two-way sync with Google Calendar
- **Gmail Integration**: Automated email communications
- **OAuth Flow**: Secure Google account connection

## ⚙️ DEVELOPMENT WORKFLOW

### Prerequisites
- **Node.js 20+** (use `nvm install 20 && nvm use 20`)
- **Yarn** package manager (`npm install -g yarn`)
- **Docker & Docker Compose**
- **Environment**: Copy `.env.example` to `.env`

### Critical Patterns
- **Build Order**: Always build `@clinic/common` first
- **Workspace Management**: Yarn workspaces (`services/*`, `frontend`, `libs/*`)
- **Service Dependencies**: API Gateway depends on all backend services
- **NATS Communication**: Async messaging for non-critical operations
- **Health Checks**: Monitor service health at `/health` endpoints

### Environment Setup
```bash
# Main development environment
docker compose up -d                       # All services
# OR
docker compose up postgres nats minio maildev redis  # Infrastructure only

# Database connection
psql -h localhost -p 5432 -U postgres -d clinic
```

## 🔧 TROUBLESHOOTING

### Common Issues
- **"@clinic/common not found"** → Build shared library: `yarn workspace @clinic/common build`
- **"Cannot connect to database"** → Start PostgreSQL: `docker compose up postgres`
- **"NATS connection failed"** → Start NATS: `docker compose up nats`
- **"Port already in use"** → Check running services or update ports in docker-compose.yml
- **"API calls failing"** → Ensure API Gateway running on port 4000

### Performance & Resilience
- **Frontend**: Use React.memo() for expensive components, lazy load routes
- **Backend**: Implement pagination, proper database indexing
- **NATS**: Fire-and-forget by default, use request-reply for critical ops
- **Resilience Patterns**: Circuit breakers, retry logic, timeouts, and bulkheads for fault tolerance
- **Performance Monitoring**: Real-time profiling with optimization recommendations
- **Health Monitoring**: `/resilience/health` endpoint for system status

## 📝 MANDATORY PRACTICES

### Translation System
- **Import hook**: `const { t } = useTranslation();`
- **Use translations**: `{t.section.key}` for ALL user text
- **Dynamic content**: `t.message.replace('{name}', userName)`
- **Never hardcode**: Avoid any hardcoded English strings

### Code Standards
- **TypeScript**: Strict mode, no `any` types
- **Testing**: Write tests before implementation
- **Security**: Input validation, parameterized queries, HTTPS
- **Documentation**: Self-documenting code with clear naming

### Deployment
- **Environment Variables**: Never commit secrets, use environment variables
- **Health Checks**: Implement for all services
- **Migrations**: Backward-compatible database changes
- **Monitoring**: Structured logging with correlation IDs

## 🌐 ENVIRONMENT VARIABLES

Key required variables (copy from `.env.example`):
- `POSTGRES_*` - Database connection
- `JWT_SECRET` - Authentication
- `NATS_URL` - Message broker
- `OPENAI_API_KEY` - AI features
- `TWILIO_*` - SMS notifications
- `S3_*` - File storage
- `GOOGLE_CLIENT_ID` - OAuth integration

## 📚 IMPORTANT NOTES

### Coaching Terminology
- Use "Clients" not "Patients"
- "Coaching Sessions" not "Appointments"
- "Growth Journey" not "Treatment"
- "Empowerment" not "Therapy"

### File Organization
- Each service follows NestJS module structure
- DTOs in `dto/` folders for validation
- Entities in root or dedicated folders
- Guards for JWT authentication

### Security & Compliance Features
- **🔐 Multi-Factor Authentication**: TOTP with backup codes, healthcare-grade security
- **🏥 HIPAA Compliance**: PHI data handling, audit logging, 7-year retention
- **🛡️ Advanced Encryption**: AES-256-GCM at rest, TLS 1.3 in transit, perfect forward secrecy
- **🚨 Disaster Recovery**: Automated backups, business continuity planning, RPO 15min/RTO 60minב
- **📊 Comprehensive Logging**: Centralized audit trails, structured logging, compliance reporting
- **🔒 API Security**: Rate limiting (5-100 req/min tiers), CSRF protection, security headers
- **🎯 Role-Based Access**: Granular permissions, view switching, admin impersonation with audit
- **💾 Secure Storage**: Encrypted backups, key rotation, secure session management

### Monitoring Scripts
- `./scripts/setup-monitoring.sh` - Setup Prometheus/Grafana
- `./scripts/start-monitoring.sh` - Start monitoring services
- `./scripts/test-alerts.sh` - Test alerting systems

### Production Readiness Status
- **🎉 PRODUCTION READY**: All 35 critical production tasks completed (100% complete) ✅
- **✅ Final Tasks Completed**:
  - **TEST-002**: Comprehensive integration testing infrastructure with Docker orchestration
  - **FEAT-001**: Advanced search capabilities with Elasticsearch - global search, autocomplete, faceted filtering
  - **PERF-005**: Content delivery network (CDN) with S3/CloudFront, image optimization, and caching
  - **FEAT-002**: Advanced analytics and reporting with AI insights, predictive analytics, and custom reports
- **📈 Enterprise Security Features**:
  - **Multi-layer Security Scanning**: Dependencies, code, containers, infrastructure
  - **Healthcare Threat Detection**: PHI risk assessment, HIPAA compliance monitoring
  - **Automated Security Pipeline**: GitHub Actions with daily scans and critical alerting
  - **Database Performance**: Healthcare workflow-optimized indexes and maintenance
- **🎉 ALL PRODUCTION TASKS COMPLETED** ✅
- **🏆 Enterprise Features Completed**:
  - HIPAA compliance framework with audit trails and 7-year retention
  - Multi-Factor Authentication (MFA/2FA) with TOTP and backup codes
  - Advanced data encryption (AES-256-GCM at rest, TLS 1.3 in transit)
  - Disaster recovery with automated backups and business continuity
  - Comprehensive API documentation with interactive Swagger UI
  - Database optimization with healthcare workflow-specific indexes
  - Advanced security scanning with vulnerability management and threat detection
  - **🆕 Performance profiling** with real-time monitoring and optimization recommendations
  - **🆕 Resilience patterns** with circuit breakers, retry logic, timeouts, and bulkheads
  - **🆕 Integration testing infrastructure** with Docker orchestration and healthcare-specific test suites
  - **🆕 Advanced search with Elasticsearch** providing global search, autocomplete, and faceted filtering
  - **🆕 CDN service** with S3/CloudFront integration, image optimization, and automatic caching
  - **🆕 Advanced analytics and reporting** with AI insights, predictive analytics, and custom report generation

### Security & Compliance Status
- **🛡️ Security Score**: Production-ready with comprehensive vulnerability management
- **🏥 HIPAA Compliance**: Full framework implemented with PHI protection and audit logging
- **🔍 Vulnerability Management**: Multi-layer scanning with automated threat detection
- **📊 Database Performance**: Optimized for healthcare workflows with 20+ specialized indexes
- **🤖 Automation**: GitHub Actions pipeline for security scanning and API documentation

This is a self-development coaching platform for personal growth coaches and wellness practitioners. It emphasizes empowerment, achievement tracking, and personal development - NOT mental health therapy or medical treatment.