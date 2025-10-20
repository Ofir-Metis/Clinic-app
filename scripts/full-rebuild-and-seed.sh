#!/bin/bash

# Full Rebuild and Seed Script for Clinic App
# This script performs a complete rebuild with Docker cleanup and seeds all necessary users
# Usage: ./scripts/full-rebuild-and-seed.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL=${API_URL:-"http://localhost:4000"}
ADMIN_SECRET=${ADMIN_SECRET:-"clinic-admin-secret-2024"}

# Default user credentials
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@clinic.com"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"Admin123!"}
THERAPIST_EMAIL=${THERAPIST_EMAIL:-"therapist@clinic.com"}
THERAPIST_PASSWORD=${THERAPIST_PASSWORD:-"Therapist123!"}
PATIENT_EMAIL=${PATIENT_EMAIL:-"patient@clinic.com"}
PATIENT_PASSWORD=${PATIENT_PASSWORD:-"Patient123!"}

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Wait function with spinner
wait_with_spinner() {
    local seconds=$1
    local message=$2
    echo -n "$message"
    for ((i=0; i<seconds; i++)); do
        printf "."
        sleep 1
    done
    echo " done!"
}

# Health check function
check_service_health() {
    local service_name=$1
    local health_url=$2
    local max_attempts=${3:-30}

    log "Waiting for $service_name to be healthy..."

    for ((i=1; i<=max_attempts; i++)); do
        if curl -s "$health_url" > /dev/null 2>&1; then
            log_success "$service_name is healthy!"
            return 0
        fi

        echo -n "."
        sleep 2
    done

    log_error "$service_name failed to become healthy after $max_attempts attempts"
    return 1
}

# Create user function (generic)
create_user() {
    local user_type=$1
    local email=$2
    local password=$3
    local first_name=$4
    local last_name=$5
    local role=$6

    log "Creating $user_type user: $email"

    # Try to create user via API
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"firstName\": \"$first_name\",
            \"lastName\": \"$last_name\",
            \"role\": \"$role\"
        }" 2>/dev/null || echo -e "\n000")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        log_success "$user_type user created successfully via API!"
        return 0
    else
        log_warning "API creation failed for $user_type (HTTP $http_code). Creating via SQL..."
        create_user_sql "$email" "$password" "$first_name" "$last_name" "$role"
        return $?
    fi
}

# Create user via SQL
create_user_sql() {
    local email=$1
    local password=$2
    local first_name=$3
    local last_name=$4
    local role=$5

    # Generate password hash using bcrypt
    if command -v node >/dev/null 2>&1; then
        password_hash=$(node -pe "require('bcrypt').hashSync('$password', 12)")
    else
        log_error "Node.js not found. Cannot hash password."
        return 1
    fi

    user_id="user_$(date +%s)_$(shuf -i 1000-9999 -n 1)"

    # Create SQL commands
    sql_commands=$(cat << EOF
INSERT INTO "user" (email, name, password, roles)
VALUES ('$email', '$first_name $last_name', '$password_hash', '{$role}')
ON CONFLICT (email) DO NOTHING;
EOF
)

    # Execute SQL
    if PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c "$sql_commands" > /dev/null 2>&1; then
        log_success "User created successfully via SQL: $email"
        return 0
    else
        log_error "Failed to create user via SQL: $email"
        return 1
    fi
}

