"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Crown, RefreshCw } from "lucide-react";
import type { Conversation, FrontendMessage } from "@/types/socket-events";
import { MessageStatus } from "../MessageStatus";

type UserLike = {
  id?: string | null;
  username?: string | null;
  name?: string | null;
};

interface ChatWindowMessagesProps {
  conversationId: string;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  messages: Array<FrontendMessage & Record<string, any>>;
  currentUser?: UserLike | null;
  isLoading: boolean;
  canLoadMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => Promise<void> | void;
  observeMessage: (element: HTMLElement, messageId: string) => void;
  isAnyoneTyping: boolean;
  typingText: string;
  conversationData?: Conversation;
  otherParticipant?:
    | Conversation["otherParticipant"]
    | Record<string, any>
    | null;
  onRetryMessage: (message: FrontendMessage & Record<string, any>) => void;
  formatTimestamp: (timestamp: string) => string;
}

export function ChatWindowMessages({
  conversationId,
  scrollAreaRef,
  messages,
  currentUser,
  isLoading,
  canLoadMore,
  isLoadingMore,
  onLoadMore,
  observeMessage,
  isAnyoneTyping,
  typingText,
  conversationData,
  otherParticipant,
  onRetryMessage,
  formatTimestamp,
}: ChatWindowMessagesProps) {
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);
  const lastLoadAtRef = useRef(0);

  useEffect(() => {
    setAutoLoadEnabled(false);
  }, [conversationId]);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
    if (!viewport) return;

    const handleScroll = () => {
      if (viewport.scrollTop <= 40) {
        setAutoLoadEnabled(true);
      }
    };

    viewport.addEventListener("scroll", handleScroll, { passive: true } as any);
    return () => viewport.removeEventListener("scroll", handleScroll as any);
  }, [conversationId, scrollAreaRef]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  const loadOlderMessages = useCallback(async () => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
    const previousHeight = viewport?.scrollHeight ?? 0;
    await Promise.resolve(onLoadMore());
    requestAnimationFrame(() => {
      const newHeight = viewport?.scrollHeight ?? 0;
      if (viewport) {
        viewport.scrollTop =
          newHeight - previousHeight + (viewport.scrollTop || 0);
      }
    });
  }, [scrollAreaRef, onLoadMore]);

  useEffect(() => {
    if (!canLoadMore || !autoLoadEnabled) return;
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
    const target = topSentinelRef.current;
    if (!viewport || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (isLoadingMoreRef.current) continue;
          const now = Date.now();
          if (now - lastLoadAtRef.current < 600) continue;
          lastLoadAtRef.current = now;

          try {
            observer.unobserve(target);
          } catch {}

          Promise.resolve()
            .then(() => loadOlderMessages())
            .finally(() => {
              setTimeout(() => {
                try {
                  observer.observe(target);
                } catch {}
              }, 200);
            });
        }
      },
      { root: viewport, rootMargin: "80px", threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [canLoadMore, autoLoadEnabled, loadOlderMessages, scrollAreaRef]);

  const handleLoadMoreClick = useCallback(() => {
    setAutoLoadEnabled(true);
    void loadOlderMessages();
  }, [loadOlderMessages]);

  const messageContent = useMemo(() => {
    if (messages.length > 0) {
      return (
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwnMessage = message.sender?.id === currentUser?.id;

            return (
              <div
                key={message.id}
                ref={(el) => {
                  if (el && !isOwnMessage) {
                    observeMessage(el, message.id);
                  }
                }}
                className={cn(
                  "flex gap-3 max-w-[80%]",
                  isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto",
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-sm",
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    {message.sender?.name?.charAt(0)?.toUpperCase() ||
                      message.sender?.username?.charAt(0)?.toUpperCase() ||
                      "?"}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    "flex flex-col",
                    isOwnMessage ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 mb-1",
                      isOwnMessage ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <span className="text-xs font-medium">
                      {isOwnMessage
                        ? "You"
                        : message.sender?.name || message.sender?.username}
                    </span>
                    {message.senderType === "admin" && (
                      <Crown className="h-3 w-3 text-yellow-500" />
                    )}
                    <span
                      className="text-xs text-muted-foreground"
                      title={formatTimestamp(message.timestamp || "")}
                    >
                      {formatTimestamp(message.timestamp || "")}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-full break-words",
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    {isOwnMessage ? (
                      <MessageStatus
                        isDelivered={Boolean(message.isDelivered)}
                        isRead={Boolean(message.isRead)}
                        isSending={Boolean((message as any)?._sending)}
                        isFailed={Boolean((message as any)?._failed)}
                        deliveredAt={message.deliveredAt ?? null}
                        readAt={message.readAt ?? null}
                        showTimestamp={false}
                        className="justify-end"
                      />
                    ) : (
                      <span
                        className={cn(
                          "text-xs transition-colors duration-200",
                          message.isRead ? "text-green-600" : "text-orange-600",
                        )}
                      >
                        {message.isRead ? "Read" : "Unread"}
                      </span>
                    )}

                    {isOwnMessage && Boolean((message as any)?._failed) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-600 hover:text-red-700"
                        onClick={() => onRetryMessage(message)}
                        title="Retry sending"
                        aria-label="Retry sending message"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {typeof window !== "undefined" &&
                    window.localStorage?.getItem("MSG_DEBUG") === "1" &&
                    isOwnMessage && (
                      <span className="block text-[10px] text-muted-foreground/70">
                        dbg {message.id?.slice(0, 8)} d:
                        {String(message.isDelivered)} r:
                        {String(message.isRead)}
                      </span>
                    )}
                </div>
              </div>
            );
          })}

          {isAnyoneTyping && (
            <div className="flex gap-3 max-w-[80%]">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-muted text-sm">
                  {otherParticipant?.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-3 py-2">
                <div className="text-sm text-muted-foreground">
                  {typingText}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                index % 2 === 0 ? "justify-start" : "justify-end",
              )}
            >
              {index % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
              <div
                className={cn(
                  "space-y-1",
                  index % 2 === 0 ? "items-start" : "items-end",
                )}
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton
                  className={cn(
                    "h-10 rounded-lg",
                    index % 2 === 0 ? "w-48" : "w-32",
                  )}
                />
              </div>
              {index % 2 === 1 && <Skeleton className="h-8 w-8 rounded-full" />}
            </div>
          ))}
        </div>
      );
    }

    const fallbackMessage = (conversationData as any)?.lastMessage;
    if (fallbackMessage?.content) {
      const isOwn = fallbackMessage?.sender?.id === currentUser?.id;
      return (
        <div className="p-4">
          <div
            className={cn(
              "flex gap-3 max-w-[80%]",
              isOwn ? "ml-auto flex-row-reverse" : "mr-auto",
            )}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback
                className={cn(
                  "text-sm",
                  isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {fallbackMessage?.sender?.name?.charAt(0)?.toUpperCase() ||
                  fallbackMessage?.sender?.username?.charAt(0)?.toUpperCase() ||
                  "?"}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "flex flex-col",
                isOwn ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2 mb-1",
                  isOwn ? "flex-row-reverse" : "flex-row",
                )}
              >
                <span className="text-xs font-medium">
                  {isOwn
                    ? "You"
                    : fallbackMessage?.sender?.name ||
                      fallbackMessage?.sender?.username ||
                      "User"}
                </span>
                {fallbackMessage?.senderType === "admin" && (
                  <Crown className="h-3 w-3 text-yellow-500" />
                )}
                <span
                  className="text-xs text-muted-foreground"
                  title={formatTimestamp(
                    fallbackMessage?.timestamp || fallbackMessage?.created_at,
                  )}
                >
                  {formatTimestamp(
                    fallbackMessage?.timestamp || fallbackMessage?.created_at,
                  )}
                </span>
              </div>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 max-w-full break-words",
                  isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {fallbackMessage.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-muted-foreground">
          <h4 className="text-lg font-medium mb-2">Start the conversation</h4>
          <p className="text-sm">
            Send a message to begin chatting with{" "}
            {otherParticipant?.name || "this user"}
          </p>
        </div>
      </div>
    );
  }, [
    messages,
    currentUser?.id,
    observeMessage,
    isAnyoneTyping,
    typingText,
    otherParticipant?.name,
    isLoading,
    conversationData,
    formatTimestamp,
    onRetryMessage,
  ]);

  return (
    <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
      <div className="p-4">
        {(canLoadMore || isLoadingMore) && (
          <div className="mb-3 flex items-center justify-center min-h-9">
            {canLoadMore ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMoreClick}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading…" : "Load previous messages"}
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground">Loading…</div>
            )}
          </div>
        )}
        <div ref={topSentinelRef} className="h-1" />
        {messageContent}
      </div>
    </ScrollArea>
  );
}
