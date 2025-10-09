/**
 * Usage Examples for Simplified Messaging System
 *
 * Shows how to replace complex old patterns with new simple ones
 */

import React, { useEffect } from "react";

// OLD WAY (Complex):
// import { useMessagingSocket } from "./useMessagingSocket";
// import { useSocket } from "./useSocket";
// import { useUnifiedSocket } from "./useUnifiedSocket";
// import { useMessageInput } from "@/stores/messaging-ui-store";
// import { useActiveConversationId } from "@/stores/messaging-ui-store";

// NEW WAY (Simple):
import { useMessaging } from "./useMessaging";
import { useMessageInput, useMessageActions } from "@/stores";

// Example 1: Basic usage
export function ChatExample() {
  const {
    isConnected,
    sendMessage,
    markAsRead,
    setActiveConversation,
    invalidateConversations
  } = useMessaging();
  
  const handleSendMessage = async (content: string, recipientId: string) => {
    try {
      await sendMessage({ content, recipientId });
      await invalidateConversations(); // Refresh conversation list
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };
  
  // JSX equivalent:
  // return (
  //   <div>
  //     <div className={`status ${isConnected ? "online" : "offline"}`}>
  //       Connection: {isConnected ? "✅" : "❌"}
  //     </div>
  //     {/* Your chat UI here */}
  //   </div>
  // );

  return null; // Example component - no actual rendering
}

// Example 2: Conversation management
export function ConversationExample({ conversationId }: { conversationId: string }) {
  const { joinConversation, leaveConversation, markAsRead } = useMessaging();
  
  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId);
    }
    
    return () => {
      leaveConversation(conversationId);
    };
  }, [conversationId, joinConversation, leaveConversation]);
  
  const handleMarkAsRead = (messageIds: string[]) => {
    markAsRead(messageIds, conversationId);
  };
  
  // JSX equivalent:
  // return (
  //   <div>
  //     <button onClick={() => markAsRead(["msg1", "msg2"])}>
  //       Mark Read
  //     </button>
  //   </div>
  // );

  return null; // Example component - no actual rendering
}

// Example 3: Replace old complex hooks
/*
// REMOVE these imports:
import { useMessageInput } from "@/stores/messaging-ui-store";
import { useActiveConversationId } from "@/stores/messaging-ui-store";
import { useTypingUsers } from "@/stores/messaging-ui-store";

// USE these instead:
import { useMessageInput } from "@/stores/messaging-store";
import { useActiveConversationId } from "@/stores/messaging-store";
import { useTypingUsers } from "@/stores/messaging-store";
*/

// Example 4: Component state integration
export function MessageInputExample() {
  const messageInput = useMessageInput();
  const { setMessageContent, clearMessageInput } = useMessageActions();
  const { sendMessage } = useMessaging();
  
  const handleSend = async (recipientId: string) => {
    await sendMessage({
      content: "Hello!",
      recipientId
    });
    clearMessageInput();
  };
  
  // JSX equivalent:
  // return (
  //   <input
  //     placeholder="Type a message..."
  //     onChange={(e) => setMessageContent(e.target.value)}
  //     onKeyPress={(e) => {
  //       if (e.key === "Enter") {
  //         // handle send logic here
  //       }
  //     }}
  //   />
  // );

  return null; // Example component - no actual rendering
}

/**
 * MIGRATION CHECKLIST:
 * 
 * ✅ Replace useMessagingSocket, useSocket, useUnifiedSocket with useMessaging
 * ✅ Import from messaging-store instead of messaging-ui-store  
 * ✅ Remove manual socket event listeners from components
 * ✅ Use sendMessage() instead of manual socket.emit()
 * ✅ Use markAsRead() instead of manual socket.emit()
 * ✅ Remove complex message normalization from components
 * ✅ Update backend to use simplified-handlers.ts
 * ✅ Test message send/receive functionality
 * ✅ Test typing indicators
 * ✅ Test conversation joining/leaving
 * ✅ Verify error handling works
 */
