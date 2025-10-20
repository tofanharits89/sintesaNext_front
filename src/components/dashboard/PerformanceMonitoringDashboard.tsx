"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "./StatCard";
import { cacheMetrics, type CacheStats, type HealthStatus } from "@/lib/cache-metrics";
import { 
  Activity, 
  Database, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Gauge,
  RefreshCw
} from "lucide-react";
import { LineChartComponent } from '@/components/ui/line-chart';
import { BarChartComponent } from '@/components/ui/bar-chart';

interface CompressionStats {
  totalCompressed: number;
  totalUncompressed: number;
  compressionRatio: number;
  brotliUsage: number;
  gzipUsage: number;
  averageCompressionTime: number;
}

interface PerformanceMetrics {
  cacheStats: CacheStats;
  compressionStats: CompressionStats;
  healthStatus: HealthStatus;
  realTimeData: {
    activeConnections: number;
    requestsPerSecond: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export function PerformanceMonitoringDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  type HitRatePoint = { name: string; hitRate: number; missRate: number };
  type ResponseTimePoint = { name: string; avgResponseTime: number; p95ResponseTime: number; p99ResponseTime: number };
  type CompressionPoint = { name: string; compressionRatio: number; originalSize: number; compressedSize: number };
  type ErrorRatePoint = { name: string; errorRate: number; successRate: number };

  const [historicalData, setHistoricalData] = useState<{
    hitRateHistory: HitRatePoint[];
    responseTimeHistory: ResponseTimePoint[];
    compressionHistory: CompressionPoint[];
    errorRateHistory: ErrorRatePoint[];
  }>({
    hitRateHistory: [],
    responseTimeHistory: [],
    compressionHistory: [],
    errorRateHistory: []
  });

  // Fetch performance metrics from backend
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Get cache metrics from the singleton
      const cacheStats = cacheMetrics.getStats();
      const healthStatus = cacheMetrics.getHealthStatus();
      
      // Mock compression stats for now - will be replaced with real API call
      const compressionStats: CompressionStats = {
        totalCompressed: 1250000,
        totalUncompressed: 2500000,
        compressionRatio: 0.5,
        brotliUsage: 0.75,
        gzipUsage: 0.25,
        averageCompressionTime: 12.5
      };
      
      // Mock real-time data - will be replaced with Socket.IO or API polling
      const realTimeData = {
        activeConnections: Math.floor(Math.random() * 100) + 50,
        requestsPerSecond: Math.floor(Math.random() * 50) + 20,
        memoryUsage: Math.random() * 80 + 10,
        cpuUsage: Math.random() * 60 + 5
      };
      
      setMetrics({
        cacheStats,
        compressionStats,
        healthStatus,
        realTimeData
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Generate mock historical data
  const generateHistoricalData = useCallback(() => {
    const now = new Date();
    const points = selectedTimeRange === '1h' ? 12 : selectedTimeRange === '24h' ? 24 : 7;
    const interval = selectedTimeRange === '1h' ? 5 : selectedTimeRange === '24h' ? 60 : 1440; // minutes
    
    const hitRateHistory: Array<{name: string; hitRate: number; missRate: number}> = [];
    const responseTimeHistory: Array<{name: string; avgResponseTime: number; p95ResponseTime: number; p99ResponseTime: number}> = [];
    const compressionHistory: Array<{name: string; compressionRatio: number; originalSize: number; compressedSize: number}> = [];
    const errorRateHistory: Array<{name: string; errorRate: number; successRate: number}> = [];
    
    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * interval * 60000);
      const timeLabel = selectedTimeRange === '7d' 
        ? time.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
        : time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      
      const baseHitRate = 85 + Math.random() * 10;
      const baseResponseTime = 45 + Math.random() * 30;
      const baseCompressionRatio = 65 + Math.random() * 15;
      const baseErrorRate = Math.random() * 2;
      
      hitRateHistory.push({
        name: timeLabel,
        hitRate: Math.round(baseHitRate * 100) / 100,
        missRate: Math.round((100 - baseHitRate) * 100) / 100
      });
      
      responseTimeHistory.push({
        name: timeLabel,
        avgResponseTime: Math.round(baseResponseTime),
        p95ResponseTime: Math.round(baseResponseTime * 1.5),
        p99ResponseTime: Math.round(baseResponseTime * 2.2)
      });
      
      compressionHistory.push({
        name: timeLabel,
        compressionRatio: Math.round(baseCompressionRatio * 100) / 100,
        originalSize: Math.round(1000 + Math.random() * 500),
        compressedSize: Math.round((1000 + Math.random() * 500) * (1 - baseCompressionRatio / 100))
      });
      
      errorRateHistory.push({
        name: timeLabel,
        errorRate: Math.round(baseErrorRate * 100) / 100,
        successRate: Math.round((100 - baseErrorRate) * 100) / 100
      });
    }
    
    setHistoricalData({
      hitRateHistory,
      responseTimeHistory,
      compressionHistory,
      errorRateHistory
    });
  }, [selectedTimeRange]);

  // Auto-refresh effect
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
      generateHistoricalData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval, generateHistoricalData]);

  // Generate historical data when time range changes
  useEffect(() => {
    generateHistoricalData();
  }, [generateHistoricalData]);

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <StatCard
              key={i}
              label="Loading..."
              icon={<Activity className="h-4 w-4" />}
              loading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Failed to load performance metrics. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { cacheStats, compressionStats, healthStatus, realTimeData } = metrics;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5m">5m</SelectItem>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="6h">6h</SelectItem>
              <SelectItem value="24h">24h</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex items-center gap-2">
            <Switch
              checked={isAutoRefresh}
              onCheckedChange={setIsAutoRefresh}
            />
            <span className="text-sm text-muted-foreground">
              Auto-refresh ({refreshInterval / 1000}s)
            </span>
          </div>
          <Badge className={getHealthStatusColor(healthStatus.status)}>
            {getHealthStatusIcon(healthStatus.status)}
            {healthStatus.status.toUpperCase()}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Cache Hit Rate"
          icon={<Database className="h-4 w-4 text-blue-500" />}
          value={`${Math.round(cacheStats.hitRate * 100)}%`}
          loading={loading}
          className={
            cacheStats.hitRate >= 0.8 ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 
            cacheStats.hitRate >= 0.5 ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' : 
            'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
          }
          valueClassName={
            cacheStats.hitRate >= 0.8 ? 'text-green-600 dark:text-green-400' : 
            cacheStats.hitRate >= 0.5 ? 'text-yellow-600 dark:text-yellow-400' : 
            'text-red-600 dark:text-red-400'
          }
        />
        
        <StatCard
          label="Avg Query Time"
          icon={<Clock className="h-4 w-4 text-purple-500" />}
          value={`${Math.round(cacheStats.averageQueryTime)}ms`}
          loading={loading}
          className={
            cacheStats.averageQueryTime <= 100 ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 
            cacheStats.averageQueryTime <= 300 ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' : 
            'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
          }
          valueClassName={
            cacheStats.averageQueryTime <= 100 ? 'text-green-600 dark:text-green-400' : 
            cacheStats.averageQueryTime <= 300 ? 'text-yellow-600 dark:text-yellow-400' : 
            'text-red-600 dark:text-red-400'
          }
        />
        
        <StatCard
          label="Compression Ratio"
          icon={<Zap className="h-4 w-4 text-orange-500" />}
          value={`${Math.round(compressionStats.compressionRatio * 100)}%`}
          valueClassName="mt-1 text-lg font-semibold text-green-600"
        />
        
        <StatCard
          label="Total Queries"
          icon={<TrendingUp className="h-4 w-4 text-indigo-500" />}
          value={cacheStats.totalQueries.toLocaleString()}
        />
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="cache" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cache">Cache Metrics</TabsTrigger>
          <TabsTrigger value="compression">Compression</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="health">Health Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="cache" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Cache Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hit Rate</span>
                    <span className="font-medium">{Math.round(cacheStats.hitRate * 100)}%</span>
                  </div>
                  <Progress value={cacheStats.hitRate * 100} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hits</p>
                    <p className="text-2xl font-bold text-green-600">{cacheStats.totalHits.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Misses</p>
                    <p className="text-2xl font-bold text-red-600">{cacheStats.totalMisses.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(cacheStats.categories).map(([category, stats]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <span className="font-medium">{Math.round(stats.hitRate * 100)}%</span>
                      </div>
                      <Progress value={stats.hitRate * 100} className="h-1" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{stats.hits} hits</span>
                        <span>{Math.round(stats.averageQueryTime)}ms avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compression" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Compression Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data Saved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((compressionStats.totalUncompressed - compressionStats.totalCompressed) / 1024 / 1024)}MB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Compression Time</p>
                    <p className="text-2xl font-bold">{compressionStats.averageCompressionTime}ms</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Compression Ratio</span>
                    <span className="font-medium">{Math.round(compressionStats.compressionRatio * 100)}%</span>
                  </div>
                  <Progress value={compressionStats.compressionRatio * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Algorithm Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Brotli</span>
                      <span className="font-medium">{Math.round(compressionStats.brotliUsage * 100)}%</span>
                    </div>
                    <Progress value={compressionStats.brotliUsage * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Gzip (Fallback)</span>
                      <span className="font-medium">{Math.round(compressionStats.gzipUsage * 100)}%</span>
                    </div>
                    <Progress value={compressionStats.gzipUsage * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Connections"
              icon={<Activity className="h-4 w-4 text-blue-500" />}
              value={realTimeData.activeConnections}
            />
            
            <StatCard
              label="Requests/sec"
              icon={<TrendingUp className="h-4 w-4 text-green-500" />}
              value={realTimeData.requestsPerSecond}
            />
            
            <StatCard
              label="Memory Usage"
              icon={<Gauge className="h-4 w-4 text-orange-500" />}
              value={`${Math.round(realTimeData.memoryUsage)}%`}
              valueClassName={`mt-1 text-lg font-semibold ${
                realTimeData.memoryUsage <= 70 ? 'text-green-600' : 
                realTimeData.memoryUsage <= 85 ? 'text-yellow-600' : 'text-red-600'
              }`}
            />
            
            <StatCard
              label="CPU Usage"
              icon={<Gauge className="h-4 w-4 text-purple-500" />}
              value={`${Math.round(realTimeData.cpuUsage)}%`}
              valueClassName={`mt-1 text-lg font-semibold ${
                realTimeData.cpuUsage <= 60 ? 'text-green-600' : 
                realTimeData.cpuUsage <= 80 ? 'text-yellow-600' : 'text-red-600'
              }`}
            />
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getHealthStatusIcon(healthStatus.status)}
                System Health Status
              </CardTitle>
              <CardDescription>
                Overall system health based on cache performance and resource usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getHealthStatusColor(healthStatus.status)}>
                  {healthStatus.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Hit Rate: {Math.round(healthStatus.hitRate * 100)}% | 
                  Avg Response: {Math.round(healthStatus.averageQueryTime)}ms
                </span>
              </div>
              
              {healthStatus.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Issues Detected:</h4>
                  <ul className="space-y-1">
                    {healthStatus.issues.map((issue, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {healthStatus.issues.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  All systems operating normally
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Hit Rate Trend */}
            <LineChartComponent
              data={historicalData.hitRateHistory}
              title="Cache Hit Rate Trend"
              description={`Hit rate performance over ${selectedTimeRange}`}
              lines={[
                { dataKey: 'hitRate', stroke: '#10b981', name: 'Hit Rate (%)' },
                { dataKey: 'missRate', stroke: '#ef4444', name: 'Miss Rate (%)' }
              ]}
              height={300}
              formatValue={(value) => `${value}%`}
            />
            
            {/* Response Time Trends */}
            <LineChartComponent
              data={historicalData.responseTimeHistory}
              title="Response Time Trends"
              description={`Response time metrics over ${selectedTimeRange}`}
              lines={[
                { dataKey: 'avgResponseTime', stroke: '#3b82f6', name: 'Average (ms)' },
                { dataKey: 'p95ResponseTime', stroke: '#f59e0b', name: 'P95 (ms)' },
                { dataKey: 'p99ResponseTime', stroke: '#ef4444', name: 'P99 (ms)' }
              ]}
              height={300}
              formatValue={(value) => `${value}ms`}
            />
            
            {/* Compression Ratio Chart */}
            <BarChartComponent
              data={historicalData.compressionHistory}
              title="Compression Efficiency"
              description={`Compression ratios over ${selectedTimeRange}`}
              dataKey="compressionRatio"
              color="#8b5cf6"
              height={300}
              formatValue={(value) => `${value}%`}
            />
            
            {/* Error Rate Trend */}
            <LineChartComponent
              data={historicalData.errorRateHistory}
              title="Error Rate Analysis"
              description={`Error rates and success metrics over ${selectedTimeRange}`}
              lines={[
                { dataKey: 'errorRate', stroke: '#ef4444', name: 'Error Rate (%)' },
                { dataKey: 'successRate', stroke: '#10b981', name: 'Success Rate (%)' }
              ]}
              height={300}
              formatValue={(value) => `${value}%`}
            />
          </div>
          
          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Insights
              </CardTitle>
              <CardDescription>
                AI-powered analysis of cache performance patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800">Excellent Hit Rate</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Cache hit rate is consistently above 85%, indicating optimal cache utilization.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-blue-800">Stable Response Times</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Average response times are within acceptable limits with minimal variance.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium text-purple-800">High Compression</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Brotli compression achieving 70%+ reduction in payload sizes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}