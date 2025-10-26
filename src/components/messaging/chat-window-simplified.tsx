"use client";

import { useState, useRef, useEffect } from "react";
import { useMessaging } from "@/hooks/useMessaging";
import { useMessageInput, useMessageActions } from "@/stores";
import { Conversation } from "@/types/socket-events";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, Smile, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils/utils";

interface ChatWindowProps {
  conversationId: string;
  conversation?: Conversation;
}

export function ChatWindowSimplified({ conversationId, conversation }: ChatWindowProps) {
  const { isConnected, sendMessage, markAsRead, joinConversation } = useMessaging();
  const messageInput = useMessageInput();
  const { setMessageContent, clearMessageInput } = useMessageActions();
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Join conversation when component mounts
  useEffect(() => {
    if (conversationId && isConnected) {
      joinConversation(conversationId);
    }
  }, [conversationId, isConnected, joinConversation]);

  // Handle message send
  const handleSendMessage = async () => {
    if (!messageInput.content.trim() && attachedFiles.length === 0) return;
    
    try {
      // For simplicity, just send text content for now
      await sendMessage({
        content: messageInput.content.trim(),
        recipientId: conversation?.otherParticipant?.id || conversationId, // TODO: Fix this
        conversationId,
      });
      
      clearMessageInput();
    } catch (error) {
      console.error("Failed to send message:", error);
      // TODO: Show error toast
    }
  };

  // Handle file attachment
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachedFiles(Array.from(event.target.files));
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: any) => {
    const currentContent = messageInput.content;
    setMessageContent(currentContent + emoji.native);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Mark messages as read when they become visible
  const handleScroll = () => {
    // TODO: Implement read receipts
    // markAsRead(messageIds, conversationId);
  };

  if (!conversationId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">Select a conversation to start messaging</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                {conversation?.otherParticipant?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {conversation?.otherParticipant?.name || "Unknown User"}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-gray-400"
                )} />
                {isConnected ? "Online" : "Offline"}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-grow flex flex-col p-0">
        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-grow h-0 px-4"
          onScroll={handleScroll}
        >
          <div className="space-y-4 py-4">
            {/* TODO: Add message rendering */}
            <div className="flex justify-center">
              <p className="text-xs text-muted-foreground">
                Connected: {isConnected ? "✅" : "❌"}
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {file.name}
                  <button
                    onClick={() => setAttachedFiles(files => files.filter((_, i) => i !== index))}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-end space-x-2">
            <div className="flex-grow">
              <Input
                ref={inputRef}
                placeholder="Type a message..."
                value={messageInput.content}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={!isConnected}
              />
            </div>
            
            <div className="flex items-center space-x-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isConnected}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={!isConnected}
              >
                <Smile className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                onClick={handleSendMessage}
                disabled={!isConnected || (!messageInput.content.trim() && attachedFiles.length === 0)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChatWindowSimplified;
