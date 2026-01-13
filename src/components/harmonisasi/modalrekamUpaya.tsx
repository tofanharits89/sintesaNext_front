import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { http } from "@/lib/api/httpClient";
// import Encrypt from "../../../auth/Random"; // Placeholder import
import GenerateCSV from "@/components/GenerateCSV";
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

  const [thang, setThang] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
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

  const thangOptions = Array.from({ length: 3 }, (_, i) => 2025 + i);
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
      setThang("");
      setSemester("");
      setUpaya("");
      setRekamanUpaya([]);
      setSql("");
    }
  }, [show, role, userKdkanwil]);

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
      // Replace with actual endpoint from env or config
      const endpoint =
        process.env.NEXT_PUBLIC_SIMPANUPAYAHARMONISASI ||
        "/simpan-upaya-harmonisasi";

      await http.patch(endpoint, payload);

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
      const endpoint =
        process.env.NEXT_PUBLIC_TAYANG_UPAYAHARMONISASI ||
        "/tayang-upaya-harmonisasi";
      // Construct URL carefully. Original used import.meta.env which might include query param prefix?
      // Assuming endpoint is just base URL
      const response = await http.get(
        `${endpoint}${encryptedQuery}&limit=${limit}&page=${page}&user=${username}`
      );

      setRekamanUpaya(response.data.result || []);
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        "Terjadi Permasalahan Koneksi atau Server Backend";
      toast.error(msg);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className="bi bi-chat-text-fill text-green-500"></i>
            Rekam Upaya Harmonisasi satker K/L dan Pemda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 shadow-sm border-0 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Tahun</label>
                <Select value={thang} onValueChange={setThang}>
                  <SelectTrigger>
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

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Semester
                </label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger>
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

              <div>
                <label className="text-sm font-medium mb-1 block">Kanwil</label>
                <Select
                  value={kanwil}
                  onValueChange={setKanwil}
                  disabled={role === "kanwil_djpb"}
                >
                  <SelectTrigger>
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
          </Card>

          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Rekam</TabsTrigger>
              <TabsTrigger value="rekaman">Hasil</TabsTrigger>
            </TabsList>

            <TabsContent value="form">
              <Card className="p-4 shadow-sm border-0 mt-2">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <Textarea
                      rows={10}
                      className="min-h-[200px]"
                      value={upaya}
                      onChange={(e) => setUpaya(e.target.value)}
                      placeholder="Tuliskan upaya harmonisasi yang sudah dilakukan..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        "Simpan"
                      )}
                    </Button>
                    <Button variant="secondary" onClick={onHide} type="button">
                      Tutup
                    </Button>
                  </div>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="rekaman">
              <Card className="p-4 shadow-sm border-0 mt-2">
                <div className="overflow-x-auto">
                  {loadingRekaman ? (
                    <div className="flex justify-center p-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <table className="w-full border-collapse border border-gray-200 text-sm">
                      <thead className="bg-gray-800 text-white text-center">
                        <tr>
                          <th className="p-2 border border-gray-600">No</th>
                          <th className="p-2 border border-gray-600">
                            Tahun/Semester
                          </th>
                          <th className="p-2 border border-gray-600">Kanwil</th>
                          <th className="p-2 border border-gray-600">Upaya</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rekamanUpaya.length > 0 ? (
                          rekamanUpaya.map((item, index) => (
                            <tr
                              key={item.id}
                              className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                            >
                              <td className="p-2 border border-gray-200 text-center">
                                {index + 1 + page * limit}
                              </td>
                              <td className="p-2 border border-gray-200 text-center">
                                {item.thang}/{item.semester}
                              </td>
                              <td className="p-2 border border-gray-200 text-center">
                                ({item.kdkanwil}) - {item.nmkanwil}
                              </td>
                              <td className="p-2 border border-gray-200 text-justify">
                                {item.upaya}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-4 text-center text-gray-500 border border-gray-200"
                            >
                              Belum ada data
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-gray-500 text-white hover:bg-gray-600 border-none"
                    onClick={() => {
                      setLoadingStatus(true);
                      setExport2(true);
                    }}
                    disabled={loadingStatus}
                  >
                    {loadingStatus && (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {!loadingStatus && (
                      <i className="bi bi-file-earmark-excel-fill"></i>
                    )}
                    {loadingStatus ? "Loading..." : "Download"}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {export2 && (
            <GenerateCSV
              query3={sql}
              status={handleStatus}
              namafile={`v3_CSV_UPAYA_HARMONISASI_${moment().format(
                "DDMMYY-HHmmss"
              )}`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
