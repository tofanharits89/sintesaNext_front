# Messaging Stores - Phase 1 Complete

This directory contains the Zustand stores for managing messaging system state. This is Phase 1 of migrating to the recommended combo: **React Query + Zustand + WebSocket**.

## 🎯 Phase 1 Completed: Zustand Stores Setup

### Created Stores

#### 1. **Messaging UI Store** (`messaging-ui-store.ts`)
Manages all UI-related state for the messaging system:
- Active conversation selection
- Message input state (content, typing, attachments, emoji picker)
- Per-conversation UI state (scroll position, drafts, composing status)
- Modal states (new message dialog, recipient selection)
- Search and filtering
- UI preferences (sidebar collapsed, message preview)
- Loading states

#### 2. **Typing Indicators Store** (`typing-indicators-store.ts`)
Handles real-time typing indicators:
- Tracks who is typing in each conversation
- Automatic timeout cleanup (3 seconds)
- Current user typing state
- Formatted typing text for display
- Supports multiple users typing simultaneously

#### 3. **Unread Badges Store** (`unread-badges-store.ts`)
Manages unread message counts and badges:
- Per-conversation unread counts
- Total unread count across all conversations
- Last read message tracking
- Mention flags for priority notifications
- Conversation priority sorting
- Persistent storage with localStorage

#### 4. **Notification Store** (`notification-store.ts`)
Comprehensive notification management:
- In-app notifications with different types
- Browser notification support
- Do Not Disturb mode with time ranges
- Sound notifications with throttling
- Toast notification management
- Notification settings and preferences

### Key Features

✅ **TypeScript Support** - Full type safety with interfaces and proper typing
✅ **Persistence** - Important state persisted to localStorage
✅ **DevTools Integration** - Zustand DevTools for debugging
✅ **Performance Optimized** - Selective subscriptions with custom selectors
✅ **Cross-tab Sync** - Some stores support cross-tab synchronization
✅ **Automatic Cleanup** - Timeouts and cleanup for temporary state

### Usage Examples

```typescript
import { 
  useMessagingStores, 
  useConversationStores, 
  useMessagingActions 
} from '@/stores';

// Global messaging state
const { activeConversationId, totalUnreadCount } = useMessagingStores();

// Conversation-specific state
const { unreadCount, isAnyoneTyping, typingText } = useConversationStores('conv-123');

// All actions
const { ui, typing, unread, notifications } = useMessagingActions();

// Set active conversation
ui.setActiveConversation('conv-123');

// Add typing indicator
typing.addTypingUser('conv-123', {
  userId: 'user-456',
  username: 'john_doe',
  name: 'John Doe',
  startedAt: Date.now(),
});

// Update unread count
unread.incrementUnreadCount('conv-123', 'msg-789', new Date().toISOString());

// Add notification
notifications.addNotification({
  type: 'message',
  title: 'New Message',
  message: 'You have a new message from John Doe',
  conversationId: 'conv-123',
});
```

### Demo Component

A demo component is available at `src/components/messaging/messaging-store-example.tsx` to test the stores. You can import and use it in any page to see the stores in action.

## 🚀 Next Steps: Phase 2

The next phase will involve:

1. **Convert SWR to React Query** - Replace current SWR hooks with React Query
2. **Integrate WebSocket with new stores** - Make WebSocket updates trigger both Zustand and React Query
3. **Update existing components** - Migrate current messaging components to use the new stores
4. **Implement optimistic updates** - Enhance the optimistic update flow with the new state management

## 📁 File Structure

```
src/stores/
├── messaging-ui-store.ts          # UI state management
├── typing-indicators-store.ts     # Typing indicators
├── unread-badges-store.ts         # Unread counts and badges
├── notification-store.ts          # Notifications system
├── index.ts                       # Exports and combined hooks
└── README.md                      # This file
```

## 🔧 Development Notes

- All stores use Zustand with DevTools integration
- Stores are designed to work independently but can be combined
- Persistence is selective - only important state is persisted
- Performance is optimized with selective subscriptions
- TypeScript interfaces ensure type safety throughout

The foundation is now ready for Phase 2 of the migration!
