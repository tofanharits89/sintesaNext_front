import { MultipleBarChart } from "@/components/lazy";
import { MultipleBarChartSkeleton } from "@/components/ui/dashboard-skeletons";
import { formatChartCurrency } from "@/utils/formatters";
import { transformRealisasiKLPerFungsi } from "@/utils/dashboard";

interface RealisasiFungsiChartProps {
  data: any;
  isLoading: boolean;
  title: string;
  description: string;
  height?: number;
}

export const RealisasiFungsiChart = ({ 
  data, 
  isLoading, 
  title, 
  description, 
  height = 280 
}: RealisasiFungsiChartProps) => {
  if (isLoading) {
    return <MultipleBarChartSkeleton height={height} />;
  }

  const transformedData = transformRealisasiKLPerFungsi(data);

  return (
    <MultipleBarChart
      data={transformedData}
      title={title}
      description={description}
      series={[
        { dataKey: "Realisasi", name: "Realisasi", color: "var(--chart-realisasi)", labelColor: "var(--chart-realisasi-label)", stackId: "a", radius: 6 },
        { dataKey: "Sisa Pagu", name: "Sisa Pagu", color: "var(--chart-sisa-pagu)", labelColor: "var(--chart-sisa-pagu-label)", stackId: "a", radius: 6 },
      ]}
      height={height}
      formatValue={formatChartCurrency}
    />
  );
};
