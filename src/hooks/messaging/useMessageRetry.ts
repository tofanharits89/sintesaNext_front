"use client";

import { useState, useCallback } from 'react';
import { useMessageDelivery } from './useMessageDelivery';
import { useMessageOptimisticUpdates } from './useMessageOptimisticUpdates';
import { FrontendMessage } from '@/types/socket-events';

interface RetryableMessage {
  id: string;
  content: string;
  recipientId: string | undefined;
  conversationId: string | undefined;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: number;
}

export function useMessageRetry() {
  const messageDelivery = useMessageDelivery();
  const optimisticUpdates = useMessageOptimisticUpdates();
  const [retryQueue, setRetryQueue] = useState<Map<string, RetryableMessage>>(new Map());

  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 3000, 5000]; // 1s, 3s, 5s

  const addToRetryQueue = useCallback((
    messageId: string,
    content: string,
    recipientId?: string,
    conversationId?: string
  ) => {
    const retryMessage: RetryableMessage = {
      id: messageId,
      content,
      recipientId: recipientId || undefined,
      conversationId: conversationId || undefined,
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt: Date.now() + (RETRY_DELAYS[0] || 1000),
    };

    setRetryQueue(prev => new Map(prev).set(messageId, retryMessage));
  }, []);

  const removeFromRetryQueue = useCallback((messageId: string) => {
    setRetryQueue(prev => {
      const newQueue = new Map(prev);
      newQueue.delete(messageId);
      return newQueue;
    });
  }, []);

  const processRetryQueue = useCallback(async () => {
    const now = Date.now();
    const messagesToRetry: Array<[string, RetryableMessage]> = [];

    // Find messages ready for retry
    retryQueue.forEach((message, id) => {
      if (now >= message.nextRetryAt && message.retryCount < message.maxRetries) {
        messagesToRetry.push([id, message]);
      }
    });

    // Process each retry
    for (const [messageId, retryMessage] of messagesToRetry) {
      try {
        const result = await messageDelivery.mutateAsync({
          recipientId: retryMessage.recipientId || undefined,
          conversationId: retryMessage.conversationId || undefined,
          content: retryMessage.content,
          tempId: messageId,
        });

        if (result.success) {
          // Success - remove from queue and update optimistic cache
          removeFromRetryQueue(messageId);
          
          if (result.data?.message) {
            optimisticUpdates.replaceTempMessage(
              retryMessage.conversationId || '',
              messageId,
              result.data.message
            );
          }
        } else {
          // Failed - update retry count
          const newRetryCount = retryMessage.retryCount + 1;
          
          if (newRetryCount >= retryMessage.maxRetries) {
            // Max retries reached - mark as failed
            optimisticUpdates.updateMessageStatus(
              retryMessage.conversationId || '',
              messageId,
              'failed'
            );
            removeFromRetryQueue(messageId);
          } else {
            // Schedule next retry
            const nextDelay = RETRY_DELAYS[Math.min(newRetryCount, RETRY_DELAYS.length - 1)];
            if (!nextDelay) throw new Error('Next delay is undefined');
            const updatedMessage: RetryableMessage = {
              ...retryMessage,
              retryCount: newRetryCount,
              nextRetryAt: Date.now() + nextDelay,
            };
            
            setRetryQueue(prev => new Map(prev).set(messageId, updatedMessage));
            optimisticUpdates.updateMessageStatus(
              retryMessage.conversationId || '',
              messageId,
              'retrying'
            );
          }
        }
      } catch (error) {
        console.error('Retry failed:', error);
        // Handle retry failure similarly to above
        const newRetryCount = retryMessage.retryCount + 1;
        
        if (newRetryCount >= retryMessage.maxRetries) {
          optimisticUpdates.updateMessageStatus(
            retryMessage.conversationId || '',
            messageId,
            'failed'
          );
          removeFromRetryQueue(messageId);
        } else {
          const nextDelay = RETRY_DELAYS[Math.min(newRetryCount, RETRY_DELAYS.length - 1)];
          if (!nextDelay) throw new Error('Next delay is undefined');
          const updatedMessage: RetryableMessage = {
            ...retryMessage,
            retryCount: newRetryCount,
            nextRetryAt: Date.now() + nextDelay,
          };
          
          setRetryQueue(prev => new Map(prev).set(messageId, updatedMessage));
        }
      }
    }
  }, [messageDelivery, optimisticUpdates, removeFromRetryQueue, retryQueue]);

  const retryMessage = useCallback(async (messageId: string) => {
    const retryData = retryQueue.get(messageId);
    if (!retryData) return false;

    try {
      const result = await messageDelivery.mutateAsync({
        recipientId: retryData.recipientId || undefined,
        conversationId: retryData.conversationId || undefined,
        content: retryData.content,
        tempId: messageId,
      });

      if (result.success) {
        removeFromRetryQueue(messageId);
        
        if (result.data?.message) {
          optimisticUpdates.replaceTempMessage(
            retryData.conversationId || '',
            messageId,
            result.data.message
          );
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Manual retry failed:', error);
      return false;
    }
  }, [messageDelivery, optimisticUpdates, removeFromRetryQueue, retryQueue]);

  const clearRetryQueue = useCallback(() => {
    setRetryQueue(new Map());
  }, []);

  return {
    retryQueue,
    addToRetryQueue,
    removeFromRetryQueue,
    processRetryQueue,
    retryMessage,
    clearRetryQueue,
  };
}