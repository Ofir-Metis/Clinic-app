#!/bin/bash

# Healthcare Platform Performance Monitoring Setup Script
# Sets up comprehensive performance profiling and optimization infrastructure

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NAMESPACE="clinic-production"
MONITORING_NAMESPACE="monitoring"
PERFORMANCE_NAMESPACE="performance"

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed"
        exit 1
    fi
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        error "helm is not installed"
        exit 1
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create namespaces
create_namespaces() {
    log "Creating namespaces..."
    
    # Create performance namespace
    kubectl create namespace "$PERFORMANCE_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Create monitoring namespace if it doesn't exist
    kubectl create namespace "$MONITORING_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    success "Namespaces created"
}

# Install Node.js performance monitoring tools
install_nodejs_monitoring() {
    log "Installing Node.js performance monitoring tools..."
    
    # Install clinic.js for performance profiling
    cat > /tmp/performance-tools-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: nodejs-performance-tools
  namespace: performance
spec:
  selector:
    matchLabels:
      name: nodejs-performance-tools
  template:
    metadata:
      labels:
        name: nodejs-performance-tools
    spec:
      hostNetwork: true
      hostPID: true
      containers:
      - name: performance-tools
        image: node:20-alpine
        command: ["/bin/sh"]
        args: ["-c", "npm install -g clinic && tail -f /dev/null"]
        securityContext:
          privileged: true
        volumeMounts:
        - name: host-proc
          mountPath: /host/proc
          readOnly: true
        - name: host-sys
          mountPath: /host/sys
          readOnly: true
        - name: performance-data
          mountPath: /performance-data
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          limits:
            memory: "256Mi"
            cpu: "200m"
          requests:
            memory: "128Mi"
            cpu: "100m"
      volumes:
      - name: host-proc
        hostPath:
          path: /proc
      - name: host-sys
        hostPath:
          path: /sys
      - name: performance-data
        hostPath:
          path: /var/lib/performance-data
          type: DirectoryOrCreate
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
EOF

    kubectl apply -f /tmp/performance-tools-deployment.yaml
    rm /tmp/performance-tools-deployment.yaml
    
    success "Node.js performance monitoring tools installed"
}

# Setup APM (Application Performance Monitoring)
setup_apm() {
    log "Setting up APM infrastructure..."
    
    # Install Jaeger for distributed tracing
    helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
    helm repo update
    
    helm upgrade --install jaeger jaegertracing/jaeger \
        --namespace "$MONITORING_NAMESPACE" \
        --create-namespace \
        --set provisionDataStore.cassandra=false \
        --set provisionDataStore.elasticsearch=true \
        --set elasticsearch.minimumMasterNodes=1 \
        --set elasticsearch.replicas=1 \
        --set storage.type=elasticsearch \
        --wait
    
    # Install OpenTelemetry Collector
    cat > /tmp/otel-collector.yaml << 'EOF'
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: otel-collector
  namespace: monitoring
spec:
  selector:
    matchLabels:
      name: otel-collector
  template:
    metadata:
      labels:
        name: otel-collector
    spec:
      containers:
      - name: otel-collector
        image: otel/opentelemetry-collector-contrib:latest
        args:
          - --config=/etc/otel-collector-config.yaml
        volumeMounts:
        - name: otel-collector-config-vol
          mountPath: /etc/otel-collector-config.yaml
          subPath: otel-collector-config.yaml
        ports:
        - containerPort: 4317   # OTLP gRPC receiver
        - containerPort: 4318   # OTLP HTTP receiver
        - containerPort: 8888   # Prometheus metrics
        - containerPort: 8889   # Prometheus exporter metrics
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "200m"
      volumes:
      - name: otel-collector-config-vol
        configMap:
          name: otel-collector-config
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-collector-config
  namespace: monitoring
data:
  otel-collector-config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
      prometheus:
        config:
          scrape_configs:
            - job_name: 'otel-collector'
              static_configs:
                - targets: ['0.0.0.0:8888']
    
    processors:
      batch:
      
    exporters:
      jaeger:
        endpoint: jaeger-collector.monitoring.svc.cluster.local:14250
        tls:
          insecure: true
      prometheus:
        endpoint: "0.0.0.0:8889"
        
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch]
          exporters: [jaeger]
        metrics:
          receivers: [otlp, prometheus]
          processors: [batch]
          exporters: [prometheus]
