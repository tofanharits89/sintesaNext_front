import { cookies } from "next/headers";
import { apiPath } from "@/lib/base-path";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore?.toString?.() ?? "";

  let payload: any = null;
  try {
    const resp = await fetch(apiPath(`/supplier-analytics/network`), {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    payload = await resp.json().catch(() => null);
  } catch {}

  const data = payload?.data || { nodes: [], links: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Jaringan Supplier</h1>
        <p className="text-sm text-muted-foreground">Relasi vendor ↔ satker ↔ KPPN</p>
      </div>

      <div className="rounded-md border p-4">
        <h2 className="font-medium mb-2">Graph (nodes/links)</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
