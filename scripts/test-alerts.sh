#!/bin/bash
# Test alerting system

API_GATEWAY_URL=${API_GATEWAY_URL:-http://localhost:4000}

echo "🔔 Testing Alert System"
echo "======================"

# Test webhook alert (if configured)
if [ -n "$ALERT_WEBHOOK_URL" ]; then
    echo "Testing webhook alert..."
    curl -X POST $ALERT_WEBHOOK_URL \
        -H "Content-Type: application/json" \
        -d '{
            "alert": "test",
            "level": "info",
            "title": "Test Alert",
            "description": "This is a test alert from the monitoring system",
            "timestamp": "'$(date -Iseconds)'"
        }' \
        -w "\nResponse: %{http_code}\n" 2>/dev/null
fi

# Test email alert (if configured)
if [ -n "$ALERT_EMAIL_RECIPIENTS" ]; then
    echo "Email alerting configured for: $ALERT_EMAIL_RECIPIENTS"
    echo "(Test email sending requires SMTP configuration)"
fi

# Test Slack alert (if configured)
if [ -n "$ALERT_SLACK_WEBHOOK" ]; then
    echo "Testing Slack alert..."
    curl -X POST $ALERT_SLACK_WEBHOOK \
        -H "Content-Type: application/json" \
        -d '{
            "text": "🧪 Test Alert from Clinic App Monitoring",
            "attachments": [{
                "color": "good",
                "title": "Monitoring System Test",
                "text": "This is a test alert to verify Slack integration is working properly.",
                "ts": "'$(date +%s)'"
            }]
        }' \
        -w "\nResponse: %{http_code}\n" 2>/dev/null
fi

echo ""
echo "✅ Alert testing completed"
