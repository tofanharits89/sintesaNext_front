"use client";

import { useEffect, useRef, useState, useCallback } from "react";
// Import the new React Query + Zustand messaging system
import { useMessagingRQ } from "@/hooks/messaging-rq";
import { ChatWindow } from "@/components/messaging/chat-window";
import { ConversationList } from "@/components/messaging/conversation-list";
import { NewMessageDialog } from "@/components/messaging/new-message-dialog";
import { useUnreadBadgesStore } from "@/stores/unread-badges-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquarePlus, Users, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { socketClient } from "@/lib/SocketClient";

export default function MessagesPage() {
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);

  // Use the new comprehensive messaging hook
  const {
    // Data
    conversations,
    activeConversationId,

    // Loading states
    isLoading,

    // Connection state
    isSocketConnected,

    // Actions
    selectConversation,

    // UI state
    totalUnreadCount,
    // Conversations pagination
    conversationsHasNextPage,
    fetchNextConversations,
    isFetchingNextConversations,
    // Utilities
    refetchConversations,
  } = useMessagingRQ({ enabled: true });

  // Get unread count function from store
  const unreadCounts = useUnreadBadgesStore((state) => state.unreadCounts);
  const getUnreadCount = useCallback(
    (conversationId: string) => unreadCounts[conversationId]?.count || 0,
    [unreadCounts]
  );

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleConversationSelect = async (conversationId: string) => {
    try {
      console.log("[MessagingDebug] MessagesPage.handleConversationSelect", {
        conversationId,
        activeBefore: activeConversationId,
      });
    } catch {}

    // Simple approach like navbar popover - just navigate with URL params
    // This avoids complex race conditions and state synchronization issues
    const params = new URLSearchParams(window.location.search);
    params.set("conversation", conversationId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleNewMessage = () => {
    setShowNewMessageDialog(true);
  };

  // Handle URL-based conversation selection
  const [urlConversationId, setUrlConversationId] = useState<string | null>(
    null
  );

  // Update URL conversation ID when searchParams change
  useEffect(() => {
    setUrlConversationId(searchParams?.get("conversation") || null);
  }, [searchParams]);

  // Sync URL -> state: when URL changes, update active conversation
  useEffect(() => {
    if (urlConversationId && urlConversationId !== activeConversationId) {
      selectConversation(urlConversationId);
    } else if (!urlConversationId && activeConversationId) {
      selectConversation("");
    }
  }, [urlConversationId, activeConversationId, selectConversation]);

  // Handle temporary conversations - sync URL when temp conversation is created
  useEffect(() => {
    if (!activeConversationId) return;
    const isTemp =
      activeConversationId.startsWith("temp-") ||
      activeConversationId.startsWith("temp_conv-") ||
      activeConversationId.startsWith("temp-conv-");
    if (!isTemp) return;
    if (urlConversationId === activeConversationId) return;
    
    const params = new URLSearchParams(window.location.search);
    params.set("conversation", activeConversationId);
    router.replace(`${pathname}?${params.toString()}`);
  }, [activeConversationId, urlConversationId, router, pathname]);

  // Note: We intentionally do not listen for 'conversation:created' here to avoid double-selection loops.

  // Conditional refresh: only while on messages page
  useEffect(() => {
    if (!refetchConversations) return;
    let interval: ReturnType<typeof setInterval> | undefined;

    // Refresh once when socket connects
    if (isSocketConnected) {
      refetchConversations();
    } else {
      // Poll lightly while disconnected
      interval = setInterval(() => refetchConversations(), 90000);
    }

    // Refresh when tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refetchConversations();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isSocketConnected, refetchConversations]);

  // Socket-driven refresh for conversations unread badges (only while on this page)
  useEffect(() => {
    const sock = socketClient.getSocket?.() || null;
    if (!sock) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refetchConversations?.();
      }, 150);
    };

    const onConnect = () => debouncedRefresh();
    const onNewMessage = () => debouncedRefresh();
    const onReadOrOpened = () => debouncedRefresh();

    sock.on?.("connect", onConnect);
    sock.on?.("message:new", onNewMessage);
    sock.on?.("messaging:new_message", onNewMessage);
    sock.on?.("messages:read", onReadOrOpened);
    sock.on?.("messaging:messages_read", onReadOrOpened);
    sock.on?.("message:opened", onReadOrOpened);
    sock.on?.("messaging:opened", onReadOrOpened);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      sock.off?.("connect", onConnect);
      sock.off?.("message:new", onNewMessage);
      sock.off?.("messaging:new_message", onNewMessage);
      sock.off?.("messages:read", onReadOrOpened);
      sock.off?.("messaging:messages_read", onReadOrOpened);
      sock.off?.("message:opened", onReadOrOpened);
      sock.off?.("messaging:opened", onReadOrOpened);
    };
  }, [refetchConversations]);

  // Listen for global conversation creation events (e.g., temp -> real reconciliation)
  // and ensure we switch the UI to the new conversation and sync the URL.
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const { conversationId } = (e as CustomEvent).detail || {};
        if (!conversationId) return;
        try {
          console.log("[MessagingDebug] MessagesPage.windowEvent", {
            type: (e as any)?.type,
            conversationId,
            activeBefore: activeConversationId,
          });
        } catch {}
        // Delegate to the same selection handler so URL and state stay in sync
        handleConversationSelect(conversationId);
      } catch {}
    };
    if (typeof window !== "undefined") {
      window.addEventListener("conversation:created", handler as EventListener);
      // Also react to explicit selection events emitted by the dialog
      window.addEventListener(
        "conversation:selected",
        handler as EventListener
      );
    }
    return () => {
      try {
        if (typeof window !== "undefined") {
          window.removeEventListener(
            "conversation:created",
            handler as EventListener
          );
          window.removeEventListener(
            "conversation:selected",
            handler as EventListener
          );
        }
      } catch {}
    };
    // Intentionally exclude handleConversationSelect deps churn; it uses latest router/searchParams
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Kelola Pesan</h1>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {totalUnreadCount > 0 && (
              <Badge variant="destructive" className="mr-2">
                {totalUnreadCount} unread
              </Badge>
            )}
            {isSocketConnected ? (
              <Badge
                variant="secondary"
                className="text-green-600 bg-green-50 border-green-200"
              >
                <Wifi className="h-3 w-3 mr-1" />
                Tersambung
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
          Pesan Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-200px)]">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <Card className="h-[600px] max-h-[70vh] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg">Percakapan</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ConversationList
                conversations={conversations || []}
                selectedConversationId={activeConversationId}
                onConversationSelect={handleConversationSelect}
                isLoading={isLoading}
                getUnreadCount={getUnreadCount}
                hasMore={!!conversationsHasNextPage}
                onLoadMore={() =>
                  fetchNextConversations && fetchNextConversations()
                }
                isLoadingMore={!!isFetchingNextConversations}
              />
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {activeConversationId ? (
            <ChatWindow conversationId={activeConversationId} />
          ) : (
            <Card className="h-[600px] max-h-[70vh] flex items-center justify-center">
              <CardContent className="text-center">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <Users className="h-12 w-12" />
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Tidak ada pesan terpilih
                    </h3>
                    <p className="text-sm">
                      Silahkan pilih pesan dari daftar percakapan atau buat
                      pesan baru.
                    </p>
                  </div>
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
