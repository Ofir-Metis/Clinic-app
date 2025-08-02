# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🏗️ ARCHITECTURAL PRINCIPLES & CODE STANDARDS

### Core Development Standards
1. **🎯 Microservices Architecture**: All code MUST be built to scale using microservices architecture patterns with proper service isolation, event-driven communication, and independent deployability
2. **✨ Best Practices**: Implement industry best practices for best-of-breed application development including SOLID principles, clean architecture, and enterprise patterns  
3. **🎨 Material Design 3**: Strictly follow Material UI M3 design guidelines for all UI components - use the latest Material Design 3 principles for colors, typography, spacing, and component behavior

### Enterprise-Grade Code Quality Requirements

#### SOLID Principles (Mandatory)
- **Single Responsibility**: Each class/function has one reason to change
- **Open/Closed**: Open for extension, closed for modification  
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Many specific interfaces better than one general
- **Dependency Inversion**: Depend on abstractions, not concretions

#### Core Development Principles
- **DRY (Don't Repeat Yourself)**: Eliminate code duplication through proper abstraction and shared utilities
- **KISS (Keep It Simple, Stupid)**: Maintain simplicity and clarity - prefer readable code over clever code
- **YAGNI (You Aren't Gonna Need It)**: Don't build features until they're actually needed
- **Separation of Concerns**: Clear boundaries between business logic, data access, presentation, and infrastructure layers
- **Fail Fast**: Validate inputs early, fail explicitly with meaningful error messages
- **Immutability**: Prefer immutable data structures and functional programming patterns where possible

#### Architecture Patterns (Required)
- **Domain-Driven Design**: Model business domains explicitly with bounded contexts
- **CQRS**: Separate read and write operations for complex business logic
- **Event Sourcing**: Store domain events for audit trails and state reconstruction  
- **Repository Pattern**: Abstract data access behind interfaces
- **Dependency Injection**: Use DI containers for loose coupling and testability
- **Circuit Breaker**: Implement fault tolerance between services
- **Saga Pattern**: Manage distributed transactions across microservices

#### Security Standards (Non-Negotiable)
- **Zero Trust Architecture**: Never trust, always verify - authenticate and authorize every request
- **Input Validation**: Sanitize and validate all inputs at service boundaries  
- **SQL Injection Prevention**: Use parameterized queries and ORMs properly
- **XSS Protection**: Sanitize outputs and use Content Security Policy
- **HTTPS Everywhere**: All communication must be encrypted
- **JWT Security**: Proper token validation, expiration, and rotation
- **Rate Limiting**: Implement throttling to prevent abuse
- **Secrets Management**: Never hardcode secrets, use environment variables or secret managers
- **OWASP Compliance**: Follow OWASP Top 10 security guidelines

#### Performance & Scalability Standards
- **Horizontal Scaling**: Design services to scale out, not just up
- **Database Optimization**: Use proper indexing, connection pooling, and query optimization
- **Caching Strategy**: Implement multi-level caching (Redis, CDN, browser cache)
- **Lazy Loading**: Load resources only when needed
- **Pagination**: Always paginate large datasets
- **Async Processing**: Use queues for non-critical operations
- **Memory Management**: Monitor and optimize memory usage
- **Load Testing**: Performance test all critical paths

#### Testing Requirements (Mandatory)
- **Test Pyramid**: Unit tests (70%) > Integration tests (20%) > E2E tests (10%)
- **80% Code Coverage**: Minimum coverage threshold enforced
- **TDD/BDD**: Write tests first, then implementation
- **Test Isolation**: Tests must be independent and repeatable
- **Mock External Dependencies**: Use mocks for external services
- **Contract Testing**: Verify API contracts between services
- **Performance Testing**: Load and stress testing for critical components

#### Documentation Standards
- **Self-Documenting Code**: Clear variable names, function names, and structure
- **API Documentation**: OpenAPI/Swagger for all REST endpoints
- **Architecture Decision Records (ADRs)**: Document significant architectural decisions
- **README Files**: Clear setup and usage instructions for each service
- **Code Comments**: Only when explaining complex business logic or algorithms
- **Database Schema**: Document entity relationships and constraints

#### Error Handling & Observability
- **Structured Logging**: Use structured logs with correlation IDs
- **Error Classification**: Distinguish between business errors, validation errors, and system errors
- **Graceful Degradation**: System should degrade gracefully when dependencies fail
- **Health Checks**: Implement liveness and readiness probes
- **Metrics & Monitoring**: Track key business and technical metrics
- **Distributed Tracing**: Trace requests across service boundaries
- **Alerting**: Set up meaningful alerts for critical failures

### Frontend-Specific Standards

#### React Best Practices (Mandatory)
- **Functional Components**: Use hooks-based functional components exclusively
- **Custom Hooks**: Extract reusable logic into custom hooks
- **React.memo()**: Memoize expensive components to prevent unnecessary re-renders
- **useCallback/useMemo**: Optimize re-renders for complex computations and references
- **Error Boundaries**: Implement error boundaries for graceful error handling
- **Strict TypeScript**: Use strict TypeScript configuration with no `any` types
- **Component Composition**: Prefer composition over inheritance
- **Props Interface**: Define explicit TypeScript interfaces for all component props

#### State Management Standards
- **Context + Hooks**: Use React Context with useReducer for complex state
- **Immutable Updates**: Always create new state objects, never mutate existing state
- **State Normalization**: Normalize complex state structures for performance
- **Local vs Global State**: Keep state as local as possible, global only when necessary
- **State Machines**: Use state machines (XState) for complex UI workflows

#### Performance Optimization (Required)
- **Code Splitting**: Lazy load routes and components with React.lazy()
- **Bundle Analysis**: Regular bundle size analysis and optimization
- **Image Optimization**: WebP format, lazy loading, responsive images
- **Virtual Scrolling**: For large lists (1000+ items)
- **Debouncing**: Debounce search inputs and API calls
- **Service Workers**: Implement for offline capability and caching

### Backend-Specific Standards

#### NestJS Best Practices (Mandatory)
- **Module Organization**: One feature per module with clear boundaries
- **Guards**: Implement role-based and permission-based guards
- **Interceptors**: Use for logging, transformation, and error handling
- **Pipes**: Validate and transform input data at controller level
- **Exception Filters**: Centralized exception handling across services
- **Configuration Module**: Environment-based configuration management
- **Swagger Documentation**: Auto-generated API documentation for all endpoints

#### Database Standards (Critical)
- **Connection Pooling**: Configure appropriate pool sizes for production
- **Query Optimization**: Use EXPLAIN ANALYZE for query performance tuning
- **Indexing Strategy**: Create indexes for all frequently queried columns
- **Migration Strategy**: Backward-compatible migrations with rollback plans
- **Data Validation**: Database-level constraints AND application-level validation
- **Audit Trails**: Track who, what, when, where for critical data changes
- **Soft Deletes**: Use soft deletes for data integrity and audit requirements

#### API Design Standards (Non-Negotiable)
- **REST Principles**: Follow REST maturity model level 2-3
- **HTTP Status Codes**: Proper use of 2xx, 4xx, 5xx status codes
- **API Versioning**: Version APIs with backward compatibility strategy
- **Rate Limiting**: Implement per-user and per-endpoint rate limits
- **Request/Response Validation**: Validate all inputs and outputs with DTOs
- **Pagination**: Consistent pagination across all list endpoints
- **HATEOAS**: Include relevant links in API responses where applicable

### Development Workflow Standards

#### Git & Version Control (Mandatory)
- **Conventional Commits**: Use conventional commit format for automated changelogs
- **Feature Branches**: One feature per branch with descriptive names
- **Pull Request Reviews**: Mandatory code reviews before merging
- **Merge Strategy**: Squash and merge for clean commit history
- **Git Hooks**: Pre-commit hooks for linting and testing
- **Branch Protection**: Protect main/develop branches with required checks
- **Semantic Versioning**: Follow semver for all package releases

#### CI/CD Standards (Required)
- **Automated Testing**: All tests must pass before deployment
- **Code Quality Gates**: SonarQube or similar for code quality metrics
- **Security Scanning**: Automated vulnerability scanning in CI pipeline
- **Environment Promotion**: Dev → Staging → Production deployment pipeline
- **Blue-Green Deployment**: Zero-downtime deployments for production
- **Rollback Strategy**: Automated rollback capability for failed deployments
- **Infrastructure as Code**: All infrastructure defined in code (Terraform/CDK)

#### Monitoring & Observability (Critical)
- **Application Metrics**: Track business KPIs and technical metrics
- **Log Aggregation**: Centralized logging with structured log format
- **Distributed Tracing**: End-to-end request tracing across services
- **Error Tracking**: Real-time error tracking and alerting (Sentry/Bugsnag)
- **Performance Monitoring**: APM tools for performance insights
- **Uptime Monitoring**: Synthetic monitoring for critical user journeys
- **Dashboard Creation**: Business and technical dashboards for stakeholders

### Code Review Standards

#### Review Checklist (Every PR Must Address)
- **Functionality**: Does the code do what it's supposed to do?
- **Design Patterns**: Are appropriate design patterns used?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security vulnerabilities?
- **Testability**: Is the code easily testable?
- **Maintainability**: Is the code easy to understand and modify?
- **Documentation**: Is the code self-documenting with clear naming?
- **Standards Compliance**: Does it follow our architectural guidelines?

#### Review Process
- **Author Checklist**: Self-review before requesting review
- **Reviewer Assignment**: At least one senior developer review required
- **Response Time**: Reviews completed within 24 hours
- **Constructive Feedback**: Focus on code, not the person
- **Learning Opportunity**: Use reviews as teaching moments
- **Approval Criteria**: All comments resolved before approval

### Technology Stack Decisions

#### Approved Technologies (Use These)
- **Backend**: NestJS 10.x, TypeORM, PostgreSQL 15, Redis 7, NATS 2
- **Frontend**: React 18.x, TypeScript 5.3.x, Material-UI 5.x, Vite 4.x
- **Testing**: Jest 29.x, React Testing Library, Supertest, Playwright
- **Infrastructure**: Docker, Docker Compose, AWS/GCP
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **CI/CD**: GitHub Actions, ArgoCD, Helm
- **AI/ML**: OpenAI GPT-4, Whisper API
- **Storage**: MinIO (S3-compatible), AWS S3
- **Payments**: Stripe, Tranzilla, CardCom (Israeli compliance)

#### Technology Evaluation Criteria
Before adopting new technologies, evaluate:
- **Community Support**: Active community and long-term viability
- **Learning Curve**: Team's ability to adopt and maintain
- **Integration**: How well it integrates with existing stack
- **Performance**: Impact on application performance
- **Security**: Security track record and best practices
- **Cost**: Licensing and operational costs
- **Maintenance**: Long-term maintenance requirements

## 📋 Scripts Reference

### Development & Setup Scripts
- `scripts/setup.sh` - Complete project initialization and setup
- `scripts/dev.sh` - Start all services for development using Docker Compose
- `scripts/setup-storage.sh` - Configure MinIO/S3 storage buckets and policies
- `scripts/init-database.sh` - Initialize database schemas and basic data
- `scripts/init-storage.sh` - Initialize storage containers and file system

### Testing & Quality Scripts
- `scripts/test.sh` - Run linting and tests across all workspaces with environment setup
- `scripts/test-e2e.sh` - Comprehensive E2E testing with Playwright (cross-browser support)

### Monitoring & Operations Scripts
- `scripts/setup-monitoring.sh` - Configure Prometheus, Grafana, and Alertmanager stack
- `scripts/start-monitoring.sh` - Start monitoring services (Prometheus, Grafana)
- `scripts/monitor-health.sh` - Check health status of all services
- `scripts/monitor-performance.sh` - Generate performance monitoring report
- `scripts/test-alerts.sh` - Test alerting systems and notification channels

### Database & Maintenance Scripts
- `scripts/backup-database.sh` - Create database backups with rotation
- `scripts/check-database-health.sh` - Verify database connectivity and performance
- `scripts/database-maintenance.sh` - Database cleanup and maintenance tasks
- `scripts/migrate.sh` - Run database migrations across all services

### Admin Management Scripts
- `scripts/create-admin.sh` - Create admin users (recommended method)
- `scripts/create-admin.js` - Node.js script for admin user creation
- `scripts/seed-admin.sql` - SQL script for fallback admin creation

### Script Usage Examples

```bash
# Complete development setup
./scripts/setup.sh
./scripts/dev.sh

# Run comprehensive testing
./scripts/test.sh                          # Unit/integration tests
./scripts/test-e2e.sh                      # Full E2E test suite
./scripts/test-e2e.sh --browser firefox    # Specific browser testing
./scripts/test-e2e.sh --headed --debug     # Debug mode with browser UI

# Database operations
./scripts/check-database-health.sh         # Health check
./scripts/backup-database.sh               # Create backup
DATABASE_HOST=localhost ./scripts/init-database.sh  # Initialize with custom host

# Admin user creation
./scripts/create-admin.sh admin@clinic.com SecurePassword123
node scripts/create-admin.js admin@clinic.com SecurePassword123

# Monitoring setup
./scripts/setup-monitoring.sh              # Setup monitoring stack
./scripts/start-monitoring.sh              # Start monitoring services
./scripts/test-alerts.sh                   # Test alert configuration
```

## Development Commands

### Build and Development
- `./scripts/dev.sh` - Start all services using Docker Compose
- `docker compose up --build` - Alternative to start all services
- `yarn workspace @clinic/common build` - Build shared common library (required first)
- `yarn workspace <service-name> start:dev` - Run individual service in development mode
- `cd frontend && yarn dev` - Run frontend development server on port 5173
- `docker compose up postgres nats minio maildev redis` - Start infrastructure services only

### Testing and Quality
- `./scripts/test.sh` - Run linting and tests across all workspaces
- `yarn lint` - Run ESLint across all workspaces  
- `yarn test` - Run Jest tests across all workspaces
- `yarn workspace <service-name> test` - Run tests for specific service
- `yarn format` - Format code with Prettier

### Individual Service Commands
- `yarn workspace <service-name> build` - Build specific service
- `yarn workspace <service-name> start` - Start service in production mode
- `yarn workspace <service-name> migration:generate` - Generate new TypeORM migration
- `yarn workspace <service-name> migration:run` - Run pending migrations
- `yarn workspace <service-name> migration:revert` - Revert last migration
- Services include: auth-service, appointments-service, files-service, notifications-service, ai-service, notes-service, analytics-service, settings-service, therapists-service, billing-service, google-integration-service, api-gateway

### Debugging and Development
- `docker compose logs <service-name>` - View logs for specific service
- `docker compose logs -f` - Follow all service logs in real-time
- `yarn workspace <service-name> start:debug` - Start service with debugging enabled
- Database connection via `psql -h localhost -p 5432 -U postgres -d clinic_db`

## Architecture Overview

This is a microservices-based clinic management application with the following structure:

### Core Architecture
- **Frontend**: React + Vite + Material-UI (port 5173)
- **API Gateway**: NestJS gateway (port 4000) - main entry point
- **Backend Services**: NestJS microservices communicating via NATS
- **Database**: PostgreSQL (port 5432)
- **File Storage**: MinIO S3-compatible storage (port 9000)
- **Email**: MailDev for development (port 1080/1025)
- **Message Broker**: NATS (port 4222)
- **Cache**: Redis (port 6379)

### Service Structure
```
services/
├── api-gateway/              # Main API gateway (port 4000)
├── auth-service/             # Authentication & user management (port 3001)
├── appointments-service/     # Scheduling & appointments (port 3002)
├── files-service/            # File upload & management (port 3003)
├── notifications-service/    # Notifications & messaging (port 3004)
├── ai-service/              # OpenAI integration (port 3005)
├── notes-service/           # Session notes (port 3006)
├── analytics-service/       # Analytics & reporting (port 3007)
├── settings-service/        # User settings (port 3008)
├── billing-service/         # Israeli billing & payments (port 3009)
├── therapists-service/      # Therapist profiles
├── google-integration-service/ # Google Calendar/Gmail integration
├── client-relationships-service/ # Client-coach relationships
└── progress-service/        # Progress tracking & goals
```

### Key Dependencies
- **@clinic/common**: Shared utilities (build this first)
- **NATS**: Message broker for inter-service communication
- **TypeORM**: Database ORM with PostgreSQL
- **JWT**: Authentication across services
- **Twilio**: SMS notifications
- **OpenAI**: AI assistant features
- **Redis**: Session caching and queue management
- **MinIO**: S3-compatible file storage
- **Google APIs**: Calendar and Gmail integration
- **Israeli Payment Processors**: Tranzilla, CardCom for local compliance

## Important Development Notes

### Prerequisites
- Node.js 20+ (use `nvm install 20 && nvm use 20`)
- Yarn package manager
- Docker and Docker Compose
- Environment variables from `.env` file (copy from `.env.example`)

### Common Development Workflow
1. Build shared library: `yarn workspace @clinic/common build`
2. Start infrastructure: `docker compose up postgres nats minio maildev redis`
3. Start services: `./scripts/dev.sh` or individual services
4. Frontend development: `cd frontend && yarn dev`
5. For testing: `./scripts/test.sh` - includes environment setup and runs tests across all workspaces

### Testing Requirements
- All services have Jest test suites
- 80% code coverage threshold enforced
- Tests require specific environment variables (see scripts/test.sh)
- Use `yarn workspace <service> test` for individual service testing

### Service Communication
- Services communicate via NATS message broker
- API Gateway aggregates all services into single GraphQL endpoint
- JWT tokens passed between services for authentication
- Each service has health check endpoints at `/health`

### Database & Migrations
- PostgreSQL database shared across services
- TypeORM entities defined per service
- Migration commands available per service (e.g., `yarn workspace auth-service migration:run`)

### File Structure Patterns
- Each service follows NestJS module structure
- DTOs in `dto/` folders for request/response validation
- Entities in root or dedicated folders
- Controllers handle HTTP/GraphQL endpoints
- Services contain business logic
- Guards for JWT authentication where needed

### Critical Development Patterns
- **Shared Library First**: Always build `@clinic/common` before any service development
- **Environment Variables**: Copy `.env.example` to `.env` and configure all required variables
- **Service Dependencies**: API Gateway depends on all backend services; start infrastructure first
- **Database Sync**: TypeORM synchronization is enabled - entities auto-create tables
- **NATS Communication**: Services use async messaging for non-critical operations
- **JWT Flow**: Frontend → API Gateway → Service (JWT passed through headers)
- **Health Checks**: All services expose `/health` endpoints for monitoring
- **Error Handling**: Consistent exception filters across all services via @clinic/common
- **File Uploads**: Chunked upload system with MinIO storage for recordings and documents
- **AI Integration**: OpenAI GPT-4 for session summaries and Whisper for transcription
- **Recording System**: WebSocket-based recording status updates with S3 storage
- **Internationalization**: Mandatory translation system for all user-visible text
- **Israeli Compliance**: VAT, CTC, and local payment processor integration

## 🎙️ Recording & AI Features

### Session Recording System
- **WebSocket Integration**: Real-time recording status updates via Socket.IO
- **Chunked Upload**: Large file support with resumable uploads to MinIO/S3
- **Supported Formats**: MP4, MOV, AVI, MP3, WAV, M4A, WebM
- **File Size Limits**: Configurable up to 500MB per recording
- **Storage Strategy**: MinIO for development, S3 for production

### AI-Powered Features
- **Session Summaries**: GPT-4 powered analysis and insights
- **Transcription**: Whisper API for accurate speech-to-text
- **Real-time Processing**: Background processing with NATS messaging
- **Session Analysis**: Advanced coaching insights and recommendations

### Google Integration
- **Calendar Sync**: Two-way sync with Google Calendar
- **Gmail Integration**: Automated email communications
- **OAuth Flow**: Secure Google account connection
- **Webhook Support**: Real-time updates from Google services

## 🏠 Client Portal Architecture

### Client-Facing Features
The application includes a comprehensive client portal with dedicated pages and functionality:

#### Client Dashboard & Progress
- **ClientDashboard.tsx**: Personal growth dashboard with achievements and progress tracking
- **ClientGoals.tsx**: Goal setting and milestone tracking for personal development
- **ClientAchievements.tsx**: Achievement display with motivational progress indicators
- **ClientProgressSharing.tsx**: Share progress updates with coaches and support network

#### Booking & Scheduling System
- **ClientBookingSystem.tsx**: Self-service session booking with coach availability
- **ClientAppointments.tsx**: View and manage upcoming coaching sessions
- **CoachDiscovery.tsx**: Find and connect with available coaches based on specialization

#### Onboarding & Account Management
- **ClientOnboardingPage.tsx**: Guided onboarding flow for new clients
- **ClientLoginPage.tsx**: Dedicated client authentication portal
- **ClientRegisterPage.tsx**: Client registration with intake forms
- **ClientInvitations.tsx**: Handle coach invitations and relationship requests

#### Client-Coach Relationship Management
- **Client-Coach Relationships**: Managed via `client-relationships-service`
- **Shared Goals**: Collaborative goal setting between clients and coaches
- **Progress Tracking**: Real-time progress updates and milestone celebrations
- **Achievement System**: Gamified progress with coaching-focused terminology

### Client Portal Access
- **URL Pattern**: `/client/*` routes for all client features
- **Authentication**: Separate client authentication flow with JWT
- **Role-Based Access**: Client-specific permissions and data isolation
- **Mobile-First Design**: Optimized for mobile client usage

### Client Portal Development Patterns
```typescript
// Client portal components use coaching terminology
// Never use medical terms - always empowerment-focused language

// Example: Client Goal Component
import { useTranslation } from '../contexts/LanguageContext';

const ClientGoal = () => {
  const { t } = useTranslation();
  
  return (
    <Card>
      <Typography variant="h5">
        {t.clientPortal.goals.title} // "Your Growth Goals"
      </Typography>
      <Typography variant="body1">
        {t.clientPortal.goals.subtitle} // "Track your transformation journey"
      </Typography>
    </Card>
  );
};
```

## 👑 Admin Dashboard Features

### Administrative Interface
The application includes a comprehensive admin dashboard for system management and oversight:

#### System Management Pages
- **AdminDashboardPage.tsx**: Central admin hub with system metrics and quick actions
- **ConfigurationManagementPage.tsx**: System-wide configuration and feature toggles
- **ApiManagementPage.tsx**: API key management and rate limiting configuration
- **SecuritySettingsPage.tsx**: Advanced security configuration and access controls

#### User & Subscription Management
- **InvitationManagementPage.tsx**: Manage coach and client invitations
- **SubscriptionManagementPage.tsx**: Handle billing, subscriptions, and payment plans
- **TherapistBillingPage.tsx**: Coach billing management and payout systems

#### Data & Compliance
- **BackupManagementPage.tsx**: Database backup scheduling and restoration
- **ComplianceAuditPage.tsx**: Compliance reporting and audit trail management
- **LogViewer.tsx**: System log analysis and troubleshooting interface

#### Monitoring & Health
- **SystemHealthOverview.tsx**: Real-time system health monitoring
- **SystemMetrics.tsx**: Performance metrics and resource utilization
- **SystemSettings.tsx**: Core system configuration and maintenance

### Admin Dashboard Access & Security
- **URL Pattern**: `/admin/*` routes for all administrative features
- **Authentication**: Admin-only JWT authentication with elevated permissions
- **Role Hierarchy**: Multiple admin levels with different access permissions
- **Audit Logging**: All admin actions are logged for compliance

### Admin Component Architecture
```typescript
// Admin components require special authentication and logging
import { useAdminData } from '../hooks/useAdminData';
import { useViewSwitching } from '../hooks/useViewSwitching';

const AdminDashboard = () => {
  const { systemMetrics, users, loading } = useAdminData();
  const { switchToUser, currentView } = useViewSwitching();
  
  return (
    <AdminLayout>
      <SystemHealthOverview metrics={systemMetrics} />
      <UserManagement 
        users={users} 
        onImpersonate={switchToUser}
      />
    </AdminLayout>
  );
};
```

### View Switching & Impersonation
The admin system includes sophisticated user impersonation capabilities:

- **View Switching**: Admin can switch between admin and user views
- **User Impersonation**: Debug user issues by viewing as that user
- **Audit Trail**: All view switches are logged for security
- **Session Management**: Secure session handling during impersonation

### Admin Database Service
The admin system uses dedicated database entities and repositories:

```typescript
// Admin entities in services/api-gateway/src/admin/entities/
- admin-user.entity.ts        // Admin user management
- api-key.entity.ts          // API key management
- audit-event.entity.ts      // Audit logging
- backup-job.entity.ts       // Backup management
- system-alert.entity.ts     // System alerting
- system-config.entity.ts    // Configuration management
```

### Admin Development Patterns
- **Security First**: All admin components require authentication guards
- **Audit Everything**: Admin actions must be logged via audit service
- **Error Boundaries**: Admin interface has comprehensive error handling
- **Progressive Enhancement**: Admin features degrade gracefully if services are down

## 🧪 Testing Infrastructure

### E2E Testing with Playwright
The application includes comprehensive end-to-end testing with cross-browser support:

#### Test Configuration
- **Playwright Config**: `playwright.config.ts` with multi-browser setup
- **Test Environment**: Isolated Docker environment with `docker-compose.test.yml`
- **Cross-Browser Testing**: Chrome, Firefox, Safari, and mobile device simulation
- **Visual Regression**: Screenshot comparison and responsive design testing

#### Test Execution Scripts
```bash
# Run full E2E test suite
./scripts/test-e2e.sh

# Browser-specific testing
./scripts/test-e2e.sh --browser firefox
./scripts/test-e2e.sh --browser webkit     # Safari
./scripts/test-e2e.sh --browser chromium

# Debug mode with browser UI
./scripts/test-e2e.sh --headed --debug

# Test specific functionality
./scripts/test-e2e.sh --grep "authentication"
./scripts/test-e2e.sh --grep "patient-management"
```

#### Test Organization
```
tests/
├── auth.spec.ts                 # Authentication flows
├── appointment-scheduling.spec.ts # Booking and scheduling
├── patient-management.spec.ts   # Patient/client management
├── navigation.spec.ts           # Navigation and routing
├── responsive-design.spec.ts    # Mobile responsiveness
├── cross-browser.spec.ts        # Cross-browser compatibility
├── fixtures/
│   ├── auth-helpers.ts         # Authentication test helpers
│   └── test-data.ts           # Test data factories
└── README.md                   # Test documentation
```

### Unit & Integration Testing

#### Jest Configuration
- **Multi-Project Setup**: Jest configured for frontend and all backend services
- **Coverage Threshold**: 80% minimum coverage enforced across all workspaces
- **Environment Setup**: `scripts/test.sh` handles environment variable setup
- **Mocking Strategy**: External services mocked for reliable testing

#### Frontend Testing Setup
```typescript
// Frontend test configuration in frontend/jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### Backend Service Testing
Each microservice includes comprehensive test suites:

```bash
# Run tests for specific service
yarn workspace auth-service test
yarn workspace appointments-service test
yarn workspace ai-service test

# Run tests with coverage
yarn workspace auth-service test --coverage

# Run tests in watch mode for development
yarn workspace auth-service test --watch
```

### Test Environment Management

#### Environment Variables for Testing
The test environment requires specific variables set by `scripts/test.sh`:

```bash
# Test-specific environment setup
export OPENAI_API_KEY=test-key
export TWILIO_ACCOUNT_SID=AC00000000000000000000000000000000
export TWILIO_AUTH_TOKEN=twilio-dev-token
export NODE_ENV=test
```

#### Docker Test Environment
- **Isolated Testing**: `docker-compose.test.yml` provides clean test environment
- **Database Seeding**: Fresh database with test data for each run
- **Service Mocking**: External APIs mocked for consistent testing
- **Parallel Execution**: Tests can run in parallel without conflicts

### Test Data Management

#### Test Fixtures and Helpers
```typescript
// tests/fixtures/auth-helpers.ts
export const createTestUser = async (page: Page) => {
  await page.goto('/auth');
  await page.fill('[data-testid=email]', 'test@clinic.com');
  await page.fill('[data-testid=password]', 'testpassword');
  await page.click('[data-testid=login-button]');
  await page.waitForURL('/dashboard');
};

// tests/fixtures/test-data.ts
export const testAppointment = {
  patientName: 'John Doe',
  appointmentTime: '2024-08-15T10:00:00Z',
  type: 'Coaching Session',
  status: 'scheduled',
};
```

### Testing Best Practices

#### Component Testing Patterns
```typescript
// Example component test with translation system
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '../contexts/LanguageContext';
import ClientDashboard from './ClientDashboard';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <LanguageProvider>
      {component}
    </LanguageProvider>
  );
};

