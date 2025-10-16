# Temp → Real Conversation Migration Fix

## Problem
When sending the first message in a temp conversation, messages disappear when sending subsequent messages. User needs to refresh to see the real conversation.

## Root Cause
1. **Temp messages stored in in-memory store** (`temp-messages-store.ts`) but not migrated to React Query cache
2. **activeConversationId not atomically updated** before second message is sent
3. **Real messages cache not pre-warmed** with migrated messages, causing them to disappear when pagination happens

## Solution Overview

The fix implements a **3-phase reconciliation strategy**:

### Phase 1: Message Collection
- Extract all messages from temp store
- Reconcile temp message IDs with real message IDs from server response

### Phase 2: Cache Pre-warming
- Create proper React Query infinite query structure for real conversation
- Seed with all migrated messages
- Ensures `useMessagesRQ` returns correct data when switching conversations

### Phase 3: Cleanup & Sync
- Clear temp conversation state
- Update conversations list
- Update activeConversationId atomically
- Emit reconciliation events for listeners

## Implementation Files

### 1. New Hook: `useConversationReconciliation.ts`
**Location:** `src/hooks/messaging-rq/useConversationReconciliation.ts`

**Purpose:** Encapsulates all reconciliation logic in a reusable hook

**Key Function:** `reconcileTempToReal(tempConvId, realConvId, serverData)`

```typescript
// Usage:
const { reconcileTempToReal } = useConversationReconciliation();
await reconcileTempToReal(tempConvId, realConvId, serverResponse);
```

**What it does:**
- ✅ Extracts temp messages from in-memory store
- ✅ Maps temp conversation ID → real conversation ID
- ✅ Pre-warms real messages cache with proper infinite query structure
- ✅ Updates conversations list with new real conversation
- ✅ Clears temp conversation hints/store
- ✅ Emits `conversation:reconciled` event

### 2. Updated Hook: `useMessageMutationsRQ.ts`
**Changes:**
- Imports and uses `useConversationReconciliation`
- **Simplified `onSuccess` callback** from 500+ lines to ~50 lines
- Delegates temp→real migration to dedicated hook
- Focuses on state updates and event emission

**Before:**
```typescript
// 500+ lines of inline migration logic
if (derivedNewConvId && derivedNewConvId !== conversationId) {
  const primaryMsg = { ... };
  const migrated = getTempMessages(...);
  queryClient.setQueryData(messageKeyFor(newId), (prev) => {
    // ... 100+ lines of cache manipulation
  });
  // ... more cache updates
}
```

**After:**
```typescript
if (derivedNewConvId && derivedNewConvId !== conversationId) {
  await reconcileTempToReal(
    sourceTempConvId || conversationId || `temp-conv-${tempId}`,
    newId,
    data
  );
  messageActions.setActiveConversation(newId);
}
```

## How It Works End-to-End

### First Message Sent (Temp → Real)

```
User sends first message in temp-conv-xxx
  ↓
sendMessage mutation triggers with:
  - tempId: "temp-msg-abc123"
  - conversationId: "temp-conv-xxx"
  - recipientId: "user-xyz"
  ↓
onSuccess receives:
  - realConvId: "conv-real-id"
  - realMsgId: "msg-real-id"
  ↓
reconcileTempToReal() called:
  
  1. Extract from temp-messages-store
     → [{ id: "temp-msg-abc123", content: "Hello", ... }]
  
  2. Build canonical list:
     → [{ id: "msg-real-id", conversationId: "conv-real-id", ... }]
  
  3. Pre-warm React Query cache for real conversation:
     queryClient.setQueryData(
       messageKeys.messages(userId, "conv-real-id"),
       {
         pages: [{
           messages: [{ id: "msg-real-id", ... }],
           pagination: { ... }
         }],
         pageParams: [undefined]
       }
     )
  
  4. Update conversations list:
     - Find temp-conv-xxx in conversations
     - Replace ID with conv-real-id
     - Move to top
  
  5. Cleanup:
     - clearTempMessages("temp-conv-xxx")
     - clearHint("temp-conv-xxx")
  
  6. Set active:
     setActiveConversation("conv-real-id")
  ↓
Second message sends
  - activeConversationId = "conv-real-id" ✅
  - Messages cache already contains first message ✅
  - Second message appends correctly ✅
```

### Second Message Sent (Real → Real)

