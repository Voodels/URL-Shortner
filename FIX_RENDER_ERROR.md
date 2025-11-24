# 🚨 Fix: "deno: command not found" Error

## The Problem

You're seeing this error:
```
bash: line 1: deno: command not found
```

**Why?** You selected **Node.js** as the runtime, but Deno is not available in Node.js environments!

---

## ✅ The Solution: Use Docker

You need to **delete the current service** and create a new one with **Docker** as the runtime.

---

## 🔄 Steps to Fix

### Step 1: Delete Current Service

1. Go to https://dashboard.render.com/
2. Find your service: `URL-Shortner` or `url-shortener-backend`
3. Click on it
4. Go to **Settings** (bottom left)
5. Scroll to bottom → Click **"Delete Web Service"**
6. Confirm deletion

### Step 2: Create New Service with Docker

1. Click **"New +"** → **"Web Service"**
2. Connect to GitHub repo: `Voodels/URL-Shortner`
3. Fill in the form:

```
┌──────────────────────────────────────────────┐
│ Service Configuration                         │
├──────────────────────────────────────────────┤
│                                               │
│ Name: url-shortener-backend                  │
│                                               │
│ Region: Oregon (US West)                     │
│                                               │
│ Branch: main                                 │
│                                               │
│ ⚠️ Runtime: Docker (NOT Node.js!)           │
│    └─ This is the KEY setting!              │
│                                               │
│ Root Directory: (leave empty)                │
│                                               │
└──────────────────────────────────────────────┘
```

### Step 3: Configure Docker Build

When you select **Docker**, new fields appear:

```
┌──────────────────────────────────────────────┐
│ Docker Configuration                          │
├──────────────────────────────────────────────┤
│                                               │
│ Dockerfile Path:                             │
│ docker/Dockerfile.backend                    │
│                                               │
│ Docker Context:                              │
│ ./                                           │
│                                               │
│ Docker Command: (leave empty)                │
│                                               │
└──────────────────────────────────────────────┘
```

### Step 4: Set Environment Variables

Click **"Add from .env"** or manually add:

```
PORT=8000
JWT_SECRET=hKj9mP3vL8qN2wR5tY6uI1oP4sA7dF0gH3jK6lM9nB2cV5xZ8
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
LOG_REQUESTS=true
DB_TYPE=postgres
DB_HOST=ep-royal-mode-adx7mc1o-pooler.c-2.us-east-1.aws.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASSWORD=npg_GTSCJ9ApnEd1
DB_NAME=neondb
DB_TLS=true
```

### Step 5: Select Instance Type

- **Free**: For testing (spins down after 15min inactivity)
- **Starter ($7/mo)**: For production (always on)

### Step 6: Deploy!

Click **"Create Web Service"**

---

## ✅ What You Should See

```
==> Cloning from https://github.com/Voodels/URL-Shortner
==> Checking out commit...
==> Building Docker image...
FROM denoland/deno:1.45.5 AS base
Step 1/8 : FROM denoland/deno:1.45.5 AS base
Step 2/8 : WORKDIR /app
Step 3/8 : COPY deno.json .
...
==> Build successful 🎉
==> Deploying...
==> Your service is live at https://url-shortener-backend.onrender.com
```

---

## 🧪 Test After Deploy

```bash
# Health check
curl https://url-shortener-backend.onrender.com/health

# Expected: {"status":"healthy","timestamp":"...","uptime":...}
```

---

## 🎯 Quick Reference

| Setting | Correct Value |
|---------|--------------|
| **Runtime** | ⚠️ **Docker** (NOT Node.js!) |
| **Dockerfile Path** | `docker/Dockerfile.backend` |
| **Docker Context** | `./` |
| **Root Directory** | (empty) |
| **Docker Command** | (empty) |

---

## 💡 Why Docker?

- ✅ Deno is **not available** in Node.js runtime
- ✅ Docker runtime lets us use `denoland/deno` image
- ✅ Our `Dockerfile.backend` already has everything configured
- ✅ No build/start commands needed (Dockerfile handles it)

---

## 🆘 Still Having Issues?

Check:
- [ ] Runtime is set to **Docker** (not Node.js)
- [ ] Dockerfile path: `docker/Dockerfile.backend`
- [ ] Docker context: `./`
- [ ] All environment variables are set
- [ ] Repository has `docker/Dockerfile.backend` file

**Need help?** Open an issue: https://github.com/Voodels/URL-Shortner/issues
