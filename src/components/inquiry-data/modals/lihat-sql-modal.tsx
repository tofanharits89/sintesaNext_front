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
import { Tabs, TabsContent, TabsList, TabsTrigger, TabsContents } from "@/components/animate-ui/components/animate/tabs";
import {
  Code,
  Copy,
  Download,
  Loader2,
  CheckCircle,
  Database,
} from "lucide-react";
import { useInquiryDataApi } from "@/hooks/use-inquiry-data-api";
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
    scope?: "belanja" | "tematik" | "general" | "rkakl_detail" | "kontrak" | "up_tup" | "penerimaan_pnbp";
    tematikKategori?: string;
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
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("converted");
  const { previewConvertedQuery } = useInquiryDataApi();

  const fetchSQL = React.useCallback(async () => {
    setIsLoading(true);
    setPreviewData(null);

    try {
      // Use the preview endpoint to get both original and converted SQL
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
      console.error("Error generating SQL:", error);
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
    a.download = `query_${suffix}_${
      reportParams.scope === "tematik" ? "tematik" : "belanja"
    }_${new Date().toISOString().split("T")[0]}.sql`;
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
                {reportParams.scope === "tematik" ? "Kategori" : "Tipe"}:{" "}
                {reportParams.scope === "tematik"
                  ? reportParams.tematikKategori || "All"
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
              {previewData?.conversions && (
                <>
                  {previewData.conversions.hasConvert && (
                    <Badge variant="destructive" className="text-xs">
                      CONVERT detected
                    </Badge>
                  )}
                  {previewData.conversions.hasIfnull && (
                    <Badge variant="destructive" className="text-xs">
                      IFNULL detected
                    </Badge>
                  )}
                  {previewData.conversions.hasDateFormat && (
                    <Badge variant="destructive" className="text-xs">
                      DATE_FORMAT detected
                    </Badge>
                  )}
                  {previewData.conversions.hasGroupConcat && (
                    <Badge variant="destructive" className="text-xs">
                      GROUP_CONCAT detected
                    </Badge>
                  )}
                  {previewData.conversions.hasMysqlLimit && (
                    <Badge variant="destructive" className="text-xs">
                      MySQL LIMIT syntax
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          {/* SQL Display with Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">SQL Query</h4>
            </div>

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
                    {previewData?.conversions &&
                      Object.values(previewData.conversions).some((v) => v) && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          Converted
                        </Badge>
                      )}
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
                        <div className="text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          <p className="text-slate-400">
                            Converting to PostgreSQL...
                          </p>
                        </div>
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
                    Query asli yang di-generate oleh Query Builder (MySQL
                    syntax)
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
                        <div className="text-center">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          <p className="text-slate-400">
                            Generating original query...
                          </p>
                        </div>
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

          {/* Conversion Info */}
          {previewData?.conversions &&
            Object.values(previewData.conversions).some((v) => v) && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Konversi yang diterapkan:</strong> Query telah
                  dikonversi dari MySQL ke PostgreSQL untuk kompatibilitas
                  dengan database yang digunakan. Beberapa fungsi seperti
                  CONVERT, IFNULL, DATE_FORMAT, dan GROUP_CONCAT telah diubah ke
                  fungsi PostgreSQL yang setara.
                </p>
              </div>
            )}

          {/* Warning */}
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
