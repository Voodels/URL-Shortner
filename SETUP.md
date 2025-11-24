# 🚀 Setup Guide - URL Shortener

Complete guide to get your URL Shortener running locally and in production.

## 📋 Quick Setup Checklist

- [ ] Install Deno
- [ ] Install Node.js & npm
- [ ] Create Neon PostgreSQL account
- [ ] Clone repository
- [ ] Configure environment variables
- [ ] Initialize database
- [ ] Install frontend dependencies
- [ ] Start development servers

---

## 1️⃣ Install Prerequisites

### Deno (Backend Runtime)

**macOS/Linux:**
```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

**Windows (PowerShell):**
```powershell
irm https://deno.land/install.ps1 | iex
```

Verify installation:
```bash
deno --version
```

### Node.js & npm (Frontend Build Tool)

Download from: https://nodejs.org/ (LTS version recommended)

Verify installation:
```bash
node --version
npm --version
```

---

## 2️⃣ Setup Neon PostgreSQL Database

### Create Account
1. Go to https://neon.tech/
2. Sign up for free account
3. Create a new project

### Get Connection Details
From your Neon dashboard:
- Click "Connection Details"
- Copy the connection string or individual parameters:
  - Hostname (e.g., `ep-royal-mode-xxx.neon.tech`)
  - Port: `5432`
  - Database: `neondb`
  - Username: Usually `neondb_owner`
  - Password: Shown when you create the project

**⚠️ Important**: Save your password securely!

---

## 3️⃣ Clone and Configure

### Clone Repository
```bash
git clone https://github.com/Voodels/URL-Shortner.git
cd URL-Shortner
```

### Create Environment File
```bash
cp .env.example .env
```

### Edit .env File
Open `.env` in your text editor and update:

```env
# Generate a strong JWT secret
# Run: openssl rand -base64 32
JWT_SECRET=your_generated_secret_here

# Neon Database Configuration
DB_TYPE=postgres
DB_HOST=your-project.neon.tech
DB_PORT=5432
DB_USER=neondb_owner
DB_PASSWORD=your_neon_password
DB_NAME=neondb
DB_TLS=true

# Other settings (defaults are fine for dev)
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
LOG_REQUESTS=true
```

---

## 4️⃣ Initialize Database

Apply the PostgreSQL schema to your Neon database:

```bash
# Replace with your actual Neon credentials
PGPASSWORD='your_password' psql \
  -h your-project.neon.tech \
  -U neondb_owner \
  -d neondb \
  -p 5432 \
  -f database/schema_postgres.sql
```

**Verify it worked:**
```bash
# You should see: CREATE EXTENSION, CREATE TABLE, CREATE INDEX, etc.
```

---

## 5️⃣ Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## 6️⃣ Start Development Servers

### Method 1: Quick Start (Recommended)
```bash
./dev.sh
```

### Method 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
deno run --allow-net --allow-env --allow-read server.ts
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 7️⃣ Verify Everything Works

### Check Backend Health
Open browser or use curl:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status":"healthy","timestamp":"2025-11-24T...","uptime":123.45}
```

### Access Frontend
Open browser: http://localhost:5173

You should see the URL Shortener interface!

### Test Registration
1. Click "Sign Up"
2. Create an account
3. Try creating a short URL

---

## 🔧 Troubleshooting

### Backend won't start
**Check:**
- `.env` file exists and has correct database credentials
- Neon database is accessible (not paused)
- All environment variables are set correctly

**Test connection:**
```bash
psql "postgresql://user:password@host:5432/neondb?sslmode=require"
```

### Frontend build errors
**Fix:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database schema errors
**Re-apply schema:**
```bash
# First, check current database state
psql "..." -c "\dt"

# If needed, drop and recreate (⚠️ loses data!)
psql "..." -f database/schema_postgres.sql
```

### Port already in use
**Change ports in `.env`:**
```env
PORT=8001  # or any free port
```

**For frontend, edit `frontend/vite.config.ts`:**
```typescript
server: {
  port: 5174,  // or any free port
  // ...
}
```

---

## 🌐 Production Deployment

### Backend (Deno Deploy / Railway / Fly.io)

1. Set environment variables on your platform
2. Deploy with:
   ```bash
   deno run --allow-net --allow-env --allow-read backend/server.ts
   ```

### Frontend (Vercel / Netlify / Cloudflare Pages)

1. Build:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the `frontend/dist/` directory

### Environment Variables for Production

**Critical Changes:**
- Generate new `JWT_SECRET`: `openssl rand -base64 32`
- Update `ALLOWED_ORIGINS` to your actual domain
- Ensure `DB_TLS=true` for Neon
- Consider `LOG_REQUESTS=false` for performance

---

## 📊 Database Management

### Backup
```bash
# Export data
pg_dump "postgresql://..." > backup.sql

# Or use Neon's built-in branching feature!
```

### View Tables
```bash
psql "..." -c "\dt"
```

### Query Data
```bash
# Count URLs
psql "..." -c "SELECT COUNT(*) FROM urls;"

# View users
psql "..." -c "SELECT id, email, created_at FROM users;"
```

---

## 🆘 Need Help?

- **Issues**: https://github.com/Voodels/URL-Shortner/issues
- **Deno Docs**: https://deno.land/manual
- **Neon Docs**: https://neon.tech/docs/introduction
- **React Docs**: https://react.dev/

---

## ✅ Success Checklist

After setup, you should have:
- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:5173
- ✅ Health endpoint returns "healthy" status
- ✅ Can create account and login
- ✅ Can create short URLs
- ✅ URLs are saved in Neon database
- ✅ Can organize URLs with categories

---

**🎉 Congratulations! Your URL Shortener is ready!**
