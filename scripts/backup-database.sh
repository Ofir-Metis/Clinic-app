#!/bin/bash
# Database backup script

source .env

BACKUP_DIR="backups/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/clinic_db_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "📦 Creating database backup..."
PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Database backup created: $BACKUP_FILE"
    
    # Compress the backup
    gzip $BACKUP_FILE
    echo "✅ Backup compressed: $BACKUP_FILE.gz"
    
    # Clean up old backups (keep last 7 days)
    find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
    echo "🧹 Old backups cleaned up"
else
    echo "❌ Database backup failed"
    exit 1
fi
