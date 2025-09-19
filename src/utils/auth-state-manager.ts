/**
 * Authentication State Management and Persistence System
 * 
 * Handles authentication state persistence, recovery, and synchronization
 * across browser sessions, tabs, and page reloads
 */

import { toast } from 'sonner';
import { apiPath } from '@/lib/base-path';

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  lastActivity: number;
  sessionId: string | null;
  deviceId: string;
}

export interface AuthStateOptions {
  persistenceKey?: string;
  sessionTimeout?: number; // in milliseconds
  inactivityTimeout?: number; // in milliseconds
  enableCrossTabSync?: boolean;
  enableAutoRefresh?: boolean;
  debugMode?: boolean;
}

export interface StateRecoveryResult {
  success: boolean;
  state: AuthState | null;
  reason?: string;
  requiresReauth?: boolean;
}

/**
 * Authentication State Manager
 * 
 * Manages authentication state with persistence, recovery, and synchronization
 */
export class AuthStateManager {
  private state: AuthState;
  private options: Required<AuthStateOptions>;
  private storageKey: string;
  private syncChannel: BroadcastChannel | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(state: AuthState) => void> = new Set();

  constructor(options: AuthStateOptions = {}) {
    this.options = {
      persistenceKey: 'auth_state',
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      inactivityTimeout: 2 * 60 * 60 * 1000, // 2 hours
      enableCrossTabSync: true,
      enableAutoRefresh: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...options
    };

    this.storageKey = this.options.persistenceKey;
    
    // Initialize with empty state
    this.state = this.createEmptyState();
    
    // Setup cross-tab synchronization
    if (this.options.enableCrossTabSync && typeof BroadcastChannel !== 'undefined') {
      this.setupCrossTabSync();
    }
    
    // Setup activity tracking
    this.setupActivityTracking();
    
    // Attempt to recover state on initialization
    this.recoverState();
  }

  /**
   * Create empty authentication state
   */
  private createEmptyState(): AuthState {
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      lastActivity: Date.now(),
      sessionId: null,
      deviceId: this.generateDeviceId()
    };
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      // Return a temporary device ID for SSR
      return 'ssr_device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Setup cross-tab synchronization
   */
  private setupCrossTabSync(): void {
    try {
      this.syncChannel = new BroadcastChannel(`auth_sync_${this.storageKey}`);
      
      this.syncChannel.addEventListener('message', (event) => {
        const { type, state } = event.data;
        
        if (type === 'STATE_UPDATE') {
          this.log('Received state update from another tab:', state);
          this.updateStateFromSync(state);
        } else if (type === 'LOGOUT') {
          this.log('Received logout signal from another tab');
          this.clearState(false); // Don't broadcast again
        }
      });
      
      this.log('Cross-tab synchronization enabled');
    } catch (error) {
      console.warn('Failed to setup cross-tab sync:', error);
    }
  }

