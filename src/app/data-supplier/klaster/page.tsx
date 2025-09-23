import { cookies } from "next/headers";
import { apiPath } from "@/lib/base-path";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore?.toString?.() ?? "";

  let payload: any = null;
  try {
    const resp = await fetch(apiPath(`/supplier-analytics/clusters`), {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    payload = await resp.json().catch(() => null);
  } catch {}

  const data = payload?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Klaster Supplier</h1>
        <p className="text-sm text-muted-foreground">Pengelompokan vendor berdasarkan perilaku kontrak</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-md border p-4">
          <h2 className="font-medium mb-2">Large National Vendors</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(data?.largeNational || [], null, 2)}</pre>
        </div>
        <div className="rounded-md border p-4">
          <h2 className="font-medium mb-2">Local Suppliers</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(data?.localSuppliers || [], null, 2)}</pre>
        </div>
        <div className="rounded-md border p-4">
          <h2 className="font-medium mb-2">Anomalous Vendors</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(data?.anomalousVendors || [], null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
