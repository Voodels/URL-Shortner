# Development Guide

## Quick Start

### Prerequisites
- Deno 1.40+ installed
- Git (optional)

### Start Development Servers

**Option 1: Using the startup script (Recommended)**
```bash
chmod +x start.sh
./start.sh
```

**Option 2: Manual start**

Terminal 1 (Backend):
```bash
deno task dev:backend
```

Terminal 2 (Frontend):
```bash
cd frontend
npm install  # First time only for DaisyUI and Tailwind
deno task dev
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Health Check: http://localhost:8000/health

## Development Workflow

### Making Changes
- First run? Register a user via the hero form or curl `POST /auth/register`, then sign in to unlock the dashboard.
2. Server auto-restarts (watch mode enabled)
3. Test endpoints using browser or curl

#### Frontend Changes
1. Edit files in `frontend/src/` directory
4. Use the floating theme toggle to verify light/dark palettes after CSS tweaks
2. Vite HMR updates instantly in browser
3. Check browser console for errors

### Code Style
- TypeScript strict mode enabled
- Deno linting enabled
- Format on save configured in VSCode

## Testing API Endpoints

### Create Short URL
```bash
curl -X POST http://localhost:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com/very/long/url"}'
```

### Get URL
```bash
curl http://localhost:8000/shorten/abc123
```

### Update URL
```bash
curl -X PUT http://localhost:8000/shorten/abc123 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com/updated/url"}'
```

### Delete URL
```bash
curl -X DELETE http://localhost:8000/shorten/abc123
```

### Get Statistics
└── types.ts         # TypeScript types and validation
├── mysql-store.ts   # MySQL-backed repository
curl http://localhost:8000/shorten/abc123/stats
```

## Troubleshooting

│   ├── main.tsx           # Entry point
│   ├── index.css          # Global styles + hero utilities
│   ├── AuthContext.tsx    # Authentication provider
│   ├── ThemeContext.tsx   # Theme palette provider
│   └── components/        # React components (forms, cards, animated background, theme toggle)
- Check for syntax errors in backend files

### Frontend won't start
- Check if port 5173 is already in use: `lsof -i :5173`
- Clear node_modules and reinstall: `cd frontend && rm -rf node_modules && npm install`
- Check Deno cache: `deno cache --reload frontend/src/main.tsx`

### CORS Errors
- Ensure backend is running on port 8000
- Check ALLOWED_ORIGINS in backend/server.ts
- Verify frontend is accessing correct API URL

### TypeScript Errors
- Run `deno cache` to update dependencies
- Check deno.json configuration
- Verify import paths are correct

## Building for Production

### Backend
```bash
# No build needed for backend - Deno runs TypeScript directly
deno run --allow-net --allow-env backend/server.ts
```

### Frontend
```bash
cd frontend
deno task build
```

Built files will be in `frontend/dist/`

### Serve Production Build
```bash
cd frontend
deno task preview
```

## Environment Variables

Create `.env` file in project root:

```env
# Backend Configuration
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_REQUESTS=true

# Frontend Configuration (create .env in frontend/)
VITE_API_URL=http://localhost:8000
```

## Project Structure Explained

```
backend/
├── server.ts    # HTTP server, middleware, routing
├── routes.ts    # API endpoint handlers
├── store.ts     # Data repository (in-memory)
└── types.ts     # TypeScript types and validation

backend/
├── server.ts        # HTTP server, auth middleware, routing
├── routes.ts        # API endpoint handlers
├── store.ts         # Data repository (in-memory)
├── mysql-store.ts   # MySQL-backed repository
└── types.ts         # TypeScript types and validation
│   └── components/    # React components
├── index.html         # HTML template
├── vite.config.ts     # Vite configuration
│   ├── api.ts             # API client
│   ├── App.tsx            # Auth-aware app shell
│   ├── main.tsx           # Entry point
│   ├── index.css          # Global styles + hero utilities
│   ├── AuthContext.tsx    # Authentication provider
│   ├── ThemeContext.tsx   # Theme palette provider
│   └── components/        # React components (forms, cards, animated background, theme toggle)
- Input validation on all endpoints
- CORS configuration
- Cryptographic random number generation
- No sensitive data in error messages

### Scalability
- Repository pattern for easy database swap
- Middleware pipeline for extensibility
- Modular component architecture

### Code Quality
- Comprehensive inline comments
- TypeScript strict mode
- Error handling at all layers
- Defensive programming practices

### Performance
- Optimistic UI updates
- Efficient data structures (Maps for O(1) lookups)
- Code splitting in production build
- Lazy loading of statistics

## Next Steps

1. **Add Database**: Replace InMemoryURLRepository with PostgreSQL/MongoDB
2. **Add Authentication**: Implement user authentication
3. **Add Tests**: Unit tests, integration tests, E2E tests
4. **Add Analytics**: Enhanced tracking (geo, referrer, device)
5. **Add Rate Limiting**: Prevent abuse
6. **Add Custom Domains**: Allow users to use their domains
7. **Add QR Codes**: Generate QR codes for URLs
8. **Add URL Expiration**: Time-limited short URLs

## Resources

- [Deno Documentation](https://deno.land/manual)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [DaisyUI Components](https://daisyui.com/components)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
