import { cookies } from "next/headers";
import { apiPath } from "@/lib/base-path";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams?: { [k: string]: string | string[] | undefined } }) {
  const q = (searchParams?.npwp as string) || (searchParams?.vendor as string) || "";
  const cookieStore = await cookies();
  const cookieHeader = cookieStore?.toString?.() ?? "";

  let payload: any = null;
  try {
    if (q) {
      const qp = searchParams?.npwp ? `?npwp=${encodeURIComponent(String(searchParams?.npwp))}` : `?vendor=${encodeURIComponent(String(searchParams?.vendor || q))}`;
      const resp = await fetch(apiPath(`/supplier-analytics/profile${qp}`), {
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });
      payload = await resp.json().catch(() => null);
    }
  } catch {}

  const data = payload?.data || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profil Supplier</h1>
        <p className="text-sm text-muted-foreground">Cari vendor berdasarkan NPWP_SUPPLIER atau NAMA_VENDOR</p>
      </div>

      {!q ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          Tambahkan parameter pada URL, misal: <code className="px-1 py-0.5 rounded bg-muted">?npwp=1234567890</code> atau <code className="px-1 py-0.5 rounded bg-muted">?vendor=PT%20MAJU%20JAYA</code>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-md border p-4">
            <h2 className="font-medium mb-2">Ringkasan</h2>
            <pre className="text-xs overflow-auto">{JSON.stringify(data?.supplier || {}, null, 2)}</pre>
          </div>
          <div className="rounded-md border p-4">
            <h2 className="font-medium mb-2">Riwayat Kontrak</h2>
            <pre className="text-xs overflow-auto">{JSON.stringify(data?.history || [], null, 2)}</pre>
          </div>
          <div className="rounded-md border p-4">
            <h2 className="font-medium mb-2">Daftar Kontrak (raw)</h2>
            <pre className="text-xs overflow-auto">{JSON.stringify(data?.raw_kontrak || [], null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
