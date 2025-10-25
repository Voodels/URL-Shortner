#!/bin/bash
# ============================================================================
# Backup Script for URL Shortener
# ============================================================================
#
# USAGE: ./backup.sh
#
# DESCRIPTION: Creates backups of database and configuration files
#
# ============================================================================

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "============================================================================"
echo "  URL Shortener - Backup Script"
echo "============================================================================"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo -e "${BLUE}📦 Backing up database...${NC}"
docker-compose exec -T mysql mysqldump \
  -u root \
  -prootpassword \
  --single-transaction \
  --routines \
  --triggers \
  url_shortener | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

echo -e "${GREEN}✅ Database backup created: db_backup_$TIMESTAMP.sql.gz${NC}"

# Backup environment files
echo -e "${BLUE}📦 Backing up configuration...${NC}"
tar -czf "$BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz" \
  .env \
  docker-compose.yml \
  nginx.conf \
  2>/dev/null || true

echo -e "${GREEN}✅ Configuration backup created: config_backup_$TIMESTAMP.tar.gz${NC}"

# Clean old backups
echo -e "${BLUE}🧹 Cleaning old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# List backups
echo -e "\n${BLUE}📋 Available backups:${NC}"
ls -lh "$BACKUP_DIR"

echo -e "\n${GREEN}✅ Backup completed successfully!${NC}"
echo ""
