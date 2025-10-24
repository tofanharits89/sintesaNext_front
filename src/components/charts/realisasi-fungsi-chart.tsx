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
        { dataKey: "Pagu DIPA", name: "Pagu DIPA", color: "#3b82f6" },
        { dataKey: "Realisasi", name: "Realisasi", color: "#10b981" },
      ]}
      height={height}
      formatValue={formatChartCurrency}
    />
  );
};
