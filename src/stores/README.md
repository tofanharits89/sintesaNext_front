# Simplified Messaging Store

This directory contains the simplified Zustand store for managing messaging system state. The implementation follows the **React Query + Zustand + WebSocket** pattern.

## 🎯 Current Implementation: Simplified Store

### Messaging Store (`messaging-store.ts`)

A unified store that consolidates all messaging client state:

**Core State:**
- `activeConversationId` - Currently selected conversation
- `messageInput` - Message composition state (content, typing, attachments, reply)
- `sidebarCollapsed` - UI preference for sidebar state
- `messagePreviewEnabled` - UI preference for message previews
- `isConnected` - Socket connection status
- `typingUsers` - Real-time typing indicators per conversation

**Actions:**
- `setActiveConversation(id)` - Change active conversation
- `setMessageContent(content)` - Update message input
- `setTyping(isTyping)` - Set typing state
- `clearMessageInput()` - Reset message input
- `addTypingUser(conversationId, user)` - Add typing indicator
- `removeTypingUser(conversationId, userId)` - Remove typing indicator
- `reset()` - Reset all state

### Selectors for Better Performance

- `useActiveConversationId()` - Get active conversation ID
- `useMessageInput()` - Get message input state
- `useTypingUsers(conversationId)` - Get typing users for conversation
- `useMessagingConnection()` - Get connection state and actions

### Usage Examples

```typescript
import {
  useMessagingStore,
  useActiveConversationId,
  useMessageInput,
  useTypingUsers
} from '@/stores';

// Get active conversation
const activeConversationId = useActiveConversationId();

// Get message input state
const messageInput = useMessageInput();

// Get typing indicators
const typingUsers = useTypingUsers(activeConversationId || '');

// Use store actions directly
const { setActiveConversation, setMessageContent, setTyping } = useMessagingStore();

// Select a conversation
setActiveConversation('conv-123');

// Update message content
setMessageContent('Hello world!');

// Set typing state
setTyping(true);
```

## 📁 File Structure

```
src/stores/
├── messaging-store.ts          # Unified messaging store
├── notification-store.ts       # Legacy notification store (still used)
├── typing-indicators-store.ts  # Legacy typing store (still used)
├── unread-badges-store.ts      # Legacy unread store (still used)
├── session-store.ts            # Session management store
├── index.ts                    # Exports
└── README.md                   # This file
```

## 🔧 Development Notes

- **Simplified Architecture**: Single store for all messaging client state
- **TypeScript Support**: Full type safety with interfaces
- **DevTools Integration**: Zustand DevTools for debugging
- **Performance Optimized**: Selective subscriptions with custom selectors
- **React Query Integration**: Server state managed separately by React Query
- **Real-time Updates**: WebSocket integration handled separately

## 🚀 Integration with React Query

This store works alongside React Query hooks:

- `useConversationsRQ()` - Server state for conversations
- `useMessagesRQ()` - Server state for messages
- `useMessageMutationsRQ()` - Server mutations
- `useMessagingRQ()` - Combined hook integrating store + React Query + WebSocket

The simplified approach provides better maintainability while preserving all the functionality needed for real-time messaging.
