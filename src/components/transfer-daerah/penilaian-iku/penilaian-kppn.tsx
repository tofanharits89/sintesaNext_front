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
import { ModalKppn } from "./modal-kppn";

interface KppnData {
  kdkppn: string;
  nmkppn: string;
}

export interface KirimKppnItem {
  kdkppn: string;
  nmkppn: string;
  periode: string;
  thang: string;
}

export type DataKirimKppn = [KirimKppnItem];

interface PenilaianKppnProps {
  role: string;
  username: string;
  kdkppn: string;
}

export function PenilaianKppn({
  role,
  username,
  kdkppn: kdkppnUser,
}: PenilaianKppnProps) {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentSemester = now.getMonth() < 6 ? "I" : "II";

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KppnData[]>([]);
  const [open, setOpen] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState(currentSemester);
  const [selectedKppn, setSelectedKppn] = useState("");
  const [datakirim, setDataKirim] = useState<DataKirimKppn | null>(null);

  const kppnOptions = useMemo(
    () =>
      Array.from(
        new Map(data.map((d) => [d.kdkppn, { kdkppn: d.kdkppn, nmkppn: d.nmkppn }])).values(),
      ).sort((a, b) => a.kdkppn.localeCompare(b.kdkppn)),
    [data],
  );

  const filteredData = useMemo(
    () => (selectedKppn ? data.filter((d) => d.kdkppn === selectedKppn) : data),
    [data, selectedKppn],
  );

  const tableRows = useMemo(
    () =>
      filteredData.map((row, index) => ({
        ...row,
        no: index + 1,
        tahun: selectedYear,
        jenisLaporan: selectedPeriod,
      })),
    [filteredData, selectedYear, selectedPeriod],
  );

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedPeriod]);

  const handleModal = (kdkppn: string, nmkppn: string, periode: string) => {
    setShowModal(true);
    setOpen("1");
    setDataKirim([{ kdkppn, nmkppn, periode, thang: selectedYear }]);
  };

  const handleClose = () => {
    setShowModal(false);
    setOpen("");
    getData();
  };

  const handleReset = () => {
    setSelectedYear(currentYear);
    setSelectedPeriod(currentSemester);
    setSelectedKppn("");
  };

  const getData = async () => {
    setLoading(true);
    const kppnFilter =
      role === "3"
        ? `WHERE a.kdkppn = '${kdkppnUser}' AND c.kddept='999'`
        : `WHERE c.kddept='999'`;

    const sql = `
      SELECT a.kdkppn, a.nmkppn
      FROM dbref.t_kppn_2024 a
      LEFT JOIN tkd.iku_lk_kppn b ON a.kdkppn = b.kdkppn
        AND b.thang='${selectedYear}' AND b.periode='${selectedPeriod}'
      ORDER BY a.kdkppn
    `;
    const cleanedQuery = sql.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    const encryptedQuery = btoa(encodeURIComponent(cleanedQuery));
    try {
      const response = await http.get(
        apiPath(`/transfer-daerah/iku/referensi/${encryptedQuery}`),
        { params: { user: username } },
      );
      const resultData = response.data?.result ?? [];
      const formattedData = resultData.map((d: KppnData) => ({
        ...d,
        nmkppn: d.nmkppn ? d.nmkppn.replace(/(?<=\b[a-zA-Z])\s+(?=[a-zA-Z]\b)/g, "") : d.nmkppn,
      }));
      setData(formattedData);
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
      id: "kppn",
      header: () => <div className="text-center font-medium">KPPN</div>,
      cell: ({ row }: any) => (
        <div className="text-center">
          {row.original.kdkppn} - {row.original.nmkppn}
        </div>
      ),
    },
    {
      accessorKey: "jenisLaporan",
      header: () => <div className="text-center font-medium">Jenis Laporan</div>,
      cell: ({ row }: any) => <div className="text-center">{row.getValue("jenisLaporan")}</div>,
    },
    {
      id: "analisa",
      header: () => <div className="text-center font-medium">ANALISA</div>,
      cell: ({ row }: any) => (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 cursor-pointer"
            title="Analisa"
            onClick={() =>
              handleModal(row.original.kdkppn, row.original.nmkppn, selectedPeriod)
            }
          >
            <CheckCircle className="h-4 w-4 text-red-500" />
          </Button>
        </div>
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
              <Label htmlFor="yearSelectKppn" className="text-sm font-medium">Tahun</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="yearSelectKppn" className="w-full">
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
              <Label htmlFor="periodSelectKppn" className="text-sm font-medium">Jenis Laporan</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger id="periodSelectKppn" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="I">LK Audited</SelectItem>
                  <SelectItem value="II">LK Unaudited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kppnSelect" className="text-sm font-medium">KPPN</Label>
              <SearchableSelect
                options={[
                  { value: "", label: "Semua KPPN" },
                  ...kppnOptions.map(k => ({ value: k.kdkppn, label: `${k.kdkppn} - ${k.nmkppn}` }))
                ]}
                value={selectedKppn}
                onValueChange={setSelectedKppn}
                placeholder="Pilih KPPN"
                searchPlaceholder="Cari kode atau nama KPPN..."
                emptyMessage="KPPN tidak ditemukan."
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
              <CardTitle>Nilai LK KPPN</CardTitle>
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
        <ModalKppn
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
