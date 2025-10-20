# Full Rebuild and Seed Scripts

This directory contains comprehensive scripts to perform a complete rebuild of the Clinic application with Docker cleanup and user seeding.

## 🚀 Available Scripts

### 1. Shell Script (Linux/macOS/WSL)
```bash
./scripts/full-rebuild-and-seed.sh
```

### 2. Windows Batch File
```cmd
scripts\full-rebuild-and-seed.bat
```

### 3. PowerShell Script (Windows)
```powershell
.\scripts\full-rebuild-and-seed.ps1
```

## 📋 What These Scripts Do

### Phase 1: Complete Cleanup
- 🛑 Stop all running Docker containers
- 🧹 Remove all clinic-app containers
- 🗑️ Remove all clinic-app Docker images
- 🔄 Clean up unused volumes and networks
- 💾 Ensure a completely fresh start

### Phase 2: Build & Deploy
- 📦 Install dependencies (`yarn install`)
- 🔧 Build common library (`yarn workspace @clinic/common build`)
- 🏗️ Build all Docker images from scratch (`--no-cache`)
- 🚀 Start infrastructure services (postgres, redis, nats, minio, maildev)
- ⚙️ Start core application services (13 microservices)
- 📊 Start enhanced services (search, CDN, AI, etc.)
- 📈 Start monitoring services (Prometheus, Grafana, Loki, etc.)

### Phase 3: Health Verification
- 🏥 Perform health checks on all critical services
- ✅ Verify API Gateway connectivity
- 🔗 Verify database connectivity
- ⏱️ Wait for all services to be fully operational

### Phase 4: User Seeding
- 👑 Create **Admin User** with full system access
- 🩺 Create **Therapist User** for healthcare providers
- 👤 Create **Patient/Client User** for end users

## 👥 Default User Credentials

| User Type | Email | Password | Access Level |
|-----------|-------|----------|--------------|
| **Admin** | admin@clinic.com | Admin123! | Admin Dashboard + Monitoring |
| **Therapist** | therapist@clinic.com | Therapist123! | Therapist Dashboard |
| **Patient** | patient@clinic.com | Patient123! | Client Portal |

## 🌐 Application URLs

After successful completion, access these URLs:

- **Main Application**: http://localhost:5173
- **API Gateway**: http://localhost:4000
- **Admin Dashboard**: http://localhost:5173/admin
- **Therapist Dashboard**: http://localhost:5173/therapist
- **Client Portal**: http://localhost:5173/client
- **Monitoring (Grafana)**: http://localhost:3000
- **Monitoring (Prometheus)**: http://localhost:9090
- **Email Testing**: http://localhost:1080

## 📊 Expected Container Count

After successful rebuild:
- **Core Services**: ~13 microservices
- **Infrastructure**: 5 services (postgres, redis, nats, minio, maildev)
- **Monitoring**: 2-6 services (prometheus, grafana, loki, etc.)
- **Frontend & Load Balancer**: 2 services
- **Total**: 22-30+ containers depending on configuration

## ⚠️ Prerequisites

### Required Software
- Docker Desktop (running)
- Node.js 20+ with npm/yarn
- Git
- PostgreSQL client tools (psql)

### Required Packages
```bash
npm install -g yarn
yarn install  # (in project root)
```

### Windows Specific
For PowerShell script:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🔧 Customization Options

### PowerShell Script Parameters
```powershell
.\scripts\full-rebuild-and-seed.ps1 -AdminEmail "custom@admin.com" -AdminPassword "CustomPass123!"
```

### Environment Variables (Shell/Batch)
```bash
export ADMIN_EMAIL="custom@admin.com"
export ADMIN_PASSWORD="CustomPass123!"
export THERAPIST_EMAIL="doctor@clinic.com"
export PATIENT_EMAIL="john@patient.com"
./scripts/full-rebuild-and-seed.sh
```

## 🚨 Important Security Notes

1. **Change Default Passwords**: Immediately change all default passwords after first login
2. **Production Use**: These scripts are designed for development/testing environments
3. **Admin Access**: The admin user has full system access including monitoring tools
4. **Database Reset**: This completely wipes and rebuilds the database

## 🐛 Troubleshooting

### Common Issues

**Docker Desktop not running:**
```
Error: Cannot connect to the Docker daemon
Solution: Start Docker Desktop and wait for it to be ready
```

**Port conflicts:**
```
Error: Port 5432 is already in use
Solution: Stop conflicting services or change port mappings
```

**Build failures:**
```
Error: yarn workspace build failed
Solution: Run yarn install and check Node.js version (requires 20+)
```

**User creation fails:**
```
Error: Failed to create users via SQL
Solution: Ensure PostgreSQL is running and accessible
```

### Log Inspection
```bash
# Check container logs
docker logs clinic-app-api-gateway-1

# Check all container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check database connection
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "SELECT NOW();"
```

## 📝 Manual User Creation

If automatic user seeding fails, create users manually:

### Via SQL
```sql
-- Connect to database
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic

-- Create admin user
INSERT INTO "user" (email, name, password, roles)
VALUES ('admin@clinic.com', 'System Administrator', '$2b$12$hash_here', '{admin}');
```

### Via API (if available)
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinic.com","password":"Admin123!","firstName":"Admin","lastName":"User","role":"admin"}'
```

## 🔄 Recovery Procedures

### Partial Rebuild (containers only)
```bash
docker compose down
docker compose up -d
```

### Full Rebuild (keep data)
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Nuclear Option (complete reset)
```bash
# Run the full rebuild script - it handles everything
./scripts/full-rebuild-and-seed.sh
```

## 📞 Support

If you encounter issues:

1. Check container logs: `docker logs <container-name>`
2. Verify prerequisites are installed
3. Ensure Docker Desktop has sufficient resources (4GB+ RAM recommended)
4. Check network connectivity and port availability

---

**Last Updated**: 2024-09-28
**Tested On**: Docker Desktop 4.x, Windows 11, Ubuntu 22.04, macOS 14+