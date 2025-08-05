# Healthcare Platform Backup and Recovery Runbook

## 🔒 Overview

This runbook provides comprehensive backup and recovery procedures for the healthcare platform, ensuring HIPAA-compliant data protection and business continuity with emphasis on patient data integrity and availability.

## 📊 Backup Strategy

### Backup Types and Frequency

#### Database Backups
- **Full Backup**: Daily at 02:00 UTC (7-year retention)
- **Incremental Backup**: Every 6 hours (30-day retention)
- **Transaction Log Backup**: Every 15 minutes (7-day retention)
- **Point-in-Time Recovery**: Continuous WAL archiving

#### File System Backups
- **Patient Files**: Real-time replication + daily snapshots (7-year retention)
- **Application Configuration**: Daily (1-year retention)
- **Log Files**: Weekly archival (3-year retention for audit logs)
- **System State**: Weekly full system backup (3-month retention)

#### Application State Backups
- **Kubernetes Manifests**: Daily GitOps sync + weekly snapshots
- **Secrets and ConfigMaps**: Daily encrypted backup
- **Persistent Volumes**: Daily snapshots with geo-replication
- **Container Images**: Immutable registry with versioning

### Backup Locations

#### Primary Backup Storage
```yaml
primary_location:
  type: "AWS S3"
  region: "us-east-1"
  bucket: "clinic-backups-primary"
  encryption: "AES-256"
  versioning: true
  lifecycle_policy: "healthcare-retention"
```

#### Secondary Backup Storage
```yaml
secondary_location:
  type: "Azure Blob Storage"
  region: "East US 2"
  container: "clinic-backups-secondary"
  encryption: "Customer-managed keys"
  replication: "Cross-region"
  compliance: "HIPAA-certified"
```

#### Tertiary Backup Storage
```yaml
tertiary_location:
  type: "On-premises"
  location: "Data center facility"
  media: "LTO-8 tapes"
  rotation: "Grandfather-Father-Son"
  offsite_storage: "Iron Mountain"
```

## 💾 Database Backup Procedures

### Automated Database Backup

#### Daily Full Backup Script
```bash
#!/bin/bash
# File: /scripts/database-backup.sh

set -euo pipefail

# Configuration
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
S3_BUCKET="s3://clinic-backups-primary/database"
RETENTION_DAYS=2555  # 7 years for HIPAA compliance

# Create backup directory
mkdir -p "$BACKUP_DIR"

# PostgreSQL full backup with compression
kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  pg_dump -U postgres -d clinic --verbose --format=custom --compress=9 \
  --no-owner --no-privileges > "$BACKUP_DIR/clinic_full_$BACKUP_DATE.dump"

# Verify backup integrity
kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  pg_restore --list "$BACKUP_DIR/clinic_full_$BACKUP_DATE.dump" > /dev/null

if [ $? -eq 0 ]; then
  echo "Backup verification successful"
else
  echo "Backup verification failed" >&2
  exit 1
fi

# Encrypt backup
gpg --cipher-algo AES256 --compress-algo 2 --s2k-mode 3 \
  --s2k-digest-algo SHA512 --s2k-count 65536 --symmetric \
  --output "$BACKUP_DIR/clinic_full_$BACKUP_DATE.dump.gpg" \
  "$BACKUP_DIR/clinic_full_$BACKUP_DATE.dump"

# Upload to primary storage
aws s3 cp "$BACKUP_DIR/clinic_full_$BACKUP_DATE.dump.gpg" \
  "$S3_BUCKET/full/" --sse AES256

# Upload to secondary storage
az storage blob upload \
  --file "$BACKUP_DIR/clinic_full_$BACKUP_DATE.dump.gpg" \
  --container-name clinic-backups-secondary \
  --name "database/full/clinic_full_$BACKUP_DATE.dump.gpg"

# Create backup metadata
cat > "$BACKUP_DIR/clinic_full_$BACKUP_DATE.meta" << EOF
{
  "backup_type": "full",
  "timestamp": "$BACKUP_DATE",
  "database": "clinic",
  "size_bytes": $(stat -c%s "$BACKUP_DIR/clinic_full_$BACKUP_DATE.dump.gpg"),
  "checksum": "$(sha256sum "$BACKUP_DIR/clinic_full_$BACKUP_DATE.dump.gpg" | cut -d' ' -f1)",
  "retention_until": "$(date -d '+2555 days' +%Y-%m-%d)",
  "compliance": "HIPAA",
  "encryption": "GPG-AES256"
}
EOF

# Log backup completion
echo "$(date): Full backup completed - $BACKUP_DATE" >> /var/log/backup.log

# Cleanup local files older than 7 days
find "$BACKUP_DIR" -name "*.dump*" -mtime +7 -delete

# Send notification
curl -X POST "$SLACK_WEBHOOK" -d "{\"text\":\"✅ Database backup completed: $BACKUP_DATE\"}"
```

