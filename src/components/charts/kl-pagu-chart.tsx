import { MultipleBarChart } from "@/components/lazy";
import { MultipleBarChartSkeleton } from "@/components/ui/dashboard-skeletons";
import { formatChartCurrency } from "@/utils/formatters";
import { transformKLPaguTerbesar } from "@/utils/dashboard";

interface KLPaguChartProps {
  data: any;
  isLoading: boolean;
  title: string;
  description: string;
  height?: number;
}

export const KLPaguChart = ({ 
  data, 
  isLoading, 
  title, 
  description, 
  height = 250 
}: KLPaguChartProps) => {
  if (isLoading) {
    return <MultipleBarChartSkeleton height={height} />;
  }

  const transformedData = transformKLPaguTerbesar(data);

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
