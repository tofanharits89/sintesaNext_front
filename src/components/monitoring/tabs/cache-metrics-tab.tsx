import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";
import type { PerformanceMetrics } from "@/types/monitoring";
import { formatPercentage, formatNumber } from "@/utils/monitoring";

interface CacheMetricsTabProps {
  metrics: PerformanceMetrics;
}

export const CacheMetricsTab = ({ metrics }: CacheMetricsTabProps) => {
  const { cacheStats } = metrics;

  return (
    <div className="space-y-4">
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
                <span className="font-medium">{formatPercentage(cacheStats.hitRate)}</span>
              </div>
              <Progress value={cacheStats.hitRate * 100} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Hits</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(cacheStats.totalHits)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Misses</p>
                <p className="text-2xl font-bold text-red-600">{formatNumber(cacheStats.totalMisses)}</p>
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
                    <span className="font-medium">{formatPercentage(stats.hitRate)}</span>
                  </div>
                  <Progress value={stats.hitRate * 100} className="h-1" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatNumber(stats.hits)} hits</span>
                    <span>{Math.round(stats.averageQueryTime)}ms avg</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
