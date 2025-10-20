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
- **AI/ML**: OpenAI GPT-5, Whisper API
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
- `cd frontend && yarn build` - Build frontend for production
- `cd frontend && yarn preview` - Preview production build
- `./scripts/test.sh` - Run tests across all workspaces
- `docker compose build <service-name>` - Rebuild specific service
- `docker compose up <service-name> --build` - Rebuild and start specific service

### Service Management
- `yarn workspace <service-name> migration:run` - Run database migrations
- `docker compose logs <service-name>` - View service logs
- `docker compose ps` - View running containers
- `docker compose up postgres nats minio maildev redis` - Infrastructure only

### Testing & Quality
- `yarn lint` - ESLint code style check
- `yarn test` - Jest unit tests across workspaces
- `yarn format` - Prettier code formatting
- `./scripts/test-e2e.sh` - Playwright E2E tests
- `./scripts/test-e2e.sh --browser firefox` - Specific browser E2E tests
- `./scripts/test-e2e.sh --headed --debug` - Debug mode E2E tests
- `yarn workspace <service-name> test` - Run tests for specific service
- `yarn workspace <service-name> test --watch` - Watch mode for development
- `npx playwright test` - Run Playwright E2E tests directly
- `npx playwright test --ui` - Run tests with Playwright UI mode

### API Documentation
- `cd services/api-gateway && npm run docs:generate` - Generate comprehensive API documentation
- `cd services/api-gateway && npm run docs:serve` - Serve documentation locally on port 8080
- `cd services/api-gateway && npm run docs:build` - Build and generate full documentation pipeline
- **Live Documentation**: `http://localhost:4000/api-docs` (development mode)

### Available Services
- **api-gateway** (port 4000) - Main entry point with WebSocket/GraphQL/REST
- **auth-service** (port 3001) - Authentication & user management
- **appointments-service** (port 3002) - Scheduling with Google Calendar sync
- **files-service** (port 3003) - File uploads & recordings (MinIO/S3)
- **notifications-service** (port 3004) - Email/SMS/WhatsApp via Twilio
- **ai-service** (port 3005) - OpenAI GPT-5 & Whisper integration
- **notes-service** (port 3006) - Session notes with rich text
- **analytics-service** (port 3007) - Advanced reporting & AI insights
- **settings-service** (port 3008) - User preferences & system config
- **billing-service** (port 3009) - Israeli VAT, Stripe/Tranzilla payments
- **search-service** (port 3010) - Elasticsearch global search & autocomplete
- **cdn-service** (port 3011) - Content delivery & image optimization
- **google-integration-service** (port 3012) - Google OAuth, Calendar & Gmail
- **therapists-service** (port 3013) - Therapist profiles & specializations
- **client-relationships-service** (port 3014) - Multi-coach client management
- **progress-service** (port 3015) - Goal tracking & achievements

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

### Infrastructure Services
- **PostgreSQL** (port 5432) - Main database with TypeORM
- **NATS** (port 4222) - Message broker for async communication
- **MinIO** (ports 9000, 9001) - S3-compatible object storage (dev)
- **MailDev** (ports 1080, 1025) - Email testing server (dev only)
- **Redis** (port 6379) - Caching layer and session storage
- **Prometheus** (port 9090) - Metrics collection (monitoring stack)
- **Grafana** (port 3000) - Dashboards and visualization (monitoring stack)
- **Elasticsearch** (port 9200) - Search engine (enhanced stack)

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

### Multi-Environment Support

**Linux/macOS:**
```bash
# Main environment (18 containers)
docker compose up -d

# Enhanced environment with AI/Search/CDN (26 containers)
docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d

# Full monitoring stack (32 containers)
docker compose -f docker-compose.yml -f docker-compose.enhanced.yml -f docker-compose.monitoring.yml up -d

# Staging environment
docker compose -f docker-compose.staging.yml up -d

# Production-ready environment
docker compose -f docker-compose.production-ready.yml up -d
```

