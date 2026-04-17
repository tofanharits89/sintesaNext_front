"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { RingkasanLaporanModal } from "./modals/ringkasan-laporan-modal";
import { LihatKendalaModal } from "./modals/lihat-kendala-modal";
import { TransaksiKkpModal } from "./modals/transaksi-kkp-modal";
import { TagihanKkpModal } from "./modals/tagihan-kkp-modal";
import { KartuKkpModal } from "./modals/kartu-kkp-modal";
import { SatkerDetailModal } from "./modals/satker-detail-modal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { apiPath } from "@/lib/config/base-path";

// Modularized imports
import { 
  RingkasanData,
  DirektoratPaContentRef, 
  DirektoratPaContentProps 
} from "./direktorat-pa/types";

export type { 
  RingkasanData,
  DirektoratPaContentRef, 
  DirektoratPaContentProps 
};
import { 
  getRingkasanKanwilColumns, 
  getRingkasanKppnColumns, 
  getMonitoringKanwilColumns, 
  getMonitoringKppnColumns 
} from "./direktorat-pa/columns";
import { useDirektoratPaData } from "./direktorat-pa/hooks/use-direktorat-pa-data";
import { DirektoratPaFilter } from "./direktorat-pa/direktorat-pa-filter";

export const DirektoratPaContent = forwardRef<
  DirektoratPaContentRef,
  DirektoratPaContentProps
