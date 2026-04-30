"use client";

import { useState, useEffect } from "react";
import { directBackendClient } from "@/lib/api/httpClient";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  input1: string; // Tren Dukman / Teknis
  input2: string; // Tren Jenis Belanja
  input3: string; // Tren Belanja Bulanan
  input4: string; // Tren Sumber Dana
  input5: string; // Tren UP/TUP
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
    input1: "",
    input2: "",
    input3: "",
    input4: "",
    input5: "",
  });

  useEffect(() => {
    setFormData({
      input1: byTabel(isi, "tren_dukman"),
      input2: byTabel(isi, "tren_jenbel"),
      input3: byTabel(isi, "tren_bulanan"),
      input4: byTabel(isi, "tren_sdana"),
      input5: byTabel(isi, "tren_uptup"),
    });
    const first = isi[0];
    if (first) {
      setUpdateInfo(
        `Diupdate terakhir oleh ${first.username} tanggal ${formatDate(first.createdAt)}`,
      );
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
      await directBackendClient.post("/kinerja/tren", { ...formData, data });
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const textareaClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100";

  const fields: { name: keyof TrenForm; label: string }[] = [
    { name: "input1", label: "Tren Dukman / Teknis" },
    { name: "input2", label: "Tren Jenis Belanja" },
    { name: "input3", label: "Tren Belanja Bulanan" },
    { name: "input4", label: "Tren Sumber Dana" },
    { name: "input5", label: "Tren UP / TUP" },
  ];

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Rekam Data Tren</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[82vh] flex-col">
          <div className="space-y-4 overflow-y-auto px-6 py-5">
            {fields.map(({ name, label }) => (
              <div key={name}>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </label>
                <textarea
                  name={name}
                  rows={3}
                  placeholder="Masukkan teks di sini..."
                  value={formData[name]}
                  onChange={handleChange}
                  className={textareaClass}
                />
              </div>
            ))}

            {updateInfo && (
              <p className="text-xs italic text-gray-400">{updateInfo}</p>
            )}
          </div>

          <DialogFooter className="border-t bg-gray-50 px-6 py-4 dark:bg-gray-900">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
