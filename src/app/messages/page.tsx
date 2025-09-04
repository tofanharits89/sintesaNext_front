"use client";

import { useEffect, useRef, useState } from "react";
// Import the new React Query + Zustand messaging system
import { useMessagingRQ } from "@/hooks/messaging-rq";
import { ChatWindow } from "@/components/messaging/chat-window";
import { ConversationList } from "@/components/messaging/conversation-list";
import { NewMessageDialog } from "@/components/messaging/new-message-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquarePlus, Users, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

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
  } = useMessagingRQ();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleConversationSelect = async (conversationId: string) => {
    selectConversation(conversationId);

    // Update URL
    const current = searchParams.get("conversation");
    if (current !== conversationId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("conversation", conversationId);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleNewMessage = () => {
    setShowNewMessageDialog(true);
  };

  // Handle URL-based conversation selection (avoid unstable searchParams object in deps)
  const urlConversationId = searchParams.get("conversation");

  // Ref to mark when URL was last updated by state, so URL->state effect can skip one cycle
  const lastUrlUpdateByStateRef = useRef<string | null>(null);

  // URL -> state: select conversation from URL unless this URL was just set by our own state sync
  useEffect(() => {
    if (!urlConversationId) return;
    if (lastUrlUpdateByStateRef.current === urlConversationId) {
      // Skip once and clear the marker
      lastUrlUpdateByStateRef.current = null;
      return;
    }
    // If URL points to a temp conversation but state already holds a real id, don't revert to temp
    const isTemp =
      urlConversationId.startsWith("temp-") ||
      urlConversationId.startsWith("temp_conv-") ||
      urlConversationId.startsWith("temp-conv-");
    const stateIsReal = !!activeConversationId &&
      !activeConversationId.startsWith("temp-") &&
      !activeConversationId.startsWith("temp_conv-") &&
      !activeConversationId.startsWith("temp-conv-");
    if (isTemp && stateIsReal) return;
    if (urlConversationId !== activeConversationId) {
      selectConversation(urlConversationId);
    }
  }, [urlConversationId, activeConversationId, selectConversation]);

  // Keep URL in sync when activeConversationId changes programmatically
  useEffect(() => {
    if (!activeConversationId) return;
    if (urlConversationId !== activeConversationId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("conversation", activeConversationId);
      // Mark that this URL change is initiated by state
      lastUrlUpdateByStateRef.current = activeConversationId;
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [activeConversationId, urlConversationId, router, pathname]);

  // Note: We intentionally do not listen for 'conversation:created' here to avoid double-selection loops.

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
                getUnreadCount={(id) => {
                  const conv = conversations?.find((c) => c.id === id);
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
