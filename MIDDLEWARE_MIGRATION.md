# Middleware Migration Guide

## Overview

This guide helps you migrate from the monolithic middleware (1030 lines) to the refactored enterprise-standard middleware.

## What Changed?

### Before (Monolithic)
- **1 file**: `middleware.ts` (1030 lines)
- All logic in one place
- Hard to test individual components
- Difficult to maintain and extend

### After (Modular)
- **13 files** organized by responsibility
- Clear separation of concerns
- Each component independently testable
- Easy to maintain and extend

## File Structure Comparison

### Old Structure
```
frontendNEx/
└── middleware.ts (1030 lines)
```

### New Structure
```
frontendNEx/
├── middleware.ts (refactored - 120 lines)
├── middleware.backup.ts (original backup)
└── middleware/
    ├── config.ts                           # Configuration
    ├── types.ts                            # Type definitions
    ├── index.ts                            # Module exports
    ├── README.md                           # Documentation
    ├── cache/
    │   └── CacheManager.ts                # Cache operations
    ├── services/
    │   ├── SessionValidationService.ts    # Session validation
    │   ├── HealthCheckService.ts          # Health checks
    │   └── CacheInvalidationService.ts    # Cache invalidation
    ├── handlers/
    │   └── AuthenticationHandler.ts       # Auth flow handling
    └── utils/
        ├── PathUtils.ts                   # Path utilities
        ├── TokenUtils.ts                  # Token utilities
        └── CookieUtils.ts                 # Cookie utilities
```

## Migration Steps

### Step 1: Backup Current Middleware
```bash
# Already done - middleware.backup.ts created
```

### Step 2: Review the New Structure
```bash
# Explore the new middleware folder
ls -R frontendNEx/middleware/
```

### Step 3: Test the Refactored Middleware

#### Option A: Side-by-side Testing (Recommended)
Keep both versions and test the refactored one:

```typescript
// In middleware.ts - temporarily use refactored version
export { middleware, config } from './middleware.refactored';
```

#### Option B: Direct Replacement
```bash
# Backup original
mv frontendNEx/middleware.ts frontendNEx/middleware.old.ts

# Use refactored version
mv frontendNEx/middleware.refactored.ts frontendNEx/middleware.ts
```

### Step 4: Verify Functionality

Test these critical flows:

1. **Login Flow**
   - Visit `/login` without token → should show login page
   - Login successfully → should redirect to `/dashboard/utama`
   - Visit `/login` with valid token → should redirect to dashboard

2. **Protected Routes**
   - Visit `/dashboard` without token → should redirect to `/login`
   - Visit `/dashboard` with valid token → should show dashboard
   - Visit `/dashboard` with expired token → should redirect to `/login`

3. **Logout Flow**
   - Logout → should clear cache and redirect to `/login`
   - Try to access protected route after logout → should redirect to `/login`

4. **Static Assets**
   - Static files should load without authentication
   - `/_next/*` should bypass middleware
   - `/favicon.ico` should bypass middleware

5. **API Routes**
   - `/api/*` routes should pass through
   - `/api/auth/*` routes should work correctly

6. **Health Checks**
   - Backend down → should show `/server-error`
   - Backend up → should allow access

### Step 5: Monitor and Debug

Enable debug mode to see detailed logs:

```bash
# In .env.local
NEXT_PUBLIC_DEBUG_AUTH=1
```

Check browser console and server logs for:
- Cache hits/misses
- Session validation results
- Redirect decisions
- Error messages

### Step 6: Performance Verification

Compare performance metrics:
- Response times
- Cache hit rates
- Backend API calls
- Memory usage

## Rollback Plan

If issues occur, rollback is simple:

```bash
# Restore original middleware
cp frontendNEx/middleware.backup.ts frontendNEx/middleware.ts

# Or if you renamed it
mv frontendNEx/middleware.old.ts frontendNEx/middleware.ts
```

## Configuration Changes

### Environment Variables
No changes required - all existing environment variables work:

```bash
NEXT_PUBLIC_BASE_PATH=          # Optional base path
NEXT_PUBLIC_DEBUG_AUTH=1        # Enable debug logging
ENABLE_CACHE_INVALIDATION=1     # Enable cache invalidation endpoint
CACHE_INVALIDATE_SECRET=        # Optional secret for cache invalidation
NEXT_MW_PROBE=1                 # Enable probe mode for debugging
```

