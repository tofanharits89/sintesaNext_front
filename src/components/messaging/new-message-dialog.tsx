"use client";

import { useState, useEffect } from "react";
import { useMessagingRQ } from "@/hooks/useMessagingRQ";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Send, Crown, User as UserIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiPath } from "@/lib/base-path";
import { useConversations as useConversationsRQ } from "@/hooks/useConversationsRQ";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { setHint } from "@/features/messaging/temp-conversation-hints";
import { toast } from "sonner";
import { pushTempMessage } from "@/features/messaging/temp-messages-store";
import type { FrontendMessage } from "@/types/socket-events";

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

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function NewMessageDialog({
  open,
  onOpenChange,
  onConversationCreated,
}: NewMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { sendMessage, selectConversation } = useMessagingRQ();
  const { conversations, optimisticAddConversation } = useConversationsRQ();
  const { user: currentUser } = useUnifiedAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load users when dialog opens
  useEffect(() => {
    if (open) {
      loadUsers();
    } else {
      // Reset state when dialog closes
      setSearchQuery("");
      setSelectedUser(null);
      setMessage("");
      setUsers([]);
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);

      // Admin users (super_admin, co_admin) can see all users
      // Non-admin users (kantor_pusat, kanwil_djpb, kppn, lainnya) can only see admin users as recipients
      const isAdminUser =
        currentUser?.role === "super_admin" || currentUser?.role === "co_admin";
      const endpoint = isAdminUser ? "/users" : "/users/admins";

      // Debug logging removed

      const response = await fetch(apiPath(endpoint), {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Debug logging removed

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to load users: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.success) {
        // Handle different response structures
        const usersList = data.data || [];
        setUsers(usersList);
      } else {
        throw new Error(data.message || data.error || "Failed to load users");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load users";
      toast.error(errorMessage);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!selectedUser || !message.trim()) return;

    try {
      setIsSending(true);

      // 1) If a real conversation with this user already exists, open and use it
      const existingConv = (conversations || []).find((c: any) => {
        const otherId = (c.otherParticipant as any)?.id;
        const p1 = (c as any).participant1_id;
        const p2 = (c as any).participant2_id;
        const currentId = currentUser?.id;
        const targetId = selectedUser.id;
        return (
          (otherId && otherId === targetId) ||
          ((p1 && p2 && currentId) &&
            ((p1 === currentId && p2 === targetId) || (p2 === currentId && p1 === targetId)))
        );
      });

      if (existingConv?.id) {
        // Use existing conversation: select it, notify parent, close dialog, then send
        try {
          await selectConversation(existingConv.id);
        } catch {}
        // Wait briefly to ensure the global activeConversationId store updates
        await new Promise((resolve) => setTimeout(resolve, 60));
        // Push URL param immediately to aid URL->state sync
        try {
          const params = new URLSearchParams(searchParams?.toString?.() || "");
          params.set("conversation", existingConv.id);
          router.push(`${pathname}?${params.toString()}`);
        } catch {}
        // Emit a synchronous selection event for any listeners (e.g., Messages page)
        try {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("conversation:selected", {
                detail: { conversationId: existingConv.id },
              })
            );
          }
        } catch {}
        if (onConversationCreated) {
          try {
            onConversationCreated(existingConv.id);
          } catch {}
        }
        onOpenChange(false);
        await sendMessage(message.trim());
        toast.success("Message sent successfully");
        return; // Done
      }

      // 2) Otherwise, create a temporary conversation id and proceed without adding it to the list
      const tempId = `temp-conv-${Math.random().toString(36).slice(2)}`;

      // Seed a hint so ChatWindow can resolve otherParticipant immediately for temp conversations
      try {
        setHint(tempId, {
          otherParticipant: selectedUser,
          participant1_id: currentUser?.id || 'unknown',
          participant2_id: selectedUser.id,
          participant1: currentUser || undefined,
          participant2: selectedUser,
          lastMessage: {
            content: message.trim(),
            timestamp: new Date().toISOString(),
            sender: currentUser || undefined,
            recipient: selectedUser,
          },
          updated_at: new Date().toISOString(),
        });
      } catch {}

      // Pre-seed an optimistic message directly into the temp store so it shows immediately
      try {
        const nowIso = new Date().toISOString();
        const tempMsgId = `temp-msg-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`;
        const optimistic: FrontendMessage = {
          // Required base Message properties
          id: tempMsgId,
          sender_id: currentUser?.id || "current-user",
          recipient_id: selectedUser.id,
          conversation_id: tempId, // Add conversation_id as required by Message interface
          content: message.trim(),
          type: "text",
          is_read: true,
          is_deleted: false,
          created_at: nowIso,
          updated_at: nowIso,
          
          // Frontend-specific properties
          conversationId: tempId,
          timestamp: nowIso,
          sender: currentUser
            ? { id: currentUser.id, username: currentUser.username || "you", name: currentUser.name || "You" }
            : { id: "current-user", username: "you", name: "You" },
          senderType:
            currentUser?.role && ["super_admin", "co_admin"].includes(currentUser.role)
              ? ("admin" as const)
              : ("user" as const),
          isRead: true,
          isDelivered: false,
        };
        pushTempMessage(tempId, optimistic);
      } catch {}

      // Select the temp conversation so the chat binds immediately
      try {
        await selectConversation(tempId);
      } catch {}
      // Ensure the global activeConversationId updates before sending
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Push URL param immediately for the temp conversation
      try {
        const params = new URLSearchParams(searchParams?.toString?.() || "");
        params.set("conversation", tempId);
        router.push(`${pathname}?${params.toString()}`);
      } catch {}
      // Emit a synchronous selection event for any listeners (e.g., Messages page)
      try {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("conversation:selected", {
              detail: { conversationId: tempId },
            })
          );
        }
      } catch {}

      // Let parent navigate to the temp conversation before actually sending
      if (onConversationCreated) {
        try {
          onConversationCreated(tempId);
        } catch {}
      }

      // Close dialog to reveal chat window
      onOpenChange(false);

      // Send the message now. Provide conversation override to avoid any timing issues
      await sendMessage(message.trim(), selectedUser.id, tempId, true);

      toast.success("Message sent successfully");

      // Note: real id reconciliation is handled on socket ACK and in useConversations listener
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pesan Baru</DialogTitle>
          <DialogDescription>
            Pilih penerima dan buat pesan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Selection */}
          {!selectedUser ? (
            <div className="space-y-3">
              <Label>Pilih penerima</Label>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* User List */}
              <ScrollArea className="h-96 border rounded-md">
                {isLoadingUsers ? (
                  <div className="p-3 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchQuery ? "No users found" : "No users available"}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <Button
                        key={user.id}
                        variant="ghost"
                        className="w-full h-auto p-3 justify-start text-left rounded-none"
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.name?.charAt(0)?.toUpperCase() ||
                                user.username?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium truncate">
                                {user.name || user.username}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                <UserIcon className="h-3 w-3 mr-1" />@
                                {user.username}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {getRoleDisplayName(user.role)}
                            </p>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            /* Selected User & Message */
            <div className="space-y-4">
              {/* Selected User Display */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedUser.name?.charAt(0)?.toUpperCase() ||
                        selectedUser.username?.charAt(0)?.toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">
                        {selectedUser.name || selectedUser.username}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        <UserIcon className="h-3 w-3 mr-1" />@
                        {selectedUser.username}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getRoleDisplayName(selectedUser.role)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <Label>Pesan</Label>
                <Textarea
                  placeholder="Tulis pesan di sini..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Tekan Ctrl+Enter untuk mengirim
                </p>
              </div>

              {/* Send Button */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSending ? "Sedang mengirim..." : "Kirim Pesan"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