>(function DirektoratPaContent({ contentType = "ringkasan-kanwil" }, ref) {
  const { user } = useAuth();
  
  // Custom hook for data and filter logic
  const {
    ringkasanData,
    monitoringKanwilData,
    monitoringKppnData,
    isLoading,
    selectedYear,
    setSelectedYear,
    selectedKanwil,
    handleKanwilChange,
    selectedKppn,
    setSelectedKppn,
    selectedPeriode,
    setSelectedPeriode,
    handleReset,
    kanwilRefList,
    isLoadingKanwilRef,
    kppnRefList,
    isLoadingKppnRef,
    fetchRingkasanData,
  } = useDirektoratPaData(contentType);

  // Modal state
  const [isRingkasanModalOpen, setIsRingkasanModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isTransaksiModalOpen, setIsTransaksiModalOpen] = useState(false);
  const [transaksiTarget, setTransaksiTarget] = useState<{
    kdsatker: string;
    namaSatker: string;
  } | null>(null);
  const [isTagihanModalOpen, setIsTagihanModalOpen] = useState(false);
  const [tagihanTarget, setTagihanTarget] = useState<{
    kdsatker: string;
    namaSatker: string;
  } | null>(null);
  const [isKartuModalOpen, setIsKartuModalOpen] = useState(false);
  const [kartuTarget, setKartuTarget] = useState<{
    kdsatker: string;
    namaSatker: string;
  } | null>(null);
  const [isSatkerDetailModalOpen, setIsSatkerDetailModalOpen] = useState(false);
  const [satkerDetailTarget, setSatkerDetailTarget] = useState<{
    kdsatker: string;
    namaSatker?: string;
  } | null>(null);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    getData: () => ringkasanData,
    getFilters: () => ({
      selectedYear,
      selectedPeriode,
      selectedKanwil,
      selectedKppn,
      kanwilLabel: kanwilRefList.find(k => k.value === selectedKanwil)?.label || selectedKanwil,
      kppnLabel: kppnRefList.find(k => k.value === selectedKppn)?.label || selectedKppn,
    }),
  }));

  // ─── Modal Handlers ─────────────────────────────────────

  const handleViewRingkasan = async (item: any) => {
    if (item.satkerData) {
      setSelectedItem(item);
      setIsRingkasanModalOpen(true);
      return;
    }

    const initialItem = {
      kodeKppn: item.kdkppn || item.kdkanwil,
      namaKppn: item.nmkppn || item.nmlokasi,
      satkerData: [],
    };
    setSelectedItem(initialItem);
    setIsRingkasanModalOpen(true);
    setIsModalLoading(true);

    try {
      const triwulan = selectedPeriode.replace("Q", "");
      let apiUrl = "";
      let combinedItem: any = {};

      if (item.kdkppn) {
        apiUrl = apiPath(
          `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}&kdkppn=${item.kdkppn}`,
        );
        const response = await fetch(apiUrl, { credentials: "include" });
        if (!response.ok) throw new Error("Gagal mengambil data satker");
        const result = await response.json();
        const satkerData = result.data.map((satker: any, index: number) => ({
          id: `${satker.kdsatker}-${index}`,
          kodeBA: satker.kddept,
          kodeSatker: satker.kdsatker,
          namaSatker: satker.nmsatker,
          upKkpPerBulan: Number(satker.nilai_up_kkp || 0),
          porsiUpKkp: Number(satker.porsi_up_kkp_dari_total_up || 0),
          bankPenerbit: satker.bank_penerbit,
          jumlahKartu: Number(satker.jumlah_kartu || 0),
          nilaiTagihan: Number(satker.nilai_tagihan || 0),
          nilaiTransaksi: Number(satker.nilai_trans_sp2d || 0),
          kendala: satker.kendala || "",
        }));
        combinedItem = { kodeKppn: item.kdkppn, namaKppn: item.nmkppn, satkerData: satkerData };
      } else if (item.kdkanwil) {
        apiUrl = apiPath(
          `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}&kdkanwil=${item.kdkanwil}`,
        );
        const response = await fetch(apiUrl, { credentials: "include" });
        if (!response.ok) throw new Error("Gagal mengambil data satker");
        const result = await response.json();
        const satkerData = result.data.map((satker: any, index: number) => ({
          id: `${satker.kdsatker}-${index}`,
          kodeBA: satker.kddept,
          kodeSatker: satker.kdsatker,
          namaSatker: satker.nmsatker,
          upKkpPerBulan: Number(satker.nilai_up_kkp || 0),
          porsiUpKkp: Number(satker.porsi_up_kkp_dari_total_up || 0),
          bankPenerbit: satker.bank_penerbit,
          jumlahKartu: Number(satker.jumlah_kartu || 0),
          nilaiTagihan: Number(satker.nilai_tagihan || 0),
          nilaiTransaksi: Number(satker.nilai_trans_sp2d || 0),
          kendala: satker.kendala || "",
        }));
        combinedItem = { kodeKppn: item.kdkanwil, namaKppn: item.nmlokasi, satkerData: satkerData };
      } else if (item.kodeSatker) {
        combinedItem = { kodeKppn: item.kodeKppn, namaKppn: item.namaKppn, satkerData: [item] };
      }
      setSelectedItem(combinedItem);
    } catch (error) {
      console.error("Error fetching satker data:", error);
      toast.error("Gagal mengambil data detail satker");
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleViewKendala = (item: any) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  // ─── Column Handlers ────────────────────────────────────

  const columnHandlers = {
    onViewSatkerDetail: (kdsatker: string, namaSatker: string) => {
      setSatkerDetailTarget({ kdsatker, namaSatker });
      setIsSatkerDetailModalOpen(true);
    },
    onViewKartu: (kdsatker: string, namaSatker: string) => {
      setKartuTarget({ kdsatker, namaSatker });
      setIsKartuModalOpen(true);
    },
    onViewTagihan: (kdsatker: string, namaSatker: string) => {
      setTagihanTarget({ kdsatker, namaSatker });
      setIsTagihanModalOpen(true);
    },
    onViewTransaksi: (kdsatker: string, namaSatker: string) => {
      setTransaksiTarget({ kdsatker, namaSatker });
      setIsTransaksiModalOpen(true);
    },
    onViewKendala: handleViewKendala,
    onViewRingkasan: handleViewRingkasan,
  };

  const getColumnsAndData = (): { columns: any[]; data: any[] } => {
    switch (contentType) {
      case "ringkasan-kanwil": return { columns: getRingkasanKanwilColumns(columnHandlers), data: ringkasanData };
      case "ringkasan-kppn": return { columns: getRingkasanKppnColumns(columnHandlers), data: ringkasanData };
      case "monitoring-kanwil": return { columns: getMonitoringKanwilColumns(columnHandlers), data: monitoringKanwilData };
      case "monitoring-kppn": return { columns: getMonitoringKppnColumns(columnHandlers), data: monitoringKppnData };
      default: return { columns: getRingkasanKanwilColumns(columnHandlers), data: ringkasanData };
    }
  };

  const { columns, data } = getColumnsAndData();

  const getTitle = () => {
    switch (contentType) {
      case "ringkasan-kanwil": return "Ringkasan Laporan per Kanwil";
      case "ringkasan-kppn": return "Ringkasan Laporan per KPPN";
      case "monitoring-kanwil": return "Monitoring Laporan Kanwil";
      case "monitoring-kppn": return "Monitoring Laporan KPPN";
      default: return "Ringkasan Laporan per Kanwil";
    }
  };

  // Helper for dynamic filter lists
  const kanwilList = [{ value: "all", label: "Semua Kanwil" }];
  const uniqueKanwilsMap = new Map<string, string>();
  ringkasanData.forEach((d) => {
    if (d.kodeKanwil && !uniqueKanwilsMap.has(d.kodeKanwil)) {
      uniqueKanwilsMap.set(d.kodeKanwil, `${d.kodeKanwil} - ${d.namaLokasi || d.kodeKanwil}`);
    }
  });
  uniqueKanwilsMap.forEach((label, value) => kanwilList.push({ value, label }));

  const kppnList = [{ value: "all", label: "Semua KPPN" }];
  const uniqueKppnsMap = new Map<string, string>();
  ringkasanData.forEach((d) => {
    if (d.kodeKppn && !uniqueKppnsMap.has(d.kodeKppn)) {
      uniqueKppnsMap.set(d.kodeKppn, `${d.kodeKppn} - ${d.namaKppn || d.kodeKppn}`);
    }
  });
  uniqueKppnsMap.forEach((label, value) => kppnList.push({ value, label }));

  const monitoringKanwilList = [{ value: "all", label: "Semua Kanwil" }];
  const uniqueMonKanwilsMap = new Map<string, string>();
  monitoringKanwilData.forEach((d) => {
    if (d.kdkanwil && !uniqueMonKanwilsMap.has(d.kdkanwil)) {
      uniqueMonKanwilsMap.set(d.kdkanwil, `${d.kdkanwil} - ${d.nmlokasi || d.kdkanwil}`);
    }
  });
  uniqueMonKanwilsMap.forEach((label, value) => monitoringKanwilList.push({ value, label }));

  const monitoringKppnList = [{ value: "all", label: "Semua KPPN" }];
  const uniqueMonKppnsMap = new Map<string, string>();
  monitoringKppnData.forEach((d) => {
    if (d.kdkppn && !uniqueMonKppnsMap.has(d.kdkppn)) {
      uniqueMonKppnsMap.set(d.kdkppn, `${d.kdkppn} - ${d.nmkppn || d.kdkppn}`);
    }
  });
  uniqueMonKppnsMap.forEach((label, value) => monitoringKppnList.push({ value, label }));

  const activeKanwilList =
    kanwilRefList.length > 0
      ? [{ value: "all", label: "Semua Kanwil" }, ...kanwilRefList]
      : contentType === "monitoring-kanwil"
        ? monitoringKanwilList
        : kanwilList;
  const activeKppnList =
    kppnRefList.length > 0
      ? [{ value: "all", label: "Semua KPPN" }, ...kppnRefList]
      : contentType === "monitoring-kppn"
        ? monitoringKppnList
        : kppnList;

  return (
    <div className="space-y-6">
      <DirektoratPaFilter
        contentType={contentType}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedKanwil={selectedKanwil}
        onKanwilChange={handleKanwilChange}
        selectedKppn={selectedKppn}
        setSelectedKppn={setSelectedKppn}
        selectedPeriode={selectedPeriode}
        setSelectedPeriode={setSelectedPeriode}
        handleReset={handleReset}
        activeKanwilList={activeKanwilList}
        activeKppnList={activeKppnList}
        isLoadingKanwilRef={isLoadingKanwilRef}
        isLoadingKppnRef={isLoadingKppnRef}
      />

      <Card>
        <CardHeader><CardTitle>{getTitle()}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <TableSkeleton rows={10} /> : (
            <DataTable 
              columns={columns} 
              data={data} 
              initialPageSize={25} 
              showFooter={contentType === "monitoring-kanwil" || contentType === "monitoring-kppn"}
            />
          )}
        </CardContent>
      </Card>

      <RingkasanLaporanModal 
        open={isRingkasanModalOpen} 
        onOpenChange={setIsRingkasanModalOpen} 
        data={selectedItem} 
        periode={selectedPeriode} 
        isLoading={isModalLoading} 
      />
      <LihatKendalaModal 
        open={isViewModalOpen} 
        onOpenChange={setIsViewModalOpen} 
        data={selectedItem} 
        tahun={selectedYear}
        triwulan={selectedPeriode.replace("Q", "")}
      />
      <TransaksiKkpModal 
        open={isTransaksiModalOpen} 
        onOpenChange={setIsTransaksiModalOpen} 
        kdsatker={transaksiTarget?.kdsatker ?? ""} 
        {...(transaksiTarget?.namaSatker ? { namaSatker: transaksiTarget.namaSatker } : {})} 
        tahun={selectedYear} 
        triwulan={selectedPeriode.replace("Q", "")} 
      />
      <TagihanKkpModal 
        open={isTagihanModalOpen} 
        onOpenChange={setIsTagihanModalOpen} 
        kdsatker={tagihanTarget?.kdsatker ?? ""} 
        {...(tagihanTarget?.namaSatker ? { namaSatker: tagihanTarget.namaSatker } : {})} 
        tahun={selectedYear} 
        triwulan={selectedPeriode.replace("Q", "")} 
      />
      <KartuKkpModal 
        open={isKartuModalOpen} 
        onOpenChange={setIsKartuModalOpen} 
        kdsatker={kartuTarget?.kdsatker ?? ""} 
        {...(kartuTarget?.namaSatker ? { namaSatker: kartuTarget.namaSatker } : {})} 
        tahun={selectedYear} 
      />
      <SatkerDetailModal 
        open={isSatkerDetailModalOpen} 
        onOpenChange={setIsSatkerDetailModalOpen} 
        kdsatker={satkerDetailTarget?.kdsatker ?? ""} 
        namaSatker={satkerDetailTarget?.namaSatker ?? ""} 
        tahun={selectedYear} 
        onSaved={fetchRingkasanData} 
      />
    </div>
  );
});
