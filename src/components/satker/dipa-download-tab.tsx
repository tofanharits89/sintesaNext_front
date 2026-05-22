"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileDown,
  FileText,
  RefreshCw,
  TextSearch,
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
  const [selectedTahun, setSelectedTahun] = useState<string>("2026");

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
          `/satker/${kdsatker}/dipa-revisions?tahun=${selectedTahun}`,
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
  }, [kdsatker, refreshTick, selectedTahun]);

  const handleRefresh = () => setRefreshTick((prev) => prev + 1);

  // ── ADK Petikan: download via backend proxy ───────────────────────────────
  const handleAdkDownload = async (rev: DipaRevisionItem) => {
    if (!rev.adkUrl) return;
    const key = rev.norev;
    setDownloadingKey(key);
    try {
      const proxyUrl = apiPath(
        `/satker/satudja-proxy?url=${encodeURIComponent(rev.adkUrl)}&tahun=${selectedTahun}`,
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
        tahun={selectedTahun}
      />

      <div className="space-y-6">
        {/* Year Filter Select */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/80 dark:border-zinc-800 p-4 rounded-lg gap-3">
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Tahun Anggaran</h4>
            <p className="text-xs text-muted-foreground">Pilih tahun anggaran revisi DIPA yang ingin Anda lihat.</p>
          </div>
          <Select value={selectedTahun} onValueChange={setSelectedTahun} disabled={loading}>
            <SelectTrigger size="sm" className="w-[120px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-950 font-medium cursor-pointer">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2027">2027</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
            <CardContent className="py-8 text-center text-red-600 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!loading && !error && revisions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 flex flex-col items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                Belum ada data revisi DIPA tersedia untuk satker ini.
              </p>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Revisions Table */}
        {!loading && !error && revisions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-semibold">Daftar Revisi DIPA</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {revisions.length} revisi tersedia
                </Badge>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={handleRefresh}
                  disabled={loading}
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table className="relative border-separate border-spacing-0">
                  <TableHeader className="bg-background sticky top-0 z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="bg-background w-24 text-center">Kode</TableHead>
                      <TableHead className="bg-background">Uraian</TableHead>
                      <TableHead className="bg-background text-center w-36">POK</TableHead>
                      <TableHead className="bg-background text-center w-36">ADK Petikan</TableHead>
                      <TableHead className="bg-background text-center w-36">DIPA Petikan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Satker Header Row */}
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell className="font-medium text-center">{kdsatker}</TableCell>
                      <TableCell colSpan={4} className="font-semibold text-sm">
                        {satkerData?.nmsatker || "Memuat nama satker..."}
                      </TableCell>
                    </TableRow>

                    {/* Revision Rows */}
                    {revisions.map((rev) => (
                      <TableRow key={rev.norev}>
                        <TableCell />
                        <TableCell className="pl-6 text-sm">{rev.label}</TableCell>

                        {/* POK */}
                        <TableCell className="text-center">
                          {rev.pokUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 cursor-pointer"
                              onClick={() => openPok(rev)}
                              title="Lihat POK"
                            >
                              <TextSearch className="h-4 w-4 mr-1.5 text-blue-600" />
                              <span className="text-xs">POK</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* ADK Petikan */}
                        <TableCell className="text-center">
                          {rev.adkUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 cursor-pointer"
                              onClick={() => handleAdkDownload(rev)}
                              disabled={downloadingKey === rev.norev}
                              title="Unduh ADK Petikan"
                            >
                              {downloadingKey === rev.norev ? (
                                <RefreshCw className="h-4 w-4 mr-1.5 animate-spin text-muted-foreground" />
                              ) : (
                                <FileDown className="h-4 w-4 mr-1.5 text-green-600" />
                              )}
                              <span className="text-xs">ADK</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* DIPA Petikan */}
                        <TableCell className="text-center">
                          {rev.dipaUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 cursor-pointer"
                              onClick={() => openDipa(rev)}
                              title="Lihat DIPA Petikan (PDF)"
                            >
                              <FileText className="h-4 w-4 mr-1.5 text-red-500" />
                              <span className="text-xs">DIPA</span>
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
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
