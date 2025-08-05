# Healthcare Platform Maintenance Runbook

## 🔧 Overview

This runbook provides comprehensive maintenance procedures for the healthcare platform, covering scheduled maintenance, system updates, performance optimization, and preventive measures to ensure continuous operation and HIPAA compliance.

## 📅 Maintenance Schedule

### Daily Maintenance Tasks (Automated)

#### System Health Checks (06:00 UTC)
```bash
#!/bin/bash
# File: /scripts/daily-health-check.sh

echo "=== Daily Health Check - $(date) ==="

# 1. Service availability check
UNHEALTHY_PODS=$(kubectl get pods -n clinic-production --field-selector=status.phase!=Running --no-headers | wc -l)
if [ "$UNHEALTHY_PODS" -gt 0 ]; then
  echo "⚠️  Unhealthy pods detected: $UNHEALTHY_PODS"
  kubectl get pods -n clinic-production --field-selector=status.phase!=Running
fi

# 2. Database connection verification
DB_STATUS=$(kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "SELECT 1;" 2>/dev/null | grep -c "1 row")

if [ "$DB_STATUS" -eq 0 ]; then
  echo "❌ Database connection failed"
  exit 1
else
  echo "✅ Database connection healthy"
fi

# 3. Storage capacity check
STORAGE_USAGE=$(kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  df -h /var/lib/postgresql/data | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$STORAGE_USAGE" -gt 85 ]; then
  echo "⚠️  High storage usage: ${STORAGE_USAGE}%"
  ./scripts/storage-cleanup.sh
fi

# 4. Memory usage verification
HIGH_MEMORY_PODS=$(kubectl top pods -n clinic-production --no-headers | \
  awk '$3 > 80 {print $1 " " $3}')

if [ -n "$HIGH_MEMORY_PODS" ]; then
  echo "⚠️  High memory usage detected:"
  echo "$HIGH_MEMORY_PODS"
fi

# 5. SSL certificate expiry check
CERT_DAYS=$(openssl x509 -in /etc/ssl/certs/clinic.crt -noout -dates | \
  grep notAfter | cut -d= -f2 | xargs -I {} date -d {} +%s)
CURRENT_DATE=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($CERT_DAYS - $CURRENT_DATE) / 86400 ))

if [ "$DAYS_UNTIL_EXPIRY" -lt 30 ]; then
  echo "⚠️  SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
fi

# 6. Backup verification
LATEST_BACKUP=$(find /backups/postgres -name "clinic_full_*.dump" -mtime -1 | wc -l)
if [ "$LATEST_BACKUP" -eq 0 ]; then
  echo "❌ No recent database backup found"
else
  echo "✅ Recent backup verified"
fi

echo "=== Health Check Complete ==="
```

#### Log Rotation and Cleanup (02:00 UTC)
```bash
#!/bin/bash
# File: /scripts/log-maintenance.sh

echo "Starting log maintenance - $(date)"

# 1. Rotate application logs
kubectl exec -it deployment/api-gateway -n clinic-production -- \
  find /var/log -name "*.log" -size +100M -exec gzip {} \;

# 2. Clean old log files (keep 30 days)
kubectl exec -it deployment/api-gateway -n clinic-production -- \
  find /var/log -name "*.log.gz" -mtime +30 -delete

# 3. Clean Kubernetes logs
find /var/log/pods -name "*.log" -mtime +7 -delete

# 4. Archive audit logs (keep 7 years for HIPAA)
find /var/log/audit -name "*.log" -mtime +2555 -exec \
  tar -czf /archives/audit-$(date +%Y%m%d).tar.gz {} \; -delete

# 5. Clean temporary files
kubectl exec -it deployment/files-service -n clinic-production -- \
  find /tmp -type f -mtime +1 -delete

echo "Log maintenance completed"
```

### Weekly Maintenance Tasks

#### Performance Optimization (Sunday 01:00 UTC)
```bash
#!/bin/bash
# File: /scripts/weekly-performance-optimization.sh

echo "Starting weekly performance optimization - $(date)"

# 1. Database maintenance
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "VACUUM ANALYZE;"

kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "REINDEX DATABASE clinic;"

# 2. Update database statistics
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "ANALYZE;"

# 3. Redis cache optimization
kubectl exec -it deployment/redis-cluster -n clinic-production -- \
  redis-cli MEMORY PURGE

# Clear expired keys
kubectl exec -it deployment/redis-cluster -n clinic-production -- \
  redis-cli --scan --pattern "*:expired:*" | xargs redis-cli DEL

# 4. File system cleanup
kubectl exec -it deployment/files-service -n clinic-production -- \
  find /app/storage/temp -type f -mtime +7 -delete

# 5. Container image cleanup on nodes
kubectl get nodes -o name | while read node; do
  kubectl debug "$node" -it --image=alpine -- \
    docker system prune -f --filter "until=168h"
done

# 6. Kubernetes resource cleanup
kubectl delete pods -n clinic-production --field-selector=status.phase=Succeeded
kubectl delete pods -n clinic-production --field-selector=status.phase=Failed

echo "Weekly performance optimization completed"
```

