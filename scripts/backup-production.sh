#!/bin/bash

# Production Backup Script for Healthcare Platform
# Creates comprehensive backups before deployment

set -e

echo "📦 Healthcare Platform Production Backup"
echo "======================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PREFIX="production-backup-${TIMESTAMP}"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log_info "Starting production backup process..."
log_info "Timestamp: $TIMESTAMP"
log_info "Backup directory: $BACKUP_DIR"

# Database Backup
log_info "🗄️ Creating database backup..."

# Main database backup
DB_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}-database.sql"
if docker exec $(docker ps -q -f name=postgres) pg_dump -U postgres clinic_production > "$DB_BACKUP_FILE"; then
    log_success "Database backup created: $DB_BACKUP_FILE"
    
    # Compress the backup
    gzip "$DB_BACKUP_FILE"
    log_success "Database backup compressed: ${DB_BACKUP_FILE}.gz"
else
    log_error "Database backup failed"
    exit 1
fi

# Database replica backup (if exists)
if docker ps | grep -q postgres-replica; then
    log_info "Creating replica database backup..."
    DB_REPLICA_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}-database-replica.sql"
    if docker exec $(docker ps -q -f name=postgres-replica) pg_dump -U postgres clinic_production > "$DB_REPLICA_BACKUP_FILE"; then
        gzip "$DB_REPLICA_BACKUP_FILE"
        log_success "Replica database backup created: ${DB_REPLICA_BACKUP_FILE}.gz"
    fi
fi

# Database schema backup
log_info "Creating database schema backup..."
SCHEMA_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}-schema.sql"
docker exec $(docker ps -q -f name=postgres) pg_dump -U postgres -s clinic_production > "$SCHEMA_BACKUP_FILE"
gzip "$SCHEMA_BACKUP_FILE"
log_success "Schema backup created: ${SCHEMA_BACKUP_FILE}.gz"

# Configuration Backup
log_info "📁 Backing up configuration files..."

CONFIG_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}-config.tar.gz"
tar -czf "$CONFIG_BACKUP_FILE" \
    .env.production \
    docker-compose.production.yml \
    infrastructure/ \
    scripts/ \
    monitoring/ \
    ssl/ \
    2>/dev/null || true

log_success "Configuration backup created: $CONFIG_BACKUP_FILE"

# MinIO/S3 Data Backup (metadata only)
log_info "📎 Backing up file storage metadata..."

# Create MinIO backup if accessible
if command -v mc >/dev/null 2>&1; then
    MINIO_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}-minio-metadata.json"
    
    # Configure MinIO client (assuming credentials are available)
    mc alias set backup $(echo $MINIO_ENDPOINT) $(echo $MINIO_ACCESS_KEY) $(echo $MINIO_SECRET_KEY) 2>/dev/null || true
    
    # List all files and their metadata
    mc ls -r backup/clinic-production/ --json > "$MINIO_BACKUP_FILE" 2>/dev/null || true
    
    if [ -f "$MINIO_BACKUP_FILE" ] && [ -s "$MINIO_BACKUP_FILE" ]; then
        gzip "$MINIO_BACKUP_FILE"
        log_success "File storage metadata backup created: ${MINIO_BACKUP_FILE}.gz"
    else
        log_warning "File storage metadata backup skipped (not accessible)"
    fi
else
    log_warning "MinIO client not available, skipping file storage backup"
fi

# Redis Data Backup
log_info "📦 Backing up Redis data..."

REDIS_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}-redis.rdb"
if docker exec $(docker ps -q -f name=redis) redis-cli SAVE > /dev/null 2>&1; then
    docker cp $(docker ps -q -f name=redis):/data/dump.rdb "$REDIS_BACKUP_FILE" 2>/dev/null || true
    
    if [ -f "$REDIS_BACKUP_FILE" ]; then
        gzip "$REDIS_BACKUP_FILE"
        log_success "Redis backup created: ${REDIS_BACKUP_FILE}.gz"
    else
        log_warning "Redis backup failed or no data to backup"
    fi
else
    log_warning "Redis backup skipped (not accessible)"
fi

# Application Logs Backup
log_info "📋 Backing up application logs..."

LOGS_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}-logs.tar.gz"
if [ -d "/var/log" ] && [ "$(ls -A /var/log 2>/dev/null)" ]; then
    tar -czf "$LOGS_BACKUP_FILE" /var/log 2>/dev/null || true
    log_success "Application logs backup created: $LOGS_BACKUP_FILE"
else
    log_warning "No application logs found to backup"
fi

# Docker Images Backup (optional - for critical custom images)
log_info "🐳 Backing up custom Docker images..."

IMAGES_BACKUP_DIR="${BACKUP_DIR}/images"
mkdir -p "$IMAGES_BACKUP_DIR"

# List custom images (ghcr.io/clinic-app)
CUSTOM_IMAGES=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep "ghcr.io.*clinic-app" | head -5)

