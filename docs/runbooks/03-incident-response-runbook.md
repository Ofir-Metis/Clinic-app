# Healthcare Platform Incident Response Runbook

## 🚨 Overview

This runbook provides structured procedures for incident response in the healthcare platform, ensuring rapid resolution while maintaining HIPAA compliance and patient data security.

## 📋 Incident Classification

### Severity Levels

#### SEV-1 (Critical) - Response Time: 5 minutes
- **Complete system outage** affecting patient care
- **Data breach** or potential PHI exposure
- **Database corruption** or data loss
- **Security compromise** with active threat
- **Authentication system failure**

#### SEV-2 (High) - Response Time: 15 minutes
- **Significant service degradation** (>50% of users affected)
- **Individual service outage** (non-critical path)
- **Performance degradation** (>5x normal response time)
- **Failed backups** or monitoring system issues
- **Suspected security incident**

#### SEV-3 (Medium) - Response Time: 1 hour
- **Minor service issues** (<20% users affected)
- **Performance warnings** (2-5x normal response time)
- **Non-critical feature failures**
- **Monitoring alerts** requiring investigation

#### SEV-4 (Low) - Response Time: 4 hours
- **Cosmetic issues** not affecting functionality
- **Enhancement requests** from users
- **Documentation updates** needed
- **Planned maintenance** coordination

### Healthcare-Specific Impact Assessment

#### Patient Care Impact
- **High**: Direct impact on patient treatment or emergency care
- **Medium**: Impact on scheduled appointments or routine care
- **Low**: Impact on administrative functions only
- **None**: No impact on healthcare delivery

#### HIPAA Compliance Impact
- **Critical**: Potential PHI breach or exposure
- **High**: Audit trail disruption or access control failure  
- **Medium**: Compliance monitoring system issues
- **Low**: Non-PHI system issues

## 🔄 Incident Response Process

### Phase 1: Detection and Triage (0-5 minutes)

#### Immediate Actions
```bash
# 1. Acknowledge the incident
curl -X POST http://pagerduty-api/incidents/ACK \
  -H "Authorization: Token $PAGERDUTY_TOKEN" \
  -d '{"incident_id": "'$INCIDENT_ID'"}'

# 2. Create incident channel
slack-cli create-channel "#incident-$INCIDENT_ID"

# 3. Initial assessment
kubectl get pods -n clinic-production --field-selector=status.phase!=Running
kubectl get events -n clinic-production --sort-by='.lastTimestamp'

# 4. Check service health
curl -f https://clinic.health.com/health || echo "Primary site down"
curl -f https://dr.clinic.health.com/health || echo "DR site down"
```

#### Triage Questions
1. **What is affected?** (Service, component, user group)
2. **How many users are impacted?** (Percentage, specific count)
3. **Is patient data at risk?** (PHI exposure assessment)
4. **Can users access critical functions?** (Emergency care, appointments)
5. **Is the issue spreading?** (Error propagation, cascade failure)

### Phase 2: Investigation and Containment (5-30 minutes)

#### Investigation Commands
```bash
# Service status check
kubectl describe pods -n clinic-production -l app=api-gateway

# Recent logs analysis
kubectl logs --tail=100 deployment/api-gateway -n clinic-production | \
  grep -E "(ERROR|FATAL|CRITICAL)"

# Database connectivity
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "SELECT version();"

# Resource utilization
kubectl top nodes
kubectl top pods -n clinic-production

# Network connectivity
kubectl exec -it deployment/api-gateway -n clinic-production -- \
  nslookup postgres-service
```

#### Security Incident Assessment
```bash
# Check for security events
curl -X GET "http://elasticsearch:9200/security-*/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "range": {"timestamp": {"gte": "now-1h"}}
    },
    "sort": [{"timestamp": {"order": "desc"}}],
    "size": 50
  }'

# Audit trail verification
curl -X GET "http://api-gateway:4000/api/audit/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -G -d "startDate=$(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ)"

# Failed authentication analysis
kubectl logs deployment/api-gateway -n clinic-production | \
  grep "LOGIN_FAILED" | tail -20
```

