/**
 * Cache Debug Panel Component
 * Development utility for inspecting and debugging cache operations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface CacheStats {
  totalEntries: number;
  bypassEntries: number;
  sessionEntries: number;
  expiredEntries: number;
}

interface PerformanceMetrics {
  totalOperations: number;
  averageResponseTime: number;
  hitRate: number;
  errorRate: number;
  lastResetTime: string;
  cacheSize: number;
  bypassCount: number;
}

interface AuditEntry {
  timestamp: string;
  operation: string;
  cacheType: string;
  key?: string;
  userId?: string;
  sessionId?: string;
  success: boolean;
  duration?: number;
  metadata?: any;
}

interface HealthReport {
  status: 'healthy' | 'warning' | 'critical';
  metrics: PerformanceMetrics;
  issues: string[];
  recommendations: string[];
}

export default function CacheDebugPanel() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/debug/cache?action=stats');
      const result = await response.json();
      if (result.success) {
        setStats(result.data.stats);
        setPerformance(result.data.performance);
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    }
  };

  const fetchAuditTrail = async () => {
    try {
      const response = await fetch('/api/debug/cache?action=audit&limit=100');
      const result = await response.json();
      if (result.success) {
        setAuditTrail(result.data.entries);
      }
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
    }
  };

  const fetchHealthReport = async () => {
    try {
      const response = await fetch('/api/debug/cache?action=health');
      const result = await response.json();
      if (result.success) {
        setHealthReport(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch health report:', error);
    }
  };

  const handleResetMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/cache?action=reset-metrics', {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        await fetchCacheStats();
        await fetchHealthReport();
      }
    } catch (error) {
      console.error('Failed to reset metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/cache?action=clear-all', {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        await fetchCacheStats();
        await fetchAuditTrail();
        await fetchHealthReport();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/cache?action=cleanup');
      const result = await response.json();
      if (result.success) {
        await fetchCacheStats();
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCacheStats(),
        fetchAuditTrail(),
        fetchHealthReport()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(refreshAll, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Cache debugging is only available in development mode.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cache Debug Panel</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? 'Stop Auto Refresh' : 'Auto Refresh'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEntries || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Session Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.sessionEntries || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bypass Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.bypassEntries || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Expired Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.expiredEntries || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {performance && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performance.totalOperations}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performance.averageResponseTime.toFixed(2)}ms</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performance.hitRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{performance.errorRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performance.cacheSize}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Bypass Count</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performance.bypassCount}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Cache Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {auditTrail.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant={entry.success ? 'default' : 'destructive'}>
                          {entry.operation}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {entry.cacheType}
                        </span>
                        {entry.duration && (
                          <span className="text-xs text-muted-foreground">
                            {entry.duration}ms
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {healthReport && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(healthReport.status)}
                    <span>Cache Health Status</span>
                    <Badge className={getStatusColor(healthReport.status)}>
                      {healthReport.status.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {healthReport.issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600">Issues:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {healthReport.issues.map((issue, index) => (
                          <li key={index} className="text-sm text-red-600">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {healthReport.recommendations.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="font-medium text-blue-600">Recommendations:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {healthReport.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-blue-600">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {healthReport.issues.length === 0 && (
                    <p className="text-green-600">All cache systems are operating normally.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cache Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={handleCleanup}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cleanup Expired Entries
                </Button>
                <Button
                  onClick={handleClearCache}
                  disabled={loading}
                  className="w-full"
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Cache
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Metrics Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleResetMetrics}
                  disabled={loading}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Performance Metrics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
