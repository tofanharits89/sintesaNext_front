"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  useMessagingStores, 
  useConversationStores, 
  useMessagingActions 
} from '@/stores';

/**
 * Example component demonstrating how to use the new Zustand stores
 * This is just for demonstration - you can delete this file once you've integrated the stores
 */
export const MessagingStoreExample: React.FC = () => {
  // Global messaging state
  const { 
    activeConversationId, 
    messageInput, 
    totalUnreadCount, 
    conversationsWithUnread 
  } = useMessagingStores();
  
  // Example conversation ID for demonstration
  const exampleConversationId = 'conv-123';
  
  // Conversation-specific state
  const {
    conversationState,
    typingUsers,
    isAnyoneTyping,
    typingText,
    unreadCount,
    hasUnreadMessages
  } = useConversationStores(exampleConversationId);
  
  // All actions
  const { ui, typing, unread, notifications } = useMessagingActions();
  
  // Example handlers
  const handleSetActiveConversation = () => {
    ui.setActiveConversation(exampleConversationId);
  };
  
  const handleStartTyping = () => {
    typing.addTypingUser(exampleConversationId, {
      userId: 'user-456',
      username: 'john_doe',
      name: 'John Doe',
      startedAt: Date.now(),
    });
  };
  
  const handleStopTyping = () => {
    typing.removeTypingUser(exampleConversationId, 'user-456');
  };
  
  const handleAddUnread = () => {
    unread.incrementUnreadCount(
      exampleConversationId, 
      `msg-${Date.now()}`, 
      new Date().toISOString()
    );
  };
  
  const handleMarkAsRead = () => {
    unread.markConversationAsRead(exampleConversationId);
  };
  
  const handleAddNotification = () => {
    notifications.addNotification({
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from John Doe',
      conversationId: exampleConversationId,
      userId: 'user-456',
    });
  };
  
  const handleUpdateMessageInput = (value: string) => {
    ui.setMessageContent(value);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Messaging Stores Demo</CardTitle>
          <CardDescription>
            This demonstrates the new Zustand stores for messaging state management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Global State Display */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Global State</h3>
              <div className="space-y-2 text-sm">
                <div>Active Conversation: {activeConversationId || 'None'}</div>
                <div>Total Unread: <Badge variant="destructive">{totalUnreadCount}</Badge></div>
                <div>Conversations with Unread: {conversationsWithUnread.length}</div>
                <div>Message Input: "{messageInput.content}"</div>
                <div>Is Typing: {messageInput.isTyping ? 'Yes' : 'No'}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Conversation State ({exampleConversationId})</h3>
              <div className="space-y-2 text-sm">
                <div>Unread Count: <Badge variant="secondary">{unreadCount}</Badge></div>
                <div>Has Unread: {hasUnreadMessages ? 'Yes' : 'No'}</div>
                <div>Anyone Typing: {isAnyoneTyping ? 'Yes' : 'No'}</div>
                <div>Typing Users: {typingUsers.length}</div>
                {typingText && <div className="text-blue-600">"{typingText}"</div>}
                <div>Scrolled to Bottom: {conversationState.isScrolledToBottom ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>
          
          {/* Message Input Demo */}
          <div>
            <h3 className="font-semibold mb-2">Message Input</h3>
            <Input
              value={messageInput.content}
              onChange={(e) => handleUpdateMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="mb-2"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-2">
            <h3 className="font-semibold">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSetActiveConversation} size="sm">
                Set Active Conversation
              </Button>
              <Button onClick={handleStartTyping} size="sm" variant="outline">
                Start Typing
              </Button>
              <Button onClick={handleStopTyping} size="sm" variant="outline">
                Stop Typing
              </Button>
              <Button onClick={handleAddUnread} size="sm" variant="secondary">
                Add Unread
              </Button>
              <Button onClick={handleMarkAsRead} size="sm" variant="secondary">
                Mark as Read
              </Button>
              <Button onClick={handleAddNotification} size="sm" variant="destructive">
                Add Notification
              </Button>
            </div>
          </div>
          
          {/* Store State Preview */}
          <div>
            <h3 className="font-semibold mb-2">Raw Store State (for debugging)</h3>
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-600">Click to expand</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                {JSON.stringify({
                  activeConversationId,
                  messageInput,
                  conversationState,
                  typingUsers,
                  unreadCount,
                  totalUnreadCount,
                }, null, 2)}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagingStoreExample;
