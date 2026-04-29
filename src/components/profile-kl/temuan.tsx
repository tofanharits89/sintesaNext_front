"use client";

import { useState, useEffect } from "react";
import { directBackendClient } from "@/lib/api/httpClient";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Pencil, Trash2 } from "lucide-react";

export interface TemuanRow {
  id_temuan: number;
  id: number;
  idtemuan: number;
  iddetailtemuan: number;
  temuan: string;
  nilai: string;
  isu: string;
  username: string;
  createdAt: string;
}

interface FilterData {
  thang: string;
  periode: string;
  dept: string;
}

interface TemuanProps {
  show: boolean;
  handleClose: () => void;
  data: FilterData;
  isi: TemuanRow[];
  updateReload: () => void;
}

interface TemuanForm {
  temuan: string;
  nilai: string;
  input3: string;
  input4: string;
  input5: string;
  input6: string;
  idedit: number | "";
  idedit1: number | "";
  idedit2: number | "";
  idedit3: number | "";
  idedit4: number | "";
}

const emptyForm = (): TemuanForm => ({
  temuan: "",
  nilai: "",
  input3: "",
  input4: "",
  input5: "",
  input6: "",
  idedit: "",
  idedit1: "",
  idedit2: "",
  idedit3: "",
  idedit4: "",
});

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

function filterItem<T extends Record<string, unknown>>(
  arr: T[],
  idx: number,
  key: keyof T,
): string {
  return arr[idx]?.[key] != null ? String(arr[idx]![key]) : "";
}

export default function Temuan({
  show,
  handleClose,
  data,
  isi,
  updateReload,
}: TemuanProps) {
  const [loading, setLoading] = useState(false);
  const [updateInfo, setUpdateInfo] = useState("");
  const [formData, setFormData] = useState<TemuanForm>(emptyForm);

  useEffect(() => {
    if (isi.length > 0 && isi[0]) {
      setUpdateInfo(
        `Diupdate terakhir oleh ${isi[0].username} tanggal ${formatDate(isi[0].createdAt)}`,
      );
    }
  }, [isi]);

  // Unique temuan rows for the table
  const uniqueTemuan = isi.reduce<
    {
      temuan: string;
      nilai: string;
      id_temuan: number;
      iddetailtemuan: number;
    }[]
  >((acc, curr) => {
    if (!acc.find((x) => x.id_temuan === curr.id_temuan)) {
      acc.push({
        temuan: curr.temuan,
        nilai: curr.nilai,
        id_temuan: curr.id_temuan,
        iddetailtemuan: curr.iddetailtemuan,
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
      await directBackendClient.post("/kinerja/temuan", { ...formData, data });
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
      await directBackendClient.delete(`/kinerja/temuan/${id}`);
      updateReload();
      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (id_temuan: number) => {
    const filtered = isi.filter((r) => r.id_temuan === id_temuan);
    setFormData({
      temuan: filterItem(
        filtered as unknown as Record<string, unknown>[],
        0,
        "temuan",
      ),
      nilai: filterItem(
        filtered as unknown as Record<string, unknown>[],
        0,
        "nilai",
      ),
      input3: filterItem(
        filtered as unknown as Record<string, unknown>[],
        0,
        "isu",
      ),
      input4: filterItem(
        filtered as unknown as Record<string, unknown>[],
        1,
        "isu",
      ),
      input5: filterItem(
        filtered as unknown as Record<string, unknown>[],
        2,
        "isu",
      ),
      input6: filterItem(
        filtered as unknown as Record<string, unknown>[],
        3,
        "isu",
      ),
      idedit: id_temuan,
      idedit1: filtered[0]?.iddetailtemuan ?? "",
      idedit2: filtered[1]?.iddetailtemuan ?? "",
      idedit3: filtered[2]?.iddetailtemuan ?? "",
      idedit4: filtered[3]?.iddetailtemuan ?? "",
    });
  };

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100";
  const textareaCls = inputCls + " resize-none";

  return (
    <Sheet open={show} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="top"
        className="h-auto max-h-[90vh] overflow-y-auto bg-gray-50 dark:bg-gray-900"
      >
        <SheetHeader>
          <SheetTitle>Rekam Data Temuan BPK</SheetTitle>
        </SheetHeader>
        <div className="mt-4 px-4">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Temuan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temuan BPK
                </label>
                <textarea
                  name="temuan"
                  rows={4}
                  placeholder="Masukkan teks di sini..."
                  value={formData.temuan}
                  onChange={handleChange}
                  className={textareaCls}
                />
              </div>
              {/* Nilai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nilai
                </label>
                <textarea
                  name="nilai"
                  rows={4}
                  placeholder="Masukkan teks di sini..."
                  value={formData.nilai}
                  onChange={handleChange}
                  className={textareaCls}
                />
              </div>
              {/* Tindak Lanjut */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tindak Lanjut
                </label>
                {(["input3", "input4", "input5", "input6"] as const).map(
                  (n) => (
                    <input
                      key={n}
                      name={n}
                      type="text"
                      placeholder="Masukkan teks di sini..."
                      value={formData[n]}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  ),
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </form>

          <hr className="my-4" />

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                  <th className="border px-3 py-2">No</th>
                  <th className="border px-3 py-2">Temuan BPK</th>
                  <th className="border px-3 py-2">Nilai</th>
                  <th className="border px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {uniqueTemuan.map((item, idx) => (
                  <tr
                    key={item.id_temuan}
                    className="even:bg-gray-50 dark:even:bg-gray-800"
                  >
                    <td className="border px-3 py-2">{idx + 1}</td>
                    <td className="border px-3 py-2">{item.temuan}</td>
                    <td className="border px-3 py-2">{item.nilai}</td>
                    <td className="border px-3 py-2 space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item.id_temuan)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHapus(item.id_temuan)}
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
      </SheetContent>
    </Sheet>
  );
}
