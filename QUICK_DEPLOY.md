# 🎯 Quick Render Deployment Guide

## Fill Out This Form:

```
┌─────────────────────────────────────────────────────┐
│ New Web Service                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Service Type: [Web Service] ✅                      │
│                                                      │
│ Name: URL-Shortner ✅                               │
│                                                      │
│ Project: URLSHORTNER ✅                             │
│                                                      │
│ Environment: Production ✅                          │
│                                                      │
│ Language: [Docker] ⚠️ CHANGE FROM NODE!            │
│           └─ Select "Docker" from dropdown          │
│                                                      │
│ Branch: main ✅                                     │
│                                                      │
│ Region: Oregon (US West) ✅                         │
│                                                      │
│ Root Directory: ./backend ✅                        │
│                                                      │
│ ┌───────────────────────────────────────────┐      │
│ │ 🐳 Docker Configuration                    │      │
│ ├───────────────────────────────────────────┤      │
│ │ Dockerfile Path:                           │      │
│ │ docker/Dockerfile.backend                  │      │
│ │                                            │      │
│ │ Docker Context:                            │      │
│ │ ./                                         │      │
│ └───────────────────────────────────────────┘      │
│                                                      │
│ Build Command: [EMPTY - DELETE "yarn"] ⚠️          │
│                                                      │
│ Start Command: [EMPTY - DELETE "yarn start"] ⚠️    │
│                                                      │
│ Instance Type:                                       │
│   ○ Free ($0/month) - For testing                  │
│   ○ Starter ($7/month) - For production            │
│                                                      │
│ ┌───────────────────────────────────────────┐      │
│ │ Environment Variables (Already Set ✅)     │      │
│ ├───────────────────────────────────────────┤      │
│ │ PORT                 ••••••••              │      │
│ │ JWT_SECRET          ••••••••              │      │
│ │ ALLOWED_ORIGINS     ••••••••              │      │
│ │ LOG_REQUESTS        ••••••••              │      │
│ │ DB_TYPE             ••••••••              │      │
│ │ DB_HOST             ••••••••              │      │
│ │ DB_PORT             ••••••••              │      │
│ │ DB_USER             ••••••••              │      │
│ │ DB_PASSWORD         ••••••••              │      │
│ │ DB_NAME             ••••••••              │      │
│ │ DB_TLS              ••••••••              │      │
│ └───────────────────────────────────────────┘      │
│                                                      │
│               [Deploy web service]                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## ⚠️ 3 CRITICAL CHANGES:

### 1️⃣ Language: Node → Docker
```
Click the "Node" dropdown
Select: Docker
```

### 2️⃣ Build Command: yarn → [EMPTY]
```
Delete "yarn"
Leave the field completely empty
```

### 3️⃣ Start Command: yarn start → [EMPTY]
```
Delete "yarn start"
Leave the field completely empty
```

## ✅ Then Click "Deploy web service"

---

## What Happens Next?

```
1. Build starts...
   ╔════════════════════════════════════╗
   ║ ==> Building Docker image          ║
   ║ Step 1/8 : FROM denoland/deno...   ║
   ║ Step 2/8 : WORKDIR /app            ║
   ║ ...                                ║
   ╚════════════════════════════════════╝

2. Deploy...
   ╔════════════════════════════════════╗
   ║ ==> Deploying...                   ║
   ║ Starting service...                ║
   ║ Health check passed ✓              ║
   ╚════════════════════════════════════╝

3. Live! 🎉
   ╔════════════════════════════════════╗
   ║ Your service is live at:           ║
   ║ https://url-shortner.onrender.com  ║
   ╚════════════════════════════════════╝
```

---

## 🧪 Test It Immediately

```bash
# 1. Health check
curl https://url-shortner.onrender.com/health

# Expected: {"status":"healthy"}

# 2. Register a user
curl -X POST https://url-shortner.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 3. Login
curl -X POST https://url-shortner.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 🔧 After First Deploy

**Update ALLOWED_ORIGINS:**

1. Go to Render Dashboard
2. Click your service
3. Click "Environment" tab
4. Edit `ALLOWED_ORIGINS`:
   ```
   http://localhost:5173,https://url-shortner.onrender.com
   ```
5. Save (auto-redeploys)

---

## 🚀 That's It!

Your backend is now live on Render!

**Next**: Deploy frontend on Vercel (see README.md)
