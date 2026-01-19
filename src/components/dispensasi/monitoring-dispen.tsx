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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import moment from "moment";
import { DatePicker } from "@/components/ui/date-picker";
import { Loader2 } from "lucide-react";

interface MonitoringProps {
  cek: boolean;
  id: string;
  where: string;
}

interface MonitoringData {
  kddept: string;
  nmdept: string;
  jumlah_spm: number;
  nilai_spm: number;
}

export default function Monitoring({ cek, id, where }: MonitoringProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MonitoringData[]>([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [pages, setPages] = useState(0);
  const [rows, setRows] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [totalSPM, setTotalSPM] = useState(0);
  const [totalNilaiSPM, setTotalNilaiSPM] = useState(0);

  useEffect(() => {
    if (cek && selectedDate) {
      getData();
    }
  }, [cek, id, where, page, selectedDate]);

  const getData = async () => {
    setLoading(true);

    let combinedFilter = where || "";

    if (user?.role === "kanwil_djpb") {
      combinedFilter += combinedFilter
        ? ` AND a.kdkanwil = '${user.kdkanwil}'`
        : `a.kdkanwil = '${user.kdkanwil}'`;
    } else if (user?.role === "kppn") {
      combinedFilter += combinedFilter
        ? ` AND a.kdkppn = '${user.kdkppn}'`
        : `a.kdkppn = '${user.kdkppn}'`;
    }

    if (selectedDate) {
      const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
      combinedFilter += combinedFilter
        ? ` AND a.tgpersetujuan = '${formattedDate}'`
        : `a.tgpersetujuan = '${formattedDate}'`;
    }

    const encodedQuery = encodeURIComponent(combinedFilter);

    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const encryptedQuery = btoa(cleanedQuery);

    try {
      // API endpoint: POST /api/v1/dispensasi/query with JSON body
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "/api/v1"
        }/dispensasi/query`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: encryptedQuery,
          limit,
          page,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result.result || []);
      setPages(result.totalPages || 0);
      setRows(result.totalRows || 0);
      setTotalSPM(result.totalSPM || 0);
      setTotalNilaiSPM(result.totalNilaiSPM || 0);
      setLoading(false);
      setIsDataFetched(true);
    } catch (error) {
      console.error("Data fetch error:", error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
      setLoading(false);
    }
  };

  const handleFilterByDate = (date: Date | null) => {
    setSelectedDate(date);
    setIsDataFetched(false);
  };

  return (
    <div className="bg-background border rounded-lg shadow-sm p-4 mt-3 min-h-[700px]">
      {/* Filter Tanggal */}
      <div className="flex justify-between items-center mb-6">
        <div className="w-full max-w-sm">
          <label className="text-sm font-semibold mb-2 block">Tanggal Persetujuan</label>
          <DatePicker
            date={selectedDate || undefined}
            onDateChange={(date) => handleFilterByDate(date)}
            placeholder="Pilih Tanggal"
          />
        </div>
      </div>

      {/* Konten Utama: Loading atau Table */}
      {loading ? (
        <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {isDataFetched ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-center font-bold">No.</TableHead>
                      <TableHead className="font-bold">Kementerian/Lembaga</TableHead>
                      <TableHead className="text-right font-bold">Jumlah SPM</TableHead>
                      <TableHead className="text-right font-bold">Nilai Dispensasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center">{index + 1 + page * limit}</TableCell>
                        <TableCell>
                          {row.nmdept} ({row.kddept})
                        </TableCell>
                        <TableCell className="text-right">
                          {row.jumlah_spm.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.nilai_spm.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Total SPM dan Nilai SPM */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={2} className="text-right">
                        Total
                      </TableCell>
                      <TableCell className="text-right">
                        {totalSPM.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {totalNilaiSPM.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <p>Tidak ada data yang tersedia.</p>
                <p className="text-sm">Silakan pilih tanggal persetujuan untuk melihat data.</p>
              </div>
            )}
          </div>
        )}
      </div>
  );
}
