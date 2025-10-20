# 🔧 Troubleshooting & Maintenance Guide

## 📋 Overview

Comprehensive troubleshooting guide for the Healthcare Platform covering common issues, emergency procedures, and maintenance tasks for production environments.

---

## 🚨 **Emergency Procedures**

### 🆘 **Critical System Issues**

#### **🔴 Complete System Down**
```bash
# 1. Enable maintenance mode immediately
./scripts/maintenance-mode.sh enable "Emergency maintenance in progress"

# 2. Check system status
./scripts/system-health-check.sh

# 3. Check all services
docker-compose ps
kubectl get pods  # if using Kubernetes

# 4. Emergency rollback if needed
./scripts/emergency-rollback.sh "System down - rolling back"

# 5. Notify team
curl -X POST $SLACK_WEBHOOK_URL \
  -d '{"text":"🚨 CRITICAL: Healthcare Platform is DOWN. Emergency response initiated."}'
```

#### **🟠 Database Connection Lost**
```bash
# 1. Check database status
docker-compose exec postgres pg_isready -U postgres

# 2. View database logs
docker-compose logs postgres --tail=100

# 3. Check connection pool
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "\
  SELECT count(*) as active_connections, 
         max_conn, 
         (count(*)::float/max_conn::float)*100 as pct_used 
  FROM pg_stat_activity, 
       (SELECT setting::int as max_conn FROM pg_settings WHERE name='max_connections') mc;"

# 4. Restart database if needed (CAUTION!)
docker-compose restart postgres

# 5. Verify application reconnection
curl http://localhost:4000/health
```

#### **🟡 High CPU/Memory Usage**
```bash
# 1. Check system resources
htop
docker stats

# 2. Identify problematic containers
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# 3. Scale down if needed
docker-compose scale api-gateway=2  # reduce instances

# 4. Check for memory leaks
./scripts/memory-analysis.sh

# 5. Restart problematic services
docker-compose restart service-name
```

---

## 🔍 **Common Issues & Solutions**

### 🐛 **Development Issues**

#### **"@clinic/common not found" Error**
**Problem**: Shared library not built or not accessible

**Solution**:
```bash
# Build the shared library first (always required)
yarn workspace @clinic/common build

# Clear node_modules if persists
rm -rf node_modules services/*/node_modules libs/*/node_modules
yarn install
yarn workspace @clinic/common build

# Verify build output
ls -la libs/common/dist
```

#### **Port Already in Use**
**Problem**: Port conflicts preventing service startup

**Solution**:
```bash
# Find what's using the port
lsof -i :4000  # replace with your port
netstat -tulpn | grep :4000

# Kill the process using the port
kill -9 $(lsof -t -i:4000)

# Or use different ports in docker-compose.yml
# Change port mapping from 4000:4000 to 4001:4000
```

#### **Docker Build Failures**
**Problem**: Docker containers failing to build

**Solution**:
```bash
# Clear Docker cache
docker system prune -a --volumes

# Build specific service with verbose output
docker-compose build --no-cache api-gateway

# Check Dockerfile syntax
docker run --rm -i hadolint/hadolint < services/api-gateway/Dockerfile

# Check disk space
df -h
docker system df
```

### 🌐 **API Issues**

#### **401 Unauthorized Errors**
**Problem**: JWT token issues or authentication failures

**Solution**:
```bash
# Check JWT secret configuration
echo $JWT_SECRET  # should not be empty or default

# Verify token format
echo "YOUR_TOKEN" | cut -d. -f2 | base64 -d | jq

# Test authentication endpoint
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check user exists in database
psql -h localhost -U postgres -d clinic -c "SELECT * FROM users WHERE email = 'test@example.com';"
```

#### **500 Internal Server Error**
**Problem**: Server-side errors in microservices

**Solution**:
```bash
# Check service logs
docker-compose logs api-gateway --tail=50
docker-compose logs auth-service --tail=50

# Check database connection
curl http://localhost:4000/health

# Verify environment variables
docker-compose config | grep -A 20 "api-gateway"

# Test with minimal request
curl -X GET http://localhost:4000/health -v
```

#### **Slow API Response Times**
**Problem**: Performance issues with API calls

