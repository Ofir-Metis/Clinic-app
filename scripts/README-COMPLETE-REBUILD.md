# Complete System Rebuild Scripts - All 34 Containers

This directory contains comprehensive scripts to perform a **complete nuclear rebuild** of the entire Clinic application ecosystem, including teardown, image removal, and full reconstruction of all 34 containers.

## 🚀 Available Scripts

### 1. PowerShell Script (Windows - Recommended)
```powershell
.\scripts\complete-rebuild-all-containers.ps1
```

### 2. Windows Batch File
```cmd
scripts\complete-rebuild-all-containers.bat
```

### 3. Shell Script (Linux/macOS/WSL)
```bash
./scripts/complete-rebuild-all-containers.sh
```

## 📋 What These Scripts Do

### 🗂️ **PHASE 1: COMPLETE TEARDOWN**
- 🛑 Stop ALL Docker Compose stacks (main, enhanced, monitoring, staging, test, production)
- 🧹 Remove ALL clinic-app containers completely
- 🗑️ Remove ALL clinic-app Docker images (force removal)
- 🔄 Clean up ALL Docker volumes, networks, and build cache
- 💥 **Nuclear option**: Completely wipe the environment

### 🏗️ **PHASE 2: DEPENDENCIES & PRE-BUILD**
- 📦 Install all Node.js dependencies (`yarn install`)
- 🔧 Build shared common library (`yarn workspace @clinic/common build`)
- 🌐 Create external Docker networks (`clinic-network`)

### 🏭 **PHASE 3: BUILD ALL IMAGES (NO CACHE)**
- 🏗️ Build main application images with `--no-cache`
- 🔧 Build enhanced services images with `--no-cache`
- ⚡ Ensures completely fresh builds

### 🚀 **PHASE 4-7: ORCHESTRATED STARTUP**

#### Phase 4: Infrastructure (5 containers)
- `postgres`, `redis`, `nats`, `minio`, `maildev`

#### Phase 5: Core Application Services (20 containers)
- All microservices, API gateway, frontend, nginx load balancer

#### Phase 6: Enhanced Services (10 containers)
- AI service, search service, CDN service, analytics, billing, etc.

#### Phase 7: Monitoring & Management Stack (11 containers)
- Prometheus, Grafana, Loki, Jaeger, pgAdmin, Redis Commander, etc.

### 🏥 **PHASE 8: HEALTH VERIFICATION**
- ✅ Test API Gateway health endpoint
- ✅ Verify Auth Service connectivity
- ✅ Check Frontend responsiveness
- ✅ Validate Grafana dashboard access
- ✅ Confirm Elasticsearch cluster health

### 👥 **PHASE 9: USER SEEDING**
- 👑 Create **Admin User** with full system access
- 🩺 Create **Therapist User** for healthcare providers
- 👤 Create **Patient/Client User** for end users

### 📊 **PHASE 10: COMPREHENSIVE STATUS REPORT**
- Container count verification (target: 34 containers)
- Service breakdown and health status
- Complete access URL listing
- Management dashboard inventory

## 🎯 **TARGET: 34 CONTAINERS**

### **Core Application Stack (20 containers):**
1. `postgres` - PostgreSQL database
2. `redis` - Caching & sessions
3. `nats` - Message broker
4. `minio` - Object storage (S3 compatible)
5. `maildev` - Email testing
6. `auth-service` - Authentication (port 3001)
7. `appointments-service` - Scheduling (port 3002)
8. `files-service` - File management (port 3003)
9. `notifications-service` - Messaging (port 3004)
10. `ai-service` - AI/ML integration (port 3005)
11. `notes-service` - Session notes (port 3006)
12. `analytics-service` - Reporting (port 3007)
13. `settings-service` - User preferences (port 3008)
14. `billing-service` - Payment processing (port 3009)
15. `google-integration-service` - Google OAuth & Calendar (port 3012)
16. `therapists-service` - Therapist profiles (port 3013)
17. `client-relationships-service` - Multi-coach management (port 3014)
18. `api-gateway` - Main entry point (port 4000)
19. `frontend` - React application (port 5173)
20. `nginx` - Load balancer (ports 80, 443)

### **Enhanced Services Stack (10 containers):**
21. `elasticsearch` - Search & analytics backend (port 9200)
22. `search-service` - Search functionality (port 3010)
23. `cdn-service` - Content delivery network (port 3011)
24. `progress-service` - Goal tracking & achievements (port 3015)

### **Monitoring & Management Stack (11 containers):**
25. `prometheus` - Metrics collection (port 9090)
26. `grafana` - **Management Dashboard** (port 3000)
27. `promtail` - Log aggregation
28. `loki` - Log storage (port 3100)
29. `jaeger` - Distributed tracing (ports 14268, 16686)
30. `fluentd` - Log collection (port 24224)
31. `falco` - Security monitoring
32. `uptime-kuma` - **Uptime Monitoring** (port 3301)
33. `pgadmin` - **PostgreSQL Management** (port 5050)
34. `redis-commander` - **Redis Management** (port 8081)

## 👥 Default User Credentials

| User Type | Email | Password | Access Level |
|-----------|-------|----------|--------------|
| **Admin** | admin@clinic.com | Admin123! | Full system access + monitoring |
| **Therapist** | therapist@clinic.com | Therapist123! | Therapist dashboard & client management |
| **Patient** | patient@clinic.com | Patient123! | Client portal & self-service |

## 🌐 Application URLs

After successful completion:

### **Main Application**
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:4000
- **Load Balancer**: http://localhost:80