---
apiVersion: v1
kind: Service
metadata:
  name: otel-collector
  namespace: monitoring
spec:
  ports:
  - name: otlp-grpc
    port: 4317
    targetPort: 4317
  - name: otlp-http
    port: 4318
    targetPort: 4318
  - name: metrics
    port: 8888
    targetPort: 8888
  - name: prometheus-exporter
    port: 8889
    targetPort: 8889
  selector:
    name: otel-collector
EOF

    kubectl apply -f /tmp/otel-collector.yaml
    rm /tmp/otel-collector.yaml
    
    success "APM infrastructure setup completed"
}

# Setup performance metrics collection
setup_metrics_collection() {
    log "Setting up performance metrics collection..."
    
    # Install Node Exporter for system metrics
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    helm upgrade --install node-exporter prometheus-community/prometheus-node-exporter \
        --namespace "$MONITORING_NAMESPACE" \
        --create-namespace \
        --wait
    
    # Create custom ServiceMonitor for application metrics
    cat > /tmp/app-service-monitor.yaml << 'EOF'
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: clinic-apps-metrics
  namespace: monitoring
spec:
  selector:
    matchLabels:
      metrics: enabled
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
  namespaceSelector:
    matchNames:
    - clinic-production
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: performance-profiler-metrics
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: performance-profiler
  endpoints:
  - port: metrics
    interval: 15s
    path: /performance/metrics
  namespaceSelector:
    matchNames:
    - performance
EOF

    kubectl apply -f /tmp/app-service-monitor.yaml
    rm /tmp/app-service-monitor.yaml
    
    success "Performance metrics collection setup completed"
}

