# Kubernetes Helm Chart Deployment Guide

This document provides comprehensive guidance for deploying the Clinic Management Platform using Kubernetes and Helm charts with production-ready configuration.

## Overview

The Helm chart provides a complete production-ready deployment with:

- **Microservices Architecture**: API Gateway + 9 backend services + React frontend
- **Healthcare Compliance**: HIPAA-compliant security, audit logging, and data protection
- **Production Features**: Auto-scaling, monitoring, backup, network policies, and security
- **Infrastructure**: PostgreSQL, Redis, NATS, MinIO, Prometheus, Grafana

## Architecture

### Service Architecture
```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Ingress   │────│ API Gateway  │────│  Microservices  │
│  Controller │    │   (Port 4000)│    │   (Ports 3001-  │
└─────────────┘    └──────────────┘    │     3009)       │
                                       └─────────────────┘
       │                                        │
┌─────────────┐                          ┌─────────────────┐
│  Frontend   │                          │  Infrastructure │
│   (React)   │                          │  - PostgreSQL   │
│             │                          │  - Redis        │
└─────────────┘                          │  - NATS         │
                                         │  - MinIO        │
                                         │  - Prometheus   │
                                         │  - Grafana      │
                                         └─────────────────┘
```

### Security Architecture
```
┌─────────────────┐
│ Network Policies │ ← Ingress/Egress Control
├─────────────────┤
│ Pod Security    │ ← Restricted Security Context
│ Standards       │
├─────────────────┤
│ RBAC & Service  │ ← Kubernetes Access Control
│ Accounts        │
├─────────────────┤
│ Secrets         │ ← External Secrets or Manual
│ Management      │
├─────────────────┤
│ TLS/HTTPS       │ ← End-to-end Encryption
└─────────────────┘
```

## Prerequisites

### Required Tools
- **Kubernetes 1.24+** with RBAC enabled
- **Helm 3.8+** for package management
- **kubectl** configured for your cluster
- **NGINX Ingress Controller** for external access
- **cert-manager** for TLS certificate management
- **Prometheus Operator** for monitoring (optional)

### Cluster Requirements
- **Minimum**: 4 CPU cores, 8GB RAM, 100GB storage
- **Recommended**: 8 CPU cores, 16GB RAM, 500GB storage
- **Production**: 16+ CPU cores, 32GB+ RAM, 1TB+ storage

