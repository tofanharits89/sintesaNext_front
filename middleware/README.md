# Enterprise Middleware Architecture

## Overview

This middleware has been refactored following enterprise standards and SOLID principles for maximum scalability, maintainability, and testability.

## Architecture

```
middleware/
├── config.ts                    # Centralized configuration
├── types.ts                     # TypeScript type definitions
├── index.ts                     # Module exports
├── cache/
│   └── CacheManager.ts         # Session cache management
├── services/
│   ├── SessionValidationService.ts      # Session validation logic
│   ├── HealthCheckService.ts            # Backend health checks
│   └── CacheInvalidationService.ts      # Cache invalidation handling
├── handlers/
│   └── AuthenticationHandler.ts         # Authentication flow handling
└── utils/
    ├── PathUtils.ts            # Path classification utilities
    ├── TokenUtils.ts           # Token extraction & validation
    └── CookieUtils.ts          # Cookie management utilities
```

## Design Principles

### 1. Single Responsibility Principle (SRP)
Each class has one clear responsibility:
- `CacheManager`: Manages cache operations
- `SessionValidationService`: Validates sessions with backend
- `HealthCheckService`: Monitors backend health
- `CacheInvalidationService`: Handles cache invalidation requests
- `AuthenticationHandler`: Manages authentication flow and redirects
- `PathUtils`: Classifies and processes paths
- `TokenUtils`: Extracts and validates tokens
- `CookieUtils`: Manages cookie operations

### 2. Open/Closed Principle (OCP)
- Easy to extend with new features without modifying existing code
- New services can be added without changing core middleware logic
- Configuration-driven behavior allows changes without code modifications

### 3. Dependency Injection
- Services are injected into handlers, not hardcoded
- Makes testing easier and reduces coupling
- Allows for easy mocking in tests

### 4. Separation of Concerns
- **Config Layer**: All configuration in one place
- **Service Layer**: Business logic (validation, health checks, cache)
- **Handler Layer**: Request/response handling
- **Utility Layer**: Reusable helper functions

## Key Components

### Configuration (`config.ts`)
Centralized configuration management with:
- Environment variable parsing
- Security settings (TTL, rate limits)
- Path definitions
- Feature flags

### Cache Manager (`cache/CacheManager.ts`)
Manages session verification cache with:
- Security-optimized TTL (15s for session verify, 10s max age)
- Cache bypass for logout events
- Pattern-based cache clearing
- Expiration checks

### Session Validation Service (`services/SessionValidationService.ts`)
Handles session validation with:
- Backend API calls
- Cache integration
- Smart retry logic for fresh tokens
- Refresh window handling

### Health Check Service (`services/HealthCheckService.ts`)
Monitors backend health with:
- Circuit breaker pattern
- Cached health status (5 min TTL)
- Automatic failure recovery
- Timeout handling (2s)

### Cache Invalidation Service (`services/CacheInvalidationService.ts`)
Processes cache invalidation requests with:
- Rate limiting (20 req/min per IP)
- Same-origin verification
- Signature validation
- Token hash matching

### Authentication Handler (`handlers/AuthenticationHandler.ts`)
Manages authentication flow:
- Login page logic with loop prevention
- Root path redirects
- Unauthenticated access handling
- Response header management

### Utilities
- **PathUtils**: Path classification (public, static, API routes)
- **TokenUtils**: Token extraction, validation, age calculation
- **CookieUtils**: Cookie expiration and management

## Usage

### Basic Usage
```typescript
import { middleware } from './middleware.refactored';

export { middleware };
export const config = {
  matcher: ['/', '/((?!_next|favicon.ico|api/public).*)'],
};
```

### Testing Individual Components
```typescript
import { CacheManager, SessionValidationService } from './middleware';

// Test cache manager
const cache = new CacheManager();
cache.set('test-key', { ok: true, exp: Date.now() + 10000 });

// Test session service
const sessionService = new SessionValidationService(cache);
const isValid = await sessionService.validateSession('cookie-string');
```

### Extending with New Features
```typescript
// Add a new service
export class CustomService {
  constructor(private cacheManager: CacheManager) {}
  
  async customLogic() {
    // Your logic here
  }
}

// Use in middleware
const customService = new CustomService(cacheManager);
```

