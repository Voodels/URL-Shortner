#!/bin/bash

# ============================================================================
# Restart All Services
# ============================================================================

set -e

echo "🔄 Restarting URL Shortener - Complete Stack"
echo "============================================"
echo ""

# Stop services
echo "🛑 Stopping services..."
docker-compose -f docker-compose.full.yml down

echo ""
echo "🔄 Starting services..."
docker-compose -f docker-compose.full.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.full.yml ps

echo ""
echo "✅ All services restarted!"
echo ""
