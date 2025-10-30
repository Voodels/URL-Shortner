# Architecture Documentation

## System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Frontend[React Frontend<br/>Port 5173]

        subgraph "Components"
            App[App Component]
            URLForm[URLForm Component]
            URLCard[URLCard Component]
            ThemeToggle[ThemeToggle Component]
            AnimatedBG[AnimatedBackground Component]
            Contexts[Auth/Theme Contexts]
        end

        APIClient[API Client]
    end

    subgraph "API Gateway Layer"
        DenoServer[Deno HTTP Server<br/>Port 8000]
        LogMW[Logging Middleware]
        CORSMW[CORS Middleware]
        Router[Router]
    end

    subgraph "Business Logic Layer"
        RouteHandlers[Route Handlers]
        Operations["• createShortURL()<br/>• getOriginalURL()<br/>• updateShortURL()<br/>• deleteShortURL()<br/>• getURLStats()<br/>• incrementAccessCount()"]
        Validation[Validation Layer]
    end

    subgraph "Data Access Layer"
        RepoInterface[URLRepository Interface]
        InMemory["InMemoryURLRepository<br/><br/>Data Structures:<br/>• Map&lt;shortCode, ShortenedURL&gt;<br/>• Map&lt;id, shortCode&gt;<br/><br/>Performance: O(1)"]
        Future["Future: PostgreSQL,<br/>MongoDB, Redis"]
    end

    Browser --> Frontend
    Frontend --> App
    Frontend --> URLForm
    Frontend --> URLCard
    Frontend --> ThemeToggle
    Frontend --> AnimatedBG
    Frontend --> Contexts
    App --> APIClient
    URLForm --> APIClient
    URLCard --> APIClient

    APIClient -->|HTTP/JSON<br/>CORS Enabled| DenoServer
    DenoServer --> LogMW
    LogMW --> CORSMW
    CORSMW --> Router
    Router -->|Route Handlers| RouteHandlers
    RouteHandlers --> Operations
    Operations --> Validation
    Validation -->|Repository Interface| RepoInterface
    RepoInterface --> InMemory
    RepoInterface -.-> Future

    style Browser fill:#e1f5ff
    style Frontend fill:#bbdefb
    style DenoServer fill:#c8e6c9
    style RouteHandlers fill:#fff9c4
    style RepoInterface fill:#ffccbc
    style InMemory fill:#ffab91
```

### Frontend Component Responsibilities

| Component | Responsibility | Key Interactions |
|-----------|----------------|------------------|
| `App.tsx` | Auth-gated shell coordinating hero, stats, and CRUD views | Consumes `AuthContext`, `ThemeContext`, orchestrates API calls |
| `ThemeToggle.tsx` | Floating command palette for light/dark toggle and accent palette selection | Consumes `ThemeContext`, triggers `toggleMode`/`setColorTheme` |
| `AnimatedBackground.tsx` | GPU-friendly gradient and motion backdrop reacting to theme changes | Reads active mode/palette from `ThemeContext` |
| `URLForm.tsx` | Controlled form for create/update flows | Emits callbacks to `App` after API success |
| `URLCard.tsx` | Displays short link details with copy/edit/delete interactions | Triggers parent callbacks, lazy-loads stats |
| `AuthContext.tsx` | Persists JWT tokens, exposes login/register/logout APIs | Wraps app, integrates with backend auth endpoints |
| `ThemeContext.tsx` | Persists theme preferences, maps palettes to DaisyUI themes | Wraps app, read by UI components |

## Request Flow

### Create Short URL

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Routes
    participant Repository

    Client->>API: POST /shorten
    API->>Routes: Validate Body
    Routes->>Routes: Generate Code
    Routes->>Repository: Create Entity
    Repository-->>Routes: Store & Return
    Routes-->>API: 201 Created
    API-->>Client: Return Short URL
```

### Redirect Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Routes
    participant Repository

    Client->>API: GET /:code
    API->>Routes: Find by Code
    Routes->>Repository: Lookup
    Repository-->>Routes: Return URL
    Routes-->>API: 200 OK
    API-->>Client: Return URL Data

    Client->>API: POST /:code/access
    API->>Routes: Increment
    Routes->>Repository: Update Counter
    Repository-->>Routes: Success
    Routes-->>Client: Redirect to URL
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant Repository

    Client->>API: POST /auth/register or /auth/login
    API->>Auth: Validate Credentials
    Auth->>Repository: Hash password or verify hash
    Repository-->>Auth: Success
    Auth->>Auth: Issue JWT
    Auth-->>Client: Return token + user

    Note over Client: Store token in AuthContext

    Client->>API: Request with Bearer token
    API->>Auth: Validate JWT
    Auth->>Repository: Resolve user
    Repository-->>Auth: User data
    Auth-->>API: Authorized
    API-->>Client: Authorized access to /urls, /shorten endpoints
