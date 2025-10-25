#!/bin/bash

# ============================================================================
# Start All Services - Application + Monitoring
# ============================================================================

set -e

echo "🚀 Starting URL Shortener - Complete Stack"
echo "============================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

echo "📦 Building images (this may take a few minutes)..."
docker-compose -f docker-compose.full.yml build --parallel

echo ""
echo "🔄 Starting all services..."
docker-compose -f docker-compose.full.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.full.yml ps

echo ""
echo "✅ All services started!"
echo ""
echo "============================================"
echo "📱 Access URLs:"
echo "============================================"
echo "Frontend:    http://localhost"
echo "Backend API: http://localhost:8000"
echo "Health:      http://localhost:8000/health"
echo "Grafana:     http://localhost:3002 (admin/admin)"
echo "Prometheus:  http://localhost:9091"
echo "Loki:        http://localhost:3101"
echo "MySQL:       localhost:3307"
echo ""
echo "============================================"
echo "📝 Useful Commands:"
echo "============================================"
echo "View logs:        docker-compose -f docker-compose.full.yml logs -f"
echo "Stop services:    ./stop-all.sh"
echo "Restart services: ./restart-all.sh"
echo "Check status:     docker-compose -f docker-compose.full.yml ps"
echo ""
