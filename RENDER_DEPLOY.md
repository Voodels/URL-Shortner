# 🚀 Render Deployment Checklist

## 🚨 MOST IMPORTANT: Use Docker Runtime!

**❌ DO NOT use Node.js runtime - it doesn't have Deno!**
**✅ MUST use Docker runtime - it includes Deno in the container!**

---

## ✅ What You Need to Fill in Render Form

### Basic Configuration
- [x] **Service Name**: `URL-Shortner` ✅
- [x] **Project**: `URLSHORTNER` ✅
- [x] **Environment**: `Production` ✅
- [x] **Branch**: `main` ✅
- [x] **Region**: `Oregon (US West)` ✅

### ⚠️ CRITICAL CHANGES

#### 1. Runtime/Language Setting (MOST IMPORTANT!)
```
❌ WRONG: Node.js (will fail with "deno: command not found")
✅ CORRECT: Docker (has Deno installed)
```

**This is the #1 reason for deployment failures!**

#### 2. Docker Configuration
```
Dockerfile Path: docker/Dockerfile.backend
Docker Context: ./
```

#### 3. Build & Start Commands
```
Build Command: [Leave Empty - Docker handles it]
Start Command: [Leave Empty - Dockerfile has CMD]
```

#### 4. Root Directory
```
Root Directory: ./backend
```
(This is already set correctly ✅)

---

## 🔐 Environment Variables (Already Set ✅)

All your environment variables are already filled in! Just verify:

- ✅ PORT=8000
- ✅ JWT_SECRET=••••••••••••
- ✅ ALLOWED_ORIGINS=••••••••••••
- ✅ LOG_REQUESTS=true
- ✅ DB_TYPE=postgres
- ✅ DB_HOST=••••••••••••
- ✅ DB_PORT=5432
- ✅ DB_USER=••••••••••••
- ✅ DB_PASSWORD=••••••••••••
- ✅ DB_NAME=neondb
- ✅ DB_TLS=true

---

## 💰 Instance Type Selection

### For Testing (Free Tier)
- **Free**: $0/month
  - ⚠️ Spins down after 15 minutes of inactivity
  - Takes ~30 seconds to wake up on first request
  - Perfect for testing/demo

### For Production (Recommended)
- **Starter**: $7/month
  - ✅ Always running (no spin-down)
  - ✅ 512 MB RAM, 0.5 CPU
  - ✅ SSH access
  - ✅ Zero downtime deploys

---

## 📋 Step-by-Step Instructions

### Step 1: Change Language to Docker
1. Find the **"Language"** dropdown (currently shows "Node")
2. Click it
3. Select **"Docker"**

### Step 2: Set Docker Configuration
In the form fields:
```
Dockerfile Path: docker/Dockerfile.backend
Docker Context: ./
```

### Step 3: Clear Build/Start Commands
- **Build Command**: Delete "yarn" → Leave **empty**
- **Start Command**: Delete "yarn start" → Leave **empty**

### Step 4: Verify Environment Variables
Scroll down and check all 11 environment variables are set (they should be!)

### Step 5: Select Instance Type
- For testing: Select **"Free"**
- For production: Select **"Starter"**

### Step 6: Deploy!
Click the big blue **"Deploy web service"** button at the bottom

---

## ⏱️ After Clicking Deploy

1. **Wait 2-5 minutes** for build to complete
2. **Watch the logs** - you'll see:
   ```
   ==> Building...
   ==> Downloading base image
   ==> Building Docker image
   ==> Deploying...
   ==> Your service is live! 🎉
   ```

3. **Get your URL** - It will be something like:
   ```
   https://url-shortner.onrender.com
   ```

4. **Test it immediately**:
   ```bash
   curl https://url-shortner.onrender.com/health
   ```

   Expected response:
   ```json
   {"status":"healthy","timestamp":"2025-11-24T...","uptime":123.45}
   ```

---

## 🔧 After First Successful Deploy

### Update ALLOWED_ORIGINS
1. Go to your service in Render Dashboard
2. Click **"Environment"** tab
3. Find `ALLOWED_ORIGINS` variable
4. Click **Edit**
5. Add your Render URL:
   ```
   http://localhost:5173,https://url-shortner.onrender.com
   ```
6. Click **Save**
7. Service will auto-redeploy (takes ~1 minute)

---

## 🧪 Test Your API

Once deployed, test these endpoints:

### Health Check
```bash
curl https://url-shortner.onrender.com/health
```

### Register User
```bash
curl -X POST https://url-shortner.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Login
```bash
curl -X POST https://url-shortner.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🚨 Troubleshooting

### Build Fails
**Check:**
- Dockerfile path is correct: `docker/Dockerfile.backend`
- Docker context is `./` (not `./backend`)
- Repository root contains `docker/` folder

### Service Won't Start
**Check logs for:**
- Database connection errors
- Missing environment variables
- Port binding issues

### Can't Connect to Database
**Verify:**
- DB_HOST is correct (from Neon dashboard)
- DB_PASSWORD is correct
- DB_TLS=true is set
- Neon project is not paused

### CORS Errors
**Solution:**
Update `ALLOWED_ORIGINS` to include your Render URL!

---

## ✅ Success Checklist

- [ ] Language changed to "Docker"
- [ ] Dockerfile path set to `docker/Dockerfile.backend`
- [ ] Build command cleared (empty)
- [ ] Start command cleared (empty)
- [ ] All 11 environment variables present
- [ ] Instance type selected (Free or Starter)
- [ ] Clicked "Deploy web service"
- [ ] Build completed successfully (check logs)
- [ ] Health endpoint responds
- [ ] Updated ALLOWED_ORIGINS with Render URL
- [ ] Can register/login users
- [ ] Can create short URLs

---

## 🎉 You're Done!

Once all checks pass, your backend is live on Render!

**Next step**: Deploy frontend on Vercel (see README.md)

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **Deno Docs**: https://deno.land/manual
- **Your Render Dashboard**: https://dashboard.render.com/
- **GitHub Issues**: https://github.com/Voodels/URL-Shortner/issues
