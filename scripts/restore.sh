#!/bin/bash
# ============================================================================
# Restore Script for URL Shortener
# ============================================================================
#
# USAGE: ./restore.sh <backup_file>
#
# EXAMPLE: ./restore.sh backups/db_backup_20241025_120000.sql.gz
#
# ============================================================================

set -e

BACKUP_FILE=$1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not specified${NC}"
    echo "Usage: ./restore.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo "============================================================================"
echo "  URL Shortener - Restore Script"
echo "============================================================================"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will replace the current database!${NC}"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

echo -e "${BLUE}📦 Restoring database...${NC}"

# Restore database
gunzip < "$BACKUP_FILE" | docker-compose exec -T mysql mysql \
  -u root \
  -prootpassword \
  url_shortener

echo -e "${GREEN}✅ Database restored successfully!${NC}"
echo ""
echo "Please restart the services:"
echo "  docker-compose restart backend"
echo ""
