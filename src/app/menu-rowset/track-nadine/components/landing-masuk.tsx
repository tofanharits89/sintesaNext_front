"use client";
import React, { useState, useEffect } from "react";
import moment from "moment";
import { useAuth } from "@/hooks/useAuth";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, X } from "lucide-react";

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

export default function TrackNadineMasuk() {
  const { user } = useAuth();
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

  const gradients = [
    "linear-gradient(135deg, rgba(199, 249, 204, 0.8), rgba(189, 224, 254, 0.8))",
    "linear-gradient(135deg, rgba(233, 216, 253, 0.8), rgba(255, 250, 205, 0.8))",
    "linear-gradient(135deg, rgba(253, 221, 210, 0.8), rgba(253, 226, 228, 0.8))",
    "linear-gradient(135deg, rgba(189, 245, 255, 0.8), rgba(255, 253, 208, 0.8))",
    "linear-gradient(135deg, rgba(255, 223, 234, 0.8), rgba(255, 204, 203, 0.8))",
    "linear-gradient(135deg, rgba(208, 236, 236, 0.8), rgba(230, 224, 245, 0.8))",
    "linear-gradient(135deg, rgba(255, 245, 238, 0.8), rgba(255, 253, 248, 0.8))",
    "linear-gradient(135deg, rgba(240, 240, 255, 0.8), rgba(220, 235, 250, 0.8))",
    "linear-gradient(135deg, rgba(255, 235, 215, 0.8), rgba(255, 250, 240, 0.8))",
    "linear-gradient(135deg, rgba(240, 248, 255, 0.8), rgba(230, 230, 250, 0.8))",
    "linear-gradient(135deg, rgba(255, 248, 220, 0.8), rgba(250, 250, 210, 0.8))",
    "linear-gradient(135deg, rgba(255, 239, 213, 0.8), rgba(250, 230, 230, 0.8))",
    "linear-gradient(135deg, rgba(244, 252, 250, 0.8), rgba(240, 255, 240, 0.8))",
    "linear-gradient(135deg, rgba(255, 250, 244, 0.8), rgba(245, 222, 179, 0.8))",
  ];

  const [bgColor, setBgColor] = useState<string>(gradients[0] || "");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % gradients.length;
      const nextColor = gradients[index];
      if (nextColor) setBgColor(nextColor);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const NADINE_BASE = (process.env.NEXT_PUBLIC_NADINE as string) || "";
  const NADINE_KONSEP = (process.env.NEXT_PUBLIC_NADINE_KONSEP as string) || "";
  const NADINE_UPDATE_TOKEN =
    (process.env.NEXT_PUBLIC_NADINE_UPDATE_TOKEN as string) || "";

  const getUpdate = async () => {
    try {
      const response = await fetch(NADINE_UPDATE_TOKEN);
      const dataup = await response.json();
      setDataupdate(dataup);
    } catch (err) {
      // Silent fail
    }
  };

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    setShowResult(false);

    try {
      const url = isMasuk
        ? `${NADINE_BASE}${documentId}`
        : `${NADINE_KONSEP}${documentId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setSearchQuery("");
        setStatus(data);
        setFilteredData(data.data.result);
        setToken(data.data.token);
        setShowResult(true);
      } else {
        setError(data.message || "Terjadi kesalahan");
        setShowResult(false);
      }
      getUpdate();
    } catch (err) {
      setError("Gagal menghubungi server");
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

  const handleDetailClick = (detail: string) => {
    setSelectedDetail(detail);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDetail(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card
        style={{ background: bgColor }}
        className="transition-all duration-300"
      >
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
          <CardTitle className="text-center mb-6 text-secondary-foreground">
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
          <AlertDescription>{error}</AlertDescription>
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
          <Card
            style={{ background: bgColor }}
            className="transition-all duration-300"
          >
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">No</TableHead>
                      <TableHead>Pengirim</TableHead>
                      <TableHead>Perihal</TableHead>
                      <TableHead>No ND</TableHead>
                      {isMasuk ? (
                        <>
                          <TableHead>Tgl ND</TableHead>
                          <TableHead>Tujuan Disposisi</TableHead>
                          <TableHead>Tgl Kirim ND</TableHead>
                        </>
                      ) : (
                        <TableHead>Tgl Kirim</TableHead>
                      )}
                      <TableHead className="w-[80px]">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredData.length > 0
                      ? filteredData
                      : status.data.result
                    ).map((item: NadineItemAny, index: number) => {
                      const nota = item.NotaNadine || ({} as any);
                      const isRahasia = (nota.Perihal || "").includes(
                        "Rahasia"
                      );

                      return (
                        <TableRow
                          key={index}
                          className={
                            isRahasia ? "blur-sm pointer-events-none" : ""
                          }
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {nota.Pengirim || "Tidak ada pengirim"}
                          </TableCell>
                          <TableCell>{nota.Perihal}</TableCell>
                          <TableCell>{nota.NoNd}</TableCell>
                          {isMasuk ? (
                            <>
                              <TableCell>
                                {moment(nota.TglNd).format(
                                  "DD-MM-YYYY HH:mm:ss"
                                )}
                              </TableCell>
                              <TableCell>
                                <ul className="list-disc pl-5 space-y-1">
                                  {(item.tujuanDispo || []).map((tujuan, i) => (
                                    <li key={i} className="text-sm">
                                      {tujuan}
                                    </li>
                                  ))}
                                </ul>
                              </TableCell>
                              <TableCell>
                                {moment(item.updatedAt).format(
                                  "DD-MM-YYYY HH:mm:ss"
                                )}
                              </TableCell>
                            </>
                          ) : (
                            <TableCell>{nota.TanggalKirim}</TableCell>
                          )}
                          <TableCell>
                            {item.ID ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() =>
                                  handleDetailClick(item.ID as string)
                                }
                              >
                                <i className="bi bi-arrow-right-square-fill text-xl" />
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                null
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
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
          bgcolor={bgColor}
        />
      ) : (
        <DetailKeluar
          showModal={showModal}
          handleCloseModal={handleCloseModal}
          selectedDetail={selectedDetail}
          token={token || ""}
          id={status && selectedDetail ? selectedDetail : ""}
          bgcolor={bgColor}
        />
      )}
    </div>
  );
}
