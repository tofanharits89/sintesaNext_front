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
        set({
          isAuthenticated: authenticated,
          user,
        });
      },

      setLoggingOut: (loggingOut) => set({ isLoggingOut: loggingOut }),

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
        set({ user });
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
          user: null,
          isLoading: false,
          sessionExpiry: null,
          lastActivity: null,
          socketConnected: false,
        });
      },

      reset: () => {
        set({
          isAuthenticated: false,
          isLoggingOut: false,
          user: null,
          isLoading: false,
          sessionExpiry: null,
          lastActivity: null,
          socketConnected: false,
        });
      },
    }),
    {
      name: "auth-session-store",
      partialize: (state) => ({
        sessionExpiry: state.sessionExpiry,
        lastActivity: state.lastActivity,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
);

// Export the state interface for type usage
export type { AuthSessionState };

// Backward compatibility export
export const useSessionStore = useAuthSessionStore;
