# Clinic App Helm Chart

A comprehensive Helm chart for deploying the Clinic Management Platform on Kubernetes with healthcare-grade security and compliance.

## Overview

This Helm chart deploys a complete clinic management platform with:

- **Microservices Architecture**: API Gateway + 9 backend services + React frontend
- **Healthcare Compliance**: HIPAA-compliant security and audit logging
- **Production Ready**: Autoscaling, monitoring, backup, and security features
- **Infrastructure**: PostgreSQL, Redis, NATS, MinIO, Prometheus, Grafana

## Quick Start

### Prerequisites

- Kubernetes 1.24+
- Helm 3.8+
- NGINX Ingress Controller
- cert-manager (for TLS certificates)
- Prometheus Operator (for monitoring)

### Installation

1. **Add Dependencies**
   ```bash
   helm dependency update
   ```

2. **Install with Default Values**
   ```bash
   helm install clinic-app ./clinic-app \
     --namespace clinic-platform \
     --create-namespace
   ```

3. **Install with Custom Values**
   ```bash
   helm install clinic-app ./clinic-app \
     --namespace clinic-platform \
     --create-namespace \
     --values values-production.yaml
   ```

### Configuration

#### Basic Configuration

```yaml
# values.yaml
environment: production
region: us-east-1

# API Gateway
apiGateway:
  ingress:
    hosts:
      - host: api.your-domain.com
        paths:
          - path: /
            pathType: Prefix

# Frontend
frontend:
  ingress:
    hosts:
      - host: app.your-domain.com
        paths:
          - path: /
            pathType: Prefix
```

#### Security Configuration

```yaml
# Enable security features
secrets:
  manual:
    enabled: true
    secrets:
      application:
        JWT_SECRET: "your-secure-jwt-secret"
        SESSION_SECRET_KEY: "your-session-secret"
        OPENAI_API_KEY: "your-openai-key"

# Network policies
networkPolicies:
  enabled: true
  egress:
    enabled: true

# Pod security standards
podSecurityStandards:
  enforced: restricted
  audit: restricted
  warn: restricted
```

#### Database Configuration

```yaml
postgresql:
  enabled: true
  auth:
    database: clinic
    username: clinic
    password: "secure-password"
  primary:
    persistence:
      size: 100Gi
```

#### Monitoring Configuration

```yaml
monitoring:
  enabled: true
  prometheus:
    enabled: true
  grafana:
    enabled: true
    adminPassword: "secure-admin-password"
```

## Components

### Core Services

| Component | Port | Description |
|-----------|------|-------------|
| API Gateway | 4000 | Main entry point and service orchestration |
| Auth Service | 3001 | Authentication and user management |
| Appointments Service | 3002 | Scheduling and calendar management |
| Files Service | 3003 | File uploads and session recordings |
| Notifications Service | 3004 | Email and SMS notifications |
| AI Service | 3005 | OpenAI integration and analysis |
| Notes Service | 3006 | Session notes and documentation |
| Analytics Service | 3007 | Reporting and analytics |
| Settings Service | 3008 | User preferences and configuration |
| Billing Service | 3009 | Israeli billing compliance |

### Infrastructure Services

| Component | Description |
|-----------|-------------|
| PostgreSQL | Primary database with HIPAA compliance |
| Redis | Session storage and caching |
| NATS | Message broker for service communication |
| MinIO | S3-compatible object storage |
| Prometheus | Metrics collection and alerting |
| Grafana | Monitoring dashboards |

### Frontend

- **React Application**: Modern SPA with Material-UI
- **NGINX**: Production-ready web server with security headers
- **Progressive Web App**: Offline capability and mobile support

## Production Deployment

### Resource Requirements

#### Minimum Resources
```yaml
resources:
  requests:
    cpu: 4000m
    memory: 8Gi
  limits:
    cpu: 8000m
    memory: 16Gi
```

#### Recommended Resources
```yaml
resources:
  requests:
    cpu: 8000m
    memory: 16Gi
  limits:
    cpu: 16000m
    memory: 32Gi
```

### High Availability Setup

```yaml
# Replicas for high availability
apiGateway:
  replicaCount: 3

services:
  authService:
    replicaCount: 3
  # ... other services

# Autoscaling configuration
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70

# Pod disruption budgets
podDisruptionBudget:
  enabled: true
  minAvailable: 2
```

### Security Hardening

```yaml
# Security context
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1001
  capabilities:
    drop:
      - ALL

# Network policies
networkPolicies:
  enabled: true
  ingress:
    enabled: true
  egress:
    enabled: true

# RBAC
rbac:
  create: true
  rules:
    - apiGroups: [""]
      resources: ["secrets", "configmaps"]
      verbs: ["get", "list"]
```

## Monitoring and Observability

### Prometheus Metrics

The chart automatically configures ServiceMonitors for:
- Application metrics (custom business metrics)
- Infrastructure metrics (CPU, memory, network)
- Database metrics (PostgreSQL, Redis)
- Message broker metrics (NATS)

