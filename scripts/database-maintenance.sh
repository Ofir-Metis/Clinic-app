#!/bin/bash
# Database maintenance script

source .env

echo "🔧 Running database maintenance..."

# Clean up old audit logs (older than 1 year, not on legal hold)
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "
SELECT cleanup_old_audit_logs();
"

# Archive old recordings (older than 2 years)
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "
SELECT archive_old_recordings();
"

# Update table statistics
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "
ANALYZE;
"

# Vacuum database to reclaim space
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "
VACUUM ANALYZE;
"

echo "✅ Database maintenance completed"