#### Incremental Backup Script
```bash
#!/bin/bash
# File: /scripts/database-incremental-backup.sh

set -euo pipefail

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres/incremental"
WAL_DIR="/var/lib/postgresql/data/pg_wal"

# Create incremental backup using WAL-E or similar
kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  pg_basebackup -U postgres -D - -Ft -z -P | \
  gpg --symmetric --cipher-algo AES256 > "$BACKUP_DIR/incremental_$BACKUP_DATE.tar.gz.gpg"

# Upload to storage
aws s3 cp "$BACKUP_DIR/incremental_$BACKUP_DATE.tar.gz.gpg" \
  "s3://clinic-backups-primary/database/incremental/" --sse AES256

echo "$(date): Incremental backup completed - $BACKUP_DATE" >> /var/log/backup.log
```

### Manual Database Backup

#### Emergency Backup Procedure
```bash
# 1. Create immediate backup before maintenance
./scripts/emergency-backup.sh "pre-maintenance-$(date +%Y%m%d-%H%M)"

# 2. Verify backup integrity
./scripts/verify-backup.sh "/backups/postgres/emergency/"

# 3. Test restore capability
./scripts/test-restore.sh "/backups/postgres/emergency/" "test-database"
```

## 📁 File System Backup Procedures

### Patient Files Backup

#### Real-time File Replication
```bash
#!/bin/bash
# File: /scripts/file-replication.sh

# Sync patient files to secondary storage in real-time
rsync -avz --delete --encrypt \
  /mnt/patient-files/ \
  backup-server:/mnt/patient-files-replica/

# Sync to cloud storage
aws s3 sync /mnt/patient-files/ \
  s3://clinic-backups-primary/patient-files/ \
  --delete --sse AES256 --storage-class STANDARD_IA

# Create daily snapshot
kubectl exec -i deployment/files-service -n clinic-production -- \
  tar -czf "/backups/files/patient-files-$(date +%Y%m%d).tar.gz" \
  /app/storage/patient-files/

# Encrypt and upload snapshot
gpg --symmetric --cipher-algo AES256 \
  "/backups/files/patient-files-$(date +%Y%m%d).tar.gz"

aws s3 cp "/backups/files/patient-files-$(date +%Y%m%d).tar.gz.gpg" \
  "s3://clinic-backups-primary/files/snapshots/" --sse AES256
```

#### File Integrity Verification
```bash
#!/bin/bash
# File: /scripts/verify-file-integrity.sh

# Generate file checksums
find /mnt/patient-files -type f -exec sha256sum {} \; > \
  "/backups/checksums/files-$(date +%Y%m%d).sha256"

# Compare with previous checksums
if [ -f "/backups/checksums/files-$(date -d yesterday +%Y%m%d).sha256" ]; then
  diff "/backups/checksums/files-$(date -d yesterday +%Y%m%d).sha256" \
       "/backups/checksums/files-$(date +%Y%m%d).sha256" > \
       "/backups/checksums/changes-$(date +%Y%m%d).log"
fi

# Upload checksums to secure storage
aws s3 cp "/backups/checksums/files-$(date +%Y%m%d).sha256" \
  "s3://clinic-backups-primary/checksums/" --sse AES256
```

### Configuration Backup

#### Kubernetes Resources Backup
```bash
#!/bin/bash
# File: /scripts/k8s-backup.sh

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/kubernetes"

# Backup all Kubernetes resources
kubectl get all,pv,pvc,secrets,configmaps,ingress,networkpolicies \
  --all-namespaces -o yaml > "$BACKUP_DIR/k8s-resources-$BACKUP_DATE.yaml"

# Backup specific namespace
kubectl get all,secrets,configmaps,pvc \
  -n clinic-production -o yaml > "$BACKUP_DIR/clinic-production-$BACKUP_DATE.yaml"

# Backup custom resources
kubectl get auditevent,retentionpolicy,compliancereport \
  --all-namespaces -o yaml > "$BACKUP_DIR/custom-resources-$BACKUP_DATE.yaml"

# Create etcd backup (if self-managed)
etcdctl snapshot save "$BACKUP_DIR/etcd-snapshot-$BACKUP_DATE.db" \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

# Encrypt and upload
for file in "$BACKUP_DIR"/*-"$BACKUP_DATE".*; do
  gpg --symmetric --cipher-algo AES256 "$file"
  aws s3 cp "$file.gpg" "s3://clinic-backups-primary/kubernetes/" --sse AES256
done
```

