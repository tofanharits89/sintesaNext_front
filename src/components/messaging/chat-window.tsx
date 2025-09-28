"use client";

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
// Import the new React Query + Zustand messaging system
// useConversationRQ import removed (unused)
import { useAutoMarkAsRead } from "@/hooks/useAutoMarkAsRead";
import { Conversation } from "@/shared/socket-events";
// Removed background message queue auto-retry usage
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Send,
  Crown,
  User,
  Wifi,
  WifiOff,
  MoreVertical,
  Smile,
  Paperclip,
  Image,
  FileText,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/use-current-user";
import { MessageStatus } from "./MessageStatus";
import { useOnlineUsers } from "@/hooks/use-online-users";
import { useMessagingRQ } from "@/hooks/messaging-rq";
import { useSendMessageMutation } from "@/hooks/useMessageMutationsRQ";
import { useQueryClient } from "@tanstack/react-query";
import { updateTempMessageById } from "@/features/messaging/temp-messages-store";
import { messageKeys } from "@/hooks/useMessagesRQ";
import dynamic from "next/dynamic";
import { getHint } from "@/features/messaging/temp-conversation-hints";
import { pushTempMessage } from "@/features/messaging/temp-messages-store";

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
});

interface ChatWindowProps {
  conversationId: string;
  conversation?: Conversation; // Optional for backward compatibility
}

