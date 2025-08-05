# Healthcare Platform Monitoring Runbook

## 📊 Overview

This runbook provides comprehensive monitoring procedures for the healthcare platform, covering system health, performance metrics, security monitoring, and HIPAA compliance tracking.

## 🎯 Monitoring Strategy

### Monitoring Pillars
1. **System Health** - Infrastructure and service availability
2. **Performance** - Response times, throughput, resource utilization
3. **Security** - Threat detection, access monitoring, compliance
4. **Business Metrics** - Healthcare-specific KPIs and user engagement
5. **Compliance** - HIPAA audit trails and regulatory requirements

### Monitoring Stack
- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboards
- **Alertmanager** - Alert routing and management
- **Elasticsearch** - Log aggregation and search
- **Jaeger** - Distributed tracing
- **Custom Exporters** - Healthcare-specific metrics

## 🖥️ Dashboard Management

### Critical Dashboards

#### 1. System Overview Dashboard
```
URL: /d/system-overview
Refresh: 30s
Panels:
- Service availability (uptime %)
- Total requests per minute
- Error rate by service
- Response time percentiles
- Active user sessions
- Database connection pool status
```

#### 2. Healthcare Operations Dashboard
```
URL: /d/healthcare-ops
Refresh: 1m
Panels:
- Active patient sessions
- Appointments scheduled/completed
- File uploads in progress
- AI processing queue
- Billing transactions
- Compliance score
```

#### 3. Infrastructure Dashboard
```
URL: /d/infrastructure
Refresh: 30s
Panels:
- CPU/Memory usage by node
- Disk I/O and storage utilization
- Network traffic and latency
- Load balancer metrics
- Database performance
- Cache hit rates
```

#### 4. Security Dashboard
```
URL: /d/security
Refresh: 10s
Panels:
- Failed authentication attempts
- Suspicious activity alerts
- Rate limiting violations
- Unauthorized access attempts
- Security event timeline
- Audit trail status
```

### Dashboard Access Control
```bash
# Admin users - Full access
curl -X POST http://grafana:3000/api/orgs/1/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"loginOrEmail":"admin@clinic.com","role":"Admin"}'

# Operations team - Viewer access
curl -X POST http://grafana:3000/api/orgs/1/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"loginOrEmail":"ops@clinic.com","role":"Viewer"}'

# Healthcare staff - Limited dashboard access
curl -X POST http://grafana:3000/api/orgs/1/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"loginOrEmail":"staff@clinic.com","role":"Viewer"}'
```

## 🚨 Alert Configuration

### Critical Alerts (P1 - Immediate Response)

#### Service Down Alert
```yaml
groups:
- name: service_availability
  rules:
  - alert: ServiceDown
    expr: up{job=~"api-gateway|auth-service|files-service"} == 0
    for: 30s
    labels:
      severity: critical
      priority: P1
      healthcare_impact: high
    annotations:
      summary: "Critical service {{ $labels.job }} is down"
      description: "Service {{ $labels.job }} has been down for more than 30 seconds"
      runbook_url: "https://runbooks.clinic.com/service-down"
      escalation: "immediate"
```

#### Database Connection Failure
```yaml
- alert: DatabaseConnectionFailure
  expr: postgresql_up == 0
  for: 10s
  labels:
    severity: critical
    priority: P1
    healthcare_impact: high
  annotations:
    summary: "PostgreSQL database is unreachable"
    description: "Database connection has failed - patient data access affected"
    runbook_url: "https://runbooks.clinic.com/database-failure"
    escalation: "immediate"
```

#### High Memory Usage
```yaml
- alert: HighMemoryUsage
  expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 0.9
  for: 2m
  labels:
    severity: critical
    priority: P1
  annotations:
    summary: "High memory usage detected"
    description: "Memory usage is above 90% on node {{ $labels.instance }}"
    runbook_url: "https://runbooks.clinic.com/high-memory"
```

### High Priority Alerts (P2 - Quick Response)

#### High Error Rate
```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
  for: 2m
  labels:
    severity: warning
    priority: P2
    healthcare_impact: medium
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.service }}"
    runbook_url: "https://runbooks.clinic.com/high-error-rate"
```

#### Slow Response Time
```yaml
- alert: SlowResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 3m
  labels:
    severity: warning
    priority: P2
  annotations:
    summary: "Slow response times detected"
    description: "95th percentile response time is {{ $value }}s for {{ $labels.service }}"
    runbook_url: "https://runbooks.clinic.com/slow-response"
```

### Security Alerts (P1/P2 - Immediate/Quick Response)

#### Multiple Failed Logins
```yaml
- alert: MultipleFailedLogins
  expr: increase(failed_login_attempts_total[5m]) > 10
  for: 0s
  labels:
    severity: warning
    priority: P2
    security_event: true
  annotations:
    summary: "Multiple failed login attempts detected"
    description: "{{ $value }} failed login attempts in 5 minutes from {{ $labels.ip }}"
    runbook_url: "https://runbooks.clinic.com/failed-logins"
```

