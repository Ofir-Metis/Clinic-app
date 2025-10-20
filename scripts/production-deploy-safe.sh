#!/bin/bash
#########################################################
# 🏗️ CLINIC APP - PRODUCTION SAFE DEPLOYMENT SCRIPT
# Anti-loop safeguards, comprehensive logging, controlled deployment
#########################################################

set -euo pipefail  # Exit on error, undefined variables, pipe failures

# Default configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
LOCK_FILE="$LOG_DIR/deployment.lock"
START_TIME=$(date +%s)
MAX_DURATION_MINUTES=30
MAX_RETRIES=3

# Command line options
DRY_RUN=false
KEEP_DATA=false
ENHANCED=false
MONITORING=false
FORCE=false
SKIP_TESTS=false
VERBOSE=false

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# Ensure logs directory exists
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/production-deploy-$(date +%Y%m%d_%H%M%S).log"

# Cleanup function
cleanup() {
    local exit_code=$?
    log "INFO" "Performing cleanup..."
    remove_deployment_lock
    
    if [ $exit_code -ne 0 ]; then
        log "ERROR" "Deployment failed with exit code $exit_code"
        echo ""
        echo -e "${RED}💥 DEPLOYMENT FAILED${NC}"
        echo -e "${YELLOW}Check log file: $LOG_FILE${NC}"
        echo ""
    fi
    
    exit $exit_code
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Enhanced logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_entry="[$timestamp] [$level] $message"
    
    # Check deployment timeout
    local current_time=$(date +%s)
    local elapsed=$((current_time - START_TIME))
    local max_seconds=$((MAX_DURATION_MINUTES * 60))
    
    if [ $elapsed -gt $max_seconds ]; then
        echo -e "${RED}❌ DEPLOYMENT TIMEOUT: Exceeded maximum duration of $MAX_DURATION_MINUTES minutes${NC}"
        remove_deployment_lock
        exit 1
    fi
    
    # Console output with colors and emojis
    case "$level" in
        "INFO")     echo -e "${CYAN}[$timestamp] ℹ️  $message${NC}" ;;
        "WARN")     echo -e "${YELLOW}[$timestamp] ⚠️  $message${NC}" ;;
        "ERROR")    echo -e "${RED}[$timestamp] ❌ $message${NC}" ;;
        "SUCCESS")  echo -e "${GREEN}[$timestamp] ✅ $message${NC}" ;;
        "STEP")     echo -e "${MAGENTA}[$timestamp] 🚀 $message${NC}" ;;
        "CRITICAL") echo -e "${WHITE}${RED}[$timestamp] 💥 $message${NC}" ;;
        "DEBUG")    [[ "$VERBOSE" == "true" ]] && echo -e "${CYAN}[$timestamp] 🔍 $message${NC}" ;;
    esac
    
    # File logging
    echo "$log_entry" >> "$LOG_FILE" 2>/dev/null || true
}

show_help() {
    echo -e "${CYAN}🏗️  Clinic App - Production Safe Deployment Script${NC}"
    echo ""
    echo -e "${YELLOW}USAGE:${NC}"
    echo "    ./scripts/production-deploy-safe.sh [OPTIONS]"
    echo ""
    echo -e "${YELLOW}SAFETY OPTIONS:${NC}"
    echo "    --dry-run         Show what would be done without executing"
    echo "    --force           Override existing deployment locks"
    echo "    --max-retries N   Maximum retries per operation (default: 3)"
    echo "    --timeout N       Maximum deployment time in minutes (default: 30)"
    echo "    --verbose         Enable debug logging"
    echo ""
    echo -e "${YELLOW}DEPLOYMENT OPTIONS:${NC}"
    echo "    --skip-tests      Skip E2E testing phase"
    echo "    --keep-data       Preserve existing database data"
    echo "    --enhanced        Include enhanced services (AI, Search, CDN)"
    echo "    --monitoring      Include monitoring stack"
    echo "    --help            Show this help"
    echo ""
    echo -e "${YELLOW}EXAMPLES:${NC}"
    echo "    ./scripts/production-deploy-safe.sh --dry-run"
    echo "    ./scripts/production-deploy-safe.sh --enhanced --timeout 45"
    echo "    ./scripts/production-deploy-safe.sh --force --keep-data"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --keep-data)
                KEEP_DATA=true
                shift
                ;;
            --enhanced)
                ENHANCED=true
                shift
                ;;
            --monitoring)
                MONITORING=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --max-retries)
                MAX_RETRIES="$2"
                shift 2
                ;;
            --timeout)
                MAX_DURATION_MINUTES="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Lock file mechanism to prevent concurrent deployments