#### Security Updates (Wednesday 03:00 UTC)
```bash
#!/bin/bash
# File: /scripts/weekly-security-updates.sh

echo "Starting weekly security updates - $(date)"

# 1. Update container images with security patches
IMAGES=(
  "clinic/api-gateway"
  "clinic/auth-service"
  "clinic/files-service"
  "clinic/frontend"
)

for image in "${IMAGES[@]}"; do
  echo "Updating $image..."
  
  # Build new image with latest security patches
  docker build -t "$image:latest-secure" \
    --build-arg BASE_IMAGE_TAG=latest \
    --build-arg SECURITY_UPDATES=true \
    "services/$(echo $image | cut -d'/' -f2)/"
  
  # Security scan
  trivy image --exit-code 1 --severity HIGH,CRITICAL "$image:latest-secure"
  
  if [ $? -eq 0 ]; then
    echo "✅ Security scan passed for $image"
    docker tag "$image:latest-secure" "$image:$(date +%Y%m%d)"
    docker push "$image:$(date +%Y%m%d)"
  else
    echo "❌ Security vulnerabilities found in $image"
  fi
done

# 2. Update Kubernetes cluster components
kubectl get nodes -o json | jq -r '.items[].metadata.name' | while read node; do
  # Check for available updates
  kubectl debug "$node" -it --image=ubuntu -- \
    apt list --upgradable | grep -i security
done

# 3. Update monitoring and security tools
helm upgrade prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --wait

helm upgrade grafana grafana/grafana \
  --namespace monitoring --wait

echo "Weekly security updates completed"
```

### Monthly Maintenance Tasks

#### Comprehensive System Audit (First Sunday 02:00 UTC)
```bash
#!/bin/bash
# File: /scripts/monthly-system-audit.sh

AUDIT_DATE=$(date +%Y-%m)
AUDIT_DIR="/audits/$AUDIT_DATE"
mkdir -p "$AUDIT_DIR"

echo "Starting monthly system audit - $AUDIT_DATE"

# 1. Resource utilization analysis
kubectl top nodes > "$AUDIT_DIR/node-resources.txt"
kubectl top pods -A > "$AUDIT_DIR/pod-resources.txt"

# 2. Storage analysis
kubectl get pv -o json | jq -r '.items[] | "\(.metadata.name) \(.spec.capacity.storage) \(.status.phase)"' > \
  "$AUDIT_DIR/storage-analysis.txt"

# 3. Database performance analysis
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "SELECT * FROM pg_stat_database;" > \
  "$AUDIT_DIR/database-stats.txt"

kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 20;" > \
  "$AUDIT_DIR/slow-queries.txt"

# 4. Security posture assessment
kubectl get networkpolicies -A -o yaml > "$AUDIT_DIR/network-policies.yaml"
kubectl get rolebindings,clusterrolebindings -A -o yaml > "$AUDIT_DIR/rbac-config.yaml"

# 5. Compliance status check
curl -s "http://api-gateway:4000/api/compliance/report" \
  -H "Authorization: Bearer $AUDIT_TOKEN" > \
  "$AUDIT_DIR/compliance-report.json"

# 6. Backup integrity verification
./scripts/verify-all-backups.sh > "$AUDIT_DIR/backup-verification.txt"

# 7. Generate audit summary
cat > "$AUDIT_DIR/audit-summary.md" << EOF
# Monthly System Audit - $AUDIT_DATE

## Summary
- Audit Date: $(date)
- System Uptime: $(kubectl get nodes -o json | jq -r '.items[0].metadata.creationTimestamp')
- Total Services: $(kubectl get deployments -n clinic-production --no-headers | wc -l)
- Total Storage: $(kubectl get pv --no-headers | awk '{sum += $2} END {print sum}')

## Key Findings
- Resource utilization within acceptable limits
- All security policies in place
- Backup verification successful
- Compliance score: $(curl -s "http://api-gateway:4000/api/compliance/score" -H "Authorization: Bearer $AUDIT_TOKEN" | jq '.score')%

## Recommendations
- Continue monitoring resource trends
- Review slow query performance
- Update security configurations as needed
EOF

echo "Monthly system audit completed - $AUDIT_DIR"
```