test('displays client dashboard with translations', () => {
  renderWithProviders(<ClientDashboard />);
  expect(screen.getByText('Your Growth Dashboard')).toBeInTheDocument();
});
```

#### API Testing Patterns
```typescript
// Backend service testing with Supertest
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('Appointments API', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('creates appointment with valid data', async () => {
    return request(app.getHttpServer())
      .post('/appointments')
      .send(testAppointmentData)
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.status).toBe('scheduled');
      });
  });
});
```

### Continuous Integration Testing
- **GitHub Actions**: Automated testing on pull requests
- **Parallel Test Execution**: Tests run in parallel for faster feedback
- **Test Result Reporting**: Detailed test reports and coverage analysis
- **Failure Notifications**: Immediate notification on test failures

## 🔐 Security & Admin Management

### Admin User Creation
Multiple secure methods are available for creating admin users:

#### Method 1: Admin Creation Script (Recommended)
```bash
# Create admin user via shell script
./scripts/create-admin.sh admin@clinic.com SecurePassword123

# With custom role and permissions
./scripts/create-admin.sh admin@clinic.com SecurePassword123 super-admin
```

#### Method 2: Node.js Admin Script
```bash
# Create admin user via Node.js script
node scripts/create-admin.js admin@clinic.com SecurePassword123

