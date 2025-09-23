"use client";

import { Card, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { LineChartComponent } from "@/components/ui/line-chart";
import { StackedAreaChartComponent } from "@/components/ui/stacked-area-chart";
import DashboardSupplierSkeleton from "@/components/data-supplier/DashboardSupplierSkeleton";
import { useSupplierDashboard } from "@/hooks/useSupplierDashboard";

export default function DashboardSupplierClient({ selectedYear }: { selectedYear?: string }) {
  const { data, isLoading, error } = useSupplierDashboard(selectedYear);

  if (isLoading) return <DashboardSupplierSkeleton />;

  const payload = data as any;
  const d = payload?.data || {};
  const totals = d?.totals || {};

  // Clean vendor label: remove trailing "- <number>" such as "Vendor A - 3"
  const cleanVendorName = (input: unknown): string => {
    const s = String(input ?? "-");
    return s.replace(/\s*-\s*\d+\s*$/, "").trim();
  };

  const trendData: Array<{ name: string; total_kontrak: number; total_spm: number }> = Array.isArray(d?.trend)
    ? d.trend.map((t: any) => {
        const y = t.tahun ?? "";
        const m = t.bulan == null ? "" : String(t.bulan).padStart(2, "0");
        const label = m ? `${y}-${m}` : `${y}`;
        return {
          name: label,
          total_kontrak: Number(t.total_kontrak || 0),
          total_spm: Number(t.total_spm || 0),
        };
      })
    : [];

  // Format value into trillions with Rp prefix and T suffix, two decimals
  const formatTrillionsLabel = (value: number) => {
    const trillions = value / 1_000_000_000_000;
    return `Rp ${trillions.toFixed(2)}T`;
  };

  const topKontrakData: Array<{ name: string; value: number }> = Array.isArray(d?.top_vendors_by_kontrak)
    ? d.top_vendors_by_kontrak.map((v: any) => ({
        name: cleanVendorName(v.nama_vendor || v.NPWP_SUPPLIER || "-"),
        value: Number(v.total_kontrak || 0),
      }))
    : [];

  const topSpmData: Array<{ name: string; value: number }> = Array.isArray(d?.top_vendors_by_spm)
    ? d.top_vendors_by_spm.map((v: any) => ({
        name: cleanVendorName(v.nama_vendor || v.NPWP_SUPPLIER || "-"),
        value: Number(v.total_spm || 0),
      }))
    : [];

  // Combine top vendors based on kontrak (primary sorting) and attach SPM if available
  const topSpmMap = new Map<string, number>(topSpmData.map((x) => [x.name, x.value]));
  const combinedTopVendors: Array<{
    name: string;
    nilai_kontrak: number;
    nilai_spm: number;
  }> = topKontrakData
    .map((k) => ({
      name: k.name,
      nilai_kontrak: k.value,
      nilai_spm: Number(topSpmMap.get(k.name) || 0),
    }))
    .sort((a, b) => b.nilai_kontrak - a.nilai_kontrak);

  // Limit to Top 5 for Kontraktual view
  const topFiveCombined = combinedTopVendors.slice(0, 5);

  // For stacked-area display, ensure that stacked parts equal Nilai Kontrak:
  // - Part A: Nilai SPM (capped at Nilai Kontrak just in case)
  // - Part B: Sisa Kontrak = Nilai Kontrak - Nilai SPM
  const stackedTopVendors = topFiveCombined.map((v) => {
    const spmCapped = Math.max(0, Math.min(v.nilai_spm, v.nilai_kontrak));
    const sisaKontrak = Math.max(0, v.nilai_kontrak - spmCapped);
    return {
      name: v.name,
      nilai_spm: spmCapped,
      nilai_kontrak_sisa: sisaKontrak,
      // keep original for potential future use/debugging
      nilai_kontrak: v.nilai_kontrak,
    };
  });

  // Compute max kontrak to add headroom for labels above the top point
  const maxNilaiKontrak = stackedTopVendors.reduce(
    (max: number, v: { nilai_kontrak: number }) => Math.max(max, v.nilai_kontrak || 0),
    0,
  );
  const yMaxWithHeadroom = Math.ceil(maxNilaiKontrak * 1.0);

  // Use stackedTopVendors directly (no empty padding on X-axis)
  const combinedTopVendorsForChart = stackedTopVendors;

  // Build Non-Kontraktual Top Vendor data from backend: top_vendors_non_kontraktual_by_spm (already limited to top 5)
  const nonKontraktualSpm = Array.isArray(d?.top_vendors_non_kontraktual_by_spm)
    ? d.top_vendors_non_kontraktual_by_spm.map((v: any) => ({
        name: cleanVendorName(v.nama_vendor || v.NPWP_SUPPLIER || "-"),
        nilai_spm: Number(v.total_spm || 0),
      }))
    : [];

  const maxNilaiSpmNonKontraktual = nonKontraktualSpm.reduce(
    (max: number, v: { nilai_spm: number }) => Math.max(max, v.nilai_spm || 0),
    0,
  );
  const yMaxSpmWithHeadroom = Math.ceil(maxNilaiSpmNonKontraktual * 1.0);
  const nonKontraktualSpmForChart = nonKontraktualSpm;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Vendor</CardDescription>
            <CardTitle className="text-3xl">{totals?.total_vendors ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Jumlah Vendor Kontraktual</CardDescription>
            <CardTitle className="text-3xl">{totals?.vendors_kontraktual ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Jumlah Vendor Non-Kontraktual</CardDescription>
            <CardTitle className="text-3xl">{totals?.vendors_non_kontraktual ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Jumlah Kontrak</CardDescription>
            <CardTitle className="text-3xl">{totals?.total_kontrak ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Rasio Realisasi</CardDescription>
            <CardTitle className="text-3xl">{((totals?.realization_ratio ?? 0) * 100).toFixed(2)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="lg:col-span-1">
          <StackedAreaChartComponent
            data={combinedTopVendorsForChart}
            title="Top Vendor (Kontraktual)"
            description="Perbandingan Nilai Kontrak (biru) dan Nilai SPM (hijau)."
            series={[
              { dataKey: "nilai_kontrak", name: "Nilai Kontrak", color: "#0ea5e9", showLabel: true, labelPosition: "top", labelFormatter: formatTrillionsLabel },
              { dataKey: "nilai_spm", name: "Nilai SPM", color: "#10b981", stackId: "spm" },
            ]}
            height={340}
            xTickAngle={0}
            xTickFontSize={11}
            xAxisHeight={76}
            showAllXTicks
            wrapXTicks
            xTickMaxChars={12}
            yDomain={[0, yMaxWithHeadroom]}
            yAllowDecimals={false}
            xAxisPadding={{ left: 20, right: 36 }}
            chartMargin={{ top: 48, left: 16, right: 16 }}
            yHideTicks
            badgeText="Top 5"
          />
        </div>
        <div className="lg:col-span-1">
          <StackedAreaChartComponent
            data={nonKontraktualSpmForChart}
            title="Top Vendor (Non-Kontraktual)"
            description="Hanya vendor dengan Nilai SPM tanpa Nilai Kontrak."
            series={[
              { dataKey: "nilai_spm", name: "Nilai SPM", color: "#10b981", showLabel: true, labelPosition: "top", labelFormatter: formatTrillionsLabel },
            ]}
            height={340}
            xTickAngle={0}
            xTickFontSize={11}
            xAxisHeight={76}
            showAllXTicks
            wrapXTicks
            xTickMaxChars={12}
            yDomain={[0, yMaxSpmWithHeadroom]}
            yAllowDecimals={false}
            xAxisPadding={{ left: 20, right: 36 }}
            chartMargin={{ top: 48, left: 16, right: 16 }}
            yHideTicks
            badgeText="Top 5"
          />
        </div>
      </div>

      <div className="mt-6">
        <LineChartComponent
          data={trendData}
          title="Tren Nilai Kontrak dan SPM"
          description="Agregasi bulanan/tahunan berdasarkan tanggal kontrak"
          lines={[
            { dataKey: "total_kontrak", stroke: "#0ea5e9", name: "Nilai Kontrak" },
            { dataKey: "total_spm", stroke: "#10b981", name: "Nilai SPM" },
          ]}
          height={360}
          chartMargin={{ top: 10, right: 24, bottom: 0, left: 0 }}
          xAxisPadding={{ left: 10, right: 10 }}
        />
      </div>
    </>
  );
}