#### Containment Actions
```bash
# Scale affected services to zero (if necessary)
kubectl scale deployment api-gateway --replicas=0 -n clinic-production

# Enable maintenance mode
kubectl patch configmap app-config -n clinic-production \
  -p '{"data":{"MAINTENANCE_MODE":"true"}}'

# Block suspicious IP addresses
kubectl patch networkpolicy api-gateway-netpol -n clinic-production \
  --type='json' -p='[{"op": "add", "path": "/spec/ingress/0/from/-", "value": {"ipBlock": {"except": ["'$SUSPICIOUS_IP'"]}}}]'

# Isolate compromised nodes
kubectl cordon $COMPROMISED_NODE
kubectl drain $COMPROMISED_NODE --ignore-daemonsets --delete-emptydir-data
```

### Phase 3: Resolution and Recovery (30 minutes - 4 hours)

#### Common Resolution Procedures

##### Service Recovery
```bash
# Restart failed services
kubectl rollout restart deployment/api-gateway -n clinic-production
kubectl rollout status deployment/api-gateway -n clinic-production

# Database recovery
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "SELECT pg_reload_conf();"

# Clear cache
kubectl exec -it deployment/redis-cluster -n clinic-production -- \
  redis-cli FLUSHALL

# Verify service health
for service in api-gateway auth-service files-service; do
  kubectl wait --for=condition=available deployment/$service -n clinic-production --timeout=300s
done
```

##### Performance Issues
```bash
# Horizontal scaling
kubectl scale deployment api-gateway --replicas=5 -n clinic-production

# Resource limits adjustment
kubectl patch deployment api-gateway -n clinic-production -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}'

# Database optimization
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "REINDEX DATABASE clinic;"
```

##### Security Incident Response
```bash
# Change all system passwords
kubectl create secret generic postgres-credentials \
  --from-literal=password=$NEW_DB_PASSWORD \
  --dry-run=client -o yaml | kubectl apply -f -

# Rotate JWT secrets
kubectl create secret generic jwt-secrets \
  --from-literal=secret=$NEW_JWT_SECRET \
  --dry-run=client -o yaml | kubectl apply -f -

# Force user re-authentication
kubectl exec -it deployment/redis-cluster -n clinic-production -- \
  redis-cli --scan --pattern "session:*" | xargs redis-cli DEL

# Enable additional security measures
kubectl patch deployment api-gateway -n clinic-production -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","env":[{"name":"ENHANCED_SECURITY_MODE","value":"true"}]}]}}}}'
```

### Phase 4: Communication and Escalation

#### Internal Communication Template
```
INCIDENT ALERT - SEV-{LEVEL}
Incident ID: {INCIDENT_ID}
Start Time: {TIMESTAMP}
Impact: {IMPACT_DESCRIPTION}
Status: {INVESTIGATING/IDENTIFIED/MITIGATING/RESOLVED}

Current Status:
- {STATUS_UPDATE}

Patient Care Impact:
- {PATIENT_IMPACT_ASSESSMENT}

Next Update: {TIME}
Incident Commander: {NAME}
```

#### External Communication (If Required)
```
Dear Healthcare Partners,

We are currently experiencing a service issue that may affect {SPECIFIC_FUNCTIONALITY}. 

Impact: {PATIENT_CARE_IMPACT}
Timeline: {EXPECTED_RESOLUTION}
Workaround: {ALTERNATIVE_PROCEDURES}

We are working to resolve this issue as quickly as possible and will provide updates every 30 minutes.

For urgent inquiries, please contact: {EMERGENCY_CONTACT}

Healthcare IT Team
```