# For development environment
NODE_ENV=development node scripts/create-admin.js dev-admin@clinic.com DevPassword123
```

#### Method 3: Direct SQL (Fallback)
```bash
# Use SQL script for emergency admin creation
psql -h localhost -p 5432 -U postgres -d clinic -f scripts/seed-admin.sql

# Or connect and run manually
psql -h localhost -p 5432 -U postgres -d clinic
\i scripts/seed-admin.sql
```

### Advanced Security Features

#### View Switching & Impersonation
Secure admin impersonation system for troubleshooting:

```typescript
// View switching implementation
import { useViewSwitching } from '../hooks/useViewSwitching';

const AdminUserManagement = () => {
  const { switchToUser, currentView, originalAdmin } = useViewSwitching();
  
  const handleImpersonate = async (userId: string) => {
    // All view switches are logged for audit
    await switchToUser(userId);
    // Admin can now see the application as this user
  };
  
  const returnToAdmin = () => {
    // Return to original admin view
    switchToUser(originalAdmin.id);
  };
};
```

#### API Key Management
Comprehensive API access control system:

- **API Key Generation**: Secure key generation with expiration
- **Rate Limiting**: Per-key rate limiting and usage tracking
- **Scope Control**: Fine-grained permission scopes per API key
- **Usage Analytics**: Detailed API usage monitoring and reporting

#### Audit Logging System
All administrative actions are logged for compliance:

```typescript
// Audit logging entities
interface AuditEvent {
  id: string;
  adminId: string;
  action: string;          // 'VIEW_SWITCH', 'USER_CREATE', 'CONFIG_CHANGE'
  targetUserId?: string;   // For user-related actions
  metadata: object;        // Action-specific details
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}
```

### Security Configuration

#### JWT Security Implementation
- **Token Expiration**: Configurable token expiration times
- **Token Rotation**: Automatic token refresh for active sessions
- **Secure Headers**: HTTPS-only, secure cookie settings
- **CSRF Protection**: Cross-site request forgery protection

#### Role-Based Access Control (RBAC)
```typescript
// Role hierarchy implementation
enum UserRole {
  CLIENT = 'client',
  COACH = 'coach', 
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Permission-based guards
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  // Admin-only endpoints
}
```

#### Security Configuration Management
- **Security Settings Page**: Web interface for security configuration
- **Password Policies**: Configurable password complexity requirements
- **Session Management**: Session timeout and concurrent session limits
- **Two-Factor Authentication**: TOTP-based 2FA for admin accounts

### Database Security

#### Connection Security
- **Connection Pooling**: Secure database connection management
- **Encrypted Connections**: SSL/TLS encryption for database connections
- **Credential Management**: Environment-based credential configuration
- **Query Protection**: Parameterized queries and SQL injection prevention

#### Data Encryption
```typescript
// Sensitive data encryption
import { encrypt, decrypt } from '@clinic/common/encryption';

