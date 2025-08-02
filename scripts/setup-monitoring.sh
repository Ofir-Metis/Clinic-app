#!/bin/bash

# ===================================================================
# MONITORING AND HEALTH CHECK SETUP SCRIPT
# Sets up comprehensive monitoring, alerting, and health checks
# ===================================================================

set -e

# Load environment variables
if [ -f .env ]; then
    source .env
fi

echo "🔍 Setting up Monitoring and Health Checks..."

# Create logs directory
mkdir -p logs
mkdir -p monitoring/dashboards
mkdir -p monitoring/alerts
mkdir -p monitoring/metrics

# Set up log rotation configuration
echo "📝 Setting up log rotation..."
cat > logs/logrotate.conf << 'EOF'
logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    postrotate
        # Restart the service to reopen log files
        # pkill -SIGUSR1 node || true
    endscript
}
EOF

# Create monitoring configuration
echo "⚙️ Creating monitoring configuration..."
cat > monitoring/monitoring.config.js << 'EOF'
module.exports = {
  // Monitoring settings
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsRetentionHours: parseInt(process.env.METRICS_RETENTION_HOURS || '24'),
    alertingEnabled: process.env.ALERTING_ENABLED !== 'false',
  },
  
  // Performance thresholds
  thresholds: {
    responseTime: parseInt(process.env.THRESHOLD_RESPONSE_TIME || '2000'), // 2s
    errorRate: parseFloat(process.env.THRESHOLD_ERROR_RATE || '5'), // 5%
    memoryUsage: parseFloat(process.env.THRESHOLD_MEMORY_USAGE || '85'), // 85%
    diskUsage: parseFloat(process.env.THRESHOLD_DISK_USAGE || '90'), // 90%
    cpuUsage: parseFloat(process.env.THRESHOLD_CPU_USAGE || '80'), // 80%
  },
  
  // Alerting configuration
  alerting: {
    channels: (process.env.ALERT_CHANNELS || 'console').split(','),
    webhookUrl: process.env.ALERT_WEBHOOK_URL,
    emailRecipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(','),
    slackWebhook: process.env.ALERT_SLACK_WEBHOOK,
  },
  
  // Health check settings
  healthChecks: {
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'), // 30s
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '10000'), // 10s
    retries: parseInt(process.env.HEALTH_CHECK_RETRIES || '3'),
  },
};
EOF