### **Management Dashboards**
- **Grafana Monitoring**: http://localhost:3000 (admin/admin)
- **pgAdmin Database**: http://localhost:5050 (admin@clinic.com/admin)
- **Redis Commander**: http://localhost:8081 (admin/admin)
- **Uptime Monitoring**: http://localhost:3301

### **Advanced Monitoring**
- **Prometheus Metrics**: http://localhost:9090
- **Jaeger Tracing**: http://localhost:16686
- **Elasticsearch**: http://localhost:9200

### **Development Tools**
- **Email Testing**: http://localhost:1080

## ⚠️ Prerequisites

### Required Software
- **Docker Desktop** (running and ready)
- **Node.js 20+** with npm/yarn (`nvm install 20 && nvm use 20`)
- **Git**
- **PostgreSQL client tools** (`psql` command)

### Required Packages
```bash
npm install -g yarn
yarn install  # (in project root)
```

### Windows PowerShell Prerequisites
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🔧 Script Customization

### PowerShell Parameters
```powershell
.\scripts\complete-rebuild-all-containers.ps1 -AdminEmail "custom@admin.com" -AdminPassword "CustomPass123!" -SkipUserSeeding
```

### Environment Variables (Shell/Batch)
```bash
export ADMIN_EMAIL="custom@admin.com"
export ADMIN_PASSWORD="CustomPass123!"
export SKIP_USER_SEEDING="true"
./scripts/complete-rebuild-all-containers.sh
```

### Available Parameters
- `AdminEmail` / `ADMIN_EMAIL` - Custom admin email
- `AdminPassword` / `ADMIN_PASSWORD` - Custom admin password
- `TherapistEmail` / `THERAPIST_EMAIL` - Custom therapist email
- `TherapistPassword` / `THERAPIST_PASSWORD` - Custom therapist password
- `PatientEmail` / `PATIENT_EMAIL` - Custom patient email
- `PatientPassword` / `PATIENT_PASSWORD` - Custom patient password
- `SkipUserSeeding` / `SKIP_USER_SEEDING` - Skip user creation

## 🚨 Important Security Notes

1. **⚠️ NUCLEAR OPTION**: These scripts completely wipe and rebuild everything
2. **🔄 Complete Reset**: All data, containers, images, and volumes are removed
3. **🔐 Change Passwords**: Immediately change all default passwords after first login
4. **🧪 Development Use**: Designed for development/testing environments
5. **👑 Admin Access**: Admin user has access to all monitoring and management tools
6. **💾 Data Loss**: This completely destroys all existing data

## 📊 Expected Results

### Success Metrics
- **Total Containers**: 34 unique containers
- **Running Containers**: 34 (100% operational)
- **Health Status**: All services responding to health checks
- **Dashboard Access**: All management interfaces accessible
- **User Authentication**: All 3 default users can log in

### Container Distribution
- **Core Services**: 20 containers (main application)
- **Enhanced Services**: 10 containers (AI, search, CDN, etc.)
- **Monitoring Stack**: 11 containers (observability & management)
- **Infrastructure**: 5 containers (postgres, redis, nats, minio, maildev)

## 🐛 Troubleshooting

### Common Issues

**Docker Desktop not running:**
```
Error: Cannot connect to the Docker daemon
Solution: Start Docker Desktop and wait for it to be ready (green icon)
```

**Insufficient resources:**
```
Error: Container startup failures
Solution: Increase Docker Desktop memory to 8GB+ and CPU to 4+ cores
```

**Port conflicts:**
```
Error: Port already in use
Solution: Stop conflicting services or reboot system
```

**Build failures:**
```
Error: yarn workspace build failed
Solution:
1. Verify Node.js version (requires 20+): node --version
2. Clear yarn cache: yarn cache clean
3. Delete node_modules: rm -rf node_modules && yarn install
```

**User creation fails:**
```
Error: Failed to create users via SQL
Solution:
1. Verify PostgreSQL is running: docker logs clinic-app-postgres-1
2. Check database connectivity: psql -h localhost -p 5432 -U postgres -d clinic -c "SELECT NOW();"
```

### Log Inspection Commands
```bash
# Check specific container logs
docker logs clinic-app-api-gateway-1 --tail 20

# Check all container status
docker ps --filter "name=clinic-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check failed containers
docker ps -a --filter "name=clinic-app" --filter "status=exited"

# Health check database connection
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "SELECT NOW();"
```

## 🔄 Recovery Procedures

### Partial Issues (containers only)
```bash
docker compose restart <service-name>
```

### Service-Specific Rebuild
```bash
docker compose build --no-cache <service-name>
docker compose up -d <service-name>
```

### Complete System Reset
```bash
# Just run the full rebuild script again
./scripts/complete-rebuild-all-containers.sh
```

## 💡 Usage Tips

### Best Practices
1. **Close other applications** to free up system resources
2. **Stable internet connection** for Docker image downloads
3. **Run during off-hours** (rebuild takes 10-20 minutes)
4. **Monitor system resources** during the rebuild process

### Performance Optimization
- **Docker Desktop**: Allocate 8GB+ RAM and 4+ CPU cores
- **Disk Space**: Ensure 20GB+ free space for images and volumes
- **Network**: Stable internet for image downloads (2-3GB total)

## 📞 Support

If you encounter issues:

1. **Check Prerequisites**: Verify all required software is installed and running
2. **Review Logs**: Use the log inspection commands above
3. **Docker Resources**: Ensure Docker Desktop has sufficient resources allocated
4. **Network Connectivity**: Verify internet connection for image downloads
5. **Clean Environment**: Try rebooting if persistent issues occur

---

**Last Updated**: 2024-09-29
**Tested On**: Docker Desktop 4.x, Windows 11, Ubuntu 22.04, macOS 14+
**Total Containers**: 34 unique containers across all services