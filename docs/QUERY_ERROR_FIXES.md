# Query Error Fixes

This document outlines the fixes applied to resolve the SWR "Resource not found" error and the "Maximum update depth exceeded" infinite loop error.

## Issues Identified

1. **SWR "Resource not found" error**: The fetcher function was throwing errors for 404 responses, which is expected behavior when no saved queries exist.

2. **"Maximum update depth exceeded" error**: Infinite re-renders caused by:
   - Unstable object references in useMemo dependencies
   - Rapid cache invalidations triggering more updates
   - Components re-rendering due to changing props/state

## Fixes Applied

### 1. Stabilized Hook Parameters

**File**: `src/hooks/use-saved-queries.ts`

- Added parameter stabilization using `createStableRef` utility
- Memoized query parameters to prevent infinite dependency loops
- Reduced SWR retry count and increased intervals

```typescript
// Before
const key = useMemo(() => {
  // Direct params usage could cause loops
}, [params.page, params.limit, params.search]);

// After  
const stableParams = useMemo(() => createStableRef({
  page: params.page,
  limit: params.limit,
  search: params.search?.trim() || undefined,
}), [params.page, params.limit, params.search]);
```

### 2. Debounced Cache Invalidation

**File**: `src/hooks/use-saved-queries.ts`

- Added 100ms debounce to cache invalidation to prevent rapid updates
- Reduced retry counts and increased intervals

```typescript
// Before
swrMutate(key, undefined, { revalidate: true });

// After
setTimeout(() => {
  swrMutate(key, undefined, { revalidate: true });
}, 100);
```

### 3. Graceful 404 Handling

**File**: `src/hooks/use-saved-queries.ts`

- Modified fetcher to return empty results for 404 on saved queries endpoint instead of throwing

```typescript
case 404:
  // For saved queries, 404 might be expected (no queries found)
  if (url.includes('/saved-queries')) {
    return { queries: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }
  errorMessage = "Resource not found";
  break;
```

### 4. Component Memoization

**Files**: 
- `src/components/inquiry-data/query-management.tsx`
- `src/components/inquiry-data/query-loader-button.tsx`

- Wrapped components with `React.memo` to prevent unnecessary re-renders
- Memoized query parameters in components

### 5. Error Boundary Protection

**Files**:
- `src/components/ui/query-error-boundary.tsx` (new)
- `src/app/inquiry-data/belanja/page.tsx`

- Created specialized error boundary for query-related errors
- Auto-recovery for infinite loop errors
- Wrapped QueryManagement component with error boundary

### 6. Debugging Utilities

**Files**:
- `src/utils/query-error-recovery.ts` (new)
- `src/utils/render-tracker.ts` (new)

- Added render tracking to detect infinite loops in development
- Error recovery utilities with retry logic
- Enhanced error logging with context

## Testing the Fixes

1. **Check for 404 errors**: Navigate to saved queries when none exist - should show empty state instead of error
2. **Check for infinite loops**: Monitor console for render tracking warnings
3. **Check error recovery**: Error boundary should catch and recover from infinite loops
4. **Check performance**: Reduced re-renders should improve performance

## Monitoring

In development mode, the render tracker will log warnings if components render more than 50 times in 1 second, indicating potential infinite loops.

```javascript
// Check render statistics
import { getRenderStats } from '@/utils/render-tracker';
console.table(getRenderStats());
```

## Prevention

To prevent similar issues in the future:

1. Always memoize object parameters passed to hooks
2. Use stable references for complex objects
3. Debounce rapid state updates
4. Wrap components that use complex hooks with error boundaries
5. Monitor render counts in development
6. Handle expected API errors gracefully (like 404 for empty results)