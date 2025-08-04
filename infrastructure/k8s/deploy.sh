#!/bin/bash
# Kubernetes deployment script for Clinic App

set -e

ENVIRONMENT=${1:-staging}
NAMESPACE="clinic-app-${ENVIRONMENT}"

echo "🚀 Deploying Clinic App to Kubernetes..."
echo "📍 Environment: ${ENVIRONMENT}"
echo "📍 Namespace: ${NAMESPACE}"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if kustomize is available
if ! command -v kustomize &> /dev/null; then
    echo "❌ kustomize not found. Please install kustomize first."
    exit 1
fi

# Create namespace if it doesn't exist
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Apply infrastructure services first
echo "📦 Deploying infrastructure services..."
kubectl apply -f infrastructure-services.yaml -n ${NAMESPACE}

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n ${NAMESPACE} --timeout=300s
kubectl wait --for=condition=ready pod -l app=nats -n ${NAMESPACE} --timeout=300s

# Apply configmaps and secrets
echo "⚙️ Applying configuration..."
kubectl apply -f configmap.yaml -n ${NAMESPACE}

# Check if secrets exist, create if not
if ! kubectl get secret clinic-app-secrets -n ${NAMESPACE} &> /dev/null; then
    echo "🔐 Creating secrets..."
    echo "⚠️  WARNING: Using template secrets. Update with real values!"
    kubectl apply -f secrets.yaml -n ${NAMESPACE}
else
    echo "✅ Secrets already exist"
fi

# Deploy application services
echo "🚀 Deploying application services..."
kustomize build . | kubectl apply -f - -n ${NAMESPACE}

# Wait for deployments to be ready
echo "⏳ Waiting for application services to be ready..."
kubectl wait --for=condition=available deployment/api-gateway -n ${NAMESPACE} --timeout=600s
kubectl wait --for=condition=available deployment/auth-service -n ${NAMESPACE} --timeout=600s

# Display deployment status
echo ""
echo "📊 Deployment Status:"
kubectl get pods -n ${NAMESPACE}
echo ""
kubectl get services -n ${NAMESPACE}
echo ""
kubectl get ingress -n ${NAMESPACE}

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Update secrets with real values:"
echo "   kubectl edit secret clinic-app-secrets -n ${NAMESPACE}"
echo ""
echo "2. Check application logs:"
echo "   kubectl logs -f deployment/api-gateway -n ${NAMESPACE}"
echo ""
echo "3. Access the application:"
if [ "${ENVIRONMENT}" = "production" ]; then
    echo "   https://api.clinic-platform.com"
else
    echo "   https://api-${ENVIRONMENT}.clinic-platform.com"
fi