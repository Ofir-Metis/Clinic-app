# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Purpose

A **self-development coaching platform** for personal growth coaches, life coaches, wellness practitioners, and business coaches. Built with NestJS microservices, React frontend, and PostgreSQL.

**Terminology (MANDATORY)**: Use "Clients" not "Patients", "Coaching Sessions" not "Appointments", "Coach" not "Therapist", "Growth Journey" not "Treatment". DB schema still uses `patient`/`therapist` internally - map at the service/DTO layer.

## Quick Start

```bash
nvm use 20                                  # Node.js 20+ required
yarn install                               # Install all workspaces
yarn workspace @clinic/common build        # Build shared library FIRST (critical!)
cp .env.example .env                       # Configure environment
./scripts/dev.sh                           # Start all services
```

## Essential Commands

```bash
# Development
./scripts/dev.sh                                    # All services with Docker
docker compose up -d                                # Start without rebuild
docker compose up postgres nats minio maildev redis # Infrastructure only
yarn workspace frontend dev                         # Frontend only (port 5173)
yarn workspace @clinic/common build                 # Shared library (ALWAYS first)

# Testing
./scripts/test.sh                                   # All tests (lint + jest)
yarn workspace @clinic/<service-name> test          # Specific service
yarn workspace frontend test                        # Frontend unit tests
npx playwright test                                 # E2E tests
npx playwright test --project=coach                 # Coach flow tests only
npx playwright test --project=client                # Client flow tests only

# Linting
yarn lint                                           # ESLint all workspaces
yarn format                                         # Prettier formatting

# Service Management
docker compose ps                                   # View running containers
docker compose logs -f <service-name>               # Follow service logs
docker compose restart <service-name>               # Restart service
curl http://localhost:4000/health                   # API Gateway health check

# Deployment
./scripts/production-deploy-safe.sh                 # Safe production deploy with backups
./scripts/blue-green-deploy.sh                      # Zero-downtime deployment
./scripts/rollback-production.sh                    # Emergency rollback
```

## Architecture

```
Frontend (5173) → API Gateway (4000) → Microservices (3001-3015)
                         ↓
                  NATS Message Bus (4222)
                         ↓
         PostgreSQL (5432) / Redis (6379) / MinIO (9000)
```

### Services
| Service | Port | Workspace |
|---------|------|-----------|
| api-gateway | 4000 | `@clinic/api-gateway` |
| auth-service | 3001 | `@clinic/auth-service` |
| appointments-service | 3002 | `@clinic/appointments-service` |
| files-service | 3003 | `@clinic/files-service` |
| notifications-service | 3004 | `@clinic/notifications-service` |
| ai-service | 3005 | `@clinic/ai-service` |
| notes-service | 3006 | `@clinic/notes-service` |
| analytics-service | 3007 | `@clinic/analytics-service` |
| settings-service | 3008 | `@clinic/settings-service` |
| billing-service | 3009 | `@clinic/billing-service` |
| google-integration-service | 3012 | `@clinic/google-integration-service` |
| coaches-service | 3013 | `@clinic/coaches-service` |
| client-relationships-service | 3014 | `@clinic/client-relationships-service` |
| progress-service | 3015 | `@clinic/progress-service` |

### Project Structure
```
services/           # NestJS microservices (module/controller/service pattern)
frontend/           # React + Vite + Material-UI
libs/common/        # Shared utilities - BUILD THIS FIRST
scripts/            # Development & deployment scripts
tests/              # Playwright E2E tests
.claude/rules/      # Path-conditional rules (NestJS, React, testing, Docker)
.claude/agents/     # 15 specialized subagents — see .claude/agents/README.md
.claude/commands/   # Custom slash commands (/service-health, /debug-service, etc.)
```

## Code Quality Enforcement

