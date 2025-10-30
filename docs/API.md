# API Documentation

## Base URL
```
Development: http://localhost:8000
Production: https://your-domain.com
```

## Overview

The URL Shortener API provides RESTful endpoints for creating, managing, and tracking shortened URLs. All endpoints return JSON responses and use standard HTTP status codes.

## Authentication

- **Mechanism**: Email/password login with salted bcrypt hashes
- **Response**: JWT Bearer token (24h expiry) + user payload
- **Usage**: Include `Authorization: Bearer <token>` header for protected routes (`/urls`, `/shorten`, `/me`)

**Tip**: After logging in, stash your token in a shell variable (requires [`jq`](https://stedolan.github.io/jq/)) so subsequent examples work as written:
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"super-secret"}' | jq -r '.token')
```

## Rate Limiting

**Current**: No rate limiting (MVP)
**Future**: 100 requests per minute per IP

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "details": ["Detailed error 1", "Detailed error 2"],
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_ERROR` | Server error |
| `NETWORK_ERROR` | Network failure |

---

## Endpoints

### Authentication Endpoints

#### Register

**Endpoint**: `POST /auth/register`

**Description**: Creates a new user account and returns an auth token.

**Request Body**:
```json
{
  "email": "you@example.com",
  "password": "super-secret"
}
```

**Success Response**: `201 Created`
```json
{
  "token": "<jwt-token>",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "you@example.com",
    "createdAt": "2025-10-07T10:30:00Z",
    "updatedAt": "2025-10-07T10:30:00Z"
  }
}
```

#### Login

**Endpoint**: `POST /auth/login`

**Description**: Authenticates an existing user and returns a token.

Request/response format matches the register endpoint.

#### Current User

**Endpoint**: `GET /me`

**Headers**:
```
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "you@example.com",
    "createdAt": "2025-10-07T10:30:00Z",
    "updatedAt": "2025-10-07T10:30:00Z"
  }
}
```

#### User URLs

**Endpoint**: `GET /urls`

**Description**: Returns all URLs owned by the authenticated user.

**Headers**:
```
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "urls": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://www.example.com/very/long/url",
      "shortCode": "abc123",
      "createdAt": "2025-10-07T10:30:00Z",
      "updatedAt": "2025-10-07T10:30:00Z",
      "accessCount": 0
    }
  ]
}
```

### Create Short URL

Create a new shortened URL.

**Endpoint**: `POST /shorten`

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "url": "https://www.example.com/very/long/url"
}
```

**Request Body Schema**:
```typescript
{
  url: string  // Required. Must be valid HTTP/HTTPS URL, max 2048 chars
}
```

**Success Response**: `201 Created`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://www.example.com/very/long/url",
  "shortCode": "abc123",
  "createdAt": "2021-09-01T12:00:00Z",
  "updatedAt": "2021-09-01T12:00:00Z",
  "accessCount": 0
}
```

**Response Headers**:
```
Content-Type: application/json
Location: /shorten/abc123
```

**Error Responses**:

`400 Bad Request` - Validation failed
```json
{
  "error": "Validation failed",
  "details": [
    "URL is required and must be a string",
    "URL must use HTTP or HTTPS protocol"
  ],
  "code": "VALIDATION_ERROR"
}
```

`500 Internal Server Error` - Server error
```json
{
  "error": "An unexpected error occurred",
  "code": "INTERNAL_ERROR"
}
```

**Example Request**:
```bash
curl -X POST http://localhost:8000/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"url": "https://www.example.com/very/long/url"}'
```

**Example Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://www.example.com/very/long/url",
  "shortCode": "Kx2aB7",
  "createdAt": "2025-10-07T10:30:00Z",
  "updatedAt": "2025-10-07T10:30:00Z",
  "accessCount": 0
}
```

---

### Get Original URL

Retrieve the original URL from a short code.

**Endpoint**: `GET /shorten/:shortCode`

**URL Parameters**:
- `shortCode` (string, required): The short code to look up

**Success Response**: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://www.example.com/very/long/url",
  "shortCode": "abc123",
  "createdAt": "2021-09-01T12:00:00Z",
  "updatedAt": "2021-09-01T12:00:00Z",
  "accessCount": 42
}
```

**Response Headers**:
```
Content-Type: application/json
Cache-Control: public, max-age=300
```

**Error Responses**:

`404 Not Found` - Short code doesn't exist
```json
{
  "error": "Short URL 'abc123' not found",
  "code": "NOT_FOUND"
}
```

**Example Request**:
```bash
curl http://localhost:8000/shorten/Kx2aB7
```