**Solution**:
```bash
# Check database query performance
psql -h localhost -U postgres -d clinic -c "\
  SELECT query, mean_time, calls, total_time \
  FROM pg_stat_statements \
  ORDER BY total_time DESC LIMIT 10;"

# Monitor resource usage
docker stats --no-stream

# Check for database locks
psql -h localhost -U postgres -d clinic -c "\
  SELECT pid, usename, query, state, backend_start \
  FROM pg_stat_activity \
  WHERE state != 'idle';"

# Enable query logging temporarily
echo "log_statement = 'all'" >> postgresql.conf
docker-compose restart postgres
```

### 📁 **File Upload Issues**

#### **File Upload Timeouts**
**Problem**: Large files failing to upload

**Solution**:
```bash
# Check nginx upload limits (if using nginx)
grep client_max_body_size /etc/nginx/nginx.conf

# Check Node.js limits in your app
grep -r "limit" services/files-service/src

# Test upload directly to service
curl -X POST http://localhost:3003/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_large_file.mp4" \
  --max-time 300

# Check MinIO/S3 connectivity
aws s3 ls --endpoint-url http://localhost:9000
```

#### **"File Not Found" Errors**
**Problem**: Files uploaded but not accessible

**Solution**:
```bash
# Check MinIO/S3 bucket contents
mc ls local/clinic-dev  # if using MinIO locally
aws s3 ls s3://your-bucket/  # if using S3

# Verify file permissions
ls -la /path/to/uploads/

# Check database file records
psql -h localhost -U postgres -d clinic -c "\
  SELECT id, file_name, file_path, created_at \
  FROM files \
  ORDER BY created_at DESC LIMIT 10;"
```

### 🔔 **Notification Issues**

#### **Emails Not Sending**
**Problem**: SMTP configuration or email service issues

**Solution**:
```bash
# Test SMTP connection
telnet $SMTP_HOST $SMTP_PORT

# Check email service logs
docker-compose logs notifications-service --tail=50

# Test with simple email
curl -X POST http://localhost:3004/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "to": "test@example.com",
    "subject": "Test",
    "body": "Test email"
  }'

# Check MailDev (development)
curl http://localhost:8025  # MailDev web interface
```

#### **SMS Not Sending**
**Problem**: Twilio configuration or SMS service issues

**Solution**:
```bash
# Test Twilio credentials
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

# Check phone number format
echo "+1234567890" | grep -E "^\+[1-9]\d{1,14}$"

# Test SMS sending
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  -d "To=+1234567890" \
  -d "From=$TWILIO_PHONE_NUMBER" \
  -d "Body=Test message" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

---

## 🏥 **Healthcare-Specific Issues**

### 🔐 **HIPAA Compliance Issues**

#### **Audit Log Failures**
**Problem**: Audit logging not working properly

**Solution**:
```bash
# Check audit log table
psql -h localhost -U postgres -d clinic -c "\
  SELECT COUNT(*) as total_logs, 
         MAX(created_at) as latest_log,
         MIN(created_at) as earliest_log
  FROM audit_logs;"

# Check audit service
curl http://localhost:4000/admin/audit-logs?limit=5 \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Verify audit configuration
grep -r "HIPAA_AUDIT_ENABLED" .env*

# Test audit logging
curl -X POST http://localhost:4000/test-audit \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **Data Encryption Issues**
**Problem**: Encrypted data not accessible

**Solution**:
```bash
# Check encryption key
echo $ENCRYPTION_KEY | wc -c  # should be 32 characters

# Test encryption/decryption
node -e "
  const crypto = require('crypto');
  const key = process.env.ENCRYPTION_KEY;
  const text = 'test data';
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  console.log('Encryption test passed');
"

# Check database encrypted fields
psql -h localhost -U postgres -d clinic -c "\
  SELECT id, LENGTH(encrypted_field) as encrypted_length 
  FROM sensitive_data 
  LIMIT 5;"
```

---

## 📊 **Monitoring & Alerts**

### 📈 **Performance Monitoring**

#### **High Response Times**
**Problem**: API responses taking too long

