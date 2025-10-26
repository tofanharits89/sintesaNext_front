import { BarChartComponent } from "@/components/ui/bar-chart";
import type { CompressionPoint } from "@/types/monitoring";

interface CompressionChartProps {
  data: CompressionPoint[];
  timeRange: string;
  height?: number;
}

export const CompressionChart = ({ 
  data, 
  timeRange, 
  height = 300 
}: CompressionChartProps) => {
  return (
    <BarChartComponent
      data={data}
      title="Compression Efficiency"
      description={`Compression ratios over ${timeRange}`}
      dataKey="compressionRatio"
      color="#8b5cf6"
      height={height}
      formatValue={(value) => `${value}%`}
    />
  );
};
