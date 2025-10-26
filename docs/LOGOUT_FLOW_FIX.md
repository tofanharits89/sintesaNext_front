# Logout Flow Fix - Summary

## Problem
The logout loading screen ("Mengeluaran...") was incorrectly appearing when users logged in and would not disappear on app pages.

## Root Causes Identified

### 1. **Logout State Persisted to LocalStorage** ❌
- The `isLogoutInProgress` state was being persisted to localStorage via the `partialize` function
- This caused the logout loading to persist across page reloads and appear during login

### 2. **Middleware Logic Error** ❌
- The middleware's `isLogoutInProgress()` function had faulty logic: `logoutInProgress !== null`
- This would return true for ANY value, including the timestamp string set in sessionStorage

### 3. **No Cleanup on Login** ❌
- The `setAuthenticated()` and `updateUser()` functions didn't clear the logout flag
- This allowed stale logout state to remain after successful login

## Solutions Implemented ✅

### 1. **Removed Logout State from LocalStorage**
**File: `src/stores/session-store.ts`**
- Removed `isLogoutInProgress` from the `partialize` function
- Now only uses sessionStorage (not localStorage) for logout state
- Added auto-cleanup logic in `onRehydrateStorage` to clear stale flags on login page

```typescript
partialize: (state) => ({
  sessionExpiry: state.sessionExpiry,
  lastActivity: state.lastActivity,
  isAuthenticated: state.isAuthenticated,
  user: state.user,
  // isLogoutInProgress is NOT persisted - it should only be in sessionStorage
})
```

### 2. **Fixed Middleware Logic**
**File: `middleware.ts`**
- Fixed `isLogoutInProgress()` to only return true for recent flags (within 30 seconds)
- Added proper cleanup of stale flags

```typescript
function isLogoutInProgress(request: NextRequest): boolean {
  // Check for explicit logout flag
  const logoutInProgress = request.cookies.get('logout_in_progress')?.value ||
    request.headers.get('x-logout-in-progress');

  // Explicit logout flag set
  if (logoutInProgress === 'true') {
    return true;
  }

  // Check sessionStorage only on client side
  if (typeof window !== 'undefined') {
    const sessionLogoutFlag = sessionStorage.getItem('sintesa_logout_in_progress');
    if (sessionLogoutFlag) {
      // Check if the flag is recent (within 30 seconds)
      const timestamp = parseInt(sessionLogoutFlag, 10);
      const age = Date.now() - timestamp;
      if (age < 30000) { // 30 seconds
        return true;
      } else {
        // Flag is stale, clear it
        sessionStorage.removeItem('sintesa_logout_in_progress');
      }
    }
  }

  return false;
}
```

### 3. **Auto-Clear Logout State on Login**
**File: `src/stores/session-store.ts`**
- Updated `setAuthenticated()` to clear logout flag when user logs in
- Updated `updateUser()` to clear logout flag when user data is updated
- Both functions now remove sessionStorage flag and reset state

```typescript
setAuthenticated: (authenticated, user = null) => {
  // If user is logging in (authenticated = true), clear logout in progress
  if (authenticated && user) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sintesa_logout_in_progress');
    }
    set({
      isAuthenticated: authenticated,
      user,
      isLogoutInProgress: false,
      isLoggingOut: false,
    });
  } else {
    set({
      isAuthenticated: authenticated,
      user,
    });
  }
}
```

### 4. **Enhanced LogoutGuard**
**File: `src/components/auth/LogoutGuard.tsx`**
- Added automatic cleanup when user reaches login page
- Added automatic cleanup when user becomes authenticated
- Added stale flag cleanup (5-second timeout)

```typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;

    // Always clear logout flag on login page
    if (path === '/login') {
      useAuthSessionStore.getState().setLogoutInProgress(false);
      sessionStorage.removeItem('sintesa_logout_in_progress');
      return;
    }

    // Clear if user is authenticated
    if (isAuthenticated) {
      useAuthSessionStore.getState().setLogoutInProgress(false);
      sessionStorage.removeItem('sintesa_logout_in_progress');
      return;
    }

    // Clear stale flags after 5 seconds
    const logoutInProgress = sessionStorage.getItem('sintesa_logout_in_progress');
    if (logoutInProgress) {
      const timestamp = parseInt(logoutInProgress, 10);
      const age = Date.now() - timestamp;
      if (age > 5000) {
        useAuthSessionStore.getState().setLogoutInProgress(false);
        sessionStorage.removeItem('sintesa_logout_in_progress');
      }
    }
  }
}, [isLogoutInProgress, isAuthenticated]);
```

## Test Coverage ✅

Created comprehensive test suite:

1. **logout-flow.test.tsx** (6 tests)
   - Verifies logout state is set correctly
   - Verifies sessionStorage persistence
   - Verifies state reset

2. **logout-loading-on-login.test.tsx** (6 tests)
   - Verifies login doesn't trigger logout loading
   - Verifies logout state is cleared on login
   - Verifies stale flags are cleaned up

**All 12 tests passing! ✅**

## How the Flow Works Now

### Successful Logout:
1. User clicks logout → Sets `isLogoutInProgress: true` + sessionStorage flag
2. Logout overlay appears with "Mengeluaran..."
3. API clears server session
4. State cleared locally
5. Middleware detects logout flag → Direct redirect to `/login`
6. Login page loads → LogoutGuard auto-clears flag
7. User sees clean login screen

### Login (Fixed!):
1. User logs in → `setAuthenticated(true, user)` called
2. Function auto-clears `isLogoutInProgress` flag
3. Function removes sessionStorage flag
4. LogoutGuard also clears flag as safety net
5. **No logout loading appears!** ✅

### Page Reload:
1. State rehydrates from localStorage (no logout flag persisted)
2. `onRehydrateStorage` checks sessionStorage
3. If on login page, clears any stale flag
4. If stale flag exists (>30s), clears it
5. **No logout loading appears!** ✅

## Files Modified

1. ✅ `src/stores/session-store.ts` - Fixed persistence & cleanup
2. ✅ `middleware.ts` - Fixed logout detection logic
3. ✅ `src/lib/auth/simplified-hooks.ts` - Updated logout flow
4. ✅ `src/components/ui/login-loading.tsx` - Added context support
5. ✅ `src/components/auth/LogoutGuard.tsx` - Enhanced auto-cleanup
6. ✅ `src/components/layout/navbar.tsx` - Fixed logout handler
7. ✅ `src/app/dashboard/layout.tsx` - Integrated LogoutGuard
8. ✅ Test files - Comprehensive test coverage

## Result

✅ **No logout loading during login**
✅ **No logout loading after page reload**
✅ **Proper logout flow with "Mengeluaran..." message**
✅ **Auto-cleanup of stale flags**
✅ **All 12 tests passing**
✅ **Backward compatible with existing auth flow**