# Setup performance profiling infrastructure
setup_profiling_infrastructure() {
    log "Setting up performance profiling infrastructure..."
    
    # Create performance profiler deployment
    cat > /tmp/performance-profiler.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: performance-profiler
  namespace: performance
spec:
  replicas: 1
  selector:
    matchLabels:
      app: performance-profiler
  template:
    metadata:
      labels:
        app: performance-profiler
    spec:
      containers:
      - name: profiler
        image: node:20-alpine
        command: ["/bin/sh"]
        args: ["-c", "npm install -g clinic autocannon pprof && node /app/profiler-server.js"]
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: NODE_ENV
          value: "production"
        - name: PROFILER_ENABLED
          value: "true"
        - name: METRICS_PORT
          value: "9090"
        volumeMounts:
        - name: profiler-config
          mountPath: /app
        - name: profiler-data
          mountPath: /profiler-data
        resources:
          limits:
            memory: "1Gi"
            cpu: "500m"
          requests:
            memory: "512Mi"
            cpu: "200m"
      volumes:
      - name: profiler-config
        configMap:
          name: profiler-config
      - name: profiler-data
        persistentVolumeClaim:
          claimName: profiler-data-pvc
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: profiler-config
  namespace: performance
data:
  profiler-server.js: |
    const express = require('express');
    const { spawn } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    
    const app = express();
    const port = process.env.PORT || 3000;
    const metricsPort = process.env.METRICS_PORT || 9090;
    
    app.use(express.json());
    
    // Store active profiling sessions
    const activeSessions = new Map();
    
    // Start profiling endpoint
    app.post('/profile/start', (req, res) => {
      const { type, duration, service, samplingRate } = req.body;
      const sessionId = `${service}-${type}-${Date.now()}`;
      
      try {
        let command, args;
        
        switch (type) {
          case 'cpu':
            command = 'clinic';
            args = ['flame', '--dest', `/profiler-data/${sessionId}`, '--duration', duration.toString()];
            break;
          case 'memory':
            command = 'clinic';
            args = ['heapdump', '--dest', `/profiler-data/${sessionId}`];
            break;
          case 'heap':
            command = 'node';
            args = ['--inspect', '--heap-prof', `/profiler-data/${sessionId}-heap.js`];
            break;
          default:
            return res.status(400).json({ error: 'Unsupported profiling type' });
        }
        
        const process = spawn(command, args);
        activeSessions.set(sessionId, { process, type, service, startTime: new Date() });
        
        res.json({
          sessionId,
          status: 'started',
          type,
          service,
          duration,
          message: `${type} profiling started for ${service}`
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get profiling results
    app.get('/profile/:sessionId/results', (req, res) => {
      const { sessionId } = req.params;
      const resultsPath = `/profiler-data/${sessionId}`;
      
      if (fs.existsSync(resultsPath)) {
        const files = fs.readdirSync(resultsPath);
        const results = {
          sessionId,
          files: files.map(file => ({
            name: file,
            size: fs.statSync(path.join(resultsPath, file)).size,
            type: path.extname(file),
          })),
          path: resultsPath,
        };
        res.json(results);
      } else {
        res.status(404).json({ error: 'Profiling results not found' });
      }
    });
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        activeSessions: activeSessions.size,
        uptime: process.uptime(),
      });
    });
    
    // Metrics endpoint
    const metricsApp = express();
    metricsApp.get('/metrics', (req, res) => {
      const metrics = `
# HELP profiler_active_sessions Number of active profiling sessions
# TYPE profiler_active_sessions gauge
profiler_active_sessions ${activeSessions.size}

# HELP profiler_uptime_seconds Process uptime in seconds
# TYPE profiler_uptime_seconds counter
profiler_uptime_seconds ${process.uptime()}

# HELP profiler_memory_usage_bytes Process memory usage in bytes
# TYPE profiler_memory_usage_bytes gauge
profiler_memory_usage_bytes ${process.memoryUsage().rss}
`;
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    });
    
    app.listen(port, () => {
      console.log(`Profiler server listening on port ${port}`);
    });
    
    metricsApp.listen(metricsPort, () => {
      console.log(`Metrics server listening on port ${metricsPort}`);
    });
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: profiler-data-pvc
  namespace: performance
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: performance-profiler
  namespace: performance
  labels:
    app: performance-profiler
spec:
  ports:
  - port: 3000
    targetPort: 3000
    name: http
  - port: 9090
    targetPort: 9090
    name: metrics
  selector:
    app: performance-profiler
EOF

    kubectl apply -f /tmp/performance-profiler.yaml
    rm /tmp/performance-profiler.yaml
    
    success "Performance profiling infrastructure setup completed"
}

# Setup load testing infrastructure
setup_load_testing() {
    log "Setting up load testing infrastructure..."
    
    # Install k6 load testing
    cat > /tmp/k6-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: k6-load-testing
  namespace: performance
spec:
  replicas: 1
  selector:
    matchLabels:
      app: k6-load-testing
  template:
    metadata:
      labels:
        app: k6-load-testing
    spec:
      containers:
      - name: k6
        image: grafana/k6:latest
        command: ["/bin/sh"]
        args: ["-c", "tail -f /dev/null"]
        volumeMounts:
        - name: test-scripts
          mountPath: /scripts
        - name: test-results
          mountPath: /results
        resources:
          limits:
            memory: "2Gi"
            cpu: "1000m"
          requests:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: test-scripts
        configMap:
          name: k6-test-scripts
      - name: test-results
        persistentVolumeClaim:
          claimName: k6-results-pvc
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: k6-test-scripts
  namespace: performance
data:
  basic-load-test.js: |
    import http from 'k6/http';
    import { check, sleep } from 'k6';
    
    export let options = {
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 0 },
      ],
      thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.1'],
        http_reqs: ['rate>100'],
      },
    };
    
    export default function () {
      let response = http.get(`${__ENV.TARGET_URL}/health`);
      check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
      });
      sleep(1);
    }
  
  stress-test.js: |
    import http from 'k6/http';
    import { check, sleep } from 'k6';
    
    export let options = {
      stages: [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '3m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
      ],
      thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.2'],
      },
    };
    
    export default function () {
      const responses = http.batch([
        ['GET', `${__ENV.TARGET_URL}/api/health`],
        ['GET', `${__ENV.TARGET_URL}/api/auth/health`],
        ['GET', `${__ENV.TARGET_URL}/api/performance/system-metrics`],
      ]);
      
      responses.forEach((response) => {
        check(response, {
          'status is 200': (r) => r.status === 200,
        });
      });
      
      sleep(0.5);
    }
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: k6-results-pvc
  namespace: performance
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
---
apiVersion: v1
kind: Service
metadata:
  name: k6-load-testing
  namespace: performance
