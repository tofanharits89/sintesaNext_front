"use client";

import React, { useState, useEffect } from "react";
import { Container, Table } from "react-bootstrap";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { Loading2 } from "../../layout/LoadingTable";

interface DataKontrakDetailProps {
  cek: boolean;
  id: string;
}

interface KontrakDetailData {
  id: string;
  id_dispensasi: string;
  thang: string;
  kdsatker: string;
  kdkppn: string;
  tgpermohonan: string;
  nopermohonan: string;
  nokontrak: string;
  tgkontrak: string;
  nilkontrak: number;
}

export default function DataKontrakDetail({ cek, id }: DataKontrakDetailProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KontrakDetailData[]>([]);

  useEffect(() => {
    if (cek && id) {
      getData();
    }
  }, [cek, id]);

  const getData = async () => {
    setLoading(true);
    const query = `SELECT a.id,a.id_dispensasi,a.thang,a.kdsatker,a.kdkppn,a.tgpermohonan, a.nopermohonan,a.nokontrak,a.tgkontrak,a.nilkontrak FROM  laporan_2023.dispensasi_kppn_lampiran a WHERE a.id_dispensasi='${id}' GROUP BY a.id ORDER BY id DESC`;
    const encryptedQuery = btoa(query);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      const response = await fetch(
        `${baseUrl}/dispensasi/${encryptedQuery}?limit=999999&page=0`,
        {
          headers: {},
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result);
      setLoading(false);
    } catch (error) {
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
      setLoading(false);
    }
  };

  const handleHapus = async (
    id: string,
    kdsatker: string,
    kdkppn: string,
    id_dispensasi: string
  ) => {
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Anda yakin ingin menghapus data ini?",
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
            `${process.env.NEXT_PUBLIC_LOCAL_BASIC}hapusdetailkppn/delete/${id}/${kdsatker}/${kdkppn}/${id_dispensasi}`,
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

  return (
    <Container className="my-2">
      {loading ? (
        <>
          <Loading2 />
          <br />
          <Loading2 />
          <br />
          <Loading2 />
        </>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th className="text-header text-center">No</th>
              <th className="text-header text-center">Tgl Kontrak</th>
              <th className="text-header text-center">No Kontrak/ Adendum</th>
              <th className="text-header text-center">Nilai Kontrak</th>
              <th className="text-header text-center">Hapus</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {data.map((row, index) => (
              <tr key={index}>
                <td className="align-middle text-center">{index + 1}</td>
                <td className="align-middle text-center">{row.tgkontrak}</td>
                <td className="align-middle text-center">{row.nokontrak}</td>
                <td className="align-middle baris-total text-end">
                  {row.nilkontrak.toLocaleString()}
                </td>
                {user?.role !== "kanwil_djpb" && (
                  <td className="align-middle text-center">
                    <i
                      className="bi bi-dash-circle text-danger text-center fw-bold"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        handleHapus(
                          row.id,
                          row.kdsatker,
                          row.kdkppn,
                          row.id_dispensasi
                        )
                      }
                    ></i>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
