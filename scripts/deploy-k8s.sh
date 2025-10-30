#!/bin/bash
# ============================================================================
# Kubernetes Deployment Script
# ============================================================================
#
# USAGE: ./deploy-k8s.sh [namespace]
#
# PREREQUISITES:
#   - kubectl configured
#   - Kubernetes cluster access
#   - Docker images pushed to registry
#
# ============================================================================

set -e

# Configuration
NAMESPACE=${1:-urlshortener}
K8S_DIR="./k8s"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "============================================================================"
echo "  URL Shortener - Kubernetes Deployment"
echo "  Namespace: $NAMESPACE"
echo "============================================================================"
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    log_error "kubectl is not installed"
    exit 1
fi

if ! kubectl cluster-info &> /dev/null; then
    log_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

log_success "Prerequisites check passed"

# Create namespace
log_info "Creating namespace..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets
log_warning "Please ensure secrets are configured!"
read -p "Have you created the secrets? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_error "Please create secrets first using:"
    echo "  kubectl create secret generic urlshortener-secrets \\"
    echo "    --namespace=$NAMESPACE \\"
    echo "    --from-literal=db_user=urluser \\"
    echo "    --from-literal=db_password=\$(openssl rand -base64 32) \\"
    echo "    --from-literal=mysql_root_password=\$(openssl rand -base64 32) \\"
    echo "    --from-literal=jwt_secret=\$(openssl rand -base64 32) \\"
    echo "    --from-literal=session_secret=\$(openssl rand -base64 32)"
    exit 1
fi

# Apply ConfigMaps
log_info "Applying ConfigMaps..."
kubectl apply -f "$K8S_DIR/configmap.yaml" -n "$NAMESPACE"

# Deploy MySQL
log_info "Deploying MySQL..."
kubectl apply -f "$K8S_DIR/mysql-statefulset.yaml" -n "$NAMESPACE"

# Wait for MySQL to be ready
log_info "Waiting for MySQL to be ready..."
kubectl wait --for=condition=ready pod -l component=database -n "$NAMESPACE" --timeout=300s

# Deploy Backend
log_info "Deploying Backend..."
kubectl apply -f "$K8S_DIR/backend-deployment.yaml" -n "$NAMESPACE"

# Deploy Frontend
log_info "Deploying Frontend..."
kubectl apply -f "$K8S_DIR/frontend-deployment.yaml" -n "$NAMESPACE"

# Wait for deployments
log_info "Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment/urlshortener-backend -n "$NAMESPACE" --timeout=300s
kubectl wait --for=condition=available deployment/urlshortener-frontend -n "$NAMESPACE" --timeout=300s

# Apply HPA
log_info "Applying Horizontal Pod Autoscalers..."
kubectl apply -f "$K8S_DIR/hpa.yaml" -n "$NAMESPACE"

# Apply Ingress
log_info "Applying Ingress..."
kubectl apply -f "$K8S_DIR/ingress.yaml" -n "$NAMESPACE"

# Show status
log_info "Deployment status:"
kubectl get all -n "$NAMESPACE"

log_success "Deployment completed successfully!"

echo ""
echo "Next steps:"
echo "  1. Check pod status: kubectl get pods -n $NAMESPACE"
echo "  2. View logs: kubectl logs -f deployment/urlshortener-backend -n $NAMESPACE"
echo "  3. Port forward for testing: kubectl port-forward svc/urlshortener-frontend 8080:80 -n $NAMESPACE"
echo ""
