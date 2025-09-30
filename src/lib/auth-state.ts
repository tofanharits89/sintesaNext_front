"use client";

// Centralized auth state management to prevent middleware/client conflicts
class AuthStateManager {
  private static instance: AuthStateManager;
  private authState: { isAuthenticated: boolean; timestamp: number } | null = null;
  private listeners: Set<(state: boolean) => void> = new Set();

  static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager();
    }
    return AuthStateManager.instance;
  }

  // Set auth state from middleware headers
  setFromHeaders(headers: Headers): void {
    const isAuth = headers.get('x-auth-isAuth') === '1';
    const hasToken = headers.get('x-auth-hasAccessToken') === '1';
    
    this.authState = {
      isAuthenticated: isAuth && hasToken,
      timestamp: Date.now()
    };
    
    this.notifyListeners();
  }

  // Get current auth state
  getAuthState(): boolean {
    if (!this.authState) return false;
    
    // Expire state after 30 seconds
    if (Date.now() - this.authState.timestamp > 30000) {
      this.authState = null;
      return false;
    }
    
    return this.authState.isAuthenticated;
  }

  // Subscribe to auth state changes
  subscribe(callback: (isAuth: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const isAuth = this.getAuthState();
    this.listeners.forEach(callback => callback(isAuth));
  }

  // Clear auth state on logout
  clear(): void {
    this.authState = null;
    this.notifyListeners();
  }
}

export const authStateManager = AuthStateManager.getInstance();