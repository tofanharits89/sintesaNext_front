"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { MinusCircle } from "lucide-react";
import { apiPath } from "@/lib/config/base-path";

interface DataRow {
  id: string;
  thang: string;
  kdsatker: string;
  tgpermohonan: string;
  nopermohonan: string;
  nokontrak: string;
  tgkontrak: string;
  nilkontrak: number;
  status: string;
}

interface DispenKontrakDetailProps {
  cek: boolean;
  id: string;
}

// Placeholder for Encrypt function
const Encrypt = (data: string) => data;

export default function DispenKontrakDetail(props: DispenKontrakDetailProps) {
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
      const query = `SELECT a.id,a.thang,a.kdsatker,a.tgpermohonan, a.nopermohonan,a.nokontrak,a.tgkontrak,a.nilkontrak,a.status FROM laporan_2023.dispensasi_kontrak_lampiran a WHERE a.id_dispensasi='${props.id}' GROUP BY a.id ORDER BY id DESC`;
      const encryptedQuery = btoa(query);

      const response = await fetch(
        apiPath(`/dispensasi/${encryptedQuery}?limit=999999&page=0`),
        {
          credentials: "include",
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
      customClass: {
        confirmButton: "bg-blue-600 text-white px-4 py-2 rounded mr-2",
        cancelButton: "bg-red-600 text-white px-4 py-2 rounded",
      },
      buttonsStyling: false,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const url = apiPath(`/dispensasi/kontrak/${id}/${id_dispensasi}`);

          const response = await fetch(url, {
            method: "DELETE",
            credentials: "include",
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
    <div className="my-2">
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center font-bold">No.</TableHead>
                <TableHead className="text-center font-bold">Tgl Kontrak</TableHead>
                <TableHead className="text-center font-bold">No Kontrak/ Adendum</TableHead>
                <TableHead className="text-center font-bold">Nilai Kontrak</TableHead>
                <TableHead className="text-center font-bold">Status</TableHead>
                <TableHead className="text-center font-bold">Hapus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {data.map((row: DataRow, index: number) => (
                <TableRow key={index}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell className="text-center">{row.tgkontrak}</TableCell>
                  <TableCell className="text-center">{row.nokontrak}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat("id-ID").format(
                      Number(row.nilkontrak)
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.status === "Tolak" ? (
                      <span className="text-red-500 font-bold">{row.status}</span>
                    ) : (
                      <span className="text-green-500 font-bold">{row.status}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center flex justify-center">
                    <MinusCircle
                      className="text-red-500 cursor-pointer hover:text-red-700"
                      onClick={() => handleHapus(row.id, props.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