**Example Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://www.example.com/very/long/url",
  "shortCode": "Kx2aB7",
  "createdAt": "2025-10-07T10:30:00Z",
  "updatedAt": "2025-10-07T10:35:00Z",
  "accessCount": 15
}
```

---

### Update Short URL

Update the destination URL of an existing short code.

**Endpoint**: `PUT /shorten/:shortCode`

**URL Parameters**:
- `shortCode` (string, required): The short code to update

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "url": "https://www.example.com/updated/url"
}
```

**Request Body Schema**:
```typescript
{
  url: string  // Required. Must be valid HTTP/HTTPS URL, max 2048 chars
}
```

**Success Response**: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://www.example.com/updated/url",
  "shortCode": "abc123",
  "createdAt": "2021-09-01T12:00:00Z",
  "updatedAt": "2021-09-01T12:30:00Z",
  "accessCount": 42
}
```

**Error Responses**:

`400 Bad Request` - Validation failed
```json
{
  "error": "Validation failed",
  "details": ["URL must use HTTP or HTTPS protocol"],
  "code": "VALIDATION_ERROR"
}
```

`404 Not Found` - Short code doesn't exist
```json
{
  "error": "Short URL 'abc123' not found",
  "code": "NOT_FOUND"
}
```

**Example Request**:
```bash
curl -X PUT http://localhost:8000/shorten/Kx2aB7 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"url": "https://www.example.com/new-destination"}'
```

**Example Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://www.example.com/new-destination",
  "shortCode": "Kx2aB7",
  "createdAt": "2025-10-07T10:30:00Z",
  "updatedAt": "2025-10-07T11:00:00Z",
  "accessCount": 15
}
```

**Note**: The short code cannot be changed. Access count is preserved.

---

### Delete Short URL

Delete an existing shortened URL.

**Endpoint**: `DELETE /shorten/:shortCode`

**URL Parameters**:
- `shortCode` (string, required): The short code to delete

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response**: `204 No Content`

No response body.

**Error Responses**:

`404 Not Found` - Short code doesn't exist
```json
{
  "error": "Short URL 'abc123' not found",
  "code": "NOT_FOUND"
}
```

**Example Request**:
```bash
curl -X DELETE http://localhost:8000/shorten/Kx2aB7 \
  -H "Authorization: Bearer $TOKEN"
```

**Example Response**:
```
HTTP/1.1 204 No Content
```

**Note**: This operation is idempotent. Deleting an already-deleted URL returns 404.

---

### Get URL Statistics

Get detailed statistics for a shortened URL.

**Endpoint**: `GET /shorten/:shortCode/stats`

**URL Parameters**:
- `shortCode` (string, required): The short code to get stats for

**Success Response**: `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://www.example.com/very/long/url",
  "shortCode": "abc123",
  "createdAt": "2021-09-01T12:00:00Z",
  "updatedAt": "2021-09-01T15:30:00Z",
  "accessCount": 1337
}
```

**Error Responses**:

`404 Not Found` - Short code doesn't exist
```json
{
  "error": "Short URL 'abc123' not found",
  "code": "NOT_FOUND"
}
```

**Example Request**:
```bash
curl http://localhost:8000/shorten/Kx2aB7/stats
```

**Example Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://www.example.com/very/long/url",
  "shortCode": "Kx2aB7",
  "createdAt": "2025-10-07T10:30:00Z",
  "updatedAt": "2025-10-07T15:45:00Z",
  "accessCount": 234
}
```

**Future Enhancements**:
- Geographic distribution
- Referrer sources
- Device types
- Time-series data
- Click-through rate

---

### Increment Access Count

Increment the access counter for a short URL. Called internally after redirects.

**Endpoint**: `POST /shorten/:shortCode/access`

**URL Parameters**:
- `shortCode` (string, required): The short code to increment

**Success Response**: `200 OK`

```json
{
  "success": true
}
```

**Error Responses**:

`404 Not Found` - Short code doesn't exist
```json
{
  "error": "Short URL 'abc123' not found",
  "code": "NOT_FOUND"
}
```

**Example Request**:
```bash
curl -X POST http://localhost:8000/shorten/Kx2aB7/access
```

**Example Response**:
```json
{
  "success": true
}
```

**Note**: This endpoint is typically called by the frontend after a successful redirect.

---

### Health Check

Check server health and uptime.

**Endpoint**: `GET /health`

**Success Response**: `200 OK`

```json
{
  "status": "healthy",
  "timestamp": "2021-09-01T12:00:00Z",
  "uptime": 123456.789
}
```

**Response Schema**:
```typescript
{
  status: "healthy",
  timestamp: string,  // ISO 8601
  uptime: number      // Milliseconds since start
}
```

**Example Request**:
```bash
curl http://localhost:8000/health
```

**Example Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T10:30:00Z",
  "uptime": 3600000.123
}
```

