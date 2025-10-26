import { CheckCircle, AlertTriangle, XCircle, Activity } from "lucide-react";

export const getHealthStatusIcon = (status: string) => {
  switch (status) {
    case 'healthy':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'critical':
      return XCircle;
    default:
      return Activity;
  }
};

export const getHealthStatusIconColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return "text-green-500";
    case 'warning':
      return "text-yellow-500";
    case 'critical':
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

export const getHealthStatusColor = (status: string) => {
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

export const getHealthStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 text-green-600 dark:text-green-400';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400';
    case 'critical':
      return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 text-red-600 dark:text-red-400';
    default:
      return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800 text-gray-600 dark:text-gray-400';
  }
};

export const getPerformanceInsights = (metrics: any) => {
  const insights = [];
  
  // Cache hit rate insight
  if (metrics?.cacheStats?.hitRate >= 0.85) {
    insights.push({
      type: 'excellent',
      title: 'Excellent Hit Rate',
      description: 'Cache hit rate is consistently above 85%, indicating optimal cache utilization.',
      color: 'green'
    });
  } else if (metrics?.cacheStats?.hitRate >= 0.7) {
    insights.push({
      type: 'good',
      title: 'Good Hit Rate',
      description: 'Cache hit rate is above 70%, showing good cache performance.',
      color: 'blue'
    });
  }
  
  // Response time insight
  if (metrics?.cacheStats?.averageQueryTime <= 100) {
    insights.push({
      type: 'excellent',
      title: 'Fast Response Times',
      description: 'Average response times are under 100ms with minimal variance.',
      color: 'green'
    });
  } else if (metrics?.cacheStats?.averageQueryTime <= 300) {
    insights.push({
      type: 'good',
      title: 'Stable Response Times',
      description: 'Average response times are within acceptable limits.',
      color: 'blue'
    });
  }
  
  // Compression insight
  if (metrics?.compressionStats?.compressionRatio >= 0.7) {
    insights.push({
      type: 'excellent',
      title: 'High Compression',
      description: 'Brotli compression achieving 70%+ reduction in payload sizes.',
      color: 'purple'
    });
  }
  
  return insights;
};
