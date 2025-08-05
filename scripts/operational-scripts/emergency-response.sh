#!/bin/bash

# Healthcare Platform Emergency Response Script
# Provides rapid response capabilities for critical incidents

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
NAMESPACE="clinic-production"
INCIDENT_DIR="/incidents"
LOG_FILE="/var/log/emergency-response.log"

# Emergency contacts
EMERGENCY_CONTACTS=(
    "oncall-primary:+1-555-0123"
    "security-team:+1-555-0124"
    "compliance-officer:+1-555-0125"
    "engineering-manager:+1-555-0126"
)

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[EMERGENCY]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Generate incident ID
generate_incident_id() {
    echo "EMR-$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 3 | tr '[:lower:]' '[:upper:]')"
}

# Create incident record
create_incident_record() {
    local incident_id="$1"
    local incident_type="$2"
    local severity="$3"
    local description="$4"
    
    mkdir -p "$INCIDENT_DIR"
    
    cat > "$INCIDENT_DIR/$incident_id.json" << EOF
{
  "incident_id": "$incident_id",
  "type": "$incident_type",
  "severity": "$severity",
  "description": "$description",
  "start_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "active",
  "actions_taken": [],
  "affected_services": [],
  "response_team": [],
  "patient_impact": "unknown",
  "hipaa_implications": "unknown"
}
EOF

    log "Incident record created: $INCIDENT_DIR/$incident_id.json"
}

# Send emergency notification
send_emergency_notification() {
    local incident_id="$1"
    local incident_type="$2"
    local severity="$3"
    local message="$4"
    
    # Slack notification
    if [ -n "${SLACK_WEBHOOK:-}" ]; then
        local color="danger"
        local emoji="🚨"
        
        case "$severity" in
            "SEV-1") color="danger"; emoji="🚨" ;;
            "SEV-2") color="warning"; emoji="⚠️" ;;
            "SEV-3") color="good"; emoji="ℹ️" ;;
        esac
        
        curl -X POST "$SLACK_WEBHOOK" -d "{
            \"channel\": \"#emergency-response\",
            \"text\": \"$emoji EMERGENCY RESPONSE ACTIVATED\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"title\": \"Incident $incident_id ($severity)\",
                \"fields\": [
                    {\"title\": \"Type\", \"value\": \"$incident_type\", \"short\": true},
                    {\"title\": \"Severity\", \"value\": \"$severity\", \"short\": true},
                    {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": false},
                    {\"title\": \"Description\", \"value\": \"$message\", \"short\": false}
                ],
                \"actions\": [{
                    \"type\": \"button\",
                    \"text\": \"Join War Room\",
                    \"url\": \"#incident-$incident_id\"
                }]
            }]
        }" >/dev/null 2>&1
    fi
    
    # PagerDuty integration (if configured)
    if [ -n "${PAGERDUTY_INTEGRATION_KEY:-}" ]; then
        curl -X POST "https://events.pagerduty.com/v2/enqueue" \
            -H "Content-Type: application/json" \
            -d "{
                \"routing_key\": \"$PAGERDUTY_INTEGRATION_KEY\",
                \"event_action\": \"trigger\",
                \"dedup_key\": \"$incident_id\",
                \"payload\": {
                    \"summary\": \"$incident_type - $severity\",
                    \"source\": \"healthcare-platform\",
                    \"severity\": \"critical\",
                    \"custom_details\": {
                        \"incident_id\": \"$incident_id\",
                        \"description\": \"$message\"
                    }
                }
            }" >/dev/null 2>&1
    fi
}

# Emergency actions for different incident types
emergency_system_outage() {
    local incident_id="$1"
    
    log "Executing emergency system outage response..."
    
    # 1. Enable maintenance mode
    log "Enabling maintenance mode..."
    kubectl patch configmap app-config -n "$NAMESPACE" \
        -p '{"data":{"MAINTENANCE_MODE":"true","MAINTENANCE_MESSAGE":"System maintenance - service will be restored shortly"}}'
    
    # 2. Scale critical services
    log "Scaling critical services..."
    kubectl scale deployment api-gateway --replicas=5 -n "$NAMESPACE"
    kubectl scale deployment auth-service --replicas=3 -n "$NAMESPACE"
    
    # 3. Check database connectivity
    log "Verifying database connectivity..."
    if ! kubectl exec -it deployment/postgres-primary -n "$NAMESPACE" -- \
        psql -U postgres -d clinic -c "SELECT 1;" >/dev/null 2>&1; then
        warning "Database primary is not accessible - attempting failover..."
        kubectl patch service postgres-service -n "$NAMESPACE" -p \
            '{"spec":{"selector":{"app":"postgres-replica"}}}'
    fi
    
    # 4. Restart load balancer
    log "Restarting load balancer..."
    kubectl rollout restart deployment/nginx-lb-primary -n "$NAMESPACE"
    
    # 5. Clear all caches
    log "Clearing application caches..."
    kubectl exec -it deployment/redis-cluster -n "$NAMESPACE" -- \
        redis-cli FLUSHALL
    
    success "Emergency system outage response completed"
}

