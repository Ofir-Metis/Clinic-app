# 🏥 Healthcare Clinic - Advanced Monitoring System

Comprehensive monitoring and observability solution for the healthcare clinic management platform, featuring custom healthcare metrics, real-time dashboards, and HIPAA-compliant monitoring.

## 🎯 Overview

This advanced monitoring system provides:

- **Healthcare-Specific Metrics**: Custom metrics for clinical operations, patient management, and business KPIs
- **Real-Time Dashboards**: Role-based dashboards for operational, business, compliance, and executive views
- **Alerting & Notifications**: Intelligent alerting based on healthcare-specific thresholds
- **HIPAA Compliance Monitoring**: Track compliance status and audit events
- **Performance Monitoring**: Application performance, API response times, and system resources
- **Business Intelligence**: Revenue tracking, client retention, session analytics

## 🏗️ Architecture

### Monitoring Stack
- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **AlertManager**: Alert routing and notifications
- **Loki**: Log aggregation and analysis
- **Promtail**: Log collection agent

### Custom Components
- **CustomMetricsService**: Healthcare-specific metrics collection
- **DashboardService**: Dynamic dashboard management
- **HealthCheckController**: System health endpoints

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
# Start all monitoring services
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Check service status
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. Access Dashboards

- **Grafana**: http://localhost:3010 (admin/admin)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093

### 3. API Endpoints

```bash
# Health check
curl http://localhost:4000/health

# Detailed health check
curl http://localhost:4000/health/detailed

# Healthcare metrics
curl http://localhost:4000/monitoring/dashboards/metrics/healthcare

# Available dashboards
curl http://localhost:4000/monitoring/dashboards
```

## 📊 Dashboard Types

### 1. Operational Dashboard (`operational`)
**Access**: Admin, Operations team  
**Refresh**: 30 seconds  
**Purpose**: Real-time system health and performance monitoring

**Widgets**:
- System Health Overview
- Active Users by Role
- API Performance Metrics
- System Resource Usage
- HIPAA Compliance Status

### 2. Business Dashboard (`business`)
**Access**: Admin, Managers, Therapists  
**Refresh**: 5 minutes  
**Purpose**: Business metrics and operational KPIs

**Widgets**:
- Key Business Metrics (KPIs)
- Revenue Trends
- User Distribution
- Daily Session Statistics
- Business Metrics Summary

### 3. Compliance Dashboard (`compliance`)
**Access**: Admin, Compliance team  
**Refresh**: 10 minutes  
**Purpose**: HIPAA compliance monitoring and audit tracking

**Widgets**:
- Compliance Status Overview
- HIPAA Audit Events Timeline
- Security Scan Results
- Data Encryption Status
- Backup Status Monitoring

### 4. Executive Dashboard (`executive`)
**Access**: Admin, Executives  
**Refresh**: 15 minutes  
**Purpose**: High-level business overview and KPIs

**Widgets**:
- Key Performance Indicators
- Growth Trends
- System Overview
- Monthly Business Summary

## 🔍 Healthcare Metrics

### User Activity Metrics
```typescript
activeUsers: {
  clients: number;
  therapists: number; 
  admins: number;
  total: number;
}
```

### Session Metrics
```typescript
sessions: {
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  averageDuration: number; // minutes
}
```

### Business Metrics
```typescript
business: {
  newClientRegistrations: number;
  clientRetentionRate: number; // percentage
  averageSessionsPerClient: number;
  revenueMetrics: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}
```

### Compliance Metrics
```typescript
compliance: {
  hipaaAuditEvents: number;
  dataEncryptionStatus: boolean;
  backupStatus: boolean;
  securityScanResults: number;
}
```

### Performance Metrics
```typescript
performance: {
  pageLoadTimes: {
    client: number;
    therapist: number;
    admin: number;
  };
  apiEndpointMetrics: Record<string, {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
}
```

## 🚨 Alerting Configuration

### Default Alert Thresholds

#### Operational Alerts
- **API Response Time**: > 2000ms (Warning), > 5000ms (Critical)
- **Memory Usage**: > 80% (Warning), > 95% (Critical)
- **CPU Usage**: > 85% (Warning), > 95% (Critical)
- **Error Rate**: > 5% (Warning), > 10% (Critical)

#### Business Alerts
- **Client Retention Rate**: < 75% (Warning), < 60% (Critical)
- **Daily Revenue**: < $2000 (Warning)
- **Session Completion Rate**: < 80% (Warning), < 70% (Critical)

#### Compliance Alerts
- **HIPAA Audit Events**: > 100/day (Info), > 500/day (Warning)
- **Security Scan Results**: > 5 high-risk findings (Critical)
- **Backup Failures**: Any failure (Critical)

### Alert Routing
```yaml
# alertmanager.yml
route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'healthcare-alerts'

receivers:
- name: 'healthcare-alerts'
  email_configs:
  - to: 'admin@clinic.com'
    subject: 'Healthcare Clinic Alert: {{ .GroupLabels.alertname }}'
```

## 🔧 Configuration

