import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, FileSpreadsheet, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import { cn } from "@/lib/utils/utils";
import ReactPaginate from "react-paginate";
import numeral from "numeral";
import moment from "moment";
import GenerateCSV from "@/components/GenerateCSV";
import ModalTpid from "./modal-tpid";
import kdkanwilJson from "@/data/kdkanwil.json";

// Helper for encryption placeholder
const Encrypt = (text: string) => {
  if (typeof window !== "undefined") {
    return window.btoa(text);
  }
  return text;
};

interface TpidData {
  id: number;
  thang: string;
  triwulan: string;
  kdkanwil: string;
  nmkanwil: string;
  proker: string;
  [key: string]: any;
}

export default function RekamTpid() {
  const { user } = useAuth();
  const role = user?.role || "";
  const kdkanwilUser = user?.kdkanwil || "";
  const username = user?.username || "";

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<TpidData[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(25);
  const [pages, setPages] = useState<number>(0);
  const [rows, setRows] = useState<number>(0);

  const [idCluster, setIdCluster] = useState<number | null>(null);
  const [jenisCluster, setJenisCluster] = useState<string | null>(null);
  const [keterangan, setKeterangan] = useState<string>("");
  const [rekomendasi, setRekomendasi] = useState<string>("");

  const [kanwil, setKanwil] = useState<string>("00");
  const [namaProker, setNamaProker] = useState<string>("00");
  const [namaThang, setNamaThang] = useState<string>("2025");
  const [namaTriwulan, setNamaTriwulan] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sql, setSql] = useState<string>("");
  const [sqlunduh, setSqlunduh] = useState<string>("");
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [export2, setExport2] = useState<boolean>(false);

  // Derive unique kanwil options from JSON
  const kanwilOptions = React.useMemo(() => {
    const uniqueKanwils = new Map();
    kdkanwilJson.forEach((item: any) => {
      if (!uniqueKanwils.has(item.kdkanwil)) {
        uniqueKanwils.set(item.kdkanwil, item.nmkanwil);
      }
    });
    return Array.from(uniqueKanwils.entries())
      .map(([kd, nm]) => ({
        kdkanwil: kd,
        nmkanwil: nm,
      }))
      .sort((a, b) => a.kdkanwil.localeCompare(b.kdkanwil));
  }, []);

  useEffect(() => {
    // If role is kanwil (mapped to kanwil_djpb in new system, or legacy "2"), set default kanwil
    if (role === "kanwil_djpb" || (role as string) === "2") {
      setKanwil(kdkanwilUser);
    }
  }, [role, kdkanwilUser]);

  useEffect(() => {
    getData();
  }, [page, kanwil, namaProker, namaThang, namaTriwulan, searchQuery]);

  const getData = async () => {
    setLoading(true);
    const kanwilFilter = kanwil === "00" ? "" : `a.kdkanwil = '${kanwil}'`;
    const prokerFilter =
      namaProker === "00" ? "" : `a.proker = '${namaProker}'`; // Use full string for proker matching
    const triwulanFilter = `a.triwulan='${namaTriwulan}'`;
    const thangFilter = `a.thang='${namaThang}'`;

    const whereClause = [
      kanwilFilter,
      prokerFilter,
      thangFilter,
      triwulanFilter,
    ]
      .filter(Boolean)
      .concat(
        searchQuery
          ? [
            `(a.kdkanwil LIKE '%${searchQuery}%' or
            b.nmkanwil LIKE '%${searchQuery}%' or
            a.proker LIKE '%${searchQuery}%')`,
          ]
          : []
      )
      .concat(
        role === "kanwil_djpb" || (role as string) === "2"
          ? [`a.kdkanwil = '${kdkanwilUser}'`]
          : []
      )
      .join(" AND ");

    // Query for CSV download (selects all relevant columns)
    // Adjusting for year differences if schema differs between 2024/2025 like in original code
    // Assuming schema is somewhat consistent or handled by backend view
    const tableSuffix = namaThang === "2025" ? "2025" : "2024";
    const refKanwilTable = `dbref.t_kanwil_${tableSuffix}`;

    // Using cleaned up query construction
    const queryBase = `SELECT a.id,a.thang,a.triwulan,a.kdkanwil,b.nmkanwil,a.proker,a.ket1_kl, a.ket2_kl, a.ket3_kl, a.ket4_kl, a.ket5_kl, a.ket6_kl, a.ket7_tkd, a.ket8_tkd, a.ket9_tkd, a.ket10_tkd, a.ket11_tkd, a.ket12_tkd, 
      a.rekom1_kl, a.rekom2_kl, a.rekom3_kl, a.rekom4_kl, a.rekom5_kl, a.rekom6_kl, a.rekom7_tkd, a.rekom8_tkd, a.rekom9_tkd, a.rekom10_tkd, a.rekom11_tkd, a.rekom12_tkd FROM laporan_2023.permasalahan_inflasi a
      LEFT JOIN ${refKanwilTable} b ON a.kdkanwil=b.kdkanwil
      ${whereClause ? `WHERE ${whereClause}` : ""}
      ORDER BY kdkanwil ASC`;

    // Query for download with aliases
    const queryUnduh = `SELECT a.id,a.thang,a.triwulan,a.kdkanwil,b.nmkanwil,a.proker,
      a.ket1_kl as ket_penganggaran_kl, a.ket2_kl as ket_pbj_kl, a.ket3_kl as ket_eksekusi_kl, a.ket4_kl as ket_regulasi_kl, a.ket5_kl as ket_sdm_kl, a.ket6_kl as ket_lainnya_kl, 
      a.ket7_tkd as ket_penganggaran_tkd, a.ket8_tkd as ket_pbj_tkd, a.ket9_tkd as ket_eksekusi_tkd, a.ket10_tkd as ket_regulasi_tkd, a.ket11_tkd as ket_sdm_tkd, a.ket12_tkd as ket_lainnya_tkd, 
      a.rekom1_kl as rekom_penganggaran_kl, a.rekom2_kl as rekom_pbj_kl, a.rekom3_kl as rekom_eksekusi_kl, a.rekom4_kl as rekom_regulasi_kl, a.rekom5_kl as rekom_sdm_kl, a.rekom6_kl as rekom_lainnya_kl, 
      a.rekom7_tkd as rekom_penganggaran_tkd, a.rekom8_tkd as rekom_pbj_tkd, a.rekom9_tkd as rekom_eksekusi_tkd, a.rekom10_tkd as rekom_regulasi_tkd, a.rekom11_tkd as rekom_sdm_tkd, a.rekom12_tkd as rekom_lainnya_tkd 
      FROM laporan_2023.permasalahan_inflasi a
      LEFT JOIN ${refKanwilTable} b ON a.kdkanwil=b.kdkanwil
      ${whereClause ? `WHERE ${whereClause}` : ""}
      ORDER BY kdkanwil ASC`;

    setSqlunduh(cleanQuery(queryUnduh));
    const cleanedQuery = cleanQuery(queryBase);
    setSql(cleanedQuery);

    // Encrypt for API
    const encryptedQuery = Encrypt(cleanedQuery);

    try {
      const endpoint = apiPath("/tpid/permasalahan/view");

      const fetchLimit = 100000;
      const response = await http.get(
        `${endpoint}?queryParams=${encryptedQuery}&limit=${fetchLimit}&page=0&user=${username}`
      );

      const resultData = response.data.result || [];
      const totalCount = resultData.length;

      setData(resultData);
      setPages(Math.ceil(totalCount / limit));
      setRows(totalCount);
    } catch (error: any) {
      // In development/porting phase, if endpoint doesn't exist, we might want to mock or just log
      console.error("Fetch error:", error);
      const msg =
        error.response?.data?.error ||
        "Terjadi Permasalahan Koneksi atau Server Backend";
      toast.error(msg);
      setData([]); // Reset on error
    } finally {
      setLoading(false);
    }
  };

  const cleanQuery = (query: string) => {
    const encoded = encodeURIComponent(query);
    return decodeURIComponent(encoded)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const handleRekam = (
    id: number,
    jenis: string,
    keterangan: string,
    rekomendasi: string
  ) => {
    setIdCluster(id);
    setJenisCluster(jenis);
    setKeterangan(keterangan);
    setRekomendasi(rekomendasi);
    setShowModal(true);
  };

  const handleSaveSuccess = async (
    updatedKeterangan: string,
    updatedRekomendasi: string
  ) => {
    await getData(); // Refresh data
    setKeterangan(updatedKeterangan);
    setRekomendasi(updatedRekomendasi);
    setShowModal(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setKanwil("00");
      setNamaProker("00");
    }
    setPage(0); // Reset to first page on search
  };

  const handlePageClick = (selectedItem: { selected: number }) => {
    setPage(selectedItem.selected);
  };

  const handleStatus = (status: boolean, total: number) => {
    setLoadingStatus(status);
    setExport2(status);
    if (total === 0) {
      setLoadingStatus(false);
    }
  };

  const getQuarterLabel = () => {
    return `${namaThang} Triwulan ${namaTriwulan}`;
  };

  const checklistHeadClass =
    "text-center text-xs h-auto py-2 w-[110px] min-w-[110px] max-w-[110px] whitespace-normal break-words leading-tight px-1";
  const checklistCellClass =
    "text-center w-[110px] min-w-[110px] max-w-[110px] p-1";

  // Helper to render check icon or status
  const StatusIcon = ({
    active,
    filled,
    onClick,
    disabled,
  }: {
    active?: boolean;
    filled: boolean;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <div className="flex justify-center">
      <Button
        variant="outline"
        size="sm"
        onClick={disabled ? undefined : onClick}
        className={cn("h-8 w-8 p-0", disabled ? "pointer-events-none" : "")}
        title={active || filled ? "Sudah direkam" : "Belum direkam"}
      >
        <CheckSquare
          className={cn(
            "h-4 w-4",
            active || filled ? "text-blue-600" : "text-amber-600"
          )}
        />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Tantangan/ Kendala TPID</h1>
          <p className="text-sm text-muted-foreground">
            Rekam data tantangan dan kendala TPID serta rekomendasi belanja K/L dan TKD.
          </p>
        </div>
        <div>
          <Button
            variant="default"
            className="w-32 flex items-center justify-center gap-2"
            onClick={() => {
              setLoadingStatus(true);
              setExport2(true);
            }}
            disabled={loadingStatus}
          >
            {loadingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {loadingStatus ? "Loading..." : "Download"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">


        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
              <label className="text-sm font-medium">Tahun</label>
              <Select value={namaThang} onValueChange={setNamaThang}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
              <div className="space-y-2">
              <label className="text-sm font-medium">Triwulan</label>
              <Select value={namaTriwulan} onValueChange={setNamaTriwulan}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Triwulan I</SelectItem>
                  <SelectItem value="2">Triwulan II</SelectItem>
                  <SelectItem value="3">Triwulan III</SelectItem>
                  <SelectItem value="4">Triwulan IV</SelectItem>
                </SelectContent>
              </Select>
            </div>
              <div className="space-y-2">
              <label className="text-sm font-medium">Kode Kanwil</label>
              <Select
                value={kanwil}
                onValueChange={setKanwil}
                disabled={role === "kanwil_djpb" || (role as string) === "2"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Kanwil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="00">Semua Kanwil</SelectItem>
                  {kanwilOptions.map((opt: any) => (
                    <SelectItem key={opt.kdkanwil} value={opt.kdkanwil}>
                      {opt.kdkanwil} - {opt.nmkanwil}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
              <div className="space-y-2">
              <label className="text-sm font-medium">Nama Proker</label>
              <Select value={namaProker} onValueChange={setNamaProker}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="00">Semua Proker</SelectItem>
                  <SelectItem value="K1-Keterjangkauan Harga">
                    K1-Keterjangkauan Harga
                  </SelectItem>
                  <SelectItem value="K2-Ketersediaan Pasokan">
                    K2-Ketersediaan Pasokan
                  </SelectItem>
                  <SelectItem value="K3-Kelancaran Distribusi">
                    K3-Kelancaran Distribusi
                  </SelectItem>
                  <SelectItem value="K4-Komunikasi Efektif">
                    K4-Komunikasi Efektif
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* CSV Generation Component */}
        {export2 && (
          <GenerateCSV
            query3={sqlunduh}
            status={handleStatus}
            namafile={`v3_CSV_PERMASALAHAN_TPID_${moment().format("DDMMYY-HHmmss")}`}
          />
        )}

        {/* Table Content */}
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Data Tantangan/Kendala TPID</CardTitle>
              <p className="text-sm text-muted-foreground">{getQuarterLabel()}</p>
            </div>
            <div className="w-full sm:w-72">
              <Input
                type="text"
                aria-label="Pencarian data tantangan kendala tpid"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Memuat data...</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead
                    rowSpan={2}
                    className="text-center align-middle font-semibold border-r"
                  >
                    No
                  </TableHead>
                  <TableHead
                    rowSpan={2}
                    className="text-center align-middle font-semibold min-w-[200px] border-r"
                  >
                    Proker TPID
                  </TableHead>
                  <TableHead
                    colSpan={6}
                    className="text-center font-semibold border-b border-r"
                  >
                    Tantangan/Kendala dan Rekomendasi Belanja K/L
                  </TableHead>
                  <TableHead colSpan={6} className="text-center font-semibold text-foreground">
                    Tantangan/Kendala dan Rekomendasi Belanja TKD
                  </TableHead>
                </TableRow>
                <TableRow>
                  {/* K/L Columns */}
                  <TableHead className={`${checklistHeadClass} border-r`}>
                    Penganggaran
                  </TableHead>
                  <TableHead className={`${checklistHeadClass} border-r`}>
                    PBJ (K1 & K4 Tidak Diisi)
                  </TableHead>
                  <TableHead className={`${checklistHeadClass} border-r`}>
                    Eksekusi Kegiatan
                  </TableHead>
                  <TableHead className={`${checklistHeadClass} border-r`}>
                    Regulasi
                  </TableHead>
                  <TableHead className={`${checklistHeadClass} border-r`}>
                    SDM
                  </TableHead>
                  <TableHead className={`${checklistHeadClass} border-r`}>
                    Tantangan Lainnya
                  </TableHead>
                  {/* TKD Columns */}
                  <TableHead className={`${checklistHeadClass} border-r`}>
                    Penganggaran
                  </TableHead>
                  <TableHead className={`${checklistHeadClass} border-r`}>
                    PBJ (K1 & K4 Tidak Diisi)
                  </TableHead>
                  <TableHead className={`${checklistHeadClass} border-r`}>
                    Eksekusi Kegiatan
                  </TableHead>
                  <TableHead className={`${checklistHeadClass} border-r`}>
                    Regulasi
                  </TableHead>
                  <TableHead className={`${checklistHeadClass} border-r`}>
                    SDM
                  </TableHead>
                  <TableHead className={checklistHeadClass}>
                    Tantangan Lainnya
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
                  data
                    .slice(page * limit, (page + 1) * limit)
                    .map((row, index) => {
                      const isK1OrK4 =
                        row.proker === "K1-Keterjangkauan Harga" ||
                        row.proker === "K4-Komunikasi Efektif";
                      return (
                        <TableRow
                          key={row.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="text-center border-r font-medium">
                            {index + 1 + page * limit}
                          </TableCell>
                          <TableCell className="border-r">
                            <div className="font-medium text-xs text-muted-foreground">
                              {row.nmkanwil}
                            </div>
                            <div className="font-bold text-xs mt-1 text-foreground">
                              {row.proker}
                            </div>
                          </TableCell>

                          {/* K/L Cells */}
                          <TableCell className={`${checklistCellClass} border-r`}>
                            <StatusIcon
                              filled={!!row.ket1_kl && !!row.rekom1_kl}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "1",
                                  row.ket1_kl,
                                  row.rekom1_kl
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className={`${checklistCellClass} border-r`}>
                            <StatusIcon
                              active={isK1OrK4}
                              filled={!!row.ket2_kl && !!row.rekom2_kl}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "2",
                                  row.ket2_kl,
                                  row.rekom2_kl
                                )
                              }
                              disabled={isK1OrK4}
                            />
                          </TableCell>
                          <TableCell className={`${checklistCellClass} border-r`}>
                            <StatusIcon
                              filled={!!row.ket3_kl && !!row.rekom3_kl}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "3",
                                  row.ket3_kl,
                                  row.rekom3_kl
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className={`${checklistCellClass} border-r`}>
                            <StatusIcon
                              filled={!!row.ket4_kl && !!row.rekom4_kl}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "4",
                                  row.ket4_kl,
                                  row.rekom4_kl
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className={`${checklistCellClass} border-r`}>
                            <StatusIcon
                              filled={!!row.ket5_kl && !!row.rekom5_kl}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "5",
                                  row.ket5_kl,
                                  row.rekom5_kl
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className={`${checklistCellClass} border-r`}>
                            <StatusIcon
                              filled={!!row.ket6_kl && !!row.rekom6_kl}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "6",
                                  row.ket6_kl,
                                  row.rekom6_kl
                                )
                              }
                            />
                          </TableCell>

                          {/* TKD Cells */}
                          <TableCell className={`${checklistCellClass} border-r`}>
                            <StatusIcon
                              filled={!!row.ket7_tkd && !!row.rekom7_tkd}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "7",
                                  row.ket7_tkd,
                                  row.rekom7_tkd
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className={`${checklistCellClass} border-r`}>
                            <StatusIcon
                              active={isK1OrK4}
                              filled={!!row.ket8_tkd && !!row.rekom8_tkd}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "8",
                                  row.ket8_tkd,
                                  row.rekom8_tkd
                                )
                              }
                              disabled={isK1OrK4}
                            />
                          </TableCell>
                          <TableCell className={`${checklistCellClass} border-r`}>
                            <StatusIcon
                              filled={!!row.ket9_tkd && !!row.rekom9_tkd}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "9",
                                  row.ket9_tkd,
                                  row.rekom9_tkd
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className={`${checklistCellClass} border-r`}>
                            <StatusIcon
                              filled={!!row.ket10_tkd && !!row.rekom10_tkd}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "10",
                                  row.ket10_tkd,
                                  row.rekom10_tkd
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className={`${checklistCellClass} border-r`}>
                            <StatusIcon
                              filled={!!row.ket11_tkd && !!row.rekom11_tkd}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "11",
                                  row.ket11_tkd,
                                  row.rekom11_tkd
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className={checklistCellClass}>
                            <StatusIcon
                              filled={!!row.ket12_tkd && !!row.rekom12_tkd}
                              onClick={() =>
                                handleRekam(
                                  row.id,
                                  "12",
                                  row.ket12_tkd,
                                  row.rekom12_tkd
                                )
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={14}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Data tidak ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!loading && (
              <div className="flex flex-col md:flex-row justify-between items-center pt-1 gap-4">
                <div className="text-sm text-muted-foreground">
                  Menampilkan <span className="font-medium text-foreground">{numeral(rows).format("0,0")}</span> data.
                  Halaman <span className="font-medium text-foreground">{rows ? page + 1 : 0}</span> dari <span className="font-medium text-foreground">{pages}</span>
                </div>
                <div className="flex justify-center">
                  <ReactPaginate
                    previousLabel={
                      <div className="flex items-center gap-1 pl-2.5 pr-4">
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </div>
                    }
                    nextLabel={
                      <div className="flex items-center gap-1 pl-4 pr-2.5">
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    }
                    breakLabel={<span className="px-4">...</span>}
                    pageCount={pages}
                    marginPagesDisplayed={1}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageClick}
                    containerClassName="flex items-center gap-1 select-none"
                    pageClassName="block"
                    pageLinkClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                    activeClassName=""
                    activeLinkClassName="border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground font-bold pointer-events-none"
                    previousClassName="block"
                    previousLinkClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-9"
                    nextClassName="block"
                    nextLinkClassName="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-9"
                    disabledClassName="opacity-50 pointer-events-none"
                    forcePage={page}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ModalTpid
        show={showModal}
        onHide={() => setShowModal(false)}
        id={idCluster}
        jenis={jenisCluster}
        keteranganpilih={keterangan}
        rekomendasipilih={rekomendasi}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}
