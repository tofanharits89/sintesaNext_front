"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { PlusSquare, Trash2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import RekamKontrak from "./rekam-kontrak";

// Table styling dengan fixed column widths
const tableStyles = {
  headerCell: "bg-zinc-800 text-white px-2 py-3 font-semibold text-xs text-center align-middle border-zinc-200 whitespace-nowrap",
  bodyCell: "px-2 py-[10px] text-xs text-center align-middle border-zinc-200 whitespace-nowrap overflow-hidden text-ellipsis",
  noColumn: "w-[50px] min-w-[50px] max-w-[50px]",
  taColumn: "w-[60px] min-w-[60px] max-w-[60px]",
  satkerColumn: "w-[220px] min-w-[220px] max-w-[220px]",
  tglColumn: "w-[110px] min-w-[110px] max-w-[110px]",
  nomorColumn: "w-[240px] min-w-[240px] max-w-[240px]",
  jumlahColumn: "w-[100px] min-w-[100px] max-w-[100px]",
  opsiColumn: "w-[130px] min-w-[130px] max-w-[130px]",
};

interface DataKontrakProps {
  cek: boolean;
  id: string;
  where: string;
}

interface KontrakData {
  id: string;
  thang: string;
  kddept: string;
  kdunit: string;
  kdsatker: string;
  nmsatker: string;
  kdlokasi: string;
  kdkppn: string;
  tgpermohonan: string;
  nopermohonan: string;
  uraian: string;
  jumlah: number;
}

