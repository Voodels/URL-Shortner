# 🎉 URL Shortener - Complete Stack Running!

## ✅ All Services Status

| Service | Status | Port | Access URL |
|---------|--------|------|------------|
| **Frontend** | ✅ Running | 80 | http://localhost |
| **Backend API** | ✅ Healthy | 8000 | http://localhost:8000 |
| **MySQL Database** | ✅ Healthy | 3307 | localhost:3307 |
| **Grafana** | ✅ Running | 3002 | http://localhost:3002 |
| **Prometheus** | ✅ Running | 9091 | http://localhost:9091 |
| **Loki** | ✅ Running | 3101 | http://localhost:3101 |
| **Promtail** | ✅ Running | - | (log collector) |

---

## 🚀 Quick Start Commands

### **Start Everything**
```bash
./start-all.sh
# OR
docker-compose -f docker-compose.full.yml up -d
```

### **Stop Everything**
```bash
./stop-all.sh
# OR
docker-compose -f docker-compose.full.yml down
```

### **Restart Everything**
```bash
./restart-all.sh
# OR
docker-compose -f docker-compose.full.yml restart
```

### **View Logs**
```bash
./logs.sh              # All services
./logs.sh backend      # Specific service
./logs.sh grafana      # Grafana logs
```

### **Check Status**
```bash
docker-compose -f docker-compose.full.yml ps
```

---

## 📊 Access Monitoring

### **Grafana Dashboard**
1. Open: http://localhost:3002
2. Login: `admin` / `admin`
3. Add data sources:
   - Prometheus: `http://prometheus:9090`
   - Loki: `http://loki:3100`
4. Start creating dashboards!

👉 **See detailed guide**: [MONITORING_GUIDE.md](./MONITORING_GUIDE.md)

### **Prometheus Metrics**
- Main UI: http://localhost:9091
- Targets: http://localhost:9091/targets
- Metrics: http://localhost:9091/graph

### **Loki Logs**
- Ready check: http://localhost:3101/ready
- Query: http://localhost:3101/loki/api/v1/query

---

## 🧪 Test the Application

### **Health Check**
```bash
curl http://localhost:8000/health
```

### **Access Frontend**
Open http://localhost in your browser

### **Generate Test Traffic**
```bash
# Generate 50 requests
for i in {1..50}; do
  curl -s http://localhost:8000/health > /dev/null
  echo "Request $i"
  sleep 0.2
done
```

Then check metrics in Grafana/Prometheus!

---

## 📁 Project Structure

```
URLSHORTNER/
├── backend/              # Deno API server
├── frontend/             # React + Vite app
├── database/             # MySQL schema
├── monitoring/           # Prometheus, Loki, Promtail configs
├── k8s/                  # Kubernetes manifests
├── .github/workflows/    # CI/CD pipelines
│
├── docker-compose.yml           # Production stack (app only)
├── docker-compose.full.yml      # Complete stack (app + monitoring)
├── docker-compose.monitoring.yml # Monitoring only
├── docker-compose.dev.yml       # Development mode
│
├── Dockerfile.backend    # Backend container
├── Dockerfile.frontend   # Frontend container
├── nginx.conf           # Nginx configuration
│
├── start-all.sh         # 🚀 Start everything
├── stop-all.sh          # 🛑 Stop everything
├── restart-all.sh       # 🔄 Restart everything
├── logs.sh              # 📋 View logs
│
└── MONITORING_GUIDE.md  # 📊 Complete monitoring guide
```

---

## 🛠️ Management Scripts

All scripts are executable and ready to use:

```bash
chmod +x *.sh  # Already done!

./start-all.sh      # Start complete stack
./stop-all.sh       # Stop all services
./restart-all.sh    # Restart all services
./logs.sh           # View all logs
./logs.sh backend   # View backend logs only
```

---

## 🔧 Configuration

### **Environment Variables** (.env)
```env
PORT=8000
DB_HOST=localhost
DB_PORT=3307
DB_USER=urlshortener
DB_PASSWORD=urlshortener
DB_NAME=urlshortener
JWT_SECRET=hKj9mP3vL8qN2wR5tY6uI1oP4sA7dF0gH3jK6lM9nB2cV5xZ8
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173,http://localhost:3000
LOG_REQUESTS=true
```

