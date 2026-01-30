"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Monitoring Kiriman ND Kanwil</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ... (leaving content logic, just updating wrapper if needed) ... matches original logic */}
            <div className="space-y-2">
              <Label>Pilih Tahun</Label>
              <Select
                value={tahunFilter || "00"}
                onValueChange={(val) => setTahunFilter(val === "00" ? "" : val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="00">Semua Tahun</SelectItem>
                  {tahunOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Pilih Triwulan</Label>
              <Select
                value={triwulanFilter || "00"}
                onValueChange={(val) =>
                  setTriwulanFilter(val === "00" ? "" : val)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Triwulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="00">Semua Triwulan</SelectItem>
                  {triwulanOptions.map((tri) => (
                    <SelectItem key={tri} value={tri.toString()}>
                      Triwulan {tri}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                              variant="outline"
                              className="h-8"
                            >
                              Download
                            </Button>
                          </a>
                        ) : (
                          <span className="text-destructive font-medium text-xs">
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
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border rounded-md border-dashed">
              <p>Tidak ada kiriman Nota Dinas untuk filter ini.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onHide}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
