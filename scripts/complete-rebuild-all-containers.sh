#!/bin/bash

# Complete System Rebuild Script for Clinic App - All 34 Containers
# This script performs a complete teardown and rebuild of the entire system
# Including all core, enhanced, and monitoring containers
# Total: 34 containers across all docker-compose files

set -e  # Exit on any error

# Configuration
API_URL="http://localhost:4000"
ADMIN_SECRET="clinic-admin-secret-2024"

# Default user credentials (can be overridden by environment variables)
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@clinic.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!}"
THERAPIST_EMAIL="${THERAPIST_EMAIL:-therapist@clinic.com}"
THERAPIST_PASSWORD="${THERAPIST_PASSWORD:-Therapist123!}"
PATIENT_EMAIL="${PATIENT_EMAIL:-patient@clinic.com}"
PATIENT_PASSWORD="${PATIENT_PASSWORD:-Patient123!}"

# Skip user seeding flag
SKIP_USER_SEEDING="${SKIP_USER_SEEDING:-false}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${CYAN}ℹ️  $(date '+%Y-%m-%d %H:%M:%S') $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $(date '+%Y-%m-%d %H:%M:%S') $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $(date '+%Y-%m-%d %H:%M:%S') $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $(date '+%Y-%m-%d %H:%M:%S') $1${NC}"
}

log_step() {
    echo -e "${MAGENTA}🔧 $(date '+%Y-%m-%d %H:%M:%S') $1${NC}"
}

# Progress function
wait_with_progress() {
    local seconds=$1
    local message=$2

    echo -n "$message"
    for ((i=1; i<=seconds; i++)); do
        echo -n "."
        sleep 1
    done
    echo -e " ${GREEN}done!${NC}"
}

# Health check function
check_service_health() {
    local service_name=$1
    local health_url=$2
    local max_attempts=${3:-30}

    log_info "Waiting for $service_name to be healthy..."

    for ((i=1; i<=max_attempts; i++)); do
        if curl -s -f "$health_url" >/dev/null 2>&1; then
            log_success "$service_name is healthy!"
            return 0
        fi
        echo -n "."
        sleep 2
    done

    log_warning "$service_name failed to become healthy after $max_attempts attempts"
    return 1
}

# User creation function
create_database_user() {
    local user_type=$1
    local email=$2
    local password=$3
    local first_name=$4
    local last_name=$5
    local role=$6

    log_info "Creating $user_type user: $email"

    # Generate password hash using Node.js
    local password_hash
    password_hash=$(node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('$password', 12))" 2>/dev/null)

    if [ -z "$password_hash" ]; then
        log_error "Failed to generate password hash for $user_type"
        return 1
    fi

    # Create user via SQL
    local full_name="$first_name $last_name"
    local sql_command="INSERT INTO \"user\" (email, name, password, roles) VALUES ('$email', '$full_name', '$password_hash', '{$role}') ON CONFLICT (email) DO NOTHING;"

    PGPASSWORD=postgres echo "$sql_command" | psql -h localhost -p 5432 -U postgres -d clinic >/dev/null 2>&1

    if [ $? -eq 0 ]; then
        log_success "$user_type user created: $email / $password"
        return 0
    else
        log_warning "User may already exist or database not ready: $email"
        return 1
    fi
}

