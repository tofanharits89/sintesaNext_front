"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ResetButton } from "@/components/ui/reset-button";
import { CheckCircle, SlidersHorizontal, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import { ModalKanwil } from "./modal-kanwil";

interface KanwilData {
  kdkanwil: string;
  nmkanwil: string;
  kdlokasi?: string;
  ringkasan1?: number | null;
  penyusunan1?: number | null;
  metode1?: number | null;
  kualitasdd1?: number | null;
  kualitasdf1?: number | null;
  kualitasbos1?: number | null;
  kesimpulan1?: number | null;
  ket1?: string | null;
  ringkasan2?: number | null;
  penyusunan2?: number | null;
  metode2?: number | null;
  kualitasdd2?: number | null;
  kualitasdf2?: number | null;
  kualitasbos2?: number | null;
  kesimpulan2?: number | null;
  ket2?: string | null;
  total?: number | null;
}

export interface NilaiKanwil {
  ringkasan?: number | null;
  penyusunan?: number | null;
  metode?: number | null;
  kualitasdd?: number | null;
  kualitasdf?: number | null;
  kualitasbos?: number | null;
  kesimpulan?: number | null;
  ket?: string | null;
}

export interface KirimKanwilItem {
  nmkanwil: string;
  kdkanwil: string;
  analisa: string;
  thang: string;
  periode: string;
}

export type DataKirimKanwil = [KirimKanwilItem, NilaiKanwil, NilaiKanwil];

interface PenilaianKanwilProps {
  role: string;
  username: string;
}

export function PenilaianKanwil({ role, username }: PenilaianKanwilProps) {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentSemester = now.getMonth() < 6 ? "I" : "II";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KanwilData[]>([]);
  const [open, setOpen] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState(currentSemester);
  const [selectedKanwil, setSelectedKanwil] = useState("");
  const [datakirim, setDataKirim] = useState<DataKirimKanwil | null>(null);

  const kanwilOptions = useMemo(
    () =>
      Array.from(
        new Map(data.map((d) => [d.kdkanwil, { kdkanwil: d.kdkanwil, nmkanwil: d.nmkanwil }])).values(),
      ).sort((a, b) => a.kdkanwil.localeCompare(b.kdkanwil)),
    [data],
  );

  const filteredData = useMemo(
    () => (selectedKanwil ? data.filter((d) => d.kdkanwil === selectedKanwil) : data),
    [data, selectedKanwil],
  );

  const tableRows = useMemo(
    () =>
      filteredData.map((row, index) => ({
        ...row,
        no: index + 1,
        tahun: selectedYear,
        periode: `Semester ${selectedPeriod}`,
      })),
    [filteredData, selectedYear, selectedPeriod],
  );

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedPeriod]);

  const handleModal = (
    kanwilybs: string,
    nmkanwil: string,
    analisa: string,
    ringkasanx?: number | null,
    penyusunanx?: number | null,
    metodex?: number | null,
    kualitasddx?: number | null,
    kualitasdfx?: number | null,
    kualitasbosx?: number | null,
    kesimpulanx?: number | null,
    ketx?: string | null,
    ringkasany?: number | null,
    penyusunany?: number | null,
    metodey?: number | null,
    kualitasddy?: number | null,
    kualitasdfy?: number | null,
    kualitasbosy?: number | null,
    kesimpulany?: number | null,
    kety?: string | null,
  ) => {
    setShowModal(true);
    setOpen("1");
    setDataKirim([
      {
        nmkanwil,
        kdkanwil: kanwilybs,
        analisa,
        thang: selectedYear,
        periode: selectedPeriod,
      },
      {
        ringkasan: ringkasanx ?? null,
        penyusunan: penyusunanx ?? null,
        metode: metodex ?? null,
        kualitasdd: kualitasddx ?? null,
        kualitasdf: kualitasdfx ?? null,
        kualitasbos: kualitasbosx ?? null,
        kesimpulan: kesimpulanx ?? null,
        ket: ketx ?? null,
      },
      {
        ringkasan: ringkasany ?? null,
        penyusunan: penyusunany ?? null,
        metode: metodey ?? null,
        kualitasdd: kualitasddy ?? null,
        kualitasdf: kualitasdfy ?? null,
        kualitasbos: kualitasbosy ?? null,
        kesimpulan: kesimpulany ?? null,
        ket: kety ?? null,
      },
    ]);
  };

  const handleClose = () => {
    setShowModal(false);
    setOpen("");
    getData();
  };

  const handleReset = () => {
    setSelectedYear(currentYear);
    setSelectedPeriod(currentSemester);
    setSelectedKanwil("");
  };

  const getData = async () => {
    setLoading(true);
    const sql = `
      SELECT a.kdkanwil, a.nmkanwil, a.kdlokasi,
      b.ringkasan AS ringkasan1, b.penyusunan AS penyusunan1, b.metode AS metode1,
      b.kualitasdd AS kualitasdd1, b.kualitasdf AS kualitasdf1, b.kualitasbos AS kualitasbos1,
      b.kesimpulan AS kesimpulan1, b.ket AS ket1,
      d.ringkasan AS ringkasan2, d.penyusunan AS penyusunan2, d.metode AS metode2,
      d.kualitasdd AS kualitasdd2, d.kualitasdf AS kualitasdf2, d.kualitasbos AS kualitasbos2,
      d.kesimpulan AS kesimpulan2, d.ket AS ket2,
      ROUND((COALESCE(b.hasil, 0) + COALESCE(d.hasil, 0)) / 2, 2) AS total
      FROM dbref.t_kanwil_2014 a
      LEFT JOIN tkd.iku_monev_kanwil_i b ON a.kdkanwil = b.kdkanwil AND b.thang='${selectedYear}' AND b.periode='${selectedPeriod}'
      LEFT JOIN tkd.iku_monev_kanwil_ii d ON a.kdkanwil = d.kdkanwil AND d.thang='${selectedYear}' AND d.periode='${selectedPeriod}'
      WHERE a.kdkanwil <> '00'
      ORDER BY a.kdkanwil
    `;
    const cleanedQuery = sql.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    const encryptedQuery = btoa(encodeURIComponent(cleanedQuery));
    try {
      const response = await http.get(
        apiPath(`/transfer-daerah/iku/referensi/${encryptedQuery}`),
        { params: { user: username } },
      );
      setData(response.data?.result ?? []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(
        err?.response?.data?.error ??
          "Terjadi Permasalahan Koneksi atau Server Backend",
      );
    } finally {
      setLoading(false);
    }
  };

  const columns: any[] = [
    {
      accessorKey: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("no")}</div>,
    },
    {
      accessorKey: "tahun",
      header: () => <div className="text-center font-medium">Tahun</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("tahun")}</div>,
    },
    {
      accessorKey: "periode",
      header: () => <div className="text-center font-medium">Periode</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("periode")}</div>,
    },
    {
      id: "kanwil",
      header: () => <div className="text-center font-medium">Kanwil</div>,
      cell: ({ row }: any) => (
        <div className="text-center">
          {row.original.kdkanwil} - {row.original.nmkanwil}
        </div>
      ),
    },
    {
      id: "analisa1",
      header: () => <div className="text-center font-medium">ANALISA I</div>,
      cell: ({ row }: any) => (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            title="Analisa I"
            onClick={() =>
              handleModal(
                row.original.kdkanwil,
                row.original.nmkanwil,
                "I",
                row.original.ringkasan1,
                row.original.penyusunan1,
                row.original.metode1,
                row.original.kualitasdd1,
                row.original.kualitasdf1,
                row.original.kualitasbos1,
                row.original.kesimpulan1,
                row.original.ket1,
                row.original.ringkasan2,
                row.original.penyusunan2,
                row.original.metode2,
                row.original.kualitasdd2,
                row.original.kualitasdf2,
                row.original.kualitasbos2,
                row.original.kesimpulan2,
                row.original.ket2,
              )
            }
          >
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </Button>
        </div>
      ),
    },
    {
      id: "analisa2",
      header: () => <div className="text-center font-medium">ANALISA II</div>,
      cell: ({ row }: any) => (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            title="Analisa II"
            onClick={() =>
              handleModal(
                row.original.kdkanwil,
                row.original.nmkanwil,
                "II",
                row.original.ringkasan1,
                row.original.penyusunan1,
                row.original.metode1,
                row.original.kualitasdd1,
                row.original.kualitasdf1,
                row.original.kualitasbos1,
                row.original.kesimpulan1,
                row.original.ket1,
                row.original.ringkasan2,
                row.original.penyusunan2,
                row.original.metode2,
                row.original.kualitasdd2,
                row.original.kualitasdf2,
                row.original.kualitasbos2,
                row.original.kesimpulan2,
                row.original.ket2,
              )
            }
          >
            <CheckCircle className="h-4 w-4 text-green-500" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: () => <div className="text-center font-medium">RATA-RATA</div>,
      cell: ({ row }: any) => (
        <div className="text-center font-bold text-cyan-600">{row.getValue("total")}</div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Filter</CardTitle>
            </div>
            <ResetButton onReset={handleReset} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="yearSelect" className="text-sm font-medium">Tahun</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="yearSelect" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="periodSelect" className="text-sm font-medium">Periode</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger id="periodSelect" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="I">Semester I</SelectItem>
                  <SelectItem value="II">Semester II</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kanwilSelect" className="text-sm font-medium">Kanwil</Label>
              <SearchableSelect
                options={[
                  { value: "", label: "Semua Kanwil" },
                  ...kanwilOptions.map(k => ({ value: k.kdkanwil, label: `${k.kdkanwil} - ${k.nmkanwil}` }))
                ]}
                value={selectedKanwil}
                onValueChange={setSelectedKanwil}
                placeholder="Pilih Kanwil"
                searchPlaceholder="Cari kode atau nama Kanwil..."
                emptyMessage="Kanwil tidak ditemukan."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Nilai Monev Kanwil</CardTitle>
            </div>
            {tableRows && (
              <span className="text-xs text-muted-foreground">
                {tableRows.length.toLocaleString("id-ID")} baris
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={10} />
          ) : (
            <DataTable columns={columns} data={tableRows} />
          )}
        </CardContent>
      </Card>

      {open === "1" && datakirim && (
        <ModalKanwil
          open={showModal}
          onOpenChange={(v) => {
            if (!v) handleClose();
          }}
          username={username}
          kirim={datakirim}
        />
      )}
    </div>
  );
}