### Grafana Dashboards

Pre-configured dashboards for:
- Application overview and health
- Microservices performance
- Database performance
- Healthcare-specific metrics

### Health Checks

```yaml
healthChecks:
  livenessProbe:
    enabled: true
    initialDelaySeconds: 30
    periodSeconds: 10
  readinessProbe:
    enabled: true
    initialDelaySeconds: 10
    periodSeconds: 5
  startupProbe:
    enabled: true
    initialDelaySeconds: 10
    periodSeconds: 10
    failureThreshold: 30
```

## Backup and Disaster Recovery

### Automated Backups

```yaml
backup:
  enabled: true
  schedule: "0 2 * * *"  # Daily at 2 AM
  retention: "30d"
  destination:
    s3:
      enabled: true
      bucket: clinic-backups
      region: us-east-1
```

### Backup Components

- **PostgreSQL**: Full database backups with point-in-time recovery
- **MinIO**: Object storage backups
- **Persistent Volumes**: Snapshot-based backups
- **Configuration**: Kubernetes manifests and secrets backup

## Scaling and Performance

### Horizontal Pod Autoscaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

### Database Scaling

```yaml
postgresql:
  architecture: replication  # Master-slave setup
  readReplicas:
    replicaCount: 2
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true
```

## Testing

### Helm Tests

The chart includes comprehensive tests:

```bash
# Run all tests
helm test clinic-app

# Run specific test
helm test clinic-app --filter name=clinic-app-test
```

### Test Coverage

- **Health Checks**: All services responding correctly
- **Database Connectivity**: PostgreSQL and Redis connections
- **Security Headers**: Proper security configuration
- **CORS Configuration**: Cross-origin resource sharing
- **Rate Limiting**: API protection mechanisms

## Troubleshooting

### Common Issues

1. **Pod Startup Issues**
   ```bash
   kubectl describe pod <pod-name>
   kubectl logs <pod-name> --previous
   ```

2. **Database Connection Issues**
   ```bash
   kubectl exec -it <api-gateway-pod> -- env | grep POSTGRES
   kubectl port-forward svc/clinic-app-postgresql 5432:5432
   ```

3. **Service Communication Issues**
   ```bash
   kubectl get networkpolicies
   kubectl describe networkpolicy <policy-name>
   ```

### Debug Mode

Enable debug logging:
```yaml
environment: development
apiGateway:
  env:
    LOG_LEVEL: debug
    NODE_ENV: development
```

### Resource Monitoring

```bash
# Check resource usage
kubectl top pods
kubectl top nodes

# Check HPA status
kubectl get hpa
kubectl describe hpa clinic-app-api-gateway
```

## Values Reference

### Global Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.imageRegistry` | Global image registry | `""` |
| `global.imagePullSecrets` | Global image pull secrets | `[]` |
| `global.storageClass` | Global storage class | `""` |

### Application Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `environment` | Environment (development/staging/production) | `production` |
| `region` | Deployment region | `us-east-1` |
| `image.registry` | Image registry | `ghcr.io` |
| `image.repository` | Image repository | `clinic-platform/clinic-app` |
| `image.tag` | Image tag | `""` (uses Chart.AppVersion) |

### Security Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `secrets.manual.enabled` | Enable manual secrets | `true` |
| `secrets.externalSecrets.enabled` | Enable external secrets operator | `false` |
| `networkPolicies.enabled` | Enable network policies | `true` |
| `rbac.create` | Create RBAC resources | `true` |

### Resource Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `resources.requests.cpu` | CPU request | `500m` |
| `resources.requests.memory` | Memory request | `512Mi` |
| `resources.limits.cpu` | CPU limit | `1000m` |
| `resources.limits.memory` | Memory limit | `1Gi` |

### Autoscaling Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `autoscaling.enabled` | Enable HPA | `true` |
| `autoscaling.minReplicas` | Minimum replicas | `2` |
| `autoscaling.maxReplicas` | Maximum replicas | `10` |
| `autoscaling.targetCPUUtilizationPercentage` | CPU target | `70` |

### Monitoring Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `monitoring.enabled` | Enable monitoring | `true` |
| `monitoring.serviceMonitor.enabled` | Enable ServiceMonitors | `true` |
| `monitoring.prometheus.enabled` | Enable Prometheus | `true` |
| `monitoring.grafana.enabled` | Enable Grafana | `true` |

## Healthcare Compliance

### HIPAA Compliance

The chart is configured for HIPAA compliance with:
- Encryption at rest and in transit
- Access controls and audit logging
- Secure communication between services
- Data backup and recovery procedures

### SOC 2 Compliance

Features supporting SOC 2 Type II:
- Security controls and monitoring
- Availability through high availability setup
- Processing integrity with data validation
- Confidentiality with encryption and access controls
- Privacy controls for personal data

## Support

For issues and support:
- Create an issue in the project repository
- Check the troubleshooting section
- Review the monitoring dashboards
- Examine pod logs and events

## License

This Helm chart is licensed under the MIT License.