emergency_security_breach() {
    local incident_id="$1"
    
    log "Executing emergency security breach response..."
    
    # 1. Isolate affected systems
    log "Isolating potentially affected systems..."
    kubectl patch deployment api-gateway -n "$NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","env":[{"name":"SECURITY_LOCKDOWN","value":"true"}]}]}}}}'
    
    # 2. Force all user re-authentication
    log "Forcing user re-authentication..."
    kubectl exec -it deployment/redis-cluster -n "$NAMESPACE" -- \
        redis-cli --scan --pattern "session:*" | xargs -r redis-cli DEL
    
    # 3. Rotate all secrets
    log "Initiating secret rotation..."
    kubectl create secret generic jwt-secrets-new \
        --from-literal=secret="$(openssl rand -base64 32)" \
        --from-literal=refresh-secret="$(openssl rand -base64 32)" \
        -n "$NAMESPACE"
    
    # 4. Enable enhanced logging
    log "Enabling enhanced security logging..."
    kubectl patch deployment api-gateway -n "$NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","env":[{"name":"LOG_LEVEL","value":"debug"},{"name":"SECURITY_AUDIT_MODE","value":"enhanced"}]}]}}}}'
    
    # 5. Block suspicious IPs
    log "Analyzing and blocking suspicious IP addresses..."
    kubectl logs deployment/api-gateway -n "$NAMESPACE" --since=1h | \
        grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' | sort | uniq -c | sort -nr | \
        awk '$1 > 100 {print $2}' | head -10 | \
        while read ip; do
            kubectl patch networkpolicy default-deny -n "$NAMESPACE" \
                --type='json' -p="[{\"op\": \"add\", \"path\": \"/spec/ingress/0/from/-\", \"value\": {\"ipBlock\": {\"except\": [\"$ip\"]}}}]"
            log "Blocked suspicious IP: $ip"
        done
    
    # 6. Preserve evidence
    log "Preserving forensic evidence..."
    kubectl get events -A --sort-by='.lastTimestamp' > "/evidence/k8s-events-$incident_id.log"
    kubectl logs --all-containers --prefix -n "$NAMESPACE" > "/evidence/pod-logs-$incident_id.log"
    
    success "Emergency security breach response completed"
}

emergency_database_failure() {
    local incident_id="$1"
    
    log "Executing emergency database failure response..."
    
    # 1. Enable read-only mode
    log "Enabling read-only mode..."
    kubectl patch deployment api-gateway -n "$NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","env":[{"name":"READ_ONLY_MODE","value":"true"}]}]}}}}'
    
    # 2. Attempt database recovery
    log "Attempting database recovery..."
    kubectl rollout restart deployment/postgres-primary -n "$NAMESPACE"
    
    # Wait for database to come up
    sleep 30
    
    # 3. Check if primary is accessible
    if kubectl exec -it deployment/postgres-primary -n "$NAMESPACE" -- \
        psql -U postgres -d clinic -c "SELECT 1;" >/dev/null 2>&1; then
        success "Database primary recovered"
    else
        warning "Database primary still not accessible - promoting replica..."
        
        # Promote replica to primary
        kubectl patch service postgres-service -n "$NAMESPACE" -p \
            '{"spec":{"selector":{"app":"postgres-replica"}}}'
        
        # Update replica to be primary
        kubectl patch deployment postgres-replica -n "$NAMESPACE" -p \
            '{"spec":{"template":{"spec":{"containers":[{"name":"postgres","env":[{"name":"POSTGRES_REPLICATION_MODE","value":"master"}]}]}}}}'
    fi
    
    # 4. Restore from latest backup if needed
    if ! kubectl exec -it deployment/postgres-primary -n "$NAMESPACE" -- \
        psql -U postgres -d clinic -c "SELECT count(*) FROM users;" >/dev/null 2>&1; then
        warning "Data integrity issue detected - restoring from backup..."
        
        # Find latest backup
        latest_backup=$(find /backups -name "clinic_full_*.dump" -mtime -1 | sort | tail -1)
        if [ -n "$latest_backup" ]; then
            log "Restoring from backup: $latest_backup"
            kubectl exec -i deployment/postgres-primary -n "$NAMESPACE" -- \
                pg_restore -U postgres -d clinic --clean --no-owner --no-privileges < "$latest_backup"
        fi
    fi
    
    success "Emergency database failure response completed"
}

