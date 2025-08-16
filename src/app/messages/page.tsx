"use client";

import { useState } from "react";
import { useMessaging } from "@/hooks/useMessaging";
import { useConversations } from "@/hooks/useConversations";
import { ChatWindow } from "@/components/messaging/chat-window";
import { ConversationList } from "@/components/messaging/conversation-list";
import { NewMessageDialog } from "@/components/messaging/new-message-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquarePlus, Users, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);

  const { isConnected, selectConversation, currentConversation } =
    useMessaging();
  const { conversations, isLoading } = useConversations();

  const handleConversationSelect = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    await selectConversation(conversationId);
  };

  const handleNewMessage = () => {
    setShowNewMessageDialog(true);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Messages</h1>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge
                variant="secondary"
                className="text-green-600 bg-green-50 border-green-200"
              >
                <Wifi className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-orange-600 bg-orange-50 border-orange-200"
              >
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>

        <Button onClick={handleNewMessage} className="flex items-center gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-200px)]">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <Card className="h-[600px] max-h-[70vh] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ConversationList
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                onConversationSelect={handleConversationSelect}
                isLoading={isLoading}
                getUnreadCount={(id) => {
                  const conv = conversations.find((c) => c.id === id);
                  if (!conv) return 0;
                  if (typeof conv.unread_count === "number")
                    return conv.unread_count;
                  const lm = conv.lastMessage as any;
                  if (!lm) return 0;
                  const isRead = lm?.isRead ?? lm?.is_read;
                  return isRead ? 0 : 1;
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {currentConversation ? (
            <ChatWindow conversation={currentConversation} />
          ) : (
            <Card className="h-[600px] max-h-[70vh] flex items-center justify-center">
              <CardContent className="text-center">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <Users className="h-12 w-12" />
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      No conversation selected
                    </h3>
                    <p className="text-sm">
                      Choose a conversation from the list or start a new message
                    </p>
                  </div>
                  <Button onClick={handleNewMessage} variant="outline">
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    Start New Conversation
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Message Dialog */}
      <NewMessageDialog
        open={showNewMessageDialog}
        onOpenChange={setShowNewMessageDialog}
        onConversationCreated={(conversationId) => {
          setShowNewMessageDialog(false);
          handleConversationSelect(conversationId);
        }}
      />
    </div>
  );
}
