# Middleware Architecture Diagram

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MIDDLEWARE ENTRY POINT                       │
│                      (middleware.ts)                             │
│                                                                   │
│  • Request routing                                               │
│  • Service orchestration                                         │
│  • Response handling                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HANDLER LAYER                               │
│                 (handlers/AuthenticationHandler.ts)              │
│                                                                   │
│  • Login page logic                                              │
│  • Root path redirects                                           │
│  • Unauthenticated access handling                               │
│  • Response creation                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SessionValidationService                                 │   │
│  │  • Validate sessions with backend                         │   │
│  │  • Smart retry logic                                      │   │
│  │  • Cache integration                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  HealthCheckService                                       │   │
│  │  • Backend health monitoring                              │   │
│  │  • Circuit breaker pattern                                │   │
│  │  • Health status caching                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  CacheInvalidationService                                 │   │
│  │  • Cache invalidation handling                            │   │
│  │  • Rate limiting                                          │   │
│  │  • Security validation                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CACHE LAYER                                 │
│                   (cache/CacheManager.ts)                        │
│                                                                   │
│  • Session verification caching                                  │
│  • Security-optimized TTL                                        │
│  • Cache bypass management                                       │
│  • Pattern-based clearing                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UTILITY LAYER                               │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PathUtils   │  │  TokenUtils  │  │  CookieUtils │          │
│  │              │  │              │  │              │          │
│  │ • Path       │  │ • Token      │  │ • Cookie     │          │
│  │   classify   │  │   extract    │  │   expire     │          │
│  │ • Route      │  │ • Token      │  │ • Cookie     │          │
│  │   detection  │  │   validate   │  │   manage     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CONFIGURATION LAYER                            │
│                      (config.ts)                                 │
│                                                                   │
│  • Environment variables                                         │
│  • Security settings                                             │
│  • Path definitions                                              │
│  • Feature flags                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

```
┌──────────────┐
│   Request    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 1. Probe Mode Check                                      │
│    • If enabled, return probe headers                    │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 2. Cache Invalidation Endpoint                           │
│    • Check if /api/auth/invalidate-cache                 │
│    • Validate security                                   │
│    • Process invalidation                                │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 3. Path Classification (PathUtils)                       │
│    • API route? → Pass through                           │
│    • Static asset? → Pass through                        │
│    • Public path? → Allow access                         │
│    • Protected route? → Continue                         │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 4. Public Path Handling                                  │
│    • Login page with token? → Check auth                 │
│    • If authenticated → Redirect to dashboard            │
│    • If not authenticated → Show login                   │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 5. Health Check (HealthCheckService)                     │
│    • Check backend health                                │
│    • If unhealthy → Redirect to /server-error           │
│    • If healthy → Continue                               │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 6. Token Extraction (TokenUtils)                         │
│    • Extract access token from cookies                   │
│    • Validate token format                               │
│    • If no token → Redirect to login                     │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 7. Session Validation (SessionValidationService)         │
│    • Check cache (CacheManager)                          │
│    • If cache miss → Validate with backend               │
│    • Smart retry for fresh tokens                        │
│    • Cache result                                        │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 8. Authentication Decision (AuthenticationHandler)       │
│    • Root path? → Redirect based on auth                 │
│    • Not authenticated? → Redirect to login              │
│    • Authenticated? → Create response                    │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│   Response   │
└──────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         middleware.ts                            │
│                                                                   │
│  Creates and orchestrates:                                       │
│                                                                   │
│  ┌────────────────┐                                              │
│  │ CacheManager   │◄─────────────────────────┐                  │
│  └────────┬───────┘                           │                  │
│           │                                    │                  │
│           │ injected into                      │                  │
│           │                                    │                  │
│  ┌────────▼──────────────────┐    ┌──────────┴────────────┐     │
│  │ SessionValidationService  │    │ CacheInvalidationSvc  │     │
│  └────────┬──────────────────┘    └───────────────────────┘     │
│           │                                                       │
│           │ injected into                                        │
│           │                                                       │
│  ┌────────▼──────────────────┐                                   │
│  │  AuthenticationHandler    │                                   │
│  └───────────────────────────┘                                   │
│                                                                   │
│  ┌────────────────────────┐                                      │
│  │  HealthCheckService    │                                      │
│  └────────────────────────┘                                      │
│                                                                   │
│  Uses utilities:                                                 │
│  • PathUtils                                                     │
│  • TokenUtils                                                    │
│  • CookieUtils                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Session Validation

```
┌──────────────┐
│   Request    │
│  with cookie │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ SessionValidationService.validateSession │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ CacheManager.shouldBypassCache?         │
└──────┬──────────────────────────────────┘
       │
       ├─ Yes ──► Skip cache, validate with backend
       │
       └─ No ───┐
                │
                ▼
       ┌─────────────────────────────────────────┐
       │ CacheManager.get(key)                    │
       └──────┬──────────────────────────────────┘
              │
              ├─ Cache Hit ──► Check security expiration
              │                │
              │                ├─ Not expired ──► Return cached result
              │                │
              │                └─ Expired ──► Validate with backend
              │
              └─ Cache Miss ──► Validate with backend
                                │
                                ▼
                       ┌─────────────────────────────────────────┐
                       │ Fetch backend /auth/session/validate    │
                       └──────┬──────────────────────────────────┘
                              │
                              ▼
                       ┌─────────────────────────────────────────┐
                       │ Parse response                           │
                       └──────┬──────────────────────────────────┘
                              │
                              ├─ Success ──► Cache result (if not bypassed)
                              │              │
                              │              └──► Return true
                              │
                              └─ Failure ──► Clear cache
                                             │
                                             └──► Return false
