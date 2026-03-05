---
globs:
  - "docker-compose*.yml"
  - "**/Dockerfile"
  - "scripts/*.sh"
---

# Docker & Service Management Rules

## Service Stack
- Infrastructure: `docker compose up postgres nats minio maildev redis -d`
- All services: `docker compose up -d` or `./scripts/dev.sh`
- Enhanced (AI/Search/CDN): `docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d`
- Monitoring: add `-f docker-compose.monitoring.yml`

## Port Map
- Frontend: 5173 (Vite dev server)
- API Gateway: 4000
- Services: 3001-3015
- PostgreSQL: 5432
- NATS: 4222
- Redis: 6379
- MinIO: 9000
- MailDev: 1080

## Common Operations
- View logs: `docker compose logs -f <service-name>`
- Restart: `docker compose restart <service-name>`
- Rebuild: `docker compose build <service-name>`
- Health check: `curl http://localhost:4000/health`
- DB connect: `PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic`

## Build Order
1. `yarn workspace @clinic/common build` (ALWAYS first)
2. Then docker compose build for services
3. Frontend runs independently
