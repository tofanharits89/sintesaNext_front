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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TabsContents,
} from "@/components/animate-ui/components/animate/tabs";
import {
  Code,
  Copy,
  Download,
  Loader2,
  CheckCircle,
  Database,
} from "lucide-react";
import { useAPBDDataApi } from "@/hooks/apbd/use-apbd-data-api";
import { normalizeActiveFilters } from "@/components/inquiry-data/filterRegistry";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";

interface APBDLihatSqlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
    jenisDataLokasi?: string;
  };
  filterValues?: Record<string, FilterValue>;
}

export function APBDLihatSqlModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: APBDLihatSqlModalProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("converted");
  const { previewConvertedQuery } = useAPBDDataApi();

  const fetchSQL = React.useCallback(async () => {
    setIsLoading(true);
    setPreviewData(null);
    try {
      const normalized = normalizeActiveFilters(activeFilters);
      const result = await previewConvertedQuery(
        normalized,
        filterValues,
        reportParams,
      );
      if (result.success) {
        setPreviewData(result);
      } else {
        setPreviewData({
          success: false,
          error: result.error || "Failed to preview query",
          originalQuery: "-- Error generating query",
          convertedQuery: "-- Error generating query",
        });
      }
    } catch (error) {
      setPreviewData({
        success: false,
        error: (error as Error).message,
        originalQuery: "-- Error generating query",
        convertedQuery: "-- Error generating query",
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, filterValues, reportParams, previewConvertedQuery]);

  useEffect(() => {
    if (open) {
      fetchSQL();
    }
  }, [open, fetchSQL]);

  const handleCopySQL = async (query: string) => {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const handleDownloadSQL = (query: string, suffix: string) => {
    const blob = new Blob([query], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query_belwil_${suffix}_${new Date().toISOString().split("T")[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-[calc(100%-2rem)] sm:max-w-2xl md:max-w-5xl lg:max-w-7xl h-[95vh] sm:h-[90vh] md:h-[85vh] flex flex-col p-6 overflow-hidden"
        showCloseButton={false}
      >
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Code className="w-5 h-5 text-blue-600" />
            Tinjauan SQL Query APBD
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-2 space-y-4 my-2">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Konfigurasi Query</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Tahun: {reportParams.tahun}</Badge>
              <Badge variant="secondary">
                Tipe: {reportParams.tipeLaporan}
              </Badge>
              <Badge variant="secondary">
                Pembulatan: {reportParams.pembulatan}
              </Badge>
              <Badge variant="outline">Filters: {activeFilters.length}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full gap-3"
            >
              <div className="border-b border-border/50 pb-3 mb-0">
                <TabsList className="w-full h-auto md:h-12 p-2 rounded-xl grid grid-cols-2 gap-2">
                  <TabsTrigger
                    value="converted"
                    className="h-12 md:h-full px-2 md:px-4 py-0 text-[10px] sm:text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-1"
                  >
                    <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="hidden sm:inline">PostgreSQL (Converted)</span>
                    <span className="inline sm:hidden">Postgres</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="original"
                    className="h-12 md:h-full px-2 md:px-4 py-0 text-[10px] sm:text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-1"
                  >
                    <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span className="hidden sm:inline">MySQL (Original)</span>
                    <span className="inline sm:hidden">MySQL</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContents>
                <TabsContent value="converted" className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Query yang dieksekusi di PostgreSQL (dengan konversi otomatis)
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() =>
                          handleCopySQL(previewData?.convertedQuery || "")
                        }
                        disabled={isLoading || !previewData?.convertedQuery}
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600 shrink-0" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2 shrink-0" />
                        )}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() =>
                          handleDownloadSQL(
                            previewData?.convertedQuery || "",
                            "postgresql",
                          )
                        }
                        disabled={isLoading || !previewData?.convertedQuery}
                      >
                        <Download className="w-4 h-4 mr-2 shrink-0" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[40vh] w-full">
                    <div className="bg-slate-800 dark:bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-sm w-full overflow-hidden">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap break-all">
                          {previewData?.convertedQuery ||
                            "-- No SQL query generated"}
                        </pre>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="original" className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Query asli yang di-generate (MySQL syntax)
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() =>
                          handleCopySQL(previewData?.originalQuery || "")
                        }
                        disabled={isLoading || !previewData?.originalQuery}
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600 shrink-0" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2 shrink-0" />
                        )}
                        {copied ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() =>
                          handleDownloadSQL(
                            previewData?.originalQuery || "",
                            "mysql",
                          )
                        }
                        disabled={isLoading || !previewData?.originalQuery}
                      >
                        <Download className="w-4 h-4 mr-2 shrink-0" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[40vh] w-full">
                    <div className="bg-slate-700 dark:bg-slate-800 text-slate-50 p-4 rounded-lg font-mono text-sm w-full overflow-hidden">
                      {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap break-all">
                          {previewData?.originalQuery ||
                            "-- No SQL query generated"}
                        </pre>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </TabsContents>
            </Tabs>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Catatan Admin:</strong> SQL Query yang ditampilkan adalah
              versi preview. Eksekusi Query yang sesungguhnya mungkin memiliki
              tambahan filter keamanan dan optimasi berdasarkan role pengguna.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t border-border/50">
          <Button
            variant="destructive"
            className="w-full sm:w-24"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
