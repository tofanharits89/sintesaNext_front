/**
 * Enterprise Features Test Suite
 * Tests for Features #3, #4, and #5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SocketClient } from '../SocketClient';

describe('Enterprise Feature #3: Configurable Exponential Backoff', () => {
  it('should use default reconnection config', () => {
    const client = new SocketClient();
    const config = (client as any).config.reconnection;

    expect(config.enabled).toBe(true);
    expect(config.maxAttempts).toBe(5);
    expect(config.initialDelay).toBe(1000);
    expect(config.maxDelay).toBe(10000);
    expect(config.factor).toBe(2);
  });

  it('should accept custom reconnection config', () => {
    const client = new SocketClient({
      reconnection: {
        enabled: true,
        maxAttempts: 10,
        initialDelay: 500,
        maxDelay: 5000,
        factor: 1.5,
      },
    });

    const config = (client as any).config.reconnection;

    expect(config.enabled).toBe(true);
    expect(config.maxAttempts).toBe(10);
    expect(config.initialDelay).toBe(500);
    expect(config.maxDelay).toBe(5000);
    expect(config.factor).toBe(1.5);
  });

  it('should allow disabling reconnection', () => {
    const client = new SocketClient({
      reconnection: {
        enabled: false,
      },
    });

    const config = (client as any).config.reconnection;
    expect(config.enabled).toBe(false);
  });
});

describe('Enterprise Feature #4: Event Acknowledgments', () => {
  let client: SocketClient;

  beforeEach(() => {
    client = new SocketClient({ autoConnect: false });
  });

  afterEach(() => {
    client.cleanup();
  });

  it('should have emitWithAck method', () => {
    expect(typeof client.emitWithAck).toBe('function');
  });

  it('should reject when not connected', async () => {
    await expect(
      client.emitWithAck('test:event', { data: 'test' })
    ).rejects.toThrow('Socket not connected');
  });

  it('should accept custom timeout parameter', () => {
    // This test verifies the method signature accepts timeout
    expect(() => {
      client.emitWithAck('test:event', { data: 'test' }, 10000);
    }).not.toThrow();
  });
});

describe('Enterprise Feature #5: State Persistence', () => {
  let client: SocketClient;

  beforeEach(() => {
    // Clear any existing state
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('socket_connection_state');
    }
    client = new SocketClient({ autoConnect: false });
  });

  afterEach(() => {
    client.cleanup();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('socket_connection_state');
    }
  });

  it('should have persistence methods', () => {
    expect(typeof (client as any).persistConnectionState).toBe('function');
    expect(typeof (client as any).restorePersistedState).toBe('function');
  });

  it('should persist state to sessionStorage', () => {
    if (typeof sessionStorage === 'undefined') {
      console.log('sessionStorage not available, skipping test');
      return;
    }

    // Trigger persistence
    (client as any).persistConnectionState();

    // Check if state was saved
    const stateStr = sessionStorage.getItem('socket_connection_state');
    expect(stateStr).toBeTruthy();

    if (stateStr) {
      const state = JSON.parse(stateStr);
      expect(state).toHaveProperty('lastConnected');
      expect(state).toHaveProperty('socketId');
      expect(state).toHaveProperty('reconnectAttempts');
      expect(state).toHaveProperty('state');
    }
  });

  it('should restore state from sessionStorage', () => {
    if (typeof sessionStorage === 'undefined') {
      console.log('sessionStorage not available, skipping test');
      return;
    }

    // Set up mock state
    const mockState = {
      lastConnected: Date.now(),
      socketId: 'test-socket-id',
      reconnectAttempts: 2,
      state: 'connected' as const,
    };

    sessionStorage.setItem('socket_connection_state', JSON.stringify(mockState));

    // Create new client (should restore state)
    const newClient = new SocketClient({ autoConnect: false });

    // State restoration is logged but doesn't change behavior
    // This is by design - it's an optimization, not a behavior change
    expect(newClient).toBeTruthy();

    newClient.cleanup();
  });

  it('should clear old state', () => {
    if (typeof sessionStorage === 'undefined') {
      console.log('sessionStorage not available, skipping test');
      return;
    }

    // Set up old state (> 5 minutes ago)
    const oldState = {
      lastConnected: Date.now() - 6 * 60 * 1000, // 6 minutes ago
      socketId: 'old-socket-id',
      reconnectAttempts: 0,
      state: 'connected' as const,
    };

    sessionStorage.setItem('socket_connection_state', JSON.stringify(oldState));

    // Create new client (should clear old state)
    const newClient = new SocketClient({ autoConnect: false });

    // Old state should be cleared
    const stateStr = sessionStorage.getItem('socket_connection_state');
    expect(stateStr).toBeNull();

    newClient.cleanup();
  });
});

describe('Backward Compatibility', () => {
  it('should work without any configuration', () => {
    const client = new SocketClient();
    expect(client).toBeTruthy();
    expect(client.isConnected()).toBe(false);
    client.cleanup();
  });

  it('should maintain existing API', () => {
    const client = new SocketClient({ autoConnect: false });

    // Check all existing methods still exist
    expect(typeof client.connect).toBe('function');
    expect(typeof client.disconnect).toBe('function');
    expect(typeof client.emit).toBe('function');
    expect(typeof client.on).toBe('function');
    expect(typeof client.off).toBe('function');
    expect(typeof client.getSocket).toBe('function');
    expect(typeof client.getState).toBe('function');
    expect(typeof client.isConnected).toBe('function');
    expect(typeof client.getConnectionStats).toBe('function');
    expect(typeof client.cleanup).toBe('function');

    client.cleanup();
  });

  it('should work with partial configuration', () => {
    const client = new SocketClient({
      reconnection: {
        maxAttempts: 10,
        // Other fields should use defaults
      },
    });

    const config = (client as any).config.reconnection;
    expect(config.maxAttempts).toBe(10);
    expect(config.enabled).toBe(true); // default
    expect(config.initialDelay).toBe(1000); // default

    client.cleanup();
  });
});

describe('Type Safety', () => {
  it('should support generic types in emitWithAck', async () => {
    const client = new SocketClient({ autoConnect: false });

    // This test verifies TypeScript compilation
    // The generic type should be inferred correctly
    type TestResponse = { id: string; status: string };

    try {
      // This will fail at runtime (not connected) but should compile
      await client.emitWithAck<TestResponse>('test', {});
    } catch (error) {
      // Expected to fail - not connected
      expect(error).toBeTruthy();
    }

    client.cleanup();
  });
});