// Personal data encryption
const encryptedData = encrypt(sensitiveUserData);
const decryptedData = decrypt(encryptedData);

// File encryption for stored recordings
const encryptedRecording = await encryptFile(recordingBuffer);
```

### Monitoring & Alerting

#### Security Monitoring
- **Failed Login Attempts**: Automatic lockout after failed attempts
- **Suspicious Activity**: Automated detection of unusual patterns
- **Real-time Alerts**: Immediate notification of security events
- **Compliance Reporting**: Regular security and compliance reports

#### Health Check Security
```typescript
// Secure health check endpoints
@Controller('health')
export class HealthController {
  @Get()
  @UseGuards(InternalApiGuard) // Only accessible internally
  async check(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      timestamp: new Date(),
      services: await this.checkServices(),
    };
  }
}
```

### Production Security Checklist

#### Environment Security
- [ ] All secrets stored in environment variables or secret managers
- [ ] JWT secrets are cryptographically secure (256+ bits)
- [ ] Database passwords are strong and rotated regularly
- [ ] API keys for external services are properly secured
- [ ] HTTPS enabled for all production endpoints

#### Application Security
- [ ] Input validation on all endpoints
- [ ] Output encoding to prevent XSS
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Error messages don't leak sensitive information

#### Infrastructure Security
- [ ] Database access restricted to application servers
- [ ] Network segmentation between services
- [ ] Regular security updates applied
- [ ] Backup encryption enabled
- [ ] Log rotation and secure storage configured

### Incident Response

#### Security Incident Procedures
1. **Detection**: Automated monitoring detects security events
2. **Alerting**: Immediate notification to admin team
3. **Response**: Predefined response procedures activated
4. **Recovery**: System restoration and security hardening
5. **Review**: Post-incident analysis and improvement

#### Emergency Admin Access
```bash
# Emergency admin creation for system recovery
DATABASE_URL=postgresql://... node scripts/create-admin.js emergency@clinic.com TempPassword123!

