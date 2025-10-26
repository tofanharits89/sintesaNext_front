"use client";

import { useMutation } from '@tanstack/react-query';
import { useSocket } from '../useSocket';
import { useUnifiedAuth } from '@/lib/auth';

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
  const { emit } = useSocket();
  const { user } = useUnifiedAuth();

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

      // First try WebSocket for real-time delivery
      try {
        // If offline, fail fast
        if (isOffline()) {
          const err: OfflineError = new Error("Offline");
          err.isOffline = true;
          throw err;
        }

        const socketPayload = {
          recipientId,
          conversationId,
          content,
          tempId,
          senderId: user?.id,
        };

        const response = await emit('sendMessage', socketPayload);
        return { 
          success: true, 
          data: response as any || { message: {}, conversationId: conversationId || '' }, 
          method: 'websocket' 
        };
      } catch (error) {
        // Fallback to REST API
        try {
          const response = await fetchWithTimeout('/api/messages', {
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

          const data = await response.json();
          return { 
            success: true, 
            data, 
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
