"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { apiPath } from "@/lib/config/base-path";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { attachCSRFToken } from "@/lib/security/csrfManager";
import { format, parseISO, isValid } from "date-fns";

interface SatkerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kdsatker: string;
  namaSatker?: string;
  tahun: string;
  onSaved?: () => void;
}

interface SatkerDetailData {
  kddept: string;
  nmdept: string;
  kdsatker: string;
  nmsatker: string;
  kdkanwil: string;
  nmkanwil: string;
  kdkppn: string;
  nmkppn: string;
  nomor_pks: string | null;
  tanggal_pks: string | null;
  nomor_dispen: string | null;
  tanggal_dispen: string | null;
  jml_kartu_usul: string | number | null;
  tanggal_ctk_tagihan: string | null;
  tanggal_jth_tempo: string | null;
  bank_penerbit: string | null;
  nomor_surat_up: string | null;
  tanggal_surat_up: string | null;
  nilai_total_up: number | null;
  nilai_up_kkp: number | null;
}

export function SatkerDetailModal({
  open,
  onOpenChange,
  kdsatker,
  namaSatker,
  tahun,
  onSaved,
}: SatkerDetailModalProps) {
  const [data, setData] = useState<SatkerDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [nomorPks, setNomorPks] = useState("");
  const [tanggalPks, setTanggalPks] = useState<Date | undefined>(undefined);
  const [nomorDispen, setNomorDispen] = useState("");
  const [tanggalDispen, setTanggalDispen] = useState<Date | undefined>(undefined);
  const [jmlKartuUsul, setJmlKartuUsul] = useState("");
  const [tanggalCtkTagihan, setTanggalCtkTagihan] = useState("");
  const [tanggalJthTempo, setTanggalJthTempo] = useState("");

  const safeParseDate = (dateStr: string | null) => {
    if (!dateStr) return undefined;
    const date = parseISO(dateStr);
    return isValid(date) ? date : undefined;
  };

  useEffect(() => {
    if (!open || !kdsatker) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          apiPath(`/monev-kkp/satker-detail?kdsatker=${encodeURIComponent(kdsatker)}&tahun=${tahun}&_t=${Date.now()}`),
          { 
            credentials: "include",
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
              "Pragma": "no-cache",
            }
          }
        );
        if (response.ok) {
          const result = await response.json();
          const detail = result.data;
          console.log("[SatkerDetailModal] Received detail:", detail);
          
          setData(detail);
          setNomorPks(detail.nomor_pks || "");
          setTanggalPks(safeParseDate(detail.tanggal_pks));
          setNomorDispen(detail.nomor_dispen || "");
          setTanggalDispen(safeParseDate(detail.tanggal_dispen));
          
          // Handle jml_kartu_usul which might be string or number from backend
          setJmlKartuUsul(detail.jml_kartu_usul !== null && detail.jml_kartu_usul !== undefined ? String(detail.jml_kartu_usul) : "");
          
          setTanggalCtkTagihan(detail.tanggal_ctk_tagihan || "");
          setTanggalJthTempo(detail.tanggal_jth_tempo || "");
        } else {
          toast.error("Gagal mengambil data detail satker");
        }
      } catch (e) {
        console.error("Error fetching satker detail:", e);
        toast.error("Terjadi kesalahan saat mengambil data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [open, kdsatker, tahun]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Attach CSRF token
      await attachCSRFToken(headers);

      const payload = {
        tahun,
        kdsatker,
        nomor_pks: nomorPks || null,
        tanggal_pks: tanggalPks ? format(tanggalPks, "yyyy-MM-dd") : null,
        nomor_dispen: nomorDispen || null,
        tanggal_dispen: tanggalDispen ? format(tanggalDispen, "yyyy-MM-dd") : null,
        jml_kartu_usul: jmlKartuUsul !== "" ? jmlKartuUsul : null, // Sending as string since DB is varchar
        tanggal_ctk_tagihan: tanggalCtkTagihan !== "" ? tanggalCtkTagihan : null,
        tanggal_jth_tempo: tanggalJthTempo !== "" ? tanggalJthTempo : null,
      };

      console.log("[SatkerDetailModal] Saving payload:", payload);

      const response = await fetch(apiPath("/monev-kkp/satker-detail"), {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Data satker berhasil disimpan");
        if (onSaved) onSaved();
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Gagal menyimpan data");
      }
    } catch (e) {
      console.error("Error saving satker detail:", e);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  const formatRupiah = (value: number | null) =>
    value !== null ? Number(value).toLocaleString("id-ID", { maximumFractionDigits: 0 }) : "0";

  const calculatePercentage = (upKkp: number | null, totalUp: number | null) => {
    if (!upKkp || !totalUp || totalUp === 0) return "0";
    return ((upKkp / totalUp) * 100).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl sm:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Informasi Satker KKP</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-6 py-2">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg border">
              <div className="space-y-1">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs uppercase font-semibold">Kementerian/Lembaga</span>
                  <span className="font-medium">{data.kddept} – {data.nmdept}</span>
                </div>
                <div className="flex flex-col mt-2">
                  <span className="text-muted-foreground text-xs uppercase font-semibold">Satuan Kerja</span>
                  <span className="font-medium">{data.kdsatker} – {data.nmsatker}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs uppercase font-semibold">Kanwil</span>
                  <span className="font-medium">{data.nmkanwil}</span>
                </div>
                <div className="flex flex-col mt-2">
                  <span className="text-muted-foreground text-xs uppercase font-semibold">KPPN</span>
                  <span className="font-medium">{data.nmkppn}</span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomor_pks">Nomor PKS</Label>
                  <Input 
                    id="nomor_pks" 
                    value={nomorPks} 
                    onChange={(e) => setNomorPks(e.target.value)}
                    placeholder="Masukkan Nomor PKS"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal PKS</Label>
                  <DatePicker 
                    date={tanggalPks} 
                    onDateChange={setTanggalPks}
                    placeholder="Pilih Tanggal PKS"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_penerbit">Bank Penerbit KKP</Label>
                <Input id="bank_penerbit" value={data.bank_penerbit || "-"} disabled className="bg-muted" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomor_surat_up">Nomor Surat Penetapan UP</Label>
                  <Input id="nomor_surat_up" value={data.nomor_surat_up || "-"} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggal_surat_up">Tanggal Surat Penetapan UP</Label>
                  <Input id="tanggal_surat_up" value={data.tanggal_surat_up ? format(new Date(data.tanggal_surat_up), "PPP") : "-"} disabled className="bg-muted" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomor_dispen">Nomor Surat Dispensasi Proporsi UP (apabila ada)</Label>
                  <Input 
                    id="nomor_dispen" 
                    value={nomorDispen} 
                    onChange={(e) => setNomorDispen(e.target.value)}
                    placeholder="Masukkan Nomor Surat Dispensasi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Surat Dispensasi Proporsi UP (apabila ada)</Label>
                  <DatePicker 
                    date={tanggalDispen} 
                    onDateChange={setTanggalDispen}
                    placeholder="Pilih Tanggal Dispensasi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jml_kartu_usul">Jumlah Kartu Diusulkan</Label>
                  <Input 
                    id="jml_kartu_usul" 
                    type="number"
                    value={jmlKartuUsul} 
                    onChange={(e) => setJmlKartuUsul(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggal_ctk_tagihan">Tanggal Cetak Tagihan</Label>
                  <Input 
                    id="tanggal_ctk_tagihan"
                    type="text"
                    value={tanggalCtkTagihan} 
                    onChange={(e) => setTanggalCtkTagihan(e.target.value)}
                    placeholder="Contoh: Tanggal 15"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggal_jth_tempo">Tanggal Jatuh Tempo Pembayaran</Label>
                  <Input 
                    id="tanggal_jth_tempo"
                    type="text"
                    value={tanggalJthTempo} 
                    onChange={(e) => setTanggalJthTempo(e.target.value)}
                    placeholder="Contoh: Tanggal 20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-primary/5 p-4 rounded-lg border border-primary/10">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Total UP</Label>
                  <div className="font-mono font-semibold text-sm">Rp {formatRupiah(data.nilai_total_up)}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">UP KKP</Label>
                  <div className="font-mono font-semibold text-sm">Rp {formatRupiah(data.nilai_up_kkp)}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">% UP KKP</Label>
                  <div className="font-mono font-semibold text-sm text-primary">
                    {calculatePercentage(data.nilai_up_kkp, data.nilai_total_up)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            Data tidak tersedia.
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !data}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
