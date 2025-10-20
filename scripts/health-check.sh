#!/bin/bash

# Healthcare Platform Health Check Script
# Usage: ./health-check.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
MAX_RETRIES=30
RETRY_DELAY=10

echo "🏥 Healthcare Platform Health Check - ${ENVIRONMENT^^}"
echo "=============================================="

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

# Set environment-specific URLs and ports
if [[ "$ENVIRONMENT" == "staging" ]]; then
    API_BASE_URL="http://localhost:4001"
    FRONTEND_URL="http://localhost:5174"
    DB_PORT="5433"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    API_BASE_URL="https://api.clinic-app.com"
    FRONTEND_URL="https://clinic-app.com"
    DB_PORT="5432"
else
    log_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Health check function
check_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local retries=0

    log_info "Checking $service_name..."
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
            log_success "$service_name is healthy"
            return 0
        else
            retries=$((retries + 1))
            if [ $retries -eq $MAX_RETRIES ]; then
                log_error "$service_name health check failed after $MAX_RETRIES attempts"
                return 1
            fi
            log_warning "$service_name not ready, retrying in ${RETRY_DELAY}s (attempt $retries/$MAX_RETRIES)"
            sleep $RETRY_DELAY
        fi
    done
}

# Database connectivity check
check_database() {
    local retries=0
    log_info "Checking database connectivity..."
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if docker exec -it $(docker ps -q -f name=postgres) pg_isready -U postgres > /dev/null 2>&1; then
            log_success "Database is healthy"
            return 0
        else
            retries=$((retries + 1))
            if [ $retries -eq $MAX_RETRIES ]; then
                log_error "Database health check failed after $MAX_RETRIES attempts"
                return 1
            fi
            log_warning "Database not ready, retrying in ${RETRY_DELAY}s (attempt $retries/$MAX_RETRIES)"
            sleep $RETRY_DELAY
        fi
    done
}

# Core services health checks
CORE_SERVICES=(
    "API Gateway:${API_BASE_URL}/health"
    "Auth Service:${API_BASE_URL}/auth/health"
    "Files Service:${API_BASE_URL}/files/health"
    "Notes Service:${API_BASE_URL}/notes/health"
    "Notifications Service:${API_BASE_URL}/notifications/health"
)

# Extended services for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    EXTENDED_SERVICES=(
        "AI Service:${API_BASE_URL}/ai/health"
        "Analytics Service:${API_BASE_URL}/analytics/health"
        "Settings Service:${API_BASE_URL}/settings/health"
        "Billing Service:${API_BASE_URL}/billing/health"
    )
    CORE_SERVICES+=("${EXTENDED_SERVICES[@]}")
fi

# Perform health checks
log_info "Starting health checks for $ENVIRONMENT environment..."

# Check database first
check_database

failed_services=()

# Check core services
for service in "${CORE_SERVICES[@]}"; do
    IFS=':' read -r service_name service_url <<< "$service"
    if ! check_service "$service_name" "$service_url"; then
        failed_services+=("$service_name")
    fi
done

# Check frontend
if ! check_service "Frontend" "$FRONTEND_URL"; then
    failed_services+=("Frontend")
fi

# Check critical endpoints
log_info "Checking critical endpoints..."

# Authentication endpoint
if ! check_service "Authentication Endpoint" "${API_BASE_URL}/auth/login"; then
    failed_services+=("Authentication")
fi

# API documentation
if ! check_service "API Documentation" "${API_BASE_URL}/api-docs"; then
    failed_services+=("API Docs")
fi

# Performance check
log_info "Running performance checks..."
response_time=$(curl -o /dev/null -s -w "%{time_total}" "${API_BASE_URL}/health")
if (( $(echo "$response_time > 2.0" | bc -l) )); then
    log_warning "API response time is slow: ${response_time}s (should be < 2s)"
else
    log_success "API response time is good: ${response_time}s"
fi

# SSL certificate check for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    log_info "Checking SSL certificate..."
    ssl_expiry=$(echo | openssl s_client -servername clinic-app.com -connect clinic-app.com:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    ssl_expiry_epoch=$(date -d "$ssl_expiry" +%s)
    current_epoch=$(date +%s)
    days_until_expiry=$(( (ssl_expiry_epoch - current_epoch) / 86400 ))
    
    if [ $days_until_expiry -lt 30 ]; then
        log_warning "SSL certificate expires in $days_until_expiry days"
    else
        log_success "SSL certificate is valid for $days_until_expiry days"
    fi
fi

# HIPAA compliance check
log_info "Running HIPAA compliance checks..."

# Check if audit logging is enabled
if curl -f -s "${API_BASE_URL}/admin/audit/status" | grep -q '"enabled":true'; then
    log_success "HIPAA audit logging is enabled"
else
    log_warning "HIPAA audit logging status unclear"
fi

# Check encryption status
if curl -f -s "${API_BASE_URL}/admin/security/encryption-status" | grep -q '"status":"active"'; then
    log_success "Data encryption is active"
else
    log_warning "Data encryption status unclear"
fi

# Final results
echo ""
echo "=============================="
echo "🏥 HEALTH CHECK RESULTS"
echo "=============================="

if [ ${#failed_services[@]} -eq 0 ]; then
    log_success "✅ ALL SERVICES HEALTHY"
    echo "Environment: $ENVIRONMENT"
    echo "API Base URL: $API_BASE_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo "Response Time: ${response_time}s"
    echo "Status: 🟢 READY FOR TRAFFIC"
    
    # Generate health report
    cat > "health-report-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -Iseconds)",
  "status": "healthy",
  "api_base_url": "$API_BASE_URL",
  "frontend_url": "$FRONTEND_URL",
  "response_time": "$response_time",
  "services_checked": ${#CORE_SERVICES[@]},
  "failed_services": []
}
EOF
    
    exit 0
else
    log_error "❌ HEALTH CHECK FAILED"
    echo "Environment: $ENVIRONMENT"
    echo "Failed Services: ${failed_services[*]}"
    echo "Status: 🔴 NOT READY"
    
    # Generate failure report
    cat > "health-report-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -Iseconds)",
  "status": "unhealthy",
  "api_base_url": "$API_BASE_URL",
  "frontend_url": "$FRONTEND_URL",
  "response_time": "$response_time",
  "services_checked": ${#CORE_SERVICES[@]},
  "failed_services": [$(printf '"%s",' "${failed_services[@]}" | sed 's/,$//')]
}
EOF
    
    exit 1
fi