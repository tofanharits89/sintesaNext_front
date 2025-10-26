/**
 * Unified Auth & Session State Management
 * Single source of truth for authentication, session, and socket state
 * Replaces multiple complex authentication systems
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { shallow } from "zustand/shallow";

// User interface
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role:
    | "super_admin"
    | "co_admin"
    | "kantor_pusat"
    | "kanwil_djpb"
    | "kppn"
    | "lainnya";
  limitKodeBA?: string | null;
  kdkanwil?: string | null;
  kdkppn?: string | null;
  nmkanwil?: string | null;
  nmkppn?: string | null;
  status: "active" | "disabled";
  createdAt: string;
}

interface AuthSessionState {
  // Authentication state
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  isLogoutInProgress: boolean;
  user: User | null;
  isLoading: boolean;

  // Session state
  sessionExpiry: Date | null;
  lastActivity: Date | null;

  // Socket connection state
  socketConnected: boolean;

  // Actions
  setAuthenticated: (authenticated: boolean, user?: User | null) => void;
  setLoggingOut: (loggingOut: boolean) => void;
  setLogoutInProgress: (inProgress: boolean) => void;
  setLoading: (loading: boolean) => void;
  setSessionExpiry: (expiry: Date | null) => void;
  setSocketConnected: (connected: boolean) => void;
  updateUser: (user: User | null) => void;
  updateLastActivity: () => void;
  logout: () => void;
  reset: () => void;
}

export const useAuthSessionStore = create<AuthSessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoggingOut: false,
      isLogoutInProgress: false,
      user: null,
      isLoading: false,
      sessionExpiry: null,
      lastActivity: null,
      socketConnected: false,

      // Actions
      setAuthenticated: (authenticated, user = null) => {
        const currentState = get();
        // Prevent redundant updates that cause infinite loops
        if (
          currentState.isAuthenticated === authenticated &&
          currentState.user?.id === user?.id
        ) {
          return;
        }

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
      },

      setLoggingOut: (loggingOut) => set({ isLoggingOut: loggingOut }),

      setLogoutInProgress: (inProgress) => {
        if (typeof window !== 'undefined') {
          if (inProgress) {
            sessionStorage.setItem('sintesa_logout_in_progress', Date.now().toString());
          } else {
            sessionStorage.removeItem('sintesa_logout_in_progress');
          }
        }
        set({ isLogoutInProgress: inProgress });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setSessionExpiry: (expiry) => set({ sessionExpiry: expiry }),

      setSocketConnected: (connected) => set({ socketConnected: connected }),

      updateUser: (user) => {
        const currentState = get();
        // Prevent redundant updates - compare by ID to avoid reference equality issues
        if (currentState.user?.id === user?.id) {
          // Check if there are actual changes in the user object
          const hasChanges =
            user &&
            currentState.user &&
            JSON.stringify(currentState.user) !== JSON.stringify(user);
          if (!hasChanges) {
            return;
          }
        }

        // If we have a user and were in logout state, clear it
        if (user && currentState.isLogoutInProgress) {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('sintesa_logout_in_progress');
          }
          set({ user, isLogoutInProgress: false, isLoggingOut: false });
        } else {
          set({ user });
        }
      },

      updateLastActivity: () => {
        const currentState = get();
        const now = new Date();
        // Only update if more than 1 second has passed to prevent rapid updates
        if (
          currentState.lastActivity &&
          now.getTime() - currentState.lastActivity.getTime() < 1000
        ) {
          return;
        }
        set({ lastActivity: now });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          isLoggingOut: true,
          isLogoutInProgress: true,
          user: null,
          isLoading: false,
          sessionExpiry: null,
          lastActivity: null,
          socketConnected: false,
        });
        // Also persist to sessionStorage for middleware access
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sintesa_logout_in_progress', Date.now().toString());
        }
      },

      reset: () => {
        set({
          isAuthenticated: false,
          isLoggingOut: false,
          isLogoutInProgress: false,
          user: null,
          isLoading: false,
          sessionExpiry: null,
          lastActivity: null,
          socketConnected: false,
        });
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('sintesa_logout_in_progress');
        }
      },
    }),
    {
      name: "auth-session-store",
      partialize: (state) => ({
        sessionExpiry: state.sessionExpiry,
        lastActivity: state.lastActivity,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        // Note: isLogoutInProgress is NOT persisted - it should only be in sessionStorage
        // This prevents the logout loading from appearing on login or after page reload
      }),
      onRehydrateStorage: () => {
        return (state) => {
          // Check if logout is in progress from sessionStorage
          // But only set it if we're actually on a logout flow
          if (typeof window !== 'undefined') {
            const logoutInProgress = sessionStorage.getItem('sintesa_logout_in_progress');
            if (logoutInProgress && state) {
              // Only restore if user is actually logging out (not on login page)
              const isOnLoginPage = window.location.pathname === '/login';
              if (!isOnLoginPage) {
                state.isLogoutInProgress = true;
              } else {
                // On login page, clear any stale logout flag
                sessionStorage.removeItem('sintesa_logout_in_progress');
                state.isLogoutInProgress = false;
              }
            }
          }
        };
      },
    },
  ),
);

// Export the state interface for type usage
export type { AuthSessionState };

// Backward compatibility export
export const useSessionStore = useAuthSessionStore;