## 🚀 System Updates and Upgrades

### Application Updates

#### Zero-Downtime Deployment Process
```bash
#!/bin/bash
# File: /scripts/zero-downtime-deployment.sh

SERVICE_NAME="$1"
NEW_VERSION="$2"
NAMESPACE="clinic-production"

echo "Starting zero-downtime deployment: $SERVICE_NAME -> $NEW_VERSION"

# 1. Pre-deployment validation
kubectl get deployment "$SERVICE_NAME" -n "$NAMESPACE" > /dev/null
if [ $? -ne 0 ]; then
  echo "❌ Service $SERVICE_NAME not found"
  exit 1
fi

# 2. Create backup of current deployment
kubectl get deployment "$SERVICE_NAME" -n "$NAMESPACE" -o yaml > \
  "/backups/deployments/${SERVICE_NAME}-$(date +%Y%m%d-%H%M%S).yaml"

# 3. Update deployment with new image
kubectl set image deployment/"$SERVICE_NAME" \
  "$SERVICE_NAME=clinic/$SERVICE_NAME:$NEW_VERSION" \
  -n "$NAMESPACE"

# 4. Monitor rollout progress
kubectl rollout status deployment/"$SERVICE_NAME" -n "$NAMESPACE" --timeout=600s

if [ $? -eq 0 ]; then
  echo "✅ Deployment successful"
  
  # 5. Run post-deployment tests
  ./scripts/post-deployment-tests.sh "$SERVICE_NAME"
  
  if [ $? -eq 0 ]; then
    echo "✅ Post-deployment tests passed"
  else
    echo "❌ Post-deployment tests failed - rolling back"
    kubectl rollout undo deployment/"$SERVICE_NAME" -n "$NAMESPACE"
    exit 1
  fi
else
  echo "❌ Deployment failed - rolling back"
  kubectl rollout undo deployment/"$SERVICE_NAME" -n "$NAMESPACE"
  exit 1
fi

echo "Zero-downtime deployment completed successfully"
```

#### Database Schema Updates
```bash
#!/bin/bash
# File: /scripts/database-schema-update.sh

MIGRATION_FILE="$1"
BACKUP_NAME="pre-migration-$(date +%Y%m%d-%H%M%S)"

echo "Starting database schema update with $MIGRATION_FILE"

# 1. Create backup before migration
./scripts/database-backup.sh "$BACKUP_NAME"

# 2. Validate migration file
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

# 3. Test migration on replica database first
kubectl exec -it deployment/postgres-replica -n clinic-production -- \
  psql -U postgres -d clinic_replica -f "/migrations/$(basename $MIGRATION_FILE)"

if [ $? -ne 0 ]; then
  echo "❌ Migration failed on replica database"
  exit 1
fi

# 4. Apply migration to primary database
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -f "/migrations/$(basename $MIGRATION_FILE)"

if [ $? -eq 0 ]; then
  echo "✅ Database migration successful"
  
  # 5. Verify data integrity
  ./scripts/verify-database-integrity.sh
  
  # 6. Update application configuration if needed
  kubectl rollout restart deployment/api-gateway -n clinic-production
else
  echo "❌ Database migration failed - restoring backup"
  ./scripts/database-restore.sh "/backups/postgres/$BACKUP_NAME.dump"
  exit 1
fi

echo "Database schema update completed"
```

### Infrastructure Updates

#### Kubernetes Cluster Updates
```bash
#!/bin/bash
# File: /scripts/cluster-update.sh

TARGET_VERSION="$1"
CURRENT_VERSION=$(kubectl version --short | grep "Server Version" | awk '{print $3}')

echo "Updating Kubernetes cluster from $CURRENT_VERSION to $TARGET_VERSION"

# 1. Pre-update backup
kubectl get all,pv,pvc,secrets,configmaps -A -o yaml > \
  "/backups/kubernetes/pre-update-$(date +%Y%m%d-%H%M%S).yaml"

# 2. Drain nodes one by one (for managed clusters, this may be automatic)
kubectl get nodes -o name | while read node; do
  echo "Draining node: $node"
  kubectl drain "$node" --ignore-daemonsets --delete-emptydir-data --force --grace-period=300
  
  # Update node (implementation depends on cloud provider)
  # For AWS EKS:
  # aws eks update-nodegroup-version --cluster-name clinic-cluster --nodegroup-name worker-nodes --version $TARGET_VERSION
  
  # Wait for node to be ready
  kubectl wait --for=condition=Ready "$node" --timeout=900s
  
  # Uncordon node
  kubectl uncordon "$node"
  
  echo "Node $node updated successfully"
done

# 3. Verify cluster health
kubectl get nodes
kubectl get pods -A --field-selector=status.phase!=Running

# 4. Run post-update tests
./scripts/cluster-health-check.sh

echo "Kubernetes cluster update completed"
```