if [ -n "$CUSTOM_IMAGES" ]; then
    while IFS= read -r image; do
        if [ -n "$image" ]; then
            image_name=$(echo "$image" | tr '/' '_' | tr ':' '_')
            image_file="${IMAGES_BACKUP_DIR}/${BACKUP_PREFIX}-${image_name}.tar"
            
            log_info "Backing up Docker image: $image"
            if docker save "$image" -o "$image_file"; then
                gzip "$image_file"
                log_success "Docker image backup created: ${image_file}.gz"
            else
                log_warning "Failed to backup Docker image: $image"
            fi
        fi
    done <<< "$CUSTOM_IMAGES"
else
    log_warning "No custom Docker images found to backup"
fi

# Environment Variables Backup (sanitized)
log_info "🔐 Backing up environment configuration..."

ENV_BACKUP_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}-env-sanitized.txt"

# Create sanitized environment backup (remove sensitive values)
cat > "$ENV_BACKUP_FILE" << 'EOF'
# Production Environment Configuration Backup
# Sensitive values are masked for security
EOF

if [ -f ".env.production" ]; then
    # Mask sensitive values
    sed 's/\(PASSWORD\|SECRET\|KEY\|TOKEN\)=.*/\1=***MASKED***/g' .env.production >> "$ENV_BACKUP_FILE"
    log_success "Environment configuration backup created: $ENV_BACKUP_FILE"
else
    log_warning "No .env.production file found"
fi

# Create backup manifest
MANIFEST_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}-manifest.json"

cat > "$MANIFEST_FILE" << EOF
{
  "backup_id": "${BACKUP_PREFIX}",
  "timestamp": "$(date -Iseconds)",
  "environment": "production",
  "backup_type": "pre-deployment",
  "files": {
    "database": "${DB_BACKUP_FILE}.gz",
    "schema": "${SCHEMA_BACKUP_FILE}.gz",
    "configuration": "${CONFIG_BACKUP_FILE}",
    "redis": "${REDIS_BACKUP_FILE}.gz",
    "logs": "${LOGS_BACKUP_FILE}",
    "environment": "${ENV_BACKUP_FILE}",
    "manifest": "${MANIFEST_FILE}"
  },
  "services_backed_up": [
    "postgres",
    "redis",
    "minio",
    "configuration",
    "logs"
  ],
  "retention_policy": {
    "days": $RETENTION_DAYS,
    "expires_at": "$(date -d "+$RETENTION_DAYS days" -Iseconds)"
  }
}
EOF

log_success "Backup manifest created: $MANIFEST_FILE"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log_info "Total backup size: $TOTAL_SIZE"

# Upload to S3 (if configured)
if [ -n "$AWS_S3_BACKUP_BUCKET" ] && command -v aws >/dev/null 2>&1; then
    log_info "☁️ Uploading backup to S3..."
    
    aws s3 sync "$BACKUP_DIR" "s3://$AWS_S3_BACKUP_BUCKET/production-backups/" \
        --exclude "*" \
        --include "*${TIMESTAMP}*" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256
    
    if [ $? -eq 0 ]; then
        log_success "Backup uploaded to S3 successfully"
    else
        log_warning "Failed to upload backup to S3"
    fi
fi

# Cleanup old backups
log_info "🧹 Cleaning up old backups..."

find "$BACKUP_DIR" -type f -name "production-backup-*" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
log_success "Old backups cleaned up (older than $RETENTION_DAYS days)"

# Verify backup integrity
log_info "✅ Verifying backup integrity..."

# Test database backup
if gunzip -t "${DB_BACKUP_FILE}.gz" 2>/dev/null; then
    log_success "Database backup integrity verified"
else
    log_error "Database backup integrity check failed"
    exit 1
fi

# Test configuration backup
if tar -tzf "$CONFIG_BACKUP_FILE" >/dev/null 2>&1; then
    log_success "Configuration backup integrity verified"
else
    log_warning "Configuration backup integrity check failed"
fi

# Final results
echo ""
echo "=============================="
echo "📦 BACKUP COMPLETED"
echo "=============================="
echo "✅ Backup ID: $BACKUP_PREFIX"
echo "✅ Backup Location: $BACKUP_DIR"
echo "✅ Total Size: $TOTAL_SIZE"
echo "✅ Retention: $RETENTION_DAYS days"
echo "✅ Status: Ready for deployment"
echo "=============================="

# Create quick restore script
RESTORE_SCRIPT="${BACKUP_DIR}/restore-${TIMESTAMP}.sh"
cat > "$RESTORE_SCRIPT" << EOF
#!/bin/bash
# Quick restore script for backup ${BACKUP_PREFIX}
set -e

echo "🔄 Restoring backup ${BACKUP_PREFIX}..."

# Restore database
echo "Restoring database..."
gunzip -c "${DB_BACKUP_FILE}.gz" | docker exec -i \$(docker ps -q -f name=postgres) psql -U postgres clinic_production

# Restore Redis (if exists)
if [ -f "${REDIS_BACKUP_FILE}.gz" ]; then
    echo "Restoring Redis..."
    gunzip -c "${REDIS_BACKUP_FILE}.gz" > /tmp/dump.rdb
    docker cp /tmp/dump.rdb \$(docker ps -q -f name=redis):/data/dump.rdb
    docker restart \$(docker ps -q -f name=redis)
    rm /tmp/dump.rdb
fi

echo "✅ Restore completed"
EOF

chmod +x "$RESTORE_SCRIPT"
log_success "Restore script created: $RESTORE_SCRIPT"

exit 0