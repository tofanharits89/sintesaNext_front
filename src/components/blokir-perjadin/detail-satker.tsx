"use client";

import React, { useState, useEffect } from "react";
import numeral from "numeral";
import moment from "moment";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import GenerateCSV from "../GenerateCSV";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiPath } from "@/lib/config/base-path";

interface DetailSatkerBlokir {
  isModalOpen: boolean;
  handleModalClose: () => void;
  kddept: string;
  kdunit: string;
  jenis: string;
  role?: string;
  kdkanwil?: string;
  token?: string;
}

interface SatkerData {
  kddept: string;
  nmdept: string;
  kdsatker: string;
  nmsatker: string;
  nilai_blokir: number;
  status_revisi: string;
}

export default function DetailSatkerBlokir({
  isModalOpen,
  handleModalClose,
  kddept,
  kdunit,
  jenis,
  role = "0",
  kdkanwil = "",
  token = "",
}: DetailSatkerBlokir) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SatkerData[]>([]);
  const [export2, setExport2] = useState(false);
  const [sql, setSql] = useState("");
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setData([]);
      setHasMoreData(true);
      getData();
    }
  }, [isModalOpen]);

  const getData = async () => {
    let limitakses = "";
    if (role === "X" || role === "1" || role === "0") {
      limitakses = " ";
    } else if (role === "2" && kdkanwil !== "11") {
      limitakses = " and c.kdkanwil= '" + kdkanwil + "'  ";
    } else if (role === "2" && kdkanwil === "11") {
      limitakses = " and c.kdkanwil='11'  and a.kddekon<>'1' ";
    }

    const encodedQuery2 = encodeURIComponent(
      `SELECT b.kddept, d.nmdept, a.kdsatker, c.nmsatker, SUM(a.total) as nilai_blokir,(CASE WHEN a.total <= '0' THEN 'Belum Revisi' WHEN a.total > '0' THEN 'Sudah Revisi' END) AS status_revisi FROM laporan_2023.blokir_perjadin_satker a LEFT JOIN laporan_2023.target_blokir_perjadin b ON a.kddept = b.kddept and a.kdunit = b.kdunit LEFT JOIN dbref.t_satker_2024 c ON a.kddept = c.kddept and a.kdunit = c.kdunit and a.kdsatker = c.kdsatker LEFT JOIN dbref.t_dept_2024 d ON a.kddept = d.kddept WHERE a.kddept='${kddept}' and a.kdunit='${kdunit}' ${limitakses} group by b.kddept, b.kdunit, a.kdsatker ORDER BY a.kddept,a.kdunit,a.kdsatker DESC`,
    );

    const cleanedQuery2 = decodeURIComponent(encodedQuery2)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    setSql(cleanedQuery2);
    const encryptedQuery = btoa(cleanedQuery2);

    try {
      setLoading(true);
      const apiUrl = apiPath(`/blokir/monitoring-satker/${encryptedQuery}`);

      const response = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const newData = Array.isArray(result) ? result : result.result || [];

      setData(newData);
      setHasMoreData(newData.length >= 30);
    } catch (error) {
      console.log(error);
      toast.error("Terjadi Permasalahan Koneksi atau Server Backend");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    setIsDownloading(true);
    setExport2(true);
    setTimeout(() => {
      setIsDownloading(false);
    }, 0);
  };

  const statusVariant = (status: string) =>
    status === "Sudah Revisi" ? "success" : "secondary";

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => !open && handleModalClose()}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-6xl sm:max-w-6xl max-h-[90vh] flex flex-col p-0 gap-0"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <i className="bi bi-briefcase-fill text-primary" />
            Satker yang Sudah dan Belum Revisi Blokir
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="rounded-lg border bg-card">
            <div className="overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="w-16 text-center font-semibold">
                      No.
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      Kementerian/Lembaga
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      Satker
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Nilai Blokir
                    </TableHead>
                    <TableHead className="text-center font-semibold">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center">
                        <div className="flex items-center justify-center">
                          <Spinner text="Memuat data satker..." />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        Tidak ada data satker untuk ditampilkan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row, index) => (
                      <TableRow key={`${row.kdsatker}-${index}`}>
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.nmdept} ({row.kddept})
                        </TableCell>
                        <TableCell className="text-center">
                          {row.nmsatker} ({row.kdsatker})
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {numeral(row.nilai_blokir).format("0,0")}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={statusVariant(row.status_revisi)}>
                            {row.status_revisi}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {export2 && (
            <GenerateCSV
              query3={sql}
              status={handleDownloadCSV}
              namafile={`v3_CSV_MONITORING_BLOKIR_${moment().format(
                "DDMMYY-HHmmss",
              )}`}
            />
          )}
        </div>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleModalClose}
          >
            <X className="h-4 w-4" />
            Tutup
          </Button>
          <Button
            type="button"
            onClick={handleDownloadCSV}
            disabled={isDownloading || !sql}
          >
            {isDownloading ? (
              <>
                <Spinner size="sm" className="text-white" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
