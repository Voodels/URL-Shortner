# 🔧 Troubleshooting Guide

## ✅ Issue Fixed: Tailwind Config Error

### Problem
```
error: Uncaught (in promise) ReferenceError: require is not defined
  plugins: [
           ^
    at file:///home/vighnesh/VAULT/CODING/FinalProjects/URLSHORTNER/frontend/tailwind.config.js:70:12
```

### Root Cause
The `tailwind.config.js` file was using CommonJS `require()` syntax, but Deno expects ES modules by default.

### Solution
Changed from:
```javascript
// ❌ CommonJS (doesn't work with Deno)
export default {
  plugins: [
    require("daisyui"),
  ],
};
```

To:
```javascript
// ✅ ES Modules (works with Deno)
import daisyui from "daisyui";

export default {
  plugins: [
    daisyui,
  ],
};
```

### Files Modified
1. `/frontend/tailwind.config.js` - Changed `require()` to `import`
2. `/frontend/deno.json` - Updated `nodeModulesDir: true` to `"auto"`

---

## 🚀 Current Status

### ✅ Frontend
- **Status**: Running successfully
- **URL**: http://localhost:5173
- **Process**: Vite dev server
- **No errors**: Tailwind config fixed

### ✅ Backend
- **Status**: Running successfully
- **URL**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **Response**: `{"status":"healthy","timestamp":"..."}`

---

## 📋 Common Issues & Solutions

### Issue 1: "require is not defined"
**Symptom**: Error about `require` in `.js` config files

**Solution**: Convert to ES modules
```javascript
// Change this:
const plugin = require("package");

// To this:
import plugin from "package";
```

### Issue 2: "Address already in use"
**Symptom**: `AddrInUse: Address already in use (os error 98)`

**Solution**:
```bash
# Find the process using the port
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or kill all Deno processes
pkill deno
```

### Issue 3: Frontend can't connect to backend
**Symptom**: Network errors in browser console

**Check**:
1. Backend is running: `curl http://localhost:8000/health`
2. CORS is configured correctly in `backend/server.ts`
3. Frontend API URL is correct in `frontend/src/api.ts`

### Issue 4: Blank screen / no UI
**Symptom**: White screen, no errors in terminal

**Check**:
1. Open browser DevTools (F12)
2. Check Console for React errors
3. Check Network tab for failed requests
4. Verify `index.html` loads correctly

### Issue 5: npm install errors
**Symptom**: Cannot find packages during `npm install`

**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Issue 6: Deno cache issues
**Symptom**: Old versions of packages being used

**Solution**:
```bash
# Clear Deno cache
deno cache --reload backend/server.ts
cd frontend && deno cache --reload src/main.tsx

# Or clear all
rm -rf ~/.cache/deno
```

### Issue 7: TypeScript errors in IDE
**Symptom**: Red squiggly lines in VS Code

**Solution**:
1. Ensure Deno extension is installed
2. Check `.vscode/settings.json` exists with:
```json
{
  "deno.enable": true,
  "deno.lint": true,
  "deno.unstable": false
}
```
3. Reload VS Code: Cmd/Ctrl + Shift + P → "Reload Window"

---

## 🔍 Debugging Commands

### Check if servers are running
```bash
# Backend
curl http://localhost:8000/health

# Frontend
curl http://localhost:5173
```

### Check ports
```bash
# See what's using port 8000 (backend)
lsof -i :8000

# See what's using port 5173 (frontend)
lsof -i :5173
```

### View logs
```bash
# Backend logs (if using LOG_REQUESTS=true)
# Will show in terminal where backend is running

# Frontend logs
# Open browser DevTools → Console
```

### Test API endpoints
```bash
# Create short URL
curl -X POST http://localhost:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Get original URL
curl http://localhost:8000/shorten/abc123

# Get stats
curl http://localhost:8000/shorten/abc123/stats
```

---

## 🛠️ Development Workflow

### Clean restart
```bash
# Stop all servers
pkill deno

# Clear caches (optional)
cd frontend && rm -rf node_modules .deno

# Reinstall (if needed)
cd frontend && npm install

# Start fresh
./start.sh
```

### Individual server restart
```bash
# Restart backend only
pkill -f "server.ts"
deno task dev:backend

# Restart frontend only
pkill -f "vite"
cd frontend && deno task dev
```

---

## 🌐 Browser Access

### If you see the UI
1. Go to http://localhost:5173
2. You should see:
   - Header: "URL Shortener"
   - Form: "Shorten a URL"
   - Input field
   - Submit button

### If you DON'T see the UI
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab:
   - Should see request to `main.tsx`
   - Should see request to `index.css`
   - All should be 200 OK
4. Check Elements tab:
   - Should see `<div id="root">` with content

---

## 📊 Verify Everything Works

### 1. Backend Health Check
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","timestamp":"..."}
```

### 2. Create a Short URL
```bash
curl -X POST http://localhost:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com"}'
# Should return: {"id":"...","shortCode":"...","url":"https://github.com",...}
```

### 3. Access Short URL
```bash
# Copy the shortCode from step 2, then:
curl http://localhost:8000/shorten/<shortCode>
# Should return: {"url":"https://github.com",...}
```

### 4. Frontend UI Test
1. Open http://localhost:5173
2. Enter "https://google.com" in the input
3. Click "Shorten URL"
4. You should see a card appear with:
   - Original URL
   - Short code
   - Copy button
   - Edit/Delete buttons
   - View Stats button

---

## 🎯 What Changed to Fix Your Issue

### Before (Broken)
```javascript
// tailwind.config.js
export default {
  plugins: [
    require("daisyui"), // ❌ CommonJS - doesn't work with Deno
  ],
};
```

### After (Fixed)
```javascript
// tailwind.config.js
import daisyui from "daisyui"; // ✅ ES Module - works with Deno

export default {
  plugins: [
    daisyui, // ✅ Using imported module
  ],
};
```

### Also Fixed
```json
// frontend/deno.json
{
  "nodeModulesDir": "auto", // ✅ Updated from deprecated "true"
}
```

---

## ✅ Current State

**Both servers are running successfully!**

- ✅ Backend: http://localhost:8000 (health check passing)
- ✅ Frontend: http://localhost:5173 (Vite running)
- ✅ No errors in terminal
- ✅ Tailwind config fixed
- ✅ Ready to use!

---

## 🎉 You Should Now See

When you open http://localhost:5173 in your browser:

1. **Header**: "URL Shortener" in large text
2. **Form Section**:
   - Input field with placeholder "Enter a long URL"
   - "Shorten URL" button
3. **Empty State**: "No URLs yet. Create your first shortened URL above!"

**Try it:**
1. Enter: `https://github.com/denoland/deno`
2. Click "Shorten URL"
3. Watch a card appear with your shortened URL!
4. Click "Copy" to copy to clipboard
5. Click "View Stats" to see access count

---

## 📝 Notes

- The backend is already running (PID shown in lsof output)
- Frontend restarted successfully with fixed Tailwind config
- No need to reinstall packages - everything is cached
- If you still see a blank screen, **hard refresh** your browser: Ctrl+Shift+R or Cmd+Shift+R

---

## 🆘 Still Having Issues?

If you still can't see anything:

1. **Hard refresh browser**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. **Check browser console**: F12 → Console tab
3. **Verify servers**: Run `curl http://localhost:8000/health` and `curl http://localhost:5173`
4. **Restart everything**: `pkill deno && ./start.sh`
5. **Clear browser cache**: Settings → Clear browsing data

If problems persist, share:
- Browser console output (F12 → Console)
- Terminal output where frontend is running
- Any error messages you see