# Main rebuild function
main() {
    echo ""
    echo -e "${CYAN}======================================================================${NC}"
    echo -e "${CYAN}🚀 COMPLETE SYSTEM REBUILD - ALL 34 CONTAINERS${NC}"
    echo -e "${CYAN}======================================================================${NC}"
    echo ""

    # PHASE 1: COMPLETE TEARDOWN
    echo ""
    log_step "PHASE 1: COMPLETE TEARDOWN AND CLEANUP"
    echo -e "${YELLOW}--------------------------------------------------${NC}"

    # Stop all compose stacks
    log_info "Stopping all Docker Compose stacks..."
    docker compose down --remove-orphans >/dev/null 2>&1 || true
    docker compose -f docker-compose.yml -f docker-compose.enhanced.yml down --remove-orphans >/dev/null 2>&1 || true
    docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down --remove-orphans >/dev/null 2>&1 || true
    docker compose -f docker-compose.core.yml down --remove-orphans >/dev/null 2>&1 || true
    docker compose -f docker-compose.production-ready.yml down --remove-orphans >/dev/null 2>&1 || true
    docker compose -f docker-compose.staging.yml down --remove-orphans >/dev/null 2>&1 || true
    docker compose -f docker-compose.test.yml down --remove-orphans >/dev/null 2>&1 || true

    # Remove all clinic-app containers
    log_info "Removing all clinic-app containers..."
    containers=$(docker ps -aq --filter "name=clinic-app" 2>/dev/null || true)
    if [ ! -z "$containers" ]; then
        docker rm -f $containers >/dev/null 2>&1 || true
        log_success "Removed all clinic-app containers"
    fi

    # Remove all clinic-app images
    log_info "Removing all clinic-app images..."
    images=$(docker images --filter "reference=clinic-app*" -q 2>/dev/null || true)
    if [ ! -z "$images" ]; then
        docker rmi -f $images >/dev/null 2>&1 || true
        log_success "Removed all clinic-app images"
    fi

    # Clean up volumes
    log_info "Cleaning up Docker volumes..."
    docker volume prune -f >/dev/null 2>&1 || true

    # Clean up networks
    log_info "Cleaning up Docker networks..."
    docker network prune -f >/dev/null 2>&1 || true
    docker network rm clinic-network >/dev/null 2>&1 || true

    # Clean build cache
    log_info "Cleaning Docker build cache..."
    docker builder prune -f >/dev/null 2>&1 || true

    log_success "Complete teardown finished!"

    # PHASE 2: DEPENDENCIES AND PRE-BUILD
    echo ""
    log_step "PHASE 2: DEPENDENCIES AND PRE-BUILD SETUP"
    echo -e "${YELLOW}--------------------------------------------------${NC}"

    # Build Node.js dependencies
    log_info "Installing Node.js dependencies..."
    yarn install

    log_info "Building @clinic/common library..."
    yarn workspace '@clinic/common' build

    # Create external network for monitoring
    log_info "Creating Docker networks..."
    docker network create clinic-network >/dev/null 2>&1 || true

    log_success "Dependencies ready!"

    # PHASE 3: BUILD ALL IMAGES
    echo ""
    log_step "PHASE 3: BUILDING ALL DOCKER IMAGES (NO CACHE)"
    echo -e "${YELLOW}--------------------------------------------------${NC}"

    # Build main compose images
    log_info "Building main application images..."
    docker compose build --no-cache

    # Build enhanced services images
    log_info "Building enhanced services images..."
    docker compose -f docker-compose.yml -f docker-compose.enhanced.yml build --no-cache

    log_success "All images built successfully!"

    # PHASE 4: START INFRASTRUCTURE
    echo ""
    log_step "PHASE 4: STARTING INFRASTRUCTURE SERVICES"
    echo -e "${YELLOW}--------------------------------------------------${NC}"

    log_info "Starting core infrastructure..."
    docker compose up -d postgres redis nats minio maildev

    wait_with_progress 15 "Waiting for infrastructure to initialize"

    # PHASE 5: START MAIN APPLICATION SERVICES
    echo ""
    log_step "PHASE 5: STARTING MAIN APPLICATION SERVICES (20 containers)"
    echo -e "${YELLOW}--------------------------------------------------${NC}"

    log_info "Starting all main application services..."
    docker compose up -d

    wait_with_progress 30 "Waiting for main services to initialize"

    # PHASE 6: START ENHANCED SERVICES
    echo ""
    log_step "PHASE 6: STARTING ENHANCED SERVICES (10 containers)"
    echo -e "${YELLOW}--------------------------------------------------${NC}"

    log_info "Starting enhanced services (AI, Search, CDN, etc.)..."
    docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d

    wait_with_progress 20 "Waiting for enhanced services to initialize"

    # PHASE 7: START MONITORING STACK
    echo ""
    log_step "PHASE 7: STARTING MONITORING & MANAGEMENT STACK (11 containers)"
    echo -e "${YELLOW}--------------------------------------------------${NC}"

    log_info "Starting monitoring and management services..."
    docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

    wait_with_progress 20 "Waiting for monitoring services to initialize"

    # PHASE 8: HEALTH VERIFICATION
    echo ""
    log_step "PHASE 8: VERIFYING SERVICE HEALTH"
    echo -e "${YELLOW}--------------------------------------------------${NC}"

    # Check critical services
    check_service_health "API Gateway" "http://localhost:4000/health" 30
    check_service_health "Auth Service" "http://localhost:3001/health" 15
    check_service_health "Frontend" "http://localhost:5173" 15
    check_service_health "Grafana Dashboard" "http://localhost:3000" 15
    check_service_health "Elasticsearch" "http://localhost:9200/_cluster/health" 15

    # PHASE 9: USER SEEDING
    if [ "$SKIP_USER_SEEDING" != "true" ]; then
        echo ""
        log_step "PHASE 9: SEEDING DEFAULT USERS"
        echo -e "${YELLOW}--------------------------------------------------${NC}"

        wait_with_progress 10 "Waiting for database to be fully ready"

        # Create users
        create_database_user "Admin" "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "System" "Administrator" "admin"
        create_database_user "Therapist" "$THERAPIST_EMAIL" "$THERAPIST_PASSWORD" "Dr. Sarah" "Wilson" "therapist"
        create_database_user "Patient" "$PATIENT_EMAIL" "$PATIENT_PASSWORD" "John" "Doe" "client"
    fi

    # PHASE 10: FINAL STATUS REPORT
    echo ""
    log_step "PHASE 10: FINAL STATUS REPORT"
    echo -e "${YELLOW}--------------------------------------------------${NC}"

    # Count containers
    local running_containers=$(docker ps --filter "name=clinic-app" --format "{{.Names}}" | wc -l)
    local all_containers=$(docker ps -a --filter "name=clinic-app" --format "{{.Names}}" | wc -l)

    echo ""
    echo -e "${GREEN}======================================================================${NC}"
    log_success "🎉 COMPLETE REBUILD FINISHED!"
    echo -e "${GREEN}======================================================================${NC}"
    echo ""

    # Container status
    log_info "📊 CONTAINER STATUS:"
    echo -e "${WHITE}• Total Containers: $all_containers${NC}"
    echo -e "${GREEN}• Running Containers: $running_containers${NC}"
    echo -e "${YELLOW}• Target: 34 containers${NC}"
    echo ""

    # Service breakdown
    log_info "🏗️ SERVICE BREAKDOWN:"
    echo -e "${WHITE}• Core Application Services: 20 containers${NC}"
    echo -e "${WHITE}• Enhanced Services: 10 containers${NC}"
    echo -e "${WHITE}• Monitoring Stack: 11 containers${NC}"
    echo -e "${GREEN}• Total Expected: 34 unique containers${NC}"
    echo ""

    # List running containers
    log_info "📦 RUNNING CONTAINERS:"
    docker ps --filter "name=clinic-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""

    # Access URLs
    log_info "🌐 ACCESS URLS:"
    echo -e "${WHITE}• Main Application: http://localhost:5173${NC}"
    echo -e "${WHITE}• API Gateway: http://localhost:4000${NC}"
    echo -e "${WHITE}• Load Balancer: http://localhost:80${NC}"
    echo ""
    echo -e "${CYAN}📊 MANAGEMENT DASHBOARDS:${NC}"
    echo -e "${WHITE}• Grafana Monitoring: http://localhost:3000 (admin/admin)${NC}"
    echo -e "${WHITE}• pgAdmin Database: http://localhost:5050 (admin@clinic.com/admin)${NC}"
    echo -e "${WHITE}• Redis Commander: http://localhost:8081 (admin/admin)${NC}"
    echo -e "${WHITE}• Uptime Monitoring: http://localhost:3301${NC}"
    echo -e "${WHITE}• Prometheus Metrics: http://localhost:9090${NC}"
    echo -e "${WHITE}• Jaeger Tracing: http://localhost:16686${NC}"
    echo -e "${WHITE}• Elasticsearch: http://localhost:9200${NC}"
    echo -e "${WHITE}• Email Testing: http://localhost:1080${NC}"
    echo ""

    if [ "$SKIP_USER_SEEDING" != "true" ]; then
        log_info "👥 DEFAULT USERS:"
        echo -e "${WHITE}┌─────────────────────────────────────────────────────┐${NC}"
        echo -e "${WHITE}│ ADMIN: $ADMIN_EMAIL / $ADMIN_PASSWORD${NC}"
        echo -e "${WHITE}│ THERAPIST: $THERAPIST_EMAIL / $THERAPIST_PASSWORD${NC}"
        echo -e "${WHITE}│ PATIENT: $PATIENT_EMAIL / $PATIENT_PASSWORD${NC}"
        echo -e "${WHITE}└─────────────────────────────────────────────────────┘${NC}"
        echo ""
    fi

    # Check for any failed containers
    local failed_containers=$(docker ps -a --filter "name=clinic-app" --filter "status=exited" --format "{{.Names}}" | wc -l)

    if [ "$failed_containers" -gt 0 ]; then
        log_warning "⚠️ Some containers have exited. Checking logs..."
        docker ps -a --filter "name=clinic-app" --filter "status=exited" --format "table {{.Names}}\t{{.Status}}"
        echo ""
        log_info "To check logs of failed containers, use:"
        echo -e "${YELLOW}docker logs <container-name>${NC}"
    fi

    log_success "System rebuild complete! All services should be operational."
    echo ""

    # Final tips
    log_info "💡 USEFUL COMMANDS:"
    echo -e "${WHITE}• Check all containers: docker ps --filter 'name=clinic-app'${NC}"
    echo -e "${WHITE}• Check logs: docker logs clinic-app-<service-name>-1${NC}"
    echo -e "${WHITE}• Restart a service: docker compose restart <service-name>${NC}"
    echo -e "${WHITE}• Stop everything: docker compose down${NC}"
    echo ""
}

# Check if running as root and warn
if [ "$EUID" -eq 0 ]; then
    log_warning "Running as root. Consider running as a regular user with Docker permissions."
fi

# Execute the rebuild
main "$@"