test_deployment_lock() {
    if [[ -f "$LOCK_FILE" ]]; then
        local lock_content=$(cat "$LOCK_FILE" 2>/dev/null || echo "{}")
        local lock_time=$(echo "$lock_content" | grep -o '"startTime":[0-9]*' | cut -d: -f2 || echo "0")
        local current_time=$(date +%s)
        local lock_age=$((current_time - lock_time))
        
        # 2 hour timeout for stale locks
        if [[ $lock_age -lt 7200 ]]; then
            if [[ "$FORCE" != "true" ]]; then
                local lock_date=$(date -d "@$lock_time" 2>/dev/null || date -r "$lock_time" 2>/dev/null || echo "unknown")
                echo -e "${RED}❌ Deployment is already running (started at $lock_date)${NC}"
                local lock_pid=$(echo "$lock_content" | grep -o '"processId":[0-9]*' | cut -d: -f2 || echo "unknown")
                echo -e "${YELLOW}   PID: $lock_pid${NC}"
                echo -e "${YELLOW}   Use --force to override (use with caution)${NC}"
                exit 1
            else
                log "WARN" "Forcing deployment override..."
            fi
        else
            log "WARN" "Stale lock file found (older than 2 hours), removing..."
            rm -f "$LOCK_FILE"
        fi
    fi
    
    # Create lock file
    cat > "$LOCK_FILE" << EOF
{
    "startTime": $(date +%s),
    "processId": $$,
    "scriptPath": "${BASH_SOURCE[0]}"
}
EOF
}

remove_deployment_lock() {
    rm -f "$LOCK_FILE" 2>/dev/null || true
}

# Retry mechanism with circuit breaker pattern
retry_operation() {
    local operation_name="$1"
    local max_attempts="${2:-$MAX_RETRIES}"
    local delay_seconds="${3:-5}"
    shift 3
    local command=("$@")
    
    for ((attempt=1; attempt<=max_attempts; attempt++)); do
        log "DEBUG" "Attempting $operation_name (attempt $attempt/$max_attempts)"
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log "INFO" "[DRY RUN] Would execute: $operation_name"
            return 0
        fi
        
        if "${command[@]}" 2>&1 | tee -a "$LOG_FILE"; then
            log "SUCCESS" "$operation_name completed successfully"
            return 0
        else
            local exit_code=$?
            log "WARN" "$operation_name failed on attempt $attempt/$max_attempts (exit code: $exit_code)"
            
            if [[ $attempt -eq $max_attempts ]]; then
                log "ERROR" "$operation_name failed after $max_attempts attempts"
                return $exit_code
            fi
            
            log "INFO" "Retrying $operation_name in $delay_seconds seconds..."
            sleep "$delay_seconds"
        fi
    done
}

