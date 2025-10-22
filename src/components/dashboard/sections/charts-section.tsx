import {
  RealizationChart,
  KLPaguChart,
  KLProgramChart,
  TrenChart,
  RealisasiFungsiChart,
  PersentaseChart,
} from "@/components/charts";
import type { DashboardDataHooks } from "@/hooks/dashboard/use-dashboard-data";

interface ChartsSectionProps {
  data: DashboardDataHooks;
}

export const ChartsSection = ({ data }: ChartsSectionProps) => {
  return (
    <>
      {/* Second Row: 3 Cards with Bar Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <RealizationChart
          data={data.realisasiJenisBelanjaData.data}
          isLoading={data.realisasiJenisBelanjaData.isLoading}
          title="Realisasi per Jenis Belanja"
          description="Perbandingan Pagu DIPA vs Realisasi (Triliun Rp)"
        />
        <KLPaguChart
          data={data.klPaguTerbesarData.data}
          isLoading={data.klPaguTerbesarData.isLoading}
          title="Realisasi K/L dengan Pagu DIPA Terbesar"
          description="Perbandingan Pagu DIPA vs Realisasi (Triliun Rp)"
        />
        <KLProgramChart
          data={data.realisasiKLPaguProgramTerbesarData.data}
          isLoading={data.realisasiKLPaguProgramTerbesarData.isLoading}
          title="Realisasi K/L dengan Pagu Program Terbesar"
          description="Perbandingan Pagu DIPA vs Realisasi (Triliun Rp)"
        />
      </div>

      {/* Third Row: 2 Cards with Line Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <TrenChart
          data={data.trenRealisasiBulananData.data}
          isLoading={data.trenRealisasiBulananData.isLoading}
          title="Tren Realisasi Bulanan Per Jenis Belanja"
          description="Realisasi bulanan per jenis belanja 2025 (Triliun Rp)"
        />
        <RealisasiFungsiChart
          data={data.realisasiKLPerFungsi.data}
          isLoading={data.realisasiKLPerFungsi.isLoading}
          title="Realisasi K/L per Fungsi"
          description="Perbandingan Pagu DIPA vs Realisasi (Triliun Rp)"
        />
      </div>

      {/* Fourth Row: Large Bar Chart */}
      <PersentaseChart
        data={data.persentaseKLData.data}
        isLoading={data.persentaseKLData.isLoading}
        title="Persentase Realisasi K/L"
        description="Persentase realisasi terhadap Pagu DIPA per K/L (%)"
      />
    </>
  );
};