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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export interface IsuRow {
  id: number;
  isu: string;
  username: string;
  createdAt: string;
}

interface FilterData {
  thang: string;
  periode: string;
  dept: string;
}

interface IsuProps {
  show: boolean;
  handleClose: () => void;
  data: FilterData;
  isi: IsuRow[];
}

interface IsuForm {
  input1: string;
  input2: string;
  input3: string;
  input4: string;
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

export default function Isu({ show, handleClose, data, isi }: IsuProps) {
  const [loading, setLoading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState("");
  const [formData, setFormData] = useState<IsuForm>({
    input1: "",
    input2: "",
    input3: "",
    input4: "",
  });

  useEffect(() => {
    setFormData({
      input1: isi[0]?.isu ?? "",
      input2: isi[1]?.isu ?? "",
      input3: isi[2]?.isu ?? "",
      input4: isi[3]?.isu ?? "",
    });
    if (isi.length > 0 && isi[0]) {
      setUpdateInfo(
        `Diupdate terakhir oleh ${isi[0].username} tanggal ${formatDate(isi[0].createdAt)}`,
      );
    } else {
      setUpdateInfo("");
    }
  }, [isi]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await directBackendClient.post("/kinerja/isu", { ...formData, data });
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fields: { name: keyof IsuForm; label: string }[] = [
    { name: "input1", label: "Isu 1" },
    { name: "input2", label: "Isu 2" },
    { name: "input3", label: "Isu 3" },
    { name: "input4", label: "Isu 4" },
  ];

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-7xl gap-0 overflow-hidden p-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle>Rekam Isu Spesifik</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[85vh] flex-col">
          <div className="space-y-6 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {fields.map(({ name, label }) => (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name} className="text-sm font-semibold">
                    {label}
                  </Label>
                  <Textarea
                    id={name}
                    name={name}
                    rows={6}
                    placeholder="Masukkan deskripsi isu spesifik di sini..."
                    value={formData[name]}
                    onChange={handleChange}
                    className="resize-none"
                  />
                </div>
              ))}
            </div>

            {updateInfo && (
              <p className="text-xs italic text-muted-foreground border-t pt-4">
                {updateInfo}
              </p>
            )}
          </div>

          <DialogFooter className="px-6 py-4 bg-white dark:bg-card">
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
              disabled={loading}
              className="px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
