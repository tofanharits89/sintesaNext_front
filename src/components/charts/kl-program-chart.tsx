import { MultipleBarChart } from "@/components/lazy";
import { MultipleBarChartSkeleton } from "@/components/ui/dashboard-skeletons";
import { formatChartCurrency } from "@/utils/formatters";
import { transformKLPaguProgramTerbesar } from "@/utils/dashboard";

interface KLProgramChartProps {
  data: any;
  isLoading: boolean;
  title: string;
  description: string;
  height?: number;
}

export const KLProgramChart = ({ 
  data, 
  isLoading, 
  title, 
  description, 
  height = 250 
}: KLProgramChartProps) => {
  if (isLoading) {
    return <MultipleBarChartSkeleton height={height} />;
  }

  const transformedData = transformKLPaguProgramTerbesar(data);

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
