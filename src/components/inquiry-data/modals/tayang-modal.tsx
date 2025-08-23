"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";

interface TayangModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
  };
}

export function TayangModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
}: TayangModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration
  const mockData = [
    {
      id: 1,
      kode: "001.01.001",
      uraian: "Belanja Pegawai",
      pagu: 1000000000,
      realisasi: 850000000,
      sisa: 150000000,
      persentase: 85.0,
    },
    {
      id: 2,
      kode: "001.01.002",
      uraian: "Belanja Barang",
      pagu: 500000000,
      realisasi: 420000000,
      sisa: 80000000,
      persentase: 84.0,
    },
    {
      id: 3,
      kode: "001.01.003",
      uraian: "Belanja Modal",
      pagu: 2000000000,
      realisasi: 1800000000,
      sisa: 200000000,
      persentase: 90.0,
    },
  ];

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In real implementation, this would be an API call with filters and reportParams
      setData(mockData);
    } catch (err) {
      setError("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[80vh] sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Hasil Query Data Belanja</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Query Summary */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              Tahun: {reportParams.tahun || "Belum dipilih"}
            </Badge>
            <Badge variant="secondary">
              Tipe: {reportParams.tipeLaporan || "Belum dipilih"}
            </Badge>
            <Badge variant="secondary">
              Pembulatan: {reportParams.pembulatan || "Belum dipilih"}
            </Badge>
            <Badge variant="outline">
              Filter Aktif: {activeFilters.length}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[50vh] w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Memuat data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  Coba Lagi
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">No</th>
                    <th className="p-3 text-left text-sm font-medium">Kode</th>
                    <th className="p-3 text-left text-sm font-medium">
                      Uraian
                    </th>
                    <th className="p-3 text-right text-sm font-medium">Pagu</th>
                    <th className="p-3 text-right text-sm font-medium">
                      Realisasi
                    </th>
                    <th className="p-3 text-right text-sm font-medium">Sisa</th>
                    <th className="p-3 text-center text-sm font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={item.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 text-sm">{index + 1}</td>
                      <td className="p-3 text-sm font-mono">{item.kode}</td>
                      <td className="p-3 text-sm">{item.uraian}</td>
                      <td className="p-3 text-sm text-right">
                        {formatCurrency(item.pagu)}
                      </td>
                      <td className="p-3 text-sm text-right">
                        {formatCurrency(item.realisasi)}
                      </td>
                      <td className="p-3 text-sm text-right">
                        {formatCurrency(item.sisa)}
                      </td>
                      <td className="p-3 text-sm text-center">
                        <Badge
                          variant={
                            item.persentase >= 90
                              ? "default"
                              : item.persentase >= 80
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {item.persentase}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.length === 0 && !isLoading && !error && (
                <div className="p-8 text-center text-muted-foreground">
                  <p>Tidak ada data yang ditemukan</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Total: {data.length} baris data
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
