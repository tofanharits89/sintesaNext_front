"use client";

import { useEffect, useRef, useState, useCallback } from "react";
// Import the new React Query + Zustand messaging system
import { useMessagingRQ } from "@/hooks/messaging-rq";
import { ChatWindow, ConversationList } from "@/components/lazy";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NewMessageDialog } from "@/components/messaging/new-message-dialog";
import { useUnreadBadgesStore } from "@/stores/unread-badges-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquarePlus, Users, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useConversationUrlSync } from "@/hooks/messaging-rq/useConversationUrlSync";
import { socketClient } from "@/lib/api/socket-client";

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

  const { handleConversationSelect } = useConversationUrlSync({
    activeConversationId,
    selectConversation,
  });

  const handleNewMessage = () => {
    setShowNewMessageDialog(true);
  };

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
          // Handling window conversation event
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
    <div className="space-y-6 md:space-y-8 -mb-6 md:-mb-8 lg:-mb-10 pb-4 md:pb-6 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Kelola Pesan</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <Card className="h-[600px] max-h-[70vh] flex flex-col">
            <CardHeader className="pb-3 flex-shrink-0">
              <CardTitle className="text-lg">Percakapan</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <Suspense
                fallback={
                  <div className="p-4 space-y-2 overflow-y-auto h-full">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-3/5" />
                          <Skeleton className="h-3 w-4/5 mt-1" />
                        </div>
                        <Skeleton className="h-3 w-8" />
                      </div>
                    ))}
                  </div>
                }
              >
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
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {activeConversationId ? (
            <Suspense
              fallback={
                <Card className="h-[600px] max-h-[70vh] flex flex-col">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-64 mt-2" />
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <div className="h-full px-2 space-y-3 overflow-y-auto">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[70%]">
                            <Skeleton className="h-16 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <ChatWindow conversationId={activeConversationId} />
            </Suspense>
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
