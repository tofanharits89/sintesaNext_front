"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Copy, Download, Loader2, CheckCircle } from "lucide-react";

interface LihatSqlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
  };
}

export function LihatSqlModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
}: LihatSqlModalProps) {
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate mock SQL based on filters and params
  const generateSQL = () => {
    const baseQuery = `SELECT 
  b.kode_akun,
  a.uraian_akun,
  b.kode_satker,
  s.nama_satker,
  SUM(b.pagu) as total_pagu,
  SUM(b.realisasi) as total_realisasi,
  SUM(b.pagu - b.realisasi) as sisa_anggaran,
  ROUND((SUM(b.realisasi) / SUM(b.pagu)) * 100, 2) as persentase_realisasi
FROM belanja b
INNER JOIN akun a ON b.kode_akun = a.kode_akun
INNER JOIN satker s ON b.kode_satker = s.kode_satker`;

    let whereConditions = [];

    // Add year condition
    if (reportParams.tahun) {
      whereConditions.push(`b.tahun = ${reportParams.tahun}`);
    }

    // Add report type condition
    if (reportParams.tipeLaporan) {
      switch (reportParams.tipeLaporan) {
        case "realisasi":
          whereConditions.push(`b.jenis_laporan = 'REALISASI'`);
          break;
        case "anggaran":
          whereConditions.push(`b.jenis_laporan = 'ANGGARAN'`);
          break;
        case "revisi":
          whereConditions.push(`b.jenis_laporan = 'REVISI'`);
          break;
      }
    }

    // Add filter conditions
    activeFilters.forEach((filter) => {
      switch (filter) {
        case "kementerian":
          whereConditions.push(
            `b.kode_kementerian IN (SELECT kode FROM kementerian WHERE aktif = 1)`
          );
          break;
        case "provinsi":
          whereConditions.push(
            `s.kode_provinsi IN (SELECT kode FROM provinsi WHERE aktif = 1)`
          );
          break;
        case "satker":
          whereConditions.push(`b.kode_satker IS NOT NULL`);
          break;
        case "fungsi":
          whereConditions.push(`b.kode_fungsi IS NOT NULL`);
          break;
        case "program":
          whereConditions.push(`b.kode_program IS NOT NULL`);
          break;
        default:
          whereConditions.push(`b.${filter.toLowerCase()} IS NOT NULL`);
      }
    });

    let fullQuery = baseQuery;

    if (whereConditions.length > 0) {
      fullQuery += `\nWHERE ` + whereConditions.join("\n  AND ");
    }

    fullQuery += `\nGROUP BY 
  b.kode_akun, 
  a.uraian_akun, 
  b.kode_satker, 
  s.nama_satker
ORDER BY 
  b.kode_akun, 
  b.kode_satker;`;

    return fullQuery;
  };

  const fetchSQL = async () => {
    setIsLoading(true);

    try {
      // Simulate API call to generate SQL
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const generatedSQL = generateSQL();
      setSqlQuery(generatedSQL);
    } catch (error) {
      console.error("Error generating SQL:", error);
      setSqlQuery("-- Error generating SQL query");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSQL();
    }
  }, [open, activeFilters, reportParams]);

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(sqlQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([sqlQuery], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query_belanja_${new Date().toISOString().split("T")[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[80vh] sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Generated SQL Query
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Query Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Query Configuration</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Tahun: {reportParams.tahun || "All"}
              </Badge>
              <Badge variant="secondary">
                Tipe: {reportParams.tipeLaporan || "All"}
              </Badge>
              <Badge variant="secondary">
                Pembulatan: {reportParams.pembulatan || "Default"}
              </Badge>
              <Badge variant="outline">Filters: {activeFilters.length}</Badge>
            </div>
          </div>

          {/* SQL Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">SQL Query</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySQL}
                  disabled={isLoading || !sqlQuery}
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSQL}
                  disabled={isLoading || !sqlQuery}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[40vh] w-full">
              <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-slate-400">Generating SQL...</p>
                    </div>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap break-words">
                    {sqlQuery || "-- No SQL query generated"}
                  </pre>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Admin Notice:</strong> This SQL query is generated for
              review purposes. Actual query execution may include additional
              security layers and optimizations.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