**Diagnosis**:
```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:4000/health

# Create curl-format.txt:
cat > curl-format.txt << 'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF

# Check database performance
psql -h localhost -U postgres -d clinic -c "\
  SELECT schemaname, tablename, 
         n_tup_ins + n_tup_upd + n_tup_del as total_writes,
         n_tup_ins, n_tup_upd, n_tup_del,
         seq_scan, seq_tup_read, idx_scan, idx_tup_fetch
  FROM pg_stat_user_tables 
  ORDER BY total_writes DESC;"
```

#### **Memory Leaks**
**Problem**: Services consuming too much memory

**Solution**:
```bash
# Monitor memory usage over time
while true; do
  echo "$(date): $(docker stats --no-stream --format 'table {{.Container}}\t{{.MemUsage}}' | grep api-gateway)"
  sleep 60
done

# Generate heap dump (Node.js services)
docker exec api-gateway-container kill -USR2 1

# Analyze memory usage
docker exec api-gateway-container cat /proc/1/status | grep -E "(VmSize|VmRSS|VmData)"
```

### 🚨 **Alert Configuration**

#### **Setting Up Alerts**
```bash
# Test Slack webhook
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text":"Test alert from Healthcare Platform"}'

# Configure Prometheus alerts
cat > alerts.yml << 'EOF'
groups:
  - name: healthcare-platform
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"
EOF
```

---

## 🔧 **Maintenance Tasks**

### 📅 **Regular Maintenance**

#### **Daily Tasks**
```bash
#!/bin/bash
# daily-maintenance.sh

echo "Starting daily maintenance - $(date)"

# 1. Check system health
./scripts/system-health-check.sh

# 2. Database maintenance
psql -h localhost -U postgres -d clinic -c "VACUUM ANALYZE;"

# 3. Clean old log files
find /var/log -name "*.log" -mtime +7 -delete

# 4. Check disk space
df -h | grep -E "(8[5-9]|9[0-9])%" && echo "WARNING: Disk space low"

# 5. Backup database
./scripts/backup-database.sh

# 6. Update SSL certificates if needed
./scripts/check-ssl-expiry.sh

echo "Daily maintenance completed - $(date)"
```

#### **Weekly Tasks**
```bash
#!/bin/bash
# weekly-maintenance.sh

echo "Starting weekly maintenance - $(date)"

# 1. Update system packages (staging first)
sudo apt update && sudo apt list --upgradable

# 2. Rotate logs
sudo logrotate -f /etc/logrotate.conf

# 3. Clean Docker resources
docker system prune -f

# 4. Update dependencies (security patches)
yarn audit --audit-level=high
npm audit --audit-level=high

# 5. Performance analysis
./scripts/performance-report.sh

# 6. Security scan
./scripts/security-scan.sh

echo "Weekly maintenance completed - $(date)"
```

#### **Monthly Tasks**
```bash
#!/bin/bash
# monthly-maintenance.sh

echo "Starting monthly maintenance - $(date)"

# 1. Full system backup
./scripts/full-system-backup.sh

# 2. Database optimization
psql -h localhost -U postgres -d clinic -c "\
  REINDEX DATABASE clinic;
  VACUUM FULL;
  ANALYZE;"

# 3. SSL certificate renewal check
certbot renew --dry-run

# 4. Security audit
./scripts/comprehensive-security-audit.sh

# 5. Performance benchmarking
./scripts/performance-benchmark.sh

# 6. Dependency updates (non-security)
yarn upgrade-interactive

echo "Monthly maintenance completed - $(date)"
```

### 💾 **Backup & Recovery**

#### **Database Backup**
```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
BACKUP_FILE="$BACKUP_DIR/clinic_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to cloud storage (if configured)
if [ ! -z "$AWS_S3_BACKUP_BUCKET" ]; then
  aws s3 cp "$BACKUP_FILE.gz" "s3://$AWS_S3_BACKUP_BUCKET/database/"
fi

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Database backup completed: $BACKUP_FILE.gz"
```