# Reset all user sessions in emergency
redis-cli FLUSHDB

# Disable specific user account
psql -d clinic -c "UPDATE users SET is_active = false WHERE email = 'suspicious@user.com';"
```

## ⚛️ Frontend Architecture Patterns

### Component Organization & Structure
The frontend follows a structured approach with clear separation of concerns:

#### Page Components
```
frontend/src/pages/
├── client/                    # Client portal pages
│   ├── ClientDashboard.tsx    # Main client dashboard
│   ├── ClientBookingSystem.tsx # Booking interface
│   ├── ClientGoals.tsx        # Goal management
│   └── CoachDiscovery.tsx     # Find coaches
├── admin/                     # Admin management pages
│   ├── AdminDashboardPage.tsx # Admin overview
│   ├── BackupManagementPage.tsx # System backups
│   └── SecuritySettingsPage.tsx # Security config
└── [other pages]             # General application pages
```

#### Reusable Components
```
frontend/src/components/
├── appointments/              # Appointment-related components
│   └── MeetingTypeToggle.tsx # Meeting type selection
├── google/                   # Google integration components
│   ├── GoogleAccountConnection.tsx
│   ├── GoogleIntegrationSettings.tsx
│   └── GoogleOAuthCallback.tsx
├── progress/                 # Progress tracking
│   └── ProgressDashboard.tsx
├── session-summary/          # AI session analysis
│   ├── SessionSummaryCard.tsx
│   └── SessionSummaryList.tsx
└── admin/                    # Admin-specific components
    ├── LogViewer.tsx
    ├── SystemHealthOverview.tsx
    └── UserManagement.tsx
```

### Custom Hooks Architecture

#### Core Application Hooks
```typescript
// Custom hooks for complex functionality
import { useGoogleIntegration } from '../hooks/useGoogleIntegration';
import { useViewSwitching } from '../hooks/useViewSwitching';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAdminData } from '../hooks/useAdminData';

// Example: Google Integration Hook
const MyComponent = () => {
  const { 
    isConnected, 
    connectAccount, 
    syncCalendar, 
    permissions 
  } = useGoogleIntegration();
  
  const handleConnect = async () => {
    await connectAccount(['calendar', 'gmail']);
    await syncCalendar();
  };
};
```

#### Hook Patterns
- **useGoogleIntegration**: Google Workspace integration management
- **useViewSwitching**: Admin impersonation capabilities
- **useWebSocket**: Real-time updates for recordings and notifications
- **useAdminData**: Admin dashboard data fetching and management

### Service Layer Architecture

#### Frontend Services
```typescript
// Service layer for complex operations
import { RecordingService } from '../services/RecordingService';
import { WebSocketService } from '../services/WebSocketService';
import { sessionAnalysisService } from '../services/sessionAnalysisService';

// Recording service with chunked uploads
const recordingService = new RecordingService({
  endpoint: '/api/recordings',
  chunkSize: 1024 * 1024, // 1MB chunks
  maxFileSize: 500 * 1024 * 1024, // 500MB max
});

// WebSocket service for real-time updates
const wsService = new WebSocketService({
  url: 'ws://localhost:4000',
  reconnect: true,
  maxReconnectAttempts: 5,
});
```

### State Management Patterns

#### Context-Based State Management
```typescript
// Language context for internationalization
import { LanguageContext, useTranslation } from '../contexts/LanguageContext';

const App = () => {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/client/*" element={<ClientRoutes />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
};

// Usage in components
const MyComponent = () => {
  const { t, currentLanguage, changeLanguage } = useTranslation();
  
  return (
    <Typography>
      {t.dashboard.welcome} {/* Translated text */}
    </Typography>
  );
};
```

#### Component State Patterns
```typescript
// State management for complex components
import React, { useState, useEffect, useCallback } from 'react';

const ClientBookingSystem = () => {
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Memoized callbacks for performance
  const handleCoachSelect = useCallback((coach) => {
    setSelectedCoach(coach);
    fetchAvailableSlots(coach.id);
  }, []);
  
  // Effect for data fetching
  useEffect(() => {
    fetchCoaches();
  }, []);
};
```

### Routing & Navigation Architecture

#### Route Organization
```typescript
// Route structure with role-based access
import { ClientPrivateRoute } from '../components/ClientPrivateRoute';
import { PrivateRoute } from '../components/PrivateRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/client/login" element={<ClientLoginPage />} />
      
      {/* Client-only routes */}
      <Route path="/client/*" element={
        <ClientPrivateRoute>
          <ClientRoutes />
        </ClientPrivateRoute>
      } />
      
      {/* Admin/Coach routes */}
      <Route path="/admin/*" element={
        <PrivateRoute requiredRole="admin">
          <AdminRoutes />
        </PrivateRoute>
      } />
    </Routes>
  );
};
```

#### Layout Components
```typescript
// Layout components for different user types
import { MainLayout } from '../layouts/MainLayout';
import { WellnessLayout } from '../layouts/WellnessLayout';

// Coach/Admin layout with full navigation
const CoachDashboard = () => (
  <MainLayout>
    <DashboardContent />
  </MainLayout>
);

