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
import { useInquiryQueryBuilder } from "@/hooks/use-inquiry-query-builder";
import { normalizeActiveFilters } from "../filterRegistry";

interface LihatSqlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
    jenisAkumulasi?: string;
    scope?: "belanja" | "tematik" | "general";
  };
  filterValues?: Record<
    string,
    import("@/hooks/use-inquiry-data-api").FilterValue
  >;
}

export function LihatSqlModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: LihatSqlModalProps) {
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { buildQuery } = useInquiryQueryBuilder();

  const fetchSQL = React.useCallback(async () => {
    setIsLoading(true);

    try {
      // Use the query builder to generate the actual SQL; normalize filter order for stability
      const normalized = normalizeActiveFilters(activeFilters);
      const generatedSQL = buildQuery(normalized, filterValues, reportParams);
      setSqlQuery(generatedSQL);
    } catch (error) {
      console.error("Error generating SQL:", error);
      setSqlQuery("-- Error generating SQL query: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, filterValues, reportParams, buildQuery]);

  useEffect(() => {
    if (open) {
      fetchSQL();
    }
  }, [open, fetchSQL]);

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
    a.download = `query_${
      (reportParams as any)?.scope === "tematik" ? "tematik" : "belanja"
    }_${new Date().toISOString().split("T")[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-7xl max-h-[80vh] sm:max-w-7xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Tinjauan SQL Query
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Query Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Konfigurasi Query</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Tahun: {reportParams.tahun || "All"}
              </Badge>
              <Badge variant="secondary">
                {(reportParams as any)?.scope === "tematik"
                  ? "Kategori"
                  : "Tipe"}
                :{" "}
                {(reportParams as any)?.scope === "tematik"
                  ? (reportParams as any)?.tematikKategori || "All"
                  : reportParams.tipeLaporan || "All"}
              </Badge>
              <Badge variant="secondary">
                Pembulatan: {reportParams.pembulatan || "Default"}
              </Badge>
              {reportParams.jenisAkumulasi && (
                <Badge variant="secondary">
                  Jenis Akumulasi: {reportParams.jenisAkumulasi}
                </Badge>
              )}
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
              <div className="bg-slate-800 dark:bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm">
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
              <strong>Catatan Admin:</strong> SQL Query ini ditampilkan untuk
              tujuan meninjau. Eksekusi Query yang sesungguhnya bisa terdapat
              fungsi tambahan untuk tujuan keamanan dan optimisasi.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            className="w-24"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
