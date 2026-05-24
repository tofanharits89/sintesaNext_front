"use client";

import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ResetButton } from "@/components/ui/reset-button";
import { Building2, Calendar, Clock, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { KendalaHambatanModal } from "./modals/kendala-hambatan-modal";
import { LihatKendalaModal } from "./modals/lihat-kendala-modal";
import { TransaksiKkpModal } from "./modals/transaksi-kkp-modal";
import { TagihanKkpModal } from "./modals/tagihan-kkp-modal";
import { KartuKkpModal } from "./modals/kartu-kkp-modal";
import { SatkerDetailModal } from "./modals/satker-detail-modal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { apiPath } from "@/lib/config/base-path";
import { addCsrfToHeaders } from "@/utils/csrf-utils";
import { Spinner } from "@/components/ui/spinner";
import { getRingkasanColumns, getTransaksiColumns } from "./kppn/columns";
import { useKppnData } from "./kppn/hooks/use-kppn-data";

// Type for the KKP data
export interface KkpData {
  id: string | number;
  kodeBA: string;
  kodeSatker: string;
  namaSatker: string;
  kdkppn?: string;
  nmkppn?: string;
  kdkanwil?: string;
  nmkanwil?: string;
  upKkpPerBulan: number;
  porsiUpKkp: number;
  bankPenerbit: string;
  jmlKartuUsul: number | null;
  jumlahKartu: number;
  jmlKartuOpr: number;
  limitOpr: number;
  jmlKartuPd: number;
  limitPd: number;
  nilaiTagihan: number;
  nilaiTransaksi: number;
  kendala: string;
  detil_kendala?: string;
  detil_masukan_kendala?: string;
  nomor_pks?: string;
  tanggal_pks?: string;
  nomor_surat_up?: string;
  tanggal_surat_up?: string;
  tanggal_ctk_tagihan?: string;
  tanggal_jth_tempo?: string;
  nomor_sp2d_list?: string;
  tanggal_sp2d_list?: string;
  jenis_belanja_list?: string;
  bulan?: string;
  triwulan?: string;
}

// Ref interface for parent component access
export interface KppnContentRef {
  getData: () => KkpData[];
  getSelectedPeriode: () => { year: string; periode: string };
}

// Props interface
interface KppnContentProps {
  contentType?: "ringkasan" | "transaksi";
  statusLaporan?: "sent" | "not_sent";
  tglKirimKppn?: string | null;
  onPeriodeChange?: (year: string, periode: string) => void;
}

export const KppnContent = forwardRef<KppnContentRef, KppnContentProps>(
  function KppnContent({ contentType = "ringkasan", statusLaporan = "not_sent", tglKirimKppn = null, onPeriodeChange }, ref) {
    const { user } = useAuth();
    const {
      ringkasanData,
      transaksiData,
      isLoading,
      selectedYear,
      setSelectedYear,
      selectedPeriode,
      setSelectedPeriode,
      handleReset,
      fetchRingkasanData,
      ringkasanPagination,
      setRingkasanPagination,
      totalRingkasan,
      transaksiPagination,
      setTransaksiPagination,
      totalTransaksi,
      grandTotals,
    } = useKppnData(contentType, onPeriodeChange);

    // Expose getData and getSelectedPeriode methods to parent component via ref
    useImperativeHandle(ref, () => ({
      getData: () => ringkasanData,
      getSelectedPeriode: () => ({
        year: selectedYear,
        periode: selectedPeriode,
      }),
    }));

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
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
    const [isSatkerDetailModalOpen, setIsSatkerDetailModalOpen] = useState(false);
    const [satkerDetailTarget, setSatkerDetailTarget] = useState<{
      kdsatker: string;
      namaSatker?: string;
    } | null>(null);
    const [isExporting, setIsExporting] = useState(false);

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
        const response = await fetch(
          apiPath(`/monev-kkp/kendala?tahun=${selectedYear}&triwulan=${triwulan}&kdsatker=${item.kodeSatker}`),
          {
            method: "DELETE",
            credentials: "include",
            headers: addCsrfToHeaders({}),
          }
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

    const handleExportExcel = async () => {
      setIsExporting(true);
      try {
        const triwulan = selectedPeriode.replace("Q", "");
        
        if (contentType === "ringkasan") {
          // Standard summary export (existing behavior but cleaned up)
          if (ringkasanData.length === 0) {
            toast.error("Tidak ada data untuk diekspor");
            return;
          }
          const worksheet = XLSX.utils.json_to_sheet(ringkasanData);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Ringkasan Laporan");
          XLSX.writeFile(workbook, `Ringkasan_Laporan_KPPN_${selectedYear}_${selectedPeriode}.xlsx`);
        } else {
          // Improved transaction export (matching Direktorat PA)
          toast.info("Sedang menyiapkan data Excel, harap tunggu...");
          
          // Fetch all data for export
          const apiUrl = apiPath(
            `/monev-kkp/direktorat/data-transaksi?tahun=${selectedYear}&triwulan=${triwulan}&kdkppn=${user?.kdkppn || "all"}&page=1&limit=100000`,
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
          
          // Apply accounting number format to Nilai and Total columns (Indices 8 and 9 in this mapping)
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const cellI = worksheet[XLSX.utils.encode_cell({ r: R, c: 8 })];
            if (cellI) {
              cellI.t = 'n';
              cellI.z = '#,##0';
            }
            
            const cellJ = worksheet[XLSX.utils.encode_cell({ r: R, c: 9 })];
            if (cellJ) {
              cellJ.t = 'n';
              cellJ.z = '#,##0';
            }
          }

          // Set column widths for better readability
          worksheet['!cols'] = [
            { wch: 6 },   // No
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
        }
      } catch (error) {
        console.error(error);
        toast.error("Gagal mengekspor data");
      } finally {
        setIsExporting(false);
      }
    };

    const ringkasanHandlers = {
      onEditKendala: handleEditKendala,
      onViewKendala: handleViewKendala,
      onDeleteKendala: handleDeleteKendala,
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
      statusLaporan,
    };

    const years = ["2026", "2025", "2024", "2023"];
    const periodes = [
      { value: "Q1", label: "Triwulan 1 (Jan - Mar)" },
      { value: "Q2", label: "Triwulan 2 (Jan - Jun)" },
      { value: "Q3", label: "Triwulan 3 (Jan - Sep)" },
      { value: "Q4", label: "Triwulan 4 (Jan - Des)" },
    ];

    const columns = contentType === "ringkasan" 
      ? getRingkasanColumns(ringkasanHandlers, grandTotals) 
      : getTransaksiColumns(grandTotals);

    const data = contentType === "ringkasan" ? ringkasanData : transaksiData;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="shrink-0">Filter Data</CardTitle>
              <div className="hidden md:flex items-center gap-x-5 flex-1 text-sm px-3 py-1.5">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Kode KPPN:</span>
                  <span className="font-medium">{user?.kdkppn || "-"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Nama KPPN:</span>
                  <span className="font-medium">{user?.nmkppn || user?.kdkppn || "-"}</span>
                </div>
              </div>
              <ResetButton onReset={handleReset} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tahun</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Periode (Akumulatif)</label>
                <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodes.map((periode) => (
                      <SelectItem key={periode.value} value={periode.value}>{periode.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>
                {contentType === "ringkasan" ? "Ringkasan Laporan KPPN" : "Data Transaksi"}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                {contentType === "transaksi" && (
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
                  <Badge
                    variant={statusLaporan === "sent" ? "success" : "destructive"}
                    className="px-3 py-1 text-xs font-semibold uppercase tracking-wider shadow-sm"
                  >
                    {statusLaporan === "sent" ? "Sudah Dikirim" : "Belum Dikirim"}
                  </Badge>
                )}
                
                {contentType === "ringkasan" && statusLaporan === "sent" && tglKirimKppn && (
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      <span>{new Date(tglKirimKppn).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-border/50 pl-4">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span>{new Date(tglKirimKppn).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span>
                    </div>
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
                data={data as any[]} 
                initialPageSize={10} 
                showFooter={true}
                manualPagination={true}
                rowCount={
                  contentType === "ringkasan"
                    ? totalRingkasan
                    : totalTransaksi
                }
                controlledPagination={
                  contentType === "ringkasan" ? ringkasanPagination : transaksiPagination
                }
                onPaginationChange={(p) => {
                  if (contentType === "ringkasan") setRingkasanPagination(p);
                  else setTransaksiPagination(p);
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Modals */}
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
          namaSatker={transaksiTarget?.namaSatker ?? ""}
          tahun={selectedYear}
          triwulan={selectedPeriode.replace("Q", "")}
        />
        <TagihanKkpModal
          open={isTagihanModalOpen}
          onOpenChange={setIsTagihanModalOpen}
          kdsatker={tagihanTarget?.kdsatker ?? ""}
          namaSatker={tagihanTarget?.namaSatker ?? ""}
          tahun={selectedYear}
          triwulan={selectedPeriode.replace("Q", "")}
        />
        <KartuKkpModal
          open={isKartuModalOpen}
          onOpenChange={setIsKartuModalOpen}
          kdsatker={kartuTarget?.kdsatker ?? ""}
          namaSatker={kartuTarget?.namaSatker ?? ""}
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