**Use Cases**:
- Load balancer health checks
- Monitoring systems
- Deployment verification

---

## Data Models

### ShortenedURL

```typescript
interface ShortenedURL {
  id: string;           // UUID v4
  url: string;          // Original URL (max 2048 chars)
  shortCode: string;    // Unique 6-character Base62 code
  createdAt: string;    // ISO 8601 timestamp
  updatedAt: string;    // ISO 8601 timestamp
  accessCount: number;  // Number of accesses (starts at 0)
}
```

### Validation Rules

#### URL Field
- **Required**: Yes
- **Type**: String
- **Min Length**: 1 (after trimming)
- **Max Length**: 2048 characters
- **Format**: Valid URL
- **Protocols**: HTTP, HTTPS only
- **Must Have**: Valid hostname

#### Short Code
- **Length**: 6 characters
- **Alphabet**: Base62 (a-z, A-Z, 0-9)
- **Uniqueness**: Guaranteed unique
- **Generation**: Cryptographically random
- **Collision Handling**: Auto-retry up to 10 times

---

## HTTP Status Codes

| Code | Description | When Used |
|------|-------------|-----------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors, malformed JSON |
| 404 | Not Found | Short code doesn't exist |
| 500 | Internal Server Error | Unexpected server error |

---

## CORS Configuration

### Allowed Origins (Default)
- `http://localhost:5173` (Vite dev server)
- `http://localhost:4173` (Vite preview)
- `http://localhost:3000` (Common React dev port)

### Allowed Methods
- GET
- POST
- PUT
- DELETE
- OPTIONS

### Allowed Headers
- Content-Type
- Authorization

### Configuration

Set via environment variable:
```bash
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

---

## Example Workflows

### Basic Usage Flow

```
1. Create short URL
   POST /shorten
   {"url": "https://example.com/long"}
   → Returns: {shortCode: "abc123", ...}

2. Share short URL
   https://your-domain.com/shorten/abc123

3. Get original URL
   GET /shorten/abc123
   → Returns: {url: "https://example.com/long", ...}

4. Increment counter
   POST /shorten/abc123/access
   → Returns: {success: true}

5. Check statistics
   GET /shorten/abc123/stats
   → Returns: {accessCount: 1, ...}
```

### Update Flow

```
1. Get current URL
   GET /shorten/abc123

2. Update destination
   PUT /shorten/abc123
   {"url": "https://example.com/new"}

3. Verify update
   GET /shorten/abc123
   → Returns updated URL
```

### Delete Flow

```
1. Delete short URL
   DELETE /shorten/abc123

2. Verify deletion
   GET /shorten/abc123
   → Returns 404 Not Found
```

---

## Client Integration

### JavaScript/TypeScript

```typescript
// Create short URL
const response = await fetch('http://localhost:8000/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com/long/url'
  }),
});

const data = await response.json();
console.log('Short code:', data.shortCode);
```

### Python

```python
import requests

# Create short URL
response = requests.post(
    'http://localhost:8000/shorten',
    json={'url': 'https://example.com/long/url'}
)

data = response.json()
print(f"Short code: {data['shortCode']}")
```

### cURL

```bash
# Create short URL
curl -X POST http://localhost:8000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/long/url"}'

# Get URL
curl http://localhost:8000/shorten/abc123

# Update URL
curl -X PUT http://localhost:8000/shorten/abc123 \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/new/url"}'

# Delete URL
curl -X DELETE http://localhost:8000/shorten/abc123

# Get stats
curl http://localhost:8000/shorten/abc123/stats
```

---

## Testing

### Unit Tests (Future)

```typescript
// Example test
Deno.test("POST /shorten creates short URL", async () => {
  const response = await fetch("http://localhost:8000/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com" }),
  });

  assertEquals(response.status, 201);
  const data = await response.json();
  assertExists(data.shortCode);
});
```

### Integration Tests (Future)

Test complete workflows:
1. Create → Get → Update → Get → Delete → Get (404)
2. Create → Access → Stats (count incremented)
3. Create with invalid URL → 400 error

---

## Changelog

### v1.0.0 (Current)
- Initial release
- CRUD operations for URLs
- Basic analytics (access count)
- In-memory storage
- CORS support

### Future Versions
- v1.1.0: Custom short codes
- v1.2.0: URL expiration
- v1.3.0: User authentication
- v2.0.0: Database persistence
- v2.1.0: Advanced analytics

---

## Support

For issues or questions:
- GitHub Issues: [repository-url]/issues
- Documentation: [repository-url]/README.md
- Architecture: [repository-url]/ARCHITECTURE.md