#### HIPAA Breach Notification Process
```bash
# If PHI potentially exposed
# 1. Immediately contain the breach
kubectl scale deployment --replicas=0 -l tier=backend -n clinic-production

# 2. Document the incident
./scripts/create-breach-incident-report.sh $INCIDENT_ID

# 3. Notify compliance officer
curl -X POST $SLACK_WEBHOOK \
  -d '{"text": "HIPAA BREACH ALERT: Incident '$INCIDENT_ID'", "channel": "#compliance-alerts"}'

# 4. Preserve evidence
kubectl get events -A --sort-by='.lastTimestamp' > /evidence/k8s-events-$INCIDENT_ID.log
kubectl logs --all-containers --prefix -n clinic-production > /evidence/pod-logs-$INCIDENT_ID.log
```

## 🔍 Specific Incident Scenarios

### Database Outage Response

#### Immediate Actions (0-5 minutes)
```bash
# 1. Verify database status
kubectl get pods -n clinic-production -l app=postgres-primary
kubectl logs deployment/postgres-primary -n clinic-production --tail=50

# 2. Check replication status
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -c "SELECT * FROM pg_stat_replication;"

# 3. Enable read-only mode
kubectl patch deployment api-gateway -n clinic-production -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","env":[{"name":"READ_ONLY_MODE","value":"true"}]}]}}}}'
```

#### Recovery Actions (5-60 minutes)
```bash
# 1. Attempt automatic recovery
kubectl rollout restart deployment/postgres-primary -n clinic-production

# 2. If primary fails, promote replica
kubectl patch service postgres-service -n clinic-production -p \
  '{"spec":{"selector":{"app":"postgres-replica"}}}'

# 3. Restore from backup if necessary
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic < /backups/latest-backup.sql

# 4. Verify data integrity
./scripts/verify-database-integrity.sh
```

### Authentication System Failure

#### Immediate Actions (0-5 minutes)
```bash
# 1. Check auth service status
kubectl get pods -n clinic-production -l app=auth-service
kubectl logs deployment/auth-service -n clinic-production --tail=50

# 2. Verify JWT secrets
kubectl get secret jwt-secrets -n clinic-production -o yaml

# 3. Check Redis session store
kubectl exec -it deployment/redis-cluster -n clinic-production -- \
  redis-cli ping
```

#### Recovery Actions (5-30 minutes)
```bash
# 1. Restart auth service
kubectl rollout restart deployment/auth-service -n clinic-production

# 2. Clear session cache
kubectl exec -it deployment/redis-cluster -n clinic-production -- \
  redis-cli FLUSHDB

# 3. Emergency admin access
kubectl exec -it deployment/api-gateway -n clinic-production -- \
  node scripts/create-emergency-admin.js

# 4. Test authentication flow
curl -X POST https://clinic.health.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@clinic.com","password":"testpass"}'
```

### File Service Outage

#### Immediate Actions (0-5 minutes)
```bash
# 1. Check file service and storage
kubectl get pods -n clinic-production -l app=files-service
kubectl get pvc -n clinic-production

# 2. Verify MinIO/S3 connectivity
kubectl exec -it deployment/files-service -n clinic-production -- \
  curl -I http://minio-service:9000/health/live

# 3. Enable file service fallback
kubectl patch deployment files-service -n clinic-production -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"files-service","env":[{"name":"FALLBACK_STORAGE","value":"true"}]}]}}}}'
```

#### Recovery Actions (5-45 minutes)
```bash
# 1. Scale file service
kubectl scale deployment files-service --replicas=3 -n clinic-production

# 2. Clear upload queue
kubectl exec -it deployment/redis-cluster -n clinic-production -- \
  redis-cli DEL upload:queue

# 3. Verify file integrity
./scripts/verify-file-integrity.sh

# 4. Resume failed uploads
kubectl exec -it deployment/files-service -n clinic-production -- \
  node scripts/resume-failed-uploads.js
```

## 📊 Post-Incident Review

