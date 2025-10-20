# Docker Deployment Guide

## 🚀 Modular Docker Compose Architecture

The clinic platform now uses a modular Docker Compose setup for flexible deployment scenarios:

### 📁 Docker Compose Files

| File | Services | Containers | Use Case |
|------|----------|------------|----------|
| `docker-compose.core.yml` | Essential clinic functionality | 13 | Basic clinic operations |
| `docker-compose.enhanced.yml` | Advanced features | 7 | AI, analytics, billing, search |
| `docker-compose.monitoring.yml` | Admin & monitoring tools | 10 | Production monitoring |
| `docker-compose.production-ready.yml` | All services combined | 27 | Complete production setup |

---

## 🎯 Deployment Scenarios

### 1. Core Services Only (13 containers)
**Perfect for:** Development, testing, basic clinic operations
```bash
docker-compose -f docker-compose.core.yml up -d
```

**Includes:**
- ✅ Infrastructure: PostgreSQL, Redis, NATS, MinIO
- ✅ Core Services: API Gateway, Auth, Appointments, Files, Notes, Notifications, Settings
- ✅ Frontend: React application
- ✅ MailDev: Email testing (web UI at :1080)

### 2. Core + Enhanced Services (20 containers)
**Perfect for:** Full-featured clinic with AI and analytics
```bash
docker-compose -f docker-compose.core.yml -f docker-compose.enhanced.yml up -d
```

**Adds:**
- ✅ AI Service (OpenAI integration)
- ✅ Analytics Service (reporting & insights)
- ✅ Billing Service (payments & invoicing)
- ✅ Search Service (Elasticsearch)
- ✅ CDN Service (content delivery)
- ✅ Google Integration (Calendar/Gmail)
- ✅ Therapists Service (profiles)
- ✅ Client Relationships Service (coach-client connections)
- ✅ Progress Service (goal tracking)
- ✅ Elasticsearch infrastructure

### 3. Core + Monitoring (23 containers)
**Perfect for:** Production deployment with monitoring
```bash
docker-compose -f docker-compose.core.yml -f docker-compose.monitoring.yml up -d
```

**Adds:**
- ✅ Prometheus (metrics)
- ✅ Grafana (dashboards)
- ✅ Loki (log aggregation)
- ✅ Nginx (load balancer)
- ✅ Security monitoring
- ✅ Database admin tools
- ✅ Health monitoring

### 4. Full Production Setup (27+ containers)
**Perfect for:** Complete enterprise deployment
```bash
# Option A: All-in-one file
docker-compose -f docker-compose.production-ready.yml up -d

# Option B: Modular approach
docker-compose -f docker-compose.core.yml -f docker-compose.enhanced.yml -f docker-compose.monitoring.yml up -d
```

---

## ⚡ Quick Start Commands

### Start Core Services
```bash
# Start essential services
docker-compose -f docker-compose.core.yml up -d

# Check status
docker-compose -f docker-compose.core.yml ps

# View logs
docker-compose -f docker-compose.core.yml logs -f api-gateway
```

### Add Enhanced Features
```bash
# Add AI, analytics, and advanced features
docker-compose -f docker-compose.core.yml -f docker-compose.enhanced.yml up -d
```

### Add Monitoring Stack
```bash
# Add complete monitoring suite
docker-compose -f docker-compose.core.yml -f docker-compose.monitoring.yml up -d
```

### Scale Services
```bash
# Scale API Gateway for high load
docker-compose -f docker-compose.core.yml up -d --scale api-gateway=3
```

---

## 🔧 Environment Configuration

Create a `.env` file with required variables:

```env
# Database
POSTGRES_PASSWORD=your_secure_password

# Security
JWT_SECRET=your_jwt_secret_key

# Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# AI Features (Optional)
OPENAI_API_KEY=sk-your-openai-key

# Google Integration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback

# Notifications (Optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
GRAFANA_PASSWORD=secure_grafana_password
```

---

## 📊 Service Ports

### Core Services
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:4000
- **Auth Service**: http://localhost:3001
- **Appointments**: http://localhost:3002
- **Files Service**: http://localhost:3003
- **Notifications**: http://localhost:3004
- **Notes Service**: http://localhost:3006
- **Settings**: http://localhost:3008

### Enhanced Services
- **AI Service**: http://localhost:3005
- **Analytics**: http://localhost:3007
- **Billing**: http://localhost:3009
- **Search**: http://localhost:3010
- **CDN**: http://localhost:3011
- **Google Integration**: http://localhost:3012
- **Therapists**: http://localhost:3013
- **Client Relationships**: http://localhost:3014
- **Progress Service**: http://localhost:3015

### Infrastructure
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **NATS**: localhost:4222
- **MinIO Console**: http://localhost:9001
- **Elasticsearch**: http://localhost:9200
- **MailDev (Email Testing)**: http://localhost:1080

### Monitoring
- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090
- **Uptime Kuma**: http://localhost:3001
- **PgAdmin**: http://localhost:5050
- **Redis Commander**: http://localhost:8081

---

## 🛠️ Management Commands

### Health Checks
```bash
# Check all services health
docker-compose -f docker-compose.core.yml ps

# Check specific service logs
docker-compose -f docker-compose.core.yml logs api-gateway

# Follow logs in real-time
docker-compose -f docker-compose.core.yml logs -f --tail=100
```

### Maintenance
```bash
# Stop services
docker-compose -f docker-compose.core.yml down

# Stop and remove volumes (⚠️ DATA LOSS)
docker-compose -f docker-compose.core.yml down -v

# Rebuild services
docker-compose -f docker-compose.core.yml build --no-cache

# Update and restart
docker-compose -f docker-compose.core.yml pull
docker-compose -f docker-compose.core.yml up -d
```

### Database Operations
```bash
# Connect to database
docker-compose -f docker-compose.core.yml exec postgres psql -U postgres -d clinic

# Backup database
docker-compose -f docker-compose.core.yml exec postgres pg_dump -U postgres clinic > backup.sql

# Restore database
docker-compose -f docker-compose.core.yml exec -T postgres psql -U postgres clinic < backup.sql
```

---

## 🚀 Production Deployment

### Resource Requirements

| Deployment | RAM | CPU | Storage |
|------------|-----|-----|---------|
| Core Services | 4GB | 2 cores | 20GB |
| Core + Enhanced | 8GB | 4 cores | 50GB |
| Full Production | 16GB | 8 cores | 100GB |

### Performance Tuning
```bash
# Optimize for production
export COMPOSE_PARALLEL_LIMIT=10

# Use production images
docker-compose -f docker-compose.production-ready.yml up -d
```

---

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Check if ports are already in use
2. **Memory issues**: Increase Docker memory allocation
3. **Network issues**: Ensure Docker network is created
4. **Permission issues**: Check file permissions for volumes

### Debug Commands
```bash
# Check Docker resources
docker system df
docker system events

# Inspect networks
docker network ls
docker network inspect clinic-app_clinic-network

# Check container resources
docker stats
```

---

## 📝 Development Workflow

1. **Start core** for basic development
2. **Add enhanced** when testing AI/analytics features  
3. **Add monitoring** for production-like testing
4. **Use production-ready** for full system testing

This modular approach saves resources and speeds up development cycles! 🎉