#!/bin/bash

# Healthcare Platform Comprehensive Health Check Script
# Performs system-wide health verification with HIPAA compliance monitoring

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="clinic-production"
LOG_FILE="/var/log/health-check.log"
HEALTH_CHECK_TIMEOUT=30
CRITICAL_SERVICES=("api-gateway" "auth-service" "postgres-primary" "redis-cluster")

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Health check results
HEALTH_RESULTS=()
FAILED_CHECKS=0
WARNING_CHECKS=0

# Add result to array
add_result() {
    local status="$1"
    local check="$2"
    local message="$3"
    
    HEALTH_RESULTS+=("$status|$check|$message")
    
    case "$status" in
        "FAIL") ((FAILED_CHECKS++)) ;;
        "WARN") ((WARNING_CHECKS++)) ;;
    esac
}

# Check Kubernetes cluster connectivity
check_cluster_connectivity() {
    log "Checking Kubernetes cluster connectivity..."
    
    if kubectl cluster-info >/dev/null 2>&1; then
        success "Kubernetes cluster is accessible"
        add_result "PASS" "Cluster Connectivity" "Kubernetes API server accessible"
    else
        error "Cannot connect to Kubernetes cluster"
        add_result "FAIL" "Cluster Connectivity" "Cannot connect to Kubernetes API server"
        return 1
    fi
}

# Check node health
check_node_health() {
    log "Checking node health..."
    
    local unhealthy_nodes=$(kubectl get nodes --no-headers | grep -v " Ready " | wc -l)
    local total_nodes=$(kubectl get nodes --no-headers | wc -l)
    
    if [ "$unhealthy_nodes" -eq 0 ]; then
        success "All $total_nodes nodes are healthy"
        add_result "PASS" "Node Health" "All nodes in Ready state"
    else
        warning "$unhealthy_nodes of $total_nodes nodes are unhealthy"
        add_result "WARN" "Node Health" "$unhealthy_nodes unhealthy nodes detected"
        
        # List unhealthy nodes
        kubectl get nodes --no-headers | grep -v " Ready " | while read line; do
            warning "Unhealthy node: $line"
        done
    fi
}

# Check critical services
check_critical_services() {
    log "Checking critical services health..."
    
    local failed_services=()
    
    for service in "${CRITICAL_SERVICES[@]}"; do
        local ready_pods=$(kubectl get pods -n "$NAMESPACE" -l "app=$service" --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)
        local total_pods=$(kubectl get pods -n "$NAMESPACE" -l "app=$service" --no-headers 2>/dev/null | wc -l)
        
        if [ "$total_pods" -eq 0 ]; then
            error "Service $service: No pods found"
            add_result "FAIL" "Service Health" "$service: No pods found"
            failed_services+=("$service")
        elif [ "$ready_pods" -eq "$total_pods" ] && [ "$ready_pods" -gt 0 ]; then
            success "Service $service: $ready_pods/$total_pods pods running"
            add_result "PASS" "Service Health" "$service: All pods healthy"
        else
            error "Service $service: $ready_pods/$total_pods pods running"
            add_result "FAIL" "Service Health" "$service: $ready_pods/$total_pods pods healthy"
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        error "Failed services: ${failed_services[*]}"
        return 1
    fi
}