// Client layout with wellness-focused design
const ClientDashboard = () => (
  <WellnessLayout>
    <ClientDashboardContent />
  </WellnessLayout>
);
```

### API Integration Patterns

#### Axios Configuration & Error Handling
```typescript
// API configuration with interceptors
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);
```

#### API Service Functions
```typescript
// API service functions with TypeScript
export const appointmentsApi = {
  getAppointments: async (): Promise<Appointment[]> => {
    const response = await apiClient.get('/appointments');
    return response.data;
  },
  
  createAppointment: async (data: CreateAppointmentDto): Promise<Appointment> => {
    const response = await apiClient.post('/appointments', data);
    return response.data;
  },
  
  updateAppointment: async (id: string, data: UpdateAppointmentDto): Promise<Appointment> => {
    const response = await apiClient.put(`/appointments/${id}`, data);
    return response.data;
  },
};
```

### Performance Optimization Patterns

#### Code Splitting & Lazy Loading
```typescript
// Route-based code splitting
import { lazy, Suspense } from 'react';

const ClientDashboard = lazy(() => import('../pages/client/ClientDashboard'));
const AdminDashboard = lazy(() => import('../pages/AdminDashboardPage'));

const AppRoutes = () => (
  <Routes>
    <Route path="/client/dashboard" element={
      <Suspense fallback={<CircularProgress />}>
        <ClientDashboard />
      </Suspense>
    } />
  </Routes>
);
```

#### Component Memoization
```typescript
// Memoized components for performance
import React, { memo, useMemo, useCallback } from 'react';

const SessionSummaryCard = memo(({ session, onUpdate }) => {
  // Memoized computed values
  const formattedDate = useMemo(() => 
    new Date(session.date).toLocaleDateString(), 
    [session.date]
  );
  
  // Memoized callbacks
  const handleUpdate = useCallback(() => {
    onUpdate(session.id);
  }, [session.id, onUpdate]);
  
  return (
    <Card>
      <Typography>{formattedDate}</Typography>
      <Button onClick={handleUpdate}>Update</Button>
    </Card>
  );
});
```

### Error Handling & Loading States

#### Error Boundary Implementation
```typescript
// Global error boundary for error handling
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
    // Send error to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

#### Loading State Management
```typescript
// Consistent loading state patterns
const useAsyncOperation = (asyncFn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);
  
  return { loading, error, data, execute };
};
```

## 🎨 Wellness-Focused Design System

This clinic management app uses a comprehensive design system tailored for self-development coaches and personal growth professionals. The design emphasizes empowerment, transformation, achievement, and inspirational guidance while maintaining professional credibility.

### 🎨 Material Design 3 Color System & Psychology

#### M3 Color Tokens & Wellness Theme
Following Material Design 3's dynamic color system with empowerment-focused palette:

##### Primary Color System (Trust & Empowerment)
- **Primary**: `#2E7D6B` - Deep teal representing trust, empowerment, and growth
- **On Primary**: `#FFFFFF` - High contrast text on primary
- **Primary Container**: `#4A9B8A` - For primary contained buttons and selection states
- **On Primary Container**: `#1F5A4E` - Text on primary container
- **Primary Fixed**: `#A4F4E7` - Fixed primary for accessibility
- **Primary Fixed Dim**: `#88D8CB` - Dimmed primary fixed

##### Secondary Color System (Wisdom & Personal Growth) 
- **Secondary**: `#8B5A87` - Muted purple for wisdom and personal development
- **On Secondary**: `#FFFFFF` - High contrast text on secondary
- **Secondary Container**: `#A47BA0` - For secondary actions and highlights
- **On Secondary Container**: `#6B446A` - Text on secondary container
- **Secondary Fixed**: `#E1D4DF` - Fixed secondary for accessibility
- **Secondary Fixed Dim**: `#C5B8C3` - Dimmed secondary fixed

##### Tertiary Color System (Achievement & Motivation)
- **Tertiary**: `#F4A261` - Warm orange for achievement and motivation
- **On Tertiary**: `#FFFFFF` - High contrast text on tertiary
- **Tertiary Container**: `#F6B685` - For tertiary actions and gentle emphasis
- **On Tertiary Container**: `#E8934A` - Text on tertiary container
- **Tertiary Fixed**: `#FFEEE6` - Fixed tertiary for accessibility
- **Tertiary Fixed Dim**: `#FFD9CA` - Dimmed tertiary fixed

##### Surface Color System (M3 Surfaces)
- **Surface**: `#FAFCFB` - Main background surface
- **On Surface**: `#191C1B` - Primary text on surface
- **Surface Variant**: `#F0F8F4` - Secondary surface for cards
- **On Surface Variant**: `#404943` - Secondary text on surface variant
- **Surface Container Lowest**: `#FFFFFF` - Elevated surface level 0
- **Surface Container Low**: `rgba(255, 255, 255, 0.85)` - Elevated surface level 1
- **Surface Container**: `rgba(255, 255, 255, 0.70)` - Elevated surface level 2  
- **Surface Container High**: `rgba(255, 255, 255, 0.60)` - Elevated surface level 3
- **Surface Container Highest**: `rgba(255, 255, 255, 0.50)` - Elevated surface level 4

##### Outline & Border System
- **Outline**: `#707970` - Default border color
- **Outline Variant**: `#C0C9C0` - Secondary border color for dividers

##### Error & State Colors (M3 Semantic)
- **Error**: `#BA1A1A` - Error states and destructive actions
- **On Error**: `#FFFFFF` - Text on error
- **Error Container**: `#FFDAD6` - Error container background
- **On Error Container**: `#410002` - Text on error container

##### M3 Usage Guidelines
- **Surface Tonal Palette**: Use container colors for cohesive color relationships
- **Dynamic Color**: Colors adapt based on user's wallpaper (when supported)
- **Accessibility**: Minimum 3:1 contrast for UI elements, 4.5:1 for text
- **State Layers**: Use surface tonal variations for hover/focus/pressed states
- **Elevation**: Use Surface Container tokens instead of shadows for Material You
- **Color Roles**: Always use semantic color roles (primary, secondary, error) instead of literal colors

### Typography System

#### Font Family
```css
fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
```

#### Hierarchy & Sizing
- **H1**: 2.5rem, weight 700, line-height 1.2 - Page titles
- **H2**: 2rem, weight 600, line-height 1.3 - Section headers  
- **H3**: 1.75rem, weight 600, line-height 1.3 - Card titles
- **H4**: 1.5rem, weight 600, line-height 1.4 - Subsections
- **H5**: 1.25rem, weight 500, line-height 1.4 - Component titles
- **H6**: 1.125rem, weight 500, line-height 1.4 - Small headings
- **Body1**: 1rem, line-height 1.6 - Main content
- **Body2**: 0.875rem, line-height 1.6 - Secondary content
- **Button**: weight 600, textTransform 'none' - All buttons

#### Typography Guidelines
- Use gradient text effects for hero titles: `background: linear-gradient(135deg, #2E7D6B 0%, #4A9B8A 100%)`
- Line height 1.6 for all body text to improve readability
- Weight 600+ for all interactive elements (buttons, links)
- Never use all-caps transformation

### Responsive Breakpoints

```css
breakpoints: {
  xs: 0,      // Mobile portrait
  sm: 640,    // Mobile landscape
  md: 768,    // Tablet
  lg: 1024,   // Desktop
  xl: 1280,   // Large desktop
}
```

#### Responsive Patterns
- **Mobile-first approach**: Design for xs first, then enhance
- **Grid System**: Use Material-UI Grid with responsive spacing
- **Typography scaling**: Reduce font sizes by 10-20% on mobile
- **Touch targets**: Minimum 48px height for interactive elements
- **Spacing**: Use responsive spacing objects `{ xs: 2, sm: 3, md: 4 }`

### Component Design Patterns

#### Cards & Surfaces
```css
borderRadius: 20px
boxShadow: '0 12px 40px rgba(46, 125, 107, 0.08), 0 4px 16px rgba(46, 125, 107, 0.04)'
background: 'rgba(255, 255, 255, 0.85)'
border: '1px solid rgba(255, 255, 255, 0.25)'
backdropFilter: 'blur(20px)'
```

