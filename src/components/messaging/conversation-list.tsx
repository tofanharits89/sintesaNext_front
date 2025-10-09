"use client";

import { useEffect, useRef } from "react";
import { Conversation } from "@/types/socket-events";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/types/socket-events";
import { cn } from "@/lib/utils";
import { MessageCircle, Crown, User } from "lucide-react";
import { useOnlineUsers } from "@/hooks/use-online-users";

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
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onConversationSelect,
  isLoading,
  getUnreadCount,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: ConversationListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastLoadTriggerRef = useRef<number>(0);
  const { onlineUsers } = useOnlineUsers();

  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // Avoid spamming load calls while a load is in-flight
          if (isLoadingMore) continue;
          // Throttle triggers slightly to prevent rapid back-to-back calls
          const now = Date.now();
          if (now - lastLoadTriggerRef.current < 800) continue;
          lastLoadTriggerRef.current = now;
          onLoadMore();
        }
      },
      { root: el.parentElement, rootMargin: "200px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, onLoadMore, conversations.length, isLoadingMore]);

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
          
          // Extract online status check
          const isOnline = !!(otherParticipant && onlineUsers?.some((u) =>
            (otherParticipant as any)?.id && u.user.id === (otherParticipant as any).id
              ? true
              : (otherParticipant as any)?.username &&
                u.user.username === (otherParticipant as any).username
          ));
          
          // Extract timestamp calculation
          const getTimestamp = () => {
            return conversation.lastMessage?.timestamp ||
              (conversation.lastMessage as any)?.created_at ||
              (conversation.lastMessage as any)?.sentAt ||
              (conversation as any)?.lastMessageAt ||
              (conversation as any)?.updated_at ||
              (conversation as any)?.updatedAt ||
              null;
          };
          
          const timestamp = getTimestamp();
          const formattedTime = timestamp ? formatRelativeTime(timestamp) : null;

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
              <div className="flex items-center space-x-4 w-full min-w-0 overflow-hidden">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {otherParticipant?.name?.charAt(0)?.toUpperCase() ||
                        otherParticipant?.username?.charAt(0)?.toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Role indicator removed from avatar; now shown near the name */}

                  {/* Online/offline presence indicator (bottom-right, larger size) */}
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2",
                      // Use border to create an outline against the avatar
                      "border-background",
                      isOnline ? "bg-emerald-500" : "bg-gray-400"
                    )}
                    aria-label={isOnline ? "Online" : "Offline"}
                    title={isOnline ? "Online" : "Offline"}
                  />
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

                      {/* Role badge after name */}
                      <Badge variant="secondary" className="text-[10px] py-0.5">
                        {otherParticipant?.role === "super_admin" ||
                        otherParticipant?.role === "co_admin" ? (
                          <>
                            <Crown className="h-3 w-3 mr-1" />
                            Administrator
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            {otherParticipant?.username || "User"}
                          </>
                        )}
                      </Badge>

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

                    {/* Timestamp (fallback to lastMessageAt/updatedAt when lastMessage missing) */}
                    {timestamp && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                        {formattedTime}
                      </span>
                    )}
                  </div>

                  

                  {/* Last message preview (moved below role, reduced font size) */}
                  {conversation.lastMessage ? (
                    <div className="flex items-center gap-1 min-w-0 w-full mt-1">
                      {((conversation.lastMessage as any).senderType === "admin" ||
                        (conversation.lastMessage as any).sender_type === "admin" ||
                        conversation.lastMessage.sender?.role === "super_admin" ||
                        conversation.lastMessage.sender?.role === "co_admin") && (
                        <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          // Allow wrapping so preview doesn't cut off; keep layout stable
                          "text-xs text-muted-foreground block flex-1 min-w-0 whitespace-normal break-words",
                          // If line-clamp is available in Tailwind config, this limits to 2 lines while wrapping
                          "line-clamp-2",
                          unreadCount > 0 && "text-foreground font-medium"
                        )}
                        title={conversation.lastMessage.content} // Show full text on hover
                      >
                        {conversation.lastMessage.content}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      No messages yet
                    </p>
                  )}
                </div>
              </div>
            </Button>
          );
        })}

        {/* Inline loader under the list when paginating */}
        {isLoadingMore && (
          <div className="px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              <span>Loading more…</span>
            </div>
          </div>
        )}

        {/* Infinite scroll sentinel and fallback button */}
        <div ref={sentinelRef} className="h-6" />
        {hasMore && (
          <div className="p-4 flex items-center justify-center">
            <Button
              variant="outline"
              onClick={() => onLoadMore && onLoadMore()}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Memuat..." : "Muat lebih banyak"}
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