export default function DispenKontrak({ cek, id, where }: DataKontrakProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KontrakData[]>([]);
  const [showModalRekam, setShowModalRekam] = useState(false);
  const [page, setPage] = useState(0);
  const [limit] = useState(10);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [sql, setSql] = useState("");
  const [kdsatker, setKdsatker] = useState("");
  const [nmsatker, setNmsatker] = useState("");
  const [idRekam, setIdRekam] = useState("");
  const [nomor, setNomor] = useState("");
  const [tahun, setTahun] = useState("");
  // const [loadingStatus, setLoadingStatus] = useState(false);
  // const [export2, setExport2] = useState(false);

  useEffect(() => {
    if (cek) {
      getData();
    }
  }, [cek, id, where, page]);

  const getData = async () => {
    setLoading(true);
    let filterKanwil = "";
    if (user?.role === "kanwil_djpb") {
      filterKanwil =
        where + (where ? " AND " : "") + `a.kdkanwil = '${user.kdkanwil}'`;
    } else {
      filterKanwil = where;
    }

    let filterKppn = "";
    if (user?.role === "kppn") {
      filterKppn =
        where + (where ? " AND " : "") + `a.kdkppn = '${user.kdkppn}'`;
    } else {
      filterKppn = where;
    }

    // Menggabungkan filterKanwil dan filterKppn
    let combinedFilter = filterKanwil;
    if (user?.role === "kppn") {
      combinedFilter = filterKppn; // Gunakan filter KPPN jika role adalah kppn
    } else if (filterKanwil && filterKppn) {
      combinedFilter = `${filterKanwil} AND ${filterKppn}`; // Jika dua filter ada, gabungkan keduanya
    }

    // Ensure combinedFilter is not just an empty string if it's used in WHERE
    const finalFilter =
      combinedFilter && combinedFilter.trim() !== "" ? combinedFilter : null;

    const encodedQuery = encodeURIComponent(
      `SELECT a.id,a.thang,a.kddept,a.kdunit,a.kdsatker,c.nmsatker,a.kdlokasi,a.kdkppn,a.tgpermohonan,a.nopermohonan,a.uraian,a.jmlkontrak jumlah,SUM(b.nilkontrak) nilaikontrak FROM laporan_2023.dispensasi_kontrak a LEFT JOIN laporan_2023.dispensasi_kontrak_lampiran b ON a.id=b.id_dispensasi::integer  LEFT JOIN dbref.t_satker_2025 c ON a.kdsatker=c.kdsatker  ${
        finalFilter ? `WHERE ${finalFilter}` : "  "
      }GROUP BY a.id,a.thang,a.kddept,a.kdunit,a.kdsatker,c.nmsatker,a.kdlokasi,a.kdkppn,a.tgpermohonan,a.nopermohonan,a.uraian,a.jmlkontrak ORDER BY a.id DESC`
    );

    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const encodedQuery2 = encodeURIComponent(
      `SELECT a.id,a.kddept,b.nmdept,a.thang,a.kdunit,c.nmunit,a.kdsatker,i.nmsatker,a.kdlokasi,e.nmlokasi,a.kdkanwil,g.nmkanwil,a.kdkppn,h.nmkppn,a.uraian,a.tgpermohonan,
                a.nopermohonan,a.tgpersetujuan,a.nopersetujuan,z.nokontrak,z.tgkontrak,z.nilkontrak,z.status 
                FROM laporan_2023.dispensasi_kontrak a 
                LEFT JOIN laporan_2023.dispensasi_kontrak_lampiran z ON a.id=z.id_dispensasi::integer
                LEFT JOIN dbref.t_dept_2025 b ON a.kddept=b.kddept 
                LEFT JOIN dbref.t_unit_2025 c ON a.kddept=c.kddept AND a.kdunit=c.kdunit 
                LEFT JOIN dbref.t_lokasi_2025 e ON a.kdlokasi=e.kdlokasi 
                LEFT JOIN dbref.t_kanwil_2025 g ON a.kdkanwil=g.kdkanwil 
                LEFT JOIN dbref.t_kppn_2025 h ON a.kdkppn=h.kdkppn 
                LEFT JOIN dbref.t_satker_2025 i ON a.kdsatker=i.kdsatker  ${
                  finalFilter ? `WHERE ${finalFilter}` : " "
                } ORDER BY a.kddept,a.kdsatker,a.id`
    );

    const cleanedQuery2 = decodeURIComponent(encodedQuery2)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    setSql(cleanedQuery2);
    const encryptedQuery = btoa(cleanedQuery);

    try {
      // API endpoint: /api/v1/dispensasi/:query?limit=15&page=0&user=username
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      const apiUrl = `${baseUrl}/dispensasi/${encryptedQuery}?limit=${limit}&page=${page}&user=${
        user?.username || ""
      }`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result || []);
      setPages(result.totalPages || 0);
      setRows(result.totalRows || 0);
      setLoading(false);
    } catch (error) {
      console.error("Data fetch error:", error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
      setLoading(false);
    }
  };

  const handleRekamKontrak = (
    id: string,
    nopermohonan: string,
    nmsatker: string,
    kdsatker: string,
    tahun: string
  ) => {
    setIdRekam(id);
    setNomor(nopermohonan);
    setNmsatker(nmsatker);
    setKdsatker(kdsatker);
    setShowModalRekam(true);
    setTahun(tahun);
  };

  const handleCloseModalSPM = () => {
    setShowModalRekam(false);
    getData();
  };

  const handleHapusDispKontrak = async (id: string, jumlah: number) => {
    const confirmText =
      jumlah > 0
        ? `Ada ${jumlah} Kontrak yang sudah direkam.<br/> Anda yakin ingin menghapus data ini ? `
        : "Anda yakin ingin menghapus data ini ?";

    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      html: confirmText,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      position: "top",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASIC_URL}dispkontrak/delete/${id}`,
          {
            method: "DELETE",
            headers: {
              // Authorization: `Bearer ${user?.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        toast.success("Data telah dihapus.");
        getData();
      } catch (error) {
        toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
      }
    }
  };

  const handledownloadKontrak = async (id: string) => {
    const intId = parseInt(id, 10);
    const fileUrl = `${process.env.NEXT_PUBLIC_BASIC_URL}dispenkontrak/download/${intId}`;

    try {
      const response = await fetch(fileUrl, {
        headers: {
          // Authorization: `Bearer ${user?.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Surat_Persetujuan_Dispen_Kontrak.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        "Terjadi kesalahan saat mendownload file. Silakan coba lagi."
      );
    }
  };

  return (
    <>
      {loading ? (
        <>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-800" />
          </div>
          <br />
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-800" />
          </div>
          <br />
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-800" />
          </div>
        </>
      ) : (
        <>
          <Card className="mt-3">
            <CardContent className="p-0 overflow-x-auto">
              <Table className="w-full min-w-[1300px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className={tableStyles.headerCell + " " + tableStyles.noColumn}>
                      No.
                    </TableHead>
                    <TableHead className={tableStyles.headerCell + " " + tableStyles.taColumn}>
                      TA
                    </TableHead>
                    <TableHead className={tableStyles.headerCell + " " + tableStyles.satkerColumn}>
                      Satker
                    </TableHead>
                    <TableHead className={tableStyles.headerCell + " " + tableStyles.tglColumn}>
                      Tgl Permohonan
                    </TableHead>
                    <TableHead className={tableStyles.headerCell + " " + tableStyles.nomorColumn}>
                      Nomor Permohonan
                    </TableHead>
                    <TableHead className={tableStyles.headerCell + " " + tableStyles.jumlahColumn}>
                      Jumlah Kontrak
                    </TableHead>
                    <TableHead className={tableStyles.headerCell + " " + tableStyles.opsiColumn}>
                      Opsi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-center">
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className={tableStyles.bodyCell + " " + tableStyles.noColumn}>
                        {index + 1 + page * limit}
                      </TableCell>
                      <TableCell className={tableStyles.bodyCell + " " + tableStyles.taColumn}>
                        {row.thang}
                      </TableCell>
                      <TableCell className={tableStyles.bodyCell + " " + tableStyles.satkerColumn}>
                        <div className="overflow-hidden text-ellipsis">
                          {row.nmsatker?.trim()} ({row.kdsatker})
                        </div>
                      </TableCell>
                      <TableCell className={tableStyles.bodyCell + " " + tableStyles.tglColumn}>
                        {row.tgpermohonan}
                      </TableCell>
                      <TableCell className={tableStyles.bodyCell + " " + tableStyles.nomorColumn}>
                        <div className="overflow-hidden text-ellipsis">
                          {row.nopermohonan?.trim()}
                        </div>
                      </TableCell>
                      <TableCell className={tableStyles.bodyCell + " " + tableStyles.jumlahColumn}>
                        {row.jumlah ?? "-"}
                      </TableCell>
                      <TableCell className={tableStyles.bodyCell + " " + tableStyles.opsiColumn}>
                        {/* Rekam Kontrak - hanya untuk non-KPPN */}
                        {user?.role !== "kppn" && (
                          <span title="Rekam Kontrak" className="inline-block">
                            <PlusSquare
                              className="text-green-600 mx-2 cursor-pointer hover:scale-110 transition-transform"
                              size={20}
                              onClick={() =>
                                handleRekamKontrak(
                                  String(row.id),
                                  row.nopermohonan?.trim() || "",
                                  row.nmsatker?.trim() || "",
                                  row.kdsatker,
                                  row.thang
                                )
                              }
                            />
                          </span>
                        )}

                        {/* Hapus Dispensasi - hanya untuk non-KPPN */}
                        {user?.role !== "kppn" && (
                          <span
                            title="Hapus Dispensasi"
                            className="inline-block"
                          >
                            <Trash2
                              className="text-red-600 mx-2 cursor-pointer hover:scale-110 transition-transform"
                              size={20}
                              onClick={() =>
                                handleHapusDispKontrak(
                                  String(row.id),
                                  row.jumlah ?? 0
                                )
                              }
                            />
                          </span>
                        )}

                        {/* Download - untuk semua role */}
                        <span title="Download Dokumen" className="inline-block">
                          <Download
                            className="text-blue-600 mx-2 cursor-pointer hover:scale-110 transition-transform"
                            size={20}
                            onClick={() =>
                              handledownloadKontrak(String(row.id))
                            }
                          />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {data.length > 0 && (
            <div className="flex items-center justify-content-between mt-4 mx-4 text-zinc-800">
              <span>
                Total : {rows.toLocaleString()}, Hal : {rows ? page + 1 : 0} dari {pages}
              </span>
              <nav>
                <ul className="flex items-center justify-center gap-1 mb-0">
                  <li className={`inline-flex ${page === 0 ? "opacity-50 pointer-events-none" : ""}`}>
                    <button
                      className="px-3 py-1 border rounded-l hover:bg-zinc-100"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </li>
                  {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                    let pageNum;
                    if (pages <= 5) {
                      pageNum = i;
                    } else if (page < 3) {
                      pageNum = i;
                    } else if (page > pages - 3) {
                      pageNum = pages - 5 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <li key={pageNum} className="inline-flex">
                        <button
                          className={`px-3 py-1 border ${page === pageNum ? "bg-zinc-800 text-white" : "hover:bg-zinc-100"}`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum + 1}
                        </button>
                      </li>
                    );
                  })}
                  <li className={`inline-flex ${page === pages - 1 ? "opacity-50 pointer-events-none" : ""}`}>
                    <button
                      className="px-3 py-1 border rounded-r hover:bg-zinc-100"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pages - 1}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
      <RekamKontrak
        show={showModalRekam}
        onHide={handleCloseModalSPM}
        tahun={tahun}
        id={idRekam}
        nomor={nomor}
        kdsatker={kdsatker}
        nmsatker={nmsatker}
      />
    </>
  );
}
