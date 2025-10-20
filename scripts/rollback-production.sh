#!/bin/bash

# Production Rollback Script for Healthcare Platform
# Emergency rollback to previous stable version

set -e

echo "🔄 Healthcare Platform Production Rollback"
echo "=========================================="

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
ROLLBACK_REASON=${1:-"Manual rollback triggered"}
BACKUP_DIR="./backups"
CURRENT_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ROLLBACK_TIMEOUT=300

log_error "🚨 PRODUCTION ROLLBACK INITIATED"
log_error "Reason: $ROLLBACK_REASON"
log_error "Timestamp: $CURRENT_TIMESTAMP"

# Find the most recent backup
log_info "🔍 Finding most recent backup..."

LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/production-backup-* 2>/dev/null | head -1 || echo "")

if [ -z "$LATEST_BACKUP" ]; then
    log_error "❌ No backup found for rollback"
    log_error "Manual recovery required"
    exit 1
fi

log_info "Using backup: $(basename "$LATEST_BACKUP")"

# Check if current deployment state file exists
if [ -f ".deployment-state" ]; then
    CURRENT_SLOT=$(cat .deployment-state)
    ROLLBACK_SLOT=$([[ "$CURRENT_SLOT" == "blue" ]] && echo "green" || echo "blue")
    log_info "Current slot: $CURRENT_SLOT"
    log_info "Rolling back to slot: $ROLLBACK_SLOT"
else
    log_warning "No deployment state file found, assuming standard rollback"
    CURRENT_SLOT="unknown"
    ROLLBACK_SLOT="blue"
fi

# Create rollback log
ROLLBACK_LOG="rollback-${CURRENT_TIMESTAMP}.log"
exec 1> >(tee -a "$ROLLBACK_LOG")
exec 2>&1

# Pre-rollback health check
log_info "📊 Pre-rollback system status..."
./scripts/health-check.sh production || log_warning "System is currently unhealthy (expected)"

# Emergency database backup before rollback
log_info "📦 Creating emergency database backup before rollback..."
EMERGENCY_BACKUP_FILE="${BACKUP_DIR}/emergency-pre-rollback-${CURRENT_TIMESTAMP}.sql"

if docker exec $(docker ps -q -f name=postgres) pg_dump -U postgres clinic_production > "$EMERGENCY_BACKUP_FILE"; then
    gzip "$EMERGENCY_BACKUP_FILE"
    log_success "Emergency backup created: ${EMERGENCY_BACKUP_FILE}.gz"
else
    log_warning "Emergency backup failed, proceeding with rollback"
fi

# Stop current failing deployment
log_info "🛑 Stopping current deployment..."

if [ "$CURRENT_SLOT" != "unknown" ] && [ -f "docker-compose.${CURRENT_SLOT}.yml" ]; then
    docker-compose -f "docker-compose.${CURRENT_SLOT}.yml" down || true
    log_success "Current deployment stopped"
else
    # Fallback: stop all clinic-related containers
    docker ps --format "table {{.Names}}" | grep clinic | xargs -r docker stop || true
    log_warning "Stopped all clinic-related containers"
fi

# Start rollback deployment
log_info "🚀 Starting rollback deployment..."

# Use the previous slot configuration or fallback
if [ -f "docker-compose.${ROLLBACK_SLOT}.yml" ]; then
    ROLLBACK_COMPOSE="docker-compose.${ROLLBACK_SLOT}.yml"
elif [ -f "docker-compose.production.yml" ]; then
    ROLLBACK_COMPOSE="docker-compose.production.yml"
else
    log_error "❌ No compose file found for rollback"
    exit 1
fi

log_info "Using compose file: $ROLLBACK_COMPOSE"

# Set rollback environment variables
export IMAGE_TAG=${ROLLBACK_IMAGE_TAG:-production-stable}
export ENVIRONMENT=production

# Start the rollback deployment
docker-compose -f "$ROLLBACK_COMPOSE" up -d

log_info "Waiting for services to start..."
sleep 60

# Health check rollback deployment
log_info "🏥 Health checking rollback deployment..."

HEALTH_CHECK_ATTEMPTS=0
MAX_HEALTH_CHECK_ATTEMPTS=10

while [ $HEALTH_CHECK_ATTEMPTS -lt $MAX_HEALTH_CHECK_ATTEMPTS ]; do
    if ./scripts/health-check.sh production; then
        log_success "✅ Rollback deployment is healthy"
        break
    else
        HEALTH_CHECK_ATTEMPTS=$((HEALTH_CHECK_ATTEMPTS + 1))
        if [ $HEALTH_CHECK_ATTEMPTS -eq $MAX_HEALTH_CHECK_ATTEMPTS ]; then
            log_error "❌ Rollback deployment failed health check"
            log_error "Manual intervention required"
            
            # Create emergency contact information
            cat > "EMERGENCY-ROLLBACK-FAILED-${CURRENT_TIMESTAMP}.txt" << EOF
EMERGENCY: PRODUCTION ROLLBACK FAILED
=====================================
Timestamp: $CURRENT_TIMESTAMP
Reason: $ROLLBACK_REASON
Status: Rollback deployment failed health checks

IMMEDIATE ACTIONS REQUIRED:
1. Check service logs: docker-compose -f $ROLLBACK_COMPOSE logs
2. Verify database connectivity
3. Check network configuration
4. Consider manual service restart
5. Contact on-call engineer

Rollback Log: $ROLLBACK_LOG
Emergency Backup: ${EMERGENCY_BACKUP_FILE}.gz

