import { StatCard } from "@/components/lazy";
import { Activity, TrendingUp, Gauge } from "lucide-react";
import type { PerformanceMetrics } from "@/types/monitoring";
import { getMemoryUsageQuality, getCpuUsageQuality, formatPercentage } from "@/utils/monitoring";

interface RealtimeTabProps {
  metrics: PerformanceMetrics;
}

export const RealtimeTab = ({ metrics }: RealtimeTabProps) => {
  const { realTimeData } = metrics;
  const memoryQuality = getMemoryUsageQuality(realTimeData.memoryUsage);
  const cpuQuality = getCpuUsageQuality(realTimeData.cpuUsage);

  const getMemoryColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCpuColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
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
          value={formatPercentage(realTimeData.memoryUsage / 100)}
          valueClassName={`mt-1 text-lg font-semibold ${getMemoryColor(memoryQuality)}`}
        />
        
        <StatCard
          label="CPU Usage"
          icon={<Gauge className="h-4 w-4 text-purple-500" />}
          value={formatPercentage(realTimeData.cpuUsage / 100)}
          valueClassName={`mt-1 text-lg font-semibold ${getCpuColor(cpuQuality)}`}
        />
      </div>
    </div>
  );
};
