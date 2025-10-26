import { LineChartComponent } from "@/components/ui/line-chart";
import type { ErrorRatePoint } from "@/types/monitoring";

interface ErrorRateChartProps {
  data: ErrorRatePoint[];
  timeRange: string;
  height?: number;
}

export const ErrorRateChart = ({ 
  data, 
  timeRange, 
  height = 300 
}: ErrorRateChartProps) => {
  return (
    <LineChartComponent
      data={data}
      title="Error Rate Analysis"
      description={`Error rates and success metrics over ${timeRange}`}
      lines={[
        { dataKey: 'errorRate', stroke: '#ef4444', name: 'Error Rate (%)' },
        { dataKey: 'successRate', stroke: '#10b981', name: 'Success Rate (%)' }
      ]}
      height={height}
      formatValue={(value) => `${value}%`}
    />
  );
};
