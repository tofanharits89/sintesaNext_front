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
import YearFilter from "./year-filter";
import { Info } from "lucide-react";
import { SupplierEntityDetailModal, SupplierEntityDetailType, SupplierEntityDetailItem } from "./SupplierEntityDetailModal";

interface SupplierProfileClientProps {
  years?: number[];
  selectedYear?: string;
}

export default function SupplierProfileClient({ years, selectedYear }: SupplierProfileClientProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const vendor = searchParams?.get("vendor")?.trim() || undefined;

  const initialQuery = vendor || "";

  const availableYears = React.useMemo(() => {
    if (Array.isArray(years) && years.length > 0) {
      return [...years].sort((a, b) => b - a);
    }
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear];
  }, [years]);

  const yearFromParams = searchParams?.get("year") || undefined;
  const validYearFromParams = yearFromParams && /^\d{4}$/.test(yearFromParams) ? yearFromParams : undefined;
  const fallbackYear = selectedYear && /^\d{4}$/.test(selectedYear)
    ? selectedYear
    : String(availableYears[0] ?? new Date().getFullYear());
  const activeYear = validYearFromParams ?? fallbackYear;

  const { data, isLoading, isError, error, isFetching } = useSupplierProfile({
    ...(vendor ? { vendor } : {}),
    limit: 100,
    year: activeYear,
  });
  const supplier = data?.data?.supplier;
  const kontrak = data?.data?.raw_kontrak || [];

  const [detailModalType, setDetailModalType] = React.useState<SupplierEntityDetailType | undefined>(undefined);
  const [detailModalItems, setDetailModalItems] = React.useState<SupplierEntityDetailItem[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  const filteredKontrak = React.useMemo(() => {
    if (!Array.isArray(kontrak) || kontrak.length === 0) return [] as any[];
    const year = activeYear;
    if (!year) return kontrak;

    return kontrak.filter((row) => {
      const rawYear = row?.TAHUN ?? row?.tahun ?? row?.Tahun ?? row?.TAHUN_KONTRAK ?? row?.tahun_kontrak;
      if (rawYear == null) return false;
      if (typeof rawYear === "number") return String(rawYear) === year;
      if (typeof rawYear === "string") return rawYear.trim() === year;
      return false;
    });
  }, [kontrak, activeYear]);

  const {
    kontraktualRows,
    nonKontraktualRows,
    totalNilaiKontrak,
    totalNilaiSpmKontraktual,
    totalNilaiSpmNonKontraktual,
    kementerianCount,
    kementerianItems,
    satkerItems,
    kppnItems,
  } = React.useMemo(() => {
    const kontraktual: any[] = [];
    const nonKontraktual: any[] = [];
    let kontrakTotal = 0;
    let spmKontraktualTotal = 0;
    let spmNonKontraktualTotal = 0;
    const kementerianSet = new Set<string>();
    const kementerianMap = new Map<string, SupplierEntityDetailItem>();
    const satkerMap = new Map<string, SupplierEntityDetailItem>();
    const kppnMap = new Map<string, SupplierEntityDetailItem>();

    filteredKontrak.forEach((row) => {
      const rawNomor = row?.NOMOR_KONTRAK ?? row?.nomor_kontrak;
      const trimmedNomor = typeof rawNomor === "string" ? rawNomor.trim() : rawNomor;
      const isKontraktual = Boolean(trimmedNomor);
      const nilaiKontrak = Number(row?.NILAI_KONTRAK ?? row?.nilai_kontrak ?? 0);
      const nilaiSpm = Number(row?.NILAI_SPM ?? row?.nilai_spm ?? 0);
      const kontrakValue = Number.isFinite(nilaiKontrak) ? nilaiKontrak : 0;
      const spmValue = Number.isFinite(nilaiSpm) ? nilaiSpm : 0;
      const rawKodeBa = row?.KODE_BA ?? row?.kode_ba;
      const kodeBa = typeof rawKodeBa === "string" ? rawKodeBa.trim() : rawKodeBa;
      if (kodeBa) {
        kementerianSet.add(String(kodeBa));
        const key = String(kodeBa);
        const next = kementerianMap.get(key) ?? {
          code: key,
          name: row?.NAMA_BA ?? row?.nama_ba ?? null,
          extra: row?.NAMA_ESELON_1 ?? row?.nama_eselon_1 ?? null,
          count: 0,
        };
        next.count = (next.count ?? 0) + 1;
        if (!next.name && (row?.NAMA_BA || row?.nama_ba)) {
          next.name = (row?.NAMA_BA ?? row?.nama_ba) ?? null;
        }
        kementerianMap.set(key, next);
      }

      const satkerCodeRaw = row?.KODE_SATKER ?? row?.kode_satker ?? row?.KDSATKER;
      const satkerCode = typeof satkerCodeRaw === "string" ? satkerCodeRaw.trim() : satkerCodeRaw;
      if (satkerCode) {
        const key = String(satkerCode);
        const next = satkerMap.get(key) ?? {
          code: key,
          name: row?.NAMA_SATKER ?? row?.nama_satker ?? row?.SATKER ?? null,
          extra: row?.NAMA_KANWIL ?? row?.nama_kanwil ?? null,
          count: 0,
        };
        next.count = (next.count ?? 0) + 1;
        if (!next.name && (row?.NAMA_SATKER || row?.nama_satker || row?.SATKER)) {
          next.name = (row?.NAMA_SATKER ?? row?.nama_satker ?? row?.SATKER) ?? null;
        }
        satkerMap.set(key, next);
      }

      const kppnCodeRaw = row?.KODE_KPPN ?? row?.kode_kppn;
      const kppnCode = typeof kppnCodeRaw === "string" ? kppnCodeRaw.trim() : kppnCodeRaw;
      if (kppnCode) {
        const key = String(kppnCode);
        const next = kppnMap.get(key) ?? {
          code: key,
          name: row?.NAMA_KPPN ?? row?.nama_kppn ?? null,
          extra: row?.NAMA_KANWIL ?? row?.nama_kanwil ?? null,
          count: 0,
        };
        next.count = (next.count ?? 0) + 1;
        if (!next.name && (row?.NAMA_KPPN || row?.nama_kppn)) {
          next.name = (row?.NAMA_KPPN ?? row?.nama_kppn) ?? null;
        }
        kppnMap.set(key, next);
      }

      if (isKontraktual) {
        kontraktual.push(row);
        kontrakTotal += kontrakValue;
        spmKontraktualTotal += spmValue;
      } else {
        nonKontraktual.push(row);
        spmNonKontraktualTotal += spmValue;
      }
    });

    return {
      kontraktualRows: kontraktual,
      nonKontraktualRows: nonKontraktual,
      totalNilaiKontrak: kontrakTotal,
      totalNilaiSpmKontraktual: spmKontraktualTotal,
      totalNilaiSpmNonKontraktual: spmNonKontraktualTotal,
      kementerianCount: kementerianSet.size,
      kementerianItems: Array.from(kementerianMap.values()).sort((a, b) => (b.count ?? 0) - (a.count ?? 0)),
      satkerItems: Array.from(satkerMap.values()).sort((a, b) => (b.count ?? 0) - (a.count ?? 0)),
      kppnItems: Array.from(kppnMap.values()).sort((a, b) => (b.count ?? 0) - (a.count ?? 0)),
    };
  }, [filteredKontrak]);

  const loadingState = isLoading || isFetching;

  const handleSearch = React.useCallback(
    (q: { vendor?: string; raw: string }) => {
      const sp = new URLSearchParams(searchParams?.toString() || "");
      if (q.vendor && q.vendor.trim()) {
        sp.set("vendor", q.vendor.trim());
      } else {
        sp.delete("vendor");
      }
      sp.delete("npwp");
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const openModalFor = React.useCallback(
    (type: SupplierEntityDetailType) => {
      let items: SupplierEntityDetailItem[] = [];
      if (type === "kementerian") items = kementerianItems;
      if (type === "satker") items = satkerItems;
      if (type === "kppn") items = kppnItems;
      setDetailModalItems(items);
      setDetailModalType(type);
      setIsDetailModalOpen(true);
    },
    [kementerianItems, satkerItems, kppnItems]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Profil Supplier</h1>
            <p className="text-sm text-muted-foreground">Cari vendor berdasarkan NPWP_SUPPLIER atau NAMA_VENDOR</p>
          </div>
          {availableYears.length > 0 ? (
            <YearFilter years={availableYears} selectedYear={activeYear} />
          ) : null}
        </div>

        <SupplierProfileSearch initialQuery={initialQuery} onSearch={handleSearch} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loadingState ? (
          <Card className="p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={`identity-skel-${idx}`} className="h-20" />
              ))}
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
            namaVendor={supplier?.nama_vendor ?? null}
            npwpSupplier={supplier?.npwp ?? null}
            totalNilaiKontrak={totalNilaiKontrak}
            totalNilaiSpmKontraktual={totalNilaiSpmKontraktual}
            totalNilaiSpmNonKontraktual={totalNilaiSpmNonKontraktual}
            kementerianCount={kementerianItems.length}
            realizationRatio={supplier?.realization_ratio ?? 0}
            satkersServed={satkerItems.length}
            regionsServed={kppnItems.length}
            onShowKementerian={kementerianItems.length > 0 ? () => openModalFor("kementerian") : (() => {})}
            onShowSatker={satkerItems.length > 0 ? () => openModalFor("satker") : (() => {})}
            onShowKppn={kppnItems.length > 0 ? () => openModalFor("kppn") : (() => {})}
            kementerianDetailAvailable={kementerianItems.length > 0}
            satkerDetailAvailable={satkerItems.length > 0}
            kppnDetailAvailable={kppnItems.length > 0}
          />
        )}

        <div className="space-y-3">
          <Separator />
          <SupplierContractsTable rows={loadingState ? [] : kontraktualRows} loading={loadingState} />
          <SupplierContractsTable
            rows={loadingState ? [] : nonKontraktualRows}
            loading={loadingState}
            title="List Transaksi Non-Kontraktual"
            description="Transaksi tanpa nomor kontrak"
            footerLabel="Transaksi Non-Kontraktual"
          />
        </div>
      </div>

      <SupplierEntityDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        type={detailModalType ?? "kementerian"}
        items={detailModalItems}
      />
    </div>
  );
}
