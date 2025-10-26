import { cookies } from "next/headers";
import { apiPath } from "@/lib/config/base-path";

export const dynamic = "force-dynamic";

export default async function Page({ 
  searchParams 
}: { 
  searchParams?: Promise<{ [k: string]: string | string[] | undefined }> 
}) {
  const params = await searchParams;
  const lowRatio = (params?.lowRatio as string) || "0.1";
  const minKontrak = (params?.minKontrak as string) || "1000000";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore?.toString?.() ?? "";

  let payload: any = null;
  try {
    const resp = await fetch(apiPath(`/supplier-analytics/anomalies?lowRatio=${encodeURIComponent(lowRatio)}&minKontrak=${encodeURIComponent(minKontrak)}`), {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    payload = await resp.json().catch(() => null);
  } catch {}

  const data = payload?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Deteksi Anomali Supplier</h1>
        <p className="text-sm text-muted-foreground">Vendor berisiko dan kejanggalan data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-md border p-4">
          <h2 className="font-medium mb-2">Realisasi Rendah</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(data?.lowRealization || [], null, 2)}</pre>
        </div>
        <div className="rounded-md border p-4">
          <h2 className="font-medium mb-2">Fragmentasi Kontrak</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(data?.fragmentation || [], null, 2)}</pre>
        </div>
        <div className="rounded-md border p-4">
          <h2 className="font-medium mb-2">SPM &gt; Kontrak</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(data?.spmGtKontrak || [], null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
