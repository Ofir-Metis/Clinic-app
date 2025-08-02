#!/bin/bash
# Health check monitoring script

SERVICES=(
    "api-gateway:4000"
    "auth-service:3001"
    "appointments-service:3002"
    "files-service:3003"
    "notifications-service:3004"
    "ai-service:3005"
    "notes-service:3006"
    "analytics-service:3007"
    "settings-service:3008"
)

echo "🔍 Monitoring Service Health Status"
echo "=================================="
echo "Time: $(date)"
echo ""

UNHEALTHY_COUNT=0

for service in "${SERVICES[@]}"; do
    SERVICE_NAME=$(echo $service | cut -d: -f1)
    SERVICE_PORT=$(echo $service | cut -d: -f2)
    
    echo -n "Checking $SERVICE_NAME... "
    
    # Check if service is responding
    if curl -s -f http://localhost:$SERVICE_PORT/health > /dev/null 2>&1; then
        # Get detailed health status
        STATUS=$(curl -s http://localhost:$SERVICE_PORT/health | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
        
        case $STATUS in
            "ok"|"healthy")
                echo "✅ Healthy"
                ;;
            "degraded")
                echo "⚠️ Degraded"
                ;;
            *)
                echo "❌ Unhealthy ($STATUS)"
                UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
                ;;
        esac
    else
        echo "❌ Not Responding"
        UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
    fi
done

echo ""
echo "Summary: $((${#SERVICES[@]} - UNHEALTHY_COUNT))/${#SERVICES[@]} services healthy"

if [ $UNHEALTHY_COUNT -gt 0 ]; then
    echo "⚠️ $UNHEALTHY_COUNT services need attention"
    exit 1
else
    echo "✅ All services are healthy"
    exit 0
fi
