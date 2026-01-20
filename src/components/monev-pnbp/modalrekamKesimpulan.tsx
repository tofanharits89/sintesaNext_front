"use client";

import React, { useState, useEffect } from "react";
import { MessageSquareText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import moment from "moment";

interface RekamKesimpulanProps {
  show: boolean;
  onHide: () => void;
}

export default function RekamKesimpulan({
  show,
  onHide,
}: RekamKesimpulanProps) {
  const [thang, setThang] = useState("");
  const [triwulan, setTriwulan] = useState("");
  const [kanwil, setKanwil] = useState("00");
  const [kesimpulan, setKesimpulan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [gambaran_umum, setGambaran_umum] = useState("");
  const [loading, setLoading] = useState(false);
  const [rekamanKesimpulan, setRekamanKesimpulan] = useState<any[]>([]);
  const [loadingRekaman, setLoadingRekaman] = useState(false);
  const [sql, setSql] = useState("");
  const [limit, setLimit] = useState(5);
  const [page, setPage] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [export2, setExport2] = useState(false);
  const [activeTab, setActiveTab] = useState("form-gambaran");

  const thangOptions = Array.from({ length: 3 }, (_, i) => 2025 + i);
  const triwulanOptions = [2, 4];

  useEffect(() => {
    if (show) {
      setThang("");
      setTriwulan("");
      setKanwil("00");
      setKesimpulan("");
      setRekamanKesimpulan([]);
      setRekomendasi("");
      setGambaran_umum("");
      setSql("");
    }
  }, [show]);

  useEffect(() => {
    if (show && thang && triwulan) {
      getDataKesimpulan();
    }
  }, [show, thang, triwulan, kanwil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thang || !triwulan || !kanwil || !kesimpulan) {
      toast.error("Semua field kesimpulan harus diisi!");
      return;
    }

    const payload = { thang, triwulan, kdkanwil: kanwil, kesimpulan };

    try {
      setLoading(true);
      const url =
        process.env.NEXT_PUBLIC_SIMPANKESIMPULAN_MONEVPNBP ||
        "/api/simpan-kesimpulan";
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      toast.success("Kesimpulan berhasil disimpan");
      setKesimpulan("");
      getDataKesimpulan();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan kesimpulan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRekom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thang || !triwulan || !kanwil || !rekomendasi) {
      toast.error("Semua field rekomendasi harus diisi!");
      return;
    }

    const payload2 = { thang, triwulan, kdkanwil: kanwil, rekomendasi };

    try {
      setLoading(true);
      const url =
        process.env.NEXT_PUBLIC_SIMPANREKOMENDASI_MONEVPNBP ||
        "/api/simpan-rekomendasi";
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload2),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      toast.success("Rekomendasi berhasil disimpan");
      setRekomendasi("");
      getDataKesimpulan();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan rekomendasi");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGambaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thang || !triwulan || !kanwil || !gambaran_umum) {
      toast.error("Semua field gambaran umum harus diisi!");
      return;
    }

    const payload3 = { thang, triwulan, kdkanwil: kanwil, gambaran_umum };

    try {
      setLoading(true);
      const url =
        process.env.NEXT_PUBLIC_SIMPANGAMBARAN_MONEVPNBP ||
        "/api/simpan-gambaran";
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload3),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      toast.success("Gambaran umum berhasil disimpan");
      setGambaran_umum("");
      getDataKesimpulan();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan gambaran umum");
    } finally {
      setLoading(false);
    }
  };

  const getDataKesimpulan = async () => {
    setLoadingRekaman(true);
    const whereClause = [
      thang ? `thang = '${thang}'` : "",
      triwulan ? `triwulan = '${triwulan}'` : "",
      kanwil !== "00" ? `kdkanwil = '${kanwil}'` : "",
    ]
      .filter(Boolean)
      .join(" AND ");

    const query = `SELECT id, thang, triwulan, kdkanwil, nmkanwil, gambaran_umum, kesimpulan, rekomendasi, tgl_rekam_gambaran, tgl_rekam_simpulan, tgl_rekam_rekom 
            FROM laporan_2023.kesimpulan_monev_pnbp
            ${whereClause ? `WHERE ${whereClause}` : ""}`;

    const cleanedQuery = query.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    setSql(cleanedQuery);

    try {
      const encryptedQuery = btoa(cleanedQuery);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      const apiUrl = `${baseUrl}/kesimpulan/${encryptedQuery}?limit=${limit}&page=${page}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setRekamanKesimpulan(result.result || result || []);
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengambil data kesimpulan");
    } finally {
      setLoadingRekaman(false);
    }
  };

  const handleStatus = (status: boolean, total: number) => {
    setLoadingStatus(status);
    setExport2(status);

    if (total === 0) {
      setLoadingStatus(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MessageSquareText className="text-green-600" />
            Rekam Gambaran Umum, Kesimpulan, dan Rekomendasi Pelaksanaan Monev
            PNBP
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="form-gambaran" className="h-full flex flex-col">
            <div className="px-6 border-b">
              <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                <TabsTrigger
                  value="form-gambaran"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-0 py-3"
                >
                  Gambaran Umum
                </TabsTrigger>
                <TabsTrigger
                  value="form-kesimpulan"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-0 py-3"
                >
                  Kesimpulan
                </TabsTrigger>
                <TabsTrigger
                  value="form-rekomendasi"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-0 py-3"
                >
                  Rekomendasi
                </TabsTrigger>
                <TabsTrigger
                  value="hasil"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-0 py-3"
                >
                  Hasil
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto bg-muted/10 p-6">
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Pilih Tahun</Label>
                    <Select
                      value={thang}
                      onValueChange={(val) => setThang(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 3 }, (_, i) => 2025 + i).map(
                          (year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pilih Triwulan</Label>
                    <Select
                      value={triwulan}
                      onValueChange={(val) => setTriwulan(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Triwulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 4].map((tw) => (
                          <SelectItem key={tw} value={tw.toString()}>
                            Triwulan {tw}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pilih Kanwil</Label>
                    <Select value={kanwil} onValueChange={setKanwil}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kanwil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00">Semua Kanwil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <TabsContent value="form-gambaran" className="mt-0 space-y-4">
                <div className="bg-background border rounded-lg p-4 space-y-4">
                  <Label>Gambaran Umum</Label>
                  <Textarea
                    rows={10}
                    value={gambaran_umum}
                    onChange={(e) => setGambaran_umum(e.target.value)}
                    placeholder="Tuliskan gambaran umum pelaksanaan penerimaan dan belanja PNBP..."
                    className="min-h-[200px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onHide}>
                      Tutup
                    </Button>
                    <Button
                      variant="default"
                      disabled={loading}
                      onClick={handleSubmitGambaran}
                    >
                      {loading ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Simpan...
                        </>
                      ) : (
                        "Simpan"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="form-kesimpulan" className="mt-0 space-y-4">
                <div className="bg-background border rounded-lg p-4 space-y-4">
                  <Label>Kesimpulan</Label>
                  <Textarea
                    rows={10}
                    value={kesimpulan}
                    onChange={(e) => setKesimpulan(e.target.value)}
                    placeholder="Tuliskan kesimpulan monev PNBP yang sudah dilakukan..."
                    className="min-h-[200px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onHide}>
                      Tutup
                    </Button>
                    <Button
                      variant="default"
                      disabled={loading}
                      onClick={handleSubmit}
                    >
                      {loading ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Simpan...
                        </>
                      ) : (
                        "Simpan"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="form-rekomendasi" className="mt-0 space-y-4">
                <div className="bg-background border rounded-lg p-4 space-y-4">
                  <Label>Rekomendasi</Label>
                  <Textarea
                    rows={10}
                    value={rekomendasi}
                    onChange={(e) => setRekomendasi(e.target.value)}
                    placeholder="Tuliskan rekomendasi bagi KPPN/Kanwil DJPb..."
                    className="min-h-[200px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onHide}>
                      Tutup
                    </Button>
                    <Button
                      variant="default"
                      disabled={loading}
                      onClick={handleSubmitRekom}
                    >
                      {loading ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Simpan...
                        </>
                      ) : (
                        "Simpan"
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hasil" className="mt-0 space-y-4">
                <div className="bg-background border rounded-lg p-4 space-y-4 max-h-full overflow-auto">
                  {loadingRekaman ? (
                    <div className="flex justify-center py-8">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted">
                          <TableRow>
                            <TableHead className="border border-input px-3 py-2 text-black font-bold">
                              No
                            </TableHead>
                            <TableHead className="border border-input px-3 py-2 text-black font-bold">
                              Tahun/Triwulan
                            </TableHead>
                            <TableHead className="border border-input px-3 py-2 text-black font-bold">
                              Kanwil
                            </TableHead>
                            <TableHead className="border border-input px-3 py-2 text-black font-bold">
                              Gambaran Umum
                            </TableHead>
                            <TableHead className="border border-input px-3 py-2 text-black font-bold">
                              Kesimpulan
                            </TableHead>
                            <TableHead className="border border-input px-3 py-2 text-black font-bold">
                              Rekomendasi
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rekamanKesimpulan.length > 0 ? (
                            rekamanKesimpulan.map(
                              (item: any, index: number) => (
                                <TableRow key={item.id}>
                                  <TableCell className="border border-input px-3 py-2 text-center">
                                    {index + 1 + page * limit}
                                  </TableCell>
                                  <TableCell className="border border-input px-3 py-2 text-center">
                                    {item.thang}/{item.triwulan}
                                  </TableCell>
                                  <TableCell className="border border-input px-3 py-2 text-center">
                                    ({item.kdkanwil}) - {item.nmkanwil}
                                  </TableCell>
                                  <TableCell className="border border-input px-3 py-2 text-justify text-xs">
                                    {item.gambaran_umum}
                                  </TableCell>
                                  <TableCell className="border border-input px-3 py-2 text-justify text-xs">
                                    {item.kesimpulan}
                                  </TableCell>
                                  <TableCell className="border border-input px-3 py-2 text-justify text-xs">
                                    {item.rekomendasi}
                                  </TableCell>
                                </TableRow>
                              ),
                            )
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="border border-input px-3 py-2 text-center"
                              >
                                Belum ada data
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
