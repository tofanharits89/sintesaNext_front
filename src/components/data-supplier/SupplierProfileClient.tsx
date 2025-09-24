"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SupplierProfileSearch } from "./SupplierProfileSearch";
import { SupplierIdentityCard } from "./SupplierIdentityCard";
import { SupplierContractsTable } from "./SupplierContractsTable";
import { useSupplierProfile } from "@/hooks/useSupplierProfile";
import { Info } from "lucide-react";

export default function SupplierProfileClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const npwp = searchParams?.get("npwp") || undefined;
  const vendor = searchParams?.get("vendor") || undefined;

  const initialQuery = npwp || vendor || "";

  const { data, isLoading, isError, error } = useSupplierProfile({ npwp, vendor, limit: 100 });
  const supplier = data?.data?.supplier;
  const kontrak = data?.data?.raw_kontrak || [];

  const handleSearch = React.useCallback(
    (q: { npwp?: string; vendor?: string; raw: string }) => {
      const sp = new URLSearchParams(searchParams?.toString() || "");
      if (q.npwp) {
        sp.set("npwp", q.npwp);
        sp.delete("vendor");
      } else if (q.vendor) {
        sp.set("vendor", q.vendor);
        sp.delete("npwp");
      } else {
        sp.delete("npwp");
        sp.delete("vendor");
      }
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Profil Supplier</h1>
        <p className="text-sm text-muted-foreground">Cari vendor berdasarkan NPWP_SUPPLIER atau NAMA_VENDOR</p>
      </div>

      <SupplierProfileSearch initialQuery={initialQuery} onSearch={handleSearch} />

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <Card className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </Card>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertTitle>Gagal memuat</AlertTitle>
            <AlertDescription>
              {error?.message || "Terjadi kesalahan saat memuat profil supplier."}
            </AlertDescription>
          </Alert>
        ) : !supplier ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Belum ada pencarian</AlertTitle>
            <AlertDescription>
              Masukkan "NPWP" atau "Nama Supplier" pada kolom pencarian, lalu tekan Enter atau klik tombol Cari.
            </AlertDescription>
          </Alert>
        ) : (
          <SupplierIdentityCard
            namaVendor={supplier?.nama_vendor}
            npwpSupplier={supplier?.npwp}
            totalKontrak={supplier?.total_kontrak}
            totalSpm={supplier?.total_spm}
            realizationRatio={supplier?.realization_ratio}
            satkersServed={supplier?.satkers_served}
            regionsServed={supplier?.regions_served}
          />
        )}

        <div className="space-y-3">
          <Separator />
          <SupplierContractsTable rows={kontrak} loading={isLoading} />
        </div>
      </div>
    </div>
  );
}
