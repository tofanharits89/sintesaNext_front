import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { 
  CacheHitRateChart, 
  ResponseTimeChart, 
  CompressionChart, 
  ErrorRateChart 
} from "@/components/monitoring/charts";
import type { PerformanceMetrics, HistoricalData, TimeRange } from "@/types/monitoring";
import { getPerformanceInsights } from "@/utils/monitoring";

interface AnalyticsTabProps {
  metrics: PerformanceMetrics;
  historicalData: HistoricalData;
  selectedTimeRange: TimeRange;
}

export const AnalyticsTab = ({ 
  metrics, 
  historicalData, 
  selectedTimeRange 
}: AnalyticsTabProps) => {
  const insights = getPerformanceInsights(metrics);

  const getInsightColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200';
      case 'blue': return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200';
      case 'purple': return 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-200';
      default: return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200';
    }
  };

  const getInsightDotColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CacheHitRateChart
          data={historicalData.hitRateHistory}
          timeRange={selectedTimeRange}
        />
        
        <ResponseTimeChart
          data={historicalData.responseTimeHistory}
          timeRange={selectedTimeRange}
        />
        
        <CompressionChart
          data={historicalData.compressionHistory}
          timeRange={selectedTimeRange}
        />
        
        <ErrorRateChart
          data={historicalData.errorRateHistory}
          timeRange={selectedTimeRange}
        />
      </div>
      
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
            {insights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.color)}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 ${getInsightDotColor(insight.color)} rounded-full`}></div>
                  <span className="font-medium">{insight.title}</span>
                </div>
                <p className="text-sm">{insight.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};