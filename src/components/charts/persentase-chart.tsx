import { BarChart, BarChartSkeleton } from "@/components/lazy";
import { transformPersentaseKL } from "@/utils/dashboard";

interface PersentaseChartProps {
  data: any;
  isLoading: boolean;
  title: string;
  description: string;
  height?: number;
}

export const PersentaseChart = ({ 
  data, 
  isLoading, 
  title, 
  description, 
  height = 360 
}: PersentaseChartProps) => {
  if (isLoading) {
    return <BarChartSkeleton height={height} />;
  }

  const transformedData = transformPersentaseKL(data);

  return (
    <BarChart
      data={transformedData}
      title={title}
      description={description}
      color="#0ea5e9"
      height={height}
      formatValue={(v) => `${Number(v).toFixed(2)}%`}
      formatTooltipLabel={(d) => `${d.kode_ba} - ${d.nama_ba}`}
      xTickAngle={-90}
      xTickFontSize={10}
      xAxisHeight={30}
      showAllXTicks
    />
  );
};