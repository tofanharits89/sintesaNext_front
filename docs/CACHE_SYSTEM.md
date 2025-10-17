# Unified Cache System Documentation

**Phase 4 Implementation - Cache Unification**

## Overview

The unified cache system provides centralized cache invalidation across all application cache layers:

- **React Query** - API response caching
- **Zustand** - Application state management
- **localStorage** - Persistent browser storage
- **sessionStorage** - Session-scoped storage

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cache Event Manager                       │
│  (lib/auth/cache-events.ts)                                 │
├─────────────────────────────────────────────────────────────┤
│  • invalidateAuth()     - Clear auth caches                 │
│  • invalidateUser()     - Clear user data                   │
│  • invalidateDataQueries() - Clear dashboard data           │
│  • invalidateAll()      - Nuclear option                    │
│  • getCacheStats()      - Monitor cache state               │
└─────────────────────────────────────────────────────────────┘
                            ▼
        ┌───────────────────┴───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ React Query  │   │   Zustand    │   │   Storage    │
│   Cache      │   │    Store     │   │ (local/sess) │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Usage

### Automatic Cache Management

Cache events are automatically triggered by auth hooks:

```typescript
import { useAuth } from "@/lib/auth";

function LoginPage() {
  const { login, logout } = useAuth();

  // Login automatically clears stale caches
  const handleLogin = async () => {
    await login(username, password);
    // ✅ cacheEvents.onLogin() called automatically
  };

  // Logout automatically clears all auth caches
  const handleLogout = async () => {
    await logout();
    // ✅ cacheEvents.invalidateAuth() called automatically
  };
}
```

### Manual Cache Control

For advanced use cases, you can manually control caches:

```typescript
import { 
  cacheEvents, 
  clearAuthCaches, 
  clearDataCaches,
  clearAllCaches 
} from "@/lib/auth";

// Clear auth caches with options
clearAuthCaches({
  preserveTheme: true,      // Keep theme preference
  preserveLanguage: true,   // Keep language setting
  clearReactQuery: true,    // Clear React Query cache
  clearZustand: true,       // Reset Zustand store
  clearLocalStorage: true,  // Clear localStorage
  clearSessionStorage: true // Clear sessionStorage
});

// Clear only data queries (dashboard, reports)
clearDataCaches();

// Clear specific user data
cacheEvents.invalidateUser(userId);

// Nuclear option - clear everything
clearAllCaches();
```

### Cache Debugging

#### Using the Debug Hook

```typescript
import { useCacheDebug } from "@/lib/auth";

function DebugComponent() {
  const { 
    getCacheStats, 
    debugCache,
    clearAllCaches 
  } = useCacheDebug();

  const handleDebug = () => {
    // Get current cache statistics
    const stats = getCacheStats();
    console.log("Cache Stats:", stats);
    // {
    //   reactQueryCacheSize: 15,
    //   localStorageSize: 8,
    //   sessionStorageSize: 3,
    //   recentEvents: [...]
    // }

    // Log detailed cache state to console
    debugCache();
  };

  return (
    <button onClick={handleDebug}>
      Debug Cache
    </button>
  );
}
```

#### Using the Debug Panel

Add the visual debug panel to your layout (development only):

```typescript
import { CacheDebugPanel } from "@/components/dev/CacheDebugPanel";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        
        {/* Show debug panel in development */}
        {process.env.NODE_ENV === 'development' && (
          <CacheDebugPanel />
        )}
      </body>
    </html>
  );
}
```

The debug panel provides:
- Real-time cache statistics
- Recent cache invalidation events
- One-click cache clearing buttons
- Console logging for detailed inspection

## Cache Invalidation Events

The system tracks these events:

| Event | Trigger | Action |
|-------|---------|--------|
| `auth_login` | User logs in | Clear stale data from previous sessions |
| `auth_logout` | User logs out | Clear all auth-related caches |
| `auth_expired` | Session expires | Clear auth caches, redirect to login |
| `user_updated` | User profile changes | Invalidate user-specific queries |
| `token_refreshed` | Token refresh succeeds | Log event (no cache clearing) |
| `clear_all` | Manual clear all | Nuclear option - clear everything |

## Cache Preservation

By default, certain user preferences are preserved across logout:

- **Theme** - Dark/light mode preference
- **Language** - i18n language selection

You can customize preservation:

```typescript
// Don't preserve anything
clearAuthCaches({
  preserveTheme: false,
  preserveLanguage: false
});

// Only preserve theme
clearAuthCaches({
  preserveTheme: true,
  preserveLanguage: false
});
```

## Best Practices

### ✅ DO

- Use automatic cache management via `useAuth` hook
- Preserve user preferences (theme, language) on logout
- Use `clearDataCaches()` when switching users
- Monitor cache stats in development
- Clear specific caches when possible (not nuclear option)

### ❌ DON'T

