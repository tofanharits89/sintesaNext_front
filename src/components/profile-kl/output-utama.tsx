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

export interface OutputRow {
  id_output: number;
  idedit: number;
  namaoutput: string;
  catatan: string;
  tahun: string;
  pagu: string;
  realisasi: string;
  persen: string;
  username: string;
  createdAt: string;
}

interface FilterData {
  thang: string;
  periode: string;
  dept: string;
}

interface OutputProps {
  show: boolean;
  handleClose: () => void;
  data: FilterData;
  isi: OutputRow[];
  updateReload: () => void;
}

interface OutputForm {
  namaoutput: string;
  catatan: string;
  tahun1: string;
  pagu1: string;
  realisasi1: string;
  persen1: string;
  tahun2: string;
  pagu2: string;
  realisasi2: string;
  persen2: string;
  tahun3: string;
  pagu3: string;
  realisasi3: string;
  persen3: string;
  id_output: number | "";
  idedit1: number | "";
  idedit2: number | "";
  idedit3: number | "";
}

const emptyForm = (): OutputForm => ({
  namaoutput: "",
  catatan: "",
  tahun1: "",
  pagu1: "",
  realisasi1: "",
  persen1: "",
  tahun2: "",
  pagu2: "",
  realisasi2: "",
  persen2: "",
  tahun3: "",
  pagu3: "",
  realisasi3: "",
  persen3: "",
  id_output: "",
  idedit1: "",
  idedit2: "",
  idedit3: "",
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

export default function OutputUtama({
  show,
  handleClose,
  data,
  isi,
  updateReload,
}: OutputProps) {
  const [loading, setLoading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState("");
  const [formData, setFormData] = useState<OutputForm>(emptyForm);

  useEffect(() => {
    if (isi.length > 0 && isi[0]) {
      setUpdateInfo(
        `Diupdate terakhir oleh ${isi[0].username} tanggal ${formatDate(isi[0].createdAt)}`,
      );
    }
  }, [isi]);

  const uniqueOutputs = isi.reduce<
    { id_output: number; namaoutput: string; catatan: string }[]
  >((acc, curr) => {
    if (!acc.find((x) => x.id_output === curr.id_output)) {
      acc.push({
        id_output: curr.id_output,
        namaoutput: curr.namaoutput,
        catatan: curr.catatan,
      });
    }
    return acc;
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await directBackendClient.post("/kinerja/output", { ...formData, data });
      setFormData(emptyForm());
      updateReload();
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHapus = async (id_output: number) => {
    if (!confirm("Anda yakin ingin menghapus data ini?")) return;
    try {
      await directBackendClient.delete(`/kinerja/output/${id_output}`);
      updateReload();
      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (id_output: number) => {
    const filtered = isi.filter(
      (r) => r.id_output === id_output,
    ) as unknown as Record<string, unknown>[];
    setFormData({
      namaoutput: filterItem(filtered, 0, "namaoutput"),
      catatan: filterItem(filtered, 0, "catatan"),
      tahun1: filterItem(filtered, 0, "tahun"),
      pagu1: filterItem(filtered, 0, "pagu"),
      realisasi1: filterItem(filtered, 0, "realisasi"),
      persen1: filterItem(filtered, 0, "persen"),
      tahun2: filterItem(filtered, 1, "tahun"),
      pagu2: filterItem(filtered, 1, "pagu"),
      realisasi2: filterItem(filtered, 1, "realisasi"),
      persen2: filterItem(filtered, 1, "persen"),
      tahun3: filterItem(filtered, 2, "tahun"),
      pagu3: filterItem(filtered, 2, "pagu"),
      realisasi3: filterItem(filtered, 2, "realisasi"),
      persen3: filterItem(filtered, 2, "persen"),
      id_output,
      idedit1: isi.filter((r) => r.id_output === id_output)[0]?.idedit ?? "",
      idedit2: isi.filter((r) => r.id_output === id_output)[1]?.idedit ?? "",
      idedit3: isi.filter((r) => r.id_output === id_output)[2]?.idedit ?? "",
    });
  };

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100";
  const textareaCls = inputCls + " resize-none";

  const yearGroups = [
    {
      y: "tahun1" as const,
      p: "pagu1" as const,
      r: "realisasi1" as const,
      pct: "persen1" as const,
    },
    {
      y: "tahun2" as const,
      p: "pagu2" as const,
      r: "realisasi2" as const,
      pct: "persen2" as const,
    },
    {
      y: "tahun3" as const,
      p: "pagu3" as const,
      r: "realisasi3" as const,
      pct: "persen3" as const,
    },
  ];

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-5xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Rekam Output Utama Belanja K/L</DialogTitle>
        </DialogHeader>

        <div className="max-h-[82vh] overflow-y-auto px-6 py-5">
          <form
            id="output-utama-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Output
                </label>
                <textarea
                  name="namaoutput"
                  rows={3}
                  value={formData.namaoutput}
                  onChange={handleChange}
                  placeholder="Masukkan teks di sini..."
                  className={textareaCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan
                </label>
                <textarea
                  name="catatan"
                  rows={3}
                  value={formData.catatan}
                  onChange={handleChange}
                  placeholder="Masukkan teks di sini..."
                  className={textareaCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {yearGroups.map(({ y, p, r, pct }) => (
                <div
                  key={y}
                  className="grid grid-cols-1 gap-3 rounded-lg border bg-white p-3 dark:bg-gray-950 sm:grid-cols-4 lg:contents"
                >
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Tahun
                    </label>
                    <input
                      name={y}
                      type="text"
                      value={formData[y]}
                      onChange={handleChange}
                      placeholder="Tahun"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Pagu
                    </label>
                    <input
                      name={p}
                      type="text"
                      maxLength={5}
                      value={formData[p]}
                      onChange={handleChange}
                      placeholder="Pagu"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Realisasi
                    </label>
                    <input
                      name={r}
                      type="text"
                      maxLength={5}
                      value={formData[r]}
                      onChange={handleChange}
                      placeholder="Realisasi"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Persen
                    </label>
                    <input
                      name={pct}
                      type="text"
                      maxLength={6}
                      value={formData[pct]}
                      onChange={handleChange}
                      placeholder="%"
                      className={inputCls}
                    />
                  </div>
                </div>
              ))}
            </div>
          </form>

          <hr className="my-5" />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-left dark:bg-gray-700">
                  <th className="border px-3 py-2">No</th>
                  <th className="border px-3 py-2">Nama Output</th>
                  <th className="border px-3 py-2">Keterangan</th>
                  <th className="border px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {uniqueOutputs.map((item, idx) => (
                  <tr
                    key={item.id_output}
                    className="even:bg-gray-50 dark:even:bg-gray-800"
                  >
                    <td className="border px-3 py-2">{idx + 1}</td>
                    <td className="border px-3 py-2">{item.namaoutput}</td>
                    <td className="border px-3 py-2">{item.catatan}</td>
                    <td className="space-x-2 border px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item.id_output)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHapus(item.id_output)}
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
            form="output-utama-form"
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