### Environment Variables
```bash
# Monitoring configuration
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
ALERTMANAGER_URL=http://alertmanager:9093

# Metrics collection intervals
METRICS_COLLECTION_INTERVAL=300 # 5 minutes
BUSINESS_METRICS_INTERVAL=3600  # 1 hour
HEALTH_CHECK_INTERVAL=30        # 30 seconds

# Alert thresholds
ALERT_API_RESPONSE_TIME=2000
ALERT_MEMORY_USAGE=80
ALERT_CPU_USAGE=85
ALERT_RETENTION_RATE=75
```

### Custom Dashboard Creation

```typescript
// Create custom dashboard via API
const customDashboard: DashboardConfig = {
  dashboardId: 'my-custom-dashboard',
  name: 'Custom Healthcare Dashboard',
  description: 'Tailored monitoring for specific needs',
  refreshInterval: 60,
  accessRoles: ['admin', 'manager'],
  widgets: [
    {
      id: 'custom-metric',
      type: 'metric',
      title: 'Custom Metric',
      dataSource: 'business.newClientRegistrations',
      configuration: { displayType: 'gauge' },
      position: { x: 0, y: 0, width: 6, height: 4 }
    }
  ]
};

// POST /monitoring/dashboards
```

## 📈 Prometheus Metrics

### Available Metrics
```prometheus
# User metrics
clinic_active_users_total{role="client|therapist|admin"}

# Session metrics  
clinic_sessions_total{status="scheduled|completed|cancelled|no_show"}

# System health
clinic_system_health{metric_type="api_response_time|memory_usage|cpu_usage"}

# Business metrics
clinic_business_metrics{metric_type="revenue|retention_rate|registrations"}

# Compliance metrics
clinic_compliance_status{compliance_type="hipaa|encryption|backup"}

# Performance metrics
clinic_performance_metrics{operation_type="page_load|api_call"}
```

### Sample Queries
```prometheus
# Average API response time over 5 minutes
rate(clinic_performance_metrics_sum[5m]) / rate(clinic_performance_metrics_count[5m])

# Active users by role
sum by (role) (clinic_active_users_total)

# Session completion rate
(clinic_sessions_total{status="completed"} / clinic_sessions_total{status="scheduled"}) * 100

# Daily revenue trend
increase(clinic_business_metrics{metric_type="revenue", period="daily"}[1d])
```

## 🔐 Security & HIPAA Compliance

### Data Protection
- **Metrics Anonymization**: No PII in metrics
- **Access Control**: Role-based dashboard access
- **Audit Logging**: All dashboard access logged
- **Encryption**: Metrics data encrypted in transit and at rest

### Compliance Features
- **HIPAA Audit Tracking**: Monitor all patient data access
- **Data Retention Policies**: Configurable metric retention
- **Security Monitoring**: Track security events and vulnerabilities
- **Backup Monitoring**: Ensure data backup compliance

## 🛠️ Maintenance

### Regular Tasks
```bash
# Update metric retention (monthly)
docker exec prometheus promtool tsdb clean

# Backup Grafana dashboards
docker exec grafana grafana-cli admin export

# Review alert rules
docker exec prometheus promtool check rules /etc/prometheus/alerts/*.yml

# Clean old logs
docker exec loki rm -rf /loki/chunks/fake/*
```

### Troubleshooting

#### Common Issues
1. **Metrics not appearing**: Check service discovery in Prometheus targets
2. **Dashboard not loading**: Verify Grafana datasource configuration
3. **Alerts not firing**: Check AlertManager configuration and routing rules
4. **High memory usage**: Adjust Prometheus retention settings

#### Debug Commands
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify metrics endpoint
curl http://localhost:4000/metrics

# Check Grafana health
curl http://localhost:3010/api/health

# AlertManager status
curl http://localhost:9093/api/v1/status
```

## 📚 API Reference

### Dashboard Management

#### Get Available Dashboards
```bash
GET /monitoring/dashboards?role=admin
```

#### Get Dashboard Data
```bash
GET /monitoring/dashboards/{dashboardId}/data?refresh=true
```

#### Get Healthcare Metrics
```bash
GET /monitoring/dashboards/metrics/healthcare
```

#### Get System Health
```bash
GET /monitoring/health
```

#### Create Custom Dashboard
```bash
POST /monitoring/dashboards
Content-Type: application/json

{
  "dashboardId": "custom",
  "name": "Custom Dashboard",
  "widgets": [...],
  "accessRoles": ["admin"]
}
```

### Health Endpoints

```bash
# Basic health check
GET /health

# Detailed health with metrics
GET /health/detailed

# Kubernetes probes
GET /health/ready
GET /health/live
```

## 🎯 Best Practices

### Metric Collection
- **Efficient Queries**: Use rate() for counters, avg_over_time() for gauges
- **Proper Labels**: Use consistent labeling strategy
- **Cardinality Control**: Avoid high-cardinality metrics
- **Sampling**: Sample high-frequency metrics appropriately

### Dashboard Design
- **User-Centric**: Design dashboards for specific user roles
- **Performance**: Limit queries per dashboard
- **Clarity**: Use clear titles and units
- **Alerts**: Include relevant alert thresholds

### Security
- **Access Control**: Implement proper RBAC
- **Data Anonymization**: Never expose PII in metrics
- **Audit Trail**: Log all monitoring system access
- **Regular Reviews**: Review metrics and dashboards regularly

---

**🏥 Healthcare Clinic - Advanced Monitoring System**  
*Production-ready monitoring with healthcare-specific insights*