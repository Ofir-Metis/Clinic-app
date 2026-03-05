---
globs:
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "tests/**/*"
---

# Testing Rules

## Unit Tests (Jest)
- Run all: `./scripts/test.sh`
- Run specific service: `yarn workspace @clinic/<service-name> test`
- Watch mode: `yarn workspace @clinic/<service-name> test --watch`
- Coverage: `yarn workspace @clinic/<service-name> test --coverage`
- Frontend: `yarn workspace frontend test`

## E2E Tests (Playwright)
- Run all: `npx playwright test`
- UI mode: `npx playwright test --ui`
- Single browser: `npx playwright test --project=chromium`
- By role: `--project=coach`, `--project=client`, `--project=admin`
- Config: `playwright.config.ts` at project root
- Fixtures: `tests/fixtures/`

## Test File Conventions
- Unit tests: `*.spec.ts` next to source file
- E2E tests: `tests/e2e/` directory
- Fixtures: `tests/fixtures/`

## Writing Tests
- Mock external services (NATS, database) in unit tests
- Use `Test.createTestingModule()` for NestJS service tests
- Use Playwright fixtures for E2E test data setup
- Test both success and error paths