### Incident Report Template
```markdown
# Incident Report - {INCIDENT_ID}

## Summary
- **Incident ID**: {INCIDENT_ID}
- **Date**: {DATE}
- **Duration**: {START_TIME} - {END_TIME} ({DURATION})
- **Severity**: SEV-{LEVEL}
- **Impact**: {USER_IMPACT_DESCRIPTION}

## Timeline
| Time | Action | Owner |
|------|--------|-------|
| {TIME} | Incident detected | {NAME} |
| {TIME} | Investigation started | {NAME} |
| {TIME} | Root cause identified | {NAME} |
| {TIME} | Mitigation applied | {NAME} |
| {TIME} | Service restored | {NAME} |

## Root Cause Analysis
### What Happened
{DETAILED_DESCRIPTION}

### Why It Happened
{ROOT_CAUSE_ANALYSIS}

### How We Fixed It
{RESOLUTION_STEPS}

## Impact Assessment
### Users Affected
- **Total Users**: {NUMBER}
- **Healthcare Providers**: {NUMBER}
- **Patients**: {NUMBER}
- **Duration of Impact**: {DURATION}

### Healthcare Operations Impact
- **Appointments Affected**: {NUMBER}
- **Patient Data Access**: {IMPACT_LEVEL}
- **Emergency Care**: {IMPACT_LEVEL}
- **Billing/Insurance**: {IMPACT_LEVEL}

### HIPAA Compliance Impact
- **PHI Exposure**: {YES/NO}
- **Audit Trail Integrity**: {STATUS}
- **Access Controls**: {STATUS}
- **Breach Notification Required**: {YES/NO}

## Action Items
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| {ACTION_ITEM} | {OWNER} | {DATE} | {PRIORITY} |

## Lessons Learned
### What Went Well
- {POSITIVE_ASPECT}

### What Could Be Improved
- {IMPROVEMENT_AREA}

### Prevention Measures
- {PREVENTION_MEASURE}
```

### Post-Incident Actions
```bash
# 1. Generate incident metrics
./scripts/generate-incident-metrics.sh $INCIDENT_ID

# 2. Update monitoring rules
kubectl apply -f monitoring/alerts/post-incident-rules.yaml

# 3. Schedule follow-up review
calendar-cli create-event "Post-incident review - $INCIDENT_ID" \
  --date "$(date -d '+1 week' +%Y-%m-%d)" \
  --duration 60

# 4. Update runbooks
git add docs/runbooks/
git commit -m "Update runbooks based on incident $INCIDENT_ID"
```

## 📞 Emergency Contacts

### Internal Escalation
```yaml
primary_oncall:
  name: "Primary On-Call Engineer"
  phone: "+1-555-0123"
  slack: "@oncall-primary"

secondary_oncall:
  name: "Secondary On-Call Engineer"  
  phone: "+1-555-0124"
  slack: "@oncall-secondary"

engineering_manager:
  name: "Engineering Manager"
  phone: "+1-555-0125"
  email: "eng-manager@clinic.com"

security_team:
  name: "Security Team Lead"
  phone: "+1-555-0126"
  email: "security@clinic.com"

compliance_officer:
  name: "HIPAA Compliance Officer"
  phone: "+1-555-0127"
  email: "compliance@clinic.com"

cto:
  name: "Chief Technology Officer"
  phone: "+1-555-0128"
  email: "cto@clinic.com"
```

### External Vendors
```yaml
cloud_provider:
  name: "AWS Support"
  phone: "+1-800-123-4567"
  case_url: "https://console.aws.amazon.com/support/"

database_vendor:
  name: "PostgreSQL Support"
  email: "support@postgresql.com"

security_vendor:
  name: "Security Operations Center"
  phone: "+1-800-765-4321"
  portal: "https://soc.security-vendor.com"
```

### Healthcare Partners
```yaml
hospital_system:
  name: "Partner Hospital System"
  emergency_line: "+1-555-EMERGENCY"
  it_contact: "it-emergency@hospital.com"

ehr_vendor:
  name: "EHR System Vendor"
  support_line: "+1-800-EHR-HELP"
  escalation: "critical-support@ehr-vendor.com"
```

This incident response runbook ensures rapid, structured response to incidents while maintaining healthcare compliance and patient safety requirements.