# 🔗 URL Shortener Service

A modern, production-ready URL shortening service built with **Deno**, **TypeScript**, **React**, and **DaisyUI**. This project demonstrates best practices in software architecture, security, scalability, and code quality.

## ✨ Features

### Core Functionality
- ✅ **Register & sign in** with secure email/password authentication
- ✅ **Create** shortened URLs from long URLs
- ✅ **Retrieve** original URLs from short codes
- ✅ **Update** existing shortened URLs
- ✅ **Delete** shortened URLs
- ✅ **Analytics** - Track access counts and statistics
- ✅ **Redirect** to original URLs with analytics tracking

### Technical Highlights
- 🏗️ **RESTful API** with proper HTTP status codes
- 🔒 **Secure** - Input validation, CORS, cryptographically random short codes, hashed credentials
- 📈 **Scalable** - Repository pattern ready for database integration
- 🎨 **Modern UI** - Responsive design with DaisyUI components, animated backgrounds, and theme palettes
- 📝 **Type-Safe** - Full TypeScript coverage
- 🧪 **Production-Ready** - Error handling, logging, monitoring hooks

## 🏛️ Architecture & Design Patterns

### Backend Architecture

#### **Repository Pattern**
- **Why**: Abstracts data access layer from business logic
- **Benefit**: Easy to swap in-memory store with PostgreSQL/MongoDB/Redis
- **Location**: `backend/store.ts`

```typescript
// Interface-based design allows multiple implementations
interface URLRepository {
  create(url: ShortenedURL): Promise<ShortenedURL>;
  findByShortCode(shortCode: string): Promise<ShortenedURL | null>;
  // ... other methods
}
```

#### **Middleware Pipeline**
- **CORS Middleware**: Secure cross-origin requests
- **Logging Middleware**: Request/response tracking
- **Error Boundary**: Centralized error handling
- **Why**: Composable, testable, reusable request processing

#### **Strong Typing**
- **DTOs (Data Transfer Objects)**: Separate API contracts from domain models
- **Validation Functions**: Runtime type checking with compile-time safety
- **Why**: Catches errors at compile-time, prevents runtime bugs

### Frontend Architecture

#### **Component Composition**
- **App**: Auth-gated experience orchestrating hero, stats, and CRUD flows
- **URLForm**: Handles URL creation/editing with validation
- **URLCard**: Displays URL with actions (copy, edit, delete, stats)
- **ThemeToggle**: Floating command palette for light/dark and accent themes
- **AnimatedBackground**: GPU-accelerated gradient canvas responding to active theme
- **AuthContext & ThemeContext**: Provide authentication and theming state across the tree

#### **Unidirectional Data Flow**
- **Props Down**: Parent passes data to children
- **Events Up**: Children notify parent of changes
- **Why**: Predictable state management, easier debugging

#### **Optimistic UI**
- **Immediate Feedback**: UI updates before API confirmation
- **Error Recovery**: Rollback on failure
- **Why**: Better perceived performance

## 🔐 Security Features

### Input Validation
```typescript
// Multi-layer validation prevents injection attacks
validateURL(url: string): string[] {
  // 1. Type checking
  // 2. Length limits (prevent DoS)
  // 3. URL format validation
  // 4. Protocol whitelist (only HTTP/HTTPS)
  // 5. Hostname validation
}
```

### Cryptographic Randomness
```typescript
// Uses Web Crypto API for unpredictable short codes
// Prevents enumeration attacks
crypto.getRandomValues(randomValues);
```

### CORS Configuration
- Whitelist-based origin validation
- Configurable via environment variables
- Preflight request handling

### Error Handling
- No internal error details leaked to client
- User-friendly error messages
- Detailed server-side logging

## 📊 API Endpoints

### Create Short URL
```http
POST /shorten
Content-Type: application/json

{
  "url": "https://www.example.com/very/long/url"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid-here",
  "url": "https://www.example.com/very/long/url",
  "shortCode": "abc123",
  "createdAt": "2021-09-01T12:00:00Z",
  "updatedAt": "2021-09-01T12:00:00Z",
  "accessCount": 0
}
```

### Get Original URL
```http
GET /shorten/abc123
```

