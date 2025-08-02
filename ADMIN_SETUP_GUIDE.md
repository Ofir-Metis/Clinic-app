# 🚀 Clinic Management System - Production Admin Console Setup Guide

## Overview

This guide walks you through setting up the complete production-ready admin console for the Clinic Management System. The admin console provides enterprise-grade system management capabilities including security, monitoring, compliance, API management, and performance optimization.

## 📋 Prerequisites

- Node.js 20+ 
- PostgreSQL 12+
- Redis 6+
- Docker & Docker Compose
- Yarn package manager

## 🗄️ Database Setup

### 1. Create Admin Database

```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE clinic_admin;
CREATE USER clinic_admin_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE clinic_admin TO clinic_admin_user;

-- Connect to clinic_admin database
\c clinic_admin;
GRANT CREATE ON SCHEMA public TO clinic_admin_user;
GRANT USAGE ON SCHEMA public TO clinic_admin_user;
```

### 2. Run Database Migrations

```bash
# Navigate to api-gateway service
cd services/api-gateway

# Install dependencies
yarn install

# Copy environment configuration
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=clinic_admin_user
# DB_PASSWORD=secure_password_here
# DB_NAME=clinic_admin

# Run the migration
psql -h localhost -U clinic_admin_user -d clinic_admin -f src/admin/migrations/001_create_admin_tables.sql
```

## 🔧 Environment Configuration

### 1. API Gateway Configuration

Update `services/api-gateway/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=clinic_admin_user
DB_PASSWORD=secure_password_here
DB_NAME=clinic_admin

# JWT Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h

# Admin User
ADMIN_EMAIL=admin@clinic.com
ADMIN_PASSWORD=SecureAdminPass123!

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=30m

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# Backup
BACKUP_STORAGE_PATH=/var/backups/clinic
BACKUP_RETENTION_DAYS=90

# Performance
METRICS_RETENTION_DAYS=90
PERFORMANCE_ALERT_THRESHOLD_CPU=80
PERFORMANCE_ALERT_THRESHOLD_MEMORY=85

# Compliance
AUDIT_RETENTION_DAYS=2555  # 7 years
COMPLIANCE_REPORT_SCHEDULE=0 0 1 * *  # Monthly
```

### 2. Frontend Configuration

Update `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
VITE_ADMIN_ENABLED=true
```

## 🚀 Starting the Admin Console

### 1. Start Infrastructure Services

```bash
# From project root
docker compose up postgres redis nats minio maildev -d
```

### 2. Start Backend Services

```bash
# Build common library first
yarn workspace @clinic/common build

# Start API Gateway with admin console
yarn workspace api-gateway start:dev
```

### 3. Start Frontend

```bash
# Start frontend development server
cd frontend
yarn dev
```

## 👤 Admin Access

### Default Admin User

The migration creates a default admin user:
- **Email**: `admin@clinic.com`
- **Password**: `Admin123!`
- **Role**: `admin`

### First Login

1. Navigate to `http://localhost:5173/login`
2. Login with the default credentials
3. **IMMEDIATELY change the default password** in Settings
4. Enable MFA (Multi-Factor Authentication) for enhanced security

## 🎛️ Admin Console Features

### 1. Main Dashboard (`/admin`)
- System health overview
- Quick access to all management tools
- Key metrics and alerts

### 2. API Management (`/admin/api-management`)
- API key creation and management
- Rate limiting configuration
- Client application management
- Usage analytics and monitoring
- Security controls and IP blocking

### 3. Security Management
- Multi-factor authentication setup
- User session management
- Security event monitoring
- Access control policies

### 4. Backup & Recovery
- Automated backup scheduling
- Manual backup creation
- Disaster recovery planning
- Backup verification and restoration

### 5. Monitoring & Alerts
- Real-time system monitoring
- Performance metrics dashboard
- Alert configuration and management
- Service health checks

### 6. Configuration Management
- Environment-specific configurations
- Feature flag management
- Deployment controls
- Configuration templates

### 7. Compliance & Audit
- HIPAA/GDPR compliance reporting
- Comprehensive audit trails
- Risk assessments
- Data subject rights management
- Policy management

### 8. Performance Optimization
- Database query optimization
- Cache management and tuning
- Load balancer configuration
- Performance profiling tools
- Load testing capabilities

## 🔐 Security Hardening

### 1. Change Default Credentials

```bash
# First login, immediately update admin password
# Navigate to Settings > Change Password
```

### 2. Enable MFA

```bash
# In admin console:
# 1. Go to Security settings
# 2. Enable TOTP (Time-based One-Time Password)
# 3. Scan QR code with authenticator app
# 4. Verify with test code
```

