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
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail } from "lucide-react";

interface DetailKeluarProps {
  showModal: boolean;
  handleCloseModal: () => void;
  selectedDetail: string | null;
  token: string;
  id: string;
  bgcolor: string;
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
  bgcolor,
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
      const response = await fetch(
        `https://service.kemenkeu.go.id/nadine-web/gateway/grid/konsepnaskah/DetailKonsepByNdId/${id}?tipedata=Konsep`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      setData(result.Data || null);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-600" />
            Detail Nota ID: {id}
          </DialogTitle>
        </DialogHeader>

        <div
          className="space-y-6 p-4 rounded-lg"
          style={{ background: bgcolor || "white" }}
        >
          {loading ? (
            <>
              {message && (
                <Alert className="bg-gray-50 border border-gray-300">
                  <AlertDescription className="text-gray-700">
                    {message}
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex justify-center items-center py-12">
                <div className="flex gap-2">
                  <Spinner />
                  <span className="text-gray-600">Loading...</span>
                </div>
              </div>
            </>
          ) : data ? (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <Table className="border">
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="border">Nomor ND</TableHead>
                      <TableHead className="border">Perihal</TableHead>
                      <TableHead className="border">Tgl ND</TableHead>
                      <TableHead className="border">Tgl Kirim</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="border">
                        {data?.DataNd?.NoNd || "Tidak tersedia"}
                      </TableCell>
                      <TableCell className="border">
                        {data?.DataNd?.Perihal || "Tidak tersedia"}
                      </TableCell>
                      <TableCell className="border">
                        {data?.DataNd?.TglNd
                          ? moment(data.DataNd.TglNd).format(
                              "DD-MM-YYYY HH:mm:ss"
                            )
                          : "Tidak tersedia"}
                      </TableCell>
                      <TableCell className="border">{getTglKirim()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="overflow-x-auto">
                <Table className="border">
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead colSpan={4} className="border text-center">
                        Detail Konsep
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="border">Jabatan</TableHead>
                      <TableHead className="border">Unit</TableHead>
                      <TableHead className="border">Tujuan</TableHead>
                      <TableHead className="border">Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.DataTeruskan && data.DataTeruskan.length > 0 ? (
                      data.DataTeruskan.map((item, idx) => {
                        if (item.UnitTo) {
                          return (
                            <TableRow key={idx}>
                              <TableCell className="border">
                                {item.UnitFrom?.NamaJabatan || "Tidak tersedia"}
                              </TableCell>
                              <TableCell className="border">
                                {item.UnitFrom?.NamaOrganisasi ||
                                  "Tidak tersedia"}
                              </TableCell>
                              <TableCell className="border">
                                {item.UnitTo?.NamaOrganisasi ||
                                  "Tidak tersedia"}
                              </TableCell>
                              <TableCell className="border">
                                {item.CreatedDate
                                  ? moment(item.CreatedDate).format(
                                      "DD-MM-YYYY HH:mm:ss"
                                    )
                                  : "Tidak tersedia"}
                              </TableCell>
                            </TableRow>
                          );
                        }
                        return null;
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="border text-center text-gray-500"
                        >
                          Tidak ada data teruskan
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700 font-semibold">
                Data nota detail Nadine gagal didapatkan...
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCloseModal}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
