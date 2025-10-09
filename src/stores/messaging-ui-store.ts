import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { useMemo } from "react";
import type { Conversation, FrontendMessage } from "@/types/socket-events";

// Types for UI state
export interface MessageInputState {
  content: string;
  isTyping: boolean;
  attachedFiles: File[];
  replyingTo: FrontendMessage | null;
  emojiPickerOpen: boolean;
}

export interface ConversationUIState {
  isScrolledToBottom: boolean;
  showScrollToBottom: boolean;
  lastSeenMessageId: string | null;
  isComposing: boolean;
  draftMessage: string;
}

export interface MessagingUIState {
  // Active conversation
  activeConversationId: string | null;

  // Message input state
  messageInput: MessageInputState;

  // Per-conversation UI state
  conversationStates: Record<string, ConversationUIState>;

  // Modal and dialog states
  newMessageDialogOpen: boolean;
  selectedRecipientId: string | null;

  // Search and filter states
  searchQuery: string;
  filteredConversations: string[];

  // UI preferences
  sidebarCollapsed: boolean;
  messagePreviewEnabled: boolean;

  // Loading states
  isLoadingConversation: boolean;
  isSendingMessage: boolean;
}

export interface MessagingUIActions {
  // Active conversation actions
  setActiveConversation: (conversationId: string | null) => void;

  // Message input actions
  setMessageContent: (content: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  addAttachedFile: (file: File) => void;
  removeAttachedFile: (index: number) => void;
  clearAttachedFiles: () => void;
  setReplyingTo: (message: FrontendMessage | null) => void;
  setEmojiPickerOpen: (open: boolean) => void;
  clearMessageInput: () => void;

  // Conversation UI actions
  setScrolledToBottom: (conversationId: string, scrolled: boolean) => void;
  setShowScrollToBottom: (conversationId: string, show: boolean) => void;
  setLastSeenMessage: (
    conversationId: string,
    messageId: string | null
  ) => void;
  setIsComposing: (conversationId: string, composing: boolean) => void;
  setDraftMessage: (conversationId: string, draft: string) => void;

  // Modal actions
  setNewMessageDialogOpen: (open: boolean) => void;
  setSelectedRecipient: (recipientId: string | null) => void;

  // Search actions
  setSearchQuery: (query: string) => void;
  setFilteredConversations: (conversationIds: string[]) => void;

  // UI preference actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMessagePreviewEnabled: (enabled: boolean) => void;

  // Loading state actions
  setLoadingConversation: (loading: boolean) => void;
  setSendingMessage: (sending: boolean) => void;

  // Utility actions
  resetConversationState: (conversationId: string) => void;
  clearAllStates: () => void;
}

// Initial states
const initialMessageInput: MessageInputState = {
  content: "",
  isTyping: false,
  attachedFiles: [],
  replyingTo: null,
  emojiPickerOpen: false,
};

const initialConversationState: ConversationUIState = {
  isScrolledToBottom: true,
  showScrollToBottom: false,
  lastSeenMessageId: null,
  isComposing: false,
  draftMessage: "",
};

const initialState: MessagingUIState = {
  activeConversationId: null,
  messageInput: initialMessageInput,
  conversationStates: {},
  newMessageDialogOpen: false,
  selectedRecipientId: null,
  searchQuery: "",
  filteredConversations: [],
  sidebarCollapsed: false,
  messagePreviewEnabled: true,
  isLoadingConversation: false,
  isSendingMessage: false,
};

// Create the store
export const useMessagingUIStore = create<
  MessagingUIState & MessagingUIActions
>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Active conversation actions
        setActiveConversation: (conversationId) => {
          set(
            (state) => {
              try {
                // Setting active conversation
              } catch {}
              // No-op if selecting the same conversation; don't clear the input
              if (state.activeConversationId === conversationId)
                return {} as Partial<MessagingUIState>;
              return {
                activeConversationId: conversationId,
                // Clear message input only when switching to a different conversation
                messageInput: { ...initialMessageInput },
              };
            },
            false,
            "setActiveConversation"
          );
        },

        // Message input actions
        setMessageContent: (content) => {
          set(
            (state) => ({
              messageInput: { ...state.messageInput, content },
            }),
            false,
            "setMessageContent"
          );
        },

        setIsTyping: (isTyping) => {
          set(
            (state) => ({
              messageInput: { ...state.messageInput, isTyping },
            }),
            false,
            "setIsTyping"
          );
        },

        addAttachedFile: (file) => {
          set(
            (state) => ({
              messageInput: {
                ...state.messageInput,
                attachedFiles: [...state.messageInput.attachedFiles, file],
              },
            }),
            false,
            "addAttachedFile"
          );
        },

        removeAttachedFile: (index) => {
          set(
            (state) => ({
              messageInput: {
                ...state.messageInput,
                attachedFiles: state.messageInput.attachedFiles.filter(
                  (_, i) => i !== index
                ),
              },
            }),
            false,
            "removeAttachedFile"
          );
        },

        clearAttachedFiles: () => {
          set(
            (state) => ({
              messageInput: { ...state.messageInput, attachedFiles: [] },
            }),
            false,
            "clearAttachedFiles"
          );
        },

        setReplyingTo: (message) => {
          set(
            (state) => ({
              messageInput: { ...state.messageInput, replyingTo: message },
            }),
            false,
            "setReplyingTo"
          );
        },

        setEmojiPickerOpen: (open) => {
          set(
            (state) => ({
              messageInput: { ...state.messageInput, emojiPickerOpen: open },
            }),
            false,
            "setEmojiPickerOpen"
          );
        },