# Check database connectivity and health
check_database_health() {
    log "Checking database health..."
    
    # Check PostgreSQL primary
    if kubectl exec -it deployment/postgres-primary -n "$NAMESPACE" -- \
       psql -U postgres -d clinic -c "SELECT 1;" >/dev/null 2>&1; then
        success "PostgreSQL primary database is accessible"
        add_result "PASS" "Database Health" "PostgreSQL primary accessible"
    else
        error "PostgreSQL primary database is not accessible"
        add_result "FAIL" "Database Health" "PostgreSQL primary not accessible"
        return 1
    fi
    
    # Check database size and connections
    local db_size=$(kubectl exec -it deployment/postgres-primary -n "$NAMESPACE" -- \
        psql -U postgres -d clinic -t -c "SELECT pg_size_pretty(pg_database_size('clinic'));" 2>/dev/null | tr -d ' \t\n\r')
    
    local active_connections=$(kubectl exec -it deployment/postgres-primary -n "$NAMESPACE" -- \
        psql -U postgres -d clinic -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | tr -d ' \t\n\r')
    
    log "Database size: $db_size, Active connections: $active_connections"
    
    if [ "$active_connections" -gt 100 ]; then
        warning "High number of active database connections: $active_connections"
        add_result "WARN" "Database Health" "High connection count: $active_connections"
    fi
    
    # Check replication status
    local replication_lag=$(kubectl exec -it deployment/postgres-primary -n "$NAMESPACE" -- \
        psql -U postgres -d clinic -t -c "SELECT COALESCE(EXTRACT(SECONDS FROM (now() - pg_last_xact_replay_timestamp())), 0);" 2>/dev/null | tr -d ' \t\n\r')
    
    if [ "${replication_lag%.*}" -gt 10 ]; then
        warning "Database replication lag is high: ${replication_lag}s"
        add_result "WARN" "Database Health" "Replication lag: ${replication_lag}s"
    else
        success "Database replication lag is acceptable: ${replication_lag}s"
    fi
}

# Check Redis health
check_redis_health() {
    log "Checking Redis health..."
    
    if kubectl exec -it deployment/redis-cluster -n "$NAMESPACE" -- \
       redis-cli ping | grep -q "PONG"; then
        success "Redis is accessible"
        add_result "PASS" "Redis Health" "Redis responding to ping"
    else
        error "Redis is not accessible"
        add_result "FAIL" "Redis Health" "Redis not responding"
        return 1
    fi
    
    # Check Redis memory usage
    local memory_usage=$(kubectl exec -it deployment/redis-cluster -n "$NAMESPACE" -- \
        redis-cli INFO memory | grep "used_memory_human:" | cut -d: -f2 | tr -d '\r\n')
    
    log "Redis memory usage: $memory_usage"
    
    # Check Redis keyspace
    local key_count=$(kubectl exec -it deployment/redis-cluster -n "$NAMESPACE" -- \
        redis-cli DBSIZE | tr -d '\r\n')
    
    log "Redis key count: $key_count"
}

# Check API endpoints
check_api_endpoints() {
    log "Checking API endpoint health..."
    
    local api_endpoints=(
        "/health"
        "/api/health"
        "/api/auth/health"
    )
    
    # Get API Gateway service IP
    local api_service_ip=$(kubectl get svc api-gateway-service -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "localhost")
    
    for endpoint in "${api_endpoints[@]}"; do
        if curl -f -m "$HEALTH_CHECK_TIMEOUT" "http://$api_service_ip:4000$endpoint" >/dev/null 2>&1; then
            success "API endpoint $endpoint is healthy"
            add_result "PASS" "API Health" "$endpoint responding"
        else
            error "API endpoint $endpoint is not responding"
            add_result "FAIL" "API Health" "$endpoint not responding"
        fi
    done
}

# Check storage and disk usage
check_storage_health() {
    log "Checking storage health..."
    
    # Check persistent volumes
    local pv_failed=$(kubectl get pv --no-headers | grep -v "Bound\|Available" | wc -l)
    local pv_total=$(kubectl get pv --no-headers | wc -l)
    
    if [ "$pv_failed" -eq 0 ]; then
        success "All $pv_total persistent volumes are healthy"
        add_result "PASS" "Storage Health" "All PVs in good state"
    else
        warning "$pv_failed of $pv_total persistent volumes have issues"
        add_result "WARN" "Storage Health" "$pv_failed PVs with issues"
    fi
    
    # Check disk usage on database pod
    local db_disk_usage=$(kubectl exec -it deployment/postgres-primary -n "$NAMESPACE" -- \
        df -h /var/lib/postgresql/data | tail -1 | awk '{print $5}' | sed 's/%//' 2>/dev/null || echo "0")
    
    if [ "$db_disk_usage" -gt 85 ]; then
        warning "Database disk usage is high: ${db_disk_usage}%"
        add_result "WARN" "Storage Health" "DB disk usage: ${db_disk_usage}%"
    else
        success "Database disk usage is acceptable: ${db_disk_usage}%"
    fi
}

