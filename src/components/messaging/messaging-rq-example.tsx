"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMessagingRQ } from "@/hooks/useMessagingRQ";
import {
  Loader2,
  Send,
  MessageCircle,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

/**
 * Example component demonstrating the new React Query + Zustand messaging system
 * This shows how to use the comprehensive useMessagingRQ hook
 */
export const MessagingRQExample: React.FC = () => {
  const [newMessageContent, setNewMessageContent] = useState("");

  // Main messaging hook - provides everything needed
  const {
    // Data
    conversations,
    messages,
    activeConversationId,

    // UI State
    messageInput,
    totalUnreadCount,

    // Typing indicators
    isAnyoneTyping,
    typingText,

    // Loading states
    isLoading,
    isLoadingMessages,
    isSendingMessage,
    canLoadMore,

    // Connection state
    isSocketConnected,

    // Actions
    selectConversation,
    sendMessage,
    loadMoreMessages,
    setMessageContent,
    clearMessageInput,
    refreshData,
  } = useMessagingRQ();

  const handleSendMessage = async () => {
    if (!newMessageContent.trim()) return;

    await sendMessage(newMessageContent);
    setNewMessageContent("");
  };

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading messaging system...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            React Query + Zustand Messaging Demo
            {isSocketConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
          </CardTitle>
          <CardDescription>
            Demonstrating the new messaging system with React Query for data,
            Zustand for UI state, and WebSocket for real-time updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">
                  Conversations: {conversations?.length || 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{totalUnreadCount}</Badge>
                <span className="text-sm">Unread</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSocketConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm">
                  {isSocketConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
            <Button onClick={refreshData} size="sm" variant="outline">
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {conversations?.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No conversations
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {conversations?.map((conv) => (
                        <div
                          key={conv.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            activeConversationId === conv.id
                              ? "bg-blue-100 border-blue-300"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                          onClick={() => handleSelectConversation(conv.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {conv.otherParticipant?.name || "Unknown User"}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {conv.lastMessage?.content || "No messages"}
                              </div>
                            </div>
                            {(conv.unread_count || 0) > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {conv.unread_count || 0}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Messages */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {activeConversationId ? "Messages" : "Select a conversation"}
                </CardTitle>
                {isAnyoneTyping && (
                  <div className="text-sm text-blue-600 italic">
                    {typingText}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {activeConversationId ? (
                  <div className="space-y-4">
                    {/* Messages Area */}
                    <ScrollArea className="h-64 border rounded-lg p-4">
                      {isLoadingMessages ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading messages...</span>
                        </div>
                      ) : messages?.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                          No messages yet
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {canLoadMore && (
                            <Button
                              onClick={loadMoreMessages}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              Load More Messages
                            </Button>
                          )}
                          {messages?.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.senderType === "user"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                  message.senderType === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 text-gray-900"
                                }`}
                              >
                                <div className="text-sm">{message.content}</div>
                                <div className="text-xs opacity-70 mt-1">
                                  {new Date(message.timestamp || "").toLocaleTimeString()}
                                  {message.isRead && " ✓✓"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Input
                        value={newMessageContent}
                        onChange={(e) => setNewMessageContent(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={isSendingMessage}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessageContent.trim() || isSendingMessage}
                        size="sm"
                      >
                        {isSendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator className="my-6" />

          {/* Debug Info */}
          <details className="text-xs">
            <summary className="cursor-pointer text-blue-600 mb-2">
              Debug Information (Click to expand)
            </summary>
            <div className="bg-gray-100 p-3 rounded-lg">
              <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                {JSON.stringify(
                  {
                    activeConversationId,
                    conversationsCount: conversations?.length || 0,
                    messagesCount: messages?.length || 0,
                    totalUnreadCount,
                    isSocketConnected,
                    isLoading,
                    isLoadingMessages,
                    isSendingMessage,
                    canLoadMore,
                    messageInputContent: messageInput.content,
                    isAnyoneTyping,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessagingRQExample;
