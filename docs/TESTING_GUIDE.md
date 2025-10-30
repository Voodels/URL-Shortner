# 🔍 Testing Kubernetes & Monitoring - Quick Guide

## 🎯 Option 1: Test Monitoring Stack (Easiest - No K8s Required)

The monitoring stack works with regular Docker Compose and is the quickest way to see observability in action.

### Step 1: Start Your Application with Monitoring

```bash
# Make sure your app is running
docker-compose up -d

# Start the monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Check all services are running
docker-compose ps
docker-compose -f docker-compose.monitoring.yml ps
```

### Step 2: Access the Monitoring Dashboards

**Grafana (Visualization):**
```
URL: http://localhost:3002
Username: admin
Password: admin
```

**Prometheus (Metrics):**
```
URL: http://localhost:9091
```

**What to do in Grafana:**
1. Go to http://localhost:3002
2. Login (admin/admin) - it will ask you to change password
3. Click "Explore" (compass icon on left sidebar)
4. Select "Prometheus" as data source
5. Try queries like:
   - `up` - Shows which services are up
   - `process_cpu_seconds_total` - CPU usage

**What to do in Prometheus:**
1. Go to http://localhost:9091
2. Click "Status" → "Targets" to see monitored services
3. Try the query interface with: `up{job="urlshortener-backend"}`

### Step 3: Generate Some Traffic

```bash
# Generate some requests to create metrics
for i in {1..100}; do
  curl http://localhost:8000/health
  sleep 0.1
done

# Check backend logs
docker-compose logs -f backend
```

### Step 4: View Logs in Loki

