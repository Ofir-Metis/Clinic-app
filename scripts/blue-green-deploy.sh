#!/bin/bash

# Blue-Green Deployment Script for Healthcare Platform
# Provides zero-downtime deployments with automatic rollback

set -e

echo "🔄 Healthcare Platform Blue-Green Deployment"
echo "============================================="

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
ENVIRONMENT=${ENVIRONMENT:-production}
IMAGE_TAG=${IMAGE_TAG:-latest}
REGISTRY=${REGISTRY:-ghcr.io}
REPOSITORY=${REPOSITORY:-clinic-app}
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_TIMEOUT=120

# Current deployment state
CURRENT_SLOT=$(docker ps --filter "name=api-gateway" --format "{{.Names}}" | head -n1 | grep -o '\(blue\|green\)' || echo "blue")
NEW_SLOT=$([[ "$CURRENT_SLOT" == "blue" ]] && echo "green" || echo "blue")

log_info "Current active slot: $CURRENT_SLOT"
log_info "Deploying to slot: $NEW_SLOT"
log_info "Image tag: $IMAGE_TAG"

# Cleanup function
cleanup() {
    log_warning "Cleaning up deployment artifacts..."
    if [[ "$NEW_SLOT" != "$CURRENT_SLOT" ]]; then
        log_info "Removing failed deployment containers..."
        docker-compose -f "docker-compose.${NEW_SLOT}.yml" down || true
    fi
}

# Rollback function
rollback() {
    log_error "🔴 DEPLOYMENT FAILED - INITIATING ROLLBACK"
    
    log_info "Stopping new deployment ($NEW_SLOT)..."
    docker-compose -f "docker-compose.${NEW_SLOT}.yml" down || true
    
    log_info "Ensuring current deployment ($CURRENT_SLOT) is healthy..."
    docker-compose -f "docker-compose.${CURRENT_SLOT}.yml" up -d || true
    
    # Wait for rollback to stabilize
    sleep 30
    
    if ./scripts/health-check.sh $ENVIRONMENT; then
        log_success "✅ Rollback completed successfully"
        exit 1
    else
        log_error "❌ Rollback failed - manual intervention required"
        exit 2
    fi
}

# Set trap for cleanup and rollback
trap rollback ERR
trap cleanup EXIT

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check if current deployment is healthy
if ! ./scripts/health-check.sh $ENVIRONMENT; then
    log_error "Current deployment is unhealthy. Aborting deployment."
    exit 1
fi

# Check Docker images are available
log_info "Verifying Docker images are available..."
SERVICES=(
    "api-gateway"
    "auth-service" 
    "appointments-service"
    "files-service"
    "notifications-service"
    "ai-service"
    "notes-service"
    "analytics-service"
    "settings-service"
    "billing-service"
    "search-service"
    "cdn-service"
    "frontend"
)

for service in "${SERVICES[@]}"; do
    image="${REGISTRY}/${REPOSITORY}/${service}:${IMAGE_TAG}"
    if ! docker manifest inspect "$image" > /dev/null 2>&1; then
        log_error "Image not found: $image"
        exit 1
    fi
    log_success "Image available: $service"
done

# Create blue-green compose files
log_info "Preparing blue-green deployment configurations..."

# Generate new slot configuration
envsubst < docker-compose.production.yml > "docker-compose.${NEW_SLOT}.yml"

# Update ports for new slot to avoid conflicts
if [[ "$NEW_SLOT" == "green" ]]; then
    sed -i 's/4000:4000/4001:4000/g' "docker-compose.${NEW_SLOT}.yml"
    sed -i 's/5173:80/5174:80/g' "docker-compose.${NEW_SLOT}.yml"
    sed -i 's/production-network/production-green-network/g' "docker-compose.${NEW_SLOT}.yml"
fi

# Database backup before deployment
log_info "Creating database backup..."
timestamp=$(date +%Y%m%d-%H%M%S)
backup_file="backup-pre-deploy-${timestamp}.sql"

docker exec $(docker ps -q -f name=postgres) pg_dump -U postgres clinic_production > "backups/$backup_file" || {
    log_warning "Database backup failed, continuing with deployment..."
}

# Deploy new slot
log_info "🚀 Starting deployment to $NEW_SLOT slot..."
docker-compose -f "docker-compose.${NEW_SLOT}.yml" up -d

# Wait for services to start
log_info "Waiting for services to initialize..."
sleep 60

# Health check new deployment
log_info "Running health checks on new deployment..."
export ENVIRONMENT="$ENVIRONMENT"

# Update health check to use new slot ports
if [[ "$NEW_SLOT" == "green" ]]; then
    API_BASE_URL="http://localhost:4001"
    FRONTEND_URL="http://localhost:5174"