test_prerequisites() {
    log "STEP" "Checking prerequisites and system readiness..."
    
    # Check available disk space (minimum 10GB)
    local available_space=$(df "$PROJECT_ROOT" | awk 'NR==2 {print int($4/1024/1024)}')
    if [[ $available_space -lt 10 ]]; then
        log "ERROR" "Insufficient disk space: ${available_space}GB available, minimum 10GB required"
        exit 1
    fi
    log "INFO" "Disk space check: ${available_space}GB available"
    
    # Check required tools
    local tools=("node" "yarn" "docker")
    for tool in "${tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            local version=$("$tool" --version 2>/dev/null | head -1)
            log "INFO" "$tool found: $version"
        else
            log "ERROR" "$tool not found. Please install before proceeding."
            exit 1
        fi
    done
    
    # Check Docker Compose
    if docker compose version >/dev/null 2>&1; then
        local compose_version=$(docker compose version 2>/dev/null | head -1)
        log "INFO" "docker compose found: $compose_version"
    else
        log "ERROR" "docker compose not found. Please install Docker with Compose v2"
        exit 1
    fi
    
    # Check Docker daemon
    retry_operation "Docker daemon connectivity" 3 5 docker info >/dev/null
    
    log "SUCCESS" "All prerequisites satisfied"
}

stop_environment() {
    log "STEP" "Performing controlled environment shutdown..."
    
    cd "$PROJECT_ROOT"
    
    # Kill any runaway docker-compose processes
    log "INFO" "Checking for runaway Docker Compose processes..."
    if pgrep -f "docker.compose" >/dev/null 2>&1; then
        log "WARN" "Found Docker Compose processes, terminating..."
        pkill -f "docker.compose" 2>/dev/null || true
        sleep 3
    fi
    
    # Stop services gracefully
    local compose_files=("docker-compose.yml")
    [[ "$ENHANCED" == "true" ]] && compose_files+=("docker-compose.enhanced.yml")
    [[ "$MONITORING" == "true" ]] && compose_files+=("docker-compose.monitoring.yml")
    
    for compose_file in "${compose_files[@]}"; do
        if [[ -f "$compose_file" ]]; then
            log "INFO" "Stopping services from $compose_file..."
            if [[ "$DRY_RUN" != "true" ]]; then
                local compose_args=()
                for file in "${compose_files[@]}"; do
                    compose_args+=("-f" "$file")
                    [[ "$file" == "$compose_file" ]] && break
                done
                docker compose "${compose_args[@]}" down --timeout 30 --remove-orphans 2>/dev/null || true
            fi
        fi
    done
    
    # Force cleanup if needed
    if [[ "$DRY_RUN" != "true" ]]; then
        log "INFO" "Performing aggressive cleanup..."
        
        # Stop all containers
        local all_containers=$(docker ps -aq 2>/dev/null || true)
        if [[ -n "$all_containers" ]]; then
            log "INFO" "Force stopping containers..."
            echo "$all_containers" | xargs -r docker stop >/dev/null 2>&1 || true
            echo "$all_containers" | xargs -r docker rm -f >/dev/null 2>&1 || true
        fi
        
        # Clean build cache
        log "INFO" "Cleaning Docker build cache..."
        docker builder prune -af >/dev/null 2>&1 || true
        
        # System cleanup
        if [[ "$KEEP_DATA" == "true" ]]; then
            log "INFO" "Cleaning Docker system (preserving volumes)..."
            docker system prune -af >/dev/null 2>&1 || true
        else
            log "INFO" "Cleaning Docker system including volumes..."
            docker system prune -af --volumes >/dev/null 2>&1 || true
        fi
        
        # Verify cleanup
        local remaining_containers=$(docker ps -aq 2>/dev/null | wc -l)
        log "INFO" "Cleanup complete. Remaining containers: $remaining_containers"
    fi
    
    log "SUCCESS" "Environment cleaned and ready for fresh deployment"
}

