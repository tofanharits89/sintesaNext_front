"use client";
import React, { useState, useEffect } from "react";
import moment from "moment";
import "moment/locale/id";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import SaveUserData from "@/components/SaveUserData";
import Detail from "./detail-masuk";
import DetailKeluar from "./detail-keluar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X, ArrowRightSquare, Eye } from "lucide-react";
import { apiClient } from "@/lib/api/httpClient";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

interface NadineItemAny {
  ID?: string;
  updatedAt?: string;
  NotaNadine?: {
    TglNd?: string;
    TglNd2?: string;
    Pengirim?: string;
    Perihal?: string;
    NoNd?: string;
    TanggalKirim?: string;
  };
  tujuanDispo?: string[];
}

interface TrackNadineMasukProps {
  initialId?: string;
  autoSearch?: boolean;
}

export default function TrackNadineMasuk({
  initialId = "",
  autoSearch = true,
}: TrackNadineMasukProps) {
  const { user, refetch } = useAuth();
  const router = useRouter();
  const username = user?.username as string | undefined;

  const [isMasuk, setIsMasuk] = useState(true);
  const [documentId, setDocumentId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<any | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [message, setMessage] = useState("");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState<NadineItemAny[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [dataupdate, setDataupdate] = useState<any>(null);

  const getUpdate = async () => {
    try {
      const dataup = await apiClient.get("/track-nadine/update-token");
      setDataupdate(dataup);
    } catch (err) {
      if ((err as any)?.response?.status === 401) {
        setDataupdate(null);
      }
      // Silent fail for others
    }
  };

  const handleSubmit = async (
    e?: React.FormEvent<HTMLFormElement>,
    overrideId?: string
  ) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    setShowResult(false);

    try {
      const idToUse = overrideId ?? documentId;
      const path = isMasuk ? "/track-nadine/disposisi" : "/track-nadine/keluar";
      const params = isMasuk
        ? { limit: 100, offset: 0, search: idToUse }
        : { limit: 100, offset: 0, general: idToUse };

      // Debug log so developers can inspect actual request
      // eslint-disable-next-line no-console
      console.debug("TrackNadine - fetching:", path, params);

      const data = await apiClient.get(path, { params });

      setSearchQuery("");
      setStatus(data);
      setFilteredData(data.data.result);
      setToken(data.data.token);
      setShowResult(true);
      getUpdate();
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("TrackNadine fetch error", err);

      if (err?.response?.status === 401) {
        setError(
          "Unauthorized — silakan login terlebih dahulu untuk mengakses fitur ini"
        );
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Gagal menghubungi server — periksa koneksi dan jalankan backend"
        );
      }
      setShowResult(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterData = () => {
    if (!status || !status.data || !status.data.result) return;

    let data: NadineItemAny[] = status.data.result || [];

    if (filterYear && filterYear !== "all") {
      data = data.filter((item) => {
        const t = item.NotaNadine?.TglNd2 || item.NotaNadine?.TglNd || "";
        const year = t ? new Date(t).getFullYear() : NaN;
        return year.toString() === filterYear;
      });
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      data = data.filter((item) => {
        return (
          (item.NotaNadine?.Perihal || "")
            .toLowerCase()
            .includes(lowerCaseQuery) ||
          (item.NotaNadine?.Pengirim || "")
            .toLowerCase()
            .includes(lowerCaseQuery) ||
          (item.NotaNadine?.NoNd || "").toLowerCase().includes(lowerCaseQuery)
        );
      });
    }

    setFilteredData(data);
  };

  useEffect(() => {
    if (status && status.data) {
      handleFilterData();
    }
  }, [filterYear, searchQuery, status]);

  // Reset state when switching modes
  useEffect(() => {
    setDocumentId("");
    setStatus(null);
    setShowResult(false);
    setError(null);
    setFilteredData([]);
  }, [isMasuk]);

  // Handle initialId prop: pre-fill and optionally auto-search
  useEffect(() => {
    if (initialId && initialId.length > 0) {
      setDocumentId(initialId);
      if (autoSearch) {
        void handleSubmit(undefined, initialId);
      }
    }
  }, [initialId, autoSearch]);

  const handleDetailClick = (detail: string) => {
    setSelectedDetail(detail);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDetail(null);
  };

  const columns = useMemo<ColumnDef<NadineItemAny>[]>(() => {
    const cols: ColumnDef<NadineItemAny>[] = [
      {
        id: "no",
        header: () => <div className="text-center font-medium">No</div>,
        cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
      },
      {
        accessorKey: "NotaNadine.NoNd",
        header: () => <div className="text-center font-medium">No. ND/Surat {isMasuk ? "Masuk" : "Keluar"}</div>,
        cell: ({ row }) => <div className="text-center whitespace-nowrap px-4">{row.original.NotaNadine?.NoNd}</div>,
      },
      {
        accessorKey: "NotaNadine.TglNd",
        header: () => <div className="text-center font-medium">Tanggal ND/Surat {isMasuk ? "Masuk" : "Keluar"}</div>,
        cell: ({ row }) => {
          const tgl = row.original.NotaNadine?.TglNd;
          if (!tgl) return <div className="text-center">-</div>;
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-normal whitespace-nowrap text-foreground">{moment(tgl).locale("id").format("D MMMM YYYY")}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{moment(tgl).format("HH:mm:ss")}</span>
            </div>
          );
        },
      },
      {
        id: "tanggalKirim",
        header: () => <div className="text-center font-medium">Tanggal Kirim ND/Surat {isMasuk ? "Masuk" : "Keluar"}</div>,
        cell: ({ row }) => {
          const tgl = isMasuk ? row.original.updatedAt : row.original.NotaNadine?.TanggalKirim;
          if (!tgl) return <div className="text-center">-</div>;
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-normal whitespace-nowrap text-foreground">{moment(tgl).locale("id").format("D MMMM YYYY")}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{moment(tgl).format("HH:mm:ss")}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "NotaNadine.Pengirim",
        header: () => <div className="text-center font-medium">Pengirim</div>,
        cell: ({ row }) => (
          <div className="min-w-[200px] max-w-[300px] whitespace-normal break-words">
            {row.original.NotaNadine?.Pengirim || "Tidak ada pengirim"}
          </div>
        ),
      },
      {
        accessorKey: "NotaNadine.Perihal",
        header: () => <div className="text-center font-medium">Perihal</div>,
        cell: ({ row }) => {
          const perihal = row.original.NotaNadine?.Perihal || "";
          const isRahasia = perihal.includes("Rahasia");
          return (
            <div className={`min-w-[300px] max-w-[500px] whitespace-normal break-words ${isRahasia ? "blur-sm select-none" : ""}`}>
              {perihal}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center font-medium">Detail</div>,
        size: 120,
        cell: ({ row }) => (
          <div className="flex justify-center min-w-[100px]">
            {row.original.ID ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 cursor-pointer"
                onClick={() => handleDetailClick(row.original.ID as string)}
                title="Lihat Detail"
              >
                <Eye className="h-4 w-4 text-amber-600" />
              </Button>
            ) : (
              <span className="text-muted-foreground text-xs">null</span>
            )}
          </div>
        ),
      },
    ];

    return cols;
  }, [isMasuk]);

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card className="transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-col gap-2">
              {message && (
                <p className="text-xs text-muted-foreground">{message}</p>
              )}
              {dataupdate && (
                <p className="text-xs text-muted-foreground">
                  Update Token:{" "}
                  {moment(dataupdate.data).format("DD-MM-YYYY HH:mm:ss")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {status && status.data && (
                <p className="text-xs text-muted-foreground">
                  {filteredData.length > 0
                    ? `${filteredData.length} data ditemukan`
                    : `${status.data.result.length} data ditemukan`}
                </p>
              )}
              <div className="flex items-center space-x-2 bg-white/50 p-2 rounded-lg">
                <Label
                  htmlFor="mode-switch"
                  className={`cursor-pointer ${
                    isMasuk ? "font-bold text-primary" : "text-muted-foreground"
                  }`}
                >
                  Masuk
                </Label>
                <Switch
                  id="mode-switch"
                  checked={!isMasuk}
                  onCheckedChange={(checked) => setIsMasuk(!checked)}
                />
                <Label
                  htmlFor="mode-switch"
                  className={`cursor-pointer ${
                    !isMasuk
                      ? "font-bold text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  Keluar
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <CardTitle className="text-center mb-6">
            Track Disposisi Nadine - Surat {isMasuk ? "Masuk" : "Keluar"}
          </CardTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Masukkan perihal, nomor ND, nota ID dll disini..."
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <Button type="submit" disabled={loading} className="h-12 px-8">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mencari...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <div className="flex items-center justify-between w-full">
            <AlertDescription>{error}</AlertDescription>
            {!user && error.toLowerCase().includes("unauthorized") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/login")}
              >
                Login
              </Button>
            )}
            {user && error.toLowerCase().includes("unauthorized") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void refetch()}
                className="ml-2"
              >
                Refresh Session
              </Button>
            )}
          </div>
        </Alert>
      )}

      {/* Results */}
      {showResult && status && !error && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {Array.from(
                  new Set<number>(
                    status.data.result.map((item: any) =>
                      new Date(item.NotaNadine.TglNd2).getFullYear()
                    )
                  )
                ).map((year: number) => (
                  <SelectItem key={year} value={String(year)}>
                    Tahun {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Cari data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Results Table */}
          <Card className="transition-all duration-300 shadow-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Daftar Surat {isMasuk ? "Masuk" : "Keluar"}</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={filteredData.length > 0 ? filteredData : (status?.data?.result || [])} 
                initialPageSize={10} 
              />
            </CardContent>
          </Card>
        </div>
      )}

      <SaveUserData userData={username || ""} menu="track-nadine" />

      {isMasuk ? (
        <Detail
          showModal={showModal}
          handleCloseModal={handleCloseModal}
          selectedDetail={selectedDetail}
          token={token || ""}
          id={status && selectedDetail}
        />
      ) : (
        <DetailKeluar
          showModal={showModal}
          handleCloseModal={handleCloseModal}
          selectedDetail={selectedDetail}
          token={token || ""}
          id={status && selectedDetail ? selectedDetail : ""}
        />
      )}
    </div>
  );
}