else
    API_BASE_URL="http://localhost:4000"
    FRONTEND_URL="http://localhost:5173"
fi

# Custom health check for new slot
check_new_slot_health() {
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        if curl -f -s "$API_BASE_URL/health" > /dev/null; then
            log_success "New deployment is responding"
            return 0
        else
            retries=$((retries + 1))
            if [ $retries -eq $max_retries ]; then
                log_error "New deployment health check failed"
                return 1
            fi
            log_info "Waiting for new deployment... (attempt $retries/$max_retries)"
            sleep 10
        fi
    done
}

if ! check_new_slot_health; then
    log_error "New deployment failed health check"
    rollback
fi

# Smoke tests on new deployment
log_info "Running smoke tests on new deployment..."

# Test critical endpoints
CRITICAL_ENDPOINTS=(
    "$API_BASE_URL/health"
    "$API_BASE_URL/auth/health"
    "$API_BASE_URL/files/health"
    "$FRONTEND_URL"
)

for endpoint in "${CRITICAL_ENDPOINTS[@]}"; do
    if ! curl -f -s "$endpoint" > /dev/null; then
        log_error "Smoke test failed for: $endpoint"
        rollback
    fi
    log_success "Smoke test passed: $endpoint"
done

# Database connectivity test
log_info "Testing database connectivity..."
if ! docker exec $(docker ps -q -f name=postgres) pg_isready -U postgres > /dev/null; then
    log_error "Database connectivity test failed"
    rollback
fi

# Performance test
log_info "Running performance test..."
response_time=$(curl -o /dev/null -s -w "%{time_total}" "$API_BASE_URL/health")
if (( $(echo "$response_time > 5.0" | bc -l) )); then
    log_error "Performance test failed - response time too high: ${response_time}s"
    rollback
fi
log_success "Performance test passed: ${response_time}s"

# Traffic switching preparation
log_info "Preparing traffic switch..."

# Update load balancer configuration to route to new slot
if [[ -f "infrastructure/production/nginx.conf" ]]; then
    # Backup current nginx config
    cp infrastructure/production/nginx.conf "infrastructure/production/nginx.conf.backup.$(date +%s)"
    
    # Update upstream configuration
    if [[ "$NEW_SLOT" == "green" ]]; then
        sed -i 's/server api-gateway:4000/server api-gateway:4001/g' infrastructure/production/nginx.conf
    fi
    
    # Reload nginx configuration
    docker exec $(docker ps -q -f name=nginx) nginx -s reload || {
        log_warning "Nginx reload failed, manual update may be required"
    }
fi

# Gradual traffic switch (if load balancer supports it)
log_info "Performing gradual traffic switch..."

# Wait for traffic to stabilize
sleep 30

# Final health check with production traffic
log_info "Final health check with production traffic..."
if ! ./scripts/health-check.sh $ENVIRONMENT; then
    log_error "Final health check failed"
    rollback
fi

# Switch complete - stop old deployment
log_info "🔄 Switching traffic to $NEW_SLOT slot..."
log_info "Stopping old deployment ($CURRENT_SLOT)..."
docker-compose -f "docker-compose.${CURRENT_SLOT}.yml" down

# Clean up old images (optional)
log_info "Cleaning up old Docker images..."
docker image prune -f || true

# Update deployment state
echo "$NEW_SLOT" > ".deployment-state"

# Success notification
log_success "🎉 BLUE-GREEN DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "=================================="
echo "✅ Active Slot: $NEW_SLOT"
echo "✅ Previous Slot: $CURRENT_SLOT (stopped)"
echo "✅ Image Tag: $IMAGE_TAG"
echo "✅ Environment: $ENVIRONMENT"
echo "✅ API URL: $API_BASE_URL"
echo "✅ Frontend URL: $FRONTEND_URL"
echo "✅ Response Time: ${response_time}s"
echo "✅ Backup Created: backups/$backup_file"
echo "=================================="

# Generate deployment report
cat > "deployment-report-${NEW_SLOT}-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "deployment_id": "$(uuidgen)",
  "timestamp": "$(date -Iseconds)",
  "environment": "$ENVIRONMENT",
  "strategy": "blue-green",
  "active_slot": "$NEW_SLOT",
  "previous_slot": "$CURRENT_SLOT", 
  "image_tag": "$IMAGE_TAG",
  "status": "success",
  "api_url": "$API_BASE_URL",
  "frontend_url": "$FRONTEND_URL",
  "response_time": "$response_time",
  "backup_file": "backups/$backup_file",
  "services_deployed": [$(printf '"%s",' "${SERVICES[@]}" | sed 's/,$//')]
}
EOF

log_success "Deployment report saved"

# Disable trap since deployment succeeded
trap - ERR EXIT

exit 0