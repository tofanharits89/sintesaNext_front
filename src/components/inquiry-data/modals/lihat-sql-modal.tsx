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
import { INQUIRY_FILTER_ORDER } from "../filterOrder";

interface LihatSqlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilters: string[];
  reportParams: {
    tahun: string;
    tipeLaporan: string;
    pembulatan: string;
    jenisAkumulasi?: string;
  };
  filterValues?: Record<string, any>;
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

  const fetchSQL = async () => {
    setIsLoading(true);

    try {
      // Use the query builder to generate the actual SQL; normalize filter order for stability
      const orderMap = new Map(INQUIRY_FILTER_ORDER.map((k, i) => [k, i]));
      const normalized = activeFilters.slice().sort((a, b) => {
        const ia = orderMap.has(a)
          ? (orderMap.get(a) as number)
          : Number.MAX_SAFE_INTEGER;
        const ib = orderMap.has(b)
          ? (orderMap.get(b) as number)
          : Number.MAX_SAFE_INTEGER;
        return ia - ib;
      });
      const generatedSQL = buildQuery(normalized, filterValues, reportParams);
      setSqlQuery(generatedSQL);
    } catch (error) {
      console.error("Error generating SQL:", error);
      setSqlQuery("-- Error generating SQL query: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSQL();
    }
  }, [open, activeFilters, reportParams, filterValues]);

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