#### Suspicious Activity
```yaml
- alert: SuspiciousActivity
  expr: suspicious_activity_score > 80
  for: 0s
  labels:
    severity: critical
    priority: P1
    security_event: true
  annotations:
    summary: "Suspicious activity detected"
    description: "Suspicious activity score {{ $value }} detected for user {{ $labels.user_id }}"
    runbook_url: "https://runbooks.clinic.com/suspicious-activity"
```

## 🔍 Log Monitoring

### Log Collection Strategy

#### Application Logs
```bash
# Configure structured logging
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: logging-config
  namespace: clinic-production
data:
  log-level: "info"
  log-format: "json"
  audit-enabled: "true"
  sensitive-data-masking: "true"
EOF
```

#### Audit Logs
```bash
# Monitor audit log volume
kubectl logs -f deployment/api-gateway -n clinic-production | \
  jq 'select(.level=="audit")' | \
  jq -r '.timestamp + " " + .eventType + " " + .userId'

# Search for specific audit events
curl -X GET "http://elasticsearch:9200/audit-*/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "bool": {
        "must": [
          {"term": {"eventType": "PATIENT_DATA_ACCESSED"}},
          {"range": {"timestamp": {"gte": "now-1h"}}}
        ]
      }
    }
  }'
```

#### Security Logs
```bash
# Monitor security events
curl -X GET "http://elasticsearch:9200/security-*/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "bool": {
        "must": [
          {"term": {"category": "SECURITY"}},
          {"term": {"severity": "HIGH"}},
          {"range": {"timestamp": {"gte": "now-15m"}}}
        ]
      }
    },
    "sort": [{"timestamp": {"order": "desc"}}]
  }'
```

### Log Analysis Queries

#### Top Error Messages
```json
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        {"term": {"level": "error"}},
        {"range": {"timestamp": {"gte": "now-1h"}}}
      ]
    }
  },
  "aggs": {
    "top_errors": {
      "terms": {
        "field": "message.keyword",
        "size": 10
      }
    }
  }
}
```

#### Patient Data Access Patterns
```json
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        {"exists": {"field": "patientId"}},
        {"range": {"timestamp": {"gte": "now-24h"}}}
      ]
    }
  },
  "aggs": {
    "access_by_user": {
      "terms": {
        "field": "userId.keyword",
        "size": 20
      }
    },
    "access_by_hour": {
      "date_histogram": {
        "field": "timestamp",
        "interval": "1h"
      }
    }
  }
}
```

## 📈 Performance Monitoring

### Key Performance Indicators (KPIs)

#### System Performance
```promql
# API Response Time (95th percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Database Query Performance
rate(postgresql_queries_total[5m])

# Cache Hit Rate  
rate(redis_keyspace_hits_total[5m]) / (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m]))

# Disk I/O Utilization
rate(node_disk_io_time_seconds_total[5m])
```

#### Healthcare-Specific Metrics
```promql
# Active Patient Sessions
sum(active_patient_sessions)

# Appointment Completion Rate
rate(appointments_completed_total[1h]) / rate(appointments_scheduled_total[1h])

# File Upload Success Rate
rate(file_uploads_successful_total[5m]) / rate(file_uploads_total[5m])

# AI Processing Time
histogram_quantile(0.95, rate(ai_processing_duration_seconds_bucket[5m]))
```

### Performance Baselines

#### Response Time Targets
- **Authentication**: < 200ms (95th percentile)
- **Patient Data Retrieval**: < 300ms (95th percentile)
- **File Upload**: < 5 seconds for 10MB files
- **Search Operations**: < 500ms (95th percentile)
- **Report Generation**: < 10 seconds

#### Throughput Targets
- **API Requests**: > 1000 req/sec sustained
- **Database Queries**: > 500 queries/sec
- **File Uploads**: > 50 concurrent uploads
- **WebSocket Connections**: > 1000 concurrent connections

## 🛡️ Security Monitoring

### Security Event Detection

#### Real-time Monitoring
```bash
# Monitor failed authentication attempts
kubectl logs -f deployment/api-gateway -n clinic-production | \
  grep "LOGIN_FAILED" | \
  jq -r '.timestamp + " " + .ipAddress + " " + .userId'

# Track suspicious IP addresses
kubectl logs -f deployment/api-gateway -n clinic-production | \
  grep "SUSPICIOUS_ACTIVITY" | \
  jq -r '.ipAddress' | \
  sort | uniq -c | sort -nr
```

#### Security Metrics Collection
```yaml
# Prometheus rules for security metrics
groups:
- name: security_metrics
  rules:
  - record: security:failed_logins_per_minute
    expr: rate(failed_login_attempts_total[1m]) * 60
    
  - record: security:suspicious_activities_per_hour  
    expr: rate(suspicious_activity_total[1h]) * 3600
    
  - record: security:unauthorized_access_attempts
    expr: rate(unauthorized_access_total[5m]) * 300
```

### Compliance Monitoring

#### HIPAA Audit Requirements
```bash
# Daily audit report generation
./scripts/generate-daily-audit-report.sh $(date +%Y-%m-%d)

# Patient access log verification
curl -X GET "http://api-gateway:4000/api/audit/patient/{patientId}/access-log" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "X-Audit-Purpose: compliance-review"

# Compliance score calculation
curl -X GET "http://api-gateway:4000/api/compliance/score" \
  -H "Authorization: Bearer $COMPLIANCE_TOKEN"
```

