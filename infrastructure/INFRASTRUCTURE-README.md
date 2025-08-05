# Healthcare Platform Infrastructure

This directory contains comprehensive infrastructure configurations for the healthcare platform, providing production-ready load balancing, auto-scaling, and monitoring capabilities with HIPAA compliance and healthcare-specific optimizations.

## 🏗️ Infrastructure Components

### Load Balancing
- **NGINX Load Balancer**: High-performance HTTP/HTTPS load balancer with healthcare-specific configurations
- **HAProxy**: Alternative load balancer with advanced traffic management and health checking
- **Docker Compose**: Multi-instance deployment with primary/secondary load balancers
- **Kubernetes Ingress**: Cloud-native ingress controller with SSL termination and routing

### Auto-Scaling
- **Horizontal Pod Autoscaler (HPA)**: Automatic pod scaling based on CPU, memory, and custom metrics
- **Vertical Pod Autoscaler (VPA)**: Automatic resource optimization for individual pods
- **Cluster Autoscaler**: Node-level scaling for Kubernetes clusters
- **Healthcare-Specific Metrics**: Custom scaling based on patient load and clinical workflows

### Service Mesh
- **Istio Configuration**: Advanced traffic management, security, and observability
- **Circuit Breakers**: Resilience patterns for healthcare-critical services
- **mTLS**: Mutual TLS for secure service-to-service communication
- **JWT Authentication**: Token-based authentication with healthcare compliance

### Monitoring & Observability
- **NGINX Exporter**: Prometheus metrics for NGINX load balancer
- **HAProxy Exporter**: Detailed HAProxy performance metrics
- **Grafana Dashboards**: Healthcare-focused monitoring dashboards
- **Alert Rules**: Healthcare-specific alerting with priority levels

## 📁 Directory Structure

```
infrastructure/
├── load-balancer/           # Load balancer configurations
│   ├── nginx.conf          # NGINX configuration with HIPAA compliance
│   ├── haproxy/           # HAProxy configuration and setup
│   └── docker-compose.lb.yml # High-availability Docker setup
├── kubernetes/            # Kubernetes configurations
│   ├── hpa/              # Horizontal Pod Autoscaler configs
│   ├── vpa/              # Vertical Pod Autoscaler configs
│   ├── cluster-autoscaler/ # Cluster-level autoscaling
│   ├── ingress/          # Ingress controller configuration
│   └── service-mesh/     # Istio service mesh configuration
├── monitoring/           # Monitoring and observability
│   └── load-balancer-monitoring.yaml # Load balancer metrics
└── scripts/             # Deployment and management scripts
    └── deploy-infrastructure.sh # Automated deployment script
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Kubernetes cluster (for K8s deployment)
- kubectl configured
- Helm 3.x (for some components)

### Docker Deployment (Development/Testing)
```bash
# Deploy complete infrastructure with Docker
cd infrastructure/scripts
./deploy-infrastructure.sh --mode docker

# Check deployment status
docker-compose -f ../load-balancer/docker-compose.lb.yml ps

# Access services
curl http://localhost/health        # Primary load balancer
curl http://localhost:8081/health   # Secondary load balancer
```

### Kubernetes Deployment (Production)
```bash
# Deploy to Kubernetes
cd infrastructure/scripts
./deploy-infrastructure.sh --mode kubernetes

# Deploy with Istio service mesh
./deploy-infrastructure.sh --mode kubernetes --istio