#### Hover Effects
```css
transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
'&:hover': {
  transform: 'translateY(-2px)',
  boxShadow: '0 16px 48px rgba(46, 125, 107, 0.12), 0 8px 24px rgba(46, 125, 107, 0.06)'
}
```

#### Buttons
- **Primary**: Gradient background from primary to primaryDark
- **Secondary**: Outlined with 2px border
- **Border radius**: 12px for buttons
- **Padding**: 10px 24px (adjust for size variants)
- **Hover**: Subtle lift with `translateY(-1px)` and enhanced shadow

#### Form Fields
- **Border radius**: 12px
- **Background**: Medium glass with backdrop blur
- **Focus state**: Light glass background + subtle primary shadow
- **Hover**: Transition to light glass background

#### Navigation
- **Desktop Sidebar**: Light glass with 24px border radius on right side
- **Mobile Bottom Nav**: Light glass with top border radius 24px, height 70px
- **Selected states**: Gradient background with left border accent

### Spacing System

#### Base Unit: 8px
- **xs**: 8px (1 unit)
- **sm**: 16px (2 units)  
- **md**: 24px (3 units)
- **lg**: 32px (4 units)
- **xl**: 40px (5 units)

#### Responsive Spacing Examples
```jsx
// Component padding
p: { xs: 2, sm: 3, md: 4 }  // 16px, 24px, 32px

// Margin bottom
mb: { xs: 3, sm: 4, md: 6 }  // 24px, 32px, 48px

// Gap in flex/grid
gap: { xs: 2, sm: 2.5 }  // 16px, 20px
```

### Accessibility Guidelines

#### Color Contrast
- Ensure minimum 4.5:1 contrast ratio for text
- Use semantic colors (success, warning, error) appropriately
- Test with color blindness simulators

#### Interactive Elements
- Minimum 48px touch targets on mobile
- Clear focus indicators with 3px shadows
- Proper ARIA labels and roles
- Keyboard navigation support

#### Typography
- Minimum 16px font size on mobile (14px acceptable for captions)
- Adequate line spacing (1.6 for body text)
- High contrast text colors: `#2C3E50` primary, `#5D6D7E` secondary

### Animation & Micro-interactions

#### Timing Functions
- **Standard**: `cubic-bezier(0.4, 0, 0.2, 1)` - Most interactions
- **Fast**: `0.2s` - Hover effects, focus states
- **Medium**: `0.3s` - Card animations, transforms
- **Slow**: `0.4s` - Page transitions, modals

#### Transform Patterns
- **Hover lift**: `translateY(-2px)` for cards
- **Button press**: `translateY(-1px)` for buttons  
- **Scale emphasis**: `scale(1.05)` for FABs
- **Slide navigation**: `translateX(4px)` for list items

### Layout Patterns

#### Page Structure
```jsx
<Box sx={{ 
  minHeight: '100vh',
  px: { xs: 2, sm: 3, md: 4 },
  py: { xs: 3, sm: 4 },
  maxWidth: { md: 1200 },
  mx: 'auto'
}}>
```

#### Card Layouts
```jsx
<Card>
  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
    {/* Content with responsive padding */}
  </CardContent>
</Card>
```

#### Grid Layouts
```jsx
<Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
  <Grid item xs={12} md={6}>
    {/* Responsive columns */}
  </Grid>
</Grid>
```

### Self-Development Coaching UI Elements

#### Empty States
- Use motivational, empowerment-focused messaging
- Include growth emojis (🚀, 💪, ⭐, 🎯)
- Suggest actionable steps or goal-setting activities
- Examples: "Ready to start your growth journey?", "Your transformation begins here"

#### Loading States
- Professional loading screens with empowering context
- Examples: "Preparing your growth dashboard...", "Loading your achievement tracker..."
- Use thicker CircularProgress (thickness={4}) with motivational micro-copy

#### Success/Achievement Indicators
- Use achievement and progress metaphors ("Level up!", "Milestone reached!")
- Vibrant colors for positive outcomes and victories
- Achievement emojis (🏆, 🎉, 🚀, ⭐, 💎, 🎯)
- Progress bars and completion indicators

#### Coaching Language & Terminology
- Use empowering, action-oriented language
- "Clients" instead of "Patients" (never use medical terminology)  
- "Coaching Sessions" instead of "Appointments"
- "Growth Journey" instead of "Treatment"
- "Personal Development Plan" instead of "Treatment Plan"
- "Life Goals" instead of "Health Goals"
- "Breakthrough" instead of "Recovery"
- "Transformation" instead of "Healing"
- "Empowerment" instead of "Therapy"
- "Self-Discovery" and "Personal Growth"
- "Achievement Tracking" and "Progress Monitoring"
- "Life Coaching" and "Performance Coaching"

### Implementation Checklist

For every new component/page:
- [ ] Use the established color palette (empowerment-focused)
- [ ] Implement glassmorphism effects (blur, transparency, borders)
- [ ] Add responsive spacing and typography
- [ ] Include smooth hover/focus animations
- [ ] Test on mobile, tablet, and desktop
- [ ] Verify accessibility (contrast, touch targets, keyboard nav)
- [ ] Use empowering, coaching-focused language and messaging
- [ ] Add appropriate micro-interactions with achievement feel
- [ ] Follow the established component patterns
- [ ] Avoid all medical/clinical terminology
- [ ] Focus on growth, achievement, and personal development themes

## Development Troubleshooting

### Common Issues & Solutions

#### Service Startup Issues
- **Error**: "Cannot connect to database" → Ensure PostgreSQL container is running: `docker compose up postgres`
- **Error**: "NATS connection failed" → Start NATS broker: `docker compose up nats`
- **Error**: "@clinic/common not found" → Build shared library first: `yarn workspace @clinic/common build`
- **Error**: "Port already in use" → Check if services are already running or change ports in docker-compose.yml

#### Frontend Development Issues
- **Error**: "API calls failing" → Ensure API Gateway is running on port 4000
- **Error**: "Proxy errors" → Check vite.config.ts proxy configuration matches running services
- **Error**: "Theme not loading" → Verify theme.ts exports and Material-UI setup

#### Testing Issues
- **Error**: "Tests failing in CI" → Environment variables may be missing (see scripts/test.sh)
- **Error**: "Coverage below threshold" → Add tests to reach 80% coverage requirement
- **Error**: "Database connection in tests" → Tests use mock database, check jest.config.js

#### Database Issues
- **Error**: "Migration failed" → Check entity syntax and database connection
- **Error**: "Entity not found" → Ensure TypeORM entity registration in module
- **Error**: "Foreign key constraint" → Check entity relationships and cascade options

### Performance Considerations
- **Frontend**: Use React.memo() for expensive components, lazy load routes
- **Backend**: Implement pagination for large datasets, use proper database indexing
- **Database**: Connection pooling is configured, monitor connection usage
- **NATS**: Messages are fire-and-forget by default, use request-reply for critical operations

## Task Management Instructions

### Done List Management
- When tasks are completed, move them from the active todo list to `DONE.md`
- To add completed tasks to DONE.md:
  1. Use Edit tool to add the task under the appropriate section
  2. Format: `- ✅ [Task description]`
  3. Update the total count at the bottom
- Keep the active todo list clean by only showing pending/in-progress tasks
- Categories in DONE.md: Recording & Session Management, Google Integration, Appointment & Meeting Management, AI & Session Analysis, Client Portal & Dashboard, Internationalization & Settings, etc.

## 🌐 TRANSLATION SYSTEM REQUIREMENTS

### Mandatory Internationalization Standards (Critical)

#### Translation System Usage (Non-Negotiable)
**ALL user-visible text MUST use the translation system - NO EXCEPTIONS**

#### Translation System Architecture
The application supports multiple languages with a comprehensive i18n infrastructure:

```
frontend/src/i18n/
├── index.ts                 # i18n configuration
├── ar.json                  # Arabic translations
├── en.json                  # English translations (base)
├── he.json                  # Hebrew translations
├── ru.json                  # Russian translations
└── translations/
    ├── en.ts               # TypeScript translations (primary)
    ├── es.ts               # Spanish translations
    └── he.ts               # Hebrew translations
```

