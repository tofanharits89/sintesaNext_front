"use client";

import { useState, useEffect } from "react";
import { useMessaging } from "@/hooks/useMessaging";
import { useCurrentUser } from "@/lib/use-current-user";
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
import { useConversations } from "@/hooks/useConversations";
import { toast } from "sonner";

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

  const { sendMessage, selectConversation } = useMessaging();
  const { optimisticAddConversation, reconcileConversationId } =
    useConversations();
  const { currentUser } = useCurrentUser();

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

      console.log("Loading users from endpoint:", endpoint);

      const response = await fetch(apiPath(endpoint), {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(
          `Failed to load users: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        // Handle different response structures
        const usersList = data.data || [];
        console.log("Users loaded:", usersList.length);
        setUsers(usersList);
      } else {
        throw new Error(data.message || data.error || "Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
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

      // Generate a tempId, optimistically insert a conversation, then send
      const tempId = `temp-conv-${Math.random().toString(36).slice(2)}`;

      optimisticAddConversation({
        tempId,
        otherParticipant: selectedUser,
        content: message.trim(),
        sender: currentUser,
        senderType:
          currentUser?.role &&
          ["super_admin", "co_admin"].includes(currentUser.role)
            ? "admin"
            : "user",
        timestamp: new Date().toISOString(),
      });

      // Provide an immediate hint for the temp conversation so UI can resolve otherParticipant
      try {
        const { setHint } = await import(
          "@/features/messaging/temp-conversation-hints"
        );
        setHint(tempId, {
          otherParticipant: selectedUser,
          participant1_id: currentUser?.id,
          participant2_id: selectedUser.id,
          participant1: currentUser as any,
          participant2: selectedUser as any,
          updated_at: new Date().toISOString(),
        });
      } catch {}

      // Give SWR a tick to publish the optimistic conversation before selecting it
      await new Promise((r) => setTimeout(r, 80));

      // Select the temp conversation so the chat window binds to it immediately
      try {
        await selectConversation(tempId);
      } catch {}

      // Also emit a global selection event so any listeners can switch views
      try {
        window.dispatchEvent(
          new CustomEvent("conversation:selected", {
            detail: { conversationId: tempId },
          })
        );
      } catch {}

      // Let parent navigate to the temp conversation before actually sending
      if (onConversationCreated) {
        try {
          onConversationCreated(tempId);
        } catch {}
      }
      // Close dialog to reveal chat window
      onOpenChange(false);

      // After the chat window mounts, emit an optimistic message insert so it appears immediately
      setTimeout(() => {
        try {
          const tempMsg = {
            id: tempId, // temp message id can be same as conv temp for simplicity
            conversationId: tempId,
            content: message.trim(),
            timestamp: new Date().toISOString(),
            sender: currentUser,
            senderType:
              currentUser?.role &&
              ["super_admin", "co_admin"].includes(currentUser.role)
                ? "admin"
                : "user",
            isRead: false,
            isDelivered: false,
            isOpened: false,
          } as any;
          window.dispatchEvent(
            new CustomEvent("messages:optimistic-insert", {
              detail: { conversationId: tempId, message: tempMsg },
            })
          );
        } catch {}
      }, 100);

      // Send the message now (recipientId prioritized in sendMessage)
      await sendMessage(message.trim(), selectedUser.id, tempId);

      toast.success("Message sent successfully");

      // Note: real id reconciliation is handled on socket ACK and in useConversations listener
    } catch (error) {
      console.error("Error sending message:", error);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Select a recipient and compose your message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Selection */}
          {!selectedUser ? (
            <div className="space-y-3">
              <Label>Select recipient</Label>

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
              <ScrollArea className="h-48 border rounded-md">
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
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Press Ctrl+Enter to send
                </p>
              </div>

              {/* Send Button */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