```
User sends second message
  ↓
sendMessage mutation with:
  - conversationId: "conv-real-id" ✅ (real, not temp)
  - No recipientId needed
  ↓
Socket/REST sends to backend
  ↓
Backend creates real message, returns
  ↓
onSuccess: derivedNewConvId === conversationId
  → NO reconciliation needed (already real)
  → Message appended to existing cache
  ↓
UI updates with both messages visible ✅
```

## Cache Structure

The solution ensures the React Query cache matches this structure:

```typescript
// messageKeys.messages(userId, "conv-real-id")
{
  pages: [
    {
      messages: [
        {
          id: "msg-1",
          conversation_id: "conv-real-id",
          content: "First message",
          timestamp: "...",
          sender: { ... },
          isDelivered: false,
          _sending: false,
          _failed: false
        },
        {
          id: "msg-2",
          conversation_id: "conv-real-id",
          content: "Second message",
          ...
        }
      ],
      data: {
        messages: [...],
        pagination: {
          page: 1,
          limit: 25,
          total: 2,
          hasMore: false
        }
      },
      pagination: {
        page: 1,
        limit: 25,
        total: 2,
        hasMore: false
      }
    }
  ],
  pageParams: [undefined]
}
```

## Key Improvements

| Before | After |
|--------|-------|
| ❌ Messages disappear on 2nd send | ✅ All messages persist |
| ❌ Manual page refresh needed | ✅ Seamless transition |
| ❌ 500+ lines inline logic | ✅ 100 lines dedicated hook |
| ❌ Hard to debug/test | ✅ Testable, isolated logic |
| ❌ Race condition possible | ✅ Atomic state updates |
| ❌ Cache structure mismatch | ✅ Proper infinite query shape |

## Testing the Fix

### Test Case 1: Single Message
1. Open "Pesan Baru" modal
2. Select recipient
3. Type "test message 1"
4. Click "Kirim Pesan"
5. ✅ Message appears in temp conversation
6. ✅ After server response, conversation switches to real ID
7. ✅ Message visible in real conversation

### Test Case 2: Multiple Messages
1. Continue from Test Case 1
2. Type "test message 2"
3. Click "Kirim Pesan"
4. ✅ **Both messages visible** (first message NOT gone)
5. Type "test message 3"
6. Click "Kirim Pesan"
7. ✅ **All three messages visible** ✅

### Test Case 3: Refresh & Persistence
1. After sending 3 messages
2. Refresh page (F5)
3. ✅ Real conversation loads via API
4. ✅ All messages visible
5. ✅ No need for manual refresh

### Test Case 4: Existing Conversation
1. Send message to user you've messaged before (real conv exists)
2. ✅ No temp conversation created
3. ✅ Message sent directly to real conversation
4. ✅ No reconciliation needed

## Debugging Tips

If you still see issues, check:

1. **Console logs:**
   ```
   [Reconciliation] Starting temp→real migration
   [Reconciliation] Found X temp messages
   [Reconciliation] Pre-warmed real conversation cache
   [Reconciliation] Updated conversations list
   [Reconciliation] Temp state cleaned up
   ```

2. **React Query DevTools:**
   - Verify `messageKeys.messages(userId, realConvId)` has messages
   - Verify `conversationKeys.lists(userId)` has real conversation ID

3. **Network tab:**
   - Verify WebSocket `message:send` callback returns `{ success: true, conversationId: "real-id" }`
   - Verify REST POST returns same

4. **Zustand store:**
   - Verify `activeConversationId` = real conversation ID after first message

## Performance Notes

- **Reconciliation is async** → doesn't block UI
- **Cache operations are batched** → single React render
- **Temp store cleanup** → prevents memory leaks
- **Event emission** → allows listeners to react to reconciliation

## Future Enhancements

1. **Prefetch second page** when reconciling (show pagination immediately)
2. **Persist reconciliation state** to localStorage (for offline recovery)
3. **Metrics/telemetry** on reconciliation duration
4. **Unit tests** for reconciliation logic
5. **E2E tests** for temp→real flow

## Related Files

- `src/features/messaging/temp-messages-store.ts` - In-memory temp message storage
- `src/features/messaging/temp-conversation-hints.ts` - Conversation metadata hints
- `src/hooks/useMessagesRQ.ts` - Message fetching hook
- `src/hooks/useConversationsRQ.ts` - Conversations list hook
- `src/components/messaging/chat-window.tsx` - Chat UI component
