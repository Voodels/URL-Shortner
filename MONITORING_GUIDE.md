# 📊 Monitoring Stack Guide

## 🎯 Quick Access

### **Grafana Dashboard**
- **URL**: http://localhost:3002
- **Username**: `admin`
- **Password**: `admin`
- **Status**: ✅ Running

### **Prometheus Metrics**
- **URL**: http://localhost:9091
- **Status**: ✅ Running
- **Targets**: http://localhost:9091/targets

### **Loki Logs**
- **URL**: http://localhost:3101
- **Status**: ✅ Running (warming up)
- **Ready**: http://localhost:3101/ready

---

## 🚀 Getting Started with Grafana

### Step 1: Login to Grafana
1. Open http://localhost:3002
2. Login with:
   - Username: `admin`
   - Password: `admin`
3. (Optional) Change password when prompted

### Step 2: Add Data Sources

#### **Add Prometheus (Metrics)**
1. Click **⚙️ Settings** (gear icon) → **Data Sources**
2. Click **Add data source**
3. Select **Prometheus**
4. Configure:
   - **Name**: `Prometheus`
   - **URL**: `http://prometheus:9090`
   - Leave other settings as default
5. Click **Save & Test**
6. Should see: ✅ "Data source is working"

#### **Add Loki (Logs)**
1. Click **Add data source** again
2. Select **Loki**
3. Configure:
   - **Name**: `Loki`
   - **URL**: `http://loki:3100`
   - Leave other settings as default
5. Click **Save & Test**
6. Should see: ✅ "Data source is working"

---

## 📈 Using Prometheus Metrics

### **Explore Metrics**
1. Click **🧭 Explore** (compass icon) in left sidebar
2. Select **Prometheus** from dropdown
3. Try these queries:

#### **System Metrics**
```promql
# CPU Usage
rate(process_cpu_seconds_total[5m])

# Memory Usage
process_resident_memory_bytes

# HTTP Request Rate
rate(http_requests_total[1m])
```

#### **Application Metrics** (if instrumented)
```promql
# Request Duration
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error Rate
rate(http_requests_total{status=~"5.."}[5m])

# Request Count by Endpoint
sum(rate(http_requests_total[5m])) by (endpoint)
```

### **View All Targets**
1. Open http://localhost:9091/targets
2. Check which services Prometheus is monitoring
3. Green = UP, Red = DOWN

---

## 📝 Using Loki Logs

### **Explore Logs**
1. Click **🧭 Explore** (compass icon)
2. Select **Loki** from dropdown
3. Try these LogQL queries:

#### **Basic Queries**
```logql
# All logs from URL shortener
{job="urlshortener"}

# All Docker container logs
{job="docker"}

# Filter by log level
{job="urlshortener"} |= "error"

# Logs from specific container
{container_name="urlshortener-backend"}
```

#### **Advanced Queries**
```logql
# Count errors per minute
rate({job="urlshortener"} |= "error" [1m])

# HTTP 500 errors
{job="urlshortener"} |= "500" | json

# Slow requests
{job="urlshortener"} | json | duration > 1s
```

### **Live Tail**
1. In Explore → Loki
2. Click **Live** button (top right)
3. See logs in real-time

---

## 📊 Creating Dashboards

### **Quick Dashboard**
1. Click **➕** → **Dashboard**
2. Click **Add visualization**
3. Select data source (Prometheus or Loki)
4. Enter query
5. Configure visualization type (Graph, Gauge, Table, etc.)
6. Click **Apply**
7. **Save** dashboard (💾 icon)

### **Import Pre-built Dashboards**
1. Click **➕** → **Import**
2. Enter dashboard ID:
   - **Node Exporter**: `1860`
   - **Docker**: `893`
   - **Nginx**: `12708`
   - **MySQL**: `7362`
3. Click **Load**
4. Select Prometheus data source
5. Click **Import**

---

## 🧪 Testing the Monitoring

### **Generate Traffic**
```bash
# Generate HTTP requests
for i in {1..100}; do
  curl -s http://localhost:8000/health > /dev/null
  sleep 0.1
done
```

