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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, User } from "lucide-react";
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
      const response = await fetch(
        `https://service.kemenkeu.go.id/nadine-web/gateway/grid/konsepnaskah/DetailKonsepByNdId/${notaId}?tipedata=Konsep`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      setKonseptorData(
        result?.Data ? { Data: result.Data, Konseptor: result.Konseptor } : null
      );

      const uniqueMap = new Map<string, string>();
      result?.Data?.Riwayat?.forEach((item: any) => {
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
        <DialogContent showCloseButton={false} className="max-w-4xl max-h-[90vh] overflow-y-auto fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-7xl sm:max-w-7xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              Detail Nota ID : {id}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4 rounded-lg bg-background">
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
              <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : data && Array.isArray(data) && data.length > 0 ? (
              <div className="space-y-4">
                {data.map((dispo: Dispo, index: number) => (
                  <Card
                    key={index}
                    className="shadow-sm border-0 bg-white/80 backdrop-blur-sm"
                  >
                    <CardHeader className="bg-primary/10 py-3 px-4 rounded-t-lg">
                      <h5 className="font-semibold text-primary m-0 text-lg">
                        {dispo?.dispoEs4 &&
                        dispo.dispoEs4.length > 0 &&
                        dispo.dispoEs4[0]?.UnitPenerima
                          ? dispo.dispoEs4[0].UnitPenerima?.NamaEselon3
                          : "Data Eselon 3 Tidak Tersedia"}
                      </h5>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="bg-muted/50 p-2 rounded text-center mb-3 font-medium text-sm uppercase tracking-wide">
                        Eselon 4
                      </div>
                      <ul className="space-y-3 mb-6">
                        {dispo.dispoEs4.map((es4, es4Index) => (
                          <li
                            key={es4Index}
                            className="text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0"
                          >
                            <div className="grid grid-cols-[60px_1fr] gap-1">
                              <span className="font-semibold text-gray-900">
                                Unit:
                              </span>
                              <span className="text-gray-900">
                                {es4.UnitPenerima?.NamaOrganisasi || "-"}
                              </span>

                              <span className="font-semibold text-gray-900">
                                Nama:
                              </span>
                              <span className="text-gray-900">
                                {es4.UnitPenerima?.NamaPejabat || "-"}
                              </span>

                              <span className="font-semibold text-gray-900">
                                NIP:
                              </span>
                              <span className="text-gray-900">
                                {es4.UnitPenerima?.NipPejabat || "-"}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <div className="bg-muted/50 p-2 rounded text-center mb-3 font-medium text-sm uppercase tracking-wide">
                        Pelaksana
                      </div>
                      <ul className="space-y-3">
                        {dispo.dispoStaf.map((staf, stafIndex) => (
                          <li
                            key={stafIndex}
                            className="text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0"
                          >
                            <div className="grid grid-cols-[60px_1fr] gap-1">
                              <span className="font-semibold text-gray-900">
                                Nama:
                              </span>
                              <span className="text-gray-900">
                                {staf.UserPenerima?.Nama}
                              </span>

                              <span className="font-semibold text-gray-900">
                                NIP:
                              </span>
                              <span className="text-gray-900">
                                {staf.UserPenerima?.Nip18}
                              </span>

                              <span className="font-semibold text-gray-900">
                                Jabatan:
                              </span>
                              <span className="text-gray-900">
                                {staf.UserPenerima?.NamaJabatan}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-destructive font-bold py-10 bg-red-50/50 rounded-lg">
                Data nota detail Nadine gagal didapatkan...
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              onClick={handleShowKonseptor}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Lihat Konseptor
            </Button>
            <Button variant="outline" onClick={handleCloseModal}>
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
