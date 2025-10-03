/**
 * Hook to manage message queue initialization and events
 */

import { useEffect, useCallback } from 'react';
import { messageQueue } from '@/services/messageQueue';

export function useMessageQueue() {
  // Initialize message queue
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    let mounted = true;

    const initQueue = async () => {
      try {
        await messageQueue.init();
        console.log('Message queue initialized');
      } catch (error) {
        console.error('Failed to initialize message queue:', error);
      }
    };

    initQueue();

    // Listen for message events
    const handleMessageSent = (event: CustomEvent) => {
      const { tempId, serverMessageId, conversationId } = event.detail;
      console.log('Message sent successfully:', { tempId, serverMessageId, conversationId });
      
      // Emit event for UI to reconcile temp message with real message
      window.dispatchEvent(new CustomEvent('message:reconcile', {
        detail: { tempId, serverMessageId, conversationId }
      }));
    };

    const handleMessageFailed = (event: CustomEvent) => {
      const { tempId, error, conversationId } = event.detail;
      console.error('Message failed to send:', { tempId, error, conversationId });
      
      // Emit event for UI to show error state
      window.dispatchEvent(new CustomEvent('message:error', {
        detail: { tempId, error, conversationId }
      }));
    };

    window.addEventListener('message:sent', handleMessageSent as EventListener);
    window.addEventListener('message:failed', handleMessageFailed as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('message:sent', handleMessageSent as EventListener);
      window.removeEventListener('message:failed', handleMessageFailed as EventListener);
      
      // Cleanup message queue
      messageQueue.destroy().catch(console.error);
    };
  }, []);

  // Manual retry function
  const retryFailedMessages = useCallback(async () => {
    try {
      await messageQueue.retryFailedMessages();
    } catch (error) {
      console.error('Failed to retry messages:', error);
    }
  }, []);

  // Get failed messages count
  const getFailedMessagesCount = useCallback(async () => {
    try {
      const failedMessages = await messageQueue.getFailedMessages();
      return failedMessages.length;
    } catch (error) {
      console.error('Failed to get failed messages count:', error);
      return 0;
    }
  }, []);

  return {
    retryFailedMessages,
    getFailedMessagesCount
  };
}