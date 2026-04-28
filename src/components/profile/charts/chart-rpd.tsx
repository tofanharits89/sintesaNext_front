import type { FilterParams } from "../pilihan";

interface Props {
  query: string;
  filterParams?: FilterParams;
}

// TODO: implement chart using ApexCharts or Recharts
export default function ChartRpd({ query, filterParams }: Props) {
  return (
    <div className="flex h-36 items-center justify-center text-xs text-gray-400">
      {query ? "Memuat chart..." : "Tidak ada data"}
    </div>
  );
}
