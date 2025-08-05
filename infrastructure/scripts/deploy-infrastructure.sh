#!/bin/bash

# Healthcare Platform Infrastructure Deployment Script
# Deploys complete load balancing and auto-scaling infrastructure

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="clinic-production"
DOCKER_REGISTRY="clinic"
KUBECTL_TIMEOUT="300s"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
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
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        error "docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        error "helm is not installed or not in PATH"
        exit 1
    fi
    
    # Check Kubernetes cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    success "All prerequisites met"
}

# Create namespace if it doesn't exist
create_namespace() {
    log "Creating namespace: $NAMESPACE"
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        warning "Namespace $NAMESPACE already exists"
    else
        kubectl create namespace "$NAMESPACE"
        kubectl label namespace "$NAMESPACE" name="$NAMESPACE"
        success "Namespace $NAMESPACE created"
    fi
}

# Deploy Docker Compose infrastructure (for development/testing)
deploy_docker_infrastructure() {
    log "Deploying Docker Compose infrastructure..."
    
    cd "$(dirname "$0")/../load-balancer"
    
    # Check if images exist
    if ! docker image inspect clinic/api-gateway:latest &> /dev/null; then
        warning "clinic/api-gateway:latest image not found. Building..."
        cd "../../../"
        docker build -t clinic/api-gateway:latest -f services/api-gateway/Dockerfile .
        cd infrastructure/load-balancer
    fi
    
    if ! docker image inspect clinic/frontend:latest &> /dev/null; then
        warning "clinic/frontend:latest image not found. Building..."
        cd "../../../"
        docker build -t clinic/frontend:latest -f frontend/Dockerfile ./frontend
        cd infrastructure/load-balancer
    fi
    
    # Deploy infrastructure
    docker-compose -f docker-compose.lb.yml up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check health
    if curl -f http://localhost:8080/health &> /dev/null; then
        success "Docker infrastructure deployed successfully"
    else
        error "Docker infrastructure deployment failed"
        return 1
    fi
}

# Deploy Kubernetes HPA configurations
deploy_hpa() {
    log "Deploying Horizontal Pod Autoscalers..."
    
    cd "$(dirname "$0")/../kubernetes/hpa"
    
    # Deploy HPA configurations
    for hpa_file in *.yaml; do
        if [[ -f "$hpa_file" ]]; then
            log "Applying HPA configuration: $hpa_file"
            kubectl apply -f "$hpa_file" -n "$NAMESPACE"
        fi
    done
    
    # Wait for HPAs to be ready
    kubectl wait --for=condition=Ready hpa --all -n "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT" || true
    
    success "HPA configurations deployed"
}

# Deploy Kubernetes VPA configurations
deploy_vpa() {
    log "Deploying Vertical Pod Autoscalers..."
    
    # Check if VPA is installed
    if ! kubectl get crd verticalpodautoscalers.autoscaling.k8s.io &> /dev/null; then
        warning "VPA CRDs not found. Installing VPA..."
        
        # Install VPA
        git clone https://github.com/kubernetes/autoscaler.git /tmp/autoscaler || true
        cd /tmp/autoscaler/vertical-pod-autoscaler/hack
        ./vpa-up.sh
        cd - > /dev/null
        
        success "VPA installed"
    fi
    
    cd "$(dirname "$0")/../kubernetes/vpa"
    
    # Deploy VPA configurations
    kubectl apply -f vertical-pod-autoscaler.yaml -n "$NAMESPACE"
    
    success "VPA configurations deployed"
}

# Deploy Cluster Autoscaler
deploy_cluster_autoscaler() {
    log "Deploying Cluster Autoscaler..."
    
    cd "$(dirname "$0")/../kubernetes/cluster-autoscaler"
    
    # Apply cluster autoscaler configuration
    kubectl apply -f cluster-autoscaler.yaml
    
    # Wait for deployment
    kubectl wait --for=condition=Available deployment/cluster-autoscaler -n kube-system --timeout="$KUBECTL_TIMEOUT"
    
    success "Cluster Autoscaler deployed"
}

# Deploy Ingress Controller
deploy_ingress() {
    log "Deploying NGINX Ingress Controller..."
    
    # Check if ingress-nginx is already installed
    if ! kubectl get namespace ingress-nginx &> /dev/null; then
        # Install NGINX Ingress Controller
        kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
        
        # Wait for ingress controller to be ready
        kubectl wait --namespace ingress-nginx \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/component=controller \
            --timeout="$KUBECTL_TIMEOUT"
        
        success "NGINX Ingress Controller installed"
    else
        warning "NGINX Ingress Controller already installed"
    fi
    
    # Deploy ingress configuration
    cd "$(dirname "$0")/../kubernetes/ingress"
    kubectl apply -f nginx-ingress.yaml -n "$NAMESPACE"
    
    success "Ingress configurations deployed"
}

