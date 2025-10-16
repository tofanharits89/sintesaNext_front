"use client";

import { useState, useRef, useEffect, useMemo, useLayoutEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAutoMarkAsRead } from "@/hooks/useAutoMarkAsRead";
import { Conversation } from "@/types/socket-events";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useOnlineUsers } from "@/hooks/use-online-users";
import { useMessagingRQ } from "@/hooks/messaging-rq";
import { useSendMessageMutation } from "@/hooks/useMessageMutationsRQ";
import { useMessagesRQ, messageKeys } from "@/hooks/useMessagesRQ";
import { useQueryClient } from "@tanstack/react-query";
import {
  pushTempMessage,
  updateTempMessageById,
} from "@/features/messaging/temp-messages-store";
import { getHint } from "@/features/messaging/temp-conversation-hints";
import { ChatWindowToolbar } from "./chat-window/ChatWindowToolbar";
import { ChatWindowMessages } from "./chat-window/ChatWindowMessages";
import { ChatWindowComposer } from "./chat-window/ChatWindowComposer";

interface ChatWindowProps {
  conversationId: string;
  conversation?: Conversation;
}

export function ChatWindow({ conversationId, conversation }: ChatWindowProps) {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pinUntilRef = useRef<number>(0);

  const { user: currentUser } = useUnifiedAuth();
  const { onlineUsers } = useOnlineUsers();
  const queryClient = useQueryClient();
  const resendMutation = useSendMessageMutation();

  const {
    conversations,
    activeConversationId,
    messageInput,
    isAnyoneTyping,
    typingText,
    isLoading,
    canLoadMore,
    isLoadingMoreMessages,
    isSendingMessage,
    sendMessage: sendMessageRQ,
    selectConversation,
    loadMoreMessages,
    setMessageContent,
    startTyping: startTypingRQ,
    stopTyping: stopTypingRQ,
  } = useMessagingRQ();

  const { messages } =
    useMessagesRQ(conversationId);

  const effectiveConversationId = useMemo(() => {
    if (!conversationId) return activeConversationId || null;
    const isTemp =
      conversationId.startsWith("temp-") ||
      conversationId.startsWith("temp_conv-") ||
      conversationId.startsWith("temp-conv-");
    const activeIsReal =
      !!activeConversationId &&
      !activeConversationId.startsWith("temp-") &&
      !activeConversationId.startsWith("temp_conv-") &&
      !activeConversationId.startsWith("temp-conv-");
    if (isTemp && activeIsReal) {
      return activeConversationId;
    }
    return conversationId;
  }, [conversationId, activeConversationId]);

  const conversationData =
    conversations?.find((c) => c.id === effectiveConversationId) ||
    conversation;

  const loadOlderMessagesPreserveScroll = async () => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
    const prevHeight = viewport?.scrollHeight ?? 0;
    await loadMoreMessages();
    requestAnimationFrame(() => {
      const newHeight = viewport?.scrollHeight ?? 0;
      if (viewport) {
        viewport.scrollTop = newHeight - prevHeight + (viewport.scrollTop || 0);
      }
    });
  };

  const { observeMessage } = useAutoMarkAsRead({
    messages,
    currentUserId: currentUser?.id || "unknown",
    conversationId: effectiveConversationId ?? conversationId,
    markAsRead: async () => {},
    enabled: true,
    debounceMs: 100,
    onMessageVisible: () => {},
  });

  const scrollToBottom = (smooth = false) => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
    if (!viewport) return;
    if (smooth) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    } else {
      viewport.scrollTop = viewport.scrollHeight;
    }
  };
  useEffect(() => {
    if (Date.now() < pinUntilRef.current) {
      scrollToBottom(false);
      return;
    }
    scrollToBottom(false);
  }, [messages.length]);

  useEffect(() => {
    const cid = effectiveConversationId;
    if (!cid) return;
    const isTemp =
      cid.startsWith("temp-") ||
      cid.startsWith("temp_conv-") ||
      cid.startsWith("temp-conv-");
    if (!isTemp) return;
    if (messages.length > 0) return;
    const hint = getHint(cid);
    const last = hint?.lastMessage as any;
    if (!last?.content) return;
    try {
      const nowIso = last.timestamp || new Date().toISOString();
      const tempMsgId = `temp-msg-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
      pushTempMessage(cid, {
        id: tempMsgId,
        conversationId: cid,
        content: last.content,
        timestamp: nowIso,
        sender:
          last.sender ||
          (currentUser
            ? {
                id: currentUser.id,
                username: currentUser.username || "you",
                name: currentUser.name || "You",
              }
            : { id: "current-user", username: "you", name: "You" }),
        senderType:
          last.senderType ||
          (currentUser?.role === "super_admin" ||
          currentUser?.role === "co_admin"
            ? ("admin" as const)
            : ("user" as const)),
        isRead: true,
        isDelivered: false,
      } as any);
    } catch {
      // ignore
    }
  }, [effectiveConversationId, messages.length, currentUser?.id]);
  const formatEnhancedTimestamp = (timestamp: string) => {
    if (!timestamp) return "—";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return `Just now (${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })})`;
    }

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago (${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })})`;
    }

    if (diffHours < 24) {
      return `${diffHours}h ago (${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })})`;
    }

    if (diffDays < 7) {
      const timeStr = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const dateStr = date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
      return `${diffDays}d ago (${dateStr}, ${timeStr})`;
    }

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  useLayoutEffect(() => {
    if (effectiveConversationId) {
      selectConversation(effectiveConversationId);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }

    setTimeout(() => scrollToBottom(false), 100);
  }, [effectiveConversationId, selectConversation]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        conversationId?: string;
      };
      if (!detail || detail.conversationId !== effectiveConversationId) return;
      scrollToBottom(false);
    };

    window.addEventListener("messages:appended", handler as EventListener);
    return () =>
      window.removeEventListener("messages:appended", handler as EventListener);
  }, [effectiveConversationId]);
  const otherParticipant = useMemo(() => {
    if (conversation?.otherParticipant) return conversation.otherParticipant;

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
      (c) => c.id === (effectiveConversationId || conversation?.id),
    );
    if (fromList?.otherParticipant) return fromList.otherParticipant;

    const p1 = (fromList || conversation)?.participant1 as any;
    const p2 = (fromList || conversation)?.participant2 as any;
    const currentId = currentUser?.id;
    if (p1 && p2) {
      if (currentId) {
        if (p1.id !== currentId) return p1;
        if (p2.id !== currentId) return p2;
      } else {
        return p2 || p1;
      }
    } else if (p1 || p2) {
      return p1 || p2;
    }

    const p1Id = (fromList || (conversation as any))?.participant1_id as
      | string
      | undefined;
    const p2Id = (fromList || (conversation as any))?.participant2_id as
      | string
      | undefined;
    if (p1Id || p2Id) {
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

    const lastMessage = (fromList || conversation)?.lastMessage as any;
    if (lastMessage) {
      if (lastMessage.sender?.id && lastMessage.sender.id !== currentId) {
        return lastMessage.sender;
      }
      if (lastMessage.recipient?.id && lastMessage.recipient.id !== currentId) {
        return lastMessage.recipient;
      }
    }

    return undefined;
  }, [
    conversation?.id,
    conversation?.otherParticipant,
    conversations,
    effectiveConversationId,
    currentUser?.id,
  ]);

  const isOtherParticipantOnline = useMemo(() => {
    if (!otherParticipant?.id) return false;
    return onlineUsers.some(
      (onlineUser) => onlineUser.user.id === otherParticipant.id,
    );
  }, [otherParticipant?.id, onlineUsers]);
  const handleRetryMessage = async (msg: any) => {
    try {
      const convId = String(
        msg.conversationId || effectiveConversationId || "",
      );
      const isTempConv =
        convId.startsWith("temp-") ||
        convId.startsWith("temp_conv-") ||
        convId.startsWith("temp-conv-");

      const recipientId = isTempConv ? otherParticipant?.id : undefined;

      if (isTempConv) {
        updateTempMessageById(convId, String(msg.id), {
          _sending: true as any,
          _failed: false as any,
        });
      } else if (convId) {
        queryClient.setQueryData(messageKeys.messages(convId), (prev: any) => {
          if (!prev?.pages) return prev;
          const copy = {
            ...prev,
            pages: prev.pages.map((p: any) => ({ ...p })),
          };
          for (let pi = 0; pi < copy.pages.length; pi++) {
            const page = copy.pages[pi];
            const updated =
              Array.isArray(page?.data?.messages) &&
              page.data.messages.map((m: any) =>
                m?.id === msg.id ? { ...m, _sending: true, _failed: false } : m,
              );
            copy.pages[pi] = {
              ...page,
              data: {
                ...(page?.data || {}),
                messages: updated ?? page?.data?.messages,
              },
            };
          }
          return copy;
        });
      }

      await resendMutation.mutateAsync({
        content: String(msg.content || ""),
        ...(isTempConv ? {} : { conversationId: convId }),
        recipientId,
        tempId: String(msg.id),
        isRetry: true as any,
      });
    } catch {
      // ignore
    }
  };
  const handleSendMessage = async () => {
    if (!messageInput.content.trim() && attachedFiles.length === 0) return;

    const content = messageInput.content.trim();
    const files = [...attachedFiles];

    setAttachedFiles([]);
    stopTypingRQ();
    pinUntilRef.current = Date.now() + 1500;

    const isTempConv =
      effectiveConversationId?.startsWith("temp-") ||
      effectiveConversationId?.startsWith("temp_conv-") ||
      effectiveConversationId?.startsWith("temp-conv-");
    const recipientId = isTempConv ? otherParticipant?.id : undefined;

    if (content) {
      try {
        await sendMessageRQ(
          content,
          recipientId,
          effectiveConversationId || undefined,
        );
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }

    if (files.length > 0) {
      const fileNames = files.map((f) => f.name).join(", ");
      try {
        await sendMessageRQ(
          `📎 Attached files: ${fileNames} (File upload feature coming soon)`,
        );
      } catch (error) {
        console.error("Failed to send attachment placeholder:", error);
      }
    }
  };
  return (
    <Card className="h-[600px] max-h-[70vh] flex flex-col overflow-hidden">
      <ChatWindowToolbar
        participant={otherParticipant}
        isOnline={isOtherParticipantOnline}
      />
      <CardContent className="flex-1 p-0 flex flex-col min-h-0 overflow-hidden">
        <ChatWindowMessages
          conversationId={effectiveConversationId || conversationId}
          scrollAreaRef={scrollAreaRef}
          messages={messages}
          currentUser={currentUser}
          isLoading={isLoading}
          canLoadMore={!!canLoadMore}
          isLoadingMore={isLoadingMoreMessages}
          onLoadMore={loadOlderMessagesPreserveScroll}
          observeMessage={observeMessage}
          isAnyoneTyping={isAnyoneTyping}
          typingText={typingText}
          {...(conversationData ? { conversationData } : {})}
          otherParticipant={otherParticipant}
          onRetryMessage={handleRetryMessage}
          formatTimestamp={formatEnhancedTimestamp}
        />
        <ChatWindowComposer
          inputRef={inputRef}
          messageContent={messageInput.content}
          isSending={isSendingMessage}
          attachedFiles={attachedFiles}
          onAttachmentsChange={setAttachedFiles}
          onMessageChange={setMessageContent}
          onSend={handleSendMessage}
          onTypingStart={startTypingRQ}
          onTypingStop={stopTypingRQ}
          isTyping={messageInput.isTyping}
        />
      </CardContent>
    </Card>
  );
}
