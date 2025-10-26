import { cookies } from "next/headers";
import { apiPath } from "@/lib/config/base-path";
import { backendPath } from "@/lib/api/backend";
import { Card, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { LineChartComponent } from "@/components/ui/line-chart";
import { BarChartComponent } from "@/components/ui/bar-chart";

export default async function DashboardContent({ selectedYear }: { selectedYear: string }) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${encodeURIComponent(c.name)}=${encodeURIComponent(c.value)}`)
    .join("; ");

  const qs = selectedYear && /^\d{4}$/.test(selectedYear) ? `?year=${encodeURIComponent(selectedYear)}` : "";
  let payload: any = {};
  // Try via Next proxy first
  try {
    const resp = await fetch(apiPath(`/supplier-analytics/dashboard${qs}`), {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    payload = await resp.json().catch(() => ({} as any));
  } catch {}
  // Fallback to backend directly with explicit cookies if proxy failed or returned empty
  if (!payload || Object.keys(payload).length === 0) {
    try {
      const resp2 = await fetch(backendPath(`/supplier-analytics/dashboard${qs}`), {
        headers: cookieHeader ? { cookie: cookieHeader } : {},
        cache: "no-store",
        next: { revalidate: 0 },
      });
      payload = await resp2.json().catch(() => ({} as any));
    } catch {}
  }

  const data = payload?.data || {};
  const totals = data?.totals || {};

  // Clean vendor label: remove trailing "- <number>" such as "Vendor A - 3"
  const cleanVendorName = (input: unknown): string => {
    const s = String(input ?? "-");
    return s.replace(/\s*-\s*\d+\s*$/, "").trim();
  };

  const trendData: Array<{ name: string; total_kontrak: number; total_spm: number }> = Array.isArray(data?.trend)
    ? data.trend.map((t: any) => {
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

  const topKontrakData: Array<{ name: string; value: number }> = Array.isArray(data?.top_vendors_by_kontrak)
    ? data.top_vendors_by_kontrak.map((v: any) => ({
        name: cleanVendorName(v.nama_vendor || v.NPWP_SUPPLIER || "-"),
        value: Number(v.total_kontrak || 0),
      }))
    : [];

  const topSpmData: Array<{ name: string; value: number }> = Array.isArray(data?.top_vendors_by_spm)
    ? data.top_vendors_by_spm.map((v: any) => ({
        name: cleanVendorName(v.nama_vendor || v.NPWP_SUPPLIER || "-"),
        value: Number(v.total_spm || 0),
      }))
    : [];

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BarChartComponent
          data={topKontrakData}
          title="Top Vendor (Nilai Kontrak)"
          description="10 Vendor teratas berdasarkan total nilai kontrak"
          dataKey="value"
          nameKey="name"
          color="#0ea5e9"
          height={320}
          xTickAngle={-45}
          xTickFontSize={11}
          xAxisHeight={80}
          showAllXTicks
        />
        <BarChartComponent
          data={topSpmData}
          title="Top Vendor (Nilai SPM)"
          description="10 Vendor teratas berdasarkan total nilai SPM"
          dataKey="value"
          nameKey="name"
          color="#10b981"
          height={320}
          xTickAngle={-45}
          xTickFontSize={11}
          xAxisHeight={80}
          showAllXTicks
        />
      </div>

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
    </>
  );
}