### 3. Configure Access Controls

```bash
# Set up role-based access:
# - admin: Full system access
# - compliance_officer: Audit and compliance features
# - performance_engineer: Performance monitoring
# - security_officer: Security management
```

### 4. IP Allowlisting (Recommended)

```env
# Add to .env
ADMIN_ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8
```

## 📊 Monitoring Setup

### 1. Performance Metrics

The system automatically collects:
- Response times
- Throughput rates
- Error rates
- Resource utilization
- Database performance

### 2. Alerts Configuration

Set up alerts for:
- High response times (>1000ms)
- Error rates (>5%)
- CPU usage (>80%)
- Memory usage (>85%)
- Disk space (>90%)

### 3. Compliance Monitoring

Automated tracking of:
- Failed login attempts
- Data access patterns
- Privileged operations
- Security events
- Regulatory compliance metrics

## 🔄 Backup Strategy

### 1. Automated Backups

```bash
# Database backups (daily)
0 2 * * * pg_dump clinic_admin > /var/backups/clinic/db_$(date +%Y%m%d).sql

# File backups (weekly)
0 3 * * 0 tar -czf /var/backups/clinic/files_$(date +%Y%m%d).tar.gz /path/to/files

# Configuration backups (daily)
0 1 * * * cp -r /path/to/configs /var/backups/clinic/config_$(date +%Y%m%d)
```

### 2. Disaster Recovery Testing

Monthly DR tests:
1. Restore from backup to test environment
2. Verify data integrity
3. Test application functionality
4. Document any issues

## 📈 Scaling Considerations

### 1. Database Scaling

```bash
# Read replicas for reporting
# Connection pooling
# Query optimization
# Partitioning for large tables
```

### 2. Application Scaling

```bash
# Load balancer configuration
# Horizontal scaling with multiple instances
# Cache optimization
# CDN for static assets
```

### 3. Monitoring Scaling

```bash
# Metrics aggregation
# Log centralization
# Alert optimization
# Dashboard performance
```

## 🚨 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U clinic_admin_user -d clinic_admin -c "SELECT 1;"

# Check logs
tail -f /var/log/postgresql/postgresql-*.log
```

### Authentication Problems

```bash
# Check JWT secret configuration
# Verify admin user exists in database
# Check failed login attempts and lockouts
# Review audit logs for security events
```

### Performance Issues

```bash
# Check system resources
htop
df -h
iostat -x 1

# Review slow queries
# Check cache hit rates
# Monitor API response times
```

## 📚 API Documentation

### Admin Endpoints

- **GET** `/admin/health` - System health check
- **GET** `/admin/users` - List admin users
- **POST** `/admin/users` - Create admin user
- **GET** `/admin/audit/events` - Audit trail
- **GET** `/admin/metrics` - System metrics

### Security Endpoints

- **POST** `/security/mfa/setup` - Setup MFA
- **POST** `/security/mfa/verify` - Verify MFA token
- **GET** `/security/sessions` - Active sessions
- **DELETE** `/security/sessions/:id` - Terminate session

### API Management Endpoints

- **GET** `/api-management/keys` - List API keys
- **POST** `/api-management/keys` - Create API key
- **POST** `/api-management/keys/:id/revoke` - Revoke API key
- **GET** `/api-management/analytics` - Usage analytics

## 🔄 Maintenance

### Daily Tasks
- Monitor system alerts
- Review audit logs
- Check backup status
- Performance metrics review

### Weekly Tasks
- Security event analysis
- Compliance report review
- Performance optimization
- User access review

### Monthly Tasks
- Disaster recovery testing
- Security vulnerability assessment
- Compliance reporting
- System optimization

## 📞 Support

### Documentation
- API documentation: `/api/docs`
- Database schema: `src/admin/entities/`
- Configuration options: `.env.example`

### Logging
- Application logs: `/var/log/clinic/`
- Audit logs: Database `audit_events` table
- Performance metrics: Database `performance_metrics` table

### Monitoring
- Health check: `GET /admin/health`
- Metrics endpoint: `GET /admin/metrics`
- Alert dashboard: `/admin` (Monitoring tab)

---

## ✅ Production Checklist

- [ ] Database migrations applied
- [ ] Default admin password changed
- [ ] MFA enabled for admin users
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured
- [ ] Security hardening completed
- [ ] Performance baselines established
- [ ] Compliance policies configured
- [ ] Disaster recovery tested
- [ ] Documentation reviewed

**🎉 Your production-ready admin console is now operational!**

The clinic management system now includes enterprise-grade administrative capabilities with comprehensive security, monitoring, compliance, and performance management features.