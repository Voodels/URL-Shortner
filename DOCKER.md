# 🐳 Docker Quick Start Guide

## Prerequisites

- Docker 24.0+
- Docker Compose 2.20+

## Quick Start (5 minutes)

### 1. Clone and Configure

```bash
# Clone repository
git clone https://github.com/Voodels/URL-Shortner.git
cd URL-Shortner

# Copy environment template
cp .env.example .env

# Edit configuration (optional for local testing)
nano .env
```

### 2. Deploy Everything

```bash
# Start all services
./deploy.sh dev

# Or manually:
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Access Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Health**: http://localhost:8000/health
- **Adminer (DB UI)**: http://localhost:8081

## Production Deployment

### 1. Configure for Production

```bash
# Update environment variables
cp .env.example .env
nano .env
```

**Critical settings:**
```env
# Change these!
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://yourdomain.com
```

### 2. Deploy

```bash
# Deploy to production
./deploy.sh prod

# Or manually:
docker-compose up -d --build
```

### 3. Verify Deployment

```bash
# Check all services running
docker-compose ps

# Check backend health
curl http://localhost:8000/health

# View logs
docker-compose logs -f
```

## Common Commands

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a service
docker-compose restart backend

# View logs
docker-compose logs -f backend

# Rebuild and restart
docker-compose up -d --build
```

### Database Management

```bash
# Connect to MySQL
docker-compose exec mysql mysql -u urluser -purlpassword url_shortener

# Run SQL file
docker-compose exec -T mysql mysql -u urluser -purlpassword url_shortener < schema.sql

# Backup database
./backup.sh

# Restore database
./restore.sh backups/backup_file.sql.gz
```

### Monitoring

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access Grafana: http://localhost:3001
# Default credentials: admin/admin

# Access Prometheus: http://localhost:9090
```

### Debugging

```bash
# Execute command in container
docker-compose exec backend deno eval "console.log('test')"

# Check resource usage
docker stats

# Inspect container
docker-compose exec backend sh
```

## Architecture

```
┌─────────────┐
│   Nginx     │  ← Frontend (React + Vite)
│  Port: 80   │
└──────┬──────┘
       │
┌──────┴──────┐
│   Backend   │  ← Deno API Server
│  Port: 8000 │
└──────┬──────┘
       │
┌──────┴──────┐
│    MySQL    │  ← Database
│  Port: 3306 │
└─────────────┘
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend API port | `8000` | No |
| `DB_HOST` | MySQL hostname | `mysql` | Yes |
| `DB_PORT` | MySQL port | `3306` | No |
| `DB_USER` | Database user | `urluser` | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `DB_NAME` | Database name | `url_shortener` | Yes |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost:5173` | Yes |
| `JWT_SECRET` | JWT signing key | - | Yes |
| `LOG_REQUESTS` | Enable logging | `true` | No |

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :8000

# Change port in docker-compose.yml or .env
```

### Database Connection Failed

```bash
# Check MySQL is running
docker-compose ps mysql

# Check logs
docker-compose logs mysql

# Recreate database
docker-compose down -v
docker-compose up -d
```

### Frontend Build Failed

```bash
# Clear cache and rebuild
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Permission Denied

```bash
# Fix script permissions
chmod +x deploy.sh backup.sh restore.sh
```

## Production Checklist

Before deploying to production:

- [ ] Change default passwords
- [ ] Generate secure JWT secret
- [ ] Configure CORS for your domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Configure monitoring
- [ ] Test disaster recovery

See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for complete list.

## More Information

- **Full Documentation**: [README.md](README.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **API Documentation**: [API.md](API.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)

## Support

- **Issues**: https://github.com/Voodels/URL-Shortner/issues
- **Discussions**: https://github.com/Voodels/URL-Shortner/discussions
