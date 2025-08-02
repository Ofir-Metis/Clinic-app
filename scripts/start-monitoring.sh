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
