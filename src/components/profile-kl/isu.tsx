"use client";

import { useState, useEffect } from "react";
import { directBackendClient } from "@/lib/api/httpClient";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

const emptyForm = (): IsuForm => ({
  input1: "",
  input2: "",
  input3: "",
  input4: "",
});

export default function Isu({ show, handleClose, data, isi }: IsuProps) {
  const [loading, setLoading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState("");
  const [formData, setFormData] = useState<IsuForm>(() => ({
    input1: isi[0]?.isu ?? "",
    input2: isi[1]?.isu ?? "",
    input3: isi[2]?.isu ?? "",
    input4: isi[3]?.isu ?? "",
  }));

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

  const textareaClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100";

  const fields: { name: keyof IsuForm; label: string }[] = [
    { name: "input1", label: "Isu 1" },
    { name: "input2", label: "Isu 2" },
    { name: "input3", label: "Isu 3" },
    { name: "input4", label: "Isu 4" },
  ];

  return (
    <Sheet open={show} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-gray-50 dark:bg-gray-900"
      >
        <SheetHeader>
          <SheetTitle>Rekam Isu Spesifik</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 px-4">
          {fields.map(({ name, label }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
              </label>
              <textarea
                name={name}
                rows={4}
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
            <p className="text-xs italic text-gray-400">{updateInfo}</p>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
