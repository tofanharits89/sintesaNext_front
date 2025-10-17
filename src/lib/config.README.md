# Unified Configuration System

**Phase 3 Implementation** - Standardized environment variable management

## Overview

This module provides a single source of truth for environment-based configuration, eliminating the previous chaos of 6+ environment variables with complex fallback chains.

## Usage

```typescript
import { config, apiPath, backendPath } from "@/lib/config";

// API requests
const response = await fetch(apiPath("/auth/login"));

// Socket.IO connection
const socket = io(config.socketUrl, { path: config.socketPath });

// Check environment
if (config.isDevelopment) {
  console.log("Running in development mode");
}
```

## Configuration Object

```typescript
config = {
  apiUrl: string;        // API base URL (includes /api/v1)
  socketUrl: string;     // Socket.IO URL (without /api/v1)
  socketPath: string;    // Socket.IO path (default: /socket.io)
  isProduction: boolean; // NODE_ENV === 'production'
  isDevelopment: boolean; // NODE_ENV === 'development'
  debugAuth: boolean;    // NEXT_PUBLIC_DEBUG_AUTH === 'true'
}
```

## Environment Variables

### Required

- `NEXT_PUBLIC_API_URL` - Client-side API URL (e.g., `http://localhost:88/api/v1`)
- `API_URL` - Server-side API URL for middleware (e.g., `http://backend:88/api/v1` for Docker)

### Optional

- `NEXT_PUBLIC_SOCKET_PATH` - Socket.IO path (default: `/socket.io`)
- `NEXT_PUBLIC_DEBUG_AUTH` - Enable auth debugging (default: `false`)

## Migration from Old System

### Before (Phase 2)

```typescript
// Multiple env vars with complex fallback logic
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                   process.env.BACKEND_URL || 
                   process.env.API_URL ||
                   "http://localhost:88/api/v1";

// Manual string manipulation
const socketUrl = backendUrl.replace(/\/api\/v1$/, '');

// Scattered configuration
const useStatic = process.env.NEXT_PUBLIC_USE_STATIC_BACKEND_URL === 'true';
```

### After (Phase 3)

```typescript
import { config, apiPath } from "@/lib/config";

// Clean, simple usage
const response = await fetch(apiPath("/auth/login"));
const socket = io(config.socketUrl);
```

## Helpers

### `apiPath(path: string): string`

Constructs full API URL from path.

```typescript
apiPath("/auth/login")
// → "http://localhost:88/api/v1/auth/login"
```

### `backendPath(path: string): string`

Alias for `apiPath()` for backward compatibility.

## Deployment Examples

### Local Development

```bash
NEXT_PUBLIC_API_URL=http://localhost:88/api/v1
API_URL=http://localhost:88/api/v1
```

### Docker Deployment

```bash
# Client-side (browser)
NEXT_PUBLIC_API_URL=http://localhost:88/api/v1

# Server-side (Next.js middleware)
API_URL=http://backend:88/api/v1
```

### Production

```bash
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
API_URL=https://api.example.com/api/v1
```

## Benefits

- ✅ Single source of truth
- ✅ No manual string manipulation
- ✅ Clear client vs server separation
- ✅ Type-safe configuration
- ✅ Automatic Socket.IO URL derivation
- ✅ Backward compatible
