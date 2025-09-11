"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { backendPath } from "@/lib/backend";
import { getCookie } from "@/lib/httpClient";
import { conversationKeys } from "./useConversationsRQ";
import { messageKeys } from "./useMessagesRQ";
import { useSocket } from "./useSocket";
import { FrontendMessage } from "@/shared/socket-events";
import { useMessagingActions, useMessagingUIStore } from "@/stores";
import { useNotificationStore } from "@/stores/notification-store";
import { getTempMessages } from "@/features/messaging/temp-messages-store";
import { useCurrentUser } from "@/lib/use-current-user";

// Types for mutation arguments
interface SendMessageArgs {
  recipientId?: string;
  conversationId?: string;
  content: string;
  tempId?: string;
}

interface ReadArgs {
  messageIds: string[];
}

interface SendMessageResponse {
  success: boolean;
  data?: {
    message: any;
    conversationId: string;
  };
  error?: string;
}

// Send message mutation
export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  const { emit } = useSocket();
  const { ui, unread } = useMessagingActions();
  const { currentUser } = useCurrentUser();

  return useMutation({
    mutationFn: async (args: SendMessageArgs): Promise<SendMessageResponse> => {
      const { recipientId, conversationId, content, tempId } = args;

      // First try WebSocket for real-time delivery
      try {
        const socketPayload = {
          // camelCase
          recipientId,
          conversationId,
          content: content.trim(),
          type: "text",
          tempId,
          senderId: currentUser?.id,
          participant1Id: conversationId ? undefined : currentUser?.id,
          participant2Id: conversationId ? undefined : recipientId,
          // snake_case duplicates for compatibility
          recipient_id: recipientId,
          conversation_id: conversationId,
          message: content.trim(),
          message_type: "text",
          temp_id: tempId,
          sender_id: currentUser?.id,
          participant1_id: conversationId ? undefined : currentUser?.id,
          participant2_id: conversationId ? undefined : recipientId,
        } as any;

        // Emitting message:send (debug logging removed)

        const socketResponse: any = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Socket timeout"));
          }, 5000);

          emit("message:send", socketPayload, (response: any) => {
            clearTimeout(timeout);
            resolve(response);
          });
        });

        if (socketResponse?.success) {
          return socketResponse;
        }

        const errMsg = socketResponse?.error || "Socket send failed";
        throw new Error(errMsg);
      } catch (socketError) {
        // Socket failed, trying REST (silently fallback)

        // Fallback to REST API via centralized Axios client
        const csrfToken = getCookie("XSRF-TOKEN");
        const respRaw = await fetch(backendPath("/messaging/send"), {
          method: "POST",
          credentials: "include",
          headers: { 
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
          },
          body: JSON.stringify({
            // camelCase
            recipientId,
            conversationId,
            content: content.trim(),
            type: "text",
            tempId,
            senderId: currentUser?.id,
            participant1Id: conversationId ? undefined : currentUser?.id,
            participant2Id: conversationId ? undefined : recipientId,
            // snake_case duplicates
            recipient_id: recipientId,
            conversation_id: conversationId,
            message: content.trim(),
            message_type: "text",
            temp_id: tempId,
            sender_id: currentUser?.id,
            participant1_id: conversationId ? undefined : currentUser?.id,
            participant2_id: conversationId ? undefined : recipientId,
          }),
        });

        // Handle rate limiting specifically
        if (respRaw.status === 429) {
          const result = await respRaw.json().catch(() => ({ error: 'Rate limit exceeded' }));
          const error = new Error(result.error || 'Rate limit exceeded');
          (error as any).isRateLimit = true;
          throw error;
        }

        if (!respRaw.ok) {
          const result = await respRaw.json().catch(() => ({ error: `HTTP ${respRaw.status}` }));
          throw new Error(result.error || `HTTP ${respRaw.status}: ${respRaw.statusText}`);
        }

        const result = await respRaw.json().catch(() => ({}));
        if (!result.success) {
          throw new Error(result.error || "Send failed");
        }

        return result;
      }
    },
    onMutate: async (args) => {
      const { conversationId, content, tempId } = args;
      const convKeyId =
        conversationId != null ? String(conversationId) : undefined;

      // Set sending state
      ui.setSendingMessage(true);

      // Create optimistic message
      if (convKeyId && tempId) {
        const optimisticMessage: FrontendMessage = {
          id: tempId,
          conversationId: convKeyId,
          content: content.trim(),
          timestamp: new Date().toISOString(),
          sender: currentUser
            ? {
                id: currentUser.id,
                username: currentUser.username || "you",
                name: currentUser.name || "You",
              }
            : { id: "current-user", username: "you", name: "You" },
          senderType: "user",
          isRead: true,
          isDelivered: false,
        };

        // Update messages cache optimistically
        queryClient.setQueryData(messageKeys.messages(convKeyId), (prev: any) => {
          if (!prev || !prev.pages || prev.pages.length === 0) {
            // Initialize with first page containing the temp message
            return {
              pages: [
                {
                  data: {
                    messages: [
                      {
                        id: tempId,
                        conversation_id: convKeyId,
                        content: content.trim(),
                        timestamp: optimisticMessage.timestamp,
                        created_at: optimisticMessage.timestamp,
                        sender: optimisticMessage.sender,
                        senderType: optimisticMessage.senderType,
                        is_read: true,
                      },
                    ],
                    pagination: {
                      page: 1,
                      limit: 50,
                      total: 1,
                      hasMore: false,
                    },
                  },
                },
              ],
              pageParams: [1],
            };
          }

          const copy = {
            ...prev,
            pages: prev.pages.map((p: any) => ({ ...p })),
          };
          const lastIdx = copy.pages.length - 1;
          const last = { ...copy.pages[lastIdx] };
          const list = Array.isArray(last?.data?.messages)
            ? [...last.data.messages]
            : [];
          // Guard: avoid duplicating the same temp message
          if (list.some((m: any) => m.id === tempId)) {
            return prev;
          }

          list.push({
            id: tempId,
            conversation_id: convKeyId,
            content: content.trim(),
            timestamp: optimisticMessage.timestamp,
            created_at: optimisticMessage.timestamp,
            sender: optimisticMessage.sender,
            senderType: optimisticMessage.senderType,
            is_read: true,
          });

          last.data = { ...(last.data || {}), messages: list };
          copy.pages[lastIdx] = last;
          return copy;
        });

        // Update conversations list optimistically (align with useInfiniteQuery cache shape)
        queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
          // Expected shape: { pages: ConversationsPage[], pageParams: any[] }
          const empty = {
            pages: [{ conversations: [], nextCursor: null }],
            pageParams: [null],
          };
          const curr = prev && prev.pages ? prev : empty;

          const pages = curr.pages.map((pg: any) => ({
            ...pg,
            conversations: Array.isArray(pg.conversations)
              ? [...pg.conversations]
              : [],
          }));

          // find conversation in any page
          let foundPageIdx = -1;
          let foundIdx = -1;
          pages.forEach((pg: any, pIdx: number) => {
            const idx = pg.conversations.findIndex(
              (c: any) => String(c.id) === convKeyId
            );
            if (idx !== -1) {
              foundPageIdx = pIdx;
              foundIdx = idx;
            }
          });

          if (foundIdx !== -1) {
            const removed = pages[foundPageIdx].conversations.splice(
              foundIdx,
              1
            )[0];
            const conv = { ...(removed || {}) } as any;
            conv.lastMessage = {
              ...(conv.lastMessage || {}),
              id: tempId,
              content: content.trim(),
              timestamp: optimisticMessage.timestamp,
              sender: optimisticMessage.sender,
              senderType: optimisticMessage.senderType,
              isRead: true,
              is_read: true,
            };
            // Keep both snake_case and camelCase updated fields to be safe
            conv.updated_at = optimisticMessage.timestamp;
            conv.updatedAt = optimisticMessage.timestamp;

            // place at top of first page so ordering updates immediately
            const firstPage = pages[0] || {
              conversations: [],
              nextCursor: null,
            };
            firstPage.conversations.unshift(conv);
            pages[0] = firstPage;

            return { pages, pageParams: curr.pageParams };
          }

          return curr;
        });

        // (moved to onSuccess for correct variables scope and timing)
      }

      return { tempId };
    },
    onSuccess: (data, args) => {
      const { conversationId, tempId, content } = args as any;
      const convKeyId = conversationId != null ? String(conversationId) : undefined;

      // Clear sending state and input
      ui.setSendingMessage(false);
      ui.clearMessageInput();

      // Derive real conversation id from various possible response shapes
      const derivedNewConvId: string | undefined = (() => {
        try {
          return (
            (data as any)?.data?.conversationId ||
            (data as any)?.conversationId ||
            (data as any)?.data?.conversation?.id ||
            (data as any)?.conversation?.id ||
            undefined
          );
        } catch {
          return undefined;
        }
      })();

      if (derivedNewConvId && derivedNewConvId !== conversationId) {
        const activeId = useMessagingUIStore.getState().activeConversationId as string | null;
        const isTempActive = !!activeId && (
          String(activeId).startsWith("temp-") ||
          String(activeId).startsWith("temp_conv-") ||
          String(activeId).startsWith("temp-conv-")
        );
        const newId = String(derivedNewConvId);
        const notifySelected = (id: string) => {
          try {
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("conversation:selected", { detail: { conversationId: id } })
              );
            }
          } catch {}
        };
        if (isTempActive) {
          setTimeout(() => {
            ui.setActiveConversation(newId);
            notifySelected(newId);
          }, 380);
        } else {
          ui.setActiveConversation(newId);
          notifySelected(newId);
        }

        // Also broadcast a reconciliation event for any listeners
        try {
          if (typeof window !== "undefined") {
            const sourceTempId = activeId && String(activeId).startsWith("temp-") ? activeId : tempId;
            if (sourceTempId) {
              window.dispatchEvent(
                new CustomEvent("conversation:created", {
                  detail: { tempId: sourceTempId, conversationId: newId },
                })
              );
            }
          }
        } catch {}

        // Seed/migrate messages into the new conversation cache so the sent text remains visible
        const nowIso = new Date().toISOString();
        const realMsgId: string | undefined = (data as any)?.data?.message?.id || (data as any)?.message?.id || undefined;
        queryClient.setQueryData(messageKeys.messages(newId), (prev: any) => {
          const optimisticSender = currentUser
            ? { id: currentUser.id, username: currentUser.username || "you", name: currentUser.name || "You" }
            : { id: "current-user", username: "you", name: "You" };

          // Primary message (the one just sent)
          const primaryMsg = {
            id: realMsgId || tempId || `temp-msg-${Date.now()}`,
            conversation_id: newId,
            content: (content || "").trim(),
            timestamp: nowIso,
            created_at: nowIso,
            sender: optimisticSender,
            senderType: "user",
            is_read: true,
          } as any;

        
          // Migrate any temp messages if present
          let migrated: any[] = [];
          try {
            const sourceTempId = activeId && String(activeId).startsWith("temp-") ? activeId : tempId;
            if (sourceTempId) {
              const list = getTempMessages(String(sourceTempId));
              if (Array.isArray(list) && list.length > 0) {
                migrated = list.map((m: any) => ({
                  id: m.id === tempId && realMsgId ? realMsgId : m.id,
                  conversation_id: newId,
                  content: m.content,
                  timestamp: m.timestamp || nowIso,
                  created_at: m.timestamp || nowIso,
                  sender: m.sender || optimisticSender,
                  senderType: m.senderType || "user",
                  is_read: true,
                }));
              }
            }
          } catch {}

          // Build next cache state
          const messagesToInsert = migrated.length > 0 ? migrated : [primaryMsg];
          if (!prev || !prev.pages || prev.pages.length === 0) {
            return {
              pages: [
                {
                  data: {
                    messages: messagesToInsert,
                    pagination: { page: 1, limit: 50, total: messagesToInsert.length, hasMore: false },
                  },
                },
              ],
              pageParams: [1],
            };
          }

          const copy = { ...prev, pages: prev.pages.map((p: any) => ({ ...p })) };
          const lastIdx = copy.pages.length - 1;
          const last = { ...copy.pages[lastIdx] };
          const list = Array.isArray(last?.data?.messages) ? [...last.data.messages] : [];
          // If we have a temp message already in list, reconcile its id to realMsgId
          if (tempId && realMsgId) {
            for (let i = 0; i < list.length; i++) {
              if (list[i]?.id === tempId) {
                list[i] = { ...list[i], id: realMsgId };
              }
            }
          }
          for (const msg of messagesToInsert) {
            if (!list.some((m: any) => m?.id === msg.id)) list.push(msg);
          }
          last.data = { ...(last.data || {}), messages: list };
          copy.pages[lastIdx] = last;
          return copy;
        });

        // Update conversations list: replace temp conversation with real or insert minimal
        const nowIso2 = new Date().toISOString();
        queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
          const empty = { pages: [{ conversations: [], nextCursor: null }], pageParams: [null] };
          const curr = prev && prev.pages ? prev : empty;
          const pages = curr.pages.map((pg: any) => ({
            ...pg,
            conversations: Array.isArray(pg.conversations) ? [...pg.conversations] : [],
          }));

          // Find temp conversation by the active temp conversation id, not the temp message id
          let foundPageIdx = -1;
          let foundIdx = -1;
          const sourceTempConvId = activeId && String(activeId).startsWith("temp-") ? activeId : undefined;
          if (sourceTempConvId) {
            pages.forEach((pg: any, pIdx: number) => {
              const idx = pg.conversations.findIndex((c: any) => c.id === sourceTempConvId);
              if (idx !== -1) { foundPageIdx = pIdx; foundIdx = idx; }
            });
          }

          const minimalLast = {
            id: realMsgId || tempId || `temp-msg-${Date.now()}`,
            content: (content || "").trim(),
            timestamp: nowIso2,
            sender: currentUser
              ? { id: currentUser.id, username: currentUser.username || "you", name: currentUser.name || "You" }
              : { id: "current-user", username: "you", name: "You" },
            senderType: "user",
            isRead: true,
            is_read: true,
          } as any;

          if (foundIdx !== -1) {
            const conv = { ...(pages[foundPageIdx].conversations[foundIdx] || {}) } as any;
            conv.id = newId;
            conv.lastMessage = minimalLast;
            conv.updated_at = nowIso2;
            conv.updatedAt = nowIso2;
            // remove from its page and place at top of first page
            pages[foundPageIdx].conversations.splice(foundIdx, 1);
            const first = pages[0] || { conversations: [], nextCursor: null };
            first.conversations.unshift(conv);
            pages[0] = first;
            return { pages, pageParams: curr.pageParams };
          } else {
            // Insert a minimal conversation at top if not found
            const first = pages[0] || { conversations: [], nextCursor: null };
            const conv = {
              id: newId,
              otherParticipant: null,
              lastMessage: minimalLast,
              updated_at: nowIso2,
              lastMessageAt: nowIso2,
              unread_count: 0,
            } as any;
            first.conversations.unshift(conv);
            pages[0] = first;
            return { pages, pageParams: curr.pageParams };
          }
        });

        // Notify UI listeners so scroll stays pinned
        try {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("messages:appended", { detail: { conversationId: newId } })
            );
          }
        } catch {}
      }

      // Invalidate and refetch to get the real message data, but avoid wiping the just-seeded cache
      if (convKeyId) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: messageKeys.messages(convKeyId) });
        }, 200);
      }
      const newConvIdForInvalidate = (data as any)?.data?.conversationId || (data as any)?.conversationId;
      if (newConvIdForInvalidate) {
        setTimeout(() => {
          const snapshot = queryClient.getQueryData<any>(messageKeys.messages(String(newConvIdForInvalidate)));
          const hasSeed = !!snapshot && Array.isArray(snapshot?.pages) && snapshot.pages.some((p: any) => Array.isArray(p?.data?.messages) && p.data.messages.length > 0);
          // Only invalidate if cache is still empty; otherwise let socket fill details to prevent flicker
          if (!hasSeed) {
            queryClient.invalidateQueries({
              queryKey: messageKeys.messages(String(newConvIdForInvalidate)),
            });
          }
        }, 1200);
      }
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      }, 600);
    },
    onError: (error, args, context) => {
      // Clear sending state
      ui.setSendingMessage(false);

      // Show user-friendly error notification
      const addNotification = useNotificationStore.getState().addNotification;
      const isRateLimit = (error as any)?.isRateLimit;
      
      if (isRateLimit) {
        addNotification({
          type: "warning",
          title: "Pesan Tertunda",
          message: "Anda mengirim pesan terlalu cepat. Pesan akan dikirim otomatis dalam beberapa menit.",
          persistent: false,
          autoHideDelay: 8000
        });
      } else {
        addNotification({
          type: "error",
          title: "Gagal Mengirim Pesan",
          message: "Pesan gagal dikirim. Sistem akan mencoba mengirim ulang secara otomatis.",
          persistent: false,
          autoHideDelay: 5000
        });
      }

      // Revert optimistic updates
      const { conversationId, tempId } = args;
      const convKeyId =
        conversationId != null ? String(conversationId) : undefined;
      if (convKeyId && tempId) {
        // Remove optimistic message
        queryClient.setQueryData(messageKeys.messages(convKeyId), (prev: any) => {
          if (!prev?.pages) return prev;

          const copy = {
            ...prev,
            pages: prev.pages.map((p: any) => ({
              ...p,
              data: {
                ...p.data,
                messages: (p.data?.messages || []).filter(
                  (m: any) => m.id !== tempId
                ),
              },
            })),
          };
          return copy;
        });

        // Revert conversation list changes
        queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      }
    },
  });
}