#### **System Recovery**
```bash
#!/bin/bash
# restore-database.sh <backup-file>

BACKUP_FILE=$1
TEMP_DB="clinic_restore_$(date +%s)"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

echo "Restoring database from $BACKUP_FILE..."

# Create temporary database
createdb -h $POSTGRES_HOST -U $POSTGRES_USER $TEMP_DB

# Restore to temporary database
gunzip -c $BACKUP_FILE | psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $TEMP_DB

# Verify restore
TABLE_COUNT=$(psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $TEMP_DB -t -c "\
  SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo "Restored database has $TABLE_COUNT tables"

# Manual step: rename databases
echo "Manual step required:"
echo "1. Stop application: docker-compose stop"
echo "2. Rename current database: ALTER DATABASE clinic RENAME TO clinic_old;"
echo "3. Rename restored database: ALTER DATABASE $TEMP_DB RENAME TO clinic;"
echo "4. Start application: docker-compose start"
```

---

## 🔐 **Security Maintenance**

### 🛡️ **Security Updates**

#### **Vulnerability Scanning**
```bash
#!/bin/bash
# security-scan.sh

echo "Starting security scan - $(date)"

# 1. Container vulnerability scan
trivy image clinic-app/api-gateway:latest
trivy image clinic-app/frontend:latest

# 2. Dependency vulnerability scan
yarn audit --audit-level=moderate
npm audit --audit-level=moderate

# 3. SSL certificate check
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# 4. File permissions audit
find . -type f -perm -o+w | grep -v node_modules

# 5. Environment variable security
grep -r "password\|secret\|key" .env* | grep -v ".example"

echo "Security scan completed - $(date)"
```

#### **SSL Certificate Management**
```bash
#!/bin/bash
# ssl-management.sh

# Check certificate expiry
openssl x509 -in /etc/ssl/certs/yourdomain.com.crt -noout -dates

# Renew Let's Encrypt certificates
certbot renew --post-hook "systemctl restart nginx"

# Test SSL configuration
curl -I https://yourdomain.com | grep -E "(HTTP|SSL)"
```

---

## 📞 **Getting Help**

### 🆘 **Support Escalation**

#### **Level 1: Self-Service**
1. Check this troubleshooting guide
2. Search logs for error messages
3. Check system monitoring dashboards
4. Review recent changes/deployments

#### **Level 2: Team Support**
- **DevOps Team**: devops@clinic-app.com
- **Development Team**: dev@clinic-app.com
- **Security Team**: security@clinic-app.com

#### **Level 3: Emergency**
- **Emergency Slack**: #production-alerts
- **On-call**: Use PagerDuty integration
- **Emergency Phone**: +1-XXX-XXX-XXXX

### 📋 **Incident Response**

#### **Incident Template**
```markdown
## Incident Report

**Incident ID**: INC-YYYY-MM-DD-###
**Severity**: Critical/High/Medium/Low
**Status**: Investigating/Identified/Monitoring/Resolved

### Summary
Brief description of the incident

### Impact
- Affected services:
- Affected users:
- Duration:

### Timeline
- HH:MM - Issue detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix implemented
- HH:MM - Service restored

### Root Cause
Technical explanation of what caused the issue

### Resolution
Steps taken to resolve the issue

### Prevention
Actions to prevent similar incidents
```

---

## 🎯 **Useful Commands Reference**

### 📋 **Quick Commands**
```bash
# System health check
curl http://localhost:4000/health

# Service status
docker-compose ps

# View logs
docker-compose logs service-name --tail=50

# Database connection test
psql -h localhost -U postgres -d clinic -c "SELECT 1;"

# Memory usage
free -h
docker stats --no-stream

# Disk usage  
df -h
docker system df

# Network test
ping google.com
curl -I https://api.yourdomain.com

# SSL test
openssl s_client -connect yourdomain.com:443
```

### 🔧 **Emergency Commands**
```bash
# Emergency stop
docker-compose stop

# Emergency restart
docker-compose restart

# Emergency rollback
./scripts/emergency-rollback.sh "reason"

# Maintenance mode
./scripts/maintenance-mode.sh enable "maintenance message"

# Clear all containers
docker-compose down && docker-compose up -d
```

---

## 📚 **Additional Resources**

- **System Monitoring**: http://localhost:3000 (Grafana)
- **Log Analysis**: http://localhost:3100 (Loki)
- **API Documentation**: http://localhost:4000/api-docs
- **Health Dashboard**: http://localhost:4000/health

---

**🔧 Your Healthcare Platform is equipped with comprehensive troubleshooting and maintenance procedures! 🌟**

*Keep this guide handy for quick issue resolution and preventive maintenance.*