emergency_hipaa_breach() {
    local incident_id="$1"
    
    log "Executing emergency HIPAA breach response..."
    
    # 1. Immediate containment
    log "Implementing immediate containment measures..."
    kubectl scale deployment --replicas=0 -l tier=backend -n "$NAMESPACE"
    
    # 2. Preserve audit trail
    log "Preserving complete audit trail..."
    curl -s "http://api-gateway:4000/api/audit/export" \
        -H "Authorization: Bearer $EMERGENCY_TOKEN" \
        -G -d "startDate=$(date -d '24 hours ago' -u +%Y-%m-%dT%H:%M:%SZ)" \
        -d "format=json" > "/evidence/audit-trail-$incident_id.json"
    
    # 3. Document potential PHI exposure
    log "Documenting potential PHI exposure..."
    curl -s "http://api-gateway:4000/api/audit/events" \
        -H "Authorization: Bearer $EMERGENCY_TOKEN" \
        -G -d "category=DATA_ACCESS" -d "category=CLINICAL" \
        -d "startDate=$(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ)" | \
        jq '.events | map(select(.patientId != null))' > "/evidence/phi-access-$incident_id.json"
    
    # 4. Notify compliance officer immediately
    log "Notifying compliance officer..."
    if [ -n "${COMPLIANCE_EMAIL:-}" ]; then
        mail -s "URGENT: Potential HIPAA Breach - Incident $incident_id" "$COMPLIANCE_EMAIL" << EOF
URGENT: Potential HIPAA breach detected

Incident ID: $incident_id
Time: $(date)
Status: Containment measures active

Immediate actions taken:
- Systems isolated to prevent further exposure
- Audit trail preserved
- Evidence collection initiated

Please initiate breach assessment protocol immediately.

This is an automated message from the Healthcare Platform Emergency Response System.
EOF
    fi
    
    # 5. Start 72-hour breach notification timer
    log "Starting breach notification countdown..."
    echo "$(date -d '+72 hours' +%s)" > "/tmp/breach-notification-deadline-$incident_id"
    
    success "Emergency HIPAA breach response completed"
}

# Performance emergency response
emergency_performance_degradation() {
    local incident_id="$1"
    
    log "Executing emergency performance degradation response..."
    
    # 1. Scale up all services
    log "Scaling up services for performance..."
    kubectl scale deployment api-gateway --replicas=8 -n "$NAMESPACE"
    kubectl scale deployment auth-service --replicas=5 -n "$NAMESPACE"
    kubectl scale deployment files-service --replicas=4 -n "$NAMESPACE"
    
    # 2. Increase resource limits
    log "Increasing resource allocations..."
    kubectl patch deployment api-gateway -n "$NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","resources":{"limits":{"memory":"2Gi","cpu":"2000m"},"requests":{"memory":"1Gi","cpu":"1000m"}}}]}}}}'
    
    # 3. Clear performance bottlenecks
    log "Clearing performance bottlenecks..."
    
    # Clear slow query cache
    kubectl exec -it deployment/postgres-primary -n "$NAMESPACE" -- \
        psql -U postgres -d clinic -c "SELECT pg_stat_statements_reset();"
    
    # Optimize database
    kubectl exec -it deployment/postgres-primary -n "$NAMESPACE" -- \
        psql -U postgres -d clinic -c "VACUUM ANALYZE;"
    
    # Clear Redis cache of old entries
    kubectl exec -it deployment/redis-cluster -n "$NAMESPACE" -- \
        redis-cli --scan --pattern "*:expired:*" | xargs -r redis-cli DEL
    
    # 4. Enable performance monitoring
    log "Enabling enhanced performance monitoring..."
    kubectl patch deployment api-gateway -n "$NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","env":[{"name":"PERFORMANCE_MONITORING","value":"enhanced"}]}]}}}}'
    
    success "Emergency performance degradation response completed"
}