```

## Cache Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cache Lifecycle                             │
│                                                                   │
│  1. Session Validation                                           │
│     ┌──────────────────────────────────────────────────┐        │
│     │ CacheManager.set(key, {                          │        │
│     │   ok: true,                                      │        │
│     │   exp: now + 15000,  // 15s TTL                 │        │
│     │   created: now       // For security check      │        │
│     │ })                                               │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                   │
│  2. Security Expiration Check                                    │
│     ┌──────────────────────────────────────────────────┐        │
│     │ if (age > 10000) {  // 10s max age               │        │
│     │   return true; // Expired                        │        │
│     │ }                                                │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                   │
│  3. Logout Event                                                 │
│     ┌──────────────────────────────────────────────────┐        │
│     │ CacheManager.clear()  // Clear all               │        │
│     │ CacheManager.setCacheBypass(key, 'logout')       │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                   │
│  4. Cache Bypass Check                                           │
│     ┌──────────────────────────────────────────────────┐        │
│     │ if (bypass exists && not expired) {              │        │
│     │   return true; // Bypass cache                   │        │
│     │ }                                                │        │
│     └──────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
│                                                                   │
│  Layer 1: Rate Limiting                                          │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ • 20 requests/min per IP                                │     │
│  │ • Applied to cache invalidation endpoint               │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer 2: Same-Origin Verification                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ • Check Origin header                                   │     │
│  │ • Check Referer header                                  │     │
│  │ • Must match request origin                             │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer 3: Internal Signal Verification                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ • Check User-Agent for "Next.js"                        │     │
│  │ • Check x-internal-request header                       │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer 4: Signature Validation                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ • HMAC-SHA256 signature                                 │     │
│  │ • Optional shared secret                                │     │
│  │ • Prevents unauthorized cache invalidation              │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer 5: Security-Optimized TTL                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ • 15s session verification TTL                          │     │
│  │ • 10s max age for positive auth results                 │     │
│  │ • Prevents stale authentication                         │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer 6: Dynamic Cache Expiration                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ • Immediate cache bypass on logout                      │     │
│  │ • 30s bypass duration                                   │     │
│  │ • Prevents stale session reuse                          │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                   │
│  Layer 7: Circuit Breaker                                        │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ • Fails fast when backend is down                       │     │
│  │ • 3 failures trigger open state                         │     │
│  │ • 60s timeout before retry                              │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Dependency Graph

```
middleware.ts
├── config.ts
├── types.ts
├── CacheManager
│   ├── config.ts
│   └── types.ts
├── SessionValidationService
│   ├── CacheManager
│   ├── TokenUtils
│   └── config.ts
├── HealthCheckService
│   ├── config.ts
│   └── types.ts
├── CacheInvalidationService
│   ├── CacheManager
│   ├── TokenUtils
│   ├── config.ts
│   └── types.ts
├── AuthenticationHandler
│   ├── SessionValidationService
│   ├── CacheManager
│   ├── PathUtils
│   ├── TokenUtils
│   ├── CookieUtils
│   └── config.ts
├── PathUtils
│   └── config.ts
├── TokenUtils
│   └── (no dependencies)
└── CookieUtils
    └── config.ts
```

## Module Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                      PUBLIC API                                  │
│                                                                   │
│  Exported from middleware/index.ts:                              │
│  • MiddlewareConfig                                              │
│  • PathConfig                                                    │
│  • CacheManager                                                  │
│  • SessionValidationService                                      │
│  • HealthCheckService                                            │
│  • CacheInvalidationService                                      │
│  • AuthenticationHandler                                         │
│  • PathUtils                                                     │
│  • TokenUtils                                                    │
│  • CookieUtils                                                   │
│                                                                   │
│  All types from types.ts                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INTERNAL IMPLEMENTATION                       │
│                                                                   │
│  Not exported (implementation details):                          │
│  • CircuitBreaker (internal to HealthCheckService)              │
│  • Private methods in services                                   │
│  • Internal helper functions                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Unit Tests                                  │
│                                                                   │
│  Each component tested independently:                            │
│  • CacheManager.test.ts                                          │
│  • SessionValidationService.test.ts                              │
│  • HealthCheckService.test.ts                                    │
│  • CacheInvalidationService.test.ts                              │
│  • AuthenticationHandler.test.ts                                 │
│  • PathUtils.test.ts                                             │
│  • TokenUtils.test.ts                                            │
│  • CookieUtils.test.ts                                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Integration Tests                              │
│                                                                   │
│  Test component interactions:                                    │
│  • SessionValidationService + CacheManager                       │
│  • AuthenticationHandler + SessionValidationService              │
│  • CacheInvalidationService + CacheManager                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   End-to-End Tests                               │
│                                                                   │
│  Test complete flows:                                            │
│  • Login flow                                                    │
│  • Protected route access                                        │
│  • Logout flow                                                   │
│  • Cache invalidation                                            │
└─────────────────────────────────────────────────────────────────┘
```

This architecture provides a clear, maintainable, and scalable foundation for authentication middleware.
