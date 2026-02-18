import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "@/components/animate-ui/components/animate/tabs";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";
// import Encrypt from "../../../auth/Random"; // Placeholder import
import GenerateExcel from "@/components/GenerateExcel";
import moment from "moment";
import kdkanwilJson from "@/data/kdkanwil.json";

// Placeholder Encrypt function - replace with actual import if available
const Encrypt = (text: string) => {
  // If you have the actual Encrypt function, import it.
  // For now returning text or base64 as placeholder.
  if (typeof window !== "undefined") {
    return window.btoa(text);
  }
  return text;
};

interface RekamUpayaProps {
  show: boolean;
  onHide: () => void;
}

interface RekamanItem {
  id: string | number;
  thang: string;
  semester: string;
  kdkanwil: string;
  nmkanwil: string;
  upaya: string;
  tgl_rekam: string;
}

export default function RekamUpaya({ show, onHide }: RekamUpayaProps) {
  const { user } = useAuth();
  // user object from useAuth contains role, kdkanwil, username
  const role = user?.role || "";
  const userKdkanwil = user?.kdkanwil || "";
  const username = user?.username || "";

  const getCurrentPeriod = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentSemester = now.getMonth() + 1 <= 6 ? "1" : "2";
    return { currentYear: String(currentYear), currentSemester };
  };

  const { currentYear, currentSemester } = getCurrentPeriod();

  const [thang, setThang] = useState<string>(currentYear);
  const [semester, setSemester] = useState<string>(currentSemester);
  const [kanwil, setKanwil] = useState<string>("00");
  const [upaya, setUpaya] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [rekamanUpaya, setRekamanUpaya] = useState<RekamanItem[]>([]);
  const [loadingRekaman, setLoadingRekaman] = useState<boolean>(false);
  const [sql, setSql] = useState<string>("");
  const [limit, setLimit] = useState<number>(5);
  const [page, setPage] = useState<number>(0);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [export2, setExport2] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("form");

  const thangOptions = React.useMemo(() => {
    const years = new Set(Array.from({ length: 3 }, (_, i) => 2025 + i));
    years.add(Number(currentYear));
    return Array.from(years).sort((a, b) => a - b);
  }, [currentYear]);
  const semesterOptions = [1, 2];

  // Derive unique kanwil options from JSON
  const kanwilOptions = React.useMemo(() => {
    const uniqueKanwils = new Map();
    kdkanwilJson.forEach((item) => {
      if (!uniqueKanwils.has(item.kdkanwil)) {
        uniqueKanwils.set(item.kdkanwil, item.nmkanwil);
      }
    });
    return Array.from(uniqueKanwils.entries())
      .map(([kd, nm]) => ({
        kdkanwil: kd,
        nmkanwil: nm,
      }))
      .sort((a, b) => a.kdkanwil.localeCompare(b.kdkanwil));
  }, []);

  useEffect(() => {
    if (show) {
      setKanwil(role === "kanwil_djpb" ? userKdkanwil : "00");
      setThang(currentYear);
      setSemester(currentSemester);
      setUpaya("");
      setRekamanUpaya([]);
      setSql("");
      setActiveTab("form");
    }
  }, [show, role, userKdkanwil, currentYear, currentSemester]);

  useEffect(() => {
    if (show && thang && semester) {
      getDataUpaya();
    }
  }, [show, thang, semester, kanwil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thang || !semester || !kanwil || !upaya) {
      toast.error("Semua field harus diisi!");
      return;
    }

    const payload = { thang, semester, kdkanwil: kanwil, upaya };

    try {
      setLoading(true);
      await http.patch("/api/v1/harmonisasi/upaya", payload);

      toast.success("Data berhasil disimpan");
      setUpaya("");
      getDataUpaya();
    } catch (error: any) {
      const msg =
        error.response?.data?.error || "Gagal menyimpan Upaya Harmonisasi";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getDataUpaya = async () => {
    setLoadingRekaman(true);
    const whereClause = [
      thang ? `thang = '${thang}'` : "",
      semester ? `semester = '${semester}'` : "",
      kanwil !== "00" ? `kdkanwil = '${kanwil}'` : "",
    ]
      .filter(Boolean)
      .join(" AND ");

    const query = `SELECT id, thang, semester, kdkanwil, nmkanwil, upaya, tgl_rekam 
            FROM laporan_2023.upaya_harmonisasi 
            ${whereClause ? `WHERE ${whereClause}` : ""}`;

    const encodedQuery = encodeURIComponent(query);
    const cleanedQuery = decodeURIComponent(encodedQuery)
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    setSql(cleanedQuery);

    const encryptedQuery = Encrypt(cleanedQuery);

    try {
      const url = `/api/v1/harmonisasi/upaya/view?queryParams=${encryptedQuery}&limit=${limit}&page=${page}&user=${username}`;

      const response = await http.get(url, {
        headers: { "x-bypass-cache": "true" },
      });

      setRekamanUpaya(response.data.result || []);
    } catch (error: any) {
      let msg =
        error.response?.data?.error ||
        "Terjadi Permasalahan Koneksi atau Server Backend";

      if (typeof msg === 'object') {
        msg = msg.message || JSON.stringify(msg);
      }
      toast.error(String(msg));
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
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Rekam Upaya Harmonisasi</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 px-1">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full gap-3"
          >
            <div className="border-b border-border/50 pb-3 mb-0">
              <TabsList className="w-full h-auto md:h-14 p-2 rounded-xl grid grid-cols-2 gap-2 md:gap-0">
                <TabsTrigger value="form" className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center gap-2">
                  Rekam
                </TabsTrigger>
                <TabsTrigger value="rekaman" className="h-12 md:h-full px-4 md:px-5 py-0 text-sm md:text-base flex items-center justify-center gap-2">
                  Riwayat
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContents>
              <TabsContent value="form" className="space-y-4">
                <form id="upaya-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tahun</label>
                      <Select value={thang} onValueChange={setThang}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          {thangOptions.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Semester</label>
                      <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {semesterOptions.map((smt) => (
                            <SelectItem key={smt} value={String(smt)}>
                              Semester {smt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kanwil</label>
                      <Select
                        value={kanwil}
                        onValueChange={setKanwil}
                        disabled={role === "kanwil_djpb"}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Kanwil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="00">Semua Kanwil</SelectItem>
                          {kanwilOptions.map((opt) => (
                            <SelectItem key={opt.kdkanwil} value={opt.kdkanwil}>
                              {opt.kdkanwil} - {opt.nmkanwil}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upaya</label>
                    <Textarea
                      rows={10}
                      className="min-h-[200px] w-full"
                      value={upaya}
                      onChange={(e) => setUpaya(e.target.value)}
                      placeholder="Tuliskan upaya harmonisasi yang sudah dilakukan..."
                    />
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="rekaman" className="mt-0">
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    {loadingRekaman ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground w-12">No</th>
                            <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground w-32">
                              Periode
                            </th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-48">Kanwil</th>
                            <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Upaya</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rekamanUpaya.length > 0 ? (
                            rekamanUpaya.map((item, index) => (
                              <tr
                                key={item.id}
                                className="border-b transition-colors hover:bg-muted/50 last:border-0"
                              >
                                <td className="p-4 text-center align-top">
                                  {index + 1 + page * limit}
                                </td>
                                <td className="p-4 text-center align-top whitespace-nowrap">
                                  {item.thang} / Sem {item.semester}
                                </td>
                                <td className="p-4 align-top">
                                  {item.kdkanwil} - {item.nmkanwil}
                                </td>
                                <td className="p-4 align-top whitespace-pre-wrap text-justify">
                                  {item.upaya}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={4}
                                className="p-8 text-center text-muted-foreground"
                              >
                                Belum ada data riwayat upaya
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </TabsContent>
            </TabsContents>
          </Tabs>

          {export2 && (
            <GenerateExcel
              query3={sql}
              status={handleStatus}
              namafile={`v3_XLSX_UPAYA_HARMONISASI_${moment().format(
                "DDMMYY-HHmmss"
              )}`}
            />
          )}
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={onHide} type="button">
            Tutup
          </Button>
          {activeTab === "form" ? (
            <Button
              type="submit"
              form="upaya-form"
              className="bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={() => {
                setLoadingStatus(true);
                setExport2(true);
              }}
              disabled={loadingStatus}
            >
              {loadingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              {loadingStatus ? "Mengunduh..." : "Unduh Excel"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