spec:
  ports:
  - port: 6565
    targetPort: 6565
    name: web
  selector:
    app: k6-load-testing
EOF

    kubectl apply -f /tmp/k6-deployment.yaml
    rm /tmp/k6-deployment.yaml
    
    success "Load testing infrastructure setup completed"
}

# Create performance monitoring dashboards
create_dashboards() {
    log "Creating performance monitoring dashboards..."
    
    # Create Grafana dashboard ConfigMap
    cat > /tmp/performance-dashboards.yaml << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: performance-dashboards
  namespace: monitoring
  labels:
    grafana_dashboard: "1"
data:
  performance-overview.json: |
    {
      "dashboard": {
        "id": null,
        "title": "Healthcare Platform Performance Overview",
        "tags": ["performance", "healthcare"],
        "timezone": "browser",
        "panels": [
          {
            "id": 1,
            "title": "Response Time",
            "type": "graph",
            "targets": [
              {
                "expr": "avg(performance_response_time_milliseconds)",
                "legendFormat": "Avg Response Time"
              }
            ],
            "yAxes": [
              {
                "label": "milliseconds",
                "min": 0
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
          },
          {
            "id": 2,
            "title": "Error Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "avg(performance_error_rate_percentage)",
                "legendFormat": "Error Rate"
              }
            ],
            "yAxes": [
              {
                "label": "percentage",
                "min": 0,
                "max": 100
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
          },
          {
            "id": 3,
            "title": "CPU Usage",
            "type": "graph",
            "targets": [
              {
                "expr": "avg(performance_cpu_usage_percentage)",
                "legendFormat": "CPU Usage"
              }
            ],
            "yAxes": [
              {
                "label": "percentage",
                "min": 0,
                "max": 100
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
          },
          {
            "id": 4,
            "title": "Memory Usage",
            "type": "graph",
            "targets": [
              {
                "expr": "avg(performance_memory_usage_percentage)",
                "legendFormat": "Memory Usage"
              }
            ],
            "yAxes": [
              {
                "label": "percentage",
                "min": 0,
                "max": 100
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
          },
          {
            "id": 5,
            "title": "Performance Score",
            "type": "singlestat",
            "targets": [
              {
                "expr": "avg(performance_score)",
                "legendFormat": "Score"
              }
            ],
            "valueName": "current",
            "colorBackground": true,
            "thresholds": "70,85",
            "colors": ["#d44a3a", "#e24d42", "#299c46"],
            "gridPos": {"h": 4, "w": 6, "x": 0, "y": 16}
          },
          {
            "id": 6,
            "title": "Active Alerts",
            "type": "singlestat",
            "targets": [
              {
                "expr": "sum(performance_active_alerts)",
                "legendFormat": "Alerts"
              }
            ],
            "valueName": "current",
            "colorBackground": true,
            "thresholds": "1,5",
            "colors": ["#299c46", "#e24d42", "#d44a3a"],
            "gridPos": {"h": 4, "w": 6, "x": 6, "y": 16}
          },
          {
            "id": 7,
            "title": "Database Performance",
            "type": "graph",
            "targets": [
              {
                "expr": "avg(performance_db_query_time_milliseconds)",
                "legendFormat": "Avg Query Time"
              },
              {
                "expr": "avg(performance_db_connections)",
                "legendFormat": "Active Connections"
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 0, "y": 20}
          },
          {
            "id": 8,
            "title": "Cache Performance",
            "type": "graph",
            "targets": [
              {
                "expr": "avg(performance_cache_hit_ratio_percentage)",
                "legendFormat": "Cache Hit Ratio"
              }
            ],
            "yAxes": [
              {
                "label": "percentage",
                "min": 0,
                "max": 100
              }
            ],
            "gridPos": {"h": 8, "w": 12, "x": 12, "y": 20}
          }
        ],
        "time": {
          "from": "now-1h",
          "to": "now"
        },
        "refresh": "30s"
      }
    }
EOF

    kubectl apply -f /tmp/performance-dashboards.yaml
    rm /tmp/performance-dashboards.yaml
    
    success "Performance monitoring dashboards created"
}

# Setup alerting rules
setup_alerting() {
    log "Setting up performance alerting rules..."
    
    cat > /tmp/performance-alerts.yaml << 'EOF'
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: performance-alerts
  namespace: monitoring
spec:
  groups:
  - name: performance.rules
    rules:
    - alert: HighResponseTime
      expr: avg(performance_response_time_milliseconds) > 1000
      for: 2m
      labels:
        severity: warning
        service: healthcare-platform
      annotations:
        summary: "High response time detected"
        description: "Average response time is {{ $value }}ms, which is above the 1000ms threshold"
        
    - alert: CriticalResponseTime
      expr: avg(performance_response_time_milliseconds) > 2000
      for: 1m
      labels:
        severity: critical
        service: healthcare-platform
      annotations:
        summary: "Critical response time detected"
        description: "Average response time is {{ $value }}ms, which is critically high"
        
    - alert: HighErrorRate
      expr: avg(performance_error_rate_percentage) > 5
      for: 3m
      labels:
        severity: warning
        service: healthcare-platform
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value }}%, which is above the 5% threshold"
        
    - alert: CriticalErrorRate
      expr: avg(performance_error_rate_percentage) > 10
      for: 1m
      labels:
        severity: critical
        service: healthcare-platform
      annotations:
        summary: "Critical error rate detected"
        description: "Error rate is {{ $value }}%, which is critically high"
        
    - alert: HighCPUUsage
      expr: avg(performance_cpu_usage_percentage) > 80
      for: 5m
      labels:
        severity: warning
        service: healthcare-platform
      annotations:
        summary: "High CPU usage detected"
        description: "CPU usage is {{ $value }}%, which is above the 80% threshold"
        
    - alert: CriticalCPUUsage
      expr: avg(performance_cpu_usage_percentage) > 95
      for: 2m
      labels:
        severity: critical
        service: healthcare-platform
      annotations:
        summary: "Critical CPU usage detected"
        description: "CPU usage is {{ $value }}%, which is critically high"
        
    - alert: HighMemoryUsage
      expr: avg(performance_memory_usage_percentage) > 85
      for: 5m
      labels:
        severity: warning
        service: healthcare-platform
      annotations:
        summary: "High memory usage detected"
        description: "Memory usage is {{ $value }}%, which is above the 85% threshold"
        
    - alert: CriticalMemoryUsage
      expr: avg(performance_memory_usage_percentage) > 95
      for: 2m
      labels:
        severity: critical
        service: healthcare-platform
      annotations:
        summary: "Critical memory usage detected"
        description: "Memory usage is {{ $value }}%, which is critically high"
        
    - alert: LowPerformanceScore
      expr: avg(performance_score) < 70
      for: 10m
      labels:
        severity: warning
        service: healthcare-platform
      annotations:
        summary: "Low performance score detected"
        description: "Performance score is {{ $value }}, which is below the 70 threshold"
        
    - alert: DatabaseConnectionsHigh
      expr: avg(performance_db_connections) > 80
      for: 5m
      labels:
        severity: warning
        service: healthcare-platform
      annotations:
        summary: "High database connection count"
        description: "Database connections: {{ $value }}, which may impact performance"
        
    - alert: LowCacheHitRatio
      expr: avg(performance_cache_hit_ratio_percentage) < 80
      for: 10m
      labels:
        severity: warning
        service: healthcare-platform
      annotations:
        summary: "Low cache hit ratio"
        description: "Cache hit ratio is {{ $value }}%, which may impact performance"
        
    - alert: EventLoopDelayHigh
      expr: avg(performance_event_loop_delay_milliseconds) > 100
      for: 5m
      labels:
        severity: warning
        service: healthcare-platform
      annotations:
        summary: "High event loop delay"
        description: "Event loop delay is {{ $value }}ms, indicating blocking operations"
EOF

    kubectl apply -f /tmp/performance-alerts.yaml
    rm /tmp/performance-alerts.yaml
    
    success "Performance alerting rules setup completed"
}

# Create performance testing scripts
create_performance_scripts() {
    log "Creating performance testing scripts..."
    
    mkdir -p /tmp/performance-scripts
    
    # Create automated performance test script
    cat > /tmp/performance-scripts/run-performance-tests.sh << 'EOF'
#!/bin/bash

# Automated Performance Testing Script for Healthcare Platform

set -euo pipefail

# Configuration
TARGET_URL="${TARGET_URL:-http://api-gateway.clinic-production.svc.cluster.local:4000}"
TEST_DURATION="${TEST_DURATION:-300}"
MAX_VUS="${MAX_VUS:-100}"
RESULTS_DIR="/results/$(date +%Y%m%d-%H%M%S)"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "Starting performance tests for Healthcare Platform"
echo "Target: $TARGET_URL"
echo "Duration: ${TEST_DURATION}s"
echo "Max VUs: $MAX_VUS"
echo "Results: $RESULTS_DIR"

# Run basic load test
echo "Running basic load test..."
k6 run --out json="$RESULTS_DIR/basic-load-test.json" \
  --env TARGET_URL="$TARGET_URL" \
  --duration "${TEST_DURATION}s" \
  --vus "$MAX_VUS" \
  /scripts/basic-load-test.js

# Run stress test
echo "Running stress test..."
k6 run --out json="$RESULTS_DIR/stress-test.json" \
  --env TARGET_URL="$TARGET_URL" \
  /scripts/stress-test.js

# Generate performance report
echo "Generating performance report..."
cat > "$RESULTS_DIR/performance-report.md" << EOL
# Performance Test Report

**Date**: $(date)
**Target**: $TARGET_URL
**Duration**: ${TEST_DURATION}s
**Max Virtual Users**: $MAX_VUS

## Test Results

### Basic Load Test
- Test file: basic-load-test.json
- Simulated realistic user load

### Stress Test  
- Test file: stress-test.json
- Tested system limits and recovery

## Files Generated
- \`basic-load-test.json\`: Detailed metrics from load test
- \`stress-test.json\`: Detailed metrics from stress test
- \`performance-report.md\`: This summary report

## Next Steps
1. Review detailed JSON results
2. Analyze performance bottlenecks
3. Implement optimization recommendations
4. Schedule regular performance testing
EOL

echo "Performance tests completed. Results saved to: $RESULTS_DIR"
EOF

    chmod +x /tmp/performance-scripts/run-performance-tests.sh
    
    # Create performance analysis script
    cat > /tmp/performance-scripts/analyze-performance.py << 'EOF'
#!/usr/bin/env python3

import json
import sys
import os
from datetime import datetime
import statistics

def analyze_k6_results(json_file):
    """Analyze k6 test results and generate insights"""
    
    with open(json_file, 'r') as f:
        # Read all lines and parse each JSON object
        results = []
        for line in f:
            if line.strip():
                try:
                    results.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    
    # Filter for HTTP request metrics
    http_reqs = [r for r in results if r.get('type') == 'Point' and r.get('metric') == 'http_req_duration']
    
    if not http_reqs:
        print("No HTTP request data found in results")
        return
    
    # Calculate statistics
    durations = [r['data']['value'] for r in http_reqs]
    
    stats = {
        'total_requests': len(durations),
        'min_duration': min(durations),
        'max_duration': max(durations),
        'avg_duration': statistics.mean(durations),
        'median_duration': statistics.median(durations),
        'p95_duration': sorted(durations)[int(len(durations) * 0.95)],
        'p99_duration': sorted(durations)[int(len(durations) * 0.99)],
    }
    
    # Generate analysis
    print(f"\n=== Performance Analysis for {json_file} ===")
    print(f"Total Requests: {stats['total_requests']}")
    print(f"Average Duration: {stats['avg_duration']:.2f}ms")
    print(f"Median Duration: {stats['median_duration']:.2f}ms")
    print(f"95th Percentile: {stats['p95_duration']:.2f}ms")
    print(f"99th Percentile: {stats['p99_duration']:.2f}ms")
    print(f"Min Duration: {stats['min_duration']:.2f}ms")
    print(f"Max Duration: {stats['max_duration']:.2f}ms")
    
    # Performance assessment
    print("\n=== Performance Assessment ===")
    if stats['avg_duration'] < 200:
        print("✅ Excellent response times")
    elif stats['avg_duration'] < 500:
        print("✅ Good response times")
    elif stats['avg_duration'] < 1000:
        print("⚠️  Acceptable response times - monitor closely")
    else:
        print("❌ Poor response times - optimization needed")
    
    if stats['p95_duration'] < 500:
        print("✅ Good 95th percentile performance")
    elif stats['p95_duration'] < 1000:
        print("⚠️  Acceptable 95th percentile - room for improvement")
    else:
        print("❌ Poor 95th percentile - immediate attention needed")
    
    return stats

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 analyze-performance.py <results-directory>")
        sys.exit(1)
    
    results_dir = sys.argv[1]
    
    if not os.path.exists(results_dir):
        print(f"Results directory not found: {results_dir}")
        sys.exit(1)
    
    print(f"Analyzing performance results in: {results_dir}")
    
    # Analyze all JSON result files
    for filename in os.listdir(results_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(results_dir, filename)
            analyze_k6_results(filepath)
    
    print("\n=== Performance Analysis Complete ===")

if __name__ == "__main__":
    main()
EOF

    chmod +x /tmp/performance-scripts/analyze-performance.py
    
    # Create ConfigMap with performance scripts
    kubectl create configmap performance-scripts \
        --from-file=/tmp/performance-scripts/ \
        --namespace="$PERFORMANCE_NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    rm -rf /tmp/performance-scripts
    
    success "Performance testing scripts created"
}

# Verify installation
verify_installation() {
    log "Verifying performance monitoring installation..."
    
    # Check if all pods are running
    local failed=0
    
    echo "Checking performance namespace pods..."
    if ! kubectl get pods -n "$PERFORMANCE_NAMESPACE" | grep -q "Running"; then
        warning "Some pods in performance namespace are not running"
        failed=1
    fi
    
    echo "Checking monitoring namespace pods..."
    if ! kubectl get pods -n "$MONITORING_NAMESPACE" | grep -q "Running"; then
        warning "Some pods in monitoring namespace are not running"
        failed=1
    fi
    
    # Check services
    echo "Checking services..."
    kubectl get svc -n "$PERFORMANCE_NAMESPACE"
    kubectl get svc -n "$MONITORING_NAMESPACE"
    
    if [ $failed -eq 0 ]; then
        success "Performance monitoring installation verified successfully"
    else
        warning "Some components may not be fully ready yet. Please check individual pod status."
    fi
}

# Usage information
show_usage() {
    echo "Healthcare Platform Performance Monitoring Setup"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --skip-prerequisites     Skip prerequisite checks"
    echo "  --skip-apm              Skip APM setup"
    echo "  --skip-load-testing     Skip load testing setup"
    echo "  --namespace <name>      Use custom namespace (default: clinic-production)"
    echo "  --help                  Show this help message"
    echo ""
    echo "This script sets up comprehensive performance monitoring including:"
    echo "- Node.js performance profiling tools"
    echo "- APM with Jaeger and OpenTelemetry"
    echo "- Performance metrics collection"
    echo "- Load testing with k6"
    echo "- Grafana dashboards"
    echo "- Alerting rules"
    echo ""
}

# Main execution
main() {
    local skip_prerequisites=false
    local skip_apm=false
    local skip_load_testing=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-prerequisites)
                skip_prerequisites=true
                shift
                ;;
            --skip-apm)
                skip_apm=true
                shift
                ;;
            --skip-load-testing)
                skip_load_testing=true
                shift
                ;;
            --namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    log "Starting Healthcare Platform Performance Monitoring Setup"
    
    if [ "$skip_prerequisites" = false ]; then
        check_prerequisites
    fi
    
    create_namespaces
    install_nodejs_monitoring
    
    if [ "$skip_apm" = false ]; then
        setup_apm
    fi
    
    setup_metrics_collection
    setup_profiling_infrastructure
    
    if [ "$skip_load_testing" = false ]; then
        setup_load_testing
    fi
    
    create_dashboards
    setup_alerting
    create_performance_scripts
    
    log "Waiting for components to be ready..."
    sleep 30
    
    verify_installation
    
    success "Performance monitoring setup completed successfully!"
    
    echo ""
    echo "Next steps:"
    echo "1. Access Grafana dashboards to view performance metrics"
    echo "2. Configure alert notification channels"
    echo "3. Run initial performance tests using the provided scripts"
    echo "4. Set up regular performance testing schedule"
    echo ""
    echo "Performance profiler endpoint: http://performance-profiler.performance.svc.cluster.local:3000"
    echo "Load testing: kubectl exec -it deployment/k6-load-testing -n performance -- /scripts/run-performance-tests.sh"
}

# Run main function
main "$@"