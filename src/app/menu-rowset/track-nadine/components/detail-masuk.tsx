"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton-loader";
import { Loader2, Mail, User, Building2, IdCard, Hash, Shield, Users, X } from "lucide-react";
import { apiClient } from "@/lib/api/httpClient";
// import { io } from "socket.io-client"; // optional: keep commented until needed

interface DetailProps {
  showModal: boolean;
  handleCloseModal: () => void;
  selectedDetail?: string | null;
  token?: string | null;
  id?: string | null;
}

interface UnitPenerima {
  NamaEselon3?: string;
  NamaOrganisasi?: string;
  NamaPejabat?: string;
  NipPejabat?: string;
}

interface DispoEs4 {
  UnitPenerima?: UnitPenerima;
}

interface UserPenerima {
  Nama?: string;
  Nip18?: string;
  NamaJabatan?: string;
}

interface DispoStaf {
  UserPenerima: UserPenerima;
}

interface Dispo {
  dispoEs4: DispoEs4[];
  dispoStaf: DispoStaf[];
}

interface KonseptorData {
  Data?: {
    Riwayat?: { Unit?: string }[];
    DataNd?: { Perihal?: string; TglNd?: string; NoNd?: string };
  } | null;
  Konseptor?: any;
}

export default function Detail({
  showModal,
  handleCloseModal,
  selectedDetail,
  token,
  id,
}: DetailProps) {
  const [data, setData] = useState<Dispo[] | null | []>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  const [loadingKonseptor, setLoadingKonseptor] = useState(false);
  const [konseptorData, setKonseptorData] = useState<KonseptorData | null>(
    null
  );
  const [namaKonseptorDanKasi, setNamaKonseptorDanKasi] = useState<string[]>(
    []
  );
  const [showKonseptorModal, setShowKonseptorModal] = useState(false);

  useEffect(() => {
    if (showModal && selectedDetail) {
      getData();
    }
  }, [showModal, selectedDetail]);

  // Commented socket code for later use - can be enabled if needed
  /*
  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_LOCAL_SOCKET_DANADESA}`);
    socket.on("syncStatus", (data) => {
      setMessage(data.message || "");
    });
    return () => {
      socket.disconnect();
    };
  }, []);
  */


  const getData = async () => {
    if (!selectedDetail) return;
    setLoading(true);
    try {
      const result = await apiClient.get(
        `/track-nadine/disposisi/detail/${selectedDetail}/${token}`
      );

      if (
        result?.success &&
        Array.isArray(result?.data) &&
        result.data.length > 0
      ) {
        setData(result.data[0]?.dataDisposisi || []);
      } else {
        setData([]);
      }
    } catch (err: any) {
      console.error("Error fetching detail data:", err);
      if (err?.response?.status === 401) {
        setMessage("Unauthorized — silakan login untuk melihat detail");
      }
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchKonseptorData = async (notaId?: string | null) => {
    if (!token || !notaId) return;
    setLoadingKonseptor(true);
    try {
      const result = await apiClient.get(
        `/track-nadine/konsep/detail/${notaId}/${token}`
      );
      setKonseptorData(
        result?.data?.Data ? { Data: result.data.Data, Konseptor: result.data.Konseptor } : null
      );

      const uniqueMap = new Map<string, string>();
      result?.data?.Data?.Riwayat?.forEach((item: any) => {
        if (item?.Unit) uniqueMap.set(item.Unit, item.Unit);
      });
      const uniqueFilteredRiwayat = [...uniqueMap.values()];
      setNamaKonseptorDanKasi(uniqueFilteredRiwayat);
    } catch (err) {
      console.error("Error fetching konseptor data:", err);
      setKonseptorData(null);
      setNamaKonseptorDanKasi([]);
    } finally {
      setLoadingKonseptor(false);
    }
  };

  const handleShowKonseptor = () => {
    if (selectedDetail) {
      fetchKonseptorData(selectedDetail);
      setShowKonseptorModal(true);
    }
  };

  const handleCloseKonseptor = () => setShowKonseptorModal(false);

  return (
    <>
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent showCloseButton={false} className="max-w-4xl max-h-[90vh] flex flex-col p-0 fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-7xl sm:max-w-7xl bg-white dark:bg-zinc-950">
          <DialogHeader className="p-8 pb-6">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              Detail Nota ID : {id}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {message && (
              <Alert
                variant="destructive"
                className="flex items-center justify-between bg-red-50 border-red-200"
              >
                <AlertDescription className="text-red-700">
                  {message}
                </AlertDescription>
                {!user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/login")}
                    className="ml-2"
                  >
                    Login
                  </Button>
                )}
              </Alert>
            )}
            {loading ? (
              <DetailSkeleton />
            ) : data && Array.isArray(data) && data.length > 0 ? (<div className="space-y-8 pb-4">
              {data.map((dispo: Dispo, index: number) => (
                <div
                  key={index}
                  className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <h5 className="font-bold text-foreground m-0 text-xl tracking-tight">
                        {dispo?.dispoEs4 &&
                          dispo.dispoEs4.length > 0 &&
                          dispo.dispoEs4[0]?.UnitPenerima
                          ? dispo.dispoEs4[0].UnitPenerima?.NamaEselon3
                          : "Data Eselon 3 Tidak Tersedia"}
                      </h5>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                      Eselon 3
                    </Badge>
                  </div>

                  <div className="space-y-8">
                    {/* ESELON 4 SECTION */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Eselon 4
                        </span>
                      </div>
                      <div className={`grid grid-cols-1 ${dispo.dispoEs4.length > 1 ? "md:grid-cols-2" : ""} gap-4`}>
                        {dispo.dispoEs4.map((es4, es4Index) => (
                          <Card key={es4Index} className="bg-white dark:bg-zinc-950 overflow-hidden p-0 gap-0 shadow-sm border-zinc-200 dark:border-zinc-800">
                            <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
                              <p className="text-sm font-bold text-foreground tracking-tight truncate">
                                {es4.UnitPenerima?.NamaOrganisasi || "-"}
                              </p>
                            </div>
                            <div className="p-2.5 flex items-center gap-3">
                              <div className="h-8 w-8 bg-primary/5 rounded-full flex items-center justify-center text-primary shrink-0">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-foreground truncate leading-tight">{es4.UnitPenerima?.NamaPejabat || "-"}</p>
                                <p className="text-xs text-muted-foreground truncate font-mono">{es4.UnitPenerima?.NipPejabat || "-"}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* PELAKSANA SECTION */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          Pelaksana
                        </span>
                      </div>
                      <div className={`grid grid-cols-1 ${dispo.dispoStaf.length === 2 ? "sm:grid-cols-2" :
                        dispo.dispoStaf.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : ""
                        } gap-3`}>
                        {dispo.dispoStaf.map((staf, stafIndex) => (
                          <Card key={stafIndex} className="bg-white dark:bg-zinc-950 overflow-hidden p-0 gap-0 shadow-sm border-zinc-200 dark:border-zinc-800">
                            <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
                              <p className="text-sm font-bold text-foreground tracking-tight truncate">
                                {staf.UserPenerima?.NamaJabatan || "Pelaksana"}
                              </p>
                            </div>
                            <div className="p-2.5 flex items-center gap-3">
                              <div className="h-8 w-8 bg-primary/5 rounded-full flex items-center justify-center text-primary shrink-0">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-foreground truncate leading-tight">{staf.UserPenerima?.Nama}</p>
                                <p className="text-xs text-muted-foreground truncate font-mono">{staf.UserPenerima?.Nip18}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-2xl border-2 border-dashed border-border/50">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                    <Mail className="h-6 w-6" />
                  </div>
                  <p className="text-muted-foreground font-medium italic">Data nota detail Nadine gagal didapatkan...</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 pt-6 gap-3">
            <Button
              onClick={handleShowKonseptor}
              variant="default"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Lihat Konseptor
            </Button>
            <Button variant="outline" onClick={handleCloseModal} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showKonseptorModal} onOpenChange={handleCloseKonseptor}>
        <DialogContent showCloseButton={false} className="max-w-3xl fixed z-[60] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-7xl sm:max-w-7xl max-h-[90vw] sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Data Konseptor
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {loadingKonseptor ? (
              <div className="flex justify-center items-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : konseptorData ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-200">
                    <TableRow>
                      <TableHead className="text-gray-900 font-semibold">
                        Unit
                      </TableHead>
                      <TableHead className="text-gray-900 font-semibold">
                        Perihal
                      </TableHead>
                      <TableHead className="text-gray-900 font-semibold">
                        Tanggal ND
                      </TableHead>
                      <TableHead className="text-gray-900 font-semibold">
                        Nomor ND
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="align-top text-gray-900">
                        {namaKonseptorDanKasi && namaKonseptorDanKasi.length > 0
                          ? namaKonseptorDanKasi.map((item, idx) => (
                            <div key={idx} className="mb-1">
                              {item}
                            </div>
                          ))
                          : "Tidak tersedia"}
                      </TableCell>
                      <TableCell className="align-top text-gray-900">
                        {konseptorData?.Data?.DataNd?.Perihal ||
                          "Tidak tersedia"}
                      </TableCell>
                      <TableCell className="align-top text-gray-900">
                        {konseptorData?.Data?.DataNd?.TglNd || "Tidak tersedia"}
                      </TableCell>
                      <TableCell className="align-top text-gray-900">
                        {konseptorData?.Data?.DataNd?.NoNd || "Tidak tersedia"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-destructive font-bold py-8">
                Data konseptor tidak tersedia
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={handleCloseKonseptor}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-8 pb-4">
      {Array.from({ length: 1 }).map((_, i) => (
        <div key={i} className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-7 w-64" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="space-y-8">
            {/* ESELON 4 SECTION SKELETON */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-0 gap-0 shadow-sm overflow-hidden">
                    <div className="px-3 py-2 border-b border-border/50 bg-muted/30">
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="p-2.5 flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PELAKSANA SECTION SKELETON */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, k) => (
                  <div key={k} className="rounded-lg border bg-muted p-3 flex items-center gap-3 shadow-none">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