build_docker_services() {
    log "STEP" "Building Docker services with anti-loop safeguards..."
    
    cd "$PROJECT_ROOT"
    
    # Service groups in dependency order
    declare -A service_groups=(
        ["Foundation"]="postgres redis nats minio maildev"
        ["Core Services"]="auth-service files-service settings-service"
        ["Business Services"]="appointments-service notes-service notifications-service analytics-service"
        ["Extended Services"]="billing-service therapists-service google-integration-service client-relationships-service"
        ["Gateway"]="api-gateway"
        ["Frontend"]="frontend nginx"
    )
    
    # Enhanced services
    if [[ "$ENHANCED" == "true" ]]; then
        service_groups["Enhanced"]="ai-service search-service cdn-service progress-service"
    fi
    
    # Count total services
    local total_services=0
    for group in "${service_groups[@]}"; do
        total_services=$((total_services + $(echo "$group" | wc -w)))
    done
    log "INFO" "Planning to build $total_services services"
    
    # Build each group
    for group_name in "Foundation" "Core Services" "Business Services" "Extended Services" "Gateway" "Frontend"; do
        [[ -v service_groups["$group_name"] ]] || continue
        local services=(${service_groups["$group_name"]})
        log "INFO" "Building $group_name group: ${services[*]}"
        
        for service in "${services[@]}"; do
            # Skip infrastructure services (they use pre-built images)
            if [[ "$group_name" == "Foundation" ]]; then
                log "INFO" "Skipping $service (uses pre-built image)"
                continue
            fi
            
            log "INFO" "Building $service..."
            
            local build_args=("compose" "build" "--no-cache" "--pull" "$service")
            
            # Add compose files for enhanced services
            if [[ "$ENHANCED" == "true" && "$group_name" == "Enhanced" ]]; then
                build_args=("compose" "-f" "docker-compose.yml" "-f" "docker-compose.enhanced.yml" "build" "--no-cache" "--pull" "$service")
            fi
            
            retry_operation "Build $service" 2 10 docker "${build_args[@]}"
        done
        
        # Brief pause between groups
        [[ "$DRY_RUN" != "true" ]] && sleep 5
    done
    
    # Enhanced services
    if [[ "$ENHANCED" == "true" && -v service_groups["Enhanced"] ]]; then
        local enhanced_services=(${service_groups["Enhanced"]})
        log "INFO" "Building Enhanced group: ${enhanced_services[*]}"
        
        for service in "${enhanced_services[@]}"; do
            log "INFO" "Building $service..."
            retry_operation "Build $service" 2 10 docker compose -f docker-compose.yml -f docker-compose.enhanced.yml build --no-cache --pull "$service"
        done
    fi
    
    log "SUCCESS" "All Docker services built successfully"
}

start_services() {
    log "STEP" "Starting services in controlled phases..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "[DRY RUN] Would start services in phases"
        return 0
    fi
    
    # Phase 1: Infrastructure
    log "INFO" "Phase 1: Starting infrastructure services..."
    local infra_services=("postgres" "redis" "nats" "minio" "maildev")
    docker compose up -d "${infra_services[@]}"
    
    # Wait for PostgreSQL
    log "INFO" "Waiting for PostgreSQL readiness..."
    local pg_ready=false
    for ((i=1; i<=30; i++)); do
        if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
            pg_ready=true
            break
        fi
        log "INFO" "PostgreSQL check $i/30..."
        sleep 3
    done
    
    if [[ "$pg_ready" != "true" ]]; then
        log "ERROR" "PostgreSQL failed to start within timeout"
        exit 1
    fi
    
    # Phase 2: Core application services
    log "INFO" "Phase 2: Starting core application services..."
    local core_services=("auth-service" "files-service" "settings-service")
    docker compose up -d "${core_services[@]}"
    sleep 15
    
    # Phase 3: Business services
    log "INFO" "Phase 3: Starting business services..."
    local business_services=("appointments-service" "notes-service" "notifications-service" "analytics-service")
    docker compose up -d "${business_services[@]}"
    sleep 15
    
    # Phase 4: Extended services
    log "INFO" "Phase 4: Starting extended services..."
    local extended_services=("billing-service" "therapists-service" "google-integration-service" "client-relationships-service")
    docker compose up -d "${extended_services[@]}"
    sleep 15
    
    # Phase 5: API Gateway and Frontend
    log "INFO" "Phase 5: Starting API gateway and frontend..."
    docker compose up -d api-gateway
    sleep 10
    docker compose up -d frontend nginx
    
    # Phase 6: Enhanced services
    if [[ "$ENHANCED" == "true" ]]; then
        log "INFO" "Phase 6: Starting enhanced services..."
        docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d ai-service search-service cdn-service progress-service
    fi
    
    log "SUCCESS" "All services started in controlled phases"
}