## 🔍 Preventive Maintenance

### Performance Monitoring and Optimization

#### Database Performance Tuning
```bash
#!/bin/bash
# File: /scripts/database-performance-tuning.sh

echo "Starting database performance tuning - $(date)"

# 1. Analyze query performance
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "
    SELECT query, calls, total_time, mean_time, stddev_time, rows 
    FROM pg_stat_statements 
    WHERE calls > 100 
    ORDER BY mean_time DESC 
    LIMIT 10;" > /tmp/slow-queries.txt

# 2. Check for missing indexes
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "
    SELECT schemaname, tablename, attname, n_distinct, correlation 
    FROM pg_stats 
    WHERE schemaname = 'public' 
    AND n_distinct > 100 
    AND correlation < 0.1;" > /tmp/index-candidates.txt

# 3. Analyze table bloat
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "
    SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
    LIMIT 10;" > /tmp/table-sizes.txt

# 4. Update PostgreSQL configuration for better performance
kubectl exec -it deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -c "
    ALTER SYSTEM SET shared_buffers = '256MB';
    ALTER SYSTEM SET effective_cache_size = '1GB';
    ALTER SYSTEM SET random_page_cost = 1.1;
    SELECT pg_reload_conf();"

# 5. Generate performance report
cat > "/reports/database-performance-$(date +%Y%m%d).md" << EOF
# Database Performance Report - $(date +%Y-%m-%d)

## Slow Queries
$(cat /tmp/slow-queries.txt)

## Index Candidates
$(cat /tmp/index-candidates.txt)

## Table Sizes
$(cat /tmp/table-sizes.txt)

## Recommendations
- Review and optimize slow queries
- Consider adding indexes for frequently queried columns
- Monitor table growth and implement archiving if needed
EOF

echo "Database performance tuning completed"
```

#### Application Performance Optimization
```bash
#!/bin/bash
# File: /scripts/application-performance-optimization.sh

echo "Starting application performance optimization - $(date)"

# 1. Memory usage analysis
kubectl top pods -n clinic-production --sort-by=memory > /tmp/memory-usage.txt

# 2. CPU usage analysis  
kubectl top pods -n clinic-production --sort-by=cpu > /tmp/cpu-usage.txt

# 3. Optimize resource allocation based on usage patterns
while read pod cpu memory; do
  if [ "$memory" = "<unknown>" ] || [ "$cpu" = "<unknown>" ]; then
    continue
  fi
  
  # Extract numeric values
  MEMORY_MB=$(echo "$memory" | sed 's/Mi//')
  CPU_MILLICORES=$(echo "$cpu" | sed 's/m//')
  
  # Adjust resources if usage is consistently low or high
  if [ "$MEMORY_MB" -gt 1000 ]; then
    echo "High memory usage detected for $pod: ${MEMORY_MB}Mi"
  elif [ "$MEMORY_MB" -lt 100 ]; then
    echo "Low memory usage detected for $pod: ${MEMORY_MB}Mi - consider reducing allocation"
  fi
  
  if [ "$CPU_MILLICORES" -gt 800 ]; then
    echo "High CPU usage detected for $pod: ${CPU_MILLICORES}m"
  elif [ "$CPU_MILLICORES" -lt 50 ]; then
    echo "Low CPU usage detected for $pod: ${CPU_MILLICORES}m - consider reducing allocation"
  fi
done < <(tail -n +2 /tmp/cpu-usage.txt)

# 4. Cache optimization
kubectl exec -it deployment/redis-cluster -n clinic-production -- \
  redis-cli INFO memory | grep used_memory_human

# Clear unused cache entries
kubectl exec -it deployment/redis-cluster -n clinic-production -- \
  redis-cli --scan --pattern "*" | \
  while read key; do
    TTL=$(kubectl exec -it deployment/redis-cluster -n clinic-production -- \
      redis-cli TTL "$key")
    if [ "$TTL" -eq -1 ]; then
      # Key has no expiration - set appropriate TTL
      kubectl exec -it deployment/redis-cluster -n clinic-production -- \
        redis-cli EXPIRE "$key" 3600  # 1 hour default
    fi
  done

echo "Application performance optimization completed"
```

## 📊 Maintenance Reporting

