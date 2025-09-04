"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useMessaging } from "@/hooks/useMessaging";
import { useAutoMarkAsRead } from "@/hooks/useAutoMarkAsRead";
import { Conversation } from "@/shared/socket-events";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/use-current-user";
import { MessageStatus } from "./MessageStatus";
import { useOnlineUsers } from "@/hooks/use-online-users";
import { useMessages as useMessagesData } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import dynamic from "next/dynamic";
import {
  useMarkAsReadMutation,
  useMarkAsOpenedMutation,
} from "@/hooks/useMessageMutations";
import { getHint } from "@/features/messaging/temp-conversation-hints";

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
});

interface ChatWindowProps {
  conversation: Conversation;
}

export function ChatWindow({ conversation }: ChatWindowProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [openedMessages, setOpenedMessages] = useState<Set<string>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentUser } = useCurrentUser();
  // Pull messaging state early so currentConversation is available
  const {
    isLoading,
    isConnected,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    formatMessageTime,
    selectConversation,
    currentConversation,
  } = useMessaging();

  // Locally adopted real conversation id once reconciliation occurs
  const [adoptedRealId, setAdoptedRealId] = useState<string | undefined>(
    undefined
  );

  // Reset adoptedRealId on prop conversation changes to avoid leaking across sessions
  useEffect(() => {
    const propId = conversation?.id;
    if (!propId) {
      setAdoptedRealId(undefined);
      return;
    }
    // If prop id is already real, no need to keep any adopted id
    if (!isTempId(propId)) {
      if (adoptedRealId) setAdoptedRealId(undefined);
      return;
    }
    // If we opened a different temp conversation than before, clear any previous adopted id
    // This ensures a fresh reconciliation for the new temp conversation
    if (adoptedRealId && adoptedRealId !== propId) {
      setAdoptedRealId(undefined);
    }
  }, [conversation?.id]);

  // Helper to determine temp ids
  const isTempId = (id?: string) =>
    !!id &&
    (id.startsWith("temp-") ||
      id.startsWith("temp_conv-") ||
      id.startsWith("temp-conv-"));

  // Prefer reconciled real conversation over temp prop when available
  const effectiveConversationId = useMemo(() => {
    const propId = conversation?.id;
    const curId = currentConversation?.id;
    // Prefer locally adopted real id first
    if (adoptedRealId && !isTempId(adoptedRealId)) return adoptedRealId;
    // Then prefer reconciled currentConversation over temp prop
    if (isTempId(propId) && curId && !isTempId(curId)) return curId;
    return propId;
  }, [conversation?.id, currentConversation?.id, adoptedRealId]);

  // Use messages for the effective conversation id (handles temp->real seamlessly)
  const {
    messages,
    isLoading: isMessagesLoading,
    optimisticInsert,
  } = useMessagesData(effectiveConversationId);

  // After sending, keep the viewport pinned to bottom for a short period
  const pinUntilRef = useRef<number>(0);

  // SWR Mutations for read/opened with optimistic updates
  const { trigger: markRead } = useMarkAsReadMutation(effectiveConversationId);
  const { trigger: markOpened } = useMarkAsOpenedMutation(
    effectiveConversationId
  );

  // Get online users to check if other participant is online
  const { onlineUsers } = useOnlineUsers();
  // Pull SWR conversations to hydrate missing fields on stub conversations
  const { conversations: swrConversations } = useConversations();

  // Custom message visibility handler
  const handleMessageVisible = (messageId: string) => {
    // Keep passive; useAutoMarkAsRead will handle status
  };

  // Controlled auto-mark-as-read functionality
  const { observeMessage, clearMarkedMessages } = useAutoMarkAsRead({
    messages,
    currentUserId: currentUser?.id,
    conversationId: effectiveConversationId,
    markAsRead: (ids) => markRead({ messageIds: ids }),
    markAsOpened: (ids) => markOpened({ messageIds: ids }),
    enabled: true,
    debounceMs: 100, // Very fast for real-time feedback while chatting
    onMessageVisible: handleMessageVisible, // Pass the visibility handler
  });

  // Load/select conversation, but avoid re-selecting a temp id once a real id is active
  useEffect(() => {
    if (!conversation?.id) return;
    const convId = conversation.id as string;
    const curId = currentConversation?.id as string | undefined;
    const looksTemp =
      !!convId &&
      (convId.startsWith("temp-") ||
        convId.startsWith("temp_conv-") ||
        convId.startsWith("temp-conv-"));
    const curLooksReal =
      !!curId &&
      !(
        curId.startsWith("temp-") ||
        curId.startsWith("temp_conv-") ||
        curId.startsWith("temp-conv-")
      );

    // If we have adopted a real id, prefer selecting it and do not reselect temp
    if (adoptedRealId && !isTempId(adoptedRealId)) {
      if (curId !== adoptedRealId) {
        console.log("[ChatWindow] selectConversation(adoptedRealId)", {
          id: adoptedRealId,
        });
        selectConversation(adoptedRealId);
      }
      return;
    }

    // If current is already a real conversation and the prop is still temp, do not revert
    if (looksTemp && curLooksReal && curId !== convId) {
      console.log(
        "[ChatWindow] skip reselecting temp after real reconciliation",
        { tempId: convId, currentRealId: curId }
      );
      return;
    }
    // No-op if already selected
    if (curId === convId) return;

    console.log("[ChatWindow] selectConversation", { id: convId });
    selectConversation(convId);
  }, [
    conversation?.id,
    currentConversation?.id,
    selectConversation,
    adoptedRealId,
  ]);

  // Bridge: adopt reconciled id only on 'conversation:created' to avoid recursion
  useEffect(() => {
    const onCreated = (e: Event) => {
      const { tempId, conversationId: realId } =
        (e as CustomEvent).detail || {};
      if (!tempId || !realId) return;
      const propId = conversation?.id as string | undefined;
      if (propId && propId === tempId && !isTempId(realId)) {
        if (currentConversation?.id === realId) return;
        // Remember the adopted real id locally so our derived state stops using the temp id
        setAdoptedRealId(realId);
        console.log("[ChatWindow] adopt created->real", { tempId, realId });
        selectConversation(realId);
      }
    };
    window.addEventListener("conversation:created", onCreated as EventListener);
    return () => {
      window.removeEventListener(
        "conversation:created",
        onCreated as EventListener
      );
    };
  }, [conversation?.id, currentConversation?.id, selectConversation]);

  // Mark already-read messages as opened when messages load
  useEffect(() => {
    if (messages.length > 0 && currentUser?.id) {
      const alreadyReadMessages = messages
        .filter((msg) => msg.sender.id !== currentUser.id && msg.isRead)
        .map((msg) => msg.id);

      if (alreadyReadMessages.length > 0) {
        setOpenedMessages((prev) => {
          const newSet = new Set(prev);
          alreadyReadMessages.forEach((id) => newSet.add(id));
          return newSet;
        });
      }
    }
  }, [messages, currentUser?.id]);

  // Handle real-time message read status updates
  useEffect(() => {
    const handleMessagesMarkedAsRead = (event: CustomEvent) => {
      const { messageIds, conversationId: eventConversationId } = event.detail;

      // Only update if it's for the current conversation
      if (eventConversationId === effectiveConversationId) {
        setOpenedMessages((prev) => {
          const newSet = new Set(prev);
          messageIds.forEach((id: string) => newSet.add(id));
          return newSet;
        });
      }
    };

    // Listen for messages marked as opened events
    const handleMessagesMarkedAsOpened = (event: CustomEvent) => {
      const { messageIds, conversationId: eventConversationId } = event.detail;
      if (eventConversationId === effectiveConversationId) {
        setOpenedMessages((prev) => {
          const newSet = new Set(prev);
          messageIds.forEach((id: string) => newSet.add(id));
          return newSet;
        });
      }
    };

    window.addEventListener(
      "messages:marked-as-read",
      handleMessagesMarkedAsRead as EventListener
    );
    window.addEventListener(
      "messages:marked-as-opened",
      handleMessagesMarkedAsOpened as EventListener
    );

    return () => {
      window.removeEventListener(
        "messages:marked-as-read",
        handleMessagesMarkedAsRead as EventListener
      );
      window.removeEventListener(
        "messages:marked-as-opened",
        handleMessagesMarkedAsOpened as EventListener
      );
    };
  }, [effectiveConversationId]);

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
      console.log("[Messaging][UI] pinToBottom:grace");
      scrollToBottom(false);
      return;
    }
    scrollToBottom(false);
  }, [messages.length]);

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

  // Focus input and scroll to bottom when conversation changes
  useEffect(() => {
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
    if (!messageInput.trim() && attachedFiles.length === 0) return;

    const content = messageInput.trim();
    const files = [...attachedFiles];

    // Start send flow

    // Clear input and attachments
    setMessageInput("");
    setAttachedFiles([]);

    // Stop typing indicator
    if (isTyping) {
      stopTyping();
      setIsTyping(false);
    }

    // For now, just send the text message
    // TODO: Implement file upload functionality in the backend
    if (content) {
      // Optimistic insert pending message
      const tempId = `temp-${Math.random().toString(36).slice(2)}`;
      // optimistic insert
      console.log("[ChatWindow:send] optimisticInsert", {
        convId: effectiveConversationId || conversation.id,
        tempId,
        content,
      });
      optimisticInsert({
        id: tempId,
        conversationId: effectiveConversationId || conversation.id,
        content,
        timestamp: new Date().toISOString(),
        sender: currentUser as any,
        senderType:
          currentUser?.role &&
          ["super_admin", "co_admin"].includes(currentUser.role)
            ? "admin"
            : "user",
        isRead: false,
        isDelivered: false,
        isOpened: false,
      } as any);
      // Fire actual send (socket or REST), passing tempId for reconciliation
      // send invoke
      // Enable a short grace period to keep the view pinned during reconciliation
      pinUntilRef.current = Date.now() + 2000;
      const recipientFromConversation =
        (otherParticipant as any)?.id ||
        (conversation as any)?.otherParticipant?.id;
      console.log("[ChatWindow:send] calling sendMessage", {
        convId: conversation.id,
        recipientFromConversation,
        tempId,
      });
      await sendMessage(content, recipientFromConversation, tempId);
      // send done
    }

    // If there are files, show a placeholder message for now
    if (files.length > 0) {
      const fileNames = files.map((f) => f.name).join(", ");
      await sendMessage(
        `📎 Attached files: ${fileNames} (File upload feature coming soon)`
      );
    }
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      startTyping();
      setIsTyping(true);
    } else if (!value.trim() && isTyping) {
      stopTyping();
      setIsTyping(false);
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
    setMessageInput((prev) => prev + emoji);
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

  // Prefer provided otherParticipant; fallback to SWR list match; else derive from participants/lastMessage
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

    const fromList = swrConversations.find(
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
    swrConversations,
    currentUser?.id,
  ]);

  // Debug: log how otherParticipant is resolved
  useEffect(() => {
    const fromList = (swrConversations as any[])?.find(
      (c) => c.id === (effectiveConversationId || conversation.id)
    );
    console.log("[ChatWindow:otherParticipant]", {
      convId: effectiveConversationId || conversation?.id,
      currentUserId: currentUser?.id,
      fromProp: (conversation as any)?.otherParticipant,
      fromList: fromList?.otherParticipant,
      p1: (fromList || (conversation as any))?.participant1,
      p2: (fromList || (conversation as any))?.participant2,
      p1_id: (fromList || (conversation as any))?.participant1_id,
      p2_id: (fromList || (conversation as any))?.participant2_id,
      lastMessage: (fromList || (conversation as any))?.lastMessage,
      resolved: otherParticipant,
    });
  }, [
    effectiveConversationId,
    conversation?.id,
    swrConversations,
    currentUser?.id,
    otherParticipant,
  ]);

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

          <div>
            <h3 className="font-medium text-sm">
              {otherParticipant?.name ||
                otherParticipant?.username ||
                "Unknown User"}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
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
                  className="text-green-600 bg-green-50 border-green-200 text-xs"
                >
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="text-orange-600 bg-orange-50 border-orange-200 text-xs"
                >
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
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

                        {/* Message status indicators */}
                        <div className="mt-1">
                          {isOwnMessage ? (
                            // For sent messages: show WhatsApp-style status indicators using real-time fields
                            <MessageStatus
                              isDelivered={message.isDelivered}
                              // Sender side should reflect remote recipient's open state from socket/SWR only
                              isOpened={message.isOpened}
                              isRead={message.isRead}
                              deliveredAt={message.deliveredAt}
                              openedAt={message.openedAt}
                              readAt={message.readAt}
                              showTimestamp={false}
                              className="justify-end"
                            />
                          ) : (
                            // For received messages: show opened/unopened status with timestamp
                            <span
                              className={cn(
                                "text-xs transition-colors duration-200",
                                openedMessages.has(message.id) ||
                                  message.isOpened
                                  ? "text-green-600"
                                  : "text-orange-600"
                              )}
                            >
                              {openedMessages.has(message.id) ||
                              message.isOpened
                                ? `Opened`
                                : "Unopened"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                  <div className="flex gap-3 max-w-[80%]">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-sm">
                        {otherParticipant?.name?.charAt(0)?.toUpperCase() ||
                          "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : isMessagesLoading ? (
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
              value={messageInput}
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
              disabled={!messageInput.trim() && attachedFiles.length === 0}
              size="icon"
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {!isConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              You're offline. Messages will be sent when connection is restored.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