**Windows (PowerShell/CMD):**
```bash
# Full monitoring stack (32 containers)
docker compose -f docker-compose.yml -f docker-compose.enhanced.yml -f docker-compose.monitoring.yml up -d

# Or use convenience scripts
.\scripts\complete-rebuild-all-containers.bat     # Full rebuild all containers
.\scripts\simple-rebuild.bat                      # Simple rebuild
.\scripts\production-rebuild.bat                  # Production rebuild
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
- **Multi-Factor Authentication**: TOTP with backup codes
- **Advanced Encryption**: AES-256-GCM at rest, TLS 1.3 in transit
- **HIPAA Compliance**: PHI data handling, audit logging, 7-year retention

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
- **Playwright Config**: Tests run on port 5175, supports desktop and mobile browsers
- **Jest Config**: Configured for all workspaces with jsdom environment

## 🎙️ KEY FEATURES

### Recording & AI
- **Session Recording**: WebSocket status updates, chunked uploads to MinIO/S3
- **AI Integration**: GPT-5 session summaries, Whisper transcription
- **File Support**: MP4, MOV, AVI, MP3, WAV, M4A, WebM (500MB max)
- **AI Models**: GPT-5 (primary), GPT-5-mini (cost-optimized), GPT-4-turbo (fallback)

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
- **Build Order**: Always build `@clinic/common` first before any service
- **Workspace Management**: Yarn workspaces (`services/*`, `frontend`, `libs/*`)
- **Service Dependencies**: API Gateway depends on all backend services
- **NATS Communication**: Async messaging for non-critical operations
- **Health Checks**: Monitor service health at `/health` endpoints
- **Port Allocation**:
  - Frontend (5173), API Gateway (4000)
  - Services (3001-3015)
  - Infrastructure: PostgreSQL (5432), Redis (6379), NATS (4222), MinIO (9000, 9001), MailDev (1080, 1025)
  - Monitoring: Prometheus (9090), Grafana (3000), Jaeger (16686), Elasticsearch (9200)
- **Database Migrations**: Run `yarn workspace <service-name> migration:run` after schema changes
- **Hot Reload**: Frontend auto-reloads via Vite; backend services need restart for code changes

### Environment Setup
```bash
# Main development environment
docker compose up -d                       # All services
# OR
docker compose up postgres nats minio maildev redis  # Infrastructure only

# Database connection
psql -h localhost -p 5432 -U postgres -d clinic
```

## 🔧 QUICK DIAGNOSTICS

### Check Service Health
```bash
# Check all running containers
docker compose ps

# Check specific service logs (follow mode)
docker compose logs -f <service-name>

# Check database connectivity
docker compose exec postgres pg_isready -U postgres

# Test API Gateway health
curl http://localhost:4000/health

# Test frontend
curl http://localhost:5173

# View all service health checks
docker compose ps --format json | jq '.[].Health'
```

### Fast Service Restart
```bash
# Restart specific service without rebuild
docker compose restart <service-name>

# Restart and view logs
docker compose restart <service-name> && docker compose logs -f <service-name>

# Restart all services
docker compose restart
```

## 💡 DEVELOPMENT TIPS

### Fast Iteration Workflow
1. **Backend code changes**: `docker compose restart <service-name>` (if volume-mounted, no rebuild needed)
2. **Frontend changes**: Automatic hot-reload via Vite (no action required)
3. **Shared library changes**: `yarn workspace @clinic/common build` then restart dependent services
4. **Database schema changes**: Run migrations, restart affected services
5. **Environment variable changes**: Restart specific service or `docker compose up -d`

### Debugging Individual Services
```bash
# Run service locally (outside Docker) for debugging with breakpoints
yarn workspace <service-name> start:dev

# Ensure infrastructure is running first
docker compose up postgres nats redis minio maildev -d

# Example: Debug auth-service locally
docker compose up postgres nats redis -d
yarn workspace @clinic/auth-service start:dev
```

### Platform-Specific Scripts

**Windows:**
```bash
# Full rebuild with all containers
.\scripts\complete-rebuild-all-containers.bat

# Simple rebuild
.\scripts\simple-rebuild.bat

# Production rebuild
.\scripts\production-rebuild.bat

# Full rebuild and seed database
.\scripts\full-rebuild-and-seed.bat
```

**Linux/macOS:**
```bash
# Development environment
./scripts/dev.sh

# Full rebuild and seed
./scripts/full-rebuild-and-seed.sh

# Production deployment
./scripts/production-deploy.sh

# Database backup
./scripts/backup-database.sh
```

## 🔧 TROUBLESHOOTING

### Common Issues
- **"@clinic/common not found"** → Build shared library: `yarn workspace @clinic/common build`
- **"Cannot connect to database"** → Start PostgreSQL: `docker compose up postgres`
- **"NATS connection failed"** → Start NATS: `docker compose up nats`
- **"Port already in use"** → Check running services or update ports in docker-compose.yml
- **"API calls failing"** → Ensure API Gateway running on port 4000
- **"Frontend not loading"** → Check if Vite dev server is running on port 5173
- **"Docker build failures"** → Run `docker system prune` and rebuild with `--no-cache`
- **"Service won't start"** → Check logs with `docker compose logs <service-name>`
- **"Test failures"** → Ensure all dependencies installed and @clinic/common built

### Debug Patterns
```bash
# Service won't start
docker logs clinic-app-<service-name>-1 --tail 20

# Common fixes:
# 1. Rebuild @clinic/common: yarn workspace @clinic/common build
# 2. Check environment variables in docker-compose.yml
# 3. Verify database connection: docker logs clinic-app-postgres-1

# Build failures
docker system prune -f
docker compose build --no-cache <service-name>

# Database connection issues
docker logs clinic-app-postgres-1
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "SELECT NOW();"
```

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
- `OPENAI_API_KEY` - AI features (GPT-5, Whisper)
- `TWILIO_*` - SMS notifications
- `S3_*` / `MINIO_*` - File storage
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth integration
- `STRIPE_SECRET_KEY` / `TRANZILLA_*` / `CARDCOM_*` - Payment processing

## 📚 COACHING TERMINOLOGY

**MANDATORY**: Use wellness/coaching language throughout
- Use "Clients" not "Patients"
- "Coaching Sessions" not "Appointments"
- "Growth Journey" not "Treatment"
- "Empowerment" not "Therapy"
- "Coach" not "Therapist" (except in code for backward compatibility)

## 🏗️ FILE ORGANIZATION

### Service Structure
- Each service follows NestJS module structure
- DTOs in `dto/` folders for validation
- Entities in root or dedicated folders
- Guards for JWT authentication
- Controllers, Services, Modules pattern

### Shared Library (`libs/common`)
- **MUST build first**: `yarn workspace @clinic/common build`
- Contains shared utilities, decorators, guards
- TypeORM entities, middleware, interceptors
- Security, compliance, logging utilities

## 🚀 PRODUCTION READINESS

### Enterprise Features
- **HIPAA Compliance**: PHI data handling, audit logging, 7-year retention
- **Multi-Factor Authentication**: TOTP with backup codes
- **Advanced Encryption**: AES-256-GCM at rest, TLS 1.3 in transit
- **Disaster Recovery**: Automated backups, business continuity planning
- **API Documentation**: Interactive Swagger UI, TypeScript SDK, Postman collections
- **Database Optimization**: Healthcare workflow-specific indexes
- **Security Scanning**: Multi-layer vulnerability management
- **Performance Profiling**: Real-time monitoring with optimization recommendations
- **Resilience Patterns**: Circuit breakers, retry logic, timeouts, bulkheads
- **Advanced Search**: Elasticsearch with global search, autocomplete, faceted filtering
- **CDN Service**: S3/CloudFront integration, image optimization
- **Advanced Analytics**: AI insights, predictive analytics, custom reports

### Monitoring & Observability
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Dashboards and visualization (port 3000)
- **Loki**: Log aggregation
- **Jaeger**: Distributed tracing (port 16686)
- **Elasticsearch**: Search and analytics (port 9200)

### CI/CD Pipeline
- **GitHub Actions**: Automated deployment pipeline
- **Multi-Cloud Support**: AWS, Azure, GCP deployment ready
- **Security Scanning**: Automated vulnerability detection
- **Staging Environment**: Automated staging deployment
- **Production Approval**: Manual approval gate before production

## 📖 ADDITIONAL DOCUMENTATION

For detailed information, see:
- **README.md** - Project overview and quick start
- **docs/DEPLOYMENT.md** - Deployment guide
- **docs/CLOUD_DEPLOYMENT.md** - Cloud platform instructions
- **docs/PRODUCTION_CHECKLIST.md** - Pre-deployment validation
- **docs/TROUBLESHOOTING.md** - Comprehensive troubleshooting guide
- **docs/API_DOCUMENTATION.md** - API reference
