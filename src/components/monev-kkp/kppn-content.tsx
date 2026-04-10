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
import { Pencil, Eye, Building2 } from "lucide-react";
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
  jumlahKartu: number;
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
  statusLaporan?: "sent" | "not_sent";
  onPeriodeChange?: (year: string, periode: string) => void;
}

export const KppnContent = forwardRef<KppnContentRef, KppnContentProps>(
  function KppnContent({ statusLaporan = "not_sent", onPeriodeChange }, ref) {
    // Get authenticated user info
    const { user, isLoading: isAuthLoading } = useAuth();
    const now = new Date();
    const defaultYear = "2026"; // Set to 2026 as per user requirement
    const defaultPeriode = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;

    const [data, setData] = useState<KkpData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(defaultYear);
    const [selectedPeriode, setSelectedPeriode] = useState(defaultPeriode);

    // Expose getData and getSelectedPeriode methods to parent component via ref
    useImperativeHandle(ref, () => ({
      getData: () => data,
      getSelectedPeriode: () => ({
        year: selectedYear,
        periode: selectedPeriode,
      }),
    }));

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const triwulan = selectedPeriode.replace("Q", "");
        const response = await fetch(
          apiPath(`/monev-kkp/kppn?tahun=${selectedYear}&triwulan=${triwulan}`),
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil data");
        }

        const result = await response.json();

        // Map backend data to frontend KkpData structure
        const mappedData = result.data.map((item: any, index: number) => ({
          id: `${item.kdsatker}-${index}`,
          kodeBA: item.kddept,
          kodeSatker: item.kdsatker,
          namaSatker: item.nmsatker,
          kdkppn: item.kdkppn,
          nmkppn: item.nmkppn,
          kdkanwil: item.kdkanwil,
          nmkanwil: item.nmkanwil,
          upKkpPerBulan: Number(item.nilai_up_kkp || 0),
          porsiUpKkp: Number(item.porsi_up_kkp_dari_total_up || 0),
          bankPenerbit: item.bank_penerbit,
          jumlahKartu: Number(item.jumlah_kartu || 0),
          nilaiTagihan: Number(item.nilai_tagihan || 0),
          nilaiTransaksi: Number(item.nilai_trans_sp2d || 0),
          kendala: item.kendala || "",
          detil_kendala: item.detil_kendala || "",
          detil_masukan_kendala: item.detil_masukan_kendala || "",
          nomor_pks: item.nomor_pks || "",
          tanggal_pks: item.tanggal_pks || "",
          nomor_surat_up: item.nomor_surat_up || "",
          tanggal_surat_up: item.tanggal_surat_up || "",
          tanggal_ctk_tagihan: item.tanggal_ctk_tagihan || "",
          tanggal_jth_tempo: item.tanggal_jth_tempo || "",
          nomor_sp2d_list: item.nomor_sp2d_list || "",
          tanggal_sp2d_list: item.tanggal_sp2d_list || "",
          jenis_belanja_list: item.jenis_belanja_list || "",
          bulan: item.bulan,
          triwulan: item.triwulan,
          tahun: selectedYear,
        }));

        setData(mappedData);
      } catch (error) {
        console.error("Error fetching KKP data:", error);
        toast.error("Gagal mengambil data dari server");
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      if (user) {
        fetchData();
      }
    }, [user, selectedYear, selectedPeriode]);

    // Notify parent when year or periode changes
    useEffect(() => {
      if (onPeriodeChange) {
        onPeriodeChange(selectedYear, selectedPeriode);
      }
    }, [selectedYear, selectedPeriode]);

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

    // Generate years from 2026 back to 2023
    const years = ["2026", "2025", "2024", "2023"];

    const periodes = [
      { value: "Q1", label: "Triwulan 1 (Jan - Mar)" },
      { value: "Q2", label: "Triwulan 2 (Jan - Jun)" },
      { value: "Q3", label: "Triwulan 3 (Jan - Sep)" },
      { value: "Q4", label: "Triwulan 4 (Jan - Des)" },
    ];

    const handleReset = () => {
      setSelectedYear(defaultYear);
      setSelectedPeriode(defaultPeriode);
    };

    const handleEditKendala = (item: any) => {
      setSelectedItem(item);
      setIsEditModalOpen(true);
    };

    const handleViewKendala = (item: any) => {
      setSelectedItem(item);
      setIsViewModalOpen(true);
    };

    const formatRupiah = (value: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    const formatPercent = (value: number) => {
      return `${value.toFixed(1)}%`;
    };

    const columns = [
      {
        id: "no",
        header: () => <div className="text-center font-medium">No</div>,
        cell: ({ row }: any) => (
          <div className="text-center">{row.index + 1}</div>
        ),
      },
      {
        accessorKey: "kodeBA",
        header: () => <div className="text-center font-medium">Kode BA</div>,
        cell: ({ row }: any) => (
          <div className="text-center">{row.getValue("kodeBA")}</div>
        ),
      },
      {
        accessorKey: "kodeSatker",
        header: () => (
          <div className="text-center font-medium">Kode Satker</div>
        ),
        cell: ({ row }: any) => (
          <div
            className="text-center cursor-pointer text-blue-600 hover:underline font-medium"
            onClick={() => {
              setSatkerDetailTarget({
                kdsatker: row.original.kodeSatker,
                namaSatker: row.original.namaSatker,
              });
              setIsSatkerDetailModalOpen(true);
            }}
            title="Lihat detail satker"
          >
            {row.getValue("kodeSatker")}
          </div>
        ),
      },
      {
        accessorKey: "namaSatker",
        header: () => (
          <div className="text-center font-medium">Nama Satker</div>
        ),
        cell: ({ row }: any) => (
          <div
            className="text-left max-w-[200px] truncate"
            title={row.getValue("namaSatker")}
          >
            {row.getValue("namaSatker")}
          </div>
        ),
      },
      {
        accessorKey: "upKkpPerBulan",
        header: () => (
          <div className="text-center font-medium">UP KKP Per Bulan</div>
        ),
        cell: ({ row }: any) => (
          <div className="text-right font-mono tabular-nums pr-2">
            {formatRupiah(row.getValue("upKkpPerBulan"))}
          </div>
        ),
      },
      {
        accessorKey: "porsiUpKkp",
        header: () => (
          <div className="text-center font-medium">
            Porsi UP KKP dari Total UP
          </div>
        ),
        cell: ({ row }: any) => (
          <div className="text-center">
            {formatPercent(row.getValue("porsiUpKkp"))}
          </div>
        ),
      },
      {
        accessorKey: "bankPenerbit",
        header: () => (
          <div className="text-center font-medium">Bank Penerbit KKP</div>
        ),
        cell: ({ row }: any) => (
          <div className="text-center">{row.getValue("bankPenerbit")}</div>
        ),
      },
      {
        accessorKey: "jumlahKartu",
        header: () => (
          <div className="text-center font-medium">Jumlah Kartu</div>
        ),
        cell: ({ row }: any) => (
          <div
            className="text-center cursor-pointer text-blue-600 hover:underline"
            onClick={() => {
              setKartuTarget({
                kdsatker: row.original.kodeSatker,
                namaSatker: row.original.namaSatker,
              });
              setIsKartuModalOpen(true);
            }}
            title="Lihat detail kartu"
          >
            {row.getValue("jumlahKartu")}
          </div>
        ),
      },
      {
        accessorKey: "nilaiTagihan",
        header: () => (
          <div className="text-center font-medium">Nilai Tagihan</div>
        ),
        cell: ({ row }: any) => (
          <div
            className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
            onClick={() => {
              setTagihanTarget({
                kdsatker: row.original.kodeSatker,
                namaSatker: row.original.namaSatker,
              });
              setIsTagihanModalOpen(true);
            }}
            title="Lihat detail tagihan"
          >
            {formatRupiah(row.getValue("nilaiTagihan"))}
          </div>
        ),
      },
      {
        accessorKey: "nilaiTransaksi",
        header: () => (
          <div className="text-center font-medium">Nilai Transaksi KKP</div>
        ),
        cell: ({ row }: any) => (
          <div
            className="text-right font-mono tabular-nums pr-2 cursor-pointer text-blue-600 hover:underline"
            onClick={() => {
              setTransaksiTarget({
                kdsatker: row.original.kodeSatker,
                namaSatker: row.original.namaSatker,
              });
              setIsTransaksiModalOpen(true);
            }}
            title="Lihat detail transaksi"
          >
            {formatRupiah(row.getValue("nilaiTransaksi"))}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center font-medium">Kendala dan Hambatan</div>
        ),
        cell: ({ row }: any) => (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => handleEditKendala(row.original)}
              title={
                statusLaporan === "sent"
                  ? "Laporan sudah dikirim, tidak dapat mengedit"
                  : "Edit Kendala/Hambatan"
              }
              disabled={statusLaporan === "sent"}
            >
              <Pencil className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 cursor-pointer"
              onClick={() => handleViewKendala(row.original)}
              title="Lihat Kendala/Hambatan"
            >
              <Eye className="h-4 w-4 text-amber-600" />
            </Button>
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-6">
        {/* Filter Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filter Data</CardTitle>
              <ResetButton onReset={handleReset} />
            </div>
          </CardHeader>
          <CardContent>
            {/* KPPN Info from Auth */}
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Informasi KPPN</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between md:flex-col md:gap-0.5">
                  <span className="text-muted-foreground">Kode KPPN:</span>
                  <span className="font-medium">{user?.kdkppn || "-"}</span>
                </div>
                <div className="flex justify-between md:flex-col md:gap-0.5">
                  <span className="text-muted-foreground">Nama KPPN:</span>
                  <span className="font-medium">
                    {user?.nmkppn || user?.kdkppn || "-"}
                  </span>
                </div>
                <div className="flex justify-between md:flex-col md:gap-0.5">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="outline">{user?.role || "-"}</Badge>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tahun</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Periode (Akumulatif)</label>
                <Select
                  value={selectedPeriode}
                  onValueChange={setSelectedPeriode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodes.map((periode) => (
                      <SelectItem key={periode.value} value={periode.value}>
                        {periode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Ringkasan Laporan KPPN</CardTitle>
              <Badge
                variant={statusLaporan === "sent" ? "success" : "destructive"}
              >
                {statusLaporan === "sent" ? "Sudah Dikirim" : "Belum Dikirim"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={10} />
            ) : (
              <DataTable columns={columns} data={data} initialPageSize={25} />
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <KendalaHambatanModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          data={selectedItem}
          onSaved={fetchData}
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

        {/* Transaksi KKP Modal */}
        <TransaksiKkpModal
          open={isTransaksiModalOpen}
          onOpenChange={setIsTransaksiModalOpen}
          kdsatker={transaksiTarget?.kdsatker ?? ""}
          namaSatker={transaksiTarget?.namaSatker ?? ""}
          tahun={selectedYear}
          triwulan={selectedPeriode.replace("Q", "")}
        />

        {/* Tagihan KKP Modal */}
        <TagihanKkpModal
          open={isTagihanModalOpen}
          onOpenChange={setIsTagihanModalOpen}
          kdsatker={tagihanTarget?.kdsatker ?? ""}
          namaSatker={tagihanTarget?.namaSatker ?? ""}
          tahun={selectedYear}
          triwulan={selectedPeriode.replace("Q", "")}
        />

        {/* Kartu KKP Modal */}
        <KartuKkpModal
          open={isKartuModalOpen}
          onOpenChange={setIsKartuModalOpen}
          kdsatker={kartuTarget?.kdsatker ?? ""}
          namaSatker={kartuTarget?.namaSatker ?? ""}
          tahun={selectedYear}
        />

        {/* Satker Detail Modal */}
        <SatkerDetailModal
          open={isSatkerDetailModalOpen}
          onOpenChange={setIsSatkerDetailModalOpen}
          kdsatker={satkerDetailTarget?.kdsatker ?? ""}
          namaSatker={satkerDetailTarget?.namaSatker ?? ""}
          tahun={selectedYear}
          onSaved={fetchData}
        />
      </div>
    );
  },
);
