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
import {
  useBelwilDataApi,
  useBelwilTematikDataApi,
  useBelwilSubsidiDataApi,
  useBelwilBansosDataApi,
} from "@/hooks/belwil/use-belwil-data-api";
import type {
  BelwilTematikReportParams,
  BelwilSubsidiReportParams,
  BelwilBansosReportParams,
} from "@/hooks/belwil/use-belwil-data-api";
import { normalizeActiveFilters } from "@/components/inquiry-data/filterRegistry";
import type { FilterValue } from "@/hooks/use-inquiry-data-api";

interface BelwilLihatSqlModalProps {
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

export function BelwilLihatSqlModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: BelwilLihatSqlModalProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("converted");
  const { previewConvertedQuery } = useBelwilDataApi();

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
        className="max-w-7xl max-h-[90vh] sm:max-w-7xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Tinjauan SQL Query Belanja Kewilayahan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                    className="h-12 md:h-full px-2 md:px-4 py-0 text-xs md:text-sm whitespace-nowrap"
                  >
                    <Database className="w-4 h-4" />
                    <span>PostgreSQL (Converted)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="original"
                    className="h-12 md:h-full px-2 md:px-4 py-0 text-xs md:text-sm whitespace-nowrap"
                  >
                    <Code className="w-4 h-4" />
                    <span>MySQL (Original)</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContents>
                <TabsContent value="converted" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Query yang dieksekusi di PostgreSQL (dengan konversi
                      otomatis)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopySQL(previewData?.convertedQuery || "")
                        }
                        disabled={isLoading || !previewData?.convertedQuery}
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
                        onClick={() =>
                          handleDownloadSQL(
                            previewData?.convertedQuery || "",
                            "postgresql",
                          )
                        }
                        disabled={isLoading || !previewData?.convertedQuery}
                      >
                        <Download className="w-4 h-4 mr-2" />
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Query asli yang di-generate (MySQL syntax)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopySQL(previewData?.originalQuery || "")
                        }
                        disabled={isLoading || !previewData?.originalQuery}
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
                        onClick={() =>
                          handleDownloadSQL(
                            previewData?.originalQuery || "",
                            "mysql",
                          )
                        }
                        disabled={isLoading || !previewData?.originalQuery}
                      >
                        <Download className="w-4 h-4 mr-2" />
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

// ─── Tematik variant ──────────────────────────────────────────────────────────────────

const TEMATIK_LIHAT_SQL_LABELS: Record<string, string> = {
  prioritasPresiden: "Prioritas Presiden",
  inflasi: "Inflasi",
};

interface BelwilTematikLihatSqlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: BelwilTematikReportParams;
  filterValues?: Record<string, FilterValue>;
}

export function BelwilTematikLihatSqlModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: BelwilTematikLihatSqlModalProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("converted");
  const { previewConvertedQuery } = useBelwilTematikDataApi();

  const tipeLaporanLabel =
    TEMATIK_LIHAT_SQL_LABELS[reportParams.tipeLaporan] ||
    reportParams.tipeLaporan;

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
    a.download = `query_belwil_tematik_${suffix}_${new Date().toISOString().split("T")[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-7xl max-h-[90vh] sm:max-w-7xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-teal-600" />
            Tinjauan SQL Query Kewilayahan Tematik – {tipeLaporanLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Konfigurasi Query</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Tahun: {reportParams.tahun}</Badge>
              <Badge variant="secondary">Tipe: {tipeLaporanLabel}</Badge>
              <Badge variant="secondary">
                Pembulatan: {reportParams.pembulatan}
              </Badge>
              <Badge variant="secondary">
                Lokasi: {reportParams.jenisDataLokasi}
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
                    className="h-12 md:h-full px-2 md:px-4 py-0 text-xs md:text-sm whitespace-nowrap"
                  >
                    <Database className="w-4 h-4" />
                    <span>PostgreSQL (Converted)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="original"
                    className="h-12 md:h-full px-2 md:px-4 py-0 text-xs md:text-sm whitespace-nowrap"
                  >
                    <Code className="w-4 h-4" />
                    <span>MySQL (Original)</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContents>
                <TabsContent value="converted" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Query yang dieksekusi di PostgreSQL (dengan konversi
                      otomatis)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopySQL(previewData?.convertedQuery || "")
                        }
                        disabled={isLoading || !previewData?.convertedQuery}
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
                        onClick={() =>
                          handleDownloadSQL(
                            previewData?.convertedQuery || "",
                            "postgresql",
                          )
                        }
                        disabled={isLoading || !previewData?.convertedQuery}
                      >
                        <Download className="w-4 h-4 mr-2" />
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Query asli yang di-generate (MySQL syntax)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopySQL(previewData?.originalQuery || "")
                        }
                        disabled={isLoading || !previewData?.originalQuery}
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
                        onClick={() =>
                          handleDownloadSQL(
                            previewData?.originalQuery || "",
                            "mysql",
                          )
                        }
                        disabled={isLoading || !previewData?.originalQuery}
                      >
                        <Download className="w-4 h-4 mr-2" />
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

// ─── Subsidi variant ─────────────────────────────────────────────────────────────────

const SUBSIDI_LIHAT_SQL_LABELS: Record<string, string> = {
  realisasi: "Realisasi",
  jumlah_penerima: "Jumlah Penerima",
  jumlah_va: "Jumlah VA",
};

interface BelwilSubsidiLihatSqlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: BelwilSubsidiReportParams;
  filterValues?: Record<string, FilterValue>;
}

export function BelwilSubsidiLihatSqlModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: BelwilSubsidiLihatSqlModalProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("converted");
  const { previewConvertedQuery } = useBelwilSubsidiDataApi();

  const tipeLaporanLabel =
    SUBSIDI_LIHAT_SQL_LABELS[reportParams.tipeLaporan] ||
    reportParams.tipeLaporan;

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
    a.download = `query_belwil_subsidi_${suffix}_${new Date().toISOString().split("T")[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-7xl max-h-[90vh] sm:max-w-7xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-teal-600" />
            Tinjauan SQL Query Subsidi Kewilayahan &ndash; {tipeLaporanLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Konfigurasi Query</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Tahun: {reportParams.tahun}</Badge>
              <Badge variant="secondary">Tipe: {tipeLaporanLabel}</Badge>
              <Badge variant="secondary">
                Pembulatan: {reportParams.pembulatan}
              </Badge>
              {reportParams.jnsBansos && reportParams.jnsBansos !== "all" && (
                <Badge variant="secondary">
                  Subsidi: {reportParams.jnsBansos}
                </Badge>
              )}
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
                    className="h-12 md:h-full px-2 md:px-4 py-0 text-xs md:text-sm whitespace-nowrap"
                  >
                    <Database className="w-4 h-4" />
                    <span>PostgreSQL (Converted)</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="original"
                    className="h-12 md:h-full px-2 md:px-4 py-0 text-xs md:text-sm whitespace-nowrap"
                  >
                    <Code className="w-4 h-4" />
                    <span>MySQL (Original)</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContents>
                <TabsContent value="converted" className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Query yang dieksekusi di PostgreSQL (dengan konversi
                      otomatis)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopySQL(previewData?.convertedQuery || "")
                        }
                        disabled={isLoading || !previewData?.convertedQuery}
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
                        onClick={() =>
                          handleDownloadSQL(
                            previewData?.convertedQuery || "",
                            "postgresql",
                          )
                        }
                        disabled={isLoading || !previewData?.convertedQuery}
                      >
                        <Download className="w-4 h-4 mr-2" />
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Query asli yang di-generate (MySQL syntax)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopySQL(previewData?.originalQuery || "")
                        }
                        disabled={isLoading || !previewData?.originalQuery}
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
                        onClick={() =>
                          handleDownloadSQL(
                            previewData?.originalQuery || "",
                            "mysql",
                          )
                        }
                        disabled={isLoading || !previewData?.originalQuery}
                      >
                        <Download className="w-4 h-4 mr-2" />
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

// ─── Bansos Lihat SQL Modal ────────────────────────────────────────────────

interface BelwilBansosLihatSqlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: BelwilBansosReportParams;
  filterValues?: Record<string, FilterValue>;
}

export function BelwilBansosLihatSqlModal({
  open,
  onOpenChange,
  activeFilters,
  reportParams,
  filterValues = {},
}: BelwilBansosLihatSqlModalProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("converted");
  const { previewConvertedQuery } = useBelwilBansosDataApi();

  const fetchBansosSQL = React.useCallback(async () => {
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
      fetchBansosSQL();
    }
  }, [open, fetchBansosSQL]);

  const handleBansosCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBansosDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getBansosActiveQuery = () => {
    if (!previewData) return "";
    return activeTab === "converted"
      ? previewData.convertedQuery || ""
      : previewData.originalQuery || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Lihat SQL - Bansos Kewilayahan
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Generating SQL...</p>
            </div>
          </div>
        ) : previewData ? (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {previewData.conversions && previewData.conversions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">Konversi:</span>
                {previewData.conversions.map((conv: string) => (
                  <Badge key={conv} variant="outline" className="text-xs">
                    {conv}
                  </Badge>
                ))}
              </div>
            )}

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList>
                <TabsTrigger
                  value="converted"
                  className="flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  PostgreSQL (Converted)
                </TabsTrigger>
                <TabsTrigger
                  value="original"
                  className="flex items-center gap-2"
                >
                  <Code className="w-4 h-4" />
                  MySQL (Original)
                </TabsTrigger>
              </TabsList>
              <TabsContents className="flex-1 overflow-hidden">
                <TabsContent value="converted" className="h-full">
                  <ScrollArea className="h-full border rounded-md">
                    <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
                      {previewData.convertedQuery || "-- No query generated"}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="original" className="h-full">
                  <ScrollArea className="h-full border rounded-md">
                    <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-words">
                      {previewData.originalQuery || "-- No query generated"}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </TabsContents>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
            Gagal memuat query.
          </div>
        )}

        <DialogFooter className="flex gap-2 justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBansosCopy(getBansosActiveQuery())}
              disabled={!previewData}
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Tersalin!" : "Copy"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleBansosDownload(
                  getBansosActiveQuery(),
                  `query_bansos_${activeTab}_${reportParams.tahun}_${Date.now()}.sql`,
                )
              }
              disabled={!previewData}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
