"use client";

import React, { useState, useEffect } from "react";
import numeral from "numeral";
import {
  Grid3X3,
  BookOpen,
  Edit,
  Save,
  FileSpreadsheet,
  PlusSquare,
  CheckSquare,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import FilterCard from "./filtercard";
import Rekam2 from "./modalrekam2";
import { TableSkeleton } from "@/components/ui/skeleton-loader";

import Swal from "sweetalert2";
import moment from "moment";
import Rekam from "./modalrekam";
import RekamanNotaDinas from "./monitoringND";
import RekamanTantangan from "./modaltantangan";
import RekamKesimpulan from "./modalrekamKesimpulan";
import { toast } from "sonner";
import GenerateCSV from "../GenerateCSV";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";

export default function MonevPnbp() {
  const { user } = useAuth();
  // Fallback to empty strings if user is not yet loaded, logic will listen to user changes
  const kdkanwil = user?.kdkanwil || "";
  const username = user?.username || "";
  const role = user?.role || "";

  const [loading, setLoading] = useState(true);
  const [id, setId] = useState("");
  const [jenisCluster, setJenisCluster] = useState<number | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalRekam, setShowModalRekam] = useState(false);
  const [showRekaman, setShowRekaman] = useState(false);
  const [showTantangan, setShowTantangan] = useState(false);
  const [showModalKesimpulan, setShowModalKesimpulan] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(15);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [sql, setSql] = useState("");
  const [kdsatker, setKdsatker] = useState("");
  const [nmsatker, setNmsatker] = useState("");
  const [nmmppnbp, setNmmppnbp] = useState("");
  const [cek, setCek] = useState(false);
  const [where, setWhere] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [export2, setExport2] = useState(false);
  const [open, setOpen] = useState(false);
  const [tahun, setTahun] = useState("");
  const [triwulan, setTriwulan] = useState("");
  const [ringkasan, setRingkasan] = useState("");
  const [no_surat, setNosurat] = useState("");
  const [tgl_surat, setTglsurat] = useState("");
  const [laporan, setLaporan] = useState<any>(null);
  const [file_surat, setFilesurat] = useState<any>(null);
  const [nd_kanwil, setNdkanwil] = useState<any>(null);

  const [kesesuaian_pnbp, setKesesuaian_pnbp] = useState("");
  const [ketepatan_waktu, setKetepatan_waktu] = useState("");
  const [surat_dispensasi, setSurat_dispensasi] = useState("");
  const [kesesuaian_tarif, setKesesuaian_tarif] = useState("");
  const [tambahan_kepatuhan, setTambahan_kepatuhan] = useState("");

  const [kesesuaian_kas, setKesesuaian_kas] = useState("");
  const [kesesuaian_nomor, setKesesuaian_nomor] = useState("");
  const [ketepatan_lpj, setKetepatan_lpj] = useState("");
  const [kepatuhan_saldo, setKepatuhan_saldo] = useState("");
  const [kesesuaian_transaksi, setKesesuaian_transaksi] = useState("");
  const [tambahan_pelaporan, setTambahan_pelaporan] = useState("");

  const [tren_belanja, setTren_belanja] = useState("");
  const [masalah_penganggaran, setMasalah_penganggaran] = useState("");
  const [masalah_kegiatan, setMasalah_kegiatan] = useState("");
  const [masalah_regulasi, setMasalah_regulasi] = useState("");
  const [masalah_mp, setMasalah_mp] = useState("");
  const [kesesuaian_real_rpd, setKesesuaian_real_rpd] = useState("");
  const [kendala_belanja_lainnya, setKendala_belanja_lainnya] = useState("");

  const [kendala_internal, setKendala_internal] = useState("");
  const [kendala_eksternal, setKendala_eksternal] = useState("");
  const [kendala_jaringan_app, setKendala_jaringan_app] = useState("");
  const [kendala_lokasi, setKendala_lokasi] = useState("");
  const [kesesuaian_pnbp_target, setKesesuaian_pnbp_target] = useState("");
  const [kendala_penerimaan_lainnya, setKendala_penerimaan_lainnya] =
    useState("");

  const [rekomendasi, setRekomendasi] = useState("");

  const [error2, setError2] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState({
    selectedKementerian: "00",
    selectedKanwil: "00",
    selectedJenisMp: "00",
    tahun: "",
    triwulan: "",
  });

  let FilterWhere = "";

  const handleFilterResult = (filterData: any) => {
    const {
      selectedKementerian,
      selectedKanwil,
      tahun,
      triwulan,
      selectedJenisMp,
    } = filterData;

    const addFilterClause = (filter: string, columnName: string) => {
      if (filter !== "00" && filter !== "") {
        if (FilterWhere) {
          return ` AND ${columnName} = '${filter}'`;
        } else {
          return `${columnName} = '${filter}'`;
        }
      }
      return "";
    };
    setFilter(filterData);
    const updatedFilterWhere = addFilterClause(selectedKementerian, "a.kddept");
    const updatedFilterWhere2 = addFilterClause(selectedKanwil, "a.kdkanwil");
    const updatedFilterWhere3 = addFilterClause(tahun, "a.tahun");
    const updatedFilterWhere4 = addFilterClause(triwulan, "a.triwulan");
    const updatedFilterWhere5 = addFilterClause(selectedJenisMp, "a.kdmppnbp");

    const whereClauses = [
      updatedFilterWhere,
      updatedFilterWhere2,
      updatedFilterWhere3,
      updatedFilterWhere4,
      updatedFilterWhere5,
    ].filter(Boolean);

    if (whereClauses.length > 0) {
      FilterWhere = "  " + whereClauses.join(" AND ");
    }

    setWhere(FilterWhere);
    handleCek();
  };

  const handleCek = () => {
    setCek(true);
  };

  useEffect(() => {
    getData();
  }, [page, where]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      getData();
    }, 500);
    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const getData = async () => {
    setLoading(true);

    let finalWhere = where;

    if (searchQuery.trim() !== "") {
      finalWhere +=
        (finalWhere ? " AND " : "") +
        `(
                a.nmsatker ILIKE '%${searchQuery}%'
                OR a.kdsatker ILIKE '%${searchQuery}%'
            )`;
    }

    let filterKanwil = "";
    if (role === "kanwil_djpb") {
      filterKanwil =
        finalWhere + (finalWhere ? " AND " : "") + `a.kdkanwil = '${kdkanwil}'`;
    } else {
      filterKanwil = finalWhere;
    }

    const query = `SELECT a.id, a.tahun, a.triwulan, a.kdkanwil, a.nmkanwil, a.kddept, a.kdsatker, a.nmsatker, a.target, a.setoran, a.persen_pnbp, a.mp_riil, a.pagu_belanja, a.mp_pnbp, a.kdmppnbp, b.nmmppnbp,
            a.real_belanja, a.persen_belanja, a.selisih_belanja_mp_riil, a.nd_kanwil, a.tgl_surat, a.no_surat, a.file_surat, a.ringkasan, a.laporan, a.tgl_kirim, a.tgl_upload_koord, a.kesesuaian_pnbp, a.ketepatan_waktu, a.surat_dispensasi,
            a.kesesuaian_tarif, a.tambahan_kepatuhan, a.kesesuaian_kas, a.kesesuaian_nomor, a.ketepatan_lpj, a.kepatuhan_saldo, a.kesesuaian_transaksi, a.tambahan_pelaporan, a.tren_belanja, a.masalah_penganggaran, a.masalah_kegiatan, a.masalah_regulasi,
            a.masalah_mp, a.kesesuaian_real_rpd, a.kendala_belanja_lainnya, a.kendala_internal, a.kendala_eksternal, a.kendala_jaringan_app, a.kendala_lokasi, a.kesesuaian_pnbp_target, a.kendala_penerimaan_lainnya, a.rekomendasi
  FROM laporan_2023.monev_pnbp a LEFT JOIN dbref.ref_mp_pnbp b ON a.kdmppnbp=b.kdmppnbp
  ${filterKanwil ? `WHERE ${filterKanwil}` : ""}
  ORDER BY a.tgl_kirim DESC`;

    const encodedQuery = btoa(query);

    setSql(query);

    try {
      const url =
        process.env.NEXT_PUBLIC_TAYANGMONEVPNBP || "/api/tayang-monev-pnbp";
      const response = await http.get(
        `${url}?query=${encodedQuery}&limit=${limit}&page=${page}&user=${username}`,
      );

      const result = response.data;
      setData(result.result || []);
      setPages(result.totalPages || 0);
      setRows(result.totalRows || 0);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast.error(
        error?.message || "Terjadi Permasalahan Koneksi atau Server Backend",
      );
    }
  };

  const handleRekam = async (nd_kanwil?: any) => {
    setNdkanwil(nd_kanwil);
    setShowModal(true);
    setCek(false);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    getData();
    setCek(true);
  };

  const handleRekamMonev = async (
    id: string,
    nmmppnbp: string,
    nmsatker: string,
    kdsatker: string,
    tahun: string,
    triwulan: string,
    ringkasan: string,
    no_surat: string,
    tgl_surat: string,
    laporan: any,
    file_surat: any,
  ) => {
    setId(id);
    setNmmppnbp(nmmppnbp);
    setNmsatker(nmsatker);
    setKdsatker(kdsatker);
    setShowModalRekam(true);
    setTahun(tahun);
    setTriwulan(triwulan);
    setRingkasan(ringkasan);
    setNosurat(no_surat);
    setTglsurat(tgl_surat);
    setLaporan(laporan);
    setFilesurat(file_surat);
  };

  const handleCloseModalMonev = () => {
    setShowModalRekam(false);
    setOpen(false);
    getData();
  };

  const handleRekamTantangan = ({
    id,
    jenis,
    kesesuaian_pnbp = "",
    ketepatan_waktu = "",
    surat_dispensasi = "",
    kesesuaian_tarif = "",
    tambahan_kepatuhan = "",
    kesesuaian_kas = "",
    kesesuaian_nomor = "",
    ketepatan_lpj = "",
    kepatuhan_saldo = "",
    kesesuaian_transaksi = "",
    tambahan_pelaporan = "",
    tren_belanja = "",
    masalah_penganggaran = "",
    masalah_kegiatan = "",
    masalah_regulasi = "",
    masalah_mp = "",
    kesesuaian_real_rpd = "",
    kendala_belanja_lainnya = "",
    kendala_internal = "",
    kendala_eksternal = "",
    kendala_jaringan_app = "",
    kendala_lokasi = "",
    kesesuaian_pnbp_target = "",
    kendala_penerimaan_lainnya = "",
    rekomendasi = "",
  }: any) => {
    setShowTantangan(true);
    setId(id);
    setJenisCluster(Number(jenis));
    setKesesuaian_pnbp(kesesuaian_pnbp);
    setKetepatan_waktu(ketepatan_waktu);
    setSurat_dispensasi(surat_dispensasi);
    setKesesuaian_tarif(kesesuaian_tarif);
    setTambahan_kepatuhan(tambahan_kepatuhan);
    setKesesuaian_kas(kesesuaian_kas);

    setKesesuaian_nomor(kesesuaian_nomor);
    setKetepatan_lpj(ketepatan_lpj);
    setKepatuhan_saldo(kepatuhan_saldo);
    setKesesuaian_transaksi(kesesuaian_transaksi);
    setTambahan_pelaporan(tambahan_pelaporan);
    setTren_belanja(tren_belanja);
    setMasalah_penganggaran(masalah_penganggaran);

    setMasalah_kegiatan(masalah_kegiatan);
    setMasalah_regulasi(masalah_regulasi);
    setMasalah_mp(masalah_mp);
    setKesesuaian_real_rpd(kesesuaian_real_rpd);
    setKendala_belanja_lainnya(kendala_belanja_lainnya);
    setKendala_internal(kendala_internal);
    setKendala_eksternal(kendala_eksternal);
    setKendala_jaringan_app(kendala_jaringan_app);

    setKendala_lokasi(kendala_lokasi);
    setKesesuaian_pnbp_target(kesesuaian_pnbp_target);
    setKendala_penerimaan_lainnya(kendala_penerimaan_lainnya);
    setRekomendasi(rekomendasi);
  };

  const handleCloseModalTantangan = () => {
    setShowTantangan(false);
  };

  const handleRekamKesimpulan = () => {
    setShowModalKesimpulan(true);
  };

  const handleCloseModalKesimpulan = () => {
    setShowModalKesimpulan(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSaveSuccessRekam = async (file: File | null) => {
    await getData();
    setNdkanwil(file);
    setShowModal(false);
  };

  const handleSaveSuccessRekam2 = async (
    updatedRingkasan: string,
    updatedNosurat: string,
    updatedTglsurat: string,
    updatedLaporan: any,
    updatedFilesurat: any,
  ) => {
    await getData();
    setRingkasan(updatedRingkasan);
    setNosurat(updatedNosurat);
    setTglsurat(updatedTglsurat);
    setLaporan(updatedLaporan);
    setFilesurat(updatedFilesurat);
    setShowModalRekam(false);
  };

  const handleSaveSuccessTantangan = async (id: any, ...args: any[]) => {
    await getData();
    setShowTantangan(false);
  };

  const handledownload = async (id: string) => {
    const intId = parseInt(id, 10);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASIC_URL || "https://api.example.com";
    const fileUrl = `${baseUrl}/ND_Kanwil/download/${intId}`;

    try {
      const response = await http.get(fileUrl, {
        responseType: "blob",
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ND_Kanwil_${intId}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengunduh file");
    }
  };

  const halaman = (newPage: number) => {
    setPage(newPage);
  };

  const handleStatus = (status: boolean, total: number) => {
    setLoadingStatus(status);
    setExport2(status);

    if (total === 0) {
      setLoadingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Monitoring dan Evaluasi PNBP
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoring dan evaluasi penerimaan negara bukan pajak per satuan kerja.
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <FilterCard onFilter={handleFilterResult} />

      {/* Filter badges */}
      {(filter.selectedKanwil !== "00" ||
        filter.selectedKementerian !== "00" ||
        filter.tahun !== "" ||
        filter.triwulan !== "" ||
        filter.selectedJenisMp !== "00") && (
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              Filter Aktif
            </Badge>
            {filter.tahun !== "" && (
              <Badge variant="secondary">Tahun {filter.tahun}</Badge>
            )}
            {filter.triwulan !== "" && (
              <Badge variant="secondary">Triwulan {filter.triwulan}</Badge>
            )}
            {filter.selectedKementerian !== "00" && (
              <Badge variant="secondary">
                Kementerian {filter.selectedKementerian}
              </Badge>
            )}
            {filter.selectedKanwil !== "00" && (
              <Badge variant="secondary">
                Kanwil {filter.selectedKanwil}
              </Badge>
            )}
            {filter.selectedJenisMp !== "00" && (
              <Badge variant="secondary">
                Jenis PNBP {filter.selectedJenisMp}
              </Badge>
            )}
          </div>
        )}

      <section className="section">
        <Card className="border shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2 px-6">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Input
                type="text"
                placeholder="Cari Satker..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSearch(e.target.value)
                }
                className="min-w-[200px]"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
              {(role === "kantor_pusat" ||
                role === "ditpa" ||
                role === "co_admin" ||
                role === "super_admin") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => setShowRekaman(true)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Monitoring ND
                  </Button>
                )}

              {role === "kanwil_djpb" && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-9"
                  onClick={() => handleRekam()}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Rekam ND Kanwil
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => handleRekamKesimpulan()}
              >
                <Save className="w-4 h-4 mr-2" />
                Kesimpulan
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setLoadingStatus(true);
                  setExport2(true);
                }}
                disabled={loadingStatus}
              >
                {loadingStatus ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 mx-1" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </div>

          <CardContent>
            {loading ? (
              <TableSkeleton rows={10} />
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        No.
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Periode (Y/Q)
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Satker
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Target PNBP
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Setoran PNBP
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        % Penerimaan
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        MP Riil
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Pagu Belanja
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        MP PNBP
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Jenis PNBP
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Real Belanja
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        % Real Belanja
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Selisih (Real Belanja - MP Riil)
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Hasil Koordinasi
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Kepatuhan
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Pelaporan
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Pelaksanaan
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Penerimaan
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Rekomendasi
                      </TableHead>
                      <TableHead className="text-center font-semibold text-muted-foreground">
                        Tgl Kirim ND
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="text-center">
                    {data.map((row: any, index: number) => (
                      <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {index + 1 + page * limit}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.tahun}/{row.triwulan}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.nmsatker} ({row.kdsatker})
                        </TableCell>
                        <TableCell className="text-center">
                          {numeral(row.target).format("0,0")}
                        </TableCell>
                        <TableCell className="text-center">
                          {numeral(row.setoran).format("0,0")}
                        </TableCell>
                        <TableCell className="text-center">
                          {(row.persen_pnbp * 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {numeral(row.mp_riil).format("0,0")}
                        </TableCell>
                        <TableCell className="text-center">
                          {numeral(row.pagu_belanja).format("0,0")}
                        </TableCell>
                        <TableCell className="text-center">
                          {numeral(row.mp_pnbp).format("0,0")}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.nmmppnbp}
                        </TableCell>
                        <TableCell className="text-center">
                          {numeral(row.real_belanja).format("0,0")}
                        </TableCell>
                        <TableCell className="text-center">
                          {(row.persen_belanja * 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {numeral(row.selisih_belanja_mp_riil).format(
                            "0,0",
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {role !== "kppn" && role !== "lainnya" && (
                            <PlusSquare
                              className="text-primary mx-3 cursor-pointer w-[17px] h-[17px]"
                              onClick={() =>
                                handleRekamMonev(
                                  row.id,
                                  row.nmmppnbp,
                                  row.nmsatker,
                                  row.kdsatker,
                                  row.tahun,
                                  row.triwulan,
                                  row.ringkasan,
                                  row.no_surat,
                                  row.tgl_surat,
                                  row.laporan,
                                  row.file_surat,
                                )
                              }
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <CheckSquare
                            className={`${row.triwulan === "1" ||
                              row.triwulan === "3"
                              ? "text-red-500"
                              : row.kesesuaian_pnbp !== "" &&
                                row.ketepatan_waktu !== "" &&
                                row.surat_dispensasi !== "" &&
                                row.kesesuaian_tarif !== "" &&
                                row.tambahan_kepatuhan !== ""
                                ? "text-green-500"
                                : "text-yellow-500"
                              } mx-3 cursor-pointer w-5 h-5`}
                            onClick={() => {
                              if (
                                row.triwulan !== "1" &&
                                row.triwulan !== "3"
                              )
                                handleRekamTantangan({
                                  id: row.id,
                                  jenis: 1,
                                  kesesuaian_pnbp: row.kesesuaian_pnbp,
                                  ketepatan_waktu: row.ketepatan_waktu,
                                  surat_dispensasi:
                                    row.surat_dispensasi,
                                  kesesuaian_tarif:
                                    row.kesesuaian_tarif,
                                  tambahan_kepatuhan:
                                    row.tambahan_kepatuhan,
                                });
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <CheckSquare
                            className={`${row.triwulan === "1" ||
                              row.triwulan === "3"
                              ? "text-red-500"
                              : row.kesesuaian_kas !== "" &&
                                row.kesesuaian_nomor !== "" &&
                                row.ketepatan_lpj !== "" &&
                                row.kepatuhan_saldo !== "" &&
                                row.kesesuaian_transaksi !== "" &&
                                row.tambahan_pelaporan !== ""
                                ? "text-green-500"
                                : "text-yellow-500"
                              } mx-3 cursor-pointer w-5 h-5`}
                            onClick={() => {
                              if (
                                row.triwulan !== "1" &&
                                row.triwulan !== "3"
                              )
                                handleRekamTantangan({
                                  id: row.id,
                                  jenis: 2,
                                  kesesuaian_kas: row.kesesuaian_kas,
                                  kesesuaian_nomor:
                                    row.kesesuaian_nomor,
                                  ketepatan_lpj: row.ketepatan_lpj,
                                  kepatuhan_saldo: row.kepatuhan_saldo,
                                  kesesuaian_transaksi:
                                    row.kesesuaian_transaksi,
                                  tambahan_pelaporan:
                                    row.tambahan_pelaporan,
                                });
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <CheckSquare
                            className={`${row.triwulan === "1" ||
                              row.triwulan === "3"
                              ? "text-red-500"
                              : row.tren_belanja !== "" &&
                                row.masalah_penganggaran !== "" &&
                                row.masalah_kegiatan !== "" &&
                                row.masalah_regulasi !== "" &&
                                row.masalah_mp !== "" &&
                                row.kesesuaian_real_rpd !== "" &&
                                row.kendala_belanja_lainnya !== ""
                                ? "text-green-500"
                                : "text-yellow-500"
                              } mx-3 cursor-pointer w-5 h-5`}
                            onClick={() => {
                              if (
                                row.triwulan !== "1" &&
                                row.triwulan !== "3"
                              )
                                handleRekamTantangan({
                                  id: row.id,
                                  jenis: 3,
                                  tren_belanja: row.tren_belanja,
                                  masalah_penganggaran:
                                    row.masalah_penganggaran,
                                  masalah_kegiatan:
                                    row.masalah_kegiatan,
                                  masalah_regulasi:
                                    row.masalah_regulasi,
                                  masalah_mp: row.masalah_mp,
                                  kesesuaian_real_rpd:
                                    row.kesesuaian_real_rpd,
                                  kendala_belanja_lainnya:
                                    row.kendala_belanja_lainnya,
                                });
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <CheckSquare
                            className={`${row.triwulan === "1" ||
                              row.triwulan === "3"
                              ? "text-red-500"
                              : row.kendala_internal !== "" &&
                                row.kendala_eksternal !== "" &&
                                row.kendala_jaringan_app !== "" &&
                                row.kendala_lokasi !== "" &&
                                row.kesesuaian_pnbp_target !== ""
                                ? "text-green-500"
                                : "text-yellow-500"
                              } mx-3 cursor-pointer w-5 h-5`}
                            onClick={() => {
                              if (
                                row.triwulan !== "1" &&
                                row.triwulan !== "3"
                              )
                                handleRekamTantangan({
                                  id: row.id,
                                  jenis: 4,
                                  kendala_internal:
                                    row.kendala_internal,
                                  kendala_eksternal:
                                    row.kendala_eksternal,
                                  kendala_jaringan_app:
                                    row.kendala_jaringan_app,
                                  kendala_lokasi: row.kendala_lokasi,
                                  kesesuaian_pnbp_target:
                                    row.kesesuaian_pnbp_target,
                                });
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <CheckSquare
                            className={`${row.triwulan === "1" ||
                              row.triwulan === "3"
                              ? "text-red-500"
                              : row.rekomendasi !== ""
                                ? "text-green-500"
                                : "text-yellow-500"
                              } mx-3 cursor-pointer w-5 h-5`}
                            onClick={() => {
                              if (
                                row.triwulan !== "1" &&
                                row.triwulan !== "3"
                              )
                                handleRekamTantangan({
                                  id: row.id,
                                  jenis: 5,
                                  rekomendasi: row.rekomendasi,
                                });
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          {moment(row.tgl_kirim).format(
                            "DD-MM-YYYY HH:mm:ss",
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-5">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan{" "}
                    <span className="font-medium text-foreground">
                      {numeral(rows).format("0,0")}
                    </span>{" "}
                    data. Halaman{" "}
                    <span className="font-medium text-foreground">
                      {rows ? page + 1 : 0}
                    </span>{" "}
                    dari{" "}
                    <span className="font-medium text-foreground">
                      {pages}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => halaman(Math.max(0, page - 1))}
                            className={
                              page === 0
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {/* Show first page if we are far ahead */}
                        {page > 2 && (
                          <PaginationItem>
                            <PaginationLink onClick={() => halaman(0)}>
                              1
                            </PaginationLink>
                          </PaginationItem>
                        )}

                        {/* Ellipsis if needed */}
                        {page > 2 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}

                        {/* Previous page if exists */}
                        {page > 0 && (
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => halaman(page - 1)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )}

                        {/* Current page */}
                        <PaginationItem>
                          <PaginationLink isActive>{page + 1}</PaginationLink>
                        </PaginationItem>

                        {/* Next page if exists */}
                        {page < pages - 1 && (
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => halaman(page + 1)}
                            >
                              {page + 2}
                            </PaginationLink>
                          </PaginationItem>
                        )}

                        {/* Ellipsis if more pages */}
                        {page < pages - 3 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}

                        {/* Last page if we are far behind */}
                        {page < pages - 1 && page < pages - 2 && (
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => halaman(pages - 1)}
                            >
                              {pages}
                            </PaginationLink>
                          </PaginationItem>
                        )}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              halaman(Math.min(pages - 1, page + 1))
                            }
                            className={
                              page === pages - 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
              </>
            )}
        </CardContent>
        </Card>

        {export2 && (
          <GenerateCSV
            query3={sql}
            status={handleStatus}
            namafile={`v3_CSV_MONEV_PNBP_${moment().format(
              "DDMMYY-HHmmss",
            )}`}
          />
        )}
      </section>

      <Rekam2
        show={showModalRekam}
        onHide={handleCloseModalMonev}
        id={id}
        tahun={tahun}
        triwulan={triwulan}
        kdsatker={kdsatker}
        nmsatker={nmsatker}
        nmmppnbp={nmmppnbp}
        ringkasanpilih={ringkasan}
        laporanpilih={laporan}
        nosuratpilih={no_surat}
        tglsuratpilih={tgl_surat}
        filesuratpilih={file_surat}
        onSaveSuccess={handleSaveSuccessRekam2}
      />
      {
        open && (
          <Rekam
            show={showModal}
            onHide={handleCloseModal}
            tahun={tahun}
            triwulan={triwulan}
            kdkanwil={kdkanwil}
            ndkanwilpilih={nd_kanwil}
            onSaveSuccess={handleSaveSuccessRekam}
          />
        )
      }
      <RekamanNotaDinas
        show={showRekaman}
        onHide={() => setShowRekaman(false)}
      />
      <RekamanTantangan
        show={showTantangan}
        onHide={() => setShowTantangan(false)}
        id={id}
        jenis={jenisCluster}
        kesesuaian_pnbp_isi={kesesuaian_pnbp}
        ketepatan_waktu_isi={ketepatan_waktu}
        surat_dispensasi_isi={surat_dispensasi}
        kesesuaian_tarif_isi={kesesuaian_tarif}
        tambahan_kepatuhan_isi={tambahan_kepatuhan}
        kesesuaian_kas_isi={kesesuaian_kas}
        kesesuaian_nomor_isi={kesesuaian_nomor}
        ketepatan_lpj_isi={ketepatan_lpj}
        kepatuhan_saldo_isi={kepatuhan_saldo}
        kesesuaian_transaksi_isi={kesesuaian_transaksi}
        tambahan_pelaporan_isi={tambahan_pelaporan}
        tren_belanja_isi={tren_belanja}
        masalah_penganggaran_isi={masalah_penganggaran}
        masalah_kegiatan_isi={masalah_kegiatan}
        masalah_regulasi_isi={masalah_regulasi}
        masalah_mp_isi={masalah_mp}
        kesesuaian_real_rpd_isi={kesesuaian_real_rpd}
        kendala_belanja_lainnya_isi={kendala_belanja_lainnya}
        kendala_internal_isi={kendala_internal}
        kendala_eksternal_isi={kendala_eksternal}
        kendala_jaringan_app_isi={kendala_jaringan_app}
        kendala_lokasi_isi={kendala_lokasi}
        kesesuaian_pnbp_target_isi={kesesuaian_pnbp_target}
        kendala_penerimaan_lainnya_isi={kendala_penerimaan_lainnya}
        rekomendasi_isi={rekomendasi}
        onSaveSuccess={handleSaveSuccessTantangan}
      />
      <RekamKesimpulan
        show={showModalKesimpulan}
        onHide={handleCloseModalKesimpulan}
      />{" "}
    </div >
  );
}