- Don't manually call `queryClient.clear()` - use `clearAllCaches()`
- Don't manually call `localStorage.clear()` - use `clearAuthCaches()`
- Don't use `invalidateAll()` unless absolutely necessary
- Don't forget to preserve user preferences
- Don't clear caches on every render (performance impact)

## Troubleshooting

### Cache Not Clearing

1. Check if queryClient is initialized:
   ```typescript
   import { isQueryClientAvailable } from "@/lib/auth";
   console.log("Query client available:", isQueryClientAvailable());
   ```

2. Verify cache events are being triggered:
   ```typescript
   const stats = getCacheStats();
   console.log("Recent events:", stats.recentEvents);
   ```

3. Use debug panel to inspect cache state

### Stale Data After Logout

1. Ensure `clearAuthCaches()` is called in logout flow
2. Check if data queries are properly invalidated
3. Verify React Query cache keys match

### Lost User Preferences

1. Check preservation options in `clearAuthCaches()`
2. Ensure `preserveTheme: true` and `preserveLanguage: true`
3. Verify localStorage keys match preserved keys

## Performance Considerations

- Cache clearing is synchronous and fast
- React Query invalidation is optimized
- localStorage/sessionStorage clearing is instant
- Event history is limited to 50 entries (memory efficient)

## Migration from Old System

### Before (Scattered Cache Clearing)

```typescript
// Old way - scattered across multiple files
queryClient.clear();
authState.reset();
localStorage.clear();
sessionStorage.clear();
```

### After (Unified Cache System)

```typescript
// New way - single call
clearAuthCaches();
```

## API Reference

### Functions

#### `clearAuthCaches(options?)`
Clear authentication-related caches.

**Options:**
- `preserveTheme?: boolean` - Keep theme preference (default: true)
- `preserveLanguage?: boolean` - Keep language setting (default: true)
- `clearReactQuery?: boolean` - Clear React Query cache (default: true)
- `clearZustand?: boolean` - Reset Zustand store (default: true)
- `clearLocalStorage?: boolean` - Clear localStorage (default: true)
- `clearSessionStorage?: boolean` - Clear sessionStorage (default: true)

#### `clearUserCaches(userId?)`
Clear user-specific data caches.

**Parameters:**
- `userId?: string` - Specific user ID to clear (optional)

#### `clearDataCaches()`
Clear all data query caches (dashboard, reports, etc.).

#### `clearAllCaches(options?)`
Nuclear option - clear all caches.

**Options:**
- `preserveTheme?: boolean` - Keep theme preference (default: true)
- `preserveLanguage?: boolean` - Keep language setting (default: true)

#### `getCacheStats()`
Get current cache statistics.

**Returns:**
```typescript
{
  reactQueryCacheSize: number;
  localStorageSize: number;
  sessionStorageSize: number;
  recentEvents: Array<{
    event: CacheInvalidationEvent;
    timestamp: number;
  }>;
}
```

#### `debugCacheState()`
Log detailed cache state to console.

### Hooks

#### `useCacheDebug()`
React hook for cache debugging.

**Returns:**
```typescript
{
  getCacheStats: () => CacheStats;
  debugCache: () => void;
  clearAllCaches: () => void;
  clearAuthCaches: () => void;
  clearDataCaches: () => void;
}
```

## Examples

### Example 1: Custom Logout with Cache Control

```typescript
import { useAuth, clearAuthCaches } from "@/lib/auth";

function CustomLogout() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    // Clear caches with custom options
    clearAuthCaches({
      preserveTheme: true,
      preserveLanguage: false, // Clear language on logout
    });

    // Perform logout
    await logout();
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Example 2: Admin Panel with Cache Monitoring

```typescript
import { useCacheDebug } from "@/lib/auth";
import { useEffect, useState } from "react";

function AdminCachePanel() {
  const { getCacheStats, clearAllCaches } = useCacheDebug();
  const [stats, setStats] = useState(getCacheStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getCacheStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Cache Statistics</h2>
      <p>React Query: {stats.reactQueryCacheSize} queries</p>
      <p>localStorage: {stats.localStorageSize} keys</p>
      <p>sessionStorage: {stats.sessionStorageSize} keys</p>
      
      <button onClick={clearAllCaches}>
        Clear All Caches
      </button>
    </div>
  );
}
```

### Example 3: User Switch with Cache Clearing

```typescript
import { clearUserCaches, clearDataCaches } from "@/lib/auth";

async function switchUser(newUserId: string) {
  // Clear previous user's data
  clearUserCaches();
  clearDataCaches();

  // Load new user
  await loadUser(newUserId);
}
```

## Support

For issues or questions:
1. Check the debug panel for cache state
2. Review console logs for cache events
3. Verify cache invalidation is being triggered
4. Check React Query DevTools for query state

## Future Enhancements

Potential improvements for future versions:

- [ ] Cache size limits and automatic cleanup
- [ ] Cache compression for large datasets
- [ ] Cache persistence across browser sessions
- [ ] Cache synchronization across tabs
- [ ] Cache warming strategies
- [ ] Performance metrics and analytics
