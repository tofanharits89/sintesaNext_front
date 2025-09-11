/**
 * Test page for Phase 1 messaging improvements
 */

"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { messageQueue } from '@/services/messageQueue';
import { useMessageQueue } from '@/hooks/useMessageQueue';

export default function TestMessagingPage() {
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [testMessage, setTestMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  
  // Initialize message queue
  const { retryFailedMessages, getFailedMessagesCount } = useMessageQueue();

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Listen for message events
    const handleMessageSent = (event: CustomEvent) => {
      addLog(`✅ Message sent: ${event.detail.tempId}`);
    };

    const handleMessageFailed = (event: CustomEvent) => {
      addLog(`❌ Message failed: ${event.detail.error}`);
    };

    const handleMessageReconcile = (event: CustomEvent) => {
      addLog(`🔄 Message reconciled: ${event.detail.tempId} -> ${event.detail.serverMessageId}`);
    };

    window.addEventListener('message:sent', handleMessageSent as EventListener);
    window.addEventListener('message:failed', handleMessageFailed as EventListener);
    window.addEventListener('message:reconcile', handleMessageReconcile as EventListener);

    return () => {
      window.removeEventListener('message:sent', handleMessageSent as EventListener);
      window.removeEventListener('message:failed', handleMessageFailed as EventListener);
      window.removeEventListener('message:reconcile', handleMessageReconcile as EventListener);
    };
  }, []);

  const testQueueMessage = async () => {
    if (!testMessage.trim()) return;

    try {
      const tempId = `test-${Date.now()}`;
      await messageQueue.queueMessage({
        id: tempId,
        conversationId: 'test-conversation',
        content: testMessage,
        tempId,
        clientTimestamp: new Date()
      });
      
      addLog(`📝 Queued message: ${testMessage}`);
      setTestMessage('');
    } catch (error) {
      addLog(`❌ Failed to queue message: ${error}`);
    }
  };

  const checkQueueStatus = async () => {
    try {
      const [pending, failed] = await Promise.all([
        messageQueue.getPendingMessages(),
        messageQueue.getFailedMessages()
      ]);

      setQueueStatus({
        pending: pending.length,
        failed: failed.length,
        pendingMessages: pending,
        failedMessages: failed
      });
    } catch (error) {
      addLog(`❌ Failed to check queue status: ${error}`);
    }
  };

  const retryMessages = async () => {
    try {
      await retryFailedMessages();
      addLog('🔄 Retrying failed messages...');
      setTimeout(checkQueueStatus, 1000);
    } catch (error) {
      addLog(`❌ Failed to retry messages: ${error}`);
    }
  };

  const clearQueue = async () => {
    try {
      // Clear all messages from queue
      const pending = await messageQueue.getPendingMessages();
      const failed = await messageQueue.getFailedMessages();
      
      // This is a test function - in production you wouldn't expose this
      for (const msg of [...pending, ...failed]) {
        await messageQueue.updateMessageStatus(msg.id, 'sent');
      }
      
      addLog('🧹 Cleared message queue');
      setTimeout(checkQueueStatus, 500);
    } catch (error) {
      addLog(`❌ Failed to clear queue: ${error}`);
    }
  };

  useEffect(() => {
    checkQueueStatus();
    const interval = setInterval(checkQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Phase 1 Messaging Test</h1>
        <Badge variant="outline">Development Only</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Message Queue Test */}
        <Card>
          <CardHeader>
            <CardTitle>Message Queue Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter test message..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && testQueueMessage()}
              />
              <Button onClick={testQueueMessage}>Queue</Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={checkQueueStatus}>
                Refresh Status
              </Button>
              <Button variant="outline" onClick={retryMessages}>
                Retry Failed
              </Button>
              <Button variant="destructive" onClick={clearQueue}>
                Clear Queue
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Queue Status */}
        <Card>
          <CardHeader>
            <CardTitle>Queue Status</CardTitle>
          </CardHeader>
          <CardContent>
            {queueStatus ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Pending Messages:</span>
                  <Badge variant={queueStatus.pending > 0 ? "default" : "secondary"}>
                    {queueStatus.pending}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Failed Messages:</span>
                  <Badge variant={queueStatus.failed > 0 ? "destructive" : "secondary"}>
                    {queueStatus.failed}
                  </Badge>
                </div>
                
                {queueStatus.pendingMessages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Pending:</h4>
                    <div className="space-y-1 text-sm">
                      {queueStatus.pendingMessages.map((msg: any) => (
                        <div key={msg.id} className="p-2 bg-muted rounded">
                          <div className="font-mono text-xs">{msg.id}</div>
                          <div>{msg.content}</div>
                          <div className="text-xs text-muted-foreground">
                            Retry: {msg.retryCount}/3
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {queueStatus.failedMessages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Failed:</h4>
                    <div className="space-y-1 text-sm">
                      {queueStatus.failedMessages.map((msg: any) => (
                        <div key={msg.id} className="p-2 bg-destructive/10 rounded">
                          <div className="font-mono text-xs">{msg.id}</div>
                          <div>{msg.content}</div>
                          <div className="text-xs text-muted-foreground">
                            Retries: {msg.retryCount}/3
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>Loading...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Log */}
      <Card>
        <CardHeader>
          <CardTitle>Event Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 font-mono text-sm max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-muted-foreground">No events yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="p-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>1. <strong>Queue Test:</strong> Enter a message and click "Queue" to test IndexedDB persistence</div>
          <div>2. <strong>Offline Test:</strong> Disconnect internet, queue messages, then reconnect</div>
          <div>3. <strong>Retry Test:</strong> Messages will automatically retry every 30 seconds</div>
          <div>4. <strong>Browser Test:</strong> Close/reopen browser - queued messages should persist</div>
          <div>5. <strong>Rate Limit Test:</strong> Send 30+ messages rapidly via actual chat to test limits</div>
        </CardContent>
      </Card>
    </div>
  );
}