#!/bin/bash
# ============================================================================
# Production Deployment Script
# ============================================================================
#
# USAGE: ./deploy.sh [environment]
#
# ENVIRONMENTS:
#   - dev: Development environment
#   - staging: Staging environment
#   - prod: Production environment
#
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" == "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
fi

# Functions
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

# Banner
echo "============================================================================"
echo "  URL Shortener - Deployment Script"
echo "  Environment: $ENVIRONMENT"
echo "============================================================================"
echo ""

# Pre-flight checks
log_info "Running pre-flight checks..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

log_success "Pre-flight checks passed"

# Environment file check
if [ "$ENVIRONMENT" == "prod" ] && [ ! -f .env ]; then
    log_warning ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        log_warning "⚠️  Please update .env with production values before continuing!"
        read -p "Press enter to continue after updating .env, or Ctrl+C to abort..."
    else
        log_error ".env.example not found. Cannot create .env file."
        exit 1
    fi
fi

# Build images
log_info "Building Docker images..."
docker-compose -f "$COMPOSE_FILE" build --no-cache

log_success "Images built successfully"

# Pull latest images (for services using pre-built images)
log_info "Pulling latest images..."
docker-compose -f "$COMPOSE_FILE" pull || true

# Stop existing containers
log_info "Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" down

# Start services
log_info "Starting services..."
if [ "$ENVIRONMENT" == "dev" ]; then
    docker-compose -f "$COMPOSE_FILE" up -d
else
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans
fi

log_success "Services started"

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 5

# Check backend health
BACKEND_URL="http://localhost:8000/health"
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s "$BACKEND_URL" > /dev/null; then
        log_success "Backend is healthy"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_error "Backend health check failed after $MAX_RETRIES attempts"
    docker-compose -f "$COMPOSE_FILE" logs backend
    exit 1
fi

# Show running containers
log_info "Running containers:"
docker-compose -f "$COMPOSE_FILE" ps

# Show logs
echo ""
log_info "Recent logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=20

# Success message
echo ""
echo "============================================================================"
log_success "Deployment completed successfully!"
echo "============================================================================"
echo ""
echo "Services:"
if [ "$ENVIRONMENT" == "dev" ]; then
    echo "  Frontend:  http://localhost:5173"
    echo "  Backend:   http://localhost:8000"
    echo "  Adminer:   http://localhost:8081"
else
    echo "  Frontend:  http://localhost"
    echo "  Backend:   http://localhost:8000"
fi
echo "  Health:    http://localhost:8000/health"
echo ""
echo "Useful commands:"
echo "  View logs:        docker-compose -f $COMPOSE_FILE logs -f"
echo "  Stop services:    docker-compose -f $COMPOSE_FILE down"
echo "  Restart service:  docker-compose -f $COMPOSE_FILE restart [service]"
echo ""
