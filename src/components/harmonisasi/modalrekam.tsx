"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
} from "@/components/animate-ui/components/animate/tabs";
import { http } from "@/lib/api/httpClient";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { apiPath } from "@/lib/config/base-path";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

interface ClusterItem {
  key: string;
  label: string;
  contoh: string;
}

const clusterMapping: Record<number, ClusterItem[]> = {
  1: [
    {
      key: "revisi_anggaran",
      label: "Revisi Anggaran",
      contoh:
        "Contoh: Sedang dilakukan proses pengajuan Revisi Anggaran pemindahan pagu",
    },
    {
      key: "blokir_anggaran",
      label: "Blokir Anggaran",
      contoh:
        "Contoh: Dokumen pendukung blokir non AA yang dikoordinir oleh UE1 belum menemukan kejelasan waktu",
    },
    {
      key: "automatic_adjustment",
      label: "Automatic Adjustment",
      contoh:
        "Contoh: Ketidakpastian waktu pembukaan blokir Automatic Adjusment",
    },
    {
      key: "halaman_3_dipa",
      label: "Halaman III DIPA",
      contoh:
        "Contoh: Deviasi terjadi karena perencanaan di awal triwulan tidak mengakomodir adanya tambahan kontrak di triwulan berjalan",
    },
    {
      key: "sdana_sbsn",
      label: "Sumber Dana SBSN",
      contoh:
        "Contoh: Banyak administrasi yang perlu diperhatikan dalam mengelola dana SBSN",
    },
    {
      key: "lainnya_anggaran",
      label: "Lainnya",
      contoh: "Contoh: Permasalahan anggaran lainnya di luar yang disebutkan",
    },
  ],
  2: [
    {
      key: "proses_lelang",
      label: "Proses Lelang",
      contoh:
        "Contoh: Proses lelang terhambat karena adanya permasalahan pembebasan lahan",
    },
    {
      key: "lelang_dini",
      label: "Lelang Dini",
      contoh:
        "Contoh: Pelaksanaan lelang dini berjalan lambat karena dokumen perencanaan kegiatan belum sepenuhnya siap, sehingga kontrak tidak dapat langsung diteken di awal tahun.",
    },
    {
      key: "gagal_lelang",
      label: "Kegagalan Lelang",
      contoh:
        "Contoh: Wanprestasi pemenang lelang hingga waktu yang telah ditentukan dikarenakan kehabisan bahan baku",
    },
    {
      key: "keterbatasan_penyedia",
      label: "Keterbatasan Penyedia",
      contoh:
        "Contoh: Beberapa item tidak tersedia di wilayah kerja sehingga perlu dipesan dari luar pulau",
    },
    {
      key: "tkdn",
      label: "TKDN",
      contoh:
        "Contoh: Ketersediaan barang yang perlu ijin dalam pemenuhan unsur TKDN",
    },
    {
      key: "ecatalog",
      label: "Ecatalog",
      contoh:
        "Contoh: Produk yang ditampilkan pasca adanya update aplikasi tidak dimutakhirkan oleh penyedia",
    },
    {
      key: "lainnya_pbj",
      label: "Lainnya",
      contoh:
        "Contoh: Kendala PBJ lainnya yang tidak masuk kategori sebelumnya",
    },
  ],
  3: [
    {
      key: "kekurangan_prasyarat",
      label: "Kekurangan Prasyarat",
      contoh:
        "Contoh: Izin lokasi dan izin lingkungan belum lengkap sehingga kegiatan konstruksi terhambat dan harus dihentikan sementara",
    },
    {
      key: "prasyarat_lahan",
      label: "Prasyarat Lahan",
      contoh:
        "Contoh: Tanah yang sebelumnya dijanjikan oleh pihak pengembang belum sepenuhnya diserahkan oleh pihak pemilik lahan dan masih dalam proses negosiasi",
    },
    {
      key: "faktor_cuaca",
      label: "Faktor Cuaca",
      contoh:
        "Contoh: Faktor cuaca yang tidak menentu di beberapa lokasi proyek pekerjaan",
    },
    {
      key: "kesiapan_pedum",
      label: "Kesiapan Pedum",
      contoh:
        "Contoh: Juknis kegiatan untuk beberapa kegiatan belum ada diawal tahun",
    },
    {
      key: "penerimaan_bantuan",
      label: "Penetapan Penerima Bantuan",
      contoh:
        "Contoh: Adanya pergantian kelompok penerima bantuan sehingga menyebabkan kegiatan mundur dan harus dilakukan verifikasi ulang",
    },
    {
      key: "pembagian_bantuan",
      label: "Pembagian Bantuan",
      contoh:
        "Contoh: Proses distribusi bantuan terkendala karena keterlambatan pengiriman logistik ke daerah terpencil, sehingga jadwal pembagian bantuan tidak sesuai rencana.",
    },
    {
      key: "kenaikan_harga",
      label: "Kenaikan Harga",
      contoh:
        "Contoh: Kenaikan harga material konstruksi akibat inflasi regional menyebabkan revisi Rencana Anggaran Biaya (RAB) dan memperlambat pelaksanaan pekerjaan",
    },
    {
      key: "lainnya_eksekusi",
      label: "Lainnya",
      contoh: "Contoh: Hambatan pelaksanaan kegiatan lainnya",
    },
  ],
  4: [
    {
      key: "regulasi_kemenkeu",
      label: "Regulasi Kemenkeu",
      contoh: "Contoh: Belum terbitnya regulasi dari Kementerian Keuangan",
    },
    {
      key: "regulasi_kl",
      label: "Regulasi K/L",
      contoh:
        "Contoh: Pelaksanaan kegiatan menunggu Peraturan K/L dan Juknis Eselon I",
    },
    {
      key: "regulasi_pemda",
      label: "Regulasi Pemda",
      contoh:
        "Contoh: Regulasi yang terlalu kompleks sehingga menghambat pelaksanaan program, terutama dalam hal perizinan dan kepatuhan terhadap standar teknis.",
    },
    {
      key: "lainnya_regulasi",
      label: "Lainnya",
      contoh: "Contoh: Hambatan regulasi lainnya",
    },
  ],
  5: [
    {
      key: "pergantian_pejabat",
      label: "Pergantian Pejabat",
      contoh:
        "Contoh: Kegiatan terkendala dikarenakan adanya penetapan Pejabat Perbendaharaan yang baru dan belum memahami juknis pelaksanaan kegiatan serta mekanisme dalam pencairan APBN",
    },
    {
      key: "kekurangan_sdm",
      label: "Kekurangan SDM",
      contoh:
        "Contoh: Mutasi staf keuangan dan tidak dilakukan pengisian kembali pada posisi tersebut",
    },
    {
      key: "pemahaman_aplikasi",
      label: "Pemahaman Aplikasi",
      contoh:
        "Contoh: Staf yang diproyeksi menjalankan aplikasi dipindahkan ke bagian lain diantikan dengan staf baru yang belum memahami aplikasi",
    },
    {
      key: "lainnya_sdm",
      label: "Lainnya",
      contoh: "Contoh: Kendala SDM lainnya di luar yang disebutkan",
    },
  ],
};

