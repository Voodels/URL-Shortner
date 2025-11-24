# URL Shortener

A URL shortening service built with Deno, TypeScript, React, and DaisyUI.

## Demo

### Login Page
![Login Page](image.png)

### Dashboard
![Dashboard](image-1.png)

### URL Management
![URL Management](image-2.png)

## Features

- User authentication (register/login)
- Create, update, and delete shortened URLs
- View analytics and access counts
- RESTful API with proper HTTP status codes
- Input validation and CORS support
- Responsive UI with theme switching
- Repository pattern for easy database swapping

## Architecture

The backend uses a repository pattern to abstract data access from business logic. This makes it easy to swap the in-memory store with a real database like PostgreSQL or MongoDB.

The frontend uses React with context providers for authentication and theming. Components follow a simple parent-child data flow pattern.

## API Endpoints

- `POST /shorten` - Create a shortened URL
- `GET /shorten/:code` - Get original URL by short code
- `PUT /shorten/:code` - Update a shortened URL
- `DELETE /shorten/:code` - Delete a shortened URL
- `GET /shorten/:code/stats` - Get access statistics
- `GET /health` - Health check endpoint

## Getting Started

### Prerequisites
- Deno 1.40 or higher

### Installation

```bash
git clone <repository-url>
cd URLSHORTNER
```

### Running the Application

Start both backend and frontend:
```bash
./scripts/start.sh
```

Or start them separately:

Backend (runs on http://localhost:8000):
```bash
deno task dev:backend
```

Frontend (runs on http://localhost:5173):
```bash
deno task dev:frontend
```

### Docker Deployment

Start all services with Docker:
```bash
cd docker
docker-compose up -d
```

Or use the helper script:
```bash
./scripts/start-all.sh
```

### Configuration

Optional `.env` file:
```env
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173
LOG_REQUESTS=true
VITE_API_URL=http://localhost:8000
```

## Project Structure

```
URLSHORTNER/
├── backend/               # Backend API server
│   ├── server.ts         # HTTP server and middleware
│   ├── routes.ts         # API route handlers
│   ├── store.ts          # In-memory repository
│   ├── mysql-store.ts    # MySQL repository implementation
│   └── types.ts          # TypeScript types
├── frontend/              # React frontend
│   ├── src/
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── components/
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker/                # Docker configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── docker-compose.full.yml
│   └── nginx.conf
├── deployment/            # Deployment configurations
│   └── k8s/              # Kubernetes manifests
├── database/              # Database schemas and migrations
├── monitoring/            # Monitoring setup (Prometheus, Grafana)
├── scripts/               # Utility scripts
│   ├── start.sh          # Start dev servers
│   ├── start-all.sh      # Start all services with Docker
│   ├── stop-all.sh       # Stop all services
│   ├── deploy.sh         # Deploy to production
│   └── backup.sh         # Backup database
├── docs/                  # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   └── TESTING_GUIDE.md
└── README.md
```

## Tech Stack

- **Backend**: Deno, TypeScript
- **Frontend**: React, Vite, DaisyUI, Tailwind CSS
- **Database**: In-memory (with MySQL implementation available)

## License

MIT
