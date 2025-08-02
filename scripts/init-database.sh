#!/bin/bash

# ===================================================================
# DATABASE INITIALIZATION SCRIPT
# Initializes the production database with proper schema for the clinic recording system
# ===================================================================

set -e

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Database connection parameters
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_NAME=${DATABASE_NAME:-clinic}
DB_USER=${DATABASE_USER:-postgres}
DB_PASSWORD=${DATABASE_PASSWORD:-postgres}

echo "🏥 Initializing Clinic Recording System Database..."
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Check if database exists, create if not
echo "📊 Checking database existence..."
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" != "1" ]; then
    echo "🔨 Creating database $DB_NAME..."
    PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    echo "✅ Database $DB_NAME created"
else
    echo "✅ Database $DB_NAME already exists"
fi

# Run the main schema migration
echo "🔧 Running schema migration..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/migrations/001_recording_system_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema migration completed successfully"
else
    echo "❌ Schema migration failed"
    exit 1
fi

# Create application user (if not exists)
echo "👤 Setting up application user..."
APP_USER=${APP_DB_USER:-clinic_app}
APP_PASSWORD=${APP_DB_PASSWORD:-clinic_app_password}

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$APP_USER') THEN
        CREATE ROLE $APP_USER WITH LOGIN PASSWORD '$APP_PASSWORD';
    END IF;
END
\$\$;
"

# Grant permissions to application user
echo "🔐 Granting permissions to application user..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO $APP_USER;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO $APP_USER;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO $APP_USER;
"

# Insert sample data if in development mode
if [ "$NODE_ENV" = "development" ]; then
    echo "🧪 Inserting sample data for development..."
    
    # Sample program templates (already in the schema file)
    echo "✅ Sample program templates inserted"
    
    # Sample analytics data
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
    INSERT INTO recording_analytics (date, total_recordings, total_file_size, transcriptions_completed, summaries_generated) 
    VALUES 
        (CURRENT_DATE - INTERVAL '1 day', 15, 1073741824, 12, 10),
        (CURRENT_DATE - INTERVAL '2 days', 18, 1342177280, 15, 14),
        (CURRENT_DATE - INTERVAL '3 days', 12, 805306368, 10, 9)
    ON CONFLICT (date) DO NOTHING;
    
    INSERT INTO session_analytics (date, total_sessions, completed_sessions, average_duration, average_rating) 
    VALUES 
        (CURRENT_DATE - INTERVAL '1 day', 20, 18, 52.5, 4.7),
        (CURRENT_DATE - INTERVAL '2 days', 22, 20, 48.2, 4.6),
        (CURRENT_DATE - INTERVAL '3 days', 15, 14, 55.1, 4.8)
    ON CONFLICT (date, coach_id, client_id, program_id) DO NOTHING;
    
    INSERT INTO business_metrics (date, period_type, total_revenue, total_clients, new_clients, active_clients) 
    VALUES 
        (CURRENT_DATE - INTERVAL '1 day', 'daily', 2450.00, 187, 3, 142),
        (CURRENT_DATE - INTERVAL '2 days', 'daily', 2650.00, 184, 2, 140),
        (CURRENT_DATE - INTERVAL '3 days', 'daily', 2200.00, 182, 4, 138)
    ON CONFLICT (date, period_type) DO NOTHING;
    "
    
    echo "✅ Sample analytics data inserted"
fi

# Create backup script
echo "💾 Creating backup script..."
cat > scripts/backup-database.sh << 'EOF'
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
EOF

chmod +x scripts/backup-database.sh

# Create maintenance script
echo "🔧 Creating maintenance script..."
cat > scripts/database-maintenance.sh << 'EOF'
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
EOF

chmod +x scripts/database-maintenance.sh

# Create health check script
echo "❤️ Creating database health check script..."
cat > scripts/check-database-health.sh << 'EOF'
#!/bin/bash
# Database health check script

source .env

echo "❤️ Checking database health..."

# Check database connection
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection: OK"
else
    echo "❌ Database connection: FAILED"
    exit 1
fi

# Check table sizes and row counts
echo "📊 Database statistics:"
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY live_rows DESC
LIMIT 20;
"

# Check for long-running queries
echo "🔍 Long-running queries:"
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state = 'active';
"

# Check database size
echo "💾 Database size:"
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c "
SELECT 
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = '$POSTGRES_DB';
"

echo "✅ Database health check completed"
EOF

chmod +x scripts/check-database-health.sh

echo ""
echo "🎉 Database initialization completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Update your .env file with the database credentials"
echo "2. Run 'yarn workspace @clinic/common build' to build entities"
echo "3. Test the database connection with 'bash scripts/check-database-health.sh'"
echo "4. Set up regular backups with 'bash scripts/backup-database.sh'"
echo ""
echo "🔧 Maintenance commands:"
echo "- Health check: ./scripts/check-database-health.sh"
echo "- Backup: ./scripts/backup-database.sh"
echo "- Maintenance: ./scripts/database-maintenance.sh"
echo ""
echo "📊 Database ready for production use!"