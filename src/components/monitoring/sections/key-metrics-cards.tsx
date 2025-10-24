import { StatCard } from "@/components/lazy";
import { Database, Clock, Zap, TrendingUp } from "lucide-react";
import type { PerformanceMetrics } from "@/types/monitoring";
import { formatPercentage } from "@/utils/monitoring";

interface KeyMetricsCardsProps {
  metrics: PerformanceMetrics;
  loading: boolean;
}

export const KeyMetricsCards = ({ metrics, loading }: KeyMetricsCardsProps) => {
  const { cacheStats, compressionStats } = metrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Cache Hit Rate"
        icon={<Database className="h-4 w-4 text-blue-500" />}
        value={formatPercentage(cacheStats.hitRate)}
        loading={loading}
      />
      
      <StatCard
        label="Avg Query Time"
        icon={<Clock className="h-4 w-4 text-purple-500" />}
        value={`${Math.round(cacheStats.averageQueryTime)}ms`}
        loading={loading}
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