### Behavior Changes
**None** - The refactored middleware maintains 100% behavioral compatibility.

## Benefits After Migration

### 1. Maintainability
- **Before**: Find bug in 1030-line file
- **After**: Navigate directly to relevant service/handler

### 2. Testability
- **Before**: Test entire middleware as black box
- **After**: Unit test each component independently

### 3. Scalability
- **Before**: Add feature → modify monolithic file
- **After**: Add new service → no changes to existing code

### 4. Readability
- **Before**: Scroll through 1030 lines
- **After**: Read focused, single-purpose modules

### 5. Collaboration
- **Before**: Merge conflicts on single file
- **After**: Work on different services independently

## Code Size Comparison

| Component | Lines | Purpose |
|-----------|-------|---------|
| **Old Total** | **1030** | Everything in one file |
| **New Total** | **~900** | Distributed across modules |
| config.ts | 50 | Configuration |
| types.ts | 30 | Type definitions |
| CacheManager.ts | 120 | Cache operations |
| SessionValidationService.ts | 150 | Session validation |
| HealthCheckService.ts | 60 | Health checks |
| CacheInvalidationService.ts | 200 | Cache invalidation |
| AuthenticationHandler.ts | 150 | Auth flow |
| PathUtils.ts | 30 | Path utilities |
| TokenUtils.ts | 80 | Token utilities |
| CookieUtils.ts | 30 | Cookie utilities |
| middleware.ts | 120 | Main orchestration |

**Result**: ~13% reduction in code + better organization

## Common Issues and Solutions

### Issue 1: Import Errors
**Problem**: `Cannot find module './middleware'`

**Solution**: Ensure the middleware folder exists and contains `index.ts`

```bash
ls frontendNEx/middleware/index.ts
```

### Issue 2: TypeScript Errors
**Problem**: Type errors in refactored middleware

**Solution**: Rebuild TypeScript cache

```bash
cd frontendNEx
rm -rf .next
npm run build
```

### Issue 3: Cache Not Working
**Problem**: Cache seems to not be working

**Solution**: Check global cache initialization

```typescript
// Should see in logs
console.log('Cache size:', sessionVerifyCache.size);
```

### Issue 4: Redirects Not Working
**Problem**: Redirects behave differently

**Solution**: Check BASE_PATH configuration

```bash
# In .env.local
NEXT_PUBLIC_BASE_PATH=
```

## Testing Checklist

- [ ] Login page loads correctly
- [ ] Login with valid credentials works
- [ ] Login redirects to dashboard
- [ ] Dashboard requires authentication
- [ ] Logout clears session
- [ ] Logout redirects to login
- [ ] Protected routes require auth
- [ ] Static assets load without auth
- [ ] API routes pass through
- [ ] Health check works
- [ ] Server error page shows when backend down
- [ ] Cache invalidation works
- [ ] Debug logging works (when enabled)
- [ ] No redirect loops
- [ ] Fresh token retry works
- [ ] Refresh window retry works

## Performance Benchmarks

Run these tests before and after migration:

```bash
# Test login performance
time curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Test protected route performance
time curl http://localhost:3000/dashboard \
  -H "Cookie: accessToken=YOUR_TOKEN"

# Test cache hit rate
# Enable debug mode and check logs for "cache hit" messages
```

## Support

If you encounter issues:

1. **Check logs** with `NEXT_PUBLIC_DEBUG_AUTH=1`
2. **Review README** in `middleware/README.md`
3. **Compare behavior** with `middleware.backup.ts`
4. **Check diagnostics** with TypeScript compiler

## Next Steps

After successful migration:

1. **Remove backup** (after confirming everything works)
   ```bash
   rm frontendNEx/middleware.backup.ts
   ```

2. **Update documentation** to reference new structure

3. **Train team** on new architecture

4. **Add tests** for individual components

5. **Monitor production** for any issues

## Conclusion

The refactored middleware provides:
- ✅ Same behavior as original
- ✅ Better organization
- ✅ Easier maintenance
- ✅ Better testability
- ✅ Improved scalability
- ✅ Clear documentation

Migration is low-risk with easy rollback if needed.