interface RekamProps {
  show: boolean;
  onHide: () => void;
  id: string | number | null;
  jenis: number | null;
  thang: string;
  semester: string;
  row?: any;
  tableName?: string;
  kdsatker?: string;
  kdprogram?: string;
  kdgiat?: string;
  kdoutput?: string;
  kdsoutput?: string;
  onSaveSuccess: (id: any, ...args: any[]) => void;
  // Dynamic props mapping
  [key: string]: any;
}

const clusterTitle: Record<number, string> = {
  1: "Penganggaran",
  2: "PBJ",
  3: "Eksekusi Kegiatan",
  4: "Regulasi",
  5: "SDM",
};

export default function Rekam({
  show,
  onHide,
  id,
  jenis,
  thang,
  semester,
  row,
  tableName,
  kdsatker,
  kdprogram,
  kdgiat,
  kdoutput,
  kdsoutput,
  onSaveSuccess,
  revisi_anggaran_isi,
  blokir_anggaran_isi,
  automatic_adjustment_isi,
  halaman_3_dipa_isi,
  sdana_sbsn_isi,
  lainnya_anggaran_isi,
  proses_lelang_isi,
  lelang_dini_isi,
  gagal_lelang_isi,
  keterbatasan_penyedia_isi,
  tkdn_isi,
  ecatalog_isi,
  lainnya_pbj_isi,
  kekurangan_prasyarat_isi,
  prasyarat_lahan_isi,
  faktor_cuaca_isi,
  kesiapan_pedum_isi,
  penerimaan_bantuan_isi,
  pembagian_bantuan_isi,
  kenaikan_harga_isi,
  lainnya_eksekusi_isi,
  regulasi_kemenkeu_isi,
  regulasi_kl_isi,
  regulasi_pemda_isi,
  lainnya_regulasi_isi,
  pergantian_pejabat_isi,
  kekurangan_sdm_isi,
  pemahaman_aplikasi_isi,
  lainnya_sdm_isi,
}: RekamProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth(); // Removed 'token' destructuring as it's not on UseAuthReturn

  // Create isiProps object from destructured props
  const isiProps: Record<string, string> = {
    revisi_anggaran: revisi_anggaran_isi || "",
    blokir_anggaran: blokir_anggaran_isi || "",
    automatic_adjustment: automatic_adjustment_isi || "",
    halaman_3_dipa: halaman_3_dipa_isi || "",
    sdana_sbsn: sdana_sbsn_isi || "",
    lainnya_anggaran: lainnya_anggaran_isi || "",
    proses_lelang: proses_lelang_isi || "",
    lelang_dini: lelang_dini_isi || "",
    gagal_lelang: gagal_lelang_isi || "",
    keterbatasan_penyedia: keterbatasan_penyedia_isi || "",
    tkdn: tkdn_isi || "",
    ecatalog: ecatalog_isi || "",
    lainnya_pbj: lainnya_pbj_isi || "",
    kekurangan_prasyarat: kekurangan_prasyarat_isi || "",
    prasyarat_lahan: prasyarat_lahan_isi || "",
    faktor_cuaca: faktor_cuaca_isi || "",
    kesiapan_pedum: kesiapan_pedum_isi || "",
    penerimaan_bantuan: penerimaan_bantuan_isi || "",
    pembagian_bantuan: pembagian_bantuan_isi || "",
    kenaikan_harga: kenaikan_harga_isi || "",
    lainnya_eksekusi: lainnya_eksekusi_isi || "",
    regulasi_kemenkeu: regulasi_kemenkeu_isi || "",
    regulasi_kl: regulasi_kl_isi || "",
    regulasi_pemda: regulasi_pemda_isi || "",
    lainnya_regulasi: lainnya_regulasi_isi || "",
    pergantian_pejabat: pergantian_pejabat_isi || "",
    kekurangan_sdm: kekurangan_sdm_isi || "",
    pemahaman_aplikasi: pemahaman_aplikasi_isi || "",
    lainnya_sdm: lainnya_sdm_isi || "",
  };

  const [formState, setFormState] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState<string>("");
  const [modalSemester, setModalSemester] = useState("1");

  useEffect(() => {
    if (show && jenis && clusterMapping[jenis]) {
      // Ensure mapping is valid and has at least one item
      const mapping = clusterMapping[jenis];
      const newState: Record<string, string> = {}; // Initialize newState

      if (mapping && mapping.length > 0) {
        mapping.forEach(({ key }) => {
          newState[key] = isiProps[key] || "";
        });
        setFormState(newState);
        setActiveKey(mapping[0]?.key || "");
      }
      setModalSemester("1"); // Reset to S1 each time modal opens
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, jenis]); // Dependency array simplified to match intent

  // Re-derive formState when user switches semester inside the modal (2026 only)
  useEffect(() => {
    if (!show || !jenis || !clusterMapping[jenis] || thang !== "2026" || !row)
      return;
    const mapping = clusterMapping[jenis];
    const suffix = `_s${modalSemester}`;
    const newState: Record<string, string> = {};
    mapping.forEach(({ key }) => {
      newState[key] = row[`${key}${suffix}`] || "";
    });
    setFormState(newState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalSemester]);

  const handleInputChange = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const isiSemuaDenganTidakAda = () => {
    if (!jenis || !clusterMapping[jenis]) return;

    const updated: Record<string, string> = {};
    const currentMapping = clusterMapping[jenis];

    if (currentMapping) {
      currentMapping.forEach(({ key }) => {
        if (!formState[key]) updated[key] = "Tidak ada";
      });
      setFormState((prev) => ({ ...prev, ...updated }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenis) return;

    try {
      // For 2026: cluster columns use _s1/_s2 suffix — apply to formState keys
      const suffix = thang === "2026" ? `_s${modalSemester}` : "";
      const suffixedFormState = suffix
        ? Object.fromEntries(
            Object.entries(formState).map(([k, v]) => [`${k}${suffix}`, v]),
          )
        : formState;
      const payload: Record<string, any> = {
        id,
        thang,
        semester,
        ...(tableName && { tableName }),
        ...(kdsatker && { kdsatker }),
        ...(kdprogram && { kdprogram }),
        ...(kdgiat && { kdgiat }),
        ...(kdoutput && { kdoutput }),
        ...(kdsoutput && { kdsoutput }),
        ...suffixedFormState,
      };
      const response: any = await http.post(
        apiPath("/harmonisasi/simpan"),
        payload,
      );

      if (response.data?.affectedRows === 0) {
        toast.info("Data tidak berubah atau ID tidak ditemukan");
      } else {
        toast.success("Data berhasil disimpan");
      }
      onSaveSuccess(id, ...Object.values(formState));
    } catch (error: any) {
      const backendError = error.response?.data?.error;
      const message =
        typeof backendError === "string"
          ? backendError
          : backendError?.message || error.message || "Gagal menyimpan data";
      toast.error(message);
    }
  };

  if (!jenis || !clusterMapping[jenis]) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl text-center">
            Clustering Tantangan {clusterTitle[jenis]}
          </DialogTitle>
          {thang === "2026" && (
            <div className="flex justify-center items-center gap-2 pt-1">
              <span className="text-sm text-muted-foreground">Semester:</span>
              <Select value={modalSemester} onValueChange={setModalSemester}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester I</SelectItem>
                  <SelectItem value="2">Semester II</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs
            value={activeKey}
            onValueChange={setActiveKey}
            className="w-full gap-0"
          >
            <div className="flex flex-col md:flex-row gap-4 min-h-0">
              {/* Sidebar (Navigation) */}
              <div className="md:w-1/4 border-b md:border-b-0 md:border-r border-border/50 pb-4 md:pb-0 md:pr-4">
                <TabsList className="relative w-full h-auto p-2 rounded-xl flex flex-row md:flex-col flex-wrap md:flex-nowrap items-stretch gap-2 bg-zinc-100/80 dark:bg-card/70">
                  {clusterMapping[jenis].map(({ key, label }) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="!flex-none h-auto py-2 px-3 whitespace-normal text-left justify-start data-[state=active]:bg-background/80 data-[state=active]:border data-[state=active]:border-border/70"
                    >
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="mt-2 md:mt-4 md:pt-4 md:border-t">
                  <Button
                    variant={
                      Object.values(formState).some((val) => val === "")
                        ? "default"
                        : "secondary"
                    }
                    onClick={isiSemuaDenganTidakAda}
                    className="w-full"
                  >
                    Tidak Ada
                  </Button>
                </div>
              </div>

              {/* Main Content Form */}
              <div className="md:w-3/4">
                <form
                  id="rekam-form"
                  onSubmit={handleSubmit}
                  className="h-full flex flex-col"
                >
                  <TabsContents className="mt-0 space-y-0">
                    {clusterMapping[jenis].map(({ key, label, contoh }) => (
                      <TabsContent key={key} value={key} className="mt-0">
                        <div className="flex flex-col h-full gap-4">
                          <div className="bg-primary text-primary-foreground p-3 rounded-md flex items-center justify-between shadow-sm">
                            <span className="font-semibold">{label}</span>
                            <TooltipProvider>
                              <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                  <Info className="w-5 h-5 cursor-help opacity-90 hover:opacity-100" />
                                </TooltipTrigger>
                                <TooltipContent
                                  side="left"
                                  className="max-w-xs italic"
                                >
                                  <p>{contoh}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>

                          <Textarea
                            className="flex-1 min-h-[300px] resize-none text-base p-4 leading-relaxed"
                            value={formState[key] || ""}
                            onChange={(e) =>
                              handleInputChange(key, e.target.value)
                            }
                            placeholder={`Uraian Tantangan ${label}...`}
                          />
                        </div>
                      </TabsContent>
                    ))}
                  </TabsContents>
                </form>
              </div>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onHide}>
            Tutup
          </Button>
          <Button
            type="submit"
            form="rekam-form"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
