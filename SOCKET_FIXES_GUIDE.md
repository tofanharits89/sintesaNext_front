# Socket Connection Timeout - Critical Fixes

## Issues Identified

### 1. **Race Condition - Multiple Concurrent Connection Attempts** (CRITICAL)
**Location:** `useUnifiedSocket.ts` + `socket-client.ts`
**Problem:** Each component using `useUnifiedSocket()` has its own `initializedRef`, so multiple components trigger simultaneous `connect()` calls on the shared singleton socket.
**Impact:** Backend overwhelmed by concurrent handshakes, timeouts occur.

### 2. **No Connection Lock in SocketClient** (CRITICAL)
**Location:** `socket-client.ts` line 76-132 (connect method)
**Problem:** The `connect()` method doesn't prevent concurrent calls - if called twice simultaneously, both create socket instances and race.
**Impact:** Socket state conflicts, listener duplication, connection failures.

### 3. **Event Listener Duplication** (HIGH)
**Location:** `socket-client.ts` line 235-245 (applyQueuedListeners)
**Problem:** Every connection attempt re-registers all listeners without checking if already registered.
**Impact:** Event handlers fire multiple times, memory leaks, unexpected behavior.

### 4. **Global Initialization Flag Per-Hook** (HIGH)
**Location:** `useUnifiedSocket.ts` line 49 (initializedRef)
**Problem:** `initializedRef` is per-hook instance, not global. Multiple hooks bypass the flag.
**Impact:** Multiple simultaneous initialization attempts.

### 5. **Insufficient Timeout + Poor Diagnostics** (MEDIUM)
**Location:** `socket-client.ts` line 112-115 (timeout config)
**Problem:** 10s default may be too short for slow networks; error messages lack detail.
**Impact:** Timeouts on legitimate slow connections; hard to debug.

---

## Fixes Required

### FIX 1: Add Connection Lock to SocketClient (CRITICAL)

**File:** `src/lib/socket-client.ts`

**Change 1: Add lock properties to class (after line 49)**
```typescript
private connectPromise: Promise<Socket> | null = null;
private isConnecting = false;
private registeredListeners = new Set<string>();
```

**Change 2: Replace `connect()` method (lines 75-132)**
Replace the entire connect() method with:
```typescript
async connect(): Promise<Socket> {
  if (this.isDestroyed) {
    throw new Error("Socket client has been destroyed");
  }

  // Return existing connection if already connected
  if (this.socket?.connected) {
    return this.socket;
  }

  // Return pending promise if already connecting (prevents concurrent attempts)
  if (this.isConnecting && this.connectPromise) {
    this.debugLog("Connection already in progress, returning pending promise");
    return this.connectPromise;
  }

  // Set connection lock
  this.isConnecting = true;
  
  this.connectPromise = (async () => {
    try {
      if (this.socket) {
        this.cleanup();
      }

      this.setState("connecting");

      const socketOptions: any = {
        path: this.config.path,
        transports: ["websocket", "polling"] as const,
        timeout: this.config.timeout,
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        reconnectionDelayMax: this.config.reconnectionDelayMax,
        withCredentials: true,
        autoConnect: true,
      };

      this.socket = io(this.config.url || "http://localhost:88", socketOptions);
      this.setupEventListeners();
      this.connectionStats.totalConnections++;
      this.connectionStats.connectedAt = new Date().toISOString();

      return new Promise<Socket>((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.debugLog("Connection timeout after", this.config.timeout, "ms");
          reject(new Error(`Connection timeout after ${this.config.timeout}ms`));
        }, this.config.timeout);

        this.socket!.once("connect", () => {
          clearTimeout(timeout);
          this.debugLog("Socket connected successfully");
          resolve(this.socket!);
        });

        this.socket!.once("connect_error", (error: any) => {
          clearTimeout(timeout);
          this.debugLog("Connection error:", error);
          reject(error);
        });
      });
    } finally {
      this.isConnecting = false;
      this.connectPromise = null;
    }
  })();

  return this.connectPromise;
}
```

### FIX 2: Add Event Listener Deduplication (HIGH)

**File:** `src/lib/socket-client.ts`

**Replace `applyQueuedListeners()` method (lines 234-244):**
```typescript
private applyQueuedListeners(): void {
  if (!this.socket) return;

  this.eventListeners.forEach((listeners, event) => {
    // Prevent duplicate listener registration
    const listenerKey = `${this.socket!.id}:${event}`;
    if (this.registeredListeners.has(listenerKey)) {
      return; // Already registered
    }
    this.registeredListeners.add(listenerKey);

    this.socket!.on(event, (...args: any[]) => {
      const eventListeners = this.eventListeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(listener => listener(...args));
      }
    });
  });
}
```

**Add to `cleanup()` method (before line ~501):**
```typescript
// Clear registered listeners tracking
this.registeredListeners.clear();
```

### FIX 3: Improve Hook Initialization (HIGH)

**File:** `src/hooks/useUnifiedSocket.ts`

**Add global flag (after imports, before component):**
```typescript
// Global initialization lock to prevent concurrent socket initialization
const globalInitLock = {
  isInitializing: false,
  initPromise: null as Promise<void> | null,
};
```

**Replace the auto-connect useEffect (lines 100-173):**
```typescript
useEffect(() => {
  if (!isClient || !isAuthenticated || !user) {
    return;
  }

  // Use global initialization lock, not per-hook
  if (initializedRef.current && socketClient.isConnected()) {
    syncState();
    return;
  }

  // Prevent concurrent initializations across all hook instances
  if (globalInitLock.isInitializing && globalInitLock.initPromise) {
    globalInitLock.initPromise.then(() => {
      initializedRef.current = true;
      syncState();
    }).catch(() => {
      // Retry if global init failed
    });
    return;
  }

  const initializeSocket = async () => {
    globalInitLock.isInitializing = true;
    
    try {
      // Check if already connected before attempting
      if (socketClient.isConnected()) {
        initializedRef.current = true;
        syncState();
        return;
      }

      setState((prev) => ({ ...prev, error: null }));

      const justLoggedIn = sessionStorage.getItem("just_logged_in");
      const connectionDelay = justLoggedIn === "true" ? 500 : 0;

      if (justLoggedIn === "true") {
        sessionStorage.removeItem("just_logged_in");
      }

      if (connectionDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, connectionDelay));
      }

      await socketClient.connect();
      initializedRef.current = true;
      syncState();
    } catch (error) {
      console.error("Failed to initialize socket:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Connection failed",
      }));

      // Retry once after delay
      setTimeout(() => {
        if (!socketClient.isConnected()) {
          socketClient
            .connect()
            .then(() => {
              initializedRef.current = true;
              syncState();
            })
            .catch((retryError) => {
              console.error("Socket retry connection failed:", retryError);
            });
        }
      }, 2000);
    } finally {
      globalInitLock.isInitializing = false;
    }
  };

  globalInitLock.initPromise = initializeSocket();
}, [isClient, isAuthenticated, user, syncState]);
```

### FIX 4: Increase Default Timeout (MEDIUM)

**File:** `src/lib/socket-client.ts`

**Update constructor (line ~64):**
```typescript
this.config = {
  url: config.url || process.env.NEXT_PUBLIC_SOCKET_URL || socketUrl,
  path: config.path || process.env.NEXT_PUBLIC_SOCKET_PATH || "/socket.io",
  autoConnect: config.autoConnect ?? false,
  debug: config.debug ?? process.env.NODE_ENV === "development",
  reconnection: config.reconnection ?? true,
  reconnectionAttempts: config.reconnectionAttempts ?? 5,
  reconnectionDelay: config.reconnectionDelay ?? 1000,
  reconnectionDelayMax: config.reconnectionDelayMax ?? 10000,
  timeout: config.timeout ?? 15000, // Increased from 10000 to 15000
};
```

### FIX 5: Better Error Diagnostics (OPTIONAL)

Add to `connect()` method error handler:
```typescript
const diagnosticInfo = {
  url: this.config.url,
  timeout: this.config.timeout,
  isConnected: this.socket?.connected,
  socketId: this.socket?.id,
  socketState: this.state,
  timestamp: new Date().toISOString(),
};
console.error("[Socket] Connection error details:", diagnosticInfo);
```

---

## Testing After Fixes

1. **Unit Test**: Check that concurrent `connect()` calls return the same promise
2. **Integration Test**: Verify multiple components can use `useUnifiedSocket()` without conflicts
3. **Load Test**: Check performance with many socket events

---

## Environment Variables (Optional)

Add to `.env.local` if needed:
```
NEXT_PUBLIC_SOCKET_TIMEOUT=15000
```

Then update config to use: `timeout: parseInt(process.env.NEXT_PUBLIC_SOCKET_TIMEOUT || '15000')`
