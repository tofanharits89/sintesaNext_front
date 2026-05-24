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
import { X,  Save,  Pencil, Trash2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

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
    if (show && isi.length > 0 && isi[0]) {
      setUpdateInfo(
        `Diupdate terakhir oleh ${isi[0].username} tanggal ${formatDate(isi[0].createdAt)}`,
      );
    } else if (!show) {
      setFormData(emptyForm());
      setUpdateInfo("");
    }
  }, [isi, show]);

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

  const columns: ColumnDef<IkpaRow>[] = [
    {
      id: "no",
      header: () => <div className="text-center font-medium">No</div>,
      cell: ({ row }) => <div className="text-center">{row.index + 1}</div>,
    },
    {
      accessorKey: "thang",
      header: () => <div className="text-center font-medium">Tahun</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue("thang")}</div>,
    },
    {
      accessorKey: "periode",
      header: () => <div className="text-center font-medium">Periode</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue("periode")}</div>,
    },
    {
      accessorKey: "nilaiikpa",
      header: () => <div className="text-center font-medium">Nilai</div>,
      cell: ({ row }) => <div className="text-center font-semibold">{row.getValue("nilaiikpa")}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-center font-medium">Aksi</div>,
      cell: ({ row }) => (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => handleEdit(row.original.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleHapus(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent showCloseButton={false} className="max-w-7xl sm:max-w-7xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Rekam Data IKPA</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {/* Form Column */}
            <div className="md:col-span-1">
              <form id="ikpa-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4 rounded-xl border bg-muted/30 p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Input Data Baru / Edit
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">Tahun</Label>
                      <Input
                        name="input1"
                        value={formData.input1}
                        onChange={handleChange}
                        placeholder="Contoh: 2025"
                        className="bg-white dark:bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">Nilai IKPA</Label>
                      <Input
                        name="input2"
                        type="number"
                        step="0.01"
                        value={formData.input2}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="bg-white dark:bg-background"
                      />
                    </div>
                  </div>
                  {formData.input3 && (
                    <Button 
                      variant="ghost" 
                      type="button" 
                      onClick={() => setFormData(emptyForm())}
                      className="w-full text-xs mt-2"
                    >
                      Batal Edit
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Table Column */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Riwayat Data IKPA
              </h3>
              <DataTable 
                columns={columns} 
                data={isi} 
                initialPageSize={10}
                emptyMessage="Belum ada riwayat data IKPA."
              />
            </div>
          </div>

          {updateInfo && (
            <p className="mt-8 text-xs italic text-muted-foreground border-t pt-4">
              {updateInfo}
            </p>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="px-6"
          >
            <X className="h-4 w-4 mr-2" /> Batal
          </Button>
          <Button
            type="submit"
            form="ikpa-form"
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
                <Save className="h-4 w-4" /> Simpan
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
