import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { http } from "@/lib/api/httpClient";

interface ModalTpidProps {
  show: boolean;
  onHide: () => void;
  id: string | number | null;
  jenis: string | null;
  pilihan?: any;
  keteranganpilih?: string;
  rekomendasipilih?: string;
  onSaveSuccess: (keterangan: string, rekomendasi: string) => void;
}

interface ClusterOption {
  id: number;
  label: string;
}

export default function ModalTpid({
  show,
  onHide,
  id,
  jenis,
  pilihan,
  keteranganpilih,
  rekomendasipilih,
  onSaveSuccess,
}: ModalTpidProps) {
  const [selectedClusters, setSelectedClusters] = useState<number[]>([]);
  // Placeholder for cluster options if needed in future, currently unused/empty in original
  const [clusterOptions, setClusterOptions] = useState<ClusterOption[]>([]);
  const [keterangan, setKeterangan] = useState<string>(keteranganpilih || "");
  const [rekomendasi, setRekomendasi] = useState<string>(
    rekomendasipilih || ""
  );
  const [tema, setTema] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Effect to clean up or set initial state based on props
  useEffect(() => {
    // Original logic: const clusters = [pilihan].filter(Boolean);
    // Not doing much with clusters variable in original code
  }, [id, jenis, pilihan]);

  useEffect(() => {
    setKeterangan(keteranganpilih || "");
    let newTema = "";

    switch (jenis) {
      case "1":
        newTema = "Tantangan Penganggaran K/L";
        break;
      case "2":
        newTema = "Tantangan Pengadaan Barang Dan Jasa K/L";
        break;
      case "3":
        newTema = "Tantangan Eksekusi Kegiatan K/L";
        break;
      case "4":
        newTema = "Tantangan Regulasi Dalam Pelaksanaan Anggaran K/L";
        break;
      case "5":
        newTema = "Tantangan SDM K/L";
        break;
      case "6":
        newTema = "Tantangan Lainnya K/L";
        break;
      case "7":
        newTema = "Tantangan Penganggaran TKD";
        break;
      case "8":
        newTema = "Tantangan Pengadaan Barang Dan Jasa TKD";
        break;
      case "9":
        newTema = "Tantangan Eksekusi Kegiatan TKD";
        break;
      case "10":
        newTema = "Tantangan Regulasi Dalam Pelaksanaan Anggaran TKD";
        break;
      case "11":
        newTema = "Tantangan SDM TKD";
        break;
      case "12":
        newTema = "Tantangan Lainnya TKD";
        break;
      default:
        newTema = "";
    }
    setTema(newTema);
  }, [id, jenis, keteranganpilih]);

  useEffect(() => {
    setRekomendasi(rekomendasipilih || "");
    // Logic for TKD tema setting is redundant if handled in single switch above or merged
    // Original kept them separate but they map 1-12.
    // Merged above for clarity.
  }, [id, jenis, rekomendasipilih]);

  const handleClusterChange = (checked: boolean, value: number) => {
    if (checked) {
      setSelectedClusters([...selectedClusters, value]);
    } else {
      setSelectedClusters(selectedClusters.filter((id) => id !== value));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Using http client which handles Auth header automatically
      // Assuming endpoint - adjust if necessary
      const endpoint = "/api/v1/tpid/permasalahan";

      await http.patch(endpoint, {
        id,
        jenis,
        keterangan,
        rekomendasi,
      });

      toast.success("Data Berhasil Disimpan");
      onSaveSuccess(keterangan, rekomendasi);
      onHide();
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        "Terjadi Permasalahan Koneksi atau Server Backend";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquareText className="w-5 h-5 text-success" />{" "}
            {/* text-success from global or tailwind */}
            Clustering {tema}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {clusterOptions && clusterOptions.length > 0 && (
            <div className="space-y-2">
              {clusterOptions.map((option, index) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cluster-${option.id}`}
                    checked={selectedClusters.includes(option.id)}
                    onCheckedChange={(checked) =>
                      handleClusterChange(checked as boolean, option.id)
                    }
                  />
                  <Label htmlFor={`cluster-${option.id}`}>{option.label}</Label>
                  {index < clusterOptions.length - 1 && (
                    <hr className="my-1 border-gray-200" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-lg font-semibold">Keterangan:</Label>
            <Textarea
              placeholder="Isikan keterangan tantangan/kendala tpid"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-semibold">Rekomendasi:</Label>
            <Textarea
              placeholder="Isikan rekomendasi tantangan/kendala tpid"
              value={rekomendasi}
              onChange={(e) => setRekomendasi(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="submit"
              variant="destructive"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
            <Button variant="secondary" onClick={onHide} type="button">
              Tutup
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
