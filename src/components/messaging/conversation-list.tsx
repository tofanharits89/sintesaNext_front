"use client";

import { Conversation } from "@/shared/socket-events";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/shared/socket-events";
import { cn } from "@/lib/utils";
import { MessageCircle, Crown, User } from "lucide-react";

// Helper function to get role display name
const getRoleDisplayName = (role?: string): string => {
  const roleNames: Record<string, string> = {
    super_admin: "Super Admin",
    co_admin: "Co-Admin",
    kantor_pusat: "Kantor Pusat",
    kanwil_djpb: "Kanwil DJPb",
    kppn: "KPPN",
    lainnya: "User Lainnya",
  };
  return roleNames[role || ""] || "User";
};

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onConversationSelect: (conversationId: string) => void;
  isLoading: boolean;
  getUnreadCount: (conversationId: string) => number;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onConversationSelect,
  isLoading,
  getUnreadCount,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No conversations yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Start a new conversation to begin messaging
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y overflow-hidden">
        {conversations.map((conversation) => {
          const isSelected = conversation.id === selectedConversationId;
          const unreadCount = getUnreadCount(conversation.id);
          const otherParticipant = conversation.otherParticipant;

          return (
            <Button
              key={conversation.id}
              variant="ghost"
              className={cn(
                "w-full h-auto px-6 py-4 justify-start text-left hover:bg-muted/50 rounded-none",
                isSelected && "bg-muted"
              )}
              onClick={() => onConversationSelect(conversation.id)}
            >
              <div className="flex items-start space-x-4 w-full min-w-0 overflow-hidden">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {otherParticipant?.name?.charAt(0)?.toUpperCase() ||
                        otherParticipant?.username?.charAt(0)?.toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Role indicator */}
                  {(otherParticipant?.role === "super_admin" ||
                    otherParticipant?.role === "co_admin") && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                      <Crown className="h-2 w-2 text-white" />
                    </div>
                  )}
                  {otherParticipant?.role &&
                    otherParticipant?.role !== "super_admin" &&
                    otherParticipant?.role !== "co_admin" && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                        <User className="h-2 w-2 text-white" />
                      </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h4
                        className={cn(
                          "text-sm font-medium truncate",
                          unreadCount > 0 && "font-semibold"
                        )}
                      >
                        {otherParticipant?.name ||
                          otherParticipant?.username ||
                          "Unknown User"}
                      </h4>

                      {/* Unread badge next to name */}
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="h-4 w-4 p-0 text-[10px] flex items-center justify-center rounded-full flex-shrink-0"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </div>

                    {/* Timestamp */}
                    {conversation.lastMessage && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                        {formatRelativeTime(
                          conversation.lastMessage.timestamp ||
                            conversation.lastMessage.created_at
                        )}
                      </span>
                    )}
                  </div>

                  {/* Last message preview */}
                  {conversation.lastMessage ? (
                    <div className="flex items-center gap-1 min-w-0 w-full">
                      {(conversation.lastMessage.senderType === "admin" ||
                        conversation.lastMessage.sender?.role ===
                          "super_admin" ||
                        conversation.lastMessage.sender?.role ===
                          "co_admin") && (
                        <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-sm text-muted-foreground truncate block flex-1 min-w-0",
                          unreadCount > 0 && "text-foreground font-medium"
                        )}
                        title={conversation.lastMessage.content} // Show full text on hover
                      >
                        {conversation.lastMessage.content}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No messages yet
                    </p>
                  )}

                  {/* User role */}
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      {getRoleDisplayName(otherParticipant?.role)}
                    </span>
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