## 🔄 Recovery Procedures

### Database Recovery

#### Point-in-Time Recovery
```bash
#!/bin/bash
# File: /scripts/database-recovery.sh

set -euo pipefail

RECOVERY_TARGET_TIME="$1"  # Format: YYYY-MM-DD HH:MM:SS
BACKUP_FILE="$2"

echo "Starting point-in-time recovery to: $RECOVERY_TARGET_TIME"

# 1. Stop the database
kubectl scale deployment postgres-primary --replicas=0 -n clinic-production

# 2. Clear data directory
kubectl exec -i deployment/postgres-maintenance -n clinic-production -- \
  rm -rf /var/lib/postgresql/data/*

# 3. Restore base backup
kubectl exec -i deployment/postgres-maintenance -n clinic-production -- \
  pg_basebackup -U postgres -D /var/lib/postgresql/data -Fp -Xs -P

# 4. Configure recovery
kubectl exec -i deployment/postgres-maintenance -n clinic-production -- \
  cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'aws s3 cp s3://clinic-backups-primary/wal/%f %p'
recovery_target_time = '$RECOVERY_TARGET_TIME'
recovery_target_action = 'promote'
EOF

# 5. Start database in recovery mode
kubectl scale deployment postgres-primary --replicas=1 -n clinic-production

# 6. Wait for recovery completion
kubectl wait --for=condition=ready pod -l app=postgres-primary -n clinic-production --timeout=600s

# 7. Verify recovery
kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -c "SELECT pg_is_in_recovery();"

echo "Point-in-time recovery completed successfully"
```

#### Full Database Restore
```bash
#!/bin/bash
# File: /scripts/database-restore.sh

BACKUP_FILE="$1"
TARGET_DATABASE="${2:-clinic}"

echo "Starting full database restore from: $BACKUP_FILE"

# 1. Download and decrypt backup
aws s3 cp "$BACKUP_FILE" /tmp/backup.dump.gpg --sse AES256
gpg --decrypt /tmp/backup.dump.gpg > /tmp/backup.dump

# 2. Verify backup integrity
pg_restore --list /tmp/backup.dump > /dev/null
if [ $? -ne 0 ]; then
  echo "Backup file is corrupted" >&2
  exit 1
fi

# 3. Create new database
kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -c "DROP DATABASE IF EXISTS $TARGET_DATABASE;"

kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -c "CREATE DATABASE $TARGET_DATABASE;"

# 4. Restore data
kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  pg_restore -U postgres -d "$TARGET_DATABASE" --verbose --clean --no-owner --no-privileges \
  < /tmp/backup.dump

# 5. Update database statistics
kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d "$TARGET_DATABASE" -c "ANALYZE;"

# 6. Verify restoration
RECORD_COUNT=$(kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d "$TARGET_DATABASE" -t -c "SELECT COUNT(*) FROM users;")

echo "Database restore completed. Record count: $RECORD_COUNT"

# Cleanup
rm -f /tmp/backup.dump /tmp/backup.dump.gpg
```

### File System Recovery

#### Patient Files Recovery
```bash
#!/bin/bash
# File: /scripts/files-recovery.sh

RECOVERY_DATE="$1"  # Format: YYYY-MM-DD
TARGET_DIR="${2:-/mnt/patient-files-recovered}"

echo "Starting file recovery for date: $RECOVERY_DATE"

# 1. Create recovery directory
mkdir -p "$TARGET_DIR"

# 2. Download backup from S3
aws s3 cp "s3://clinic-backups-primary/files/snapshots/patient-files-$RECOVERY_DATE.tar.gz.gpg" \
  /tmp/files-backup.tar.gz.gpg --sse AES256

# 3. Decrypt and extract
gpg --decrypt /tmp/files-backup.tar.gz.gpg | tar -xzf - -C "$TARGET_DIR"

# 4. Verify file integrity
sha256sum -c "/backups/checksums/files-$RECOVERY_DATE.sha256" --quiet

if [ $? -eq 0 ]; then
  echo "File integrity verification successful"
else
  echo "File integrity verification failed" >&2
  exit 1
fi

# 5. Set correct permissions
chown -R app:app "$TARGET_DIR"
chmod -R 640 "$TARGET_DIR"

echo "File recovery completed to: $TARGET_DIR"
```