```

## Data Model

```typescript
interface ShortenedURL {
  id: string;           // UUID for internal reference
  url: string;          // Original long URL
  shortCode: string;    // Unique short code (Base62)
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
  accessCount: number;  // Number of times accessed
    userId?: string;      // Owner of the URL (optional for legacy data)
}

interface PublicUser {
    id: string;           // UUID for the authenticated user
    email: string;        // Unique email address
    createdAt: string;    // ISO 8601 timestamp
    updatedAt: string;    // ISO 8601 timestamp
}

interface AuthResponse {
    token: string;        // JWT bearer token
    user: PublicUser;     // Authenticated user payload
}
```

## Design Patterns Used

### 1. Repository Pattern
**Purpose**: Separate data access logic from business logic

**Implementation**:
```typescript
interface URLRepository {
  create(url: ShortenedURL): Promise<ShortenedURL>;
  findByShortCode(shortCode: string): Promise<ShortenedURL | null>;
  // ... other methods
}
```

**Benefits**:
- Easy to swap implementations (in-memory → database)
- Testable (can mock repository)
- Single responsibility

### 2. Middleware Pattern
**Purpose**: Composable request processing

**Implementation**:
```mermaid
graph LR
    Request[Request] --> Logging[Logging]
    Logging --> CORS[CORS]
    CORS --> Router[Router]
    Router --> Response[Response]

    style Request fill:#e3f2fd
    style Response fill:#c8e6c9
```

**Benefits**:
- Reusable middleware
- Clear separation of concerns
- Easy to add new middleware

### 3. Error Handling Pattern
**Purpose**: Consistent error responses

**Implementation**:
```typescript
class ValidationError extends Error { }
class NotFoundError extends Error { }

function handleError(error: unknown): Response {
  if (error instanceof ValidationError) return 400;
  if (error instanceof NotFoundError) return 404;
  return 500;
}
```

**Benefits**:
- Type-safe error handling
- Consistent error format
- No internal details leaked

### 4. DTO Pattern
**Purpose**: Separate API contracts from domain models

**Implementation**:
```typescript
interface CreateURLRequest { url: string; }
interface ShortenedURL { id, url, shortCode, ... }
```

**Benefits**:
- API versioning flexibility
- Validation at boundaries
- Client doesn't need all fields

### 5. Singleton Pattern
**Purpose**: Single instance of repository

**Implementation**:
```typescript
export const urlRepository: URLRepository = new InMemoryURLRepository();
```

**Benefits**:
- Single source of truth
- Consistent state
- Simple lifecycle

## Security Architecture

### Input Validation
```mermaid
graph TD
    Input[Client Input]
    Input --> TypeCheck{Type Checking}
    TypeCheck -->|Invalid| Reject1[Reject non-string/object]
    TypeCheck -->|Valid| LengthCheck{Length Validation}
    LengthCheck -->|Too Long| Reject2[Reject too long URLs]
    LengthCheck -->|Valid| FormatCheck{Format Validation}
    FormatCheck -->|Invalid| Reject3[Reject invalid URLs]
    FormatCheck -->|Valid| ProtocolCheck{Protocol Check}
    ProtocolCheck -->|Not HTTP/HTTPS| Reject4[Only HTTP/HTTPS]
    ProtocolCheck -->|Valid| HostCheck{Hostname Check}
    HostCheck -->|Invalid| Reject5[Require valid hostname]
    HostCheck -->|Valid| Accepted[Accepted ✓]

    style Accepted fill:#4caf50,color:#fff
    style Reject1 fill:#f44336,color:#fff
    style Reject2 fill:#f44336,color:#fff
    style Reject3 fill:#f44336,color:#fff
    style Reject4 fill:#f44336,color:#fff
    style Reject5 fill:#f44336,color:#fff
```

### CORS Protection
```mermaid
graph TD
    Origin[Request Origin]
    Origin --> Whitelist{Check Whitelist}
    Whitelist -->|Allowed| AddHeaders[Add CORS headers]
    Whitelist -->|Not Allowed| Block[No CORS headers<br/>Browser blocks]

    style AddHeaders fill:#4caf50,color:#fff
    style Block fill:#f44336,color:#fff
```

### Short Code Generation
```mermaid
graph TD
    Random[Random Bytes<br/>Crypto API]
    Random --> Base62[Base62 Encoding]
    Base62 --> Collision{Collision Check}
    Collision -->|Exists| Retry[Retry Generation]
    Retry --> Random
    Collision -->|Not Exists| Use[Use Code ✓]

    style Use fill:#4caf50,color:#fff
    style Retry fill:#ff9800,color:#fff
```

## Scalability Considerations

### Current (MVP)
```mermaid
graph LR
    Client[Client] --> Server[Single Server<br/>In-Memory Storage]
    Server --> Memory[(Memory<br/>O1 Lookups)]

    style Server fill:#ffeb3b
    style Memory fill:#fff9c4
