"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Eye } from "lucide-react";

interface KertasKerjaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
}

// Mock data for kertas kerja
const mockKertasKerjaData = {
  nomorDokumen: "KK-DAU-001/2024",
  tanggalPembuatan: "2024-01-15",
  status: "Final",
  ringkasan: {
    totalAlokasi: 5000000000,
    totalPotongan: 250000000,
    sisaDana: 4750000000,
    jumlahTransaksi: 12,
  },
  rincianTransaksi: [
    {
      tanggal: "2024-01-10",
      nomor: "TRX-001",
      jenis: "Transfer Dana",
      nilai: 1000000000,
      status: "Berhasil",
    },
    {
      tanggal: "2024-01-15",
      nomor: "TRX-002",
      jenis: "Pemotongan Pajak",
      nilai: -50000000,
      status: "Berhasil",
    },
    {
      tanggal: "2024-01-20",
      nomor: "TRX-003",
      jenis: "Transfer Dana",
      nilai: 1500000000,
      status: "Berhasil",
    },
  ],
  berkas: [
    {
      nama: "Kertas_Kerja_DAU_Jan_2024.pdf",
      ukuran: "2.5 MB",
      tanggal: "2024-01-15",
      tipe: "PDF",
    },
    {
      nama: "Rincian_Transaksi_Jan_2024.xlsx",
      ukuran: "1.2 MB",
      tanggal: "2024-01-15",
      tipe: "Excel",
    },
  ],
};

export function KertasKerjaModal({
  open,
  onOpenChange,
  data,
}: KertasKerjaModalProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleDownload = (fileName: string) => {
    console.log("Downloading file:", fileName);
    // Implementation for file download
  };

  const handlePreview = (fileName: string) => {
    console.log("Previewing file:", fileName);
    // Implementation for file preview
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Kertas Kerja - {data?.kppn}, {data?.bulan} {data?.tahun}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Dokumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nomor Dokumen</p>
                  <p className="font-medium">
                    {mockKertasKerjaData.nomorDokumen}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tanggal Pembuatan
                  </p>
                  <p className="font-medium">
                    {new Date(
                      mockKertasKerjaData.tanggalPembuatan
                    ).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="default">{mockKertasKerjaData.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">KPPN</p>
                  <p className="font-medium">{data?.kppn}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan Keuangan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Alokasi</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(mockKertasKerjaData.ringkasan.totalAlokasi)}
                  </p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Total Potongan
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(
                      mockKertasKerjaData.ringkasan.totalPotongan
                    )}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Sisa Dana</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(mockKertasKerjaData.ringkasan.sisaDana)}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Jumlah Transaksi
                  </p>
                  <p className="text-lg font-bold text-gray-600">
                    {mockKertasKerjaData.ringkasan.jumlahTransaksi}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Rincian Transaksi Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockKertasKerjaData.rincianTransaksi.map(
                  (transaksi, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1 grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Tanggal
                          </p>
                          <p className="font-medium">
                            {new Date(transaksi.tanggal).toLocaleDateString(
                              "id-ID"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Nomor</p>
                          <p className="font-medium">{transaksi.nomor}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Jenis</p>
                          <p className="font-medium">{transaksi.jenis}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Nilai</p>
                          <p
                            className={`font-bold ${
                              transaksi.nilai >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(Math.abs(transaksi.nilai))}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          transaksi.status === "Berhasil"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {transaksi.status}
                      </Badge>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Berkas Terkait</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockKertasKerjaData.berkas.map((berkas, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{berkas.nama}</p>
                        <p className="text-sm text-muted-foreground">
                          {berkas.tipe} • {berkas.ukuran} •{" "}
                          {new Date(berkas.tanggal).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(berkas.nama)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(berkas.nama)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button onClick={() => handleDownload("Kertas_Kerja_Lengkap.pdf")}>
            <Download className="h-4 w-4 mr-2" />
            Download Lengkap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