        clearMessageInput: () => {
          set(
            (state) => ({
              messageInput: { ...initialMessageInput },
            }),
            false,
            "clearMessageInput"
          );
        },

        // Conversation UI actions
        setScrolledToBottom: (conversationId, scrolled) => {
          set(
            (state) => ({
              conversationStates: {
                ...state.conversationStates,
                [conversationId]: {
                  ...(state.conversationStates[conversationId] ||
                    initialConversationState),
                  isScrolledToBottom: scrolled,
                },
              },
            }),
            false,
            "setScrolledToBottom"
          );
        },

        setShowScrollToBottom: (conversationId, show) => {
          set(
            (state) => ({
              conversationStates: {
                ...state.conversationStates,
                [conversationId]: {
                  ...(state.conversationStates[conversationId] ||
                    initialConversationState),
                  showScrollToBottom: show,
                },
              },
            }),
            false,
            "setShowScrollToBottom"
          );
        },

        setLastSeenMessage: (conversationId, messageId) => {
          set(
            (state) => ({
              conversationStates: {
                ...state.conversationStates,
                [conversationId]: {
                  ...(state.conversationStates[conversationId] ||
                    initialConversationState),
                  lastSeenMessageId: messageId,
                },
              },
            }),
            false,
            "setLastSeenMessage"
          );
        },

        setIsComposing: (conversationId, composing) => {
          set(
            (state) => ({
              conversationStates: {
                ...state.conversationStates,
                [conversationId]: {
                  ...(state.conversationStates[conversationId] ||
                    initialConversationState),
                  isComposing: composing,
                },
              },
            }),
            false,
            "setIsComposing"
          );
        },

        setDraftMessage: (conversationId, draft) => {
          set(
            (state) => ({
              conversationStates: {
                ...state.conversationStates,
                [conversationId]: {
                  ...(state.conversationStates[conversationId] ||
                    initialConversationState),
                  draftMessage: draft,
                },
              },
            }),
            false,
            "setDraftMessage"
          );
        },

        // Modal actions
        setNewMessageDialogOpen: (open) => {
          set({ newMessageDialogOpen: open }, false, "setNewMessageDialogOpen");
        },

        setSelectedRecipient: (recipientId) => {
          set(
            { selectedRecipientId: recipientId },
            false,
            "setSelectedRecipient"
          );
        },

        // Search actions
        setSearchQuery: (query) => {
          set({ searchQuery: query }, false, "setSearchQuery");
        },

        setFilteredConversations: (conversationIds) => {
          set(
            { filteredConversations: conversationIds },
            false,
            "setFilteredConversations"
          );
        },

        // UI preference actions
        setSidebarCollapsed: (collapsed) => {
          set({ sidebarCollapsed: collapsed }, false, "setSidebarCollapsed");
        },

        setMessagePreviewEnabled: (enabled) => {
          set(
            { messagePreviewEnabled: enabled },
            false,
            "setMessagePreviewEnabled"
          );
        },

        // Loading state actions
        setLoadingConversation: (loading) => {
          set(
            { isLoadingConversation: loading },
            false,
            "setLoadingConversation"
          );
        },

        setSendingMessage: (sending) => {
          set({ isSendingMessage: sending }, false, "setSendingMessage");
        },

        // Utility actions
        resetConversationState: (conversationId) => {
          set(
            (state) => ({
              conversationStates: {
                ...state.conversationStates,
                [conversationId]: { ...initialConversationState },
              },
            }),
            false,
            "resetConversationState"
          );
        },

        clearAllStates: () => {
          set({ ...initialState }, false, "clearAllStates");
        },
      }),
      {
        name: "messaging-ui-store",
        // Only persist UI preferences, not temporary states
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          messagePreviewEnabled: state.messagePreviewEnabled,
        }),
      }
    ),
    { name: "MessagingUI" }
  )
);

// Selectors for better performance
export const useActiveConversationId = () =>
  useMessagingUIStore((state) => state.activeConversationId);
export const useMessageInput = () =>
  useMessagingUIStore((state) => state.messageInput);
export const useConversationState = (conversationId: string) =>
  useMessagingUIStore(
    (state) =>
      state.conversationStates[conversationId] || initialConversationState
  );
export const useNewMessageDialog = () => {
  const open = useMessagingUIStore((s) => s.newMessageDialogOpen);
  const selectedRecipientId = useMessagingUIStore((s) => s.selectedRecipientId);
  return useMemo(
    () => ({ open, selectedRecipientId }),
    [open, selectedRecipientId]
  );
};
export const useSearchState = () => {
  const query = useMessagingUIStore((s) => s.searchQuery);
  const filteredConversations = useMessagingUIStore(
    (s) => s.filteredConversations
  );
  return useMemo(
    () => ({ query, filteredConversations }),
    [query, filteredConversations]
  );
};
export const useUIPreferences = () => {
  const sidebarCollapsed = useMessagingUIStore((s) => s.sidebarCollapsed);
  const messagePreviewEnabled = useMessagingUIStore(
    (s) => s.messagePreviewEnabled
  );
  return useMemo(
    () => ({ sidebarCollapsed, messagePreviewEnabled }),
    [sidebarCollapsed, messagePreviewEnabled]
  );
};
export const useLoadingStates = () => {
  // Select primitives separately to avoid creating a new object inside the selector,
  // which can trip React's getSnapshot caching warning in React 19.
  const isLoadingConversation = useMessagingUIStore(
    (s) => s.isLoadingConversation
  );
  const isSendingMessage = useMessagingUIStore((s) => s.isSendingMessage);
  // Memoize the combined object so the reference is stable across renders
  return useMemo(
    () => ({ isLoadingConversation, isSendingMessage }),
    [isLoadingConversation, isSendingMessage]
  );
};
