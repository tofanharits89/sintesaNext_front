"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Container, Spinner, Table } from "react-bootstrap";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { PlusSquare, Trash2, Download } from "lucide-react";
import RekamTup from "./rekam-tup";
import { Loading2, TableSkeleton } from "../../layout/LoadingTable";
import ReactPaginate from "react-paginate";
// import GenerateCSV from "../CSV/generateCSV";
import moment from "moment";

// Table styling dengan fixed column widths
const tableStyles = {
  container: {
    overflowX: "auto" as const,
    width: "100%",
  },
  table: {
    width: "100%",
    minWidth: "1300px",
    tableLayout: "fixed" as const,
    marginBottom: "0",
  },
  headerCell: {
    padding: "12px 8px",
    fontWeight: "600",
    fontSize: "13px",
    backgroundColor: "#343a40", // dark grey
    color: "#fff", // white text for contrast
    whiteSpace: "nowrap" as const,
    textAlign: "center" as const,
    verticalAlign: "middle",
    borderColor: "#dee2e6",
  },
  bodyCell: {
    padding: "10px 8px",
    fontSize: "12px",
    textAlign: "center" as const,
    verticalAlign: "middle",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  // Column widths
  noColumn: { width: "50px", minWidth: "50px", maxWidth: "50px" },
  taColumn: { width: "60px", minWidth: "60px", maxWidth: "60px" },
  satkerColumn: { width: "220px", minWidth: "220px", maxWidth: "220px" },
  tglColumn: { width: "110px", minWidth: "110px", maxWidth: "110px" },
  nomorColumn: { width: "240px", minWidth: "240px", maxWidth: "240px" },
  jumlahColumn: { width: "100px", minWidth: "100px", maxWidth: "100px" },
  opsiColumn: { width: "130px", minWidth: "130px", maxWidth: "130px" },
};

interface DataTupProps {
  cek: boolean;
  id: string;
  where: string;
}

interface TupData {
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
  username: string;
  kdkanwil_upload: string;
  jumlah: number;
  nilaitup: number;
}

export default function DispenTup({ cek, id, where }: DataTupProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TupData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalRekam, setShowModalRekam] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [sql, setSql] = useState("");
  const [kdsatker, setKdsatker] = useState("");
  const [nmsatker, setNmsatker] = useState("");
  const [cekState, setCekState] = useState(false);
  const [idState, setIdState] = useState("");
  const [nomor, setNomor] = useState("");
  const [tahun, setTahun] = useState("");
  const [error2, setError2] = useState<string | null>(null);

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
      `SELECT a.id,a.thang,a.kddept,a.kdunit,a.kdsatker,c.nmsatker,a.kdlokasi,a.kdkppn,a.tgpermohonan,a.nopermohonan,a.uraian,a.username,a.kdkanwil_upload,a.jmltup jumlah,SUM(b.niltup) nilaitup FROM laporan_2023.dispensasi_tup a LEFT JOIN laporan_2023.dispensasi_tup_lampiran b ON a.id=b.id_dispensasi::integer  LEFT JOIN dbref.t_satker_2025 c ON a.kdsatker=c.kdsatker  ${
        finalFilter ? `WHERE ${finalFilter}` : "  "
      }GROUP BY a.id,a.thang,a.kddept,a.kdunit,a.kdsatker,c.nmsatker,a.kdlokasi,a.kdkppn,a.tgpermohonan,a.nopermohonan,a.uraian,a.username,a.kdkanwil_upload,a.jmltup ORDER BY a.id DESC`
    );

    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const encodedQuery2 = encodeURIComponent(
      `SELECT a.id,a.kddept,b.nmdept,a.thang,a.kdunit,c.nmunit,a.kdsatker,i.nmsatker,a.kdlokasi,e.nmlokasi,a.kdkanwil,g.nmkanwil,a.kdkppn,h.nmkppn,a.uraian,a.tgpermohonan,
                a.nopermohonan,a.tgpersetujuan,a.nopersetujuan,z.notup,z.tgtup,z.niltup,z.status,a.username,a.kdkanwil_upload
                FROM laporan_2023.dispensasi_tup a
                LEFT JOIN laporan_2023.dispensasi_tup_lampiran z ON a.id=z.id_dispensasi::integer
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
      // API endpoint: /api/v1/dispensasi/:query?limit=10&page=0&user=username
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

  const handleRekamTup = async (
    id: string,
    nopermohonan: string,
    nmsatker: string,
    kdsatker: string,
    tahun: string
  ) => {
    setIdState(id);
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

  const handleHapusDispTup = async (id: string, jumlah: number) => {
    const confirmText =
      jumlah > 0
        ? `Ada ${jumlah} TUP yang sudah direkam.<br/> Anda yakin ingin menghapus data ini ? `
        : "Anda yakin ingin menghapus data ini ?";

    Swal.fire({
      title: "Konfirmasi Hapus",
      html: confirmText,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      position: "top",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_LOCAL_BASIC}disptup/delete/${id}`,
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
    });
  };

  const handledownloadTup = async (id: string) => {
    const intId = parseInt(id, 10); // Pastikan ID adalah integer
    const fileUrl = `${process.env.NEXT_PUBLIC_LOCAL_BASIC}dispentup/download/${intId}`;

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

      // Extract the filename from Content-Disposition header
      const contentDisposition = response.headers.get("content-disposition");
      let fileName = "Surat_Persetujuan_Dispen_TUP.pdf"; // Default filename

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2 && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");

      // Set the filename for download
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click(); // Trigger the download
      link.remove(); // Clean up the link element

      // Revoke the object URL to free up resources
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError2("Terjadi kesalahan saat mendownload file. Silakan coba lagi.");
      toast.error(error2 || "Terjadi kesalahan saat mendownload file.");
    }
  };

  const halaman = ({ selected }: { selected: number }) => {
    setPage(selected);
  };

  return (
    <>
      {loading ? (
        <>
          <Loading2 />
          <br />
          <Loading2 />
          <br />
          <Loading2 />
        </>
      ) : (
        <>
          <div className="d-flex justify-content-end align-item-center">
            {/* Download functionality temporarily disabled - GenerateCSV component not available */}
            {/* <Button
              variant="danger"
              size="sm"
              className="my-2 mx-1"
              style={{ marginTop: "1px", width: "150px" }}
              onClick={() => {
                setLoadingStatus(true);
                setExport2(true);
              }}
              disabled={loadingStatus}
            >
              {loadingStatus && (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              )}
              {!loadingStatus && (
                <i className="bi bi-file-earmark-excel-fill mx-2"></i>
              )}
              {loadingStatus ? " Loading..." : "Download"}
            </Button> */}
          </div>
          <Card className="mt-3" bg="light">
            <Card.Body
              className="data-user fade-in"
              style={tableStyles.container}
            >
              <Table
                striped
                bordered
                hover
                responsive
                style={tableStyles.table}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.noColumn,
                      }}
                    >
                      No.
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.taColumn,
                      }}
                    >
                      TA
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.satkerColumn,
                      }}
                    >
                      Satker
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.tglColumn,
                      }}
                    >
                      Tgl Permohonan
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.nomorColumn,
                      }}
                    >
                      Nomor Permohonan
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.jumlahColumn,
                      }}
                    >
                      Jumlah TUP
                    </th>
                    <th
                      style={{
                        ...tableStyles.headerCell,
                        ...tableStyles.opsiColumn,
                      }}
                    >
                      Opsi
                    </th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {data.map((row, index) => (
                    <tr key={index}>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.noColumn,
                        }}
                      >
                        {index + 1 + page * limit}
                      </td>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.taColumn,
                        }}
                      >
                        {row.thang}
                      </td>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.satkerColumn,
                        }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.nmsatker?.trim()} ({row.kdsatker})
                        </div>
                      </td>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.tglColumn,
                        }}
                      >
                        {row.tgpermohonan}
                      </td>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.nomorColumn,
                        }}
                      >
                        <div
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.nopermohonan?.trim()}
                        </div>
                      </td>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.jumlahColumn,
                        }}
                      >
                        {row.jumlah ?? "-"}
                      </td>
                      <td
                        style={{
                          ...tableStyles.bodyCell,
                          ...tableStyles.opsiColumn,
                        }}
                      >
                        {/* Rekam TUP - hanya untuk non-KPPN */}
                        {user?.role !== "kppn" && (
                          <span title="Rekam TUP" className="inline-block">
                            <PlusSquare
                              className="text-success mx-2 cursor-pointer hover:scale-110 transition-transform"
                              size={20}
                              onClick={() =>
                                handleRekamTup(
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
                              className="text-danger mx-2 cursor-pointer hover:scale-110 transition-transform"
                              size={20}
                              onClick={() =>
                                handleHapusDispTup(
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
                            className="text-primary mx-2 cursor-pointer hover:scale-110 transition-transform"
                            size={20}
                            onClick={() => handledownloadTup(String(row.id))}
                          />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          {/* Export functionality temporarily disabled */}
          {/* {export2 && (
            <div className="alert alert-info">
              Export functionality temporarily disabled - GenerateCSV component not available
            </div>
          )} */}
          {data.length > 0 && (
            <>
              <span className="pagination justify-content-between mt-2  mx-4 text-dark">
                Total : {rows.toLocaleString()}, &nbsp; Hal : &nbsp;
                {rows ? page + 1 : 0} dari {pages}
                <nav>
                  <ReactPaginate
                    breakLabel="..."
                    previousLabel={"← Previous"}
                    nextLabel={"Next →"}
                    pageRangeDisplayed={3}
                    marginPagesDisplayed={1}
                    pageCount={pages}
                    renderOnZeroPageCount={null}
                    containerClassName="justify-content-center pagination"
                    previousClassName="page-item"
                    previousLinkClassName="page-link"
                    nextClassName="page-item"
                    nextLinkClassName="page-link"
                    pageClassName="page-item"
                    pageLinkClassName="page-link"
                    breakClassName="page-item"
                    breakLinkClassName="page-link"
                    activeClassName="active"
                    disabledClassName="disabled"
                    onPageChange={halaman}
                    initialPage={page}
                  />
                </nav>
              </span>
            </>
          )}
        </>
      )}
      <RekamTup
        show={showModalRekam}
        onHide={handleCloseModalSPM}
        tahun={tahun}
        id={idState}
        nomor={nomor}
        kdsatker={kdsatker}
        nmsatker={nmsatker}
      />
    </>
  );
}
