"use client";

import { useEffect, useState } from "react";
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
import { apiClient } from "@/lib/api/httpClient";
import { apiPath } from "@/lib/config/base-path";
import { toast } from "sonner";
import {
  Download,
  FileText,
  RefreshCw,
  Save,
  AlertCircle,
} from "lucide-react";
import { useSatkerData } from "@/hooks/use-satker-data";
import { PokModal } from "@/components/satker/pok-modal";
import { DipaModal } from "@/components/satker/dipa-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DipaDownloadTabProps {
  kdsatker: string;
}

interface DipaRevisionItem {
  norev: string;
  label: string;
  pokUrl: string | null;
  adkUrl: string | null;
  dipaUrl: string | null;
}

interface SatudjaResponse {
  success: boolean;
  message?: string;
  data?: {
    kdsatker: string;
    kddept: string;
    kdunit: string;
    revisions: DipaRevisionItem[];
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DipaDownloadTab({ kdsatker }: DipaDownloadTabProps) {
  const [revisions, setRevisions] = useState<DipaRevisionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  // Modal state
  const [pokModal, setPokModal] = useState<{ open: boolean; url: string | null; title: string }>({
    open: false,
    url: null,
    title: "POK",
  });
  const [dipaModal, setDipaModal] = useState<{ open: boolean; url: string | null; title: string }>({
    open: false,
    url: null,
    title: "DIPA Petikan",
  });

  const { data: satkerData } = useSatkerData(kdsatker);

  // ── Fetch revision list from backend ──────────────────────────────────────
  useEffect(() => {
    if (!kdsatker) return;

    let isMounted = true;
    const fetchRevisions = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.get<SatudjaResponse>(
          `/satker/${kdsatker}/dipa-revisions`,
        );

        if (result?.success === false) {
          throw new Error(result?.message || "Gagal memuat daftar revisi DIPA");
        }

        const rows = Array.isArray(result?.data?.revisions) ? result.data!.revisions : [];
        if (isMounted) {
          setRevisions(rows);
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || "Gagal memuat daftar revisi DIPA";
        if (isMounted) {
          setError(message);
          setRevisions([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRevisions();
    return () => {
      isMounted = false;
    };
  }, [kdsatker, refreshTick]);

  const handleRefresh = () => setRefreshTick((prev) => prev + 1);

  // ── ADK Petikan: download via backend proxy ───────────────────────────────
  const handleAdkDownload = async (rev: DipaRevisionItem) => {
    if (!rev.adkUrl) return;
    const key = rev.norev;
    setDownloadingKey(key);
    try {
      const proxyUrl = apiPath(
        `/satker/satudja-proxy?url=${encodeURIComponent(rev.adkUrl)}`,
      );
      const response = await fetch(proxyUrl, { credentials: "include" });

      if (!response.ok) {
        let msg = `Gagal mengunduh ADK (${response.status})`;
        try {
          const errData = await response.json();
          if (errData?.message) msg = errData.message;
        } catch { /* noop */ }
        throw new Error(msg);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      let fileName = rev.adkUrl.split("/").pop() || "adk-petikan";

      if (contentDisposition) {
        const utf8 = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8?.[1]) {
          try { fileName = decodeURIComponent(utf8[1]); } catch { fileName = utf8[1]; }
        } else {
          const plain = contentDisposition.match(/filename="?([^"]+)"?/i);
          if (plain?.[1]) fileName = plain[1];
        }
      }

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengunduh ADK Petikan");
    } finally {
      setDownloadingKey(null);
    }
  };

  // ── POK Modal ─────────────────────────────────────────────────────────────
  const openPok = (rev: DipaRevisionItem) => {
    setPokModal({
      open: true,
      url: rev.pokUrl,
      title: `POK — ${rev.label} (${kdsatker})`,
    });
  };

  // ── DIPA Modal ────────────────────────────────────────────────────────────
  const openDipa = (rev: DipaRevisionItem) => {
    setDipaModal({
      open: true,
      url: rev.dipaUrl,
      title: `DIPA Petikan — ${rev.label} (${kdsatker})`,
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* POK Modal */}
      <PokModal
        isOpen={pokModal.open}
        onClose={() => setPokModal((prev) => ({ ...prev, open: false }))}
        pokUrl={pokModal.url}
        title={pokModal.title}
      />

      {/* DIPA PDF Modal */}
      <DipaModal
        isOpen={dipaModal.open}
        onClose={() => setDipaModal((prev) => ({ ...prev, open: false }))}
        dipaUrl={dipaModal.url}
        title={dipaModal.title}
      />

      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Unduh ADK/DIPA
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Daftar revisi ADK dan DIPA berdasarkan data SatuDJA.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {revisions.length > 0 && (
                <Badge variant="secondary">
                  {revisions.length} revisi tersedia
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Memuat daftar revisi DIPA dari SatuDJA...
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {!loading && error && (
          <Card>
            <CardContent className="py-8 text-center text-red-600">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!loading && !error && revisions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                Belum ada data revisi DIPA tersedia untuk satker ini.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Revisions Table */}
        {!loading && !error && revisions.length > 0 && (
          <Card className="overflow-hidden">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#4a6baf] hover:bg-[#4a6baf] border-b-0">
                    <TableHead className="text-white w-24 border-r border-white/20 text-center font-semibold">
                      Kode
                    </TableHead>
                    <TableHead className="text-white border-r border-white/20 font-semibold">
                      Uraian
                    </TableHead>
                    <TableHead className="text-white text-center w-40 border-r border-white/20 font-semibold">
                      POK
                    </TableHead>
                    <TableHead className="text-white text-center w-40 border-r border-white/20 font-semibold">
                      ADK Petikan
                    </TableHead>
                    <TableHead className="text-white text-center w-40 font-semibold">
                      DIPA Petikan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Satker Header Row */}
                  <TableRow className="bg-white dark:bg-card border-b hover:bg-transparent">
                    <TableCell className="align-top font-medium text-right border-r">
                      {kdsatker}
                    </TableCell>
                    <TableCell colSpan={4} className="font-semibold text-sm">
                      {satkerData?.nmsatker || "Memuat nama satker..."}
                    </TableCell>
                  </TableRow>

                  {/* Revision Rows */}
                  {revisions.map((rev) => (
                    <TableRow
                      key={rev.norev}
                      className="bg-white dark:bg-card border-b hover:bg-muted/30"
                    >
                      <TableCell className="border-r" />
                      <TableCell className="pl-6 text-sm">{rev.label}</TableCell>

                      {/* POK */}
                      <TableCell className="text-center border-x">
                        {rev.pokUrl ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-blue-600 dark:text-blue-400 font-normal p-0 h-auto hover:no-underline hover:text-blue-800"
                            onClick={() => openPok(rev)}
                          >
                            <FileText className="h-4 w-4 mr-1.5 text-muted-foreground" />
                            POK
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* ADK Petikan */}
                      <TableCell className="text-center border-r">
                        {rev.adkUrl ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-blue-600 dark:text-blue-400 font-normal p-0 h-auto hover:no-underline hover:text-blue-800"
                            onClick={() => handleAdkDownload(rev)}
                            disabled={downloadingKey === rev.norev}
                          >
                            {downloadingKey === rev.norev ? (
                              <RefreshCw className="h-4 w-4 mr-1.5 animate-spin text-muted-foreground" />
                            ) : (
                              <Save className="h-4 w-4 mr-1.5 text-muted-foreground" />
                            )}
                            ADK Petikan
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* DIPA Petikan */}
                      <TableCell className="text-center">
                        {rev.dipaUrl ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-blue-600 dark:text-blue-400 font-normal p-0 h-auto hover:no-underline hover:text-blue-800"
                            onClick={() => openDipa(rev)}
                          >
                            <FileText className="h-4 w-4 mr-1.5 text-red-500" />
                            DIPA Petikan
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Summary Stats */}
        {!loading && !error && revisions.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{revisions.length}</p>
                  <p className="text-sm text-muted-foreground">Total Revisi</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {revisions.filter((r) => r.pokUrl).length}
                  </p>
                  <p className="text-sm text-muted-foreground">POK Tersedia</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {revisions.filter((r) => r.dipaUrl).length}
                  </p>
                  <p className="text-sm text-muted-foreground">DIPA PDF Tersedia</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