# Check backup status
check_backup_status() {
    log "Checking backup status..."
    
    # Check for recent database backup
    local recent_backup_count=$(find /backups -name "clinic_full_*.dump" -mtime -1 2>/dev/null | wc -l)
    
    if [ "$recent_backup_count" -gt 0 ]; then
        success "Recent database backup found"
        add_result "PASS" "Backup Status" "Recent DB backup available"
    else
        error "No recent database backup found"
        add_result "FAIL" "Backup Status" "No recent DB backup"
    fi
    
    # Check backup storage connectivity
    if aws s3 ls s3://clinic-backups-primary/ >/dev/null 2>&1; then
        success "Backup storage is accessible"
        add_result "PASS" "Backup Status" "S3 backup storage accessible"
    else
        warning "Backup storage may not be accessible"
        add_result "WARN" "Backup Status" "S3 backup storage issues"
    fi
}

# Check security and compliance
check_security_compliance() {
    log "Checking security and compliance status..."
    
    # Check for active security alerts
    local security_alerts=$(kubectl logs deployment/api-gateway -n "$NAMESPACE" --since=1h | \
        grep -c "SECURITY_ALERT\|SUSPICIOUS_ACTIVITY" 2>/dev/null || echo "0")
    
    if [ "$security_alerts" -eq 0 ]; then
        success "No recent security alerts"
        add_result "PASS" "Security Status" "No recent security alerts"
    else
        warning "$security_alerts security alerts in the last hour"
        add_result "WARN" "Security Status" "$security_alerts recent alerts"
    fi
    
    # Check SSL certificate expiry
    local cert_expiry_days=0
    if [ -f "/etc/ssl/certs/clinic.crt" ]; then
        cert_expiry_days=$(openssl x509 -in /etc/ssl/certs/clinic.crt -noout -dates | \
            grep notAfter | cut -d= -f2 | xargs -I {} date -d {} +%s)
        cert_expiry_days=$(( (cert_expiry_days - $(date +%s)) / 86400 ))
        
        if [ "$cert_expiry_days" -lt 30 ]; then
            warning "SSL certificate expires in $cert_expiry_days days"
            add_result "WARN" "Security Status" "SSL cert expires in $cert_expiry_days days"
        else
            success "SSL certificate is valid for $cert_expiry_days days"
        fi
    fi
    
    # Check audit trail integrity
    if curl -f -s "http://localhost:4000/api/audit/integrity-check" >/dev/null 2>&1; then
        success "Audit trail integrity verified"
        add_result "PASS" "Compliance Status" "Audit trail integrity OK"
    else
        warning "Unable to verify audit trail integrity"
        add_result "WARN" "Compliance Status" "Audit trail verification failed"
    fi
}

# Check monitoring and alerting
check_monitoring_status() {
    log "Checking monitoring and alerting status..."
    
    # Check Prometheus connectivity
    if curl -f -s "http://prometheus:9090/-/healthy" >/dev/null 2>&1; then
        success "Prometheus is healthy"
        add_result "PASS" "Monitoring Status" "Prometheus accessible"
    else
        warning "Prometheus may not be accessible"
        add_result "WARN" "Monitoring Status" "Prometheus not accessible"
    fi
    
    # Check Grafana connectivity
    if curl -f -s "http://grafana:3000/api/health" >/dev/null 2>&1; then
        success "Grafana is healthy"
        add_result "PASS" "Monitoring Status" "Grafana accessible"
    else
        warning "Grafana may not be accessible"
        add_result "WARN" "Monitoring Status" "Grafana not accessible"
    fi
    
    # Check active alerts
    local active_alerts=$(curl -s "http://alertmanager:9093/api/v1/alerts" | \
        jq -r '.data[] | select(.status.state=="firing") | .labels.alertname' 2>/dev/null | wc -l || echo "0")
    
    if [ "$active_alerts" -eq 0 ]; then
        success "No active monitoring alerts"
        add_result "PASS" "Monitoring Status" "No active alerts"
    else
        warning "$active_alerts active monitoring alerts"
        add_result "WARN" "Monitoring Status" "$active_alerts active alerts"
    fi
}

