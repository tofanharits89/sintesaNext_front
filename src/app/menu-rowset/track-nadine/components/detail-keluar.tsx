"use client";

import moment from "moment";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton-loader";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, FileText, Calendar, ArrowRight, Building2, User, Hash } from "lucide-react";
import { apiClient } from "@/lib/api/httpClient";

interface DetailKeluarProps {
  showModal: boolean;
  handleCloseModal: () => void;
  selectedDetail: string | null;
  token: string;
  id: string;
}

interface DataNd {
  NoNd?: string;
  Perihal?: string;
  TglNd?: string;
  TglNd2?: string;
}

interface UnitInfo {
  NamaJabatan?: string;
  NamaOrganisasi?: string;
}

interface DataTeruskan {
  UnitFrom?: UnitInfo;
  UnitTo?: UnitInfo;
  CreatedDate?: string;
}

interface DetailData {
  DataNd?: DataNd;
  DataTeruskan?: DataTeruskan[];
  Riwayat?: Array<{
    Action?: string;
    CreatedAt?: string;
  }>;
}

export default function DetailKeluar({
  showModal,
  handleCloseModal,
  selectedDetail,
  token,
  id,
}: DetailKeluarProps) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (showModal && selectedDetail) {
      getData();
    }
  }, [showModal, selectedDetail]);

  const getData = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get(
        `/track-nadine/konsep/detail/${id}/${token}`
      );
      setData(result.data?.Data || result.data || null);
    } catch (err) {
      console.error("Error fetching detail data:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getTglKirim = () => {
    if (!data?.Riwayat) return "Tidak tersedia";

    const kirimRecords = data.Riwayat.filter((item) =>
      item.Action?.startsWith("Kirim")
    );

    if (kirimRecords && kirimRecords.length > 0) {
      const latestKirim = kirimRecords.sort(
        (a, b) =>
          new Date(b.CreatedAt || 0).getTime() -
          new Date(a.CreatedAt || 0).getTime()
      )[0];

      return latestKirim?.CreatedAt
        ? moment(latestKirim.CreatedAt).format("DD-MM-YYYY HH:mm:ss")
        : "Tidak tersedia";
    }

    return "Tidak tersedia";
  };

  return (
    <Dialog open={showModal} onOpenChange={handleCloseModal}>
      <DialogContent showCloseButton={false} className="max-w-4xl max-h-[90vh] flex flex-col p-0 fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-7xl sm:max-w-7xl bg-white dark:bg-zinc-950 overflow-hidden">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Mail className="h-6 w-6 text-green-600" />
            Detail Nota ID : {id}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-2 px-6">
          {loading ? (
            <DetailSkeleton />
          ) : data ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* HEADER INFO SECTION */}
              <Card className="bg-zinc-100 dark:bg-black border-muted/50 shadow-none overflow-hidden">
                <CardContent className="py-0 px-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-primary">
                        <Hash className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Nomor ND</span>
                      </div>
                      <p className="text-sm font-bold text-foreground font-mono">{data?.DataNd?.NoNd || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-primary">
                        <Calendar className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Tanggal ND</span>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        {data?.DataNd?.TglNd ? moment(data.DataNd.TglNd).format("DD MMMM YYYY") : "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-primary">
                        <Mail className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Waktu Kirim</span>
                      </div>
                      <p className="text-sm font-bold text-foreground">{getTglKirim()}</p>
                    </div>
                  </div>

                  <div className="space-y-1 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-primary">
                      <FileText className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Perihal</span>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {data?.DataNd?.Perihal || "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* DETAIL KONSEP SECTION */}
              <Card className="bg-zinc-100 dark:bg-black border-muted/50 shadow-none overflow-hidden">
                <CardContent className="p-0">
                  <div className="py-0 px-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-500/10 rounded-md text-blue-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-foreground tracking-tight">Detail Konsep & Alur Terusan</h4>
                      </div>
                      <Badge variant="secondary" className="bg-blue-500/5 text-blue-600 border-blue-500/10 px-3">
                        {data?.DataTeruskan?.length || 0} Terusan
                      </Badge>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-border/50">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Pengirim (Dari)</TableHead>
                            <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-center text-muted-foreground">
                              <ArrowRight className="h-3 w-3 inline" />
                            </TableHead>
                            <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Penerima (Ke)</TableHead>
                            <TableHead className="py-3 text-xs font-bold uppercase tracking-wider text-right text-muted-foreground">Waktu Terusan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.DataTeruskan && data.DataTeruskan.length > 0 ? (
                            data.DataTeruskan.map((item, idx) => {
                              if (item.UnitTo) {
                                return (
                                  <TableRow key={idx} className="group transition-colors hover:bg-muted/30 border-border/30">
                                    <TableCell className="py-4">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <User className="h-3 w-3 text-primary/70" />
                                          <span className="text-xs font-bold text-foreground leading-none">{item.UnitFrom?.NamaJabatan || "-"}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground ml-5 line-clamp-1 italic">{item.UnitFrom?.NamaOrganisasi}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-center">
                                      <div className="h-6 w-6 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <ArrowRight className="h-3 w-3" />
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                      <div className="flex items-center gap-2">
                                        <Building2 className="h-3 w-3 text-primary/70" />
                                        <span className="text-xs font-medium text-foreground">{item.UnitTo?.NamaOrganisasi || "-"}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                        <Calendar className="h-3 w-3" />
                                        {item.CreatedDate ? moment(item.CreatedDate).format("DD/MM/YY HH:mm") : "-"}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                              return null;
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                  <FileText className="h-8 w-8 opacity-20" />
                                  <p className="text-sm font-medium">Tidak ada data teruskan konsep</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center gap-4 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
              <div className="h-14 w-14 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                <Mail className="h-7 w-7 opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-destructive font-bold text-lg">Gagal Memuat Detail</p>
                <p className="text-muted-foreground text-sm max-w-[250px] mx-auto mt-1">Data nota detail Nadine tidak ditemukan atau sesi telah berakhir.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 pt-4">
          <Button variant="default" onClick={handleCloseModal} className="px-8">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER INFO SKELETON */}
      <Card className="bg-zinc-100 dark:bg-black border-muted/50 shadow-none overflow-hidden">
        <CardContent className="py-4 px-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-3/4" />
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* DETAIL KONSEP SKELETON */}
      <Card className="bg-zinc-100 dark:bg-black border-muted/50 shadow-none overflow-hidden">
        <CardContent className="p-0">
          <div className="py-4 px-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-5 w-48" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <div className="overflow-hidden rounded-lg border border-border/50">
              <div className="p-0">
                <div className="bg-muted/50 h-10 w-full border-b border-border/50 flex items-center px-4 gap-4">
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-10 mx-auto" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-20 ml-auto" />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 w-full border-b border-border/50 last:border-0 flex items-center px-4 gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-5 w-24 rounded ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
