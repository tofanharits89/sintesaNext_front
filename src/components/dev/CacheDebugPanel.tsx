"use client";

/**
 * Cache Debug Panel
 * Development tool for monitoring and debugging cache state
 * 
 * Usage:
 * import { CacheDebugPanel } from "@/components/dev/CacheDebugPanel";
 * 
 * // Add to your layout or page (only in development)
 * {process.env.NODE_ENV === 'development' && <CacheDebugPanel />}
 */

import { useState } from "react";
import { useCacheDebug } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CacheDebugPanel() {
  const { getCacheStats, debugCache, clearAllCaches, clearAuthCaches, clearDataCaches } = useCacheDebug();
  const [stats, setStats] = useState<ReturnType<typeof getCacheStats> | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const refreshStats = () => {
    const currentStats = getCacheStats();
    setStats(currentStats);
  };

  const handleDebugCache = () => {
    debugCache();
    refreshStats();
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => {
            setIsOpen(true);
            refreshStats();
          }}
          variant="outline"
          size="sm"
        >
          🔍 Cache Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Cache Debug Panel
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
            >
              ✕
            </Button>
          </CardTitle>
          <CardDescription>
            Monitor and manage application caches
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cache Statistics */}
          {stats && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">React Query:</span>
                <span className="font-mono">{stats.reactQueryCacheSize} queries</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">localStorage:</span>
                <span className="font-mono">{stats.localStorageSize} keys</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">sessionStorage:</span>
                <span className="font-mono">{stats.sessionStorageSize} keys</span>
              </div>
              
              {stats.recentEvents.length > 0 && (
                <div className="mt-4">
                  <div className="text-muted-foreground mb-2">Recent Events:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {stats.recentEvents.map((event, idx) => (
                      <div key={idx} className="text-xs font-mono bg-muted p-1 rounded">
                        {event.event} - {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={refreshStats}
              variant="outline"
              size="sm"
              className="w-full"
            >
              🔄 Refresh Stats
            </Button>
            
            <Button
              onClick={handleDebugCache}
              variant="outline"
              size="sm"
              className="w-full"
            >
              📊 Log Cache Details
            </Button>

            <div className="border-t pt-2 space-y-2">
              <Button
                onClick={clearAuthCaches}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                🗑️ Clear Auth Caches
              </Button>
              
              <Button
                onClick={clearDataCaches}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                🗑️ Clear Data Caches
              </Button>
              
              <Button
                onClick={clearAllCaches}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                💣 Clear All Caches
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            💡 Check browser console for detailed cache logs
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
