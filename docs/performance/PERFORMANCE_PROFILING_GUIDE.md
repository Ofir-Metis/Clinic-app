# Healthcare Platform Performance Profiling Guide

## Overview

This guide provides comprehensive instructions for using the advanced performance profiling and optimization system implemented for the healthcare platform. The system provides real-time monitoring, automated optimization recommendations, and detailed performance analytics.

## 🏗️ Architecture

### Components

1. **Performance Profiler Service**: Core profiling engine with automated metrics collection
2. **Performance Optimization Service**: Automated optimization recommendations and resource scaling
3. **Performance Analytics Service**: Advanced analytics, trends analysis, and comparative reporting
4. **Performance Controller**: REST API for accessing all performance features
5. **Database Entities**: Structured storage for metrics and alerts

### Key Features

- **Real-time Metrics Collection**: System, database, and application metrics
- **Automated Performance Profiling**: CPU, memory, heap, and event loop monitoring
- **Smart Optimization Recommendations**: AI-driven suggestions for performance improvements
- **Comprehensive Analytics**: Trend analysis, anomaly detection, and forecasting
- **Service Health Scoring**: Holistic health assessment with component breakdowns
- **Automated Alerting**: Configurable thresholds with escalation procedures
- **Load Testing Integration**: Built-in performance testing capabilities

## 🚀 Getting Started

### Prerequisites

```bash
# Install required dependencies
npm install @nestjs/schedule @kubernetes/client-node pidusage

# Enable performance monitoring in environment
export PERFORMANCE_PROFILING_ENABLED=true
export PERFORMANCE_METRICS_INTERVAL=60000  # 1 minute
```

### Basic Usage

```typescript
import { PerformanceProfilerService } from './performance/performance-profiler.service';

// Generate performance profile
const profile = await performanceProfilerService.generatePerformanceProfile('api-gateway');

// Get system metrics
const systemMetrics = await performanceProfilerService.collectSystemMetrics();

// Get database metrics
const dbMetrics = await performanceProfilerService.collectDatabaseMetrics();
```

## 📊 API Endpoints

### Performance Profiling

#### Generate Performance Profile
```bash
GET /performance/profile/:serviceName
```

**Response:**
```json
{
  "id": "profile-1234567890-abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "serviceName": "api-gateway",
  "system": {
    "cpu": { "usage": 45.2, "cores": 4 },
    "memory": { "percentage": 62.8, "used": 1073741824 },
    "eventLoop": { "delay": 12.5, "utilization": 0.85 }
  },
  "database": {
    "connectionCount": 25,
    "averageQueryTime": 145.3,
    "cacheHitRatio": 94.2
  },
  "application": {
    "requestsPerSecond": 125,
    "averageResponseTime": 245,
    "errorRate": 0.8
  },
  "recommendations": [
    "Consider optimizing database queries with slow execution times",
    "CPU usage is within acceptable limits"
  ],
  "alerts": [],
  "score": 87
}
```

#### Get System Metrics
```bash
GET /performance/system-metrics
```

#### Get Database Metrics
```bash
GET /performance/database-metrics
```

#### Get Application Metrics
```bash
GET /performance/application-metrics
```

### Performance Analytics

#### Get Performance Trends
```bash
GET /performance/analytics/trends/:serviceName?days=30
```

**Response:**
```json
{
  "serviceName": "api-gateway",
  "period": "30 days",
  "trendAnalysis": {
    "responseTime": {
      "direction": "improving",
      "slope": -0.125,
      "significance": "medium",
      "description": "Response time is moderately improving"
    },
    "cpuUsage": {
      "direction": "stable",
      "slope": 0.002,
      "significance": "low"
    }
  },
  "seasonality": {
    "detected": true,
    "patterns": ["Daily pattern detected"],
    "peakHours": [9, 10, 11, 14, 15, 16],
    "lowHours": [1, 2, 3, 4, 5, 6]
  },
  "anomalies": [
    {
      "timestamp": "2024-01-14T15:30:00Z",
      "metric": "response_time",
      "value": 1250.5,
      "expectedValue": 245.2,
      "severity": "high",
      "description": "Response time anomaly: 1250.5ms (expected ~245.2ms)"
    }
  ]
}
```

#### Compare Services
```bash
GET /performance/analytics/comparison?services[]=api-gateway&services[]=auth-service&days=7
```

#### Get Service Health Score
```bash
GET /performance/health-score/:serviceName
```

