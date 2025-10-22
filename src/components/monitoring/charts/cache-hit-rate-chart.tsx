import { LineChartComponent } from "@/components/ui/line-chart";
import type { HitRatePoint } from "@/types/monitoring";

interface CacheHitRateChartProps {
  data: HitRatePoint[];
  timeRange: string;
  height?: number;
}

export const CacheHitRateChart = ({ 
  data, 
  timeRange, 
  height = 300 
}: CacheHitRateChartProps) => {
  return (
    <LineChartComponent
      data={data}
      title="Cache Hit Rate Trend"
      description={`Hit rate performance over ${timeRange}`}
      lines={[
        { dataKey: 'hitRate', stroke: '#10b981', name: 'Hit Rate (%)' },
        { dataKey: 'missRate', stroke: '#ef4444', name: 'Miss Rate (%)' }
      ]}
      height={height}
      formatValue={(value) => `${value}%`}
    />
  );
};