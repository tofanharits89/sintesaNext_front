"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";

export default function RekamanNotaDinas({ show, onHide }: any) {
  const { user } = useAuth();
  const [rekaman, setRekaman] = useState<any[]>([]);
  const [tahunFilter, setTahunFilter] = useState("");
  const [triwulanFilter, setTriwulanFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const tahunOptions = Array.from({ length: 3 }, (_, i) => 2025 + i);
  const triwulanOptions = [1, 2, 3, 4];

  useEffect(() => {
    if (show) {
      fetchRekaman();
    }
  }, [show]);

  const fetchRekaman = async () => {
    setLoading(true);
    try {
      const url =
        process.env.NEXT_PUBLIC_GET_REKAMAN_NOTADINAS ||
        "/api/get-rekaman-notadinas";

      const response = await http.get(url);
      const data = response.data;

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.example.com";

      const updatedData = data.map((item: any) => ({
        ...item,
        fileUrl: item.nd_kanwil
          ? `${backendUrl}/monev_pnbp/${item.nd_kanwil}`
          : null,
      }));

      setRekaman(updatedData);
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengambil data rekaman");
    } finally {
      setLoading(false);
    }
  };

  const filteredRekaman = rekaman.filter(
    (data: any) =>
      (tahunFilter ? data.tahun === tahunFilter : true) &&
      (triwulanFilter ? data.triwulan === triwulanFilter : true),
  );

  const uniqueRekaman = filteredRekaman.reduce((acc: any[], current: any) => {
    const exists = acc.find(
      (item: any) =>
        item.tahun === current.tahun &&
        item.triwulan === current.triwulan &&
        item.kdkanwil === current.kdkanwil &&
        item.nd_kanwil === current.nd_kanwil,
    );
    if (!exists) acc.push(current);
    return acc;
  }, []);

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Monitoring Kiriman ND Kanwil</DialogTitle>
        </DialogHeader>
        <div className="p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Pilih Tahun</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={tahunFilter}
                onChange={(e) => setTahunFilter(e.target.value)}
              >
                <option value="">Semua Tahun</option>
                {tahunOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pilih Triwulan</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={triwulanFilter}
                onChange={(e) => setTriwulanFilter(e.target.value)}
              >
                <option value="">Semua Triwulan</option>
                {triwulanOptions.map((tri) => (
                  <option key={tri} value={tri}>
                    Triwulan {tri}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center flex justify-center py-4">
              <Spinner size="lg" />
            </div>
          ) : uniqueRekaman.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-center">No</TableHead>
                    <TableHead className="text-center">Tahun</TableHead>
                    <TableHead className="text-center">Triwulan</TableHead>
                    <TableHead className="text-center">Kanwil</TableHead>
                    <TableHead className="text-center">Nama File</TableHead>
                    <TableHead className="text-center">File</TableHead>
                    <TableHead className="text-center">Tgl Kirim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueRekaman.map((data: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="text-center">
                        {data.tahun}
                      </TableCell>
                      <TableCell className="text-center">
                        {data.triwulan}
                      </TableCell>
                      <TableCell className="text-center">
                        {data.nmkanwil} ({data.kdkanwil})
                      </TableCell>
                      <TableCell>{data.nd_kanwil}</TableCell>
                      <TableCell className="text-center">
                        {data.fileUrl ? (
                          <a
                            href={data.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Download
                            </Button>
                          </a>
                        ) : (
                          <span className="text-red-500 font-medium text-sm">
                            Belum ada file
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {data.tgl_kirim
                          ? new Date(data.tgl_kirim)
                              .toISOString()
                              .replace("T", " ")
                              .slice(0, 19)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Tidak ada kiriman Nota Dinas untuk filter ini.
            </p>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={onHide}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