**Response:**
```json
{
  "serviceName": "api-gateway",
  "overallScore": 87,
  "componentScores": {
    "availability": 98,
    "performance": 85,
    "reliability": 89,
    "scalability": 82,
    "efficiency": 91
  },
  "factors": [
    {
      "factor": "Response Time",
      "weight": 0.25,
      "score": 85,
      "impact": "Positive impact"
    }
  ],
  "recommendations": [
    "Consider horizontal scaling for improved scalability",
    "Service is performing well - maintain current practices"
  ],
  "trend": "improving",
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

### Optimization

#### Get Optimization Recommendations
```bash
GET /performance/optimization/recommendations/:serviceName
```

**Response:**
```json
[
  {
    "id": "cpu-scale-api-gateway-1705312200000",
    "serviceName": "api-gateway",
    "type": "cpu",
    "priority": "high",
    "title": "Scale CPU Resources",
    "description": "Average CPU usage is 78.5%, indicating potential CPU bottleneck",
    "currentIssue": "High CPU utilization (avg: 78.5%, max: 92.1%)",
    "proposedSolution": "Increase CPU allocation or scale horizontally",
    "impact": {
      "performanceImprovement": 25,
      "riskLevel": "low",
      "effortHours": 2,
      "rollbackComplexity": "easy"
    },
    "parameters": {
      "cpuLimit": 1200,
      "replicaCount": 2
    },
    "implementationSteps": [
      "Update deployment resource requests and limits",
      "Apply configuration changes",
      "Monitor CPU usage after changes",
      "Validate performance improvement"
    ],
    "status": "pending"
  }
]
```

#### Apply Optimizations
```bash
POST /performance/optimization/apply
Content-Type: application/json

[
  {
    "id": "cpu-scale-api-gateway-1705312200000",
    "serviceName": "api-gateway",
    // ... recommendation object
  }
]
```

### Alerts Management

#### Get Performance Alerts
```bash
GET /performance/alerts?serviceName=api-gateway&severity=high&resolved=false
```

#### Create Performance Alert
```bash
POST /performance/alerts
Content-Type: application/json

{
  "serviceName": "api-gateway",
  "alertType": "cpu",
  "severity": "high",
  "message": "High CPU usage detected",
  "threshold": 80,
  "actualValue": 92.3,
  "metricName": "cpu_usage"
}
```

#### Acknowledge Alert
```bash
POST /performance/alerts/:id/acknowledge
Content-Type: application/json

{
  "acknowledgedBy": "admin@clinic.com",
  "notes": "Investigating CPU spike - checking recent deployments"
}
```

#### Resolve Alert
```bash
POST /performance/alerts/:id/resolve
Content-Type: application/json