export function ChatWindow({ conversationId, conversation }: ChatWindowProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background outbox disabled: we now surface real-time send status/errors

  // Enable auto-load of older messages only after user intent (scroll near top or click)
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(false);

  // Reset autoload gate when switching conversations so we don't auto-load immediately on short threads
  useEffect(() => {
    setAutoLoadEnabled(false);
  }, [conversationId]);

  // Enable autoload when user scrolls near the top of the viewport
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    if (!viewport) return;
    const onScroll = () => {
      try {
        if (viewport.scrollTop <= 40) {
          setAutoLoadEnabled(true);
        }
      } catch {}
    };

  
    try {
      viewport.addEventListener(
        "scroll",
        onScroll as any,
        { passive: true } as any
      );
    } catch {}
    return () => {
      try {
        viewport.removeEventListener("scroll", onScroll as any);
      } catch {}
    };
  }, [conversationId]);

  const { currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const resendMutation = useSendMessageMutation();

  // Use the new React Query + Zustand messaging system
  const {
    // Data
    conversations,
    messages,
    activeConversationId,

    // UI State
    messageInput,

    // Typing indicators
    isAnyoneTyping,
    typingText,

    // Loading states
    isLoading,
    canLoadMore,
    isLoadingMoreMessages,

    // Connection state
    isSendingMessage,

    // Actions
    sendMessage: sendMessageRQ,
    selectConversation,
    loadMoreMessages,
    markMessagesAsRead,
    setMessageContent,
    startTyping: startTypingRQ,
    stopTyping: stopTypingRQ,
  } = useMessagingRQ();

  // Prefer real active id when prop is temporary to avoid falling back to temp after reconciliation
  const effectiveConversationId = useMemo(() => {
    const isTemp =
      conversationId?.startsWith("temp-") ||
      conversationId?.startsWith("temp_conv-") ||
      conversationId?.startsWith("temp-conv-");
    const activeIsReal =
      !!activeConversationId &&
      !activeConversationId.startsWith("temp-") &&
      !activeConversationId.startsWith("temp_conv-") &&
      !activeConversationId.startsWith("temp-conv-");
    return isTemp && activeIsReal ? activeConversationId : conversationId;

    // Debug effect removed - was logging conversation state changes
  }, [conversationId, activeConversationId]);

  // Get conversation data from the new system or fallback to prop
  const conversationData =
    conversations?.find((c) => c.id === effectiveConversationId) ||
    conversation;

  // Messages are now handled by the useMessagingRQ hook above
  // No need for separate useMessagesData hook
  // Mount/unmount side-effects removed (no-op)
  useEffect(() => {
    return () => {};
  }, [effectiveConversationId]);

  // After sending, keep the viewport pinned to bottom for a short period
  const pinUntilRef = useRef<number>(0);

  // Get online users to check if other participant is online
  const { onlineUsers } = useOnlineUsers();
  // The new system handles read/opened mutations automatically

  // Custom message visibility handler
  const handleMessageVisible = (messageId: string) => {
    // Keep passive; useAutoMarkAsRead will handle status
  };

  // Load older messages preserving scroll offset
  const loadOlderMessagesPreserveScroll = async () => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    const prevHeight = viewport?.scrollHeight ?? 0;
    await loadMoreMessages();
    // After React Query adds older messages to the top, adjust scrollTop to preserve view
    requestAnimationFrame(() => {
      const newHeight = viewport?.scrollHeight ?? 0;
      if (viewport)
        viewport.scrollTop = newHeight - prevHeight + (viewport.scrollTop || 0);
    });
  };

  // Top sentinel to auto-load previous pages
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  // Avoid rapid duplicate loads from IO callbacks and re-renders
  const isLoadingMoreRef = useRef(false);
  const lastLoadAtRef = useRef(0);
  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMoreMessages;
  }, [isLoadingMoreMessages]);

  useEffect(() => {
    if (!canLoadMore || !autoLoadEnabled) return;
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;
    const target = topSentinelRef.current;
    if (!viewport || !target) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          // Guard: do not trigger while a load is in-flight
          if (isLoadingMoreRef.current) continue;
          // Throttle triggers to avoid back-to-back same-page requests
          const now = Date.now();
          if (now - lastLoadAtRef.current < 600) continue;
          lastLoadAtRef.current = now;

          // Temporarily unobserve to prevent cascaded triggers while loading
          try {
            io.unobserve(target);
          } catch {}
          Promise.resolve()
            .then(() => loadOlderMessagesPreserveScroll())
            .finally(() => {
              // Re-attach after a short delay so layout can settle
              setTimeout(() => {
                try {
                  io.observe(target);
                } catch {}
              }, 200);
            });
        }
      },
      { root: viewport, rootMargin: "80px", threshold: 0 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [canLoadMore]);

  // Controlled auto-mark-as-read/opened functionality
  const { observeMessage, clearMarkedMessages } = useAutoMarkAsRead({
    messages,
    currentUserId: currentUser?.id,
    conversationId: effectiveConversationId,
    // Make read a no-op here to avoid duplicate mutations
    markAsRead: async (_ids) => {},
    // Enable opened-only behavior
    enabled: true,
    debounceMs: 100, // Very fast for real-time feedback while chatting
    onMessageVisible: handleMessageVisible, // Pass the visibility handler
  });

  // The new system handles conversation selection automatically

  // The new system handles conversation creation and reconciliation automatically

  // The new system handles message status automatically

  // The new system handles message read status updates automatically

  // Scroll to bottom function with smooth behavior
  const scrollToBottom = (smooth = false) => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        if (smooth) {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: "smooth",
          });
        } else {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // If we're within the grace period, force pin to bottom
    if (Date.now() < pinUntilRef.current) {
      scrollToBottom(false);
      return;
    }
    scrollToBottom(false);
  }, [messages.length]);

  // Seed an optimistic message from hint if this is a temp conversation with no messages yet
  useEffect(() => {
    const cid = effectiveConversationId;
    if (!cid) return;
    const isTemp =
      cid.startsWith("temp-") ||
      cid.startsWith("temp_conv-") ||
      cid.startsWith("temp-conv-");
    if (!isTemp) return;
    if (messages && messages.length > 0) return;
    const hint = getHint(cid);
    const lm: any = hint?.lastMessage;
    if (!lm?.content) return;
    try {
      const nowIso = lm.timestamp || new Date().toISOString();
      const tempMsgId = `temp-msg-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
      pushTempMessage(cid, {
        id: tempMsgId,
        conversationId: cid,
        content: lm.content,
        timestamp: nowIso,
        sender:
          lm.sender ||
          (currentUser
            ? {
                id: currentUser.id,
                username: currentUser.username || "you",
                name: currentUser.name || "You",
              }
            : { id: "current-user", username: "you", name: "You" }),
        senderType:
          lm.senderType ||
          (currentUser?.role === "super_admin" ||
          currentUser?.role === "co_admin"
            ? ("admin" as const)
            : ("user" as const)),
        isRead: true,
        isDelivered: false,
      } as any);
    } catch {}
  }, [effectiveConversationId, messages?.length, currentUser?.id]);

  // Auto-mark-as-read is now handled by useAutoMarkAsRead hook with proper safeguards

  // Enhanced timestamp formatting for chat window
  const formatEnhancedTimestamp = (timestamp: string) => {
    if (!timestamp) return "—";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Format the actual date/time
    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const dateStr = date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });

    // Generate relative time
    let relativeTime = "";
    if (diffMinutes < 1) {
      relativeTime = "Just now";
    } else if (diffMinutes < 60) {
      relativeTime = `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours}h ago`;
    } else if (diffDays < 7) {
      relativeTime = `${diffDays}d ago`;
    } else {
      relativeTime = dateStr;
    }

    // Combine relative and absolute time
    if (relativeTime === "Just now") {
      return `${relativeTime} (${timeStr})`;
    } else if (diffDays < 7) {
      return `${relativeTime} (${dateStr}, ${timeStr})`;
    } else {
      return `${dateStr}, ${timeStr}`;
    }
  };

  // Format opened timestamp
  const formatOpenedTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Ensure active conversation is set ASAP and then focus+scroll
  useLayoutEffect(() => {
    // Ensure the global active conversation is correctly set so mutations use it
    if (effectiveConversationId) {
      selectConversation(effectiveConversationId);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Scroll to bottom when switching conversations
    setTimeout(() => scrollToBottom(false), 100);
  }, [effectiveConversationId]);

  // Keep view pinned when a reconciled message arrives without changing list length
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { conversationId?: string };
      if (!detail || detail.conversationId !== effectiveConversationId) return;
      scrollToBottom(false);
    };
    window.addEventListener("messages:appended", handler as EventListener);
    return () =>
      window.removeEventListener("messages:appended", handler as EventListener);
  }, [effectiveConversationId]);

  const handleSendMessage = async () => {
    if (!messageInput.content.trim() && attachedFiles.length === 0) return;

    const content = messageInput.content.trim();
    const files = [...attachedFiles];

    // Clear attachments
    setAttachedFiles([]);

    // Stop typing indicator
    stopTypingRQ();

    // For now, just send the text message
    // TODO: Implement file upload functionality in the backend
    if (content) {
      try {
        // Direct send without background outbox
        // For temp conversations, pass recipientId so backend can create the real conversation
        const isTempConv =
          effectiveConversationId?.startsWith("temp-") ||
          effectiveConversationId?.startsWith("temp_conv-") ||
          effectiveConversationId?.startsWith("temp-conv-");
        const recipientId = isTempConv ? otherParticipant?.id : undefined;

        // Direct send via React Query mutation; UI shows loading/errors immediately
        await sendMessageRQ(content, recipientId, effectiveConversationId);
      } catch (error) {
        // Error is surfaced via notifications in useMessagingRQ
        console.error('Failed to send message:', error);
      }
    }

    // If there are files, show a placeholder message for now
    if (files.length > 0) {
      const fileNames = files.map((f) => f.name).join(", ");
      try {
        await sendMessageRQ(
          `📎 Attached files: ${fileNames} (File upload feature coming soon)`
        );
      } catch (error) {}
    }
  };

  const handleInputChange = (value: string) => {
    setMessageContent(value);

    // Handle typing indicators
    if (value.trim() && !messageInput.isTyping) {
      startTypingRQ();
    } else if (!value.trim() && messageInput.isTyping) {
      stopTypingRQ();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiData: any) => {
    const emoji = emojiData.emoji;
    setMessageContent(messageInput.content + emoji);
    setShowEmojiPicker(false);
    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle file attachment
  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
    // Reset the input value so the same file can be selected again
    if (event.target) {
      event.target.value = "";
    }
  };

  // Remove attached file
  const removeAttachedFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Trigger file input
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Manual retry for failed outgoing messages
  const handleRetryMessage = async (msg: any) => {
    try {
      const convId = String(msg.conversationId || effectiveConversationId || "");
      const isTempConv =
        convId.startsWith("temp-") ||
        convId.startsWith("temp_conv-") ||
        convId.startsWith("temp-conv-");

      const recipientId = isTempConv ? otherParticipant?.id : undefined;

      if (isTempConv) {
        // For temp convs, update the in-memory store flags
        updateTempMessageById(convId, String(msg.id), {
          _sending: true as any,
          _failed: false as any,
        });
      } else if (convId) {
        // For real convs, update the React Query cache flags
        queryClient.setQueryData(messageKeys.messages(convId), (prev: any) => {
          if (!prev?.pages) return prev;
          const copy = { ...prev, pages: prev.pages.map((p: any) => ({ ...p })) };
          for (let pi = 0; pi < copy.pages.length; pi++) {
            const p = copy.pages[pi];
            const msgs = Array.isArray(p?.data?.messages)
              ? p.data.messages.map((m: any) =>
                  m?.id === msg.id ? { ...m, _sending: true, _failed: false } : m
                )
              : p?.data?.messages;
            copy.pages[pi] = { ...p, data: { ...(p?.data || {}), messages: msgs } };
          }
          return copy;
        });
      }

      // Resend using the same tempId so reconciliation works if accepted by server
      await resendMutation.mutateAsync({
        content: String(msg.content || ""),
        ...(isTempConv ? {} : { conversationId: convId }),
        recipientId,
        tempId: String(msg.id),
        // Mark this as an explicit manual retry so mutation success is accepted
        // even if there was a prior failed attempt with the same tempId.
        // The send mutation will treat onSuccess as authoritative.
        isRetry: true as any,
      });
    } catch {}
  };

  // Prefer provided otherParticipant; fallback to React Query conversations list match; else derive from participants/lastMessage
  const otherParticipant = useMemo(() => {
    if (conversation?.otherParticipant) return conversation.otherParticipant;

    // If we're on a temp conversation, consult hint store to resolve immediately
    const cid = (effectiveConversationId || conversation?.id) as
      | string
      | undefined;
    if (
      cid &&
      (cid.startsWith("temp-") ||
        cid.startsWith("temp_conv-") ||
        cid.startsWith("temp-conv-"))
    ) {
      const hint = getHint(cid);
      if (hint?.otherParticipant) return hint.otherParticipant as any;
    }

    const fromList = conversations?.find(
      (c) => c.id === (effectiveConversationId || conversation?.id)
    );
    if (fromList?.otherParticipant) return fromList.otherParticipant;

    // 3) Derive from participants (if available)
    const p1 = (fromList || conversation)?.participant1 as any;
    const p2 = (fromList || conversation)?.participant2 as any;
    const currentId = currentUser?.id;
    if (p1 && p2) {
      if (currentId) {
        if (p1.id !== currentId) return p1;
        if (p2.id !== currentId) return p2;
      } else {
        // No currentUser yet; pick the first available participant
        return p2 || p1;
      }
    } else if (p1 || p2) {
      return p1 || p2;
    }

    // 3b) Derive from participant ids when participant objects are missing
    const p1Id = (fromList || (conversation as any))?.participant1_id as
      | string
      | undefined;
    const p2Id = (fromList || (conversation as any))?.participant2_id as
      | string
      | undefined;
    if (p1Id || p2Id) {
      // If we know current user id, pick the non-self id; otherwise pick any available id
      let candidateId: string | undefined = undefined;
      if (currentId) {
        candidateId =
          p1Id && p1Id !== currentId
            ? p1Id
            : p2Id && p2Id !== currentId
            ? p2Id
            : undefined;
      } else {
        candidateId = p2Id || p1Id;
      }
      if (candidateId) {
        return { id: candidateId, username: candidateId } as any;
      }
    }

    // 4) Derive from lastMessage sender/recipient
    const lm = (fromList || conversation)?.lastMessage as any;
    if (lm) {
      if (lm.sender && lm.sender.id && lm.sender.id !== currentId)
        return lm.sender;
      if (lm.recipient && lm.recipient.id && lm.recipient.id !== currentId)
        return lm.recipient;
    }

    return undefined;
  }, [
    effectiveConversationId,
    conversation?.id,
    (conversation as any)?.otherParticipant,
    conversations,
    currentUser?.id,
  ]);

  // Debug logs removed

  // Check if other participant is online
  const isOtherParticipantOnline = useMemo(() => {
    if (!otherParticipant?.id) return false;
    return onlineUsers.some(
      (onlineUser) => onlineUser.user.id === otherParticipant.id
    );
  }, [otherParticipant?.id, onlineUsers]);

  return (
    <Card className="h-[600px] max-h-[70vh] flex flex-col overflow-hidden">
      {/* Header */}
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {otherParticipant?.name?.charAt(0)?.toUpperCase() ||
                otherParticipant?.username?.charAt(0)?.toUpperCase() ||
                "?"}
            </AvatarFallback>
          </Avatar>

          {/* Name + role badge + online badge on the same row */}
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-medium text-sm truncate">
              {otherParticipant?.name ||
                otherParticipant?.username ||
                "Unknown User"}
            </h3>

            <Badge variant="secondary" className="text-xs flex-shrink-0">
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

            {/* Online status - shows if the other participant is online */}
            {isOtherParticipantOnline ? (
              <Badge
                variant="secondary"
                className="text-green-600 bg-green-50 border-green-200 text-xs flex-shrink-0"
              >
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-orange-600 bg-orange-50 border-orange-200 text-xs flex-shrink-0"
              >
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 flex flex-col min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
          <div className="p-4">
            {/* Top loader: button + sentinel for older messages */}
            {(canLoadMore || isLoadingMoreMessages) && (
              <div className="mb-3 flex items-center justify-center min-h-9">
                {canLoadMore ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAutoLoadEnabled(true);
                      loadOlderMessagesPreserveScroll();
                    }}
                    disabled={isLoadingMoreMessages}
                  >
                    {isLoadingMoreMessages
                      ? "Loading…"
                      : "Load previous messages"}
                  </Button>
                ) : (
                  <div className="text-xs text-muted-foreground">Loading…</div>
                )}
              </div>
            )}
            <div ref={topSentinelRef} className="h-1" />
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.sender.id === currentUser?.id;

                  return (
                    <div
                      key={message.id}
                      ref={(el) => {
                        if (el && !isOwnMessage) {
                          // Only observe messages from other users for auto-mark-as-read
                          observeMessage(el, message.id);
                        }
                      }}
                      className={cn(
                        "flex gap-3 max-w-[80%]",
                        isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      {/* Avatar */}
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback
                          className={cn(
                            "text-sm",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {message.sender.name?.charAt(0)?.toUpperCase() ||
                            message.sender.username?.charAt(0)?.toUpperCase() ||
                            "?"}
                        </AvatarFallback>
                      </Avatar>

                      {/* Message bubble */}
                      <div
                        className={cn(
                          "flex flex-col",
                          isOwnMessage ? "items-end" : "items-start"
                        )}
                      >
                        {/* Sender name and time */}
                        <div
                          className={cn(
                            "flex items-center gap-2 mb-1",
                            isOwnMessage ? "flex-row-reverse" : "flex-row"
                          )}
                        >
                          <span className="text-xs font-medium">
                            {isOwnMessage
                              ? "You"
                              : message.sender.name || message.sender.username}
                          </span>
                          {message.senderType === "admin" && (
                            <Crown className="h-3 w-3 text-yellow-500" />
                          )}
                          <span
                            className="text-xs text-muted-foreground"
                            title={formatEnhancedTimestamp(message.timestamp)}
                          >
                            {formatEnhancedTimestamp(message.timestamp)}
                          </span>
                        </div>

                        {/* Message content */}
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 max-w-full break-words",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>

                        {/* Message status indicators + retry when failed */}
                        <div className="mt-1 flex items-center gap-2">
                          {isOwnMessage ? (
                            // For sent messages: show 2-state status indicators (delivered → read)
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
                            // For received messages: show read/unread status with timestamp
                            <span
                              className={cn(
                                "text-xs transition-colors duration-200",
                                message.isRead
                                  ? "text-green-600"
                                  : "text-orange-600"
                              )}
                            >
                              {message.isRead ? `Read` : "Unread"}
                            </span>
                          )}

                          {isOwnMessage && Boolean((message as any)?._failed) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-600 hover:text-red-700"
                              onClick={() => handleRetryMessage(message)}
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

                {/* Typing indicator */}
                {isAnyoneTyping && (
                  <div className="flex gap-3 max-w-[80%]">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-sm">
                        {conversationData?.otherParticipant?.name
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
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
            ) : isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      i % 2 === 0 ? "justify-start" : "justify-end"
                    )}
                  >
                    {i % 2 === 0 && (
                      <Skeleton className="h-8 w-8 rounded-full" />
                    )}
                    <div
                      className={cn(
                        "space-y-1",
                        i % 2 === 0 ? "items-start" : "items-end"
                      )}
                    >
                      <Skeleton className="h-4 w-24" />
                      <Skeleton
                        className={cn(
                          "h-10 rounded-lg",
                          i % 2 === 0 ? "w-48" : "w-32"
                        )}
                      />
                    </div>
                    {i % 2 === 1 && (
                      <Skeleton className="h-8 w-8 rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Fallback: If we just redirected to a real conversation and
              // React Query hasn't loaded messages yet, show the lastMessage
              // from the conversation as a placeholder so the chat isn't blank.
              (() => {
                const lm: any = (conversationData as any)?.lastMessage;
                if (lm?.content) {
                  const isOwn = lm?.sender?.id === currentUser?.id;
                  return (
                    <div className="p-4">
                      <div
                        className={cn(
                          "flex gap-3 max-w-[80%]",
                          isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback
                            className={cn(
                              "text-sm",
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {lm?.sender?.name?.charAt(0)?.toUpperCase() ||
                              lm?.sender?.username?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "flex flex-col",
                            isOwn ? "items-end" : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-2 mb-1",
                              isOwn ? "flex-row-reverse" : "flex-row"
                            )}
                          >
                            <span className="text-xs font-medium">
                              {isOwn
                                ? "You"
                                : lm?.sender?.name ||
                                  lm?.sender?.username ||
                                  "User"}
                            </span>
                            {lm?.senderType === "admin" && (
                              <Crown className="h-3 w-3 text-yellow-500" />
                            )}
                            <span
                              className="text-xs text-muted-foreground"
                              title={formatEnhancedTimestamp(
                                lm?.timestamp || lm?.created_at
                              )}
                            >
                              {formatEnhancedTimestamp(
                                lm?.timestamp || lm?.created_at
                              )}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "rounded-lg px-3 py-2 max-w-full break-words",
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {lm.content}
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
                      <h4 className="text-lg font-medium mb-2">
                        Start the conversation
                      </h4>
                      <p className="text-sm">
                        Send a message to begin chatting with{" "}
                        {otherParticipant?.name || "this user"}
                      </p>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </ScrollArea>

        {/* Message input */}
        <div className="border-t p-4 flex-shrink-0">
          {/* File attachments preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm"
                >
                  {file.type.startsWith("image/") ? (
                    <Image className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => removeAttachedFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {/* Attach button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={triggerFileInput}
              className="flex-shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileAttach}
              className="hidden"
            />

            <Input
              ref={inputRef}
              value={messageInput.content}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />

            {/* Emoji picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" side="top" align="end">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={300}
                  height={400}
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={handleSendMessage}
              disabled={
                (!messageInput.content.trim() && attachedFiles.length === 0) ||
                isSendingMessage
              }
              size="icon"
              className="flex-shrink-0"
              aria-busy={isSendingMessage}
              aria-label={isSendingMessage ? "Sending message" : "Send message"}
              title={isSendingMessage ? "Sending…" : "Send"}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Offline hint removed to avoid implying background retries */}
        </div>
      </CardContent>
    </Card>
  );
}