### **Docker Compose Profiles**
```bash
# With database admin UI (Adminer)
docker-compose -f docker-compose.full.yml --profile debug up -d
# Access Adminer at http://localhost:8081
```

---

## 📊 Monitoring Setup (Step by Step)

### **1. Open Grafana**
```bash
# Already opened in browser, or:
open http://localhost:3002
```

### **2. Login**
- Username: `admin`
- Password: `admin`

### **3. Add Prometheus Data Source**
1. Settings (⚙️) → Data Sources → Add data source
2. Select "Prometheus"
3. URL: `http://prometheus:9090`
4. Save & Test ✅

### **4. Add Loki Data Source**
1. Add data source → Select "Loki"
2. URL: `http://loki:3100`
3. Save & Test ✅

### **5. Explore Data**
- Click Explore (🧭)
- Select Prometheus → Try query: `up`
- Select Loki → Try query: `{job="urlshortener"}`

### **6. Create Dashboard**
1. Create (+) → Dashboard
2. Add visualization
3. Enter query
4. Save dashboard

---

## 🎯 What's Working

✅ **Application Stack**
- Frontend (React + Vite) serving on port 80
- Backend API (Deno) on port 8000
- MySQL database on port 3307
- All services healthy and communicating

✅ **Monitoring Stack**
- Grafana for visualization
- Prometheus for metrics collection
- Loki for log aggregation
- Promtail for log shipping

✅ **DevOps Features**
- Docker containerization
- Docker Compose orchestration
- Health checks configured
- Volume persistence
- Network isolation
- Resource limits

✅ **Management Tools**
- One-command start/stop scripts
- Easy log viewing
- Service status monitoring

---

## 🚢 Deployment Options

### **Local Development**
```bash
# Use local Deno servers (currently running)
cd frontend && deno task dev     # Port 5173
deno run --allow-all backend/server.ts  # Port 8000
```

### **Docker (Current)**
```bash
./start-all.sh  # Everything in containers
```

### **Kubernetes** (Available)
```bash
cd k8s/
kubectl apply -f .
# See k8s/ directory for manifests
```

### **CI/CD** (Configured)
- GitHub Actions workflows ready
- See `.github/workflows/ci-cd.yml`
- Triggers on push to main branch

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Project overview |
| [MONITORING_GUIDE.md](./MONITORING_GUIDE.md) | Complete monitoring setup |
| [DOCKER.md](./DOCKER.md) | Docker deployment guide |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Testing instructions |
| [API.md](./API.md) | API documentation |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture |

---

## 🎓 Learning Resources

### **Grafana**
- Query Prometheus metrics
- Create custom dashboards
- Set up alerts
- Import community dashboards

### **Prometheus**
- PromQL query language
- Metric types (Counter, Gauge, Histogram)
- Recording rules
- Alerting rules

### **Loki**
- LogQL query language
- Log filtering and parsing
- Live tailing
- JSON log parsing

---

## 🔥 Quick Commands Reference

```bash
# Start
./start-all.sh

# Stop
./stop-all.sh

# Logs
./logs.sh backend

# Status
docker-compose -f docker-compose.full.yml ps

# Rebuild
docker-compose -f docker-compose.full.yml build --no-cache

# Clean restart
docker-compose -f docker-compose.full.yml down -v
./start-all.sh

# Access services
curl http://localhost:8000/health          # Backend health
curl http://localhost                       # Frontend
curl http://localhost:9091/api/v1/targets  # Prometheus targets
curl http://localhost:3101/ready           # Loki ready
```

---

## 🎉 Success!

Your URL Shortener is now running with:
- ✅ Full application stack
- ✅ Complete monitoring solution
- ✅ Production-ready Docker setup
- ✅ Easy management scripts
- ✅ Comprehensive documentation

**Next Steps:**
1. Open Grafana: http://localhost:3002
2. Add data sources (Prometheus + Loki)
3. Create your first dashboard
4. Explore metrics and logs

**Happy monitoring! 📊**