# Main emergency response handler
handle_emergency() {
    local incident_type="$1"
    local severity="${2:-SEV-1}"
    local description="${3:-Emergency incident detected}"
    
    local incident_id=$(generate_incident_id)
    
    error "EMERGENCY RESPONSE ACTIVATED"
    log "Incident ID: $incident_id"
    log "Type: $incident_type"
    log "Severity: $severity"
    log "Description: $description"
    
    # Create incident record
    create_incident_record "$incident_id" "$incident_type" "$severity" "$description"
    
    # Send notifications
    send_emergency_notification "$incident_id" "$incident_type" "$severity" "$description"
    
    # Execute specific emergency response
    case "$incident_type" in
        "system_outage"|"outage")
            emergency_system_outage "$incident_id"
            ;;
        "security_breach"|"breach")
            emergency_security_breach "$incident_id"
            ;;
        "database_failure"|"db_failure")
            emergency_database_failure "$incident_id"
            ;;
        "hipaa_breach"|"phi_exposure")
            emergency_hipaa_breach "$incident_id"
            ;;
        "performance_degradation"|"performance")
            emergency_performance_degradation "$incident_id"
            ;;
        *)
            error "Unknown incident type: $incident_type"
            log "Available types: system_outage, security_breach, database_failure, hipaa_breach, performance_degradation"
            exit 1
            ;;
    esac
    
    # Final status update
    success "Emergency response procedures completed for incident $incident_id"
    log "Next steps:"
    log "1. Monitor system recovery"
    log "2. Investigate root cause"
    log "3. Update incident record"
    log "4. Conduct post-incident review"
    
    return 0
}

# Emergency mode controls
enable_emergency_mode() {
    log "Enabling emergency mode..."
    
    kubectl patch configmap app-config -n "$NAMESPACE" \
        -p '{"data":{"EMERGENCY_MODE":"true","MAINTENANCE_MODE":"true"}}'
    
    # Scale down non-critical services
    kubectl scale deployment analytics-service --replicas=0 -n "$NAMESPACE"
    kubectl scale deployment settings-service --replicas=1 -n "$NAMESPACE"
    
    # Increase critical service replicas
    kubectl scale deployment api-gateway --replicas=6 -n "$NAMESPACE"
    kubectl scale deployment auth-service --replicas=4 -n "$NAMESPACE"
    
    success "Emergency mode enabled"
}

disable_emergency_mode() {
    log "Disabling emergency mode..."
    
    kubectl patch configmap app-config -n "$NAMESPACE" \
        -p '{"data":{"EMERGENCY_MODE":"false","MAINTENANCE_MODE":"false"}}'
    
    # Restore normal service levels
    kubectl scale deployment api-gateway --replicas=3 -n "$NAMESPACE"
    kubectl scale deployment auth-service --replicas=2 -n "$NAMESPACE"
    kubectl scale deployment analytics-service --replicas=2 -n "$NAMESPACE"
    kubectl scale deployment settings-service --replicas=2 -n "$NAMESPACE"
    
    success "Emergency mode disabled"
}

# Usage information
show_usage() {
    echo "Healthcare Platform Emergency Response Script"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Emergency Response Commands:"
    echo "  emergency <type> [severity] [description]  Activate emergency response"
    echo "  enable-emergency-mode                      Enable emergency mode"
    echo "  disable-emergency-mode                     Disable emergency mode"
    echo "  status                                     Show emergency status"
    echo ""
    echo "Emergency Types:"
    echo "  system_outage         Complete system outage"
    echo "  security_breach       Security incident or breach"
    echo "  database_failure      Database connectivity or corruption"
    echo "  hipaa_breach         Potential PHI exposure"
    echo "  performance_degradation  Severe performance issues"
    echo ""
    echo "Severity Levels:"
    echo "  SEV-1    Critical - Complete outage or security breach"
    echo "  SEV-2    High - Significant degradation"
    echo "  SEV-3    Medium - Partial impact"
    echo ""
    echo "Examples:"
    echo "  $0 emergency system_outage SEV-1 \"Complete API failure\""
    echo "  $0 emergency security_breach SEV-1 \"Unauthorized access detected\""
    echo "  $0 enable-emergency-mode"
    echo ""
    echo "Environment Variables:"
    echo "  SLACK_WEBHOOK              Slack webhook for notifications"
    echo "  PAGERDUTY_INTEGRATION_KEY  PagerDuty integration key"
    echo "  COMPLIANCE_EMAIL           Compliance officer email"
    echo "  EMERGENCY_TOKEN            Emergency API access token"
}

# Main script execution
case "${1:-}" in
    "emergency")
        if [ -z "${2:-}" ]; then
            error "Emergency type required"
            show_usage
            exit 1
        fi
        handle_emergency "$2" "$3" "$4"
        ;;
    "enable-emergency-mode")
        enable_emergency_mode
        ;;
    "disable-emergency-mode")
        disable_emergency_mode
        ;;
    "status")
        log "Emergency Response System Status"
        kubectl get configmap app-config -n "$NAMESPACE" -o jsonpath='{.data.EMERGENCY_MODE}' 2>/dev/null || echo "false"
        ;;
    "--help"|"-h"|"help"|"")
        show_usage
        exit 0
        ;;
    *)
        error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac