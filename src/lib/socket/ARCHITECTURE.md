# Socket Client - Enterprise-Grade Modular Architecture

## Overview

The Socket Client has been refactored into a fully modular, enterprise-grade architecture with clear separation of concerns. Each manager handles a specific aspect of socket functionality, making the codebase more maintainable, testable, and scalable.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      SocketClient                            │
│                  (Main Orchestrator)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────────┐
│  Core Layer   │         │  Feature Layer   │
└───────────────┘         └──────────────────┘
        │                         │
        ├─────────────────────────┼──────────────────────┐
        │                         │                      │
        ▼                         ▼                      ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│SocketManager │    │ErrorHandler      │    │Reconnection      │
│              │    │Manager           │    │Manager           │
│- Connection  │    │                  │    │                  │
│- Transport   │    │- Categorization  │    │- Exponential     │
│- Handshake   │    │- Error routing   │    │  backoff         │
└──────────────┘    │- History         │    │- Scheduling      │
                    └──────────────────┘    └──────────────────┘
        │                         │                      │
        ▼                         ▼                      ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│StateManager  │    │SessionManager    │    │Notification      │
│              │    │                  │    │Manager           │
│- State       │    │- Expiration      │    │                  │
│- Transitions │    │- Logout flow     │    │- Toast messages  │
│- History     │    │- Recovery        │    │- User feedback   │
└──────────────┘    └──────────────────┘    └──────────────────┘
        │                         │                      │
        ▼                         ▼                      ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│TokenRefresh  │    │StatePersistence  │    │EventManager      │
│Manager       │    │Manager           │    │                  │
│              │    │                  │    │- Listeners       │
│- Proactive   │    │- sessionStorage  │    │- Emit/On/Off     │
│- Scheduling  │    │- Fast reconnect  │    │- Queue           │
└──────────────┘    └──────────────────┘    └──────────────────┘
```

## Manager Responsibilities

### Core Layer

#### 1. SocketManager
**Purpose**: Core socket connection and transport management

**Responsibilities**:
- Create and manage Socket.IO connection
- Handle transport layer (WebSocket/Polling)
- Manage handshake protocol
- Emit events to server
- Handle server-ready state

**Key Methods**:
- `createSocket()`: Initialize socket connection
- `connect()`: Establish connection
- `disconnect()`: Close connection
- `emit()`: Send events to server
- `isReady()`: Check if server is ready

#### 2. ConnectionStateManager
**Purpose**: Track and manage connection state lifecycle

**Responsibilities**:
- Maintain current connection state
- Track state transitions
- Record state history
- Manage socket ID
- Calculate connection statistics

**Key Methods**:
- `setState()`: Update connection state
- `getState()`: Get current state
- `getConnectionStats()`: Get statistics
- `canReconnect()`: Check if reconnection is allowed

#### 3. TokenRefreshManager
**Purpose**: Proactive token refresh management

**Responsibilities**:
- Monitor token expiration
- Schedule periodic checks
- Refresh tokens before expiry
- Handle page visibility changes
- Coordinate with auth system

**Key Methods**:
- `start()`: Begin monitoring
- `stop()`: Stop monitoring
- `checkAndRefresh()`: Check and refresh if needed
- `isTokenExpiringSoon()`: Check token validity

#### 4. EventManager
**Purpose**: Event handling and lifecycle management

**Responsibilities**:
- Register event listeners
- Manage listener lifecycle
- Queue events when disconnected
- Process queued events on reconnect
- Handle once/priority listeners

**Key Methods**:
- `addListener()`: Register event listener
- `removeListener()`: Unregister listener
- `emit()`: Emit event to server
- `processQueuedEvents()`: Process queue

### Feature Layer

#### 5. ErrorHandlerManager
**Purpose**: Centralized error handling and categorization

**Responsibilities**:
- Categorize errors by type
- Determine error severity
- Route errors to appropriate handlers
- Track error history
- Provide error statistics

**Key Methods**:
- `handleConnectionError()`: Handle connection errors
- `handleSocketError()`: Handle socket errors
- `handleTokenRefreshError()`: Handle token errors
- `getErrorStats()`: Get error statistics

**Error Categories**:
- `auth`: Authentication failures
- `token`: Token expiration/refresh issues
- `network`: Network connectivity problems
- `cors`: Cross-origin issues
- `session`: Session expiration
- `unknown`: Uncategorized errors

#### 6. ReconnectionManager
**Purpose**: Intelligent reconnection with exponential backoff

**Responsibilities**:
- Schedule reconnection attempts
- Calculate exponential backoff delays
- Track reconnection attempts
- Determine if reconnection should occur
- Maintain reconnection statistics

**Key Methods**:
- `scheduleReconnect()`: Schedule reconnection
- `shouldReconnect()`: Check if should reconnect
- `cancelScheduledReconnect()`: Cancel scheduled attempt
- `getStats()`: Get reconnection statistics

**Configuration**:
```typescript
{
  enabled: true,
  maxAttempts: 5,
  initialDelay: 1000,    // 1 second
  maxDelay: 10000,       // 10 seconds
  factor: 2              // Exponential multiplier
}
```

**Backoff Formula**: `delay = min(initialDelay * (factor ^ attempts), maxDelay)`

#### 7. SessionManager
**Purpose**: Session lifecycle and expiration handling

**Responsibilities**:
- Handle session expiration events
- Attempt session recovery via token refresh
- Manage logout flow
- Clear authentication cookies
- Coordinate with auth system
- Redirect to login page

**Key Methods**:
- `handleSessionExpired()`: Handle expiration
- `performLogout()`: Execute logout
- `validateSession()`: Check session validity

**Recovery Strategy**:
1. Detect session expiration
2. Attempt token refresh
3. If successful, reconnect socket
4. If failed, perform logout

#### 8. NotificationManager
**Purpose**: User notifications and feedback

**Responsibilities**:
- Show toast notifications
- Manage notification lifecycle
- Track notification history
- Provide notification statistics
- Handle connection-specific toasts

**Key Methods**:
- `showConnectionError()`: Show connection error
- `showReconnecting()`: Show reconnection status
- `showSessionExpired()`: Show session expiry
- `dismissConnectionToast()`: Dismiss connection toast

**Notification Types**:
- `info`: Informational messages
- `success`: Success confirmations
- `warning`: Warning messages
- `error`: Error notifications

#### 9. StatePersistenceManager
**Purpose**: State persistence for faster reconnection

**Responsibilities**:
- Persist connection state to sessionStorage
- Restore state on page load
- Validate state age
- Clear stale state
- Optimize reconnection

**Key Methods**:
- `persistState()`: Save state
- `restoreState()`: Load state
- `clearState()`: Remove state
- `isStateValid()`: Check validity

**Persisted Data**:
```typescript
{
  lastConnected: number,
  socketId: string | null,
  reconnectAttempts: number,
  state: SocketState
}
```

## Benefits of Modular Architecture

### 1. Separation of Concerns
Each manager has a single, well-defined responsibility, making the code easier to understand and maintain.

### 2. Testability
Managers can be unit tested independently with mocked dependencies.

### 3. Reusability
Managers can be reused in different contexts or applications.

### 4. Scalability
New features can be added as new managers without modifying existing code.

### 5. Maintainability
Changes to one manager don't affect others, reducing regression risk.

### 6. Debugging
Issues can be isolated to specific managers, making debugging easier.

### 7. Documentation
Each manager is self-documenting with clear interfaces and responsibilities.

## Usage Example

```typescript
import { SocketClient } from '@/lib/socket';

