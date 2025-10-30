# 🚀 Production Deployment Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring & Logging](#monitoring--logging)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- Docker 24.0+
- Docker Compose 2.20+
- Git
- (For K8s) kubectl
- (For K8s) Kubernetes cluster

### Required Configuration

1. **Environment Variables**: Copy `.env.example` to `.env` and configure
2. **Domain**: Configure your domain DNS to point to your server
3. **SSL Certificates**: Set up Let's Encrypt or provide certificates
4. **Database**: MySQL 8.0+ (can use Docker or managed service)

## Deployment Options

### 1. Docker Compose (Recommended for Small-Medium Scale)

**Pros:**
- Simple setup
- All services in one stack
- Easy to manage
- Good for single server

**Cons:**
- Limited scaling
- No built-in load balancing
- Manual failover

### 2. Kubernetes (Recommended for Large Scale)

**Pros:**
- Auto-scaling
- High availability
- Load balancing
- Self-healing

**Cons:**
- Complex setup
- Requires K8s knowledge
- Higher resource overhead

## Docker Deployment

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Voodels/URL-Shortner.git
cd URL-Shortner

# 2. Configure environment
cp .env.example .env
nano .env  # Edit configuration

# 3. Deploy
./deploy.sh prod
```

### Manual Deployment

```bash
# Build images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Update Deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Or use deploy script
./deploy.sh prod
```

### Database Initialization

The database is automatically initialized on first run. To manually initialize:

```bash
# Execute schema
docker-compose exec mysql mysql -u urluser -purlpassword url_shortener < database/schema.sql

# Or connect to MySQL
docker-compose exec mysql mysql -u urluser -purlpassword url_shortener
```

## Kubernetes Deployment

### Prerequisites

```bash
# Verify cluster access
kubectl cluster-info

# Create namespace
kubectl create namespace urlshortener
```

### Deploy to Kubernetes

```bash
# Use deployment script
./deploy-k8s.sh urlshortener

# Or manually:

# 1. Create secrets
kubectl create secret generic urlshortener-secrets \
  --namespace=urlshortener \
  --from-literal=db_user=urluser \
  --from-literal=db_password=$(openssl rand -base64 32) \
  --from-literal=mysql_root_password=$(openssl rand -base64 32) \
  --from-literal=jwt_secret=$(openssl rand -base64 32) \
  --from-literal=session_secret=$(openssl rand -base64 32)

# 2. Apply configurations
kubectl apply -f k8s/configmap.yaml -n urlshortener

# 3. Deploy services
kubectl apply -f k8s/ -n urlshortener

# 4. Check status
kubectl get all -n urlshortener
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment urlshortener-backend --replicas=5 -n urlshortener

# Auto-scaling is configured via HPA
kubectl get hpa -n urlshortener
```

### Ingress Configuration

Update `k8s/ingress.yaml` with your domain:

```yaml
spec:
  tls:
  - hosts:
    - yourdomain.com
    secretName: urlshortener-tls
  rules:
  - host: yourdomain.com
```

Install cert-manager for automatic SSL:

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

## CI/CD Pipeline

### GitHub Actions

The project includes automated CI/CD via GitHub Actions.

#### Setup

1. **Enable GitHub Actions** in repository settings

2. **Configure Secrets** in Settings > Secrets:
   ```
   PROD_HOST          # Production server IP/hostname
   PROD_USER          # SSH username
   PROD_SSH_KEY       # Private SSH key
   SLACK_WEBHOOK      # (Optional) Slack notifications
   ```

3. **Enable GitHub Container Registry**:
   - Settings > Packages > Container registry

#### Pipeline Stages

1. **Test & Lint** - Runs on every push
2. **Build** - Builds Docker images on main branch
3. **Security Scan** - Trivy vulnerability scanning
4. **Deploy** - Deploys to production (requires approval)

#### Manual Trigger

```bash
# Trigger via GitHub UI:
# Actions > CI/CD Pipeline > Run workflow
```

### Alternative CI/CD Platforms

<details>
<summary>GitLab CI</summary>

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: denoland/deno:latest
  script:
    - deno lint backend/
    - deno fmt --check
    - deno check backend/server.ts

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -f Dockerfile.backend -t $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA

deploy:
  stage: deploy
  script:
    - ssh $PROD_USER@$PROD_HOST "cd /opt/urlshortener && docker-compose pull && docker-compose up -d"
  only:
    - main
```
</details>

## Monitoring & Logging

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost/health
```

### Logs

**Docker:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

**Kubernetes:**
```bash
# Pod logs
kubectl logs -f deployment/urlshortener-backend -n urlshortener

# Previous pod logs (if crashed)
kubectl logs deployment/urlshortener-backend -n urlshortener --previous

# All pods
kubectl logs -l app=urlshortener -n urlshortener --all-containers
```

### Recommended Monitoring Stack

- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **Loki** - Log aggregation
- **Jaeger** - Distributed tracing

## Security Checklist

### Before Production Deployment

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Configure CORS for specific domains
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Set up firewall rules
- [ ] Enable database encryption at rest
- [ ] Configure backup strategy
- [ ] Set up rate limiting
- [ ] Enable audit logging
- [ ] Review and minimize exposed ports
- [ ] Run security scanning (Trivy, Snyk)
- [ ] Implement secrets management (Vault, AWS Secrets Manager)
- [ ] Configure CSP headers
- [ ] Enable HSTS
- [ ] Set up DDoS protection
- [ ] Configure WAF rules

### Environment Variables

**Required:**
```env
DB_PASSWORD=<strong-random-password>
JWT_SECRET=<strong-random-secret>
ALLOWED_ORIGINS=https://yourdomain.com
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database connection - check DB_HOST, DB_PASSWORD
# 2. Port conflict - ensure 8000 is free
# 3. Missing dependencies - rebuild image
```

### Database Connection Errors

```bash
# Check MySQL is running
docker-compose ps mysql

# Test connection
docker-compose exec backend deno eval "console.log('Test')"

# Check database exists
docker-compose exec mysql mysql -u urluser -purlpassword -e "SHOW DATABASES;"
```

### Frontend Build Fails

```bash
# Clear cache and rebuild
docker-compose build --no-cache frontend

# Check Node/Deno compatibility
docker-compose run frontend deno --version
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Scale backend
docker-compose up -d --scale backend=3

# Check database queries
docker-compose exec mysql mysqladmin -u root -prootpassword processlist
```

### SSL/HTTPS Issues

```bash
# Verify certificates
openssl s_client -connect yourdomain.com:443

# Check Let's Encrypt renewal
certbot renew --dry-run
```

## Backup & Restore

### Database Backup

```bash
# Backup
docker-compose exec mysql mysqldump -u root -prootpassword url_shortener > backup.sql

# Restore
docker-compose exec -T mysql mysql -u root -prootpassword url_shortener < backup.sql
```

### Automated Backups

Add to crontab:
```bash
0 2 * * * cd /opt/urlshortener && docker-compose exec -T mysql mysqldump -u root -prootpassword url_shortener | gzip > backups/backup-$(date +\%Y\%m\%d).sql.gz
```

## Rolling Back

```bash
# Docker
docker-compose down
git checkout <previous-commit>
docker-compose up -d --build

# Kubernetes
kubectl rollout undo deployment/urlshortener-backend -n urlshortener
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/Voodels/URL-Shortner/issues
- Documentation: See README.md and other docs
