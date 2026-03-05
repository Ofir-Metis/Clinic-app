---
globs:
  - "services/**/*.ts"
  - "libs/common/**/*.ts"
---

# NestJS Backend Rules

## Module Pattern
All services follow: Module → Controller → Service → Entity
- Controllers handle HTTP/NATS routing only - no business logic
- Services contain all business logic
- DTOs required for all endpoints with class-validator decorators
- Entities define TypeORM schema

## Route Ordering (CRITICAL)
Static routes MUST be declared before parameterized `:id` routes.
NestJS matches routes by declaration order - a `/:id` route will catch `/search` if declared first.

## TypeORM Gotchas
- `entity.field = undefined` is silently ignored by TypeORM. Use `null as any` to clear nullable columns
- Always escape `%`, `_`, `\` in user input before LIKE queries: `input.replace(/[%_\\]/g, '\\$&')`
- Always use `ESCAPE '\'` clause with LIKE
- Use QueryBuilder for complex queries, repository methods for simple CRUD
- Auto-sync is on in dev - entity changes apply immediately

## Validation
- Always validate `parseInt` results from request body/params - can silently produce NaN
- Use class-validator decorators on DTOs: `@IsString()`, `@IsEmail()`, `@IsOptional()`, etc.

## Service Communication
- HTTP: Via API Gateway proxy (port 4000 → service ports 3001-3015)
- NATS: For async inter-service events (port 4222)
- JWT: Passed through headers, validated by guards

## Status Fields
When clearing an error status, always clear the associated error message field too.

## DB Query Filters
When a filter parameter exists, apply it in the SQL query WHERE clause - not just calculate it in memory.

## Terminology Mapping
- Frontend says "Client" → DB schema uses `patient` column names
- Frontend says "Coach" → DB schema uses `therapist` column names
- Map at the service/DTO layer, not in controllers
