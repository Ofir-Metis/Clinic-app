#!/bin/bash
# Performance monitoring script

API_GATEWAY_URL=${API_GATEWAY_URL:-http://localhost:4000}

echo "📊 Performance Monitoring Report"
echo "==============================="
echo "Time: $(date)"
echo "Gateway: $API_GATEWAY_URL"
echo ""

# Get performance metrics
echo "🔍 Fetching performance metrics..."
METRICS=$(curl -s $API_GATEWAY_URL/health/performance 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$METRICS" ]; then
    echo "Response Time:"
    echo $METRICS | jq '.monitoring.averageResponseTime' 2>/dev/null | sed 's/^/  /'
    
    echo ""
    echo "Error Rate:"
    echo $METRICS | jq '.monitoring.errorRate' 2>/dev/null | sed 's/^/  /'
    
    echo ""
    echo "Active Requests:"
    echo $METRICS | jq '.monitoring.active' 2>/dev/null | sed 's/^/  /'
    
    echo ""
    echo "Total Requests:"
    echo $METRICS | jq '.monitoring.total' 2>/dev/null | sed 's/^/  /'
    
    echo ""
    echo "Active Alerts:"
    ACTIVE_ALERTS=$(echo $METRICS | jq '.alerts.active' 2>/dev/null)
    echo "  $ACTIVE_ALERTS"
    
    if [ "$ACTIVE_ALERTS" -gt 0 ]; then
        echo ""
        echo "Recent Alerts:"
        echo $METRICS | jq '.alerts.recent[].title' 2>/dev/null | sed 's/^/  - /'
    fi
else
    echo "❌ Failed to fetch performance metrics"
    exit 1
fi

echo ""
echo "✅ Performance monitoring completed"
