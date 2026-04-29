"use client";

import { useState, useEffect } from "react";
import { directBackendClient } from "@/lib/api/httpClient";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
    <Sheet open={show} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-md overflow-y-auto bg-gray-50 dark:bg-gray-900"
      >
        <SheetHeader>
          <SheetTitle>Rekam Data Tren</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 px-4">
          {fields.map(({ name, label }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
          {updateInfo && (
            <p className="text-xs italic text-gray-400 mt-2">{updateInfo}</p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