# Deploy Service Mesh (optional)
deploy_service_mesh() {
    if [[ "${DEPLOY_ISTIO:-false}" == "true" ]]; then
        log "Deploying Istio Service Mesh..."
        
        # Check if Istio is installed
        if ! kubectl get namespace istio-system &> /dev/null; then
            # Install Istio
            curl -L https://istio.io/downloadIstio | sh -
            export PATH="$PWD/istio-*/bin:$PATH"
            istioctl install --set values.defaultRevision=default -y
            
            # Enable sidecar injection
            kubectl label namespace "$NAMESPACE" istio-injection=enabled --overwrite
            
            success "Istio installed"
        else
            warning "Istio already installed"
        fi
        
        # Deploy Istio configurations
        cd "$(dirname "$0")/../kubernetes/service-mesh"
        kubectl apply -f istio-config.yaml -n "$NAMESPACE"
        
        success "Service Mesh configurations deployed"
    else
        log "Skipping Service Mesh deployment (set DEPLOY_ISTIO=true to enable)"
    fi
}

# Deploy monitoring
deploy_monitoring() {
    log "Deploying load balancer monitoring..."
    
    cd "$(dirname "$0")/../monitoring"
    kubectl apply -f load-balancer-monitoring.yaml -n "$NAMESPACE"
    
    # Wait for monitoring components
    kubectl wait --for=condition=Available deployment/nginx-prometheus-exporter -n "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
    kubectl wait --for=condition=Available deployment/haproxy-exporter -n "$NAMESPACE" --timeout="$KUBECTL_TIMEOUT"
    
    success "Monitoring deployed"
}

# Validate deployment
validate_deployment() {
    log "Validating deployment..."
    
    # Check HPA status
    log "Checking HPA status..."
    kubectl get hpa -n "$NAMESPACE"
    
    # Check VPA status
    log "Checking VPA status..."
    kubectl get vpa -n "$NAMESPACE" || warning "VPA not available"
    
    # Check ingress status
    log "Checking ingress status..."
    kubectl get ingress -n "$NAMESPACE"
    
    # Check monitoring
    log "Checking monitoring services..."
    kubectl get svc -n "$NAMESPACE" | grep -E "(nginx-prometheus-exporter|haproxy-exporter)"
    
    # Check pod status
    log "Checking pod status..."
    kubectl get pods -n "$NAMESPACE"
    
    success "Deployment validation completed"
}

# Cleanup function
cleanup() {
    if [[ "${CLEANUP_ON_ERROR:-false}" == "true" ]]; then
        warning "Cleaning up due to error..."
        kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
    fi
}

# Main deployment function
main() {
    log "Starting Healthcare Platform Infrastructure Deployment"
    log "================================================="
    
    # Set trap for cleanup on error
    trap cleanup ERR
    
    # Run deployment steps
    check_prerequisites
    create_namespace
    
    # Choose deployment mode
    case "${DEPLOYMENT_MODE:-kubernetes}" in
        "docker")
            deploy_docker_infrastructure
            ;;
        "kubernetes")
            deploy_hpa
            deploy_vpa
            deploy_cluster_autoscaler
            deploy_ingress
            deploy_service_mesh
            deploy_monitoring
            validate_deployment
            ;;
        "both")
            deploy_docker_infrastructure
            deploy_hpa
            deploy_vpa
            deploy_cluster_autoscaler
            deploy_ingress
            deploy_service_mesh
            deploy_monitoring
            validate_deployment
            ;;
        *)
            error "Invalid DEPLOYMENT_MODE. Use 'docker', 'kubernetes', or 'both'"
            exit 1
            ;;
    esac
    
    success "Healthcare Platform Infrastructure Deployment Complete!"
    log "================================================="
    
    # Display access information
    log "Access Information:"
    log "- Docker Load Balancer: http://localhost (HTTP) / https://localhost (HTTPS)"
    log "- Kubernetes Ingress: Check 'kubectl get ingress -n $NAMESPACE' for external IP"
    log "- NGINX Stats: http://localhost:8080/nginx_status (Docker) or via ingress"
    log "- HAProxy Stats: http://localhost:8404/stats (Docker) or via ingress"
    log "- Monitoring: Check Grafana dashboards for load balancer metrics"
}

# Script usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -m, --mode MODE         Deployment mode: docker, kubernetes, or both (default: kubernetes)"
    echo "  -n, --namespace NAME    Kubernetes namespace (default: clinic-production)"
    echo "  -i, --istio             Enable Istio service mesh deployment"
    echo "  -c, --cleanup           Enable cleanup on error"
    echo ""
    echo "Environment Variables:"
    echo "  DEPLOYMENT_MODE         Same as --mode"
    echo "  DEPLOY_ISTIO           Set to 'true' to deploy Istio"
    echo "  CLEANUP_ON_ERROR       Set to 'true' to cleanup on error"
    echo ""
    echo "Examples:"
    echo "  $0                                          # Deploy to Kubernetes"
    echo "  $0 --mode docker                           # Deploy Docker infrastructure only"
    echo "  $0 --mode both --istio                     # Deploy both with Istio"
    echo "  DEPLOY_ISTIO=true $0                       # Deploy with Istio via env var"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -m|--mode)
            DEPLOYMENT_MODE="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -i|--istio)
            DEPLOY_ISTIO="true"
            shift
            ;;
        -c|--cleanup)
            CLEANUP_ON_ERROR="true"
            shift
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main "$@"