// Mark messages as read mutation
export function useMarkAsReadMutation(conversationId?: string) {
  const queryClient = useQueryClient();
  const { unread } = useMessagingActions();

  return useMutation({
    mutationFn: async (args: ReadArgs) => {
      if (!conversationId) throw new Error("Conversation ID required");

      const { messageIds } = args;
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        throw new Error("Message IDs required");
      }

      const csrfToken = getCookie("XSRF-TOKEN");
      const readResp = await fetch(
        backendPath(`/messaging/conversations/${conversationId}/read`),
        {
          method: "PUT",
          credentials: "include",
          headers: { 
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
          },
          body: JSON.stringify({ messageIds }),
        }
      );
      return (await readResp.json().catch(() => ({}))) ?? {};
    },
    onMutate: async (args) => {
      if (!conversationId) return;

      const { messageIds } = args;

      // Optimistically mark messages as read in cache
      queryClient.setQueryData(
        messageKeys.messages(conversationId),
        (prev: any) => {
          if (!prev?.pages) return prev;

          const copy = {
            ...prev,
            pages: prev.pages.map((p: any) => ({
              ...p,
              data: {
                ...p.data,
                messages: (p.data?.messages || []).map((msg: any) =>
                  messageIds.includes(msg.id)
                    ? { ...msg, is_read: true, isRead: true }
                    : msg
                ),
              },
            })),
          };
          return copy;
        }
      );

      // Update conversation lastMessage flags only (do NOT change unread_count on READ)
      queryClient.setQueryData(conversationKeys.lists(), (prev: any) => {
        if (!prev?.data?.conversations) return prev;

        const conversations = prev.data.conversations.map((c: any) =>
          c.id === conversationId
            ? {
                ...c,
                unread_count: c.unread_count,
                lastMessage:
                  c.lastMessage && messageIds.includes(c.lastMessage.id)
                    ? { ...c.lastMessage, isRead: true, is_read: true }
                    : c.lastMessage,
              }
            : c
        );

        return {
          ...prev,
          data: { ...prev.data, conversations },
        };
      });

      // Note: do not update Zustand unread store on READ; OPENED mutation handles counters.
    },
    onError: (error, args) => {
      // Invalidate to revert optimistic updates
      if (conversationId) {
        queryClient.invalidateQueries({
          queryKey: messageKeys.messages(conversationId),
        });
        queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      }
    },
  });
}

// useMarkAsOpenedMutation removed - using 2-state system (delivered -> read)
