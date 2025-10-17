# Consolidated Auth Module

**Single source of truth for authentication in the Sintesa Finance Dashboard**

## Overview

This module consolidates all authentication-related functionality that was previously scattered across 9+ files into a clean, maintainable structure.

## Structure

```
lib/auth/
├── client.ts        # Authentication API client
├── hooks.ts         # React hooks for auth state (client-only)
├── utils.ts         # Utilities (cache, events, cross-tab sync)
├── utils-server.ts  # Server-safe utilities (for middleware/API routes)
└── index.ts         # Unified exports (client-side)
```

## ⚠️ Important: Client vs Server

- **Client Components**: Use `@/lib/auth` (includes React hooks)
- **Middleware/API Routes**: Use `@/lib/auth/utils-server` (no React dependencies)

## Usage

### Basic Authentication

```typescript
import { useAuth } from "@/lib/auth";

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    const result = await login("username", "password");
    if (result.success) {
      console.log("Logged in:", result.user);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.name}</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Auth Redirect

```typescript
import { useAuthRedirect } from "@/lib/auth";

function ProtectedPage() {
  // Automatically redirects to /login if not authenticated
  useAuthRedirect({ enabled: true, redirectTo: "/login" });

  return <div>Protected content</div>;
}
```

### RBAC Helpers

```typescript
import { useAuth, canManageUsers, canAccessSettings } from "@/lib/auth";

function AdminPanel() {
  const { user } = useAuth();

  if (!canManageUsers(user)) {
    return <div>Access denied</div>;
  }

  return <div>Admin panel</div>;
}
```

### Direct API Calls

```typescript
import { authClient } from "@/lib/auth";

// Validate session
const result = await authClient.validateSession();

// Refresh token
await authClient.refreshToken();

// Get CSRF token
const { csrfToken } = await authClient.getCSRFToken();
```

### Cache Management

```typescript
import { clearAuthCacheOnFail, setGlobalQueryClient } from "@/lib/auth";

// In your app setup
setGlobalQueryClient(queryClient);

// Clear cache on auth failure
clearAuthCacheOnFail();
```

### Cross-Tab Sync

```typescript
import { crossTabSync } from "@/lib/auth";

// Notify other tabs about auth events
crossTabSync.notifyLogin();
crossTabSync.notifyLogout();
crossTabSync.notifyTokenRefresh();
```

### Server-Side Usage (Middleware/API Routes)

```typescript
// ✅ CORRECT: Use utils-server for Edge/Node runtime
import { getAuthCache, setAuthCache, hashKey } from "@/lib/auth/utils-server";

// In middleware.ts
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  
  if (token) {
    const key = hashKey(token);
    const cached = getAuthCache(key);
    
    if (cached?.valid) {
      // User is authenticated
      return NextResponse.next();
    }
  }
  
  // Redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}
```

```typescript
// ❌ WRONG: Don't import from main index in server contexts
import { getAuthCache } from "@/lib/auth"; // This will fail in middleware!
```

## Migration from Old Imports

| Old Import | New Import |
|------------|------------|
| `@/lib/auth-client` | `@/lib/auth` |
| `@/hooks/useUnifiedAuth` | `@/lib/auth` |
| `@/lib/auth-sync` | `@/lib/auth` |
| `@/lib/authCacheInvalidator` | `@/lib/auth` |
| `@/hooks/useAuthRedirect` | `@/lib/auth` |
| `@/lib/auth-event-coordinator` | `@/lib/auth` |
| `@/lib/cross-tab-sync` | `@/lib/auth` |

## Features

### ✅ Single Source of Truth
- All auth state managed through Zustand + React Query
- Automatic synchronization between state layers
- No more conflicting auth states

### ✅ HTTP-Only Cookies
- Secure token storage (not accessible via JavaScript)
- Automatic cookie handling by browser
- CSRF protection built-in

### ✅ Proactive Token Refresh
- Automatic token refresh 5 minutes before expiry
- No more sudden 401 errors
- Seamless user experience

### ✅ Cross-Tab Synchronization
- Login/logout synced across browser tabs
- Token refresh notifications
- Consistent auth state everywhere

### ✅ RBAC Support
- Role-based access control helpers
- Permission checking utilities
- Role hierarchy support

### ✅ Type Safety
- Full TypeScript support
- Exported types for all interfaces
- IntelliSense-friendly

## API Reference

### Hooks

#### `useAuth()`
Main authentication hook. Returns:
- `user` - Current user object or null
- `isAuthenticated` - Boolean auth status
- `isLoading` - Loading state
- `login(username, password, rememberMe?)` - Login function
- `logout(reason?)` - Logout function
- `refetch()` - Refetch user data
- `validateSession()` - Validate current session
- `canManageUsers` - RBAC helper
- `canAccessSettings` - RBAC helper
- `getRoleDisplayName` - Get formatted role name

#### `useAuthRedirect(options?)`
Auto-redirect hook for protected routes. Options:
- `enabled` - Enable/disable redirect (default: true)
- `redirectTo` - Redirect destination (default: "/login")
- `checkInterval` - Check interval in ms (default: 5000)

### Client

#### `authClient`
Singleton instance for direct API calls:
- `login(username, password, rememberMe?)` - Login user
- `logout()` - Logout user
- `getCurrentUser()` - Get current user
- `validateSession()` - Validate session
- `refreshToken()` - Refresh access token
- `getCSRFToken()` - Get CSRF token

### Utilities

#### Cache Management
- `setGlobalQueryClient(client)` - Set React Query client
- `clearAuthCacheOnFail()` - Clear cache on auth failure
- `clearDataQueries()` - Clear data-related queries

#### Event Coordination
- `authEventCoordinator` - Event coordinator instance
- `emitTokenRefreshStart()` - Emit refresh start event
- `emitTokenRefreshSuccess()` - Emit refresh success event
- `emitTokenRefreshError()` - Emit refresh error event
- `emitAuthExpired()` - Emit auth expired event

#### Cross-Tab Sync
- `crossTabSync` - Cross-tab sync manager
- `sendCrossTabEvent(type, payload?)` - Send event to other tabs
- `listenForCrossTabEvents(callback)` - Listen for events

## Best Practices

1. **Use `useAuth()` in components** - Don't use `authClient` directly in React components
2. **Set up global query client early** - Call `setGlobalQueryClient()` in your app root
3. **Handle loading states** - Check `isLoading` before rendering auth-dependent UI
4. **Use RBAC helpers** - Don't check roles manually, use provided helpers
5. **Let hooks handle redirects** - Use `useAuthRedirect()` instead of manual redirects

## Troubleshooting

### "User is null after login"
- Check that `setGlobalQueryClient()` was called
- Verify login response includes user data
- Check browser console for errors

### "401 errors after token refresh"
- Ensure `clearAuthCacheOnFail()` is called on auth failures
- Check that cookies are being sent (`credentials: "include"`)
- Verify backend token refresh endpoint is working

### "Auth state not syncing across tabs"
- Check that `crossTabSync` is initialized
- Verify localStorage is accessible
- Check browser console for cross-tab sync errors

## Support

For issues or questions, check:
1. This README
2. TypeScript types (hover over functions in your IDE)
3. Implementation in `lib/auth/` files
4. Team documentation
