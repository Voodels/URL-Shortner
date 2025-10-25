#!/bin/bash

# ============================================================================
# Stop All Services
# ============================================================================

set -e

echo "🛑 Stopping URL Shortener - Complete Stack"
echo "============================================"
echo ""

# Check if services are running
if ! docker-compose -f docker-compose.full.yml ps | grep -q "Up"; then
    echo "⚠️  No services are currently running"
    exit 0
fi

echo "🔄 Stopping all services..."
docker-compose -f docker-compose.full.yml down

echo ""
echo "✅ All services stopped!"
echo ""
echo "============================================"
echo "💾 Data Preservation:"
echo "============================================"
echo "✓ Database data preserved in volume: urlshortener-mysql-data"
echo "✓ Grafana data preserved in volume: urlshortener-grafana-data"
echo "✓ Prometheus data preserved in volume: urlshortener-prometheus-data"
echo "✓ Loki data preserved in volume: urlshortener-loki-data"
echo ""
echo "To remove all data: docker-compose -f docker-compose.full.yml down -v"
echo "To restart: ./start-all.sh"
echo ""
