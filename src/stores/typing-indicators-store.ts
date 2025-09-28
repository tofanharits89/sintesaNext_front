import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useMemo } from "react";

// Types for typing indicators
export interface TypingUser {
  userId: string;
  username: string;
  name: string;
  startedAt: number; // timestamp when typing started
}

// Shared empty array to keep a stable reference when there are no typing users
const EMPTY_USERS: ReadonlyArray<TypingUser> = Object.freeze([]);

// Safely get a display name without throwing if fields are missing
const getUserDisplayName = (u?: { name?: string; username?: string }) =>
  (u?.name && u.name.trim()) || (u?.username && u.username.trim()) || "Someone";

export interface TypingIndicatorsState {
  // Map of conversationId -> array of users currently typing
  typingUsers: Record<string, TypingUser[]>;

  // Map of conversationId -> timeout IDs for cleanup
  typingTimeouts: Record<string, Record<string, ReturnType<typeof setTimeout>>>;

  // Current user's typing state per conversation
  currentUserTyping: Record<string, boolean>;
}

export interface TypingIndicatorsActions {
  // Add a user as typing in a conversation
  addTypingUser: (conversationId: string, user: TypingUser) => void;

  // Remove a user from typing in a conversation
  removeTypingUser: (conversationId: string, userId: string) => void;

  // Set current user's typing state for a conversation
  setCurrentUserTyping: (conversationId: string, isTyping: boolean) => void;

  // Clear all typing users for a conversation
  clearTypingUsers: (conversationId: string) => void;

  // Clear all typing indicators (useful for cleanup)
  clearAllTyping: () => void;

  // Get typing users for a conversation (excluding current user)
  getTypingUsers: (
    conversationId: string,
    currentUserId?: string
  ) => TypingUser[];

  // Check if anyone is typing in a conversation
  isAnyoneTyping: (conversationId: string, currentUserId?: string) => boolean;

  // Get formatted typing text for display
  getTypingText: (conversationId: string, currentUserId?: string) => string;
}

// Constants
const TYPING_TIMEOUT_DURATION = 3000; // 3 seconds
const MAX_TYPING_USERS_DISPLAY = 3; // Maximum users to show in typing indicator

const initialState: TypingIndicatorsState = {
  typingUsers: {},
  typingTimeouts: {},
  currentUserTyping: {},
};

export const useTypingIndicatorsStore = create<
  TypingIndicatorsState & TypingIndicatorsActions
>()(
  devtools(
    (set, get) => ({
      ...initialState,

      addTypingUser: (conversationId, user) => {
        const state = get();

        // Clear existing timeout for this user if any
        const existingTimeout =
          state.typingTimeouts[conversationId]?.[user.userId];
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Add or update the typing user
        const currentTypingUsers = state.typingUsers[conversationId] || [];
        const existingUserIndex = currentTypingUsers.findIndex(
          (u) => u.userId === user.userId
        );

        let updatedTypingUsers: TypingUser[];
        if (existingUserIndex >= 0) {
          // Update existing user's timestamp
          updatedTypingUsers = [...currentTypingUsers];
          updatedTypingUsers[existingUserIndex] = {
            ...user,
            startedAt: Date.now(),
          };
        } else {
          // Add new typing user
          updatedTypingUsers = [
            ...currentTypingUsers,
            { ...user, startedAt: Date.now() },
          ];
        }

        // Set timeout to automatically remove user after TYPING_TIMEOUT_DURATION
        const timeoutId = setTimeout(() => {
          get().removeTypingUser(conversationId, user.userId);
        }, TYPING_TIMEOUT_DURATION);

        set(
          (state) => ({
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: updatedTypingUsers,
            },
            typingTimeouts: {
              ...state.typingTimeouts,
              [conversationId]: {
                ...(state.typingTimeouts[conversationId] ?? {}),
                [user.userId]: timeoutId,
              },
            },
          }),
          false,
          "addTypingUser"
        );
      },

      removeTypingUser: (conversationId, userId) => {
        const state = get();

        // Clear timeout if exists
        const timeout = state.typingTimeouts[conversationId]?.[userId];
        if (timeout) {
          clearTimeout(timeout);
        }

        // Remove user from typing list
        const currentTypingUsers = state.typingUsers[conversationId] || [];
        const updatedTypingUsers = currentTypingUsers.filter(
          (u) => u.userId !== userId
        );

        // Clean up timeout reference
        const updatedTimeouts = { ...(state.typingTimeouts[conversationId] ?? {}) };
        delete updatedTimeouts[userId];

        set(
          (state) => ({
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: updatedTypingUsers,
            },
            typingTimeouts: {
              ...state.typingTimeouts,
              [conversationId]: updatedTimeouts,
            },
          }),
          false,
          "removeTypingUser"
        );
      },

      setCurrentUserTyping: (conversationId, isTyping) => {
        set(
          (state) => ({
            currentUserTyping: {
              ...state.currentUserTyping,
              [conversationId]: isTyping,
            },
          }),
          false,
          "setCurrentUserTyping"
        );
      },

      clearTypingUsers: (conversationId) => {
        const state = get();

        // Clear all timeouts for this conversation
        const timeouts = state.typingTimeouts[conversationId] || {};
        Object.values(timeouts).forEach((timeout) => {
          if (timeout) clearTimeout(timeout);
        });

        set(
          (state) => ({
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: [],
            },
            typingTimeouts: {
              ...state.typingTimeouts,
              [conversationId]: {},
            },
          }),
          false,
          "clearTypingUsers"
        );
      },

      clearAllTyping: () => {
        const state = get();

        // Clear all timeouts
        Object.values(state.typingTimeouts).forEach((conversationTimeouts) => {
          Object.values(conversationTimeouts).forEach((timeout) => {
            if (timeout) clearTimeout(timeout);
          });
        });

        set(
          {
            typingUsers: {},
            typingTimeouts: {},
            currentUserTyping: {},
          },
          false,
          "clearAllTyping"
        );
      },

      getTypingUsers: (conversationId, currentUserId) => {
        const state = get();
        const typingUsers = state.typingUsers[conversationId] || [];

        // Filter out current user if provided
        return currentUserId
          ? typingUsers.filter((user) => user.userId !== currentUserId)
          : typingUsers;
      },

      isAnyoneTyping: (conversationId, currentUserId) => {
        const typingUsers = get().getTypingUsers(conversationId, currentUserId);
        return typingUsers.length > 0;
      },

      getTypingText: (conversationId, currentUserId) => {
        const typingUsers = get().getTypingUsers(conversationId, currentUserId);

        if (typingUsers.length === 0) {
          return "";
        }

        if (typingUsers.length === 1) {
          return `${getUserDisplayName(typingUsers[0])} is typing...`;
        }

        if (typingUsers.length === 2) {
          return `${getUserDisplayName(typingUsers[0])} and ${getUserDisplayName(
            typingUsers[1]
          )} are typing...`;
        }

        if (typingUsers.length <= MAX_TYPING_USERS_DISPLAY) {
          const names = typingUsers
            .slice(0, -1)
            .map((u) => getUserDisplayName(u))
            .join(", ");
          const lastName = getUserDisplayName(
            typingUsers[typingUsers.length - 1]
          );
          return `${names}, and ${lastName} are typing...`;
        }

        // More than MAX_TYPING_USERS_DISPLAY users
        const displayNames = typingUsers
          .slice(0, MAX_TYPING_USERS_DISPLAY)
          .map((u) => getUserDisplayName(u))
          .join(", ");
        const remainingCount = typingUsers.length - MAX_TYPING_USERS_DISPLAY;
        return `${displayNames} and ${remainingCount} other${
          remainingCount > 1 ? "s" : ""
        } are typing...`;
      },
    }),
    { name: "TypingIndicators" }
  )
);

