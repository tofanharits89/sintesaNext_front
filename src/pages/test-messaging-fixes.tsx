/**
 * Test page for messaging system fixes
 * Tests unread count accuracy and conversation ordering
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMessagingRQ } from "@/hooks/useMessagingRQ";
import { useUnreadBadgesStore } from "@/stores/unread-badges-store";
import { getCurrentUnreadState } from "@/utils/unread-sync";
import { formatRelativeTime } from "@/shared/socket-events";

// Disable static generation for this test page
export async function getServerSideProps() {
  return {
    props: {}, // will be passed to the page component as props
  };
}

export default function TestMessagingFixes() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const {
    conversations,
    totalUnreadCount,
    isLoading,
    refreshData,
  } = useMessagingRQ();

  const unreadStore = useUnreadBadgesStore();

  // Test conversation ordering
  const testConversationOrdering = () => {
    const results: Array<{test: string; status: string; message: string}> = [];
    
    if (!conversations || conversations.length === 0) {
      results.push({
        test: "Conversation Ordering",
        status: "skipped",
        message: "No conversations to test",
      });
      return results;
    }

    // Check if conversations are properly sorted by lastMessageAt
    let isProperlyOrdered = true;
    let orderingIssues: Array<{index: number; currentId: string; nextId: string; currentTime: string; nextTime: string}> = [];

    for (let i = 0; i < conversations.length - 1; i++) {
      const current = conversations[i]!; // non-null due to bounds
      const next = conversations[i + 1]!; // non-null due to bounds
      if (!current || !next) continue; // extra safety for TS
      
      const currentTime = new Date(
        (current as any).lastMessageAt || 
        (current as any).updated_at || 
        0
      ).getTime();
      
      const nextTime = new Date(
        (next as any).lastMessageAt || 
        (next as any).updated_at || 
        0
      ).getTime();

      if (currentTime < nextTime) {
        isProperlyOrdered = false;
        orderingIssues.push({
          index: i,
          currentId: current.id,
          nextId: next.id,
          currentTime: new Date(currentTime).toISOString(),
          nextTime: new Date(nextTime).toISOString(),
        });
      }
    }

    results.push({
      test: "Conversation Ordering",
      status: isProperlyOrdered ? "pass" : "fail",
      message: isProperlyOrdered 
        ? `All ${conversations.length} conversations properly ordered by lastMessageAt`
        : `Found ${orderingIssues.length} ordering issues`,
    });

    return results;
  };

  // Test unread count consistency
  const testUnreadCountConsistency = () => {
    const results = [];
    const unreadState = getCurrentUnreadState();
    
    // Check if total unread count matches sum of individual counts
    const calculatedTotal = Object.values(unreadState.unreadCounts)
      .reduce((sum, info: any) => sum + (info.count || 0), 0);
    
    const totalMatches = calculatedTotal === unreadState.totalUnreadCount;
    
    results.push({
      test: "Unread Count Consistency",
      status: totalMatches ? "pass" : "fail",
      message: totalMatches 
        ? `Total unread count (${unreadState.totalUnreadCount}) matches calculated sum`
        : `Total unread count (${unreadState.totalUnreadCount}) doesn't match calculated sum (${calculatedTotal})`,
      details: {
        totalUnreadCount: unreadState.totalUnreadCount,
        calculatedTotal,
        individualCounts: unreadState.unreadCounts,
      },
    });

    // Check for negative unread counts
    const negativeCountConversations = Object.entries(unreadState.unreadCounts)
      .filter(([_, info]: [string, any]) => (info.count || 0) < 0)
      .map(([convId, info]) => ({ conversationId: convId, count: info.count }));

    results.push({
      test: "No Negative Unread Counts",
      status: negativeCountConversations.length === 0 ? "pass" : "fail",
      message: negativeCountConversations.length === 0
        ? "No negative unread counts found"
        : `Found ${negativeCountConversations.length} conversations with negative unread counts`,
      details: negativeCountConversations.length > 0 ? negativeCountConversations : undefined,
    });

    return results;
  };

  // Test conversation-server sync
  const testConversationServerSync = () => {
    const results = [];
    
    if (!conversations) {
      results.push({
        test: "Conversation-Server Sync",
        status: "skipped",
        message: "No conversations loaded",
      });
      return results;
    }

    const unreadState = getCurrentUnreadState();
    let syncIssues: any[] = [];

    conversations.forEach((conv) => {
      const serverCount = conv.unread_count || 0;
      const clientCount = unreadState.unreadCounts[conv.id]?.count || 0;
      
      // Allow some tolerance for active conversations due to optimistic updates
      const tolerance = 1;
      const difference = Math.abs(serverCount - clientCount);
      
      if (difference > tolerance) {
        syncIssues.push({
          conversationId: conv.id,
          serverCount,
          clientCount,
          difference,
          otherParticipant: (conv as any).otherParticipant?.name || 'Unknown',
        });
      }
    });

    results.push({
      test: "Conversation-Server Sync",
      status: syncIssues.length === 0 ? "pass" : "warning",
      message: syncIssues.length === 0
        ? `All ${conversations.length} conversations in sync with server`
        : `Found ${syncIssues.length} conversations with sync differences > ${1}`,
      details: syncIssues.length > 0 ? syncIssues : undefined,
    });

    return results;
  };

  // Run all tests
  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Refresh data first
      await refreshData();
      
      // Wait a bit for state to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      const allResults = [
        ...testConversationOrdering(),
        ...testUnreadCountConsistency(),
        ...testConversationServerSync(),
      ];

      setTestResults(allResults);
    } catch (error) {
      setTestResults([{
        test: "Test Execution",
        status: "error",
        message: `Failed to run tests: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run tests on mount
  useEffect(() => {
    if (!isLoading && conversations) {
      runTests();
    }
  }, [isLoading, conversations?.length]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass": return "bg-green-100 text-green-800 border-green-200";
      case "fail": return "bg-red-100 text-red-800 border-red-200";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error": return "bg-red-100 text-red-800 border-red-200";
      case "skipped": return "bg-gray-100 text-gray-600 border-gray-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Messaging System Test Suite</h1>
        <p className="text-muted-foreground">
          Tests for unread count accuracy and conversation ordering fixes
        </p>
      </div>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Button 
              onClick={runTests} 
              disabled={isRunning || isLoading}
            >
              {isRunning ? "Running Tests..." : "Run Tests"}
            </Button>
            <Button 
              variant="outline" 
              onClick={refreshData}
              disabled={isRunning || isLoading}
            >
              Refresh Data
            </Button>
            <div className="text-sm text-muted-foreground">
              {conversations ? `${conversations.length} conversations loaded` : "Loading..."}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current State Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{totalUnreadCount}</div>
              <div className="text-sm text-muted-foreground">Total Unread</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{conversations?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Conversations</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {unreadStore.conversationsWithUnread.size}
              </div>
              <div className="text-sm text-muted-foreground">With Unread</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {conversations ? 
                  conversations.filter(c => (c as any).lastMessage).length : 0
                }
              </div>
              <div className="text-sm text-muted-foreground">With Messages</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isRunning ? "Running tests..." : "No test results yet. Click 'Run Tests' to start."}
            </div>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{result.test}</h3>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.message}
                  </p>
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Show Details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation List Preview */}
      {conversations && conversations.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Conversation Order Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {conversations.slice(0, 10).map((conv, index) => (
                <div key={conv.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-mono text-muted-foreground">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {(conv as any).otherParticipant?.name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(conv as any).lastMessageAt ? 
                          formatRelativeTime((conv as any).lastMessageAt) : 
                          'No timestamp'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(conv.unread_count || 0) > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                    <div className="text-xs text-muted-foreground">
                      ID: {conv.id.slice(-8)}
                    </div>
                  </div>
                </div>
              ))}
              {conversations.length > 10 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  ... and {conversations.length - 10} more conversations
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}