# Check deployment status
kubectl get all -n clinic-production
```

### Hybrid Deployment
```bash
# Deploy both Docker and Kubernetes
./deploy-infrastructure.sh --mode both --istio
```

## ⚙️ Configuration Options

### Environment Variables
```bash
export DEPLOYMENT_MODE="kubernetes"    # docker, kubernetes, or both
export DEPLOY_ISTIO="true"            # Enable Istio service mesh
export CLEANUP_ON_ERROR="true"        # Cleanup on deployment failure
export NAMESPACE="clinic-production"   # Kubernetes namespace
```

### Load Balancer Features
- **SSL Termination**: Automatic HTTPS redirect and SSL certificate management
- **Rate Limiting**: Healthcare-specific rate limits (5 req/min for auth endpoints)
- **Health Checks**: Comprehensive health monitoring for all backend services
- **Session Affinity**: Sticky sessions for healthcare workflows
- **HIPAA Headers**: Security headers for healthcare compliance
- **File Upload Optimization**: Extended timeouts for medical file uploads (300s)

### Auto-Scaling Configuration
- **API Gateway**: 3-10 replicas, 70% CPU threshold
- **Frontend**: 2-8 replicas, 60% CPU threshold
- **Auth Service**: 2-6 replicas with authentication-specific metrics
- **Files Service**: 2-8 replicas with file upload metrics
- **Database**: Initial resource sizing with VPA optimization

## 📊 Monitoring & Alerting

### Available Metrics
- **Request Rate**: Requests per second across all services
- **Response Time**: 95th percentile latency monitoring
- **Error Rate**: 5xx error tracking with healthcare priority
- **Active Connections**: Connection pool monitoring
- **Resource Usage**: CPU, memory, and disk utilization
- **Healthcare Metrics**: Patient sessions, appointments, file uploads

### Alert Priorities
- **High Priority**: Service outages, authentication failures, data breaches
- **Medium Priority**: Performance degradation, resource constraints
- **Low Priority**: Capacity planning, optimization opportunities

### Dashboard Access
- **NGINX Stats**: `http://load-balancer:8080/nginx_status`
- **HAProxy Stats**: `http://load-balancer:8404/stats` (admin:clinic-stats-2023)
- **Grafana Dashboards**: Load balancer performance and healthcare metrics
- **Prometheus Metrics**: `/metrics` endpoints on all exporters

## 🔐 Security Features

### HIPAA Compliance
- **Encryption**: TLS 1.2+ for all communications
- **Access Control**: IP-based restrictions for admin endpoints
- **Audit Logging**: Comprehensive request logging with patient ID tracking
- **Data Protection**: Secure headers and content security policies

### Network Security
- **Network Policies**: Kubernetes network segmentation
- **mTLS**: Service-to-service encryption (with Istio)
- **Rate Limiting**: DDoS protection and abuse prevention
- **JWT Validation**: Token-based authentication with JWKS

## 🔧 Maintenance & Operations

### Health Checks
```bash
# Check load balancer health
curl -f http://localhost:8080/health

# Check all service health
kubectl get pods -n clinic-production
kubectl describe hpa -n clinic-production
```

### Scaling Operations
```bash
# Manual scaling
kubectl scale deployment api-gateway --replicas=5 -n clinic-production

# Check autoscaler status
kubectl get hpa -n clinic-production
kubectl describe vpa -n clinic-production
```

### Log Analysis
```bash
# NGINX logs
docker logs clinic-lb-primary

# Kubernetes logs
kubectl logs -f deployment/nginx-prometheus-exporter -n clinic-production
```

## 🚨 Troubleshooting

### Common Issues

1. **Load Balancer Not Starting**
   - Check Docker images exist: `docker images | grep clinic`
   - Verify port availability: `netstat -tulpn | grep :80`
   - Check configuration syntax: `nginx -t`

2. **Services Not Scaling**
   - Verify HPA configuration: `kubectl describe hpa -n clinic-production`
   - Check metrics server: `kubectl top nodes`
   - Review resource requests/limits in deployments

3. **High Latency**
   - Check backend service health
   - Review connection pool settings
   - Analyze Grafana dashboards for bottlenecks

4. **SSL Certificate Issues**
   - Verify cert-manager installation
   - Check certificate status: `kubectl describe certificate -n clinic-production`
   - Review DNS configuration for domains

### Recovery Procedures
```bash
# Restart load balancer
docker-compose -f infrastructure/load-balancer/docker-compose.lb.yml restart

# Reset Kubernetes deployment
kubectl rollout restart deployment/api-gateway -n clinic-production

# Emergency scaling
kubectl scale deployment api-gateway --replicas=10 -n clinic-production
```

This infrastructure provides enterprise-grade reliability, security, and performance for healthcare applications while maintaining HIPAA compliance and supporting healthcare-specific workflows.