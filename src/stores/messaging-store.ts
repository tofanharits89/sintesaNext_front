/**
 * Unified Messaging State Management
 * 
 * Consolidates all messaging state into single source
 * Separates client state from server state (React Query)
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Conversation, FrontendMessage } from "@/types/socket-events";

// Shared empty array for stable SSR snapshots
const EMPTY_ARRAY: ReadonlyArray<any> = Object.freeze([]);

// Client-only state (UI state, temporary data)
interface MessagingClientState {
  // Active conversation
  activeConversationId: string | null;
  
  // Message input state
  messageInput: {
    content: string;
    isTyping: boolean;
    attachedFiles: File[];
    replyingTo: FrontendMessage | null;
  };
  
  // UI preferences
  sidebarCollapsed: boolean;
  messagePreviewEnabled: boolean;
  
  // Socket connection state (simple boolean, complex state handled by socket client)
  isConnected: boolean;
  
  // Typing indicators
  typingUsers: Record<string, Array<{
    userId: string;
    username: string;
    startedAt: number;
  }>>;
  
  // Actions
  setActiveConversation: (id: string | null) => void;
  setMessageContent: (content: string) => void;
  setTyping: (isTyping: boolean) => void;
  clearMessageInput: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setConnectionStatus: (connected: boolean) => void;
  addTypingUser: (conversationId: string, user: any) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  reset: () => void;
}

const initialState = {
  activeConversationId: null,
  messageInput: {
    content: "",
    isTyping: false,
    attachedFiles: [],
    replyingTo: null,
  },
  sidebarCollapsed: false,
  messagePreviewEnabled: true,
  isConnected: false,
  typingUsers: {},
};

export const useMessagingStore = create<MessagingClientState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      setActiveConversation: (id) => set({ activeConversationId: id }),
      
      setMessageContent: (content) => 
        set((state) => ({
          messageInput: { ...state.messageInput, content }
        })),
      
      setTyping: (isTyping) => 
        set((state) => ({
          messageInput: { ...state.messageInput, isTyping }
        })),
      
      clearMessageInput: () => 
        set({ messageInput: initialState.messageInput }),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      setConnectionStatus: (connected) => set({ isConnected: connected }),
      
      addTypingUser: (conversationId, user) => 
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: [...(state.typingUsers[conversationId] || []), user]
          }
        })),
      
      removeTypingUser: (conversationId, userId) => 
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: (state.typingUsers[conversationId] || [])
              .filter(u => u.userId !== userId)
          }
        })),
      
      reset: () => set(initialState),
    }),
    { name: "messaging-store" }
  )
);

// Selectors for better performance
export const useActiveConversationId = () =>
  useMessagingStore((state) => state.activeConversationId);
export const useMessageInput = () =>
  useMessagingStore((state) => state.messageInput);
export const useTypingUsers = (conversationId: string) =>
  useMessagingStore((state) => state.typingUsers[conversationId] ?? (EMPTY_ARRAY as any[]));
export const useMessagingConnection = () => ({
  isConnected: useMessagingStore((state) => state.isConnected),
  setActiveConversation: useMessagingStore((state) => state.setActiveConversation),
  setConnectionStatus: useMessagingStore((state) => state.setConnectionStatus),
});

// Action hooks for better component ergonomics
export const useMessageActions = () => {
  const setActiveConversation = useMessagingStore(
    (state) => state.setActiveConversation,
  );
  const setMessageContent = useMessagingStore((state) => state.setMessageContent);
  const setTyping = useMessagingStore((state) => state.setTyping);
  const clearMessageInput = useMessagingStore((state) => state.clearMessageInput);

  return {
    setActiveConversation,
    setMessageContent,
    setTyping,
    clearMessageInput,
  };
};

// Export type for external use
export type { MessagingClientState };