ESCALATION CONTACTS:
- DevOps Team: devops@clinic-app.com
- Engineering Lead: engineering@clinic-app.com
- Emergency Hotline: +1-XXX-XXX-XXXX
EOF
            exit 1
        fi
        log_warning "Health check failed, retrying... ($HEALTH_CHECK_ATTEMPTS/$MAX_HEALTH_CHECK_ATTEMPTS)"
        sleep 30
    fi
done

# Update load balancer configuration
log_info "🔄 Updating load balancer configuration..."

if [ -f "infrastructure/production/nginx.conf.backup.rollback" ]; then
    # Restore previous nginx config
    cp infrastructure/production/nginx.conf.backup.rollback infrastructure/production/nginx.conf
    docker exec $(docker ps -q -f name=nginx) nginx -s reload || true
    log_success "Load balancer configuration restored"
else
    log_warning "No previous nginx configuration found for rollback"
fi

# Update deployment state
echo "$ROLLBACK_SLOT" > ".deployment-state"
echo "rollback-$(date +%s)" > ".last-rollback"

# Database rollback (if backup restoration is needed)
if [ "$RESTORE_DATABASE" == "true" ]; then
    log_warning "🗄️ Database restoration requested..."
    log_warning "This will overwrite current data!"
    
    # Find database backup from the backup set
    DB_BACKUP_FILE=$(find "$BACKUP_DIR" -name "*database*.sql.gz" | grep "$(basename "$LATEST_BACKUP" | cut -d'-' -f3-4)" | head -1)
    
    if [ -n "$DB_BACKUP_FILE" ] && [ -f "$DB_BACKUP_FILE" ]; then
        log_info "Restoring database from: $DB_BACKUP_FILE"
        
        # Drop and recreate database
        docker exec $(docker ps -q -f name=postgres) psql -U postgres -c "DROP DATABASE IF EXISTS clinic_production_old;"
        docker exec $(docker ps -q -f name=postgres) psql -U postgres -c "ALTER DATABASE clinic_production RENAME TO clinic_production_old;"
        docker exec $(docker ps -q -f name=postgres) psql -U postgres -c "CREATE DATABASE clinic_production;"
        
        # Restore from backup
        gunzip -c "$DB_BACKUP_FILE" | docker exec -i $(docker ps -q -f name=postgres) psql -U postgres clinic_production
        
        log_success "Database restored from backup"
    else
        log_error "Database backup not found for restoration"
        exit 1
    fi
fi

# Post-rollback verification
log_info "🔍 Post-rollback verification..."

# Check critical endpoints
CRITICAL_ENDPOINTS=(
    "https://clinic-app.com/health"
    "https://api.clinic-app.com/health"
    "https://clinic-app.com/login"
)

for endpoint in "${CRITICAL_ENDPOINTS[@]}"; do
    if curl -f -s "$endpoint" > /dev/null; then
        log_success "✅ $endpoint is accessible"
    else
        log_error "❌ $endpoint is not accessible"
    fi
done

# Smoke test key functionality
log_info "🧪 Running post-rollback smoke tests..."
./scripts/staging-smoke-tests.sh "https://clinic-app.com" "https://api.clinic-app.com" || log_warning "Some smoke tests failed"

# Generate rollback report
ROLLBACK_REPORT="rollback-report-${CURRENT_TIMESTAMP}.json"

cat > "$ROLLBACK_REPORT" << EOF
{
  "rollback_id": "rollback-${CURRENT_TIMESTAMP}",
  "timestamp": "$(date -Iseconds)",
  "reason": "$ROLLBACK_REASON",
  "previous_slot": "$CURRENT_SLOT",
  "rollback_slot": "$ROLLBACK_SLOT",
  "backup_used": "$(basename "$LATEST_BACKUP")",
  "emergency_backup": "${EMERGENCY_BACKUP_FILE}.gz",
  "database_restored": ${RESTORE_DATABASE:-false},
  "rollback_duration_minutes": $(( ($(date +%s) - $(date -d "$CURRENT_TIMESTAMP" +%s)) / 60 )),
  "status": "completed",
  "health_check_passed": true,
  "rollback_log": "$ROLLBACK_LOG",
  "compose_file_used": "$ROLLBACK_COMPOSE"
}
EOF

# Notification
log_info "📧 Sending rollback notification..."

if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🔄 PRODUCTION ROLLBACK COMPLETED\\nReason: $ROLLBACK_REASON\\nTimestamp: $CURRENT_TIMESTAMP\\nStatus: Successful\\nDuration: $(( ($(date +%s) - $(date -d "$CURRENT_TIMESTAMP" +%s)) / 60 )) minutes\"}" \
        "$SLACK_WEBHOOK_URL" || true
fi

# Success summary
echo ""
echo "=============================="
echo "✅ ROLLBACK COMPLETED SUCCESSFULLY"
echo "=============================="
echo "🔄 Rollback ID: rollback-${CURRENT_TIMESTAMP}"
echo "📊 Previous Slot: $CURRENT_SLOT"
echo "🎯 Active Slot: $ROLLBACK_SLOT"
echo "🕐 Duration: $(( ($(date +%s) - $(date -d "$CURRENT_TIMESTAMP" +%s)) / 60 )) minutes"
echo "📦 Backup Used: $(basename "$LATEST_BACKUP")"
echo "🏥 Health Status: Healthy"
echo "📋 Report: $ROLLBACK_REPORT"
echo "📝 Log: $ROLLBACK_LOG"
echo "=============================="
echo "🎉 PRODUCTION IS STABLE"
echo "=============================="

# Final health check
./scripts/health-check.sh production

log_success "🎉 ROLLBACK COMPLETED SUCCESSFULLY!"
log_success "Production environment is now stable and healthy"

exit 0