- **ESLint**: `@typescript-eslint/no-explicit-any` is `error` - avoid `any` types; unused vars error (except `_` prefix)
- **Prettier**: single quotes, trailing commas: all
- **Pre-commit hook** (Husky): runs `yarn lint && yarn test` - must pass before commit
- **Commit messages**: [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint (`feat:`, `fix:`, `chore:`, etc.)

## Critical Gotchas

| Pattern | Rule |
|---------|------|
| NestJS route ordering | Static routes MUST be declared before parameterized `:id` routes |
| TypeORM null clearing | Use `null as any` to clear fields, NOT `undefined` (silently ignored) |
| LIKE injection | Escape `%`, `_`, `\` in user input; use `ESCAPE '\'` clause |
| React stale closures | Use `useRef` for values in `setInterval`/`requestAnimationFrame` |
| Object URL leaks | Always `URL.revokeObjectURL()` before creating new or setting null |
| parseInt NaN | Validate parseInt from request body strings - can produce NaN in DB |
| Translation system | ALL user-visible text must use `useTranslation()` - no hardcoded strings |
| no-explicit-any | ESLint errors on `any` - use proper types or generics instead |

## Frontend Standards

### Translation System (MANDATORY)
```typescript
import { useTranslation } from '../contexts/LanguageContext';
const { t, translations } = useTranslation();
// Direct access: translations.dashboard.title
// Function: t('dashboard.title')
```
Files: `frontend/src/i18n/translations/` (en.ts, he.ts, es.ts)

### Design System
- Material Design 3 with primary color `#2E7D6B`
- Role-based routing: `/client/*`, `/admin/*`
- Mobile-first responsive design
- RTL support (Hebrew) handled automatically by LanguageContext

## API Gateway Proxy

The gateway (`services/api-gateway/src/proxy/proxy.service.ts`) uses native Node.js `http` module for HTTP forwarding (not http-proxy-middleware). Routes `/api/v1/{service}` forward to `localhost:{port}/{service}` with full header passthrough including JWT Authorization.

## Inter-Service Communication (NATS)

- `@MessagePattern('pattern')` for request/response (e.g., AI session analysis)
- `@EventPattern('pattern')` for fire-and-forget events
- Event naming convention: `{entity}.{action}` (e.g., `client.created`, `appointment.updated`)

## Database

- Single PostgreSQL with TypeORM (auto-sync in dev)
- Connection: `PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic`

## QA Agent Team

Full documentation: [`.claude/agents/README.md`](.claude/agents/README.md)

| Tier | Agents | Purpose |
|------|--------|---------|
| **1: Static Analysis** | `code-quality-reviewer`, `translation-auditor`, `security-reviewer`, `api-contract-validator` | Code-level quality without running the app |
| **2: Test Generation** | `unit-test-generator`, `e2e-scenario-builder`, `e2e-tester` | Generate and run automated tests |
| **3: Live System QA** | `visual-qa-inspector`, `accessibility-auditor` | Browser-based UI and a11y verification |
| **4: User Journeys** | `persona-coach-simulator`, `persona-client-simulator`, `persona-admin-simulator` | Day-in-the-life simulations per role |
| **5: Orchestration** | `qa-orchestrator` | Coordinates full QA pipeline, produces release report |

Run the full pipeline: spawn `qa-orchestrator` via the Task tool.

## Custom Slash Commands

- `/service-health` - Check all service health status
- `/debug-service <name>` - Debug a specific service (logs, health, config)
- `/test-service <name>` - Run and analyze tests for a service
- `/db-inspect [table]` - Inspect database schema and data
- `/review-pr` - Review current changes for quality and security

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci-cd-pipeline.yml`): security scan (Trivy) → build & test matrix (all services + frontend) → E2E tests → deploy staging → smoke tests → manual production approval → blue-green deploy → auto-rollback on failure.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `@clinic/common not found` | `yarn workspace @clinic/common build` |
| Cannot connect to database | `docker compose up postgres -d` |
| NATS connection failed | `docker compose up nats -d` |
| Port already in use | `docker compose ps` or `lsof -i :<port>` |
| Service won't start | `docker compose logs <service-name>` |
| Docker build failures | `docker system prune -f && docker compose build --no-cache <service-name>` |
