import { LineChart, LineChartSkeleton } from "@/components/lazy";
import { transformTrenRealisasiBulanan, getTrenRealisasiLines } from "@/utils/dashboard";

interface TrenChartProps {
  data: any;
  isLoading: boolean;
  title: string;
  description: string;
  height?: number;
}

export const TrenChart = ({ 
  data, 
  isLoading, 
  title, 
  description, 
  height = 280 
}: TrenChartProps) => {
  if (isLoading) {
    return <LineChartSkeleton height={height} />;
  }

  const transformedData = transformTrenRealisasiBulanan(data);
  const lines = getTrenRealisasiLines(data);

  return (
    <LineChart
      data={transformedData}
      title={title}
      description={description}
      lines={lines}
      height={height}
      formatValue={(value) =>
        `Rp ${(value / 1000000000000).toFixed(1)} T`
      }
      legendFontSize={12}
      hideYAxisTicks
      chartMargin={{ top: 0, right: 18, bottom: 0, left: 18 }}
      xAxisPadding={{ left: 24, right: 16 }}
    />
  );
};