## 🔧 Monitoring Maintenance

### Daily Tasks

#### Morning Health Check (09:00)
```bash
#!/bin/bash
# Daily morning health check script

echo "=== Daily Health Check - $(date) ==="

# 1. Check service availability
kubectl get pods -n clinic-production --field-selector=status.phase!=Running

# 2. Check disk space
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  df -h | grep -E "(/$|/data)"

# 3. Verify backup completion
ls -la /backups/$(date +%Y%m%d)*.sql

# 4. Check alert status
curl -s "http://alertmanager:9093/api/v1/alerts" | \
  jq '.data[] | select(.status.state=="firing")'

# 5. Generate daily report
./scripts/generate-health-report.sh > /reports/health-$(date +%Y%m%d).txt
```

#### Evening Performance Review (18:00)
```bash
#!/bin/bash
# Daily evening performance review

echo "=== Daily Performance Review - $(date) ==="

# 1. Performance metrics summary
curl -s "http://prometheus:9090/api/v1/query?query=avg_over_time(http_request_duration_seconds{quantile=\"0.95\"}[24h])" | \
  jq '.data.result[0].value[1]'

# 2. Error rate analysis  
curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[24h])" | \
  jq '.data.result'

# 3. Resource utilization trends
kubectl top nodes
kubectl top pods -n clinic-production

# 4. Security events summary
curl -X GET "http://elasticsearch:9200/security-*/_count" \
  -H "Content-Type: application/json" \
  -d '{"query": {"range": {"timestamp": {"gte": "now-24h"}}}}'
```

### Weekly Tasks

#### Performance Trend Analysis (Monday 10:00)
```bash
# Weekly performance trending
./scripts/weekly-performance-analysis.sh

# Capacity planning review
./scripts/capacity-planning-review.sh

# Security posture assessment
./scripts/weekly-security-review.sh
```

#### Monitoring System Maintenance (Sunday 02:00)
```bash
# Clean up old metrics (retain 30 days)
curl -X POST http://prometheus:9090/api/v1/admin/tsdb/delete_series \
  -d 'match[]={__name__=~".*"}' \
  -d 'start=0' \
  -d 'end='$(date -d '30 days ago' +%s)

# Elasticsearch index maintenance
curl -X DELETE "http://elasticsearch:9200/logs-$(date -d '30 days ago' +%Y.%m.%d)"

# Grafana dashboard backup
./scripts/backup-grafana-dashboards.sh
```

## 📞 Escalation Procedures

### Alert Severity Levels

#### P1 - Critical (Immediate Response - 5 minutes)
- Complete service outage
- Database unavailable
- Security breach detected
- HIPAA violation alert

**Escalation Path:**
1. On-call engineer (SMS/Phone)
2. Engineering manager (5 min delay)
3. CTO (10 min delay)
4. CEO (15 min delay)

#### P2 - High (Quick Response - 15 minutes)
- Degraded performance
- High error rates
- Individual service issues
- Security warnings

**Escalation Path:**
1. On-call engineer (Slack/Email)
2. Engineering manager (15 min delay)
3. CTO (30 min delay)

#### P3 - Medium (Normal Response - 1 hour)
- Performance warnings
- Capacity concerns
- Non-critical errors

**Escalation Path:**
1. Engineering team (Slack)
2. Engineering manager (1 hour delay)

### Contact Information
```yaml
contacts:
  primary_oncall: "+1-555-0123"
  secondary_oncall: "+1-555-0124"
  engineering_manager: "manager@clinic.com"
  security_team: "security@clinic.com"
  compliance_officer: "compliance@clinic.com"
  
notification_channels:
  slack_critical: "#alerts-critical"
  slack_warnings: "#alerts-warnings"
  email_list: "ops-team@clinic.com"
  pagerduty_key: "XXXXXXXXXXXXXXXX"
```

## 📋 Monitoring Checklist

### Daily Monitoring Tasks
- [ ] Review overnight alerts and incidents
- [ ] Check service availability dashboard
- [ ] Verify backup completion
- [ ] Review security events
- [ ] Monitor patient data access patterns
- [ ] Check compliance metrics
- [ ] Validate monitoring system health

### Weekly Monitoring Tasks
- [ ] Performance trend analysis
- [ ] Capacity planning review
- [ ] Security posture assessment
- [ ] Monitoring system maintenance
- [ ] Alert rule effectiveness review
- [ ] Dashboard accuracy verification
- [ ] Escalation procedure testing

### Monthly Monitoring Tasks
- [ ] Comprehensive performance review
- [ ] Monitoring infrastructure updates
- [ ] Alert fatigue analysis
- [ ] SLA compliance assessment
- [ ] Disaster recovery testing
- [ ] Monitoring cost optimization
- [ ] Team training and updates

This monitoring runbook ensures comprehensive oversight of the healthcare platform with emphasis on reliability, security, and compliance requirements.