# Generate health check report
generate_report() {
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    local total_checks=$((${#HEALTH_RESULTS[@]}))
    local passed_checks=$((total_checks - FAILED_CHECKS - WARNING_CHECKS))
    
    log "=== HEALTH CHECK REPORT ==="
    log "Timestamp: $timestamp"
    log "Total Checks: $total_checks"
    log "Passed: $passed_checks"
    log "Warnings: $WARNING_CHECKS"
    log "Failed: $FAILED_CHECKS"
    log "=========================="
    
    # Detailed results
    printf "%-6s %-25s %s\n" "STATUS" "CHECK" "MESSAGE"
    printf "%-6s %-25s %s\n" "------" "-----" "-------"
    
    for result in "${HEALTH_RESULTS[@]}"; do
        IFS='|' read -r status check message <<< "$result"
        case "$status" in
            "PASS") printf "${GREEN}%-6s${NC} %-25s %s\n" "$status" "$check" "$message" ;;
            "WARN") printf "${YELLOW}%-6s${NC} %-25s %s\n" "$status" "$check" "$message" ;;
            "FAIL") printf "${RED}%-6s${NC} %-25s %s\n" "$status" "$check" "$message" ;;
        esac
    done
    
    # Overall health status
    if [ "$FAILED_CHECKS" -eq 0 ] && [ "$WARNING_CHECKS" -eq 0 ]; then
        success "OVERALL STATUS: HEALTHY"
        return 0
    elif [ "$FAILED_CHECKS" -eq 0 ]; then
        warning "OVERALL STATUS: DEGRADED ($WARNING_CHECKS warnings)"
        return 1
    else
        error "OVERALL STATUS: UNHEALTHY ($FAILED_CHECKS failures, $WARNING_CHECKS warnings)"
        return 2
    fi
}

# Send notification based on health status
send_notification() {
    local status="$1"
    local emoji="✅"
    local color="good"
    
    case "$status" in
        1) emoji="⚠️"; color="warning" ;;
        2) emoji="❌"; color="danger" ;;
    esac
    
    if [ -n "${SLACK_WEBHOOK:-}" ]; then
        curl -X POST "$SLACK_WEBHOOK" -d "{
            \"channel\": \"#health-checks\",
            \"text\": \"$emoji Health Check Report - $(date +'%Y-%m-%d %H:%M:%S')\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"title\": \"System Health Summary\",
                \"fields\": [
                    {\"title\": \"Passed\", \"value\": \"$((${#HEALTH_RESULTS[@]} - FAILED_CHECKS - WARNING_CHECKS))\", \"short\": true},
                    {\"title\": \"Warnings\", \"value\": \"$WARNING_CHECKS\", \"short\": true},
                    {\"title\": \"Failed\", \"value\": \"$FAILED_CHECKS\", \"short\": true},
                    {\"title\": \"Total\", \"value\": \"${#HEALTH_RESULTS[@]}\", \"short\": true}
                ]
            }]
        }" >/dev/null 2>&1
    fi
}

# Main execution
main() {
    log "Starting comprehensive health check..."
    
    # Run all health checks
    check_cluster_connectivity || true
    check_node_health || true
    check_critical_services || true
    check_database_health || true
    check_redis_health || true
    check_api_endpoints || true
    check_storage_health || true
    check_backup_status || true
    check_security_compliance || true
    check_monitoring_status || true
    
    # Generate and display report
    generate_report
    local exit_code=$?
    
    # Send notification
    send_notification "$exit_code"
    
    log "Health check completed with exit code: $exit_code"
    exit $exit_code
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Healthcare Platform Health Check Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --quiet, -q         Suppress non-essential output"
        echo "  --json              Output results in JSON format"
        echo ""
        echo "Environment Variables:"
        echo "  NAMESPACE           Kubernetes namespace (default: clinic-production)"
        echo "  SLACK_WEBHOOK       Slack webhook URL for notifications"
        echo "  HEALTH_CHECK_TIMEOUT Timeout for health checks (default: 30s)"
        exit 0
        ;;
    --quiet|-q)
        exec > /dev/null
        ;;
    --json)
        # JSON output mode - modify generate_report function
        echo "JSON output not implemented yet"
        exit 1
        ;;
esac

# Run main function
main "$@"