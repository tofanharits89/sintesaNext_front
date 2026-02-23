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
import { Download, FileText, Search, Calendar, RefreshCw, Archive } from "lucide-react";

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
    if (!term) return documents;

    return documents.filter((doc) =>
      doc.nmfile.toLowerCase().includes(term) ||
      doc.folder.toLowerCase().includes(term) ||
      String(doc.year).includes(term),
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
            <Card key={year}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Tahun {year}
                  <Badge variant="outline" className="ml-2">
                    {(documentsByYear[year]?.length ?? 0)} dokumen
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100 dark:bg-slate-700">
                        <TableHead className="w-12 text-center">No</TableHead>
                        <TableHead className="text-center">Nama File</TableHead>
                        <TableHead className="w-24 text-center">Revisi Ke-</TableHead>
                        <TableHead className="text-center">Folder</TableHead>
                        <TableHead className="w-32 text-center">Tanggal</TableHead>
                        <TableHead className="w-24 text-center">Ukuran</TableHead>
                        <TableHead className="w-32 text-center">Download</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(documentsByYear[year] ?? []).map((doc, index) => {
                        const docKey = getDocumentKey(doc);
                        const isDownloading = downloadingKey === docKey;
                        return (
                          <TableRow key={docKey}>
                            <TableCell className="font-medium text-center">{index + 1}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                {getFileIcon(doc.nmfile)}
                                <p className="font-medium">{doc.nmfile}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Badge variant="outline">{doc.norev || "0"}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm font-mono text-muted-foreground">{doc.folder || "-"}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{formatDate(doc.tg)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{doc.sizeLabel || "-"}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(doc)}
                                disabled={isDownloading}
                                className="h-8"
                              >
                                {isDownloading ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Mengunduh
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
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