### **Check Metrics in Prometheus**
```bash
# Query Prometheus API
curl -s 'http://localhost:9091/api/v1/query?query=up' | jq .

# Check all metrics
curl -s http://localhost:9091/api/v1/label/__name__/values | jq .
```

### **Check Logs in Loki**
```bash
# Query Loki API
curl -s 'http://localhost:3101/loki/api/v1/query?query={job="urlshortener"}' | jq .
```

---

## 🎨 Recommended Dashboards

### **1. Application Overview**
- **Panels**:
  - Request Rate (Prometheus)
  - Error Rate (Prometheus)
  - Response Time (Prometheus)
  - Recent Logs (Loki)

### **2. Infrastructure**
- **Panels**:
  - CPU Usage (Prometheus)
  - Memory Usage (Prometheus)
  - Disk I/O (Prometheus)
  - Container Status (Docker metrics)

### **3. Database**
- **Panels**:
  - Query Count (MySQL metrics)
  - Connection Pool (MySQL metrics)
  - Slow Queries (Loki logs)

---

## 🔧 Troubleshooting

### **Prometheus Not Scraping**
```bash
# Check Prometheus targets
curl http://localhost:9091/targets

# Check Prometheus config
docker exec urlshortener-prometheus cat /etc/prometheus/prometheus.yml

# Restart Prometheus
docker-compose -f docker-compose.full.yml restart prometheus
```

### **Loki Not Receiving Logs**
```bash
# Check Loki status
curl http://localhost:3101/ready

# Check Promtail logs
docker-compose -f docker-compose.full.yml logs promtail

# Restart Loki stack
docker-compose -f docker-compose.full.yml restart loki promtail
```

### **Grafana Can't Connect to Data Source**
```bash
# Check if services are on same network
docker network inspect urlshortener-network

# Test from Grafana container
docker exec urlshortener-grafana wget -O- http://prometheus:9090/-/healthy
docker exec urlshortener-grafana wget -O- http://loki:3100/ready
```

---

## 📚 Useful Queries Reference

### **Prometheus**
```promql
# Uptime
up

# Container CPU
rate(container_cpu_usage_seconds_total[5m])

# Container Memory
container_memory_usage_bytes

# HTTP requests per second
rate(http_requests_total[1m])

# HTTP 95th percentile latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### **Loki (LogQL)**
```logql
# All logs
{job="urlshortener"}

# Error logs only
{job="urlshortener"} |= "error"

# JSON parsing
{job="urlshortener"} | json | status_code >= 400

# Pattern matching
{job="urlshortener"} |~ "ERROR|WARN"

# Count by level
sum(rate({job="urlshortener"} [1m])) by (level)
```

---

## 🎯 Next Steps

1. ✅ **Setup Data Sources** (Prometheus + Loki)
2. 📊 **Create Your First Dashboard**
3. 🔔 **Configure Alerts** (Advanced)
4. 📧 **Setup Notifications** (Email/Slack)
5. 🎨 **Import Community Dashboards**

---

## 🌐 Access URLs Summary

| Service    | URL                        | Purpose                |
|------------|----------------------------|------------------------|
| Grafana    | http://localhost:3002      | Visualization          |
| Prometheus | http://localhost:9091      | Metrics Collection     |
| Prometheus | http://localhost:9091/targets | Target Status       |
| Loki       | http://localhost:3101      | Log Aggregation        |
| Backend    | http://localhost:8000      | API (generates logs)   |
| Frontend   | http://localhost           | Web App                |

---

## 💡 Pro Tips

1. **Save Your Dashboards**: Always save after creating visualizations
2. **Use Variables**: Create dashboard variables for dynamic filtering
3. **Set Time Range**: Use time picker (top right) to view historical data
4. **Star Dashboards**: Star frequently used dashboards for quick access
5. **Organize with Folders**: Create folders to organize dashboards by team/service
6. **Export Dashboards**: Export as JSON for version control
7. **Setup Alerts**: Configure alerts for critical metrics
8. **Use Annotations**: Mark deployments and incidents on graphs

---

**🎉 You're all set! Happy monitoring!**