// Selectors for better performance
export const useTypingUsers = (
  conversationId: string,
  currentUserId?: string
) => {
  const allUsersRef = useTypingIndicatorsStore(
    (state) => state.typingUsers[conversationId]
  );
  return useMemo(
    () => {
      const base = (allUsersRef as TypingUser[] | undefined) ?? (EMPTY_USERS as TypingUser[]);
      return currentUserId
        ? base.filter((u) => u.userId !== currentUserId)
        : base;
    },
    [allUsersRef, currentUserId]
  );
};

export const useIsAnyoneTyping = (
  conversationId: string,
  currentUserId?: string
) => {
  const users = useTypingUsers(conversationId, currentUserId);
  return users.length > 0;
};

export const useTypingText = (
  conversationId: string,
  currentUserId?: string
) => {
  const users = useTypingUsers(conversationId, currentUserId);
  return useMemo(() => {
    if (users.length === 0) return "";
    if (users.length === 1)
      return `${getUserDisplayName(users[0])} is typing...`;
    if (users.length === 2)
      return `${getUserDisplayName(users[0])} and ${getUserDisplayName(
        users[1]
      )} are typing...`;
    if (users.length <= 3) {
      const names = users
        .slice(0, -1)
        .map((u) => getUserDisplayName(u))
        .join(", ");
      const lastName = getUserDisplayName(users[users.length - 1]);
      return `${names}, and ${lastName} are typing...`;
    }
    const displayNames = users
      .slice(0, 3)
      .map((u) => getUserDisplayName(u))
      .join(", ");
    const remainingCount = users.length - 3;
    return `${displayNames} and ${remainingCount} other${
      remainingCount > 1 ? "s" : ""
    } are typing...`;
  }, [users]);
};

export const useCurrentUserTyping = (conversationId: string) =>
  useTypingIndicatorsStore(
    (state) => state.currentUserTyping[conversationId] || false
  );

// Hook for typing indicator actions
export const useTypingActions = () => {
  const addTypingUser = useTypingIndicatorsStore(
    (state) => state.addTypingUser
  );
  const removeTypingUser = useTypingIndicatorsStore(
    (state) => state.removeTypingUser
  );
  const setCurrentUserTyping = useTypingIndicatorsStore(
    (state) => state.setCurrentUserTyping
  );
  const clearTypingUsers = useTypingIndicatorsStore(
    (state) => state.clearTypingUsers
  );
  const clearAllTyping = useTypingIndicatorsStore(
    (state) => state.clearAllTyping
  );

  return {
    addTypingUser,
    removeTypingUser,
    setCurrentUserTyping,
    clearTypingUsers,
    clearAllTyping,
  };
};