### Application Recovery

#### Complete System Recovery
```bash
#!/bin/bash
# File: /scripts/system-recovery.sh

RECOVERY_POINT="$1"  # Backup timestamp
NAMESPACE="clinic-production"

echo "Starting complete system recovery to point: $RECOVERY_POINT"

# 1. Download Kubernetes backup
aws s3 cp "s3://clinic-backups-primary/kubernetes/k8s-resources-$RECOVERY_POINT.yaml.gpg" \
  /tmp/k8s-backup.yaml.gpg --sse AES256

gpg --decrypt /tmp/k8s-backup.yaml.gpg > /tmp/k8s-backup.yaml

# 2. Restore namespace
kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
kubectl create namespace "$NAMESPACE"

# 3. Restore secrets first
kubectl apply -f /tmp/k8s-backup.yaml --dry-run=client -o yaml | \
  grep -A 1000 "kind: Secret" | kubectl apply -f -

# 4. Restore persistent volumes
kubectl apply -f /tmp/k8s-backup.yaml --dry-run=client -o yaml | \
  grep -A 1000 "kind: PersistentVolume" | kubectl apply -f -

# 5. Restore application resources
kubectl apply -f /tmp/k8s-backup.yaml

# 6. Wait for system to be ready
kubectl wait --for=condition=available deployment --all -n "$NAMESPACE" --timeout=900s

# 7. Verify system health
./scripts/health-check.sh

echo "Complete system recovery finished"
```

## 🧪 Backup Testing and Validation

### Daily Backup Verification
```bash
#!/bin/bash
# File: /scripts/daily-backup-test.sh

TEST_DATE=$(date +%Y%m%d)
TEST_DB="clinic_test_$TEST_DATE"

echo "Starting daily backup verification for: $TEST_DATE"

# 1. Test database backup restore
LATEST_BACKUP=$(aws s3 ls s3://clinic-backups-primary/database/full/ | \
  tail -1 | awk '{print $4}')

./scripts/database-restore.sh "s3://clinic-backups-primary/database/full/$LATEST_BACKUP" "$TEST_DB"

# 2. Verify data integrity
ORIGINAL_COUNT=$(kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d clinic -t -c "SELECT COUNT(*) FROM users;")

RESTORED_COUNT=$(kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")

if [ "$ORIGINAL_COUNT" -eq "$RESTORED_COUNT" ]; then
  echo "✅ Database backup verification successful"
else
  echo "❌ Database backup verification failed: $ORIGINAL_COUNT != $RESTORED_COUNT"
  exit 1
fi

# 3. Test file backup
SAMPLE_FILE=$(find /mnt/patient-files -type f | head -1)
if [ -n "$SAMPLE_FILE" ]; then
  FILE_HASH=$(sha256sum "$SAMPLE_FILE" | cut -d' ' -f1)
  
  # Download from backup and compare
  aws s3 cp "s3://clinic-backups-primary/patient-files/$SAMPLE_FILE" /tmp/test-file --sse AES256
  BACKUP_HASH=$(sha256sum /tmp/test-file | cut -d' ' -f1)
  
  if [ "$FILE_HASH" = "$BACKUP_HASH" ]; then
    echo "✅ File backup verification successful"
  else
    echo "❌ File backup verification failed"
    exit 1
  fi
fi

# 4. Cleanup test database
kubectl exec -i deployment/postgres-primary -n clinic-production -- \
  psql -U postgres -c "DROP DATABASE $TEST_DB;"

echo "Daily backup verification completed successfully"
```

