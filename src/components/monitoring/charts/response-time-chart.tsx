import { LineChartComponent } from "@/components/ui/line-chart";
import type { ResponseTimePoint } from "@/types/monitoring";

interface ResponseTimeChartProps {
  data: ResponseTimePoint[];
  timeRange: string;
  height?: number;
}

export const ResponseTimeChart = ({ 
  data, 
  timeRange, 
  height = 300 
}: ResponseTimeChartProps) => {
  return (
    <LineChartComponent
      data={data}
      title="Response Time Trends"
      description={`Response time metrics over ${timeRange}`}
      lines={[
        { dataKey: 'avgResponseTime', stroke: '#3b82f6', name: 'Average (ms)' },
        { dataKey: 'p95ResponseTime', stroke: '#f59e0b', name: 'P95 (ms)' },
        { dataKey: 'p99ResponseTime', stroke: '#ef4444', name: 'P99 (ms)' }
      ]}
      height={height}
      formatValue={(value) => `${value}ms`}
    />
  );
};
