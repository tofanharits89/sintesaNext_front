"use client";

import { useState, useEffect } from "react";
import { directBackendClient } from "@/lib/api/httpClient";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";

export interface TrenRow {
  isu: string;
  username: string;
  createdAt: string;
  tabel: string;
}

interface FilterData {
  thang: string;
  periode: string;
  dept: string;
}

interface TrenProps {
  show: boolean;
  handleClose: () => void;
  data: FilterData;
  isi: TrenRow[];
}

interface TrenForm {
  tabel1: string; // Tren Dukman / Teknis
  tabel2: string; // Tren Jenis Belanja
  tabel3: string; // Tren Belanja Bulanan
  tabel4: string; // Tren Sumber Dana
  tabel5: string; // Tren UP/TUP
}

function byTabel(isi: TrenRow[], tabel: string) {
  return isi.find((r) => r.tabel === tabel)?.isu ?? "";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Tren({ show, handleClose, data, isi }: TrenProps) {
  const [loading, setLoading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState("");
  const [formData, setFormData] = useState<TrenForm>({
    tabel1: "",
    tabel2: "",
    tabel3: "",
    tabel4: "",
    tabel5: "",
  });

  useEffect(() => {
    if (show) {
      setFormData({
        tabel1: byTabel(isi, "tren_dukman"),
        tabel2: byTabel(isi, "tren_jenbel"),
        tabel3: byTabel(isi, "tren_bulanan"),
        tabel4: byTabel(isi, "tren_sdana"),
        tabel5: byTabel(isi, "tren_uptup"),
      });
      const first = isi[0];
      if (first) {
        setUpdateInfo(
          `Diupdate terakhir oleh ${first.username} tanggal ${formatDate(first.createdAt)}`,
        );
      } else {
        setUpdateInfo("");
      }
    }
  }, [isi, show]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await directBackendClient.post("/kinerja/tren", { ...formData, data });
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fields: { name: keyof TrenForm; label: string }[] = [
    { name: "tabel1", label: "Tren Dukman / Teknis" },
    { name: "tabel2", label: "Tren Jenis Belanja" },
    { name: "tabel3", label: "Tren Belanja Bulanan" },
    { name: "tabel4", label: "Tren Sumber Dana" },
    { name: "tabel5", label: "Tren UP / TUP" },
  ];

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Rekam Data Tren</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form 
            id="tren-form"
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {fields.map(({ name, label }) => (
                <div key={name} className="space-y-2">
                  <Label className="text-sm font-semibold">
                    {label}
                  </Label>
                  <Textarea
                    name={name}
                    rows={4}
                    placeholder={`Masukkan analisa ${label.toLowerCase()}...`}
                    value={formData[name]}
                    onChange={handleChange}
                    className="resize-none"
                  />
                </div>
              ))}
            </div>

            {updateInfo && (
              <p className="text-xs italic text-muted-foreground border-t pt-4 mt-8">
                {updateInfo}
              </p>
            )}
          </form>
        </div>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="px-6"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="tren-form"
            disabled={loading}
            className="px-8"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Simpan
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
