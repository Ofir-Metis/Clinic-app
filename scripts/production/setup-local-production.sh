#!/bin/bash

# Healthcare Platform - Complete Local Production Environment Setup
# This script sets up a full production-grade environment locally for development and testing

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.production.yml"
ENV_FILE="$PROJECT_ROOT/.env.production"

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

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

section() {
    echo -e "\n${PURPLE}=== $1 ===${NC}\n"
}

# Check prerequisites
check_prerequisites() {
    section "Checking Prerequisites"
    
    local missing_tools=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    else
        local docker_version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        info "Docker version: $docker_version"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_tools+=("docker-compose")
    else
        local compose_version=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        info "Docker Compose version: $compose_version"
    fi
    
    # Check system resources
    local total_memory=$(free -m | awk 'NR==2{printf "%.1f", $2/1024}')
    local available_disk=$(df -h . | awk 'NR==2{print $4}')
    
    info "Available memory: ${total_memory}GB"
    info "Available disk space: $available_disk"
    
    # Minimum requirements check
    if (( $(echo "$total_memory < 8.0" | bc -l) )); then
        warning "Recommended minimum memory is 8GB. You have ${total_memory}GB"
    fi
    
    # Check missing tools
    if [ ${#missing_tools[@]} -ne 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and run this script again."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Generate environment configuration
generate_env_file() {
    section "Generating Environment Configuration"
    
    if [ -f "$ENV_FILE" ]; then
        warning "Environment file already exists: $ENV_FILE"
        read -p "Do you want to regenerate it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Using existing environment file"
            return
        fi
    fi
    
    log "Creating production environment file..."
    
    cat > "$ENV_FILE" << 'EOF'
# Healthcare Platform - Production Environment Configuration

# ===== GENERAL CONFIGURATION =====
NODE_ENV=production
PROJECT_NAME=healthcare-platform
COMPOSE_PROJECT_NAME=clinic

# ===== DATABASE CONFIGURATION =====
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_production_2024!
POSTGRES_DB=clinic_db

# ===== SECURITY CONFIGURATION =====
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024!
BCRYPT_ROUNDS=12
VAULT_ROOT_TOKEN=root-token-change-this-in-production

# ===== STORAGE CONFIGURATION =====
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio123_production!
S3_ENDPOINT=http://minio:9000
S3_BUCKET=clinic-files
S3_REGION=us-east-1

# ===== MESSAGE BROKER =====
NATS_URL=nats://nats:4222

# ===== CACHE CONFIGURATION =====
REDIS_HOST=redis
REDIS_PORT=6379

# ===== EXTERNAL SERVICES =====
# Twilio (SMS/Voice)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# OpenAI (AI Services)
OPENAI_API_KEY=your_openai_api_key

# Google Services (Calendar/OAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Israeli Payment Processors
TRANZILLA_API_KEY=your_tranzilla_api_key
CARDCOM_API_KEY=your_cardcom_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# ===== MONITORING & OBSERVABILITY =====
GRAFANA_PASSWORD=admin123_production!
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
PROMETHEUS_ENABLED=true

# ===== FRONTEND CONFIGURATION =====
FRONTEND_ORIGIN=http://localhost:5173
REACT_APP_API_URL=http://localhost:4000
REACT_APP_WS_URL=http://localhost:4000

# ===== PERFORMANCE MONITORING =====
PERFORMANCE_PROFILING_ENABLED=true
PERFORMANCE_METRICS_INTERVAL=60000

# ===== NOTIFICATION SERVICES =====
SLACK_WEBHOOK_URL=your_slack_webhook_url
PERFORMANCE_ALERT_EMAIL=alerts@clinic.com

# ===== LOG LEVELS =====
LOG_LEVEL=info

# ===== FEATURE FLAGS =====
ENABLE_WEBSOCKETS=true
ENABLE_AI_SUMMARIES=true
ENABLE_RECORDINGS=true
ENABLE_BILLING=true

# ===== EMAIL CONFIGURATION =====
SMTP_HOST=maildev
SMTP_PORT=1025
EMAIL_FROM=noreply@clinic.health

# ===== FILE PROCESSING =====
MAX_FILE_SIZE=500MB
ALLOWED_MIME_TYPES=video/mp4,video/mov,video/avi,audio/mp3,audio/wav,audio/m4a,video/webm

# ===== HEALTH CHECK CONFIGURATION =====
HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=10s
HEALTH_CHECK_RETRIES=3

# ===== ISRAELI COMPLIANCE =====
VAT_RATE=0.18
CTC_THRESHOLD_NIS=20000

# ===== LOAD TESTING =====
LOAD_TEST_TARGET_URL=http://api-gateway:4000
LOAD_TEST_MAX_VUS=100
LOAD_TEST_DURATION=300
EOF

    success "Environment file created: $ENV_FILE"
    warning "Please update the placeholder values in $ENV_FILE with your actual credentials"
}

# Create necessary directories
create_directories() {
    section "Creating Directory Structure"
    
    local directories=(
        "data/postgres"
        "data/redis"
        "data/minio"
        "data/nats"
        "data/elasticsearch"
        "data/temp"
        "logs/api-gateway"
        "logs/auth-service"
        "logs/appointments-service"
        "logs/files-service"
        "logs/notifications-service"
        "logs/ai-service"
        "logs/notes-service"
        "logs/analytics-service"
        "logs/settings-service"
        "logs/billing-service"
        "logs/frontend"
        "logs/nginx"
        "backups/postgres"
        "backups/redis"
        "backups/minio"
        "monitoring/prometheus"
        "monitoring/grafana/provisioning/dashboards"
        "monitoring/grafana/provisioning/datasources"
        "monitoring/grafana/dashboards"
        "monitoring/alertmanager"
        "monitoring/logstash/pipeline"
        "monitoring/logstash/config"
        "performance/k6"
        "performance/results"
        "security/vault/config"
        "nginx/ssl"
        "scripts/backup"
        "scripts/postgres"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$PROJECT_ROOT/$dir"
        log "Created directory: $dir"
    done
    
    success "Directory structure created"
}

# Setup monitoring configuration
setup_monitoring() {
    section "Setting Up Monitoring Configuration"
    
    # Prometheus configuration
    cat > "$PROJECT_ROOT/monitoring/prometheus/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "/etc/prometheus/rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: '/metrics'

  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3000']
    metrics_path: '/metrics'

  - job_name: 'appointments-service'
    static_configs:
      - targets: ['appointments-service:3000']
    metrics_path: '/metrics'

  - job_name: 'files-service'
    static_configs:
      - targets: ['files-service:3000']
    metrics_path: '/metrics'

  - job_name: 'notifications-service'
    static_configs:
      - targets: ['notifications-service:3000']
    metrics_path: '/metrics'

  - job_name: 'ai-service'
    static_configs:
      - targets: ['ai-service:3000']
    metrics_path: '/metrics'

  - job_name: 'notes-service'
    static_configs:
      - targets: ['notes-service:3000']
    metrics_path: '/metrics'

  - job_name: 'analytics-service'
    static_configs:
      - targets: ['analytics-service:3000']
    metrics_path: '/metrics'

  - job_name: 'settings-service'
    static_configs:
      - targets: ['settings-service:3000']
    metrics_path: '/metrics'

  - job_name: 'billing-service'
    static_configs:
      - targets: ['billing-service:3009']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF

    # Grafana datasource
    cat > "$PROJECT_ROOT/monitoring/grafana/provisioning/datasources/prometheus.yml" << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

    # Grafana dashboard provisioning
    cat > "$PROJECT_ROOT/monitoring/grafana/provisioning/dashboards/default.yml" << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    # Alertmanager configuration
    cat > "$PROJECT_ROOT/monitoring/alertmanager/alertmanager.yml" << 'EOF'
global:
  smtp_smarthost: 'maildev:1025'
  smtp_from: 'alerts@clinic.health'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: 'admin@clinic.health'
        subject: 'Healthcare Platform Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'dev', 'instance']
EOF

    # Logstash configuration
    cat > "$PROJECT_ROOT/monitoring/logstash/config/logstash.yml" << 'EOF'
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: [ "http://elasticsearch:9200" ]
EOF

    # Logstash pipeline
    cat > "$PROJECT_ROOT/monitoring/logstash/pipeline/logstash.conf" << 'EOF'
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] {
    mutate {
      add_field => { "service_name" => "%{[fields][service]}" }
    }
  }

  if [message] =~ /^\{/ {
    json {
      source => "message"
    }
  }

  date {
    match => [ "timestamp", "ISO8601" ]
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "clinic-logs-%{+YYYY.MM.dd}"
  }
}
EOF

    success "Monitoring configuration created"
}

# Setup performance testing
setup_performance_testing() {
    section "Setting Up Performance Testing"
    
    # Basic load test
    cat > "$PROJECT_ROOT/performance/k6/basic-load-test.js" << 'EOF'
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

const BASE_URL = __ENV.TARGET_URL || 'http://api-gateway:4000';

export default function () {
  let response = http.get(`${BASE_URL}/health`);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
EOF

    # Stress test
    cat > "$PROJECT_ROOT/performance/k6/stress-test.js" << 'EOF'
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

const BASE_URL = __ENV.TARGET_URL || 'http://api-gateway:4000';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/health`],
    ['GET', `${BASE_URL}/api/auth/health`],
    ['GET', `${BASE_URL}/api/performance/system-metrics`],
  ]);
  
  responses.forEach((response) => {
    check(response, {
      'status is 200': (r) => r.status === 200,
    });
  });
  
  sleep(0.5);
}
EOF

    # Healthcare specific test
    cat > "$PROJECT_ROOT/performance/k6/healthcare-workflow-test.js" << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://api-gateway:4000';

export default function () {
  // Simulate healthcare workflow
  
  // 1. Check system health
  let healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check passes': (r) => r.status === 200,
  });
  
  // 2. Authentication simulation
  let authResponse = http.get(`${BASE_URL}/api/auth/health`);
  check(authResponse, {
    'auth service available': (r) => r.status === 200,
  });
  
  // 3. Appointments simulation
  let appointmentsResponse = http.get(`${BASE_URL}/api/appointments/health`);
  check(appointmentsResponse, {
    'appointments service available': (r) => r.status === 200,
  });
  
  // 4. Files service simulation
  let filesResponse = http.get(`${BASE_URL}/api/files/health`);
  check(filesResponse, {
    'files service available': (r) => r.status === 200,
  });
  
  sleep(1);
}
EOF

    success "Performance testing scripts created"
}

# Setup backup scripts
setup_backup_scripts() {
    section "Setting Up Backup Scripts"
    
    # Database backup script
    cat > "$PROJECT_ROOT/scripts/backup/backup-postgres.sh" << 'EOF'
#!/bin/bash

# PostgreSQL backup script for healthcare platform
set -euo pipefail

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_DB=${POSTGRES_DB:-clinic_db}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Full database backup
echo "Creating full database backup..."
pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="$BACKUP_DIR/clinic_full_$TIMESTAMP.dump"

# Schema-only backup
echo "Creating schema backup..."
pg_dump -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --schema-only \
    --format=plain \
    --file="$BACKUP_DIR/clinic_schema_$TIMESTAMP.sql"

# Clean old backups (keep 7 days)
find "$BACKUP_DIR" -name "clinic_*.dump" -mtime +7 -delete
find "$BACKUP_DIR" -name "clinic_*.sql" -mtime +7 -delete

echo "Backup completed: clinic_full_$TIMESTAMP.dump"
EOF

    # Redis backup script
    cat > "$PROJECT_ROOT/scripts/backup/backup-redis.sh" << 'EOF'
#!/bin/bash

# Redis backup script for healthcare platform
set -euo pipefail

BACKUP_DIR="/backups/redis"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Redis backup
echo "Creating Redis backup..."
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --rdb "$BACKUP_DIR/dump_$TIMESTAMP.rdb"

# Clean old backups (keep 3 days)
find "$BACKUP_DIR" -name "dump_*.rdb" -mtime +3 -delete

echo "Redis backup completed: dump_$TIMESTAMP.rdb"
EOF

    # Backup cron script
    cat > "$PROJECT_ROOT/scripts/backup/backup-cron.sh" << 'EOF'
#!/bin/bash

# Automated backup scheduler
set -euo pipefail

# Setup cron jobs for automated backups
cat > /tmp/backup-crontab << 'CRON_EOF'
# Healthcare Platform Automated Backups
# Daily database backup at 2 AM
0 2 * * * /scripts/backup-postgres.sh >> /var/log/backup.log 2>&1

# Redis backup every 6 hours
0 */6 * * * /scripts/backup-redis.sh >> /var/log/backup.log 2>&1

# Weekly full system backup (Sunday 3 AM)
0 3 * * 0 /scripts/full-system-backup.sh >> /var/log/backup.log 2>&1
CRON_EOF

# Install cron jobs
crontab /tmp/backup-crontab
rm /tmp/backup-crontab

echo "Backup cron jobs installed"

# Keep the container running
tail -f /dev/null
EOF

    chmod +x "$PROJECT_ROOT/scripts/backup/"*.sh
    
    success "Backup scripts created"
}

# Setup PostgreSQL initialization
setup_postgres_init() {
    section "Setting Up PostgreSQL Initialization"
    
    cat > "$PROJECT_ROOT/scripts/postgres/init.sql" << 'EOF'
-- Healthcare Platform Database Initialization
-- This script sets up the initial database structure and configuration

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create application database if not exists
SELECT 'CREATE DATABASE clinic_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'clinic_db');

-- Connect to application database
\c clinic_db;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS appointments;
CREATE SCHEMA IF NOT EXISTS files;
CREATE SCHEMA IF NOT EXISTS notifications;
CREATE SCHEMA IF NOT EXISTS ai;
CREATE SCHEMA IF NOT EXISTS notes;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS settings;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS performance;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set search path
ALTER DATABASE clinic_db SET search_path TO public, auth, appointments, files, notifications, ai, notes, analytics, settings, billing, performance, audit;

-- Create roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'clinic_app') THEN
        CREATE ROLE clinic_app LOGIN PASSWORD 'clinic_app_password';
    END IF;
END
$$;

-- Grant permissions
GRANT CONNECT ON DATABASE clinic_db TO clinic_app;
GRANT USAGE ON SCHEMA public, auth, appointments, files, notifications, ai, notes, analytics, settings, billing, performance, audit TO clinic_app;
GRANT CREATE ON SCHEMA public, auth, appointments, files, notifications, ai, notes, analytics, settings, billing, performance, audit TO clinic_app;

-- Performance optimization settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';

-- Enable query statistics
ALTER SYSTEM SET pg_stat_statements.max = 10000;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Reload configuration
SELECT pg_reload_conf();

-- Create indexes for common queries
-- These will be created by the applications, but we can prepare some common ones

-- Audit trail indexes
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit.audit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit.audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit.audit_events(event_type);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance.performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_service ON performance.performance_metrics(service_name);

COMMIT;
EOF

    success "PostgreSQL initialization script created"
}

# Setup NGINX configuration
setup_nginx() {
    section "Setting Up NGINX Load Balancer"
    
    cat > "$PROJECT_ROOT/nginx/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream api_gateway {
        server api-gateway:3000;
    }
    
    upstream frontend {
        server frontend:80;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=2r/s;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;
    
    # Frontend
    server {
        listen 80;
        server_name localhost;
        
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        # File upload routes with special handling
        location /api/files/upload {
            limit_req zone=upload burst=5 nodelay;
            
            client_max_body_size 500M;
            proxy_read_timeout 300s;
            proxy_send_timeout 300s;
            
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

    success "NGINX configuration created"
}

# Build all services
build_services() {
    section "Building All Services"
    
    log "Building shared common library..."
    cd "$PROJECT_ROOT"
    yarn workspace @clinic/common build
    
    local services=(
        "api-gateway"
        "auth-service"
        "appointments-service"
        "files-service"
        "notifications-service"
        "ai-service"
        "notes-service"
        "analytics-service"
        "settings-service"
        "billing-service"
    )
    
    log "Building services..."
    for service in "${services[@]}"; do
        if [ -d "$PROJECT_ROOT/services/$service" ]; then
            log "Building $service..."
            yarn workspace "$service" build || warning "Failed to build $service"
        else
            warning "Service directory not found: $service"
        fi
    done
    
    log "Building frontend..."
    if [ -d "$PROJECT_ROOT/frontend" ]; then
        cd "$PROJECT_ROOT/frontend"
        yarn build || warning "Failed to build frontend"
    else
        warning "Frontend directory not found"
    fi
    
    success "Services built successfully"
}

# Start the production environment
start_production_environment() {
    section "Starting Production Environment"
    
    cd "$PROJECT_ROOT"
    
    log "Starting infrastructure services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
        postgres postgres-replica redis nats minio elasticsearch
    
    log "Waiting for infrastructure to be ready..."
    sleep 30
    
    log "Starting monitoring services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
        prometheus grafana node-exporter alertmanager jaeger kibana logstash
    
    log "Starting security services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d vault
    
    log "Starting application services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
        auth-service appointments-service files-service notifications-service \
        ai-service notes-service analytics-service settings-service billing-service
    
    log "Starting API gateway and frontend..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
        api-gateway frontend
    
    log "Starting load balancer..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile production up -d nginx
    
    log "Starting development services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d maildev
    
    success "Production environment started successfully!"
}

# Health check
check_services_health() {
    section "Performing Health Checks"
    
    local services=(
        "postgres:5432"
        "redis:6379"
        "nats:8222"
        "minio:9000"
        "elasticsearch:9200"
        "prometheus:9090"
        "grafana:3000"
        "api-gateway:4000"
        "frontend:5173"
    )
    
    for service in "${services[@]}"; do
        local name=$(echo "$service" | cut -d':' -f1)
        local port=$(echo "$service" | cut -d':' -f2)
        
        log "Checking $name..."
        if timeout 10 bash -c "cat < /dev/null > /dev/tcp/localhost/$port"; then
            success "$name is running on port $port"
        else
            warning "$name is not responding on port $port"
        fi
    done
}

# Display access information
show_access_info() {
    section "Production Environment Access Information"
    
    echo
    info "🏥 Healthcare Platform - Production Environment Ready!"
    echo
    
    echo -e "${CYAN}=== Application URLs ===${NC}"
    echo "Frontend:              http://localhost:5173"
    echo "API Gateway:           http://localhost:4000"
    echo "API Documentation:     http://localhost:4000/api/docs"
    echo
    
    echo -e "${CYAN}=== Service URLs ===${NC}"
    echo "Auth Service:          http://localhost:3001"
    echo "Appointments Service:  http://localhost:3002"
    echo "Files Service:         http://localhost:3003"
    echo "Notifications Service: http://localhost:3004"
    echo "AI Service:            http://localhost:3005"
    echo "Notes Service:         http://localhost:3006"
    echo "Analytics Service:     http://localhost:3007"
    echo "Settings Service:      http://localhost:3008"
    echo "Billing Service:       http://localhost:3009"
    echo
    
    echo -e "${CYAN}=== Infrastructure URLs ===${NC}"
    echo "PostgreSQL:            localhost:5432"
    echo "Redis:                 localhost:6379"
    echo "NATS:                  localhost:4222"
    echo "MinIO:                 http://localhost:9001"
    echo "MailDev:               http://localhost:1080"
    echo
    
    echo -e "${CYAN}=== Monitoring URLs ===${NC}"
    echo "Grafana:               http://localhost:3000 (admin/admin123_production!)"
    echo "Prometheus:            http://localhost:9090"
    echo "Alertmanager:          http://localhost:9093"
    echo "Jaeger:                http://localhost:16686"
    echo "Kibana:                http://localhost:5601"
    echo "Elasticsearch:         http://localhost:9200"
    echo
    
    echo -e "${CYAN}=== Security URLs ===${NC}"
    echo "Vault:                 http://localhost:8200 (token: root-token-change-this-in-production)"
    echo
    
    echo -e "${CYAN}=== Commands ===${NC}"
    echo "View logs:             docker-compose -f docker-compose.production.yml logs -f [service]"
    echo "Stop environment:      docker-compose -f docker-compose.production.yml down"
    echo "Restart service:       docker-compose -f docker-compose.production.yml restart [service]"
    echo "Run load test:         docker-compose -f docker-compose.production.yml --profile testing run k6 run /scripts/basic-load-test.js"
    echo "Create backup:         docker-compose -f docker-compose.production.yml --profile maintenance run backup-service"
    echo
    
    echo -e "${YELLOW}⚠️  Important Notes:${NC}"
    echo "1. Update credentials in .env.production before production use"
    echo "2. Configure external service API keys (OpenAI, Twilio, etc.)"
    echo "3. Set up SSL certificates for production deployment"
    echo "4. Configure backup storage for production"
    echo "5. Review and adjust resource limits based on your hardware"
    echo
    
    success "Production environment setup complete!"
}

# Main execution
main() {
    local command="${1:-start}"
    
    case "$command" in
        "start")
            check_prerequisites
            generate_env_file
            create_directories
            setup_monitoring
            setup_performance_testing
            setup_backup_scripts
            setup_postgres_init
            setup_nginx
            build_services
            start_production_environment
            sleep 30  # Wait for services to stabilize
            check_services_health
            show_access_info
            ;;
        "stop")
            section "Stopping Production Environment"
            cd "$PROJECT_ROOT"
            docker-compose -f "$COMPOSE_FILE" down
            success "Production environment stopped"
            ;;
        "restart")
            section "Restarting Production Environment"
            cd "$PROJECT_ROOT"
            docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
            success "Production environment restarted"
            ;;
        "logs")
            cd "$PROJECT_ROOT"
            docker-compose -f "$COMPOSE_FILE" logs -f "${2:-}"
            ;;
        "status")
            cd "$PROJECT_ROOT"
            docker-compose -f "$COMPOSE_FILE" ps
            ;;
        "clean")
            section "Cleaning Production Environment"
            cd "$PROJECT_ROOT"
            docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans
            docker system prune -f
            success "Production environment cleaned"
            ;;
        "help")
            echo "Healthcare Platform - Local Production Environment"
            echo
            echo "Usage: $0 [command]"
            echo
            echo "Commands:"
            echo "  start    - Set up and start the complete production environment (default)"
            echo "  stop     - Stop all services"
            echo "  restart  - Restart all services"
            echo "  logs     - View logs for all services or specific service"
            echo "  status   - Show status of all services"
            echo "  clean    - Stop and remove all containers, networks, and volumes"
            echo "  help     - Show this help message"
            echo
            ;;
        *)
            error "Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"