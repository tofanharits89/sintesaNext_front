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
import { Pencil, Trash2 } from "lucide-react";

export interface IkpaRow {
  id: number;
  thang: string;
  periode: string;
  nilaiikpa: string | number;
  username: string;
  createdAt: string;
}

interface FilterData {
  thang: string;
  periode: string;
  dept: string;
}

interface IkpaFormProps {
  show: boolean;
  handleClose: () => void;
  data: FilterData;
  isi: IkpaRow[];
  updateReload: () => void;
}

interface IkpaFormData {
  input1: string; // tahun
  input2: string; // nilaiikpa
  input3: string; // id (edit key)
  input4: string;
  input5: string;
  input6: string;
  input7: string;
  input8: string;
  input9: string;
  input10: string;
}

const emptyForm = (): IkpaFormData => ({
  input1: "",
  input2: "",
  input3: "",
  input4: "",
  input5: "",
  input6: "",
  input7: "",
  input8: "",
  input9: "",
  input10: "",
});

function filterItem<T extends Record<string, unknown>>(
  arr: T[],
  idx: number,
  key: keyof T,
): string {
  return arr[idx]?.[key] != null ? String(arr[idx]![key]) : "";
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

export default function IkpaForm({
  show,
  handleClose,
  data,
  isi,
  updateReload,
}: IkpaFormProps) {
  const [loading, setLoading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState("");
  const [formData, setFormData] = useState<IkpaFormData>(emptyForm);

  useEffect(() => {
    if (isi.length > 0 && isi[0]) {
      setUpdateInfo(
        `Diupdate terakhir oleh ${isi[0].username} tanggal ${formatDate(isi[0].createdAt)}`,
      );
    }
  }, [isi]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await directBackendClient.post("/kinerja/ikpa", { ...formData, data });
      setFormData(emptyForm());
      updateReload();
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHapus = async (id: number) => {
    if (!confirm("Anda yakin ingin menghapus data ini?")) return;
    try {
      await directBackendClient.delete(`/kinerja/ikpa/${id}`);
      updateReload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (id: number) => {
    const filtered = isi.filter((r) => r.id === id) as unknown as Record<
      string,
      unknown
    >[];
    setFormData({
      input1: filterItem(filtered, 0, "thang"),
      input2: filterItem(filtered, 0, "nilaiikpa"),
      input3: String(id),
      input4: filterItem(filtered, 1, "nilaiikpa"),
      input5: filterItem(filtered, 2, "thang"),
      input6: filterItem(filtered, 2, "nilaiikpa"),
      input7: filterItem(filtered, 3, "thang"),
      input8: filterItem(filtered, 3, "nilaiikpa"),
      input9: filterItem(filtered, 4, "thang"),
      input10: filterItem(filtered, 4, "nilaiikpa"),
    });
  };

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100";

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Rekam Data IKPA</DialogTitle>
        </DialogHeader>

        <div className="max-h-[82vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <form id="ikpa-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Tahun
                  </label>
                  <input
                    name="input1"
                    type="text"
                    value={formData.input1}
                    onChange={handleChange}
                    placeholder="Tahun IKPA"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Nilai IKPA
                  </label>
                  <input
                    name="input2"
                    type="number"
                    step="0.01"
                    value={formData.input2}
                    onChange={handleChange}
                    placeholder="Nilai IKPA"
                    className={inputCls}
                  />
                </div>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left dark:bg-gray-700">
                    <th className="border px-3 py-2">No</th>
                    <th className="border px-3 py-2">Tahun</th>
                    <th className="border px-3 py-2">Periode</th>
                    <th className="border px-3 py-2">Nilai</th>
                    <th className="border px-3 py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isi.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="even:bg-gray-50 dark:even:bg-gray-800"
                    >
                      <td className="border px-3 py-2">{idx + 1}</td>
                      <td className="border px-3 py-2">{item.thang}</td>
                      <td className="border px-3 py-2">{item.periode}</td>
                      <td className="border px-3 py-2">{item.nilaiikpa}</td>
                      <td className="space-x-2 border px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleHapus(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {updateInfo && (
            <p className="mt-3 text-xs italic text-gray-400">{updateInfo}</p>
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
            form="ikpa-form"
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
