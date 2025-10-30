"use client";

import { useMutation } from '@tanstack/react-query';
import { useSocket } from '../useSocket';
import { useAuth } from '@/lib/auth';
import { SOCKET_EVENTS } from '@/types/socket-events';

interface SendMessageArgs {
  recipientId?: string | undefined;
  conversationId?: string | undefined;
  content: string;
  tempId?: string;
}

interface SendMessageResponse {
  success: boolean;
  data?: {
    message: any;
    conversationId: string;
  };
  error?: string;
  method: 'websocket' | 'rest';
}

// Custom error type to mark offline failures
type OfflineError = Error & { isOffline?: boolean };

export function useMessageDelivery() {
  const { socket } = useSocket();
  const { user } = useAuth();

  const fetchWithTimeout = async (
    input: RequestInfo | URL,
    init: RequestInit & { timeoutMs?: number } = {},
  ): Promise<Response> => {
    const { timeoutMs = 10000, ...rest } = init;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(input, { ...rest, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  };

  const isOffline = () => {
    try {
      if (
        typeof navigator !== "undefined" &&
        navigator &&
        "onLine" in navigator
      ) {
        return navigator.onLine === false;
      }
    } catch {}
    return false;
  };

  return useMutation({
    retry: false,
    networkMode: "always",
    mutationFn: async (args: SendMessageArgs): Promise<SendMessageResponse> => {
      const { recipientId, conversationId, content, tempId } = args;

      // First try WebSocket for real-time delivery (with proper ACK)
      try {
        // If offline, fail fast
        if (isOffline()) {
          const err: OfflineError = new Error("Offline");
          err.isOffline = true;
          throw err;
        }

        if (!socket || !socket.connected) {
          throw new Error('Socket not connected');
        }

        const socketPayload = {
          recipientId,
          conversationId,
          content,
          tempId,
          senderId: user?.id,
        };

        const ack: any = await new Promise((resolve, reject) => {
          try {
            socket.emit(
              SOCKET_EVENTS.MESSAGE_SEND,
              socketPayload,
              (response: any) => {
                if (response?.success) return resolve(response);
                return reject(new Error(response?.error || 'Socket send failed'));
              }
            );
          } catch (e) {
            reject(e);
          }
        });

        const payload = ack?.data || { message: {}, conversationId: conversationId || '' };

        // If we started from a temp conversation (no conversationId provided) and got a real ID back,
        // broadcast an event so the page switches to the real conversation and updates URL/state.
        try {
          if (!conversationId && payload?.conversationId && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('conversation:created', { detail: { conversationId: payload.conversationId } }));
          }
        } catch {}

        return {
          success: true,
          data: payload,
          method: 'websocket',
        };
      } catch (error) {
        // Fallback to REST API
        try {
          const response = await fetchWithTimeout("/api/v1/messaging/send", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recipientId,
              conversationId,
              content,
              tempId,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const json = await response.json();
          const payload = (json && typeof json === 'object') ? (json.data ?? json) : json;
          return {
            success: true,
            data: payload,
            method: 'rest'
          };
        } catch (restError) {
          return {
            success: false,
            error: restError instanceof Error ? restError.message : 'Unknown error',
            method: 'rest'
          };
        }
      }
    },
  });
}