#### Language Context Implementation
```typescript
// Language context provides translation functionality
import { LanguageContext, LanguageProvider } from '../contexts/LanguageContext';

// App setup with language provider
const App = () => {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="*" element={<AppRoutes />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
};

// Hook usage in components
const MyComponent = () => {
  const { t, currentLanguage, changeLanguage, availableLanguages } = useTranslation();
  
  return (
    <Box>
      <Typography>{t.dashboard.welcome}</Typography>
      <Select value={currentLanguage} onChange={changeLanguage}>
        {availableLanguages.map(lang => (
          <MenuItem key={lang.code} value={lang.code}>
            {lang.name}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};
```

#### Translation Key Structure (Coaching-Focused)
The translation system uses empowerment-focused language throughout:

```typescript
// frontend/src/i18n/translations/en.ts
export const translations = {
  // Client Portal - Growth & Achievement Focus
  clientPortal: {
    dashboard: {
      title: "Your Growth Dashboard",
      subtitle: "Track your transformation journey",
      welcomeBack: "Welcome back, {name}! Ready to continue your growth?",
      stats: {
        totalSessions: "Coaching Sessions Completed",
        activeGoals: "Active Growth Goals",
        achievements: "Milestones Achieved",
        progressThisMonth: "Progress This Month"
      }
    },
    goals: {
      title: "Your Growth Goals",
      subtitle: "Define and track your personal development",
      createNew: "Set New Goal",
      milestones: "Milestones",
      celebrate: "Celebrate Your Progress!"
    },
    booking: {
      title: "Book Your Coaching Session",
      selectCoach: "Choose Your Coach",
      availableSlots: "Available Time Slots",
      confirmBooking: "Confirm Your Session"
    },
    achievements: {
      title: "Your Achievements",
      subtitle: "Celebrate your transformation milestones",
      unlockedBadges: "Unlocked Badges",
      nextMilestone: "Next Milestone"
    }
  },

  // Admin Dashboard - Management Focus
  admin: {
    dashboard: {
      title: "System Administration",
      userManagement: "User Management",
      systemHealth: "System Health",
      analytics: "Platform Analytics"
    },
    security: {
      title: "Security Settings",
      apiKeys: "API Key Management",
      auditLogs: "Audit Trail",
      accessControl: "Access Control"
    }
  },

  // Coach/Therapist Portal - Professional Focus
  coaching: {
    dashboard: {
      title: "Coaching Dashboard",
      upcomingSessions: "Upcoming Sessions",
      clientProgress: "Client Progress",
      sessionNotes: "Session Notes"
    },
    sessions: {
      title: "Coaching Sessions",
      schedule: "Schedule Session",
      notes: "Session Notes",
      summary: "AI-Generated Summary"
    }
  },

  // Common UI Elements
  common: {
    navigation: {
      dashboard: "Dashboard",
      calendar: "Calendar",
      goals: "Goals",
      achievements: "Achievements",
      sessions: "Sessions",
      settings: "Settings"
    },
    actions: {
      save: "Save Progress",
      cancel: "Cancel",
      continue: "Continue Journey",
      complete: "Mark Complete",
      schedule: "Schedule",
      update: "Update"
    },
    states: {
      loading: "Loading your progress...",
      saving: "Saving your achievements...",
      error: "Oops! Let's try that again",
      success: "Great progress! Well done!",
      empty: "Ready to start your growth journey?"
    }
  }
};
```

#### Translation System Implementation Rules

1. **Import Translation Hook**: Every component MUST import and use the translation system
   ```typescript
   import { useTranslation } from '../contexts/LanguageContext';
   const { t } = useTranslation();
   ```

2. **NO Hardcoded Strings**: Never use hardcoded English (or any language) strings in components
   ```typescript
   // ❌ WRONG - Never do this
   <Typography>Welcome to your dashboard</Typography>
   
   // ✅ CORRECT - Always use translation keys
   <Typography>{t.clientPortal.dashboard.title}</Typography>
   ```

3. **Dynamic Content Support**: Use `.replace()` method for dynamic values
   ```typescript
   // For dynamic content like names, counts, etc.
   {t.clientPortal.dashboard.welcomeBack.replace('{name}', userName)}
   {t.clientPortal.dashboard.stats.totalSessions.replace('{count}', sessionCount.toString())}
   ```

4. **Coaching Terminology**: Always use empowerment-focused language
   ```typescript
   // ✅ CORRECT - Coaching/Growth language
   t.clientPortal.goals.title           // "Your Growth Goals"
   t.coaching.sessions.title            // "Coaching Sessions"
   t.clientPortal.achievements.title    // "Your Achievements"
   
   // ❌ WRONG - Medical/Clinical language
   "Your Treatment Plan"
   "Patient Appointments"
   "Medical Records"
   ```

#### Multi-Language Support Implementation

```typescript
// Language switching component
const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage, availableLanguages } = useTranslation();
  
  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    // Persist language preference
    localStorage.setItem('preferredLanguage', langCode);
  };
  
  return (
    <Select value={currentLanguage} onChange={handleLanguageChange}>
      <MenuItem value="en">English</MenuItem>
      <MenuItem value="he">עברית (Hebrew)</MenuItem>
      <MenuItem value="ar">العربية (Arabic)</MenuItem>
      <MenuItem value="ru">Русский (Russian)</MenuItem>
      <MenuItem value="es">Español (Spanish)</MenuItem>
    </Select>
  );
};
```

#### RTL (Right-to-Left) Language Support
The system supports RTL languages like Hebrew and Arabic:

```typescript
// RTL support in theme configuration
import { createTheme } from '@mui/material/styles';

const getTheme = (language: string) => {
  const isRTL = ['he', 'ar'].includes(language);
  
  return createTheme({
    direction: isRTL ? 'rtl' : 'ltr',
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            direction: isRTL ? 'rtl' : 'ltr',
          },
        },
      },
    },
  });
};
```

#### Translation Validation & Testing
```typescript
// Test translation completeness
const validateTranslations = (translations: any, basePath = '') => {
  Object.keys(translations).forEach(key => {
    const path = basePath ? `${basePath}.${key}` : key;
    const value = translations[key];
    
    if (typeof value === 'object') {
      validateTranslations(value, path);
    } else if (typeof value !== 'string' || value.trim() === '') {
      console.warn(`Missing translation for key: ${path}`);
    }
  });
};

// Component test with translation
test('displays translated content', () => {
  const { getByText } = render(
    <LanguageProvider>
      <ClientDashboard />
    </LanguageProvider>
  );
  
  expect(getByText('Your Growth Dashboard')).toBeInTheDocument();
});
```

#### Translation Key Organization Standards

- **Feature-based grouping**: Group keys by main features (dashboard, booking, achievements, etc.)
- **Hierarchical structure**: Use nested objects for related content
- **Descriptive key names**: Use clear, descriptive key names that indicate content purpose
- **Consistent naming**: Use camelCase for keys, descriptive English for values
- **Context preservation**: Include enough context in key names to understand usage

#### Implementation Checklist (Every Component)
- [ ] Import `useTranslation` hook at component level
- [ ] Declare `const { t } = useTranslation()` 
- [ ] Replace ALL hardcoded strings with `t.section.key` references
- [ ] Add corresponding translation keys to `en.ts` before or during development
- [ ] Use `.replace()` for any dynamic content (names, numbers, dates)
- [ ] Test component with translation system active
- [ ] Verify no hardcoded strings remain in component

#### Development Workflow Integration
1. **Design Phase**: Plan translation key structure alongside component design
2. **Development Phase**: Add translation keys to `en.ts` as you build components
3. **Review Phase**: Code reviews MUST verify no hardcoded strings exist
4. **Testing Phase**: Test components with translation system to ensure all text displays correctly

#### Why This Is Critical
- **Future Internationalization**: Enables easy addition of multiple languages
- **Consistent Messaging**: Centralizes all user-facing text for consistency
- **Professional Standards**: Enterprise applications require internationalization support
- **Maintenance**: Easier to update messaging across the entire application
- **User Experience**: Enables personalized and localized user experiences

### Important Instructions
- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User
- **ALWAYS use the translation system for ALL user-visible text - this is mandatory and non-negotiable**