  /**
   * Setup activity tracking
   */
  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    const updateActivity = () => {
      this.updateActivity();
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.updateActivity();
      }
    });

    // Setup inactivity timer
    this.resetInactivityTimer();
  }

  /**
   * Update user activity timestamp
   */
  private updateActivity(): void {
    const now = Date.now();
    if (this.state.isAuthenticated && now - this.state.lastActivity > 30000) { // Update every 30 seconds
      this.state.lastActivity = now;
      this.persistState();
      this.resetInactivityTimer();
    }
  }

  /**
   * Reset inactivity timer
   */
  private resetInactivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }

    if (this.state.isAuthenticated) {
      this.activityTimer = setTimeout(() => {
        this.log('Session expired due to inactivity');
        this.handleSessionExpiry('inactivity');
      }, this.options.inactivityTimeout);
    }
  }

  /**
   * Set authentication state
   */
  setState(newState: Partial<AuthState>): void {
    const previousState = { ...this.state };
    
    this.state = {
      ...this.state,
      ...newState,
      lastActivity: Date.now()
    };

    // Generate session ID if becoming authenticated
    if (this.state.isAuthenticated && !this.state.sessionId) {
      this.state.sessionId = this.generateSessionId();
    }

    // Clear session ID if logging out
    if (!this.state.isAuthenticated) {
      this.state.sessionId = null;
    }

    this.log('State updated:', this.state);
    
    // Persist state
    this.persistState();
    
    // Broadcast to other tabs
    this.broadcastStateUpdate();
    
    // Setup auto-refresh if token is present
    if (this.state.token && this.state.expiresAt && this.options.enableAutoRefresh) {
      this.setupAutoRefresh();
    }
    
    // Reset inactivity timer
    this.resetInactivityTimer();
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Get current authentication state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && 
           this.state.token !== null && 
           !this.isTokenExpired();
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.state.expiresAt) return false;
    return Date.now() >= this.state.expiresAt;
  }

  /**
   * Check if session is expired due to inactivity
   */
  private isSessionInactive(): boolean {
    if (!this.state.lastActivity) return false;
    return Date.now() - this.state.lastActivity > this.options.inactivityTimeout;
  }

  /**
   * Persist state to storage
   */
  private persistState(): void {
    // Skip persistence in SSR environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const stateToStore = {
        ...this.state,
        // Don't store sensitive data in localStorage for security
        token: null, // Tokens should be in httpOnly cookies
        refreshToken: null
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(stateToStore));
      
      // Store session info separately
      if (this.state.isAuthenticated) {
        sessionStorage.setItem(`${this.storageKey}_session`, JSON.stringify({
          sessionId: this.state.sessionId,
          expiresAt: this.state.expiresAt,
          lastActivity: this.state.lastActivity
        }));
      } else {
        sessionStorage.removeItem(`${this.storageKey}_session`);
      }
    } catch (error) {
      console.error('Failed to persist auth state:', error);
    }
  }

  /**
   * Recover state from storage
   */
  recoverState(): StateRecoveryResult {
    // Skip recovery in SSR environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { success: false, state: null, reason: 'ssr_environment' };
    }
    
    try {
      // Try to recover from localStorage
      const storedState = localStorage.getItem(this.storageKey);
      const sessionInfo = sessionStorage.getItem(`${this.storageKey}_session`);
      
      if (!storedState) {
        this.log('No stored state found');
        return { success: false, state: null, reason: 'no_stored_state' };
      }

      const parsedState = JSON.parse(storedState) as Partial<AuthState>;
      const parsedSession = sessionInfo ? JSON.parse(sessionInfo) : null;
      
      // Merge session info if available
      if (parsedSession) {
        parsedState.sessionId = parsedSession.sessionId;
        parsedState.expiresAt = parsedSession.expiresAt;
        parsedState.lastActivity = parsedSession.lastActivity;
      }

      // Validate recovered state
      const validationResult = this.validateRecoveredState(parsedState);
      if (!validationResult.valid) {
        this.log('Recovered state is invalid:', validationResult.reason);
        this.clearState();
        return { 
          success: false, 
          state: null, 
          reason: validationResult.reason,
          requiresReauth: true
        };
      }

      // Apply recovered state
      this.state = {
        ...this.createEmptyState(),
        ...parsedState
      } as AuthState;

      this.log('State recovered successfully:', this.state);
      
      // Setup timers and refresh
      if (this.state.isAuthenticated) {
        this.resetInactivityTimer();
        if (this.options.enableAutoRefresh && this.state.expiresAt) {
          this.setupAutoRefresh();
        }
      }
      
      // Notify listeners
      this.notifyListeners();
      
      return { success: true, state: this.getState() };
    } catch (error) {
      console.error('Failed to recover auth state:', error);
      this.clearState();
      return { 
        success: false, 
        state: null, 
        reason: 'recovery_error',
        requiresReauth: true
      };
    }
  }

  /**
   * Validate recovered state
   */
  private validateRecoveredState(state: Partial<AuthState>): { valid: boolean; reason?: string } {
    // Check if state claims to be authenticated
    if (state.isAuthenticated) {
      // Check session timeout
      if (state.lastActivity && Date.now() - state.lastActivity > this.options.sessionTimeout) {
        return { valid: false, reason: 'session_timeout' };
      }
      
      // Check inactivity timeout
      if (this.isSessionInactive()) {
        return { valid: false, reason: 'inactivity_timeout' };
      }
      
      // Check if user data is present
      if (!state.user) {
        return { valid: false, reason: 'missing_user_data' };
      }
    }
    
    return { valid: true };
  }

  /**
   * Clear authentication state
   */
  clearState(broadcast: boolean = true): void {
    this.log('Clearing authentication state');
    
    // Clear timers
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    // Reset state
    this.state = this.createEmptyState();
    
    // Clear storage
    try {
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem(`${this.storageKey}_session`);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
    
    // Broadcast logout to other tabs
    if (broadcast) {
      this.broadcastLogout();
    }
    
    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Handle session expiry
   */
  private handleSessionExpiry(reason: 'timeout' | 'inactivity' | 'token_expired'): void {
    this.log(`Session expired due to: ${reason}`);
    
    const messages = {
      timeout: 'Your session has expired. Please log in again.',
      inactivity: 'You have been logged out due to inactivity.',
      token_expired: 'Your session has expired. Please log in again.'
    };
    
    toast.warning('Session Expired', {
      description: messages[reason],
      duration: 5000
    });
    
    this.clearState();
  }

  /**
   * Setup automatic token refresh
   */
  private setupAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    if (!this.state.expiresAt) return;
    
    // Refresh 5 minutes before expiry
    const refreshTime = this.state.expiresAt - Date.now() - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.log('Attempting automatic token refresh');
        this.attemptTokenRefresh();
      }, refreshTime);
      
      this.log(`Auto-refresh scheduled in ${Math.round(refreshTime / 1000)} seconds`);
    }
  }

  /**
   * Attempt token refresh
   */
  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      // This would typically call your auth API
      const response = await fetch(apiPath('/auth/refresh'), {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update state with new token info
        this.setState({
          expiresAt: data.expiresAt,
          lastActivity: Date.now()
        });
        
        this.log('Token refreshed successfully');
        return true;
      } else {
        this.log('Token refresh failed:', response.status);
        this.handleSessionExpiry('token_expired');
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.handleSessionExpiry('token_expired');
      return false;
    }
  }

  /**
   * Broadcast state update to other tabs
   */
  private broadcastStateUpdate(): void {
    if (this.syncChannel) {
      this.syncChannel.postMessage({
        type: 'STATE_UPDATE',
        state: this.getState()
      });
    }
  }

  /**
   * Broadcast logout to other tabs
   */
  private broadcastLogout(): void {
    if (this.syncChannel) {
      this.syncChannel.postMessage({
        type: 'LOGOUT'
      });
    }
  }

  /**
   * Update state from cross-tab sync
   */
  private updateStateFromSync(syncedState: AuthState): void {
    // Only update if the synced state is newer
    if (syncedState.lastActivity > this.state.lastActivity) {
      this.state = { ...syncedState };
      this.persistState();
      this.notifyListeners();
      
      // Reset timers
      if (this.state.isAuthenticated) {
        this.resetInactivityTimer();
        if (this.options.enableAutoRefresh && this.state.expiresAt) {
          this.setupAutoRefresh();
        }
      }
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Add state change listener
   */
  addListener(callback: (state: AuthState) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.getState());
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Get authentication statistics
   */
  getStats() {
    return {
      isAuthenticated: this.state.isAuthenticated,
      sessionId: this.state.sessionId,
      deviceId: this.state.deviceId,
      lastActivity: this.state.lastActivity,
      expiresAt: this.state.expiresAt,
      timeUntilExpiry: this.state.expiresAt ? this.state.expiresAt - Date.now() : null,
      isTokenExpired: this.isTokenExpired(),
      isSessionInactive: this.isSessionInactive(),
      listenerCount: this.listeners.size
    };
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.options.debugMode) {
      console.log('[AuthStateManager]', ...args);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear timers
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Close broadcast channel
    if (this.syncChannel) {
      this.syncChannel.close();
    }
    
    // Clear listeners
    this.listeners.clear();
  }
}

// Export singleton instance
export const authStateManager = new AuthStateManager();