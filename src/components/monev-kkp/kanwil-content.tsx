"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { RingkasanLaporanModal } from "./modals/ringkasan-laporan-modal";
import { KendalaHambatanModal } from "./modals/kendala-hambatan-modal";
import { LihatKendalaModal } from "./modals/lihat-kendala-modal";
import { TransaksiKkpModal } from "./modals/transaksi-kkp-modal";
import { TagihanKkpModal } from "./modals/tagihan-kkp-modal";
import { KartuKkpModal } from "./modals/kartu-kkp-modal";
import { SatkerDetailModal } from "./modals/satker-detail-modal";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { apiPath } from "@/lib/config/base-path";

// Modularized imports
import { 
  KanwilContentProps, 
  KanwilContentRef,
  RingkasanKanwilData,
  MonitoringKppnData 
} from "./kanwil/types";

export type { 
  KanwilContentProps, 
  KanwilContentRef,
  RingkasanKanwilData,
  MonitoringKppnData
};
import { 
  getRingkasanColumns, 
  getMonitoringColumns 
} from "./kanwil/columns";
import { useKanwilData } from "./kanwil/hooks/use-kanwil-data";
import { KanwilFilter } from "./kanwil/kanwil-filter";

export const KanwilContent = forwardRef<KanwilContentRef, KanwilContentProps>(
  function KanwilContent(
    {
      contentType = "monitoring",
      statusLaporan = "not_sent",
      kppnCompletionStatus = "incomplete",
      onPeriodeChange,
    },
    ref,
  ) {
    const {
      ringkasanData,
      monitoringData,
      isLoading,
      selectedYear,
      setSelectedYear,
      selectedKppn,
      setSelectedKppn,
      selectedPeriode,
      setSelectedPeriode,
      kppnRefList,
      isLoadingKppnRef,
      handleReset,
      fetchRingkasanData,
    } = useKanwilData(contentType, onPeriodeChange);

    // Modal state
    const [isRingkasanModalOpen, setIsRingkasanModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
      namaSatker?: string;
    } | null>(null);
    const [isKartuModalOpen, setIsKartuModalOpen] = useState(false);
    const [kartuTarget, setKartuTarget] = useState<{
      kdsatker: string;
      namaSatker?: string;
    } | null>(null);
    const [isSatkerDetailModalOpen, setIsSatkerDetailModalOpen] =
      useState(false);
    const [satkerDetailTarget, setSatkerDetailTarget] = useState<{
      kdsatker: string;
      namaSatker?: string;
    } | null>(null);

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
      getData: () => ringkasanData,
      getSelectedPeriode: () => ({
        year: selectedYear,
        periode: selectedPeriode,
      }),
    }));

    // ─── Modal Handlers ─────────────────────────────────────

    const handleViewRingkasan = async (item: any) => {
      // If item already has satkerData (from ringkasan tab), use it directly
      if (item.satkerData) {
        setSelectedItem(item);
        setIsRingkasanModalOpen(true);
        return;
      }

      // For monitoring tab, open modal instantly with basic info
      const initialItem = {
        kodeKppn: item.kdkppn,
        namaKppn: item.nmkppn,
        satkerData: [],
      };
      setSelectedItem(initialItem);
      setIsRingkasanModalOpen(true);
      setIsModalLoading(true);

      try {
        const triwulan = selectedPeriode.replace("Q", "");
        const kdkppn = item.kdkppn;
        const apiUrl = apiPath(
          `/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}&kdkppn=${kdkppn}`,
        );

        const response = await fetch(apiUrl, { credentials: "include" });
        if (!response.ok) throw new Error("Gagal mengambil data satker");
        const result = await response.json();

        // Transform API response to match modal's expected format
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

        // Combine monitoring item with fetched satker data
        const combinedItem = {
          kodeKppn: item.kdkppn,
          namaKppn: item.nmkppn,
          satkerData: satkerData,
        };

        setSelectedItem(combinedItem);
      } catch (error) {
        console.error("Error fetching satker data:", error);
        toast.error("Gagal mengambil data detail satker");
      } finally {
        setIsModalLoading(false);
      }
    };

    const handleEditKendala = (item: any) => {
      setSelectedItem(item);
      setIsEditModalOpen(true);
    };

    const handleViewKendala = (item: any) => {
      setSelectedItem(item);
      setIsViewModalOpen(true);
    };

    // ─── Column Handlers ────────────────────────────────────

    const ringkasanHandlers = {
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
      onEditKendala: handleEditKendala,
      onViewKendala: handleViewKendala,
      statusLaporan,
    };

    const monitoringHandlers = {
      onViewRingkasan: handleViewRingkasan,
    };

    const columns = contentType === "ringkasan" 
      ? getRingkasanColumns(ringkasanHandlers) 
      : getMonitoringColumns(monitoringHandlers);

    const data: any[] = contentType === "ringkasan" ? ringkasanData : monitoringData;

    return (
      <div className="space-y-6">
        <KanwilFilter
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedKppn={selectedKppn}
          setSelectedKppn={setSelectedKppn}
          selectedPeriode={selectedPeriode}
          setSelectedPeriode={setSelectedPeriode}
          kppnList={[{ value: "all", label: "Semua KPPN" }, ...kppnRefList]}
          handleReset={handleReset}
        />

        <Card>
          <CardHeader>
            <CardTitle>
              {contentType === "ringkasan" 
                ? "Ringkasan Laporan per Satker" 
                : "Monitoring Laporan KPPN"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={10} />
            ) : (
              <DataTable
                columns={columns}
                data={data}
                initialPageSize={25}
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

        <KendalaHambatanModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          data={selectedItem}
          onSaved={fetchRingkasanData}
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
  },
);