1. In Grafana (http://localhost:3002)
2. Go to "Explore"
3. Select "Loki" as data source
4. Enter query: `{service="backend"}`
5. You'll see all backend logs

### Step 5: Stop Monitoring Stack

```bash
# Stop monitoring
docker-compose -f docker-compose.monitoring.yml down

# Keep it running and stop later
docker-compose -f docker-compose.monitoring.yml down -v
```

---

## 🚢 Option 2: Test Kubernetes (Requires K8s Cluster)

### Prerequisites Check

```bash
# Check if you have kubectl
kubectl version --client

# Check if you have a cluster (Minikube, Kind, Docker Desktop, etc.)
kubectl cluster-info
```

### If You Don't Have Kubernetes Yet...

**Option A: Use Docker Desktop (Easiest for local testing)**
1. Open Docker Desktop
2. Settings → Kubernetes → Enable Kubernetes
3. Wait for it to start
4. Verify: `kubectl get nodes`

**Option B: Install Minikube**
```bash
# Install minikube (Ubuntu/Debian)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start minikube
minikube start

# Verify
kubectl get nodes
```

**Option C: Install Kind (Kubernetes in Docker)**
```bash
# Install kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create cluster
kind create cluster --name urlshortener

# Verify
kubectl cluster-info --context kind-urlshortener
```

### Deploy to Kubernetes

#### Step 1: Build and Load Images (for local K8s)

```bash
# Build the images
docker-compose build backend frontend

# If using minikube - load images
minikube image load urlshortner_backend:latest
minikube image load urlshortner_frontend:latest

# If using kind - load images
kind load docker-image urlshortner_backend:latest --name urlshortener
kind load docker-image urlshortner_frontend:latest --name urlshortener
```

#### Step 2: Create Secrets

```bash
# Create namespace
kubectl create namespace urlshortener

# Create secrets
kubectl create secret generic urlshortener-secrets \
  --namespace=urlshortener \
  --from-literal=db_user=urluser \
  --from-literal=db_password=$(openssl rand -base64 32) \
  --from-literal=mysql_root_password=$(openssl rand -base64 32) \
  --from-literal=jwt_secret=$(openssl rand -base64 32) \
  --from-literal=session_secret=$(openssl rand -base64 32)

# Verify secrets created
kubectl get secrets -n urlshortener
```

#### Step 3: Update K8s Manifests for Local Testing

```bash
# We need to update the image pull policy for local images
# Create a temporary patch
cat > /tmp/backend-patch.yaml << 'EOF'
spec:
  template:
    spec:
      containers:
      - name: backend
        image: urlshortner_backend:latest
        imagePullPolicy: Never
EOF

cat > /tmp/frontend-patch.yaml << 'EOF'
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: urlshortner_frontend:latest
        imagePullPolicy: Never
EOF
```

#### Step 4: Deploy Everything

```bash
# Apply configurations
kubectl apply -f k8s/configmap.yaml -n urlshortener

# Deploy MySQL
kubectl apply -f k8s/mysql-statefulset.yaml -n urlshortener

# Wait for MySQL to be ready
kubectl wait --for=condition=ready pod -l component=database -n urlshortener --timeout=300s

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml -n urlshortener
kubectl patch deployment urlshortener-backend -n urlshortener --patch-file /tmp/backend-patch.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml -n urlshortener
kubectl patch deployment urlshortener-frontend -n urlshortener --patch-file /tmp/frontend-patch.yaml

# Apply autoscaling
kubectl apply -f k8s/hpa.yaml -n urlshortener
```

#### Step 5: Check Deployment Status

```bash
# Watch pods starting
kubectl get pods -n urlshortener -w

# Check all resources
kubectl get all -n urlshortener

# Check pod details
kubectl describe pod -l app=urlshortener -n urlshortener

# View logs
kubectl logs -f deployment/urlshortener-backend -n urlshortener
```

#### Step 6: Access the Application

**Option A: Port Forwarding (Easiest)**
```bash
# Forward frontend
kubectl port-forward -n urlshortener svc/urlshortener-frontend 8080:80

# In another terminal, forward backend
kubectl port-forward -n urlshortener svc/urlshortener-backend 8000:8000

# Access:
# Frontend: http://localhost:8080
# Backend: http://localhost:8000/health
```

**Option B: Using Minikube Service**
```bash
# Get service URLs
minikube service urlshortener-frontend -n urlshortener --url
minikube service urlshortener-backend -n urlshortener --url
```

**Option C: Using Ingress (Advanced)**
```bash
# Enable ingress on minikube
minikube addons enable ingress

# Apply ingress (you'll need to update the domain)
kubectl apply -f k8s/ingress.yaml -n urlshortener

# Get ingress IP
kubectl get ingress -n urlshortener

# Add to /etc/hosts
echo "$(minikube ip) yourdomain.com" | sudo tee -a /etc/hosts
```

#### Step 7: Test Auto-Scaling

```bash
# Check current HPA status
kubectl get hpa -n urlshortener

# Generate load to trigger autoscaling
kubectl run -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh
# Inside the pod:
while true; do wget -q -O- http://urlshortener-backend:8000/health; done

# In another terminal, watch scaling
kubectl get hpa -n urlshortener -w
kubectl get pods -n urlshortener -w
```

#### Step 8: View K8s Dashboard (Optional)

```bash
# For minikube
minikube dashboard

# For other K8s
kubectl proxy
# Then open: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

### Cleanup Kubernetes

```bash
# Delete everything in namespace
kubectl delete namespace urlshortener

# Or delete specific resources
kubectl delete -f k8s/ -n urlshortener

# Stop minikube
minikube stop

# Delete minikube cluster
minikube delete

# Or delete kind cluster
kind delete cluster --name urlshortener
```

---

## 🎬 Quick Demo Commands

### See It All Working at Once

```bash
# Terminal 1: Start monitoring
docker-compose -f docker-compose.monitoring.yml up

# Terminal 2: Watch logs
docker-compose logs -f backend

# Terminal 3: Generate traffic
watch -n 0.5 'curl -s http://localhost:8000/health'

# Browser: Open Grafana
# http://localhost:3001
```

---

## 📊 What You Should See

### Monitoring Stack
- **Grafana**: Beautiful dashboards with metrics and logs
- **Prometheus**: Time-series metrics collection
- **Loki**: Log aggregation and querying

### Kubernetes
- **Pods**: Multiple backend/frontend instances running
- **Auto-scaling**: Pods increasing under load
- **Health checks**: Self-healing pods
- **Services**: Load balancing across pods

---

## 🐛 Troubleshooting

### Monitoring Issues

```bash
# Check if services are running
docker-compose -f docker-compose.monitoring.yml ps

# View logs
docker-compose -f docker-compose.monitoring.yml logs prometheus
docker-compose -f docker-compose.monitoring.yml logs grafana

# Restart if needed
docker-compose -f docker-compose.monitoring.yml restart
```

### Kubernetes Issues

```bash
# Pod not starting
kubectl describe pod <pod-name> -n urlshortener
kubectl logs <pod-name> -n urlshortener

# Check events
kubectl get events -n urlshortener --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n urlshortener
kubectl top nodes
```

---

## 💡 Pro Tips

1. **Start Simple**: Begin with just the monitoring stack, it's easier
2. **Use Port-Forward**: For K8s testing, port-forward is your friend
3. **Watch Commands**: Use `kubectl get pods -w` to watch changes in real-time
4. **Check Logs First**: When things don't work, always check logs first
5. **Grafana Explore**: The Explore feature in Grafana is great for learning

---

## 📚 Next Steps

Once you're comfortable:
1. Create custom Grafana dashboards
2. Set up alert rules in Prometheus
3. Deploy to a real K8s cluster (GKE, EKS, AKS)
4. Add application metrics endpoints
5. Implement distributed tracing

Enjoy exploring! 🚀