# Create Prometheus metrics configuration (if using Prometheus)
echo "📊 Creating Prometheus configuration..."
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts/*.yml"

scrape_configs:
  - job_name: 'clinic-app-api-gateway'
    static_configs:
      - targets: ['localhost:4000']
    metrics_path: '/health/metrics'
    scrape_interval: 10s
    
  - job_name: 'clinic-app-services'
    static_configs:
      - targets: 
        - 'localhost:3001'  # auth-service
        - 'localhost:3002'  # appointments-service
        - 'localhost:3003'  # files-service
        - 'localhost:3004'  # notifications-service
        - 'localhost:3005'  # ai-service
        - 'localhost:3006'  # notes-service
        - 'localhost:3007'  # analytics-service
        - 'localhost:3008'  # settings-service
    metrics_path: '/health'
    scrape_interval: 30s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
EOF

# Create Grafana dashboard configuration
echo "📈 Creating Grafana dashboard configuration..."
cat > monitoring/dashboards/clinic-app-dashboard.json << 'EOF'
{
  "dashboard": {
    "title": "Clinic App Monitoring",
    "tags": ["clinic-app", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "avg(http_request_duration_ms)",
            "legendFormat": "Average Response Time"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_errors_total[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes",
            "legendFormat": "Memory Usage"
          }
        ]
      },
      {
        "title": "Active Requests",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(http_requests_active)",
            "legendFormat": "Active Requests"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF

# Create alert rules
echo "🚨 Creating alert rules..."
cat > monitoring/alerts/clinic-app-alerts.yml << 'EOF'
groups:
  - name: clinic-app-alerts
    rules:
      - alert: HighResponseTime
        expr: avg(http_request_duration_ms) > 2000
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "Average response time is {{ $value }}ms"
          
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) > 0.05
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
          
      - alert: ServiceDown
        expr: up == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.instance }} has been down for more than 30 seconds"
          
      - alert: HighMemoryUsage
        expr: (process_resident_memory_bytes / 1024 / 1024) > 500
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}MB"
          
      - alert: DatabaseConnectionFailed
        expr: database_connection_status == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed"
          description: "Cannot connect to database"
EOF

# Create health check monitoring script
echo "❤️ Creating health check monitoring script..."
cat > scripts/monitor-health.sh << 'SCRIPT_EOF'
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
SCRIPT_EOF

chmod +x scripts/monitor-health.sh

# Create performance monitoring script
echo "⚡ Creating performance monitoring script..."
cat > scripts/monitor-performance.sh << 'SCRIPT_EOF'
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
SCRIPT_EOF

chmod +x scripts/monitor-performance.sh

# Create alerting test script
echo "🔔 Creating alerting test script..."
cat > scripts/test-alerts.sh << 'SCRIPT_EOF'
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
SCRIPT_EOF

chmod +x scripts/test-alerts.sh

# Create comprehensive monitoring dashboard launcher
echo "🚀 Creating monitoring dashboard launcher..."
cat > scripts/start-monitoring.sh << 'SCRIPT_EOF'
#!/bin/bash
# Start monitoring services

echo "🚀 Starting Monitoring Services"
echo "==============================="

# Check if Docker is available
if command -v docker >/dev/null 2>&1; then
    echo "📦 Starting monitoring stack with Docker..."
    
    # Create monitoring docker-compose
    cat > monitoring/docker-compose.monitoring.yml << 'DOCKER_EOF'
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts:/etc/prometheus/alerts
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
      
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./dashboards:/etc/grafana/provisioning/dashboards
      
  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  grafana-storage:
DOCKER_EOF

    # Start monitoring services
    cd monitoring
    docker-compose -f docker-compose.monitoring.yml up -d
    cd ..
    
    echo "✅ Monitoring services started:"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3000 (admin/admin)"
    echo "  - Alertmanager: http://localhost:9093"
else
    echo "⚠️ Docker not available. Manual monitoring setup required."
fi

echo ""
echo "🔍 Starting health check monitoring..."
./scripts/monitor-health.sh

echo ""
echo "📊 Performance monitoring available via:"
echo "  ./scripts/monitor-performance.sh"
echo ""
echo "🔔 Test alerts with:"
echo "  ./scripts/test-alerts.sh"
SCRIPT_EOF

chmod +x scripts/start-monitoring.sh

# Update environment variables
echo "⚙️ Updating environment variables..."
cat >> .env << 'ENV_EOF'

# Monitoring Configuration
MONITORING_ENABLED=true
METRICS_RETENTION_HOURS=24
ALERTING_ENABLED=true

# Performance Thresholds
THRESHOLD_RESPONSE_TIME=2000
THRESHOLD_ERROR_RATE=5
THRESHOLD_MEMORY_USAGE=85
THRESHOLD_DISK_USAGE=90
THRESHOLD_CPU_USAGE=80

# Health Check Settings
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=10000
HEALTH_CHECK_RETRIES=3

# Alert Channels (comma-separated: console,webhook,email,slack)
ALERT_CHANNELS=console
# ALERT_WEBHOOK_URL=https://your-webhook-url.com/alerts
# ALERT_EMAIL_RECIPIENTS=admin@clinic-app.com,ops@clinic-app.com
# ALERT_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

ENV_EOF

echo ""
echo "🎉 Monitoring and Health Check setup completed!"
echo ""
echo "📋 What was set up:"
echo "✅ Log rotation configuration"
echo "✅ Prometheus metrics configuration"
echo "✅ Grafana dashboard templates"
echo "✅ Alert rules and notifications"
echo "✅ Health check monitoring scripts"
echo "✅ Performance monitoring tools"
echo "✅ Environment configuration"
echo ""
echo "🚀 Next steps:"
echo "1. Start monitoring services: ./scripts/start-monitoring.sh"
echo "2. Check service health: ./scripts/monitor-health.sh"
echo "3. Monitor performance: ./scripts/monitor-performance.sh"
echo "4. Test alerting: ./scripts/test-alerts.sh"
echo ""
echo "📊 Monitoring endpoints:"
echo "- Health: http://localhost:4000/health"
echo "- Detailed health: http://localhost:4000/health/detailed"
echo "- Metrics: http://localhost:4000/health/metrics"
echo "- Performance: http://localhost:4000/health/performance"
echo "- Service status: http://localhost:4000/health/status"
echo ""
echo "🔧 Configuration files created in:"
echo "- monitoring/ - Monitoring configurations"
echo "- logs/ - Log files and rotation config"
echo "- scripts/ - Monitoring and health check scripts"