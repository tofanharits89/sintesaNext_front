import { cookies } from "next/headers";
import { apiPath } from "@/lib/config/base-path";

export const dynamic = "force-dynamic";

export default async function Page({ 
  searchParams 
}: { 
  searchParams?: Promise<{ [k: string]: string | string[] | undefined }> 
}) {
  const params = await searchParams;
  const level = (params?.level as string) || "satker"; // "ba" or "satker"
  const top = (params?.top as string) || "10";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore?.toString?.() ?? "";

  let payload: any = null;
  try {
    const resp = await fetch(apiPath(`/supplier-analytics/concentration?level=${encodeURIComponent(level)}&top=${encodeURIComponent(top)}`), {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    payload = await resp.json().catch(() => null);
  } catch {}

  const data = payload?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Konsentrasi Supplier</h1>
        <p className="text-sm text-muted-foreground">% share vendor teratas per BA/Satker dengan Pareto</p>
      </div>

      <div className="rounded-md border p-4">
        <div className="text-sm text-muted-foreground">Parameter</div>
        <div className="text-sm">level: <b>{level}</b>, top: <b>{top}</b></div>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="font-medium mb-2">Ringkasan</h2>
        <div className="text-sm">Pareto 80% tercapai di: <b>{data?.paretoCount ?? '-'}</b> entri</div>
        <div className="text-sm">Total Nilai Kontrak: <b>{data?.totalKontrak ?? 0}</b></div>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="font-medium mb-2">Items</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(data?.items || [], null, 2)}</pre>
      </div>
    </div>
  );
}