**Response**: `200 OK`
```json
{
  "id": "uuid-here",
  "url": "https://www.example.com/very/long/url",
  "shortCode": "abc123",
  "createdAt": "2021-09-01T12:00:00Z",
  "updatedAt": "2021-09-01T12:00:00Z",
  "accessCount": 10
}
```

### Update Short URL
```http
PUT /shorten/abc123
Content-Type: application/json

{
  "url": "https://www.example.com/updated/url"
}
```

**Response**: `200 OK`

### Delete Short URL
```http
DELETE /shorten/abc123
```

**Response**: `204 No Content`

### Get Statistics
```http
GET /shorten/abc123/stats
```

**Response**: `200 OK`
```json
{
  "id": "uuid-here",
  "url": "https://www.example.com/very/long/url",
  "shortCode": "abc123",
  "createdAt": "2021-09-01T12:00:00Z",
  "updatedAt": "2021-09-01T12:00:00Z",
  "accessCount": 42
}
```

### Health Check
```http
GET /health
```

**Response**: `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2021-09-01T12:00:00Z",
  "uptime": 123456.789
}
```

## 🚀 Getting Started

### Prerequisites
- **Deno** 1.40+ ([Install Deno](https://deno.land/manual/getting_started/installation))

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd URLSHORTNER
```

2. **No dependencies to install!** Deno manages dependencies automatically.

### Development

#### Start Backend (Terminal 1)
```bash
deno task dev:backend
```
Backend will run on `http://localhost:8000`

#### Start Frontend (Terminal 2)
```bash
deno task dev:frontend
```
Frontend will run on `http://localhost:5173`

#### Or use the convenience script
```bash
./start.sh
```

### Environment Variables

Create a `.env` file for configuration (optional):

```env
# Backend
PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_REQUESTS=true

# Frontend
VITE_API_URL=http://localhost:8000
```

## 📁 Project Structure

```
URLSHORTNER/
├── backend/
│   ├── server.ts          # HTTP server, auth & middleware pipeline
│   ├── routes.ts          # API route handlers
│   ├── store.ts           # In-memory repository
│   ├── mysql-store.ts     # MySQL-backed repository
│   └── types.ts           # TypeScript types & validation
├── frontend/
│   ├── src/
│   │   ├── api.ts             # API client
│   │   ├── App.tsx            # Auth-aware main component
│   │   ├── AuthContext.tsx    # Authentication provider
│   │   ├── ThemeContext.tsx   # Theme + palette provider
│   │   ├── main.tsx           # Entry point
│   │   ├── index.css          # Global styles
│   │   └── components/
│   │       ├── AnimatedBackground.tsx  # Hero backdrop animations
│   │       ├── ThemeToggle.tsx         # Floating theme switcher
│   │       ├── URLForm.tsx             # URL creation/edit form
│   │       └── URLCard.tsx             # URL display card
│   ├── index.html         # HTML template
│   ├── vite.config.ts     # Vite configuration
│   ├── tailwind.config.js # Tailwind configuration
│   └── deno.json          # Frontend Deno config
├── deno.json              # Root Deno config
├── README.md              # This file
└── start.sh               # Development startup script
```

## 🎨 UI/UX Features

- **Responsive Design**: Works on mobile, tablet, and desktop
- **Cinematic hero**: Animated gradients, glowing headline typography, and call-to-action badges for guests
- **Auth-first onboarding**: Inline register/login card with polished validation states
- **Real-time Feedback**: Loading states, success/error messages
- **Accessibility**: ARIA labels, keyboard navigation, focus management
- **Copy to Clipboard**: One-click URL copying
- **Statistics Panel**: Toggle to view detailed metrics
- **Theme Command Palette**: Floating menu with light/dark toggle and curated accent palettes

## 🔧 Code Quality Features

### Comprehensive Comments
Every file includes:
- **Architecture rationale**: Why this design pattern?
- **Security considerations**: How is this secure?
- **Scalability notes**: How does this scale?
- **Future enhancements**: What's next?

### Best Practices Demonstrated

#### **Error Handling**
```typescript
// Multiple error types for specific handling
class ValidationError extends Error { }
class NotFoundError extends Error { }

// Centralized error handler
function handleError(error: unknown): Response {
  if (error instanceof ValidationError) return 400;
  if (error instanceof NotFoundError) return 404;
  return 500;
}
```

#### **Type Safety**
```typescript
// Type guards ensure runtime safety
function validateCreateURLRequest(request: unknown): asserts request is CreateURLRequest {
  // Runtime validation with compile-time types
}
```

#### **Immutability**
```typescript
// Defensive copying prevents external mutation
async findByShortCode(shortCode: string): Promise<ShortenedURL | null> {
  const url = this.store.get(shortCode);
  return url ? { ...url } : null; // Return copy, not reference
}
```

#### **Collision Handling**
```typescript
// Retry logic for short code generation
for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  const shortCode = generateRandomCode();
  if (!await exists(shortCode)) return shortCode;
}
```

## 🚀 Production Deployment

### Database Integration
Replace `InMemoryURLRepository` with a database implementation:

```typescript
// Example: PostgreSQL implementation
class PostgresURLRepository implements URLRepository {
  async create(url: ShortenedURL): Promise<ShortenedURL> {
    const result = await db.query(
      'INSERT INTO urls (...) VALUES (...)',
      [url.id, url.url, url.shortCode, ...]
    );
    return result.rows[0];
  }
  // ... other methods
}

// Swap implementation (no code changes needed elsewhere!)
export const urlRepository: URLRepository = new PostgresURLRepository();
```

### Environment Configuration
- Set `PORT` for production port
- Configure `ALLOWED_ORIGINS` with production domain
- Set `VITE_API_URL` to production API endpoint

### Docker Deployment
```dockerfile
# Example Dockerfile
FROM denoland/deno:1.40.0

WORKDIR /app
COPY . .

RUN deno cache backend/server.ts

EXPOSE 8000
CMD ["deno", "run", "--allow-net", "--allow-env", "backend/server.ts"]
```

### Recommended Enhancements for Production

1. **Authentication**: Add user authentication (JWT, OAuth)
2. **Rate Limiting**: Prevent abuse with rate limiting
3. **Custom Domains**: Allow users to use custom domains
4. **Analytics Dashboard**: Detailed click analytics
5. **URL Expiration**: Set expiry dates for URLs
6. **QR Codes**: Generate QR codes for short URLs
7. **Bulk Operations**: Create multiple URLs at once
8. **API Keys**: Programmatic API access
9. **Webhooks**: Notify on URL events
10. **CDN Integration**: Serve static content from CDN

## 📚 Learning Resources

This project demonstrates concepts from:
- **Clean Architecture** by Robert C. Martin
- **Domain-Driven Design** principles
- **SOLID Principles** in practice
- **REST API Design Best Practices**
- **TypeScript Advanced Patterns**
- **React Best Practices**
- **Web Security Fundamentals**

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Database implementations (PostgreSQL, MongoDB, Redis)
- Authentication system
- Advanced analytics
- Rate limiting
- Caching layer
- API documentation (OpenAPI/Swagger)
- Unit tests
- Integration tests
- E2E tests

## 📝 License

MIT License - Feel free to use this project for learning and production!

## 🎯 Why This Project Stands Out

### 1. **Production-Ready Architecture**
Not just a simple CRUD app - demonstrates enterprise-level design patterns and practices.

### 2. **Security-First Design**
Every endpoint validates input, every error is handled gracefully, every random value is cryptographically secure.

### 3. **Scalability Built-In**
Repository pattern, middleware pipeline, and modular design make it easy to scale from MVP to production.

### 4. **Comprehensive Documentation**
Over 1000 lines of inline comments explaining *why*, not just *what*. Learn by reading the code.

### 5. **Modern Stack**
Uses cutting-edge technologies: Deno for runtime, TypeScript for type safety, React 18 for UI, DaisyUI for components.

### 6. **Real-World Patterns**
Demonstrates patterns you'll actually use in production: error boundaries, optimistic UI, defensive copying, type guards, and more.

---

**Built with ❤️ using Deno, TypeScript, React, and DaisyUI**

*Demonstrating best practices for scalable, secure, and maintainable code*
# URL-Shortner
