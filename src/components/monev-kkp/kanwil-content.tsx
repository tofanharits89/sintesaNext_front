"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Trash2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx-js-style";
import { Spinner } from "@/components/ui/spinner";
import { addCsrfToHeaders } from "@/utils/csrf-utils";

// Modularized imports
import {
  KanwilContentProps,
  KanwilContentRef,
  RingkasanKanwilData,
  MonitoringKppnData,
} from "./kanwil/types";

export type {
  KanwilContentProps,
  KanwilContentRef,
  RingkasanKanwilData,
  MonitoringKppnData,
};
import { getRingkasanColumns, getMonitoringColumns, getTransaksiColumns } from "./kanwil/columns";
import { useKanwilData } from "./kanwil/hooks/use-kanwil-data";
import { KanwilFilter } from "./kanwil/kanwil-filter";

export const KanwilContent = forwardRef<KanwilContentRef, KanwilContentProps>(
  function KanwilContent(
    {
      contentType = "monitoring",
      statusLaporan = "not_sent",
      tglKirimKanwil = null,
      kppnCompletionStatus = "incomplete",
      onPeriodeChange,
    },
    ref,
  ) {
    const { user } = useAuth();
    const isSuperAdminOrCoAdmin =
      user?.role === "super_admin" || user?.role === "co_admin";

    const {
      ringkasanData,
      monitoringData,
      transaksiData,
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
      resetLaporanKppn,
      ringkasanPagination,
      setRingkasanPagination,
      totalRingkasan,
      transaksiPagination,
      setTransaksiPagination,
      totalTransaksi,
      grandTotals,
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

    const handleDeleteKendala = async (item: any) => {
      try {
        const triwulan = selectedPeriode.replace("Q", "");
        const kdsatker = item.kodeSatker || item.kdsatker;
        const response = await fetch(
          apiPath(
            `/monev-kkp/kendala?tahun=${selectedYear}&triwulan=${triwulan}&kdsatker=${kdsatker}`,
          ),
          {
            method: "DELETE",
            credentials: "include",
            headers: addCsrfToHeaders({}),
          },
        );

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.message || "Gagal menghapus data");
        }

        toast.success("Data kendala berhasil dihapus");
        fetchRingkasanData();
      } catch (error: any) {
        console.error("Error deleting kendala:", error);
        toast.error(error.message || "Gagal menghapus data kendala");
      }
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
      onDeleteKendala: handleDeleteKendala,
      statusLaporan,
    };

    const handleResetStatus = (item: any) => {
      resetLaporanKppn(item.kdkppn, selectedYear, selectedPeriode);
    };

    const monitoringHandlers = {
      onViewRingkasan: handleViewRingkasan,
      onResetStatus: handleResetStatus,
      showPengembalian: isSuperAdminOrCoAdmin,
    };

    const columns =
      contentType === "ringkasan"
        ? getRingkasanColumns(ringkasanHandlers, grandTotals)
        : contentType === "monitoring"
          ? getMonitoringColumns(monitoringHandlers, grandTotals)
          : getTransaksiColumns(grandTotals);

    const data: any[] =
      contentType === "ringkasan"
        ? ringkasanData
        : contentType === "monitoring"
          ? monitoringData
          : transaksiData;

    const [isExporting, setIsExporting] = useState(false);

    const handleExportExcel = async () => {
      setIsExporting(true);
      try {
        const triwulan = selectedPeriode.replace("Q", "");
        
        if (contentType === "transaksi") {
          // Improved transaction export (matching Direktorat PA)
          toast.info("Sedang menyiapkan data Excel, harap tunggu...");
          
          // Fetch all data for export
          const apiUrl = apiPath(
            `/monev-kkp/direktorat/data-transaksi?tahun=${selectedYear}&triwulan=${triwulan}&kdkanwil=${user?.kdkanwil}${selectedKppn !== "all" ? `&kdkppn=${selectedKppn}` : ""}&page=1&limit=100000`,
          );
          
          const response = await fetch(apiUrl, { credentials: "include" });
          if (!response.ok) throw new Error("Gagal mengambil data untuk export");
          const result = await response.json();
          const data = result.data || [];

          if (data.length === 0) {
            toast.error("Tidak ada data untuk diunduh");
            return;
          }

          const excelData = data.map((item: any, index: number) => ({
            "No": index + 1,
            "Nama Kanwil": item.nmlokasi,
            "Nama KPPN": item.nmkppn,
            "Kode Satker": item.kdsatker,
            "Nama Satker": item.nmsatker,
            "Jumlah Transaksi (BAST)": item.jml_transaksi || 0,
            "Tanggal SPM": item.tg_spm ? new Date(item.tg_spm).toLocaleDateString('id-ID') : '-',
            "Nomor SPM": item.no_spm || '-',
            "Tanggal SP2D": item.tg_sp2d ? new Date(item.tg_sp2d).toLocaleDateString('id-ID') : '',
            "Nomor SP2D": item.no_sp2d,
            "Nilai Transaksi KKP (Rp)": Math.round(Number(item.nilai_transaksi || 0)),
            "Total Transaksi KKP (Rp)": Math.round(Number(item.nilai_transaksi || 0)),
            "Jenis SPM/SP2D": item.jns_kkp_prinsipal,
            "Program/Kegiatan/Output/Akun": `${item.kdprogram || 'XX'}.${item.kdgiat || 'XXXX'}.${item.kdoutput || 'XXX'}.${item.kdakun}`,
            "Kode Akun": item.kdakun,
            "Nama Akun": item.nmakun
          }));

          const worksheet = XLSX.utils.json_to_sheet(excelData);
          
          // Apply accounting number format to Nilai and Total columns (Indices 10 and 11 in this mapping)
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const cellK = worksheet[XLSX.utils.encode_cell({ r: R, c: 10 })];
            if (cellK) {
              cellK.t = 'n';
              cellK.z = '#,##0';
            }
            
            const cellL = worksheet[XLSX.utils.encode_cell({ r: R, c: 11 })];
            if (cellL) {
              cellL.t = 'n';
              cellL.z = '#,##0';
            }
          }

          // Set column widths for better readability
          worksheet['!cols'] = [
            { wch: 6 },   // No
            { wch: 25 },  // Nama Kanwil
            { wch: 25 },  // Nama KPPN
            { wch: 12 },  // Kode Satker
            { wch: 35 },  // Nama Satker
            { wch: 22 },  // Jumlah Transaksi (BAST)
            { wch: 15 },  // Tanggal SPM
            { wch: 20 },  // Nomor SPM
            { wch: 15 },  // Tanggal SP2D
            { wch: 20 },  // Nomor SP2D
            { wch: 25 },  // Nilai Transaksi KKP (Rp)
            { wch: 25 },  // Total Transaksi KKP (Rp)
            { wch: 20 },  // Jenis SPM/SP2D
            { wch: 30 },  // Program/Kegiatan/Output/Akun
            { wch: 12 },  // Kode Akun
            { wch: 30 }   // Nama Akun
          ];

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Data Transaksi KKP");
          
          const fileName = `Data_Transaksi_KKP_${selectedYear}_${selectedPeriode}_${new Date().getTime()}.xlsx`;
          XLSX.writeFile(workbook, fileName);
          toast.success("Data berhasil diunduh");
        } else {
          // Standard export for monitoring/ringkasan
          if (data.length === 0) {
            toast.error("Tidak ada data untuk diekspor");
            return;
          }

          let excelData = data;
          if (contentType === "monitoring") {
            excelData = data.map((item: any, index: number) => ({
              "No": index + 1,
              "Kode KPPN": item.kdkppn,
              "Nama KPPN": item.nmkppn,
              "Jumlah Satker (UP KKP)": item.jumlah_satker_up_kkp,
              "Jumlah Satker (Transaksi)": item.jumlah_satker_transaksi,
              "Nilai Transaksi (Rp)": item.nilai_transaksi,
              "Status Laporan": item.status === "sent" ? "Sudah Kirim" : "Belum Kirim",
              "Tanggal Kirim": item.tanggalKirim ? new Date(item.tanggalKirim).toLocaleDateString("id-ID") : "-"
            }));
          }

          const worksheet = XLSX.utils.json_to_sheet(excelData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Data Export");
          XLSX.writeFile(workbook, `export-${contentType}-${selectedYear}-${selectedPeriode}.xlsx`);
          toast.success("Data berhasil diekspor");
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengekspor data");
      } finally {
        setIsExporting(false);
      }
    };

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>
                {contentType === "ringkasan"
                  ? "Ringkasan Laporan per Satker"
                  : contentType === "monitoring"
                    ? "Monitoring Laporan KPPN"
                    : "Data Transaksi"}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-3">
                {(contentType === "transaksi" || contentType === "monitoring") && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExporting}
                    onClick={handleExportExcel}
                    className="bg-green-700 dark:bg-card hover:bg-green-600 flex items-center"
                  >
                    {isExporting ? (
                      <Spinner size="sm" className="mr-2 text-white" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-white mr-2" />
                    )}
                    <p className="text-xs text-white">
                      {isExporting ? "Mengunduh..." : "Unduh Data Excel"}
                    </p>
                  </Button>
                )}

                {contentType === "ringkasan" && (
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant={
                        statusLaporan === "sent" ? "success" : "destructive"
                      }
                      className="px-3 py-1 text-xs font-semibold uppercase tracking-wider shadow-sm"
                    >
                      {statusLaporan === "sent"
                        ? "Sudah Dikirim"
                        : "Belum Dikirim"}
                    </Badge>

                    {statusLaporan === "sent" && tglKirimKanwil && (
                      <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-blue-500" />
                          <span>
                            {new Date(tglKirimKanwil).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-border/50 pl-4">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span>
                            {new Date(tglKirimKanwil).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" },
                            )}{" "}
                            WIB
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={10} />
            ) : (
              <DataTable
                columns={columns}
                data={data}
                initialPageSize={10}
                showFooter={true}
                manualPagination={
                  contentType === "transaksi" || contentType === "ringkasan"
                }
                rowCount={
                  (contentType === "transaksi"
                    ? totalTransaksi
                    : contentType === "ringkasan"
                      ? totalRingkasan
                      : undefined) as any
                }
                controlledPagination={
                  (contentType === "transaksi"
                    ? transaksiPagination
                    : contentType === "ringkasan"
                      ? ringkasanPagination
                      : undefined) as any
                }
                onPaginationChange={(pagination) => {
                  if (contentType === "transaksi") setTransaksiPagination(pagination);
                  else if (contentType === "ringkasan") setRingkasanPagination(pagination);
                }}
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
          tahun={selectedYear}
          triwulan={selectedPeriode.replace("Q", "")}
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
          {...(transaksiTarget?.namaSatker
            ? { namaSatker: transaksiTarget.namaSatker }
            : {})}
          tahun={selectedYear}
          triwulan={selectedPeriode.replace("Q", "")}
        />

        <TagihanKkpModal
          open={isTagihanModalOpen}
          onOpenChange={setIsTagihanModalOpen}
          kdsatker={tagihanTarget?.kdsatker ?? ""}
          {...(tagihanTarget?.namaSatker
            ? { namaSatker: tagihanTarget.namaSatker }
            : {})}
          tahun={selectedYear}
          triwulan={selectedPeriode.replace("Q", "")}
        />

        <KartuKkpModal
          open={isKartuModalOpen}
          onOpenChange={setIsKartuModalOpen}
          kdsatker={kartuTarget?.kdsatker ?? ""}
          {...(kartuTarget?.namaSatker
            ? { namaSatker: kartuTarget.namaSatker }
            : {})}
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
