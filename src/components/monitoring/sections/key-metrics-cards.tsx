import { StatCard } from "@/components/lazy";
import { Database, Clock, Zap, TrendingUp } from "lucide-react";
import type { PerformanceMetrics } from "@/types/monitoring";
import { 
  formatPercentage,
  getCacheHitRateQuality,
  getResponseTimeQuality 
} from "@/utils/monitoring";

interface KeyMetricsCardsProps {
  metrics: PerformanceMetrics;
  loading: boolean;
}

export const KeyMetricsCards = ({ metrics, loading }: KeyMetricsCardsProps) => {
  const { cacheStats, compressionStats } = metrics;
  const hitRateQuality = getCacheHitRateQuality(cacheStats.hitRate);
  const responseTimeQuality = getResponseTimeQuality(cacheStats.averageQueryTime);

  const getHitRateCardStyling = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return {
          className: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
          valueClassName: 'text-green-600 dark:text-green-400'
        };
      case 'good':
        return {
          className: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
          valueClassName: 'text-blue-600 dark:text-blue-400'
        };
      case 'fair':
        return {
          className: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
          valueClassName: 'text-yellow-600 dark:text-yellow-400'
        };
      default:
        return {
          className: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
          valueClassName: 'text-red-600 dark:text-red-400'
        };
    }
  };

  const getResponseTimeCardStyling = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return {
          className: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
          valueClassName: 'text-green-600 dark:text-green-400'
        };
      case 'good':
        return {
          className: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
          valueClassName: 'text-blue-600 dark:text-blue-400'
        };
      case 'fair':
        return {
          className: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
          valueClassName: 'text-yellow-600 dark:text-yellow-400'
        };
      default:
        return {
          className: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
          valueClassName: 'text-red-600 dark:text-red-400'
        };
    }
  };

  const hitRateStyling = getHitRateCardStyling(hitRateQuality);
  const responseTimeStyling = getResponseTimeCardStyling(responseTimeQuality);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Cache Hit Rate"
        icon={<Database className="h-4 w-4 text-blue-500" />}
        value={formatPercentage(cacheStats.hitRate)}
        loading={loading}
        className={hitRateStyling.className}
        valueClassName={hitRateStyling.valueClassName}
      />
      
      <StatCard
        label="Avg Query Time"
        icon={<Clock className="h-4 w-4 text-purple-500" />}
        value={`${Math.round(cacheStats.averageQueryTime)}ms`}
        loading={loading}
        className={responseTimeStyling.className}
        valueClassName={responseTimeStyling.valueClassName}
      />
      
      <StatCard
        label="Compression Ratio"
        icon={<Zap className="h-4 w-4 text-orange-500" />}
        value={formatPercentage(compressionStats.compressionRatio)}
        loading={loading}
        valueClassName="mt-1 text-lg font-semibold text-green-600"
      />
      
      <StatCard
        label="Total Queries"
        icon={<TrendingUp className="h-4 w-4 text-indigo-500" />}
        value={cacheStats.totalQueries.toLocaleString()}
        loading={loading}
      />
    </div>
  );
};