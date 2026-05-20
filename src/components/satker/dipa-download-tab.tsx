"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import { toast } from "sonner";
import { Download, FileText, Search, Calendar, RefreshCw, Archive, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useSatkerData } from "@/hooks/use-satker-data";

interface DipaDownloadTabProps {
  kdsatker: string;
}

interface DipaDownloadDocument {
  year: number;
  norev: string;
  tg: string | null;
  sizeLabel: string;
  nmfile: string;
  folder: string;
  fileorpdf: string;
  status: "available";
  download: {
    year: number;
    nmfile: string;
    folder: string;
    norev: string;
  };
}

function getDocumentKey(document: DipaDownloadDocument): string {
  return [
    document.year,
    document.nmfile,
    document.folder,
    document.norev,
    document.tg ?? "",
  ].join("|");
}

function formatDate(dateValue: string | null): string {
  if (!dateValue) return "-";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return String(dateValue);

  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function extractFileNameFromContentDisposition(headerValue: string | null): string | null {
  if (!headerValue) return null;

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const plainMatch = headerValue.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] || null;
}

export function DipaDownloadTab({ kdsatker }: DipaDownloadTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState<DipaDownloadDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const { data: satkerData } = useSatkerData(kdsatker);
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!kdsatker) return;

    let isMounted = true;
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.get<{
          success?: boolean;
          message?: string;
          data?: DipaDownloadDocument[];
        }>(`/satker/${kdsatker}/dipa-documents`);

        if (result?.success === false) {
          throw new Error(result?.message || "Gagal memuat dokumen ADK/DIPA");
        }

        const rows = Array.isArray(result?.data) ? result.data : [];
        if (isMounted) {
          setDocuments(rows);
        }
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || "Gagal memuat dokumen ADK/DIPA";
        if (isMounted) {
          setError(message);
          setDocuments([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDocuments();
    return () => {
      isMounted = false;
    };
  }, [kdsatker, refreshTick]);

  const filteredDocuments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    
    // Hanya tampilkan dokumen tahun 2026
    const docs2026 = documents.filter((doc) => doc.year === 2026);
    
    if (!term) return docs2026;

    return docs2026.filter((doc) =>
      doc.nmfile.toLowerCase().includes(term) ||
      doc.folder.toLowerCase().includes(term) ||
      String(doc.year).includes(term)
    );
  }, [documents, searchTerm]);

  const documentsByYear = useMemo(
    () =>
      filteredDocuments.reduce((acc, doc) => {
        const bucket = acc[doc.year] ?? (acc[doc.year] = []);
        bucket.push(doc);
        return acc;
      }, {} as Record<number, DipaDownloadDocument[]>),
    [filteredDocuments],
  );

  const years = useMemo(
    () => Object.keys(documentsByYear).map(Number).sort((a, b) => b - a),
    [documentsByYear],
  );

  useEffect(() => {
    if (years.length > 0) {
      setExpandedYears(prev => {
        if (Object.keys(prev).length === 0) {
          const firstYear = years[0];
          return firstYear !== undefined ? { [firstYear]: true } : prev;
        }
        return prev;
      });
    }
  }, [years]);

  const toggleYear = (year: number) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const groupedRevisionsByYear = useMemo(() => {
    const result: Record<number, any[]> = {};
    
    years.forEach(year => {
      const docs = documentsByYear[year] || [];
      const grouped: Record<string, any> = {};
      
      docs.forEach(doc => {
        const rev = doc.norev || "0";
        if (!grouped[rev]) {
          let label = `Revisi Ke-${rev}`;
          if (rev === "0" || rev === "00") label = "Data Awal";
          grouped[rev] = { norev: rev, label };
        }
        
        const nm = doc.nmfile.toLowerCase();
        const folder = doc.folder.toLowerCase();
        
        if (nm.includes('pok') || folder.includes('pok')) {
          grouped[rev].pokDoc = doc;
        } else if (nm.endsWith('.pdf')) {
          grouped[rev].pdfDoc = doc;
        } else {
          grouped[rev].adkDoc = doc;
        }
      });
      
      result[year] = Object.values(grouped).sort((a, b) => parseInt(a.norev) - parseInt(b.norev));
    });
    
    return result;
  }, [years, documentsByYear]);

  const handleRefresh = () => {
    setRefreshTick((prev) => prev + 1);
  };

  const handleDownload = async (docItem: DipaDownloadDocument) => {
    const key = getDocumentKey(docItem);
    setDownloadingKey(key);
    try {
      const params = new URLSearchParams();
      params.set("year", String(docItem.download.year));
      params.set("nmfile", docItem.download.nmfile);
      if (docItem.download.folder) params.set("folder", docItem.download.folder);
      if (docItem.download.norev) params.set("norev", docItem.download.norev);

      const response = await fetch(
        apiPath(`/satker/${encodeURIComponent(kdsatker)}/dipa-documents/download?${params.toString()}`),
        { credentials: "include" },
      );

      if (!response.ok) {
        let message = `Gagal mengunduh file (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            message = errorData.message;
          }
        } catch {
          // Ignore parse failure and keep default message.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const fileName =
        extractFileNameFromContentDisposition(contentDisposition) || docItem.nmfile || "dipa-document";

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengunduh dokumen ADK/DIPA");
    } finally {
      setDownloadingKey(null);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith(".zip")) {
      return <Archive className="h-4 w-4 text-orange-600" />;
    }
    return <FileText className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Unduh ADK/DIPA
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Download dokumen ADK dan DIPA per tahun berdasarkan data backend.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari dokumen atau tahun..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Memuat dokumen ADK/DIPA...
          </CardContent>
        </Card>
      ) : null}

      {!loading && error ? (
        <Card>
          <CardContent className="py-8 text-center text-red-600">
            {error}
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error && years.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? "Tidak ada dokumen yang sesuai dengan pencarian" : "Belum ada dokumen tersedia"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error
        ? years.map((year) => (
            <Card key={year} className="overflow-hidden transition-all duration-200">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 select-none py-4 transition-colors"
                onClick={() => toggleYear(year)}
              >
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Tahun {year}</span>
                    <Badge variant="secondary" className="ml-2">
                      {(documentsByYear[year]?.length ?? 0)} dokumen
                    </Badge>
                  </div>
                  {expandedYears[year] ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedYears[year] && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                  <CardContent className="pt-0 border-t mt-4">
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#4a6baf] hover:bg-[#4a6baf] border-b-0">
                        <TableHead className="text-white w-24 border-r border-white/20 text-center font-semibold">Kode</TableHead>
                        <TableHead className="text-white border-r border-white/20 font-semibold">Uraian</TableHead>
                        <TableHead className="text-white text-center w-40 border-r border-white/20 font-semibold">POK</TableHead>
                        <TableHead className="text-white text-center w-40 border-r border-white/20 font-semibold">ADK</TableHead>
                        <TableHead className="text-white text-center w-40 font-semibold">PDF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Satker Header Row */}
                      <TableRow className="bg-white dark:bg-card border-b hover:bg-transparent">
                        <TableCell className="align-top font-medium text-right border-r">{kdsatker}</TableCell>
                        <TableCell colSpan={4} className="font-semibold text-sm">
                          {satkerData?.nmsatker || "Memuat nama satker..."}
                        </TableCell>
                      </TableRow>
                      
                      {/* Revisions Rows */}
                      {(groupedRevisionsByYear[year] ?? []).map((group) => (
                        <TableRow key={group.norev} className="bg-white dark:bg-card border-b hover:bg-muted/30">
                          <TableCell className="border-r"></TableCell>
                          <TableCell className="pl-6 text-sm">
                            {group.label}
                          </TableCell>
                          <TableCell className="text-center border-x">
                            {group.pokDoc && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-blue-600 dark:text-blue-400 font-normal p-0 h-auto hover:no-underline hover:text-blue-800"
                                onClick={() => handleDownload(group.pokDoc!)}
                                disabled={downloadingKey === getDocumentKey(group.pokDoc!)}
                              >
                                {downloadingKey === getDocumentKey(group.pokDoc!) ? (
                                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin text-muted-foreground" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-1.5 text-muted-foreground" />
                                )}
                                POK
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-center border-r">
                            {group.adkDoc && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-blue-600 dark:text-blue-400 font-normal p-0 h-auto hover:no-underline hover:text-blue-800"
                                onClick={() => handleDownload(group.adkDoc!)}
                                disabled={downloadingKey === getDocumentKey(group.adkDoc!)}
                              >
                                {downloadingKey === getDocumentKey(group.adkDoc!) ? (
                                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin text-muted-foreground" />
                                ) : (
                                  <Save className="h-4 w-4 mr-1.5 text-muted-foreground" />
                                )}
                                ADK Petikan
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {group.pdfDoc && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-blue-600 dark:text-blue-400 font-normal p-0 h-auto hover:no-underline hover:text-blue-800"
                                onClick={() => handleDownload(group.pdfDoc!)}
                                disabled={downloadingKey === getDocumentKey(group.pdfDoc!)}
                              >
                                {downloadingKey === getDocumentKey(group.pdfDoc!) ? (
                                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin text-muted-foreground" />
                                ) : (
                                  <FileText className="h-4 w-4 mr-1.5 text-red-500" />
                                )}
                                DIPA Petikan
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
                </div>
              )}
            </Card>
          ))
        : null}

      {!loading && !error && years.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{filteredDocuments.length}</p>
                <p className="text-sm text-muted-foreground">Total Dokumen</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{filteredDocuments.length}</p>
                <p className="text-sm text-muted-foreground">Tersedia</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{years.length}</p>
                <p className="text-sm text-muted-foreground">Tahun Tersedia</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-600">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Total Backend</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
