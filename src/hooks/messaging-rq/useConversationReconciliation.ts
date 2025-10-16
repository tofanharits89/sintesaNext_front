"use client";

/**
 * Conversation Reconciliation Hook
 * 
 * Handles smooth transition from temp → real conversations after first message
 * Ensures messages are not lost during ID migration
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { messageKeys } from "../useMessagesRQ";
import { conversationKeys } from "../useConversationsRQ";
import { getTempMessages, clearTempMessages } from "@/features/messaging/temp-messages-store";
import { setHint, clearHint } from "@/features/messaging/temp-conversation-hints";
import { FrontendMessage } from "@/types/socket-events";
import { useUnifiedAuth } from "../useUnifiedAuth";

/**
 * Reconcile temp conversation ID to real conversation ID
 * Safely migrates all messages and updates all caches
 */
export function useConversationReconciliation() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useUnifiedAuth();
  const userScopeId = currentUser?.id ?? null;

  const reconcileTempToReal = useCallback(
    async (tempConvId: string, realConvId: string, data: any) => {
      if (!tempConvId || !realConvId || tempConvId === realConvId) return;

      try {
        console.log("[Reconciliation] Starting temp→real migration", {
          tempConvId,
          realConvId,
        });

        // ============================================
        // STEP 1: Extract messages from temp store
        // ============================================
        const tempMessages = getTempMessages(tempConvId);
        console.log(`[Reconciliation] Found ${tempMessages.length} temp messages`);

        // ============================================
        // STEP 2: Build canonical message list
        // ============================================
        const canonicalMessages = tempMessages.map((msg: any) => ({
          ...msg,
          conversation_id: realConvId,
          conversationId: realConvId,
          // Preserve delivery state from original message
          isDelivered: msg.isDelivered ?? false,
          _sending: false,
          _failed: false,
        })) as FrontendMessage[];

        // Add first message from response if not already present
        const responseMsg = data?.data?.message || data?.message;
        if (responseMsg) {
          const alreadyInList = canonicalMessages.find(
            (m) => m.id === responseMsg.id || m.id === (data?.tempId)
          );
          if (!alreadyInList) {
            canonicalMessages.push({
              ...responseMsg,
              conversation_id: realConvId,
              conversationId: realConvId,
              isDelivered: false,
              _sending: false,
              _failed: false,
            } as FrontendMessage);
          }
        }

        console.log(
          `[Reconciliation] Canonical message list: ${canonicalMessages.length} messages`
        );

        // ============================================
        // STEP 3: Pre-warm real conversation query cache
        // ============================================
        if (userScopeId && canonicalMessages.length > 0) {
          const realMessageKey = messageKeys.messages(userScopeId, realConvId);

          queryClient.setQueryData(realMessageKey, (prev: any) => {
            // Build proper infinite query structure
            const newQueryData = {
              pages: [
                {
                  messages: canonicalMessages,
                  data: {
                    messages: canonicalMessages,
                    pagination: {
                      page: 1,
                      limit: 25,
                      total: canonicalMessages.length,
                      hasMore: false,
                    },
                  },
                  pagination: {
                    page: 1,
                    limit: 25,
                    total: canonicalMessages.length,
                    hasMore: false,
                  },
                },
              ],
              pageParams: [undefined],
            };

            console.log("[Reconciliation] Pre-warmed real conversation cache", {
              realConvId,
              messageCount: canonicalMessages.length,
            });

            return newQueryData;
          });
        }

        // ============================================
        // STEP 4: Update conversations list
        // ============================================
        if (userScopeId) {
          const convListKey = conversationKeys.lists(userScopeId);

          queryClient.setQueryData(convListKey, (prev: any) => {
            if (!prev?.pages) {
              return {
                pages: [{ conversations: [], nextCursor: null }],
                pageParams: [null],
              };
            }

            const copy = {
              ...prev,
              pages: prev.pages.map((p: any) => ({
                ...p,
                conversations: Array.isArray(p.conversations)
                  ? [...p.conversations]
                  : [],
              })),
            };

            // Find and remove temp conversation
            let foundTempPageIdx = -1;
            let foundTempIdx = -1;

            copy.pages.forEach((pg: any, pIdx: number) => {
              const idx = pg.conversations.findIndex(
                (c: any) => c.id === tempConvId
              );
              if (idx !== -1) {
                foundTempPageIdx = pIdx;
                foundTempIdx = idx;
              }
            });

            if (foundTempIdx !== -1) {
              // Move temp conversation to real ID
              const tempConv = copy.pages[foundTempPageIdx].conversations[
                foundTempIdx
              ];
              copy.pages[foundTempPageIdx].conversations.splice(
                foundTempIdx,
                1
              );

              // Preserve otherParticipant from temp conversation, or get from window context
              let otherParticipant = tempConv.otherParticipant;
              if (!otherParticipant && typeof window !== "undefined") {
                try {
                  otherParticipant = (window as any).__selectedRecipient__;
                } catch {}
              }

              const realConv = {
                ...tempConv,
                id: realConvId,
                otherParticipant,
              };

              // Place at top of first page
              const firstPage = copy.pages[0] || {
                conversations: [],
                nextCursor: null,
              };
              firstPage.conversations.unshift(realConv);
              copy.pages[0] = firstPage;
            } else {
              // If not found, insert minimal conversation
              let otherParticipant =
                data?.data?.otherParticipant ||
                data?.otherParticipant ||
                canonicalMessages[0]?.sender ||
                null;
              
              // If still not found, try window context (set by new-message-dialog)
              if (!otherParticipant && typeof window !== "undefined") {
                try {
                  otherParticipant = (window as any).__selectedRecipient__;
                } catch {}
              }

              const firstPage = copy.pages[0] || {
                conversations: [],
                nextCursor: null,
              };

              const lastMsg = canonicalMessages[canonicalMessages.length - 1];
              firstPage.conversations.unshift({
                id: realConvId,
                otherParticipant,
                lastMessage: lastMsg
                  ? {
                      id: lastMsg.id,
                      content: lastMsg.content,
                      timestamp: lastMsg.timestamp,
                      sender: lastMsg.sender,
                    }
                  : null,
                updated_at: new Date().toISOString(),
                unread_count: 0,
              });
              copy.pages[0] = firstPage;
            }

            console.log("[Reconciliation] Updated conversations list", {
              realConvId,
            });

            return copy;
          });
        }

        // ============================================
        // STEP 5: Clean up temp state
        // ============================================
        clearTempMessages(tempConvId);
        clearHint(tempConvId);
        
        // Clean up window context
        try {
          delete (window as any).__selectedRecipient__;
        } catch {}

        console.log("[Reconciliation] Temp state cleaned up", {
          tempConvId,
        });

        // ============================================
        // STEP 6: Emit events for listeners
        // ============================================
        if (typeof window !== "undefined") {
          // Notify about reconciliation completion
          window.dispatchEvent(
            new CustomEvent("conversation:reconciled", {
              detail: {
                tempConvId,
                realConvId,
                messageCount: canonicalMessages.length,
              },
            })
          );
        }

        return {
          success: true,
          messageCount: canonicalMessages.length,
        };
      } catch (error) {
        console.error("[Reconciliation] Error during migration:", error);
        return {
          success: false,
          error,
        };
      }
    },
    [queryClient, userScopeId]
  );

  return {
    reconcileTempToReal,
  };
}
