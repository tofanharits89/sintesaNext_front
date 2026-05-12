import {
  RealizationChart,
  KLPaguChart,
  KLProgramChart,
  TrenChart,
  RealisasiFungsiChart,
  PersentaseChart,
} from "@/components/charts";
import { Suspense } from "react";
import {
  MultipleBarChartSkeleton,
  LineChartSkeleton,
  BarChartSkeleton,
} from "@/components/ui/dashboard-skeletons";
import type { DashboardDataHooks } from "@/hooks/dashboard/use-dashboard-data";

interface ChartsSectionProps {
  data: DashboardDataHooks;
}

export const ChartsSection = ({ data }: ChartsSectionProps) => {
  return (
    <>
      {/* Second Row: 3 Cards with Bar Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Suspense fallback={<MultipleBarChartSkeleton height={250} />}>
          <RealizationChart
            data={data.realisasiJenisBelanjaData.data}
            isLoading={data.realisasiJenisBelanjaData.isLoading}
            title="Realisasi K/L per Jenis Belanja"
            description="Perbandingan Pagu DIPA vs Realisasi (Triliun Rp)"
          />
        </Suspense>
        <Suspense fallback={<MultipleBarChartSkeleton height={250} />}>
          <KLPaguChart
            data={data.klPaguTerbesarData.data}
            isLoading={data.klPaguTerbesarData.isLoading}
            title="Realisasi K/L dengan Pagu DIPA Terbesar"
            description="Perbandingan Pagu DIPA vs Realisasi (Triliun Rp)"
          />
        </Suspense>
        <Suspense fallback={<MultipleBarChartSkeleton height={250} />}>
          <KLProgramChart
            data={data.realisasiKLPaguProgramTerbesarData.data}
            isLoading={data.realisasiKLPaguProgramTerbesarData.isLoading}
            title="Realisasi K/L dengan Pagu Program Terbesar"
            description="Perbandingan Pagu DIPA vs Realisasi (Triliun Rp)"
          />
        </Suspense>
      </div>

      {/* Third Row: 2 Cards with Line Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<LineChartSkeleton height={280} />}>
          <TrenChart
            data={data.trenRealisasiBulananData.data}
            isLoading={data.trenRealisasiBulananData.isLoading}
            title="Tren Realisasi Bulanan K/L Per Jenis Belanja"
            description="Realisasi bulanan per jenis belanja 2025 (Triliun Rp)"
          />
        </Suspense>
        <Suspense fallback={<MultipleBarChartSkeleton height={280} />}>
          <RealisasiFungsiChart
            data={data.realisasiKLPerFungsi.data}
            isLoading={data.realisasiKLPerFungsi.isLoading}
            title="Realisasi K/L per Fungsi"
            description="Perbandingan Pagu DIPA vs Realisasi (Triliun Rp)"
          />
        </Suspense>
      </div>

      {/* Fourth Row: Large Bar Chart */}
      <Suspense fallback={<BarChartSkeleton height={360} />}>
        <PersentaseChart
          data={data.persentaseKLData.data}
          isLoading={data.persentaseKLData.isLoading}
          title="Persentase Realisasi K/L"
          description="Persentase realisasi terhadap Pagu DIPA per K/L (%)"
        />
      </Suspense>
    </>
  );
};
