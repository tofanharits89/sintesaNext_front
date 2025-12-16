"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Container, Spinner, Table } from "react-bootstrap";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Swal from "sweetalert2";
import RekamKontrak from "./rekam-kontrak";
import ReactPaginate from "react-paginate";
// import GenerateCSV from "../CSV/generateCSV";
import moment from "moment";

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

    const encodedQuery = encodeURIComponent(
      `SELECT a.id,a.thang,a.kddept,a.kdunit,a.kdsatker,c.nmsatker,a.kdlokasi,a.kdkppn,a.tgpermohonan,a.nopermohonan,a.uraian,a.jmlkontrak jumlah,SUM(b.nilkontrak) nilaikontrak FROM laporan_2023.dispensasi_kontrak a LEFT JOIN laporan_2023.dispensasi_kontrak_lampiran b ON a.id=b.id_dispensasi  LEFT JOIN dbref.t_satker_2025 c ON a.kdsatker=c.kdsatker  ${
        combinedFilter ? `WHERE ${combinedFilter}` : "  "
      }GROUP BY a.id order by id desc`
    );

    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const encodedQuery2 = encodeURIComponent(
      `SELECT a.id,a.kddept,b.nmdept,a.thang,a.kdunit,c.nmunit,a.kdsatker,i.nmsatker,a.kdlokasi,e.nmlokasi,a.kdkanwil,g.nmkanwil,a.kdkppn,h.nmkppn,a.uraian,a.tgpermohonan,
                a.nopermohonan,a.tgpersetujuan,a.nopersetujuan,z.nokontrak,z.tgkontrak,z.nilkontrak,z.status 
                FROM laporan_2023.dispensasi_kontrak a 
                LEFT JOIN laporan_2023.dispensasi_kontrak_lampiran z ON a.id=z.id_dispensasi
                LEFT JOIN dbref.t_dept_2025 b ON a.kddept=b.kddept 
                LEFT JOIN dbref.t_unit_2025 c ON a.kddept=c.kddept AND a.kdunit=c.kdunit 
                LEFT JOIN dbref.t_lokasi_2025 e ON a.kdlokasi=e.kdlokasi 
                LEFT JOIN dbref.t_kanwil_2025 g ON a.kdkanwil=g.kdkanwil 
                LEFT JOIN dbref.t_kppn_2025 h ON a.kdkppn=h.kdkppn 
                LEFT JOIN dbref.t_satker_2025 i ON a.kdsatker=i.kdsatker  ${
                  combinedFilter ? `WHERE ${combinedFilter}` : " "
                } ORDER BY a.kddept,a.kdsatker,a.id`
    );

    const cleanedQuery2 = decodeURIComponent(encodedQuery2)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    setSql(cleanedQuery2);
    const encryptedQuery = btoa(cleanedQuery); // Using btoa for base64 encoding

    try {
      // API endpoint: /api/v1/dispensasi/:query?limit=10&page=0&user=username
      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_URL || "/api/v1"
      }/dispensasi/${encryptedQuery}?limit=${limit}&page=${page}&user=${
        user?.username
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

  const halaman = ({ selected }: { selected: number }) => {
    setPage(selected);
  };

  // const handleStatus = (status: boolean, total: number) => {
  //   setLoadingStatus(status);
  //   setExport2(status);

  //   if (total === 0) {
  //     setLoadingStatus(false);
  //   }
  // };

  return (
    <>
      {loading ? (
        <>
          <div className="d-flex justify-content-center">
            <Spinner animation="border" />
          </div>
          <br />
          <div className="d-flex justify-content-center">
            <Spinner animation="border" />
          </div>
          <br />
          <div className="d-flex justify-content-center">
            <Spinner animation="border" />
          </div>
        </>
      ) : (
        <>
          <div className="d-flex justify-content-end align-items-center">
            {/* Download button commented out - GenerateCSV not available */}
          </div>
          <Card className="mt-3" bg="light">
            <Card.Body className="data-user fade-in">
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th className="text-header text-center">No.</th>
                    <th className="text-header text-center">TA</th>
                    <th className="text-header text-center">Satker</th>
                    <th className="text-header text-center">Tgl Permohonan</th>
                    <th className="text-header text-center">
                      Nomor Permohonan
                    </th>
                    <th className="text-header text-center">Jumlah Kontrak</th>
                    <th className="text-header text-center">Opsi</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {data.map((row, index) => (
                    <tr key={index}>
                      <td className="align-middle text-center">
                        {index + 1 + page * limit}
                      </td>
                      <td className="align-middle text-center">{row.thang}</td>
                      <td className="align-middle text-center">
                        {row.nmsatker} ({row.kdsatker})
                      </td>
                      <td className="align-middle text-center">
                        {row.tgpermohonan}
                      </td>
                      <td className="align-middle text-center">
                        {row.nopermohonan}
                      </td>
                      <td className="align-middle text-center">{row.jumlah}</td>
                      <td className="align-middle text-center">
                        {user?.role !== "kppn" && (
                          <i
                            className="bi bi-plus-square-fill text-success mx-3"
                            onClick={() =>
                              handleRekamKontrak(
                                row.id,
                                row.nopermohonan,
                                row.nmsatker,
                                row.kdsatker,
                                row.thang
                              )
                            }
                            style={{
                              fontSize: "17px",
                              cursor: "pointer",
                            }}
                          ></i>
                        )}
                        {user?.role !== "kppn" && (
                          <i
                            className="bi bi-trash-fill text-danger"
                            onClick={() =>
                              handleHapusDispKontrak(row.id, row.jumlah)
                            }
                            style={{
                              fontSize: "20px",
                              cursor: "pointer",
                            }}
                          ></i>
                        )}
                        <i
                          className="bi bi-arrow-down-circle-fill text-primary mx-2"
                          onClick={() => handledownloadKontrak(row.id)}
                          style={{
                            fontSize: "20px",
                            cursor: "pointer",
                          }}
                        ></i>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          {/*
          {export2 && (
            <GenerateCSV
              query3={sql}
              status={handleStatus}
              namafile={`v3_CSV_KONTRAK_${moment().format("DDMMYY-HHmmss")}`}
            />
          )}
          */}
          {data.length > 0 && (
            <>
              <span className="pagination justify-content-between mt-2 mx-4 text-dark">
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
