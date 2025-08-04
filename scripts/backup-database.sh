#!/bin/bash
# Enhanced database backup script for Clinic App

set -e

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Configuration with defaults
BACKUP_DIR="${BACKUP_DIR:-backups/database}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/clinic_db_backup_$TIMESTAMP.sql.gz"
COMPRESSION_LEVEL="${COMPRESSION_LEVEL:-6}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Database configuration
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD}"
DB_NAME="${POSTGRES_DB:-clinic}"

# S3 configuration (optional)
S3_BUCKET="${BACKUP_S3_BUCKET}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "🚀 Starting enhanced database backup..."
echo "📍 Database: $DB_NAME at $DB_HOST:$DB_PORT"
echo "📍 Output: $BACKUP_FILE"

# Create compressed backup with better options
echo "📦 Creating compressed backup..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-password \
    --verbose \
    --clean \
    --create \
    --if-exists \
    --no-owner \
    --no-privileges | gzip -$COMPRESSION_LEVEL > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Verify backup integrity
    echo "🔍 Verifying backup integrity..."
    gunzip -t "$BACKUP_FILE"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Database backup created successfully: $(basename $BACKUP_FILE) ($BACKUP_SIZE)"
    
    # Upload to S3 if configured
    if [ -n "$S3_BUCKET" ] && command -v aws &> /dev/null; then
        echo "☁️ Uploading to S3: s3://$S3_BUCKET/backups/$(basename $BACKUP_FILE)"
        aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/$(basename $BACKUP_FILE)" \
            --storage-class STANDARD_IA \
            --server-side-encryption AES256
        
        if [ $? -eq 0 ]; then
            echo "✅ S3 upload completed successfully"
        else
            echo "⚠️ S3 upload failed, but local backup is available"
        fi
    elif [ -n "$S3_BUCKET" ]; then
        echo "⚠️ AWS CLI not found, skipping S3 upload"
    fi
    
    # Clean up old backups
    echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
    DELETED_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
    echo "🧹 Cleaned up $DELETED_COUNT old backup(s)"
    
    # Show remaining backups
    REMAINING_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)
    echo "📊 Total backups remaining: $REMAINING_COUNT"
    
    echo "🎉 Backup process completed successfully!"
else
    echo "❌ Database backup failed"
    exit 1
fi
