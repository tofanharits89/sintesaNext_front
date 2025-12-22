"use client";

import React, { useState, useEffect } from "react";
import { Container, Table, Spinner } from "react-bootstrap";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import { toast } from "sonner";

interface DataRow {
  id: string;
  thang: string;
  kdsatker: string;
  tgpermohonan: string;
  nopermohonan: string;
  notup: string;
  tgtup: string;
  niltup: number;
  status: string;
}

interface DataTupDetailProps {
  cek: boolean;
  id: string;
}

// Placeholder for Encrypt function - replace with actual implementation
const Encrypt = (data: string) => data;

export default function DataTupDetail(props: DataTupDetailProps) {
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DataRow[]>([]);

  useEffect(() => {
    if (props.cek) {
      getData();
    }
  }, [props.cek, props.id]);

  const getData = async () => {
    setLoading(true);
    try {
      const query = `SELECT a.id,a.thang,a.kdsatker,a.tgpermohonan, a.nopermohonan,a.notup,a.tgtup,a.niltup,a.status FROM laporan_2023.dispensasi_tup_lampiran a WHERE a.id_dispensasi='${props.id}' GROUP BY a.id ORDER BY id DESC`;
      const encryptedQuery = btoa(query);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

      const response = await fetch(
        `${baseUrl}/dispensasi/${encryptedQuery}?limit=999999&page=0`,
        {
          headers: {},
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result.result);
    } catch (error: any) {
      const message =
        error?.message || "Terjadi Permasalahan Koneksi atau Server Backend";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleHapus = async (id: string, id_dispensasi: string) => {
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
          const url = process.env.NEXT_PUBLIC_BASIC_URL
            ? `${process.env.NEXT_PUBLIC_BASIC_URL}tup/delete/${id}/${id_dispensasi}`
            : "";

          const response = await fetch(url, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          toast.success("Data telah dihapus.");
          getData();
        } catch (error: any) {
          const message =
            error?.message ||
            "Terjadi Permasalahan Koneksi atau Server Backend";
          toast.error(message);
        }
      }
    });
  };

  return (
    <Container className="my-2">
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th className="text-header text-center">No.</th>
                <th className="text-header text-center">Tgl TUP</th>
                <th className="text-header text-center">No TUP</th>
                <th className="text-header text-center">Nilai TUP</th>
                <th className="text-header text-center">Status</th>
                <th className="text-header text-center">Hapus</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {data.map((row: DataRow, index: number) => (
                <tr key={index}>
                  <td className="align-middle text-center">{index + 1}</td>
                  <td className="align-middle text-center">{row.tgtup}</td>
                  <td className="align-middle text-center">{row.notup}</td>
                  <td className="align-middle baris-total text-end">
                    {new Intl.NumberFormat("id-ID").format(Number(row.niltup))}
                  </td>
                  <td className="align-middle text-center">
                    {row.status === "Tolak" ? (
                      <span className="text-danger fw-bold">{row.status}</span>
                    ) : (
                      <span className="text-success fw-bold">{row.status}</span>
                    )}
                  </td>
                  <td className="align-middle text-center">
                    <i
                      className="bi bi-dash-circle text-danger text-center fw-bold"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleHapus(row.id, props.id)}
                    ></i>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </Container>
  );
}