// Create client with configuration
const client = new SocketClient({
  url: 'http://localhost:88',
  path: '/socket.io',
  autoConnect: true,
  debug: true,
  reconnection: {
    enabled: true,
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 2
  }
});

// Listen to events
client.on('message:new', (message) => {
  console.log('New message:', message);
});

// Emit events
client.emit('message:send', { content: 'Hello' });

// Emit with acknowledgment
try {
  const result = await client.emitWithAck('message:send', {
    content: 'Hello'
  });
  console.log('Message sent:', result);
} catch (error) {
  console.error('Failed to send:', error);
}

// Get connection stats
const stats = client.getConnectionStats();
console.log('Connection stats:', stats);

// Cleanup on unmount
client.cleanup();
```

## Migration Guide

The refactored architecture maintains **100% backward compatibility**. No changes are required to existing code that uses the SocketClient.

### What Changed
- Internal implementation split into specialized managers
- Better error handling and categorization
- More robust reconnection logic
- Enhanced session management
- Improved state persistence

### What Stayed the Same
- Public API (all methods remain unchanged)
- Event handling interface
- Configuration options
- Singleton pattern support

## Testing Strategy

### Unit Tests
Each manager should have comprehensive unit tests:

```typescript
describe('ErrorHandlerManager', () => {
  it('should categorize auth errors correctly', () => {
    const manager = new ErrorHandlerManager(logger);
    const error = { message: 'TOKEN_EXPIRED' };
    const category = manager.handleConnectionError(error);
    expect(category.type).toBe('token');
    expect(category.severity).toBe('high');
  });
});
```

### Integration Tests
Test manager coordination:

```typescript
describe('SocketClient Integration', () => {
  it('should reconnect after network error', async () => {
    const client = new SocketClient({ autoConnect: false });
    // Simulate network error
    // Verify reconnection attempt
  });
});
```

## Performance Considerations

### Memory Management
- Managers clean up resources on `cleanup()`
- Event listeners are properly removed
- History arrays have size limits
- Timeouts are cleared on cleanup

### Network Efficiency
- Exponential backoff prevents server overload
- Token refresh is proactive, not reactive
- Events are queued when disconnected
- State persistence reduces reconnection time

### CPU Efficiency
- Minimal polling (only for token refresh)
- Event-driven architecture
- Lazy initialization where possible
- Efficient state transitions

## Future Enhancements

### Potential Additions
1. **MetricsManager**: Collect and report performance metrics
2. **CompressionManager**: Handle message compression
3. **RateLimitManager**: Client-side rate limiting
4. **CacheManager**: Cache frequently accessed data
5. **HealthCheckManager**: Periodic health checks

### Extensibility
New managers can be added by:
1. Creating a new manager class
2. Initializing in SocketClient constructor
3. Coordinating with existing managers
4. Updating types and exports

## Conclusion

This modular architecture provides a solid foundation for enterprise-grade socket communication. Each manager is focused, testable, and maintainable, while the overall system remains flexible and extensible.

The refactoring maintains full backward compatibility while significantly improving code quality, maintainability, and scalability.