test_service_health() {
    log "STEP" "Performing comprehensive health checks..."
    
    # Health endpoints
    declare -A health_endpoints=(
        ["api-gateway"]="http://localhost:4000/health"
        ["auth-service"]="http://localhost:3001/health"
        ["appointments-service"]="http://localhost:3002/health"
        ["files-service"]="http://localhost:3003/health"
        ["frontend"]="http://localhost:5173"
    )
    
    local failed_services=()
    local total_services=${#health_endpoints[@]}
    
    # Allow services to stabilize
    log "INFO" "Allowing services to stabilize (60 seconds)..."
    [[ "$DRY_RUN" != "true" ]] && sleep 60
    
    for service_name in "${!health_endpoints[@]}"; do
        local endpoint="${health_endpoints[$service_name]}"
        log "INFO" "Testing $service_name health..."
        
        if [[ "$DRY_RUN" == "true" ]]; then
            log "INFO" "[DRY RUN] Would test: $endpoint"
            continue
        fi
        
        local service_healthy=false
        for ((attempt=1; attempt<=10; attempt++)); do
            if curl -s --connect-timeout 10 --max-time 10 "$endpoint" >/dev/null 2>&1; then
                log "SUCCESS" "$service_name health check passed (attempt $attempt)"
                service_healthy=true
                break
            else
                log "DEBUG" "$service_name health check failed (attempt $attempt/10)"
            fi
            sleep 5
        done
        
        if [[ "$service_healthy" != "true" ]]; then
            log "ERROR" "$service_name failed health checks after 10 attempts"
            failed_services+=("$service_name")
        fi
    done
    
    # Summary
    local healthy_services=$((total_services - ${#failed_services[@]}))
    log "INFO" "Health check summary: $healthy_services/$total_services services healthy"
    
    if [[ ${#failed_services[@]} -eq 0 ]]; then
        log "SUCCESS" "All critical services passed health checks"
        return 0
    else
        log "ERROR" "Critical services failed: ${failed_services[*]}"
        log "INFO" "Check service logs: docker compose logs <service-name>"
        return 1
    fi
}

generate_deployment_report() {
    log "STEP" "Generating deployment report..."
    
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local duration_formatted=$(printf '%02d:%02d:%02d' $((duration/3600)) $((duration%3600/60)) $((duration%60)))
    
    local report_file="$LOG_DIR/deployment-report-$(date +%Y%m%d_%H%M%S).json"
    
    # Create JSON report
    cat > "$report_file" << EOF
{
    "deployment": {
        "startTime": $(date -d "@$START_TIME" -Iseconds 2>/dev/null || date -r "$START_TIME" -Iseconds 2>/dev/null || echo "\"$(date -d "@$START_TIME" || date -r "$START_TIME")\""),
        "endTime": $(date -Iseconds 2>/dev/null || echo "\"$(date)\""),
        "duration": "$duration_formatted",
        "success": true,
        "dryRun": $DRY_RUN
    },
    "configuration": {
        "keepData": $KEEP_DATA,
        "enhanced": $ENHANCED,
        "monitoring": $MONITORING,
        "skipTests": $SKIP_TESTS,
        "maxRetries": $MAX_RETRIES,
        "timeoutMinutes": $MAX_DURATION_MINUTES
    },
    "system": {
        "logFile": "$LOG_FILE",
        "lockFile": "$LOCK_FILE",
        "projectRoot": "$PROJECT_ROOT"
    },
    "urls": {
        "frontend": "http://localhost:5173",
        "apiGateway": "http://localhost:4000",
        "apiDocs": "http://localhost:4000/api-docs",
        "minio": "http://localhost:9001",
        "maildev": "http://localhost:1080"
    }
}
EOF
    
    log "SUCCESS" "Deployment report saved: $report_file"
}

#########################################################
# 🚀 MAIN EXECUTION
#########################################################

main() {
    # Parse arguments
    parse_args "$@"
    
    # Initialize deployment
    test_deployment_lock
    
    echo ""
    echo -e "${CYAN}🛡️  ===============================================${NC}"
    echo -e "${CYAN}   CLINIC APP - PRODUCTION SAFE DEPLOYMENT${NC}"
    echo -e "${CYAN}   Anti-loop protection | Comprehensive logging${NC}"
    echo -e "${CYAN}   ===============================================${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Configuration:${NC}"
    echo "   • Dry Run: $DRY_RUN"
    echo "   • Keep Data: $KEEP_DATA"
    echo "   • Enhanced Mode: $ENHANCED"
    echo "   • Monitoring: $MONITORING"
    echo "   • Max Retries: $MAX_RETRIES"
    echo "   • Timeout: $MAX_DURATION_MINUTES minutes"
    echo "   • Force Override: $FORCE"
    echo ""
    echo -e "${YELLOW}📝 Logging:${NC}"
    echo "   • Log File: $LOG_FILE"
    echo "   • Lock File: $LOCK_FILE"
    echo ""
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${YELLOW}🔍 DRY RUN MODE - No actual changes will be made${NC}"
        echo ""
    fi
    
    # Execute deployment phases
    log "INFO" "Starting production deployment with PID $$"
    
    test_prerequisites
    stop_environment
    build_docker_services
    start_services
    local health_passed=0
    test_service_health && health_passed=1
    generate_deployment_report
    
    # Final summary
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    local duration_formatted=$(printf '%02d:%02d:%02d' $((duration/3600)) $((duration%3600/60)) $((duration%60)))
    
    echo ""
    if [[ $health_passed -eq 1 ]] || [[ "$DRY_RUN" == "true" ]]; then
        echo -e "${GREEN}🎉 ===============================================${NC}"
        echo -e "${GREEN}   DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
        [[ "$DRY_RUN" == "true" ]] && echo -e "${YELLOW}   (DRY RUN - No actual deployment performed)${NC}"
        echo -e "${GREEN}   Duration: $duration_formatted${NC}"
        echo -e "${GREEN}   ===============================================${NC}"
        echo ""
        
        if [[ "$DRY_RUN" != "true" ]]; then
            echo -e "${YELLOW}🔗 Access URLs:${NC}"
            echo "   • Frontend:      http://localhost:5173"
            echo "   • API Gateway:   http://localhost:4000"
            echo "   • API Docs:      http://localhost:4000/api-docs"
            echo "   • MinIO Console: http://localhost:9001"
            echo "   • MailDev:       http://localhost:1080"
            echo ""
        fi
        
        echo -e "${YELLOW}📊 Deployment Details:${NC}"
        echo "   • Log File: $LOG_FILE"
        echo "   • Report: logs/deployment-report-*.json"
        echo ""
        
        log "SUCCESS" "Production deployment completed successfully in $duration_formatted"
        return 0
    else
        echo -e "${YELLOW}⚠️  ===============================================${NC}"
        echo -e "${YELLOW}   DEPLOYMENT COMPLETED WITH ISSUES${NC}"
        echo -e "${YELLOW}   Some services failed health checks${NC}"
        echo -e "${YELLOW}   Duration: $duration_formatted${NC}"
        echo -e "${YELLOW}   ===============================================${NC}"
        echo ""
        echo -e "${YELLOW}🔍 Troubleshooting:${NC}"
        echo "   • Check logs: docker compose logs <service-name>"
        echo "   • View log file: $LOG_FILE"
        echo ""
        
        log "WARN" "Deployment completed with health check failures in $duration_formatted"
        return 1
    fi
}

# Run main function with all arguments
main "$@"