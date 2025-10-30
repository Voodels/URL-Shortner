#!/bin/bash

# ============================================================================
# View Logs - All or Specific Service
# ============================================================================

SERVICE=$1

if [ -z "$SERVICE" ]; then
    echo "📋 Viewing logs for ALL services (Ctrl+C to exit)"
    echo "Tip: Use './logs.sh <service>' to view specific service logs"
    echo "Services: mysql, backend, frontend, prometheus, grafana, loki, promtail"
    echo ""
    docker-compose -f docker-compose.full.yml logs -f
else
    echo "📋 Viewing logs for: $SERVICE (Ctrl+C to exit)"
    echo ""
    docker-compose -f docker-compose.full.yml logs -f "$SERVICE"
fi