### Maintenance Status Dashboard
```bash
#!/bin/bash
# File: /scripts/maintenance-status-report.sh

REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="/reports/maintenance-status-$REPORT_DATE.json"

# Collect maintenance metrics
UPTIME=$(kubectl get nodes -o json | jq -r '.items[0].status.nodeInfo.bootID')
LAST_RESTART=$(kubectl get pods -n clinic-production -o json | \
  jq -r '.items[] | .status.containerStatuses[0].restartCount' | \
  awk '{sum += $1} END {print sum}')

STORAGE_USAGE=$(kubectl get pv -o json | \
  jq -r '.items[] | .spec.capacity.storage' | \
  sed 's/Gi//' | awk '{sum += $1} END {print sum}')

BACKUP_STATUS=$(find /backups -name "*.dump" -mtime -1 | wc -l)

# Generate maintenance status report
cat > "$REPORT_FILE" << EOF
{
  "report_date": "$REPORT_DATE",
  "system_status": {
    "uptime_days": $(( $(date +%s) - $(date -d "$(kubectl get nodes -o json | jq -r '.items[0].metadata.creationTimestamp')" +%s) )) / 86400,
    "total_restarts": $LAST_RESTART,
    "storage_usage_gb": $STORAGE_USAGE,
    "recent_backups": $BACKUP_STATUS
  },
  "maintenance_completed": {
    "daily_health_checks": true,
    "log_rotation": true,
    "security_updates": "$(date -d 'last wednesday' +%Y-%m-%d)",
    "performance_optimization": "$(date -d 'last sunday' +%Y-%m-%d)"
  },
  "upcoming_maintenance": {
    "next_security_update": "$(date -d 'next wednesday' +%Y-%m-%d)",
    "next_performance_optimization": "$(date -d 'next sunday' +%Y-%m-%d)",
    "next_monthly_audit": "$(date -d 'first sunday next month' +%Y-%m-%d)"
  }
}
EOF

# Send status update
curl -X POST "$SLACK_WEBHOOK" -d "{
  \"channel\": \"#maintenance\",
  \"text\": \"📊 Daily Maintenance Status - $REPORT_DATE\",
  \"attachments\": [{
    \"color\": \"good\",
    \"title\": \"System Health Summary\",
    \"fields\": [
      {\"title\": \"Uptime\", \"value\": \"$(( $(date +%s) - $(date -d "$(kubectl get nodes -o json | jq -r '.items[0].metadata.creationTimestamp')" +%s) )) / 86400) days\", \"short\": true},
      {\"title\": \"Recent Backups\", \"value\": \"$BACKUP_STATUS\", \"short\": true},
      {\"title\": \"Storage Usage\", \"value\": \"${STORAGE_USAGE}GB\", \"short\": true},
      {\"title\": \"System Restarts\", \"value\": \"$LAST_RESTART\", \"short\": true}
    ]
  }]
}"

echo "Maintenance status report generated: $REPORT_FILE"
```

### Maintenance Calendar Integration
```bash
#!/bin/bash
# File: /scripts/maintenance-calendar.sh

# Schedule upcoming maintenance windows
cat > "/schedules/maintenance-calendar.ics" << EOF
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Healthcare Platform//Maintenance Calendar//EN
BEGIN:VEVENT
UID:weekly-perf-opt@clinic.health.com
DTSTART:$(date -d 'next sunday 01:00' +%Y%m%dT%H%M%SZ)
DURATION:PT2H
SUMMARY:Weekly Performance Optimization
DESCRIPTION:Automated performance optimization and database maintenance
RRULE:FREQ=WEEKLY;BYDAY=SU
END:VEVENT
BEGIN:VEVENT
UID:weekly-security-updates@clinic.health.com
DTSTART:$(date -d 'next wednesday 03:00' +%Y%m%dT%H%M%SZ)
DURATION:PT3H
SUMMARY:Weekly Security Updates
DESCRIPTION:Security patches and vulnerability remediation
RRULE:FREQ=WEEKLY;BYDAY=WE
END:VEVENT
BEGIN:VEVENT
UID:monthly-audit@clinic.health.com
DTSTART:$(date -d 'first sunday next month 02:00' +%Y%m%dT%H%M%SZ)
DURATION:PT4H
SUMMARY:Monthly System Audit
DESCRIPTION:Comprehensive system audit and compliance review
RRULE:FREQ=MONTHLY;BYSETPOS=1;BYDAY=SU
END:VEVENT
END:VCALENDAR
EOF

echo "Maintenance calendar updated"
```

This comprehensive maintenance runbook ensures the healthcare platform operates at peak performance with minimal downtime while maintaining security and compliance standards.