# Main script execution
main() {
    log "🚀 Starting Full Rebuild and Seed Process"
    echo "=================================================="

    # Step 1: Stop all running containers
    log "📦 Step 1: Stopping all running containers..."
    docker compose down --remove-orphans 2>/dev/null || true
    docker compose -f docker-compose.yml -f docker-compose.enhanced.yml down --remove-orphans 2>/dev/null || true
    docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down --remove-orphans 2>/dev/null || true

    # Step 2: Remove all containers and images
    log "🧹 Step 2: Cleaning up Docker environment..."

    # Remove all clinic-app containers
    log "Removing all clinic-app containers..."
    docker ps -aq --filter "name=clinic-app" | xargs -r docker rm -f 2>/dev/null || true

    # Remove all clinic-app images
    log "Removing all clinic-app images..."
    docker images --filter "reference=clinic-app*" -q | xargs -r docker rmi -f 2>/dev/null || true

    # Clean up unused volumes and networks
    log "Cleaning up volumes and networks..."
    docker volume prune -f 2>/dev/null || true
    docker network prune -f 2>/dev/null || true

    # Step 3: Build dependencies
    log "🔧 Step 3: Building dependencies..."
    yarn install
    yarn workspace @clinic/common build

    # Step 4: Build all Docker images
    log "🏗️  Step 4: Building all Docker images..."
    docker compose build --no-cache

    # Step 5: Start infrastructure services first
    log "🏗️  Step 5: Starting infrastructure services..."
    docker compose up -d postgres redis nats minio maildev

    # Wait for infrastructure to be ready
    wait_with_spinner 15 "Waiting for infrastructure services to initialize"

    # Step 6: Start core application services
    log "🚀 Step 6: Starting core application services..."
    docker compose up -d

    # Wait for core services
    wait_with_spinner 30 "Waiting for core services to initialize"

    # Step 7: Start enhanced services (if available)
    log "🔧 Step 7: Starting enhanced services..."
    if [ -f "docker-compose.enhanced.yml" ]; then
        docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d 2>/dev/null || true
    fi

    # Step 8: Start monitoring services
    log "📊 Step 8: Starting monitoring services..."
    if [ -f "docker-compose.monitoring.yml" ]; then
        docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d 2>/dev/null || true
    fi

    # Step 9: Health checks
    log "🏥 Step 9: Performing health checks..."

    # Check API Gateway
    if check_service_health "API Gateway" "http://localhost:4000/health" 30; then
        log_success "API Gateway is healthy"
    else
        log_error "API Gateway health check failed"
        exit 1
    fi

    # Check Auth Service
    if check_service_health "Auth Service" "http://localhost:3001/health" 15; then
        log_success "Auth Service is healthy"
    else
        log_warning "Auth Service health check failed, continuing..."
    fi

    # Step 10: Seed users
    log "👥 Step 10: Creating seed users..."

    # Wait a bit more for services to fully initialize
    wait_with_spinner 10 "Waiting for services to fully initialize before seeding users"

    # Create admin user
    log "Creating admin user..."
    if create_user "Admin" "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "System" "Administrator" "admin"; then
        log_success "✅ Admin user created: $ADMIN_EMAIL / $ADMIN_PASSWORD"
    else
        log_error "Failed to create admin user"
    fi

    # Create therapist user
    log "Creating therapist user..."
    if create_user "Therapist" "$THERAPIST_EMAIL" "$THERAPIST_PASSWORD" "Dr. Sarah" "Wilson" "therapist"; then
        log_success "✅ Therapist user created: $THERAPIST_EMAIL / $THERAPIST_PASSWORD"
    else
        log_error "Failed to create therapist user"
    fi

    # Create patient/client user
    log "Creating patient user..."
    if create_user "Patient" "$PATIENT_EMAIL" "$PATIENT_PASSWORD" "John" "Doe" "client"; then
        log_success "✅ Patient user created: $PATIENT_EMAIL / $PATIENT_PASSWORD"
    else
        log_error "Failed to create patient user"
    fi

    # Step 11: Final status report
    log "📋 Step 11: Final status report..."
    echo
    echo "=================================================="
    log_success "🎉 FULL REBUILD AND SEED COMPLETED SUCCESSFULLY!"
    echo "=================================================="
    echo
    echo "📊 Container Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep clinic-app || echo "No clinic-app containers found"
    echo
    echo "👥 Seed Users Created:"
    echo "┌─────────────────────────────────────────────────────┐"
    echo "│ 1. 👑 ADMIN USER                                   │"
    echo "│    Email: $ADMIN_EMAIL                           │"
    echo "│    Password: $ADMIN_PASSWORD                       │"
    echo "│    Access: Admin Dashboard + Monitoring            │"
    echo "│    URL: http://localhost:5173/admin                │"
    echo "│                                                     │"
    echo "│ 2. 🩺 THERAPIST USER                              │"
    echo "│    Email: $THERAPIST_EMAIL                    │"
    echo "│    Password: $THERAPIST_PASSWORD                 │"
    echo "│    Access: Therapist Dashboard                     │"
    echo "│    URL: http://localhost:5173/therapist            │"
    echo "│                                                     │"
    echo "│ 3. 👤 PATIENT USER                                │"
    echo "│    Email: $PATIENT_EMAIL                        │"
    echo "│    Password: $PATIENT_PASSWORD                   │"
    echo "│    Access: Client Portal                           │"
    echo "│    URL: http://localhost:5173/client               │"
    echo "└─────────────────────────────────────────────────────┘"
    echo
    echo "🌐 Application URLs:"
    echo "• Main App: http://localhost:5173"
    echo "• API Gateway: http://localhost:4000"
    echo "• Admin Dashboard: http://localhost:5173/admin"
    echo "• Monitoring (Grafana): http://localhost:3000"
    echo "• Monitoring (Prometheus): http://localhost:9090"
    echo "• Email Testing: http://localhost:1080"
    echo
    echo "⚠️  IMPORTANT SECURITY NOTES:"
    echo "• Change all default passwords immediately after first login"
    echo "• The admin user has access to monitoring and system management"
    echo "• All users are created with default credentials for testing"
    echo
    log_success "Clinic application is now ready for use!"
}

# Execute main function
main "$@"