## Configuration Options

All configuration is in `config.ts`:

```typescript
export const MiddlewareConfig = {
  // Security
  sessionVerifyTtl: 15_000,        // Session cache TTL
  maxCacheAge: 10_000,             // Max age for auth results
  
  // Rate Limiting
  rateLimitWindow: 60_000,         // Rate limit window
  rateLimitMaxRequests: 20,        // Max requests per window
  
  // Retry Logic
  freshCookieThreshold: 2_000,     // Fresh cookie threshold
  refreshWindowThreshold: 30_000,  // Refresh window threshold
  
  // Feature Flags
  debugAuth: false,                // Debug logging
  enableCacheInvalidation: true,   // Cache invalidation endpoint
};
```

## Security Features

1. **Security-Optimized TTL**: Max 15s for session cache, 10s for positive auth results
2. **Dynamic Cache Expiration**: Immediate cache bypass on logout events
3. **Rate Limiting**: 20 requests/min per IP for cache invalidation
4. **Same-Origin Verification**: Strict origin checking for internal endpoints
5. **Signature Validation**: Optional HMAC signature for cache invalidation
6. **Circuit Breaker**: Prevents cascade failures on backend issues
7. **Loop Prevention**: Multiple safeguards against redirect loops

## Performance Optimizations

1. **Caching**: Reduces backend load with intelligent caching
2. **Circuit Breaker**: Fails fast when backend is down
3. **Smart Retry**: Only retries for fresh tokens or refresh windows
4. **Early Bypass**: Static assets skip all checks
5. **Lazy Validation**: Public paths skip health checks

## Migration from Old Middleware

To migrate from the old middleware to the refactored version:

1. **Backup**: Keep the old `middleware.ts` as `middleware.backup.ts`
2. **Replace**: Rename `middleware.refactored.ts` to `middleware.ts`
3. **Test**: Verify all authentication flows work correctly
4. **Monitor**: Check logs for any issues

The refactored middleware maintains 100% behavioral compatibility with the original.

## Benefits

### Maintainability
- Clear structure makes it easy to find and fix issues
- Each component can be updated independently
- Reduced code duplication

### Scalability
- Easy to add new features without touching existing code
- Services can be scaled independently
- Configuration-driven behavior

### Testability
- Each component can be unit tested in isolation
- Dependency injection makes mocking easy
- Clear interfaces for all services

### Performance
- Optimized caching reduces backend load
- Circuit breaker prevents cascade failures
- Smart retry logic minimizes unnecessary requests

### Security
- Centralized security configuration
- Multiple layers of validation
- Audit trail through structured logging

## Troubleshooting

### Enable Debug Mode
```bash
NEXT_PUBLIC_DEBUG_AUTH=1
```

### Check Cache Status
```typescript
const cache = new CacheManager();
console.log('Cache size:', cache.keys().length);
```

### Monitor Health Checks
```typescript
const health = new HealthCheckService();
const isHealthy = await health.isBackendHealthy();
console.log('Backend healthy:', isHealthy);
```

## Best Practices

1. **Always use dependency injection** when adding new services
2. **Keep configuration in `config.ts`** - avoid hardcoded values
3. **Add types to `types.ts`** for new data structures
4. **Follow naming conventions**: Services end with `Service`, Handlers with `Handler`
5. **Write unit tests** for new components
6. **Document public methods** with JSDoc comments
7. **Use debug logging** for troubleshooting (controlled by `debugAuth` flag)

## Future Enhancements

Potential improvements:
- [ ] Add metrics collection (response times, cache hit rates)
- [ ] Implement distributed caching (Redis)
- [ ] Add request tracing for debugging
- [ ] Create admin dashboard for cache management
- [ ] Add A/B testing support
- [ ] Implement feature flags service
- [ ] Add request replay for debugging
- [ ] Create middleware analytics

## Support

For issues or questions:
1. Check debug logs with `NEXT_PUBLIC_DEBUG_AUTH=1`
2. Review the architecture diagram above
3. Check individual component documentation
4. Review the original middleware behavior in `middleware.backup.ts`