### Disaster Recovery Testing
```bash
#!/bin/bash
# File: /scripts/dr-test.sh

DR_TEST_DATE=$(date +%Y%m%d_%H%M%S)
DR_NAMESPACE="clinic-dr-test"

echo "Starting disaster recovery test: $DR_TEST_DATE"

# 1. Create DR test environment
kubectl create namespace "$DR_NAMESPACE"

# 2. Deploy minimal infrastructure
kubectl apply -f infrastructure/kubernetes/databases/ -n "$DR_NAMESPACE"
kubectl apply -f infrastructure/kubernetes/storage/ -n "$DR_NAMESPACE"

# 3. Restore latest backup
LATEST_BACKUP=$(aws s3 ls s3://clinic-backups-primary/database/full/ | \
  tail -1 | awk '{print $4}')

./scripts/database-restore.sh "s3://clinic-backups-primary/database/full/$LATEST_BACKUP" "clinic"

# 4. Deploy core services
kubectl apply -f services/api-gateway/k8s/ -n "$DR_NAMESPACE"
kubectl apply -f services/auth-service/k8s/ -n "$DR_NAMESPACE"

# 5. Wait for services to be ready
kubectl wait --for=condition=available deployment --all -n "$DR_NAMESPACE" --timeout=600s

# 6. Test basic functionality
curl -f "http://$(kubectl get svc api-gateway -n $DR_NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')/health"

if [ $? -eq 0 ]; then
  echo "✅ Disaster recovery test successful"
else
  echo "❌ Disaster recovery test failed"
fi

# 7. Cleanup DR test environment
kubectl delete namespace "$DR_NAMESPACE"

echo "Disaster recovery test completed: $DR_TEST_DATE"
```

## 📅 Backup Scheduling

### Cron Configuration
```bash
# File: /etc/cron.d/clinic-backup

# Daily full database backup at 2:00 AM UTC
0 2 * * * root /scripts/database-backup.sh >> /var/log/backup.log 2>&1

# Incremental database backup every 6 hours
0 */6 * * * root /scripts/database-incremental-backup.sh >> /var/log/backup.log 2>&1

# File system backup every 4 hours
0 */4 * * * root /scripts/file-replication.sh >> /var/log/backup.log 2>&1

# Kubernetes configuration backup daily at 3:00 AM UTC
0 3 * * * root /scripts/k8s-backup.sh >> /var/log/backup.log 2>&1

# Daily backup verification at 4:00 AM UTC
0 4 * * * root /scripts/daily-backup-test.sh >> /var/log/backup-test.log 2>&1

# Weekly disaster recovery test on Sundays at 1:00 AM UTC
0 1 * * 0 root /scripts/dr-test.sh >> /var/log/dr-test.log 2>&1

# Monthly backup retention cleanup on 1st of month at 5:00 AM UTC
0 5 1 * * root /scripts/backup-cleanup.sh >> /var/log/backup-cleanup.log 2>&1
```

## 📊 Backup Monitoring and Alerting

### Backup Success Monitoring
```yaml
# Prometheus rules for backup monitoring
groups:
- name: backup_monitoring
  rules:
  - alert: BackupFailed
    expr: time() - backup_last_success_timestamp > 86400  # 24 hours
    for: 5m
    labels:
      severity: critical
      priority: P1
      healthcare_impact: high
    annotations:
      summary: "Database backup has failed"
      description: "No successful backup in the last 24 hours"
      runbook_url: "https://runbooks.clinic.com/backup-failed"
      
  - alert: BackupSizeAnomaly
    expr: abs(backup_size_bytes - backup_size_bytes offset 24h) / backup_size_bytes offset 24h > 0.3
    for: 10m
    labels:
      severity: warning
      priority: P2
    annotations:
      summary: "Backup size anomaly detected"
      description: "Backup size changed by more than 30% compared to yesterday"
      
  - alert: BackupVerificationFailed
    expr: backup_verification_success == 0
    for: 0s
    labels:
      severity: critical
      priority: P1
    annotations:
      summary: "Backup verification failed"
      description: "Last backup verification failed - data integrity at risk"
```

### Backup Metrics Collection
```bash
#!/bin/bash
# File: /scripts/backup-metrics.sh

# Export backup metrics to Prometheus
curl -X POST http://pushgateway:9091/metrics/job/backup_job/instance/$(hostname) <<EOF
# HELP backup_last_success_timestamp Unix timestamp of last successful backup
# TYPE backup_last_success_timestamp gauge
backup_last_success_timestamp $(date +%s)

# HELP backup_size_bytes Size of the last backup in bytes
# TYPE backup_size_bytes gauge
backup_size_bytes $(du -b /backups/postgres/clinic_full_$(date +%Y%m%d)*.dump 2>/dev/null | cut -f1 || echo 0)

# HELP backup_duration_seconds Duration of the last backup in seconds
# TYPE backup_duration_seconds gauge
backup_duration_seconds $BACKUP_DURATION

# HELP backup_verification_success 1 if last backup verification succeeded, 0 otherwise
# TYPE backup_verification_success gauge
backup_verification_success $VERIFICATION_SUCCESS
EOF
```

This comprehensive backup and recovery runbook ensures robust data protection and business continuity for the healthcare platform while maintaining HIPAA compliance requirements.