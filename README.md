# 🔗 URL Shortener

A modern, full-stack URL shortening service with user authentication, categories, and analytics. Built with Deno, React, and PostgreSQL (Neon).

## ✨ Features

- 🔐 **User Authentication** - Register, login with JWT tokens
- 📊 **Analytics** - Track access counts and view statistics
- 🏷️ **Categories** - Organize URLs into custom categories
- 🎨 **Modern UI** - Beautiful, responsive interface with dark mode
- ⚡ **Fast & Scalable** - Built on Deno and Neon PostgreSQL
- 🔒 **Secure** - CORS protection, input validation, password hashing

## 🚀 Quick Start

### Prerequisites

- [Deno](https://deno.land/) 1.40 or higher
- [Node.js](https://nodejs.org/) 18+ and npm
- [Neon PostgreSQL](https://neon.tech/) account (free tier available)

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/Voodels/URL-Shortner.git
cd URL-Shortner

# Copy environment file
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your Neon PostgreSQL credentials:

```env
# Application
PORT=8000
JWT_SECRET=your_secret_key_here  # Generate with: openssl rand -base64 32
ALLOWED_ORIGINS=http://localhost:5173
LOG_REQUESTS=true

# Database - Get from https://console.neon.tech
DB_TYPE=postgres
DB_HOST=your-project.neon.tech
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=neondb
DB_TLS=true
```

### 3. Initialize Database

```bash
# Apply schema to your Neon database
PGPASSWORD='your_password' psql -h your-project.neon.tech -U your_username -d neondb -p 5432 -f database/schema_postgres.sql
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Start Development Servers

```bash
# Option 1: Use the dev script
./dev.sh

# Option 2: Start manually
# Terminal 1 - Backend
cd backend
deno run --allow-net --allow-env --allow-read server.ts

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Health Check: http://localhost:8000/health

## 📁 Project Structure

```
.
├── backend/              # Deno backend API
│   ├── server.ts        # Main server entry point
│   ├── routes.ts        # API route handlers
│   ├── database.ts      # Database configuration
│   ├── postgres-store.ts # PostgreSQL repository
│   ├── auth-service.ts  # Authentication logic
│   └── types.ts         # TypeScript type definitions
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.tsx      # Main app component
│   │   ├── components/  # React components
│   │   └── api.ts       # API client
│   └── package.json
│
├── database/            # Database schemas
│   ├── schema_postgres.sql  # PostgreSQL schema
│   └── schema.sql           # Original MySQL schema
│
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment template
├── dev.sh              # Development startup script
└── README.md           # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /me` - Get current user info

### URLs
- `POST /shorten` - Create short URL
- `GET /shorten/:shortCode` - Get URL details
- `PUT /shorten/:shortCode` - Update URL
- `DELETE /shorten/:shortCode` - Delete URL
- `GET /urls` - Get user's URLs
- `GET /shorten/:shortCode/stats` - Get URL statistics
- `GET /:shortCode` - Redirect to original URL

### Categories
- `GET /categories` - Get user's categories
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category
- `POST /shorten/:shortCode/categories` - Add categories to URL
- `DELETE /shorten/:shortCode/categories` - Remove categories from URL

## 🏗️ Tech Stack

### Backend
- **Runtime**: Deno 1.40+
- **Database**: PostgreSQL (Neon)
- **Auth**: JWT tokens with bcrypt
- **CORS**: Configurable origin support

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: TailwindCSS + DaisyUI
- **State**: React Context API

## 🚢 Deployment

### Backend Deployment (Deno Deploy / Any Deno host)

```bash
# Ensure environment variables are set on your platform
# Deploy backend with:
deno run --allow-net --allow-env --allow-read backend/server.ts
```

### Frontend Deployment (Vercel / Netlify / Cloudflare Pages)

```bash
cd frontend
npm run build
# Deploy the dist/ folder
```

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `8000` |
| `JWT_SECRET` | Secret for JWT token signing | Generate with `openssl rand -base64 32` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `http://localhost:5173,https://yourdomain.com` |
| `LOG_REQUESTS` | Enable request logging | `true` or `false` |
| `DB_TYPE` | Database type | `postgres`, `mysql`, or `memory` |
| `DB_HOST` | Database hostname | `your-project.neon.tech` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database username | `your_username` |
| `DB_PASSWORD` | Database password | `your_password` |
| `DB_NAME` | Database name | `neondb` |
| `DB_TLS` | Enable TLS connection | `true` (recommended for Neon) |

## 🔐 Security Notes

- Always use strong, unique `JWT_SECRET` in production
- Never commit `.env` to version control
- Use HTTPS in production
- Set `ALLOWED_ORIGINS` to your actual domain(s)
- Enable `DB_TLS=true` for secure database connections

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Deno](https://deno.land/)
- Database hosted on [Neon](https://neon.tech/)
- UI components from [DaisyUI](https://daisyui.com/)

---

Made with ❤️ by [Voodels](https://github.com/Voodels)