{
  "resolvedBy": "admin@clinic.com",
  "resolutionNotes": "Optimized database queries and increased CPU allocation",
  "rootCause": "Inefficient database query causing CPU spike"
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Performance Profiling Configuration
PERFORMANCE_PROFILING_ENABLED=true
PERFORMANCE_METRICS_INTERVAL=60000           # Metrics collection interval (ms)
PERFORMANCE_ALERT_THRESHOLDS_CPU=80          # CPU usage alert threshold (%)
PERFORMANCE_ALERT_THRESHOLDS_MEMORY=85       # Memory usage alert threshold (%)
PERFORMANCE_ALERT_THRESHOLDS_RESPONSE_TIME=1000  # Response time threshold (ms)
PERFORMANCE_ALERT_THRESHOLDS_ERROR_RATE=5    # Error rate threshold (%)

# Kubernetes Integration
KUBERNETES_NAMESPACE=clinic-production
KUBERNETES_CONFIG_PATH=/path/to/kubeconfig

# Database Performance
DB_SLOW_QUERY_THRESHOLD=1000                 # Slow query threshold (ms)
DB_CONNECTION_POOL_MAX=50                    # Max database connections

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
PERFORMANCE_ALERT_EMAIL=alerts@clinic.com

# Load Testing
LOAD_TEST_TARGET_URL=http://api-gateway:4000
LOAD_TEST_MAX_VUS=100                        # Max virtual users
LOAD_TEST_DURATION=300                       # Test duration (seconds)
```

### Alert Thresholds

Configure custom alert thresholds in your service configuration:

```typescript
// In your module configuration
const performanceConfig = {
  alertThresholds: {
    cpu_usage: 80,           // 80% CPU usage
    memory_usage: 85,        // 85% memory usage
    response_time: 1000,     // 1000ms response time
    error_rate: 5,           // 5% error rate
    event_loop_delay: 100,   // 100ms event loop delay
    heap_usage: 90,          // 90% heap usage
  },
};
```

## 📈 Monitoring Setup

### 1. Enable Automated Profiling

The performance profiler automatically collects metrics every minute. To customize:

```typescript
// In your service startup
@Cron(CronExpression.EVERY_30_SECONDS)  // Custom interval
async collectPerformanceMetrics() {
  const serviceName = this.configService.get('SERVICE_NAME', 'api-gateway');
  await this.performanceProfilerService.generatePerformanceProfile(serviceName);
}
```

### 2. Custom Metrics

Add custom application metrics:

```typescript
// In your service
async recordCustomMetric(metricName: string, value: number) {
  const metric = this.performanceMetricRepository.create({
    serviceName: 'my-service',
    timestamp: new Date(),
    customMetrics: {
      [metricName]: value
    }
  });
  
  await this.performanceMetricRepository.save(metric);
}
```

### 3. Dashboard Integration

The system provides Grafana dashboard configurations. Import the dashboard JSON:

```bash
# Apply dashboard ConfigMaps
kubectl apply -f scripts/performance/grafana-dashboards.yaml

# Access Grafana
kubectl port-forward svc/grafana 3000:3000 -n monitoring
```

## 🧪 Load Testing

### Manual Load Testing

```bash
# Run basic load test
kubectl exec -it deployment/k6-load-testing -n performance -- \
  k6 run --env TARGET_URL=http://api-gateway:4000 /scripts/basic-load-test.js

# Run stress test
kubectl exec -it deployment/k6-load-testing -n performance -- \
  k6 run /scripts/stress-test.js
```

### Automated Load Testing

```bash
# Schedule regular performance tests
POST /performance/load-test/api-gateway
Content-Type: application/json

{
  "name": "weekly-performance-test",
  "duration": 300,
  "stages": [
    { "duration": "2m", "target": 10 },
    { "duration": "5m", "target": 50 },
    { "duration": "2m", "target": 0 }
  ],
  "thresholds": {
    "http_req_duration": ["p(95)<500"],
    "http_req_failed": ["rate<0.1"]
  }
}
```

## 🔍 Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check for memory leaks
GET /performance/analytics/trends/api-gateway?days=7

# Look for continuously increasing memory trend
# Generate heap dump for analysis
npm run performance:heap
```

#### Slow Response Times
```bash
# Analyze database performance
GET /performance/database-metrics

# Check for slow queries
GET /performance/optimization/recommendations/api-gateway

# Review optimization suggestions
```

#### High CPU Usage
```bash
# Generate CPU profile
npm run performance:flame

# Check for CPU-intensive operations
GET /performance/system-metrics

# Review scaling recommendations
GET /performance/capacity-planning/api-gateway
```

### Performance Analysis Tools

#### 1. CPU Profiling
```bash
# Generate flame graph
npm run performance:flame

# Analyze CPU usage patterns
npm run performance:profile && npm run performance:analyze
```

#### 2. Memory Analysis
```bash
# Generate heap snapshot
npm run performance:heap

# Monitor memory trends
GET /performance/analytics/trends/api-gateway
```

#### 3. Event Loop Monitoring
```bash
# Check event loop delay
GET /performance/system-metrics

# Look for blocking operations
npm run performance:bubbleprof
```

## 📊 Best Practices

### 1. Regular Monitoring
- Monitor performance metrics continuously
- Set up appropriate alert thresholds
- Review performance trends weekly
- Conduct monthly performance audits

### 2. Optimization Strategy
- Apply low-risk optimizations first
- Test changes in staging environment
- Monitor impact after optimization
- Maintain rollback procedures

### 3. Capacity Planning
- Use forecasting for resource planning
- Monitor growth trends
- Plan for peak usage periods
- Implement auto-scaling where appropriate

### 4. Performance Testing
- Run regular load tests
- Test critical user journeys
- Validate performance after deployments
- Maintain performance benchmarks

## 🛡️ Security Considerations

- Performance data may contain sensitive information
- Limit access to performance endpoints to authorized users
- Implement proper authentication for profiling tools
- Regularly rotate monitoring credentials
- Monitor for performance-based attacks (DDoS, resource exhaustion)

## 📚 Additional Resources

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Kubernetes Performance Monitoring](https://kubernetes.io/docs/concepts/cluster-administration/monitoring/)
- [Database Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Healthcare Platform Architecture Guide](../architecture/ARCHITECTURE.md)

## 🤝 Support

For performance-related issues or questions:
1. Check the performance dashboard for current status
2. Review recent alerts and recommendations
3. Consult the troubleshooting section
4. Contact the platform team via Slack #performance-monitoring

---

This performance profiling system provides comprehensive monitoring and optimization capabilities to ensure the healthcare platform operates at peak efficiency while maintaining the highest standards of reliability and user experience.