```

### Next Steps

#### 1. Database Layer
```mermaid
graph TB
    App[Application]
    App --> Pool[Connection Pool]
    Pool --> Primary[(PostgreSQL<br/>Primary)]
    Pool --> Redis[(Redis Cache)]
    Primary --> Replica1[(Replica 1)]
    Primary --> Replica2[(Replica 2)]

    style Primary fill:#4caf50,color:#fff
    style Redis fill:#ff9800,color:#fff
```

#### 2. Horizontal Scaling
```mermaid
graph TB
    Client[Clients]
    Client --> LB[Load Balancer]
    LB --> Server1[Backend 1]
    LB --> Server2[Backend 2]
    LB --> Server3[Backend 3]
    Server1 --> DB[(Shared Database)]
    Server2 --> DB
    Server3 --> DB

    style LB fill:#2196f3,color:#fff
    style DB fill:#4caf50,color:#fff
```

#### 3. Caching Strategy
```mermaid
graph LR
    Request[Request] --> Cache{Redis Cache}
    Cache -->|Hit| Return[Return Cached]
    Cache -->|Miss| DB[(Database)]
    DB --> Update[Update Cache]
    Update --> Return

    style Cache fill:#ff9800,color:#fff
    style Return fill:#4caf50,color:#fff
```

#### 4. Analytics Pipeline
```mermaid
graph LR
    Event[Click Event] --> Queue[Message Queue]
    Queue --> Worker1[Worker 1]
    Queue --> Worker2[Worker 2]
    Worker1 --> TSDB[(Time-Series DB)]
    Worker2 --> TSDB

    style Queue fill:#9c27b0,color:#fff
    style TSDB fill:#00bcd4,color:#fff
```

### Migration Path: In-Memory → PostgreSQL

```typescript
// 1. Keep same interface
class PostgresURLRepository implements URLRepository {
  // 2. Implement same methods with SQL
  async create(url: ShortenedURL): Promise<ShortenedURL> {
    const result = await db.query(
      'INSERT INTO urls (...) VALUES (...)',
      [...]
    );
    return result.rows[0];
  }
}

// 3. Swap implementation - no other code changes!
export const urlRepository: URLRepository = new PostgresURLRepository();
```

## Performance Characteristics

### Time Complexity
- Create: O(1) average, O(n) worst case (collision retry)
- Read: O(1)
- Update: O(1)
- Delete: O(1)
- Stats: O(1)

### Space Complexity
- Per URL: O(1)
- Total: O(n) where n = number of URLs

### Expected Load (MVP)
- Requests/second: 100
- URLs stored: 10,000
- Memory usage: ~10 MB

### Production Load (Estimated)
- Requests/second: 10,000+
- URLs stored: 100M+
- Memory usage: Database-backed
- Response time: <50ms p99

## Monitoring & Observability

### Metrics to Track
- Request rate
- Error rate
- Response time
- URL creation rate
- Popular URLs
- Storage usage

### Logging
- All requests (method, path, status, duration)
- All errors (with stack trace)
- Access counts
- Collision occurrences

### Health Checks
- GET /health endpoint
- Returns uptime and status
- Used by load balancers

## Deployment Architecture

### Development
```mermaid
graph TB
    Dev[Local Machine]
    Dev --> Backend[Backend<br/>localhost:8000]
    Dev --> Frontend[Frontend<br/>localhost:5173]

    style Dev fill:#e3f2fd
    style Backend fill:#c8e6c9
    style Frontend fill:#bbdefb
```

### Production
```mermaid
graph TB
    Internet[Internet]
    Internet --> LB[Load Balancer<br/>HTTPS]

    LB --> Backend1[Backend Server 1]
    LB --> Backend2[Backend Server 2]
    LB --> Backend3[Backend Server 3]

    Backend1 --> Primary[(PostgreSQL<br/>Primary)]
    Backend2 --> Primary
    Backend3 --> Primary

    Primary --> Replica1[(Replica 1)]
    Primary --> Replica2[(Replica 2)]

    LB --> CDN[CDN<br/>Static Frontend]

    style LB fill:#2196f3,color:#fff
    style Primary fill:#4caf50,color:#fff
    style CDN fill:#ff9800,color:#fff
```

## Technology Stack Rationale

### Deno
**Why**: Modern runtime, built-in TypeScript, secure by default

### TypeScript
**Why**: Type safety, better IDE support, fewer runtime errors

### React
**Why**: Component-based, large ecosystem, proven at scale

### DaisyUI
**Why**: Pre-built components, consistent design, accessibility

### Vite
**Why**: Fast HMR, optimized builds, modern development experience

### Tailwind CSS
**Why**: Utility-first, no CSS conflicts, small production bundle
