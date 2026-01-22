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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils/utils";
// import "./modalTantangan.css";

interface ClusterItem {
  key: string;
  singkat: string;
  label: string;
  contoh: string;
}

interface ClusterMapping {
  [key: number]: ClusterItem[];
}

export default function RekamanTantangan({
  show,
  onHide,
  id,
  jenis,
  kesesuaian_pnbp_isi,
  ketepatan_waktu_isi,
  surat_dispensasi_isi,
  kesesuaian_tarif_isi,
  tambahan_kepatuhan_isi,
  kesesuaian_kas_isi,
  kesesuaian_nomor_isi,
  ketepatan_lpj_isi,
  kepatuhan_saldo_isi,
  kesesuaian_transaksi_isi,
  tambahan_pelaporan_isi,
  tren_belanja_isi,
  masalah_penganggaran_isi,
  masalah_kegiatan_isi,
  masalah_regulasi_isi,
  masalah_mp_isi,
  kesesuaian_real_rpd_isi,
  kendala_belanja_lainnya_isi,
  kendala_internal_isi,
  kendala_eksternal_isi,
  kendala_jaringan_app_isi,
  kendala_lokasi_isi,
  kesesuaian_pnbp_target_isi,
  kendala_penerimaan_lainnya_isi,
  rekomendasi_isi,
  onSaveSuccess,
}: any) {
  const isiProps = {
    kesesuaian_pnbp: kesesuaian_pnbp_isi,
    ketepatan_waktu: ketepatan_waktu_isi,
    surat_dispensasi: surat_dispensasi_isi,
    kesesuaian_tarif: kesesuaian_tarif_isi,
    tambahan_kepatuhan: tambahan_kepatuhan_isi,
    kesesuaian_kas: kesesuaian_kas_isi,
    kesesuaian_nomor: kesesuaian_nomor_isi,
    ketepatan_lpj: ketepatan_lpj_isi,
    kepatuhan_saldo: kepatuhan_saldo_isi,
    kesesuaian_transaksi: kesesuaian_transaksi_isi,
    tambahan_pelaporan: tambahan_pelaporan_isi,
    tren_belanja: tren_belanja_isi,
    masalah_penganggaran: masalah_penganggaran_isi,
    masalah_kegiatan: masalah_kegiatan_isi,
    masalah_regulasi: masalah_regulasi_isi,
    masalah_mp: masalah_mp_isi,
    kesesuaian_real_rpd: kesesuaian_real_rpd_isi,
    kendala_belanja_lainnya: kendala_belanja_lainnya_isi,
    kendala_internal: kendala_internal_isi,
    kendala_eksternal: kendala_eksternal_isi,
    kendala_jaringan_app: kendala_jaringan_app_isi,
    kendala_lokasi: kendala_lokasi_isi,
    kesesuaian_pnbp_target: kesesuaian_pnbp_target_isi,
    kendala_penerimaan_lainnya: kendala_penerimaan_lainnya_isi,
    rekomendasi: rekomendasi_isi,
  };

  const clusterMapping: ClusterMapping = {
    1: [
      {
        key: "kesesuaian_pnbp",
        singkat: "Kesesuaian nilai PNBP yang dipungut/diterima",
        label:
          "Kesesuaian nilai PNBP yang dipungut/diterima dengan nilai PNBP yang disetor pada periode bersangkutan",
        contoh:
          "Kesesuaian nilai PNBP yang dipungut/diterima dengan nilai PNBP yang disetor pada periode bersangkutan",
      },
      {
        key: "ketepatan_waktu",
        singkat: "Ketepatan waktu antara pemungutan dan penyetoran PNBP",
        label:
          "Ketepatan waktu antara periode pemungutan dengan penyetoran PNBP",
        contoh:
          "Ketepatan waktu antara periode pemungutan dengan penyetoran PNBP",
      },
      {
        key: "surat_dispensasi",
        singkat: "Surat dispensasi penyetoran oleh Kanwil DJPb",
        label:
          "Surat izin dispensasi waktu penyetoran yang diterbitkan oleh Kanwil DJPb (jika memerlukan dispensasi)",
        contoh:
          "Surat izin dispensasi waktu penyetoran yang diterbitkan oleh Kanwil DJPb (jika memerlukan dispensasi)",
      },
      {
        key: "kesesuaian_tarif",
        singkat: "Kesesuaian tarif PNBP sesuai peraturan",
        label:
          "Kesesuaian tarif PNBP sebagaimana ditetapkan dengan peraturan yang mengatur mengenai PNBP tersebut",
        contoh:
          "Kesesuaian tarif PNBP sebagaimana ditetapkan dengan peraturan yang mengatur mengenai PNBP tersebut",
      },
      {
        key: "tambahan_kepatuhan",
        singkat: "Keterangan tambahan kepatuhan",
        label:
          "Keterangan Tambahan terkait Aspek Kepatuhan Pemungutan dan Penyetoran",
        contoh:
          "Keterangan Tambahan terkait Aspek Kepatuhan Pemungutan dan Penyetoran",
      },
    ],
    2: [
      {
        key: "kesesuaian_kas",
        singkat: "Kesesuaian kas Bendahara Penerimaan dengan LPJ Bendahara",
        label:
          "Kesesuaian kas di Bandahara Penerimaan dengan saldo akhir di LPJ Bendahara",
        contoh:
          "Kesesuaian kas di Bandahara Penerimaan dengan saldo akhir di LPJ Bendahara",
      },
      {
        key: "kesesuaian_nomor",
        singkat:
          "Kesesuaian nomor rekening Bendahara Penerimaan dengan yang tercatat di KPPN",
        label:
          "Kesesuaian nomor rekening Bendahara Penerimaan dengan nomor rekening yang terdaftar di KPPN dan tercatat pada Aplikasi SPRINT",
        contoh:
          "Kesesuaian nomor rekening Bendahara Penerimaan dengan nomor rekening yang terdaftar di KPPN dan tercatat pada Aplikasi SPRINT",
      },
      {
        key: "ketepatan_lpj",
        singkat:
          "Ketepatan waktu penyampaian LPJ Bendahara Penerimaan melalui Aplikasi SPRINT",
        label:
          "Ketepatan waktu penyampaian LPJ Bendahara Penerimaan melalui Aplikasi SPRINT",
        contoh:
          "Ketepatan waktu penyampaian LPJ Bendahara Penerimaan melalui Aplikasi SPRINT",
      },
      {
        key: "kepatuhan_saldo",
        singkat:
          "Kepatuhan atas saldo kas tunai di brankas Bendahara Penerimaan",
        label: "Kepatuhan atas saldo kas tunai di brankas Bendahara Penerimaan",
        contoh:
          "Kepatuhan atas saldo kas tunai di brankas Bendahara Penerimaan",
      },
      {
        key: "kesesuaian_transaksi",
        singkat:
          "Kesesuaian transaksi penerimaan PNBP di Bendahara Penerimaan dengan KPPN",
        label:
          "Kesesuaian antara transaksi penerimaan PNBP di Bendahara Penerimaan dengan data penerimaan di Seksi Bank KPPN",
        contoh:
          "Kesesuaian antara transaksi penerimaan PNBP di Bendahara Penerimaan dengan data penerimaan di Seksi Bank KPPN",
      },
      {
        key: "tambahan_pelaporan",
        singkat: "Keterangan tambahan aspek pelaporan",
        label: "Keterangan Tambahan terkait Aspek Pelaporan dan Penatausahaan",
        contoh: "Keterangan Tambahan terkait Aspek Pelaporan dan Penatausahaan",
      },
    ],
    3: [
      {
        key: "tren_belanja",
        singkat: "Tren Pelaksanaan Belanja PNBP pada Satker",
        label: "Tren Pelaksanaan Belanja PNBP pada Satker",
        contoh: "Tren Pelaksanaan Belanja PNBP pada Satker",
      },
      {
        key: "masalah_penganggaran",
        singkat: "Permasalahan terkait Penganggaran",
        label: "Permasalahan terkait Penganggaran",
        contoh: "Permasalahan terkait Penganggaran",
      },
      {
        key: "masalah_kegiatan",
        singkat: "Permasalahan terkait Eksekusi/Pelaksanaan Kegiatan PNBP",
        label: "Permasalahan terkait Eksekusi/Pelaksanaan Kegiatan PNBP",
        contoh: "Permasalahan terkait Eksekusi/Pelaksanaan Kegiatan PNBP",
      },
      {
        key: "masalah_regulasi",
        singkat: "Permasalahan terkait Regulasi/Juknis Kegiatan",
        label: "Permasalahan terkait Regulasi/Juknis Kegiatan",
        contoh: "Permasalahan terkait Regulasi/Juknis Kegiatan",
      },
      {
        key: "masalah_mp",
        singkat: "Permasalahan terkait MP PNBP",
        label: "Permasalahan terkait MP PNBP",
        contoh: "Permasalahan terkait MP PNBP",
      },
      {
        key: "kesesuaian_real_rpd",
        singkat: "Kesesuaian Realisasi Belanja PNBP dengan RPD",
        label:
          "Kesesuaian Realisasi Belanja PNBP dengan Rencana Penarikan Dana",
        contoh:
          "Kesesuaian Realisasi Belanja PNBP dengan Rencana Penarikan Dana",
      },
      {
        key: "kendala_belanja_lainnya",
        singkat: "Kendala Lainnya terkait Belanja PNBP",
        label: "Kendala Lainnya terkait Belanja PNBP",
        contoh: "Kendala Lainnya terkait Belanja PNBP",
      },
    ],
    4: [
      {
        key: "kendala_internal",
        singkat: "Kendala Internal Satker/K/L",
        label: "Kendala Internal Satker/K/L",
        contoh: "Kendala Internal Satker/K/L",
      },
      {
        key: "kendala_eksternal",
        singkat: "Kendala Eksternal Satker/K/L",
        label: "Kendala Eksternal Satker/K/L",
        contoh: "Kendala Eksternal Satker/K/L",
      },
      {
        key: "kendala_jaringan_app",
        singkat: "Kendala Jaringan/Aplikasi",
        label: "Kendala Jaringan/Aplikasi",
        contoh: "Kendala Jaringan/Aplikasi",
      },
      {
        key: "kendala_lokasi",
        singkat: "Kendala Lokasi/Geografis",
        label: "Kendala Lokasi/Geografis",
        contoh: "Kendala Lokasi/Geografis",
      },
      {
        key: "kesesuaian_pnbp_target",
        singkat: "Kesesuaian Penerimaan PNBP dengan Rencana/Target Penerimaan",
        label: "Kesesuaian Penerimaan PNBP dengan Rencana/Target Penerimaan",
        contoh: "Kesesuaian Penerimaan PNBP dengan Rencana/Target Penerimaan",
      },
      {
        key: "kendala_penerimaan_lainnya",
        singkat: "Kendala Lainnya terkait Permasalahan Penerimaan PNBP",
        label: "Kendala Lainnya terkait Permasalahan Penerimaan PNBP",
        contoh: "Kendala Lainnya terkait Permasalahan Penerimaan PNBP",
      },
    ],
    5: [
      {
        key: "rekomendasi",
        singkat:
          "Rekomendasi bagi Satker/K/L atas pelaksanaan Monev PNBP yang telah dilakukan",
        label:
          " Rekomendasi bagi Satker/K/L atas pelaksanaan Monev PNBP yang telah dilakukan",
        contoh:
          "Rekomendasi bagi Satker/K/L atas pelaksanaan Monev PNBP yang telah dilakukan",
      },
    ],
  };

  const [formState, setFormState] = useState<Record<string, string>>({});
  const [activeKey, setActiveKey] = useState("");

  useEffect(() => {
    if (show && jenis) {
      const mapping = clusterMapping[jenis as number];
      if (mapping) {
        const newState: Record<string, string> = {};
        mapping.forEach(({ key }) => {
          newState[key] =
            (isiProps[key as keyof typeof isiProps] as string) || "";
        });
        setFormState(newState);
        setActiveKey(mapping[0]?.key || "");
      }
    }
  }, [show, jenis, isiProps]);

  const handleInputChange = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const isiSemuaDenganTidakAda = () => {
    const updated: Record<string, string> = {};
    (clusterMapping[jenis as number] || []).forEach(({ key }) => {
      if (!formState[key]) updated[key] = "Tidak ada";
    });
    setFormState((prev) => ({ ...prev, ...updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url =
        process.env.NEXT_PUBLIC_SIMPANMONEVTANTANGAN || "/api/simpan-tachter";
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...formState }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      toast.success("Data berhasil disimpan");
      onSaveSuccess(id, ...Object.values(formState));
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan data");
    }
  };

  const clusterTitle: Record<number, string> = {
    1: "Kepatuhan Pemungutan dan Penyetoran",
    2: "Pelaporan dan Penatausahaan",
    3: "Kendala Pelaksanaan Belanja PNBP",
    4: "Permasalahan Penerimaan PNBP",
    5: "Rekomendasi",
  };

  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareText className="text-green-600" />
            Aspek {clusterTitle[jenis as number]}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-0">
          {/* Left Navigation */}
          <div className="w-1/3 border-r pr-4 flex flex-col">
            <Tabs
              value={activeKey}
              onValueChange={setActiveKey}
              className="w-full"
            >
              <TabsList className="flex flex-col gap-2 h-auto bg-transparent w-full">
                {clusterMapping[jenis as number]?.map(({ key, singkat }) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="w-full justify-start rounded-full"
                  >
                    {singkat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Button
              variant={
                Object.values(formState).some((val) => val === "")
                  ? "default"
                  : "secondary"
              }
              onClick={isiSemuaDenganTidakAda}
              className="w-full rounded-full mt-4"
            >
              Tidak Ada
            </Button>
          </div>

          {/* Right Content */}
          <div className="w-2/3 pl-4 overflow-y-auto flex flex-col">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <Tabs
                value={activeKey}
                onValueChange={setActiveKey}
                className="w-full flex-1"
              >
                <TabsContent value={activeKey} className="flex-1">
                  {clusterMapping[jenis as number]?.find(
                    (item) => item.key === activeKey,
                  ) && (
                      <div className="space-y-3">
                        {clusterMapping[jenis as number]
                          ?.filter((item) => item.key === activeKey)
                          .map(({ key, label, contoh }) => (
                            <div
                              key={key}
                              className="p-3 border rounded bg-slate-50 shadow-sm"
                            >
                              <h5 className="bg-green-600 text-white p-2 rounded mb-3">
                                {label}
                              </h5>
                              <Textarea
                                className="w-full min-h-[350px]"
                                value={formState[key] || ""}
                                onChange={(e) =>
                                  handleInputChange(key, e.target.value)
                                }
                                placeholder={`Uraian ${contoh}`}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="default" type="submit">
                  Simpan
                </Button>
                <Button variant="outline" onClick={onHide}>
                  Tutup
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