### Network Requirements
- Ingress controller with external IP/LoadBalancer
- DNS configuration for domain names
- TLS certificates (Let's Encrypt recommended)

## Installation

### 1. Prepare Kubernetes Cluster

```bash
# Create namespace
kubectl create namespace clinic-platform

# Verify cluster resources
kubectl get nodes
kubectl get storageclass
```

### 2. Install Dependencies

```bash
# Install NGINX Ingress Controller (if not installed)
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# Install cert-manager (if not installed)
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true

# Install Prometheus Operator (optional)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### 3. Configure Values

Create a `values-production.yaml` file:

```yaml
# Production configuration
environment: production
region: us-east-1

# Domain configuration
apiGateway:
  ingress:
    enabled: true
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: letsencrypt-prod
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
      nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
      nginx.ingress.kubernetes.io/proxy-body-size: "500m"
    hosts:
      - host: api.your-domain.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: api-tls
        hosts:
          - api.your-domain.com

frontend:
  ingress:
    enabled: true
    className: nginx
    annotations:
      cert-manager.io/cluster-issuer: letsencrypt-prod
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
    hosts:
      - host: app.your-domain.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: app-tls
        hosts:
          - app.your-domain.com

# Security configuration
secrets:
  manual:
    enabled: true
    secrets:
      application:
        JWT_SECRET: "your-super-secure-jwt-secret-key-here"
        SESSION_SECRET_KEY: "your-super-secure-session-secret-key"
        COOKIE_SECRET: "your-super-secure-cookie-secret-key"
        OPENAI_API_KEY: "your-openai-api-key"

# Database configuration
postgresql:
  enabled: true
  auth:
    database: clinic
    username: clinic
    password: "your-secure-database-password"
  primary:
    persistence:
      enabled: true
      size: 100Gi
    resources:
      requests:
        cpu: 1000m
        memory: 2Gi
      limits:
        cpu: 2000m
        memory: 4Gi

# Redis configuration
redis:
  enabled: true
  auth:
    enabled: true
    password: "your-secure-redis-password"
  master:
    persistence:
      enabled: true
      size: 20Gi

# MinIO configuration
minio:
  enabled: true
  auth:
    rootUser: admin
    rootPassword: "your-secure-minio-password"
  persistence:
    enabled: true
    size: 500Gi

# Monitoring
monitoring:
  enabled: true
  prometheus:
    enabled: true
  grafana:
    enabled: true
    adminPassword: "your-secure-grafana-password"

# Auto-scaling
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

# Backup
backup:
  enabled: true
  schedule: "0 2 * * *"
  retention: "30d"
  destination:
    s3:
      enabled: true
      bucket: clinic-backups-prod
      region: us-east-1

# Security policies
networkPolicies:
  enabled: true
  egress:
    enabled: true

podSecurityStandards:
  enforced: restricted
  audit: restricted
  warn: restricted

# Resource limits
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi

# High availability
podDisruptionBudget:
  enabled: true
  minAvailable: 2
```

### 4. Install the Helm Chart

```bash
# Navigate to Helm chart directory
cd infrastructure/helm/clinic-app

# Update dependencies
helm dependency update

# Validate the chart
helm lint .

# Install with production values
helm install clinic-app . \
  --namespace clinic-platform \
  --values values-production.yaml \
  --timeout 10m0s \
  --wait

# Verify installation
helm status clinic-app --namespace clinic-platform
```

### 5. Post-Installation Configuration

```bash
# Create Let's Encrypt cluster issuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@your-domain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Verify certificates
kubectl get certificates --namespace clinic-platform
```

## Configuration Options

### Environment-Specific Configurations

#### Development
```yaml
environment: development
autoscaling:
  enabled: false
monitoring:
  enabled: false
networkPolicies:
  enabled: false
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

#### Staging
```yaml
environment: staging
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
monitoring:
  enabled: true
networkPolicies:
  enabled: true
resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

#### Production
```yaml
environment: production
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
monitoring:
  enabled: true
networkPolicies:
  enabled: true
backup:
  enabled: true
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

### External Secrets Integration

For production environments, use external secrets management:

```yaml
secrets:
  externalSecrets:
    enabled: true
    secretStore:
      provider: aws  # or azure, gcp
      region: us-east-1
      role: arn:aws:iam::ACCOUNT:role/clinic-secrets-role
  manual:
    enabled: false
```

### Database High Availability

```yaml
postgresql:
  architecture: replication
  readReplicas:
    replicaCount: 2
  primary:
    persistence:
      enabled: true
      size: 200Gi
      storageClass: fast-ssd
  metrics:
    enabled: true
    serviceMonitor:
      enabled: true
```

## Monitoring and Observability

### Prometheus Configuration

```yaml
monitoring:
  enabled: true
  prometheus:
    enabled: true
    server:
      persistentVolume:
        enabled: true
        size: 100Gi
        storageClass: fast-ssd
    alertmanager:
      enabled: true
      config:
        global:
          smtp_smarthost: 'localhost:587'
          smtp_from: 'alerts@your-domain.com'
        route:
          group_by: ['alertname']
          group_wait: 10s
          group_interval: 10s
          repeat_interval: 1h
          receiver: 'web.hook'
        receivers:
          - name: 'web.hook'
            email_configs:
              - to: 'admin@your-domain.com'
                subject: 'Clinic App Alert'
```

### Grafana Dashboards

```yaml
monitoring:
  grafana:
    enabled: true
    persistence:
      enabled: true
      size: 10Gi
    adminPassword: "secure-password"
    dashboards:
      default:
        clinic-overview:
          gnetId: 12900
          revision: 1
          datasource: Prometheus
        nodejs-metrics:
          gnetId: 11159
          revision: 1
          datasource: Prometheus
        postgresql-metrics:
          gnetId: 9628
          revision: 7
          datasource: Prometheus
```

## Security Configuration

### Network Policies

```yaml
networkPolicies:
  enabled: true
  ingress:
    enabled: true
  egress:
    enabled: true
    allowedHosts:
      - "*.amazonaws.com"
      - "*.google.com"
      - "*.googleapis.com"
      - "api.openai.com"
```

### Pod Security Standards

```yaml
podSecurityStandards:
  enforced: restricted
  audit: restricted
  warn: restricted

securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1001
  capabilities:
    drop:
      - ALL
```

### RBAC Configuration

```yaml
rbac:
  create: true
  rules:
    - apiGroups: [""]
      resources: ["secrets", "configmaps"]
      verbs: ["get", "list"]
    - apiGroups: [""]
      resources: ["pods"]
      verbs: ["get", "list", "watch"]
```

## Backup and Disaster Recovery

### Backup Configuration

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
      path: "backups/"
  
  postgresql:
    enabled: true
  minio:
    enabled: true
  persistent:
    enabled: true
    storageClass: "backup-storage"
    size: 500Gi
```

### Disaster Recovery Procedures

1. **Database Recovery**
   ```bash
   # List available backups
   kubectl get jobs -l app.kubernetes.io/component=backup
   
   # Restore from backup
   kubectl create job --from=cronjob/clinic-app-backup restore-$(date +%Y%m%d)
   ```

2. **Application Recovery**
   ```bash
   # Rollback deployment
   helm rollback clinic-app 1 --namespace clinic-platform
   
   # Scale up services
   kubectl scale deployment --all --replicas=3 --namespace clinic-platform
   ```

## Scaling and Performance

### Horizontal Pod Autoscaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 60
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
      selectPolicy: Min
```

### Vertical Pod Autoscaling

```yaml
# Install VPA (if available)
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: clinic-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: clinic-app-api-gateway
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: api-gateway
      maxAllowed:
        cpu: 2
        memory: 4Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
```

## Testing and Validation

### Helm Tests

```bash
# Run all tests
helm test clinic-app --namespace clinic-platform

# Run specific test
helm test clinic-app --filter name=clinic-app-test --namespace clinic-platform

# View test results
kubectl logs clinic-app-test --namespace clinic-platform
```

### Health Checks

```bash
# Check all pods
kubectl get pods --namespace clinic-platform

# Check services
kubectl get services --namespace clinic-platform

# Check ingress
kubectl get ingress --namespace clinic-platform

# Test API health
kubectl port-forward service/clinic-app-api-gateway 4000:4000 --namespace clinic-platform
curl http://localhost:4000/health
```

### Load Testing

```bash
# Install hey for load testing
go install github.com/rakyll/hey@latest

# Test API Gateway
hey -n 10000 -c 100 -m GET https://api.your-domain.com/health

# Test specific endpoints
hey -n 1000 -c 10 -m GET -H "Authorization: Bearer <token>" https://api.your-domain.com/api/profile
```

## Troubleshooting

### Common Issues

1. **Pod Startup Issues**
   ```bash
   kubectl describe pod <pod-name> --namespace clinic-platform
   kubectl logs <pod-name> --namespace clinic-platform --previous
   ```

2. **Database Connection Issues**
   ```bash
   # Check database connectivity
   kubectl exec -it deployment/clinic-app-api-gateway --namespace clinic-platform -- env | grep POSTGRES
   
   # Test database connection
   kubectl port-forward service/clinic-app-postgresql 5432:5432 --namespace clinic-platform
   PGPASSWORD="password" psql -h localhost -U clinic -d clinic
   ```

3. **Ingress Issues**
   ```bash
   kubectl describe ingress --namespace clinic-platform
   kubectl get certificates --namespace clinic-platform
   kubectl describe certificate api-tls --namespace clinic-platform
   ```

4. **Resource Issues**
   ```bash
   kubectl top pods --namespace clinic-platform
   kubectl top nodes
   kubectl get events --namespace clinic-platform --sort-by='.lastTimestamp'
   ```

### Debug Mode

Enable debug logging:
```yaml
environment: development
apiGateway:
  env:
    LOG_LEVEL: debug
    NODE_ENV: development

services:
  authService:
    env:
      LOG_LEVEL: debug
```

### Performance Monitoring

```bash
# Check HPA status
kubectl get hpa --namespace clinic-platform
kubectl describe hpa clinic-app-api-gateway --namespace clinic-platform

# Check resource usage
kubectl top pods --namespace clinic-platform
kubectl top nodes

# Check metrics
kubectl port-forward service/clinic-app-prometheus-server 9090:80 --namespace monitoring
```

## Upgrading

### Helm Chart Upgrades

```bash
# Update chart dependencies
helm dependency update

# Upgrade with new values
helm upgrade clinic-app . \
  --namespace clinic-platform \
  --values values-production.yaml \
  --timeout 10m0s

# Check upgrade status
helm status clinic-app --namespace clinic-platform

# Rollback if needed
helm rollback clinic-app 1 --namespace clinic-platform
```

### Database Migrations

```bash
# Run database migrations
kubectl exec -it deployment/clinic-app-api-gateway --namespace clinic-platform -- npm run migration:run

# Check migration status
kubectl logs deployment/clinic-app-api-gateway --namespace clinic-platform | grep migration
```

## Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Review monitoring dashboards
   - Check backup status
   - Review security logs
   - Update certificates (if needed)

2. **Monthly**
   - Update Helm chart dependencies
   - Review resource usage and scaling
   - Security vulnerability scans
   - Performance testing

3. **Quarterly**
   - Disaster recovery testing
   - Security audit
   - Capacity planning review
   - Kubernetes cluster updates

### Backup Verification

```bash
# Check backup jobs
kubectl get cronjobs --namespace clinic-platform
kubectl get jobs -l app.kubernetes.io/component=backup --namespace clinic-platform

# Test restore procedure
kubectl create job --from=cronjob/clinic-app-backup test-restore-$(date +%Y%m%d) --namespace clinic-platform
```

## Security Best Practices

### Production Security Checklist

- [ ] Enable network policies
- [ ] Use external secrets management
- [ ] Configure Pod Security Standards
- [ ] Enable audit logging
- [ ] Set up monitoring and alerting
- [ ] Configure backup and disaster recovery
- [ ] Regular security scans
- [ ] TLS/HTTPS everywhere
- [ ] RBAC properly configured
- [ ] Resource limits configured

### Compliance Features

#### HIPAA Compliance
- ✅ Encryption at rest and in transit
- ✅ Access controls and audit logging
- ✅ Data backup and recovery
- ✅ Network security policies
- ✅ Administrative safeguards

#### SOC 2 Type II
- ✅ Security controls
- ✅ Availability measures
- ✅ Processing integrity
- ✅ Confidentiality protection
- ✅ Privacy controls

This Helm chart provides a comprehensive, production-ready deployment of the Clinic Management Platform with healthcare-grade security and compliance features.